import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/apiClient";

export default function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const { data } = await api.post("/auth/login", { email, password });
      // save token + user
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // 🔔 tell App.jsx (the header) that auth state changed
      window.dispatchEvent(new Event("auth-change"));

      nav("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Server error during login.");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>Log In</h2>
        {error && <p className="auth-error">{error}</p>}
        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e)=>setEmail(e.target.value)}
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e)=>setPassword(e.target.value)}
              required
            />
          </label>
          <button type="submit" className="auth-button">Log In</button>
        </form>
        <p className="auth-footer">
          No account? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  );
}
