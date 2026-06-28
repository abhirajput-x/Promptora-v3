import { useState, useRef } from 'react';
import { Upload, Copy, Check, RefreshCw, Wand2, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Tools() {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileRef = useRef();

  const handleFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return toast.error('Please upload an image');
    setImage(file);
    setPreview(URL.createObjectURL(file));
    setPrompt('');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleFile(e.dataTransfer.files[0]);
  };

  const analyzeImage = async () => {
    if (!image) return;
    setLoading(true);
    setProgress(0);

    const interval = setInterval(() => {
      setProgress(p => Math.min(p + 8, 90));
    }, 200);

    try {
      const base64 = await toBase64(image);
      const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
      const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + apiKey;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                inlineData: {
                  mimeType: image.type,
                  data: base64.split(',')[1],
                }
              },
              {
                text: 'Analyze this image and generate a detailed AI art prompt that could recreate it. Include: style, lighting, colors, composition, mood, subject details, camera settings if relevant. Format: A single detailed paragraph prompt, optimized for Midjourney or Stable Diffusion. Do not include any explanation, just the prompt text.'
              }
            ]
          }]
        }),
      });

      const data = await response.json();
      const text = data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0] && data.candidates[0].content.parts[0].text;

      if (text) {
        setPrompt(text);
        setProgress(100);
      } else {
        toast.error('Could not analyze image. Check your Gemini API key.');
      }
    } catch (err) {
      toast.error('Analysis failed. Check your API key.');
    } finally {
      clearInterval(interval);
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    toast.success('Prompt copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const reset = () => {
    setImage(null);
    setPreview(null);
    setPrompt('');
    setProgress(0);
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div style={styles.badge}>
          <Wand2 size={13} color="#00E5FF" />
          AI-Powered
        </div>
        <h1 style={styles.title}>Image to Prompt</h1>
        <p style={styles.sub}>Upload any image and get a detailed AI prompt to recreate it</p>
      </div>

      <div style={styles.container}>
        {!preview ? (
          <div
            style={styles.dropzone}
            onDragOver={e => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileRef.current && fileRef.current.click()}
          >
            <input ref={fileRef} type="file" accept="image/*" hidden
              onChange={e => handleFile(e.target.files[0])} />
            <Wand2 size={32} color="#444" />
            <p style={styles.dropText}>Drop image here or tap to upload</p>
            <p style={styles.dropSub}>PNG, JPG, WEBP supported</p>
          </div>
        ) : (
          <div style={styles.previewWrapper}>
            <img src={preview} alt="Preview" style={styles.previewImg} />
            <button style={styles.removeBtn} onClick={reset}>
              <X size={16} />
            </button>
          </div>
        )}

        {preview && !prompt && (
          <button
            className="btn btn-primary"
            style={styles.analyzeBtn}
            onClick={analyzeImage}
            disabled={loading}
          >
            {loading ? (
              <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
            ) : (
              <Wand2 size={16} />
            )}
            {loading ? 'Analyzing...' : 'Generate Prompt'}
          </button>
        )}

        {loading && (
          <div style={styles.progressBar}>
            <div style={{ height: '100%', background: '#00E5FF', width: progress + '%', transition: 'width 0.3s ease', borderRadius: 2 }} />
          </div>
        )}

        {prompt && (
          <div style={styles.result}>
            <div style={styles.resultHeader}>
              <span style={styles.resultLabel}>Generated Prompt</span>
              <button className="btn btn-ghost" style={{ padding: '6px 10px', fontSize: 13 }} onClick={analyzeImage}>
                <RefreshCw size={14} />
              </button>
            </div>
            <p style={styles.promptText}>{prompt}</p>
            <button className="btn btn-primary" style={styles.copyBtn} onClick={handleCopy}>
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? 'Copied!' : 'Copy Prompt'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function toBase64(file) {
  return new Promise(function(res, rej) {
    var reader = new FileReader();
    reader.onload = function() { res(reader.result); };
    reader.onerror = rej;
    reader.readAsDataURL(file);
  });
}

const styles = {
  page: { minHeight: '100vh', paddingBottom: 80 },
  header: {
    padding: '32px 20px 24px',
    textAlign: 'center',
    background: 'radial-gradient(ellipse at 50% 0%, rgba(0,229,255,0.06) 0%, transparent 70%)',
    borderBottom: '1px solid #111',
    marginBottom: 24,
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
  container: { padding: '0 16px', maxWidth: 560, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 },
  dropzone: {
    border: '2px dashed #222', borderRadius: 16, padding: '48px 20px',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
    cursor: 'pointer', transition: 'all 0.2s', background: '#0a0a0a',
  },
  dropText: { color: '#888', fontSize: 15, fontWeight: 500 },
  dropSub: { color: '#444', fontSize: 12 },
  previewWrapper: { position: 'relative', borderRadius: 16, overflow: 'hidden' },
  previewImg: { width: '100%', borderRadius: 16, display: 'block', maxHeight: 340, objectFit: 'cover' },
  removeBtn: {
    position: 'absolute', top: 12, right: 12,
    width: 32, height: 32, borderRadius: '50%',
    background: 'rgba(0,0,0,0.7)', color: '#f0f0f0',
    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
    border: '1px solid #333',
  },
  analyzeBtn: { width: '100%', justifyContent: 'center', padding: '13px 20px', fontSize: 15 },
  progressBar: { height: 3, background: '#111', borderRadius: 2, overflow: 'hidden' },
  result: {
    background: '#0a0a0a', border: '1px solid #1e1e1e', borderRadius: 16, padding: 16,
    display: 'flex', flexDirection: 'column', gap: 12,
  },
  resultHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  resultLabel: { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 14, color: '#00E5FF' },
  promptText: { fontSize: 14, color: '#ccc', lineHeight: 1.7 },
  copyBtn: { width: '100%', justifyContent: 'center', borderRadius: 10, padding: '12px 20px' },
};

