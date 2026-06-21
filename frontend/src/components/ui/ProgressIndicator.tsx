import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface ProgressIndicatorProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number; // Current value (e.g. active question index 1-indexed)
  max: number; // Maximum value (e.g. total questions)
}

export const ProgressIndicator = React.forwardRef<HTMLDivElement, ProgressIndicatorProps>(
  ({ className, value, max, ...props }, ref) => {
    const percentage = max > 0 ? Math.min(Math.max((value / max) * 100, 0), 100) : 0;
    const valueText = `Question ${value} of ${max}`;

    return (
      <div
        ref={ref}
        className={twMerge('flex flex-col gap-2 w-full', className)}
        {...props}
      >
        <div className="flex justify-between items-baseline font-hyperlegible font-semibold text-sm">
          <span id="progress-label" className="text-muted">Progress</span>
          <span className="text-foreground" aria-live="polite">{valueText}</span>
        </div>

        <div
          role="progressbar"
          aria-labelledby="progress-label"
          aria-valuenow={value}
          aria-valuemin={1}
          aria-valuemax={max}
          aria-valuetext={valueText}
          className="h-3 w-full bg-secondary rounded-full overflow-hidden border border-muted"
        >
          <div
            className="h-full bg-accent transition-all duration-300 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  }
);

ProgressIndicator.displayName = 'ProgressIndicator';
export default ProgressIndicator;
