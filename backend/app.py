"""
app.py
Main Flask API for the Alumni AI Information Extraction and Profiling System.
"""

import os
import pickle
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

from alumni_extractor_v1 import extract_alumni_info
from db import insert_alumni, fetch_all_alumni, delete_alumni

load_dotenv()

app = Flask(__name__)

# ── CORS: allow React dev server ──────────────────────────────────────────────
CORS(app, resources={r"/api/*": {"origins": "*"}})

# ── Load ML Model (Pipeline: TF-IDF + Classifier) ────────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "ml_model", "model.pkl")

try:
    with open(MODEL_PATH, "rb") as f:
        model_pipeline = pickle.load(f)
    print("✅ ML model loaded successfully.")
except FileNotFoundError:
    model_pipeline = None
    print("⚠️  WARNING: model.pkl not found. Run train_model.py first.")


# ─────────────────────────────────────────────────────────────────────────────
# HELPER
# ─────────────────────────────────────────────────────────────────────────────

def predict_category(text: str) -> str:
    """Predict alumni category from text using the loaded pipeline."""
    if model_pipeline is None:
        return "Unknown"
    prediction = model_pipeline.predict([text])
    return prediction[0]


def predict_probabilities(text: str) -> dict:
    """Return prediction probabilities for all categories."""
    if model_pipeline is None or not hasattr(model_pipeline, 'predict_proba'):
        return {}
    try:
        proba = model_pipeline.predict_proba([text])[0]
        classes = model_pipeline.classes_
        return {cls: round(float(p), 4) for cls, p in zip(classes, proba)}
    except Exception:
        return {}


# ─────────────────────────────────────────────────────────────────────────────
# ROUTES
# ─────────────────────────────────────────────────────────────────────────────

@app.route("/", methods=["GET"])
def health_check():
    return jsonify({
        "status": "running",
        "message": "Alumni AI API is live 🚀",
        "model_loaded": model_pipeline is not None
    })


@app.route("/api/predict", methods=["POST"])
def predict():
    """
    POST /api/predict
    Body: { "text": "<alumni description>" }
    Returns extracted info + predicted category + saves to DB.
    """
    data = request.get_json(silent=True)
    if not data or "text" not in data:
        return jsonify({"error": "Missing 'text' field in request body."}), 400

    text = data["text"].strip()
    if len(text) < 10:
        return jsonify({"error": "Text too short. Please provide a meaningful description."}), 400

    # Step 1: Extract structured info from text
    extracted = extract_alumni_info(text)

    # Step 2: Predict category using ML model
    category = predict_category(text)
    probabilities = predict_probabilities(text)

    # Step 3: Merge category into extracted data
    extracted["category"] = category

    # Step 4: Save to MySQL
    try:
        new_id = insert_alumni(extracted)
        extracted["id"] = new_id
        db_saved = True
        db_error = None
    except Exception as e:
        db_saved = False
        db_error = str(e)
        extracted["id"] = None

    return jsonify({
        "success": True,
        "data": extracted,
        "probabilities": probabilities,
        "db_saved": db_saved,
        "db_error": db_error
    }), 200


@app.route("/api/alumni", methods=["GET"])
def get_all_alumni():
    """
    GET /api/alumni
    Returns all alumni records from DB (latest first).
    Supports ?limit=N query param.
    """
    limit = request.args.get("limit", 100, type=int)
    try:
        records = fetch_all_alumni(limit=limit)
        return jsonify({"success": True, "count": len(records), "data": records}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/alumni/<int:alumni_id>", methods=["DELETE"])
def delete_alumni_record(alumni_id):
    """
    DELETE /api/alumni/<id>
    Removes an alumni record by ID.
    """
    try:
        deleted = delete_alumni(alumni_id)
        if deleted:
            return jsonify({"success": True, "message": f"Alumni #{alumni_id} deleted."}), 200
        else:
            return jsonify({"success": False, "message": "Record not found."}), 404
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# ─────────────────────────────────────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    debug = os.getenv("FLASK_DEBUG", "true").lower() == "true"
    print(f"🚀 Starting Alumni AI Flask API on port {port}...")
    app.run(host="0.0.0.0", port=port, debug=debug)
