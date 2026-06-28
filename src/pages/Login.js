import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { signInWithGoogle, signInWithEmail, signUpWithEmail } from '../lib/supabase';
import toast from 'react-hot-toast';

export default function Login() {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) return toast.error('Fill in all fields');
    setLoading(true);
    const fn = isSignUp ? signUpWithEmail : signInWithEmail;
    const { error } = await fn(email, password);
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success(isSignUp ? 'Account created!' : 'Welcome back!');
    navigate('/');
  };

  const handleGoogle = async () => {
    const { error } = await signInWithGoogle();
    if (error) toast.error(error.message);
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <Link to="/" style={styles.logo}>
          <Zap size={22} color="#00E5FF" fill="#00E5FF" />
          <span style={styles.logoText}>Promptora</span>
        </Link>

        <h1 style={styles.title}>{isSignUp ? 'Create Account' : 'Welcome Back'}</h1>
        <p style={styles.sub}>{isSignUp ? 'Join the AI prompt community' : 'Sign in to your account'}</p>

        {/* Google */}
        <button style={styles.googleBtn} onClick={handleGoogle}>
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
            <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
            <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
            <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
          </svg>
          Continue with Google
        </button>

        <div style={styles.divider}><span>or</span></div>

        {/* Email */}
        <div style={styles.field}>
          <Mail size={15} color="#666" style={styles.fieldIcon} />
          <input value={email} onChange={e => setEmail(e.target.value)}
            placeholder="Email address" type="email" style={styles.input} />
        </div>

        <div style={styles.field}>
          <Lock size={15} color="#666" style={styles.fieldIcon} />
          <input value={password} onChange={e => setPassword(e.target.value)}
            placeholder="Password" type={showPass ? 'text' : 'password'} style={styles.input} />
          <button onClick={() => setShowPass(!showPass)} style={styles.eyeBtn}>
            {showPass ? <EyeOff size={15} color="#666" /> : <Eye size={15} color="#666" />}
          </button>
        </div>

        <button className="btn btn-primary" style={styles.submitBtn} onClick={handleSubmit} disabled={loading}>
          {loading ? <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : null}
          {isSignUp ? 'Create Account' : 'Sign In'}
        </button>

        <p style={styles.toggle}>
          {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
          <button onClick={() => setIsSignUp(!isSignUp)} style={styles.toggleBtn}>
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 20, background: 'radial-gradient(ellipse at 50% 30%, rgba(0,229,255,0.05) 0%, transparent 70%)',
  },
  card: {
    background: '#0d0d0d', border: '1px solid #1e1e1e', borderRadius: 20,
    padding: 28, width: '100%', maxWidth: 400,
    display: 'flex', flexDirection: 'column', gap: 16,
  },
  logo: { display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', textDecoration: 'none' },
  logoText: { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 22, color: '#f0f0f0' },
  title: { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 22, textAlign: 'center' },
  sub: { color: '#888', fontSize: 14, textAlign: 'center', marginTop: -8 },
  googleBtn: {
    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
    padding: '12px 20px', borderRadius: 12, background: '#111', border: '1px solid #2a2a2a',
    color: '#f0f0f0', fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
  },
  divider: {
    display: 'flex', alignItems: 'center', gap: 12,
    color: '#444', fontSize: 13,
    '::before': { content: '""', flex: 1, height: 1, background: '#1e1e1e' },
  },
  field: {
    display: 'flex', alignItems: 'center',
    background: '#0a0a0a', border: '1px solid #1e1e1e', borderRadius: 12, padding: '4px 14px',
    gap: 10,
  },
  fieldIcon: { flexShrink: 0 },
  input: {
    flex: 1, background: 'none', border: 'none', outline: 'none',
    color: '#f0f0f0', fontSize: 14, padding: '10px 0',
  },
  eyeBtn: { padding: 4 },
  submitBtn: { width: '100%', justifyContent: 'center', padding: '13px 20px', fontSize: 15, borderRadius: 12 },
  toggle: { color: '#888', fontSize: 13, textAlign: 'center' },
  toggleBtn: { color: '#00E5FF', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13 },
};
