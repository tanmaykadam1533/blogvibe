import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { usersApi, postsApi, getImageUrl } from '../api';
import PostCard from '../components/PostCard';
import { MapPin, Globe, Calendar } from 'lucide-react';
import { format } from 'date-fns';

export default function Profile() {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    loadProfile();
  }, [id]);

  useEffect(() => {
    loadPosts();
  }, [id, page]);

  const loadProfile = async () => {
    try {
      const res = await usersApi.getProfile(id);
      setProfile(res.data);
    } catch {
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const loadPosts = async () => {
    try {
      const res = await usersApi.getUserPosts(id, { page, size: 9 });
      setPosts(res.data.content || []);
      setTotalPages(res.data.totalPages || 0);
    } catch {}
  };

  if (loading) return <div className="page-loading"><div className="spinner" /></div>;

  if (!profile) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
        <h2>User not found</h2>
        <Link to="/" style={{ color: 'var(--accent)' }}>Back to Home</Link>
      </div>
    );
  }

  return (
    <div>
      {/* Profile Header */}
      <div className="profile-header">
        <img
          src={
            getImageUrl(profile.profilePicture) ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=e89c5a&color=0f0e0d&size=120`
          }
          alt={profile.name}
          className="avatar-xl"
        />

        <div className="profile-info">
          <h1 className="profile-name">{profile.name}</h1>

          {profile.bio && (
            <p className="profile-bio">{profile.bio}</p>
          )}

          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            {profile.location && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                <MapPin size={14} /> {profile.location}
              </span>
            )}
            {profile.website && (
              <a
                href={profile.website}
                target="_blank"
                rel="noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--accent)', fontSize: '0.9rem' }}
              >
                <Globe size={14} /> {profile.website.replace(/^https?:\/\//, '')}
              </a>
            )}
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              <Calendar size={14} /> Joined {format(new Date(profile.createdAt), 'MMMM yyyy')}
            </span>
          </div>

          <div className="profile-stats">
            <div className="profile-stat">
              <div className="profile-stat-number">{profile.postCount}</div>
              <div className="profile-stat-label">Posts</div>
            </div>
          </div>
        </div>
      </div>

      {/* Posts Section */}
      <h2 style={{ marginBottom: '1.5rem' }}>
        Posts by {profile.name}
        <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '1rem', marginLeft: '0.75rem' }}>
          ({profile.postCount})
        </span>
      </h2>

      {posts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          No posts published yet.
        </div>
      ) : (
        <>
          <div className="posts-grid">
            {posts.map(post => <PostCard key={post.id} post={post} />)}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button className="btn btn-secondary btn-sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                ← Prev
              </button>
              <span style={{ padding: '0.4rem 0.8rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                {page + 1} / {totalPages}
              </span>
              <button className="btn btn-secondary btn-sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
