import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  LogOut,
  Tags,
  Building2,
  FileText,
  CheckSquare,
  BarChart3,
  Clock,
  Bell,
  Sun,
  Moon,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Store,
  Layers,
  Sparkles
} from 'lucide-react';
import './DashboardLayout.css';

const DashboardLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [theme, setTheme] = useState('light');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showStoreDropdown, setShowStoreDropdown] = useState(false);
  const [currentStore, setCurrentStore] = useState('Main Showroom - Showroom 1');

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const role = user.role?.toUpperCase() || 'ADMIN';
  const basePath = role ? `/${role.toLowerCase()}` : '';

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const notifications = [
    { id: 1, title: 'Low Stock Alert', desc: 'Kanjivaram Silk Saree (8 units left)', time: '10m ago', unread: true },
    { id: 2, title: 'New Customer Order', desc: 'Order #ORD-108 confirmed (₹4,898)', time: '45m ago', unread: true },
    { id: 3, title: 'Supplier PO Received', desc: 'Batch #209 from Arvind Textiles received', time: '2h ago', unread: false },
    { id: 4, title: 'Task Completed', desc: 'Rahul completed Barcode tagging', time: '3h ago', unread: false }
  ];

  return (
    <div className={`dashboard-wrapper ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Top Header matching reference image */}
      <header className="top-navbar">
        <div className="navbar-left">
          <div className="brand-badge">
            <div className="brand-logo-icon">
              <span className="brand-glyph">CR</span>
            </div>
            <div className="brand-text-block">
              <h1 className="brand-title">CR Garments</h1>
              <span className="brand-subtitle">
                {role === 'ADMIN' ? 'Admin Dashboard' : role === 'MANAGER' ? 'Manager Hub' : 'Employee Portal'}
              </span>
            </div>
          </div>

          <div className="header-divider"></div>

          {/* VIEW AS dropdown */}
          <div className="view-as-container">
            <div 
              className="view-as-button"
              onClick={() => setShowStoreDropdown(!showStoreDropdown)}
              title="Switch store or organization view"
            >
              <div className="view-as-icon-box">
                <Store size={15} />
              </div>
              <div className="view-as-labels">
                <span className="view-as-small">VIEW AS</span>
                <span className="view-as-name">{currentStore}</span>
              </div>
              <ChevronDown size={14} className="dropdown-caret" />
            </div>

            {showStoreDropdown && (
              <div className="dropdown-popover store-dropdown">
                <div className="popover-title">Select Store / Branch</div>
                <div 
                  className={`dropdown-item ${currentStore.includes('Showroom 1') ? 'selected' : ''}`}
                  onClick={() => { setCurrentStore('Main Showroom - Showroom 1'); setShowStoreDropdown(false); }}
                >
                  <Store size={16} />
                  <div>
                    <div className="item-title">Main Showroom - Showroom 1</div>
                    <div className="item-sub">Central Hub & Flagship Store</div>
                  </div>
                </div>
                <div 
                  className={`dropdown-item ${currentStore.includes('Warehouse') ? 'selected' : ''}`}
                  onClick={() => { setCurrentStore('Central Warehouse - Depot 2'); setShowStoreDropdown(false); }}
                >
                  <Building2 size={16} />
                  <div>
                    <div className="item-title">Central Warehouse - Depot 2</div>
                    <div className="item-sub">Logistics & Wholesale Depot</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="navbar-right">
          {/* Theme switch button */}
          <button 
            className="icon-action-btn"
            onClick={toggleTheme}
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>

          {/* Live Operations badge with pulse */}
          <div className="live-status-badge">
            <span className="pulse-dot"></span>
            <span className="live-text">Live Operations</span>
          </div>

          {/* Notifications bell */}
          <div className="notification-wrapper">
            <button 
              className="icon-action-btn notification-btn"
              onClick={() => setShowNotifications(!showNotifications)}
              title="Notifications"
            >
              <Bell size={18} />
              <span className="notification-counter">2</span>
            </button>

            {showNotifications && (
              <div className="dropdown-popover notifications-dropdown">
                <div className="popover-header">
                  <h3>Notifications</h3>
                  <span className="unread-count-pill">2 new</span>
                </div>
                <div className="notifications-list">
                  {notifications.map(n => (
                    <div key={n.id} className={`notification-item ${n.unread ? 'unread' : ''}`}>
                      <div className="notif-indicator"></div>
                      <div className="notif-content">
                        <div className="notif-title">{n.title}</div>
                        <div className="notif-desc">{n.desc}</div>
                        <div className="notif-time">{n.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Logout button styled exactly like reference image (white button with red text/border) */}
          <button onClick={handleLogout} className="logout-btn-header">
            <LogOut size={16} className="logout-icon" />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Main Body with Sidebar + Content */}
      <div className="layout-body">
        {/* Sidebar matching reference image */}
        <aside className="main-sidebar">
          {/* Collapse Menu Header */}
          <div className="sidebar-collapse-row">
            <button 
              className="collapse-toggle-btn"
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              {isCollapsed ? (
                <ChevronRight size={16} />
              ) : (
                <>
                  <div className="collapse-label">
                    <ChevronLeft size={16} />
                    <span>Collapse Menu</span>
                  </div>
                  <span className="hide-badge">HIDE</span>
                </>
              )}
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="nav-menu">
            <ul>
              {/* Dashboard */}
              <li>
                <NavLink to={`${basePath}/dashboard`} className="menu-nav-link" title="Dashboard">
                  <LayoutDashboard className="nav-icon" />
                  <span className="link-text">Dashboard</span>
                </NavLink>
              </li>

              {/* Products (All roles) */}
              <li>
                <NavLink to={`${basePath}/products`} className="menu-nav-link" title="Manage Products">
                  <Package className="nav-icon" />
                  <span className="link-text">
                    {role === 'EMPLOYEE' ? 'Product Catalog' : 'Manage Products'}
                  </span>
                </NavLink>
              </li>

              {/* Categories (Admin & Manager) */}
              {(role === 'ADMIN' || role === 'MANAGER') && (
                <li>
                  <NavLink to={`${basePath}/categories`} className="menu-nav-link" title="Categories">
                    <Tags className="nav-icon" />
                    <span className="link-text">Categories</span>
                  </NavLink>
                </li>
              )}

              {/* Orders (All roles) */}
              <li>
                <NavLink to={`${basePath}/orders`} className="menu-nav-link" title="Manage Orders">
                  <FileText className="nav-icon" />
                  <span className="link-text">Manage Orders</span>
                </NavLink>
              </li>

              {/* Reports (Admin & Manager) */}
              {(role === 'ADMIN' || role === 'MANAGER') && (
                <li>
                  <NavLink to={`${basePath}/reports`} className="menu-nav-link" title="Orders Report">
                    <BarChart3 className="nav-icon" />
                    <span className="link-text">Orders Report</span>
                  </NavLink>
                </li>
              )}

              {/* POS / Checkout (All roles) */}
              <li>
                <NavLink to={`${basePath}/pos`} className="menu-nav-link" title="POS / Billing">
                  <ShoppingCart className="nav-icon" />
                  <span className="link-text">POS / Billing</span>
                </NavLink>
              </li>

              {/* Customers (All roles) */}
              <li>
                <NavLink to={`${basePath}/customers`} className="menu-nav-link" title="Customers">
                  <Users className="nav-icon" />
                  <span className="link-text">Customers</span>
                </NavLink>
              </li>

              {/* Tasks (All roles) */}
              <li>
                <NavLink to={`${basePath}/tasks`} className="menu-nav-link" title="Tasks & Operations">
                  <CheckSquare className="nav-icon" />
                  <span className="link-text">Tasks & Ops</span>
                </NavLink>
              </li>

              {/* Suppliers (Admin & Manager) */}
              {(role === 'ADMIN' || role === 'MANAGER') && (
                <li>
                  <NavLink to={`${basePath}/suppliers`} className="menu-nav-link" title="Suppliers">
                    <Building2 className="nav-icon" />
                    <span className="link-text">Suppliers</span>
                  </NavLink>
                </li>
              )}

              {/* Purchases (Admin & Manager) */}
              {(role === 'ADMIN' || role === 'MANAGER') && (
                <li>
                  <NavLink to={`${basePath}/purchases`} className="menu-nav-link" title="Purchases">
                    <Layers className="nav-icon" />
                    <span className="link-text">Purchases</span>
                  </NavLink>
                </li>
              )}
            </ul>
          </nav>

          {/* Sidebar Footer */}
          <div className="sidebar-bottom-profile">
            <div className="user-avatar-circle">
              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            {!isCollapsed && (
              <div className="user-profile-details">
                <div className="profile-name">{user.name || 'User'}</div>
                <div className="profile-role-pill">{role}</div>
              </div>
            )}
          </div>
        </aside>

        {/* Page Content Viewport */}
        <main className="content-viewport">
          <div key={location.pathname} className="page-transition-enter">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
