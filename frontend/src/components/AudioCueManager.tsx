'use client';

import React, { useEffect, useCallback, useRef } from 'react';

const CUE_FREQS = {
  WAKE: [261.63, 329.63],
  SUCCESS: [261.63, 329.63, 392.00],
  ALERT: [174.61, 146.83],
  COMPLETE: [261.63, 329.63, 392.00, 523.25],
};

export function AudioCueManager() {
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Lazy-initialize and resume AudioContext on user interaction
  const getAudioContext = useCallback((): AudioContext | null => {
    if (typeof window === 'undefined') return null;
    
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return null;

    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContextClass();
    }
    
    // Automatically resume if suspended by browser security policy
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }

    return audioCtxRef.current;
  }, []);

  // Unlock audio context on first interaction
  useEffect(() => {
    const unlock = () => {
      getAudioContext();
      window.removeEventListener('click', unlock);
      window.removeEventListener('keydown', unlock);
    };
    window.addEventListener('click', unlock);
    window.addEventListener('keydown', unlock);
    return () => {
      window.removeEventListener('click', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, [getAudioContext]);

  const playCue = useCallback((type: 'WAKE' | 'SUCCESS' | 'ALERT' | 'COMPLETE') => {
    const ctx = getAudioContext();
    if (!ctx) return;

    const freqs = CUE_FREQS[type];
    
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.1);
      
      gain.gain.setValueAtTime(0.15, ctx.currentTime + idx * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.1 + 0.3);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(ctx.currentTime + idx * 0.1);
      osc.stop(ctx.currentTime + idx * 0.1 + 0.35);
    });
  }, [getAudioContext]);

  useEffect(() => {
    const handleTrigger = (e: Event) => {
      const customEvent = e as CustomEvent;
      const type = customEvent.detail?.type;
      if (type) playCue(type);
    };

    window.addEventListener('saathi-audio-cue', handleTrigger);
    return () => {
      window.removeEventListener('saathi-audio-cue', handleTrigger);
    };
  }, [playCue]);

  return null;
}

export function triggerAudioCue(type: 'WAKE' | 'SUCCESS' | 'ALERT' | 'COMPLETE'): void {
  if (typeof window === 'undefined') return;
  const event = new CustomEvent('saathi-audio-cue', { detail: { type } });
  window.dispatchEvent(event);
}
export default AudioCueManager;
