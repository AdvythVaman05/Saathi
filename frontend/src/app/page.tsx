'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { AccessibilitySettings } from '../components/AccessibilitySettings';
import { useSurveyStore } from '../stores/surveyStore';

export default function LandingPage() {
  const router = useRouter();
  const { currentState, send } = useSurveyStore();

  const handleStart = () => {
    send({ type: 'START_SURVEY' });
    router.push('/survey/demo-survey-uuid');
  };

  return (
    <main className="w-full max-w-4xl mx-auto px-4 py-8 flex flex-col gap-8 justify-center min-h-screen">
      <header className="text-center flex flex-col gap-2">
        <h1 className="text-4xl font-extrabold font-hyperlegible tracking-tight">
          Saathi Survey Companion
        </h1>
        <p className="text-xl text-muted font-hyperlegible">
          A voice-first, high contrast survey platform engineered for maximum accessibility.
        </p>
      </header>

      <div className="flex flex-col gap-6 items-center">
        {currentState === 'IDLE' && (
          <button
            onClick={handleStart}
            className="px-8 py-4 bg-accent text-background text-2xl font-bold rounded-large cursor-pointer min-h-[56px] min-w-[200px] border-none shadow-md hover:bg-opacity-90 focus:outline-none focus:ring-4 focus:ring-focus-ring"
            aria-label="Start survey setup"
          >
            Start Setup
          </button>
        )}
      </div>

      <footer className="mt-8">
        <AccessibilitySettings />
      </footer>
    </main>
  );
}
