import "./App.css";
import {
  Routes,
  Route,
  Navigate,
  Link,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { useEffect, useState } from "react";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Classes from "./pages/Classes";

export default function App() {
  const [isAuthed, setIsAuthed] = useState(!!localStorage.getItem("token"));
  const nav = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const onChange = () => setIsAuthed(!!localStorage.getItem("token"));
    window.addEventListener("auth-change", onChange);
    return () => window.removeEventListener("auth-change", onChange);
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.dispatchEvent(new Event("auth-change"));
    nav("/login");
  };

  const isAuthPage =
    location.pathname === "/login" || location.pathname === "/register";

  return (
    <div className="app">
      <header className="app-header">
        <h1>Smart Student Planner</h1>
        <p>Plan your classes, assignments, and daily routines in one place.</p>

        <nav className="nav-links">
          {!isAuthed || isAuthPage ? (
            <>
              <Link to="/login">Login</Link>
              <span>·</span>
              <Link to="/register">Register</Link>
            </>
          ) : (
            <>
              <Link to="/dashboard">Dashboard</Link>
              <span>·</span>
              <Link to="/classes">Classes</Link>
              <span>·</span>
              <Link to="/profile">Profile</Link>
              <span>·</span>
              <button onClick={logout} className="linklike">
                Logout
              </button>
            </>
          )}
        </nav>
      </header>

      <main className="app-main">
        <Routes>
          <Route
            path="/"
            element={<Navigate to={isAuthed ? "/dashboard" : "/login"} />}
          />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/dashboard"
            element={isAuthed ? <Dashboard /> : <Navigate to="/login" />}
          />
          <Route
            path="/classes"
            element={isAuthed ? <Classes /> : <Navigate to="/login" />}
          />
          <Route
            path="/profile"
            element={isAuthed ? <Profile /> : <Navigate to="/login" />}
          />
        </Routes>
      </main>
    </div>
  );
}
