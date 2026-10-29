import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import './index.css';

// Eager load Login for fast initial auth rendering
import Login from './pages/Login';

// Lazy load protected pages to drastically reduce the initial JS bundle size
const Dashboard = lazy(() => import('./pages/Dashboard'));
const ManagerDashboard = lazy(() => import('./pages/ManagerDashboard'));
const EmployeeDashboard = lazy(() => import('./pages/EmployeeDashboard'));
const Products = lazy(() => import('./pages/Products'));
const Categories = lazy(() => import('./pages/Categories'));
const POS = lazy(() => import('./pages/POS'));
const Customers = lazy(() => import('./pages/Customers'));
const Suppliers = lazy(() => import('./pages/Suppliers'));
const Purchases = lazy(() => import('./pages/Purchases'));
const Orders = lazy(() => import('./pages/Orders'));
const ProductCatalog = lazy(() => import('./pages/ProductCatalog'));
const Tasks = lazy(() => import('./pages/Tasks'));

// Loading fallback component
const PageLoader = () => (
  <div className="page-transition-enter" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: '60vh', color: '#64748b' }}>
    <svg className="animate-spin" style={{ height: '40px', width: '40px', color: '#3b82f6', marginBottom: '16px' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
    <p style={{ fontWeight: 500, letterSpacing: '0.5px' }}>Loading Dashboard...</p>
  </div>
);

// Role-based route protector
const RoleRoute = ({ children, allowedRoles }) => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const role = user.role?.toUpperCase();
  const location = useLocation();

  if (!localStorage.getItem('token')) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    // Redirect to correct dashboard based on their role
    if (role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
    if (role === 'MANAGER') return <Navigate to="/manager/dashboard" replace />;
    if (role === 'EMPLOYEE') return <Navigate to="/employee/dashboard" replace />;
    return <Navigate to="/" replace />;
  }

  return children;
};

// Root redirector based on auth
const RootRedirect = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (localStorage.getItem('token') && user.role) {
    if (user.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
    if (user.role === 'MANAGER') return <Navigate to="/manager/dashboard" replace />;
    if (user.role === 'EMPLOYEE') return <Navigate to="/employee/dashboard" replace />;
  }
  return <Login />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        
        {/* ADMIN ROUTES */}
        <Route path="/admin" element={
          <RoleRoute allowedRoles={['ADMIN']}>
            <DashboardLayout />
          </RoleRoute>
        }>
          <Route path="dashboard" element={<Suspense fallback={<PageLoader />}><Dashboard /></Suspense>} />
          <Route path="products" element={<Suspense fallback={<PageLoader />}><Products /></Suspense>} />
          <Route path="categories" element={<Suspense fallback={<PageLoader />}><Categories /></Suspense>} />
          <Route path="customers" element={<Suspense fallback={<PageLoader />}><Customers /></Suspense>} />
          <Route path="orders" element={<Suspense fallback={<PageLoader />}><Orders /></Suspense>} />
          <Route path="suppliers" element={<Suspense fallback={<PageLoader />}><Suppliers /></Suspense>} />
          <Route path="purchases" element={<Suspense fallback={<PageLoader />}><Purchases /></Suspense>} />
          <Route path="pos" element={<Suspense fallback={<PageLoader />}><POS /></Suspense>} />
          <Route path="tasks" element={<Suspense fallback={<PageLoader />}><Tasks /></Suspense>} />
        </Route>

        {/* MANAGER ROUTES */}
        <Route path="/manager" element={
          <RoleRoute allowedRoles={['MANAGER', 'ADMIN']}>
            <DashboardLayout />
          </RoleRoute>
        }>
          <Route path="dashboard" element={<Suspense fallback={<PageLoader />}><ManagerDashboard /></Suspense>} />
          <Route path="products" element={<Suspense fallback={<PageLoader />}><Products /></Suspense>} />
          <Route path="categories" element={<Suspense fallback={<PageLoader />}><Categories /></Suspense>} />
          <Route path="customers" element={<Suspense fallback={<PageLoader />}><Customers /></Suspense>} />
          <Route path="orders" element={<Suspense fallback={<PageLoader />}><Orders /></Suspense>} />
          <Route path="suppliers" element={<Suspense fallback={<PageLoader />}><Suppliers /></Suspense>} />
          <Route path="purchases" element={<Suspense fallback={<PageLoader />}><Purchases /></Suspense>} />
          <Route path="pos" element={<Suspense fallback={<PageLoader />}><POS /></Suspense>} />
          <Route path="tasks" element={<Suspense fallback={<PageLoader />}><Tasks /></Suspense>} />
        </Route>

        {/* EMPLOYEE ROUTES */}
        <Route path="/employee" element={
          <RoleRoute allowedRoles={['EMPLOYEE', 'MANAGER', 'ADMIN']}>
            <DashboardLayout />
          </RoleRoute>
        }>
          <Route path="dashboard" element={<Suspense fallback={<PageLoader />}><EmployeeDashboard /></Suspense>} />
          <Route path="products" element={<Suspense fallback={<PageLoader />}><ProductCatalog /></Suspense>} />
          <Route path="pos" element={<Suspense fallback={<PageLoader />}><POS /></Suspense>} />
          <Route path="customers" element={<Suspense fallback={<PageLoader />}><Customers /></Suspense>} />
          <Route path="orders" element={<Suspense fallback={<PageLoader />}><Orders /></Suspense>} />
        </Route>
        
        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
