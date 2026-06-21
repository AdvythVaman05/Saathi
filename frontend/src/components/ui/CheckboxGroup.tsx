import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface CheckboxOption {
  id: string;
  value: string;
  label: string;
}

export interface CheckboxGroupProps extends React.HTMLAttributes<HTMLFieldSetElement> {
  name: string;
  legend: string;
  options: CheckboxOption[];
  selectedValues?: string[];
  onChangeValues?: (values: string[]) => void;
  error?: string;
  required?: boolean;
}

export const CheckboxGroup = React.forwardRef<HTMLFieldSetElement, CheckboxGroupProps>(
  ({ className, name, legend, options, selectedValues = [], onChangeValues, error, required = false, ...props }, ref) => {
    
    const handleToggle = (value: string) => {
      let nextValues: string[];
      if (selectedValues.includes(value)) {
        nextValues = selectedValues.filter((val) => val !== value);
      } else {
        nextValues = [...selectedValues, value];
      }
      onChangeValues?.(nextValues);
    };

    return (
      <fieldset
        ref={ref}
        className={twMerge('flex flex-col gap-4 border-none p-0 m-0 w-full', className)}
        {...props}
      >
        <legend className="font-hyperlegible font-bold text-lg mb-2">
          {legend}
          {required && <span className="text-red-500 ml-1" aria-hidden="true">*</span>}
        </legend>

        <div className="flex flex-col gap-3">
          {options.map((option) => {
            const isChecked = selectedValues.includes(option.value);
            const optionId = `${name}-${option.id}`;

            return (
              <label
                key={option.value}
                htmlFor={optionId}
                className={clsx(
                  // Dynamic layout wrapper
                  'flex items-center gap-4 p-4 rounded-medium border-2 cursor-pointer select-none',
                  'transition-all duration-150 ease-in-out min-h-[48px]',
                  
                  // Selected state styles
                  isChecked 
                    ? 'border-accent bg-secondary' 
                    : 'border-muted hover:border-foreground bg-transparent'
                )}
              >
                <input
                  type="checkbox"
                  id={optionId}
                  name={name}
                  value={option.value}
                  checked={isChecked}
                  onChange={() => handleToggle(option.value)}
                  className="h-6 w-6 cursor-pointer text-accent focus:ring-accent accent-accent rounded"
                />
                <span className="font-hyperlegible font-semibold text-base">
                  {option.label}
                </span>
              </label>
            );
          })}
        </div>

        {error && (
          <p className="text-red-500 text-sm font-hyperlegible font-semibold mt-1" role="alert">
            {error}
          </p>
        )}
      </fieldset>
    );
  }
);

CheckboxGroup.displayName = 'CheckboxGroup';
export default CheckboxGroup;
