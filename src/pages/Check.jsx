import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import ApperIcon from '@/components/ApperIcon';
import MarkedText from '@/components/MarkedText';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { analyze, detectLanguage, matchTopics, segment, SAMPLES, verdictFor } from '@/lib/veritas';
import {
  getVerificationHistoryOnServer,
  searchWorldNewsOnServer,
  verifyNewsOnServer,
} from '@/services/newsService';

export const route = { path: '/check', layout: 'public', access: 'public' };

const CIRC = 2 * Math.PI * 80;

const SEARCH_CATEGORIES = [
  { id: 'all', label: 'All World News', icon: 'Globe' },
  { id: 'factcheck', label: 'Rumors & Fact Checks', icon: 'ShieldAlert' },
  { id: 'world', label: 'World & Politics', icon: 'Landmark' },
  { id: 'technology', label: 'Science & Tech', icon: 'Cpu' },
  { id: 'health', label: 'Health & Medicine', icon: 'HeartPulse' },
  { id: 'business', label: 'Business & Markets', icon: 'TrendingUp' },
];

const SAMPLE_STORIES = [
  {
    tag: 'Viral Rumor',
    type: 'fake',
    label: 'UNESCO Anthem Hoax',
    text: 'UNESCO has officially declared the Indian National Anthem "Jana Gana Mana" as the best national anthem in the world! Proud moment for all citizens. Forward to everyone before deleted!',
  },
  {
    tag: 'Medical Hoax',
    type: 'fake',
    label: 'Spice Cures Diabetes',
    text: 'BREAKING!!! Scientists SHOCKED: a common kitchen spice cures diabetes in 3 days. Big pharma is hiding this secret from you. Share before they DELETE this post!',
  },
  {
    tag: 'World News',
    type: 'real',
    label: 'James Webb Space Telescope',
    text: "NASA's James Webb Space Telescope observed ancient cosmic structures and early galaxies dating back to within 400 million years after the Big Bang, according to research published in Nature.",
  },
  {
    tag: 'Bank Hoax',
    type: 'scam',
    label: 'ATM 15-Day Shutdown',
    text: 'URGENT: Every ATM in the country will shut for 15 days starting tonight. Withdraw all your money NOW and forward to everyone you know!!!',
  },
  {
    tag: 'Phishing Scam',
    type: 'scam',
    label: 'Free Laptop Scheme',
    text: 'Government is distributing free laptops and smartphones to every student this week. Click the link and enter your Aadhaar number and OTP to claim yours before the offer expires.',
  },
  {
    tag: 'Economy',
    type: 'real',
    label: 'Central Bank Rate Policy',
    text: 'The Reserve Bank of India kept the repo rate unchanged on Friday, according to a statement released by the central bank. The governor said inflation is expected to ease to 4.2 percent next year, citing lower food prices, Reuters reported.',
  },
];

const TRENDING_CHIPS = [
  'UNESCO Anthem Rumor',
  'COVID Microchip Vaccine',
  'James Webb Space Telescope',
  'Asteroid Earth Collision',
  'Eiffel Tower Fire Hoax',
  'Free Laptops Scheme Scam',
  'Global Gold Prices',
  'ATM Shutdown Rumor',
];

export default function Check() {
  const [activeTab, setActiveTab] = useState('verify'); // 'verify' | 'search'

  // Verification state
  const [text, setText] = useState('');
  const [checked, setChecked] = useState('');
  const [result, setResult] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [scanStepIndex, setScanStepIndex] = useState(0);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [historyItems, setHistoryItems] = useState([]);

  const language = useMemo(() => detectLanguage(text), [text]);
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const charCount = text.length;

  const verdict = useMemo(() => {
    if (!result) return null;
    return result.verdict || verdictFor(result.score);
  }, [result]);

  const segments = useMemo(() => {
    if (!result) return [];
    return segment(checked, result.flags || [], result.trust || []);
  }, [result, checked]);

  const topics = useMemo(() => {
    if (!result) return [];
    if (result.realityCheck && result.realityCheck.facts) {
      return [result.realityCheck];
    }
    return matchTopics(checked, 2);
  }, [result, checked]);

  // Rotate verification progress stages
  useEffect(() => {
    if (!scanning) return;
    const stages = [
      'Scanning international news feeds & wires (Reuters, AP, BBC)...',
      'Cross-referencing verified fact-check registries (Snopes, AP, PolitiFact)...',
      'Evaluating linguistic manipulation & clickbait patterns...',
      'Synthesizing journalistic consensus and calculating credibility score...',
    ];
    const timer = setInterval(() => {
      setScanStepIndex((prev) => (prev + 1) % stages.length);
    }, 750);
    return () => clearInterval(timer);
  }, [scanning]);

  // Load initial global news & verification history
  useEffect(() => {
    loadTrendingNews();
    loadHistory();
  }, []);

  async function loadTrendingNews() {
    setSearchLoading(true);
    try {
      const data = await searchWorldNewsOnServer('', 'all', 12);
      setSearchResults(data);
    } catch {
      // background load fallback
    } finally {
      setSearchLoading(false);
    }
  }

  async function loadHistory() {
    try {
      const history = await getVerificationHistoryOnServer(6);
      setHistoryItems(history);
    } catch {
      // background load fallback
    }
  }

  async function handlePasteFromClipboard() {
    try {
      const clipboardText = await navigator.clipboard.readText();
      if (clipboardText && clipboardText.trim()) {
        setText(clipboardText.trim());
        toast.success('Pasted from clipboard!');
      } else {
        toast.info('Clipboard is empty.');
      }
    } catch {
      toast.error('Clipboard access denied. Please paste using Ctrl+V or Command+V.');
    }
  }

  async function runVerification(textToVerify = null) {
    const raw = typeof textToVerify === 'string' ? textToVerify : text;
    const value = raw.trim();
    if (!value) {
      toast.info('Please enter or paste a claim or news story to verify.');
      return;
    }

    setScanning(true);
    setResult(null);
    setScanStepIndex(0);

    const trimmed = value.slice(0, 4000);
    setChecked(trimmed);

    try {
      // 1. Live server verification with global news & fact-checking APIs
      const serverResult = await verifyNewsOnServer(trimmed);
      setResult(serverResult);
      loadHistory();
      toast.success('Fact-check complete!');
    } catch (err) {
      // 2. High-precision offline fallback if network is restricted
      console.warn('Live API fallback triggered:', err.message);
      const offlineResult = analyze(trimmed);
      setResult(offlineResult);
      toast.info('Verified using Veritas offline analyzer.');
    } finally {
      setScanning(false);
    }
  }

  async function handleSearch(e) {
    if (e) e.preventDefault();
    setSearchLoading(true);
    try {
      const data = await searchWorldNewsOnServer(searchQuery, selectedCategory, 18);
      setSearchResults(data);
    } catch (err) {
      toast.error(err.message || 'Could not fetch search results.');
    } finally {
      setSearchLoading(false);
    }
  }

  function handleCategoryChange(catId) {
    setSelectedCategory(catId);
    setSearchLoading(true);
    searchWorldNewsOnServer(searchQuery, catId, 18)
      .then((data) => setSearchResults(data))
      .catch((err) => toast.error(err.message || 'Error filtering category.'))
      .finally(() => setSearchLoading(false));
  }

  function handleChipClick(chipText) {
    setSearchQuery(chipText);
    setSearchLoading(true);
    searchWorldNewsOnServer(chipText, selectedCategory, 18)
      .then((data) => setSearchResults(data))
      .catch((err) => toast.error(err.message || 'Error searching topic.'))
      .finally(() => setSearchLoading(false));
  }

  function handleDeepFactCheck(newsTitle) {
    setText(newsTitle);
    setActiveTab('verify');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    runVerification(newsTitle);
  }

  function clear() {
    setText('');
    setChecked('');
    setResult(null);
  }

  async function copyReport() {
    if (!result) return;
    const lines = [
      '========================================',
      'VERITAS FACT-CHECK & CREDIBILITY REPORT',
      '========================================',
      `Claim / Subject: ${result.claim || checked.slice(0, 100)}`,
      `Credibility Score: ${result.score}/100`,
      `Verdict: ${verdict?.label || 'Analyzed'}`,
      `Status: ${result.status || 'Verified'}`,
      `Headline: ${result.aiOverview?.headline || ''}`,
      `Editorial Summary: ${result.aiOverview?.summary || result.summary || verdict?.note || ''}`,
      '',
      ...(result.aiOverview?.keyTakeaways?.length
        ? ['--- KEY TAKEAWAYS ---', ...result.aiOverview.keyTakeaways.map((t) => `• ${t}`), '']
        : []),
      '--- EVIDENCE & CONSENSUS ---',
      ...(result.evidence || []).map((e) => `• ${e}`),
      '',
      '--- FACT CHECKS FOUND ---',
      ...(result.factChecks || []).map((fc) => `• [${fc.source}] ${fc.title} (${fc.link})`),
      '',
      '--- GLOBAL NEWS SOURCES ---',
      ...(result.newsArticles || []).map((na) => `• [${na.source}] ${na.title}`),
      '',
      '--- ORIGINAL TEXT ---',
      checked,
      '========================================',
      'Verified with Veritas Fact-Checking Desk',
    ];
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      toast.success('Complete Veritas Fact-Check report copied to clipboard!');
    } catch {
      toast.error('Could not copy report. Select text manually.');
    }
  }

  return (
    <div className='mx-auto max-w-6xl px-4 py-8 sm:py-12 lg:px-8'>
      {/* Editorial Hero Header */}
      <div className='flex flex-col gap-6 border-b border-border pb-8 md:flex-row md:items-end md:justify-between'>
        <div className='max-w-2xl'>
          <h1 className='font-heading text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl'>
            Verify any news. <span className='italic text-highlight'>Expose rumors.</span>
          </h1>

          <p className='mt-3 text-base sm:text-lg leading-relaxed text-muted-foreground'>
            Cross-references international newsrooms, fact-checkers (Snopes, Reuters, BBC, AP), and primary
            sources to deliver clear, accurate truth.
          </p>
        </div>

        {/* Tab Toggle Segmented Control */}
        <div className='flex shrink-0 rounded-lg border border-border bg-card p-1 shadow-xs'>
          <button
            type='button'
            onClick={() => setActiveTab('verify')}
            className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-all ${activeTab === 'verify'
                ? 'bg-foreground text-background shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            <ApperIcon name='ShieldCheck' size={16} /> Verify News / Claim
          </button>
          <button
            type='button'
            onClick={() => setActiveTab('search')}
            className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-all ${activeTab === 'search'
                ? 'bg-foreground text-background shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            <ApperIcon name='Globe' size={16} /> Search World News & Rumors
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: VERIFY NEWS / CLAIM                                                */}
      {/* ========================================================================= */}
      {activeTab === 'verify' && (
        <div className='mt-8 space-y-8'>
          {/* Main Input Card */}
          <div className='relative overflow-hidden rounded-xl border border-border bg-card shadow-xs transition-shadow hover:shadow-sm'>

            {/* Top Toolbar */}
            <div className='flex flex-wrap items-center justify-between gap-3 border-b border-border bg-muted/20 px-5 py-3 text-xs'>
              <div className='flex items-center gap-3'>
                <span className='font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5'>
                  <ApperIcon name='FileText' size={14} className='text-highlight' />
                  Claim or Article Input
                </span>
                <span className='rounded bg-muted px-2 py-0.5 font-medium text-muted-foreground'>
                  {wordCount} words · {charCount} chars
                </span>
                <span className='rounded bg-muted px-2 py-0.5 font-medium text-muted-foreground flex items-center gap-1'>
                  <ApperIcon name='Globe' size={12} /> {language}
                </span>
              </div>

              <div className='flex items-center gap-2'>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={handlePasteFromClipboard}
                  className='h-7 text-xs font-semibold gap-1.5 hover:border-foreground'
                >
                  <ApperIcon name='Clipboard' size={13} /> Paste
                </Button>
                {text && (
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    onClick={clear}
                    className='h-7 text-xs text-muted-foreground hover:text-foreground'
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>

            {/* Textarea */}
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder='Paste a headline, article excerpt, or forwarded message to verify...'
              className='min-h-56 resize-y rounded-none border-0 bg-transparent p-5 text-base sm:text-lg leading-relaxed shadow-none focus-visible:ring-0 placeholder:text-muted-foreground/60'
            />

            {/* Quick Sample Selector */}
            <div className='border-t border-border bg-muted/15 p-4 sm:px-5'>
              <div className='flex flex-wrap items-center gap-2'>
                <span className='text-xs font-bold uppercase tracking-wider text-muted-foreground mr-1'>
                  Try verified cases:
                </span>
                {SAMPLE_STORIES.map((s) => (
                  <button
                    key={s.label}
                    type='button'
                    onClick={() => {
                      setText(s.text);
                      runVerification(s.text);
                    }}
                    className='inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium transition-all hover:border-foreground hover:bg-muted'
                  >
                    <span
                      className={`size-1.5 rounded-full ${s.type === 'fake'
                          ? 'bg-highlight'
                          : s.type === 'scam'
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                    />
                    <span>{s.label}</span>
                    <span className='text-[10px] text-muted-foreground uppercase'>({s.tag})</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Action Bar Footer */}
            <div className='flex flex-wrap items-center justify-between gap-4 border-t border-border p-4 sm:px-5 bg-card'>
              <div className='text-xs text-muted-foreground'>
                {scanning ? (
                  <span className='flex items-center gap-2 font-medium text-foreground'>
                    <ApperIcon name='LoaderCircle' size={14} className='animate-spin text-highlight' />
                    Checking news wire records and verified fact-check archives...
                  </span>
                ) : (
                  <span className='flex items-center gap-1.5'>
                    <ApperIcon name='ShieldCheck' size={14} className='text-muted-foreground' />
                    Independent verification against news wires and published fact-checks.
                  </span>
                )}
              </div>

              <div className='flex items-center gap-3'>
                <Button
                  type='button'
                  onClick={() => runVerification()}
                  disabled={scanning || !text.trim()}
                  className='min-w-40 h-11 bg-foreground text-background font-bold tracking-wide hover:bg-foreground/90 transition-all shadow-xs cursor-pointer'
                >
                  {scanning ? (
                    <>
                      <ApperIcon name='LoaderCircle' size={16} className='animate-spin mr-2' />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <ApperIcon name='Search' size={16} className='mr-2' />
                      Verify Claim
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* ===================================================================== */}
          {/* VERIFICATION REPORT RESULTS                                           */}
          {/* ===================================================================== */}
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className='space-y-8'
              aria-live='polite'
            >
              {/* Main Credibility Hero Banner */}
              <div
                className={`relative overflow-hidden rounded-xl border p-6 sm:p-8 transition-colors ${result.score < 40
                    ? 'border-highlight/40 bg-highlight/5'
                    : result.score < 75
                      ? 'border-amber-500/40 bg-amber-500/5'
                      : 'border-emerald-500/40 bg-emerald-500/5'
                  }`}
              >
                <div className='grid gap-8 md:grid-cols-[18rem_1fr] items-center'>
                  {/* Gauge & Verdict */}
                  <div className='flex flex-col items-center justify-center text-center'>
                    <div className='relative'>
                      <svg
                        viewBox='0 0 200 200'
                        className='size-48 -rotate-90'
                        role='img'
                        aria-label={`Credibility score ${result.score} out of 100`}
                      >
                        <circle cx='100' cy='100' r='80' fill='none' strokeWidth='8' className='stroke-border/70' />
                        <motion.circle
                          cx='100'
                          cy='100'
                          r='80'
                          fill='none'
                          strokeWidth='8'
                          strokeLinecap='round'
                          className={
                            result.score < 40
                              ? 'stroke-highlight'
                              : result.score < 75
                                ? 'stroke-amber-500'
                                : 'stroke-emerald-600 dark:stroke-emerald-400'
                          }
                          strokeDasharray={CIRC}
                          initial={{ strokeDashoffset: CIRC }}
                          animate={{ strokeDashoffset: CIRC - (CIRC * result.score) / 100 }}
                          transition={{ duration: 1.2, ease: 'easeOut' }}
                        />
                      </svg>
                      <div className='absolute inset-0 flex flex-col items-center justify-center'>
                        <span className='font-heading text-6xl font-extrabold tracking-tight'>{result.score}</span>
                        <span className='text-[10px] font-bold uppercase tracking-widest text-muted-foreground'>
                          Trust Index / 100
                        </span>
                      </div>
                    </div>

                    {/* Verdict Pill */}
                    <div
                      className={`mt-4 inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-bold uppercase tracking-wider shadow-xs ${result.score < 40
                          ? 'bg-highlight text-white'
                          : result.score < 75
                            ? 'bg-amber-500/20 text-amber-800 dark:text-amber-200'
                            : 'bg-emerald-600 text-white'
                        }`}
                    >
                      <ApperIcon
                        name={
                          result.score < 40
                            ? 'ShieldAlert'
                            : result.score < 75
                              ? 'AlertTriangle'
                              : 'ShieldCheck'
                        }
                        size={14}
                      />
                      {verdict?.label || 'Analyzed'}
                    </div>

                    <p className='mt-2.5 max-w-xs text-xs text-muted-foreground leading-relaxed font-medium'>
                      {verdict?.note}
                    </p>

                    <div className='mt-5 flex gap-2'>
                      <Button type='button' variant='outline' size='sm' onClick={copyReport} className='text-xs font-semibold'>
                        <ApperIcon name='Copy' size={13} className='mr-1.5' /> Copy Full Report
                      </Button>
                    </div>
                  </div>

                  {/* Summary & Findings */}
                  <div className='flex flex-col justify-between space-y-6'>
                    <div>
                      <div className='flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground'>
                        <ApperIcon name='FileCheck' size={14} className='text-highlight' /> Editorial Assessment
                      </div>
                      <h2 className='mt-2 font-heading text-2xl sm:text-3xl font-bold leading-snug'>
                        {result.claim ? `"${result.claim}"` : 'Analysis Findings'}
                      </h2>
                      <p className='mt-3 text-base sm:text-lg leading-relaxed text-foreground/90'>
                        {result.summary || verdict?.note}
                      </p>
                    </div>

                    {/* Key Findings Checklist */}
                    {result.evidence && result.evidence.length > 0 && (
                      <div className='rounded-lg border border-border bg-card/80 p-5 backdrop-blur-xs'>
                        <p className='text-xs font-bold uppercase tracking-wider text-muted-foreground'>
                          Verification Findings & Consensus:
                        </p>
                        <ul className='mt-2.5 space-y-2 text-sm leading-relaxed text-foreground/90'>
                          {result.evidence.map((item, idx) => (
                            <li key={idx} className='flex items-start gap-2.5'>
                              <span
                                className={`mt-0.5 size-1.5 rounded-full shrink-0 ${result.score < 40 ? 'bg-highlight' : 'bg-emerald-500'
                                  }`}
                              />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className='flex flex-wrap items-center gap-2 text-xs text-muted-foreground'>
                      <span className='rounded-md border border-border bg-card px-2.5 py-1 font-semibold text-foreground'>
                        Status: {result.status || 'VERIFIED'}
                      </span>
                      <span className='rounded-md border border-border bg-card px-2.5 py-1 font-medium'>
                        Language: {language}
                      </span>
                      <span className='rounded-md border border-border bg-card px-2.5 py-1 font-medium'>
                        Cross-checked with Global News Wires
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Editorial Investigation Summary Dossier */}
              {result.aiOverview && (
                <div className='relative overflow-hidden rounded-xl border border-border bg-card p-6 sm:p-8 shadow-xs'>
                  <div className='flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4'>
                    <div className='flex items-center gap-3'>
                      <div className='flex size-9 items-center justify-center rounded-lg border border-border bg-muted/40 text-foreground shadow-xs'>
                        <ApperIcon name='FileText' size={18} />
                      </div>
                      <div>
                        <div className='flex flex-wrap items-center gap-2'>
                          <span className='font-heading text-xl font-bold tracking-tight'>Editorial Investigation Summary</span>
                          <span className='rounded-md border border-border bg-muted/40 px-2.5 py-0.5 text-[11px] font-bold text-foreground uppercase tracking-wider'>
                            {result.aiOverview.verdictTag}
                          </span>
                        </div>
                        <p className='text-xs text-muted-foreground'>
                          Findings cross-referenced against primary news wires, verified fact-check records, and archives
                        </p>
                      </div>
                    </div>
                    {result.aiOverview.confidence && (
                      <span className='rounded-md border border-border bg-card px-2.5 py-1 text-xs font-semibold text-muted-foreground shadow-xs'>
                        {result.aiOverview.confidence}
                      </span>
                    )}
                  </div>

                  <div className='mt-5 space-y-5'>
                    <div className='rounded-lg border border-border/60 bg-muted/20 p-4 sm:p-5'>
                      <h3 className='font-heading text-lg sm:text-xl font-bold text-foreground'>
                        {result.aiOverview.headline}
                      </h3>
                      <p className='mt-2 text-sm sm:text-base leading-relaxed text-foreground/90 font-sans'>
                        {result.aiOverview.summary}
                      </p>
                    </div>

                    {result.aiOverview.keyTakeaways && result.aiOverview.keyTakeaways.length > 0 && (
                      <div>
                        <h4 className='text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5'>
                          <ApperIcon name='CheckCircle2' size={14} className='text-emerald-500' />
                          Key Investigative Takeaways
                        </h4>
                        <div className='grid gap-3 sm:grid-cols-3'>
                          {result.aiOverview.keyTakeaways.map((point, idx) => (
                            <div key={idx} className='flex items-start gap-2.5 rounded-lg border border-border bg-card p-4 shadow-xs'>
                              <span className='mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-highlight/10 text-highlight text-xs font-bold'>
                                {idx + 1}
                              </span>
                              <p className='text-xs sm:text-sm leading-relaxed text-foreground/90 font-medium'>
                                {point}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {result.aiOverview.sourcesConsulted && result.aiOverview.sourcesConsulted.length > 0 && (
                      <div className='flex flex-wrap items-center gap-2 border-t border-border/60 pt-3 text-xs'>
                        <span className='font-bold uppercase tracking-wider text-muted-foreground mr-1'>
                          Primary Sources Cross-Referenced:
                        </span>
                        {result.aiOverview.sourcesConsulted.map((s, idx) => (
                          <span key={idx} className='rounded-md border border-border bg-muted/40 px-2.5 py-0.5 font-semibold text-foreground'>
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Verified Fact-Check Reports Card */}
              {result.factChecks && result.factChecks.length > 0 && (
                <div className='rounded-xl border border-border bg-card p-6 sm:p-8 shadow-xs'>
                  <div className='flex flex-wrap items-center justify-between gap-3 border-b border-border pb-5'>
                    <div>
                      <h2 className='flex items-center gap-2.5 font-heading text-2xl font-bold'>
                        <ApperIcon name='ShieldAlert' size={24} className='text-highlight' />
                        Verified Fact-Check Reports
                      </h2>
                      <p className='mt-1 text-sm text-muted-foreground'>
                        Direct investigations published by international fact-checking organizations:
                      </p>
                    </div>
                    <span className='rounded-full bg-highlight/10 px-3 py-1 text-xs font-bold text-highlight'>
                      {result.factChecks.length} found
                    </span>
                  </div>

                  <div className='mt-6 grid gap-4 md:grid-cols-2'>
                    {result.factChecks.map((fc, i) => (
                      <div
                        key={i}
                        className='flex flex-col justify-between rounded-lg border border-border bg-muted/20 p-5 transition-all hover:border-foreground/40 hover:bg-muted/30'
                      >
                        <div>
                          <div className='flex items-center justify-between text-xs'>
                            <span className='font-bold uppercase tracking-wider text-highlight rounded bg-highlight/10 px-2 py-0.5'>
                              {fc.source}
                            </span>
                            {fc.pubDate && (
                              <span className='text-muted-foreground'>
                                {fc.pubDate.split(' ').slice(1, 4).join(' ')}
                              </span>
                            )}
                          </div>
                          <h3 className='mt-3 font-heading text-lg font-bold leading-snug'>
                            {fc.title}
                          </h3>
                        </div>

                        <div className='mt-5 flex items-center justify-between border-t border-border/60 pt-3'>
                          <span
                            className={`text-xs font-bold inline-flex items-center gap-1 ${fc.isDebunk ? 'text-highlight' : 'text-emerald-600 dark:text-emerald-400'
                              }`}
                          >
                            <span className={`size-1.5 rounded-full ${fc.isDebunk ? 'bg-highlight' : 'bg-emerald-500'}`} />
                            {fc.isDebunk ? 'Debunked as False' : 'Fact Check'}
                          </span>
                          <a
                            href={fc.link}
                            target='_blank'
                            rel='noreferrer'
                            className='inline-flex items-center gap-1 text-xs font-bold text-foreground underline-offset-4 hover:underline'
                          >
                            Read Investigation <ApperIcon name='ArrowUpRight' size={13} />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Corroborating Global News Reports Card */}
              {result.newsArticles && result.newsArticles.length > 0 && (
                <div className='rounded-xl border border-border bg-card p-6 sm:p-8 shadow-xs'>
                  <div className='flex flex-wrap items-center justify-between gap-3 border-b border-border pb-5'>
                    <div>
                      <h2 className='flex items-center gap-2.5 font-heading text-2xl font-bold'>
                        <ApperIcon name='Globe' size={24} className='text-foreground' />
                        Global News Coverage
                      </h2>
                      <p className='mt-1 text-sm text-muted-foreground'>
                        Mainstream newsrooms and press agencies reporting on this topic:
                      </p>
                    </div>
                    <span className='rounded-full bg-muted px-3 py-1 text-xs font-bold text-muted-foreground'>
                      {result.newsArticles.length} articles
                    </span>
                  </div>

                  <div className='mt-6 divide-y divide-border rounded-lg border border-border'>
                    {result.newsArticles.map((article, i) => (
                      <div
                        key={i}
                        className='flex flex-col justify-between gap-3 p-4 sm:flex-row sm:items-center hover:bg-muted/30 transition-colors'
                      >
                        <div className='min-w-0 flex-1'>
                          <div className='flex items-center gap-2 text-xs'>
                            <span className='font-bold text-foreground'>{article.source}</span>
                            <span className='text-muted-foreground'>·</span>
                            <span className='text-muted-foreground'>
                              {article.pubDate ? article.pubDate.split(' ').slice(1, 4).join(' ') : 'Recent'}
                            </span>
                          </div>
                          <p className='mt-1 font-heading text-base font-semibold leading-snug text-foreground'>
                            {article.title}
                          </p>
                        </div>
                        <a
                          href={article.link}
                          target='_blank'
                          rel='noreferrer'
                          className='inline-flex shrink-0 items-center gap-1 text-xs font-semibold underline-offset-4 hover:underline'
                        >
                          Source <ApperIcon name='ExternalLink' size={13} />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* The 6 Signals Breakdown Card */}
              <div className='rounded-xl border border-border bg-card p-6 sm:p-8 shadow-xs'>
                <h2 className='font-heading text-2xl font-bold'>The Six Credibility Signals</h2>
                <p className='mt-1 text-sm text-muted-foreground'>
                  Our algorithm calculates credibility by balancing live journalistic consensus against deceptive markers:
                </p>

                <div className='mt-6 space-y-4'>
                  {(result.signals || []).map((sig, i) => (
                    <div
                      key={sig.key}
                      className='grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1.5 sm:grid-cols-[13rem_1fr_3.5rem]'
                    >
                      <div>
                        <p className='text-sm font-bold'>{sig.label}</p>
                        <p className={`text-xs ${sig.against ? 'text-highlight' : 'text-emerald-600 dark:text-emerald-400'}`}>
                          {sig.against ? 'Lowers the score' : 'Raises the score'}
                        </p>
                      </div>
                      <span className='text-right text-sm font-bold tabular-nums sm:order-3'>
                        {sig.value}%
                      </span>
                      <div className='col-span-2 h-2.5 overflow-hidden rounded-full bg-muted sm:col-span-1'>
                        <motion.div
                          className={`h-full rounded-full ${sig.against ? 'bg-highlight' : 'bg-foreground'
                            }`}
                          initial={{ width: 0 }}
                          animate={{ width: `${sig.value}%` }}
                          transition={{ duration: 0.9, delay: 0.1 + i * 0.08, ease: 'easeOut' }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Your Text, Marked Card */}
              <div className='rounded-xl border border-border bg-card p-6 sm:p-8 shadow-xs'>
                <div className='flex flex-wrap items-center justify-between gap-2 border-b border-border pb-4'>
                  <div>
                    <h2 className='font-heading text-2xl font-bold'>Your Text, Marked</h2>
                    <p className='mt-1 text-sm text-muted-foreground'>
                      Visual breakdown showing words that triggered suspicion or trust cues:
                    </p>
                  </div>
                  <div className='flex items-center gap-4 text-xs font-semibold'>
                    <span className='flex items-center gap-1.5 text-highlight'>
                      <span className='size-2 rounded-full bg-highlight' /> Red Flag / Clickbait
                    </span>
                    <span className='flex items-center gap-1.5 text-foreground'>
                      <span className='h-0.5 w-3 bg-muted-foreground' /> Trust Attribution
                    </span>
                  </div>
                </div>

                <MarkedText segments={segments} className='mt-6 font-heading text-xl sm:text-2xl leading-relaxed' />
              </div>

              {/* Reality Check & Reference Links Card */}
              <div className='rounded-xl border border-border bg-card p-6 sm:p-8 shadow-xs'>
                <h2 className='font-heading text-2xl font-bold'>Reality Check & Authoritative Links</h2>
                <p className='mt-1 text-sm text-muted-foreground'>
                  Verified facts and direct portals to confirm ground reality:
                </p>

                <div className='mt-6 grid gap-6 md:grid-cols-2'>
                  {topics.map((topic, idx) => (
                    <div key={idx} className='rounded-lg border border-border p-5 bg-muted/10 flex flex-col justify-between'>
                      <div>
                        <h3 className='font-heading text-lg font-bold text-foreground'>{topic.title}</h3>
                        <ul className='mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground'>
                          {(topic.facts || []).map((fact, fIdx) => (
                            <li key={fIdx}>{fact}</li>
                          ))}
                        </ul>
                      </div>
                      {topic.refs && topic.refs.length > 0 && (
                        <div className='mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-border pt-3'>
                          {topic.refs.map((ref, rIdx) => (
                            <a
                              key={rIdx}
                              href={ref.url}
                              target='_blank'
                              rel='noreferrer'
                              className='inline-flex items-center gap-1 text-xs font-bold text-foreground underline-offset-4 hover:underline'
                            >
                              {ref.label} <ApperIcon name='ArrowUpRight' size={12} />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: SEARCH WORLD NEWS & RUMORS                                         */}
      {/* ========================================================================= */}
      {activeTab === 'search' && (
        <div className='mt-8 space-y-8'>
          {/* Large Search Bar */}
          <form onSubmit={handleSearch} className='flex gap-2 sm:gap-3'>
            <div className='relative flex-1'>
              <ApperIcon
                name='Search'
                size={20}
                className='pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground'
              />
              <input
                type='text'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder='Search any world news, claim, country, or rumor (e.g. "SpaceX Starship", "COVID vaccine microchip", "Eiffel tower", "World War 3", "Earthquake Japan")...'
                className='h-13 w-full rounded-lg border border-border bg-card pl-12 pr-10 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground shadow-xs'
              />
              {searchQuery && (
                <button
                  type='button'
                  onClick={() => setSearchQuery('')}
                  className='absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground'
                >
                  <ApperIcon name='X' size={16} />
                </button>
              )}
            </div>
            <Button type='submit' size='lg' disabled={searchLoading} className='h-13 min-w-28 font-bold'>
              {searchLoading ? (
                <ApperIcon name='LoaderCircle' size={18} className='animate-spin' />
              ) : (
                'Search Wires'
              )}
            </Button>
          </form>

          {/* Trending Searches Chips */}
          <div className='rounded-lg border border-border bg-muted/10 p-4'>
            <p className='text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5'>
              <ApperIcon name='Flame' size={14} className='text-highlight' />
              Trending Global Rumors & Searches:
            </p>
            <div className='mt-2.5 flex flex-wrap gap-2'>
              {TRENDING_CHIPS.map((chip) => (
                <button
                  key={chip}
                  type='button'
                  onClick={() => handleChipClick(chip)}
                  className='rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium transition-all hover:border-foreground hover:bg-muted'
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className='flex flex-wrap gap-2 border-b border-border pb-4'>
            {SEARCH_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type='button'
                onClick={() => handleCategoryChange(cat.id)}
                className={`flex items-center gap-2 rounded-md px-4 py-2 text-xs font-semibold transition-all ${selectedCategory === cat.id
                    ? 'bg-foreground text-background shadow-xs'
                    : 'border border-border bg-card text-muted-foreground hover:text-foreground'
                  }`}
              >
                <ApperIcon name={cat.icon} size={14} />
                {cat.label}
              </button>
            ))}
          </div>

          {/* Results Grid Header */}
          <div className='flex items-center justify-between pb-2'>
            <h2 className='font-heading text-2xl font-bold'>
              {searchQuery ? `World News for "${searchQuery}"` : 'Live Global Wire Reports'}
            </h2>
            <span className='text-xs font-medium text-muted-foreground'>{searchResults.length} articles found</span>
          </div>

          {/* Results Grid / Loading State */}
          {searchLoading ? (
            <div className='flex min-h-64 flex-col items-center justify-center text-center rounded-xl border border-border bg-card p-12'>
              <ApperIcon name='LoaderCircle' size={36} className='animate-spin text-highlight' />
              <p className='mt-4 font-heading text-lg font-semibold'>
                Querying global wire services & fact-check networks...
              </p>
              <p className='mt-1 text-xs text-muted-foreground'>
                Scanning Reuters, Associated Press, BBC, and international news feeds.
              </p>
            </div>
          ) : searchResults.length === 0 ? (
            <div className='rounded-xl border border-dashed border-border bg-card p-12 text-center'>
              <ApperIcon name='Search' size={40} className='mx-auto text-muted-foreground' />
              <h3 className='mt-4 font-heading text-xl font-bold'>No matching world news found</h3>
              <p className='mt-2 text-sm text-muted-foreground max-w-md mx-auto'>
                Try searching a different keyword or selecting "All World News" above.
              </p>
            </div>
          ) : (
            <div className='grid gap-5 md:grid-cols-2 lg:grid-cols-3'>
              {searchResults.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03, duration: 0.35 }}
                  className='flex flex-col justify-between rounded-xl border border-border bg-card p-5 shadow-xs transition-all hover:border-foreground/40 hover:shadow-md'
                >
                  <div>
                    {/* Credibility Tag */}
                    <div className='flex items-center justify-between text-xs'>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${item.badgeColor === 'danger'
                            ? 'bg-highlight/15 text-highlight'
                            : item.badgeColor === 'success'
                              ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300'
                              : 'bg-muted text-foreground'
                          }`}
                      >
                        <ApperIcon
                          name={
                            item.badgeColor === 'danger'
                              ? 'ShieldAlert'
                              : item.badgeColor === 'success'
                                ? 'ShieldCheck'
                                : 'Info'
                          }
                          size={12}
                        />
                        {item.verdict} ({item.score}/100)
                      </span>

                      <span className='text-muted-foreground text-[11px]'>
                        {item.pubDate ? item.pubDate.split(' ').slice(1, 4).join(' ') : 'Recent'}
                      </span>
                    </div>

                    <h3 className='mt-3.5 font-heading text-lg font-bold leading-snug line-clamp-3'>
                      {item.title}
                    </h3>

                    <p className='mt-2.5 text-xs font-semibold text-muted-foreground'>
                      Source: <span className='text-foreground'>{item.source}</span>
                    </p>
                  </div>

                  <div className='mt-6 flex items-center justify-between border-t border-border pt-4'>
                    <Button
                      type='button'
                      size='sm'
                      variant='default'
                      className='text-xs font-bold gap-1.5 bg-foreground text-background hover:bg-foreground/90 cursor-pointer'
                      onClick={() => handleDeepFactCheck(item.title)}
                    >
                      <ApperIcon name='Search' size={13} /> Check this claim
                    </Button>

                    <a
                      href={item.link}
                      target='_blank'
                      rel='noreferrer'
                      className='inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground underline-offset-4 hover:underline'
                    >
                      Source <ApperIcon name='ExternalLink' size={12} />
                    </a>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Recent Verifications History */}
          {historyItems.length > 0 && (
            <div className='border-t border-border pt-8'>
              <h3 className='font-heading text-xl font-bold'>Recently Fact-Checked Claims</h3>
              <p className='mt-1 text-xs text-muted-foreground'>
                Rumors and claims verified across the community in real time:
              </p>

              <div className='mt-4 divide-y divide-border rounded-xl border border-border bg-card'>
                {historyItems.map((h) => (
                  <div
                    key={h.Id}
                    className='flex flex-col justify-between gap-3 p-4 sm:flex-row sm:items-center hover:bg-muted/30 transition-colors'
                  >
                    <div className='min-w-0 flex-1'>
                      <p className='font-semibold text-sm line-clamp-1'>"{h.claim}"</p>
                      <div className='mt-1 flex items-center gap-2 text-xs text-muted-foreground'>
                        <span>{new Date(h.CreatedOn).toLocaleDateString()}</span>
                        <span>·</span>
                        <span
                          className={`font-bold ${h.score < 40
                              ? 'text-highlight'
                              : h.score < 75
                                ? 'text-amber-500'
                                : 'text-emerald-600 dark:text-emerald-400'
                            }`}
                        >
                          {h.verdict} ({h.score}/100)
                        </span>
                      </div>
                    </div>
                    <Button
                      type='button'
                      variant='outline'
                      size='sm'
                      onClick={() => handleDeepFactCheck(h.claim)}
                      className='text-xs shrink-0 font-semibold'
                    >
                      Re-Check
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Support & Community Footer Callout */}
      <div className='mt-14 flex flex-col items-start justify-between gap-4 rounded-xl border border-border bg-card p-6 sm:flex-row sm:items-center shadow-xs'>
        <div>
          <p className='font-heading text-lg font-bold'>Still unsure about an unverified story?</p>
          <p className='mt-0.5 text-xs text-muted-foreground'>
            Our editorial guides and community support team can review complex disputed claims.
          </p>
        </div>
        <div className='flex flex-wrap gap-2.5'>
          <Button asChild variant='outline' size='sm'>
            <Link to='/help'>Help Center</Link>
          </Button>
          <Button asChild size='sm' className='bg-foreground text-background hover:bg-foreground/90 font-bold'>
            <Link to='/support'>Open a Ticket</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
