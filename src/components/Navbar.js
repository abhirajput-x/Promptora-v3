import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Compass, BookOpen, Wrench, Users, X, Menu, Zap, Image, Sparkles, ChevronDown, Wand2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const toolsDropdown = [
  { to: '/tools', label: 'Image to Prompt', icon: Image, desc: 'Upload image, get AI prompt' },
  { to: '/tools/enhance', label: 'Prompt Enhancer', icon: Wand2, desc: 'Make your prompt better' },
  { to: '/tools/generate', label: 'AI Generator', icon: Sparkles, desc: 'Generate prompts from text' },
];

const navLinks = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/explore', label: 'Explore', icon: Compass },
  { to: '/library', label: 'Library', icon: BookOpen },
  { to: '/creators', label: 'Creators', icon: Users },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [toolsDrawerOpen, setToolsDrawerOpen] = useState(false);
  const toolsRef = useRef(null);
  const { user } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [open]);

  useEffect(() => {
    const handleClick = (e) => {
      if (toolsRef.current && !toolsRef.current.contains(e.target)) {
        setToolsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(() => setOpen(false), 350);
  };

  const isToolsActive = location.pathname.startsWith('/tools');

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

        .tools-dropdown {
          position: absolute;
          top: calc(100% + 10px);
          left: 50%;
          transform: translateX(-50%) translateY(-8px);
          opacity: 0;
          pointer-events: none;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 500;
          width: 240px;
        }
        .tools-dropdown.open {
          transform: translateX(-50%) translateY(0);
          opacity: 1;
          pointer-events: all;
        }

        .tools-drawer {
          transition: max-height 0.35s cubic-bezier(0.4,0,0.2,1), opacity 0.3s ease;
          overflow: hidden;
          max-height: 0;
          opacity: 0;
        }
        .tools-drawer.open {
          max-height: 300px;
          opacity: 1;
        }

        .tool-item:hover {
          background: rgba(0,229,255,0.08) !important;
          border-color: rgba(0,229,255,0.2) !important;
        }
        .chevron {
          transition: transform 0.25s ease;
        }
        .chevron.open { transform: rotate(180deg); }
      `}</style>

      <nav style={styles.nav}>
        <Link to="/" style={styles.logo}>
          <Zap size={20} color="#00E5FF" fill="#00E5FF" />
          <span style={styles.logoText}>Promptora</span>
        </Link>

        {/* Desktop Tools dropdown */}
        <div ref={toolsRef} style={{ position: 'relative', display: 'none' }}>
          <button
            style={{
              ...styles.desktopToolsBtn,
              color: isToolsActive ? '#00E5FF' : '#888',
            }}
            onClick={() => setToolsOpen(!toolsOpen)}
          >
            <Wrench size={15} />
            Tools
            <ChevronDown size={14} className={`chevron ${toolsOpen ? 'open' : ''}`} />
          </button>

          <div className={`tools-dropdown ${toolsOpen ? 'open' : ''}`}>
            <div style={styles.dropdownBox}>
              <div style={styles.dropdownHeader}>
                <Wrench size={13} color="#00E5FF" />
                <span style={{ color: '#00E5FF', fontSize: 11, fontWeight: 700, letterSpacing: 1 }}>AI TOOLS</span>
              </div>
              {toolsDropdown.map(({ to, label, icon: Icon, desc }) => (
                <Link key={to} to={to} style={styles.dropdownItem} className="tool-item"
                  onClick={() => setToolsOpen(false)}>
                  <div style={styles.dropdownIcon}>
                    <Icon size={16} color="#00E5FF" />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#f0f0f0' }}>{label}</div>
                    <div style={{ fontSize: 11, color: '#666', marginTop: 1 }}>{desc}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div style={styles.right}>
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

              {/* Tools section with dropdown */}
              <div>
                <button
                  onClick={() => setToolsDrawerOpen(!toolsDrawerOpen)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 14,
                    padding: '13px 18px', borderRadius: 12,
                    fontSize: 15, fontWeight: 500,
                    color: isToolsActive ? '#00E5FF' : '#bbb',
                    background: isToolsActive ? 'rgba(0,229,255,0.07)' : 'transparent',
                    border: isToolsActive ? '1px solid rgba(0,229,255,0.18)' : '1px solid transparent',
                    cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  <Wrench size={18} />
                  Tools
                  <ChevronDown
                    size={15}
                    style={{
                      marginLeft: 'auto',
                      transition: 'transform 0.25s ease',
                      transform: toolsDrawerOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      color: '#666',
                    }}
                  />
                </button>

                {/* Tools sub-items */}
                <div className={`tools-drawer ${toolsDrawerOpen ? 'open' : ''}`}>
                  <div style={{ padding: '6px 8px 4px 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {toolsDropdown.map(({ to, label, icon: Icon, desc }) => (
                      <Link key={to} to={to} onClick={handleClose} style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '10px 14px', borderRadius: 10,
                        textDecoration: 'none', border: '1px solid #1a1a1a',
                        background: '#0a0a0a', transition: 'all 0.2s',
                      }} className="tool-item">
                        <div style={{
                          width: 32, height: 32, borderRadius: 8,
                          background: 'rgba(0,229,255,0.1)',
                          border: '1px solid rgba(0,229,255,0.2)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          <Icon size={15} color="#00E5FF" />
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#f0f0f0' }}>{label}</div>
                          <div style={{ fontSize: 11, color: '#555', marginTop: 1 }}>{desc}</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
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
  desktopToolsBtn: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '7px 14px', borderRadius: 8, border: 'none',
    background: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 500,
    transition: 'color 0.2s',
  },
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
  dropdownBox: {
    background: '#0d0d0d', border: '1px solid rgba(0,229,255,0.15)',
    borderRadius: 14, padding: 8,
    boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 24px rgba(0,229,255,0.08)',
  },
  dropdownHeader: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '6px 12px 8px', borderBottom: '1px solid #1a1a1a', marginBottom: 4,
  },
  dropdownItem: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '10px 12px', borderRadius: 10,
    textDecoration: 'none', border: '1px solid transparent',
    transition: 'all 0.2s',
  },
  dropdownIcon: {
    width: 34, height: 34, borderRadius: 8,
    background: 'rgba(0,229,255,0.08)', border: '1px solid rgba(0,229,255,0.15)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
};

