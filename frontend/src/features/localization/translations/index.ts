import { LanguageDefinition, SystemTranslations, MultilingualTranslationMap } from '../types';

export const LANGUAGE_REGISTRY: LanguageDefinition[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
];

export const translationDictionary: MultilingualTranslationMap = {
  en: {
    tutorial: {
      welcome: 'Welcome to Saathi. Let us practice voice commands.',
      instructions: 'You can say repeat, back, or pause at any time.',
      micPrompt: 'Please grant microphone access to begin voice mode.',
    },
    errors: {
      network: 'Connection lost. Progress has been saved locally.',
      micDenied: 'Microphone permission denied. Switching to screen-reader mode.',
      speechLowConfidence: 'Sorry, I did not catch that. Please repeat.',
      apiTimeout: 'Speech recognition server timed out. Retrying.',
      unknown: 'A system error has occurred.',
    },
    commands: {
      repeat: 'Repeat',
      back: 'Go back',
      skip: 'Skip question',
      help: 'Help instructions',
      pause: 'Pause session',
      resume: 'Resume session',
      exit: 'Exit survey',
    },
  },
  hi: {
    tutorial: {
      welcome: 'साथी में आपका स्वागत है। आइए वॉयस कमांड का अभ्यास करें।',
      instructions: 'आप किसी भी समय दोहराएं, पीछे जाएं या रोकें कह सकते हैं।',
      micPrompt: 'वॉयस मोड शुरू करने के लिए कृपया माइक्रोफ़ोन अनुमति दें।',
    },
    errors: {
      network: 'कनेक्शन टूट गया। आपकी प्रगति स्थानीय रूप से सहेज ली गई है।',
      micDenied: 'माइक्रोफ़ोन अनुमति अस्वीकृत। स्क्रीन-रीडर मोड पर स्विच कर रहे हैं।',
      speechLowConfidence: 'क्षमा करें, मैं समझ नहीं पाया। कृपया फिर से दोहराएं।',
      apiTimeout: 'भाषण पहचान सर्वर का समय समाप्त हो गया। पुनः प्रयास कर रहे हैं।',
      unknown: 'एक सिस्टम त्रुटि हुई है।',
    },
    commands: {
      repeat: 'दोहराएं',
      back: 'पीछे जाएं',
      skip: 'प्रश्न छोड़ें',
      help: 'सहायता निर्देश',
      pause: 'सत्र रोकें',
      resume: 'सत्र फिर से शुरू करें',
      exit: 'सर्वेक्षण से बाहर निकलें',
    },
  },
  te: {
    tutorial: {
      welcome: 'సాథికి స్వాగతం. వాయిస్ ఆదేశాలను ప్రాక్టీస్ చేద్దాం.',
      instructions: 'మీరు ఎప్పుడైనా మళ్ళీ చెప్పండి, వెనక్కి వెళ్ళండి లేదా ఆపండి అని చెప్పవచ్చు.',
      micPrompt: 'వాయిస్ మోడ్‌ను ప్రారంభించడానికి దయచేసి మైక్రోఫోన్ అనుమతిని మంజూరు చేయండి.',
    },
    errors: {
      network: 'కనెక్షన్ కోల్పోయింది. మీ పురోగతి స్థానికంగా సేవ్ చేయబడింది.',
      micDenied: 'మైక్రోఫోన్ అనుమతి నిరాకరించబడింది. స్క్రీన్-రీడర్ మోడ్‌కు మారుతోంది.',
      speechLowConfidence: 'క్షమించండి, నాకు అర్థం కాలేదు. దయచేసి మళ్ళీ చెప్పండి.',
      apiTimeout: 'స్పీచ్ రికగ్నిషన్ సర్వర్ టైమౌట్ అయింది. మళ్లీ ప్రయత్నిస్తోంది.',
      unknown: 'సిస్టమ్ లోపం సంభవించింది.',
    },
    commands: {
      repeat: 'మళ్ళీ చెప్పండి',
      back: 'వెనక్కి వెళ్ళండి',
      skip: 'ప్రశ్న దాటవేయండి',
      help: 'సహాయ సూచనలు',
      pause: 'సెషన్‌ను ఆపివేయండి',
      resume: 'సెషన్‌ను పునఃప్రారంభించండి',
      exit: 'సర్వే నుండి నిష్క్రమించు',
    },
  },
  // Placeholders for fallback routing tests in other languages
  ta: {}, kn: {}, ml: {}, bn: {}, mr: {}, gu: {},
};
