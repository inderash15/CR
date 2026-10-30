import React, { useState, useEffect, useMemo } from 'react';
import { ordersAPI } from '../services/api';
import './Reports.css';
import '../pages/Products.css';
import {
  FileText,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Download,
  Printer,
  Search,
  Filter,
  RefreshCw,
  PackageCheck,
  ChevronDown,
  ArrowUpRight,
  ExternalLink
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

const Reports = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, pending, ongoing, delivered, cancelled
  const [dateFilter, setDateFilter] = useState('all'); // all, today, week, month, custom
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await ordersAPI.getAll();
      if (res.data?.success) {
        setOrders(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load orders report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusChange = async (id, newStatus) => {
    try {
      const res = await ordersAPI.updateStatus(id, newStatus);
      if (res.data.success) {
        fetchOrders();
      }
    } catch (err) {
      alert('Failed to update status: ' + (err.response?.data?.message || err.message));
    }
  };

  // Status classification helpers
  const getStatusCategory = (status) => {
    if (!status) return 'pending';
    const s = status.toLowerCase();
    if (s === 'pending') return 'pending';
    if (['confirmed', 'processing', 'ready'].includes(s)) return 'ongoing';
    if (s === 'delivered') return 'delivered';
    if (s === 'cancelled') return 'cancelled';
    return 'pending';
  };

  // Filtered orders list
  const filteredOrders = useMemo(() => {
    const now = new Date();

    return orders.filter((o) => {
      // 1. Search filter
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        o.id.toString().includes(term) ||
        o.customer_name?.toLowerCase().includes(term) ||
        o.customer_phone?.includes(term) ||
        o.items?.some((item) => item.product_name?.toLowerCase().includes(term));

      if (!matchesSearch) return false;

      // 2. Status filter
      const cat = getStatusCategory(o.status);
      if (statusFilter !== 'all' && cat !== statusFilter) {
        return false;
      }

      // 3. Date filter
      if (!o.order_date) return true;
      const orderDate = new Date(o.order_date);

      if (dateFilter === 'today') {
        const isToday =
          orderDate.getDate() === now.getDate() &&
          orderDate.getMonth() === now.getMonth() &&
          orderDate.getFullYear() === now.getFullYear();
        if (!isToday) return false;
      } else if (dateFilter === 'week') {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(now.getDate() - 7);
        if (orderDate < sevenDaysAgo) return false;
      } else if (dateFilter === 'month') {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(now.getDate() - 30);
        if (orderDate < thirtyDaysAgo) return false;
      } else if (dateFilter === 'custom') {
        if (startDate && new Date(o.order_date) < new Date(startDate)) return false;
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          if (new Date(o.order_date) > end) return false;
        }
      }

      return true;
    });
  }, [orders, searchTerm, statusFilter, dateFilter, startDate, endDate]);

  // Aggregate KPI metrics
  const metrics = useMemo(() => {
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);

    const pendingOrders = orders.filter((o) => getStatusCategory(o.status) === 'pending');
    const pendingValue = pendingOrders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);

    const ongoingOrders = orders.filter((o) => getStatusCategory(o.status) === 'ongoing');
    const ongoingValue = ongoingOrders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);

    const deliveredOrders = orders.filter((o) => getStatusCategory(o.status) === 'delivered');
    const deliveredValue = deliveredOrders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);

    const cancelledOrders = orders.filter((o) => getStatusCategory(o.status) === 'cancelled');

    return {
      totalOrders,
      totalRevenue,
      pendingCount: pendingOrders.length,
      pendingValue,
      ongoingCount: ongoingOrders.length,
      ongoingValue,
      deliveredCount: deliveredOrders.length,
      deliveredValue,
      cancelledCount: cancelledOrders.length
    };
  }, [orders]);

  // Chart data
  const chartData = [
    { name: 'Pending', count: metrics.pendingCount, color: '#f59e0b' },
    { name: 'Ongoing', count: metrics.ongoingCount, color: '#0284c7' },
    { name: 'Delivered', count: metrics.deliveredCount, color: '#10b981' },
    { name: 'Cancelled', count: metrics.cancelledCount, color: '#ef4444' }
  ];

  // CSV Export
  const exportToCSV = () => {
    if (filteredOrders.length === 0) {
      alert('No orders to export.');
      return;
    }

    const headers = [
      'Order ID',
      'Customer Name',
      'Customer Phone',
      'Order Date',
      'Total Amount (INR)',
      'Payment Status',
      'Status',
      'Items'
    ];

    const rows = filteredOrders.map((o) => [
      `#ORD-${o.id}`,
      `"${o.customer_name || 'Walk-in'}"`,
      `"${o.customer_phone || ''}"`,
      `"${o.order_date ? new Date(o.order_date).toLocaleString() : ''}"`,
      o.total_amount || 0,
      o.payment_status || 'PENDING',
      o.status || 'Pending',
      `"${(o.items || []).map((i) => `${i.product_name} (x${i.quantity})`).join(', ')}"`
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Orders_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="reports-container">
      {/* Page Header */}
      <div className="reports-header-row">
        <div className="reports-title">
          <h2>Orders & Fulfillment Report</h2>
          <p>
            Real-time pipeline analysis tracking order placement dates, pending queues, and active ongoing deliveries.
          </p>
        </div>

        <div className="reports-actions-group">
          <button type="button" className="btn-export-report" onClick={() => window.print()}>
            <Printer size={15} />
            <span>Print Report</span>
          </button>
          <button type="button" className="btn-export-report" onClick={exportToCSV}>
            <Download size={15} />
            <span>Export CSV</span>
          </button>
          <button type="button" className="btn-refresh-report" onClick={fetchOrders} disabled={loading}>
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="report-kpi-grid">
        {/* Total Orders */}
        <div className="report-kpi-card total">
          <div className="report-kpi-top">
            <span className="report-kpi-title">Total Orders</span>
            <div className="report-kpi-icon indigo">
              <FileText size={18} />
            </div>
          </div>
          <div className="report-kpi-val">{metrics.totalOrders}</div>
          <div className="report-kpi-sub">
            <TrendingUp size={13} color="#4338ca" />
            <span>Total Value: ₹{metrics.totalRevenue.toLocaleString()}</span>
          </div>
        </div>

        {/* Pending Orders (Highlighted) */}
        <div className="report-kpi-card pending">
          <div className="report-kpi-top">
            <span className="report-kpi-title">Pending Orders</span>
            <div className="report-kpi-icon amber">
              <Clock size={18} />
            </div>
          </div>
          <div className="report-kpi-val" style={{ color: '#d97706' }}>
            {metrics.pendingCount}
          </div>
          <div className="report-kpi-sub">
            <AlertCircle size={13} color="#d97706" />
            <span>Awaiting dispatch (₹{metrics.pendingValue.toLocaleString()})</span>
          </div>
        </div>

        {/* Ongoing / In-Progress Orders (Highlighted) */}
        <div className="report-kpi-card ongoing">
          <div className="report-kpi-top">
            <span className="report-kpi-title">Ongoing Orders</span>
            <div className="report-kpi-icon sky">
              <RefreshCw size={18} />
            </div>
          </div>
          <div className="report-kpi-val" style={{ color: '#0284c7' }}>
            {metrics.ongoingCount}
          </div>
          <div className="report-kpi-sub">
            <PackageCheck size={13} color="#0284c7" />
            <span>Processing & In-transit (₹{metrics.ongoingValue.toLocaleString()})</span>
          </div>
        </div>

        {/* Completed / Delivered */}
        <div className="report-kpi-card delivered">
          <div className="report-kpi-top">
            <span className="report-kpi-title">Delivered Orders</span>
            <div className="report-kpi-icon emerald">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="report-kpi-val" style={{ color: '#16a34a' }}>
            {metrics.deliveredCount}
          </div>
          <div className="report-kpi-sub">
            <ArrowUpRight size={13} color="#16a34a" />
            <span>Fulfilled successfully (₹{metrics.deliveredValue.toLocaleString()})</span>
          </div>
        </div>
      </div>

      {/* Filter Panel (Date + Status + Search) */}
      <div className="reports-filter-panel">
        <div className="filter-row-top">
          {/* Quick Date Pills */}
          <div className="quick-date-pills">
            <button
              type="button"
              className={`date-pill-btn ${dateFilter === 'all' ? 'active' : ''}`}
              onClick={() => setDateFilter('all')}
            >
              All Time
            </button>
            <button
              type="button"
              className={`date-pill-btn ${dateFilter === 'today' ? 'active' : ''}`}
              onClick={() => setDateFilter('today')}
            >
              Today
            </button>
            <button
              type="button"
              className={`date-pill-btn ${dateFilter === 'week' ? 'active' : ''}`}
              onClick={() => setDateFilter('week')}
            >
              Last 7 Days
            </button>
            <button
              type="button"
              className={`date-pill-btn ${dateFilter === 'month' ? 'active' : ''}`}
              onClick={() => setDateFilter('month')}
            >
              Last 30 Days
            </button>
            <button
              type="button"
              className={`date-pill-btn ${dateFilter === 'custom' ? 'active' : ''}`}
              onClick={() => setDateFilter('custom')}
            >
              Custom Range
            </button>
          </div>

          {/* Custom Date Pickers */}
          {dateFilter === 'custom' && (
            <div className="custom-date-range">
              <Calendar size={15} color="#64748b" />
              <span>From:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <span>To:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          )}
        </div>

        <div className="filter-row-bottom">
          {/* Search Box */}
          <div className="report-search-box">
            <Search size={16} className="report-search-icon" />
            <input
              type="text"
              placeholder="Search by Order #, Customer name, Phone, or Product..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Status Filter Chips */}
          <div className="status-tabs-row">
            <button
              type="button"
              className={`status-tab-chip ${statusFilter === 'all' ? 'active' : ''}`}
              onClick={() => setStatusFilter('all')}
            >
              <span>All Orders</span>
              <span className="badge-count">{orders.length}</span>
            </button>
            <button
              type="button"
              className={`status-tab-chip ${statusFilter === 'pending' ? 'active' : ''}`}
              onClick={() => setStatusFilter('pending')}
            >
              <Clock size={13} />
              <span>Pending</span>
              <span className="badge-count">{metrics.pendingCount}</span>
            </button>
            <button
              type="button"
              className={`status-tab-chip ${statusFilter === 'ongoing' ? 'active' : ''}`}
              onClick={() => setStatusFilter('ongoing')}
            >
              <RefreshCw size={13} />
              <span>Ongoing</span>
              <span className="badge-count">{metrics.ongoingCount}</span>
            </button>
            <button
              type="button"
              className={`status-tab-chip ${statusFilter === 'delivered' ? 'active' : ''}`}
              onClick={() => setStatusFilter('delivered')}
            >
              <CheckCircle2 size={13} />
              <span>Delivered</span>
              <span className="badge-count">{metrics.deliveredCount}</span>
            </button>
            <button
              type="button"
              className={`status-tab-chip ${statusFilter === 'cancelled' ? 'active' : ''}`}
              onClick={() => setStatusFilter('cancelled')}
            >
              <span>Cancelled</span>
              <span className="badge-count">{metrics.cancelledCount}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Visual Chart: Status Breakdown */}
      <div className="report-chart-section">
        <div className="chart-header">
          <div>
            <h3>Order Status Distribution</h3>
            <p>Visual pipeline showing pending, active ongoing fulfillment, and completed deliveries</p>
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#4338ca' }}>
            Showing {filteredOrders.length} matching order(s)
          </span>
        </div>

        <div style={{ width: '100%', height: 180 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <RechartsTooltip
                formatter={(val) => [`${val} orders`, 'Volume']}
                contentStyle={{ background: '#0f172a', borderRadius: 8, color: '#fff', border: 'none', fontSize: 12 }}
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Orders Table */}
      {loading ? (
        <div className="shnoor-empty-state">
          <div className="empty-icon-circle">
            <Clock size={28} className="animate-spin" />
          </div>
          <h3>Loading Orders Report...</h3>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="shnoor-empty-state">
          <div className="empty-icon-circle">
            <FileText size={28} />
          </div>
          <h3>No Orders Found</h3>
          <p>No orders match the selected date range or status filters.</p>
        </div>
      ) : (
        <div className="shnoor-table-container">
          <table className="shnoor-table">
            <thead>
              <tr>
                <th>Order Ref</th>
                <th>Order Date & Time</th>
                <th>Customer</th>
                <th>Products & Items</th>
                <th>Total Value</th>
                <th>Payment</th>
                <th>Status (Pending / Ongoing)</th>
                <th>Update Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((o) => {
                const category = getStatusCategory(o.status);
                const orderDateObj = o.order_date ? new Date(o.order_date) : null;

                return (
                  <tr key={o.id}>
                    {/* Order Ref */}
                    <td style={{ fontWeight: 800, color: '#4338ca' }}>
                      #ORD-{o.id.toString().padStart(4, '0')}
                    </td>

                    {/* Date Placed */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#334155' }}>
                        <Calendar size={13} color="#6366f1" />
                        <span>{orderDateObj ? orderDateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}</span>
                      </div>
                      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2, marginLeft: 19 }}>
                        {orderDateObj ? orderDateObj.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''}
                      </div>
                    </td>

                    {/* Customer */}
                    <td>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>{o.customer_name}</div>
                      {o.customer_phone && (
                        <div style={{ fontSize: 11, color: '#64748b' }}>{o.customer_phone}</div>
                      )}
                    </td>

                    {/* Items */}
                    <td>
                      <div className="items-preview-pill" title={o.items?.map((i) => `${i.product_name} (x${i.quantity})`).join(', ')}>
                        {o.items && o.items.length > 0 ? (
                          o.items.map((i) => `${i.product_name} (x${i.quantity})`).join(', ')
                        ) : (
                          `${o.items_count || 1} item(s)`
                        )}
                      </div>
                    </td>

                    {/* Total Value */}
                    <td style={{ fontWeight: 800, fontSize: 14 }}>
                      ₹{o.total_amount?.toLocaleString('en-IN')}
                    </td>

                    {/* Payment Status */}
                    <td>
                      <span className={`status-pill ${o.payment_status === 'PAID' ? 'in-stock' : 'low-stock'}`}>
                        {o.payment_status || 'PENDING'}
                      </span>
                    </td>

                    {/* Status Badge (Pending / Ongoing / Delivered / Cancelled) */}
                    <td>
                      {category === 'pending' && (
                        <span className="status-tag pending">
                          <Clock size={12} /> Pending Action
                        </span>
                      )}
                      {category === 'ongoing' && (
                        <span className="status-tag ongoing">
                          <RefreshCw size={12} className="animate-spin" style={{ animationDuration: '4s' }} /> Ongoing ({o.status})
                        </span>
                      )}
                      {category === 'delivered' && (
                        <span className="status-tag delivered">
                          <CheckCircle2 size={12} /> Delivered
                        </span>
                      )}
                      {category === 'cancelled' && (
                        <span className="status-tag cancelled">
                          <AlertCircle size={12} /> Cancelled
                        </span>
                      )}
                    </td>

                    {/* Update Status Dropdown */}
                    <td>
                      <select
                        value={o.status}
                        onChange={(e) => handleStatusChange(o.id, e.target.value)}
                        style={{
                          padding: '5px 8px',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1',
                          fontSize: 12,
                          fontWeight: 600,
                          backgroundColor: '#ffffff',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Confirmed">Confirmed (Ongoing)</option>
                        <option value="Processing">Processing (Ongoing)</option>
                        <option value="Ready">Ready (Ongoing)</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Reports;

