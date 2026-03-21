import { cn } from '../lib/cn';

export function CodeCoinIcon({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={cn('inline-block', className)}
    >
      <circle cx="12" cy="12" r="11" stroke="url(#coin-gradient)" strokeWidth="1.5" fill="url(#coin-gradient)" fillOpacity="0.1" />
      <path d="M9 8.5L12 6L15 8.5V12L12 14.5L9 12V8.5Z" stroke="url(#coin-gradient)" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M12 14.5V18" stroke="url(#coin-gradient)" strokeWidth="1.5" strokeLinecap="round" />
      <defs>
        <linearGradient id="coin-gradient" x1="2" y1="2" x2="22" y2="22">
          <stop stopColor="#39FF14" />
          <stop offset="1" stopColor="#00F0FF" />
        </linearGradient>
      </defs>
    </svg>
  );
}
