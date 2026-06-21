import { SurveyDefinition } from './models/types';

export const demoSurvey: SurveyDefinition = {
  id: 'demo-survey-uuid',
  title: 'Saathi Accessibility & Voice Survey',
  description: 'First end-to-end integration survey testing Saathi accessibility and provider-agnostic voice engines.',
  is_active: true,
  default_language: 'en',
  questions: [
    {
      id: 'q1',
      survey_id: 'demo-survey-uuid',
      order: 1,
      question_type: 'boolean',
      required: true,
      question_text: {
        en: 'Do you have prior experience using voice-first applications?',
        hi: 'क्या आपको वॉयस-फर्स्ट ऐप्स का उपयोग करने का पिछला अनुभव है?',
        te: 'మీకు వాయిస్-ఫస్ట్ అప్లికేషన్లను ఉపయోగించిన అనుభవం ఉందా?',
      },
    },
    {
      id: 'q2',
      survey_id: 'demo-survey-uuid',
      order: 2,
      question_type: 'single_choice',
      required: true,
      question_text: {
        en: 'What is your primary method of navigating websites?',
        hi: 'वेबसाइटों को ब्राउज़ करने का आपका प्राथमिक तरीका क्या है?',
        te: 'వెబ్‌సైట్‌లను బ్రౌజ్ చేయడానికి మీ ప్రాథమిక పద్ధతి ఏమిటి?',
      },
      options: [
        { id: 'opt_screen_reader', text: { en: 'Screen Reader', hi: 'स्क्रीन रीडर', te: 'స్క్రీన్ రీడర్' } },
        { id: 'opt_keyboard', text: { en: 'Keyboard Only', hi: 'केवल कीबोर्ड', te: 'కీబోర్డ్ మాత్రమే' } },
        { id: 'opt_voice', text: { en: 'Voice Commands', hi: 'वॉयस कमांड', te: 'వాయిస్ కమాండ్లు' } },
        { id: 'opt_mouse', text: { en: 'Standard Mouse / Touchpad', hi: 'मानक माउस / टचपैड', te: 'సాధാരണ మౌస్ / టచ్‌ప్యాడ్' } },
      ],
    },
    {
      id: 'q3',
      survey_id: 'demo-survey-uuid',
      order: 3,
      question_type: 'multi_choice',
      required: true,
      question_text: {
        en: 'Which accessibility features do you regularly use?',
        hi: 'आप नियमित रूप से किन एक्सेसिबिलिटी सुविधाओं का उपयोग करते हैं?',
        te: 'మీరు క్రమం తప్పకుండా ఏ యాక్సెసిబిలిటీ ఫీచర్లను ఉపయోగిస్తారు?',
      },
      options: [
        { id: 'opt_high_contrast', text: { en: 'High Contrast Mode', hi: 'हाई कंट्रास्ट मोड', te: 'హై కాంట్రాస్ట్ మోడ్' } },
        { id: 'opt_reduced_motion', text: { en: 'Reduced Motion', hi: 'कम एनीमेशन', te: 'తగ్గించబడిన మోషన్' } },
        { id: 'opt_zoom', text: { en: 'Screen Zoom / Magnification', hi: 'स्क्रीन ज़ूम / आवर्धन', te: 'స్క్రీన్ జూమ్ / మాగ్నిఫికేషన్' } },
        { id: 'opt_captions', text: { en: 'Audio Captions', hi: 'ऑडियो कैप्शन', te: 'ఆడియో క్యాప్షన్లు' } },
      ],
    },
    {
      id: 'q4',
      survey_id: 'demo-survey-uuid',
      order: 4,
      question_type: 'scale',
      required: true,
      question_text: {
        en: 'On a scale of 1 to 5, how comfortable are you with speech-guided systems?',
        hi: '1 से 5 के पैमाने पर, आप आवाज-निर्देशित प्रणालियों के साथ कितने सहज हैं?',
        te: '1 నుండి 5 రేటింగ్‌లో, వాయిస్ గైడెడ్ సిస్టమ్స్‌తో మీరు ఎంత సౌకర్యవంతంగా ఉన్నారు?',
      },
    },
    {
      id: 'q5',
      survey_id: 'demo-survey-uuid',
      order: 5,
      question_type: 'text',
      required: true,
      question_text: {
        en: 'Briefly describe any difficulties you face with standard survey layouts.',
        hi: 'मानक सर्वेक्षण लेआउट के साथ आने वाली कठिनाइयों का संक्षेप में वर्णन करें।',
        te: 'సాధారణ సర్వే లేఅవుట్‌లతో మీరు ఎదుర్కొనే ఇబ్బందులను క్లుప్తంగా వివరించండి.',
      },
    },
    {
      id: 'q6',
      survey_id: 'demo-survey-uuid',
      order: 6,
      question_type: 'boolean',
      required: true,
      question_text: {
        en: 'Do you use an assistive physical aid to navigate offline (e.g., cane)?',
        hi: 'क्या आप ऑफ़लाइन चलने के लिए किसी भौतिक सहायता (जैसे छड़ी) का उपयोग करते हैं?',
        te: 'మీరు నడవడానికి ఏదైనా భౌతిక సాధనాన్ని (ఉదా. కర్ర) ఉపయోగిస్తారా?',
      },
      routing_rules: [
        {
          next_question_id: 'q8',
          conditions: [{ value_equals: 'false' }], // If No, skip Q7 (aid type)
        },
      ],
    },
    {
      id: 'q7',
      survey_id: 'demo-survey-uuid',
      order: 7,
      question_type: 'single_choice',
      required: true,
      question_text: {
        en: 'Which physical aid do you use most frequently?',
        hi: 'आप सबसे अधिक किस भौतिक सहायता का उपयोग करते हैं?',
        te: 'మీరు ఏ భౌతిక సాధనాన్ని ఎక్కువగా ఉపయోగిస్తారు?',
      },
      options: [
        { id: 'opt_cane', text: { en: 'White Cane', hi: 'सफ़ेद छड़ी', te: 'వైట్ కేన్' } },
        { id: 'opt_magnifier', text: { en: 'Handheld Magnifier', hi: 'हैंडहेल्ड आवर्धक लेंस', te: 'చేतिతో పట్టుకునే మాగ్నిఫైయర్' } },
        { id: 'opt_braille', text: { en: 'Refreshable Braille Device', hi: 'रिफ्रेशेबल ब्रेल डिवाइस', te: 'బ్రెయిలీ పరికరం' } },
      ],
    },
    {
      id: 'q8',
      survey_id: 'demo-survey-uuid',
      order: 8,
      question_type: 'scale',
      required: true,
      question_text: {
        en: 'On a scale of 1 to 5, how clear were the voice setup instructions?',
        hi: '1 से 5 के पैमाने पर, आवाज सेटअप निर्देश कितने स्पष्ट थे?',
        te: '1 నుండి 5 రేటింగ్‌లో, వాయిస్ సెటప్ సూచనలు ఎంత స్పష్టంగా ఉన్నాయి?',
      },
    },
    {
      id: 'q9',
      survey_id: 'demo-survey-uuid',
      order: 9,
      question_type: 'multi_choice',
      required: false,
      question_text: {
        en: 'Which regional languages do you speak? (Select all that apply)',
        hi: 'आप कौन सी क्षेत्रीय भाषाएँ बोलते हैं? (सभी लागू चुनें)',
        te: 'మీరు ఏ ప్రాంతీయ భాషలు మాట్లాడతారు? (అన్ని వర్తించేవి ఎంచుకోండి)',
      },
      options: [
        { id: 'opt_hi', text: { en: 'Hindi', hi: 'हिन्दी', te: 'హిందీ' } },
        { id: 'opt_te', text: { en: 'Telugu', hi: 'तेलुगु', te: 'తెలుగు' } },
        { id: 'opt_ta', text: { en: 'Tamil', hi: 'तमिल', te: 'తమిళం' } },
        { id: 'opt_kn', text: { en: 'Kannada', hi: 'कन्नड़', te: 'కన్నడ' } },
        { id: 'opt_ml', text: { en: 'Malayalam', hi: 'मलयालम', te: 'మలయాళం' } },
      ],
    },
    {
      id: 'q10',
      survey_id: 'demo-survey-uuid',
      order: 10,
      question_type: 'text',
      required: false,
      question_text: {
        en: 'Provide any additional feedback about the Saathi Survey Companion.',
        hi: 'साथी सर्वेक्षण साथी के बारे में कोई अतिरिक्त प्रतिक्रिया दें।',
        te: 'సాథి సర్వే కంపానియన్ గురించి ఏదైనా ఇతర అభిప్రాయాన్ని అందించండి.',
      },
    },
  ],
};
