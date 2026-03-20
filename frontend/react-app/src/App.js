import { useState, useEffect, useCallback } from "react";

// ─── Constants ───────────────────────────────────────────────────────────────
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

// ─── Styles ──────────────────────────────────────────────────────────────────
const injectStyles = () => {
  const style = document.createElement("style");
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg:          #0d0f14;
      --surface:     #161a23;
      --surface2:    #1e2330;
      --border:      #2a3045;
      --border2:     #3a4460;
      --text:        #e8ecf4;
      --muted:       #8892aa;
      --accent:      #4f8ef7;
      --accent2:     #7c3aed;
      --success:     #10b981;
      --error:       #ef4444;
      --warning:     #f59e0b;
      --radius:      12px;
      --radius-lg:   20px;
      --shadow:      0 4px 24px rgba(0,0,0,0.4);
      --shadow-lg:   0 8px 48px rgba(0,0,0,0.6);
      --font:        'Space Grotesk', sans-serif;
      --mono:        'JetBrains Mono', monospace;
    }

    .light-mode {
      --bg:       #f0f4ff;
      --surface:  #ffffff;
      --surface2: #eef2fc;
      --border:   #d1d9f0;
      --border2:  #b8c4e8;
      --text:     #1a2040;
      --muted:    #6070a0;
      --shadow:   0 4px 24px rgba(79,142,247,0.10);
      --shadow-lg:0 8px 48px rgba(79,142,247,0.15);
    }

    html, body, #root {
      height: 100%;
      background: var(--bg);
      color: var(--text);
      font-family: var(--font);
      transition: background 0.3s, color 0.3s;
    }

    /* Scrollbar */
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-track { background: var(--bg); }
    ::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 3px; }

    /* Animations */
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(16px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes pulse-ring {
      0%   { transform: scale(1);   opacity: 0.7; }
      100% { transform: scale(1.5); opacity: 0; }
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    @keyframes slideIn {
      from { opacity: 0; transform: translateX(-12px); }
      to   { opacity: 1; transform: translateX(0); }
    }
    @keyframes shimmer {
      0%   { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }

    .fade-up   { animation: fadeUp 0.4s ease forwards; }
    .slide-in  { animation: slideIn 0.3s ease forwards; }

    /* Layout */
    .app-shell {
      min-height: 100vh;
      display: grid;
      grid-template-rows: auto 1fr;
    }

    /* Header */
    .header {
      padding: 18px 32px;
      border-bottom: 1px solid var(--border);
      background: var(--surface);
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: sticky;
      top: 0;
      z-index: 100;
      backdrop-filter: blur(12px);
    }
    .header-brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .brand-icon {
      width: 38px; height: 38px;
      background: linear-gradient(135deg, var(--accent), var(--accent2));
      border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      font-size: 18px;
    }
    .brand-text h1 {
      font-size: 18px; font-weight: 700;
      background: linear-gradient(135deg, var(--accent), var(--accent2));
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .brand-text p { font-size: 12px; color: var(--muted); margin-top: 1px; }

    .header-actions { display: flex; gap: 10px; align-items: center; }

    .tab-nav {
      display: flex;
      background: var(--surface2);
      border-radius: 10px;
      padding: 3px;
      gap: 2px;
    }
    .tab-btn {
      padding: 6px 16px;
      border: none;
      background: transparent;
      color: var(--muted);
      font-family: var(--font);
      font-size: 13px; font-weight: 500;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .tab-btn.active {
      background: var(--accent);
      color: #fff;
    }

    .icon-btn {
      width: 36px; height: 36px;
      border: 1px solid var(--border);
      background: var(--surface2);
      color: var(--text);
      border-radius: 8px;
      cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      font-size: 16px;
      transition: all 0.2s;
    }
    .icon-btn:hover { border-color: var(--accent); background: var(--surface); }

    /* Main content */
    .content-area {
      padding: 32px;
      max-width: 1200px;
      margin: 0 auto;
      width: 100%;
    }

    /* Cards */
    .card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 28px;
      box-shadow: var(--shadow);
    }
    .card-header {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 20px;
    }
    .card-title {
      font-size: 16px; font-weight: 600;
      display: flex; align-items: center; gap: 8px;
    }

    /* Predict Tab */
    .predict-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
    }
    @media (max-width: 768px) {
      .predict-grid { grid-template-columns: 1fr; }
      .content-area { padding: 16px; }
    }

    /* Textarea */
    .input-section label {
      display: block;
      font-size: 13px; font-weight: 600;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 8px;
    }
    .textarea-wrap { position: relative; }
    .alumni-textarea {
      width: 100%;
      min-height: 220px;
      padding: 16px;
      background: var(--surface2);
      border: 2px solid var(--border);
      border-radius: var(--radius);
      color: var(--text);
      font-family: var(--mono);
      font-size: 13.5px;
      line-height: 1.7;
      resize: vertical;
      outline: none;
      transition: border-color 0.2s;
    }
    .alumni-textarea:focus { border-color: var(--accent); }
    .alumni-textarea.error-border { border-color: var(--error) !important; }
    .char-count {
      position: absolute;
      bottom: 10px; right: 12px;
      font-size: 11px; color: var(--muted);
      font-family: var(--mono);
    }

    .error-msg {
      margin-top: 6px;
      font-size: 12px;
      color: var(--error);
      display: flex; align-items: center; gap: 4px;
    }

    /* Examples */
    .examples-label {
      font-size: 12px; color: var(--muted); margin-bottom: 8px; font-weight: 500;
    }
    .example-chips {
      display: flex; flex-wrap: wrap; gap: 6px;
    }
    .chip {
      padding: 4px 12px;
      background: var(--surface2);
      border: 1px solid var(--border);
      border-radius: 20px;
      font-size: 12px;
      color: var(--muted);
      cursor: pointer;
      transition: all 0.2s;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 180px;
    }
    .chip:hover { border-color: var(--accent); color: var(--accent); }

    /* Submit button */
    .submit-btn {
      width: 100%;
      margin-top: 16px;
      padding: 14px;
      background: linear-gradient(135deg, var(--accent), var(--accent2));
      color: #fff;
      border: none;
      border-radius: var(--radius);
      font-family: var(--font);
      font-size: 15px; font-weight: 600;
      cursor: pointer;
      transition: all 0.25s;
      display: flex; align-items: center; justify-content: center; gap: 8px;
      position: relative;
      overflow: hidden;
    }
    .submit-btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(79,142,247,0.4);
    }
    .submit-btn:disabled {
      opacity: 0.65;
      cursor: not-allowed;
      transform: none;
    }
    .spinner {
      width: 18px; height: 18px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }

    /* Result panel */
    .result-panel {
      display: flex; flex-direction: column; gap: 16px;
    }

    /* Category badge */
    .category-display {
      display: flex; align-items: center; gap: 12px;
      padding: 16px 20px;
      border-radius: var(--radius);
      background: var(--surface2);
      border: 1px solid var(--border);
    }
    .cat-icon { font-size: 28px; }
    .cat-info {}
    .cat-label { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.06em; }
    .cat-value { font-size: 22px; font-weight: 700; margin-top: 2px; }

    /* Probability bars */
    .prob-grid { display: flex; flex-direction: column; gap: 6px; }
    .prob-row { display: flex; align-items: center; gap: 8px; }
    .prob-label { font-size: 12px; color: var(--muted); width: 100px; flex-shrink: 0; }
    .prob-bar-wrap {
      flex: 1;
      height: 6px;
      background: var(--surface2);
      border-radius: 3px;
      overflow: hidden;
    }
    .prob-bar {
      height: 100%;
      border-radius: 3px;
      transition: width 0.8s cubic-bezier(0.34,1.56,0.64,1);
    }
    .prob-pct { font-size: 11px; color: var(--muted); font-family: var(--mono); width: 42px; text-align: right; }

    /* Extracted info grid */
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }
    .info-item {
      background: var(--surface2);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 12px 14px;
    }
    .info-item-label {
      font-size: 10px;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.06em;
      margin-bottom: 4px;
      display: flex; align-items: center; gap: 4px;
    }
    .info-item-value {
      font-size: 13.5px;
      font-weight: 500;
      color: var(--text);
      font-family: var(--mono);
      word-break: break-word;
    }
    .info-item-value.empty { color: var(--muted); font-style: italic; font-size: 12px; }

    /* Skills chips */
    .skills-wrap { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px; }
    .skill-tag {
      padding: 2px 8px;
      background: var(--bg);
      border: 1px solid var(--border2);
      border-radius: 4px;
      font-size: 11px;
      color: var(--accent);
      font-family: var(--mono);
    }

    /* Copy JSON button */
    .copy-btn {
      display: flex; align-items: center; gap: 6px;
      padding: 8px 14px;
      background: var(--surface2);
      border: 1px solid var(--border);
      border-radius: 8px;
      color: var(--muted);
      font-size: 12px; font-weight: 500;
      font-family: var(--font);
      cursor: pointer;
      transition: all 0.2s;
    }
    .copy-btn:hover { border-color: var(--success); color: var(--success); }
    .copy-btn.copied { border-color: var(--success); color: var(--success); background: rgba(16,185,129,0.08); }

    /* Empty state */
    .empty-state {
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      gap: 12px;
      height: 300px;
      color: var(--muted);
      text-align: center;
    }
    .empty-icon { font-size: 48px; opacity: 0.4; }
    .empty-title { font-size: 15px; font-weight: 600; }
    .empty-sub { font-size: 13px; opacity: 0.7; }

    /* Toast */
    .toast {
      position: fixed;
      bottom: 24px; right: 24px;
      padding: 12px 20px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      box-shadow: var(--shadow-lg);
      font-size: 13px;
      display: flex; align-items: center; gap: 8px;
      animation: fadeUp 0.3s ease;
      z-index: 999;
      max-width: 320px;
    }
    .toast.success { border-color: var(--success); }
    .toast.error   { border-color: var(--error); }

    /* History Table */
    .history-section { animation: fadeUp 0.4s ease; }
    .history-toolbar {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 20px; flex-wrap: wrap; gap: 12px;
    }
    .search-input {
      padding: 8px 14px 8px 36px;
      background: var(--surface2);
      border: 1px solid var(--border);
      border-radius: 8px;
      color: var(--text);
      font-family: var(--font);
      font-size: 13px;
      outline: none;
      width: 240px;
      transition: border-color 0.2s;
    }
    .search-input:focus { border-color: var(--accent); }
    .search-wrap { position: relative; }
    .search-icon {
      position: absolute; left: 10px; top: 50%;
      transform: translateY(-50%);
      color: var(--muted); font-size: 14px;
      pointer-events: none;
    }

    .table-wrap {
      overflow-x: auto;
      border-radius: var(--radius);
      border: 1px solid var(--border);
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    thead th {
      padding: 12px 14px;
      text-align: left;
      background: var(--surface2);
      color: var(--muted);
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-weight: 600;
      border-bottom: 1px solid var(--border);
      white-space: nowrap;
    }
    tbody td {
      padding: 11px 14px;
      border-bottom: 1px solid var(--border);
      vertical-align: middle;
      max-width: 200px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: var(--text);
    }
    tbody tr:last-child td { border-bottom: none; }
    tbody tr { transition: background 0.15s; }
    tbody tr:hover { background: var(--surface2); }

    .cat-badge {
      display: inline-flex; align-items: center; gap: 4px;
      padding: 3px 10px;
      border-radius: 20px;
      font-size: 11px; font-weight: 600;
      white-space: nowrap;
    }

    .del-btn {
      padding: 4px 10px;
      background: transparent;
      border: 1px solid var(--border);
      border-radius: 6px;
      color: var(--muted);
      font-size: 12px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .del-btn:hover { border-color: var(--error); color: var(--error); background: rgba(239,68,68,0.06); }

    .muted { color: var(--muted); font-style: italic; }

    /* Stats row */
    .stats-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 12px;
      margin-bottom: 24px;
    }
    .stat-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 16px 18px;
      display: flex; flex-direction: column; gap: 4px;
    }
    .stat-label { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.05em; }
    .stat-value { font-size: 26px; font-weight: 700; }
  `;
  document.head.appendChild(style);
};

// ─── Toast Component ─────────────────────────────────────────────────────────
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

// ─── CategoryBadge ───────────────────────────────────────────────────────────
function CategoryBadge({ category }) {
  const col = CATEGORY_COLORS[category] || CATEGORY_COLORS.Unknown;
  return (
    <span className="cat-badge" style={{ background: col.light, color: col.bg }}>
      {CATEGORY_ICONS[category]} {category}
    </span>
  );
}

// ─── InfoItem ────────────────────────────────────────────────────────────────
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

// ─── ProbabilityBars ─────────────────────────────────────────────────────────
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

// ─── PredictTab ──────────────────────────────────────────────────────────────
function PredictTab({ showToast }) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const validate = () => {
    if (!text.trim()) return "Please enter an alumni description.";
    if (text.trim().length < 15) return "Description is too short. Add more details.";
    if (text.trim().split(" ").length < 4) return "Please provide at least a few words.";
    return "";
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError("");
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`${API_BASE}/api/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Prediction failed.");
      setResult(json);
      showToast(json.db_saved ? "Alumni saved to database!" : "Predicted (DB save failed)", json.db_saved ? "success" : "error");
    } catch (e) {
      showToast(e.message || "Network error. Is Flask running?", "error");
    } finally {
      setLoading(false);
    }
  };

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
      {/* Left: Input */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div className="card">
          <div className="card-title" style={{ marginBottom: 16 }}>📝 Alumni Description</div>
          <div className="input-section">
            <label>Input Text</label>
            <div className="textarea-wrap">
              <textarea
                className={`alumni-textarea${error ? " error-border" : ""}`}
                placeholder="Enter alumni information here...&#10;&#10;Example: Rahul Sharma is a Software Engineer at Google skilled in Python and AI, batch of 2020."
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
                <span key={i} className="chip" onClick={() => { setText(ex); setError(""); }} title={ex}>
                  Example {i + 1}
                </span>
              ))}
            </div>
          </div>

          <button className="submit-btn" onClick={handleSubmit} disabled={loading}>
            {loading ? <><div className="spinner" /> Analysing...</> : <> Predict & Save</>}
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
              <div className="empty-sub">Enter alumni text and click Predict & Save</div>
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
                  <div className="cat-info">
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
                  <InfoItem icon="👤" label="Name"            value={d?.name} />
                  <InfoItem icon="🏢" label="Company"         value={d?.company} />
                  <InfoItem icon="💼" label="Job Role"        value={d?.job_role} />
                  <InfoItem icon="🎓" label="Grad Year"       value={d?.graduation_year} />
                  <InfoItem icon="📧" label="Email"           value={d?.email} />
                  <InfoItem icon="📞" label="Phone"           value={d?.phone} />
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

// ─── HistoryTab ──────────────────────────────────────────────────────────────
function HistoryTab({ showToast }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("All");

  const loadRecords = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/alumni?limit=200`);
      const json = await res.json();
      if (json.success) setRecords(json.data);
    } catch {
      showToast("Failed to load records. Is Flask running?", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { loadRecords(); }, [loadRecords]);

  const handleDelete = async (id) => {
    if (!window.confirm(`Delete alumni #${id}?`)) return;
    try {
      const res = await fetch(`${API_BASE}/api/alumni/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        setRecords(r => r.filter(x => x.id !== id));
        showToast("Record deleted.", "success");
      } else showToast("Delete failed.", "error");
    } catch { showToast("Network error.", "error"); }
  };

  const categories = ["All", ...Object.keys(CATEGORY_COLORS).filter(c => c !== "Unknown")];

  const filtered = records.filter(r => {
    const q = search.toLowerCase();
    const matchSearch = !q || [r.name, r.company, r.job_role, r.email, r.skills]
      .some(f => f && f.toLowerCase().includes(q));
    const matchCat = filterCat === "All" || r.category === filterCat;
    return matchSearch && matchCat;
  });

  // Stats
  const catCounts = records.reduce((acc, r) => {
    acc[r.category] = (acc[r.category] || 0) + 1; return acc;
  }, {});
  const topCat = Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0];

  return (
    <div className="history-section">
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-label">Total Alumni</div>
          <div className="stat-value">{records.length}</div>
        </div>
        {topCat && (
          <div className="stat-card">
            <div className="stat-label">Top Category</div>
            <div className="stat-value" style={{ fontSize: 18, marginTop: 4 }}>
              <CategoryBadge category={topCat[0]} /> <span style={{ fontSize: 20, marginLeft: 4 }}>{topCat[1]}</span>
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

      <div className="card">
        <div className="history-toolbar">
          <div className="card-title">🗂️ Alumni Records ({filtered.length})</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <div className="search-wrap">
              <span className="search-icon">🔍</span>
              <input className="search-input" placeholder="Search alumni..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select
              value={filterCat}
              onChange={e => setFilterCat(e.target.value)}
              style={{
                padding: "8px 12px", background: "var(--surface2)", border: "1px solid var(--border)",
                borderRadius: 8, color: "var(--text)", fontFamily: "var(--font)", fontSize: 13, outline: "none"
              }}
            >
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
                    <td style={{ fontWeight: 500 }}>{r.name || <span className="muted">—</span>}</td>
                    <td>{r.company || <span className="muted">—</span>}</td>
                    <td>{r.job_role || <span className="muted">—</span>}</td>
                    <td style={{ maxWidth: 140 }}>{r.skills ? r.skills.split(",").slice(0, 2).join(", ") + (r.skills.split(",").length > 2 ? "…" : "") : <span className="muted">—</span>}</td>
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

// ─── App Root ─────────────────────────────────────────────────────────────────
export default function App() {
  const [darkMode, setDarkMode] = useState(true);
  const [activeTab, setActiveTab] = useState("predict");
  const [toast, setToast] = useState(null);

  useEffect(() => { injectStyles(); }, []);
  useEffect(() => {
    document.documentElement.className = darkMode ? "" : "light-mode";
  }, [darkMode]);

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
            <p>Extraction & Profiling System</p>
          </div>
        </div>
        <div className="header-actions">
          <div className="tab-nav">
            <button className={`tab-btn${activeTab === "predict" ? " active" : ""}`} onClick={() => setActiveTab("predict")}>
              ⚡ Predict
            </button>
            <button className={`tab-btn${activeTab === "history" ? " active" : ""}`} onClick={() => setActiveTab("history")}>
              🗂️ History
            </button>
          </div>
          <button className="icon-btn" onClick={() => setDarkMode(d => !d)} title="Toggle theme">
            {darkMode ? "☀️" : "🌙"}
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="content-area">
        {activeTab === "predict"
          ? <PredictTab showToast={showToast} />
          : <HistoryTab showToast={showToast} />
        }
      </main>

      {/* Toast */}
      {toast && (
        <Toast key={toast.key} message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}