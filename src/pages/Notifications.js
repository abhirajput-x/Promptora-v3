import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, UserPlus, Bell } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import VerifiedBadge from '../components/VerifiedBadge';

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

const ICONS = {
  like: { Icon: Heart, color: '#ff4d6d', fill: true },
  comment: { Icon: MessageCircle, color: '#00E5FF', fill: false },
  follow: { Icon: UserPlus, color: '#00E5FF', fill: false },
};

export default function Notifications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('notifications')
      .select('*, actor:users!notifications_actor_id_fkey(username, avatar_url, is_verified), prompt:prompts(title)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    setItems(data || []);
    setLoading(false);

    const unreadIds = (data || []).filter(n => !n.is_read).map(n => n.id);
    if (unreadIds.length) {
      await supabase.from('notifications').update({ is_read: true }).in('id', unreadIds);
    }
  }, [user]);

  useEffect(() => {
    if (user === null) { navigate('/login'); return; }
    if (user) fetchNotifications();
  }, [user, fetchNotifications, navigate]);

  if (!user) return null;

  const messageFor = (n) => {
    if (n.type === 'like') return `liked your prompt${n.prompt?.title ? ` "${n.prompt.title}"` : ''}`;
    if (n.type === 'comment') return `commented on your prompt${n.prompt?.title ? ` "${n.prompt.title}"` : ''}`;
    if (n.type === 'follow') return 'started following you';
    return '';
  };

  return (
    <div style={{ minHeight: '100vh', paddingBottom: 80 }}>
      <div style={styles.header}>
        <h1 style={styles.title}>Notifications</h1>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <div className="spinner" />
        </div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <Bell size={36} color="#333" style={{ margin: '0 auto 12px' }} />
          <h3>No notifications yet</h3>
          <p>Likes, comments, and follows will show up here</p>
        </div>
      ) : (
        <div style={styles.list}>
          {items.map(n => {
            const cfg = ICONS[n.type] || ICONS.like;
            const { Icon, color, fill } = cfg;
            const row = (
              <div style={{ ...styles.row, background: n.is_read ? 'transparent' : 'rgba(0,229,255,0.05)' }}>
                <div style={styles.avatarWrap}>
                  <img
                    src={n.actor?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${n.actor?.username || 'user'}`}
                    alt="" style={styles.avatar}
                  />
                  <div style={{ ...styles.iconBadge, borderColor: color }}>
                    <Icon size={10} color={color} fill={fill ? color : 'none'} />
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={styles.text}>
                    <span style={styles.actorName}>{n.actor?.username || 'Someone'}</span>
                    {n.actor?.is_verified && <VerifiedBadge size={11} style={{ marginLeft: 3, marginRight: 3, verticalAlign: 'middle' }} />}
                    {' '}{messageFor(n)}
                  </p>
                  <span style={styles.time}>{timeAgo(n.created_at)}</span>
                </div>
              </div>
            );
            return n.type === 'follow' && n.actor_id ? (
              <Link key={n.id} to={`/creator/${n.actor_id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                {row}
              </Link>
            ) : (
              <div key={n.id}>{row}</div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const styles = {
  header: { padding: '24px 0 16px', borderBottom: '1px solid #111', marginBottom: 8 },
  title: {
    fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800,
    fontSize: 24, padding: '0 16px',
  },
  list: { display: 'flex', flexDirection: 'column' },
  row: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px' },
  avatarWrap: { position: 'relative', flexShrink: 0 },
  avatar: { width: 42, height: 42, borderRadius: '50%', objectFit: 'cover' },
  iconBadge: {
    position: 'absolute', bottom: -2, right: -2,
    width: 18, height: 18, borderRadius: '50%',
    background: '#0a0a0a', border: '1.5px solid',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  text: { fontSize: 13.5, color: '#ddd', lineHeight: 1.4 },
  actorName: { fontWeight: 700, color: '#f0f0f0' },
  time: { fontSize: 11.5, color: '#555' },
};
