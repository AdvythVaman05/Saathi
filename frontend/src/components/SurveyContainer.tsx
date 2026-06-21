'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useSurveyStore } from '../stores/surveyStore';

interface SurveyContainerProps {
  children: React.ReactNode;
}

export function SurveyContainer({ children }: SurveyContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { currentState } = useSurveyStore();
  const [ariaAnnouncement, setAriaAnnouncement] = useState('');

  useEffect(() => {
    // Relocate focus to the container wrapper when FSM state updates
    if (containerRef.current) {
      containerRef.current.focus();
    }
    
    // Formulate a clean verbal announcement for screen readers
    const stateAlerts: Record<string, string> = {
      LANGUAGE_SELECTION: "Language selection page loaded. Choose English, Hindi, or Telugu.",
      TUTORIAL: "Tutorial loaded. Listen to the voice commands manual.",
      MIC_PERMISSION: "Microphone permission requested. Please select Allow to start voice survey.",
      PERMISSION_DENIED: "Microphone permission was denied. You can retry microphone setup or choose to proceed in Assisted Mode with keyboard inputs.",
      ASSISTED_MODE: "Assisted Mode activated. Large visible controls are enabled. Navigate using Tab and Enter.",
      MANUAL_RESPONSE: "Manual response form is now active. Enter your answer using keyboard controls.",
      QUESTION_READING: "Question loaded and reading aloud.",
      LISTENING: "Microphone is now listening. Speak your answer.",
      PROCESSING: "Analyzing your speech. Please wait.",
      CONFIRMING: "Confirming answer. Please say yes or no.",
      HELP: "Help menu open. Read instructions for this question.",
      PAUSED: "Survey paused. Speak resume to continue.",
      RECOVERY: "Speech recognition retry prompted. Please repeat.",
      ERROR: "System error encountered. Progress saved locally.",
      COMPLETED: "Survey completed. Thank you for your responses.",
    };

    const alertText = stateAlerts[currentState] || `State changed to ${currentState.toLowerCase()}`;
    setAriaAnnouncement(alertText);
  }, [currentState]);

  return (
    <div
      ref={containerRef}
      tabIndex={-1}
      className="outline-none min-h-screen flex flex-col justify-between focus:ring-0"
      role="main"
      aria-label="Survey interface layout container"
    >
      {/* Hidden Aria Live announcer region */}
      <div 
        className="sr-only" 
        role="status" 
        aria-live="polite" 
        aria-atomic="true"
      >
        {ariaAnnouncement}
      </div>

      <div className="flex-1 w-full max-w-4xl mx-auto px-4 py-8 flex flex-col gap-6">
        {children}
      </div>
    </div>
  );
}
export default SurveyContainer;
