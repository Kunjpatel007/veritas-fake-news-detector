import { Link } from 'react-router-dom';
import { Sun, Moon, Monitor } from 'lucide-react';
import ApperIcon from '@/components/ApperIcon';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getProfileMeta } from '@/services/userPermissions';
import { useAuth } from '@/layouts/RootLayout';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

const ADMIN_LINKS = [
  { to: '/admin/account', icon: 'UserRound', label: 'Account details', desc: 'Profile and preferences' },
  { to: '/admin/tickets', icon: 'LifeBuoy', label: 'Support tickets', desc: 'Member inquiries & tickets' },
  { to: '/admin/customers', icon: 'Users', label: 'Team & members', desc: 'Manage access and roles' },
];

const MEMBER_LINKS = [
  { to: '/account', icon: 'UserRound', label: 'Account details', desc: 'Profile, language & info' },
  { to: '/support', icon: 'LifeBuoy', label: 'Support tickets', desc: 'Conversations with our team' },
];

function resolveDisplayName(user, fallbackName) {
  if (fallbackName && !fallbackName.includes('@')) return fallbackName;
  const first = user?.FirstName ?? user?.firstName ?? '';
  const last = user?.LastName ?? user?.lastName ?? '';
  const fullName = [first, last].filter(Boolean).join(' ').trim();
  if (fullName) return fullName;

  const rawName = user?.Name ?? user?.name ?? '';
  if (rawName && !rawName.includes('@')) return rawName;

  const email = user?.emailAddress ?? user?.Email ?? user?.email ?? '';
  if (email && email.includes('@')) {
    const handle = email.split('@')[0];
    // Convert handles like "kunjpatel789" or "kunj.patel" to a friendly readable name
    const match = handle.match(/^([a-zA-Z]+)(?:[._-]?([a-zA-Z]+))?/);
    if (match) {
      const p1 = match[1];
      const p2 = match[2];
      if (p2) {
        return `${p1.charAt(0).toUpperCase() + p1.slice(1).toLowerCase()} ${p2.charAt(0).toUpperCase() + p2.slice(1).toLowerCase()}`;
      }
      // Check if handle is e.g. "kunjpatel"
      if (p1.length >= 6) {
        // e.g. "kunj" (4) + "patel" (5)
        for (const splitIdx of [3, 4, 5]) {
          if (splitIdx < p1.length - 2) {
            const firstWord = p1.slice(0, splitIdx);
            const secondWord = p1.slice(splitIdx);
            if (/^(patel|shah|sharma|singh|kumar|gupta|mehta|desai|joshi)/i.test(secondWord)) {
              return `${firstWord.charAt(0).toUpperCase() + firstWord.slice(1).toLowerCase()} ${secondWord.charAt(0).toUpperCase() + secondWord.slice(1).toLowerCase()}`;
            }
          }
        }
      }
      return p1.charAt(0).toUpperCase() + p1.slice(1).toLowerCase();
    }
    return handle;
  }
  return 'Member Account';
}

function resolveInitials(name, email) {
  if (name && name !== 'Member Account' && !name.includes('@')) {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    if (parts.length === 1 && parts[0].length >= 2) {
      return parts[0].slice(0, 2).toUpperCase();
    }
  }
  if (email && email.includes('@')) {
    const handle = email.split('@')[0];
    return handle.slice(0, 2).toUpperCase();
  }
  return 'V';
}

export default function UserMenu({ user: userProp, initials: initialsProp, displayName: nameProp, logout: logoutProp }) {
  const auth = useAuth();
  const { theme, setTheme } = useTheme();
  const user = userProp ?? auth.user;
  const logout = logoutProp ?? auth.logout;

  const email = user?.emailAddress ?? user?.Email ?? user?.email ?? '';
  const displayName = resolveDisplayName(user, nameProp);
  const initials = initialsProp ?? resolveInitials(displayName, email);
  const meta = getProfileMeta(user?.profile);
  const isAdmin = user?.profile === 'Admin_c';

  const links = (isAdmin ? ADMIN_LINKS : MEMBER_LINKS)
    .filter((link) => link.to !== '/admin/customers' || meta.canManageTeam);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type='button'
          aria-label='Open account menu'
          className='flex size-9 items-center justify-center rounded-full border border-border bg-muted/60 text-xs font-bold text-foreground transition-all duration-150 hover:border-foreground/40 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring shadow-xs cursor-pointer'
        >
          {initials}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align='end' className='w-76 rounded-xl border border-border bg-card p-1 shadow-lg text-card-foreground'>
        {/* User Profile Card Header */}
        <div className='flex items-center gap-3 rounded-lg bg-muted/30 p-3 border border-border/50'>
          <div className='flex size-11 shrink-0 items-center justify-center rounded-full bg-foreground text-background text-sm font-bold shadow-xs'>
            {initials}
          </div>
          <div className='min-w-0 flex-1'>
            <div className='flex items-center justify-between gap-1'>
              <p className='truncate text-sm font-bold text-foreground leading-tight'>
                {displayName}
              </p>
              <span className='inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400'>
                <span className='size-1.5 rounded-full bg-emerald-500' />
                {isAdmin ? 'Admin' : 'Member'}
              </span>
            </div>
            {email && (
              <p className='truncate text-xs text-muted-foreground mt-0.5 font-sans' title={email}>
                {email}
              </p>
            )}
          </div>
        </div>

        {/* Appearance Toggle */}
        <div className='px-2.5 py-2.5'>
          <div className='flex items-center justify-between text-xs text-muted-foreground mb-1.5 px-0.5'>
            <span className='font-semibold'>Theme</span>
            <span className='text-[11px] font-medium capitalize text-muted-foreground/80'>{theme}</span>
          </div>
          <div className='grid grid-cols-3 gap-1 rounded-lg border border-border/80 bg-muted/30 p-1'>
            <button
              type='button'
              onClick={() => setTheme('light')}
              className={cn(
                'flex items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition-all cursor-pointer',
                theme === 'light'
                  ? 'bg-background text-foreground shadow-xs font-bold'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Sun size={13} /> Light
            </button>
            <button
              type='button'
              onClick={() => setTheme('dark')}
              className={cn(
                'flex items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition-all cursor-pointer',
                theme === 'dark'
                  ? 'bg-background text-foreground shadow-xs font-bold'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Moon size={13} /> Dark
            </button>
            <button
              type='button'
              onClick={() => setTheme('system')}
              className={cn(
                'flex items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition-all cursor-pointer',
                theme === 'system'
                  ? 'bg-background text-foreground shadow-xs font-bold'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Monitor size={13} /> System
            </button>
          </div>
        </div>

        <DropdownMenuSeparator className='my-1 bg-border/60' />

        {/* Navigation Links */}
        <div className='space-y-0.5 p-1'>
          {links.map((l) => (
            <DropdownMenuItem key={l.to} asChild className='rounded-lg px-2.5 py-2 cursor-pointer transition-colors focus:bg-muted/60'>
              <Link to={l.to} className='flex items-start gap-3 w-full'>
                <div className='mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md border border-border/60 bg-muted/30 text-muted-foreground group-hover:text-foreground'>
                  <ApperIcon name={l.icon} size={14} />
                </div>
                <div className='flex-1 min-w-0'>
                  <p className='text-xs font-semibold text-foreground leading-tight'>{l.label}</p>
                  <p className='text-[11px] text-muted-foreground truncate'>{l.desc}</p>
                </div>
              </Link>
            </DropdownMenuItem>
          ))}
        </div>

        <DropdownMenuSeparator className='my-1 bg-border/60' />

        {/* Sign out */}
        <div className='p-1'>
          <DropdownMenuItem
            onClick={logout}
            className='rounded-lg px-2.5 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 focus:bg-rose-500/10 focus:text-rose-600 dark:focus:text-rose-300 cursor-pointer transition-colors'
          >
            <div className='flex items-center gap-3 w-full'>
              <div className='flex size-6 shrink-0 items-center justify-center rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400'>
                <ApperIcon name='LogOut' size={14} />
              </div>
              <span>Sign out</span>
            </div>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
