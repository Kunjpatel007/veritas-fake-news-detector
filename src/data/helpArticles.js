/**
 * Curated knowledge base articles for Veritas Help Center
 */

export const HELP_CATEGORIES = [
  {
    id: 'Getting started',
    label: 'Getting started',
    icon: 'Compass',
    description: 'Learn the fundamentals of Veritas, checking claims, and reading credibility reports.',
  },
  {
    id: 'Understanding results',
    label: 'Understanding results',
    icon: 'ShieldCheck',
    description: 'How we evaluate language, red flag warnings, attribution cues, and consensus.',
  },
  {
    id: 'Scams and safety',
    label: 'Scams & safety',
    icon: 'AlertTriangle',
    description: 'Recognizing bank scams, OTP phishing, viral hoaxes, and family group forwards.',
  },
  {
    id: 'Your account',
    label: 'Your account',
    icon: 'UserCheck',
    description: 'Manage your name, email preferences, support tickets, and regional languages.',
  },
  {
    id: 'Privacy',
    label: 'Privacy & data',
    icon: 'Lock',
    description: 'Our zero-tracking policy, clipboard permissions, and strict data boundaries.',
  },
];

export const HELP_FAQS = [
  {
    q: 'How does Veritas calculate a credibility score?',
    a: 'Veritas balances live international news wire reporting (from Reuters, AP, BBC, and PTI), published fact-check records (Snopes, PolitiFact, PIB), and linguistic analysis (detecting emotional manipulation, clickbait phrasing, and missing source attribution) to calculate a 0–100 score.',
  },
  {
    q: 'Does Veritas store or read my personal messages?',
    a: 'No. When you paste text to verify, it is evaluated in real-time solely to cross-reference news databases and check deceptive phrasing. We do not index claims against your personal identity, nor do we sell or retain your private searches.',
  },
  {
    q: 'Can a well-written rumor receive a high credibility score?',
    a: 'Linguistic cues reward calm, objective attribution. However, because Veritas simultaneously queries live wire databases and fact-checker archives, claims lacking any corroboration from reputable newsrooms are identified as unverified regardless of tone.',
  },
  {
    q: 'How should I respond when a relative shares a fake forward?',
    a: 'Focus on the message rather than criticizing the sender. Use the "Copy Full Report" button on Veritas to paste a concise, objective summary into the chat showing that no official authority confirmed the rumor.',
  },
  {
    q: 'Are Hindi and Gujarati messages supported?',
    a: 'Yes. Veritas automatically detects Hindi (हिन्दी) and Gujarati (ગુજરાતી) scripts and identifies viral emotional keywords and urgency triggers in those languages.',
  },
  {
    q: 'What should I do if I already fell for a financial scam?',
    a: 'Immediately contact your bank to freeze your card or account, and dial the Indian National Cyber Crime Helpline at 1930, or register a formal complaint at cybercrime.gov.in.',
  },
];

export const CURATED_HELP_ARTICLES = [
  {
    Id: 'art-credibility-1',
    Name: 'How Veritas Analyzes Claims and Calculates Credibility',
    category_c: 'Getting started',
    summary_c: 'A comprehensive explanation of how our scoring balances reported news wire consensus, published fact-checks, and deceptive linguistic cues.',
    body_c: `# How Veritas Analyzes Claims

Veritas helps you evaluate whether a news story, headline, or forwarded message is trustworthy before you share it.

## The Credibility Index (0–100)

Every check generates a Credibility Score calculated from six distinct indicators:

1. **Wire Service Consensus**: Checks if major global newsrooms (such as Reuters, Associated Press, BBC, or Press Trust of India) are actively reporting the event.
2. **Fact-Checking Alerts**: Cross-references verified debunk registries (like Snopes, PolitiFact, and PIB Fact Check) to identify known hoaxes.
3. **Attributed Sources**: Looks for quoted spokespersons, named government ministries, published studies, and verifiable dates.
4. **Sensationalism & Alarm**: Detects manipulative emotional triggers intended to induce panic or outrage.
5. **Clickbait Patterns**: Flags urgent calls to action like *"Share before deleted!"* or *"Forward to 10 friends"*.
6. **Scam Markers**: Scans for phishing keywords such as unverified links, OTP demands, and free gift claims.

---

## What the Scores Mean

- **75 – 100 (Credible)**: Corroborated by reputable news agencies with objective attribution.
- **40 – 74 (Unverified / Mixed)**: Lacks definitive confirmation or contains exaggerated framing. Confirm with primary sources before sharing.
- **0 – 39 (Fabricated / Scam)**: Strongly exhibits viral manipulation, clickbait patterns, or matches known debunked hoaxes.`,
    read_time_c: 3,
    published_c: true,
    ModifiedOn: '2026-10-18T10:00:00Z',
  },
  {
    Id: 'art-credibility-2',
    Name: 'Step-by-Step Guide: How to Verify Any News Story or Forward',
    category_c: 'Getting started',
    summary_c: 'Learn how to paste claims, inspect flagged keywords, and export structured verification summaries.',
    body_c: `# Verifying a Message in Three Simple Steps

Veritas is designed for quick, everyday checks on family group forwards and breaking news claims.

### Step 1: Copy and Paste
Copy the text from your messaging app or social media feed and paste it into the verification input box on the **Verify News & Rumors** page. You can also paste directly using the **Paste** button.

### Step 2: Review Findings and Marked Text
Veritas instantly checks the claim:
- Review the **Editorial Investigation Summary** at the top for primary source consensus.
- Check **Your Text, Marked** to see which specific phrases raised red flags or provided trust cues.
- Inspect the **Credibility Signals** breakdown to understand the score.

### Step 3: Copy and Share the Verification Report
Click **Copy Full Report** to generate a clean, factual summary you can paste directly back into the conversation to stop rumors before they spread.`,
    read_time_c: 2,
    published_c: true,
    ModifiedOn: '2026-10-18T09:30:00Z',
  },
  {
    Id: 'art-results-1',
    Name: 'What Do the Red and Green Markings Mean in Your Text?',
    category_c: 'Understanding results',
    summary_c: 'Understand why specific words are highlighted with red flags or green trust attribution cues.',
    body_c: `# Reading the Marked Text

When you check a claim, Veritas underlines specific words to show you why it reached its evaluation.

### Red Markings (Deception & Urgency Cues)
Words underlined in red typically indicate manipulative phrasing:
- **Alarmism**: *"Shocking"*, *"Secret"*, *"Miracle"*, *"Catastrophic"*
- **Viral Prompts**: *"Forward to everyone"*, *"Share before deleted"*, *"Media will never show this"*
- **Scam Bait**: *"Click the link"*, *"Enter Aadhaar"*, *"Free laptop"*, *"Claim cash reward"*

### Underlined Attribution (Trust Indicators)
Phrases with subtle underline styling represent objective journalism markers:
- Named wire services: *"Reuters reported"*, *"Associated Press"*, *"BBC News"*
- Official quotes: *"According to officials"*, *"The spokesperson stated"*
- Verifiable data: Quantitative statistics, dates, and peer-reviewed journals.`,
    read_time_c: 3,
    published_c: true,
    ModifiedOn: '2026-10-17T14:00:00Z',
  },
  {
    Id: 'art-results-2',
    Name: 'Why True News Sometimes Scores Lower and Well-Written Hoaxes Score Higher',
    category_c: 'Understanding results',
    summary_c: 'Understanding the difference between stylistic analysis and ground truth reality.',
    body_c: `# Stylistic Analysis vs. Objective Truth

Veritas evaluates how messages are composed and cross-references published news wire feeds. However, it is essential to understand certain nuances:

### 1. Breaking News Lag
When an event occurs minutes ago, wire agencies may take time to verify details and publish dispatches. A completely true breaking event may temporarily score as unverified until newsrooms publish corroboration.

### 2. Sensationalized Real News
Tabloids and sensational blogs frequently report real events using extreme clickbait headlines. A true story written with shouting capital letters and excessive exclamation points will receive lower scores for manipulative style.

### 3. Calm, Polished Disinformation
Some propaganda and sophisticated hoaxes are written in a calm, pseudo-professional tone without overt spam words. That is why Veritas pairs linguistic evaluation with live wire database checks.`,
    read_time_c: 4,
    published_c: true,
    ModifiedOn: '2026-10-16T11:20:00Z',
  },
  {
    Id: 'art-scams-1',
    Name: 'Spotting Bank, KYC, and Government Benefit Scams',
    category_c: 'Scams and safety',
    summary_c: 'Essential guidelines to protect yourself against banking phishing, fake scheme links, and OTP harvesting.',
    body_c: `# How to Spot Common Online Scams

Financial and phishing scams circulate widely on messaging apps. Here are the golden rules to stay safe:

### 1. The Sudden Account Block Scam
- **The Message**: *"Your bank account / debit card is blocked. Update your KYC within 24 hours at this link or lose your funds."*
- **The Reality**: Banks never send SMS or WhatsApp messages demanding you enter your netbanking password, debit card PIN, or OTP on external websites.

### 2. Free Government Schemes
- **The Message**: *"Government is distributing free smartphones / laptops to all students. Click here to register with your Aadhaar number."*
- **The Reality**: Genuine government initiatives are hosted exclusively on official government domains (ending in \`.gov.in\` or \`.nic.in\`), never on generic \`.xyz\` or \`.club\` links.

---

### What to Do If You Lost Money
Call the National Cyber Crime Helpline at **1930** immediately or report the fraud at [cybercrime.gov.in](https://cybercrime.gov.in).`,
    read_time_c: 4,
    published_c: true,
    ModifiedOn: '2026-10-15T16:00:00Z',
  },
  {
    Id: 'art-scams-2',
    Name: 'How to Respond to False Rumors in Family Groups Respectfully',
    category_c: 'Scams and safety',
    summary_c: 'Tactful and effective ways to stop viral rumors without embarrassing relatives or starting arguments.',
    body_c: `# Debunking Forwards with Tact and Grace

Correcting misinformation in family group chats can sometimes feel awkward. Here are proven communication tips:

1. **Focus on the message, not the person**: Avoid saying *"Why did you believe this?"* Instead say *"I checked this forward because it sounded concerning, and it turns out to be a known hoax."*
2. **Provide a primary link**: Share a direct link from a respected fact-checker (Snopes, PIB Fact Check, or Reuters).
3. **Use the Veritas Report**: Paste the structured report summary showing that no official authority confirmed the claim.
4. **Appreciate their care**: Often, relatives share medical or safety hoaxes out of genuine concern for loved ones. Acknowledging their good intention helps them receive the correction positively.`,
    read_time_c: 3,
    published_c: true,
    ModifiedOn: '2026-10-15T12:00:00Z',
  },
  {
    Id: 'art-account-1',
    Name: 'Managing Your Profile Details and Language Preferences',
    category_c: 'Your account',
    summary_c: 'How to customize your first and last name, manage language settings, and view support tickets.',
    body_c: `# Managing Your Veritas Account

Your Veritas account allows you to save verification histories and submit support inquiries.

### Updating Your Name and Profile
1. Click your avatar in the top right corner and select **Account**.
2. Enter your First Name and Last Name.
3. Click **Save Changes**.
Your name will now appear properly in your profile menu and support tickets instead of an email address.

### Language Support
Veritas currently supports English, Hindi (हिन्दी), and Gujarati (ગુજરાતી). You can set your preferred regional language on your Account page.`,
    read_time_c: 2,
    published_c: true,
    ModifiedOn: '2026-10-14T09:00:00Z',
  },
  {
    Id: 'art-privacy-1',
    Name: 'How Veritas Protects Your Privacy and Clipboard Data',
    category_c: 'Privacy',
    summary_c: 'Learn about our strict privacy practices, zero-tracking policy, and data boundaries.',
    body_c: `# Your Privacy on Veritas

Privacy and independence are fundamental to Veritas.

### What Happens to the Messages You Check?
- When you paste a claim for verification, the text is evaluated solely to cross-reference news wires and calculate credibility markers.
- We do not sell your search queries or forwards to third-party advertisers.
- We do not link verification claims to your personal identity.
- We do not access your clipboard without your explicit action (such as clicking the "Paste" button).

For more details, review our complete [Privacy Policy](/privacy).`,
    read_time_c: 3,
    published_c: true,
    ModifiedOn: '2026-10-12T18:00:00Z',
  },
];
