'use client';

import React, { useEffect, useState } from 'react';
import { AnnouncementEventDetail } from '../utils/announcer';

export function AriaAnnouncer() {
  const [politeMessage, setPoliteMessage] = useState('');
  const [assertiveMessage, setAssertiveMessage] = useState('');

  useEffect(() => {
    const handleAnnouncement = (e: Event) => {
      const customEvent = e as CustomEvent<AnnouncementEventDetail>;
      const { message, politeness } = customEvent.detail;

      if (politeness === 'assertive') {
        // Force re-triggering by clearing and writing
        setAssertiveMessage('');
        setTimeout(() => setAssertiveMessage(message), 50);
      } else {
        setPoliteMessage('');
        setTimeout(() => setPoliteMessage(message), 50);
      }
    };

    window.addEventListener('saathi-announce', handleAnnouncement);
    return () => {
      window.removeEventListener('saathi-announce', handleAnnouncement);
    };
  }, []);

  return (
    <div className="sr-only" aria-hidden="true">
      {/* Polite Live Region */}
      <div 
        role="status" 
        aria-live="polite" 
        aria-atomic="true"
      >
        {politeMessage}
      </div>

      {/* Assertive Live Region */}
      <div 
        role="alert" 
        aria-live="assertive" 
        aria-atomic="true"
      >
        {assertiveMessage}
      </div>
    </div>
  );
}
export default AriaAnnouncer;
