import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { sharesApi } from '../api';
import { formatDistanceToNow } from 'date-fns';
import { Inbox as InboxIcon, CheckCheck, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Inbox() {
  const [shares, setShares] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    loadShares();
  }, [page]);

  const loadShares = async () => {
    setLoading(true);
    try {
      const res = await sharesApi.getInbox({ page, size: 15 });
      setShares(res.data.content || []);
      setTotalPages(res.data.totalPages || 0);
    } catch {
      toast.error('Failed to load inbox');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (share) => {
    if (share.read) return;
    try {
      await sharesApi.markAsRead(share.id);
      setShares(prev =>
        prev.map(s => s.id === share.id ? { ...s, read: true } : s)
      );
    } catch {}
  };

  const markAllRead = async () => {
    const unread = shares.filter(s => !s.read);
    await Promise.all(unread.map(s => sharesApi.markAsRead(s.id)));
    setShares(prev => prev.map(s => ({ ...s, read: true })));
    toast.success('All marked as read');
  };

  const unreadCount = shares.filter(s => !s.read).length;

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <InboxIcon size={28} style={{ color: 'var(--accent)' }} />
          <div>
            <h1 style={{ fontSize: '1.8rem' }}>Inbox</h1>
            {unreadCount > 0 && (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                {unreadCount} unread {unreadCount === 1 ? 'message' : 'messages'}
              </p>
            )}
          </div>
        </div>
        {unreadCount > 0 && (
          <button className="btn btn-secondary btn-sm" onClick={markAllRead}>
            <CheckCheck size={14} /> Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <div className="page-loading"><div className="spinner" /></div>
      ) : shares.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '5rem 2rem' }}>
          <InboxIcon size={56} style={{ color: 'var(--border)', marginBottom: '1rem', display: 'block', margin: '0 auto 1rem' }} />
          <h3 style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Your inbox is empty</h3>
          <p style={{ color: 'var(--text-subtle)', fontSize: '0.9rem' }}>
            Posts shared with you by other users will appear here.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {shares.map(share => (
            <div
              key={share.id}
              className={`card inbox-item ${!share.read ? 'unread' : ''}`}
              onClick={() => handleMarkRead(share)}
              style={{ borderLeft: !share.read ? '3px solid var(--accent)' : '3px solid transparent' }}
            >
              {/* Sender avatar + info */}
              <img
                src={
                  share.sender?.profilePicture ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(share.sender?.name || 'U')}&background=e89c5a&color=0f0e0d`
                }
                alt={share.sender?.name}
                className="avatar"
                style={{ flexShrink: 0, alignSelf: 'flex-start', marginTop: '0.15rem' }}
              />

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{share.sender?.name}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>shared a post with you</span>
                  <span style={{ color: 'var(--text-subtle)', fontSize: '0.78rem', marginLeft: 'auto' }}>
                    {formatDistanceToNow(new Date(share.createdAt))} ago
                  </span>
                </div>

                {/* Post preview card */}
                <Link
                  to={`/posts/${share.post?.id}`}
                  onClick={(e) => e.stopPropagation()}
                  style={{ display: 'block', textDecoration: 'none' }}
                >
                  <div
                    style={{
                      display: 'flex',
                      gap: '0.75rem',
                      background: 'var(--bg)',
                      borderRadius: '8px',
                      padding: '0.75rem',
                      marginTop: '0.5rem',
                      border: '1px solid var(--border)',
                      transition: 'border-color 0.2s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                  >
                    {share.post?.coverImage && (
                      <img
                        src={share.post.coverImage}
                        alt=""
                        style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: '6px', flexShrink: 0 }}
                      />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {share.post?.title}
                      </div>
                      {share.post?.summary && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                          {share.post.summary}
                        </div>
                      )}
                    </div>
                    <ExternalLink size={14} style={{ color: 'var(--text-subtle)', flexShrink: 0, alignSelf: 'center' }} />
                  </div>
                </Link>

                {/* Optional message */}
                {share.message && (
                  <div style={{
                    marginTop: '0.5rem',
                    padding: '0.5rem 0.75rem',
                    background: 'var(--accent-dim)',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    color: 'var(--text-muted)',
                    fontStyle: 'italic',
                  }}>
                    "{share.message}"
                  </div>
                )}
              </div>

              {/* Unread dot */}
              {!share.read && (
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: 'var(--accent)', flexShrink: 0, alignSelf: 'center'
                }} />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button className="btn btn-secondary btn-sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>← Prev</button>
          <span style={{ padding: '0.4rem 0.8rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {page + 1} / {totalPages}
          </span>
          <button className="btn btn-secondary btn-sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Next →</button>
        </div>
      )}
    </div>
  );
}
