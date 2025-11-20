// client/src/pages/Profile.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/apiClient";

export default function Profile() {
  const nav = useNavigate();

  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState({ full_name: "", email: "" });

  const [name, setName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [nameMsg, setNameMsg] = useState("");

  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [savingPw, setSavingPw] = useState(false);
  const [pwMsg, setPwMsg] = useState("");

  // Early guard: if no token, bounce to login
  useEffect(() => {
    if (!localStorage.getItem("token")) {
      nav("/login");
    }
  }, [nav]);

  // Load current user profile
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/user/me");
        setMe(data);
        setName(data.full_name || "");
      } catch (err) {
        console.error(err);
        // if unauthorized, go to login
        nav("/login");
      } finally {
        setLoading(false);
      }
    })();
  }, [nav]);

  const saveName = async (e) => {
    e.preventDefault();
    setSavingName(true);
    setNameMsg("");
    try {
      const { data } = await api.put("/user/me", { full_name: name });
      setMe(data);

      // keep local user cache in sync
      const stored = localStorage.getItem("user");
      if (stored) {
        try {
          const u = JSON.parse(stored);
          u.full_name = data.full_name;
          localStorage.setItem("user", JSON.stringify(u));
          window.dispatchEvent(new Event("auth-change"));
        } catch {
          /* ignore json parse error */
        }
      }

      setNameMsg("Saved!");
    } catch (err) {
      setNameMsg(err.response?.data?.message || "Failed to save name.");
    } finally {
      setSavingName(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    setPwMsg("");

    if (pw.next !== pw.confirm) {
      setPwMsg("New password and confirmation do not match.");
      return;
    }

    setSavingPw(true);
    try {
      await api.put("/user/password", {
        current_password: pw.current,
        new_password: pw.next,
      });
      setPw({ current: "", next: "", confirm: "" });
      setPwMsg("Password updated ✅");
    } catch (err) {
      setPwMsg(err.response?.data?.message || "Failed to change password.");
    } finally {
      setSavingPw(false);
    }
  };

  if (loading) {
    return (
      <div className="auth-page">
        <div className="auth-card">Loading…</div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: 520 }}>
        <h2>Profile / Settings</h2>
        <p className="auth-subtitle">Manage your account details.</p>

        {/* Display name + email */}
        <form className="auth-form" onSubmit={saveName}>
          <label>
            Display Name
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>

          <label>
            Email (read-only)
            <input type="email" value={me.email || ""} disabled />
          </label>

          <button type="submit" className="auth-button" disabled={savingName}>
            {savingName ? "Saving…" : "Save Name"}
          </button>

          {nameMsg && <div className="auth-footer">{nameMsg}</div>}
        </form>

        <hr style={{ borderColor: "#1f2937", margin: "1.25rem 0" }} />

        {/* Change password */}
        <h3>Change Password</h3>
        <form className="auth-form" onSubmit={changePassword}>
          <label>
            Current Password
            <input
              type="password"
              value={pw.current}
              onChange={(e) => setPw({ ...pw, current: e.target.value })}
              required
            />
          </label>

          <label>
            New Password
            <input
              type="password"
              value={pw.next}
              onChange={(e) => setPw({ ...pw, next: e.target.value })}
              required
            />
          </label>

          <label>
            Confirm New Password
            <input
              type="password"
              value={pw.confirm}
              onChange={(e) => setPw({ ...pw, confirm: e.target.value })}
              required
            />
          </label>

          <button type="submit" className="auth-button" disabled={savingPw}>
            {savingPw ? "Updating…" : "Update Password"}
          </button>

          {pwMsg && <div className="auth-footer">{pwMsg}</div>}
        </form>
      </div>
    </div>
  );
}
