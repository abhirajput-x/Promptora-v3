import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Compass, BookOpen, Users, X, Menu, Zap, Bell } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import NotificationBell from './NotificationBell';

const navLinks = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/explore', label: 'Explore', icon: Compass },
  { to: '/library', label: 'Library', icon: BookOpen },
  { to: '/creators', label: 'Creators', icon: Users },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const { user } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [open]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(() => setOpen(false), 350);
  };

  return (
    <>
      <style>{`
        .drawer-panel {
          transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.35s ease;
        }
        .drawer-panel.open { transform: translateX(0) !important; opacity: 1 !important; }
        .drawer-panel.closed { transform: translateX(-100%) !important; opacity: 0 !important; }
        .overlay-bg {
          transition: opacity 0.35s ease, backdrop-filter 0.35s ease;
        }
        .overlay-bg.open { opacity: 1 !important; backdrop-filter: blur(12px) !important; }
        .overlay-bg.closed { opacity: 0 !important; backdrop-filter: blur(0px) !important; }
      `}</style>

      <nav style={styles.nav}>
        <Link to="/" style={styles.logo}>
          <Zap size={20} color="#00E5FF" fill="#00E5FF" />
          <span style={styles.logoText}>Promptora</span>
        </Link>

        <div style={styles.right}>
          <NotificationBell />
          <Link to={user ? '/profile' : '/login'} style={styles.authBtn}>
            {user ? (
              <img
                src={user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${user.email}`}
                alt="avatar" style={styles.avatar}
              />
            ) : 'Sign In'}
          </Link>
          <button style={styles.menuBtn} onClick={() => setOpen(true)}>
            <Menu size={22} color="#f0f0f0" />
          </button>
        </div>
      </nav>

      {open && (
        <>
          <div
            className={`overlay-bg ${visible ? 'open' : 'closed'}`}
            onClick={handleClose}
            style={{
              position: 'fixed', inset: 0, zIndex: 200,
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(0px)', opacity: 0,
            }}
          />

          <div
            className={`drawer-panel ${visible ? 'open' : 'closed'}`}
            style={{
              position: 'fixed', top: 0, left: 0, bottom: 0,
              width: 290, zIndex: 201,
              background: 'linear-gradient(135deg, #080808 0%, #0d0d0d 100%)',
              borderRight: '1px solid rgba(0,229,255,0.12)',
              boxShadow: '4px 0 40px rgba(0,229,255,0.1), 2px 0 16px rgba(0,0,0,0.8)',
              display: 'flex', flexDirection: 'column',
              transform: 'translateX(-100%)', opacity: 0,
            }}
          >
            {/* Top glow */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: 2,
              background: 'linear-gradient(90deg, transparent, #00E5FF, transparent)',
            }} />

            {/* Header */}
            <div style={styles.drawerHeader}>
              <Link to="/" style={styles.logo} onClick={handleClose}>
                <Zap size={20} color="#00E5FF" fill="#00E5FF" />
                <span style={styles.logoText}>Promptora</span>
              </Link>
              <button onClick={handleClose} style={styles.closeBtn}>
                <X size={18} color="#888" />
              </button>
            </div>

            {/* Nav Links */}
            <div style={styles.drawerLinks}>
              {navLinks.map(({ to, label, icon: Icon }) => {
                const isActive = location.pathname === to;
                return (
                  <Link key={to} to={to} onClick={handleClose} style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '13px 18px', borderRadius: 12,
                    fontSize: 15, fontWeight: 500,
                    color: isActive ? '#00E5FF' : '#bbb',
                    background: isActive ? 'rgba(0,229,255,0.07)' : 'transparent',
                    border: isActive ? '1px solid rgba(0,229,255,0.18)' : '1px solid transparent',
                    textDecoration: 'none',
                    boxShadow: isActive ? '0 0 12px rgba(0,229,255,0.06)' : 'none',
                    transition: 'all 0.2s',
                  }}>
                    <Icon size={18} />
                    {label}
                    {isActive && (
                      <div style={{
                        marginLeft: 'auto', width: 6, height: 6,
                        borderRadius: '50%', background: '#00E5FF',
                        boxShadow: '0 0 6px #00E5FF',
                      }} />
                    )}
                  </Link>
                );
              })}
              {user && (
                <Link to="/notifications" onClick={handleClose} style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '13px 18px', borderRadius: 12,
                  fontSize: 15, fontWeight: 500,
                  color: location.pathname === '/notifications' ? '#00E5FF' : '#bbb',
                  background: location.pathname === '/notifications' ? 'rgba(0,229,255,0.07)' : 'transparent',
                  border: location.pathname === '/notifications' ? '1px solid rgba(0,229,255,0.18)' : '1px solid transparent',
                  textDecoration: 'none',
                  transition: 'all 0.2s',
                }}>
                  <Bell size={18} />
                  Notifications
                </Link>
              )}
            </div>

            {/* Footer */}
            <div style={styles.drawerFooter}>
              <Link to={user ? '/profile' : '/login'} onClick={handleClose} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 8, padding: '13px 20px', borderRadius: 12,
                background: 'linear-gradient(135deg, #00E5FF, #00b8d4)',
                color: '#000', fontWeight: 700, fontSize: 14,
                textDecoration: 'none',
                boxShadow: '0 0 24px rgba(0,229,255,0.25)',
              }}>
                {user ? 'My Profile' : 'Sign In'}
              </Link>
              <p style={{ color: '#2a2a2a', fontSize: 11, textAlign: 'center', marginTop: 12 }}>
                Promptora V2 ⚡
              </p>
            </div>
          </div>
        </>
      )}
    </>
  );
}

const styles = {
  nav: {
    position: 'sticky', top: 0, zIndex: 100,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 16px', height: 60,
    background: 'rgba(5,5,5,0.92)', backdropFilter: 'blur(16px)',
    borderBottom: '1px solid #1a1a1a',
  },
  logo: { display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' },
  logoText: { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 20, color: '#f0f0f0' },
  right: { display: 'flex', alignItems: 'center', gap: 8 },
  authBtn: {
    padding: '6px 16px', borderRadius: 50,
    background: 'rgba(0,229,255,0.10)', border: '1px solid rgba(0,229,255,0.22)',
    color: '#00E5FF', fontSize: 14, fontWeight: 600,
    display: 'flex', alignItems: 'center', textDecoration: 'none',
  },
  avatar: { width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' },
  menuBtn: { padding: 8, borderRadius: 8, background: '#111', border: '1px solid #1e1e1e', cursor: 'pointer' },
  drawerHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '16px 20px', borderBottom: '1px solid #161616',
  },
  closeBtn: { padding: 7, borderRadius: 8, background: '#111', border: '1px solid #1e1e1e', cursor: 'pointer' },
  drawerLinks: { flex: 1, padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: 4, overflowY: 'auto' },
  drawerFooter: { padding: '16px 20px', borderTop: '1px solid #161616' },
};

