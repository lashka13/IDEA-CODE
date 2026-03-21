import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '../lib/cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, icon, ...props }, ref) => {
    return (
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          className={cn(
            'w-full bg-glass-light border border-white/[0.06] rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30',
            'focus:outline-none focus:border-accent-cyan/30 focus:bg-glass-medium focus:shadow-[0_0_20px_rgba(0,240,255,0.05)]',
            'transition-all duration-300',
            icon && 'pl-10',
            className
          )}
          {...props}
        />
      </div>
    );
  }
);

Input.displayName = 'Input';
