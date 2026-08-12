import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { sharesApi, getImageUrl } from '../api';
import { Bell, PenSquare, LogOut, User, Shield } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!user) { setUnread(0); return; }
    const fetchCount = () =>
      sharesApi.getUnreadCount()
        .then(res => setUnread(res.data.count || 0))
        .catch(() => {});
    fetchCount();
    const timer = setInterval(fetchCount, 30_000);
    return () => clearInterval(timer);
  }, [user]);

  const handleSearch = (e) => {
    if (e.key === 'Enter' && search.trim()) {
      navigate(`/?search=${encodeURIComponent(search.trim())}`);
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-logo">BlogVibe</Link>

        <div className="navbar-search">
          <input
            placeholder="Search posts…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleSearch}
          />
        </div>

        <div className="navbar-links">
          {user ? (
            <>
              {user.role === 'ROLE_ADMIN' && (
                <Link to="/admin">
                  <button className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: 6, borderColor: '#f59e0b', color: '#f59e0b' }}>
                    <Shield size={16} /> Admin
                  </button>
                </Link>
              )}

              <Link to="/create">
                <button className="btn btn-primary">
                  <PenSquare size={15} /> Write
                </button>
              </Link>

              <Link to="/inbox" style={{ position: 'relative', display:'inline-block' }}>
                <button className="btn btn-ghost">
                  <Bell size={18} />
                  {unread > 0 && (
                    <span style={{
                      position: 'absolute', top: 4, right: 4,
                      background: 'var(--accent)', color: '#0f0e0d',
                      borderRadius: '50%', width: 16, height: 16,
                      fontSize: '0.65rem', fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {unread > 9 ? '9+' : unread}
                    </span>
                  )}
                </button>
              </Link>

              <Link to="/profile">
                {user.profilePicture ? (
                  <img src={getImageUrl(user.profilePicture)} alt={user.name} className="avatar"
                    style={{ cursor: 'pointer', border: '2px solid transparent', transition: 'border-color .2s' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}
                  />
                ) : (
                  <button className="btn btn-ghost"><User size={18} /></button>
                )}
              </Link>

              <button className="btn btn-ghost" title="Logout" onClick={logout}>
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <>
              <Link to="/login"><button className="btn btn-ghost">Login</button></Link>
              <Link to="/admin/login">
                <button className="btn btn-ghost" style={{ color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Shield size={16} /> Admin Portal
                </button>
              </Link>
              <Link to="/register"><button className="btn btn-primary">Sign Up</button></Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
