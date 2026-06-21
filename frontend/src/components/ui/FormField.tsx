import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface FormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  htmlFor: string;
  description?: string;
  error?: string;
  required?: boolean;
}

export const FormField = React.forwardRef<HTMLDivElement, FormFieldProps>(
  ({ className, label, htmlFor, description, error, required = false, children, ...props }, ref) => {
    const descId = `${htmlFor}-desc`;
    const errId = `${htmlFor}-err`;

    return (
      <div
        ref={ref}
        className={twMerge('flex flex-col gap-2 w-full', className)}
        {...props}
      >
        <div className="flex justify-between items-baseline">
          <label
            htmlFor={htmlFor}
            className="font-hyperlegible font-bold text-lg select-none cursor-pointer"
          >
            {label}
            {required && <span className="text-red-500 ml-1" aria-hidden="true">*</span>}
          </label>
        </div>

        {description && (
          <p
            id={descId}
            className="text-muted text-sm font-hyperlegible leading-relaxed"
          >
            {description}
          </p>
        )}

        {/* Clone children to inject dynamic aria attributes */}
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child as React.ReactElement<any>, {
              id: htmlFor,
              'aria-describedby': clsx(
                description && descId,
                error && errId
              ) || undefined,
              'aria-invalid': !!error || undefined,
              required,
            });
          }
          return child;
        })}

        {error && (
          <p
            id={errId}
            className="text-red-500 text-sm font-hyperlegible font-semibold"
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);

FormField.displayName = 'FormField';
export default FormField;
