import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import ApperIcon from '@/components/ApperIcon';

export const route = { path: '/about', layout: 'public', access: 'public' };

const PRINCIPLES = [
  {
    number: '01',
    title: 'Show the Evidence, Not Just a Score',
    icon: 'Search',
    body: 'Every assessment isolates the exact phrases, fabricated urgency markers, and unverified authority claims. We believe a rating you cannot cross-examine is not worth trusting.',
  },
  {
    number: '02',
    title: 'Analyze Structure & Style, Never Dictate Truth',
    icon: 'FileCheck',
    body: 'Veritas evaluates rhetorical deception, manipulative emotional framing, and technical plausibility. We do not act as arbiters of political opinion, and we state our scope plainly.',
  },
  {
    number: '03',
    title: 'Direct Citizens to Official Registries',
    icon: 'ExternalLink',
    body: 'Our platform is a gateway, not a walled garden. Every flagged topic routes users directly to trusted authorities—including PIB Fact Check, RBI, WHO, ICMR, and consumer redressal portals.',
  },
];

const CAPABILITIES = [
  {
    title: 'What Veritas Does',
    icon: 'CheckCircle2',
    tone: 'emerald',
    items: [
      'Scans forward text for manufactured panic, false urgency, and phishing patterns.',
      'Identifies impersonated government ministries, financial institutions, and health bodies.',
      'Corroborates claims against accredited fact-checking archives and press wires.',
      'Generates copy-friendly, structured debunk summaries designed to be shared back into WhatsApp and Telegram groups to stem disinformation.',
    ],
  },
  {
    title: 'What Veritas Does Not Do',
    icon: 'AlertCircle',
    tone: 'amber',
    items: [
      'We do not store, log, or sell the personal contents of submitted messages.',
      'We do not censor, suppress, or modify private communications or public discourse.',
      'We cannot replace judicial fact-finding or official regulatory statements.',
      'We do not assign arbitrary truth labels without providing accessible primary sources.',
    ],
  },
];

const WORKFLOW_STEPS = [
  {
    step: '1',
    title: 'Ingestion & Linguistic Parsing',
    description: 'Text is parsed locally into sentences, stripping deceptive hidden unicode characters, zero-width spaces, and urgent call-to-action markers.',
  },
  {
    step: '2',
    title: 'Urgency & Scammer Heuristics',
    description: 'Algorithms check for coercive financial patterns (OTP requests, urgent bank freezing threats, free smartphone schemes, and unverified medical remedies).',
  },
  {
    step: '3',
    title: 'Corroboration With Fact Repositories',
    description: 'Identified claims are mapped against active public alerts from PIB Fact Check, cybercrime advisories, and recognized investigative newsrooms.',
  },
  {
    step: '4',
    title: 'Civilian Dossier & Actionable Advice',
    description: 'A structured, non-sensational report is generated with official links and clear instructions on how to respond safely.',
  },
];

export default function About() {
  return (
    <div className='bg-background text-foreground'>
      {/* Hero Section */}
      <section className='border-b border-border bg-muted/20'>
        <div className='mx-auto max-w-5xl px-4 py-16 sm:py-24 lg:px-8'>
          <h1 className='font-heading text-4xl font-extrabold tracking-tight sm:text-6xl text-foreground max-w-4xl leading-[1.1]'>
            Viral misinformation travels in seconds.{' '}
            <span className='text-highlight italic font-normal'>We equip citizens to verify it.</span>
          </h1>
          <p className='mt-6 max-w-2xl text-lg sm:text-xl text-muted-foreground leading-relaxed'>
            Veritas is an open public verification desk built to counter predatory forwarded claims, financial phishing, and health hoaxes across India.
          </p>
        </div>
      </section>

      {/* Origin & University Lab Highlight */}
      <section className='border-b border-border py-16 sm:py-20'>
        <div className='mx-auto max-w-5xl px-4 lg:px-8'>
          <div className='grid gap-12 lg:grid-cols-12 lg:items-start'>
            {/* Story text */}
            <div className='lg:col-span-7 space-y-6 text-base sm:text-lg leading-relaxed text-foreground/90'>
              <h2 className='font-heading text-3xl font-bold text-foreground'>
                Our Origin: From Campus to Community Defense
              </h2>
              <p>
                Veritas began as an applied engineering and media literacy initiative by <strong>Team FactForge</strong>, a dedicated student team at <strong>Ganpat University, Ahmedabad</strong>.
              </p>
              <p className='text-muted-foreground'>
                Every day, we observed the same destructive pattern unfolding in family group chats and neighborhood channels: fabricated miracle cures, manufactured banking panics, and fake government schemes promising free laptops or pensions in exchange for Aadhaar numbers and OTPs. By the time anyone questioned a claim, the forward had already reached hundreds of people.
              </p>
              <p className='text-muted-foreground'>
                We realized that ordinary citizens lacked an intuitive, immediate verification tool that didn&apos;t require technical expertise or deep-dive investigations. We built the tool we wanted our own parents, relatives, and neighbors to have: paste a message, examine the exact phrases that warrant caution, and confirm what authorized sources actually report.
              </p>
            </div>

            {/* University & Institutional Highlight Card */}
            <div className='lg:col-span-5 rounded-2xl border border-border bg-card p-6 sm:p-7 shadow-xs space-y-6'>
              <div className='flex items-center gap-3 border-b border-border pb-4'>
                <div className='flex size-11 items-center justify-center rounded-xl bg-foreground text-background font-bold'>
                  <ApperIcon name='GraduationCap' size={22} />
                </div>
                <div>
                  <h3 className='font-heading text-lg font-bold leading-tight'>Team FactForge</h3>
                  <p className='text-xs text-muted-foreground'>Ganpat University · Ahmedabad, Gujarat</p>
                </div>
              </div>

              <div className='space-y-4 text-xs sm:text-sm text-muted-foreground'>
                <div>
                  <p className='font-bold text-foreground uppercase tracking-wider text-[11px]'>Core Mission</p>
                  <p className='mt-1 leading-relaxed'>Democratizing source verification and media literacy across Indian languages and communities.</p>
                </div>
                <div className='border-t border-border/60 pt-3'>
                  <p className='font-bold text-foreground uppercase tracking-wider text-[11px]'>Focus Areas</p>
                  <p className='mt-1 leading-relaxed'>Linguistic deception detection, press wire corroboration, and financial phishing prevention.</p>
                </div>
                <div className='border-t border-border/60 pt-3'>
                  <p className='font-bold text-foreground uppercase tracking-wider text-[11px]'>Public Commitment</p>
                  <p className='mt-1 leading-relaxed'>100% free for public use, operating without advertisements, data mining, or commercial tracking.</p>
                </div>
              </div>

              <div className='border-t border-border pt-4'>
                <Button asChild variant='outline' size='sm' className='w-full text-xs font-semibold'>
                  <Link to='/check'>
                    Open Verification Desk <ApperIcon name='ArrowRight' size={14} className='ml-1.5' />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Editorial Principles Section */}
      <section className='border-b border-border bg-card py-16 sm:py-20'>
        <div className='mx-auto max-w-5xl px-4 lg:px-8'>
          <div className='max-w-2xl'>
            <h2 className='font-heading text-3xl font-bold tracking-tight sm:text-4xl'>
              Our Editorial Principles
            </h2>
            <p className='mt-3 text-base text-muted-foreground leading-relaxed'>
              Verification requires radical transparency. These three core tenets govern how Veritas evaluates information and presents evidence:
            </p>
          </div>

          <div className='mt-12 grid gap-6 md:grid-cols-3'>
            {PRINCIPLES.map((p) => (
              <div
                key={p.number}
                className='flex flex-col justify-between rounded-xl border border-border bg-background p-6 shadow-xs'
              >
                <div>
                  <div className='flex items-center justify-between'>
                    <span className='font-heading text-4xl font-extrabold text-muted-foreground/30'>
                      {p.number}
                    </span>
                    <div className='flex size-8 items-center justify-center rounded-lg border border-border bg-muted/40 text-foreground'>
                      <ApperIcon name={p.icon} size={16} />
                    </div>
                  </div>
                  <h3 className='mt-5 font-heading text-xl font-bold text-foreground'>{p.title}</h3>
                  <p className='mt-2.5 text-sm leading-relaxed text-muted-foreground'>{p.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The 4-Step Verification Method */}
      <section className='border-b border-border py-16 sm:py-20'>
        <div className='mx-auto max-w-5xl px-4 lg:px-8'>
          <div className='max-w-2xl'>
            <h2 className='font-heading text-3xl font-bold tracking-tight sm:text-4xl'>
              How We Examine a Claim
            </h2>
            <p className='mt-3 text-base text-muted-foreground leading-relaxed'>
              Our workflow blends linguistic analysis with accredited public registry matching to deliver clear, actionable context in seconds.
            </p>
          </div>

          <div className='mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4'>
            {WORKFLOW_STEPS.map((s) => (
              <div key={s.step} className='rounded-xl border border-border bg-card p-5 shadow-xs flex flex-col justify-between'>
                <div>
                  <span className='inline-flex size-7 items-center justify-center rounded-full bg-muted text-xs font-bold text-foreground mb-4'>
                    {s.step}
                  </span>
                  <h3 className='font-heading text-base font-bold text-foreground'>{s.title}</h3>
                  <p className='mt-2 text-xs leading-relaxed text-muted-foreground'>{s.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Capabilities vs Limitations Section */}
      <section className='border-b border-border bg-card/60 py-16 sm:py-20'>
        <div className='mx-auto max-w-5xl px-4 lg:px-8'>
          <div className='max-w-2xl'>
            <h2 className='font-heading text-3xl font-bold tracking-tight sm:text-4xl'>
              Transparent Boundaries: What We Do & Do Not Do
            </h2>
            <p className='mt-3 text-base text-muted-foreground leading-relaxed'>
              Responsible verification means being explicit about methodological strengths and practical limits:
            </p>
          </div>

          <div className='mt-10 grid gap-6 md:grid-cols-2'>
            {CAPABILITIES.map((col, idx) => (
              <div
                key={idx}
                className='rounded-xl border border-border bg-background p-6 shadow-xs'
              >
                <div className='flex items-center gap-2.5 border-b border-border pb-4'>
                  <ApperIcon
                    name={col.icon}
                    size={20}
                    className={idx === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500'}
                  />
                  <h3 className='font-heading text-xl font-bold text-foreground'>{col.title}</h3>
                </div>
                <ul className='mt-5 space-y-3.5 text-sm leading-relaxed text-muted-foreground'>
                  {col.items.map((item, iIdx) => (
                    <li key={iIdx} className='flex items-start gap-2.5'>
                      <span
                        className={`mt-1.5 size-1.5 rounded-full shrink-0 ${
                          idx === 0 ? 'bg-emerald-500' : 'bg-amber-500'
                        }`}
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact & Support Callout */}
      <section className='py-16 sm:py-20 bg-muted/20'>
        <div className='mx-auto max-w-5xl px-4 lg:px-8'>
          <div className='flex flex-col items-start justify-between gap-6 rounded-2xl border border-border bg-card p-8 sm:p-10 sm:flex-row sm:items-center shadow-xs'>
            <div className='max-w-xl'>
              <h2 className='font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground'>
                Questions, corrections, or a rumor we should investigate?
              </h2>
              <p className='mt-2 text-sm text-muted-foreground leading-relaxed'>
                Our editorial team is open to citizen tips, disputed claims, and research collaborations.
              </p>
            </div>
            <div className='flex flex-wrap gap-3 shrink-0'>
              <Button asChild size='lg' className='bg-foreground text-background hover:bg-foreground/90 font-bold'>
                <Link to='/support'>Contact Support Desk</Link>
              </Button>
              <Button asChild size='lg' variant='outline'>
                <Link to='/help'>Read Help Center</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
