import { useState } from 'react';
import { Heart, Bookmark, Copy, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

export default function PromptCard({ prompt, onClick }) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(prompt.user_liked || false);
  const [saved, setSaved] = useState(prompt.user_saved || false);
  const [likes, setLikes] = useState(prompt.likes_count || 0);
  const [copied, setCopied] = useState(false);

  const handleLike = async (e) => {
    e.stopPropagation();
    if (!user) return toast.error('Sign in to like prompts');
    setLiked(!liked);
    setLikes(l => liked ? l - 1 : l + 1);
    if (liked) {
      await supabase.from('likes').delete().match({ user_id: user.id, prompt_id: prompt.id });
    } else {
      await supabase.from('likes').insert({ user_id: user.id, prompt_id: prompt.id });
    }
  };

  const handleSave = async (e) => {
    e.stopPropagation();
    if (!user) return toast.error('Sign in to save prompts');
    setSaved(!saved);
    if (saved) {
      await supabase.from('saves').delete().match({ user_id: user.id, prompt_id: prompt.id });
    } else {
      await supabase.from('saves').insert({ user_id: user.id, prompt_id: prompt.id });
    }
    toast.success(saved ? 'Removed from library' : 'Saved to library');
  };

  const handleCopy = async (e) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(prompt.prompt_text);
    setCopied(true);
    toast.success('Prompt copied!');
    setTimeout(() => setCopied(false), 2000);
    // increment copy count
    await supabase.rpc('increment_copies', { prompt_id: prompt.id });
  };

  return (
    <div style={styles.card} onClick={() => onClick && onClick(prompt)}>
      {prompt.image_url && (
        <img src={prompt.image_url} alt={prompt.title} style={styles.image} loading="lazy" />
      )}

      <div style={styles.body}>
        <div style={styles.modelTag}>{prompt.model || 'AI'}</div>
        <h3 style={styles.title}>{prompt.title}</h3>
        <p style={styles.preview}>{prompt.prompt_text?.slice(0, 100)}...</p>

        <div style={styles.actions}>
          <button style={styles.actionBtn} onClick={handleLike}>
            <Heart size={15} fill={liked ? '#ff4d6d' : 'none'} color={liked ? '#ff4d6d' : '#888'} />
            <span style={{ color: liked ? '#ff4d6d' : '#888', fontSize: 12 }}>{likes}</span>
          </button>

          <button style={styles.actionBtn} onClick={handleSave}>
            <Bookmark size={15} fill={saved ? '#00E5FF' : 'none'} color={saved ? '#00E5FF' : '#888'} />
          </button>

          <button style={{ ...styles.actionBtn, marginLeft: 'auto' }} onClick={handleCopy}>
            {copied
              ? <Check size={15} color="#00E5FF" />
              : <Copy size={15} color="#888" />
            }
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  card: {
    background: '#0d0d0d', border: '1px solid #1e1e1e',
    borderRadius: 14, overflow: 'hidden',
    cursor: 'pointer', transition: 'all 0.2s',
    display: 'flex', flexDirection: 'column',
  },
  image: { width: '100%', objectFit: 'cover', display: 'block', maxHeight: 220 },
  body: { padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 6 },
  modelTag: {
    display: 'inline-block', alignSelf: 'flex-start',
    padding: '2px 8px', borderRadius: 50,
    background: 'rgba(0,229,255,0.12)', border: '1px solid rgba(0,229,255,0.25)',
    color: '#00E5FF', fontSize: 11, fontWeight: 600,
  },
  title: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: 14, fontWeight: 600, color: '#f0f0f0',
    lineHeight: 1.3,
  },
  preview: { fontSize: 12, color: '#666', lineHeight: 1.5 },
  actions: { display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 },
  actionBtn: {
    display: 'flex', alignItems: 'center', gap: 4,
    padding: '4px 6px', borderRadius: 6,
    background: 'none', border: 'none', cursor: 'pointer',
    transition: 'background 0.15s',
  },
};

