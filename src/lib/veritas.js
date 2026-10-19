export const SENS = [
  'shocking', 'unbelievable', 'miracle', 'secret', 'exposed', 'hoax', 'banned', 'deleted', 'urgent',
  'outrage', 'scandal', 'destroyed', 'bombshell', 'cover-up', 'hate', 'insane', 'terrifying',
  'wake up', 'hidden', 'cure', 'slams', 'stunning', 'breaking', 'jaw-dropping', 'catastrophic',
  'conspiracy', 'you won’t believe', 'you wont believe', 'panic', 'massive coverup',
  'सावधान', 'सच्चाई', 'छुपा', 'ब्रेकिंग', 'સાવધાન', 'વાયરલ', 'છુપાવ',
];

export const CLICK = [
  'you won’t believe', 'share before', 'they don’t want you', 'everyone is saying', 'doctors hate',
  'what happens next', 'forward this', 'share this', 'forward to everyone', 'going viral',
  'before it’s deleted', 'media will never', 'share karo', 'forward karo', 'must watch',
  'शेयर', 'वायरल', 'जल्दी', 'શેર કરો', 'જલ્દી',
];

export const SCAM = [
  'click the link', 'enter your', 'aadhaar', 'otp', 'claim yours', 'offer expires', 'withdraw all',
  'free smartphone', 'free laptop', 'lottery', 'kyc', 'last chance', 'pin number', 'wire money',
  'download apk', 'reward points', 'cashback', 'account suspended',
];

export const GOOD = [
  'according to', 'reported', 'said', 'statement', 'officials', 'spokesperson', 'percent', 'data',
  'study', 'published', 'announced', 'ministry', 'confirmed', 'research', 'reuters', 'associated press',
  'ap news', 'bbc', 'report', 'citing', 'nature', 'science', 'nasa', 'isro', 'who', 'un', 'spokesman',
  'investigation', 'peer-reviewed', 'press release', 'verified',
];

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const normalise = (s) => s.replace(/[’‘]/g, "'");
const found = (list, low) => list.filter((w) => low.includes(normalise(w)));

export function detectLanguage(text) {
  if (/[\u0A80-\u0AFF]/.test(text)) return 'Gujarati';
  if (/[\u0900-\u097F]/.test(text)) return 'Hindi';
  return 'English';
}

export function analyze(raw) {
  const text = raw.slice(0, 4000);
  const low = normalise(text.toLowerCase());
  const words = text.split(/\s+/).filter(Boolean);
  const n = Math.max(words.length, 1);
  const shouting = words.filter((w) => w.length > 3 && w === w.toUpperCase() && /[A-Z]/.test(w)).length / n;
  const exclaims = (text.match(/!/g) || []).length;
  const sens = found(SENS, low);
  const click = found(CLICK, low);
  const scam = found(SCAM, low);
  const good = found(GOOD, low);
  const quoted = (text.match(/["“”]/g) || []).length >= 2;
  const numbers = (text.match(/\d+(\.\d+)?/g) || []).length;

  const emotional = clamp(sens.length * 28 + exclaims * 8, 0, 100);
  const clickbait = clamp(click.length * 40, 0, 100);
  const caps = clamp(shouting * 550, 0, 100);
  const scamBait = clamp(scam.length * 45, 0, 100);
  const sourcing = clamp(good.length * 24 + (quoted ? 18 : 0), 0, 100);
  const facts = clamp(numbers * 22 + (n > 20 ? 15 : 0), 0, 100);

  const risk = emotional * 0.28 + clickbait * 0.28 + caps * 0.16 + scamBait * 0.35;
  const trust = sourcing * 0.5 + facts * 0.25;

  // Calibrated baseline: calm, unmanipulated writing without clickbait starts around 72
  let score;
  if (risk > 35) {
    score = Math.round(clamp(50 - risk * 0.65 + trust * 0.3, 5, 45));
  } else if (risk > 15) {
    score = Math.round(clamp(60 - risk * 0.45 + trust * 0.4, 35, 68));
  } else {
    score = Math.round(clamp(72 + trust * 0.26 - risk * 0.2, 60, 95));
  }

  return {
    score,
    wordCount: words.length,
    language: detectLanguage(text),
    signals: [
      { key: 'emotional', label: 'Emotional language', value: Math.round(emotional), against: true },
      { key: 'clickbait', label: 'Clickbait phrasing', value: Math.round(clickbait), against: true },
      { key: 'caps', label: 'Shouting in caps', value: Math.round(caps), against: true },
      { key: 'scam', label: 'Scam bait', value: Math.round(scamBait), against: true },
      { key: 'sourcing', label: 'Sourcing', value: Math.round(sourcing), against: false },
      { key: 'facts', label: 'Specific facts', value: Math.round(facts), against: false },
    ],
    flags: [...new Set([...sens, ...click, ...scam])],
    trust: [...new Set(good)],
  };
}

export function verdictFor(score) {
  if (score < 40) {
    return { key: 'fake', label: 'Likely fake', note: 'Strong manipulation signals and weak sourcing.' };
  }
  if (score < 65) {
    return { key: 'suspicious', label: 'Suspicious', note: 'Mixed signals. Check the source before you share.' };
  }
  return { key: 'credible', label: 'Looks credible', note: 'Measured tone with attribution and specifics.' };
}

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function segment(text, flags, trust) {
  const lexicon = [
    ...flags.map((w) => ({ w, t: 'flag' })),
    ...trust.map((w) => ({ w, t: 'trust' })),
  ].sort((a, b) => b.w.length - a.w.length);
  const types = {};
  lexicon.forEach((x) => {
    types[normalise(x.w.toLowerCase())] = x.t;
  });
  const out = [];
  const pushPlain = (chunk) => {
    chunk.split(/(\b[A-Z]{4,}\b)/).forEach((part) => {
      if (!part) return;
      out.push({ text: part, type: /^[A-Z]{4,}$/.test(part) ? 'caps' : null });
    });
  };
  if (!lexicon.length) {
    pushPlain(text);
    return out;
  }
  const pattern = lexicon.map((x) => escapeRe(x.w).replace(/'/g, "['’]")).join('|');
  const re = new RegExp(pattern, 'gi');
  let last = 0;
  let m = re.exec(text);
  while (m !== null) {
    if (m[0].length === 0) {
      re.lastIndex += 1;
    } else {
      if (m.index > last) pushPlain(text.slice(last, m.index));
      out.push({ text: m[0], type: types[normalise(m[0].toLowerCase())] || 'flag' });
      last = m.index + m[0].length;
    }
    m = re.exec(text);
  }
  if (last < text.length) pushPlain(text.slice(last));
  return out;
}

export const SAMPLES = [
  {
    label: 'UNESCO Anthem (Rumor)',
    text: 'UNESCO has declared the Indian National Anthem "Jana Gana Mana" as the best national anthem in the world! Proud moment for all citizens. Forward to everyone!',
  },
  {
    label: 'Miracle cure (Fake)',
    text: 'BREAKING!!! Scientists SHOCKED: a common kitchen spice cures diabetes in 3 days. Big pharma is hiding this secret from you. Share before they DELETE this post!',
  },
  {
    label: 'James Webb (World News)',
    text: 'NASA\'s James Webb Space Telescope has captured deep observations of ancient cosmic structures dating back to within 400 million years after the Big Bang, according to research published in Nature.',
  },
  {
    label: 'ATM panic (Hoax)',
    text: 'URGENT: Every ATM in the country will shut for 15 days starting tonight. Withdraw all your money NOW and forward to everyone you know!!!',
  },
  {
    label: 'Free phone (Scam)',
    text: 'Government is giving a free smartphone to every student this week. Click the link and enter your Aadhaar number and OTP to claim yours before the offer expires.',
  },
  {
    label: 'RBI report (Credible)',
    text: 'The Reserve Bank of India kept the repo rate unchanged on Friday, according to a statement released by the central bank. The governor said inflation is expected to ease to 4.2 percent next year, citing lower food prices, Reuters reported.',
  },
];

const CY = { label: 'National Cyber Crime Portal', url: 'https://cybercrime.gov.in' };

export const TOPICS = [
  {
    title: 'Health miracle claims',
    keys: ['cure', 'diabetes', 'cancer', 'doctors hate', 'miracle', 'covid', 'corona'],
    facts: [
      'No single food, spice or home remedy has been shown to cure diabetes, cancer or Covid-19.',
      'Real medical claims come with peer-reviewed evidence, which viral posts rarely have.',
      'Speak to a registered doctor before you change any treatment.',
    ],
    refs: [
      { label: 'WHO myth busters', url: 'https://www.who.int/emergencies/diseases/novel-coronavirus-2019/advice-for-public/myth-busters' },
      { label: 'Ministry of Health', url: 'https://www.mohfw.gov.in' },
    ],
  },
  {
    title: 'Bank and currency rumours',
    keys: ['atm', 'withdraw', 'bank', 'rbi', 'currency', 'cash', 'kyc'],
    facts: [
      'Changes to ATMs, notes or banking rules are announced by the RBI and your own bank, not by forwards.',
      'Banks never ask for an OTP, PIN or password over a call, an SMS or a link.',
      'A forward that demands urgent action is itself a warning sign.',
    ],
    refs: [{ label: 'Reserve Bank of India', url: 'https://www.rbi.org.in' }, CY],
  },
  {
    title: 'Scam links and freebies',
    keys: ['aadhaar', 'otp', 'click the link', 'claim', 'free smartphone', 'free laptop', 'lottery', 'pin number', 'offer expires'],
    facts: [
      'Real government schemes are announced on official .gov.in sites, never through unknown links.',
      'Never share your OTP, PIN or Aadhaar number through a message or a link.',
      'If you already shared details, call your bank at once and report it on the cyber crime portal or helpline 1930.',
    ],
    refs: [CY, { label: 'UIDAI', url: 'https://uidai.gov.in' }],
  },
  {
    title: 'Disaster and weather rumours',
    keys: ['cyclone', 'earthquake', 'flood', 'tsunami', 'storm', 'heatwave'],
    facts: [
      'Official warnings come from the India Meteorological Department and disaster management authorities.',
      'Claims about hidden death tolls or secret dates spread panic without evidence.',
      'Follow your state disaster alerts for real evacuation advice.',
    ],
    refs: [
      { label: 'IMD', url: 'https://mausam.imd.gov.in' },
      { label: 'NDMA', url: 'https://ndma.gov.in' },
    ],
  },
  {
    title: 'Kidnapping and mob rumours',
    keys: ['kidnap', 'child lifter', 'gang'],
    facts: [
      'Forwarded “kidnapping gang” messages have repeatedly been found false, yet innocent people were attacked because of them.',
      'In a real emergency call 112 instead of acting on a forward.',
      'Never share unverified videos that label people as criminals.',
    ],
    refs: [
      { label: 'Alt News', url: 'https://www.altnews.in' },
      { label: 'BOOM', url: 'https://www.boomlive.in' },
    ],
  },
  {
    title: 'Old or out-of-context media',
    keys: ['video', 'viral', 'photo', 'image', 'footage'],
    facts: [
      'Viral videos and photos are often old or from another country, with a new caption.',
      'Run a reverse image search on key frames before you believe the caption.',
      'Check the earliest upload date and who posted it first.',
    ],
    refs: [
      { label: 'Google Lens', url: 'https://lens.google.com' },
      { label: 'Factly', url: 'https://factly.in' },
    ],
  },
  {
    title: 'Job and investment scams',
    keys: ['job offer', 'work from home', 'earn money', 'per day', 'double your money', 'guaranteed return', 'investment', 'crypto', 'registration fee'],
    facts: [
      'Real employers do not charge a fee to give you a job.',
      'Guaranteed or doubled returns are a classic sign of fraud.',
      'Check that a firm is registered with SEBI before you pay anything.',
    ],
    refs: [{ label: 'SEBI', url: 'https://www.sebi.gov.in' }, CY],
  },
];

export const FALLBACK_TOPIC = {
  title: 'General checklist',
  facts: [
    'Find the original source of the message and its date.',
    'Search the main claim together with the words “fact check”.',
    'Forward only what you have verified yourself.',
  ],
  refs: [
    { label: 'Alt News', url: 'https://www.altnews.in' },
    { label: 'BOOM', url: 'https://www.boomlive.in' },
    { label: 'Factly', url: 'https://factly.in' },
  ],
};

export function matchTopics(text, max = 2) {
  const low = text.toLowerCase();
  const ranked = TOPICS.map((t) => ({ t, n: t.keys.filter((k) => low.includes(k)).length }))
    .filter((x) => x.n > 0)
    .sort((a, b) => b.n - a.n)
    .slice(0, max)
    .map((x) => x.t);
  return ranked.length ? ranked : [FALLBACK_TOPIC];
}
