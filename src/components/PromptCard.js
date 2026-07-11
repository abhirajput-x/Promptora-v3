import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Bookmark, Copy, Check, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useAuthModal } from '../context/AuthModalContext';
import VerifiedBadge from './VerifiedBadge';
import CreatorLevelBadge from './CreatorLevelBadge';
import toast from 'react-hot-toast';

export default function PromptCard({ prompt, onClick }) {
  const { user } = useAuth();
  const { requireAuth } = useAuthModal();
  const [liked, setLiked] = useState(prompt.user_liked || false);
  const [saved, setSaved] = useState(prompt.user_saved || false);
  const [likes, setLikes] = useState(prompt.likes_count || 0);
  const [copied, setCopied] = useState(false);
  const [hovered, setHovered] = useState(false);

  const handleLike = async (e) => {
    e.stopPropagation();
    if (!user) { requireAuth('Please sign in to like prompts.'); return; }
    const next = !liked;
    setLiked(next);
    setLikes(l => (next ? l + 1 : Math.max(l - 1, 0)));
    try {
      if (next) {
        const { error } = await supabase.from('likes').insert({ user_id: user.id, prompt_id: prompt.id });
        if (error) throw error;
      } else {
        const { error } = await supabase.from('likes').delete().match({ user_id: user.id, prompt_id: prompt.id });
        if (error) throw error;
      }
    } catch {
      setLiked(!next);
      setLikes(l => (next ? Math.max(l - 1, 0) : l + 1));
      toast.error('Something went wrong');
    }
  };

  const handleSave = async (e) => {
    e.stopPropagation();
    if (!user) { requireAuth('Please sign in to save prompts.'); return; }
    const next = !saved;
    setSaved(next);
    try {
      if (next) {
        const { error } = await supabase.from('saves').insert({ user_id: user.id, prompt_id: prompt.id });
        if (error) throw error;
      } else {
        const { error } = await supabase.from('saves').delete().match({ user_id: user.id, prompt_id: prompt.id });
        if (error) throw error;
      }
      toast.success(next ? 'Saved to library' : 'Removed from library');
    } catch {
      setSaved(!next);
      toast.error('Something went wrong');
    }
  };

  const handleCopy = async (e) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(prompt.prompt_text);
    setCopied(true);
    toast.success('Prompt copied!');
    setTimeout(() => setCopied(false), 2000);
    await supabase.rpc('increment_copies', { prompt_id: prompt.id });
  };

  return (
    <div
      style={{
        ...styles.card,
        borderColor: hovered ? 'rgba(0,229,255,0.5)' : 'rgba(0,229,255,0.08)',
        boxShadow: hovered
          ? '0 0 0 1px rgba(0,229,255,0.3), 0 12px 32px rgba(0,229,255,0.18), 0 4px 16px rgba(0,0,0,0.5)'
          : '0 4px 16px rgba(0,0,0,0.4)',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
      }}
      onClick={() => onClick && onClick(prompt)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onTouchStart={() => setHovered(true)}
    >
      {/* Glow ring on top edge */}
      <div style={{
        position: 'absolute', top: 0, left: '10%', right: '10%', height: 1,
        background: hovered
          ? 'linear-gradient(90deg, transparent, rgba(0,229,255,0.9), transparent)'
          : 'linear-gradient(90deg, transparent, rgba(0,229,255,0.25), transparent)',
        zIndex: 2, transition: 'background 0.3s ease',
      }} />

      {prompt.image_url && (
        <div style={styles.imageWrap}>
          <img src={prompt.image_url} alt={prompt.title} style={styles.image} loading="lazy" />
          {/* Soft cyan gradient overlay at bottom of image for premium depth */}
          <div style={styles.imageOverlay} />
          {/* New / featured shimmer badge */}
          <div style={styles.shimmerBadge}>
            <Sparkles size={11} color="#00E5FF" />
            <span>AI</span>
          </div>
        </div>
      )}

      <div style={styles.body}>
        <div style={styles.modelTag}>{prompt.model || 'AI'}</div>
        <h3 style={styles.title}>{prompt.title}</h3>
        <p style={styles.preview}>{prompt.prompt_text?.slice(0, 100)}...</p>

        {prompt.creator && (
          <Link
            to={`/creator/${prompt.user_id}`}
            onClick={e => e.stopPropagation()}
            style={styles.creatorRow}
          >
            <img
              src={prompt.creator.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${prompt.creator.username}`}
              alt={prompt.creator.username}
              style={styles.creatorAvatar}
            />
            <span style={styles.creatorName}>{prompt.creator.username}</span>
            {prompt.creator.is_verified && <VerifiedBadge size={12} />}
            {prompt.creator.creator_level && <CreatorLevelBadge level={prompt.creator.creator_level} />}
          </Link>
        )}

        <div style={styles.actions}>
          <button style={styles.actionBtn} onClick={handleLike}>
            <Heart size={15} fill={liked ? '#ff4d6d' : 'none'} color={liked ? '#ff4d6d' : '#888'} />
            <span style={{ color: liked ? '#ff4d6d' : '#888', fontSize: 12 }}>{likes}</span>
          </button>

          <button style={styles.actionBtn} onClick={handleSave}>
            <Bookmark size={15} fill={saved ? '#00E5FF' : 'none'} color={saved ? '#00E5FF' : '#888'}
              style={saved ? { filter: 'drop-shadow(0 0 4px rgba(0,229,255,0.7))' } : {}} />
          </button>

          <button style={{ ...styles.actionBtn, marginLeft: 'auto' }} onClick={handleCopy}>
            {copied
              ? <Check size={15} color="#00E5FF" style={{ filter: 'drop-shadow(0 0 4px rgba(0,229,255,0.7))' }} />
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
    position: 'relative',
    background: 'linear-gradient(180deg, #0d0d0d 0%, #0a0a0a 100%)',
    border: '1px solid rgba(0,229,255,0.08)',
    borderRadius: 16, overflow: 'hidden',
    cursor: 'pointer',
    transition: 'border-color 0.3s ease, box-shadow 0.3s ease, transform 0.3s ease',
    display: 'flex', flexDirection: 'column',
  },
  imageWrap: { position: 'relative', width: '100%' },
  image: { width: '100%', objectFit: 'cover', display: 'block', maxHeight: 220 },
  imageOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%',
    background: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.55) 100%)',
    pointerEvents: 'none',
  },
  shimmerBadge: {
    position: 'absolute', top: 10, right: 10,
    display: 'flex', alignItems: 'center', gap: 4,
    padding: '3px 9px', borderRadius: 50,
    background: 'rgba(5,5,5,0.7)',
    border: '1px solid rgba(0,229,255,0.4)',
    backdropFilter: 'blur(6px)',
    boxShadow: '0 0 12px rgba(0,229,255,0.25)',
    fontSize: 10, fontWeight: 700, color: '#00E5FF', letterSpacing: 0.5,
  },
  body: { padding: '14px 16px 16px', display: 'flex', flexDirection: 'column', gap: 7 },
  modelTag: {
    display: 'inline-block', alignSelf: 'flex-start',
    padding: '2px 10px', borderRadius: 50,
    background: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.3)',
    color: '#00E5FF', fontSize: 11, fontWeight: 700,
    textShadow: '0 0 8px rgba(0,229,255,0.4)',
  },
  title: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: 14.5, fontWeight: 700, color: '#f5f5f5',
    lineHeight: 1.35,
  },
  preview: { fontSize: 12, color: '#666', lineHeight: 1.5 },
  creatorRow: {
    display: 'flex', alignItems: 'center', gap: 5,
    textDecoration: 'none', width: 'fit-content', maxWidth: '100%',
  },
  creatorAvatar: { width: 18, height: 18, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 },
  creatorName: {
    fontSize: 11.5, fontWeight: 600, color: '#999',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 90,
  },
  actions: { display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 },
  actionBtn: {
    display: 'flex', alignItems: 'center', gap: 4,
    padding: '4px 6px', borderRadius: 6,
    background: 'none', border: 'none', cursor: 'pointer',
    transition: 'background 0.15s, transform 0.15s',
  },
};
