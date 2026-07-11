import { BadgeCheck } from 'lucide-react';

export default function VerifiedBadge({ size = 14, style }) {
  return (
    <BadgeCheck
      size={size}
      color="#0a0a0a"
      fill="#00E5FF"
      strokeWidth={2.5}
      style={{ flexShrink: 0, ...style }}
      aria-label="Verified creator"
    />
  );
}
