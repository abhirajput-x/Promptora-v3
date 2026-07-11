const LEVELS = {
  bronze: { emoji: '🥉', label: 'Bronze Creator', color: '#cd7f32', bg: 'rgba(205,127,50,0.12)', border: 'rgba(205,127,50,0.35)' },
  silver: { emoji: '🥈', label: 'Silver Creator', color: '#c0c0c0', bg: 'rgba(192,192,192,0.12)', border: 'rgba(192,192,192,0.35)' },
  gold: { emoji: '🥇', label: 'Gold Creator', color: '#ffd700', bg: 'rgba(255,215,0,0.12)', border: 'rgba(255,215,0,0.35)' },
};

export default function CreatorLevelBadge({ level = 'bronze', size = 'sm', showLabel = false }) {
  const cfg = LEVELS[level] || LEVELS.bronze;
  const compact = size === 'sm';

  return (
    <span
      title={cfg.label}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: compact ? '2px 7px' : '4px 10px',
        borderRadius: 50,
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        fontSize: compact ? 11 : 12.5,
        fontWeight: 700,
        color: cfg.color,
        lineHeight: 1.4,
        flexShrink: 0,
      }}
    >
      <span style={{ fontSize: compact ? 11 : 13 }}>{cfg.emoji}</span>
      {showLabel && cfg.label}
    </span>
  );
}
