import React, { useState, useEffect, useMemo } from 'react';
import { ordersAPI } from '../services/api';
import './Products.css';
import {
  Search,
  Package,
  FileText,
  Calendar,
  Filter,
  CheckCircle,
  Clock,
  ChevronDown
} from 'lucide-react';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  const fetchOrders = async () => {
    try {
      const response = await ordersAPI.getAll();
      if (response.data.success) {
        setOrders(response.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusChange = async (id, newStatus) => {
    try {
      const response = await ordersAPI.updateStatus(id, newStatus);
      if (response.data.success) {
        fetchOrders();
      }
    } catch (err) {
      alert("Failed to update status: " + (err.response?.data?.message || err.message));
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const matchesSearch =
        o.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.id.toString().includes(searchTerm) ||
        o.customer_phone?.includes(searchTerm);

      const matchesStatus =
        statusFilter === 'all' || o.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [orders, searchTerm, statusFilter]);

  return (
    <div className="shnoor-page-container">
      {/* Header */}
      <div className="shnoor-page-header">
        <div className="shnoor-title-block">
          <h2>Order Management</h2>
          <p>Track customer purchases, fulfillment progress, and delivery statuses</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="shnoor-search-filter-bar">
        <div className="search-input-wrapper">
          <Search size={18} className="search-input-icon" />
          <input
            type="text"
            className="search-input-field"
            placeholder="Search by Order ID, customer name or phone..."
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
              {['all', 'Pending', 'Confirmed', 'Processing', 'Ready', 'Delivered', 'Cancelled'].map(s => (
                <div
                  key={s}
                  className={`dropdown-item ${statusFilter === s ? 'selected' : ''}`}
                  onClick={() => { setStatusFilter(s); setShowFilterDropdown(false); }}
                >
                  {s === 'all' ? 'All Orders' : s}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sub Toolbar */}
      <div className="shnoor-sub-toolbar">
        <span className="showing-counter">
          Showing {filteredOrders.length} of {orders.length} orders
        </span>
      </div>

      {/* Orders Table */}
      {loading ? (
        <div className="shnoor-empty-state">
          <div className="empty-icon-circle">
            <Package size={28} className="animate-spin" />
          </div>
          <h3>Loading Orders...</h3>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="shnoor-empty-state">
          <div className="empty-icon-circle">
            <FileText size={28} />
          </div>
          <h3>No Orders Found</h3>
          <p>No customer orders match your search criteria.</p>
        </div>
      ) : (
        <div className="shnoor-table-container">
          <table className="shnoor-table">
            <thead>
              <tr>
                <th>Order Ref</th>
                <th>Customer</th>
                <th>Total Value</th>
                <th>Date Placed</th>
                <th>Payment</th>
                <th>Fulfillment Status</th>
                <th>Update Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(order => (
                <tr key={order.id}>
                  <td style={{ fontWeight: 800, color: '#4338ca' }}>
                    #ORD-{order.id.toString().padStart(4, '0')}
                  </td>
                  <td>
                    <div style={{ fontWeight: 700 }}>{order.customer_name}</div>
                    {order.customer_phone && (
                      <div style={{ fontSize: 11, color: '#64748b' }}>{order.customer_phone}</div>
                    )}
                  </td>
                  <td style={{ fontWeight: 800, fontSize: 15 }}>
                    ₹{order.total_amount?.toLocaleString()}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748b', fontSize: 13 }}>
                      <Calendar size={13} />
                      <span>{order.order_date ? new Date(order.order_date).toLocaleDateString() : '-'}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`status-pill ${order.payment_status === 'PAID' ? 'in-stock' : 'low-stock'}`}>
                      {order.payment_status || 'PENDING'}
                    </span>
                  </td>
                  <td>
                    <span className={`status-pill ${
                      order.status === 'Delivered' ? 'in-stock' :
                      order.status === 'Cancelled' ? 'out-of-stock' :
                      order.status === 'Pending' ? 'low-stock' : 'published'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td>
                    <select
                      value={order.status}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: 13,
                        fontWeight: 600,
                        backgroundColor: '#ffffff',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Confirmed">Confirmed</option>
                      <option value="Processing">Processing</option>
                      <option value="Ready">Ready</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Orders;
