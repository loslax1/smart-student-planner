// client/src/pages/Dashboard.jsx
import { useState, useEffect, useRef } from "react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

// For editing events: turn ISO date into value for datetime-local input
function toLocalInputValue(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

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

// "MM/DD/YYYY H:MM AM/PM" (no commas, no seconds)
function formatDateTime(dateString) {
  const d = new Date(dateString);
  const datePart = d.toLocaleDateString(); // e.g. 11/10/2025
  const timePart = formatShortTime(d); // e.g. 2:20 PM
  return `${datePart} ${timePart}`;
}

export default function Dashboard() {
  const [events, setEvents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    type: "assignment",
    start_time: "",
    end_time: "",
    course_name: "",
  });

  // refs for datetime-local inputs
  const startInputRef = useRef(null);
  const endInputRef = useRef(null);

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

  // ===== Load events =====
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

  // ===== Load classes for widget =====
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

  // ===== Time windows =====
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

  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.start_time) - new Date(b.start_time)
  );

  // ===== Categorize events: today / ongoing / coming / overdue =====
  const categorizeEvent = (event) => {
    const start = new Date(event.start_time);
    const end = new Date(event.end_time);

    if (isNaN(start) || isNaN(end)) return "coming";

    // Overdue = end before today
    if (end < startOfToday) return "overdue";

    // Due today (end date is today)
    if (end >= startOfToday && end < endOfToday) return "today";

    // Coming up = start strictly in the future (tomorrow or later)
    if (start >= endOfToday) return "coming";

    // Ongoing = started before today and still continues after today
    // or started today and continues after today.
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

  // Stats for "this week at a glance" (calendar week Mon to Sun, based on start_time)
  const allThisWeek = sortedEvents.filter((e) => {
    const t = new Date(e.start_time);
    return t >= startOfWeek && t < endOfWeek;
  });

  const assignmentsCount = allThisWeek.filter(
    (e) => e.type === "assignment"
  ).length;
  const quizzesCount = allThisWeek.filter((e) => e.type === "quiz").length;
  const examsCount = allThisWeek.filter((e) => e.type === "exam").length;
  const thisWeekTotal = allThisWeek.length;

  // ===== TODAY'S CLASSES WIDGET =====
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

  // helper to open native datetime picker
  const openNativePicker = (inputRef) => {
    if (
      inputRef?.current &&
      typeof inputRef.current.showPicker === "function"
    ) {
      inputRef.current.showPicker();
    } else if (inputRef?.current) {
      inputRef.current.focus();
    }
  };

  // ===== Event form handlers =====
  const handleChange = (e) => {
    setNewEvent({ ...newEvent, [e.target.name]: e.target.value });
  };

  const resetForm = () =>
    setNewEvent({
      title: "",
      description: "",
      type: "assignment",
      start_time: "",
      end_time: "",
      course_name: "",
    });

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      ...newEvent,
      start_time: newEvent.start_time
        ? new Date(newEvent.start_time).toISOString()
        : null,
      end_time: newEvent.end_time
        ? new Date(newEvent.end_time).toISOString()
        : null,
    };

    try {
      if (editingId) {
        const { data: updated } = await axios.put(
          `${API_BASE}/api/events/${editingId}`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const updatedList = events
          .map((e) => (e.id === updated.id ? updated : e))
          .sort((a, b) => new Date(a.start_time) - new Date(b.start_time));

        setEvents(updatedList);
        setEditingId(null);
        resetForm();
      } else {
        const { data: created } = await axios.post(
          `${API_BASE}/api/events`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const updatedList = [...events, created].sort(
          (a, b) => new Date(a.start_time) - new Date(b.start_time)
        );
        setEvents(updatedList);
        resetForm();
      }
    } catch (err) {
      console.error("Save event error:", err);
      alert("Failed to save event.");
    }
  };

  const handleEdit = (evt) => {
    setEditingId(evt.id);
    setNewEvent({
      title: evt.title || "",
      description: evt.description || "",
      type: evt.type || "assignment",
      start_time: toLocalInputValue(evt.start_time),
      end_time: toLocalInputValue(evt.end_time),
      course_name: evt.course_name || "",
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    resetForm();
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this event?")) return;
    try {
      await axios.delete(`${API_BASE}/api/events/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEvents((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete event.");
    }
  };

  // ===== Render event row =====
  const renderEvent = (event) => {
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
              {event.course_name ? (
                <>
                  {" "}
                  · <em>{event.course_name}</em>
                </>
              ) : null}
            </div>

            {/* date range on a single line */}
            <div className="event-dates-inline">
              {formatDateTime(event.start_time)} -{" "}
              {formatDateTime(event.end_time)}
            </div>

            {event.description ? (
              <div className="event-desc">{event.description}</div>
            ) : null}
          </div>

          <div className="event-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => handleEdit(event)}
            >
              Edit
            </button>
            <button
              type="button"
              className="btn-danger"
              onClick={() => handleDelete(event.id)}
            >
              Delete
            </button>
          </div>
        </div>
      </li>
    );
  };

  return (
    <div className="dashboard">
      <h2 className="dashboard-heading">Welcome, {displayName} 👋</h2>

      {/* ===== Top hero: stats + classes ===== */}
      <div className="dashboard-top">
        {/* Quick stats card */}
        <div className="card dashboard-stats">
          <h3>This week at a glance</h3>
          <div className="stats-row">
            <div className="stat-pill">
              <span className="stat-label">This week</span>
              <span className="stat-value">{thisWeekTotal}</span>
            </div>
            <div className="stat-pill">
              <span className="stat-label">Assignments</span>
              <span className="stat-value">{assignmentsCount}</span>
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

        {/* TODAY'S CLASSES WIDGET */}
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
                      <div style={{ fontSize: "0.9rem", color: "#6b7280" }}>
                        {formatTime((cls.class_start_time || "").slice(0, 5))}
                        {" - "}
                        {formatTime((cls.class_end_time || "").slice(0, 5))}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* ===== Main grid: event form + event sections ===== */}
      <div className="dashboard-main-grid">
        {/* Add / Edit Event Form */}
        <form className="event-form event-card" onSubmit={handleSubmit}>
          <h3>{editingId ? "Edit Event" : "Add New Event"}</h3>

          <input
            type="text"
            name="title"
            placeholder="Title"
            value={newEvent.title}
            onChange={handleChange}
            required
          />

          <input
            type="text"
            name="course_name"
            placeholder="Course (optional)"
            value={newEvent.course_name}
            onChange={handleChange}
          />

          <textarea
            name="description"
            placeholder="Description"
            value={newEvent.description}
            onChange={(e) => {
              const value = e.target.value;
              setNewEvent({ ...newEvent, description: value });
              e.target.style.height = "auto";
              e.target.style.height = `${e.target.scrollHeight}px`;
            }}
            onFocus={(e) => {
              e.target.style.height = "auto";
              e.target.style.height = `${e.target.scrollHeight}px`;
            }}
          />

          <select
            name="type"
            value={newEvent.type}
            onChange={handleChange}
          >
            <option value="assignment">Assignment</option>
            <option value="quiz">Quiz</option>
            <option value="exam">Exam</option>
            <option value="timeblock">Time Block</option>
          </select>

          <label>Start</label>
          <input
            ref={startInputRef}
            type="datetime-local"
            name="start_time"
            value={newEvent.start_time}
            onChange={handleChange}
            required
            onClick={() => openNativePicker(startInputRef)}
            onFocus={() => openNativePicker(startInputRef)}
          />

          <label>End</label>
          <input
            ref={endInputRef}
            type="datetime-local"
            name="end_time"
            value={newEvent.end_time}
            onChange={handleChange}
            required
            onClick={() => openNativePicker(endInputRef)}
            onFocus={() => openNativePicker(endInputRef)}
          />

          <div className="event-form-actions">
            <button type="submit" className="btn-primary">
              {editingId ? "Save Changes" : "Add Event"}
            </button>
            {editingId && (
              <button
                type="button"
                className="btn-ghost"
                onClick={handleCancelEdit}
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        {/* Events sections */}
        <div className="events-list">
          <div className="events-section">
            <h3>Today</h3>
            {todayEvents.length === 0 ? (
              <p>No events today.</p>
            ) : (
              <ul>{todayEvents.map(renderEvent)}</ul>
            )}
          </div>

          <div className="events-section">
            <h3>Ongoing</h3>
            {ongoingEvents.length === 0 ? (
              <p>No ongoing items.</p>
            ) : (
              <ul>{ongoingEvents.map(renderEvent)}</ul>
            )}
          </div>

          <div className="events-section">
            <h3>Coming up</h3>
            {comingEvents.length === 0 ? (
              <p>No upcoming items.</p>
            ) : (
              <ul>{comingEvents.map(renderEvent)}</ul>
            )}
          </div>

          <div className="events-section">
            <h3>Overdue</h3>
            {overdueEvents.length === 0 ? (
              <p>Nice! Nothing overdue.</p>
            ) : (
              <ul>{overdueEvents.map(renderEvent)}</ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
