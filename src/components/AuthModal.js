import { Link } from 'react-router-dom';
import { LogIn, X } from 'lucide-react';
import { useAuthModal } from '../context/AuthModalContext';

export default function AuthModal() {
  const { open, message, closeAuthModal } = useAuthModal();

  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={closeAuthModal}>
      <div
        className="modal fade-in"
        onClick={e => e.stopPropagation()}
        style={styles.modal}
      >
        <button onClick={closeAuthModal} style={styles.closeBtn} aria-label="Close">
          <X size={16} color="#888" />
        </button>

        <div style={styles.iconRing}>
          <LogIn size={24} color="#00E5FF" />
        </div>

        <h3 style={styles.title}>Sign in required</h3>
        <p style={styles.message}>{message}</p>

        <Link to="/login" onClick={closeAuthModal} className="btn btn-primary" style={styles.signInBtn}>
          Sign In
        </Link>
        <button onClick={closeAuthModal} style={styles.laterBtn}>Maybe later</button>
      </div>
    </div>
  );
}

const styles = {
  modal: {
    maxWidth: 360,
    textAlign: 'center',
    padding: '32px 26px 26px',
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute', top: 14, right: 14,
    padding: 6, borderRadius: 8, background: '#111', border: '1px solid #1e1e1e',
    cursor: 'pointer', display: 'flex',
  },
  iconRing: {
    width: 56, height: 56, borderRadius: '50%',
    background: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.3)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    margin: '0 auto 16px',
    boxShadow: '0 0 24px rgba(0,229,255,0.2)',
  },
  title: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: 18, fontWeight: 700, color: '#f0f0f0', marginBottom: 8,
  },
  message: {
    fontSize: 14, color: '#888', lineHeight: 1.5, marginBottom: 22,
  },
  signInBtn: {
    width: '100%', justifyContent: 'center', borderRadius: 12,
    padding: '12px', fontSize: 15, marginBottom: 10,
  },
  laterBtn: {
    width: '100%', padding: '10px', color: '#666', fontSize: 13,
    background: 'none', border: 'none', cursor: 'pointer',
  },
};
