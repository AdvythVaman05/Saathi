import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  focusable?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, focusable = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        tabIndex={focusable ? 0 : undefined}
        className={twMerge(
          clsx(
            // Container layout
            'p-6 bg-secondary rounded-large border border-muted',
            'transition-shadow duration-150',
            
            // High contrast outline details
            focusable && 'focus:outline-none focus-visible:outline-none cursor-pointer'
          ),
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
export default Card;
