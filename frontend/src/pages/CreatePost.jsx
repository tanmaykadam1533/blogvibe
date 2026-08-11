import { useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { postsApi, getErrorMessage } from '../api';
import toast from 'react-hot-toast';
import { Image, X } from 'lucide-react';
import ModerationReport from '../components/ModerationReport';

const CATEGORIES = ['Technology', 'Travel', 'Food', 'Lifestyle', 'Health', 'Business', 'Art', 'Science', 'Other'];

export default function CreatePost() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [summary, setSummary] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [coverPreview, setCoverPreview] = useState('');
  const [saving, setSaving] = useState(false);
  const [moderationReport, setModerationReport] = useState(null);
  const coverRef = useRef();
  const quillRef = useRef();

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

  const handleCoverUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const res = await postsApi.uploadStandaloneImage(file);
      setCoverImage(res.data.url);
      setCoverPreview(URL.createObjectURL(file));
      toast.success('Cover image uploaded');
    } catch (err) { toast.error(getErrorMessage(err) || 'Failed to upload image'); }
  };

  const handleSubmit = async (isDraft) => {
    if (!title.trim()) { toast.error('Title is required'); return; }
    if (!content.trim() || content === '<p><br></p>') { toast.error('Content is required'); return; }

    setSaving(true);
    setModerationReport(null);
    try {
      const tagArray = tags.split(',').map(t => t.trim()).filter(Boolean);
      const res = await postsApi.create({
        title, content, summary, category, tags: tagArray, coverImage, draft: isDraft
      });
      toast.success(isDraft ? 'Draft saved!' : 'Post published!');
      navigate(`/posts/${res.data.id}`);
    } catch (err) {
      if (!isDraft && err.response?.status === 400 && err.response?.data?.approved === false) {
        setModerationReport(err.response.data);
        toast.error('Post rejected by AI moderation.');
      } else {
        toast.error(getErrorMessage(err) || 'Failed to save post');
      }
    } finally { setSaving(false); }
  };

  return (
    <div className="editor-page">
      <div className="editor-header">
        <h1 style={{ marginBottom: '1.5rem' }}>Write a Post</h1>

        {/* Cover image */}
        <div style={{ marginBottom: '1.5rem' }}>
          {coverPreview ? (
            <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', aspectRatio: '3/1' }}>
              <img src={coverPreview} alt="Cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <button
                style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', background: 'rgba(0,0,0,0.7)', border: 'none', color: 'white', cursor: 'pointer', padding: '0.4rem', borderRadius: '50%' }}
                onClick={() => { setCoverImage(''); setCoverPreview(''); }}
              ><X size={16} /></button>
            </div>
          ) : (
            <div
              style={{ border: '2px dashed var(--border)', borderRadius: '12px', padding: '2rem', textAlign: 'center', cursor: 'pointer', transition: 'border-color 0.2s' }}
              onClick={() => coverRef.current?.click()}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              <Image size={32} style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }} />
              <div style={{ color: 'var(--text-muted)' }}>Click to add a cover image</div>
            </div>
          )}
          <input ref={coverRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleCoverUpload} />
        </div>

        {/* Title */}
        <input
          className="editor-title"
          placeholder="Post title..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <ModerationReport report={moderationReport} onClose={() => setModerationReport(null)} />

      {/* Rich text editor */}
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={content}
        onChange={setContent}
        modules={quillModules}
        placeholder="Tell your story..."
      />

      {/* Meta fields */}
      <div style={{ marginTop: '2rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="form-group">
          <label className="form-label">Summary (optional)</label>
          <textarea className="form-input" rows={3}
            placeholder="Brief description of your post..."
            value={summary} onChange={(e) => setSummary(e.target.value)} />
        </div>
        <div>
          <div className="form-group">
            <label className="form-label">Category</label>
            <select className="form-input" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">Select category...</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Tags (comma separated)</label>
            <input className="form-input" placeholder="react, web, programming..."
              value={tags} onChange={(e) => setTags(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="editor-toolbar">
        <button className="btn btn-primary btn-lg" onClick={() => handleSubmit(false)} disabled={saving}>
          {saving ? 'Checking your blog using AI...' : '🚀 Publish'}
        </button>
        <button className="btn btn-secondary" onClick={() => handleSubmit(true)} disabled={saving}>
          Save Draft
        </button>
        <button className="btn btn-ghost" onClick={() => navigate(-1)}>Cancel</button>
      </div>
    </div>
  );
}
