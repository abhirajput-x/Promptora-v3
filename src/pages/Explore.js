import { useState, useEffect } from 'react';
import { supabase, attachUserInteractions } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import PromptCard from '../components/PromptCard';
import PromptDetail from '../components/PromptDetail';
import SearchBar from '../components/SearchBar';
import TrendingCreators from '../components/TrendingCreators';
import { Filter } from 'lucide-react';
const MODELS = ['All', 'Midjourney', 'DALL·E', 'Flux', 'ChatGPT', 'Stable Diffusion'];
const SORT = ['Most Liked', 'Most Copied', 'Newest', 'Most Saved'];

export default function Explore() {
  const { user } = useAuth();
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [model, setModel] = useState('All');
  const [sort, setSort] = useState('Most Liked');
  const [selected, setSelected] = useState(null);
  const [searchResults, setSearchResults] = useState(null);

  useEffect(() => { fetchPrompts(); }, [model, sort, user]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchPrompts = async () => {
    setLoading(true);
    let q = supabase.from('prompts').select('*, creator:users(username, avatar_url, is_verified, creator_level)').eq('status', 'approved');
    if (model !== 'All') q = q.eq('model', model);
    if (sort === 'Most Liked') q = q.order('likes_count', { ascending: false });
    else if (sort === 'Newest') q = q.order('created_at', { ascending: false });
    else if (sort === 'Most Copied') q = q.order('copies_count', { ascending: false });
    const { data } = await q.limit(40);
    setPrompts(await attachUserInteractions(data || [], user?.id));
    setLoading(false);
  };

  const display = searchResults !== null ? searchResults : prompts;

  return (
    <div style={{ minHeight: '100vh', paddingBottom: 80 }}>
      <div style={styles.header}>
        <h1 style={styles.title}>Explore Prompts</h1>
        <SearchBar onResults={setSearchResults} placeholder="Search all prompts..." />

        <div style={styles.pills}>
          {MODELS.map(m => (
            <button key={m} className={`tag ${model === m ? 'active' : ''}`} onClick={() => setModel(m)}>{m}</button>
          ))}
        </div>

        <div style={styles.sortRow}>
          <Filter size={14} color="#888" />
          <span style={{ color: '#888', fontSize: 13 }}>Sort:</span>
          {SORT.map(s => (
            <button key={s} className={`tag ${sort === s ? 'active' : ''}`} onClick={() => setSort(s)}
              style={{ fontSize: 12 }}>{s}</button>
          ))}
        </div>
      </div>

      {searchResults === null && <TrendingCreators />}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <div className="spinner" />
        </div>
      ) : (
        <div className="prompt-grid">
          {display.map(p => (
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
  header: { padding: '20px 0 8px', borderBottom: '1px solid #111', marginBottom: 20 },
  title: {
    fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800,
    fontSize: 24, padding: '0 16px', marginBottom: 16,
  },
  pills: {
    display: 'flex', gap: 8, overflowX: 'auto', padding: '0 16px 12px',
    scrollbarWidth: 'none',
  },
  sortRow: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '4px 16px', overflowX: 'auto', scrollbarWidth: 'none',
  },
};
