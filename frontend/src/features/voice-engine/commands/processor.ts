import { matchVoiceCommand } from './index';
import { CommandToken } from './mappings';

export interface CommandProcessingResult {
  isCommand: boolean;
  commandToken: CommandToken | null;
  rawText: string;
}

export class VoiceCommandProcessor {
  private language: string;

  constructor(lang = 'en') {
    this.language = lang;
  }

  setLanguage(lang: string): void {
    this.language = lang;
  }

  /**
   * Process a transcript phrase to check if it's a structural command
   */
  processTranscript(transcript: string): CommandProcessingResult {
    const matchedToken = matchVoiceCommand(transcript, this.language);
    
    return {
      isCommand: matchedToken !== null,
      commandToken: matchedToken,
      rawText: transcript,
    };
  }
}
export default VoiceCommandProcessor;
