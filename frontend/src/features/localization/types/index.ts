export type LanguageCode = 'en' | 'hi' | 'te' | 'ta' | 'kn' | 'ml' | 'bn' | 'mr' | 'gu';

export interface LanguageDefinition {
  code: LanguageCode;
  name: string;
  nativeName: string;
  isRightToLeft?: boolean;
}

export interface SystemTranslations {
  tutorial: {
    welcome: string;
    instructions: string;
    micPrompt: string;
  };
  errors: {
    network: string;
    micDenied: string;
    speechLowConfidence: string;
    apiTimeout: string;
    unknown: string;
  };
  commands: {
    repeat: string;
    back: string;
    skip: string;
    help: string;
    pause: string;
    resume: string;
    exit: string;
  };
}

export type MultilingualTranslationMap = Record<LanguageCode, Partial<SystemTranslations>>;
export type LocalizedQuestionText = Record<string, string>;
export type LocalizedChoiceOption = Record<string, string>;
export type LocalizedMatrixRow = Record<string, string>;
