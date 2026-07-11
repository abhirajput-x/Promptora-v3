import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Star, TrendingUp, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import VerifiedBadge from '../components/VerifiedBadge';
import CreatorLevelBadge from '../components/CreatorLevelBadge';

const TABS = [
  { id: 'trending', label: 'Trending', icon: TrendingUp },
  { id: 'new', label: 'New', icon: Clock },
];

export default function Creators() {
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('trending');

  useEffect(() => { fetchCreators(); }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchCreators = async () => {
    setLoading(true);
    let q = supabase.from('creator_stats').select('*');
    q = tab === 'trending'
      ? q.order('trending_score', { ascending: false })
      : q.order('created_at', { ascending: false });
    const { data } = await q.limit(30);
    setCreators(data || []);
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', paddingBottom: 80 }}>
      <div style={styles.header}>
        <h1 style={styles.title}>Top Creators</h1>
        <p style={{ color: '#888', fontSize: 14, padding: '0 16px' }}>
          Discover the best AI prompt creators
        </p>
      </div>

      <div style={styles.tabs}>
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            style={{ ...styles.tabBtn, ...(tab === id ? styles.tabBtnActive : {}) }}
          >
            <Icon size={13} />
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <div className="spinner" />
        </div>
      ) : creators.length === 0 ? (
        <div className="empty-state">
          <Users size={36} color="#333" style={{ margin: '0 auto 12px' }} />
          <h3>No creators yet</h3>
          <p>Be the first to share your prompts</p>
        </div>
      ) : (
        <div style={styles.grid}>
          {creators.map((c, i) => (
            <Link key={c.id} to={`/creator/${c.id}`} style={{ ...styles.card, textDecoration: 'none', color: 'inherit' }}>
              <div style={styles.rank}>#{i + 1}</div>
              <img
                src={c.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${c.username}`}
                alt={c.username}
                style={styles.avatar}
              />
              <div style={styles.info}>
                <div style={styles.nameRow}>
                  <span style={styles.name}>{c.username}</span>
                  {c.is_verified && <VerifiedBadge size={13} />}
                  <CreatorLevelBadge level={c.creator_level} />
                </div>
                <div style={styles.meta}>
                  <Star size={12} color="#00E5FF" fill="#00E5FF" />
                  {c.prompt_count} prompts · {c.followers_count} followers
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  header: { padding: '24px 0 16px', borderBottom: '1px solid #111', marginBottom: 16 },
  title: {
    fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800,
    fontSize: 24, padding: '0 16px', marginBottom: 4,
  },
  tabs: { display: 'flex', gap: 8, padding: '0 16px', marginBottom: 16 },
  tabBtn: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '7px 16px', borderRadius: 50,
    background: '#111', border: '1px solid #1e1e1e', color: '#888',
    fontSize: 12.5, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
  },
  tabBtnActive: {
    background: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.3)', color: '#00E5FF',
  },
  grid: { padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 },
  card: {
    display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
    background: '#0d0d0d', border: '1px solid #1e1e1e', borderRadius: 14,
    transition: 'all 0.2s',
  },
  rank: { color: '#444', fontSize: 14, fontWeight: 700, width: 24, flexShrink: 0 },
  avatar: { width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 },
  info: { flex: 1, minWidth: 0 },
  nameRow: { display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' },
  name: { fontWeight: 600, fontSize: 15 },
  meta: { display: 'flex', alignItems: 'center', gap: 5, color: '#888', fontSize: 12 },
};
