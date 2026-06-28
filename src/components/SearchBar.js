import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function SearchBar({ onResults, placeholder = 'Search prompts...' }) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const debounce = useRef(null);

  useEffect(() => {
    if (!query.trim()) { onResults && onResults(null); return; }

    clearTimeout(debounce.current);
    debounce.current = setTimeout(async () => {
      setLoading(true);
      const { data } = await supabase
        .from('prompts')
        .select('*, likes_count:likes(count), saves_count:saves(count)')
        .ilike('title', `%${query}%`)
        .eq('status', 'approved')
        .limit(20);
      onResults && onResults(data || []);
      setLoading(false);
    }, 400);

    return () => clearTimeout(debounce.current);
  }, [query]);

  return (
    <div style={styles.wrapper}>
      <div style={styles.bar}>
        {loading
          ? <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2, flexShrink: 0 }} />
          : <Search size={16} color="#888" style={{ flexShrink: 0 }} />
        }
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={placeholder}
          style={styles.input}
        />
        {query && (
          <button onClick={() => { setQuery(''); onResults && onResults(null); }} style={styles.clear}>
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

const styles = {
  wrapper: { padding: '0 16px', marginBottom: 16 },
  bar: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '10px 14px',
    background: '#111', border: '1px solid #1e1e1e', borderRadius: 50,
    transition: 'border-color 0.2s',
  },
  input: {
    flex: 1, background: 'none', border: 'none', outline: 'none',
    color: '#f0f0f0', fontSize: 14,
  },
  clear: { color: '#888', padding: 2, borderRadius: 4 },
};

