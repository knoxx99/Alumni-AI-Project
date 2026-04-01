import { useState } from "react";
import "./Auth.css";

export default function Login({ onLogin, onGoRegister }) {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [showPass, setShowPass] = useState(false);

  // Validate fields before sending to API
  const validate = () => {
    if (!email.trim())              return "Email is required.";
    if (!/\S+@\S+\.\S+/.test(email)) return "Enter a valid email address.";
    if (!password)                  return "Password is required.";
    return "";
  };

  const handleLogin = async () => {
    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setLoading(true);
    setError("");

    try {
      const res  = await fetch("http://localhost:5000/api/auth/login", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email, password }),
      });
      const json = await res.json();

      if (!res.ok) {
        setError(json.error || "Login failed.");
      } else {
        // Save token + user to localStorage
        localStorage.setItem("token", json.token);
        localStorage.setItem("user",  JSON.stringify(json.user));
        onLogin(json.user, json.token);
      }
    } catch {
      setError("Cannot connect to server. Is Flask running?");
    } finally {
      setLoading(false);
    }
  };

  // Allow pressing Enter to submit
  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleLogin();
  };

  return (
    <div className="auth-shell">
      {/* Left Panel — Branding */}
      <div className="auth-left">
        <div className="auth-brand">
          <div className="auth-logo">🎓</div>
          <h1>Alumni AI</h1>
          <p>Extraction &amp; Profiling System</p>
        </div>
        <div className="auth-features">
          <div className="auth-feature"><span>⚡</span> AI-powered text extraction</div>
          <div className="auth-feature"><span>📊</span> ML category prediction</div>
          <div className="auth-feature"><span>🗄️</span> MySQL database storage</div>
          <div className="auth-feature"><span>🔒</span> Role-based access control</div>
        </div>
      </div>

      {/* Right Panel — Login Form */}
      <div className="auth-right">
        <div className="auth-card">
          <div className="auth-card-header">
            <h2>Welcome back</h2>
            <p>Sign in to your account</p>
          </div>

          {/* Error Message */}
          {error && <div className="auth-error">⚠ {error}</div>}

          {/* Email */}
          <div className="auth-field">
            <label>Email Address</label>
            <div className="input-wrap">
              <span className="input-icon">📧</span>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(""); }}
                onKeyDown={handleKeyDown}
                className={error && !email ? "input-error" : ""}
              />
            </div>
          </div>

          {/* Password */}
          <div className="auth-field">
            <label>Password</label>
            <div className="input-wrap">
              <span className="input-icon">🔑</span>
              <input
                type={showPass ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={e => { setPassword(e.target.value); setError(""); }}
                onKeyDown={handleKeyDown}
                className={error && !password ? "input-error" : ""}
              />
              <button className="toggle-pass" onClick={() => setShowPass(s => !s)}>
                {showPass ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button className="auth-btn" onClick={handleLogin} disabled={loading}>
            {loading ? <><div className="auth-spinner" /> Signing in...</> : "Sign In →"}
          </button>

          {/* Divider */}
          <div className="auth-divider"><span>or</span></div>

          {/* Go to Register */}
          <button className="auth-btn-outline" onClick={onGoRegister}>
            Create new account
          </button>

          {/* Demo Credentials */}
          <div className="demo-hint">
            <div className="demo-hint-title">🧪 Demo credentials</div>
            <div className="demo-row">
              <span>Admin:</span>
              <code>admin@alumni.com</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
