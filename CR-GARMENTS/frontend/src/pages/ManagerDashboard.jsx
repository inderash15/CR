import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { analyticsAPI, ordersAPI, tasksAPI } from '../services/api';
import './Dashboard.css';
import {
  TrendingUp,
  ShoppingCart,
  AlertTriangle,
  Users,
  Package,
  CheckCircle,
  Clock,
  ArrowUpRight,
  Plus,
  ChevronRight,
  FileText
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts';

const ManagerDashboard = () => {
  const [stats, setStats] = useState({
    todaySales: 0,
    todayOrders: 0,
    pendingOrders: 0,
    totalProducts: 0,
    lowStockCount: 0,
    lowStockItems: [],
    pendingOrdersList: [],
    overdueTasksCount: 0,
    overdueTasks: [],
    tasksCompleted: 0,
    tasksPending: 0,
    employeesPresent: 0,
    employeesAbsent: 0,
    chartData: []
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await analyticsAPI.getDashboardStats();
        if (response.data.success) {
          const data = response.data.data;
          setStats({
            todaySales: data.today_sales || 0,
            todayOrders: data.today_orders || 0,
            pendingOrders: data.pending_orders || 0,
            totalProducts: data.total_products || 0,
            lowStockCount: data.low_stock_count || 0,
            lowStockItems: data.low_stock_items || [],
            pendingOrdersList: data.pending_orders_list || [],
            overdueTasksCount: data.overdue_tasks_count || 0,
            overdueTasks: data.overdue_tasks || [],
            tasksCompleted: data.tasks_completed || 0,
            tasksPending: data.tasks_pending || 0,
            employeesPresent: data.employees_present || 0,
            employeesAbsent: data.employees_absent || 0,
            chartData: data.chart_data || []
          });
        }
      } catch (err) {
        console.error("Error fetching manager stats", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  if (loading) {
    return (
      <div className="shnoor-empty-state" style={{ marginTop: 40 }}>
        <div className="empty-icon-circle">
          <Package size={28} className="animate-spin" />
        </div>
        <h3>Loading Manager Overview...</h3>
        <p>Fetching operations and team assignments.</p>
      </div>
    );
  }

  const attentionTotal = stats.lowStockCount + stats.pendingOrders + stats.overdueTasksCount;

  return (
    <div className="manager-dashboard-container">
      {/* Header Banner */}
      <div className="dashboard-header-clean">
        <h2>
          {getGreeting()}, {user.name}
        </h2>
        <p>
          Operational overview for{' '}
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="kpi-cards-grid">
        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Today's Store Sales</span>
            <div className="kpi-icon-pill purple"><TrendingUp size={18} /></div>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-value">₹{stats.todaySales.toLocaleString()}</span>
            <span className="kpi-trend positive"><ArrowUpRight size={14} /> +8%</span>
          </div>
          <div className="kpi-footer-sub">
            <span>{stats.todayOrders} customer checkout transactions</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Pending Orders</span>
            <div className="kpi-icon-pill amber"><ShoppingCart size={18} /></div>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-value">{stats.pendingOrders}</span>
            <span className={`kpi-trend ${stats.pendingOrders > 0 ? 'negative' : 'positive'}`}>
              {stats.pendingOrders > 0 ? 'Fulfillment Req' : 'All Clear'}
            </span>
          </div>
          <div className="kpi-footer-sub">
            <span>Awaiting packing or delivery confirmation</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Staff Attendance</span>
            <div className="kpi-icon-pill green"><Users size={18} /></div>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-value">{stats.employeesPresent} Present</span>
            <span className={`kpi-trend ${stats.employeesAbsent > 0 ? 'neutral' : 'positive'}`}>
              {stats.employeesAbsent} Absent
            </span>
          </div>
          <div className="kpi-footer-sub">
            <span>All on-duty shifts marked today</span>
          </div>
        </div>

        <div className="kpi-card" style={{ borderColor: stats.lowStockCount > 0 ? '#fde68a' : '#e2e8f0' }}>
          <div className="kpi-top">
            <span className="kpi-label">Stock Warnings</span>
            <div className="kpi-icon-pill rose"><AlertTriangle size={18} /></div>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-value" style={{ color: stats.lowStockCount > 0 ? '#dc2626' : 'inherit' }}>
              {stats.lowStockCount}
            </span>
            <span className="kpi-trend negative">Below Min</span>
          </div>
          <div className="kpi-footer-sub">
            <span>{stats.totalProducts} total active garment items</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Weekly Chart & Attention Required */}
      <div className="dashboard-charts-layout">
        {/* Weekly Trend */}
        <div className="analytics-card chart-block">
          <div className="card-inner-header">
            <div>
              <h3>Weekly Sales Momentum</h3>
              <p>Store performance across the week</p>
            </div>
            <span className="pill-badge-indigo">Operations</span>
          </div>

          <div style={{ width: '100%', height: 280, marginTop: 16 }}>
            <ResponsiveContainer>
              <BarChart data={stats.chartData || []} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="managerGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4338ca" stopOpacity={1} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0.7} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 13 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 13 }} />
                <RechartsTooltip
                  cursor={{ fill: 'rgba(67, 56, 202, 0.05)' }}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.08)'
                  }}
                  formatter={(val) => [`₹${val.toLocaleString()}`, 'Sales']}
                />
                <Bar dataKey="sales" fill="url(#managerGrad)" radius={[8, 8, 0, 0]} barSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Team Task Health */}
        <div className="analytics-card">
          <div className="card-inner-header">
            <div>
              <h3>Team Task Execution</h3>
              <p>Active floor assignments</p>
            </div>
            <button className="text-link-btn" onClick={() => navigate('/manager/tasks')}>
              All Tasks <ChevronRight size={14} />
            </button>
          </div>

          <div style={{ marginTop: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13, fontWeight: 700 }}>
              <span>Completion Rate</span>
              <span style={{ color: '#10b981' }}>
                {Math.round((stats.tasksCompleted / (stats.tasksCompleted + stats.tasksPending || 1)) * 100)}%
              </span>
            </div>
            <div className="progress-track" style={{ width: '100%', height: 10 }}>
              <div
                className="progress-fill"
                style={{
                  width: `${Math.round((stats.tasksCompleted / (stats.tasksCompleted + stats.tasksPending || 1)) * 100)}%`
                }}
              ></div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 20 }}>
              <div style={{ background: '#f8fafc', padding: 14, borderRadius: 10, textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#10b981' }}>{stats.tasksCompleted}</div>
                <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>Completed</div>
              </div>
              <div style={{ background: '#f8fafc', padding: 14, borderRadius: 10, textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#f59e0b' }}>{stats.tasksPending}</div>
                <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>In Progress</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Attention Required Rows */}
      <div className="dashboard-two-col-row">
        {/* Pending Orders to Dispatch */}
        <div className="analytics-card">
          <div className="card-inner-header">
            <div>
              <h3>Orders Requiring Dispatch</h3>
              <p>Customer orders waiting for processing</p>
            </div>
            <span className="status-pill low-stock">{stats.pendingOrders} Pending</span>
          </div>

          <div className="alerts-table-wrapper">
            {stats.pendingOrdersList && stats.pendingOrdersList.length > 0 ? (
              <table className="mini-table">
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>Customer</th>
                    <th>Total</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.pendingOrdersList.map(o => (
                    <tr key={o.id}>
                      <td style={{ fontWeight: 700, color: '#4338ca' }}>#ORD-{o.id}</td>
                      <td>{o.customer}</td>
                      <td style={{ fontWeight: 700 }}>₹{o.amount?.toLocaleString()}</td>
                      <td>
                        <button className="btn-table-action" onClick={() => navigate('/manager/orders')}>
                          Process
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="all-good-box">
                <CheckCircle size={20} color="#10b981" />
                <span>All customer orders have been fulfilled!</span>
              </div>
            )}
          </div>
        </div>

        {/* Low Stock Items */}
        <div className="analytics-card">
          <div className="card-inner-header">
            <div>
              <h3>Low Stock Inventory</h3>
              <p>Items needing supplier re-order</p>
            </div>
            <button className="text-link-btn" onClick={() => navigate('/manager/purchases')}>
              New Purchase <ChevronRight size={14} />
            </button>
          </div>

          <div className="alerts-table-wrapper">
            {stats.lowStockItems && stats.lowStockItems.length > 0 ? (
              <table className="mini-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Stock Left</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.lowStockItems.map(p => (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 700 }}>{p.name}</td>
                      <td><span className="stock-alert-pill">{p.stock} units</span></td>
                      <td>
                        <button className="btn-table-action" onClick={() => navigate('/manager/purchases')}>
                          Order
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="all-good-box">
                <CheckCircle size={20} color="#10b981" />
                <span>Inventory stock counts are sufficient.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;
