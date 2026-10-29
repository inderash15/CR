import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { suppliersAPI } from '../services/api';
import './Products.css';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  Building2,
  Phone,
  Mail,
  MapPin,
  ShieldCheck
} from 'lucide-react';

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const role = user.role?.toUpperCase();

  const initialFormState = { name: '', company: '', phone: '', email: '', address: '', gst_number: '' };
  const [formData, setFormData] = useState(initialFormState);

  const fetchSuppliers = async () => {
    try {
      const res = await suppliersAPI.getAll();
      if (res.data.success) {
        setSuppliers(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching suppliers", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
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

  const openEditModal = (supplier) => {
    setEditingId(supplier.id);
    setFormData({
      name: supplier.name || '',
      company: supplier.company || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      address: supplier.address || '',
      gst_number: supplier.gst_number || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this supplier?")) {
      try {
        const res = await suppliersAPI.delete(id);
        if (res.data.success) fetchSuppliers();
      } catch (err) {
        alert("Failed to delete supplier: " + (err.response?.data?.message || err.message));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingId) {
        await suppliersAPI.update(editingId, formData);
      } else {
        await suppliersAPI.create(formData);
      }
      setShowModal(false);
      fetchSuppliers();
    } catch (err) {
      alert("Error saving supplier: " + (err.response?.data?.message || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(s =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.phone?.includes(searchTerm) ||
      s.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [suppliers, searchTerm]);

  return (
    <div className="shnoor-page-container">
      {/* Header */}
      <div className="shnoor-page-header">
        <div className="shnoor-title-block">
          <h2>Supplier Directory</h2>
          <p>Textile mills, fabric manufacturers, and wholesale garment vendors</p>
        </div>

        {(role === 'ADMIN' || role === 'MANAGER') && (
          <button className="btn-create-primary" onClick={openAddModal}>
            <Plus size={18} />
            <span>Add Supplier</span>
          </button>
        )}
      </div>

      {/* Search */}
      <div className="shnoor-search-filter-bar">
        <div className="search-input-wrapper">
          <Search size={18} className="search-input-icon" />
          <input
            type="text"
            className="search-input-field"
            placeholder="Search by supplier name, mill company, phone or GST..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="shnoor-sub-toolbar">
        <span className="showing-counter">
          Showing {filteredSuppliers.length} of {suppliers.length} active suppliers
        </span>
      </div>

      {loading ? (
        <div className="shnoor-empty-state">
          <div className="empty-icon-circle">
            <Building2 size={28} className="animate-spin" />
          </div>
          <h3>Loading Suppliers...</h3>
        </div>
      ) : filteredSuppliers.length === 0 ? (
        <div className="shnoor-empty-state">
          <div className="empty-icon-circle">
            <Building2 size={28} />
          </div>
          <h3>No Suppliers Found</h3>
          <p>Register your first textile fabric supplier.</p>
        </div>
      ) : (
        <div className="shnoor-table-container">
          <table className="shnoor-table">
            <thead>
              <tr>
                <th>Supplier / Company</th>
                <th>Contact</th>
                <th>Address & Region</th>
                <th>GST Identification</th>
                <th>Status</th>
                {(role === 'ADMIN' || role === 'MANAGER') && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredSuppliers.map(s => (
                <tr key={s.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="user-avatar-circle" style={{ width: 34, height: 34, background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' }}>
                        <Building2 size={16} color="#ffffff" />
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 14 }}>{s.name}</div>
                        <div style={{ fontSize: 12, color: '#64748b' }}>{s.company || 'Mill Vendor'}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {s.phone && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600 }}>
                          <Phone size={13} color="#6366f1" /> {s.phone}
                        </div>
                      )}
                      {s.email && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748b' }}>
                          <Mail size={12} /> {s.email}
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                      <MapPin size={13} color="#94a3b8" />
                      <span>{s.address || 'Location registered'}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#334155' }}>
                      <ShieldCheck size={14} color="#10b981" />
                      <span>{s.gst_number || 'GST Verified'}</span>
                    </div>
                  </td>
                  <td>
                    <span className="status-pill in-stock">
                      {s.status ? 'Approved' : 'Inactive'}
                    </span>
                  </td>
                  {(role === 'ADMIN' || role === 'MANAGER') && (
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="icon-action-btn" title="Edit" onClick={() => openEditModal(s)}>
                          <Edit2 size={14} />
                        </button>
                        <button className="icon-action-btn" title="Delete" onClick={() => handleDelete(s.id)}>
                          <Trash2 size={14} color="#ef4444" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal &&
        createPortal(
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{editingId ? 'Edit Supplier' : 'Register Supplier'}</h3>
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
                <div className="form-grid-2">
                  <div className="form-group-item">
                    <label>Supplier / Mill Name *</label>
                    <input
                      type="text"
                      required
                      name="name"
                      placeholder="e.g. Raymond Mills Mumbai"
                      value={formData.name}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group-item">
                    <label>Company Entity</label>
                    <input
                      type="text"
                      name="company"
                      placeholder="e.g. Raymond Ltd"
                      value={formData.company}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-group-item">
                    <label>Phone *</label>
                    <input
                      type="text"
                      required
                      name="phone"
                      placeholder="022-28491020"
                      value={formData.phone}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group-item">
                    <label>Email *</label>
                    <input
                      type="email"
                      required
                      name="email"
                      placeholder="orders@raymond.in"
                      value={formData.email}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-group-item">
                    <label>GST Number</label>
                    <input
                      type="text"
                      name="gst_number"
                      placeholder="27AAACR1234F1Z1"
                      value={formData.gst_number}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group-item">
                    <label>Address / Factory Location</label>
                    <input
                      type="text"
                      name="address"
                      placeholder="Worli Industrial Area, Mumbai"
                      value={formData.address}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary-cancel" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-create-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : editingId ? 'Update' : 'Save Supplier'}
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

export default Suppliers;
