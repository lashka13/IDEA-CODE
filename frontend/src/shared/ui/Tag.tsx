import { cn } from '../lib/cn';

interface TagProps {
  children: React.ReactNode;
  color?: string;
  className?: string;
  onClick?: () => void;
  active?: boolean;
}

export function Tag({ children, color, className, onClick, active }: TagProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-3 py-1 text-xs rounded-lg border transition-all duration-200',
        active
          ? 'bg-accent-cyan/15 border-accent-cyan/30 text-accent-cyan'
          : 'bg-white/[0.03] border-white/[0.06] text-white/50 hover:text-white/80 hover:border-white/[0.12]',
        onClick && 'cursor-pointer',
        className
      )}
      style={color ? { borderColor: `${color}33`, color, backgroundColor: `${color}15` } : undefined}
    >
      {children}
    </button>
  );
}
