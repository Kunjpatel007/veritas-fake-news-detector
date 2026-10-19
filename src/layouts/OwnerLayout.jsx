import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { useOwnerLayoutData } from '@/hooks/useOwnerLayoutData';
import { cn } from '@/lib/utils';
import ApperIcon from '@/components/ApperIcon';
import UserMenu from '@/components/UserMenu';
import { ErrorBoundary } from '@/components/ui/error-boundary';

function Brand({ to, compact }) {
  return (
    <Link to={to} className='flex items-center gap-2.5 font-heading text-xl font-semibold'>
      <span className='flex size-8 shrink-0 items-center justify-center rounded-sm border border-sidebar-border text-sidebar-primary'>
        <ApperIcon name='ShieldCheck' size={18} />
      </span>
      {!compact && (
        <span className='flex items-baseline gap-2'>
          <span>
            Veritas<span className='text-highlight'>.</span>
          </span>
          <span className='text-[0.65rem] font-bold uppercase tracking-widest text-sidebar-foreground/60'>Admin</span>
        </span>
      )}
    </Link>
  );
}

export default function OwnerLayout() {
  const { user, logout, homeRoute, navItems, navGroups, initials, displayName } = useOwnerLayoutData();
  const groups = navGroups.length ? navGroups : [{ label: null, items: navItems }];
  const [collapsed, setCollapsed] = useState(false);
  const [navOpen, setNavOpen] = useState(false);

  const renderNav = (compact, onNavigate) =>
    groups.map((g, gi) => (
      <div key={g.label ?? `group-${gi}`} className='space-y-1'>
        {g.label && !compact && (
          <p className='px-3 pb-1 pt-4 text-[0.68rem] font-bold uppercase tracking-widest text-sidebar-foreground/50'>
            {g.label}
          </p>
        )}
        {g.items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/admin'}
            title={compact ? item.label : undefined}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm font-medium transition-colors duration-(--transition-fast)',
                compact && 'justify-center px-0',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground',
              )
            }
          >
            <ApperIcon name={item.icon ?? 'Circle'} size={18} />
            {!compact && <span>{item.label}</span>}
          </NavLink>
        ))}
      </div>
    ));

  return (
    <div className='min-h-svh bg-background text-foreground lg:flex'>
      <aside
        className={cn(
          'sticky top-0 hidden h-svh shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-(--transition-normal) lg:flex',
          collapsed ? 'w-[4.5rem]' : 'w-60',
        )}
      >
        <div className={cn('flex h-(--spacing-header) items-center border-b border-sidebar-border px-4', collapsed && 'justify-center px-0')}>
          <Brand to={homeRoute} compact={collapsed} />
        </div>
        <nav className='flex-1 space-y-1 overflow-y-auto p-3'>{renderNav(collapsed)}</nav>
        <div className='border-t border-sidebar-border p-3'>
          <button
            type='button'
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
            className={cn(
              'flex w-full items-center gap-3 rounded-sm px-3 py-2.5 text-sm text-sidebar-foreground/70 transition-colors duration-(--transition-fast) hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground',
              collapsed && 'justify-center px-0',
            )}
          >
            <ApperIcon name={collapsed ? 'PanelLeftOpen' : 'PanelLeftClose'} size={18} />
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      </aside>

      <div className='flex min-w-0 flex-1 flex-col'>
        <header className='sticky top-0 z-(--z-sticky) flex h-(--spacing-header) items-center gap-3 border-b border-border bg-background/90 px-4 backdrop-blur md:px-6'>
          <button
            type='button'
            className='flex size-9 items-center justify-center rounded-sm border border-border lg:hidden'
            aria-label='Toggle navigation'
            onClick={() => setNavOpen((o) => !o)}
          >
            <ApperIcon name={navOpen ? 'X' : 'Menu'} size={20} />
          </button>
          <Link to={homeRoute} className='font-heading text-xl font-semibold lg:hidden'>
            Veritas<span className='text-highlight'>.</span>
          </Link>
          <div className='ml-auto'>
            <UserMenu user={user} initials={initials} displayName={displayName} logout={logout} />
          </div>
        </header>

        {navOpen && (
          <nav className='border-b border-sidebar-border bg-sidebar p-3 text-sidebar-foreground lg:hidden'>
            {renderNav(false, () => setNavOpen(false))}
          </nav>
        )}

        <main className='min-w-0 flex-1 p-4 md:p-8'>
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
