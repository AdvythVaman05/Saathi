import { QuestionDefinition } from './models/types';

/**
 * Normalizes speech input by trimming and lowercasing.
 */
function normalize(text: string): string {
  return text.trim().toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "");
}

/**
 * Parse speech transcript to resolve candidate answer values for different question types.
 */
export function parseVoiceAnswer(
  question: QuestionDefinition,
  transcript: string,
  lang: string
): { value: unknown; confidence: number } {
  const norm = normalize(transcript);
  
  if (question.question_type === 'boolean') {
    const yesTerms = ['yes', 'true', 'correct', 'yeah', 'yup', 'हाँ', 'हाँजी', 'అవును', 'avunu', 'avuni'];
    const noTerms = ['no', 'false', 'incorrect', 'nay', 'nope', 'नहीं', 'ना', 'కాదు', 'kaadu', 'lidu'];
    
    const isYes = yesTerms.some(term => norm.includes(term));
    const isNo = noTerms.some(term => norm.includes(term));
    
    if (isYes && !isNo) {
      return { value: true, confidence: 0.95 };
    } else if (isNo && !isYes) {
      return { value: false, confidence: 0.95 };
    }
    
    // Fallback best effort check
    if (norm === 'yes' || norm === 'y') return { value: true, confidence: 0.9 };
    if (norm === 'no' || norm === 'n') return { value: false, confidence: 0.9 };
    
    return { value: null, confidence: 0.2 };
  }
  
  if (question.question_type === 'scale') {
    // Look for numbers 1 to 5
    const wordToNumMap: Record<string, number> = {
      'one': 1, '1': 1, 'एक': 1, 'ఒకటి': 1, 'okati': 1,
      'two': 2, '2': 2, 'दो': 2, 'రెండు': 2, 'rendu': 2,
      'three': 3, '3': 3, 'तीन': 3, 'మూడు': 3, 'moodu': 3,
      'four': 4, '4': 4, 'चार': 4, 'నాలుగు': 4, 'naalugu': 4,
      'five': 5, '5': 5, 'पाँच': 5, 'ఐదు': 5, 'aidu': 5,
    };
    
    for (const [word, num] of Object.entries(wordToNumMap)) {
      if (norm.includes(word)) {
        return { value: num, confidence: 0.9 };
      }
    }
    
    const match = norm.match(/[1-5]/);
    if (match) {
      return { value: parseInt(match[0], 10), confidence: 0.95 };
    }
    
    return { value: null, confidence: 0.2 };
  }
  
  if (question.question_type === 'single_choice' && question.options) {
    // 1. Check direct matches of option text (in active language or English fallback)
    for (const option of question.options) {
      const optionText = option.text[lang]?.toLowerCase() || option.text['en']?.toLowerCase() || '';
      if (optionText && norm.includes(normalize(optionText))) {
        return { value: option.id, confidence: 0.95 };
      }
    }
    
    // 2. Check option index words (option 1, option 2, first, second, etc.)
    const indexWords = [
      { keys: ['first', '1', 'one', 'पहला', 'पहला विकल्प', 'మొదటి', 'modati'], idx: 0 },
      { keys: ['second', '2', 'two', 'दूसरा', 'दूसरा विकल्प', 'రెండవ', 'rendava'], idx: 1 },
      { keys: ['third', '3', 'three', 'तीसरा', 'तीसरा विकल्प', 'మూడవ', 'moodava'], idx: 2 },
      { keys: ['fourth', '4', 'four', 'चौथा', 'चौथा विकल्प', 'నాలుగవ', 'naalugava'], idx: 3 },
      { keys: ['fifth', '5', 'five', 'पांचवा', 'ఐదవ', 'aidava'], idx: 4 },
    ];
    
    for (const pair of indexWords) {
      if (pair.idx < question.options.length) {
        if (pair.keys.some(k => norm.includes(k))) {
          return { value: question.options[pair.idx].id, confidence: 0.85 };
        }
      }
    }
    
    return { value: null, confidence: 0.2 };
  }
  
  if (question.question_type === 'multi_choice' && question.options) {
    const selectedIds: string[] = [];
    
    // Check which option text or index words appear in the transcript
    question.options.forEach((option, optionIdx) => {
      const optionText = option.text[lang]?.toLowerCase() || option.text['en']?.toLowerCase() || '';
      const matchesText = optionText && norm.includes(normalize(optionText));
      
      const optionKeywords: Record<number, string[]> = {
        0: ['first', '1', 'one', 'पहला', 'మొదటి', 'modati'],
        1: ['second', '2', 'two', 'दूसरा', 'రెండవ', 'rendava'],
        2: ['third', '3', 'three', 'तीसरा', 'मूడవ', 'moodava'],
        3: ['fourth', '4', 'four', 'चौथा', 'నాలుగవ', 'naalugava'],
        4: ['fifth', '5', 'five', 'भारत', 'ఐదవ', 'aidava'],
      };
      
      const matchesIndex = optionKeywords[optionIdx]?.some(k => norm.includes(k));
      
      if (matchesText || matchesIndex) {
        selectedIds.push(option.id);
      }
    });
    
    if (selectedIds.length > 0) {
      return { value: selectedIds, confidence: 0.85 };
    }
    
    return { value: [], confidence: 0.3 };
  }
  
  if (question.question_type === 'text' || question.question_type === 'audio_response') {
    // Text returns raw transcription directly with high confidence
    return { value: transcript.trim(), confidence: 0.95 };
  }
  
  return { value: transcript, confidence: 0.5 };
}
