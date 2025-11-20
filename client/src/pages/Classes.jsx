// client/src/pages/Classes.jsx
import { useEffect, useState, useRef } from "react";
import api from "../api/apiClient";

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// helper to format TIME strings like "18:30:00" or "18:30"
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

function formatDate(d) {
  if (!d) return "";
  // d might be "2025-11-20T00:00:00.000Z" – just use the date part
  return new Date(d).toLocaleDateString();
}

export default function Classes() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    id: null,
    course_name: "",
    location: "",
    days_of_week: [], // array of numbers, 0-6 (Sun-Sat)
    start_date: "",
    end_date: "",
    class_start_time: "",
    class_end_time: "",
  });

  const [saving, setSaving] = useState(false);

  // refs for native pickers
  const startDateRef = useRef(null);
  const endDateRef = useRef(null);
  const startTimeRef = useRef(null);
  const endTimeRef = useRef(null);

  const openNativePicker = (ref) => {
    if (ref.current) {
      if (typeof ref.current.showPicker === "function") {
        ref.current.showPicker();
      } else {
        ref.current.focus();
      }
    }
  };

  // load classes on mount
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/classes");
        setClasses(data || []);
      } catch (err) {
        console.error(err);
        setError("Could not load classes.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const toggleDay = (index) => {
    setForm((prev) => {
      const exists = prev.days_of_week.includes(index);
      const nextDays = exists
        ? prev.days_of_week.filter((d) => d !== index)
        : [...prev.days_of_week, index];
      return { ...prev, days_of_week: nextDays.sort((a, b) => a - b) };
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setForm({
      id: null,
      course_name: "",
      location: "",
      days_of_week: [],
      start_date: "",
      end_date: "",
      class_start_time: "",
      class_end_time: "",
    });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const payload = {
        course_name: form.course_name,
        location: form.location || null,
        days_of_week: form.days_of_week,
        // dates already come as "YYYY-MM-DD" from <input type="date">
        start_date: form.start_date,
        end_date: form.end_date,
        // times already "HH:MM" from <input type="time">
        class_start_time: form.class_start_time,
        class_end_time: form.class_end_time,
      };

      if (!payload.course_name || payload.days_of_week.length === 0) {
        setError("Course name and at least one day are required.");
        setSaving(false);
        return;
      }

      if (form.id) {
        const { data: updated } = await api.put(
          `/classes/${form.id}`,
          payload
        );
        setClasses((prev) =>
          prev.map((c) => (c.id === updated.id ? updated : c))
        );
      } else {
        const { data: created } = await api.post("/classes", payload);
        setClasses((prev) => [...prev, created]);
      }

      resetForm();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Internal server error.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (cls) => {
    setForm({
      id: cls.id,
      course_name: cls.course_name || "",
      location: cls.location || "",
      days_of_week: cls.days_of_week || [],
      // strip to "YYYY-MM-DD"
      start_date: cls.start_date?.slice(0, 10) || "",
      end_date: cls.end_date?.slice(0, 10) || "",
      // times come back like "18:30:00" – cut to "18:30"
      class_start_time: (cls.class_start_time || "").slice(0, 5),
      class_end_time: (cls.class_end_time || "").slice(0, 5),
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this class?")) return;
    try {
      await api.delete(`/classes/${id}`);
      setClasses((prev) => prev.filter((c) => c.id !== id));
      if (form.id === id) resetForm();
    } catch (err) {
      console.error(err);
      alert("Failed to delete class.");
    }
  };

  const dayChip = (idx, label) => {
    const active = form.days_of_week.includes(idx);
    return (
      <button
        type="button"
        key={idx}
        className={`day-chip ${active ? "day-chip-active" : ""}`}
        onClick={() => toggleDay(idx)}
      >
        <input type="checkbox" checked={active} readOnly />
        <span>{label}</span>
      </button>
    );
  };

  return (
    <div className="dashboard">
      <h2>Your Classes</h2>
      <p style={{ color: "#9ca3af", marginBottom: "1.25rem" }}>
        Add your class schedule so your dashboard can highlight today&apos;s
        classes.
      </p>

      <div className="classes-layout">
        {/* LEFT: form */}
        <div className="card classes-card">
          <h3>{form.id ? "Edit Class" : "Add Class"}</h3>

          {error && <div className="auth-error">{error}</div>}

          <form className="auth-form" onSubmit={handleSubmit}>
            <label>
              Course name
              <input
                type="text"
                name="course_name"
                value={form.course_name}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              Location (optional)
              <input
                type="text"
                name="location"
                value={form.location}
                onChange={handleChange}
              />
            </label>

            <div>
              <span style={{ fontSize: "0.9rem" }}>Days of week</span>
              <div className="day-chip-row">
                {dayChip(1, "Mon")}
                {dayChip(2, "Tue")}
                {dayChip(3, "Wed")}
                {dayChip(4, "Thu")}
                {dayChip(5, "Fri")}
                {dayChip(6, "Sat")}
                {dayChip(0, "Sun")}
              </div>
            </div>

            <div className="classes-row">
              <label>
                Start date
                <input
                  ref={startDateRef}
                  type="date"
                  name="start_date"
                  value={form.start_date}
                  onChange={handleChange}
                  onClick={() => openNativePicker(startDateRef)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      openNativePicker(startDateRef);
                    }
                  }}
                  required
                />
              </label>
              <label>
                End date
                <input
                  ref={endDateRef}
                  type="date"
                  name="end_date"
                  value={form.end_date}
                  onChange={handleChange}
                  onClick={() => openNativePicker(endDateRef)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      openNativePicker(endDateRef);
                    }
                  }}
                  required
                />
              </label>
            </div>

            <div className="classes-row">
              <label>
                Class starts
                <input
                  ref={startTimeRef}
                  type="time"
                  name="class_start_time"
                  value={form.class_start_time}
                  onChange={handleChange}
                  onClick={() => openNativePicker(startTimeRef)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      openNativePicker(startTimeRef);
                    }
                  }}
                  required
                />
              </label>
              <label>
                Class ends
                <input
                  ref={endTimeRef}
                  type="time"
                  name="class_end_time"
                  value={form.class_end_time}
                  onChange={handleChange}
                  onClick={() => openNativePicker(endTimeRef)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      openNativePicker(endTimeRef);
                    }
                  }}
                  required
                />
              </label>
            </div>

            <button type="submit" className="auth-button" disabled={saving}>
              {saving
                ? form.id
                  ? "Saving…"
                  : "Adding…"
                : form.id
                ? "Save Class"
                : "Add Class"}
            </button>
          </form>
        </div>

        {/* RIGHT: list */}
        <div className="card classes-card">
          <h3>Saved classes</h3>
          {loading ? (
            <p>Loading…</p>
          ) : classes.length === 0 ? (
            <p>No classes yet. Add one on the left.</p>
          ) : (
            <ul className="classes-list">
              {classes.map((cls) => (
                <li key={cls.id} className="classes-item">
                  <div>
                    <div style={{ marginBottom: "0.25rem" }}>
                      <strong>{cls.course_name}</strong>
                      {cls.location ? ` · ${cls.location}` : ""}
                    </div>
                    <div style={{ fontSize: "0.9rem", color: "#9ca3af" }}>
                      {cls.days_of_week
                        ?.map((d) => dayNames[d])
                        .join(", ") || ""}
                    </div>
                    <div style={{ fontSize: "0.9rem", marginTop: "0.25rem" }}>
                      {formatTime(cls.class_start_time)}–{" "}
                      {formatTime(cls.class_end_time)}
                      {"  ("}
                      {formatDate(cls.start_date)} → {formatDate(cls.end_date)}
                      {")"}
                    </div>
                  </div>
                  <div style={{ whiteSpace: "nowrap" }}>
                    <button
                      type="button"
                      onClick={() => handleEdit(cls)}
                      style={{ marginRight: ".5rem" }}
                    >
                      Edit
                    </button>
                    <button type="button" onClick={() => handleDelete(cls.id)}>
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
