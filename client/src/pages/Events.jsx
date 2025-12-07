// client/src/pages/Events.jsx
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

export default function Events() {
  const [events, setEvents] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    type: "assignment",
    start_time: "",
    end_time: "",
    course_name: "",
  });

  const startInputRef = useRef(null);
  const endInputRef = useRef(null);

  const token = localStorage.getItem("token");

  // helper to load events
  const fetchEvents = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/events`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEvents(res.data || []);
    } catch (err) {
      console.error("Error loading events:", err);
    }
  };

  // load events on mount
  useEffect(() => {
    if (token) {
      fetchEvents();
    }
  }, [token]);

  // toggle completed
  const handleToggleComplete = async (event) => {
    try {
      await axios.patch(
        `${API_BASE}/api/events/${event.id}/complete`,
        { completed: !event.completed },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      await fetchEvents();
    } catch (err) {
      console.error("Error toggling completed:", err);
      alert("Failed to update event status.");
    }
  };

  // time windows and categorization
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

  const dow = startOfToday.getDay();
  const daysSinceMonday = (dow + 6) % 7;
  const startOfWeek = new Date(
    startOfToday.getFullYear(),
    startOfToday.getMonth(),
    startOfToday.getDate() - daysSinceMonday
  );
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 7);

  // split active vs completed
  const activeEvents = events.filter((e) => !e.completed);
  const completedEvents = events.filter((e) => e.completed);

  const sortedEvents = [...activeEvents].sort(
    (a, b) => new Date(a.start_time) - new Date(b.start_time)
  );

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

  // form handlers
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
        <div className={`events-card status-${status}`}>
          <div className="events-card-main">
            <div className="events-card-header">
              <span className={`status-pill status-${status}`}>
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

            <div className="events-card-dates">
              {formatDateTime(event.start_time)} -{" "}
              {formatDateTime(event.end_time)}
            </div>

            {event.description ? (
              <div className="events-card-desc">{event.description}</div>
            ) : null}
          </div>

          <div className="events-card-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => handleToggleComplete(event)}
            >
              {event.completed ? "Mark as not done" : "Mark as done"}
            </button>
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
    <div className="events-page">
      <h2>Events</h2>
      <p style={{ color: "#6b7280", marginBottom: "1rem" }}>
        Add and manage all of your assignments, quizzes, exams, and time blocks.
      </p>

      <div className="events-layout">
        {/* form column */}
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

        {/* sections column */}
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

          {completedEvents.length > 0 && (
            <div className="events-section">
              <h3>Completed</h3>
              <ul>
                {completedEvents
                  .sort(
                    (a, b) =>
                      new Date(a.end_time) - new Date(b.end_time)
                  )
                  .map((event) => (
                    <li key={event.id}>
                      <div className="events-card status-completed">
                        <div className="events-card-main">
                          <div className="events-card-header">
                            <strong>{event.title}</strong> ({event.type})
                            {event.course_name ? (
                              <>
                                {" "}
                                · <em>{event.course_name}</em>
                              </>
                            ) : null}
                          </div>
                          <div className="events-card-dates">
                            Finished {formatDateTime(event.end_time)}
                          </div>
                          {event.description ? (
                            <div className="events-card-desc">
                              {event.description}
                            </div>
                          ) : null}
                        </div>
                        <div className="events-card-actions">
                          <button
                            type="button"
                            className="btn-ghost"
                            onClick={() => handleToggleComplete(event)}
                          >
                            Move back to active
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
