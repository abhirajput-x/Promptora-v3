import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Sparkles, Star, Plus, X, ChevronDown, Shield, Eye, EyeOff, Trash2, BadgeCheck, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import VerifiedBadge from '../components/VerifiedBadge';
import CreatorLevelBadge from '../components/CreatorLevelBadge';
import toast from 'react-hot-toast';

const ADMIN_EMAIL = 'contact.abhayrajput@gmail.com';
const PROMPTORA_USER_ID = '00000000-0000-0000-0000-000000000001';
const MODELS = ['Midjourney', 'DALL·E', 'Flux', 'ChatGPT', 'Stable Diffusion', 'Gemini', 'Sora'];

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef();

  const [tab, setTab] = useState('upload');
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [title, setTitle] = useState('');
  const [promptText, setPromptText] = useState('');
  const [model, setModel] = useState('Midjourney');
  const [modelOpen, setModelOpen] = useState(false);
  const [featured, setFeatured] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [prompts, setPrompts] = useState([]);
  const [loadingPrompts, setLoadingPrompts] = useState(false);
  const [creators, setCreators] = useState([]);
  const [loadingCreators, setLoadingCreators] = useState(false);

  // Auth check
  if (!user) {
    return (
      <div style={styles.authPage}>
        <div style={styles.authCard}>
          <Shield size={40} color="#00E5FF" style={{ margin: '0 auto 16px', display: 'block' }} />
          <h2 style={styles.authTitle}>Admin Access Only</h2>
          <p style={styles.authSub}>Please sign in with admin account</p>
          <button style={styles.authBtn} onClick={() => navigate('/login')}>Sign In</button>
        </div>
      </div>
    );
  }

  if (user.email !== ADMIN_EMAIL) {
    return (
      <div style={styles.authPage}>
        <div style={styles.authCard}>
          <Shield size={40} color="#ff4d6d" style={{ margin: '0 auto 16px', display: 'block' }} />
          <h2 style={styles.authTitle}>Access Denied</h2>
          <p style={styles.authSub}>You don't have admin privileges</p>
          <button style={styles.authBtn} onClick={() => navigate('/')}>Go Home</button>
        </div>
      </div>
    );
  }

  const handleFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return toast.error('Please upload an image');
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    if (!image) return toast.error('Please upload an image');
    if (!title.trim()) return toast.error('Please add a title');
    if (!promptText.trim()) return toast.error('Please add prompt text');

    setSubmitting(true);
    try {
      const fileExt = image.name.split('.').pop();
      const fileName = `admin-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('prompt-images')
        .upload(fileName, image);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('prompt-images')
        .getPublicUrl(fileName);

      const { error: insertError } = await supabase.from('prompts').insert({
        user_id: PROMPTORA_USER_ID,
        title: title.trim(),
        prompt_text: promptText.trim(),
        model,
        image_url: urlData.publicUrl,
        status: 'approved',
        featured,
        likes_count: 0,
      });

      if (insertError) throw insertError;

      toast.success('✅ Prompt published as Promptora Official!');
      setTitle('');
      setPromptText('');
      setModel('Midjourney');
      setFeatured(false);
      setImage(null);
      setPreview(null);
    } catch (err) {
      toast.error('Failed: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const loadPrompts = async () => {
    setLoadingPrompts(true);
    const { data } = await supabase
      .from('prompts')
      .select('*, creator:users(username, avatar_url, is_verified, creator_level)')
      .order('created_at', { ascending: false })
      .limit(30);
    setPrompts(data || []);
    setLoadingPrompts(false);
  };

  const toggleFeatured = async (prompt) => {
    await supabase.from('prompts').update({ featured: !prompt.featured }).eq('id', prompt.id);
    setPrompts(ps => ps.map(p => p.id === prompt.id ? { ...p, featured: !p.featured } : p));
    toast.success(prompt.featured ? 'Removed from featured' : 'Added to featured!');
  };

  const toggleApprove = async (prompt) => {
    const newStatus = prompt.status === 'approved' ? 'pending' : 'approved';
    await supabase.from('prompts').update({ status: newStatus }).eq('id', prompt.id);
    setPrompts(ps => ps.map(p => p.id === prompt.id ? { ...p, status: newStatus } : p));
    toast.success(newStatus === 'approved' ? 'Prompt approved!' : 'Prompt hidden!');
  };

  const deletePrompt = async (id) => {
    if (!window.confirm('Delete this prompt?')) return;
    await supabase.from('prompts').delete().eq('id', id);
    setPrompts(ps => ps.filter(p => p.id !== id));
    toast.success('Deleted!');
  };

  const loadCreators = async () => {
    setLoadingCreators(true);
    const { data } = await supabase
      .from('creator_stats')
      .select('*')
      .order('trending_score', { ascending: false })
      .limit(50);
    setCreators(data || []);
    setLoadingCreators(false);
  };

  const toggleVerified = async (creator) => {
    const { error } = await supabase.from('users').update({ is_verified: !creator.is_verified }).eq('id', creator.id);
    if (error) return toast.error('Failed to update verification');
    setCreators(cs => cs.map(c => c.id === creator.id ? { ...c, is_verified: !c.is_verified } : c));
    toast.success(creator.is_verified ? 'Verification removed' : 'Creator verified!');
  };

  const toggleFeaturedCreator = async (creator) => {
    const makeFeatured = !creator.is_featured_override;
    const { error } = await supabase.rpc('set_featured_creator', { target_id: makeFeatured ? creator.id : null });
    if (error) return toast.error('Failed to update featured creator');
    setCreators(cs => cs.map(c => ({ ...c, is_featured_override: makeFeatured && c.id === creator.id })));
    toast.success(makeFeatured ? 'Set as Featured Creator of the Week!' : 'Featured creator cleared');
  };

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.badge}>
          <Shield size={14} color="#00E5FF" />
          Admin Dashboard
        </div>
        <h1 style={styles.title}>Promptora Admin</h1>
        <p style={styles.sub}>Manage prompts as Promptora Official</p>
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        <button style={{ ...styles.tab, ...(tab === 'upload' ? styles.tabActive : {}) }}
          onClick={() => setTab('upload')}>
          <Plus size={15} /> Upload Prompt
        </button>
        <button style={{ ...styles.tab, ...(tab === 'manage' ? styles.tabActive : {}) }}
          onClick={() => { setTab('manage'); loadPrompts(); }}>
          <Sparkles size={15} /> Manage Prompts
        </button>
        <button style={{ ...styles.tab, ...(tab === 'creators' ? styles.tabActive : {}) }}
          onClick={() => { setTab('creators'); loadCreators(); }}>
          <Users size={15} /> Creators
        </button>
      </div>

      {/* Upload Tab */}
      {tab === 'upload' && (
        <div style={styles.container}>
          <div style={styles.infoBox}>
            <Sparkles size={14} color="#00E5FF" />
            <span>This prompt will be published as <strong>Promptora Official</strong></span>
          </div>

          {!preview ? (
            <div style={styles.dropzone} onClick={() => fileRef.current?.click()}>
              <input ref={fileRef} type="file" accept="image/*" hidden
                onChange={e => handleFile(e.target.files[0])} />
              <Upload size={32} color="#444" />
              <p style={styles.dropText}>Tap to upload image</p>
              <p style={styles.dropSub}>PNG, JPG, WEBP</p>
            </div>
          ) : (
            <div style={{ position: 'relative' }}>
              <img src={preview} alt="preview" style={styles.previewImg} />
              <button style={styles.removeBtn} onClick={() => { setImage(null); setPreview(null); }}>
                <X size={16} />
              </button>
            </div>
          )}

          <div style={styles.field}>
            <label style={styles.label}>Title</label>
            <input value={title} onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Cyberpunk Night City" style={styles.input} />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>AI Model</label>
            <div style={{ position: 'relative' }}>
              <button style={styles.selectBtn} onClick={() => setModelOpen(!modelOpen)}>
                {model}
                <ChevronDown size={15} color="#888"
                  style={{ transform: modelOpen ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
              </button>
              {modelOpen && (
                <div style={styles.dropdown}>
                  {MODELS.map(m => (
                    <button key={m} style={styles.dropItem}
                      onClick={() => { setModel(m); setModelOpen(false); }}>{m}</button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Prompt Text</label>
            <textarea value={promptText} onChange={e => setPromptText(e.target.value)}
              placeholder="Full AI prompt text..." style={styles.textarea} rows={6} />
          </div>

          {/* Featured toggle */}
          <div style={styles.toggleRow}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, color: '#f0f0f0' }}>Mark as Featured</div>
              <div style={{ fontSize: 12, color: '#888' }}>Show in Featured tab on homepage</div>
            </div>
            <button
              style={{
                ...styles.toggle,
                background: featured ? '#00E5FF' : '#222',
              }}
              onClick={() => setFeatured(!featured)}
            >
              <div style={{
                ...styles.toggleDot,
                transform: featured ? 'translateX(22px)' : 'translateX(2px)',
              }} />
            </button>
          </div>

          <button style={{ ...styles.submitBtn, opacity: submitting ? 0.6 : 1 }}
            onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Publishing...' : '🚀 Publish as Promptora'}
          </button>
        </div>
      )}

      {/* Manage Tab */}
      {tab === 'manage' && (
        <div style={styles.container}>
          {loadingPrompts ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <div className="spinner" />
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {prompts.map(p => (
                <div key={p.id} style={styles.promptRow}>
                  {p.image_url && (
                    <img src={p.image_url} alt={p.title} style={styles.thumb} />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={styles.promptTitle}>{p.title}</div>
                    <div style={styles.promptMeta}>
                      @{p.creator?.username || 'unknown'} • {p.model}
                    </div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                      {/* Approve toggle */}
                      <button
                        style={{
                          ...styles.actionChip,
                          background: p.status === 'approved' ? 'rgba(0,229,255,0.1)' : 'rgba(255,77,109,0.1)',
                          color: p.status === 'approved' ? '#00E5FF' : '#ff4d6d',
                          border: `1px solid ${p.status === 'approved' ? 'rgba(0,229,255,0.3)' : 'rgba(255,77,109,0.3)'}`,
                        }}
                        onClick={() => toggleApprove(p)}
                      >
                        {p.status === 'approved' ? <Eye size={12} /> : <EyeOff size={12} />}
                        {p.status === 'approved' ? 'Visible' : 'Hidden'}
                      </button>

                      {/* Featured toggle */}
                      <button
                        style={{
                          ...styles.actionChip,
                          background: p.featured ? 'rgba(255,200,0,0.1)' : '#111',
                          color: p.featured ? '#FFD700' : '#888',
                          border: `1px solid ${p.featured ? 'rgba(255,200,0,0.3)' : '#222'}`,
                        }}
                        onClick={() => toggleFeatured(p)}
                      >
                        <Star size={12} fill={p.featured ? '#FFD700' : 'none'} />
                        {p.featured ? 'Featured' : 'Feature'}
                      </button>

                      {/* Delete */}
                      <button
                        style={{ ...styles.actionChip, color: '#ff4d6d', border: '1px solid rgba(255,77,109,0.2)' }}
                        onClick={() => deletePrompt(p.id)}
                      >
                        <Trash2 size={12} />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Creators Tab */}
      {tab === 'creators' && (
        <div style={styles.container}>
          {loadingCreators ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <div className="spinner" />
            </div>
          ) : creators.length === 0 ? (
            <div className="empty-state"><h3>No creators yet</h3></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {creators.map(c => (
                <div key={c.id} style={styles.promptRow}>
                  <img
                    src={c.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${c.username}`}
                    alt={c.username}
                    style={styles.thumb}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span style={styles.promptTitle}>{c.username}</span>
                      {c.is_verified && <VerifiedBadge size={13} />}
                      <CreatorLevelBadge level={c.creator_level} />
                    </div>
                    <div style={styles.promptMeta}>
                      {c.prompt_count} prompts · {c.followers_count} followers · {c.total_likes} likes · {c.total_views} views · {c.total_copies} copies
                    </div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                      <button
                        style={{
                          ...styles.actionChip,
                          background: c.is_verified ? 'rgba(0,229,255,0.1)' : '#111',
                          color: c.is_verified ? '#00E5FF' : '#888',
                          border: `1px solid ${c.is_verified ? 'rgba(0,229,255,0.3)' : '#222'}`,
                        }}
                        onClick={() => toggleVerified(c)}
                      >
                        <BadgeCheck size={12} />
                        {c.is_verified ? 'Verified' : 'Verify'}
                      </button>

                      <button
                        style={{
                          ...styles.actionChip,
                          background: c.is_featured_override ? 'rgba(255,200,0,0.1)' : '#111',
                          color: c.is_featured_override ? '#FFD700' : '#888',
                          border: `1px solid ${c.is_featured_override ? 'rgba(255,200,0,0.3)' : '#222'}`,
                        }}
                        onClick={() => toggleFeaturedCreator(c)}
                      >
                        <Star size={12} fill={c.is_featured_override ? '#FFD700' : 'none'} />
                        {c.is_featured_override ? 'Featured' : 'Feature'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', paddingBottom: 80 },
  header: {
    padding: '28px 20px 20px', textAlign: 'center',
    background: 'radial-gradient(ellipse at 50% 0%, rgba(0,229,255,0.07) 0%, transparent 70%)',
    borderBottom: '1px solid #111', marginBottom: 0,
  },
  badge: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '3px 12px', borderRadius: 50, marginBottom: 10,
    background: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.2)',
    color: '#00E5FF', fontSize: 12, fontWeight: 600,
  },
  title: {
    fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800,
    fontSize: 28, color: '#f0f0f0', marginBottom: 6,
  },
  sub: { color: '#888', fontSize: 13 },
  tabs: {
    display: 'flex', borderBottom: '1px solid #111',
    padding: '0 16px',
  },
  tab: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '12px 20px', background: 'none', border: 'none',
    color: '#666', fontSize: 14, fontWeight: 600, cursor: 'pointer',
    borderBottom: '2px solid transparent', transition: 'all 0.2s',
  },
  tabActive: { color: '#00E5FF', borderBottom: '2px solid #00E5FF' },
  container: { padding: '20px 16px', maxWidth: 560, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 },
  infoBox: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '10px 14px', borderRadius: 10,
    background: 'rgba(0,229,255,0.06)', border: '1px solid rgba(0,229,255,0.2)',
    color: '#00E5FF', fontSize: 13,
  },
  dropzone: {
    border: '2px dashed #222', borderRadius: 16, padding: '44px 20px',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
    cursor: 'pointer', background: '#0a0a0a',
  },
  dropText: { color: '#888', fontSize: 15, fontWeight: 500 },
  dropSub: { color: '#444', fontSize: 12 },
  previewImg: { width: '100%', borderRadius: 16, maxHeight: 300, objectFit: 'cover', display: 'block' },
  removeBtn: {
    position: 'absolute', top: 12, right: 12,
    width: 32, height: 32, borderRadius: '50%',
    background: 'rgba(0,0,0,0.7)', color: '#f0f0f0',
    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
    border: '1px solid #333',
  },
  field: { display: 'flex', flexDirection: 'column', gap: 8 },
  label: { fontSize: 13, fontWeight: 600, color: '#aaa' },
  input: {
    padding: '12px 16px', borderRadius: 12,
    background: '#0a0a0a', border: '1px solid #1e1e1e',
    color: '#f0f0f0', fontSize: 14, outline: 'none',
  },
  textarea: {
    padding: '12px 16px', borderRadius: 12,
    background: '#0a0a0a', border: '1px solid #1e1e1e',
    color: '#f0f0f0', fontSize: 14, outline: 'none',
    resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6,
  },
  selectBtn: {
    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '12px 16px', borderRadius: 12,
    background: '#0a0a0a', border: '1px solid #1e1e1e',
    color: '#f0f0f0', fontSize: 14, cursor: 'pointer',
  },
  dropdown: {
    position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 10,
    background: '#0d0d0d', border: '1px solid #1e1e1e', borderRadius: 12,
    overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
  },
  dropItem: {
    display: 'block', width: '100%', textAlign: 'left',
    padding: '11px 16px', background: 'none', border: 'none',
    color: '#ccc', fontSize: 14, cursor: 'pointer',
  },
  toggleRow: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '14px 16px', borderRadius: 12,
    background: '#0a0a0a', border: '1px solid #1e1e1e',
  },
  toggle: {
    width: 46, height: 26, borderRadius: 50,
    border: 'none', cursor: 'pointer', position: 'relative',
    transition: 'background 0.2s',
  },
  toggleDot: {
    position: 'absolute', top: 3,
    width: 20, height: 20, borderRadius: '50%',
    background: '#fff', transition: 'transform 0.2s',
  },
  submitBtn: {
    width: '100%', padding: '14px 20px', borderRadius: 50,
    background: 'linear-gradient(135deg, #00E5FF, #0099cc)',
    color: '#000', fontWeight: 800, fontSize: 15,
    border: 'none', cursor: 'pointer',
    boxShadow: '0 0 24px rgba(0,229,255,0.35)',
  },
  promptRow: {
    display: 'flex', gap: 12, padding: 14,
    background: '#0d0d0d', border: '1px solid #1e1e1e', borderRadius: 14,
  },
  thumb: { width: 60, height: 60, borderRadius: 10, objectFit: 'cover', flexShrink: 0 },
  promptTitle: { fontWeight: 600, fontSize: 14, color: '#f0f0f0', marginBottom: 2 },
  promptMeta: { fontSize: 12, color: '#666' },
  actionChip: {
    display: 'inline-flex', alignItems: 'center', gap: 4,
    padding: '4px 10px', borderRadius: 50,
    fontSize: 12, fontWeight: 600, cursor: 'pointer',
    background: '#111',
  },
  authPage: {
    minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
  },
  authCard: {
    background: '#0d0d0d', border: '1px solid #1e1e1e', borderRadius: 20,
    padding: 32, textAlign: 'center', maxWidth: 320, width: '100%',
  },
  authTitle: { fontFamily: "'Space Grotesk', sans-serif", fontSize: 22, fontWeight: 700, marginBottom: 8 },
  authSub: { color: '#888', fontSize: 14, marginBottom: 20 },
  authBtn: {
    padding: '12px 24px', borderRadius: 50, background: '#00E5FF',
    color: '#000', fontWeight: 700, border: 'none', cursor: 'pointer', fontSize: 14,
  },
};

