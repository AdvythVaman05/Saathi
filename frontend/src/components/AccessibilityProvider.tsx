'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { usePreferenceStore } from '../stores/preferenceStore';
import { applyTheme } from '../design-system/themes';
import { db } from '../services/db';
import { api } from '../services/api';
import { AriaAnnouncer } from './AriaAnnouncer';
import { syncOfflineAnswers } from '../features/survey-engine/persistence/syncer';
import { telemetry } from '../features/analytics/telemetry';

interface AccessibilityContextProps {
  isLoading: boolean;
  syncPreferences: () => Promise<void>;
}

const AccessibilityContext = createContext<AccessibilityContextProps | undefined>(undefined);

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const prefs = usePreferenceStore();

  // Reconnect online listener for offline answers re-synchronization
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      syncOfflineAnswers();
    };

    window.addEventListener('online', handleOnline);
    
    // Initial sync check on component mount if online
    if (navigator.onLine) {
      syncOfflineAnswers();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  // 1. Initial Load of Preferences from Local Storage / IndexedDB
  useEffect(() => {
    async function loadPreferences() {
      try {
        // Resolve user ID or create a temporary one if none exists
        let userId = localStorage.getItem('saathi_user_id');
        if (!userId) {
          userId = crypto.randomUUID();
          localStorage.setItem('saathi_user_id', userId);
        }
        console.log(`[DIAGNOSTIC] Loading preferences for user ID: ${userId}`);
        prefs.setUserId(userId);

        // Boot up telemetry with current active session
        const activeSessionId = localStorage.getItem('saathi_active_session_id');
        if (activeSessionId) {
          telemetry.init(activeSessionId);
        }

        // Fetch from IndexedDB
        const localPref = await db.preferences.where('user_id').equals(userId).first();
        
        if (localPref) {
          console.log(`[DIAGNOSTIC] Local preferences found in IndexedDB:`, localPref);
          prefs.updatePreference('speechRate', localPref.speech_rate);
          prefs.updatePreference('speechVolume', localPref.speech_volume);
          prefs.updatePreference('textScale', localPref.text_scale);
          prefs.updatePreference('highContrast', localPref.high_contrast === 1);
          prefs.updatePreference('reducedMotion', localPref.reduced_motion === 1);
          prefs.updatePreference('preferredVoice', localPref.preferred_voice);
          prefs.updatePreference('preferredLanguage', localPref.preferred_language);
          
          // Apply active visual settings
          applyTheme(localPref.high_contrast === 1 ? 'high-contrast-dark' : 'standard');
          document.documentElement.style.fontSize = `${localPref.text_scale * 100}%`;
        } else {
          console.log(`[DIAGNOSTIC] Local preferences not found in IndexedDB. Initializing default preferences.`);
          // Check system media query for reduced motion
          const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
          if (motionQuery.matches) {
            prefs.updatePreference('reducedMotion', true);
          }
          
          // Save default configurations to IndexedDB
          await db.preferences.put({
            id: crypto.randomUUID(),
            user_id: userId,
            speech_rate: 1.00,
            speech_volume: 1.00,
            text_scale: 1.00,
            high_contrast: 0,
            reduced_motion: motionQuery.matches ? 1 : 0,
            preferred_voice: 'default',
            preferred_language: 'en',
          });
        }
      } catch (err) {
        console.error('[DIAGNOSTIC] Failed to load accessibility preferences:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadPreferences();
  }, []);

  // 2. Synchronize changes to IndexedDB when store state modifies
  useEffect(() => {
    if (isLoading || !prefs.userId) return;

    const syncToDB = async () => {
      try {
        const userId = prefs.userId!;
        const existing = await db.preferences.where('user_id').equals(userId).first();
        const payload = {
          id: existing?.id || crypto.randomUUID(),
          user_id: userId,
          speech_rate: prefs.speechRate,
          speech_volume: prefs.speechVolume,
          text_scale: prefs.textScale,
          high_contrast: prefs.highContrast ? 1 : 0,
          reduced_motion: prefs.reducedMotion ? 1 : 0,
          preferred_voice: prefs.preferredVoice,
          preferred_language: prefs.preferredLanguage,
        };
        await db.preferences.put(payload);
      } catch (err) {
        console.error('Failed to save preferences locally:', err);
      }
    };

    syncToDB();
  }, [
    prefs.speechRate,
    prefs.speechVolume,
    prefs.textScale,
    prefs.highContrast,
    prefs.reducedMotion,
    prefs.preferredVoice,
    prefs.preferredLanguage,
    prefs.userId,
    isLoading
  ]);

  // 3. Sync preferences with Remote Supabase database via REST API
  const syncPreferences = async () => {
    if (!prefs.userId) return;
    try {
      const payload = {
        speech_rate: prefs.speechRate,
        speech_volume: prefs.speechVolume,
        text_scale: prefs.textScale,
        high_contrast: prefs.highContrast,
        reduced_motion: prefs.reducedMotion,
        preferred_voice: prefs.preferredVoice,
        preferred_language: prefs.preferredLanguage,
      };
      console.log(`[DIAGNOSTIC] Preferences sync started for User ID: ${prefs.userId}`);
      await api.put('/api/users/preferences/', payload, {
        'X-User-ID': prefs.userId,
      });
      console.log(`[DIAGNOSTIC] Preferences sync success for User ID: ${prefs.userId}`);
    } catch (err) {
      console.error(`[DIAGNOSTIC] Preferences sync failure for User ID: ${prefs.userId}:`, err);
      console.warn('Failed to sync preferences to backend:', err);
    }
  };

  // Sync to backend periodically or on major updates
  useEffect(() => {
    if (isLoading || !prefs.userId) return;
    const timer = setTimeout(() => {
      syncPreferences();
    }, 1000); // debounce API syncs
    return () => clearTimeout(timer);
  }, [
    prefs.speechRate,
    prefs.speechVolume,
    prefs.textScale,
    prefs.highContrast,
    prefs.reducedMotion,
    prefs.preferredVoice,
    prefs.preferredLanguage,
    isLoading
  ]);

  return (
    <AccessibilityContext.Provider value={{ isLoading, syncPreferences }}>
      <AriaAnnouncer />
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
}
