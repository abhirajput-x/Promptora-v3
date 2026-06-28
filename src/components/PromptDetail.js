import { useState } from 'react';
import { X, Copy, Check, Heart, Bookmark, Share2, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export default function PromptDetail({ prompt, onClose }) {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState(prompt.user_liked || false);
  const [saved, setSaved] = useState(prompt.user_saved || false);

  if (!prompt) return null;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(prompt.prompt_text);
    setCopied(true);
    toast.success('Prompt copied!');
    await supabase.rpc('increment_copies', { prompt_id: prompt.id });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    try {
      await navigator.share({ title: prompt.title, text: prompt.prompt_text });
    } catch {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied!');
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>
        {/* Header */}
        <div style={styles.header}>
          <button onClick={onClose} style={styles.backBtn}>
            <X size={18} />
          </button>
          <h2 style={styles.modalTitle}>{prompt.title}</h2>
        </div>

        {/* Image */}
        {prompt.image_url && (
          <img src={prompt.image_url} alt={prompt.title} style={styles.image} />
        )}

        {/* Meta */}
        <div style={styles.meta}>
          {prompt.model && <span className="tag active">{prompt.model}</span>}
          {prompt.category && <span className="tag">{prompt.category}</span>}
        </div>

        {/* Prompt text */}
        <div style={styles.promptBox}>
          <p style={styles.promptText}>{prompt.prompt_text}</p>
          <button className="btn btn-primary" onClick={handleCopy} style={styles.copyBtn}>
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? 'Copied!' : 'Copy Prompt'}
          </button>
        </div>

        {/* Actions */}
        <div style={styles.actions}>
          <button style={{
            ...styles.actionBtn,
            color: liked ? '#ff4d6d' : '#888',
            background: liked ? 'rgba(255,77,109,0.1)' : '#111',
          }} onClick={() => setLiked(!liked)}>
            <Heart size={16} fill={liked ? '#ff4d6d' : 'none'} />
            {liked ? 'Liked' : 'Like'}
          </button>

          <button style={{
            ...styles.actionBtn,
            color: saved ? '#00E5FF' : '#888',
            background: saved ? 'rgba(0,229,255,0.1)' : '#111',
          }} onClick={() => setSaved(!saved)}>
            <Bookmark size={16} fill={saved ? '#00E5FF' : 'none'} />
            {saved ? 'Saved' : 'Save'}
          </button>

          <button style={styles.actionBtn} onClick={handleShare}>
            <Share2 size={16} />
            Share
          </button>
        </div>

        {/* Creator */}
        {prompt.creator && (
          <div style={styles.creator}>
            <img
              src={prompt.creator.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${prompt.creator.username}`}
              alt={prompt.creator.username}
              style={styles.creatorAvatar}
            />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{prompt.creator.username}</div>
              <div style={{ fontSize: 12, color: '#888' }}>Creator</div>
            </div>
            <ChevronRight size={16} color="#888" style={{ marginLeft: 'auto' }} />
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  header: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 },
  backBtn: { padding: 6, borderRadius: 8, background: '#1a1a1a', color: '#888', flexShrink: 0 },
  modalTitle: {
    fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 18, flex: 1,
  },
  image: { width: '100%', borderRadius: 12, marginBottom: 14, objectFit: 'cover', maxHeight: 280 },
  meta: { display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 },
  promptBox: {
    background: '#0a0a0a', border: '1px solid #1e1e1e', borderRadius: 12,
    padding: 16, marginBottom: 16,
  },
  promptText: { fontSize: 14, color: '#ccc', lineHeight: 1.7, marginBottom: 14 },
  copyBtn: { width: '100%', justifyContent: 'center', borderRadius: 10 },
  actions: { display: 'flex', gap: 8, marginBottom: 16 },
  actionBtn: {
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    padding: '10px 8px', borderRadius: 10, border: '1px solid #1e1e1e',
    fontSize: 13, fontWeight: 500, transition: 'all 0.2s', cursor: 'pointer',
    background: '#111',
  },
  creator: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: 14, background: '#0a0a0a', border: '1px solid #1e1e1e', borderRadius: 12,
    cursor: 'pointer',
  },
  creatorAvatar: { width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' },
};

