"""
db.py
MySQL database connection and alumni CRUD operations.
"""

import mysql.connector
from mysql.connector import Error
import os
from dotenv import load_dotenv

load_dotenv()

# DB Config — set these in your .env file
DB_CONFIG = {
    "host":     os.getenv("DB_HOST", "localhost"),
    "user":     os.getenv("DB_USER", "root"),
    "password": os.getenv("DB_PASSWORD", "Root@1234"),
    "database": os.getenv("DB_NAME", "alumni_ai"),
    "port":     int(os.getenv("DB_PORT", 3306))
}


def get_connection():
    """Create and return a MySQL connection."""
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        return conn
    except Error as e:
        print(f"[DB ERROR] Could not connect: {e}")
        raise


def insert_alumni(data: dict) -> int:
    """
    Insert a single alumni record into the database.
    Returns the new row's id.
    """
    sql = """
        INSERT INTO alumni
            (name, email, phone, company, job_role, skills, graduation_year, category)
        VALUES
            (%s, %s, %s, %s, %s, %s, %s, %s)
    """
    values = (
        data.get("name", ""),
        data.get("email", ""),
        data.get("phone", ""),
        data.get("company", ""),
        data.get("job_role", ""),
        data.get("skills", ""),
        data.get("graduation_year"),   # can be None → NULL in DB
        data.get("category", "")
    )
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(sql, values)
        conn.commit()
        return cursor.lastrowid
    except Error as e:
        conn.rollback()
        print(f"[DB ERROR] Insert failed: {e}")
        raise
    finally:
        cursor.close()
        conn.close()


def fetch_all_alumni(limit: int = 100) -> list:
    """
    Retrieve all alumni records (latest first).
    Returns a list of dicts.
    """
    sql = """
        SELECT id, name, email, phone, company, job_role,
               skills, graduation_year, category, created_at
        FROM alumni
        ORDER BY created_at DESC
        LIMIT %s
    """
    conn = get_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute(sql, (limit,))
        rows = cursor.fetchall()
        # Convert datetime to string for JSON serialization
        for row in rows:
            if row.get("created_at"):
                row["created_at"] = str(row["created_at"])
        return rows
    except Error as e:
        print(f"[DB ERROR] Fetch failed: {e}")
        raise
    finally:
        cursor.close()
        conn.close()


def delete_alumni(alumni_id: int) -> bool:
    """Delete an alumni record by id. Returns True on success."""
    sql = "DELETE FROM alumni WHERE id = %s"
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(sql, (alumni_id,))
        conn.commit()
        return cursor.rowcount > 0
    except Error as e:
        conn.rollback()
        print(f"[DB ERROR] Delete failed: {e}")
        raise
    finally:
        cursor.close()
        conn.close()
