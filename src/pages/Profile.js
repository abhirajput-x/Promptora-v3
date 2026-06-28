import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Heart, Bookmark } from 'lucide-react';
import { supabase, signOut } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import PromptCard from '../components/PromptCard';
import PromptDetail from '../components/PromptDetail';
import toast from 'react-hot-toast';

const TABS = ['Saved', 'Liked'];

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('Saved');
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    fetchProfile();
  }, [user]);

  useEffect(() => {
    if (user) fetchPrompts();
  }, [tab, user]);

  const fetchProfile = async () => {
    const { data } = await supabase.from('users').select('*').eq('id', user.id).single();
    setProfile(data);
  };

  const fetchPrompts = async () => {
    setLoading(true);
    const table = tab === 'Saved' ? 'saves' : 'likes';
    const { data } = await supabase
      .from(table)
      .select('prompt:prompts(*, creator:users(username, avatar_url))')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setPrompts(data?.map(d => d.prompt).filter(Boolean) || []);
    setLoading(false);
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out');
    navigate('/');
  };

  if (!user) return null;

  const avatar = user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${user.email}`;

  return (
    <div style={{ minHeight: '100vh', paddingBottom: 80 }}>
      {/* Profile header */}
      <div style={styles.header}>
        <img src={avatar} alt="avatar" style={styles.avatar} />
        <div style={styles.info}>
          <h1 style={styles.name}>{profile?.username || user.email?.split('@')[0]}</h1>
          <p style={styles.email}>{user.email}</p>
        </div>
        <button style={styles.logoutBtn} onClick={handleSignOut}>
          <LogOut size={16} />
        </button>
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        {TABS.map(t => (
          <button key={t} style={{
            ...styles.tab,
            color: tab === t ? '#00E5FF' : '#888',
            borderBottom: tab === t ? '2px solid #00E5FF' : '2px solid transparent',
          }} onClick={() => setTab(t)}>
            {t === 'Saved' ? <Bookmark size={14} /> : <Heart size={14} />}
            {t}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <div className="spinner" />
        </div>
      ) : prompts.length === 0 ? (
        <div className="empty-state">
          <h3>Nothing here yet</h3>
          <p style={{ marginBottom: 20 }}>
            {tab === 'Saved' ? 'Save prompts to access them here' : 'Like prompts to see them here'}
          </p>
          <Link to="/explore" className="btn btn-outline">Explore Prompts</Link>
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
  header: {
    display: 'flex', alignItems: 'center', gap: 14, padding: '20px 16px',
    borderBottom: '1px solid #111',
  },
  avatar: { width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(0,229,255,0.3)' },
  info: { flex: 1 },
  name: { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 18 },
  email: { color: '#888', fontSize: 13, marginTop: 2 },
  logoutBtn: {
    padding: 10, borderRadius: 10, background: '#111', border: '1px solid #1e1e1e',
    color: '#888', cursor: 'pointer',
  },
  tabs: {
    display: 'flex', borderBottom: '1px solid #1e1e1e',
    padding: '0 16px', marginBottom: 20,
  },
  tab: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '12px 20px', fontSize: 14, fontWeight: 600,
    background: 'none', cursor: 'pointer', transition: 'all 0.2s',
  },
};
