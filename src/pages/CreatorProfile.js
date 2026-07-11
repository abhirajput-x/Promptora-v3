import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Grid, Heart, Eye, Copy, Calendar } from 'lucide-react';
import { supabase, attachUserInteractions } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import PromptCard from '../components/PromptCard';
import PromptDetail from '../components/PromptDetail';
import FollowButton from '../components/FollowButton';
import VerifiedBadge from '../components/VerifiedBadge';
import CreatorLevelBadge from '../components/CreatorLevelBadge';

function formatJoinDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export default function CreatorProfile() {
  const { id } = useParams();
  const { user } = useAuth();

  const [stats, setStats] = useState(null);
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);

    const { data: s } = await supabase.from('creator_stats').select('*').eq('id', id).single();
    setStats(s);

    const { data: pr } = await supabase
      .from('prompts')
      .select('*, creator:users(username, avatar_url, is_verified, creator_level)')
      .eq('user_id', id)
      .eq('status', 'approved')
      .order('created_at', { ascending: false });
    setPrompts(await attachUserInteractions(pr || [], user?.id));

    setLoading(false);
  }, [id, user]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="empty-state" style={{ paddingTop: 80 }}>
        <h3>Creator not found</h3>
        <Link to="/creators" className="btn btn-outline" style={{ marginTop: 16 }}>Back to Creators</Link>
      </div>
    );
  }

  const avatarUrl = stats.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${stats.username}`;

  return (
    <div style={{ minHeight: '100vh', paddingBottom: 100 }}>
      <div style={styles.topBar}>
        <Link to="/creators" style={styles.backBtn} aria-label="Back">
          <ArrowLeft size={18} color="#f0f0f0" />
        </Link>
        <span style={styles.username}>@{stats.username}</span>
        <div style={{ width: 32 }} />
      </div>

      <div style={styles.header}>
        <div style={styles.avatarRing}>
          <img src={avatarUrl} alt={stats.username} style={styles.avatar} />
        </div>
        <div style={styles.stats}>
          <div style={styles.stat}>
            <span style={styles.statNum}>{stats.prompt_count}</span>
            <span style={styles.statLabel}>Posts</span>
          </div>
          <div style={styles.stat}>
            <span style={styles.statNum}>{stats.followers_count}</span>
            <span style={styles.statLabel}>Followers</span>
          </div>
          <div style={styles.stat}>
            <span style={styles.statNum}>{stats.following_count}</span>
            <span style={styles.statLabel}>Following</span>
          </div>
        </div>
      </div>

      <div style={styles.bio}>
        <div style={styles.nameRow}>
          <span style={styles.fullName}>{stats.full_name || stats.username}</span>
          {stats.is_verified && <VerifiedBadge size={16} />}
          <CreatorLevelBadge level={stats.creator_level} showLabel />
        </div>
        {stats.bio && <div style={styles.bioText}>{stats.bio}</div>}
        <div style={styles.joinRow}>
          <Calendar size={12} />
          Joined {formatJoinDate(stats.created_at)}
        </div>
        <FollowButton
          targetId={stats.id}
          onChange={d => setStats(s => ({ ...s, followers_count: Math.max((s.followers_count || 0) + d, 0) }))}
        />
      </div>

      {/* Analytics */}
      <div style={styles.analyticsGrid}>
        <div style={styles.analyticsCard}>
          <Heart size={16} color="#ff4d6d" />
          <span style={styles.analyticsNum}>{stats.total_likes}</span>
          <span style={styles.analyticsLabel}>Total Likes</span>
        </div>
        <div style={styles.analyticsCard}>
          <Eye size={16} color="#00E5FF" />
          <span style={styles.analyticsNum}>{stats.total_views}</span>
          <span style={styles.analyticsLabel}>Total Views</span>
        </div>
        <div style={styles.analyticsCard}>
          <Copy size={16} color="#00E5FF" />
          <span style={styles.analyticsNum}>{stats.total_copies}</span>
          <span style={styles.analyticsLabel}>Total Copies</span>
        </div>
      </div>

      <div style={styles.sectionHeader}>
        <Grid size={14} color="#00E5FF" />
        <span>Prompts</span>
      </div>

      {prompts.length === 0 ? (
        <div className="empty-state">
          <h3>No prompts yet</h3>
        </div>
      ) : (
        <div className="prompt-grid">
          {prompts.map(p => (
            <div key={p.id} className="prompt-grid-item">
              <PromptCard prompt={p} onClick={setSelected} />
            </div>
          ))}
        </div>
      )}

      {selected && <PromptDetail prompt={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

const styles = {
  topBar: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '14px 16px', borderBottom: '1px solid #111',
  },
  backBtn: {
    width: 32, height: 32, borderRadius: 8, background: '#111', border: '1px solid #1e1e1e',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  username: { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 16, color: '#f0f0f0' },
  header: { display: 'flex', alignItems: 'center', gap: 24, padding: '24px 16px 12px' },
  avatarRing: {
    width: 86, height: 86, borderRadius: '50%', padding: 3, flexShrink: 0,
    background: 'linear-gradient(135deg, #00E5FF, #0077ff)',
    boxShadow: '0 0 16px rgba(0,229,255,0.4)',
  },
  avatar: { width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', border: '2px solid #050505' },
  stats: { display: 'flex', gap: 20, flex: 1, justifyContent: 'space-around' },
  stat: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 },
  statNum: { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 18, color: '#f0f0f0' },
  statLabel: { fontSize: 12, color: '#888' },
  bio: { padding: '0 16px 20px' },
  nameRow: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 },
  fullName: { fontWeight: 700, fontSize: 15, color: '#f0f0f0' },
  bioText: { fontSize: 13, color: '#888', lineHeight: 1.5, marginBottom: 8 },
  joinRow: {
    display: 'flex', alignItems: 'center', gap: 5,
    fontSize: 11.5, color: '#555', marginBottom: 14,
  },
  analyticsGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10,
    padding: '0 16px 20px',
  },
  analyticsCard: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
    padding: '14px 8px', borderRadius: 14,
    background: '#0d0d0d', border: '1px solid #1a1a1a',
  },
  analyticsNum: { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 16, color: '#f0f0f0' },
  analyticsLabel: { fontSize: 10.5, color: '#777', textAlign: 'center' },
  sectionHeader: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '0 16px 12px', fontSize: 13, fontWeight: 700, color: '#f0f0f0',
    borderTop: '1px solid #111', paddingTop: 16,
  },
};
