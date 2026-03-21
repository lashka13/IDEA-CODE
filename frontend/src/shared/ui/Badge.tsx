import { cn } from '../lib/cn';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'green' | 'cyan' | 'orange' | 'red' | 'purple';
  size?: 'sm' | 'md';
  className?: string;
}

const badgeVariants = {
  default: 'bg-white/[0.06] text-white/60',
  green: 'bg-accent-green/10 text-accent-green border-accent-green/20',
  cyan: 'bg-accent-cyan/10 text-accent-cyan border-accent-cyan/20',
  orange: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  red: 'bg-red-500/10 text-red-400 border-red-500/20',
  purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
};

export function Badge({ children, variant = 'default', size = 'sm', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center font-medium border rounded-full',
        badgeVariants[variant],
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs',
        className
      )}
    >
      {children}
    </span>
  );
}
