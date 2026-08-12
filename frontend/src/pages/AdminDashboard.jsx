import { useState, useEffect, useCallback } from 'react';
import { adminApi, getImageUrl } from '../api';
import toast from 'react-hot-toast';
import { 
  Users, 
  FileText, 
  MessageSquare, 
  ShieldCheck, 
  ShieldAlert, 
  Trash2, 
  UserCheck, 
  UserX, 
  Search, 
  Shield, 
  BarChart2, 
  RefreshCw, 
  ExternalLink,
  CheckCircle,
  XCircle
} from 'lucide-react';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [moderationLogs, setModerationLogs] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const res = await adminApi.getStats();
      setStats(res.data);
    } catch {
      toast.error('Failed to load dashboard statistics');
    }
  }, []);

  const fetchUsers = useCallback(async (query = '') => {
    try {
      const res = await adminApi.getUsers(query ? { query } : {});
      setUsers(res.data);
    } catch {
      toast.error('Failed to fetch user list');
    }
  }, []);

  const fetchPosts = useCallback(async () => {
    try {
      const res = await adminApi.getPosts();
      setPosts(res.data);
    } catch {
      toast.error('Failed to fetch posts');
    }
  }, []);

  const fetchLogs = useCallback(async () => {
    try {
      const res = await adminApi.getModerationLogs();
      setModerationLogs(res.data);
    } catch {
      toast.error('Failed to fetch moderation logs');
    }
  }, []);

  const loadAllData = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchStats(), fetchUsers(), fetchPosts(), fetchLogs()]);
    setLoading(false);
  }, [fetchStats, fetchUsers, fetchPosts, fetchLogs]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Handle User Search
  const handleUserSearchSubmit = (e) => {
    e.preventDefault();
    fetchUsers(userSearch);
  };

  // Toggle Role
  const handleToggleRole = async (user) => {
    const newRole = user.role === 'ROLE_ADMIN' ? 'ROLE_USER' : 'ROLE_ADMIN';
    if (!window.confirm(`Are you sure you want to change ${user.name}'s role to ${newRole}?`)) return;
    
    setActionLoading(true);
    try {
      await adminApi.updateUserRole(user.id, newRole);
      toast.success(`Updated ${user.name}'s role to ${newRole}`);
      fetchUsers(userSearch);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user role');
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle Status (Ban / Unban)
  const handleToggleStatus = async (user) => {
    const newBannedState = !user.banned;
    const actionName = newBannedState ? 'ban' : 'unban';
    if (!window.confirm(`Are you sure you want to ${actionName} ${user.name}?`)) return;

    setActionLoading(true);
    try {
      await adminApi.updateUserStatus(user.id, newBannedState);
      toast.success(`User ${user.name} has been ${newBannedState ? 'banned' : 'unbanned'}`);
      fetchUsers(userSearch);
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${actionName} user`);
    } finally {
      setActionLoading(false);
    }
  };

  // Delete User
  const handleDeleteUser = async (user) => {
    if (!window.confirm(`WARNING: Are you sure you want to permanently delete user "${user.name}"? This action cannot be undone.`)) return;

    setActionLoading(true);
    try {
      await adminApi.deleteUser(user.id);
      toast.success(`User ${user.name} deleted`);
      fetchUsers(userSearch);
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user');
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Post
  const handleDeletePost = async (post) => {
    if (!window.confirm(`Are you sure you want to delete post "${post.title}"?`)) return;

    setActionLoading(true);
    try {
      await adminApi.deletePost(post.id);
      toast.success('Post deleted successfully');
      fetchPosts();
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete post');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-container" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <div className="spinner" />
        <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Loading Admin Control Center…</p>
      </div>
    );
  }

  return (
    <div className="admin-container">
      {/* Top Header */}
      <div className="admin-header">
        <div>
          <h1 className="admin-title">
            <Shield style={{ color: '#f59e0b', verticalAlign: 'middle', marginRight: 10 }} />
            Admin Control Center
          </h1>
          <p className="admin-subtitle">Manage users, moderate blog content, and view system health metrics.</p>
        </div>
        <button 
          className="btn btn-outline" 
          onClick={loadAllData}
          disabled={actionLoading}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <RefreshCw size={16} className={actionLoading ? 'spin' : ''} /> Refresh Data
        </button>
      </div>

      {/* Tabs */}
      <div className="admin-tabs">
        <button 
          className={`admin-tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <BarChart2 size={18} /> Overview
        </button>
        <button 
          className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <Users size={18} /> Users ({users.length})
        </button>
        <button 
          className={`admin-tab ${activeTab === 'posts' ? 'active' : ''}`}
          onClick={() => setActiveTab('posts')}
        >
          <FileText size={18} /> Posts ({posts.length})
        </button>
        <button 
          className={`admin-tab ${activeTab === 'moderation' ? 'active' : ''}`}
          onClick={() => setActiveTab('moderation')}
        >
          <ShieldAlert size={18} /> AI Audit Logs ({moderationLogs.length})
        </button>
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && stats && (
        <div className="admin-overview">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' }}>
                <Users size={24} />
              </div>
              <div className="stat-info">
                <span className="stat-value">{stats.totalUsers}</span>
                <span className="stat-label">Total Users</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
                <FileText size={24} />
              </div>
              <div className="stat-info">
                <span className="stat-value">{stats.totalPosts}</span>
                <span className="stat-label">Total Articles ({stats.totalPublishedPosts} Published)</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6' }}>
                <MessageSquare size={24} />
              </div>
              <div className="stat-info">
                <span className="stat-value">{stats.totalComments}</span>
                <span className="stat-label">Total Comments</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
                <ShieldCheck size={24} />
              </div>
              <div className="stat-info">
                <span className="stat-value">{stats.totalModerations}</span>
                <span className="stat-label">AI Checks ({stats.approvedModerations} Passed / {stats.rejectedModerations} Blocked)</span>
              </div>
            </div>
          </div>

          <div className="admin-card" style={{ marginTop: '2rem' }}>
            <h3>System Status & Quick Breakdown</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginTop: '1rem' }}>
              <div className="info-box">
                <h4>Blog Posts Breakdown</h4>
                <p><strong>Published:</strong> {stats.totalPublishedPosts}</p>
                <p><strong>Drafts:</strong> {stats.totalDraftPosts}</p>
              </div>
              <div className="info-box">
                <h4>AI Moderation Health</h4>
                <p><strong>Total Screenings:</strong> {stats.totalModerations}</p>
                <p><strong>Approved Rate:</strong> {stats.totalModerations > 0 ? Math.round((stats.approvedModerations / stats.totalModerations) * 100) : 100}%</p>
                <p><strong>Rejected Posts:</strong> {stats.rejectedModerations}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* USERS TAB */}
      {activeTab === 'users' && (
        <div className="admin-card">
          <div className="table-header">
            <h3>User Accounts ({users.length})</h3>
            <form onSubmit={handleUserSearchSubmit} className="admin-search-form">
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Search size={16} style={{ position: 'absolute', left: 12, color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  placeholder="Search user by name or email…"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="admin-input"
                  style={{ paddingLeft: 36 }}
                />
              </div>
              <button type="submit" className="btn btn-outline" size="sm">Search</button>
            </form>
          </div>

          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className="user-cell">
                        {u.profilePicture ? (
                          <img src={getImageUrl(u.profilePicture)} alt={u.name} className="avatar-sm" />
                        ) : (
                          <div className="avatar-placeholder">{u.name?.charAt(0).toUpperCase() || 'U'}</div>
                        )}
                        <span className="user-name">{u.name}</span>
                      </div>
                    </td>
                    <td>{u.email}</td>
                    <td>
                      <span className={`badge ${u.role === 'ROLE_ADMIN' ? 'badge-admin' : 'badge-user'}`}>
                        {u.role === 'ROLE_ADMIN' ? 'Admin' : 'User'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${u.banned ? 'badge-banned' : 'badge-active'}`}>
                        {u.banned ? 'Banned' : 'Active'}
                      </span>
                    </td>
                    <td>{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="action-buttons">
                        <button 
                          className="btn-icon" 
                          title={u.role === 'ROLE_ADMIN' ? 'Demote to User' : 'Promote to Admin'}
                          onClick={() => handleToggleRole(u)}
                          disabled={actionLoading}
                        >
                          <Shield size={16} color={u.role === 'ROLE_ADMIN' ? '#f59e0b' : 'var(--text-muted)'} />
                        </button>
                        <button 
                          className="btn-icon" 
                          title={u.banned ? 'Unban User' : 'Ban User'}
                          onClick={() => handleToggleStatus(u)}
                          disabled={actionLoading}
                        >
                          {u.banned ? <UserCheck size={16} color="#10b981" /> : <UserX size={16} color="#ef4444" />}
                        </button>
                        <button 
                          className="btn-icon danger" 
                          title="Delete User"
                          onClick={() => handleDeleteUser(u)}
                          disabled={actionLoading}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* POSTS TAB */}
      {activeTab === 'posts' && (
        <div className="admin-card">
          <div className="table-header">
            <h3>Blog Articles ({posts.length})</h3>
          </div>

          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Author</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Views / Likes</th>
                  <th>Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((p) => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600, maxWidth: 280 }} className="truncate">
                      {p.title}
                    </td>
                    <td>{p.author?.name || 'Unknown'}</td>
                    <td><span className="badge badge-category">{p.category || 'General'}</span></td>
                    <td>
                      <span className={`badge ${p.status === 'PUBLISHED' ? 'badge-published' : 'badge-draft'}`}>
                        {p.status}
                      </span>
                    </td>
                    <td>{p.viewCount} views / {p.likeCount} likes</td>
                    <td>{p.createdAt ? new Date(p.createdAt).toLocaleDateString() : 'N/A'}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="action-buttons">
                        <a href={`/posts/${p.id}`} target="_blank" rel="noreferrer" className="btn-icon" title="View Article">
                          <ExternalLink size={16} />
                        </a>
                        <button 
                          className="btn-icon danger" 
                          title="Delete Post"
                          onClick={() => handleDeletePost(p)}
                          disabled={actionLoading}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {posts.length === 0 && (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                      No blog posts found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODERATION LOGS TAB */}
      {activeTab === 'moderation' && (
        <div className="admin-card">
          <div className="table-header">
            <h3>AI Content Moderation Audit Trail ({moderationLogs.length})</h3>
          </div>

          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Post ID</th>
                  <th>Decision</th>
                  <th>Confidence</th>
                  <th>AI Reason / Feedback</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {moderationLogs.map((log) => (
                  <tr key={log.id}>
                    <td>#{log.id}</td>
                    <td>{log.postId ? `#${log.postId}` : 'Draft (Blocked before save)'}</td>
                    <td>
                      {log.approved ? (
                        <span className="badge badge-approved" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <CheckCircle size={14} /> Approved
                        </span>
                      ) : (
                        <span className="badge badge-rejected" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <XCircle size={14} /> Rejected
                        </span>
                      )}
                    </td>
                    <td>{log.confidence ? `${log.confidence}%` : 'N/A'}</td>
                    <td style={{ maxWidth: 380, fontSize: '0.85rem' }}>{log.reason || 'No detailed reason'}</td>
                    <td>{log.createdAt ? new Date(log.createdAt).toLocaleString() : 'N/A'}</td>
                  </tr>
                ))}
                {moderationLogs.length === 0 && (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                      No AI moderation records logged yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
