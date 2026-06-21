import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface StatusBannerProps extends React.HTMLAttributes<HTMLDivElement> {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose?: () => void;
}

export const StatusBanner = React.forwardRef<HTMLDivElement, StatusBannerProps>(
  ({ className, message, type = 'info', onClose, ...props }, ref) => {
    // Map roles for screen readers (alert forces interruption, status queues politely)
    const role = type === 'error' ? 'alert' : 'status';

    return (
      <div
        ref={ref}
        role={role}
        aria-live={type === 'error' ? 'assertive' : 'polite'}
        className={twMerge(
          clsx(
            // Sizing and alignment
            'flex items-center justify-between p-4 rounded-medium border-2 w-full font-hyperlegible font-semibold text-base',
            
            // WCAG AAA colors (avoiding generic neon colors)
            type === 'success' && 'bg-secondary border-green-800 text-foreground',
            type === 'error' && 'bg-secondary border-red-700 text-foreground',
            type === 'info' && 'bg-secondary border-accent text-foreground'
          ),
          className
        )}
        {...props}
      >
        <span className="flex-1 pr-4">{message}</span>
        
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 -my-1 text-muted hover:text-foreground rounded-small min-h-[48px] min-w-[48px] cursor-pointer border-none bg-transparent font-bold focus:outline-none"
            aria-label="Close status message"
          >
            ✕
          </button>
        )}
      </div>
    );
  }
);

StatusBanner.displayName = 'StatusBanner';
export default StatusBanner;
