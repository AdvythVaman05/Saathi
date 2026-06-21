export type CommandToken = 'repeat' | 'back' | 'skip' | 'help' | 'pause' | 'resume' | 'exit';

export interface CommandMapping {
  token: CommandToken;
  phrases: Record<string, string[]>; // Map language codes to matching phrases
}

export const commandRegistry: CommandMapping[] = [
  {
    token: 'repeat',
    phrases: {
      en: ['repeat', 'say again', 'repeat question', 'pardon'],
      hi: ['दोहराओ', 'dohrao', 'फिर से बोलो', 'fir se bolo', 'wapas bolo'],
      te: ['మళ్ళీ చెప్పు', 'malli cheppu', 'మరోసారి', 'marosari'],
    },
  },
  {
    token: 'back',
    phrases: {
      en: ['back', 'go back', 'previous', 'previous question'],
      hi: ['पीछे जाओ', 'piche jao', 'वापस', 'wapas', 'piche'],
      te: ['వెనక్కి వెళ్ళు', 'venakki vellu', 'వెనుకకు', 'venukaku'],
    },
  },
  {
    token: 'skip',
    phrases: {
      en: ['skip', 'pass', 'skip question', 'next'],
      hi: ['छोड़ो', 'chodo', 'आगे बढ़ो', 'aage badho', 'skip karo'],
      te: ['దాటవేయి', 'daataveyi', 'వదిలేయ్', 'vadiley', 'skip chey'],
    },
  },
  {
    token: 'help',
    phrases: {
      en: ['help', 'instructions', 'what to do', 'explain'],
      hi: ['मदद', 'madad', 'सहायता', 'sahaayata', 'help me'],
      te: ['సహాయం', 'sahaayam', 'సహాయం కావాలి', 'sahaayam kaavali'],
    },
  },
  {
    token: 'pause',
    phrases: {
      en: ['pause', 'stop', 'pause listening', 'hold'],
      hi: ['रोको', 'roko', 'रुक जाओ', 'ruk jao', 'pause karo'],
      te: ['ఆపు', 'aapu', 'ఆపండి', 'aapandi'],
    },
  },
  {
    token: 'resume',
    phrases: {
      en: ['resume', 'continue', 'start listening', 'go ahead'],
      hi: ['शुरू करो', 'shuru karo', 'चालू करो', 'chalu karo', 'resume karo'],
      te: ['మళ్ళీ ప్రారంభించు', 'malli prarambhinchu', 'కొనసాగించు', 'konasaaginchu'],
    },
  },
  {
    token: 'exit',
    phrases: {
      en: ['exit', 'close', 'quit', 'end survey'],
      hi: ['बाहर निकलो', 'bahar jao', 'बंद करो', 'band karo', 'exit karo'],
      te: ['బయటికి వెళ్ళు', 'bayatiki vellu', 'ముగించు', 'muginchu'],
    },
  },
];
