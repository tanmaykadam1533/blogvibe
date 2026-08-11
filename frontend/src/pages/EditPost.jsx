import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { postsApi, getErrorMessage } from '../api';
import toast from 'react-hot-toast';
import { Image, X } from 'lucide-react';
import ModerationReport from '../components/ModerationReport';

const CATEGORIES = ['Technology', 'Travel', 'Food', 'Lifestyle', 'Health', 'Business', 'Art', 'Science', 'Other'];

export default function EditPost() {
  const { id } = useParams();
  const navigate = useNavigate();
  const coverRef = useRef();
  const quillRef = useRef();
  const [form, setForm] = useState({ title:'', content:'', summary:'', category:'', tags:'', coverImage:'', draft:false });
  const [coverPreview, setCoverPreview] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [moderationReport, setModerationReport] = useState(null);

  useEffect(() => {
    postsApi.getById(id).then(res => {
      const p = res.data;
      setForm({ title: p.title, content: p.content, summary: p.summary || '', category: p.category || '',
        tags: p.tags?.join(', ') || '', coverImage: p.coverImage || '', draft: p.status === 'DRAFT' });
      if (p.coverImage) setCoverPreview(p.coverImage);
    }).finally(() => setLoading(false));
  }, [id]);

  const handleCoverUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const res = await postsApi.uploadStandaloneImage(file);
      setForm(f => ({ ...f, coverImage: res.data.url }));
      setCoverPreview(URL.createObjectURL(file));
      toast.success('Cover image uploaded');
    } catch (err) { toast.error(getErrorMessage(err) || 'Upload failed'); }
  };

  const imageHandler = () => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
      const file = input.files[0];
      if (file) {
        const toastId = toast.loading('Uploading image...');
        try {
          const res = await postsApi.uploadStandaloneImage(file);
          const url = res.data.url;
          const quill = quillRef.current.getEditor();
          const range = quill.getSelection(true);
          const idx = range ? range.index : 0;
          quill.insertEmbed(idx, 'image', url);
          toast.success('Image uploaded', { id: toastId });
        } catch (err) { toast.error(getErrorMessage(err) || 'Failed to upload image', { id: toastId }); }
      }
    };
  };

  const quillModules = useMemo(() => ({
    toolbar: {
      container: [
        [{ header: [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        ['blockquote', 'code-block'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['link', 'image'],
        ['clean'],
      ],
      handlers: {
        image: imageHandler
      }
    }
  }), []);

  const handleSubmit = async (isDraft) => {
    if (!form.title.trim() || !form.content.trim()) { toast.error('Title and content required'); return; }
    setSaving(true);
    setModerationReport(null);
    try {
      const tagArray = form.tags.split(',').map(t => t.trim()).filter(Boolean);
      await postsApi.update(id, { ...form, tags: tagArray, draft: isDraft });
      toast.success(isDraft ? 'Draft saved!' : 'Post updated!');
      navigate(`/posts/${id}`);
    } catch (err) {
      if (!isDraft && err.response?.status === 400 && err.response?.data?.approved === false) {
        setModerationReport(err.response.data);
        toast.error('Post rejected by AI moderation.');
      } else {
        toast.error(getErrorMessage(err) || 'Failed to update');
      }
    } finally { setSaving(false); }
  };

  if (loading) return <div className="page-loading"><div className="spinner" /></div>;

  return (
    <div className="editor-page">
      <h1 style={{ marginBottom: '1.5rem' }}>Edit Post</h1>

      {/* Cover */}
      <div style={{ marginBottom: '1.5rem' }}>
        {coverPreview ? (
          <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', aspectRatio: '3/1' }}>
            <img src={coverPreview} alt="Cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <button style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', background: 'rgba(0,0,0,0.7)', border: 'none', color: 'white', cursor: 'pointer', padding: '0.4rem', borderRadius: '50%' }}
              onClick={() => { setForm(f => ({ ...f, coverImage: '' })); setCoverPreview(''); }}><X size={16} /></button>
          </div>
        ) : (
          <div style={{ border: '2px dashed var(--border)', borderRadius: '12px', padding: '2rem', textAlign: 'center', cursor: 'pointer' }}
            onClick={() => coverRef.current?.click()}>
            <Image size={32} style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }} />
            <div style={{ color: 'var(--text-muted)' }}>Click to add cover image</div>
          </div>
        )}
        <input ref={coverRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleCoverUpload} />
      </div>

      <input className="editor-title" placeholder="Title..." value={form.title}
        onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} />

      <ModerationReport report={moderationReport} onClose={() => setModerationReport(null)} />

      <ReactQuill 
        ref={quillRef} 
        theme="snow" 
        value={form.content} 
        onChange={(v) => setForm(f => ({ ...f, content: v }))} 
        modules={quillModules}
      />

      <div style={{ marginTop: '2rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="form-group">
          <label className="form-label">Summary</label>
          <textarea className="form-input" rows={3} value={form.summary}
            onChange={(e) => setForm(f => ({ ...f, summary: e.target.value }))} />
        </div>
        <div>
          <div className="form-group">
            <label className="form-label">Category</label>
            <select className="form-input" value={form.category} onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))}>
              <option value="">Select...</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Tags (comma separated)</label>
            <input className="form-input" value={form.tags} onChange={(e) => setForm(f => ({ ...f, tags: e.target.value }))} />
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button className="btn btn-primary btn-lg" onClick={() => handleSubmit(false)} disabled={saving}>
          {saving ? 'Checking your blog using AI...' : '✓ Update Post'}
        </button>
        <button className="btn btn-secondary" onClick={() => handleSubmit(true)} disabled={saving}>Save as Draft</button>
        <button className="btn btn-ghost" onClick={() => navigate(-1)}>Cancel</button>
      </div>
    </div>
  );
}
