import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'danger';
  size?: 'md' | 'lg';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={twMerge(
          clsx(
            // Core accessibility outline & transitions
            'inline-flex items-center justify-center font-hyperlegible font-bold rounded-medium',
            'transition-colors duration-150 ease-in-out cursor-pointer select-none',
            'border-2 border-transparent focus:outline-none focus-visible:outline-none',
            
            // Touch Target sizes (Enforcing minimum 48px target)
            size === 'md' && 'min-h-[48px] min-w-[48px] px-6 py-2 text-base',
            size === 'lg' && 'min-h-[56px] min-w-[56px] px-8 py-3 text-lg',
            
            // Dynamic Color Schemes (WCAG AAA contrast targeted)
            variant === 'primary' && 'bg-foreground text-background hover:bg-opacity-90',
            variant === 'secondary' && 'bg-secondary text-foreground border-foreground hover:bg-opacity-80',
            variant === 'accent' && 'bg-accent text-background hover:bg-accent-hover',
            variant === 'danger' && 'bg-red-700 text-white hover:bg-red-800',
            
            // Disabled styles
            disabled && 'opacity-50 cursor-not-allowed pointer-events-none'
          ),
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
export default Button;
