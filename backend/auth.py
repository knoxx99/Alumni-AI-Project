"""
auth.py
Authentication routes: Register, Login, Logout, Get current user.
Uses bcrypt password hashing + JWT tokens for session management.
"""

from flask import Blueprint, request, jsonify
import mysql.connector
from mysql.connector import Error
import hashlib
import hmac
import os
import json
import base64
import time
from db import get_connection

# Blueprint — groups all auth routes under /api/auth
auth_bp = Blueprint("auth", __name__)

# Secret key for signing tokens (set in .env)
SECRET_KEY = os.getenv("SECRET_KEY", "alumni_ai_secret_key_2024")


# ─────────────────────────────────────────────
# Simple Token Helpers (no extra library needed)
# ─────────────────────────────────────────────

def create_token(user_id: int, email: str, role: str) -> str:
    """Create a simple signed token with user info."""
    payload = {
        "user_id": user_id,
        "email":   email,
        "role":    role,
        "exp":     int(time.time()) + (24 * 60 * 60)  # expires in 24 hours
    }
    payload_json  = json.dumps(payload, separators=(",", ":"))
    payload_b64   = base64.urlsafe_b64encode(payload_json.encode()).decode()
    signature     = hmac.new(SECRET_KEY.encode(), payload_b64.encode(), hashlib.sha256).hexdigest()
    return f"{payload_b64}.{signature}"


def verify_token(token: str) -> dict | None:
    """Verify token signature and expiry. Returns payload dict or None."""
    try:
        payload_b64, signature = token.rsplit(".", 1)
        expected_sig = hmac.new(SECRET_KEY.encode(), payload_b64.encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(signature, expected_sig):
            return None
        payload = json.loads(base64.urlsafe_b64decode(payload_b64 + "==").decode())
        if payload.get("exp", 0) < int(time.time()):
            return None   # token expired
        return payload
    except Exception:
        return None


def hash_password(password: str) -> str:
    """Hash password using SHA-256 with salt."""
    salt = os.urandom(32)
    key  = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 200000)
    return base64.b64encode(salt + key).decode()


def check_password(password: str, hashed: str) -> bool:
    """Verify password against stored hash."""
    try:
        decoded = base64.b64decode(hashed.encode())
        salt    = decoded[:32]
        stored  = decoded[32:]
        key     = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 200000)
        return hmac.compare_digest(key, stored)
    except Exception:
        return False


def get_current_user(request) -> dict | None:
    """Extract and verify token from Authorization header."""
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None
    token = auth_header.split(" ", 1)[1]
    return verify_token(token)


# ─────────────────────────────────────────────
# Routes
# ─────────────────────────────────────────────

@auth_bp.route("/api/auth/register", methods=["POST"])
def register():
    """
    POST /api/auth/register
    Body: { full_name, email, password, role }
    """
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "No data provided."}), 400

    full_name = data.get("full_name", "").strip()
    email     = data.get("email", "").strip().lower()
    password  = data.get("password", "").strip()
    role      = data.get("role", "student").strip().lower()

    # ── Validation ──
    if not full_name:
        return jsonify({"error": "Full name is required."}), 400
    if not email or "@" not in email:
        return jsonify({"error": "Valid email is required."}), 400
    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters."}), 400
    if role not in ("admin", "student"):
        role = "student"

    # ── Check if email already exists ──
    conn = get_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
        if cursor.fetchone():
            return jsonify({"error": "Email already registered."}), 409

        # ── Insert new user ──
        hashed_pw = hash_password(password)
        cursor.execute(
            "INSERT INTO users (full_name, email, password, role) VALUES (%s, %s, %s, %s)",
            (full_name, email, hashed_pw, role)
        )
        conn.commit()
        new_id = cursor.lastrowid

        # ── Return token ──
        token = create_token(new_id, email, role)
        return jsonify({
            "success": True,
            "message": "Registration successful!",
            "token":   token,
            "user": {
                "id":        new_id,
                "full_name": full_name,
                "email":     email,
                "role":      role
            }
        }), 201

    except Error as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()


@auth_bp.route("/api/auth/login", methods=["POST"])
def login():
    """
    POST /api/auth/login
    Body: { email, password }
    """
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "No data provided."}), 400

    email    = data.get("email", "").strip().lower()
    password = data.get("password", "").strip()

    if not email or not password:
        return jsonify({"error": "Email and password are required."}), 400

    conn = get_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            "SELECT id, full_name, email, password, role FROM users WHERE email = %s",
            (email,)
        )
        user = cursor.fetchone()

        if not user or not check_password(password, user["password"]):
            return jsonify({"error": "Invalid email or password."}), 401

        token = create_token(user["id"], user["email"], user["role"])
        return jsonify({
            "success": True,
            "message": f"Welcome back, {user['full_name']}!",
            "token":   token,
            "user": {
                "id":        user["id"],
                "full_name": user["full_name"],
                "email":     user["email"],
                "role":      user["role"]
            }
        }), 200

    except Error as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()


@auth_bp.route("/api/auth/me", methods=["GET"])
def get_me():
    """
    GET /api/auth/me
    Returns current logged-in user info from token.
    """
    user = get_current_user(request)
    if not user:
        return jsonify({"error": "Unauthorized. Please log in."}), 401

    conn = get_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            "SELECT id, full_name, email, role, created_at FROM users WHERE id = %s",
            (user["user_id"],)
        )
        row = cursor.fetchone()
        if not row:
            return jsonify({"error": "User not found."}), 404
        if row.get("created_at"):
            row["created_at"] = str(row["created_at"])
        return jsonify({"success": True, "user": row}), 200
    except Error as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()
