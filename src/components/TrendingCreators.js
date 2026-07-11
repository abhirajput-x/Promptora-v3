import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import VerifiedBadge from './VerifiedBadge';
import CreatorLevelBadge from './CreatorLevelBadge';

export default function TrendingCreators() {
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase
        .from('creator_stats')
        .select('*')
        .order('trending_score', { ascending: false })
        .limit(10);
      if (active) { setCreators(data || []); setLoading(false); }
    })();
    return () => { active = false; };
  }, []);

  if (loading || creators.length === 0) return null;

  return (
    <div style={styles.wrap}>
      <div style={styles.header}>
        <TrendingUp size={16} color="#00E5FF" />
        <h2 style={styles.title}>Trending Creators</h2>
      </div>
      <div style={styles.scroller}>
        {creators.map(c => (
          <Link key={c.id} to={`/creator/${c.id}`} style={styles.card}>
            <img
              src={c.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${c.username}`}
              alt={c.username}
              style={styles.avatar}
            />
            <div style={styles.nameRow}>
              <span style={styles.name}>{c.username}</span>
              {c.is_verified && <VerifiedBadge size={13} />}
            </div>
            <CreatorLevelBadge level={c.creator_level} />
            <span style={styles.followers}>{c.followers_count} followers</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

const styles = {
  wrap: { margin: '28px 0' },
  header: { display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px', marginBottom: 14 },
  title: { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 16, color: '#f0f0f0' },
  scroller: {
    display: 'flex', gap: 12, overflowX: 'auto', padding: '2px 16px 10px',
    scrollSnapType: 'x proximity', WebkitOverflowScrolling: 'touch',
  },
  card: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
    minWidth: 108, padding: '16px 12px',
    background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: 16,
    textDecoration: 'none', color: 'inherit', scrollSnapAlign: 'start',
    transition: 'border-color 0.2s, transform 0.2s',
  },
  avatar: {
    width: 52, height: 52, borderRadius: '50%', objectFit: 'cover',
    border: '2px solid rgba(0,229,255,0.3)',
  },
  nameRow: { display: 'flex', alignItems: 'center', gap: 3, maxWidth: 100 },
  name: {
    fontSize: 12.5, fontWeight: 700, color: '#f0f0f0',
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 90,
  },
  followers: { fontSize: 10.5, color: '#666' },
};
