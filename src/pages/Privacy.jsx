import { Link } from 'react-router-dom';

export const route = { path: '/privacy', layout: 'public', access: 'public' };

const sections = [
  {
    id: 'who',
    title: 'Who we are',
    body: [
      'Veritas (“we”, “us”) runs this website and its member accounts. If you have a question about this policy, write to hello@veritas.example or open a support ticket and choose the Privacy request category.',
    ],
  },
  {
    id: 'collect',
    title: 'What we collect',
    list: [
      'Account details: your name, email address and password, which you give us when you sign up.',
      'Profile details you choose to add: phone number, city, organisation, preferred language and whether you want the newsletter.',
      'Support tickets: the subject, category, message and our replies.',
      'Basic technical data that our hosting provider keeps in standard server logs.',
    ],
  },
  {
    id: 'checker',
    title: 'What we do not collect',
    body: [
      'The text you paste into Check a message is scored in your browser. It is not sent to our servers and it is not stored in your account.',
    ],
  },
  {
    id: 'use',
    title: 'How we use your information',
    list: [
      'To create and run your account and to sign you in.',
      'To answer your support tickets.',
      'To send the newsletter, only if you chose to receive it.',
      'To keep the service secure and to fix problems.',
    ],
  },
  {
    id: 'share',
    title: 'Who we share it with',
    body: [
      'We do not sell your information. We use service providers for hosting and sign-in, and they process data only to run those services for us. We may disclose information if the law requires it.',
    ],
  },
  {
    id: 'keep',
    title: 'How long we keep it',
    body: [
      'We keep your account details while your account is active. We keep support tickets for a reasonable time afterwards so that we can answer follow-up questions. When you ask us to delete your details, we remove them unless we must keep something by law.',
    ],
  },
  {
    id: 'rights',
    title: 'Your choices',
    list: [
      'See and change your details at any time on the Account page.',
      'Ask for a copy of your information, or for it to be deleted, by opening a support ticket in the Privacy request category.',
      'Turn the newsletter off on the Account page.',
    ],
  },
  {
    id: 'security',
    title: 'Security',
    body: [
      'We use reasonable measures to protect your information. No website can promise perfect security, so please use a strong password that you do not use anywhere else.',
    ],
  },
  {
    id: 'changes',
    title: 'Changes to this policy',
    body: [
      'If we change this policy we will post the new version on this page and update the date below.',
    ],
  },
];

export default function Privacy() {
  return (
    <div className='mx-auto max-w-6xl px-4 py-14 lg:px-8 lg:py-20'>
      <h1 className='font-heading text-4xl font-semibold tracking-tight sm:text-5xl'>
        Your information, <span className='text-highlight italic'>plainly explained</span>
      </h1>
      <p className='mt-3 text-sm text-muted-foreground'>Last updated: October 2026</p>

      <div className='mt-12 grid gap-10 lg:grid-cols-[14rem_1fr] lg:gap-16'>
        <nav className='hidden lg:block'>
          <ul className='sticky top-24 space-y-2 border-l border-border pl-4 text-sm'>
            {sections.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className='text-muted-foreground transition-colors duration-(--transition-fast) hover:text-foreground'>
                  {s.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className='max-w-2xl space-y-12'>
          {sections.map((s) => (
            <section key={s.id} id={s.id} className='scroll-mt-24'>
              <h2 className='font-heading text-2xl font-semibold'>{s.title}</h2>
              {s.body?.map((p) => (
                <p key={p} className='mt-3 leading-relaxed text-muted-foreground'>
                  {p}
                </p>
              ))}
              {s.list && (
                <ul className='mt-3 list-disc space-y-2 pl-5 leading-relaxed text-muted-foreground'>
                  {s.list.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}

          <section className='border-t border-border pt-8'>
            <h2 className='font-heading text-2xl font-semibold'>Contact</h2>
            <p className='mt-3 leading-relaxed text-muted-foreground'>
              Email{' '}
              <a href='mailto:hello@veritas.example' className='font-semibold text-foreground underline underline-offset-4'>
                hello@veritas.example
              </a>{' '}
              or open a ticket from the{' '}
              <Link to='/support' className='font-semibold text-foreground underline underline-offset-4'>
                support page
              </Link>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
