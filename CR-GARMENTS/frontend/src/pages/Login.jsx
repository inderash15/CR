import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import './Login.css';
import { Lock, Mail, Eye, EyeOff, Shield, Briefcase, UserCheck } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('admin@crgarments.com');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.login({ email, password });
      if (response.data.success) {
        const user = response.data.data.user;
        localStorage.setItem('token', response.data.data.token);
        localStorage.setItem('user', JSON.stringify(user));

        const role = user.role?.toUpperCase();
        if (role === 'ADMIN') navigate('/admin/dashboard');
        else if (role === 'MANAGER') navigate('/manager/dashboard');
        else if (role === 'EMPLOYEE') navigate('/employee/dashboard');
        else navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const quickFill = (userEmail, userPass) => {
    setEmail(userEmail);
    setPassword(userPass);
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <div className="login-logo-circle">
            <span>CR</span>
          </div>
          <h1>CR GARMENTS</h1>
          <p>Centralized Garment & Retail Operations System</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleLogin} className="login-form">
          <div className="input-group">
            <Mail className="input-icon" />
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <Lock className="input-icon" />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="password-toggle-btn"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <button type="submit" disabled={loading} className="login-btn">
            {loading ? 'Authenticating...' : 'Sign In to Portal'}
          </button>
        </form>

        {/* Demo Fast Login Pills */}
        <div className="demo-accounts-box">
          <span className="demo-label">One-Click Role Login:</span>
          <div className="demo-buttons-row">
            <button
              type="button"
              className="demo-pill-btn admin"
              onClick={() => quickFill('admin@crgarments.com', 'admin123')}
            >
              <Shield size={13} /> Admin
            </button>
            <button
              type="button"
              className="demo-pill-btn manager"
              onClick={() => quickFill('manager@crgarments.com', 'manager123')}
            >
              <Briefcase size={13} /> Manager
            </button>
            <button
              type="button"
              className="demo-pill-btn employee"
              onClick={() => quickFill('employee@crgarments.com', 'employee123')}
            >
              <UserCheck size={13} /> Employee
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
