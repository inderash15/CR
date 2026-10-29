import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { tasksAPI, authAPI } from '../services/api';
import './Products.css';
import {
  CheckCircle,
  Clock,
  AlertTriangle,
  Plus,
  X,
  User,
  Search,
  Filter,
  Calendar,
  ChevronDown,
  Play,
  Check,
  Trash2
} from 'lucide-react';

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const role = user.role?.toUpperCase();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assigned_to: '',
    priority: 'Medium',
    due_date: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tasksRes, usersRes] = await Promise.all([
        tasksAPI.getAll(),
        authAPI.getAllUsers()
      ]);
      if (tasksRes.data.success) setTasks(tasksRes.data.data);
      if (usersRes.data.success) setUsers(usersRes.data.data);
    } catch (err) {
      console.error('Error fetching tasks data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await tasksAPI.create(formData);
      if (res.data.success) {
        setShowModal(false);
        setFormData({ title: '', description: '', assigned_to: '', priority: 'Medium', due_date: '' });
        fetchData();
      }
    } catch (err) {
      alert("Error assigning task: " + (err.response?.data?.message || err.message));
    }
  };

  const handleUpdateProgress = async (id, newProgress, newStatus) => {
    try {
      await tasksAPI.updateProgress(id, { progress: newProgress, status: newStatus });
      fetchData();
    } catch (err) {
      alert("Failed to update task: " + (err.response?.data?.message || err.message));
    }
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      const matchesSearch =
        t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.assigned_to?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' || t.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [tasks, searchTerm, statusFilter]);

  return (
    <div className="shnoor-page-container">
      {/* Header matching reference image */}
      <div className="shnoor-page-header">
        <div className="shnoor-title-block">
          <h2>Task Management</h2>
          <p>Assign, track, and monitor operational floor and store responsibilities</p>
        </div>

        {(role === 'ADMIN' || role === 'MANAGER') && (
          <button className="btn-create-primary" onClick={() => setShowModal(true)}>
            <Plus size={18} />
            <span>Assign New Task</span>
          </button>
        )}
      </div>

      {/* KPI Cards for Tasks */}
      <div className="kpi-cards-grid" style={{ marginBottom: 20 }}>
        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Active Tasks</span>
            <div className="kpi-icon-pill amber"><Clock size={18} /></div>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-value">{tasks.filter(t => t.status !== 'Completed').length}</span>
            <span className="kpi-trend neutral">In Queue</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">High Priority / Urgent</span>
            <div className="kpi-icon-pill rose"><AlertTriangle size={18} /></div>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-value" style={{ color: '#dc2626' }}>
              {tasks.filter(t => t.priority === 'Urgent' || t.priority === 'High').length}
            </span>
            <span className="kpi-trend negative">Urgent</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Completed Successfully</span>
            <div className="kpi-icon-pill green"><CheckCircle size={18} /></div>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-value" style={{ color: '#16a34a' }}>
              {tasks.filter(t => t.status === 'Completed').length}
            </span>
            <span className="kpi-trend positive">✓ Done</span>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="shnoor-search-filter-bar">
        <div className="search-input-wrapper">
          <Search size={18} className="search-input-icon" />
          <input
            type="text"
            className="search-input-field"
            placeholder="Search tasks by title, description or assignee..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={{ position: 'relative' }}>
          <button
            className="filter-btn-trigger"
            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
          >
            <Filter size={16} />
            <span>Status: {statusFilter === 'all' ? 'All' : statusFilter}</span>
            <ChevronDown size={14} />
          </button>

          {showFilterDropdown && (
            <div className="dropdown-popover" style={{ right: 0, width: 180, padding: 8 }}>
              <div className="popover-title">Filter by Status</div>
              {['all', 'Assigned', 'In Progress', 'Completed'].map(s => (
                <div
                  key={s}
                  className={`dropdown-item ${statusFilter === s ? 'selected' : ''}`}
                  onClick={() => { setStatusFilter(s); setShowFilterDropdown(false); }}
                >
                  {s === 'all' ? 'All Tasks' : s}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sub Toolbar */}
      <div className="shnoor-sub-toolbar">
        <span className="showing-counter">
          Showing {filteredTasks.length} of {tasks.length} tasks
        </span>
      </div>

      {/* Tasks Table */}
      {loading ? (
        <div className="shnoor-empty-state">
          <div className="empty-icon-circle">
            <Clock size={28} className="animate-spin" />
          </div>
          <h3>Loading Tasks...</h3>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="shnoor-empty-state">
          <div className="empty-icon-circle">
            <CheckCircle size={28} />
          </div>
          <h3>No Tasks Found</h3>
          <p>No operational tasks match your filters.</p>
        </div>
      ) : (
        <div className="shnoor-table-container">
          <table className="shnoor-table">
            <thead>
              <tr>
                <th>Task Title</th>
                <th>Assigned To</th>
                <th>Priority</th>
                <th>Due Date</th>
                <th>Progress</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map(t => (
                <tr key={t.id}>
                  <td>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{t.title}</div>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{t.description}</div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="user-avatar-circle" style={{ width: 28, height: 28, fontSize: 12 }}>
                        {t.assigned_to ? t.assigned_to.charAt(0) : 'U'}
                      </div>
                      <span style={{ fontWeight: 600 }}>{t.assigned_to}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`priority-pill ${t.priority?.toLowerCase()}`}>
                      {t.priority}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#64748b' }}>
                      <Calendar size={13} />
                      <span>{t.due_date ? new Date(t.due_date).toLocaleDateString() : 'Flexible'}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="progress-track" style={{ width: 80 }}>
                        <div className="progress-fill" style={{ width: `${t.progress || 0}%` }}></div>
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700 }}>{t.progress || 0}%</span>
                    </div>
                  </td>
                  <td>
                    <span className={`status-pill ${
                      t.status === 'Completed' ? 'in-stock' :
                      t.status === 'In Progress' ? 'published' : 'low-stock'
                    }`}>
                      {t.status}
                    </span>
                  </td>
                  <td>
                    {t.status !== 'Completed' ? (
                      <button
                        className="btn-table-action"
                        onClick={() => handleUpdateProgress(t.id, 100, 'Completed')}
                      >
                        <Check size={12} style={{ display: 'inline', marginRight: 4 }} /> Complete
                      </button>
                    ) : (
                      <span style={{ color: '#10b981', fontWeight: 700, fontSize: 13 }}>✓ Done</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ASSIGN TASK MODAL */}
      {showModal &&
        createPortal(
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Assign Operational Task</h3>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setShowModal(false)}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="form-group-item" style={{ marginBottom: 14 }}>
                    <label>Task Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Audit low stock items in Men's Wear"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                    />
                  </div>

                  <div className="form-grid-2">
                    <div className="form-group-item">
                      <label>Assign To Staff *</label>
                      <select
                        required
                        value={formData.assigned_to}
                        onChange={(e) =>
                          setFormData({ ...formData, assigned_to: e.target.value })
                        }
                      >
                        <option value="">Select Employee...</option>
                        {users
                          .filter((u) => u.role !== 'ADMIN')
                          .map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.name} ({u.role})
                            </option>
                          ))}
                      </select>
                    </div>

                    <div className="form-group-item">
                      <label>Priority Level</label>
                      <select
                        value={formData.priority}
                        onChange={(e) =>
                          setFormData({ ...formData, priority: e.target.value })
                        }
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                        <option value="Urgent">Urgent</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group-item" style={{ marginBottom: 14 }}>
                    <label>Due Date</label>
                    <input
                      type="date"
                      value={formData.due_date}
                      onChange={(e) =>
                        setFormData({ ...formData, due_date: e.target.value })
                      }
                    />
                  </div>

                  <div className="form-group-item">
                    <label>Task Instructions / Description</label>
                    <textarea
                      rows="3"
                      placeholder="Specify action steps, aisle/rack numbers, or supplier guidelines..."
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn-secondary-cancel"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-create-primary">
                    Assign Task
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default Tasks;
