import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

export default function NotificationBell({ style }) {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!user) { setCount(0); return; }
    let active = true;

    const fetchCount = async () => {
      const { count: c } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
      if (active) setCount(c || 0);
    };
    fetchCount();

    const channel = supabase
      .channel(`notifications-bell-${user.id}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        fetchCount
      )
      .subscribe();

    return () => { active = false; supabase.removeChannel(channel); };
  }, [user]);

  if (!user) return null;

  return (
    <Link to="/notifications" style={{ ...styles.bellBtn, ...style }} aria-label="Notifications">
      <Bell size={18} color="#f0f0f0" />
      {count > 0 && <span style={styles.badge}>{count > 9 ? '9+' : count}</span>}
    </Link>
  );
}

const styles = {
  bellBtn: {
    position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: 36, height: 36, borderRadius: '50%',
    background: '#111', border: '1px solid #1e1e1e', flexShrink: 0,
  },
  badge: {
    position: 'absolute', top: -3, right: -3,
    minWidth: 16, height: 16, borderRadius: 8, padding: '0 3px',
    background: '#ff4d6d', color: '#fff', fontSize: 10, fontWeight: 700,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    border: '1.5px solid #050505',
  },
};
