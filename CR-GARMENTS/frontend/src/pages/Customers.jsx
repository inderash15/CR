import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { customersAPI } from '../services/api';
import './Products.css';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  Users,
  Award,
  Phone,
  Mail,
  MapPin
} from 'lucide-react';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const role = user.role?.toUpperCase();

  const initialFormState = { name: '', phone: '', email: '', address: '', city: '', loyalty_points: '0' };
  const [formData, setFormData] = useState(initialFormState);

  const fetchCustomers = async () => {
    try {
      const res = await customersAPI.getAll();
      if (res.data.success) {
        setCustomers(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching customers", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const openAddModal = () => {
    setEditingId(null);
    setFormData(initialFormState);
    setShowModal(true);
  };

  const openEditModal = (c) => {
    setEditingId(c.id);
    setFormData({
      name: c.name || '',
      phone: c.phone || '',
      email: c.email || '',
      address: c.address || '',
      city: c.city || '',
      loyalty_points: c.loyalty_points?.toString() || '0'
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this customer record?")) {
      try {
        const res = await customersAPI.delete(id);
        if (res.data.success) fetchCustomers();
      } catch (err) {
        alert("Failed to delete customer: " + (err.response?.data?.message || err.message));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        loyalty_points: parseInt(formData.loyalty_points) || 0
      };

      if (editingId) {
        await customersAPI.update(editingId, payload);
      } else {
        await customersAPI.create(payload);
      }
      setShowModal(false);
      fetchCustomers();
    } catch (err) {
      alert("Error saving customer: " + (err.response?.data?.message || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCustomers = useMemo(() => {
    return customers.filter(c =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone?.includes(searchTerm) ||
      c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.city?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [customers, searchTerm]);

  return (
    <div className="shnoor-page-container">
      {/* Page Header */}
      <div className="shnoor-page-header">
        <div className="shnoor-title-block">
          <h2>Customer Directory</h2>
          <p>Manage customer relationships, loyalty reward tiers, and purchase histories</p>
        </div>

        <button className="btn-create-primary" onClick={openAddModal}>
          <Plus size={18} />
          <span>Add Customer</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="shnoor-search-filter-bar">
        <div className="search-input-wrapper">
          <Search size={18} className="search-input-icon" />
          <input
            type="text"
            className="search-input-field"
            placeholder="Search by customer name, phone number, email, or city..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Sub Toolbar */}
      <div className="shnoor-sub-toolbar">
        <span className="showing-counter">
          Showing {filteredCustomers.length} of {customers.length} registered customers
        </span>
      </div>

      {/* Customers Table */}
      {loading ? (
        <div className="shnoor-empty-state">
          <div className="empty-icon-circle">
            <Users size={28} className="animate-spin" />
          </div>
          <h3>Loading Customers...</h3>
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="shnoor-empty-state">
          <div className="empty-icon-circle">
            <Users size={28} />
          </div>
          <h3>No Customers Found</h3>
          <p>Add your first customer profile to start tracking purchases.</p>
          <button className="btn-create-primary" style={{ margin: '0 auto' }} onClick={openAddModal}>
            <Plus size={16} /> Add Customer
          </button>
        </div>
      ) : (
        <div className="shnoor-table-container">
          <table className="shnoor-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Contact Info</th>
                <th>City / Address</th>
                <th>Loyalty Points</th>
                <th>Total Purchases</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map(c => (
                <tr key={c.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="user-avatar-circle" style={{ width: 34, height: 34 }}>
                        {c.name ? c.name.charAt(0) : 'C'}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{c.name}</div>
                        <div style={{ fontSize: 11, color: '#64748b' }}>ID: CUST-{c.id.toString().padStart(4, '0')}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {c.phone && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600 }}>
                          <Phone size={13} color="#6366f1" /> {c.phone}
                        </div>
                      )}
                      {c.email && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748b' }}>
                          <Mail size={12} /> {c.email}
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                      <MapPin size={13} color="#94a3b8" />
                      <span>{c.city ? `${c.city} - ` : ''}{c.address || 'Address not listed'}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Award size={15} color="#eab308" />
                      <span style={{ fontWeight: 800, color: '#854d0e', backgroundColor: '#fef9c3', padding: '2px 8px', borderRadius: 999, fontSize: 12 }}>
                        {c.loyalty_points || 0} pts
                      </span>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontWeight: 800, fontSize: 14, color: '#10b981' }}>
                      ₹{c.total_purchases?.toLocaleString() || 0}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="icon-action-btn" title="Edit" onClick={() => openEditModal(c)}>
                        <Edit2 size={14} />
                      </button>
                      {(role === 'ADMIN' || role === 'MANAGER') && (
                        <button className="icon-action-btn" title="Delete" onClick={() => handleDelete(c.id)}>
                          <Trash2 size={14} color="#ef4444" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Customer Modal */}
      {showModal &&
        createPortal(
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{editingId ? 'Edit Customer Profile' : 'Register New Customer'}</h3>
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
                  <label>Full Customer Name *</label>
                  <input
                    type="text"
                    required
                    name="name"
                    placeholder="e.g. Ananya Sharma"
                    value={formData.name}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-grid-2">
                  <div className="form-group-item">
                    <label>Phone Number *</label>
                    <input
                      type="text"
                      required
                      name="phone"
                      placeholder="e.g. 9820112345"
                      value={formData.phone}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group-item">
                    <label>Email Address</label>
                    <input
                      type="email"
                      name="email"
                      placeholder="e.g. customer@gmail.com"
                      value={formData.email}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-group-item">
                    <label>City</label>
                    <input
                      type="text"
                      name="city"
                      placeholder="e.g. Mumbai, Bangalore"
                      value={formData.city}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group-item">
                    <label>Loyalty Points</label>
                    <input
                      type="number"
                      name="loyalty_points"
                      value={formData.loyalty_points}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="form-group-item" style={{ marginTop: 14 }}>
                  <label>Delivery / Billing Address</label>
                  <textarea
                    rows="2"
                    name="address"
                    placeholder="Enter street, apartment, locality..."
                    value={formData.address}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary-cancel" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-create-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : editingId ? 'Update Customer' : 'Save Customer'}
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

export default Customers;
