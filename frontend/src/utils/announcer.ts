/**
 * Screen Reader Announcer utility.
 * Emits custom events to trigger ARIA live announcements.
 */

export type AnnouncementPoliteness = 'polite' | 'assertive';

export interface AnnouncementEventDetail {
  message: string;
  politeness: AnnouncementPoliteness;
}

/**
 * Trigger an announcement to be read aloud by screen readers.
 * @param message The text content to announce
 * @param politeness The announcement type: 'polite' (default) or 'assertive' (for critical alerts)
 */
export function announce(message: string, politeness: AnnouncementPoliteness = 'polite'): void {
  if (typeof window === 'undefined') return;

  const event = new CustomEvent('saathi-announce', {
    detail: { message, politeness } as AnnouncementEventDetail,
  });
  window.dispatchEvent(event);
}

/**
 * Shortcut to trigger a polite announcement
 */
export const announcePolitely = (message: string) => announce(message, 'polite');

/**
 * Shortcut to trigger an assertive announcement
 */
export const announceAssertively = (message: string) => announce(message, 'assertive');
