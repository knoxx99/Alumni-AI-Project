"""
app.py - Main Flask API with Authentication
"""
import os
import pickle
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from alumni_extractor_v1 import extract_alumni_info
from db import insert_alumni, fetch_all_alumni, delete_alumni
from auth import auth_bp, get_current_user

load_dotenv()
app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})
app.register_blueprint(auth_bp)

BASE_DIR   = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "ml_model", "model.pkl")

try:
    with open(MODEL_PATH, "rb") as f:
        model_pipeline = pickle.load(f)
    print("✅ ML model loaded successfully.")
except FileNotFoundError:
    model_pipeline = None
    print("⚠️  model.pkl not found. Run train_model.py first.")

def predict_category(text):
    if model_pipeline is None: return "Unknown"
    return model_pipeline.predict([text])[0]

def predict_probabilities(text):
    if model_pipeline is None or not hasattr(model_pipeline, "predict_proba"): return {}
    try:
        proba = model_pipeline.predict_proba([text])[0]
        return {cls: round(float(p), 4) for cls, p in zip(model_pipeline.classes_, proba)}
    except: return {}

def require_auth(roles=None):
    user = get_current_user(request)
    if not user:
        return None, (jsonify({"error": "Unauthorized. Please log in."}), 401)
    if roles and user.get("role") not in roles:
        return None, (jsonify({"error": "Access denied. Insufficient permissions."}), 403)
    return user, None

@app.route("/", methods=["GET"])
def health_check():
    return jsonify({"status": "running", "message": "Alumni AI API is live 🚀", "model_loaded": model_pipeline is not None})

@app.route("/api/predict", methods=["POST"])
def predict():
    user, err = require_auth(roles=["admin"])
    if err: return err
    data = request.get_json(silent=True)
    if not data or "text" not in data:
        return jsonify({"error": "Missing 'text' field."}), 400
    text = data["text"].strip()
    if len(text) < 10:
        return jsonify({"error": "Text too short."}), 400
    extracted = extract_alumni_info(text)
    extracted["category"] = predict_category(text)
    probabilities = predict_probabilities(text)
    try:
        new_id = insert_alumni(extracted)
        extracted["id"] = new_id
        db_saved = True; db_error = None
    except Exception as e:
        db_saved = False; db_error = str(e); extracted["id"] = None
    return jsonify({"success": True, "data": extracted, "probabilities": probabilities, "db_saved": db_saved, "db_error": db_error}), 200

@app.route("/api/alumni", methods=["GET"])
def get_all_alumni():
    user, err = require_auth(roles=["admin", "student"])
    if err: return err
    limit = request.args.get("limit", 100, type=int)
    try:
        records = fetch_all_alumni(limit=limit)
        return jsonify({"success": True, "count": len(records), "data": records}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/api/alumni/<int:alumni_id>", methods=["DELETE"])
def delete_alumni_record(alumni_id):
    user, err = require_auth(roles=["admin"])
    if err: return err
    try:
        deleted = delete_alumni(alumni_id)
        if deleted: return jsonify({"success": True, "message": f"Alumni #{alumni_id} deleted."}), 200
        else: return jsonify({"success": False, "message": "Record not found."}), 404
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    print(f"🚀 Starting Alumni AI Flask API on port {port}...")
    app.run(host="0.0.0.0", port=port, debug=True)
