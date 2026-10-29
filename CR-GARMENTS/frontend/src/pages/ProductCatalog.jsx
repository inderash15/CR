import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { productsAPI, categoriesAPI } from '../services/api';
import './Products.css';
import {
  Search,
  Package,
  Calendar,
  FileText,
  CheckCircle,
  Eye,
  Filter,
  ChevronDown,
  X
} from 'lucide-react';

const ProductCatalog = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [prodRes, catRes] = await Promise.all([
        productsAPI.getAll(),
        categoriesAPI.getAll()
      ]);
      if (prodRes.data.success) setProducts(prodRes.data.data);
      if (catRes.data.success) setCategories(catRes.data.data);
    } catch (err) {
      console.error("Failed to load catalog", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.product_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.brand && p.brand.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.category && p.category.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCat =
        categoryFilter === 'all' ||
        p.category_id?.toString() === categoryFilter ||
        p.category === categoryFilter;

      return matchesSearch && matchesCat;
    });
  }, [products, searchTerm, categoryFilter]);

  return (
    <div className="shnoor-page-container">
      {/* Page Header */}
      <div className="shnoor-page-header">
        <div className="shnoor-title-block">
          <h2>Product Catalog</h2>
          <p>Browse live showroom inventory, fabrics, and customer pricing</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="shnoor-search-filter-bar">
        <div className="search-input-wrapper">
          <Search size={18} className="search-input-icon" />
          <input
            type="text"
            className="search-input-field"
            placeholder="Search catalog by name, category, SKU or brand..."
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
            <span>Category: {categoryFilter === 'all' ? 'All' : categories.find(c => c.id.toString() === categoryFilter)?.name || 'Filtered'}</span>
            <ChevronDown size={14} />
          </button>

          {showFilterDropdown && (
            <div className="dropdown-popover" style={{ right: 0, width: 220, padding: 8 }}>
              <div className="popover-title">Filter by Category</div>
              <div
                className={`dropdown-item ${categoryFilter === 'all' ? 'selected' : ''}`}
                onClick={() => { setCategoryFilter('all'); setShowFilterDropdown(false); }}
              >
                All Categories
              </div>
              {categories.map(c => (
                <div
                  key={c.id}
                  className={`dropdown-item ${categoryFilter === c.id.toString() ? 'selected' : ''}`}
                  onClick={() => { setCategoryFilter(c.id.toString()); setShowFilterDropdown(false); }}
                >
                  {c.name}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sub Toolbar */}
      <div className="shnoor-sub-toolbar">
        <span className="showing-counter">
          Showing {filteredProducts.length} of {products.length} products
        </span>
      </div>

      {/* Cards Grid */}
      {loading ? (
        <div className="shnoor-empty-state">
          <div className="empty-icon-circle">
            <Package size={28} className="animate-spin" />
          </div>
          <h3>Loading Catalog...</h3>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="shnoor-empty-state">
          <div className="empty-icon-circle">
            <Package size={28} />
          </div>
          <h3>No Matching Garments</h3>
          <p>Try searching for a different keyword or category.</p>
        </div>
      ) : (
        <div className="shnoor-cards-grid">
          {filteredProducts.map(p => {
            const isLowStock = p.stock_quantity <= (p.min_stock || 10);
            const isOutStock = p.stock_quantity === 0;

            return (
              <div key={p.id} className="shnoor-card">
                <div className="card-top-row">
                  <div className="card-top-left">
                    <div className="card-icon-box">
                      <FileText size={18} />
                    </div>
                  </div>
                  <span className={`status-pill ${isOutStock ? 'out-of-stock' : isLowStock ? 'low-stock' : 'in-stock'}`}>
                    {isOutStock ? 'Out of Stock' : isLowStock ? 'Low Stock' : 'In Stock'}
                  </span>
                </div>

                <h3 className="card-item-title">{p.name}</h3>

                <div className="card-tags-row">
                  <span className="meta-pill price-pill">₹{p.selling_price?.toLocaleString()}</span>
                  <span className="meta-pill">{p.category || 'General'}</span>
                  {p.size && <span className="meta-pill">Size: {p.size}</span>}
                </div>

                <div className="card-date-row">
                  <Calendar size={13} />
                  <span>SKU: {p.product_code} • Brand: {p.brand || 'CR Originals'}</span>
                </div>

                <div className="card-stats-box">
                  <div className="stat-item">
                    <Package size={18} className="stat-icon" />
                    <div className="stat-text">
                      <span className="stat-value">{p.stock_quantity || 0}</span>
                      <span className="stat-label">Units Available</span>
                    </div>
                  </div>
                  <div className="stat-item">
                    <CheckCircle size={18} style={{ color: '#10b981' }} />
                    <div className="stat-text">
                      <span className="stat-value">{p.fabric || 'Pure Cotton'}</span>
                      <span className="stat-label">Material</span>
                    </div>
                  </div>
                </div>

                <div className="card-actions-row">
                  <button
                    className="btn-card-primary"
                    onClick={() => setSelectedProduct(p)}
                  >
                    <Eye size={16} />
                    <span>View Specifications</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Product Details Modal */}
      {selectedProduct &&
        createPortal(
          <div className="modal-overlay" onClick={() => setSelectedProduct(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{selectedProduct.name}</h3>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setSelectedProduct(null)}
                >
                  <X size={18} />
                </button>
              </div>
              <div className="modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>Product SKU</div>
                    <div style={{ fontWeight: 800, fontSize: 16, color: '#4338ca' }}>{selectedProduct.product_code}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>Selling Price</div>
                    <div style={{ fontWeight: 800, fontSize: 18, color: '#10b981' }}>₹{selectedProduct.selling_price?.toLocaleString()}</div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>Category</div>
                    <div style={{ fontWeight: 700 }}>{selectedProduct.category || 'General'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>Brand</div>
                    <div style={{ fontWeight: 700 }}>{selectedProduct.brand || 'CR Originals'}</div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>Fabric & Material</div>
                    <div style={{ fontWeight: 700 }}>{selectedProduct.fabric || '100% Cotton'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>Available Sizes</div>
                    <div style={{ fontWeight: 700 }}>{selectedProduct.size || 'Standard'}</div>
                  </div>
                </div>

                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Description</div>
                  <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, fontSize: 13, color: '#334155' }}>
                    {selectedProduct.description || 'No detailed description provided.'}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-create-primary"
                  onClick={() => setSelectedProduct(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default ProductCatalog;
