import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Grid } from 'lucide-react';
import { supabase, attachUserInteractions } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import PromptCard from '../components/PromptCard';
import PromptDetail from '../components/PromptDetail';
import FollowButton from '../components/FollowButton';

export default function CreatorProfile() {
  const { id } = useParams();
  const { user } = useAuth();

  const [profile, setProfile] = useState(null);
  const [prompts, setPrompts] = useState([]);
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);

    const { data: prof } = await supabase.from('users').select('*').eq('id', id).single();
    setProfile(prof);

    const { data: pr } = await supabase
      .from('prompts')
      .select('*, creator:users(username, avatar_url)')
      .eq('user_id', id)
      .eq('status', 'approved')
      .order('created_at', { ascending: false });
    setPrompts(await attachUserInteractions(pr || [], user?.id));

    const [{ count: fCount }, { count: gCount }] = await Promise.all([
      supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', id),
      supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', id),
    ]);
    setFollowers(fCount || 0);
    setFollowing(gCount || 0);
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

  if (!profile) {
    return (
      <div className="empty-state" style={{ paddingTop: 80 }}>
        <h3>Creator not found</h3>
        <Link to="/creators" className="btn btn-outline" style={{ marginTop: 16 }}>Back to Creators</Link>
      </div>
    );
  }

  const avatarUrl = profile.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${profile.username}`;

  return (
    <div style={{ minHeight: '100vh', paddingBottom: 100 }}>
      <div style={styles.topBar}>
        <Link to="/creators" style={styles.backBtn} aria-label="Back">
          <ArrowLeft size={18} color="#f0f0f0" />
        </Link>
        <span style={styles.username}>@{profile.username}</span>
        <div style={{ width: 32 }} />
      </div>

      <div style={styles.header}>
        <div style={styles.avatarRing}>
          <img src={avatarUrl} alt={profile.username} style={styles.avatar} />
        </div>
        <div style={styles.stats}>
          <div style={styles.stat}>
            <span style={styles.statNum}>{prompts.length}</span>
            <span style={styles.statLabel}>Posts</span>
          </div>
          <div style={styles.stat}>
            <span style={styles.statNum}>{followers}</span>
            <span style={styles.statLabel}>Followers</span>
          </div>
          <div style={styles.stat}>
            <span style={styles.statNum}>{following}</span>
            <span style={styles.statLabel}>Following</span>
          </div>
        </div>
      </div>

      <div style={styles.bio}>
        <div style={styles.fullName}>{profile.full_name || profile.username}</div>
        {profile.bio && <div style={styles.bioText}>{profile.bio}</div>}
        <FollowButton targetId={profile.id} onChange={d => setFollowers(f => Math.max(f + d, 0))} />
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
  fullName: { fontWeight: 700, fontSize: 15, color: '#f0f0f0', marginBottom: 4 },
  bioText: { fontSize: 13, color: '#888', lineHeight: 1.5, marginBottom: 14 },
  sectionHeader: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '0 16px 12px', fontSize: 13, fontWeight: 700, color: '#f0f0f0',
    borderTop: '1px solid #111', paddingTop: 16,
  },
};
