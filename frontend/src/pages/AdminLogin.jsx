import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api';
import toast from 'react-hot-toast';
import RoleSelector from '../components/RoleSelector';
import { Shield, Lock, Mail, Key } from 'lucide-react';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.adminLogin({ email, password });
      login(res.data.token, res.data.user);
      toast.success(`Welcome back, Administrator ${res.data.user.name}!`);
      navigate('/admin');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Admin authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <RoleSelector />

      <div className="auth-card admin-auth-card">
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div className="admin-badge-icon">
            <Shield size={32} color="#f59e0b" />
          </div>
          <h2 style={{ fontSize: '1.8rem', marginTop: '0.75rem', marginBottom: '0.25rem' }}>Admin Portal</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Secure Administrator Authentication Point
          </p>
        </div>

        <div className="admin-security-notice">
          <Lock size={16} style={{ flexShrink: 0, marginTop: 2, color: '#f59e0b' }} />
          <span>
            <strong>Password Authentication Only:</strong> Google OAuth sign-in is disabled for Administrator accounts.
          </span>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Admin Email / Username</label>
            <div className="input-with-icon">
              <Mail size={18} className="input-icon" />
              <input
                type="email"
                placeholder="admin@blogvibe.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Password</label>
            <div className="input-with-icon">
              <Key size={18} className="input-icon" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-block admin-submit-btn" disabled={loading}>
            {loading ? 'Authenticating Admin…' : 'Access Admin Panel'}
          </button>
        </form>

        <div className="admin-credentials-hint">
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '1.5rem' }}>
            Default Admin Credentials: <code>admin@blogvibe.com</code> / <code>Admin@123</code>
          </p>
        </div>
      </div>
    </div>
  );
}
