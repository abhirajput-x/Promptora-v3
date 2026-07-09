import { useState, useEffect } from 'react';
import { UserPlus, UserCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useAuthModal } from '../context/AuthModalContext';
import toast from 'react-hot-toast';

export default function FollowButton({ targetId, onChange }) {
  const { user } = useAuth();
  const { requireAuth } = useAuthModal();
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    async function check() {
      if (!user || !targetId || user.id === targetId) { setLoading(false); return; }
      const { data } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', targetId)
        .maybeSingle();
      if (active) { setFollowing(!!data); setLoading(false); }
    }
    check();
    return () => { active = false; };
  }, [user, targetId]);

  // Users cannot follow themselves — hide the button entirely.
  if (user && user.id === targetId) return null;

  const handleClick = async () => {
    if (!user) { requireAuth('Please sign in to follow creators.'); return; }
    if (busy) return;

    const next = !following;
    setBusy(true);
    setFollowing(next);
    onChange?.(next ? 1 : -1);

    try {
      if (next) {
        const { error } = await supabase.from('follows').insert({
          follower_id: user.id,
          following_id: targetId,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.from('follows').delete()
          .match({ follower_id: user.id, following_id: targetId });
        if (error) throw error;
      }
    } catch (err) {
      setFollowing(!next);
      onChange?.(next ? -1 : 1);
      toast.error('Something went wrong');
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div style={{ width: 104, height: 36 }} />;

  return (
    <button onClick={handleClick} disabled={busy} style={following ? styles.followingBtn : styles.followBtn}>
      {following ? <UserCheck size={14} /> : <UserPlus size={14} />}
      {following ? 'Following' : 'Follow'}
    </button>
  );
}

const styles = {
  followBtn: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '9px 22px', borderRadius: 50,
    background: '#00E5FF', color: '#000', fontWeight: 700, fontSize: 13,
    border: 'none', cursor: 'pointer', transition: 'all 0.2s',
    boxShadow: '0 0 14px rgba(0,229,255,0.3)',
  },
  followingBtn: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '9px 22px', borderRadius: 50,
    background: '#111', color: '#f0f0f0', fontWeight: 600, fontSize: 13,
    border: '1px solid #222', cursor: 'pointer', transition: 'all 0.2s',
  },
};
