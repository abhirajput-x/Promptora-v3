import { useState, useEffect } from 'react';
import { Bookmark } from 'lucide-react';
import { supabase, attachUserInteractions } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import PromptCard from '../components/PromptCard';
import PromptDetail from '../components/PromptDetail';
import { Link } from 'react-router-dom';

export default function Library() {
  const { user } = useAuth();
  const [saved, setSaved] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (user) fetchSaved();
    else setLoading(false);
  }, [user]);

  const fetchSaved = async () => {
    const { data } = await supabase
      .from('saves')
      .select('prompt:prompts(*, creator:users(username, avatar_url, is_verified, creator_level))')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    const promptsList = data?.map(s => s.prompt).filter(Boolean) || [];
    const withInteractions = await attachUserInteractions(promptsList, user.id);
    setSaved(withInteractions.map(p => ({ ...p, user_saved: true })));
    setLoading(false);
  };

  if (!user) return (
    <div className="empty-state" style={{ paddingTop: 80 }}>
      <Bookmark size={40} color="#333" style={{ margin: '0 auto 16px' }} />
      <h3>Your Library</h3>
      <p style={{ marginBottom: 20 }}>Sign in to save and access your prompt collection</p>
      <Link to="/login" className="btn btn-primary">Sign In</Link>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', paddingBottom: 80 }}>
      <div style={styles.header}>
        <h1 style={styles.title}>My Library</h1>
        <p style={{ color: '#888', fontSize: 14, padding: '0 16px' }}>{saved.length} saved prompts</p>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <div className="spinner" />
        </div>
      ) : saved.length === 0 ? (
        <div className="empty-state">
          <Bookmark size={36} color="#333" style={{ margin: '0 auto 12px' }} />
          <h3>No saved prompts yet</h3>
          <p style={{ marginBottom: 20 }}>Explore and save prompts you love</p>
          <Link to="/explore" className="btn btn-outline">Browse Prompts</Link>
        </div>
      ) : (
        <div className="prompt-grid">
          {saved.map(p => (
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
  header: { padding: '24px 0 16px', borderBottom: '1px solid #111', marginBottom: 20 },
  title: {
    fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800,
    fontSize: 24, padding: '0 16px', marginBottom: 4,
  },
};
