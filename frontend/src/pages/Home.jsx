import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { postsApi } from '../api';
import PostCard from '../components/PostCard';

const CATEGORIES = ['All', 'Technology', 'Travel', 'Food', 'Lifestyle', 'Health', 'Business', 'Art', 'Science'];

export default function Home() {
  const [searchParams] = useSearchParams();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [category, setCategory] = useState('All');

  const searchQuery = searchParams.get('search');

  useEffect(() => {
    setPage(0);
    setCategory('All');
  }, [searchQuery]);

  useEffect(() => {
    loadPosts();
  }, [page, category, searchQuery]);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const params = { page, size: 9 };
      if (category !== 'All') params.category = category;
      if (searchQuery) params.search = searchQuery;

      const res = await postsApi.getAll(params);
      setPosts(res.data.content);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Hero */}
      {!searchQuery && (
        <div style={{ textAlign: 'center', padding: '3rem 0 2rem' }}>
          <h1 style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>
            Stories worth <em>reading</em>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>
            Discover vlogs, ideas, and perspectives from creators worldwide
          </p>
        </div>
      )}

      {searchQuery && (
        <div style={{ marginBottom: '1.5rem' }}>
          <h2>Results for: <em>"{searchQuery}"</em></h2>
        </div>
      )}

      {/* Category filters */}
      {!searchQuery && (
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              className={`btn btn-sm ${category === cat ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => { setCategory(cat); setPage(0); }}
              style={{ whiteSpace: 'nowrap' }}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Posts grid */}
      {loading ? (
        <div className="page-loading"><div className="spinner" /></div>
      ) : posts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>
          <p style={{ fontSize: '1.1rem' }}>No posts found</p>
        </div>
      ) : (
        <div className="posts-grid">
          {posts.map(post => <PostCard key={post.id} post={post} />)}
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
