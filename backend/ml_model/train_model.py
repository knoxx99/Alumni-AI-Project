"""
train_model.py
ML Training Script - Alumni Category Classifier
Uses TF-IDF + Cross-Validation + Model Comparison (Naive Bayes vs Logistic Regression)
"""

import pandas as pd
import pickle
import os
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.model_selection import cross_val_score, StratifiedKFold
from sklearn.metrics import classification_report, confusion_matrix
from sklearn.preprocessing import LabelEncoder
import numpy as np

# ─────────────────────────────────────────────
# 1. Load Dataset
# ─────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_PATH = os.path.join(BASE_DIR, "dataset.csv")

df = pd.read_csv(DATASET_PATH)
print(f"✅ Dataset loaded: {len(df)} records")
print(f"📊 Category distribution:\n{df['category'].value_counts()}\n")

X = df["text"].astype(str)
y = df["category"]

# ─────────────────────────────────────────────
# 2. Define Pipelines
# ─────────────────────────────────────────────
vectorizer = TfidfVectorizer(
    ngram_range=(1, 2),       # unigrams + bigrams
    max_features=5000,
    sublinear_tf=True,        # log normalization
    stop_words='english'
)

nb_pipeline = Pipeline([
    ("tfidf", TfidfVectorizer(ngram_range=(1, 2), max_features=5000,
                               sublinear_tf=True, stop_words='english')),
    ("clf", MultinomialNB(alpha=0.5))
])

lr_pipeline = Pipeline([
    ("tfidf", TfidfVectorizer(ngram_range=(1, 2), max_features=5000,
                               sublinear_tf=True, stop_words='english')),
    ("clf", LogisticRegression(max_iter=1000, C=1.0, solver='lbfgs',
                                multi_class='multinomial', random_state=42))
])

# ─────────────────────────────────────────────
# 3. Cross-Validation Comparison
# ─────────────────────────────────────────────
cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

print("🔍 Running 5-Fold Cross-Validation...\n")

nb_scores = cross_val_score(nb_pipeline, X, y, cv=cv, scoring='accuracy')
lr_scores = cross_val_score(lr_pipeline, X, y, cv=cv, scoring='accuracy')

print(f"📌 Multinomial Naive Bayes:")
print(f"   Fold Accuracies : {[round(s, 4) for s in nb_scores]}")
print(f"   Mean Accuracy   : {nb_scores.mean():.4f}")
print(f"   Std Dev         : {nb_scores.std():.4f}\n")

print(f"📌 Logistic Regression:")
print(f"   Fold Accuracies : {[round(s, 4) for s in lr_scores]}")
print(f"   Mean Accuracy   : {lr_scores.mean():.4f}")
print(f"   Std Dev         : {lr_scores.std():.4f}\n")

# ─────────────────────────────────────────────
# 4. Select Best Model
# ─────────────────────────────────────────────
if lr_scores.mean() >= nb_scores.mean():
    best_pipeline = lr_pipeline
    best_model_name = "Logistic Regression"
else:
    best_pipeline = nb_pipeline
    best_model_name = "Multinomial Naive Bayes"

print(f"🏆 Best Model Selected: {best_model_name}\n")

# ─────────────────────────────────────────────
# 5. Train Best Model on Full Data
# ─────────────────────────────────────────────
best_pipeline.fit(X, y)
print(f"✅ Model trained on full dataset.\n")

# Detailed classification report using cross-validation predictions
from sklearn.model_selection import cross_val_predict
y_pred = cross_val_predict(best_pipeline, X, y, cv=cv)
print("📋 Classification Report (Cross-Val Predictions):")
print(classification_report(y, y_pred))

# ─────────────────────────────────────────────
# 6. Save Model and Vectorizer Separately
# ─────────────────────────────────────────────
# Save full pipeline as model
MODEL_PATH = os.path.join(BASE_DIR, "model.pkl")
with open(MODEL_PATH, "wb") as f:
    pickle.dump(best_pipeline, f)

# Save standalone vectorizer (fitted on full data)
vectorizer.fit(X)
VECTORIZER_PATH = os.path.join(BASE_DIR, "vectorizer.pkl")
with open(VECTORIZER_PATH, "wb") as f:
    pickle.dump(vectorizer, f)

print(f"💾 model.pkl saved      → {MODEL_PATH}")
print(f"💾 vectorizer.pkl saved → {VECTORIZER_PATH}")
print(f"\n🎉 Training complete! Best model: {best_model_name} | CV Accuracy: {max(nb_scores.mean(), lr_scores.mean()):.4f}")
