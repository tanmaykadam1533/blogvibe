import { useState } from 'react';
import { sharesApi } from '../api';
import toast from 'react-hot-toast';
import { Search, X, Send } from 'lucide-react';

export default function ShareModal({ post, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const searchUsers = async (q) => {
    setQuery(q);
    if (q.trim().length < 2) { setResults([]); return; }
    try {
      const res = await sharesApi.searchUsers(q);
      setResults(res.data);
    } catch {}
  };

  const handleShare = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      await sharesApi.share({ postId: post.id, recipientId: selected.id, message });
      toast.success(`Post shared with ${selected.name}!`);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to share');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className="modal-title">Share this post</h2>
          <button className="btn btn-ghost" onClick={onClose}><X size={18} /></button>
        </div>

        <div style={{ marginBottom: '1rem', padding: '0.75rem', background: 'var(--bg)', borderRadius: '8px' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{post.title}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{post.summary}</div>
        </div>

        {selected ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: 'var(--accent-dim)', borderRadius: '8px', marginBottom: '1rem' }}>
            <img src={selected.profilePicture || `https://ui-avatars.com/api/?name=${selected.name}`} alt="" className="avatar" />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>{selected.name}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{selected.email}</div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => setSelected(null)}><X size={14} /></button>
          </div>
        ) : (
          <>
            <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
              <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                className="form-input"
                style={{ paddingLeft: '2.2rem' }}
                placeholder="Search by name or email..."
                value={query}
                onChange={(e) => searchUsers(e.target.value)}
              />
            </div>
            {results.length > 0 && (
              <div style={{ border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden', marginBottom: '1rem' }}>
                {results.map(u => (
                  <div key={u.id}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', cursor: 'pointer', borderBottom: '1px solid var(--border)' }}
                    onClick={() => { setSelected(u); setResults([]); setQuery(''); }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <img src={u.profilePicture || `https://ui-avatars.com/api/?name=${u.name}`} alt="" className="avatar" />
                    <div>
                      <div style={{ fontWeight: 500 }}>{u.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{u.email}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        <div className="form-group">
          <label className="form-label">Message (optional)</label>
          <textarea
            className="form-input"
            rows={3}
            placeholder="Add a note..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            style={{ minHeight: '80px' }}
          />
        </div>

        <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleShare} disabled={!selected || loading}>
          <Send size={16} /> {loading ? 'Sharing...' : 'Send'}
        </button>
      </div>
    </div>
  );
}
