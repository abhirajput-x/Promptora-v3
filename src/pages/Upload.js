import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload as UploadIcon, X, Sparkles, ChevronDown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

const MODELS = ['Midjourney', 'DALL·E', 'Flux', 'ChatGPT', 'Stable Diffusion', 'Sora'];

export default function Upload() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef();

  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [title, setTitle] = useState('');
  const [promptText, setPromptText] = useState('');
  const [model, setModel] = useState('Midjourney');
  const [modelOpen, setModelOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!user) {
    navigate('/login');
    return null;
  }

  const handleFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return toast.error('Please upload an image');
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleFile(e.dataTransfer.files[0]);
  };

  const handleSubmit = async () => {
    if (!image) return toast.error('Please upload an image');
    if (!title.trim()) return toast.error('Please add a title');
    if (!promptText.trim()) return toast.error('Please add the prompt text');

    setSubmitting(true);
    try {
      const fileExt = image.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('prompt-images')
        .upload(fileName, image);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('prompt-images')
        .getPublicUrl(fileName);

      const { error: insertError } = await supabase.from('prompts').insert({
        user_id: user.id,
        title: title.trim(),
        prompt_text: promptText.trim(),
        model,
        image_url: urlData.publicUrl,
        status: 'pending',
      });

      if (insertError) throw insertError;

      toast.success('Prompt submitted! Pending review.');
      navigate('/profile');
    } catch (err) {
      toast.error('Upload failed: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div style={styles.badge}>
          <Sparkles size={13} color="#00E5FF" />
          Share Your Work
        </div>
        <h1 style={styles.title}>Upload a Prompt</h1>
        <p style={styles.sub}>Share your AI creation with the Promptora community</p>
      </div>

      <div style={styles.container}>
        {!preview ? (
          <div
            style={styles.dropzone}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
          >
            <input ref={fileRef} type="file" accept="image/*" hidden
              onChange={(e) => handleFile(e.target.files[0])} />
            <UploadIcon size={32} color="#444" />
            <p style={styles.dropText}>Drop image here or tap to upload</p>
            <p style={styles.dropSub}>PNG, JPG, WEBP supported</p>
          </div>
        ) : (
          <div style={styles.previewWrapper}>
            <img src={preview} alt="Preview" style={styles.previewImg} />
            <button style={styles.removeBtn} onClick={() => { setImage(null); setPreview(null); }}>
              <X size={16} />
            </button>
          </div>
        )}

        <div style={styles.field}>
          <label style={styles.label}>Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Cyberpunk City at Night"
            style={styles.input}
          />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>AI Model</label>
          <div style={{ position: 'relative' }}>
            <button style={styles.selectBtn} onClick={() => setModelOpen(!modelOpen)}>
              {model}
              <ChevronDown size={16} color="#888"
                style={{ transform: modelOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>
            {modelOpen && (
              <div style={styles.dropdown}>
                {MODELS.map(m => (
                  <button key={m} style={styles.dropdownItem}
                    onClick={() => { setModel(m); setModelOpen(false); }}>
                    {m}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Prompt Text</label>
          <textarea
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            placeholder="Paste the full prompt you used to generate this image..."
            style={styles.textarea}
            rows={6}
          />
        </div>

        <button
          style={{ ...styles.submitBtn, opacity: submitting ? 0.6 : 1 }}
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? 'Uploading...' : 'Submit Prompt'}
        </button>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', paddingBottom: 100 },
  header: {
    padding: '32px 20px 24px', textAlign: 'center',
    background: 'radial-gradient(ellipse at 50% 0%, rgba(0,229,255,0.06) 0%, transparent 70%)',
    borderBottom: '1px solid #111', marginBottom: 24,
  },
  badge: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '3px 12px', borderRadius: 50, marginBottom: 12,
    background: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.2)',
    color: '#00E5FF', fontSize: 12, fontWeight: 600,
  },
  title: {
    fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800,
    fontSize: 'clamp(24px, 6vw, 36px)', color: '#f0f0f0', marginBottom: 8,
  },
  sub: { color: '#888', fontSize: 14 },
  container: { padding: '0 16px', maxWidth: 560, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 18 },
  dropzone: {
    border: '2px dashed #222', borderRadius: 16, padding: '48px 20px',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
    cursor: 'pointer', background: '#0a0a0a',
  },
  dropText: { color: '#888', fontSize: 15, fontWeight: 500 },
  dropSub: { color: '#444', fontSize: 12 },
  previewWrapper: { position: 'relative', borderRadius: 16, overflow: 'hidden' },
  previewImg: { width: '100%', borderRadius: 16, display: 'block', maxHeight: 320, objectFit: 'cover' },
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
  dropdownItem: {
    display: 'block', width: '100%', textAlign: 'left',
    padding: '11px 16px', background: 'none', border: 'none',
    color: '#ccc', fontSize: 14, cursor: 'pointer',
  },
  submitBtn: {
    width: '100%', padding: '14px 20px', borderRadius: 50,
    background: '#00E5FF', color: '#000', fontWeight: 700, fontSize: 15,
    border: 'none', cursor: 'pointer',
    boxShadow: '0 0 20px rgba(0,229,255,0.3)',
  },
};

