import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { analyticsAPI, ordersAPI } from '../services/api';
import './Dashboard.css';
import {
  BarChart3,
  Package,
  Users,
  ShoppingCart,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  Plus,
  Clock,
  CheckCircle,
  FileText,
  DollarSign,
  Layers,
  ChevronRight
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [statsRes, ordersRes] = await Promise.all([
          analyticsAPI.getDashboardStats(),
          ordersAPI.getAll()
        ]);
        if (statsRes.data.success) {
          setStats(statsRes.data.data);
        }
        if (ordersRes.data.success) {
          setOrders(ordersRes.data.data.slice(0, 5));
        }
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="shnoor-empty-state" style={{ marginTop: 40 }}>
        <div className="empty-icon-circle">
          <Package size={28} className="animate-spin" />
        </div>
        <h3>Loading Admin Control Center...</h3>
        <p>Fetching real-time sales and inventory metrics.</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-container">
      {/* Top Header */}
      <div className="dashboard-header-clean" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2>Executive Overview</h2>
          <p>Real-time financial turnover, stock health, and team performance.</p>
        </div>
        <button
          className="btn-create-primary"
          onClick={() => navigate('/admin/reports')}
          style={{ padding: '9px 18px', fontSize: 13 }}
        >
          <BarChart3 size={16} />
          <span>Orders Report</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="kpi-cards-grid">
        {/* Today's Sales */}
        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Today's Sales Revenue</span>
            <div className="kpi-icon-pill purple">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-value">₹{stats?.today_sales?.toLocaleString() || 0}</span>
            <span className="kpi-trend positive">
              <ArrowUpRight size={14} /> +12%
            </span>
          </div>
          <div className="kpi-footer-sub">
            <span>{stats?.today_orders || 0} orders processed today</span>
          </div>
        </div>

        {/* Total Inventory Value */}
        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Total Inventory Valuation</span>
            <div className="kpi-icon-pill blue">
              <Package size={18} />
            </div>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-value">₹{stats?.total_inventory_value?.toLocaleString() || 0}</span>
            <span className="kpi-trend neutral">{stats?.total_products || 0} SKUs</span>
          </div>
          <div className="kpi-footer-sub">
            <span>Valuation based on raw wholesale cost</span>
          </div>
        </div>

        {/* Customers & Loyalty */}
        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Active Customers</span>
            <div className="kpi-icon-pill green">
              <Users size={18} />
            </div>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-value">{stats?.total_customers || 0}</span>
            <span className="kpi-trend positive">
              <ArrowUpRight size={14} /> Registered
            </span>
          </div>
          <div className="kpi-footer-sub">
            <span>{stats?.total_suppliers || 0} authorized textile suppliers</span>
          </div>
        </div>

        {/* Attention Alerts */}
        <div className="kpi-card" style={{ borderColor: stats?.low_stock_count > 0 ? '#fde68a' : '#e2e8f0' }}>
          <div className="kpi-top">
            <span className="kpi-label">Attention Items</span>
            <div className="kpi-icon-pill amber">
              <AlertTriangle size={18} />
            </div>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-value" style={{ color: stats?.low_stock_count > 0 ? '#b45309' : 'inherit' }}>
              {(stats?.low_stock_count || 0) + (stats?.pending_orders || 0)}
            </span>
            <span className="kpi-trend negative">
              {stats?.low_stock_count || 0} Low Stock
            </span>
          </div>
          <div className="kpi-footer-sub">
            <span>{stats?.pending_orders || 0} pending customer orders</span>
          </div>
        </div>
      </div>

      {/* Main Charts & Top Products Row */}
      <div className="dashboard-charts-layout">
        {/* Weekly Sales Chart */}
        <div className="analytics-card chart-block">
          <div className="card-inner-header">
            <div>
              <h3>Weekly Sales Trend</h3>
              <p>Daily turnover over the past 7 days</p>
            </div>
            <span className="pill-badge-indigo">Live Revenue</span>
          </div>

          <div style={{ width: '100%', height: 300, marginTop: 16 }}>
            <ResponsiveContainer>
              <BarChart data={stats?.chart_data || []} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="indigoGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4f46e5" stopOpacity={1} />
                    <stop offset="100%" stopColor="#818cf8" stopOpacity={0.7} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 13 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 13 }} />
                <RechartsTooltip
                  cursor={{ fill: 'rgba(79, 70, 229, 0.05)' }}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.08)'
                  }}
                  formatter={(val) => [`₹${val.toLocaleString()}`, 'Revenue']}
                />
                <Bar dataKey="sales" fill="url(#indigoGradient)" radius={[8, 8, 0, 0]} barSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Selling Products */}
        <div className="analytics-card top-products-block">
          <div className="card-inner-header">
            <div>
              <h3>Top Selling Products</h3>
              <p>Ranked by units sold & turnover</p>
            </div>
            <button className="text-link-btn" onClick={() => navigate('/admin/products')}>
              View All <ChevronRight size={14} />
            </button>
          </div>

          <div className="top-products-list">
            {stats?.top_products && stats.top_products.length > 0 ? (
              stats.top_products.map((item, idx) => (
                <div key={item.id || idx} className="top-product-item">
                  <div className="rank-badge">#{idx + 1}</div>
                  <div className="top-product-info">
                    <div className="top-product-title">{item.name}</div>
                    <div className="top-product-sub">{item.sold} units sold</div>
                  </div>
                  <div className="top-product-revenue">
                    ₹{item.revenue?.toLocaleString()}
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-subtext">No sales recorded yet.</div>
            )}
          </div>
        </div>
      </div>

      {/* Operational Highlights Section */}
      <div className="dashboard-two-col-row">
        {/* Low Stock Alerts */}
        <div className="analytics-card">
          <div className="card-inner-header">
            <div>
              <h3>Low Stock Inventory Alerts</h3>
              <p>Items near or below re-order safety threshold</p>
            </div>
            <span className="status-pill low-stock">{stats?.low_stock_count || 0} Critical</span>
          </div>

          <div className="alerts-table-wrapper">
            {stats?.low_stock_items && stats.low_stock_items.length > 0 ? (
              <table className="mini-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Current Stock</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.low_stock_items.map(item => (
                    <tr key={item.id}>
                      <td style={{ fontWeight: 700 }}>{item.name}</td>
                      <td>
                        <span className="stock-alert-pill">{item.stock} left</span>
                      </td>
                      <td>
                        <button className="btn-table-action" onClick={() => navigate('/admin/purchases')}>
                          Create PO
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="all-good-box">
                <CheckCircle size={20} color="#10b981" />
                <span>All product stock levels are healthy!</span>
              </div>
            )}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="analytics-card">
          <div className="card-inner-header">
            <div>
              <h3>Recent Customer Orders</h3>
              <p>Latest pending and ongoing fulfillment pipeline</p>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <button className="text-link-btn" onClick={() => navigate('/admin/reports')} style={{ fontWeight: 700, color: '#4338ca' }}>
                Full Report <ChevronRight size={14} />
              </button>
              <button className="text-link-btn" onClick={() => navigate('/admin/orders')}>
                Manage <ChevronRight size={14} />
              </button>
            </div>
          </div>

          <div className="alerts-table-wrapper">
            {orders.length > 0 ? (
              <table className="mini-table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Customer</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(o => (
                    <tr key={o.id}>
                      <td style={{ fontWeight: 700, color: '#4338ca' }}>#ORD-{o.id}</td>
                      <td>{o.customer_name}</td>
                      <td style={{ fontWeight: 700 }}>₹{o.total_amount?.toLocaleString()}</td>
                      <td>
                        <span className={`status-pill ${
                          o.status === 'Delivered' ? 'in-stock' : o.status === 'Pending' ? 'low-stock' : 'published'
                        }`}>
                          {o.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="all-good-box">
                <FileText size={20} color="#6366f1" />
                <span>No pending orders at this moment.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
