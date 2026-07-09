import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Edit2, Share2, Grid, Heart, Check, Camera } from 'lucide-react';
import { supabase, signOut, attachUserInteractions } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import PromptCard from '../components/PromptCard';
import PromptDetail from '../components/PromptDetail';
import toast from 'react-hot-toast';

const TABS = [
  { key: 'posts', icon: Grid, label: 'Posts' },
  { key: 'liked', icon: Heart, label: 'Liked' },
];

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef();

  const [tab, setTab] = useState('posts');
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [profile, setProfile] = useState(null);
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editBio, setEditBio] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    fetchProfile();
  }, [user]);

  useEffect(() => {
    if (user) fetchPrompts();
  }, [tab, user]);

  const fetchProfile = async () => {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();
    if (data) {
      setProfile(data);
      setEditName(data.full_name || '');
      setEditUsername(data.username || '');
      setEditBio(data.bio || '');
    }
    // followers/following counts
    const { count: fCount } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', user.id);
    const { count: fgCount } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', user.id);
    setFollowers(fCount || 0);
    setFollowing(fgCount || 0);
  };

  const fetchPrompts = async () => {
    setLoading(true);
    if (tab === 'posts') {
      const { data } = await supabase
        .from('prompts')
        .select('*, creator:users(username, avatar_url)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setPrompts(await attachUserInteractions(data || [], user.id));
    } else {
      const { data } = await supabase
        .from('likes')
        .select('prompt:prompts(*, creator:users(username, avatar_url))')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      const promptsList = data?.map(d => d.prompt).filter(Boolean) || [];
      const withInteractions = await attachUserInteractions(promptsList, user.id);
      setPrompts(withInteractions.map(p => ({ ...p, user_liked: true })));
    }
    setLoading(false);
  };

  const handleAvatarUpload = async (file) => {
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `avatars/${user.id}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('prompt-images')
        .upload(fileName, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage
        .from('prompt-images')
        .getPublicUrl(fileName);
      await supabase.from('users').update({ avatar_url: urlData.publicUrl }).eq('id', user.id);
      setProfile(p => ({ ...p, avatar_url: urlData.publicUrl }));
      toast.success('Profile picture updated!');
    } catch (err) {
      toast.error('Failed: ' + err.message);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    const { error } = await supabase.from('users').update({
      full_name: editName,
      username: editUsername,
      bio: editBio,
    }).eq('id', user.id);
    setSaving(false);
    if (error) return toast.error('Save failed: ' + error.message);
    setProfile(p => ({ ...p, full_name: editName, username: editUsername, bio: editBio }));
    setEditMode(false);
    toast.success('Profile updated!');
  };

  const handleShare = async () => {
    try {
      await navigator.share({ title: profile?.username || 'My Profile', url: window.location.href });
    } catch {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Profile link copied!');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out!');
    navigate('/');
  };

  if (!user) return null;

  const avatarUrl = profile?.avatar_url ||
    user.user_metadata?.avatar_url ||
    `https://api.dicebear.com/7.x/initials/svg?seed=${user.email}`;

  return (
    <div style={{ minHeight: '100vh', paddingBottom: 100 }}>

      {/* Top bar */}
      <div style={styles.topBar}>
        <span style={styles.username}>@{profile?.username || user.email?.split('@')[0]}</span>
        <div style={{ display: 'flex', gap: 12 }}>
          <button style={styles.iconBtn} onClick={handleShare}><Share2 size={20} color="#f0f0f0" /></button>
          <button style={styles.iconBtn} onClick={handleSignOut}><LogOut size={20} color="#f0f0f0" /></button>
        </div>
      </div>

      {/* Profile header */}
      <div style={styles.header}>
        {/* Avatar */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div style={styles.avatarRing}>
            <img src={avatarUrl} alt="avatar" style={styles.avatar} />
          </div>
          <button
            style={styles.cameraBtn}
            onClick={() => fileRef.current?.click()}
            disabled={uploadingAvatar}
          >
            {uploadingAvatar
              ? <div style={styles.miniSpinner} />
              : <Camera size={13} color="#000" />
            }
          </button>
          <input ref={fileRef} type="file" accept="image/*" hidden
            onChange={e => handleAvatarUpload(e.target.files[0])} />
        </div>

        {/* Stats */}
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

      {/* Name & Bio */}
      <div style={styles.bio}>
        {!editMode ? (
          <>
            <div style={styles.fullName}>{profile?.full_name || 'Add your name'}</div>
            <div style={styles.bioText}>{profile?.bio || 'Add a bio...'}</div>

            {/* Action buttons */}
            <div style={styles.actionRow}>
              <button style={styles.editBtn} onClick={() => setEditMode(true)}>
                <Edit2 size={14} />
                Edit Profile
              </button>
              <button style={styles.shareBtn} onClick={handleShare}>
                <Share2 size={14} />
                Share
              </button>
            </div>
          </>
        ) : (
          /* Edit mode */
          <div style={styles.editForm}>
            <input
              value={editName}
              onChange={e => setEditName(e.target.value)}
              placeholder="Full name"
              style={styles.editInput}
            />
            <input
              value={editUsername}
              onChange={e => setEditUsername(e.target.value)}
              placeholder="Username"
              style={styles.editInput}
            />
            <textarea
              value={editBio}
              onChange={e => setEditBio(e.target.value)}
              placeholder="Bio..."
              style={{ ...styles.editInput, height: 80, resize: 'none' }}
            />
            <div style={{ display: 'flex', gap: 10 }}>
              <button style={styles.saveBtn} onClick={handleSaveProfile} disabled={saving}>
                <Check size={14} />
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button style={styles.cancelBtn} onClick={() => setEditMode(false)}>Cancel</button>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        {TABS.map(({ key, icon: Icon }) => (
          <button key={key} style={{
            ...styles.tab,
            borderTop: tab === key ? '2px solid #00E5FF' : '2px solid transparent',
            color: tab === key ? '#00E5FF' : '#666',
          }} onClick={() => setTab(key)}>
            <Icon size={20} />
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <div className="spinner" />
        </div>
      ) : prompts.length === 0 ? (
        <div className="empty-state" style={{ paddingTop: 40 }}>
          <Grid size={36} color="#333" style={{ margin: '0 auto 12px' }} />
          <h3>{tab === 'posts' ? 'No prompts uploaded' : 'No liked prompts'}</h3>
          {tab === 'posts' && (
            <p style={{ marginBottom: 20 }}>Share your first AI prompt!</p>
          )}
          {tab === 'posts' && (
            <Link to="/upload" className="btn btn-outline">Upload Prompt</Link>
          )}
        </div>
      ) : (
        <div className="prompt-grid" style={{ marginTop: 2 }}>
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
    padding: '14px 16px',
    borderBottom: '1px solid #111',
  },
  username: {
    fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 17, color: '#f0f0f0',
  },
  iconBtn: { padding: 6, background: 'none', border: 'none', cursor: 'pointer' },
  header: {
    display: 'flex', alignItems: 'center', gap: 24,
    padding: '20px 16px 12px',
  },
  avatarRing: {
    width: 86, height: 86, borderRadius: '50%',
    padding: 3,
    background: 'linear-gradient(135deg, #00E5FF, #0077ff)',
    boxShadow: '0 0 16px rgba(0,229,255,0.4)',
  },
  avatar: {
    width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover',
    border: '2px solid #050505',
  },
  cameraBtn: {
    position: 'absolute', bottom: 2, right: 2,
    width: 24, height: 24, borderRadius: '50%',
    background: '#00E5FF', border: '2px solid #050505',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer',
  },
  miniSpinner: {
    width: 10, height: 10, borderRadius: '50%',
    border: '1.5px solid rgba(0,0,0,0.2)', borderTopColor: '#000',
    animation: 'spin 0.7s linear infinite',
  },
  stats: { display: 'flex', gap: 20, flex: 1, justifyContent: 'space-around' },
  stat: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 },
  statNum: { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 18, color: '#f0f0f0' },
  statLabel: { fontSize: 12, color: '#888' },
  bio: { padding: '0 16px 16px' },
  fullName: { fontWeight: 700, fontSize: 15, color: '#f0f0f0', marginBottom: 4 },
  bioText: { fontSize: 13, color: '#888', lineHeight: 1.5, marginBottom: 12 },
  actionRow: { display: 'flex', gap: 10 },
  editBtn: {
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    padding: '8px 16px', borderRadius: 10,
    background: '#111', border: '1px solid #222',
    color: '#f0f0f0', fontSize: 13, fontWeight: 600, cursor: 'pointer',
  },
  shareBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    padding: '8px 16px', borderRadius: 10,
    background: '#111', border: '1px solid #222',
    color: '#f0f0f0', fontSize: 13, fontWeight: 600, cursor: 'pointer',
  },
  editForm: { display: 'flex', flexDirection: 'column', gap: 10 },
  editInput: {
    padding: '10px 14px', borderRadius: 10,
    background: '#0a0a0a', border: '1px solid #1e1e1e',
    color: '#f0f0f0', fontSize: 14, outline: 'none', fontFamily: 'inherit',
  },
  saveBtn: {
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    padding: '10px', borderRadius: 10,
    background: '#00E5FF', color: '#000', fontWeight: 700, fontSize: 14,
    border: 'none', cursor: 'pointer',
    boxShadow: '0 0 14px rgba(0,229,255,0.3)',
  },
  cancelBtn: {
    padding: '10px 20px', borderRadius: 10,
    background: '#111', border: '1px solid #222',
    color: '#888', fontSize: 14, cursor: 'pointer',
  },
  tabs: {
    display: 'flex', borderTop: '1px solid #111', borderBottom: '1px solid #111',
    marginBottom: 2,
  },
  tab: {
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '12px', background: 'none', cursor: 'pointer', transition: 'all 0.2s',
  },
};
