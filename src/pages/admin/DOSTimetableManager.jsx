import { useEffect, useState } from "react";
import { api, getApiError } from "../../api/client";
import { useAuth } from "../../context/AuthContext";

export default function DOSTimetableManager() {
  const { user } = useAuth();
  const [timetables, setTimetables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedTimetable, setSelectedTimetable] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    class_name: "",
    department: "",
    trade_level: "",
    academic_year: "2024-2025",
    term: "Term 1",
    schedule_data: {},
    status: "draft"
  });

  const [cadeauSyncing, setCadeauSyncing] = useState(false);
  const [cadeauStatus, setCadeauStatus] = useState({ classes: [], teachers: [] });

  useEffect(() => {
    loadTimetables();
  }, []);

  const loadTimetables = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/timetables");
      setTimetables(response.data || []);
    } catch (err) {
      setError(getApiError(err, "Failed to load timetables"));
    } finally {
      setLoading(false);
    }
  };

  const handleSyncFromCadeau = async () => {
    setCadeauSyncing(true);
    try {
      const response = await api.post("/timetables/sync-cadeau");
      setCadeauStatus({
        success: true,
        message: `Synced ${response.data.classes_count} classes and ${response.data.teachers_count} teachers`,
        timestamp: new Date().toISOString()
      });
      loadTimetables();
    } catch (err) {
      setCadeauStatus({
        success: false,
        message: getApiError(err, "Failed to sync with cadeau"),
        timestamp: new Date().toISOString()
      });
    } finally {
      setCadeauSyncing(false);
    }
  };

  const handleCreateTimetable = async (e) => {
    e.preventDefault();
    try {
      await api.post("/timetables", formData);
      setShowCreateForm(false);
      setFormData({
        class_name: "",
        department: "",
        trade_level: "",
        academic_year: "2024-2025",
        term: "Term 1",
        schedule_data: {},
        status: "draft"
      });
      loadTimetables();
    } catch (err) {
      setError(getApiError(err, "Failed to create timetable"));
    }
  };

  const handlePublishTimetable = async (id) => {
    try {
      await api.put(`/timetables/${id}`, { status: "published" });
      loadTimetables();
    } catch (err) {
      setError(getApiError(err, "Failed to publish timetable"));
    }
  };

  const handleDeleteTimetable = async (id) => {
    if (!confirm("Are you sure you want to delete this timetable?")) return;
    try {
      await api.delete(`/timetables/${id}`);
      loadTimetables();
    } catch (err) {
      setError(getApiError(err, "Failed to delete timetable"));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="dos-timetable-manager">
      <div className="manager-header">
        <h1>Timetable Management</h1>
        <p>Welcome, {user?.full_name || user?.username} (Director of Subject)</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      {cadeauStatus.message && (
        <div className={`status-message ${cadeauStatus.success ? 'success' : 'error'}`}>
          {cadeauStatus.message}
          <br />
          <small>{cadeauStatus.timestamp}</small>
        </div>
      )}

      <div className="manager-actions">
        <button
          onClick={handleSyncFromCadeau}
          disabled={cadeauSyncing}
          className="btn btn-primary"
        >
          {cadeauSyncing ? "Syncing..." : "Sync from Cadeau AI"}
        </button>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="btn btn-secondary"
        >
          {showCreateForm ? "Cancel" : "Create Timetable"}
        </button>
      </div>

      {showCreateForm && (
        <div className="create-form-container">
          <h2>Create New Timetable</h2>
          <form onSubmit={handleCreateTimetable} className="create-form">
            <div className="form-row">
              <div className="form-group">
                <label>Class Name</label>
                <input
                  type="text"
                  name="class_name"
                  value={formData.class_name}
                  onChange={handleInputChange}
                  placeholder="e.g., Level 3 SOD"
                  required
                />
              </div>
              <div className="form-group">
                <label>Department</label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Department</option>
                  <option value="ICT">ICT</option>
                  <option value="FAD">Fashion Design (FAD)</option>
                  <option value="ACC">Accounting (ACC)</option>
                </select>
              </div>
              <div className="form-group">
                <label>Trade Level</label>
                <input
                  type="text"
                  name="trade_level"
                  value={formData.trade_level}
                  onChange={handleInputChange}
                  placeholder="e.g., L3 SWD"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Academic Year</label>
                <input
                  type="text"
                  name="academic_year"
                  value={formData.academic_year}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Term</label>
                <select
                  name="term"
                  value={formData.term}
                  onChange={handleInputChange}
                  required
                >
                  <option value="Term 1">Term 1</option>
                  <option value="Term 2">Term 2</option>
                  <option value="Term 3">Term 3</option>
                </select>
              </div>
              <div className="form-group">
                <label>Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Schedule Data (JSON)</label>
              <textarea
                name="schedule_data"
                value={JSON.stringify(formData.schedule_data, null, 2)}
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value);
                    setFormData(prev => ({ ...prev, schedule_data: parsed }));
                  } catch {
                    // Invalid JSON, ignore
                  }
                }}
                rows="10"
                placeholder='{"8:00-8:50": {"Monday": "MATH(1)", "Tuesday": "ENG(2)"}}'
              />
              <small>Format: {"{time_slot: {day: subject(teacher_code)}}"}</small>
            </div>

            <button type="submit" className="btn btn-primary">
              Create Timetable
            </button>
          </form>
        </div>
      )}

      <div className="timetables-list">
        <h2>All Timetables</h2>
        {loading ? (
          <p>Loading timetables...</p>
        ) : timetables.length === 0 ? (
          <p>No timetables found. Sync from Cadeau AI or create one manually.</p>
        ) : (
          <div className="timetables-grid">
            {timetables.map((tt) => (
              <div key={tt.id} className="timetable-card">
                <div className="card-header">
                  <h3>{tt.class_name}</h3>
                  <span className={`status-badge status-${tt.status}`}>{tt.status}</span>
                </div>
                <div className="card-body">
                  <p><strong>Department:</strong> {tt.department}</p>
                  <p><strong>Trade Level:</strong> {tt.trade_level}</p>
                  <p><strong>Academic Year:</strong> {tt.academic_year}</p>
                  <p><strong>Term:</strong> {tt.term}</p>
                  <p><strong>Created by:</strong> {tt.created_by_name || tt.created_by_username || "System"}</p>
                </div>
                <div className="card-actions">
                  <button
                    onClick={() => setSelectedTimetable(tt)}
                    className="btn btn-sm btn-primary"
                  >
                    View
                  </button>
                  {tt.status === "draft" && (
                    <button
                      onClick={() => handlePublishTimetable(tt.id)}
                      className="btn btn-sm btn-success"
                    >
                      Publish
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteTimetable(tt.id)}
                    className="btn btn-sm btn-danger"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedTimetable && (
        <div className="timetable-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{selectedTimetable.class_name} - Timetable</h2>
              <button onClick={() => setSelectedTimetable(null)} className="btn-close">
                ×
              </button>
            </div>
            <div className="modal-body">
              <TimetableViewer schedule={selectedTimetable.schedule_data} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TimetableViewer({ schedule }) {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const sortedTimes = Object.keys(schedule || {}).sort((a, b) => {
    const timeA = parseInt(a.split(":")[0]);
    const timeB = parseInt(b.split(":")[0]);
    return timeA - timeB;
  });

  if (!schedule || sortedTimes.length === 0) {
    return <p>No schedule data available</p>;
  }

  return (
    <div className="timetable-grid-container">
      <table className="timetable-table">
        <thead>
          <tr>
            <th>Time</th>
            {days.map((day) => (
              <th key={day}>{day}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedTimes.map((time) => (
            <tr key={time}>
              <td className="time-cell">{time}</td>
              {days.map((day) => {
                const cellValue = schedule[time][day] || "--";
                const isFixed = ["ASSEMBLY", "BREAK", "LUNCH"].includes(cellValue.toUpperCase());
                return (
                  <td key={day} className={isFixed ? "fixed-cell" : "schedule-cell"}>
                    {cellValue}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
