import { useState, useEffect, useCallback } from "react";
import "./App.css";

const API_BASE = "http://localhost:5000";

const CATEGORY_COLORS = {
  Tech:         { bg: "#0ea5e9", light: "#e0f2fe" },
  Finance:      { bg: "#10b981", light: "#d1fae5" },
  Education:    { bg: "#f59e0b", light: "#fef3c7" },
  Management:   { bg: "#8b5cf6", light: "#ede9fe" },
  Research:     { bg: "#ec4899", light: "#fce7f3" },
  Entrepreneur: { bg: "#f97316", light: "#ffedd5" },
  Unknown:      { bg: "#6b7280", light: "#f3f4f6" },
};

const CATEGORY_ICONS = {
  Tech: "⚙️", Finance: "💹", Education: "🎓",
  Management: "📊", Research: "🔬", Entrepreneur: "🚀", Unknown: "❓"
};

const EXAMPLE_TEXTS = [
  "Rahul Sharma is a Software Engineer at Google skilled in Python, Machine Learning, and TensorFlow. He graduated in the batch of 2020. Email: rahul.sharma@gmail.com",
  "Priya Patel worked as a Financial Analyst at Goldman Sachs with expertise in portfolio management, accounting, and SQL. Batch of 2018.",
  "Dr. Ananya Singh is a Professor at IIT Delhi teaching Data Structures and Algorithms. She holds a PhD and graduated in 2015.",
  "Arjun Mehta is the Founder of a Fintech startup providing AI-powered microloans. Previously worked at Flipkart. Batch 2019.",
];

// ─── Toast Component ──────────────────────────────────────────────────────────
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const icon = type === "success" ? "✓" : type === "error" ? "✕" : "ℹ";
  return (
    <div className={`toast ${type}`}>
      <span>{icon}</span> {message}
    </div>
  );
}

// ─── CategoryBadge Component ──────────────────────────────────────────────────
function CategoryBadge({ category }) {
  const col = CATEGORY_COLORS[category] || CATEGORY_COLORS.Unknown;
  return (
    <span className="cat-badge" style={{ background: col.light, color: col.bg }}>
      {CATEGORY_ICONS[category]} {category}
    </span>
  );
}

// ─── InfoItem Component ───────────────────────────────────────────────────────
function InfoItem({ icon, label, value }) {
  const isEmpty = !value || value === "" || value === null;
  return (
    <div className="info-item">
      <div className="info-item-label">{icon} {label}</div>
      {label === "Skills" && !isEmpty ? (
        <div className="skills-wrap">
          {String(value).split(",").map(s => s.trim()).filter(Boolean).map(s => (
            <span key={s} className="skill-tag">{s}</span>
          ))}
        </div>
      ) : (
        <div className={`info-item-value ${isEmpty ? "empty" : ""}`}>
          {isEmpty ? "Not detected" : String(value)}
        </div>
      )}
    </div>
  );
}

// ─── ProbabilityBars Component ────────────────────────────────────────────────
function ProbabilityBars({ probs }) {
  if (!probs || Object.keys(probs).length === 0) return null;
  const sorted = Object.entries(probs).sort((a, b) => b[1] - a[1]);
  return (
    <div className="card">
      <div className="card-title" style={{ marginBottom: 14 }}>📈 Confidence Scores</div>
      <div className="prob-grid">
        {sorted.map(([cat, p]) => {
          const col = CATEGORY_COLORS[cat] || CATEGORY_COLORS.Unknown;
          return (
            <div key={cat} className="prob-row">
              <span className="prob-label">{CATEGORY_ICONS[cat]} {cat}</span>
              <div className="prob-bar-wrap">
                <div className="prob-bar" style={{ width: `${(p * 100).toFixed(1)}%`, background: col.bg }} />
              </div>
              <span className="prob-pct">{(p * 100).toFixed(1)}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── PredictTab Component ─────────────────────────────────────────────────────
function PredictTab({ showToast }) {
  const [text, setText]       = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState(null);
  const [error, setError]     = useState("");
  const [copied, setCopied]   = useState(false);

  // Form validation
  const validate = () => {
    if (!text.trim())                       return "Please enter an alumni description.";
    if (text.trim().length < 15)            return "Description is too short. Add more details.";
    if (text.trim().split(" ").length < 4)  return "Please provide at least a few words.";
    return "";
  };

  // Send text to Flask API
  const handleSubmit = async () => {
    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setError("");
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch(`${API_BASE}/api/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || "Prediction failed.");
      setResult(json);
      showToast(
        json.db_saved ? "Alumni saved to database!" : "Predicted (DB save failed)",
        json.db_saved ? "success" : "error"
      );
    } catch (err) {
      showToast(err.message || "Network error. Is Flask running?", "error");
    } finally {
      setLoading(false);
    }
  };

  // Copy result JSON to clipboard
  const copyJSON = () => {
    if (!result) return;
    navigator.clipboard.writeText(JSON.stringify(result.data, null, 2));
    setCopied(true);
    showToast("JSON copied to clipboard!", "success");
    setTimeout(() => setCopied(false), 2000);
  };

  const d = result?.data;
  const catColor = d ? (CATEGORY_COLORS[d.category] || CATEGORY_COLORS.Unknown) : null;

  return (
    <div className="predict-grid">

      {/* Left: Input Form */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div className="card">
          <div className="card-title" style={{ marginBottom: 16 }}>📝 Alumni Description</div>

          <div className="input-section">
            <label>Input Text</label>
            <div className="textarea-wrap">
              <textarea
                className={`alumni-textarea${error ? " error-border" : ""}`}
                placeholder="Enter alumni information here..."
                value={text}
                onChange={e => { setText(e.target.value); if (error) setError(""); }}
              />
              <span className="char-count">{text.length} chars</span>
            </div>
            {error && <div className="error-msg">⚠ {error}</div>}
          </div>

          {/* Example Chips */}
          <div style={{ marginTop: 14 }}>
            <div className="examples-label">Try an example:</div>
            <div className="example-chips">
              {EXAMPLE_TEXTS.map((ex, i) => (
                <span key={i} className="chip" title={ex}
                  onClick={() => { setText(ex); setError(""); }}>
                  Example {i + 1}
                </span>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <button className="submit-btn" onClick={handleSubmit} disabled={loading}>
            {loading ? <><div className="spinner" /> Analysing...</> : <>⚡ Predict &amp; Save</>}
          </button>
        </div>
      </div>

      {/* Right: Result Panel */}
      <div className="result-panel">
        {!result ? (
          <div className="card" style={{ flex: 1 }}>
            <div className="empty-state">
              <div className="empty-icon">🎓</div>
              <div className="empty-title">No prediction yet</div>
              <div className="empty-sub">Enter alumni text and click Predict &amp; Save</div>
            </div>
          </div>
        ) : (
          <>
            <div className="card fade-up">
              <div className="card-header">
                <div className="card-title">🏷️ Predicted Category</div>
                <button className={`copy-btn${copied ? " copied" : ""}`} onClick={copyJSON}>
                  {copied ? "✓ Copied!" : "⧉ Copy JSON"}
                </button>
              </div>

              {/* Category Display */}
              {d && (
                <div className="category-display" style={{ borderColor: catColor?.bg + "55" }}>
                  <div className="cat-icon">{CATEGORY_ICONS[d.category]}</div>
                  <div>
                    <div className="cat-label">Category</div>
                    <div className="cat-value" style={{ color: catColor?.bg }}>{d.category}</div>
                  </div>
                </div>
              )}

              {/* Extracted Info */}
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Extracted Information
                </div>
                <div className="info-grid">
                  <InfoItem icon="👤" label="Name"      value={d?.name} />
                  <InfoItem icon="🏢" label="Company"   value={d?.company} />
                  <InfoItem icon="💼" label="Job Role"  value={d?.job_role} />
                  <InfoItem icon="🎓" label="Grad Year" value={d?.graduation_year} />
                  <InfoItem icon="📧" label="Email"     value={d?.email} />
                  <InfoItem icon="📞" label="Phone"     value={d?.phone} />
                </div>
                <div style={{ marginTop: 10 }}>
                  <InfoItem icon="🛠️" label="Skills" value={d?.skills} />
                </div>
              </div>

              {/* DB Save Confirmation */}
              {result?.db_saved && (
                <div style={{ marginTop: 14, padding: "8px 12px", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 8, fontSize: 12, color: "var(--success)" }}>
                  ✓ Saved to database with ID #{d?.id}
                </div>
              )}
            </div>

            <ProbabilityBars probs={result?.probabilities} />
          </>
        )}
      </div>
    </div>
  );
}

// ─── HistoryTab Component ─────────────────────────────────────────────────────
function HistoryTab({ showToast }) {
  const [records, setRecords]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [filterCat, setFilterCat] = useState("All");

  // Load all alumni records from DB
  const loadRecords = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API_BASE}/api/alumni?limit=200`);
      const json = await res.json();
      if (json.success) setRecords(json.data);
    } catch {
      showToast("Failed to load records. Is Flask running?", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { loadRecords(); }, [loadRecords]);

  // Delete a record
  const handleDelete = async (id) => {
    if (!window.confirm(`Delete alumni #${id}?`)) return;
    try {
      const res  = await fetch(`${API_BASE}/api/alumni/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        setRecords(prev => prev.filter(r => r.id !== id));
        showToast("Record deleted.", "success");
      } else {
        showToast("Delete failed.", "error");
      }
    } catch {
      showToast("Network error.", "error");
    }
  };

  const categories = ["All", ...Object.keys(CATEGORY_COLORS).filter(c => c !== "Unknown")];

  // Filter by search and category
  const filtered = records.filter(r => {
    const q           = search.toLowerCase();
    const matchSearch = !q || [r.name, r.company, r.job_role, r.email, r.skills]
      .some(field => field && field.toLowerCase().includes(q));
    const matchCat    = filterCat === "All" || r.category === filterCat;
    return matchSearch && matchCat;
  });

  // Count per category for stats
  const catCounts = records.reduce((acc, r) => {
    acc[r.category] = (acc[r.category] || 0) + 1;
    return acc;
  }, {});

  const topCat = Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0];

  return (
    <div className="history-section">

      {/* Stats Row */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-label">Total Alumni</div>
          <div className="stat-value">{records.length}</div>
        </div>
        {topCat && (
          <div className="stat-card">
            <div className="stat-label">Top Category</div>
            <div className="stat-value" style={{ fontSize: 18, marginTop: 4 }}>
              <CategoryBadge category={topCat[0]} />
              <span style={{ fontSize: 20, marginLeft: 4 }}>{topCat[1]}</span>
            </div>
          </div>
        )}
        {Object.entries(catCounts).slice(0, 4).map(([cat, count]) => (
          <div key={cat} className="stat-card">
            <div className="stat-label">{CATEGORY_ICONS[cat]} {cat}</div>
            <div className="stat-value" style={{ color: CATEGORY_COLORS[cat]?.bg }}>{count}</div>
          </div>
        ))}
      </div>

      {/* Records Table */}
      <div className="card">
        <div className="history-toolbar">
          <div className="card-title">🗂️ Alumni Records ({filtered.length})</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <div className="search-wrap">
              <span className="search-icon">🔍</span>
              <input className="search-input" placeholder="Search alumni..."
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
              style={{ padding: "8px 12px", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text)", fontFamily: "var(--font)", fontSize: 13, outline: "none" }}>
              {categories.map(c => <option key={c}>{c}</option>)}
            </select>
            <button className="icon-btn" onClick={loadRecords} title="Refresh">↻</button>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--muted)" }}>Loading records...</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state" style={{ height: 200 }}>
            <div className="empty-icon">📭</div>
            <div className="empty-title">{records.length === 0 ? "No records yet" : "No matches found"}</div>
            <div className="empty-sub">{records.length === 0 ? "Predictions will appear here after you submit." : "Try a different search or filter."}</div>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th><th>Name</th><th>Company</th><th>Role</th>
                  <th>Skills</th><th>Grad Year</th><th>Category</th>
                  <th>Added</th><th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => (
                  <tr key={r.id} className="slide-in" style={{ animationDelay: `${i * 0.03}s` }}>
                    <td style={{ color: "var(--muted)", fontFamily: "var(--mono)", fontSize: 11 }}>{r.id}</td>
                    <td style={{ fontWeight: 500 }}>{r.name     || <span className="muted">—</span>}</td>
                    <td>{r.company  || <span className="muted">—</span>}</td>
                    <td>{r.job_role || <span className="muted">—</span>}</td>
                    <td style={{ maxWidth: 140 }}>
                      {r.skills
                        ? r.skills.split(",").slice(0, 2).join(", ") + (r.skills.split(",").length > 2 ? "…" : "")
                        : <span className="muted">—</span>}
                    </td>
                    <td>{r.graduation_year || <span className="muted">—</span>}</td>
                    <td><CategoryBadge category={r.category} /></td>
                    <td style={{ color: "var(--muted)", fontSize: 11, fontFamily: "var(--mono)" }}>
                      {r.created_at ? r.created_at.slice(0, 10) : "—"}
                    </td>
                    <td>
                      <button className="del-btn" onClick={() => handleDelete(r.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main App Component ───────────────────────────────────────────────────────
export default function App() {
  const [darkMode, setDarkMode]   = useState(true);
  const [activeTab, setActiveTab] = useState("predict");
  const [toast, setToast]         = useState(null);

  // Apply dark/light mode class to root element
  useEffect(() => {
    document.documentElement.className = darkMode ? "" : "light-mode";
  }, [darkMode]);

  // Show toast notification helper
  const showToast = useCallback((message, type = "info") => {
    setToast({ message, type, key: Date.now() });
  }, []);

  return (
    <div className="app-shell">

      {/* Header */}
      <header className="header">
        <div className="header-brand">
          <div className="brand-icon">🎓</div>
          <div className="brand-text">
            <h1>Alumni AI</h1>
            <p>Extraction &amp; Profiling System</p>
          </div>
        </div>
        <div className="header-actions">
          <div className="tab-nav">
            <button className={`tab-btn${activeTab === "predict" ? " active" : ""}`}
              onClick={() => setActiveTab("predict")}>
              ⚡ Predict
            </button>
            <button className={`tab-btn${activeTab === "history" ? " active" : ""}`}
              onClick={() => setActiveTab("history")}>
              🗂️ History
            </button>
          </div>
          <button className="icon-btn" onClick={() => setDarkMode(d => !d)} title="Toggle theme">
            {darkMode ? "☀️" : "🌙"}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="content-area">
        {activeTab === "predict"
          ? <PredictTab showToast={showToast} />
          : <HistoryTab showToast={showToast} />
        }
      </main>

      {/* Toast Notification */}
      {toast && (
        <Toast key={toast.key} message={toast.message} type={toast.type}
          onClose={() => setToast(null)} />
      )}
    </div>
  );
}