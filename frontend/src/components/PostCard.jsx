import { Link } from 'react-router-dom';
import { Heart, MessageCircle, Eye } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { getImageUrl } from '../api';

export default function PostCard({ post }) {
  const initials = post.author?.name?.charAt(0).toUpperCase();

  return (
    <Link to={`/posts/${post.id}`}>
      <div className="card post-card">
        {post.coverImage && (
          <div className="post-card-cover">
            <img src={getImageUrl(post.coverImage)} alt={post.title} />
          </div>
        )}
        <div className="post-card-body">
          {post.category && <div className="post-card-category">{post.category}</div>}
          <h2 className="post-card-title">{post.title}</h2>
          {post.summary && <p className="post-card-summary">{post.summary}</p>}

          {post.tags?.length > 0 && (
            <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
              {post.tags.slice(0, 3).map(tag => (
                <span key={tag} className="tag">{tag}</span>
              ))}
            </div>
          )}

          <div className="post-card-meta">
            <div className="author-chip">
              {post.author?.profilePicture
                ? <img src={getImageUrl(post.author.profilePicture)} alt="" className="avatar" />
                : <div className="avatar" style={{ background: 'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.8rem', fontWeight:700, color:'#0f0e0d' }}>{initials}</div>
              }
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>{post.author?.name}</div>
                <div className="meta-text">{formatDistanceToNow(new Date(post.createdAt))} ago</div>
              </div>
            </div>
            <div className="post-stats">
              <span className="stat"><Eye size={14} />{post.viewCount}</span>
              <span className="stat"><Heart size={14} />{post.likeCount}</span>
              <span className="stat"><MessageCircle size={14} />{post.commentCount}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
