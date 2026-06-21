'use client';

import React from 'react';
import { usePreferenceStore } from '../stores/preferenceStore';

export function AccessibilitySettings() {
  const {
    highContrast,
    textScale,
    speechRate,
    speechVolume,
    updatePreference,
  } = usePreferenceStore();

  const toggleContrast = () => {
    updatePreference('highContrast', !highContrast);
  };

  const increaseTextScale = () => {
    const nextScale = Math.min(Number(textScale) + 0.25, 2.0);
    updatePreference('textScale', nextScale);
    if (typeof document !== 'undefined') {
      document.documentElement.style.fontSize = `${nextScale * 100}%`;
    }
  };

  const decreaseTextScale = () => {
    const nextScale = Math.max(Number(textScale) - 0.25, 0.75);
    updatePreference('textScale', nextScale);
    if (typeof document !== 'undefined') {
      document.documentElement.style.fontSize = `${nextScale * 100}%`;
    }
  };

  return (
    <div 
      className="p-4 bg-secondary rounded-medium border border-muted"
      role="region" 
      aria-label="Accessibility Settings Panel"
    >
      <h2 className="text-xl font-bold font-hyperlegible mb-4">Accessibility Adjustments</h2>
      
      <div className="flex flex-wrap gap-4 items-center">
        <button
          onClick={toggleContrast}
          className="px-4 py-2 bg-accent text-background rounded-small font-bold cursor-pointer min-h-[48px] min-w-[48px] border-none focus:outline-none"
          aria-label={highContrast ? "Disable High Contrast Theme" : "Enable High Contrast Theme"}
        >
          {highContrast ? "Standard Contrast" : "High Contrast"}
        </button>

        <div className="flex items-center gap-2" role="group" aria-label="Text Scaling controls">
          <button
            onClick={decreaseTextScale}
            className="px-4 py-2 bg-accent text-background rounded-small font-bold cursor-pointer min-h-[48px] min-w-[48px] border-none focus:outline-none"
            aria-label="Decrease text size"
          >
            A-
          </button>
          <span className="font-hyperlegible font-semibold" aria-live="polite">
            Text Size: {Math.round(textScale * 100)}%
          </span>
          <button
            onClick={increaseTextScale}
            className="px-4 py-2 bg-accent text-background rounded-small font-bold cursor-pointer min-h-[48px] min-w-[48px] border-none focus:outline-none"
            aria-label="Increase text size"
          >
            A+
          </button>
        </div>
      </div>
    </div>
  );
}
export default AccessibilitySettings;
