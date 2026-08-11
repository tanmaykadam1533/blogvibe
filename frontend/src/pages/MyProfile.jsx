import { useState, useEffect, useRef } from 'react';
import { usersApi, postsApi, getImageUrl } from '../api';
import { useAuth } from '../context/AuthContext';
import PostCard from '../components/PostCard';
import toast from 'react-hot-toast';
import { Camera, Edit3, Check, X } from 'lucide-react';

export default function MyProfile() {
  const { user, setUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const fileRef = useRef();

  useEffect(() => { loadProfile(); loadPosts(); }, []);

  const loadProfile = async () => {
    const res = await usersApi.getMyProfile();
    setProfile(res.data);
    setForm({ name: res.data.name, bio: res.data.bio || '', location: res.data.location || '', website: res.data.website || '' });
  };

  const loadPosts = async () => {
    if (!user) return;
    try {
      const res = await postsApi.getAll({ page: 0, size: 20 });
      setPosts(res.data.content.filter(p => p.author?.id === user.id));
    } catch {}
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await usersApi.updateProfile(form);
      setProfile(res.data);
      setUser(u => ({ ...u, name: res.data.name }));
      setEditing(false);
      toast.success('Profile updated!');
    } catch { toast.error('Failed to update'); }
    finally { setSaving(false); }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const res = await usersApi.uploadProfilePicture(file);
      setProfile(res.data);
      setUser(u => ({ ...u, profilePicture: res.data.profilePicture }));
      toast.success('Profile picture updated!');
    } catch { toast.error('Upload failed'); }
  };

  if (!profile) return <div className="page-loading"><div className="spinner" /></div>;

  return (
    <div>
      <div className="profile-header">
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <img
            src={getImageUrl(profile.profilePicture) || `https://ui-avatars.com/api/?name=${profile.name}&background=e89c5a&color=0f0e0d&size=120`}
            alt={profile.name} className="avatar-xl"
          />
          <button
            style={{ position: 'absolute', bottom: 0, right: 0, background: 'var(--accent)', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            onClick={() => fileRef.current?.click()}
          ><Camera size={14} color="#0f0e0d" /></button>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarUpload} />
        </div>

        <div className="profile-info">
          {editing ? (
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              <input className="form-input" placeholder="Name" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} />
              <textarea className="form-input" placeholder="Bio..." rows={2} value={form.bio} onChange={(e) => setForm(f => ({ ...f, bio: e.target.value }))} style={{ minHeight: 'unset' }} />
              <input className="form-input" placeholder="Location" value={form.location} onChange={(e) => setForm(f => ({ ...f, location: e.target.value }))} />
              <input className="form-input" placeholder="Website URL" value={form.website} onChange={(e) => setForm(f => ({ ...f, website: e.target.value }))} />
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}><Check size={14} /> {saving ? 'Saving...' : 'Save'}</button>
                <button className="btn btn-secondary btn-sm" onClick={() => setEditing(false)}><X size={14} /></button>
              </div>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                <h1 className="profile-name" style={{ margin: 0 }}>{profile.name}</h1>
                <button className="btn btn-secondary btn-sm" onClick={() => setEditing(true)}><Edit3 size={14} /> Edit</button>
              </div>
              <p className="profile-bio">{profile.bio || 'No bio yet'}</p>
              {profile.location && <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.25rem' }}>📍 {profile.location}</p>}
              {profile.website && <a href={profile.website} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', fontSize: '0.9rem' }}>🔗 {profile.website}</a>}
              <div className="profile-stats" style={{ marginTop: '1rem' }}>
                <div className="profile-stat">
                  <div className="profile-stat-number">{posts.length}</div>
                  <div className="profile-stat-label">Posts</div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <h2 style={{ marginBottom: '1.5rem' }}>My Posts</h2>
      {posts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          You haven't published any posts yet
        </div>
      ) : (
        <div className="posts-grid">
          {posts.map(p => <PostCard key={p.id} post={p} />)}
        </div>
      )}
    </div>
  );
}
