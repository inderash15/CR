import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { categoriesAPI } from '../services/api';
import './Products.css';
import { Plus, Edit2, Trash2, X, Tags } from 'lucide-react';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '' });

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const role = user.role?.toUpperCase();

  const fetchCategories = async () => {
    try {
      const res = await categoriesAPI.getAll();
      if (res.data.success) {
        setCategories(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching categories", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openAddModal = () => {
    setEditingId(null);
    setFormData({ name: '' });
    setShowAddModal(true);
  };

  const openEditModal = (category) => {
    setEditingId(category.id);
    setFormData({ name: category.name });
    setShowAddModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this category?")) {
      try {
        const res = await categoriesAPI.delete(id);
        if (res.data.success) fetchCategories();
      } catch (err) {
        alert("Failed to delete category: " + (err.response?.data?.message || err.message));
      }
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingId) {
        await categoriesAPI.update(editingId, formData);
      } else {
        await categoriesAPI.create(formData);
      }
      setShowAddModal(false);
      setFormData({ name: '' });
      fetchCategories();
    } catch (err) {
      alert("Error saving category: " + (err.response?.data?.message || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="shnoor-page-container">
      {/* Page Header */}
      <div className="shnoor-page-header">
        <div className="shnoor-title-block">
          <h2>Product Categories</h2>
          <p>Organize garments by classification, style department, and collection tags</p>
        </div>

        {role === 'ADMIN' && (
          <button className="btn-create-primary" onClick={openAddModal}>
            <Plus size={18} />
            <span>Add Category</span>
          </button>
        )}
      </div>

      <div className="shnoor-sub-toolbar">
        <span className="showing-counter">
          Showing {categories.length} garment categories
        </span>
      </div>

      {loading ? (
        <div className="shnoor-empty-state">
          <div className="empty-icon-circle">
            <Tags size={28} className="animate-spin" />
          </div>
          <h3>Loading Categories...</h3>
        </div>
      ) : categories.length === 0 ? (
        <div className="shnoor-empty-state">
          <div className="empty-icon-circle">
            <Tags size={28} />
          </div>
          <h3>No Categories Yet</h3>
          <p>Add your first garment department category.</p>
        </div>
      ) : (
        <div className="shnoor-table-container">
          <table className="shnoor-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Category Name</th>
                <th>Status</th>
                {role === 'ADMIN' && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {categories.map(c => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 800, color: '#4338ca' }}>CAT-{c.id.toString().padStart(3, '0')}</td>
                  <td style={{ fontWeight: 700, fontSize: 15 }}>{c.name}</td>
                  <td>
                    <span className="status-pill in-stock">
                      {c.status ? 'Active' : 'Archived'}
                    </span>
                  </td>
                  {role === 'ADMIN' && (
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="icon-action-btn" title="Edit" onClick={() => openEditModal(c)}>
                          <Edit2 size={14} />
                        </button>
                        <button className="icon-action-btn" title="Delete" onClick={() => handleDelete(c.id)}>
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

      {showAddModal &&
        createPortal(
          <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
            <div className="modal-content" style={{ maxWidth: 450 }} onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{editingId ? 'Edit Category' : 'Create Category'}</h3>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setShowAddModal(false)}
                >
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleSave}>
                <div className="modal-body">
                  <div className="form-group-item">
                    <label>Category Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Men's Formal Wear"
                      value={formData.name}
                      onChange={(e) => setFormData({ name: e.target.value })}
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn-secondary-cancel" onClick={() => setShowAddModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-create-primary" disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : editingId ? 'Update' : 'Save Category'}
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

export default Categories;
