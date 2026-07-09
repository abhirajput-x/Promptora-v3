import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Star } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Creators() {
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCreators();
  }, []);

  const fetchCreators = async () => {
    const { data } = await supabase
      .from('users')
      .select('*, prompt_count:prompts(count)')
      .eq('is_creator', true)
      .order('created_at', { ascending: false })
      .limit(20);
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
                <div style={styles.name}>{c.username}</div>
                <div style={styles.meta}>
                  <Star size={12} color="#00E5FF" fill="#00E5FF" />
                  {c.prompt_count?.[0]?.count || 0} prompts
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
  header: { padding: '24px 0 16px', borderBottom: '1px solid #111', marginBottom: 20 },
  title: {
    fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800,
    fontSize: 24, padding: '0 16px', marginBottom: 4,
  },
  grid: { padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 },
  card: {
    display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
    background: '#0d0d0d', border: '1px solid #1e1e1e', borderRadius: 14,
    transition: 'all 0.2s',
  },
  rank: { color: '#444', fontSize: 14, fontWeight: 700, width: 24 },
  avatar: { width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' },
  info: { flex: 1 },
  name: { fontWeight: 600, fontSize: 15, marginBottom: 3 },
  meta: { display: 'flex', alignItems: 'center', gap: 5, color: '#888', fontSize: 12 },
};
