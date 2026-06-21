import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
}

export interface LanguageSelectorProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  languages?: LanguageOption[];
  selectedValue?: string;
  onChangeLanguage?: (code: string) => void;
  label?: string;
}

const DEFAULT_LANGS: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
];

export const LanguageSelector = React.forwardRef<HTMLSelectElement, LanguageSelectorProps>(
  ({ className, languages = DEFAULT_LANGS, selectedValue = 'en', onChangeLanguage, label = 'Select Language', ...props }, ref) => {
    return (
      <div className="flex flex-col gap-2 w-full max-w-[280px]">
        <label 
          htmlFor="lang-select" 
          className="font-hyperlegible font-bold text-sm text-muted cursor-pointer"
        >
          {label}
        </label>
        
        <select
          ref={ref}
          id="lang-select"
          value={selectedValue}
          onChange={(e) => onChangeLanguage?.(e.target.value)}
          className={twMerge(
            clsx(
              // Layout and Typography
              'w-full px-4 py-2 font-hyperlegible text-base font-semibold rounded-small bg-secondary border-2 border-muted text-foreground',
              'transition-all duration-150 ease-in-out cursor-pointer min-h-[48px]',
              
              // Focus ring
              'focus:outline-none focus:border-accent focus-visible:outline-none'
            ),
            className
          )}
          {...props}
        >
          {languages.map((lang) => (
            <option key={lang.code} value={lang.code} className="bg-secondary text-foreground">
              {lang.nativeName} ({lang.name})
            </option>
          ))}
        </select>
      </div>
    );
  }
);

LanguageSelector.displayName = 'LanguageSelector';
export default LanguageSelector;
