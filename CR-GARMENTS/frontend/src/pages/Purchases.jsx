import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { purchasesAPI, suppliersAPI, productsAPI } from '../services/api';
import './Products.css';
import {
  Plus,
  Search,
  Trash2,
  X,
  Layers,
  Calendar,
  Building2,
  CheckCircle
} from 'lucide-react';

const Purchases = () => {
  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const initialFormState = { supplier_id: '', product_id: '', quantity: '', purchase_price: '' };
  const [formData, setFormData] = useState(initialFormState);

  const fetchAllData = async () => {
    try {
      const [purRes, supRes, prodRes] = await Promise.all([
        purchasesAPI.getAll(),
        suppliersAPI.getAll(),
        productsAPI.getAll()
      ]);
      if (purRes.data.success) setPurchases(purRes.data.data);
      if (supRes.data.success) setSuppliers(supRes.data.data);
      if (prodRes.data.success) setProducts(prodRes.data.data);
    } catch (err) {
      console.error("Error fetching purchases data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      if (name === 'product_id' && value) {
        const prod = products.find(p => p.id === parseInt(value));
        if (prod) {
          updated.purchase_price = prod.purchase_price || '';
        }
      }
      return updated;
    });
  };

  const openAddModal = () => {
    setFormData(initialFormState);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("WARNING: Deleting a purchase will reverse product stock! Are you sure?")) {
      try {
        const res = await purchasesAPI.delete(id);
        if (res.data.success) fetchAllData();
      } catch (err) {
        alert("Failed to delete purchase: " + (err.response?.data?.message || err.message));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        supplier_id: parseInt(formData.supplier_id),
        items: [
          {
            product_id: parseInt(formData.product_id),
            quantity: parseInt(formData.quantity),
            purchase_price: parseFloat(formData.purchase_price)
          }
        ]
      };

      const res = await purchasesAPI.create(payload);
      if (res.data.success) {
        setShowModal(false);
        fetchAllData();
      }
    } catch (err) {
      alert("Error logging purchase: " + (err.response?.data?.message || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredPurchases = useMemo(() => {
    return purchases.filter(p =>
      p.supplier_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.id.toString().includes(searchTerm)
    );
  }, [purchases, searchTerm]);

  return (
    <div className="shnoor-page-container">
      {/* Header */}
      <div className="shnoor-page-header">
        <div className="shnoor-title-block">
          <h2>Purchase Orders (Procurement)</h2>
          <p>Record supplier invoices, stock replenishment shipments, and accounts payable</p>
        </div>

        <button className="btn-create-primary" onClick={openAddModal}>
          <Plus size={18} />
          <span>New Purchase Order</span>
        </button>
      </div>

      {/* Search */}
      <div className="shnoor-search-filter-bar">
        <div className="search-input-wrapper">
          <Search size={18} className="search-input-icon" />
          <input
            type="text"
            className="search-input-field"
            placeholder="Search by Purchase ID or Supplier Mill name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="shnoor-sub-toolbar">
        <span className="showing-counter">
          Showing {filteredPurchases.length} of {purchases.length} purchase invoices
        </span>
      </div>

      {loading ? (
        <div className="shnoor-empty-state">
          <div className="empty-icon-circle">
            <Layers size={28} className="animate-spin" />
          </div>
          <h3>Loading Purchase Records...</h3>
        </div>
      ) : filteredPurchases.length === 0 ? (
        <div className="shnoor-empty-state">
          <div className="empty-icon-circle">
            <Layers size={28} />
          </div>
          <h3>No Purchases Found</h3>
          <p>Create a purchase order to restock fabric or inventory items.</p>
        </div>
      ) : (
        <div className="shnoor-table-container">
          <table className="shnoor-table">
            <thead>
              <tr>
                <th>Invoice Ref</th>
                <th>Supplier Mill</th>
                <th>Invoice Amount</th>
                <th>Date Received</th>
                <th>Payment Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredPurchases.map(p => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 800, color: '#4338ca' }}>
                    #PO-{p.id.toString().padStart(4, '0')}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Building2 size={16} color="#6366f1" />
                      <span style={{ fontWeight: 700 }}>{p.supplier_name}</span>
                    </div>
                  </td>
                  <td style={{ fontWeight: 800, fontSize: 15 }}>
                    ₹{p.total_amount?.toLocaleString()}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#64748b' }}>
                      <Calendar size={13} />
                      <span>{p.created_at ? new Date(p.created_at).toLocaleDateString() : '-'}</span>
                    </div>
                  </td>
                  <td>
                    <span className="status-pill in-stock">
                      {p.payment_status || 'PAID'}
                    </span>
                  </td>
                  <td>
                    <button
                      className="icon-action-btn"
                      title="Delete / Reverse PO"
                      onClick={() => handleDelete(p.id)}
                    >
                      <Trash2 size={14} color="#ef4444" />
                    </button>
                  </td>
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
                <h3>Create Purchase Order</h3>
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
                  <label>Supplier Mill *</label>
                  <select
                    required
                    name="supplier_id"
                    value={formData.supplier_id}
                    onChange={handleInputChange}
                  >
                    <option value="">Select Supplier...</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.company || 'Mill'})</option>
                    ))}
                  </select>
                </div>

                <div className="form-group-item" style={{ marginBottom: 14 }}>
                  <label>Product to Restock *</label>
                  <select
                    required
                    name="product_id"
                    value={formData.product_id}
                    onChange={handleInputChange}
                  >
                    <option value="">Select Product...</option>
                    {products.map(prod => (
                      <option key={prod.id} value={prod.id}>
                        {prod.product_code} - {prod.name} (Current Stock: {prod.stock_quantity})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-grid-2">
                  <div className="form-group-item">
                    <label>Quantity *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      name="quantity"
                      placeholder="e.g. 50"
                      value={formData.quantity}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group-item">
                    <label>Purchase Price per Unit (₹) *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      name="purchase_price"
                      placeholder="e.g. 750.00"
                      value={formData.purchase_price}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                {formData.quantity && formData.purchase_price && (
                  <div style={{ marginTop: 16, background: '#f8fafc', padding: 12, borderRadius: 8, display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 600, color: '#64748b' }}>Estimated Total:</span>
                    <span style={{ fontWeight: 800, fontSize: 16, color: '#4338ca' }}>
                      ₹{(parseInt(formData.quantity) * parseFloat(formData.purchase_price)).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary-cancel" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-create-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Recording...' : 'Confirm PO & Add Stock'}
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

export default Purchases;
