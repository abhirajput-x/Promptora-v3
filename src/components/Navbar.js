import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Compass, BookOpen, Wrench, Users, X, Menu, Zap } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const navLinks = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/explore', label: 'Explore', icon: Compass },
  { to: '/library', label: 'Library', icon: BookOpen },
  { to: '/tools', label: 'Tools', icon: Wrench },
  { to: '/creators', label: 'Creators', icon: Users },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();

  return (
    <>
      <nav style={styles.nav}>
        <Link to="/" style={styles.logo}>
          <Zap size={20} color="#00E5FF" fill="#00E5FF" />
          <span style={styles.logoText}>Promptora</span>
        </Link>

        {/* Desktop links */}
        <div style={styles.desktopLinks}>
          {navLinks.map(({ to, label }) => (
            <Link key={to} to={to} style={{
              ...styles.navLink,
              color: location.pathname === to ? '#00E5FF' : '#888',
            }}>{label}</Link>
          ))}
        </div>

        <div style={styles.right}>
          <Link to={user ? '/profile' : '/login'} style={styles.authBtn}>
            {user ? (
              <img
                src={user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${user.email}`}
                alt="avatar"
                style={styles.avatar}
              />
            ) : 'Sign In'}
          </Link>
          <button style={styles.menuBtn} onClick={() => setOpen(true)}>
            <Menu size={22} color="#f0f0f0" />
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      {open && (
        <div style={styles.overlay} onClick={() => setOpen(false)}>
          <div style={styles.drawer} onClick={e => e.stopPropagation()}>
            <div style={styles.drawerHeader}>
              <Link to="/" style={styles.logo} onClick={() => setOpen(false)}>
                <Zap size={20} color="#00E5FF" fill="#00E5FF" />
                <span style={styles.logoText}>Promptora</span>
              </Link>
              <button onClick={() => setOpen(false)} style={styles.closeBtn}>
                <X size={22} />
              </button>
            </div>

            <div style={styles.drawerLinks}>
              {navLinks.map(({ to, label, icon: Icon }) => (
                <Link key={to} to={to} style={{
                  ...styles.drawerLink,
                  color: location.pathname === to ? '#00E5FF' : '#f0f0f0',
                  background: location.pathname === to ? 'rgba(0,229,255,0.08)' : 'transparent',
                }} onClick={() => setOpen(false)}>
                  <Icon size={18} />
                  {label}
                </Link>
              ))}
            </div>

            <div style={styles.drawerFooter}>
              <Link to={user ? '/profile' : '/login'} className="btn btn-primary" onClick={() => setOpen(false)}
                style={{ width: '100%', justifyContent: 'center' }}>
                {user ? 'My Profile' : 'Sign In'}
              </Link>
            </div>
          </div>
        </div>
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
    borderBottom: '1px solid #1e1e1e',
  },
  logo: {
    display: 'flex', alignItems: 'center', gap: 8,
    textDecoration: 'none',
  },
  logoText: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 700, fontSize: 20, color: '#f0f0f0',
  },
  desktopLinks: {
    display: 'none',
    gap: 4,
    '@media (min-width: 768px)': { display: 'flex' },
  },
  navLink: {
    padding: '6px 14px', borderRadius: 8,
    fontSize: 14, fontWeight: 500, transition: 'color 0.2s',
  },
  right: { display: 'flex', alignItems: 'center', gap: 8 },
  authBtn: {
    padding: '6px 16px', borderRadius: 50,
    background: 'rgba(0,229,255,0.12)', border: '1px solid rgba(0,229,255,0.25)',
    color: '#00E5FF', fontSize: 14, fontWeight: 600,
    display: 'flex', alignItems: 'center',
  },
  avatar: { width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' },
  menuBtn: { padding: 8, borderRadius: 8, background: '#111', border: '1px solid #1e1e1e' },
  overlay: {
    position: 'fixed', inset: 0, zIndex: 200,
    background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
  },
  drawer: {
    position: 'absolute', top: 0, left: 0, bottom: 0,
    width: 280, background: '#0d0d0d',
    borderRight: '1px solid #1e1e1e',
    display: 'flex', flexDirection: 'column',
  },
  drawerHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '16px 20px', borderBottom: '1px solid #1e1e1e',
  },
  closeBtn: { padding: 6, borderRadius: 8, color: '#888' },
  drawerLinks: {
    flex: 1, padding: '16px 12px',
    display: 'flex', flexDirection: 'column', gap: 4,
  },
  drawerLink: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '12px 16px', borderRadius: 12,
    fontSize: 15, fontWeight: 500,
    transition: 'all 0.2s',
  },
  drawerFooter: { padding: '16px 20px', borderTop: '1px solid #1e1e1e' },
};

