import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingCart,
  CheckCircle,
  Clock,
  Package,
  AlertTriangle,
  User,
  Play,
  Check,
  TrendingUp,
  FileText,
  Calendar,
  ArrowRight
} from 'lucide-react';
import { analyticsAPI, attendanceAPI, tasksAPI } from '../services/api';
import './Dashboard.css';

const EmployeeDashboard = () => {
  const [stats, setStats] = useState({
    mySales: 0,
    mySalesAmount: 0,
    myOrders: 0,
    recentSales: []
  });
  const [attendance, setAttendance] = useState({
    marked: false,
    tapIn: null,
    tapOut: null
  });
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [attendanceRes, statsRes, tasksRes] = await Promise.all([
        attendanceAPI.check(),
        analyticsAPI.getDashboardStats(),
        tasksAPI.getAll()
      ]);

      if (attendanceRes.data.success) {
        setAttendance({
          marked: attendanceRes.data.data.marked,
          tapIn: attendanceRes.data.data.tap_in ? new Date(attendanceRes.data.data.tap_in) : null,
          tapOut: attendanceRes.data.data.tap_out ? new Date(attendanceRes.data.data.tap_out) : null
        });
      }

      if (statsRes.data.success) {
        const data = statsRes.data.data;
        setStats({
          mySales: data.my_sales || 0,
          mySalesAmount: data.my_sales_amount || 0,
          myOrders: data.my_orders || 0,
          recentSales: data.recent_sales || []
        });
      }

      if (tasksRes.data.success) {
        setTasks(tasksRes.data.data);
      }
    } catch (err) {
      console.error("Failed to load employee dashboard:", err);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const handleTapIn = async () => {
    setLoading(true);
    try {
      const res = await attendanceAPI.tapIn();
      if (res.data.success) {
        fetchDashboardData();
      }
    } catch (err) {
      alert("Failed to Tap In: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleTapOut = async () => {
    setLoading(true);
    try {
      const res = await attendanceAPI.tapOut();
      if (res.data.success) {
        fetchDashboardData();
      }
    } catch (err) {
      alert("Failed to Tap Out: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const startTask = async (taskId) => {
    try {
      await tasksAPI.updateProgress(taskId, { status: 'In Progress', progress: 50 });
      fetchDashboardData();
    } catch (err) {
      alert("Failed to update task: " + (err.response?.data?.message || err.message));
    }
  };

  const completeTask = async (taskId) => {
    try {
      await tasksAPI.updateProgress(taskId, { status: 'Completed', progress: 100 });
      fetchDashboardData();
    } catch (err) {
      alert("Failed to complete task: " + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="employee-dashboard-container">
      {/* Attendance & Shift Banner */}
      <div className="attendance-widget-banner">
        <div className="attendance-left">
          <h2>{getGreeting()}, {user.name || 'Staff Member'}!</h2>
          <p>
            {attendance.tapIn
              ? `Tapped In at ${attendance.tapIn.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Shift active`
              : 'Please mark your daily shift attendance to begin operations.'}
          </p>
        </div>

        <div className="attendance-right-actions">
          <div className="time-clock-display">
            <Clock size={18} />
            <span>{currentTime}</span>
          </div>

          {!attendance.marked ? (
            <button className="btn-tap-in" onClick={handleTapIn} disabled={loading}>
              Tap In Shift
            </button>
          ) : !attendance.tapOut ? (
            <button className="btn-tap-out" onClick={handleTapOut} disabled={loading}>
              Tap Out
            </button>
          ) : (
            <span style={{ fontWeight: 700, background: 'rgba(255,255,255,0.2)', padding: '8px 16px', borderRadius: 8 }}>
              ✓ Shift Completed
            </span>
          )}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="kpi-cards-grid">
        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Today's Sales Created</span>
            <div className="kpi-icon-pill purple"><ShoppingCart size={18} /></div>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-value">{stats.mySales} Sales</span>
            <span className="kpi-trend positive">Today</span>
          </div>
          <div className="kpi-footer-sub">
            <span>₹{stats.mySalesAmount.toLocaleString()} gross sales volume</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Pending Orders</span>
            <div className="kpi-icon-pill amber"><FileText size={18} /></div>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-value">{stats.myOrders}</span>
            <span className="kpi-trend neutral">Processing</span>
          </div>
          <div className="kpi-footer-sub">
            <span>Orders ready for customer pickup or dispatch</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Assigned Tasks</span>
            <div className="kpi-icon-pill green"><CheckCircle size={18} /></div>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-value">{tasks.filter(t => t.status !== 'Completed').length} Pending</span>
            <span className="kpi-trend positive">
              {tasks.filter(t => t.status === 'Completed').length} Done
            </span>
          </div>
          <div className="kpi-footer-sub">
            <span>Floor tasks assigned by manager</span>
          </div>
        </div>
      </div>


      {/* Two Column: Assigned Tasks & Recent Sales */}
      <div className="dashboard-two-col-row">
        {/* Assigned Tasks */}
        <div className="analytics-card">
          <div className="card-inner-header">
            <div>
              <h3>My Shift Tasks</h3>
              <p>Action items assigned to you</p>
            </div>
            <span className="pill-badge-indigo">{tasks.length} Total</span>
          </div>

          <div className="tasks-card-list">
            {tasks.length > 0 ? (
              tasks.map(task => (
                <div key={task.id} className="task-row-item">
                  <div className="task-left-info">
                    <div className="task-title-line">
                      <span>{task.title}</span>
                      <span className={`priority-pill ${task.priority.toLowerCase()}`}>
                        {task.priority}
                      </span>
                    </div>
                    <div className="task-desc-sub">{task.description}</div>
                  </div>

                  <div className="task-right-controls">
                    <div className="progress-track" title={`${task.progress}% complete`}>
                      <div className="progress-fill" style={{ width: `${task.progress}%` }}></div>
                    </div>

                    {task.status !== 'Completed' ? (
                      task.status === 'Assigned' ? (
                        <button className="btn-task-action" onClick={() => startTask(task.id)}>
                          <Play size={12} style={{ display: 'inline', marginRight: 4 }} /> Start
                        </button>
                      ) : (
                        <button className="btn-task-action" onClick={() => completeTask(task.id)}>
                          <Check size={12} style={{ display: 'inline', marginRight: 4 }} /> Complete
                        </button>
                      )
                    ) : (
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#10b981' }}>✓ Done</span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="all-good-box">
                <CheckCircle size={20} color="#10b981" />
                <span>No pending tasks assigned right now!</span>
              </div>
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="analytics-card">
          <div className="card-inner-header">
            <div>
              <h3>Recent Store Sales</h3>
              <p>Latest customer receipts generated</p>
            </div>
            <button className="text-link-btn" onClick={() => navigate('/employee/pos')}>
              Open POS <ArrowRight size={14} />
            </button>
          </div>

          <div className="alerts-table-wrapper">
            {stats.recentSales && stats.recentSales.length > 0 ? (
              <table className="mini-table">
                <thead>
                  <tr>
                    <th>Invoice</th>
                    <th>Time</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentSales.map((s, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 700, color: '#4338ca' }}>{s.invoice}</td>
                      <td>{s.time}</td>
                      <td style={{ fontWeight: 700 }}>₹{s.amount?.toLocaleString()}</td>
                      <td>
                        <span className="status-pill in-stock">
                          <CheckCircle size={10} /> {s.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="all-good-box">
                <ShoppingCart size={20} color="#6366f1" />
                <span>No sales transactions recorded yet today.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
