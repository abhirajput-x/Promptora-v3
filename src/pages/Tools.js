import { useState, useRef } from 'react';
import { Copy, Check, RefreshCw, Wand2, X } from 'lucide-react';
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
    setProgress(10);

    const interval = setInterval(() => {
      setProgress(function(p) { return Math.min(p + 5, 85); });
    }, 300);

    try {
      const reader = new FileReader();
      const base64 = await new Promise(function(resolve, reject) {
        reader.onload = function() { resolve(reader.result); };
        reader.onerror = reject;
        reader.readAsDataURL(image);
      });

      const base64Data = base64.split(',')[1];
      const apiKey = process.env.REACT_APP_GEMINI_API_KEY;

      if (!apiKey) {
        toast.error('Gemini API key missing!');
        return;
      }

      const apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent?key=' + apiKey;
      const requestBody = {
        contents: [
          {
            parts: [
              {
                inlinedata: {
                  mime_type: image.type,
                  data: base64Data
                }
              },
              {
                text: 'Analyze this image and write a detailed AI art prompt to recreate it. Include style, lighting, colors, mood, and subject details. Write only the prompt, nothing else.'
              }
            ]
          }
        ]
      };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error('API Error: ' + (data.error ? data.error.message : 'Unknown error'));
        return;
      }

      if (data.candidates && data.candidates.length > 0) {
        const text = data.candidates[0].content.parts[0].text;
        setPrompt(text);
        setProgress(100);
        toast.success('Prompt generated!');
      } else {
        toast.error('No response from Gemini. Try again.');
      }

    } catch (error) {
      toast.error('Failed: ' + error.message);
    } finally {
      clearInterval(interval);
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    toast.success('Prompt copied!');
    setTimeout(function() { setCopied(false); }, 2000);
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
            onDragOver={function(e) { e.preventDefault(); }}
            onDrop={handleDrop}
            onClick={function() { if (fileRef.current) fileRef.current.click(); }}
          >
            <input ref={fileRef} type="file" accept="image/*" hidden
              onChange={function(e) { handleFile(e.target.files[0]); }} />
            <Wand2 size={36} color="#333" />
            <p style={styles.dropText}>Tap to upload image</p>
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
            style={styles.analyzeBtn}
            onClick={analyzeImage}
            disabled={loading}
          >
            {loading ? (
              <div style={styles.spinner} />
            ) : (
              <Wand2 size={16} color="#000" />
            )}
            <span>{loading ? 'Analyzing...' : 'Generate Prompt'}</span>
          </button>
        )}

        {loading && (
          <div style={styles.progressBar}>
            <div style={{ height: '100%', background: '#00E5FF', width: progress + '%', transition: 'width 0.4s ease', borderRadius: 2 }} />
          </div>
        )}

        {prompt && (
          <div style={styles.result}>
            <div style={styles.resultHeader}>
              <span style={styles.resultLabel}>Generated Prompt</span>
              <button style={styles.refreshBtn} onClick={analyzeImage}>
                <RefreshCw size={14} color="#888" />
              </button>
            </div>
            <p style={styles.promptText}>{prompt}</p>
            <button style={styles.copyBtn} onClick={handleCopy}>
              {copied ? <Check size={16} color="#000" /> : <Copy size={16} color="#000" />}
              <span>{copied ? 'Copied!' : 'Copy Prompt'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
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
    border: '2px dashed #222', borderRadius: 16, padding: '52px 20px',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
    cursor: 'pointer', background: '#0a0a0a',
  },
  dropText: { color: '#888', fontSize: 15, fontWeight: 500 },
  dropSub: { color: '#444', fontSize: 12 },
  previewWrapper: { position: 'relative', borderRadius: 16, overflow: 'hidden' },
  previewImg: { width: '100%', borderRadius: 16, display: 'block', maxHeight: 360, objectFit: 'cover' },
  removeBtn: {
    position: 'absolute', top: 12, right: 12,
    width: 34, height: 34, borderRadius: '50%',
    background: 'rgba(0,0,0,0.75)', color: '#f0f0f0',
    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
    border: '1px solid #333',
  },
  analyzeBtn: {
    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
    padding: '14px 20px', borderRadius: 50, border: 'none', cursor: 'pointer',
    background: '#00E5FF', fontSize: 15, fontWeight: 700,
    boxShadow: '0 0 20px rgba(0,229,255,0.3)',
  },
  spinner: {
    width: 18, height: 18, borderRadius: '50%',
    border: '2px solid rgba(0,0,0,0.2)', borderTopColor: '#000',
    animation: 'spin 0.7s linear infinite',
  },
  progressBar: { height: 3, background: '#111', borderRadius: 2, overflow: 'hidden' },
  result: {
    background: '#0a0a0a', border: '1px solid #1e1e1e', borderRadius: 16, padding: 18,
    display: 'flex', flexDirection: 'column', gap: 14,
  },
  resultHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  resultLabel: { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 14, color: '#00E5FF' },
  refreshBtn: { padding: 6, borderRadius: 8, background: '#111', border: '1px solid #222', cursor: 'pointer' },
  promptText: { fontSize: 14, color: '#ccc', lineHeight: 1.75 },
  copyBtn: {
    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    padding: '13px 20px', borderRadius: 50, border: 'none', cursor: 'pointer',
    background: '#00E5FF', fontSize: 14, fontWeight: 700,
    boxShadow: '0 0 16px rgba(0,229,255,0.25)',
  },
};
