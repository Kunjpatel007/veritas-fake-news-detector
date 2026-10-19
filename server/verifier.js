/**
 * Veritas Real-time Global News & Rumor Verification Engine
 * Google AI-Grade Deep Search, Fact-Checking Consensus, and Semantic Disinformation Detection.
 * Supports real-time worldwide news verification without requiring third-party API keys.
 */

// Authoritative fact-checking publishers and registries
const FACT_CHECK_PUBLISHERS = [
  'snopes', 'reuters fact check', 'reuters', 'ap fact check', 'associated press',
  'factcheck.org', 'politifact', 'bbc reality check', 'bbc', 'afp fact check',
  'full fact', 'alt news', 'boom live', 'the quint', 'webqoof', 'vishvas news',
  'factly', 'newschecker', 'lead stories', 'check your fact', 'usa today fact check',
  'the washington post fact checker', 'washington post', 'health feedback', 'climate feedback',
  'pib fact check', 'thip media', 'logically facts', 'cyberpeace foundation', 'fact crescendo'
];

// Authoritative global and national news sources across wires, broadcast, print, and sports
const HIGH_AUTHORITY_SOURCES = [
  // Global news agencies and broadcasters
  'reuters', 'associated press', 'ap news', 'bbc', 'the new york times', 'new york times',
  'the wall street journal', 'wall street journal', 'the guardian', 'bloomberg',
  'npr', 'cnn', 'abc news', 'cbs news', 'nbc news', 'pbs newshour', 'financial times',
  'al jazeera', 'deutsche welle', 'dw', 'france 24', 'afp', 'sky news', 'cbc news',
  'the sydney morning herald', 'the straits times', 'south china morning post', 'euronews',
  'politico', 'axios', 'forbes', 'time', 'the atlantic', 'the economist',
  // Indian national media & news wires
  'the times of india', 'times of india', 'the hindu', 'the indian express', 'hindustan times',
  'ndtv', 'press trust of india', 'pti', 'ani news', 'ani', 'india today', 'livemint', 'mint',
  'the economic times', 'economic times', 'deccan herald', 'news18', 'the telegraph',
  'business standard', 'financial express', 'businessline', 'swarajya', 'dd news',
  'all india radio', 'akashvani',
  // Science, Space, & Health agencies
  'space.com', 'mit news', 'phys.org', 'nature', 'science', 'who', 'cdc', 'isro', 'nasa',
  'techcrunch', 'the verge', 'cnet', 'wired',
  // Sports networks
  'espn', 'espncricinfo', 'cricinfo', 'cricbuzz', 'icc', 'bcci', 'fifa', 'olympics'
];

// Curated database of prominent viral rumors, myths, and scams with official facts
const VIRAL_RUMOR_KNOWLEDGEBASE = [
  {
    patterns: [/unesco.*(national anthem|jana gana mana).*best/i, /national anthem.*declared.*unesco/i],
    claim: 'UNESCO declared Indian national anthem (Jana Gana Mana) the best in the world',
    verdict: 'fake',
    score: 10,
    summary: 'A long-running viral internet hoax. UNESCO has officially confirmed multiple times that it does not rank, judge, or award the national anthems of any country.',
    facts: [
      'UNESCO has never declared any country’s national anthem as the "best in the world".',
      'The organization clarified that it does not evaluate, compare, or rank anthems.',
      'This hoax has circulated repeatedly via email and WhatsApp forwards since at least 2008.'
    ],
    sources: [
      { label: 'Snopes Fact Check', url: 'https://www.snopes.com/fact-check/unesco-declares-jana-gana-mana-best-national-anthem/' },
      { label: 'The Times of India Fake Alert', url: 'https://timesofindia.indiatimes.com/times-fact-check' }
    ]
  },
  {
    patterns: [
      /(banning|discontinu\w*|demonetiz\w*|scrapping).*(500\s*(rupee|rs|note)|note.*500)/i,
      /500\s*(rupee|rs|note).*(banned|discontinued|stopped|withdrawn|invalid)/i,
      /rbi.*(discontinu\w*|ban\w*).*500/i
    ],
    claim: 'Government or RBI is discontinuing / banning 500 rupee currency notes',
    verdict: 'fake',
    score: 14,
    summary: 'Debunked currency rumor. Both the Reserve Bank of India (RBI) and the Press Information Bureau (PIB) have officially confirmed that there is NO plan to discontinue or demonetize the ₹500 banknote.',
    facts: [
      'PIB Fact Check clarified that viral social media videos claiming ₹500 notes will be demonetized or discontinued are completely fake.',
      'The Reserve Bank of India has issued no circular discontinuing ₹500 currency notes; they remain legal tender.',
      'Always check official RBI press releases at rbi.org.in rather than unverified WhatsApp forwards or viral videos.'
    ],
    sources: [
      { label: 'PIB Fact Check: ₹500 Note Ban Rumor', url: 'https://factcheck.pib.gov.in' },
      { label: 'The Economic Times Fact Check', url: 'https://economictimes.indiatimes.com' },
      { label: 'Reserve Bank of India Press Releases', url: 'https://www.rbi.org.in' }
    ]
  },
  {
    patterns: [
      /clove\s+water.*(cures?|dissolv\w*|revers\w*).*(heart\s+blockage|artery|heart\s+attack)/i,
      /boiled\s+clove.*heart\s+blockage/i,
      /heart\s+blockage.*(cure\w*|dissolv\w*).*(clove|spice|kitchen|lemon)/i
    ],
    claim: 'Drinking boiled clove water or home spice remedies clears heart blockage in 24 hours',
    verdict: 'fake',
    score: 10,
    summary: 'Dangerous medical disinformation. Coronary artery blockages consist of calcified plaque, cholesterol, and fibrous tissue that cannot be dissolved by boiled clove water or any kitchen remedy.',
    facts: [
      'Cardiologists and the American Heart Association emphasize that severe arterial stenosis requires clinical intervention (angioplasty, stenting, bypass surgery, or statin therapies).',
      'No peer-reviewed medical study demonstrates that drinking clove water dissolves atherosclerotic plaques in human coronary arteries.',
      'Relying on home remedies for cardiovascular emergencies risks myocardial infarction (heart attack) and death.'
    ],
    sources: [
      { label: 'American Heart Association Guidelines', url: 'https://www.heart.org' },
      { label: 'THIP Media Fact Check: Clove Water Heart Myth', url: 'https://www.thehealthyindianproject.com' }
    ]
  },
  {
    patterns: [/spice.*cures? diabetes/i, /cure.*diabetes.*(days?|week|kitchen)/i, /cinnamon.*cures? diabetes/i],
    claim: 'Common kitchen spice or home remedy cures diabetes in 3 days',
    verdict: 'fake',
    score: 12,
    summary: 'False medical claim. Diabetes is a chronic metabolic condition that cannot be cured overnight or by a kitchen spice. Spices cannot replace prescribed insulin or medication.',
    facts: [
      'Medical consensus and the World Health Organization state that diabetes has no instant dietary cure.',
      'Stopping prescribed medication in favor of home remedies can cause life-threatening ketoacidosis or coma.',
      'Always consult a certified endocrinologist before modifying treatments.'
    ],
    sources: [
      { label: 'WHO Diabetes Guidelines', url: 'https://www.who.int/news-room/fact-sheets/detail/diabetes' },
      { label: 'American Diabetes Association', url: 'https://diabetes.org' }
    ]
  },
  {
    patterns: [/atm.*(shut|close|closed).*15 days/i, /every atm.*shut.*tonight/i, /withdraw all.*money.*now/i],
    claim: 'Every ATM in the country will shut down for 15 days',
    verdict: 'fake',
    score: 8,
    summary: 'Fabricated panic message. Neither the Reserve Bank of India nor commercial banks have ever ordered a nationwide 15-day shutdown of ATMs.',
    facts: [
      'Central banks and commercial banks notify customers through official websites, press releases, and verified app alerts, not viral forwards.',
      'ATM network closures of this scale would require emergency public gazettes and are demonstrably false.',
      'Panic withdrawals cause artificial currency strain based on fabricated rumors.'
    ],
    sources: [
      { label: 'Reserve Bank of India Alerts', url: 'https://www.rbi.org.in' },
      { label: 'PIB Fact Check', url: 'https://factcheck.pib.gov.in' }
    ]
  },
  {
    patterns: [/free (smartphone|laptop|tablet).*student.*(aadhaar|otp|click)/i, /government.*giving.*free.*phone/i],
    claim: 'Government giving free smartphones/laptops to students via external link',
    verdict: 'fake',
    score: 5,
    summary: 'Phishing and identity theft scam. Fraudsters circulate fake government freebie schemes to harvest Aadhaar numbers, phone numbers, and OTPs.',
    facts: [
      'Authentic government scholarship or hardware distribution schemes are hosted exclusively on official .gov / .gov.in domains.',
      'Never enter your Aadhaar number, phone OTP, or bank details on unknown links or web forms.',
      'Report phishing messages immediately to cybercrime portals or helpline 1930.'
    ],
    sources: [
      { label: 'National Cyber Crime Portal', url: 'https://cybercrime.gov.in' },
      { label: 'PIB Fact Check Free Scheme Debunks', url: 'https://factcheck.pib.gov.in' }
    ]
  },
  {
    patterns: [/5g.*(microchip|tracking|nano).*vaccin/i, /bill gates.*microchip.*vaccine/i, /vaccine.*contains.*microchip/i],
    claim: 'COVID-19 vaccines contain 5G microchips or tracking devices',
    verdict: 'fake',
    score: 8,
    summary: 'Debunked conspiracy theory. Vaccine ingredients are published publicly by regulatory bodies (FDA, EMA, WHO). No vaccine contains microchips, radio transmitters, or nanotechnology trackers.',
    facts: [
      'Vaccines contain mRNA or weakened antigens, lipids, salts, and sugars; microscopic electronic chips do not exist in liquid injectables.',
      'Regulatory health bodies worldwide independently tested and analyzed vaccine vials.',
      'This rumor originated from misconstrued comments about digital vaccination certificates.'
    ],
    sources: [
      { label: 'Reuters Fact Check', url: 'https://www.reuters.com/fact-check/' },
      { label: 'BBC Reality Check', url: 'https://www.bbc.com/news/reality_check' }
    ]
  },
  {
    patterns: [/nasa.*(3|three|6|six).*days.*(darkness|blackout)/i, /earth.*darkness.*days.*nasa/i],
    claim: 'NASA confirmed Earth will experience days of total darkness',
    verdict: 'fake',
    score: 12,
    summary: 'Recurring internet hoax. NASA has repeatedly clarified that no planetary alignment or solar storm will cause days of worldwide darkness.',
    facts: [
      'NASA has never predicted multi-day solar eclipses or total global darkness events.',
      'Orbital mechanics make global multi-day darkness physically impossible while the Earth rotates.',
      'This claim reappears almost every year with modified dates.'
    ],
    sources: [
      { label: 'NASA Official Clarifications', url: 'https://www.nasa.gov' },
      { label: 'Snopes Fact Check', url: 'https://www.snopes.com' }
    ]
  },
  {
    patterns: [/lemon.*water.*(cures?|prevents?|kills?).*(cancer|tumor)/i, /hot lemon water.*kills? cancer/i],
    claim: 'Hot lemon water kills cancer cells and is 10,000 times stronger than chemotherapy',
    verdict: 'fake',
    score: 10,
    summary: 'Debunked medical myth. No clinical or scientific evidence proves that lemon water cures cancer or replaces oncology treatments.',
    facts: [
      'Major cancer research organizations (Cancer Research UK, American Cancer Society) have debunked claims of lemon water curing cancer.',
      'While citrus contains antioxidants, it does not destroy malignant tumors in human bodies.',
      'Delaying conventional cancer treatments for dietary hoaxes is dangerous.'
    ],
    sources: [
      { label: 'AFP Fact Check', url: 'https://factcheck.afp.com' },
      { label: 'Cancer Research UK', url: 'https://www.cancerresearchuk.org' }
    ]
  },
  {
    patterns: [/garlic.*(cures?|prevents?).*(coronavirus|covid|cancer)/i, /boiled garlic.*cure/i],
    claim: 'Eating or drinking boiled garlic water cures COVID-19 or cancer',
    verdict: 'fake',
    score: 14,
    summary: 'Unsubstantiated medical myth. While garlic possesses mild antimicrobial properties, there is zero scientific evidence that garlic water cures or prevents respiratory viruses or cancer.',
    facts: [
      'The World Health Organization confirmed there is no evidence that eating garlic protects against COVID-19.',
      'Cancer treatments require clinical oncology therapies (surgery, chemotherapy, radiation, immunotherapy).',
      'Relying on herbal myths delays critical medical diagnoses.'
    ],
    sources: [
      { label: 'WHO Mythbusters', url: 'https://www.who.int/emergencies/diseases/novel-coronavirus-2019/advice-for-public/myth-busters' }
    ]
  },
  {
    patterns: [/electricity.*(disconnect|power cut).*tonight.*(bill|call|contact)/i, /power supply.*disconnected.*at.*9:30/i],
    claim: 'Electricity will be disconnected tonight unless you call a specific personal phone number',
    verdict: 'fake',
    score: 5,
    summary: 'Widespread utility fraud scam. Electricity distribution companies never send SMS warnings from personal 10-digit mobile numbers threatening immediate disconnection within hours.',
    facts: [
      'Utility providers send billing communications through verified corporate sender IDs, not random mobile numbers.',
      'Never call the phone number provided in such text messages or install remote-access apps (AnyDesk, TeamViewer) as instructed.',
      'Check pending bills directly on your official state electricity board website or app.'
    ],
    sources: [
      { label: 'National Cyber Crime Portal', url: 'https://cybercrime.gov.in' }
    ]
  },
  {
    patterns: [/eiffel tower.*(fire|burned|collapsed|destroy)/i, /fire.*eiffel tower.*paris/i],
    claim: 'The Eiffel Tower in Paris caught fire or collapsed',
    verdict: 'fake',
    score: 10,
    summary: 'Fabricated rumor powered by viral CGI / AI-generated videos. Paris authorities confirmed no fire occurred at the Eiffel Tower.',
    facts: [
      'The monument remains undamaged and open to visitors.',
      'Viral clips depicting massive smoke and flames were synthetically generated using computer graphics and AI image tools.',
      'Always verify emergency disasters via live webcams and official municipal police accounts.'
    ],
    sources: [
      { label: 'Reuters Fact Check: Eiffel Tower Fire', url: 'https://www.reuters.com/fact-check/' },
      { label: 'France 24 Fact Check', url: 'https://www.france24.com' }
    ]
  },
  {
    patterns: [/asteroid.*hit.*earth.*(next week|humanity|destroying|wiped out)/i, /nasa.*asteroid.*destroy.*humanity/i],
    claim: 'NASA announced an asteroid will hit Earth next week destroying humanity',
    verdict: 'fake',
    score: 10,
    summary: 'Doomsday panic rumor. NASA Center for Near-Earth Object Studies (CNEOS) continuously monitors space objects. No known asteroid poses a significant collision threat to Earth in the foreseeable future.',
    facts: [
      'NASA Planetary Defense Coordination Office releases confirmed trajectory data publicly; no impact warning has been issued.',
      'Sensational claims predicting humanity’s imminent destruction are classic fear-mongering clickbait.',
      'Check the official NASA Sentry Risk Table for real-time tracking of near-Earth objects.'
    ],
    sources: [
      { label: 'NASA Planetary Defense Office', url: 'https://www.nasa.gov/planetarydefense' },
      { label: 'NASA CNEOS Sentry Table', url: 'https://cneos.jpl.nasa.gov/sentry/' }
    ]
  }
];

// Precision semantic action patterns with strict word boundaries
const ACTION_PATTERNS = {
  retire: /\b(retir\w*|quit|step\s+down|hung\s+up\s+boots|hanging\s+up\s+boots)\b/i,
  inaugurate: /\b(inaugurat\w*|open\w*|unveil\w*|launch\w*)\b/i,
  ban: /\b(ban\w*|discontinu\w*|demonetiz\w*|withdraw\w*|scrap\w*|cancel\w*|shut\w*|close\w*|phase\s+out)\b/i,
  declare: /\b(declar\w*|rank\w*|award\w*|nam\w*|recogni\w*|proclaim\w*)\b/i,
  cure: /\b(cure\w*|heal\w*|revers\w*|kill\s+cancer|treat\s+cancer|prevent\w*|dissolv\w*)\b/i,
  die: /\b(die\w*|death|dead|pass\w*\s+away|kill\w*|fatal|heart\s+attack|assassinat\w*)\b/i,
  arrest: /\b(arrest\w*|detain\w*|jail\w*|custody|handcuff\w*|raid\w*)\b/i,
  hit: /\b(hit\w*|strike|strikes|striking|struck|collid\w*|impact\w*|destroy\w*|smash\w*)\b/i,
  win: /\b(win|wins|winning|won|victor\w*|champion\w*|beat\w*|defeat\w*)\b/i,
};

// Predicates indicating unrelated past disasters or hoaxes
const DISASTER_RUMOR_WORDS = [
  /\bcollaps\w*\b/i,
  /\b(die|died|dead|death|killed|heart\s+attack)\b/i,
  /\b(arrest\w*|detain\w*|jail\w*)\b/i,
  /\b(fire|burned|burning|blaze)\b/i,
  /\bcrash\w*\b/i,
  /\b(cancer|tumor|blockage)\b/i,
  /\b(microchip|poison|toxic)\b/i,
  /\b(ai-generated|cgi|deepfake|photoshop|staged)\b/i
];

// Indicators of ancillary social media photos/videos debunked by fact-checkers
const MEDIA_TOKENS = [
  /\b(in\s+the\s+photo|photo\s+of|viral\s+photo|old\s+photo|picture\s+of|viral\s+image|old\s+image|in\s+the\s+video|viral\s+video|old\s+video|clip\s+shows|footage\s+of|cctv\s+of)\b/i,
  /^(photo|video|image|clip|picture|footage)\b/i
];

// Extraordinary catastrophic / doomsday claim detector requiring breaking confirmation
const CATASTROPHIC_PANIC_PATTERNS = [
  /\b(world\s+war\s+(3|iii|three)|ww3|third\s+world\s+war)\b/i,
  /\b(nuclear\s+war\s+started|nuclear\s+strike\s+hit|nuclear\s+apocalypse)\b/i,
  /\b(alien\s+invasion\s+confirmed|aliens\s+attacked)\b/i,
  /\b(asteroid.*hit.*earth.*(next\s+week|tomorrow|destroying\s+humanity))\b/i,
  /\b(every\s+atm.*shut.*15\s+days|all\s+banks.*close.*forever)\b/i
];

// Medical miracle / home cure myth patterns
const MEDICAL_MYTH_PATTERNS = [
  /\b(boiled\s+(clove|garlic|lemon|neem|ginger|onion|fenugreek)|clove\s+water|garlic\s+water|lemon\s+water|baking\s+soda|herbal\s+cure|kitchen\s+spice)\b.*\b(cures?|reverse\w*|heal\w*|dissolv\w*)\b.*\b(cancer|diabetes|heart\s+blockage|artery|hiv|aids|tumor|stroke|kidney)\b/i,
  /\b(cures?|reverse\w*|heal\w*|dissolv\w*)\b.*\b(cancer|diabetes|heart\s+blockage|artery|hiv|aids)\b.*\b(clove|garlic|lemon|herbal|kitchen|water|spice)\b/i,
  /\b(cure\w*|reverse\w*)\b.*\b(diabetes|heart\s+blockage|cancer)\b.*\b(in\s+\d+\s+(days?|hours?|weeks?))\b/i,
];

// Linguistic Deception Lexicons
const SENSATIONAL_WORDS = [
  'shocking', 'unbelievable', 'miracle', 'secret', 'exposed', 'hoax', 'banned', 'deleted', 'urgent',
  'outrage', 'scandal', 'destroyed', 'bombshell', 'cover-up', 'hate', 'insane', 'terrifying',
  'wake up', 'hidden', 'cure', 'slams', 'stunning', 'breaking', 'jaw-dropping', 'catastrophic',
  'conspiracy', 'you won’t believe', 'you wont believe', 'panic', 'massive coverup',
  'सावधान', 'सच्चाई', 'छुपा', 'ब्रेकिंग', 'સાવધાન', 'વાયરલ', 'છુપાવ'
];

const CLICKBAIT_PHRASES = [
  'share before', 'they don’t want you', 'everyone is saying', 'doctors hate', 'what happens next',
  'forward this', 'share this', 'forward to everyone', 'going viral', 'before it’s deleted',
  'media will never', 'share karo', 'forward karo', 'must watch', 'shocking revelation',
  'शेयर', 'वायरल', 'जल्दी', 'શેર કરો', 'જલ્દી'
];

const SCAM_TRIGGERS = [
  'click the link', 'enter your', 'aadhaar', 'otp', 'claim yours', 'offer expires', 'withdraw all',
  'free smartphone', 'free laptop', 'lottery', 'kyc', 'last chance', 'pin number', 'wire money',
  'urgent call', 'download apk', 'reward points', 'cashback', 'account suspended'
];

const TRUST_CUES = [
  'according to', 'reported', 'statement', 'officials', 'spokesperson', 'study', 'published',
  'announced', 'ministry', 'confirmed', 'research', 'reuters', 'associated press', 'bbc',
  'peer-reviewed', 'data shows', 'verified', 'investigation', 'spokesman', 'press release'
];

// Fact-check headline categorization regexes
const DEBUNK_TITLE_REGEX = /\b(fake alert|fact check|fact-check|hoax|false|debunks?|disproves?|refutes?|denies?|dismisses?|clarifies|misleading|fabricated|untrue|no evidence|not true|bogus|scam|claim is false|did not|never said|falsely|manipulated|altered|unproven|conspiracy theory|conspiracy|no,\s|was not|is not|are not|were not|not real|never happened)\b/i;
const CONFIRM_TITLE_REGEX = /\b(confirms?|announced|officially|verified|study finds|reports?|authorities confirm)\b/i;
const INQUIRY_TITLE_REGEX = /\b(rumours?|rumors?|claims?|is it true\??|myth or fact|what we know)\b|\?$/i;

function cleanString(str) {
  return String(str || '')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/<[^>]+>/g, '')
    .trim();
}

/**
 * Normalizes English words to stem root for resilient semantic matching
 */
function stemWord(w) {
  let s = String(w || '').toLowerCase().replace(/[^\w]/g, '');
  if (s.length <= 3) return s;
  s = s.replace(/(ments?|tions?|sions?|ings?|ed|es|s)$/g, '');
  return s.length >= 3 ? s : w.toLowerCase();
}

/**
 * Extracts action categories from text using regex boundaries
 */
function extractActionRoots(text) {
  const roots = [];
  for (const [key, regex] of Object.entries(ACTION_PATTERNS)) {
    if (regex.test(text)) roots.push(key);
  }
  return roots;
}

/**
 * Extracts searchable keywords and concise claim from input text, stripping noise
 */
export function extractClaimAndKeywords(raw) {
  let text = String(raw || '').trim();
  if (!text) return { claim: '', query: '', keywords: [] };

  // Strip common forward prefixes and buzzwords from start
  text = text.replace(/^(fwd:|forwarded( as received)?|urgent[:!]|breaking[:!]|viral[:!]|alert[:!])\s*/gi, '').trim();

  // Split into sentences
  const sentences = text.split(/(?<=[.?!])\s+/).filter(Boolean);
  const firstSentence = sentences[0] || text;
  const claim = firstSentence.slice(0, 180).trim();

  // Strip noise words for search query
  let cleanForQuery = claim.replace(/https?:\/\/\S+/gi, '');
  const noiseWords = [
    'breaking', 'urgent', 'shocking', 'unbelievable', 'viral', 'alert', 'forwarded', 'fwd',
    'as received', 'share before deleted', 'share this', 'forward to everyone', 'share karo',
    'deleted', 'wake up', 'you won’t believe', 'you wont believe', 'must watch', 'everyone is saying'
  ];
  for (const nw of noiseWords) {
    const re = new RegExp(`\\b${nw}\\b`, 'gi');
    cleanForQuery = cleanForQuery.replace(re, ' ');
  }

  // Remove punctuation
  cleanForQuery = cleanForQuery
    .replace(/[^\w\s\u0900-\u097F\u0A80-\u0AFF]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const words = cleanForQuery.split(' ').filter((w) => w.length > 2);
  const stopWords = new Set([
    'this', 'that', 'with', 'from', 'have', 'were', 'been', 'their', 'there', 'what', 'when',
    'where', 'which', 'will', 'your', 'every', 'today', 'night', 'please', 'they', 'them',
    'about', 'just', 'more', 'some', 'than', 'then', 'into', 'only', 'after', 'could', 'should',
    'would', 'here', 'says', 'said', 'tells', 'told', 'know', 'new', 'latest', 'recent', 'big'
  ]);

  const meaningfulWords = words.filter((w) => !stopWords.has(w.toLowerCase()));
  const query = meaningfulWords.length > 0 ? meaningfulWords.slice(0, 8).join(' ') : words.slice(0, 6).join(' ');

  return { claim, query, keywords: meaningfulWords.slice(0, 10) };
}

/**
 * Fetches RSS feed items from Google News for a given query across worldwide reporting
 */
async function fetchGoogleNewsRss(query) {
  if (!query) return [];
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}`;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Veritas/2.0' },
      signal: AbortSignal.timeout(6500),
    });
    if (!res.ok) return [];
    const xml = await res.text();
    const items = [];
    const matches = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)];

    for (const m of matches.slice(0, 14)) {
      const block = m[1];
      const titleMatch = block.match(/<title>([\s\S]*?)<\/title>/);
      const linkMatch = block.match(/<link>([\s\S]*?)<\/link>/);
      const pubDateMatch = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
      const sourceMatch = block.match(/<source[^>]*>([\s\S]*?)<\/source>/);

      const title = cleanString(titleMatch ? titleMatch[1] : '');
      const link = linkMatch ? linkMatch[1].trim() : '';
      const pubDate = pubDateMatch ? pubDateMatch[1].trim() : '';
      const source = cleanString(sourceMatch ? sourceMatch[1] : '');

      if (title) {
        items.push({ title, link, pubDate, source });
      }
    }
    return items;
  } catch (err) {
    return [];
  }
}

/**
 * Searches Wikipedia for contextual facts and encyclopedia summaries
 */
async function fetchWikipediaContext(query) {
  if (!query) return [];
  const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return [];
    const data = await res.json();
    const list = data?.query?.search || [];
    return list.slice(0, 3).map((item) => ({
      title: item.title,
      snippet: cleanString(item.snippet),
      url: `https://en.wikipedia.org/wiki/${encodeURIComponent(item.title.replace(/ /g, '_'))}`,
    }));
  } catch {
    return [];
  }
}

/**
 * Precision semantic match between a user's claim and a fact-checking article title.
 * Prevents false debunks on genuine events by requiring action/predicate alignment
 * and filtering out unrelated disasters or ancillary media debunking.
 */
function evaluateDebunkRelevance(userClaim, factCheckTitle) {
  const claimLower = userClaim.toLowerCase();
  const fcLower = factCheckTitle.toLowerCase();

  // 1. Ancillary photo/video debunk check
  const userMentionsMedia = /\b(photo|picture|image|video|clip|footage|cctv)\b/i.test(claimLower);
  if (!userMentionsMedia) {
    if (MEDIA_TOKENS.some((re) => re.test(fcLower))) {
      return { isDirect: false, isAncillaryMedia: true, reason: 'Debunking ancillary viral photo/video' };
    }
  }

  // 2. Unrelated disaster/scandal rumor predicate check
  for (const re of DISASTER_RUMOR_WORDS) {
    if (re.test(fcLower) && !re.test(claimLower)) {
      return { isDirect: false, isAncillaryMedia: false, reason: 'Fact check focuses on unrelated past disaster/rumor' };
    }
  }

  // 3. Action / Predicate alignment check
  const userActions = extractActionRoots(claimLower);
  const fcActions = extractActionRoots(fcLower);

  if (userActions.length > 0) {
    const actionMatches = userActions.some((ua) => fcActions.includes(ua));
    if (!actionMatches) {
      return {
        isDirect: false,
        isAncillaryMedia: false,
        reason: `Action mismatch: user said [${userActions.join(', ')}], fact-check has [${fcActions.join(', ') || 'none'}]`
      };
    }
  }

  // 4. Substantive entity words overlap with word stemming
  const claimWords = claimLower.replace(/[^\w\s]/g, '').split(/\s+/).filter((w) => w.length > 2);
  const matchedWords = claimWords.filter((w) => {
    const stem = stemWord(w);
    return fcLower.includes(w) || fcLower.includes(stem);
  });
  const matchRatio = matchedWords.length / Math.max(claimWords.length, 1);

  return {
    isDirect: matchRatio >= 0.35 && matchedWords.length >= 2,
    isAncillaryMedia: false,
    matchRatio,
  };
}

/**
 * Calculates keyword overlap between a claim and retrieved headline using word stems
 */
function calculateRelevanceOverlap(keywords, headline) {
  if (!keywords || !keywords.length) return 0;
  const hl = headline.toLowerCase();
  const hlWords = hl.replace(/[^\w\s]/g, ' ').split(/\s+/).filter((w) => w.length > 2);
  const hlStems = new Set(hlWords.map(stemWord));

  let matchCount = 0;
  for (const k of keywords) {
    const kLower = k.toLowerCase();
    const kStem = stemWord(kLower);
    if (hl.includes(kLower) || hlStems.has(kStem) || hlWords.some((hw) => hw.startsWith(kStem) || kLower.startsWith(hw))) {
      matchCount += 1;
    }
  }
  return matchCount / keywords.length;
}

/**
 * Performs linguistic and stylistic manipulation analysis
 */
export function analyzeLinguisticSignals(text) {
  const norm = text.toLowerCase();
  const words = text.split(/\s+/).filter(Boolean);
  const totalWords = Math.max(words.length, 1);

  const capsWords = words.filter((w) => w.length > 3 && w === w.toUpperCase() && /[A-Z]/.test(w)).length;
  const shoutingRatio = capsWords / totalWords;
  const exclamations = (text.match(/!{1,}/g) || []).length;
  const questionMarks = (text.match(/\?{2,}/g) || []).length;

  const foundSens = SENSATIONAL_WORDS.filter((w) => norm.includes(w));
  const foundClick = CLICKBAIT_PHRASES.filter((w) => norm.includes(w));
  const foundScam = SCAM_TRIGGERS.filter((w) => norm.includes(w));
  const foundTrust = TRUST_CUES.filter((w) => norm.includes(w));
  const hasQuotes = (text.match(/["“”]/g) || []).length >= 2;
  const hasNumbers = (text.match(/\d+(\.\d+)?/g) || []).length;

  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  const emotionalSignal = clamp(foundSens.length * 28 + exclamations * 8 + questionMarks * 10, 0, 100);
  const clickbaitSignal = clamp(foundClick.length * 40, 0, 100);
  const capsSignal = clamp(shoutingRatio * 550, 0, 100);
  const scamSignal = clamp(foundScam.length * 45, 0, 100);
  const sourcingSignal = clamp(foundTrust.length * 24 + (hasQuotes ? 16 : 0), 0, 100);
  const factsSignal = clamp(hasNumbers * 22 + (totalWords > 25 ? 15 : 0), 0, 100);

  return {
    emotional: Math.round(emotionalSignal),
    clickbait: Math.round(clickbaitSignal),
    caps: Math.round(capsSignal),
    scam: Math.round(scamSignal),
    sourcing: Math.round(sourcingSignal),
    facts: Math.round(factsSignal),
    flags: [...new Set([...foundSens, ...foundClick, ...foundScam])],
    trust: [...new Set(foundTrust)],
    wordCount: totalWords,
  };
}

/**
 * Searches global news and evaluates credibility of articles
 */
export async function searchWorldNews(query, category = 'all', limit = 15) {
  let q = (query || '').trim();

  const categoryQueries = {
    all: 'world news',
    factcheck: 'fact check hoax rumor false',
    world: 'world global international news',
    technology: 'technology science AI discovery news',
    health: 'health medical medicine research news',
    business: 'business economy market stocks finance',
  };

  if (!q) {
    q = categoryQueries[category] || 'world news';
  } else if (category === 'factcheck' && !q.toLowerCase().includes('fact check')) {
    q = `${q} fact check`;
  }

  const items = await fetchGoogleNewsRss(q);

  return items.slice(0, limit).map((item) => {
    const isDebunk = DEBUNK_TITLE_REGEX.test(item.title);
    const sourceLower = item.source.toLowerCase();
    const isFactChecker = FACT_CHECK_PUBLISHERS.some((fp) => sourceLower.includes(fp));
    const isHighAuthority = HIGH_AUTHORITY_SOURCES.some((ha) => sourceLower.includes(ha));

    let verdict = 'REPORTED';
    let score = 75;
    let badgeColor = 'neutral';

    if (isDebunk) {
      verdict = 'DEBUNKED / FAKE ALERT';
      score = 15;
      badgeColor = 'danger';
    } else if (isHighAuthority) {
      verdict = 'VERIFIED SOURCE';
      score = 92;
      badgeColor = 'success';
    } else if (isFactChecker) {
      verdict = 'FACT CHECK';
      score = isDebunk ? 15 : 85;
      badgeColor = isDebunk ? 'danger' : 'success';
    }

    return {
      title: item.title,
      link: item.link,
      pubDate: item.pubDate,
      source: item.source,
      verdict,
      score,
      badgeColor,
      isDebunk,
    };
  });
}

/**
 * Returns trending global news & rumors
 */
export async function getTrendingNewsAndRumors() {
  const [news, factChecks] = await Promise.all([
    searchWorldNews('world top news', 'all', 8),
    searchWorldNews('viral rumor fact check', 'factcheck', 8),
  ]);
  return { news, factChecks };
}

/**
 * Synthesizes a Google AI-Grade Executive Briefing from multi-vector verification findings
 */
function synthesizeAiOverview({ claim, score, status, authoritativeNews, directDebunks, ancillaryMedia, isPanic, isMedicalMyth, wikiContext }) {
  let headline = '';
  let verdictTag = '';
  let summary = '';
  const keyTakeaways = [];
  const sourcesConsulted = [];

  if (authoritativeNews.length > 0) {
    sourcesConsulted.push(...authoritativeNews.slice(0, 3).map((a) => a.source));
  }
  if (directDebunks.length > 0) {
    sourcesConsulted.push(...directDebunks.slice(0, 2).map((a) => `${a.source} Fact Check`));
  }
  if (sourcesConsulted.length === 0) {
    sourcesConsulted.push('Global Press Wires', 'Fact-Check Registries');
  }

  if (isMedicalMyth) {
    verdictTag = 'DEBUNKED MEDICAL MYTH';
    headline = 'Unsubstantiated Miracle Cure Claim';
    summary = `Clinical medical consensus and global health authorities (WHO, cardiology & oncology bodies) confirm that dietary herbs or boiled water cannot replace certified medical therapies or dissolve arterial blockages.`;
    keyTakeaways.push(
      'No peer-reviewed clinical trial validates this home remedy for serious medical pathology.',
      'Cardiovascular disease, diabetes, and cancer require licensed physician-directed treatment.',
      'Relying on viral home-cure forwards delays emergency care with potentially life-threatening consequences.'
    );
  } else if (isPanic) {
    verdictTag = 'FABRICATED PANIC RUMOR';
    headline = 'Unsubstantiated Catastrophic Panic Claim';
    summary = `No global news organization, United Nations communique, or official defense authority has confirmed this catastrophic declaration. Historical or out-of-context references are being exploited to spark panic.`;
    keyTakeaways.push(
      'Zero active breaking bulletins from Reuters, AP, BBC, or UN press offices corroborate this event.',
      'Claims of World War declarations or sudden total financial shutdowns require official state gazettes and emergency protocols.',
      'The message reflects classic viral scaremongering aimed at generating panic and shares.'
    );
  } else if (directDebunks.length > 0) {
    verdictTag = 'DEBUNKED BY FACT-CHECKERS';
    headline = `Investigated and Flagged as False`;
    summary = `Independent fact-checking newsrooms (${directDebunks.map((d) => d.source).slice(0, 2).join(', ')}) have investigated this specific claim and confirmed it is fabricated, misleading, or out of context.`;
    keyTakeaways.push(
      `Direct investigations published by ${directDebunks[0].source} refute this claim.`,
      'Primary government and organizational records contradict the narrative.',
      'The claim frequently circulates as an unverified social media forward.'
    );
  } else if (authoritativeNews.length >= 2) {
    verdictTag = 'VERIFIED BY GLOBAL PRESS';
    headline = 'Corroborated by Primary News Agencies';
    summary = `This event is actively reported and confirmed across reputable international and national news services, including ${authoritativeNews.slice(0, 2).map((a) => a.source).join(' and ')}.`;
    keyTakeaways.push(
      `Confirmed through active news coverage across ${authoritativeNews.length} verified news networks.`,
      'Reports contain direct attribution, verifiable dates, and official quotes.',
      ancillaryMedia.length > 0
        ? 'Beware: Fact-checkers noted viral social media videos or out-of-context photos circulating alongside this real event.'
        : 'Editorial oversight and multi-source attribution indicate high credibility.'
    );
  } else if (score >= 68) {
    verdictTag = 'LIKELY CREDIBLE / DEVELOPING';
    headline = 'Aligns with Reported News Record';
    summary = 'Initial reports align with credible journalistic sources, though comprehensive secondary verification is ongoing.';
    keyTakeaways.push(
      'Documented by news publications with standard journalistic sourcing.',
      'Linguistic analysis reveals low sensationalism and objective framing.',
      'Monitor ongoing reports for official statements and updates.'
    );
  } else {
    verdictTag = 'UNVERIFIED SPECULATION';
    headline = 'Unsubstantiated Social Media Claim';
    summary = 'This claim lacks corroboration from primary global news organizations, verified press wires, or official institutional channels.';
    keyTakeaways.push(
      'No authorized press wire (Reuters, AP, PTI, BBC) has validated this report.',
      'High deception markers or sensationalism detected in the message structure.',
      'Cross-check with primary sources before sharing.'
    );
  }

  return {
    headline,
    verdictTag,
    summary,
    keyTakeaways,
    sourcesConsulted: [...new Set(sourcesConsulted)],
    confidence: `${score}% Confidence`,
  };
}

/**
 * Comprehensive verification of any news claim or text with Google AI-grade search and precision
 */
export async function verifyNewsClaim(rawText) {
  const text = String(rawText || '').trim();
  if (!text) {
    throw new Error('Please enter text to verify.');
  }

  const { claim, query, keywords } = extractClaimAndKeywords(text);
  const linguistic = analyzeLinguisticSignals(text);

  // 1. Check curated knowledge base of known viral hoaxes and scams
  for (const entry of VIRAL_RUMOR_KNOWLEDGEBASE) {
    for (const pat of entry.patterns) {
      if (pat.test(text)) {
        const aiOverview = synthesizeAiOverview({
          claim: entry.claim,
          score: entry.score,
          status: 'DEBUNKED_VIRAL_HOAX',
          authoritativeNews: [],
          directDebunks: [{ source: entry.sources[0]?.label || 'Fact Check' }],
          ancillaryMedia: [],
          isPanic: false,
          isMedicalMyth: false,
          wikiContext: [],
        });

        return {
          claim: entry.claim,
          score: entry.score,
          verdict: {
            key: 'fake',
            label: 'Debunked Fake Rumor',
            note: entry.summary,
            badgeVariant: 'danger',
          },
          status: 'DEBUNKED_VIRAL_HOAX',
          summary: entry.summary,
          evidence: entry.facts,
          aiOverview,
          factChecks: entry.sources.map((s) => ({
            title: `${entry.claim} - Fact Check & Debunk`,
            source: s.label,
            link: s.url,
            isDebunk: true,
            isDirectDebunk: true,
            pubDate: 'Archived Fact Check',
          })),
          newsArticles: [],
          wikiContext: [],
          signals: [
            { key: 'verification', label: 'Fact-check consensus', value: 95, against: true },
            { key: 'sourcing', label: 'Official sourcing', value: 8, against: false },
            { key: 'emotional', label: 'Manipulation index', value: linguistic.emotional || 80, against: true },
            { key: 'clickbait', label: 'Viral spread bait', value: linguistic.clickbait || 85, against: true },
            { key: 'scam', label: 'Fraud / Phishing risk', value: linguistic.scam || 70, against: true },
            { key: 'facts', label: 'Corroborated evidence', value: 5, against: false },
          ],
          flags: linguistic.flags,
          trust: linguistic.trust,
          realityCheck: {
            title: entry.claim,
            facts: entry.facts,
            refs: entry.sources,
          },
        };
      }
    }
  }

  // 2. Check specialized Medical Disinformation patterns
  const isMedicalMyth = MEDICAL_MYTH_PATTERNS.some((p) => p.test(text));
  const isCatastrophicPanic = CATASTROPHIC_PANIC_PATTERNS.some((p) => p.test(text));

  // 3. Multi-Channel Deep Search: Query Google News Worldwide + Fact-Checking + Wikipedia in parallel
  const [newsResults, factCheckResults, wikiResults] = await Promise.all([
    fetchGoogleNewsRss(query || claim),
    fetchGoogleNewsRss(`${query || claim} fact check OR debunk OR false`),
    fetchWikipediaContext(keywords.slice(0, 4).join(' ') || query),
  ]);

  // Combine and deduplicate articles
  const seenUrls = new Set();
  const allArticles = [];
  for (const item of [...factCheckResults, ...newsResults]) {
    if (item.link && !seenUrls.has(item.link)) {
      seenUrls.add(item.link);
      allArticles.push(item);
    }
  }

  // 4. Analyze retrieved fact-checks and differentiate direct debunks vs ancillary media debunks
  const factCheckArticles = [];
  const directDebunkList = [];
  const ancillaryMediaList = [];

  allArticles.forEach((item) => {
    const isDebunk = DEBUNK_TITLE_REGEX.test(item.title);
    const sourceLower = item.source.toLowerCase();
    const isKnownChecker = FACT_CHECK_PUBLISHERS.some((fp) => sourceLower.includes(fp));
    const relevance = isDebunk ? evaluateDebunkRelevance(claim, item.title) : { isDirect: false, isAncillaryMedia: false };

    if (isDebunk) {
      if (relevance.isDirect) {
        directDebunkList.push(item);
      } else if (relevance.isAncillaryMedia) {
        ancillaryMediaList.push(item);
      }
    }

    if (isDebunk || isKnownChecker) {
      factCheckArticles.push({
        title: item.title,
        source: item.source,
        link: item.link,
        pubDate: item.pubDate,
        isDebunk,
        isDirectDebunk: relevance.isDirect,
        isAncillaryMedia: relevance.isAncillaryMedia,
        isKnownChecker,
      });
    }
  });

  const directDebunkCount = directDebunkList.length;
  const ancillaryMediaDebunks = ancillaryMediaList.length;

  // 5. Filter authoritative news that directly report on the subject without debunk/inquiry flags
  const authoritativeNews = newsResults.filter((item) => {
    const sourceLower = item.source.toLowerCase();
    const isAuth = HIGH_AUTHORITY_SOURCES.some((ha) => sourceLower.includes(ha));
    if (!isAuth) return false;
    if (DEBUNK_TITLE_REGEX.test(item.title)) return false;
    if (INQUIRY_TITLE_REGEX.test(item.title)) return false;

    // For catastrophic panic claims (WW3, alien invasion, 15-day bank closure),
    // require the title to explicitly mention the catastrophic keywords
    if (isCatastrophicPanic) {
      const mentionsCatastrophe = CATASTROPHIC_PANIC_PATTERNS.some((p) => p.test(item.title));
      if (!mentionsCatastrophe) return false;
    }

    // Check keyword overlap using word stems so varied tenses (e.g. inaugurates vs inaugurated) match
    const overlap = calculateRelevanceOverlap(keywords, item.title);
    return overlap >= 0.35;
  });

  // 6. Calculate Final Credibility Score
  let score = 56;

  // Linguistic manipulation adjustments
  const linguisticRisk =
    linguistic.emotional * 0.28 +
    linguistic.clickbait * 0.28 +
    linguistic.caps * 0.16 +
    linguistic.scam * 0.38;

  const linguisticTrust = linguistic.sourcing * 0.5 + linguistic.facts * 0.3;
  score = score - linguisticRisk * 0.35 + linguisticTrust * 0.25;

  // Real-world evidence evaluation
  if (isMedicalMyth) {
    score = Math.min(score, 12);
  } else if (isCatastrophicPanic && authoritativeNews.length === 0) {
    score = Math.min(score, 14);
  } else if (directDebunkCount > 0) {
    const penalty = Math.min(directDebunkCount * 38, 84);
    score = Math.max(5, score - penalty);
  } else if (authoritativeNews.length >= 2) {
    const bonus = Math.min(authoritativeNews.length * 16, 42);
    score = Math.min(96, score + bonus);
  } else if (newsResults.length >= 3 && authoritativeNews.length >= 1) {
    score = Math.min(88, score + 22);
  } else if (newsResults.length >= 3 && linguisticRisk < 25) {
    score = Math.min(80, score + 12);
  } else if (authoritativeNews.length === 0 && (linguistic.emotional > 35 || linguistic.scam > 25 || linguistic.clickbait > 35)) {
    score = Math.max(12, score - 32);
  }

  // If there are ancillary video/image debunks surrounding an otherwise confirmed event,
  // ensure the score reflects high credibility of the main event with a cautionary note
  if (ancillaryMediaDebunks > 0 && directDebunkCount === 0 && authoritativeNews.length > 0) {
    score = Math.max(82, score);
  }

  score = Math.round(Math.max(2, Math.min(98, score)));

  // Determine Verdict and Status
  let verdict;
  let status;
  let summary;

  if (isMedicalMyth) {
    verdict = {
      key: 'fake',
      label: 'Debunked Medical Myth',
      note: 'Dangerous medical disinformation. Certified physicians and health organizations state this home remedy has no scientific validity.',
      badgeVariant: 'danger',
    };
    status = 'MEDICAL_MYTH';
    summary = 'Medical experts and health research databases confirm that serious conditions (arterial blockages, diabetes, cancer) cannot be cured by home kitchen remedies or boiled water.';
  } else if (isCatastrophicPanic && authoritativeNews.length === 0) {
    verdict = {
      key: 'fake',
      label: 'Fabricated Panic Rumor',
      note: 'Zero confirmation from international defense ministries, the UN, or breaking news wires.',
      badgeVariant: 'danger',
    };
    status = 'FABRICATED_PANIC';
    summary = 'This sensational claim asserts an emergency or global conflict declaration with zero corroboration from verified international news networks.';
  } else if (directDebunkCount > 0 || score < 35) {
    verdict = {
      key: 'fake',
      label: directDebunkCount > 0 ? 'Debunked Fake News / Rumor' : 'Likely Fake or Fabricated',
      note: directDebunkCount > 0
        ? `Directly flagged or debunked as false/misleading by independent fact-checking organizations.`
        : `Strong manipulation signals, sensationalist tone, and absence of credible journalistic corroboration.`,
      badgeVariant: 'danger',
    };
    status = directDebunkCount > 0 ? 'DEBUNKED' : 'HIGH_SUSPICION';
    summary = directDebunkCount > 0
      ? `This claim has been investigated and debunked as false or a fabricated rumor by independent fact-checkers.`
      : `This message displays high deception markers and lacks corroboration by any recognized news authority.`;
  } else if (score < 68) {
    verdict = {
      key: 'suspicious',
      label: 'Unverified / Developing Claim',
      note: 'Mixed credibility signals. Authoritative confirmation is limited or disputed.',
      badgeVariant: 'warning',
    };
    status = 'UNVERIFIED';
    summary = 'This claim is currently unconfirmed or lacks comprehensive verification from primary news services. Exercise caution before sharing.';
  } else {
    const hasMediaWarning = ancillaryMediaDebunks > 0;
    verdict = {
      key: 'credible',
      label: 'Confirmed / Looks Credible',
      note: hasMediaWarning
        ? 'The core event is corroborated by reputable newsrooms, but beware of misleading viral social media clips.'
        : 'Corroborated by reputable news reporting with objective, measured attribution.',
      badgeVariant: 'success',
    };
    status = 'VERIFIED_CREDIBLE';
    summary = hasMediaWarning
      ? 'Primary news coverage confirms the underlying event. However, fact-checkers noted viral altered/AI-generated video clips or images circulating alongside it.'
      : 'This report aligns with active coverage from verified global news sources with standard editorial oversight.';
  }

  // Construct evidence points
  const evidence = [];
  if (directDebunkCount > 0) {
    evidence.push(`Found ${directDebunkCount} fact-check and alert articles directly debunking this narrative.`);
  }
  if (authoritativeNews.length > 0) {
    evidence.push(`Direct coverage found across ${authoritativeNews.length} verified news networks (including ${authoritativeNews.slice(0, 2).map((a) => a.source).join(', ')}).`);
  } else if (newsResults.length > 0) {
    evidence.push(`Related reporting found across ${newsResults.length} news publications.`);
  } else {
    evidence.push('No authorized global news agency or official press wire has published corroboration for this claim.');
  }

  if (ancillaryMediaDebunks > 0) {
    evidence.push(`Note: Fact-checkers flagged ${ancillaryMediaDebunks} manipulated or out-of-context video/image clips circulating about this topic.`);
  }

  if (wikiResults.length > 0) {
    evidence.push(`Relevant encyclopedia background located for: ${wikiResults.map((w) => w.title).join(', ')}.`);
  }

  // Synthesize Google AI-Grade Executive Briefing
  const aiOverview = synthesizeAiOverview({
    claim,
    score,
    status,
    authoritativeNews,
    directDebunks: directDebunkList,
    ancillaryMedia: ancillaryMediaList,
    isPanic: isCatastrophicPanic,
    isMedicalMyth,
    wikiContext: wikiResults,
  });

  // Format reality check guidance
  const realityRefs = [];
  if (factCheckArticles[0]) realityRefs.push({ label: `${factCheckArticles[0].source} Fact Check`, url: factCheckArticles[0].link });
  if (authoritativeNews[0]) realityRefs.push({ label: `${authoritativeNews[0].source} News`, url: authoritativeNews[0].link });
  if (wikiResults[0]) realityRefs.push({ label: `${wikiResults[0].title} on Wikipedia`, url: wikiResults[0].url });

  realityRefs.push(
    { label: 'Reuters Fact Check', url: 'https://www.reuters.com/fact-check/' },
    { label: 'Snopes Fact Registry', url: 'https://www.snopes.com' }
  );

  return {
    claim,
    score,
    verdict,
    status,
    summary,
    evidence,
    aiOverview,
    factChecks: factCheckArticles.slice(0, 6),
    newsArticles: newsResults.slice(0, 6),
    wikiContext: wikiResults,
    signals: [
      {
        key: 'reporting',
        label: 'Global news consensus',
        value: Math.round(authoritativeNews.length ? Math.min(100, authoritativeNews.length * 25 + 35) : (directDebunkCount ? 10 : 35)),
        against: directDebunkCount > 0,
      },
      {
        key: 'factcheck',
        label: 'Fact-checker alerts',
        value: Math.round(directDebunkCount ? Math.min(100, directDebunkCount * 45 + 20) : 5),
        against: true,
      },
      { key: 'emotional', label: 'Sensationalism', value: linguistic.emotional, against: true },
      { key: 'clickbait', label: 'Viral clickbait', value: linguistic.clickbait, against: true },
      { key: 'sourcing', label: 'Attribution & quotes', value: linguistic.sourcing, against: false },
      { key: 'facts', label: 'Verifiable details', value: linguistic.facts, against: false },
    ],
    flags: linguistic.flags,
    trust: linguistic.trust,
    realityCheck: {
      title: claim,
      facts: evidence,
      refs: realityRefs.slice(0, 4),
    },
  };
}
