import { useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import ApperIcon from '@/components/ApperIcon';
import ThemeToggle from '@/components/ThemeToggle';
import UserMenu from '@/components/UserMenu';
import SiteFooter from '@/components/SiteFooter';
import { Button } from '@/components/ui/button';
import ConnectedAuth from '@/components/ConnectedAuth';
import MessageAnalysisPreview from '@/components/MessageAnalysisPreview';

const memberLinks = [
  { to: '/home', label: 'Home' },
  { to: '/check', label: 'Verify News & Rumors' },
  { to: '/help', label: 'Help Center' },
  { to: '/support', label: 'Support' },
  { to: '/about', label: 'About us' },
];

const guestLinks = [
  { to: '/check', label: 'Verify News & Rumors' },
  { to: '/about', label: 'About us' },
  { to: '/privacy', label: 'Privacy' },
];

export default function PublicLayout() {
  const prefersReducedMotion = useReducedMotion();
  const user = useSelector((s) => s.user.user);
  const { pathname } = useLocation();
  const authMatch = pathname.match(/^\/(?:([^/]+)\/)?(login|signup)\/?$/);
  const isAuthPage = Boolean(authMatch);
  const signedIn = Boolean(user?.Id);
  const isMember = signedIn && user.profile === 'Member_c';
  const links = isMember ? memberLinks : guestLinks;
  const [open, setOpen] = useState(false);

  const linkClass = ({ isActive }) =>
    cn(
      'text-sm font-medium transition-colors duration-(--transition-fast) hover:text-foreground',
      isActive ? 'text-foreground underline decoration-highlight decoration-2 underline-offset-8 font-semibold' : 'text-muted-foreground',
    );

  const account = isMember ? (
    <UserMenu />
  ) : signedIn ? (
    <Button asChild size='sm'>
      <Link to='/admin'>Admin console</Link>
    </Button>
  ) : (
    <>
      <Button asChild variant='ghost' size='sm'>
        <Link to='/member/login'>Sign in</Link>
      </Button>
      <Button asChild size='sm' className='bg-foreground text-background hover:bg-foreground/90'>
        <Link to='/member/signup'>Sign up</Link>
      </Button>
    </>
  );

  if (isAuthPage) {
    return (
      <div className='auth-root min-h-svh bg-background text-foreground'>
        <main className='grid min-h-svh lg:grid-cols-2'>
          <section className='auth-story relative flex min-h-76 flex-col overflow-hidden px-6 py-6 text-white sm:px-10 sm:py-8 lg:min-h-svh lg:border-r lg:border-highlight/20 lg:px-14 lg:py-10'>
            <div className='auth-story-grid absolute inset-0' aria-hidden='true' />
            <div className='relative flex items-center justify-between'>
              <Link to='/' className='flex items-center gap-2 font-heading text-2xl font-semibold tracking-tight text-white'>
                Veritas<span className='text-[#f18b69]'>.</span>
              </Link>
              <span className='hidden items-center gap-2 text-xs font-medium text-white/70 sm:flex'>
                <ApperIcon name='ShieldCheck' size={15} /> Independent by design
              </span>
            </div>

            <div className='relative my-auto max-w-xl py-9 lg:py-12'>
              <motion.h2
                initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: prefersReducedMotion ? 0 : 0.42, delay: prefersReducedMotion ? 0 : 0.05, ease: 'easeOut' }}
                className='max-w-lg font-heading text-5xl font-semibold leading-[1.02] sm:text-6xl lg:text-7xl'
              >
                Read it twice.<br />
                Share it <span className='italic text-highlight'>once.</span>
              </motion.h2>
              <motion.p
                initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: prefersReducedMotion ? 0 : 0.4, delay: prefersReducedMotion ? 0 : 0.08, ease: 'easeOut' }}
                className='mt-6 max-w-lg text-base leading-relaxed text-white/70 sm:text-lg'
              >
                Veritas underlines the words in a forward that should make you pause, and shows you what is actually true. Sign in or create a free account to begin.
              </motion.p>
              <MessageAnalysisPreview className='relative mt-8 max-w-3xl border border-border bg-card p-5 shadow-lg sm:mt-10 sm:p-6' />
            </div>
          </section>

          <motion.section
            initial={prefersReducedMotion ? false : { opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.42, delay: prefersReducedMotion ? 0 : 0.08, ease: 'easeOut' }}
            className='auth-form-panel flex min-h-124 items-center justify-center px-6 py-12 sm:px-10 lg:min-h-svh lg:px-14'
          >
            <div className='w-full max-w-104 [&_input]:h-12 [&_input]:rounded-md [&_button]:transition-colors [&_button]:duration-(--transition-fast) [&_a]:rounded-sm [&_a]:focus-visible:outline-none [&_a]:focus-visible:ring-2 [&_a]:focus-visible:ring-ring [&_a]:active:opacity-80'>
              <ConnectedAuth key={`${authMatch[1]}-${authMatch[2]}`} profileKey={authMatch[1] || 'member'} mode={authMatch[2]} />
              <p className='mt-10 text-center text-xs text-muted-foreground'>
                <ApperIcon name='LockKeyhole' size={13} className='mr-1.5 inline-block align-[-2px]' />
                Your account and information stay private.
              </p>
            </div>
          </motion.section>
        </main>
      </div>
    );
  }

  return (
    <div className='flex min-h-svh flex-col bg-background text-foreground'>
      <header className='sticky top-0 z-(--z-sticky) border-b border-border bg-background/90 backdrop-blur-md'>
        <div className='mx-auto flex h-(--spacing-header) max-w-6xl items-center gap-6 px-4 lg:px-8'>
          <Link to={isMember ? '/home' : '/'} className='flex items-center gap-2 group'>
            <span className='font-heading text-2xl font-bold tracking-tight'>
              Veritas<span className='text-highlight'>.</span>
            </span>
          </Link>

          <nav className='ml-4 hidden items-center gap-7 md:flex'>
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} className={linkClass}>
                {l.label}
              </NavLink>
            ))}
          </nav>

          <div className='ml-auto hidden items-center gap-3 md:flex'>
            {!isMember && <ThemeToggle />}
            {account}
          </div>

          <div className='ml-auto flex items-center gap-2 md:hidden'>
            {!isMember && <ThemeToggle />}
            {isMember && <UserMenu />}
            <button
              type='button'
              className='flex size-10 items-center justify-center rounded-md border border-border bg-card'
              aria-label='Toggle menu'
              onClick={() => setOpen((o) => !o)}
            >
              <ApperIcon name={open ? 'X' : 'Menu'} size={20} />
            </button>
          </div>
        </div>

        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className='space-y-4 border-t border-border bg-card px-5 py-5 shadow-lg md:hidden'
          >
            <nav className='flex flex-col gap-3'>
              {links.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  className={({ isActive }) =>
                    cn(
                      'text-base font-medium py-1 transition-colors',
                      isActive ? 'text-highlight font-semibold' : 'text-muted-foreground'
                    )
                  }
                  onClick={() => setOpen(false)}
                >
                  {l.label}
                </NavLink>
              ))}
            </nav>
            {!isMember && (
              <div className='flex flex-col gap-2 border-t border-border pt-4'>
                {account}
              </div>
            )}
          </motion.div>
        )}
      </header>

      <main className='flex-1'>
        <Outlet />
      </main>

      <SiteFooter variant={isMember ? 'member' : 'guest'} />
    </div>
  );
}
