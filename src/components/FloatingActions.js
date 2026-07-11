
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useAuthModal } from '../context/AuthModalContext';

export default function FloatingActions() {
  const { user } = useAuth();
  const { requireAuth } = useAuthModal();
  const navigate = useNavigate();
  const [plusHover, setPlusHover] = useState(false);
  const [avatarHover, setAvatarHover] = useState(false);

  const handleUploadClick = () => {
    if (!user) { requireAuth('Please sign in to publish a prompt.'); return; }
    navigate('/upload');
  };

  const handleProfileClick = () => {
    navigate(user ? '/profile' : '/login');
  };

  const avatarSrc = user
    ? (user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${user.email}`)
    : null;

  return (
    <div style={styles.wrapper}>
      {/* Upload "+" button */}
      <button
        style={{
          ...styles.plusBtn,
          boxShadow: plusHover
            ? '0 0 0 1px rgba(0,229,255,0.6), 0 0 24px rgba(0,229,255,0.55), 0 4px 16px rgba(0,0,0,0.5)'
            : '0 0 0 1px rgba(0,229,255,0.3), 0 0 14px rgba(0,229,255,0.25), 0 4px 16px rgba(0,0,0,0.5)',
          transform: plusHover ? 'scale(1.06)' : 'scale(1)',
        }}
        onClick={handleUploadClick}
        onMouseEnter={() => setPlusHover(true)}
        onMouseLeave={() => setPlusHover(false)}
        onTouchStart={() => setPlusHover(true)}
        onTouchEnd={() => setPlusHover(false)}
        aria-label="Upload prompt"
      >
        <Plus size={24} color="#00E5FF" strokeWidth={2.5}
          style={{ filter: plusHover ? 'drop-shadow(0 0 6px rgba(0,229,255,0.9))' : 'drop-shadow(0 0 3px rgba(0,229,255,0.5))' }}
        />
      </button>

      {/* Profile avatar button */}
      <button
        style={{
          ...styles.avatarBtn,
          boxShadow: avatarHover
            ? '0 0 0 2px rgba(0,229,255,0.7), 0 0 22px rgba(0,229,255,0.5), 0 4px 14px rgba(0,0,0,0.5)'
            : '0 0 0 1.5px rgba(0,229,255,0.35), 0 0 12px rgba(0,229,255,0.18), 0 4px 14px rgba(0,0,0,0.5)',
          transform: avatarHover ? 'scale(1.06)' : 'scale(1)',
        }}
        onClick={handleProfileClick}
        onMouseEnter={() => setAvatarHover(true)}
        onMouseLeave={() => setAvatarHover(false)}
        onTouchStart={() => setAvatarHover(true)}
        onTouchEnd={() => setAvatarHover(false)}
        aria-label="Profile"
      >
        {avatarSrc ? (
          <img src={avatarSrc} alt="Profile" style={styles.avatarImg} />
        ) : (
          <div style={styles.avatarPlaceholder}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="8" r="4" stroke="#888" strokeWidth="1.8" />
              <path d="M4 20c0-3.5 3.5-6 8-6s8 2.5 8 6" stroke="#888" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </div>
        )}
      </button>
    </div>
  );
}

const styles = {
  wrapper: {
    position: 'fixed',
    bottom: 22,
    right: 18,
    zIndex: 150,
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  plusBtn: {
    width: 50, height: 50, borderRadius: '50%',
    background: 'linear-gradient(145deg, #0d0d0d 0%, #0a0a0a 100%)',
    border: '1px solid rgba(0,229,255,0.25)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer',
    transition: 'box-shadow 0.25s ease, transform 0.25s ease',
  },
  avatarBtn: {
    width: 50, height: 50, borderRadius: '50%',
    padding: 0,
    background: '#0d0d0d',
    border: 'none',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer',
    overflow: 'hidden',
    transition: 'box-shadow 0.25s ease, transform 0.25s ease',
  },
  avatarImg: {
    width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%',
  },
  avatarPlaceholder: {
    width: '100%', height: '100%', borderRadius: '50%',
    background: '#111',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
};
