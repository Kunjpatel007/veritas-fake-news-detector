import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import ApperIcon from '@/components/ApperIcon';
import MarkedText from '@/components/MarkedText';
import { Button } from '@/components/ui/button';
import { analyze, segment, SAMPLES, verdictFor } from '@/lib/veritas';

export const route = { path: '/home', layout: 'public', access: "profile === 'Member_c'" };

const demo = SAMPLES[0];
const demoResult = analyze(demo.text);
const demoSegments = segment(demo.text, demoResult.flags, demoResult.trust);
const demoVerdict = verdictFor(demoResult.score);

const steps = [
  {
    n: '01',
    title: 'Paste',
    body: 'Drop in the forward, the headline or the article. The scoring runs in your browser.',
  },
  {
    n: '02',
    title: 'Read the marks',
    body: 'Alarming words, clickbait lines and scam bait are underlined in red, so you see what raised the alarm.',
  },
  {
    n: '03',
    title: 'Verify',
    body: 'Veritas points you to what is actually true and to trusted sources, before you press share.',
  },
];

const ledger = [
  {
    claim: 'Free smartphone for every student',
    truth: 'Real schemes are announced on official .gov.in sites, never through unknown links.',
    ref: { label: 'Cyber Crime Portal', url: 'https://cybercrime.gov.in' },
  },
  {
    claim: 'ATMs will shut for 15 days',
    truth: 'Banking changes come from the RBI and your own bank, not from forwards.',
    ref: { label: 'Reserve Bank of India', url: 'https://www.rbi.org.in' },
  },
  {
    claim: 'A kitchen spice cures diabetes',
    truth: 'No single food or spice has been shown to cure diabetes. Ask a doctor.',
    ref: { label: 'WHO myth busters', url: 'https://www.who.int/emergencies/diseases/novel-coronavirus-2019/advice-for-public/myth-busters' },
  },
  {
    claim: 'Your account is blocked, update KYC now',
    truth: 'Banks never ask for an OTP or PIN through a link or an SMS.',
    ref: { label: 'Cyber Crime Portal', url: 'https://cybercrime.gov.in' },
  },
  {
    claim: 'Breaking video from last night',
    truth: 'Old footage is often re-shared with a new caption. A reverse image search shows when it first appeared.',
    ref: { label: 'Google Lens', url: 'https://lens.google.com' },
  },
];

export default function MemberHome() {
  const user = useSelector((s) => s.user.user);
  const firstName = user?.FirstName ?? (user?.Name ?? '').split(' ')[0];

  return (
    <div>
      <section className='border-b border-border'>
        <div className='mx-auto grid max-w-6xl gap-12 px-4 py-14 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 lg:px-8 lg:py-20'>
          <div className='flex flex-col justify-center'>
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className='font-heading text-5xl font-semibold leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl'
            >
              Got something
              <br />
              to <span className='italic text-highlight'>check?</span>
            </motion.h1>
            <p className='mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground'>
              Paste a forward, a headline or an article. Veritas marks the words that should make you pause and
              shows what is actually true.
            </p>
            <div className='mt-8 flex flex-wrap gap-3'>
              <Button asChild size='lg'>
                <Link to='/check'>
                  Check a message <ApperIcon name='ArrowRight' size={18} />
                </Link>
              </Button>
              <Button asChild size='lg' variant='outline'>
                <Link to='/help'>Help Center</Link>
              </Button>
            </div>
          </div>

          <motion.figure
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className='relative self-center border border-border bg-card p-6 shadow-lg sm:p-8'
          >
            <figcaption className='mb-5 flex items-center justify-between border-b border-border pb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground'>
              <span>Forwarded message</span>
              <span>Family group · 2 min ago</span>
            </figcaption>
            <MarkedText segments={demoSegments} className='font-heading text-xl leading-relaxed sm:text-2xl' />
            <motion.div
              initial={{ opacity: 0, scale: 2.2, rotate: -14 }}
              animate={{ opacity: 1, scale: 1, rotate: -6 }}
              transition={{ delay: 2.4, type: 'spring', stiffness: 240, damping: 15 }}
              className='mt-8 inline-block border-2 border-highlight px-4 py-2 text-highlight'
            >
              <p className='font-heading text-2xl font-extrabold uppercase tracking-wide'>{demoVerdict.label}</p>
              <p className='text-center text-xs font-bold tracking-widest'>{demoResult.score} / 100</p>
            </motion.div>
          </motion.figure>
        </div>
      </section>

      <section className='border-b border-border'>
        <div className='mx-auto max-w-6xl px-4 py-16 lg:px-8 lg:py-20'>
          <h2 className='font-heading text-3xl font-semibold tracking-tight sm:text-4xl'>Three steps, no jargon</h2>
          <div className='mt-10 grid gap-10 md:grid-cols-3 md:gap-0'>
            {steps.map((s, i) => (
              <motion.div
                key={s.n}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className='md:border-l md:border-border md:px-8 md:first:border-l-0 md:first:pl-0'
              >
                <p className='font-heading text-6xl font-extrabold text-muted-foreground/40'>{s.n}</p>
                <h3 className='mt-3 font-heading text-2xl font-semibold'>{s.title}</h3>
                <p className='mt-2 leading-relaxed text-muted-foreground'>{s.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className='border-b border-border'>
        <div className='mx-auto max-w-6xl px-4 py-16 lg:px-8 lg:py-20'>
          <h2 className='font-heading text-3xl font-semibold tracking-tight sm:text-4xl'>Seen this one before?</h2>
          <p className='mt-3 max-w-xl text-muted-foreground'>
            A few rumours that keep coming back, and what is actually true about them.
          </p>
          <div className='mt-8 divide-y divide-border border-y border-border'>
            {ledger.map((row) => (
              <div key={row.claim} className='grid gap-2 py-5 md:grid-cols-[1.1fr_1.6fr_1fr] md:gap-8'>
                <p className='font-heading text-xl italic'>“{row.claim}”</p>
                <p className='text-muted-foreground'>{row.truth}</p>
                <a
                  href={row.ref.url}
                  target='_blank'
                  rel='noreferrer'
                  className='inline-flex items-center gap-1.5 text-sm font-semibold underline-offset-4 hover:underline'
                >
                  {row.ref.label} <ApperIcon name='ArrowUpRight' size={14} />
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className='mx-auto flex max-w-6xl flex-col items-start gap-6 px-4 py-16 lg:flex-row lg:items-center lg:justify-between lg:px-8'>
          <h2 className='max-w-xl font-heading text-3xl font-semibold leading-tight tracking-tight sm:text-4xl'>
            Still unsure about a message? <span className='italic text-highlight'>Ask our team.</span>
          </h2>
          <div className='flex flex-wrap gap-3'>
            <Button asChild size='lg'>
              <Link to='/support'>Open a support ticket</Link>
            </Button>
            <Button asChild size='lg' variant='outline'>
              <Link to='/account'>Your account</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
