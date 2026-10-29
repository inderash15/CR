import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { productsAPI, salesAPI, customersAPI, categoriesAPI } from '../services/api';
import { generateInvoice } from '../utils/invoiceGenerator';
import './POS.css';
import {
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  X,
  CheckCircle,
  CreditCard,
  Banknote,
  QrCode,
  Printer,
  Download,
  User,
  RotateCcw,
  Package,
  Layers,
  Sparkles,
} from 'lucide-react';

const POS = () => {
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');

  // Discount state
  const [discountPercent, setDiscountPercent] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [discountMode, setDiscountMode] = useState('amount'); // 'preset' or 'amount'

  const [loading, setLoading] = useState(false);
  const [lastCompletedSale, setLastCompletedSale] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  const searchInputRef = useRef(null);
  const TAX_RATE = 0.05; // 5% GST

  // Fetch initial data
  const fetchData = async () => {
    try {
      const [prodRes, custRes, catRes] = await Promise.all([
        productsAPI.getAll(),
        customersAPI.getAll().catch(() => ({ data: { success: false, data: [] } })),
        categoriesAPI.getAll().catch(() => ({ data: { success: false, data: [] } })),
      ]);

      if (prodRes.data?.success) {
        setProducts(prodRes.data.data || []);
      }
      if (custRes.data?.success) {
        setCustomers(custRes.data.data || []);
      }
      if (catRes.data?.success) {
        setCategories(catRes.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load POS data:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter products by search and category
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.product_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.barcode && p.barcode.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCategory =
        selectedCategory === 'All' ||
        (p.category && p.category.toLowerCase() === selectedCategory.toLowerCase());

      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, selectedCategory]);

  // Cart operations
  const addToCart = (product) => {
    if (!product || (product.stock_quantity ?? 0) <= 0) {
      alert(`"${product.name}" is currently out of stock.`);
      return;
    }

    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock_quantity) {
          alert(`Maximum available stock reached for ${product.name} (${product.stock_quantity} available)`);
          return prevCart;
        }
        return prevCart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [
        ...prevCart,
        {
          id: product.id,
          name: product.name,
          product_code: product.product_code,
          selling_price: Number(product.selling_price) || 0,
          stock_quantity: Number(product.stock_quantity) || 0,
          category: product.category,
          quantity: 1,
        },
      ];
    });
  };

  const updateQuantity = (id, delta) => {
    setCart((prevCart) =>
      prevCart
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            if (newQty > item.stock_quantity) {
              alert(`Maximum available stock reached for ${item.name} (${item.stock_quantity} available)`);
              return item;
            }
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const removeFromCart = (id) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== id));
  };

  const clearCart = () => {
    setCart([]);
    setDiscountAmount(0);
    setDiscountPercent(0);
  };

  // Barcode / Fast Enter scanner simulator
  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter' && searchTerm.trim()) {
      const exactMatch = products.find(
        (p) =>
          p.product_code.toLowerCase() === searchTerm.trim().toLowerCase() ||
          (p.barcode && p.barcode.toLowerCase() === searchTerm.trim().toLowerCase())
      );
      if (exactMatch) {
        addToCart(exactMatch);
        setSearchTerm('');
      }
    }
  };

  // Computations
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.selling_price * item.quantity, 0);
  }, [cart]);

  const totalDiscount = useMemo(() => {
    if (discountMode === 'preset') {
      return (subtotal * discountPercent) / 100;
    }
    return Math.min(subtotal, Math.max(0, Number(discountAmount) || 0));
  }, [subtotal, discountMode, discountPercent, discountAmount]);

  const taxAmount = useMemo(() => {
    const taxableAmount = Math.max(0, subtotal - totalDiscount);
    return taxableAmount * TAX_RATE;
  }, [subtotal, totalDiscount]);

  const grandTotal = useMemo(() => {
    return Math.max(0, subtotal - totalDiscount + taxAmount);
  }, [subtotal, totalDiscount, taxAmount]);

  // Selected customer details
  const selectedCustomer = useMemo(() => {
    if (!selectedCustomerId) return null;
    return customers.find((c) => String(c.id) === String(selectedCustomerId)) || null;
  }, [customers, selectedCustomerId]);

  // Complete Sale
  const handleCheckout = async () => {
    if (cart.length === 0) {
      alert('Cart is empty. Please select products to begin billing.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        cart: cart.map((item) => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          selling_price: item.selling_price,
        })),
        discount: totalDiscount,
        tax: taxAmount,
        grandTotal: grandTotal,
        customer_id: selectedCustomerId ? Number(selectedCustomerId) : null,
        payment_method: paymentMethod,
      };

      const res = await salesAPI.create(payload);
      if (res.data?.success) {
        const completedSale = {
          sale_id: res.data.sale_id,
          invoice_no: res.data.invoice_no || `INV-${String(res.data.sale_id).padStart(4, '0')}`,
          cart: [...cart],
          subtotal,
          discount: totalDiscount,
          tax: taxAmount,
          grandTotal,
          payment_method: paymentMethod,
          customer_name: selectedCustomer?.name || 'Walk-in Customer',
          customer_phone: selectedCustomer?.phone || '',
          date: new Date().toLocaleString(),
        };

        setLastCompletedSale(completedSale);
        setShowReceiptModal(true);

        // Reset cart
        clearCart();

        // Refresh inventory to reflect deducted stock
        const pRes = await productsAPI.getAll();
        if (pRes.data?.success) {
          setProducts(pRes.data.data || []);
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Sale checkout encountered an error.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadInvoice = () => {
    if (lastCompletedSale) {
      generateInvoice(lastCompletedSale);
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <div className="pos-container">
      {/* -------------------------------------------------------------
          LEFT PANE: PRODUCT SELECTION & FAST LOOKUP
          ------------------------------------------------------------- */}
      <div className="pos-products-pane">
        <div className="pos-pane-header">
          <div className="pos-header-top">
            <div className="pos-title-block">
              <h2>Point of Sale (POS)</h2>
              <p>Scan barcode or click items to add directly to current ticket</p>
            </div>

            <div className="pos-search-wrapper">
              <Search size={16} className="pos-search-icon" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search name, SKU, or scan barcode..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className="pos-search-input"
              />
              {searchTerm && (
                <button
                  type="button"
                  className="pos-search-clear"
                  onClick={() => setSearchTerm('')}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="pos-categories-bar">
            <button
              type="button"
              className={`pos-category-chip ${selectedCategory === 'All' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('All')}
            >
              All Products ({products.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                className={`pos-category-chip ${selectedCategory.toLowerCase() === cat.name.toLowerCase() ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat.name)}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="pos-grid-container">
          {filteredProducts.length === 0 ? (
            <div className="cart-empty-state">
              <div className="empty-icon-box">
                <Package size={28} />
              </div>
              <h4>No garments found</h4>
              <p>Try searching for a different keyword or select another category.</p>
            </div>
          ) : (
            <div className="pos-product-cards-grid">
              {filteredProducts.map((p) => {
                const stock = Number(p.stock_quantity) || 0;
                const isOutOfStock = stock <= 0;
                const isLowStock = stock > 0 && stock <= 10;

                return (
                  <div
                    key={p.id}
                    className={`pos-card-item ${isOutOfStock ? 'out-of-stock' : ''}`}
                    onClick={() => !isOutOfStock && addToCart(p)}
                    title={isOutOfStock ? 'Out of stock' : 'Click to add to sale'}
                  >
                    <div className="pos-card-top-row">
                      <span className="pos-product-sku">{p.product_code}</span>
                      <span
                        className={`pos-card-stock-pill ${
                          isOutOfStock ? 'stock-out' : isLowStock ? 'stock-low' : 'stock-in'
                        }`}
                      >
                        {isOutOfStock ? 'Out of Stock' : `${stock} in stock`}
                      </span>
                    </div>

                    <h4 className="pos-product-name">{p.name}</h4>
                    <span className="pos-product-category">{p.category || 'General Apparel'}</span>

                    <div className="pos-card-footer">
                      <span className="pos-card-price">
                        ₹{Number(p.selling_price).toLocaleString('en-IN')}
                      </span>
                      <button
                        type="button"
                        className="pos-card-add-btn"
                        disabled={isOutOfStock}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isOutOfStock) addToCart(p);
                        }}
                      >
                        <Plus size={13} /> Add
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* -------------------------------------------------------------
          RIGHT PANE: CURRENT SALE CART (TARGET USER SECTION)
          ------------------------------------------------------------- */}
      <div className="pos-cart-pane">
        {/* Cart Header */}
        <div className="cart-header-row">
          <div className="cart-header-title">
            <div className="cart-icon-bubble">
              <ShoppingCart size={18} />
            </div>
            <div>
              <h3>
                Current Sale
                <span className="cart-count-badge">
                  {cart.reduce((s, i) => s + i.quantity, 0)}
                </span>
              </h3>
            </div>
          </div>

          <button
            type="button"
            className="cart-clear-btn"
            onClick={clearCart}
            disabled={cart.length === 0}
            title="Empty all items from current sale"
          >
            <RotateCcw size={13} /> Clear
          </button>
        </div>

        {/* Customer Select Dropdown */}
        <div className="cart-customer-section">
          <div className="customer-label-row">
            <span>Customer</span>
            {selectedCustomer && (
              <span style={{ color: '#4338ca', fontWeight: 800 }}>
                {selectedCustomer.loyalty_points || 0} Loyalty Pts
              </span>
            )}
          </div>
          <select
            className="cart-customer-select"
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
          >
            <option value="">👤 Walk-in Customer</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} {c.phone ? `(${c.phone})` : ''} - {c.loyalty_points || 0} pts
              </option>
            ))}
          </select>
        </div>

        {/* Cart Item Scrollable Area */}
        <div className="cart-items-list">
          {cart.length === 0 ? (
            <div className="cart-empty-state">
              <div className="empty-icon-box">
                <ShoppingCart size={28} />
              </div>
              <h4>Cart is empty</h4>
              <p>Select products from the left or scan barcode to begin billing.</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="cart-item-row">
                <div className="cart-item-info">
                  <h5 className="cart-item-name">{item.name}</h5>
                  <div className="cart-item-meta">
                    <span>{item.product_code}</span>
                    <span>•</span>
                    <span className="cart-item-rate">
                      ₹{item.selling_price.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Quantity Controls */}
                <div className="cart-item-controls">
                  <button
                    type="button"
                    className="cart-qty-btn"
                    onClick={() => updateQuantity(item.id, -1)}
                    title="Decrease quantity"
                  >
                    <Minus size={12} />
                  </button>
                  <span className="cart-qty-value">{item.quantity}</span>
                  <button
                    type="button"
                    className="cart-qty-btn"
                    onClick={() => updateQuantity(item.id, 1)}
                    disabled={item.quantity >= item.stock_quantity}
                    title="Increase quantity"
                  >
                    <Plus size={12} />
                  </button>
                </div>

                {/* Line Total */}
                <span className="cart-item-total">
                  ₹{(item.selling_price * item.quantity).toLocaleString('en-IN')}
                </span>

                {/* Delete Item */}
                <button
                  type="button"
                  className="cart-item-remove-btn"
                  onClick={() => removeFromCart(item.id)}
                  title="Remove item"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Dynamic Billing Calculations & Payment Options */}
        <div className="cart-summary-footer">
          <div className="summary-calc-rows">
            <div className="summary-calc-row">
              <span>Subtotal</span>
              <span>₹{subtotal.toLocaleString('en-IN')}</span>
            </div>

            {/* Discount Row */}
            <div className="discount-control-wrapper">
              <div className="discount-header">
                <span>Discount</span>
                <div className="discount-presets">
                  {[0, 5, 10, 15].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      className={`discount-preset-btn ${
                        discountMode === 'preset' && discountPercent === pct ? 'active' : ''
                      }`}
                      onClick={() => {
                        setDiscountMode('preset');
                        setDiscountPercent(pct);
                        setDiscountAmount(0);
                      }}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>

              <div className="discount-input-row">
                <div className="discount-currency-input">
                  <span>₹</span>
                  <input
                    type="number"
                    min="0"
                    max={subtotal}
                    placeholder="Custom ₹ discount"
                    value={discountMode === 'amount' ? (discountAmount === 0 ? '' : discountAmount) : ''}
                    onChange={(e) => {
                      setDiscountMode('amount');
                      setDiscountPercent(0);
                      const val = e.target.value === '' ? 0 : Math.max(0, Number(e.target.value));
                      setDiscountAmount(val);
                    }}
                  />
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#ef4444' }}>
                  - ₹{totalDiscount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Tax Row */}
            <div className="summary-calc-row">
              <span>Tax (GST 5%)</span>
              <span>
                ₹{taxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="payment-mode-section">
            <span className="payment-mode-label">Payment Method</span>
            <div className="payment-modes-grid">
              <button
                type="button"
                className={`payment-mode-chip ${paymentMethod === 'CASH' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('CASH')}
              >
                <Banknote size={15} /> Cash
              </button>
              <button
                type="button"
                className={`payment-mode-chip ${paymentMethod === 'UPI' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('UPI')}
              >
                <QrCode size={15} /> UPI / QR
              </button>
              <button
                type="button"
                className={`payment-mode-chip ${paymentMethod === 'CARD' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('CARD')}
              >
                <CreditCard size={15} /> Card
              </button>
            </div>
          </div>

          {/* Grand Total */}
          <div className="grand-total-banner">
            <span className="grand-total-label">Total Payable</span>
            <span className="grand-total-amount">
              ₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          {/* Checkout Button */}
          <button
            type="button"
            className="btn-checkout-sale"
            onClick={handleCheckout}
            disabled={cart.length === 0 || loading}
          >
            {loading ? (
              'Processing Sale...'
            ) : (
              <>
                <CheckCircle size={18} />
                Pay ₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </>
            )}
          </button>
        </div>
      </div>

      {/* -------------------------------------------------------------
          SUCCESS RECEIPT / INVOICE MODAL
          ------------------------------------------------------------- */}
      {showReceiptModal &&
        lastCompletedSale &&
        createPortal(
          <div className="modal-overlay" onClick={() => setShowReceiptModal(false)}>
            <div className="receipt-card" onClick={(e) => e.stopPropagation()}>
              <div className="receipt-header-success">
                <div className="receipt-success-icon">
                  <CheckCircle size={28} />
                </div>
                <h3>Sale Completed Successfully!</h3>
                <span className="receipt-invoice-pill">{lastCompletedSale.invoice_no}</span>
              </div>

              <div className="receipt-body">
                <div className="receipt-meta-grid">
                  <div className="receipt-meta-item">
                    <span>Date & Time</span>
                    <span>{lastCompletedSale.date}</span>
                  </div>
                  <div className="receipt-meta-item">
                    <span>Payment Mode</span>
                    <span>{lastCompletedSale.payment_method}</span>
                  </div>
                  <div className="receipt-meta-item">
                    <span>Customer</span>
                    <span>{lastCompletedSale.customer_name}</span>
                  </div>
                  {lastCompletedSale.customer_phone && (
                    <div className="receipt-meta-item">
                      <span>Phone</span>
                      <span>{lastCompletedSale.customer_phone}</span>
                    </div>
                  )}
                </div>

                {/* Items */}
                <table className="receipt-items-table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th style={{ textAlign: 'center' }}>Qty</th>
                      <th style={{ textAlign: 'right' }}>Price</th>
                      <th style={{ textAlign: 'right' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lastCompletedSale.cart.map((item, idx) => (
                      <tr key={idx}>
                        <td>{item.name}</td>
                        <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                        <td style={{ textAlign: 'right' }}>
                          ₹{Number(item.selling_price).toLocaleString('en-IN')}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700 }}>
                          ₹{(item.selling_price * item.quantity).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Totals */}
                <div className="receipt-totals-list">
                  <div className="receipt-total-row">
                    <span>Subtotal</span>
                    <span>₹{lastCompletedSale.subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  {lastCompletedSale.discount > 0 && (
                    <div className="receipt-total-row" style={{ color: '#ef4444' }}>
                      <span>Discount</span>
                      <span>- ₹{lastCompletedSale.discount.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="receipt-total-row">
                    <span>GST (5%)</span>
                    <span>
                      ₹{lastCompletedSale.tax.toLocaleString('en-IN', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div className="receipt-grand-row">
                    <span>Grand Total</span>
                    <span style={{ color: '#10b981' }}>
                      ₹{lastCompletedSale.grandTotal.toLocaleString('en-IN', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="receipt-actions-footer">
                <button
                  type="button"
                  className="btn-receipt-action btn-receipt-secondary"
                  onClick={handlePrintReceipt}
                >
                  <Printer size={15} /> Print
                </button>
                <button
                  type="button"
                  className="btn-receipt-action btn-receipt-secondary"
                  onClick={handleDownloadInvoice}
                >
                  <Download size={15} /> Download PDF
                </button>
                <button
                  type="button"
                  className="btn-receipt-action btn-receipt-primary"
                  onClick={() => setShowReceiptModal(false)}
                >
                  New Sale
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default POS;
