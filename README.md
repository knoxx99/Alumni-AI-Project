# 🎓 Alumni AI — Information Extraction & Profiling System

A full-stack AI-powered system that extracts structured alumni data from unstructured text, classifies them using a trained ML model (TF-IDF + cross-validated Logistic Regression / Naive Bayes), stores records in MySQL, and presents everything through a polished dark-mode React UI.

---

## 📁 Project Structure

```
ALUMNI_AI_PROJECT/
├── backend/
│   ├── app.py                    # Flask API (main entry point)
│   ├── db.py                     # MySQL connection + CRUD
│   ├── alumni_extractor_v1.py    # Regex-based info extractor
│   ├── .env.example              # Environment variable template
│   ├── requirements.txt
│   └── ml_model/
│       ├── train_model.py        # Training with cross-validation
│       ├── dataset.csv           # 60+ labeled training samples
│       ├── model.pkl             # Saved pipeline (auto-generated)
│       └── vectorizer.pkl        # Saved vectorizer (auto-generated)
│
├── frontend/
│   └── react-app/
│       └── src/
│           └── App.js            # Complete React UI
│
├── setup.sql                     # MySQL schema creation script
└── README.md
```

---

## ⚙️ Tech Stack

| Layer      | Technology                                  |
|------------|---------------------------------------------|
| Backend    | Python 3.8+, Flask 3.x, flask-cors          |
| ML         | Scikit-learn (TF-IDF + LR / Naive Bayes)    |
| Database   | MySQL 8.x, mysql-connector-python           |
| Frontend   | React.js 18, Space Grotesk font             |
| Other      | pandas, pickle, python-dotenv, regex        |

---

## 🚀 Setup Instructions

### Step 1 — Clone / place the project

```bash
cd ALUMNI_AI_PROJECT
```

### Step 2 — MySQL Setup

Open MySQL and run:

```bash
mysql -u root -p < setup.sql
```

This creates the `alumni_ai` database and the `alumni` table.

### Step 3 — Backend Setup

```bash
cd backend

# Create virtual environment (recommended)
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy and configure .env
cp .env.example .env
# Edit .env — set your DB_PASSWORD
```

### Step 4 — Train the ML Model

```bash
# From the backend/ directory
python ml_model/train_model.py
```

Expected output:
```
✅ Dataset loaded: 60 records
🔍 Running 5-Fold Cross-Validation...
🏆 Best Model Selected: Logistic Regression
💾 model.pkl saved
💾 vectorizer.pkl saved
🎉 Training complete!
```

### Step 5 — Start Flask API

```bash
python app.py
# API running at http://localhost:5000
```

### Step 6 — Frontend Setup

```bash
cd frontend/react-app

# Install dependencies
npm install

# Start dev server
npm start
# Opens at http://localhost:3000
```

---

## 🔌 API Endpoints

| Method | Endpoint              | Description                     |
|--------|-----------------------|---------------------------------|
| GET    | `/`                   | Health check                    |
| POST   | `/api/predict`        | Extract + classify + save alumni |
| GET    | `/api/alumni`         | Fetch all alumni records         |
| DELETE | `/api/alumni/<id>`    | Delete a record by ID            |

### POST /api/predict

**Request:**
```json
{ "text": "Rahul Sharma is a Software Engineer at Google skilled in Python and AI" }
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Rahul Sharma",
    "email": "",
    "phone": "",
    "company": "Google",
    "job_role": "Software Engineer",
    "skills": "Python, Ai",
    "graduation_year": null,
    "category": "Tech"
  },
  "probabilities": {
    "Tech": 0.923,
    "Research": 0.031,
    "Management": 0.018,
    ...
  },
  "db_saved": true
}
```

---

## 🤖 ML Model Details

- **Algorithm:** Logistic Regression (or Naive Bayes — auto-selected by CV score)
- **Features:** TF-IDF with bigrams, 5000 max features, sublinear TF
- **Validation:** 5-fold Stratified Cross-Validation
- **Categories:** Tech · Finance · Education · Management · Research · Entrepreneur
- **Dataset:** 60 labeled samples (10 per category)

---

## 🎨 Frontend Features

- ⚡ **Predict Tab** — textarea input, example chips, live validation, result display
- 📈 **Confidence Bars** — probability scores for all 6 categories
- 🗂️ **History Tab** — sortable table with search + category filter + delete
- 📊 **Stats Row** — live count per category
- ⧉ **Copy JSON** — one-click copy of extracted result
- 🌙 **Dark / Light Mode** toggle
- 📱 Responsive layout

---

## 🔮 Future Enhancements

- PDF resume upload and parsing
- Named Entity Recognition (spaCy / BERT)
- Skill taxonomy and gap analysis
- Alumni recommendation engine
- Dashboard with charts (Chart.js / Recharts)
- Authentication with JWT
- Export to CSV / Excel