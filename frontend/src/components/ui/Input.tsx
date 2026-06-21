import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', error = false, ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        className={twMerge(
          clsx(
            // Sizing and alignment
            'w-full px-4 py-2 font-hyperlegible text-base rounded-small bg-secondary border-2',
            'transition-colors duration-150 ease-in-out min-h-[48px]',
            
            // Standard colors vs Error colors
            !error ? 'border-muted text-foreground' : 'border-red-600 text-foreground',
            
            // Focus ring states
            'focus:outline-none focus:border-accent focus-visible:outline-none'
          ),
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';
export default Input;
