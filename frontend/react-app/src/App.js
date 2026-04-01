import { useState, useEffect, useCallback } from "react";
import "./App.css";
import Login    from "./Login";
import Register from "./Register";

// ─── Constants ────────────────────────────────────────────────────────────────
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
  "Rahul Sharma is a Software Engineer at Google skilled in Python, Machine Learning, and TensorFlow. Batch of 2020.",
  "Priya Patel worked as a Financial Analyst at Goldman Sachs with expertise in portfolio management. Batch of 2018.",
  "Dr. Ananya Singh is a Professor at IIT Delhi teaching Data Structures and Algorithms. Graduated 2015.",
  "Arjun Mehta is the Founder of a Fintech startup providing AI-powered microloans. Batch 2019.",
];

// ─── Helper: Auth header ──────────────────────────────────────────────────────
const authHeader = (token) => ({
  "Content-Type": "application/json",
  "Authorization": `Bearer ${token}`
});

// ─── Toast Component ──────────────────────────────────────────────────────────
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);
  const icon = type === "success" ? "✓" : type === "error" ? "✕" : "ℹ";
  return (
    <div className={`toast ${type}`}>
      <span>{icon}</span> {message}
    </div>
  );
}

// ─── CategoryBadge ────────────────────────────────────────────────────────────
function CategoryBadge({ category }) {
  const col = CATEGORY_COLORS[category] || CATEGORY_COLORS.Unknown;
  return (
    <span className="cat-badge" style={{ background: col.light, color: col.bg }}>
      {CATEGORY_ICONS[category]} {category}
    </span>
  );
}

// ─── InfoItem ─────────────────────────────────────────────────────────────────
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

// ─── ProbabilityBars ──────────────────────────────────────────────────────────
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
                <div className="prob-bar" style={{ width: `${(p*100).toFixed(1)}%`, background: col.bg }} />
              </div>
              <span className="prob-pct">{(p*100).toFixed(1)}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── PredictTab (Admin only) ──────────────────────────────────────────────────
function PredictTab({ showToast, token }) {
  const [text, setText]     = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError]   = useState("");
  const [copied, setCopied] = useState(false);

  const validate = () => {
    if (!text.trim())                     return "Please enter an alumni description.";
    if (text.trim().length < 15)          return "Description is too short.";
    if (text.trim().split(" ").length < 4) return "Please provide at least a few words.";
    return "";
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError(""); setLoading(true); setResult(null);
    try {
      const res  = await fetch(`${API_BASE}/api/predict`, {
        method: "POST",
        headers: authHeader(token),
        body: JSON.stringify({ text }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Prediction failed.");
      setResult(json);
      showToast(json.db_saved ? "Alumni saved to database!" : "Predicted (DB save failed)", json.db_saved ? "success" : "error");
    } catch (e) {
      showToast(e.message || "Network error.", "error");
    } finally {
      setLoading(false);
    }
  };

  const copyJSON = () => {
    if (!result) return;
    navigator.clipboard.writeText(JSON.stringify(result.data, null, 2));
    setCopied(true);
    showToast("JSON copied!", "success");
    setTimeout(() => setCopied(false), 2000);
  };

  const d = result?.data;
  const catColor = d ? (CATEGORY_COLORS[d.category] || CATEGORY_COLORS.Unknown) : null;

  return (
    <div className="predict-grid">
      {/* Left: Input */}
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
          <div style={{ marginTop: 14 }}>
            <div className="examples-label">Try an example:</div>
            <div className="example-chips">
              {EXAMPLE_TEXTS.map((ex, i) => (
                <span key={i} className="chip" title={ex} onClick={() => { setText(ex); setError(""); }}>
                  Example {i + 1}
                </span>
              ))}
            </div>
          </div>
          <button className="submit-btn" onClick={handleSubmit} disabled={loading}>
            {loading ? <><div className="spinner" /> Analysing...</> : <>⚡ Predict &amp; Save</>}
          </button>
        </div>
      </div>

      {/* Right: Result */}
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
              {d && (
                <div className="category-display" style={{ borderColor: catColor?.bg + "55" }}>
                  <div className="cat-icon">{CATEGORY_ICONS[d.category]}</div>
                  <div>
                    <div className="cat-label">Category</div>
                    <div className="cat-value" style={{ color: catColor?.bg }}>{d.category}</div>
                  </div>
                </div>
              )}
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

// ─── HistoryTab (Admin + Student, but delete only for admin) ──────────────────
function HistoryTab({ showToast, token, userRole }) {
  const [records, setRecords]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [filterCat, setFilterCat] = useState("All");

  const loadRecords = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API_BASE}/api/alumni?limit=200`, { headers: authHeader(token) });
      const json = await res.json();
      if (json.success) setRecords(json.data);
    } catch {
      showToast("Failed to load records.", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast, token]);

  useEffect(() => { loadRecords(); }, [loadRecords]);

  const handleDelete = async (id) => {
    if (!window.confirm(`Delete alumni #${id}?`)) return;
    try {
      const res  = await fetch(`${API_BASE}/api/alumni/${id}`, { method: "DELETE", headers: authHeader(token) });
      const json = await res.json();
      if (json.success) { setRecords(prev => prev.filter(r => r.id !== id)); showToast("Record deleted.", "success"); }
      else showToast("Delete failed.", "error");
    } catch { showToast("Network error.", "error"); }
  };

  const categories = ["All", ...Object.keys(CATEGORY_COLORS).filter(c => c !== "Unknown")];

  const filtered = records.filter(r => {
    const q = search.toLowerCase();
    const matchSearch = !q || [r.name, r.company, r.job_role, r.email, r.skills].some(f => f && f.toLowerCase().includes(q));
    const matchCat    = filterCat === "All" || r.category === filterCat;
    return matchSearch && matchCat;
  });

  const catCounts = records.reduce((acc, r) => { acc[r.category] = (acc[r.category] || 0) + 1; return acc; }, {});
  const topCat    = Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0];

  return (
    <div className="history-section">
      {/* Student info banner */}
      {userRole === "student" && (
        <div style={{ marginBottom: 20, padding: "10px 16px", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 10, fontSize: 13, color: "#f59e0b" }}>
          🎓 Student View — You can view alumni records but cannot add or delete them.
        </div>
      )}

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
        {Object.entries(catCounts).slice(0, 4).map(([cat, cnt]) => (
          <div key={cat} className="stat-card">
            <div className="stat-label">{CATEGORY_ICONS[cat]} {cat}</div>
            <div className="stat-value" style={{ color: CATEGORY_COLORS[cat]?.bg }}>{cnt}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="card">
        <div className="history-toolbar">
          <div className="card-title">🗂️ Alumni Records ({filtered.length})</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <div className="search-wrap">
              <span className="search-icon">🔍</span>
              <input className="search-input" placeholder="Search alumni..." value={search} onChange={e => setSearch(e.target.value)} />
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
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th><th>Name</th><th>Company</th><th>Role</th>
                  <th>Skills</th><th>Grad Year</th><th>Category</th>
                  <th>Added</th>
                  {userRole === "admin" && <th></th>}
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
                      {r.skills ? r.skills.split(",").slice(0,2).join(", ") + (r.skills.split(",").length > 2 ? "…" : "") : <span className="muted">—</span>}
                    </td>
                    <td>{r.graduation_year || <span className="muted">—</span>}</td>
                    <td><CategoryBadge category={r.category} /></td>
                    <td style={{ color: "var(--muted)", fontSize: 11, fontFamily: "var(--mono)" }}>
                      {r.created_at ? r.created_at.slice(0, 10) : "—"}
                    </td>
                    {userRole === "admin" && (
                      <td><button className="del-btn" onClick={() => handleDelete(r.id)}>Delete</button></td>
                    )}
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

// ─── Main Dashboard (after login) ────────────────────────────────────────────
function Dashboard({ user, token, onLogout }) {
  const [darkMode, setDarkMode]   = useState(true);
  const [activeTab, setActiveTab] = useState(user.role === "admin" ? "predict" : "history");
  const [toast, setToast]         = useState(null);

  useEffect(() => {
    document.documentElement.className = darkMode ? "" : "light-mode";
  }, [darkMode]);

  const showToast = useCallback((message, type = "info") => {
    setToast({ message, type, key: Date.now() });
  }, []);

  const isAdmin = user.role === "admin";

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
          {/* Tabs — admin sees both, student sees only history */}
          <div className="tab-nav">
            {isAdmin && (
              <button className={`tab-btn${activeTab === "predict" ? " active" : ""}`} onClick={() => setActiveTab("predict")}>
                ⚡ Predict
              </button>
            )}
            <button className={`tab-btn${activeTab === "history" ? " active" : ""}`} onClick={() => setActiveTab("history")}>
              🗂️ Records
            </button>
          </div>

          {/* User info badge */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 12px", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}>
            <span>{isAdmin ? "👤" : "🎓"}</span>
            <span style={{ color: "var(--text)", fontWeight: 500 }}>{user.full_name}</span>
            <span style={{ color: isAdmin ? "#4f8ef7" : "#f59e0b", fontSize: 11, fontWeight: 600,
              background: isAdmin ? "rgba(79,142,247,0.1)" : "rgba(245,158,11,0.1)",
              padding: "2px 6px", borderRadius: 4 }}>
              {user.role.toUpperCase()}
            </span>
          </div>

          <button className="icon-btn" onClick={() => setDarkMode(d => !d)} title="Toggle theme">
            {darkMode ? "☀️" : "🌙"}
          </button>

          {/* Logout */}
          <button className="icon-btn" onClick={onLogout} title="Logout" style={{ fontSize: 14 }}>
            🚪
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="content-area">
        {activeTab === "predict" && isAdmin
          ? <PredictTab showToast={showToast} token={token} />
          : <HistoryTab showToast={showToast} token={token} userRole={user.role} />
        }
      </main>

      {toast && (
        <Toast key={toast.key} message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}

// ─── Root App — handles page routing ─────────────────────────────────────────
export default function App() {
  // page: "login" | "register" | "dashboard"
  const [page, setPage]   = useState("login");
  const [user, setUser]   = useState(null);
  const [token, setToken] = useState(null);

  // On first load, check if user is already logged in
  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    const savedUser  = localStorage.getItem("user");
    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
        setPage("dashboard");
      } catch {
        localStorage.clear();
      }
    }
  }, []);

  const handleLogin = (userData, userToken) => {
    setUser(userData);
    setToken(userToken);
    setPage("dashboard");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setToken(null);
    setPage("login");
  };

  // Render correct page
  if (page === "login") {
    return <Login onLogin={handleLogin} onGoRegister={() => setPage("register")} />;
  }

  if (page === "register") {
    return <Register onLogin={handleLogin} onGoLogin={() => setPage("login")} />;
  }

  return <Dashboard user={user} token={token} onLogout={handleLogout} />;
}
