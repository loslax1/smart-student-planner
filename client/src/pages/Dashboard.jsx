import { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

// Simple HH:MM AM/PM (for class times, no seconds)
function formatTime(t) {
  if (!t) return "";
  const [hStr, mStr] = t.split(":");
  let h = parseInt(hStr, 10);
  const m = mStr ?? "00";
  const ampm = h >= 12 ? "PM" : "AM";
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return `${h}:${m} ${ampm}`;
}

// Time without seconds based on a Date object
function formatShortTime(date) {
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

// "MM/DD/YYYY H:MM AM/PM"
function formatDateTime(dateString) {
  const d = new Date(dateString);
  const datePart = d.toLocaleDateString();
  const timePart = formatShortTime(d);
  return `${datePart} ${timePart}`;
}

export default function Dashboard() {
  const [events, setEvents] = useState([]);
  const [classes, setClasses] = useState([]);

  const token = localStorage.getItem("token");

  // Friendly welcome text
  const storedUser = localStorage.getItem("user");
  let displayName = "Student";
  try {
    if (storedUser) {
      const u = JSON.parse(storedUser);
      displayName = u.full_name || "Student";
    }
  } catch {
    // ignore parse errors
  }

  // Load events
  useEffect(() => {
    async function fetchEvents() {
      try {
        const res = await axios.get(`${API_BASE}/api/events`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setEvents(
          [...res.data].sort(
            (a, b) => new Date(a.start_time) - new Date(b.start_time)
          )
        );
      } catch (err) {
        console.error("Error loading events:", err);
      }
    }
    if (token) fetchEvents();
  }, [token]);

  // Load classes
  useEffect(() => {
    async function fetchClasses() {
      try {
        const res = await axios.get(`${API_BASE}/api/classes`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setClasses(res.data || []);
      } catch (err) {
        console.error("Error loading classes:", err);
      }
    }
    if (token) fetchClasses();
  }, [token]);

  // Time windows
  const now = new Date();

  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );
  const endOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1
  );

  const dow = startOfToday.getDay(); // 0-6
  const daysSinceMonday = (dow + 6) % 7;
  const startOfWeek = new Date(
    startOfToday.getFullYear(),
    startOfToday.getMonth(),
    startOfToday.getDate() - daysSinceMonday
  );
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 7);

  // Only use active (not completed) events on the dashboard
const activeEvents = events.filter((e) => !e.completed);

const sortedEvents = [...activeEvents].sort(
  (a, b) => new Date(a.start_time) - new Date(b.start_time)
);


  // Categorize events: today / ongoing / coming / overdue
  const categorizeEvent = (event) => {
    const start = new Date(event.start_time);
    const end = new Date(event.end_time);

    if (isNaN(start) || isNaN(end)) return "coming";

    if (end < startOfToday) return "overdue";
    if (end >= startOfToday && end < endOfToday) return "today";
    if (start >= endOfToday) return "coming";
    return "ongoing";
  };

  const todayEvents = sortedEvents.filter(
    (e) => categorizeEvent(e) === "today"
  );
  const ongoingEvents = sortedEvents.filter(
    (e) => categorizeEvent(e) === "ongoing"
  );
  const comingEvents = sortedEvents.filter(
    (e) => categorizeEvent(e) === "coming"
  );
  const overdueEvents = sortedEvents.filter(
    (e) => categorizeEvent(e) === "overdue"
  );

  // Stats for "this week at a glance"
  const allThisWeek = sortedEvents.filter((e) => {
    const start = new Date(e.start_time);
    const end = new Date(e.end_time);

    if (isNaN(start) || isNaN(end)) return false;

    return start <= endOfWeek && end >= startOfWeek;
  });

  const assignmentsCount = allThisWeek.filter(
    (e) => e.type === "assignment"
  ).length;
  const quizzesCount = allThisWeek.filter((e) => e.type === "quiz").length;
  const examsCount = allThisWeek.filter((e) => e.type === "exam").length;
  const timeblocksCount = allThisWeek.filter(
    (e) => e.type === "timeblock"
  ).length;
  const thisWeekTotal = allThisWeek.length;

  // TODAY'S CLASSES WIDGET
  const todayStr = now.toISOString().slice(0, 10); // YYYY-MM-DD
  const todayDow = now.getDay(); // 0-6

  const isClassToday = (cls) => {
    if (!Array.isArray(cls.days_of_week)) return false;
    if (!cls.days_of_week.includes(todayDow)) return false;

    const startStr = (cls.start_date || "").slice(0, 10);
    const endStr = (cls.end_date || "").slice(0, 10);
    if (!startStr || !endStr) return false;

    return todayStr >= startStr && todayStr <= endStr;
  };

  const todaysClasses = classes.filter(isClassToday);

  // helper to render colored event rows on dashboard
  const renderDashboardEvent = (event) => {
    const status = categorizeEvent(event);

    const statusLabel =
      status === "overdue"
        ? "Overdue"
        : status === "today"
        ? "Today"
        : status === "ongoing"
        ? "Ongoing"
        : "Coming up";

    return (
      <li key={event.id}>
        <div className={`event-item status-${status}`}>
          <div className="event-main">
            <div className="event-title-row">
              <span className={`event-badge status-${status}`}>
                {statusLabel.toUpperCase()}
              </span>
              <strong>{event.title}</strong> ({event.type})
            </div>
            <div className="event-dates-inline">
              Due {formatDateTime(event.end_time)}
            </div>
          </div>
        </div>
      </li>
    );
  };

  const todayLabel = now.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="dashboard">
      <div className="dashboard-header-row">
        <div>
          <h2 className="dashboard-heading">Welcome, {displayName} 👋</h2>
          <p className="dashboard-subtitle">
            Here is a quick snapshot of your classes and deadlines.
          </p>
        </div>
        <div className="dashboard-header-meta">
          <span className="dashboard-today-chip">{todayLabel}</span>
        </div>
      </div>

      <div className="dashboard-layout">
        {/* Main column: stats + summary */}
        <div className="dashboard-main-column">
          {/* Quick stats card */}
          <div className="card dashboard-stats">
            <h3>This week at a glance</h3>
            <div className="stats-row">
              <div className="stat-pill">
                <span className="stat-label">This week</span>
                <span className="stat-value">{thisWeekTotal}</span>
              </div>
              <div className="stat-pill">
                <span className="stat-label">Classes</span>
                <span className="stat-value">{classes.length}</span>
              </div>
              <div className="stat-pill">
                <span className="stat-label">Assignments</span>
                <span className="stat-value">{assignmentsCount}</span>
              </div>
              <div className="stat-pill">
                <span className="stat-label">Timeblocks</span>
                <span className="stat-value">{timeblocksCount}</span>
              </div>
              <div className="stat-pill">
                <span className="stat-label">Quizzes</span>
                <span className="stat-value">{quizzesCount}</span>
              </div>
              <div className="stat-pill">
                <span className="stat-label">Exams</span>
                <span className="stat-value">{examsCount}</span>
              </div>
            </div>
          </div>

          {/* Events summary widget */}
          <div className="card dashboard-summary-card">
            <h3>Events summary</h3>
            <div className="stats-row stats-row-compact">
              <div className="stat-pill">
                <span className="stat-label">Today</span>
                <span className="stat-value">{todayEvents.length}</span>
              </div>
              <div className="stat-pill">
                <span className="stat-label">Coming up</span>
                <span className="stat-value">{comingEvents.length}</span>
              </div>
              <div className="stat-pill">
                <span className="stat-label">Ongoing</span>
                <span className="stat-value">{ongoingEvents.length}</span>
              </div>
              <div className="stat-pill">
                <span className="stat-label">Overdue</span>
                <span className="stat-value">{overdueEvents.length}</span>
              </div>
            </div>

            {comingEvents.length > 0 && (
              <>
                <h4
                  style={{ marginTop: "0.75rem", marginBottom: "0.25rem" }}
                >
                  Next up
                </h4>
                <ul className="events-widget-list">
                  {comingEvents.slice(0, 3).map(renderDashboardEvent)}
                </ul>
              </>
            )}

            <p style={{ marginTop: "0.9rem", fontSize: "0.9rem" }}>
              Manage all details on the{" "}
              <Link to="/events" style={{ fontWeight: 600 }}>
                Events page
              </Link>
              .
            </p>
          </div>
        </div>

        {/* Side column: today's classes and today's events */}
        <div className="dashboard-side-column">
          {/* Today's classes widget */}
          <div className="card classes-widget">
            <h3>Today&apos;s Classes</h3>
            {todaysClasses.length === 0 ? (
              <>
                <p>No classes scheduled today.</p>
                <p style={{ fontSize: "0.9rem", color: "#6b7280" }}>
                  Manage classes on the <strong>Classes</strong> page.
                </p>
              </>
            ) : (
              <ul className="classes-today-list">
                {todaysClasses.map((cls) => (
                  <li key={cls.id}>
                    <div className="classes-today-row">
                      <div>
                        <strong>{cls.course_name}</strong>
                        {cls.location ? ` · ${cls.location}` : ""}
                        <div
                          style={{ fontSize: "0.9rem", color: "#6b7280" }}
                        >
                          {formatTime(
                            (cls.class_start_time || "").slice(0, 5)
                          )}
                          {" - "}
                          {formatTime(
                            (cls.class_end_time || "").slice(0, 5)
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Today's events card */}
          <div className="card dashboard-today-card">
            <h3>Today&apos;s Events</h3>
            {todayEvents.length === 0 ? (
              <p>No events due today. You are all caught up.</p>
            ) : (
              <ul className="events-widget-list">
                {todayEvents.slice(0, 5).map(renderDashboardEvent)}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
