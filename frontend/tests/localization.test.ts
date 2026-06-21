import { questionResolver } from '../src/features/localization/question-localization/resolver';
import { commandResolver } from '../src/features/localization/command-localization/resolver';
import { errorResolver } from '../src/features/localization/error-localization/resolver';
import { codeSwitchDetector } from '../src/features/localization/language-detector/codeswitching';

describe('Saathi Multilingual Foundation Unit Tests', () => {

  describe('Question Translation Resolver & Fallbacks', () => {
    const questionTextMap = {
      en: 'What is your primary method of navigation?',
      hi: 'नेविगेशन का आपका मुख्य तरीका क्या है?',
      te: 'మీ ప్రాథమిక నావిగేషన్ పద్ధతి ఏమిటి?',
    };

    test('Should resolve translation in the selected language', () => {
      const resolvedHi = questionResolver.resolve(questionTextMap, 'hi');
      expect(resolvedHi).toBe(questionTextMap.hi);

      const resolvedTe = questionResolver.resolve(questionTextMap, 'te');
      expect(resolvedTe).toBe(questionTextMap.te);
    });

    test('Should fall back to English if the requested language is missing', () => {
      // Tamil ('ta') is missing from the mock question mapping
      const resolvedTa = questionResolver.resolve(questionTextMap, 'ta');
      expect(resolvedTa).toBe(questionTextMap.en);
    });

    test('Should return empty string if the text map is empty or null', () => {
      const resolved = questionResolver.resolve(null, 'hi');
      expect(resolved).toBe('');
    });
  });

  describe('Commands & Errors Resolvers', () => {
    test('Should resolve static command labels in Hindi', () => {
      const label = commandResolver.resolve('repeat', 'hi');
      expect(label).toBe('दोहराएं');
    });

    test('Should fall back to English command labels if regional is missing', () => {
      // Tamil ('ta') commands are missing from the registry, should fall back to English
      const label = commandResolver.resolve('repeat', 'ta');
      expect(label).toBe('Repeat');
    });

    test('Should resolve error strings politely', () => {
      const label = errorResolver.resolve('network', 'hi');
      expect(label).toBe('कनेक्शन टूट गया। आपकी प्रगति स्थानीय रूप से सहेज ली गई है।');
    });
  });

  describe('Code-Switching Detection', () => {
    test('Should detect code-switching in regional speech containing English keywords', () => {
      // Hindi user speaking: "Mujhe next option select karo" (contains select, option)
      const res = codeSwitchDetector.detect('mujhe next option select karo', 'hi');
      expect(res.isCodeSwitched).toBe(true);
      expect(res.primaryLang).toBe('hi');
      expect(res.mixedLang).toBe('en');
      expect(res.confidence).toBe(0.85);
    });

    test('Should detect code-switching in English speech containing Hindi mixins', () => {
      // English user speaking: "please ruko for a second" (contains ruko)
      const res = codeSwitchDetector.detect('please ruko for a second', 'en');
      expect(res.isCodeSwitched).toBe(true);
      expect(res.primaryLang).toBe('en');
      expect(res.mixedLang).toBe('hi');
    });

    test('Should not trigger code-switch flag if speech is monolingual', () => {
      const res = codeSwitchDetector.detect('दोहराओ', 'hi');
      expect(res.isCodeSwitched).toBe(false);
      expect(res.mixedLang).toBeNull();
    });
  });
});
