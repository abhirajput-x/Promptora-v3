import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Zap, Upload, TrendingUp, Sparkles, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import PromptCard from '../components/PromptCard';
import PromptDetail from '../components/PromptDetail';
import SearchBar from '../components/SearchBar';

const CATEGORIES = ['All', 'Midjourney', 'DALL·E', 'Flux', 'ChatGPT', 'Stable Diffusion', 'Sora'];
const TABS = [
  { key: 'trending', label: 'Trending', icon: TrendingUp },
  { key: 'featured', label: 'Featured', icon: Sparkles },
  { key: 'new', label: 'New', icon: Zap },
];

export default function Home() {
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('trending');
  const [category, setCategory] = useState('All');
  const [selected, setSelected] = useState(null);
  const [searchResults, setSearchResults] = useState(null);

  useEffect(() => {
    fetchPrompts();
  }, [tab, category]);

  const fetchPrompts = async () => {
    setLoading(true);
    let query = supabase
      .from('prompts')
      .select('*, creator:users(username, avatar_url)')
      .eq('status', 'approved');

    if (category !== 'All') query = query.eq('model', category);

    if (tab === 'trending') query = query.order('likes_count', { ascending: false });
    else if (tab === 'new') query = query.order('created_at', { ascending: false });
    else if (tab === 'featured') query = query.eq('featured', true).order('created_at', { ascending: false });

    const { data } = await query.limit(30);
    setPrompts(data || []);
    setLoading(false);
  };

  const displayPrompts = searchResults !== null ? searchResults : prompts;

  return (
    <div style={{ minHeight: '100vh', paddingBottom: 80 }}>
      {/* Hero */}
      <div style={styles.hero}>
        <div style={styles.heroBadge}>
          <Zap size={13} color="#00E5FF" fill="#00E5FF" />
          AI-Powered Prompt Platform
        </div>
        <h1 style={styles.heroTitle}>
          Discover the <span style={{ color: '#00E5FF' }}>perfect</span> AI prompt
        </h1>
        <p style={styles.heroSub}>
          Thousands of curated prompts for Midjourney, ChatGPT, Flux & more
        </p>
        <div style={styles.heroCtas}>
          <Link to="/upload" className="btn btn-primary">
            <Upload size={16} />
            Publish a Prompt
          </Link>
          <Link to="/explore" className="btn btn-outline">
            Explore All <ArrowRight size={15} />
          </Link>
        </div>
      </div>

      {/* Search */}
      <SearchBar onResults={setSearchResults} placeholder="Search 1000+ prompts..." />

      {searchResults === null && (
        <>
          {/* Category pills */}
          <div style={styles.pills}>
            {CATEGORIES.map(c => (
              <button key={c} className={`tag ${category === c ? 'active' : ''}`}
                onClick={() => setCategory(c)}>
                {c}
              </button>
            ))}
          </div>

          {/* Tabs */}
          <div style={styles.tabs}>
            {TABS.map(({ key, label, icon: Icon }) => (
              <button key={key} style={{
                ...styles.tab,
                color: tab === key ? '#00E5FF' : '#888',
                borderBottom: tab === key ? '2px solid #00E5FF' : '2px solid transparent',
              }} onClick={() => setTab(key)}>
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Grid */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <div className="spinner" />
        </div>
      ) : displayPrompts.length === 0 ? (
        <div className="empty-state">
          <h3>No prompts found</h3>
          <p>Try a different filter or search term</p>
        </div>
      ) : (
        <div className="prompt-grid">
          {displayPrompts.map(p => (
            <div key={p.id} className="prompt-grid-item">
              <PromptCard prompt={p} onClick={setSelected} />
            </div>
          ))}
        </div>
      )}

      {/* Detail modal */}
      {selected && <PromptDetail prompt={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

const styles = {
  hero: {
    padding: '40px 20px 32px',
    textAlign: 'center',
    background: 'radial-gradient(ellipse at 50% 0%, rgba(0,229,255,0.06) 0%, transparent 70%)',
    borderBottom: '1px solid #111',
    marginBottom: 20,
  },
  heroBadge: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '4px 14px', borderRadius: 50, marginBottom: 16,
    background: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.2)',
    color: '#00E5FF', fontSize: 12, fontWeight: 600,
  },
  heroTitle: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: 'clamp(26px, 7vw, 44px)',
    fontWeight: 800, lineHeight: 1.15, marginBottom: 12, color: '#f0f0f0',
  },
  heroSub: { fontSize: 15, color: '#888', marginBottom: 24, maxWidth: 440, margin: '0 auto 24px' },
  heroCtas: { display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' },
  pills: {
    display: 'flex', gap: 8, overflowX: 'auto', padding: '0 16px 12px',
    scrollbarWidth: 'none',
  },
  tabs: {
    display: 'flex', borderBottom: '1px solid #1e1e1e',
    padding: '0 16px', marginBottom: 20,
  },
  tab: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '10px 16px', fontSize: 14, fontWeight: 600,
    background: 'none', cursor: 'pointer', transition: 'all 0.2s',
  },
};
