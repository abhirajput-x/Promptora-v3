import { Link } from 'react-router-dom';
import { Wand2, Sparkles, ArrowRight, Image, Zap } from 'lucide-react';

const TOOLS = [
  {
    icon: Sparkles,
    title: 'Prompt Enhancer',
    desc: 'Paste any basic prompt and get a detailed, professional version optimized for AI image generators.',
    badge: 'Coming Soon',
    color: '#00E5FF',
  },
  {
    icon: Zap,
    title: 'AI Prompt Generator',
    desc: 'Describe what you want in simple words and get a ready-to-use AI art prompt instantly.',
    badge: 'Coming Soon',
    color: '#a855f7',
  },
  {
    icon: Image,
    title: 'Style Mixer',
    desc: 'Combine multiple art styles, lighting conditions, and moods into one powerful prompt.',
    badge: 'Coming Soon',
    color: '#f97316',
  },
];

export default function Tools() {
  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div style={styles.badge}>
          <Wand2 size={13} color="#00E5FF" />
          AI Tools
        </div>
        <h1 style={styles.title}>Prompt Tools</h1>
        <p style={styles.sub}>Powerful tools to help you craft the perfect AI prompt</p>
      </div>

      <div style={styles.container}>
        {TOOLS.map(({ icon: Icon, title, desc, badge, color }) => (
          <div key={title} style={styles.card}>
            <div style={{ ...styles.iconBox, background: `${color}15`, border: `1px solid ${color}30` }}>
              <Icon size={22} color={color} />
            </div>
            <div style={styles.cardBody}>
              <div style={styles.cardTop}>
                <h3 style={styles.cardTitle}>{title}</h3>
                <span style={{ ...styles.comingSoon, color, background: `${color}15`, border: `1px solid ${color}25` }}>
                  {badge}
                </span>
              </div>
              <p style={styles.cardDesc}>{desc}</p>
            </div>
          </div>
        ))}

        {/* Explore prompts CTA */}
        <div style={styles.cta}>
          <Sparkles size={20} color="#00E5FF" />
          <div>
            <div style={styles.ctaTitle}>Browse Prompt Library</div>
            <div style={styles.ctaDesc}>Thousands of curated prompts ready to use</div>
          </div>
          <Link to="/explore" style={styles.ctaBtn}>
            Explore <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', paddingBottom: 80 },
  header: {
    padding: '32px 20px 24px', textAlign: 'center',
    background: 'radial-gradient(ellipse at 50% 0%, rgba(0,229,255,0.06) 0%, transparent 70%)',
    borderBottom: '1px solid #111', marginBottom: 24,
  },
  badge: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '3px 12px', borderRadius: 50, marginBottom: 12,
    background: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.2)',
    color: '#00E5FF', fontSize: 12, fontWeight: 600,
  },
  title: {
    fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800,
    fontSize: 'clamp(24px, 6vw, 36px)', color: '#f0f0f0', marginBottom: 8,
  },
  sub: { color: '#888', fontSize: 14 },
  container: {
    padding: '0 16px', maxWidth: 560, margin: '0 auto',
    display: 'flex', flexDirection: 'column', gap: 14,
  },
  card: {
    display: 'flex', gap: 16, padding: '18px',
    background: '#0d0d0d', border: '1px solid #1e1e1e', borderRadius: 16,
    transition: 'border-color 0.2s',
  },
  iconBox: {
    width: 48, height: 48, borderRadius: 12, flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  cardBody: { flex: 1, display: 'flex', flexDirection: 'column', gap: 6 },
  cardTop: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  cardTitle: {
    fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700,
    fontSize: 15, color: '#f0f0f0',
  },
  comingSoon: {
    fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 50,
  },
  cardDesc: { fontSize: 13, color: '#666', lineHeight: 1.6 },
  cta: {
    display: 'flex', alignItems: 'center', gap: 14, padding: '18px',
    background: 'rgba(0,229,255,0.05)', border: '1px solid rgba(0,229,255,0.15)',
    borderRadius: 16, marginTop: 4,
  },
  ctaTitle: { fontWeight: 700, fontSize: 14, color: '#f0f0f0' },
  ctaDesc: { fontSize: 12, color: '#888', marginTop: 2 },
  ctaBtn: {
    marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5,
    padding: '8px 14px', borderRadius: 50, flexShrink: 0,
    background: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.25)',
    color: '#00E5FF', fontSize: 13, fontWeight: 600, textDecoration: 'none',
  },
};
