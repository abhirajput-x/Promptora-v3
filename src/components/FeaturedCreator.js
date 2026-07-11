import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Heart, Eye, Copy, Users, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import VerifiedBadge from './VerifiedBadge';
import CreatorLevelBadge from './CreatorLevelBadge';

export default function FeaturedCreator() {
  const [creator, setCreator] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      // Manual admin override wins if set; otherwise the current #1
      // trending creator is automatically featured.
      const { data: override } = await supabase
        .from('creator_stats')
        .select('*')
        .eq('is_featured_override', true)
        .limit(1)
        .maybeSingle();

      let pick = override;
      if (!pick) {
        const { data: top } = await supabase
          .from('creator_stats')
          .select('*')
          .order('trending_score', { ascending: false })
          .limit(1)
          .maybeSingle();
        pick = top;
      }
      if (active) { setCreator(pick); setLoading(false); }
    })();
    return () => { active = false; };
  }, []);

  if (loading || !creator) return null;

  const avatarUrl = creator.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${creator.username}`;

  return (
    <div style={styles.wrap}>
      <div style={styles.badge}>
        <Sparkles size={13} color="#00E5FF" />
        Featured Creator of the Week
      </div>

      <Link to={`/creator/${creator.id}`} style={styles.card}>
        <img src={avatarUrl} alt={creator.username} style={styles.avatar} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={styles.nameRow}>
            <span style={styles.name}>{creator.username}</span>
            {creator.is_verified && <VerifiedBadge size={16} />}
            <CreatorLevelBadge level={creator.creator_level} />
          </div>
          {creator.bio && <p style={styles.bio}>{creator.bio}</p>}

          <div style={styles.stats}>
            <span style={styles.stat}><Users size={12} /> {creator.followers_count}</span>
            <span style={styles.stat}><Heart size={12} /> {creator.total_likes}</span>
            <span style={styles.stat}><Eye size={12} /> {creator.total_views}</span>
            <span style={styles.stat}><Copy size={12} /> {creator.total_copies}</span>
          </div>
        </div>

        <ArrowRight size={18} color="#00E5FF" style={{ flexShrink: 0 }} />
      </Link>
    </div>
  );
}

const styles = {
  wrap: { margin: '28px 16px' },
  badge: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '5px 12px', borderRadius: 50, marginBottom: 12,
    background: 'rgba(0,229,255,0.08)', border: '1px solid rgba(0,229,255,0.25)',
    fontSize: 12, fontWeight: 700, color: '#00E5FF',
  },
  card: {
    display: 'flex', alignItems: 'center', gap: 16,
    padding: 20, borderRadius: 20, textDecoration: 'none', color: 'inherit',
    background: 'linear-gradient(135deg, rgba(0,229,255,0.06), rgba(0,119,255,0.03))',
    border: '1px solid rgba(0,229,255,0.18)',
    boxShadow: '0 0 30px rgba(0,229,255,0.06)',
  },
  avatar: {
    width: 68, height: 68, borderRadius: '50%', objectFit: 'cover', flexShrink: 0,
    border: '2px solid rgba(0,229,255,0.4)',
  },
  nameRow: { display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' },
  name: { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 17, color: '#f0f0f0' },
  bio: {
    fontSize: 12.5, color: '#888', marginBottom: 8, lineHeight: 1.4,
    overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box',
    WebkitLineClamp: 1, WebkitBoxOrient: 'vertical',
  },
  stats: { display: 'flex', gap: 14, flexWrap: 'wrap' },
  stat: { display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#aaa', fontWeight: 600 },
};
