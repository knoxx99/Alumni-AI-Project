import { useState } from "react";
import "./Auth.css";

export default function Register({ onLogin, onGoLogin }) {
  const [form, setForm]         = useState({ full_name: "", email: "", password: "", confirm: "", role: "student" });
  const [errors, setErrors]     = useState({});
  const [loading, setLoading]   = useState(false);
  const [showPass, setShowPass] = useState(false);

  const update = (field, value) => {
    setForm(f => ({ ...f, [field]: value }));
    setErrors(e => ({ ...e, [field]: "" }));
  };

  // Validate all fields
  const validate = () => {
    const e = {};
    if (!form.full_name.trim())               e.full_name = "Full name is required.";
    if (!form.email.trim())                   e.email     = "Email is required.";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email   = "Enter a valid email.";
    if (!form.password)                       e.password  = "Password is required.";
    else if (form.password.length < 6)        e.password  = "Password must be at least 6 characters.";
    if (form.password !== form.confirm)       e.confirm   = "Passwords do not match.";
    return e;
  };

  const handleRegister = async () => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      const res  = await fetch("http://localhost:5000/api/auth/register", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          full_name: form.full_name,
          email:     form.email,
          password:  form.password,
          role:      form.role,
        }),
      });
      const json = await res.json();

      if (!res.ok) {
        setErrors({ general: json.error || "Registration failed." });
      } else {
        // Save token + user and redirect
        localStorage.setItem("token", json.token);
        localStorage.setItem("user",  JSON.stringify(json.user));
        onLogin(json.user, json.token);
      }
    } catch {
      setErrors({ general: "Cannot connect to server. Is Flask running?" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      {/* Left Panel */}
      <div className="auth-left">
        <div className="auth-brand">
          <div className="auth-logo">🎓</div>
          <h1>Alumni AI</h1>
          <p>Extraction &amp; Profiling System</p>
        </div>
        <div className="auth-features">
          <div className="auth-feature"><span>👤</span> Admin — Full access</div>
          <div className="auth-feature"><span>🎓</span> Student — View records</div>
          <div className="auth-feature"><span>🔐</span> Secure password hashing</div>
          <div className="auth-feature"><span>🪙</span> Token-based sessions</div>
        </div>
      </div>

      {/* Right Panel — Register Form */}
      <div className="auth-right">
        <div className="auth-card">
          <div className="auth-card-header">
            <h2>Create account</h2>
            <p>Join the Alumni AI system</p>
          </div>

          {/* General error */}
          {errors.general && <div className="auth-error">⚠ {errors.general}</div>}

          {/* Full Name */}
          <div className="auth-field">
            <label>Full Name</label>
            <div className="input-wrap">
              <span className="input-icon">👤</span>
              <input
                type="text"
                placeholder="Rahul Sharma"
                value={form.full_name}
                onChange={e => update("full_name", e.target.value)}
                className={errors.full_name ? "input-error" : ""}
              />
            </div>
            {errors.full_name && <div className="field-error">{errors.full_name}</div>}
          </div>

          {/* Email */}
          <div className="auth-field">
            <label>Email Address</label>
            <div className="input-wrap">
              <span className="input-icon">📧</span>
              <input
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={e => update("email", e.target.value)}
                className={errors.email ? "input-error" : ""}
              />
            </div>
            {errors.email && <div className="field-error">{errors.email}</div>}
          </div>

          {/* Role Selection */}
          <div className="auth-field">
            <label>Role</label>
            <div className="role-toggle">
              <button
                className={`role-btn ${form.role === "student" ? "active" : ""}`}
                onClick={() => update("role", "student")}
              >
                🎓 Student
              </button>
              <button
                className={`role-btn ${form.role === "admin" ? "active" : ""}`}
                onClick={() => update("role", "admin")}
              >
                👤 Admin
              </button>
            </div>
          </div>

          {/* Password */}
          <div className="auth-field">
            <label>Password</label>
            <div className="input-wrap">
              <span className="input-icon">🔑</span>
              <input
                type={showPass ? "text" : "password"}
                placeholder="Minimum 6 characters"
                value={form.password}
                onChange={e => update("password", e.target.value)}
                className={errors.password ? "input-error" : ""}
              />
              <button className="toggle-pass" onClick={() => setShowPass(s => !s)}>
                {showPass ? "🙈" : "👁️"}
              </button>
            </div>
            {errors.password && <div className="field-error">{errors.password}</div>}
          </div>

          {/* Confirm Password */}
          <div className="auth-field">
            <label>Confirm Password</label>
            <div className="input-wrap">
              <span className="input-icon">🔒</span>
              <input
                type={showPass ? "text" : "password"}
                placeholder="Re-enter your password"
                value={form.confirm}
                onChange={e => update("confirm", e.target.value)}
                className={errors.confirm ? "input-error" : ""}
              />
            </div>
            {errors.confirm && <div className="field-error">{errors.confirm}</div>}
          </div>

          {/* Submit */}
          <button className="auth-btn" onClick={handleRegister} disabled={loading}>
            {loading ? <><div className="auth-spinner" /> Creating account...</> : "Create Account →"}
          </button>

          <div className="auth-divider"><span>or</span></div>

          <button className="auth-btn-outline" onClick={onGoLogin}>
            Already have an account? Sign in
          </button>
        </div>
      </div>
    </div>
  );
}
