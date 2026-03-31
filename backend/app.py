# app.py
# Flask API for Alumni Information Extraction System

import os
import pickle
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

from alumni_extractor_v1 import extract_alumni_info
from db import insert_alumni, fetch_all_alumni, delete_alumni

# load environment variables
load_dotenv()

app = Flask(__name__)

# allow frontend (React or others) to access API
CORS(app, resources={r"/api/*": {"origins": "*"}})

# -------------------------------
# Load ML Model
# -------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_FILE = os.path.join(BASE_DIR, "ml_model", "model.pkl")

model = None

try:
    with open(MODEL_FILE, "rb") as file:
        model = pickle.load(file)
    print("Model loaded successfully.")
except FileNotFoundError:
    print("Model file not found. Please run training script first.")


# -------------------------------
# Helper Functions
# -------------------------------

def get_category(text):
    # predict category using trained model
    if model is None:
        return "Unknown"

    result = model.predict([text])
    return result[0]


def get_probabilities(text):
    # return probability of each class
    if model is None or not hasattr(model, "predict_proba"):
        return {}

    try:
        probs = model.predict_proba([text])[0]
        labels = model.classes_

        output = {}
        for label, prob in zip(labels, probs):
            output[label] = round(float(prob), 4)

        return output

    except Exception:
        return {}


# -------------------------------
# Routes
# -------------------------------

@app.route("/", methods=["GET"])
def home():
    # simple API check
    return jsonify({
        "status": "running",
        "message": "API is working",
        "model_loaded": model is not None
    })


@app.route("/api/predict", methods=["POST"])
def predict():
    data = request.get_json(silent=True)

    if not data or "text" not in data:
        return jsonify({"error": "Text field is required"}), 400

    text = data["text"].strip()

    if len(text) < 10:
        return jsonify({"error": "Text is too short"}), 400

    # extract details from text
    extracted_data = extract_alumni_info(text)

    # predict category
    category = get_category(text)
    probabilities = get_probabilities(text)

    extracted_data["category"] = category

    # save to database
    try:
        record_id = insert_alumni(extracted_data)
        extracted_data["id"] = record_id
        db_status = True
        db_error = None
    except Exception as err:
        extracted_data["id"] = None
        db_status = False
        db_error = str(err)

    return jsonify({
        "success": True,
        "data": extracted_data,
        "probabilities": probabilities,
        "db_saved": db_status,
        "db_error": db_error
    })


@app.route("/api/alumni", methods=["GET"])
def get_alumni():
    # get all records (with optional limit)
    limit = request.args.get("limit", 100, type=int)

    try:
        records = fetch_all_alumni(limit=limit)

        return jsonify({
            "success": True,
            "count": len(records),
            "data": records
        })

    except Exception as err:
        return jsonify({
            "success": False,
            "error": str(err)
        }), 500


@app.route("/api/alumni/<int:alumni_id>", methods=["DELETE"])
def delete_alumni_by_id(alumni_id):
    try:
        is_deleted = delete_alumni(alumni_id)

        if is_deleted:
            return jsonify({
                "success": True,
                "message": f"Record {alumni_id} deleted"
            })

        return jsonify({
            "success": False,
            "message": "Record not found"
        }), 404

    except Exception as err:
        return jsonify({
            "success": False,
            "error": str(err)
        }), 500


# -------------------------------
# Run Server
# -------------------------------

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    debug_mode = os.getenv("FLASK_DEBUG", "true").lower() == "true"

    print(f"Server running on port {port}...")
    app.run(host="0.0.0.0", port=port, debug=debug_mode)