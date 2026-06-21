import { commandRegistry, CommandToken } from './mappings';

/**
 * Match a spoken transcript text against the command registry for a specific language.
 * Returns the matched CommandToken, or null if no command matches.
 */
export function matchVoiceCommand(transcript: string, lang: string): CommandToken | null {
  const normalizedInput = transcript.trim().toLowerCase();
  if (!normalizedInput) return null;

  for (const mapping of commandRegistry) {
    const list = mapping.phrases[lang] || mapping.phrases['en'] || [];
    for (const phrase of list) {
      if (normalizedInput === phrase.toLowerCase()) {
        return mapping.token;
      }
    }
  }
  return null;
}
