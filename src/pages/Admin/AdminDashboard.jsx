import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { sdk } from '@/services/sdk';
import { useFetch } from '@/hooks/useFetch';
import ApperIcon from '@/components/ApperIcon';
import { StatsSkeleton, ListSkeleton } from '@/components/PageSkeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatRelativeTime } from '@/utils/date';
import { priorityStyles, statusStyles } from '@/lib/ticketMeta';
import { eq, isIn } from '@/services/query';

export const route = { path: '/admin', layout: 'owner', access: "profile === 'Admin_c'" };
export const nav = {
  icon: 'LayoutDashboard',
  label: 'Dashboard',
  section: 'Console',
  profiles: ['Admin_c'],
  order: 10,
};

const count = (id) => ({ id, fields: [{ field: 'Id', fn: 'Count', alias: 'count' }] });

function readAgg(res, id) {
  const b = res.aggregators?.find((a) => a.id === id);
  return b?.data?.count ?? b?.count ?? b?.value ?? 0;
}

async function fetchStats() {
  const tickets = await sdk
    .table('support_tickets_c')
    .select([{ field: 'Id' }])
    .aggregate([
      count('total'),
      { ...count('open'), where: eq('status_c', 'Open') },
      { ...count('progress'), where: eq('status_c', 'In progress') },
      { ...count('resolved'), where: eq('status_c', 'Resolved') },
      { ...count('highOpen'), where: isIn('status_c', ['Open', 'In progress']) },
    ])
    .limit(1)
    .fetch();
  if (!tickets.success) throw new Error(tickets.message);

  const articles = await sdk
    .table('help_articles_c')
    .select([{ field: 'Id' }])
    .aggregate([count('total'), { ...count('published'), where: eq('published_c', true) }])
    .limit(1)
    .fetch();
  if (!articles.success) throw new Error(articles.message);

  let customers = null;
  try {
    const m = await sdk.teams.getMembers(0, 1);
    customers = m.total ?? (m.data ?? []).length;
  } catch {
    customers = null;
  }

  const total = readAgg(articles, 'total');
  const published = readAgg(articles, 'published');
  return {
    open: readAgg(tickets, 'open'),
    progress: readAgg(tickets, 'progress'),
    resolved: readAgg(tickets, 'resolved'),
    tickets: readAgg(tickets, 'total'),
    customers,
    published,
    drafts: total - published,
  };
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function AdminDashboard() {
  const user = useSelector((s) => s.user.user);
  const firstName = user?.FirstName ?? (user?.Name ?? '').split(' ')[0];

  const { data: stats, loading: statsLoading, error: statsError, run: refetchStats } = useFetch(fetchStats, []);

  const { data: waiting, loading: waitingLoading, error: waitingError, run: refetchWaiting } = useFetch(
    () =>
      sdk
        .table('support_tickets_c')
        .select(['Id', 'Name', 'priority_c', 'status_c', 'Owner', 'CreatedOn'])
        .where(isIn('status_c', ['Open', 'In progress']))
        .orderBy('CreatedOn')
        .limit(6, 0)
        .fetch()
        .then((r) => {
          if (!r.success) throw new Error(r.message);
          return r.data;
        }),
    [],
  );

  const { data: articles } = useFetch(
    () =>
      sdk
        .table('help_articles_c')
        .select(['Id', 'Name', 'category_c', 'published_c', 'ModifiedOn'])
        .orderByDesc('ModifiedOn')
        .limit(5, 0)
        .fetch()
        .then((r) => (r.success ? r.data : [])),
    [],
  );

  const tiles = stats
    ? [
        { label: 'Open tickets', value: stats.open, accent: stats.open > 0 },
        { label: 'In progress', value: stats.progress },
        { label: 'Resolved', value: stats.resolved },
        { label: 'Customers and team', value: stats.customers ?? '-' },
      ]
    : [];

  return (
    <div className='mx-auto max-w-6xl space-y-10'>
      <div className='flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6'>
        <div>
          <h1 className='font-heading text-4xl font-semibold tracking-tight'>
            {greeting()}
            {firstName ? `, ${firstName}` : ''}
            <span className='text-highlight'>.</span>
          </h1>
        </div>
        <div className='flex flex-wrap gap-2'>
          <Button asChild>
            <Link to='/admin/tickets'>Answer tickets</Link>
          </Button>
          <Button asChild variant='outline'>
            <Link to='/admin/articles/new'>
              <ApperIcon name='Plus' size={16} /> New article
            </Link>
          </Button>
        </div>
      </div>

      {statsError ? (
        <div className='border border-border p-6 text-center'>
          <p className='font-semibold'>Could not load the numbers</p>
          <p className='mt-1 text-sm text-muted-foreground'>{statsError.message}</p>
          <Button className='mt-3' variant='outline' size='sm' onClick={refetchStats}>
            Try again
          </Button>
        </div>
      ) : statsLoading && stats === undefined ? (
        <StatsSkeleton count={4} />
      ) : (
        <section>
          <div className='grid grid-cols-2 border-y border-border md:grid-cols-4 md:divide-x md:divide-border'>
            {tiles.map((t) => (
              <div key={t.label} className='border-b border-border px-1 py-5 md:border-b-0 md:px-6 md:first:pl-0'>
                <p className='text-xs font-bold uppercase tracking-widest text-muted-foreground'>{t.label}</p>
                <p className={cn('mt-2 font-heading text-5xl font-semibold tabular-nums', t.accent && 'text-highlight')}>
                  {t.value}
                </p>
              </div>
            ))}
          </div>
          <p className='mt-4 text-sm text-muted-foreground'>
            {stats.tickets} tickets in total · {stats.published} articles published · {stats.drafts}{' '}
            {stats.drafts === 1 ? 'draft' : 'drafts'} waiting
          </p>
        </section>
      )}

      <div className='grid gap-10 lg:grid-cols-[1.4fr_1fr]'>
        <section>
          <div className='flex items-baseline justify-between'>
            <h2 className='font-heading text-2xl font-semibold'>Waiting longest</h2>
            <Link to='/admin/tickets' className='text-sm font-semibold underline-offset-4 hover:underline'>
              All tickets
            </Link>
          </div>
          {waitingError ? (
            <div className='mt-4 border border-border p-6 text-center'>
              <p className='text-sm'>Could not load tickets</p>
              <Button className='mt-3' variant='outline' size='sm' onClick={refetchWaiting}>
                Try again
              </Button>
            </div>
          ) : waitingLoading && waiting === undefined ? (
            <div className='mt-4'>
              <ListSkeleton rows={4} />
            </div>
          ) : (waiting ?? []).length === 0 ? (
            <div className='mt-4 border border-dashed border-border p-8 text-center'>
              <p className='font-heading text-lg font-semibold'>Nothing is waiting</p>
              <p className='mt-1 text-sm text-muted-foreground'>Every ticket has been answered.</p>
            </div>
          ) : (
            <ul className='mt-4 divide-y divide-border border-y border-border'>
              {waiting.map((t) => {
                const st = statusStyles[t.status_c];
                const pr = priorityStyles[t.priority_c];
                return (
                  <li key={t.Id} className={cn('px-3 py-3', st?.row)}>
                    <Link to={`/admin/tickets/${t.Id}`} className='block'>
                      <p className='truncate font-semibold underline-offset-4 hover:underline'>{t.Name}</p>
                      <p className='mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground'>
                        <Badge variant='outline' className={cn('font-medium', st?.badge)}>
                          {t.status_c}
                        </Badge>
                        <span className={cn('flex items-center gap-1.5 font-medium', pr?.text)}>
                          <span className={cn('size-1.5 rounded-full', pr?.dot)} />
                          {t.priority_c}
                        </span>
                        <span>{t.Owner?.Name ?? 'Unknown customer'}</span>
                        <span>Opened {formatRelativeTime(t.CreatedOn)}</span>
                      </p>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <aside className='space-y-10'>
          <section>
            <div className='flex items-baseline justify-between'>
              <h2 className='font-heading text-2xl font-semibold'>Recent articles</h2>
              <Link to='/admin/articles' className='text-sm font-semibold underline-offset-4 hover:underline'>
                Manage
              </Link>
            </div>
            <ul className='mt-4 divide-y divide-border border-y border-border'>
              {(articles ?? []).map((a) => (
                <li key={a.Id}>
                  <Link to={`/admin/articles/${a.Id}`} className='group flex items-center justify-between gap-3 py-3'>
                    <span className='min-w-0'>
                      <span className='block truncate font-semibold underline-offset-4 group-hover:underline'>{a.Name}</span>
                      <span className='text-xs text-muted-foreground'>{a.category_c}</span>
                    </span>
                    {a.published_c ? (
                      <Badge variant='outline' className='shrink-0 border-success-border bg-success-muted text-success'>
                        Live
                      </Badge>
                    ) : (
                      <Badge variant='outline' className='shrink-0 bg-muted text-muted-foreground'>
                        Draft
                      </Badge>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className='font-heading text-2xl font-semibold'>People</h2>
            <p className='mt-2 text-sm leading-relaxed text-muted-foreground'>
              See who has signed up, check the details they saved and invite new team members.
            </p>
            <Button asChild variant='outline' size='sm' className='mt-4'>
              <Link to='/admin/customers'>Open customers</Link>
            </Button>
          </section>
        </aside>
      </div>
    </div>
  );
}
