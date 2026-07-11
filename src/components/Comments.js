import { useState, useEffect, useCallback } from 'react';
import { Send, Trash2, Edit2, Check, X as XIcon, MessageCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useAuthModal } from '../context/AuthModalContext';
import VerifiedBadge from './VerifiedBadge';
import toast from 'react-hot-toast';

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
  return new Date(dateStr).toLocaleDateString();
}

export default function Comments({ promptId, onCountChange }) {
  const { user } = useAuth();
  const { requireAuth } = useAuthModal();

  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [posting, setPosting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const fetchComments = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('comments')
      .select('*, author:users(username, avatar_url, is_verified)')
      .eq('prompt_id', promptId)
      .order('created_at', { ascending: true });
    setComments(data || []);
    onCountChange?.(data?.length || 0);
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [promptId]);

  useEffect(() => { fetchComments(); }, [fetchComments]);

  const guardGuest = () => {
    if (!user) { requireAuth('Please sign in to comment.'); return true; }
    return false;
  };

  const handlePost = async () => {
    if (guardGuest()) return;
    const content = text.trim();
    if (!content) return;
    setPosting(true);
    const { data, error } = await supabase
      .from('comments')
      .insert({ user_id: user.id, prompt_id: promptId, content })
      .select('*, author:users(username, avatar_url, is_verified)')
      .single();
    setPosting(false);
    if (error) return toast.error('Failed to post comment');
    setComments(c => {
      const next = [...c, data];
      onCountChange?.(next.length);
      return next;
    });
    setText('');
  };

  const startEdit = (c) => { setEditingId(c.id); setEditText(c.content); };
  const cancelEdit = () => { setEditingId(null); setEditText(''); };

  const saveEdit = async (id) => {
    const content = editText.trim();
    if (!content) return;
    const { error } = await supabase.from('comments').update({ content }).eq('id', id);
    if (error) return toast.error('Failed to update comment');
    setComments(cs => cs.map(c => (c.id === id ? { ...c, content } : c)));
    cancelEdit();
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    const { error } = await supabase.from('comments').delete().eq('id', id);
    setDeletingId(null);
    if (error) return toast.error('Failed to delete comment');
    setComments(cs => {
      const next = cs.filter(c => c.id !== id);
      onCountChange?.(next.length);
      return next;
    });
  };

  return (
    <div style={styles.wrap}>
      <div style={styles.header}>
        <MessageCircle size={15} color="#00E5FF" />
        <span style={styles.headerText}>Comments ({comments.length})</span>
      </div>

      {/* Input */}
      <div style={styles.inputRow}>
        <img
          src={user?.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.email || 'guest'}`}
          alt="" style={styles.inputAvatar}
        />
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onFocus={guardGuest}
          placeholder={user ? 'Add a comment...' : 'Sign in to comment...'}
          style={styles.input}
          onKeyDown={e => e.key === 'Enter' && handlePost()}
        />
        <button
          onClick={handlePost}
          disabled={posting || !text.trim()}
          style={{ ...styles.postBtn, opacity: posting || !text.trim() ? 0.35 : 1 }}
          aria-label="Post comment"
        >
          <Send size={15} color="#00E5FF" />
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 20 }}>
          <div className="spinner" />
        </div>
      ) : comments.length === 0 ? (
        <p style={styles.empty}>No comments yet. Be the first!</p>
      ) : (
        <div style={styles.list}>
          {comments.map(c => (
            <div key={c.id} style={styles.commentRow}>
              <img
                src={c.author?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${c.author?.username || 'user'}`}
                alt="" style={styles.avatar}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={styles.commentMeta}>
                  <span style={styles.username}>{c.author?.username || 'user'}</span>
                  {c.author?.is_verified && <VerifiedBadge size={11} />}
                  <span style={styles.time}>{timeAgo(c.created_at)}</span>
                </div>
                {editingId === c.id ? (
                  <div style={styles.editRow}>
                    <input
                      value={editText}
                      onChange={e => setEditText(e.target.value)}
                      style={styles.editInput}
                      onKeyDown={e => e.key === 'Enter' && saveEdit(c.id)}
                      autoFocus
                    />
                    <button onClick={() => saveEdit(c.id)} style={styles.iconBtnSm} aria-label="Save">
                      <Check size={13} color="#00E5FF" />
                    </button>
                    <button onClick={cancelEdit} style={styles.iconBtnSm} aria-label="Cancel">
                      <XIcon size={13} color="#888" />
                    </button>
                  </div>
                ) : (
                  <p style={styles.commentText}>{c.content}</p>
                )}
              </div>
              {user?.id === c.user_id && editingId !== c.id && (
                <div style={styles.commentActions}>
                  <button onClick={() => startEdit(c)} style={styles.iconBtnSm} aria-label="Edit">
                    <Edit2 size={12} color="#666" />
                  </button>
                  <button
                    onClick={() => handleDelete(c.id)}
                    style={styles.iconBtnSm}
                    aria-label="Delete"
                    disabled={deletingId === c.id}
                  >
                    <Trash2 size={12} color="#666" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  wrap: { marginTop: 4 },
  header: { display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 },
  headerText: { fontSize: 13, fontWeight: 700, color: '#f0f0f0' },
  inputRow: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 },
  inputAvatar: { width: 30, height: 30, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 },
  input: {
    flex: 1, padding: '9px 14px', borderRadius: 50,
    background: '#0a0a0a', border: '1px solid #1e1e1e',
    color: '#f0f0f0', fontSize: 13, outline: 'none',
  },
  postBtn: {
    width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
    background: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.25)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', transition: 'opacity 0.15s',
  },
  empty: { fontSize: 13, color: '#555', textAlign: 'center', padding: '16px 0' },
  list: { display: 'flex', flexDirection: 'column', gap: 14, maxHeight: 320, overflowY: 'auto' },
  commentRow: { display: 'flex', gap: 10, alignItems: 'flex-start' },
  avatar: { width: 30, height: 30, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 },
  commentMeta: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 },
  username: { fontSize: 12.5, fontWeight: 700, color: '#f0f0f0' },
  time: { fontSize: 11, color: '#555' },
  commentText: { fontSize: 13, color: '#ccc', lineHeight: 1.5, wordBreak: 'break-word' },
  editRow: { display: 'flex', alignItems: 'center', gap: 6 },
  editInput: {
    flex: 1, padding: '6px 12px', borderRadius: 50,
    background: '#0a0a0a', border: '1px solid #1e1e1e',
    color: '#f0f0f0', fontSize: 13, outline: 'none',
  },
  commentActions: { display: 'flex', gap: 2, flexShrink: 0 },
  iconBtnSm: {
    padding: 5, borderRadius: 6, background: 'none', border: 'none',
    cursor: 'pointer', display: 'flex',
  },
};
