import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { postsApi, getImageUrl, getFormattedContent, getPlaceholderImage } from '../api';
import { useAuth } from '../context/AuthContext';
import ShareModal from '../components/ShareModal';
import toast from 'react-hot-toast';
import { Heart, MessageCircle, Share2, Eye } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

function CommentItem({ comment, postId, onDelete, currentUserId }) {
  const [showReply, setShowReply] = useState(false);
  const [reply, setReply] = useState('');

  const handleReply = async () => {
    if (!reply.trim()) return;
    try {
      await postsApi.addComment(postId, { content: reply, parentId: comment.id });
      setReply('');
      setShowReply(false);
      toast.success('Reply added');
      window.location.reload();
    } catch { toast.error('Failed to add reply'); }
  };

  return (
    <div className="comment">
      <img
        src={getImageUrl(comment.author?.profilePicture) || `https://ui-avatars.com/api/?name=${comment.author?.name}&background=e89c5a&color=0f0e0d`}
        alt="" className="avatar"
      />
      <div className="comment-content">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span className="comment-author">{comment.author?.name}</span>
          <span className="comment-date">{formatDistanceToNow(new Date(comment.createdAt))} ago</span>
          {currentUserId === comment.author?.id && (
            <button style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '0.8rem' }}
              onClick={() => onDelete(comment.id)}>Delete</button>
          )}
        </div>
        <p className="comment-text" style={{ margin: '0.4rem 0' }}>{comment.content}</p>
        <button style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '0.8rem' }}
          onClick={() => setShowReply(!showReply)}>Reply</button>

        {showReply && (
          <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
            <input className="form-input" placeholder="Write a reply..." value={reply}
              onChange={(e) => setReply(e.target.value)} style={{ flex: 1 }} />
            <button className="btn btn-primary btn-sm" onClick={handleReply}>Send</button>
          </div>
        )}

        {comment.replies?.length > 0 && (
          <div className="comment-replies">
            {comment.replies.map(r => (
              <CommentItem key={r.id} comment={r} postId={postId} onDelete={onDelete} currentUserId={currentUserId} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function PostDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [showShare, setShowShare] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPost();
    loadComments();
  }, [id]);

  const loadPost = async () => {
    try {
      const res = await postsApi.getById(id);
      setPost(res.data);
      setLiked(res.data.liked);
      setLikeCount(res.data.likeCount);
    } catch { toast.error('Post not found'); navigate('/'); }
    finally { setLoading(false); }
  };

  const loadComments = async () => {
    try {
      const res = await postsApi.getComments(id);
      setComments(res.data);
    } catch {}
  };

  const handleLike = async () => {
    if (!user) { toast.error('Please login to like'); return; }
    try {
      const res = await postsApi.toggleLike(id);
      setLiked(res.data.liked);
      setLikeCount(res.data.likeCount);
    } catch {}
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!user) { toast.error('Please login to comment'); return; }
    if (!newComment.trim()) return;
    try {
      await postsApi.addComment(id, { content: newComment });
      setNewComment('');
      loadComments();
      toast.success('Comment added!');
    } catch { toast.error('Failed to add comment'); }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await postsApi.deleteComment(commentId);
      loadComments();
      toast.success('Comment deleted');
    } catch { toast.error('Failed to delete'); }
  };

  if (loading) return <div className="page-loading"><div className="spinner" /></div>;
  if (!post) return null;

  const placeholder = getPlaceholderImage(post.category, post.title);

  return (
    <div className="post-detail">
      <div className="post-detail-cover">
        <img
          src={post.coverImage ? getImageUrl(post.coverImage) : placeholder}
          alt={post.title}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = placeholder;
          }}
        />
      </div>

      {post.category && (
        <div style={{ marginBottom: '1rem' }}>
          <span className="tag" style={{ fontSize: '0.8rem' }}>{post.category}</span>
        </div>
      )}

      <h1 className="post-detail-title">{post.title}</h1>

      <div className="post-detail-meta">
        <Link to={`/users/${post.author?.id}`}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <img
              src={getImageUrl(post.author?.profilePicture) || `https://ui-avatars.com/api/?name=${post.author?.name}&background=e89c5a&color=0f0e0d`}
              alt="" className="avatar"
            />
            <div>
              <div style={{ fontWeight: 600 }}>{post.author?.name}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {format(new Date(post.createdAt), 'MMM d, yyyy')}
              </div>
            </div>
          </div>
        </Link>

        <div style={{ display: 'flex', gap: '1rem', marginLeft: 'auto', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Eye size={14} /> {post.viewCount}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Heart size={14} /> {likeCount}</span>
        </div>
      </div>

      {post.tags?.length > 0 && (
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          {post.tags.map(tag => <span key={tag} className="tag">{tag}</span>)}
        </div>
      )}

      <div className="post-body" dangerouslySetInnerHTML={{ __html: getFormattedContent(post.content) }} />

      {/* Post actions */}
      <div className="post-actions">
        <button className={`like-btn ${liked ? 'liked' : ''}`} onClick={handleLike}>
          <Heart size={18} fill={liked ? '#e05555' : 'none'} />
          {likeCount} {likeCount === 1 ? 'Like' : 'Likes'}
        </button>

        <button className="btn btn-secondary" onClick={() => document.getElementById('comments-section').scrollIntoView({ behavior: 'smooth' })}>
          <MessageCircle size={18} /> {comments.length} Comments
        </button>

        <button className="btn btn-secondary" onClick={() => {
          if (!user) { toast.error('Please login to share'); return; }
          setShowShare(true);
        }}>
          <Share2 size={18} /> Share
        </button>
      </div>

      {/* Comments */}
      <div className="comments-section" id="comments-section">
        <h3 style={{ marginBottom: '1.5rem' }}>Comments ({comments.length})</h3>

        {user && (
          <form onSubmit={handleComment} style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <img
                src={getImageUrl(user.profilePicture) || `https://ui-avatars.com/api/?name=${user.name}&background=e89c5a&color=0f0e0d`}
                alt="" className="avatar"
              />
              <div style={{ flex: 1 }}>
                <textarea className="form-input" rows={3}
                  placeholder="Share your thoughts..."
                  value={newComment} onChange={(e) => setNewComment(e.target.value)} />
                <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                  <button className="btn btn-primary btn-sm" type="submit">Post Comment</button>
                </div>
              </div>
            </div>
          </form>
        )}

        {!user && (
          <div style={{ textAlign: 'center', padding: '1.5rem', background: 'var(--bg-card)', borderRadius: '8px', marginBottom: '2rem' }}>
            <Link to="/login" style={{ color: 'var(--accent)' }}>Login</Link> to leave a comment
          </div>
        )}

        {comments.map(comment => (
          <CommentItem key={comment.id} comment={comment} postId={id}
            onDelete={handleDeleteComment} currentUserId={user?.id} />
        ))}
      </div>

      {showShare && <ShareModal post={post} onClose={() => setShowShare(false)} />}
    </div>
  );
}
