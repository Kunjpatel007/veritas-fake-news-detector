import { Link } from 'react-router-dom';
import ApperIcon from '@/components/ApperIcon';

const columns = [
  {
    title: 'Website',
    links: [
      { to: '/home', label: 'Home' },
      { to: '/check', label: 'Check a message' },
      { to: '/help', label: 'Help Center' },
      { to: '/support', label: 'Support tickets' },
    ],
  },
  {
    title: 'Company',
    links: [
      { to: '/about', label: 'About us' },
      { to: '/privacy', label: 'Privacy policy' },
      { to: '/account', label: 'Your account' },
    ],
  },
];

function Helpline() {
  return (
    <p>
      Scam already happened? Call <span className='font-bold text-highlight'>1930</span> or report at{' '}
      <a
        href='https://cybercrime.gov.in'
        target='_blank'
        rel='noreferrer'
        className='underline underline-offset-4 hover:text-foreground'
      >
        cybercrime.gov.in
      </a>
    </p>
  );
}

export default function SiteFooter({ variant = 'member' }) {
  const year = new Date().getFullYear();

  if (variant === 'guest') {
    return (
      <footer className='border-t border-border bg-card text-card-foreground'>
        <div className='mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between lg:px-8'>
          <div className='flex flex-wrap items-center gap-x-5 gap-y-2'>
            <span>© {year} Veritas</span>
            <Link to='/about' className='hover:text-foreground'>
              About us
            </Link>
            <Link to='/privacy' className='hover:text-foreground'>
              Privacy policy
            </Link>
            <Link to='/admin/login' className='hover:text-foreground'>
              Admin console
            </Link>
          </div>
          <Helpline />
        </div>
      </footer>
    );
  }

  return (
    <footer className='border-t border-border bg-card text-card-foreground'>
      <div className='mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr] lg:px-8'>
        <div className='space-y-4'>
          <p className='font-heading text-2xl font-semibold'>
            Veritas<span className='text-highlight'>.</span>
          </p>
          <p className='max-w-xs text-sm leading-relaxed text-muted-foreground'>
            Veritas checks how a message is written, marks the words that raise suspicion and points you to
            trusted sources. It judges style and sourcing, not truth.
          </p>
        </div>

        {columns.map((col) => (
          <div key={col.title} className='space-y-3'>
            <p className='text-xs font-bold uppercase tracking-widest text-muted-foreground'>{col.title}</p>
            <ul className='space-y-2 text-sm'>
              {col.links.map((l) => (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    className='text-foreground/80 underline-offset-4 transition-colors duration-(--transition-fast) hover:text-foreground hover:underline'
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div className='space-y-3'>
          <p className='text-xs font-bold uppercase tracking-widest text-muted-foreground'>Contact</p>
          <ul className='space-y-2.5 text-sm'>
            <li className='flex items-start gap-2'>
              <ApperIcon name='Mail' size={16} className='mt-0.5 shrink-0 text-muted-foreground' />
              <a href='mailto:hello@veritas.example' className='underline-offset-4 hover:underline'>
                hello@veritas.example
              </a>
            </li>
            <li className='flex items-start gap-2'>
              <ApperIcon name='Phone' size={16} className='mt-0.5 shrink-0 text-muted-foreground' />
              <a href='tel:+910000000000' className='underline-offset-4 hover:underline'>
                +91 00000 00000
              </a>
            </li>
            <li className='flex items-start gap-2'>
              <ApperIcon name='Clock' size={16} className='mt-0.5 shrink-0 text-muted-foreground' />
              <span>Mon to Sat, 10:00 to 18:00 IST</span>
            </li>
            <li className='flex items-start gap-2'>
              <ApperIcon name='MapPin' size={16} className='mt-0.5 shrink-0 text-muted-foreground' />
              <span>Gujarat, India</span>
            </li>
          </ul>
        </div>
      </div>

      <div className='border-t border-border'>
        <div className='mx-auto flex max-w-6xl flex-col gap-3 px-4 py-5 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between lg:px-8'>
          <p>© {year} Veritas. Built by Team Veritas.</p>
          <Helpline />
        </div>
      </div>
    </footer>
  );
}
