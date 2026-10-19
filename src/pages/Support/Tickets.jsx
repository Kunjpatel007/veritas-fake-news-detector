import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { sdk } from '@/services/sdk';
import { useFetch } from '@/hooks/useFetch';
import { useProfile } from '@/hooks/useProfile';
import { getTableAccess } from '@/services/userPermissions';
import ApperIcon from '@/components/ApperIcon';
import { ListSkeleton } from '@/components/PageSkeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { formatLocalDate, DATE_FORMATS } from '@/utils/date';
import { TICKET_PRIORITIES, TICKET_STATUSES, priorityStyles, statusStyles } from '@/lib/ticketMeta';
import TicketDialog from './TicketDialog';
import { and, contains, eq } from '@/services/query';

export const route = { path: '/support', layout: 'public', access: "profile === 'Member_c'" };

const PAGE_SIZE = 10;
const FIELDS = ['Id', 'Name', 'category_c', 'priority_c', 'status_c', 'Owner', 'CreatedOn'];

export default function Tickets({ basePath = '/support', pad = true }) {
  const navigate = useNavigate();
  const { profile } = useProfile();
  const isAdmin = profile === 'Admin_c';
  const { canCreate } = getTableAccess(profile, 'support_tickets_c');

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [priority, setPriority] = useState('all');
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [search, status, priority]);

  const { data, loading, error, run } = useFetch(() => {
    const f = [];
    if (status !== 'all') f.push(eq('status_c', status));
    if (priority !== 'all') f.push(eq('priority_c', priority));
    if (search.trim()) f.push(contains('Name', search.trim()));
    let q = sdk.table('support_tickets_c').select(FIELDS);
    if (f.length) q = q.where(and(...f));
    return q
      .orderByDesc('CreatedOn')
      .page(page, PAGE_SIZE)
      .fetch()
      .then((r) => {
        if (!r.success) throw new Error(r.message);
        return { rows: r.data, total: r.total, hasMore: r.hasMore };
      });
  }, [search, status, priority, page]);

  const rows = data?.rows ?? [];
  const firstLoad = loading && data === undefined;

  return (
    <div className={cn('mx-auto max-w-5xl space-y-6', pad && 'px-4 py-10 lg:px-8 lg:py-14')}>
      <div className='flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6'>
        <div>
          <h1 className='font-heading text-3xl font-semibold tracking-tight'>Support tickets</h1>
          <p className='mt-1 text-sm text-muted-foreground'>
            {isAdmin ? 'Every ticket customers have opened.' : 'Your conversations with the Veritas team.'}
          </p>
        </div>
        {canCreate && (
          <TicketDialog
            isAdmin={isAdmin}
            onSaved={run}
            trigger={
              <Button>
                <ApperIcon name='Plus' size={16} /> New ticket
              </Button>
            }
          />
        )}
      </div>

      <div className='flex flex-col gap-3 md:flex-row'>
        <div className='relative flex-1'>
          <ApperIcon name='Search' size={16} className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground' />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder='Search by subject'
            className='pl-9'
            aria-label='Search tickets'
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className='w-full md:w-44'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All statuses</SelectItem>
            {TICKET_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={priority} onValueChange={setPriority}>
          <SelectTrigger className='w-full md:w-44'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All priorities</SelectItem>
            {TICKET_PRIORITIES.map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error ? (
        <div className='border border-border p-8 text-center'>
          <p className='font-heading text-xl font-semibold'>Could not load tickets</p>
          <p className='mt-1 text-sm text-muted-foreground'>{error.message}</p>
          <Button className='mt-4' variant='outline' onClick={run}>
            Try again
          </Button>
        </div>
      ) : firstLoad ? (
        <ListSkeleton rows={6} />
      ) : rows.length === 0 ? (
        <div className='border border-dashed border-border p-10 text-center'>
          <p className='font-heading text-xl font-semibold'>No tickets here</p>
          <p className='mt-1 text-sm text-muted-foreground'>
            {search || status !== 'all' || priority !== 'all'
              ? 'No ticket matches these filters.'
              : 'When you open a ticket it will show up here.'}
          </p>
        </div>
      ) : (
        <div aria-busy={loading} className={cn('transition-opacity', loading && 'pointer-events-none opacity-60')}>
          <div className='hidden grid-cols-[1fr_7rem_7rem_7rem] gap-6 px-4 pb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground md:grid'>
            <span>Subject</span>
            <span>Priority</span>
            <span>Status</span>
            <span>Opened</span>
          </div>
          <ul className='divide-y divide-border border-y border-border'>
            {rows.map((t) => {
              const st = statusStyles[t.status_c];
              const pr = priorityStyles[t.priority_c];
              return (
                <li key={t.Id}>
                  <div
                    onClick={() => navigate(`${basePath}/${t.Id}`)}
                    className={cn(
                      'grid cursor-pointer gap-2 px-4 py-4 transition-colors duration-(--transition-fast) hover:bg-accent md:grid-cols-[1fr_7rem_7rem_7rem] md:items-center md:gap-6',
                      st?.row,
                    )}
                  >
                    <div className='min-w-0'>
                      <Link
                        to={`${basePath}/${t.Id}`}
                        onClick={(e) => e.stopPropagation()}
                        className='block truncate font-semibold hover:underline underline-offset-4'
                      >
                        {t.Name}
                      </Link>
                      <p className='truncate text-xs text-muted-foreground'>
                        {t.category_c}
                        {isAdmin && t.Owner?.Name ? ` \u00b7 ${t.Owner.Name}` : ''}
                      </p>
                    </div>
                    <p className={cn('flex items-center gap-2 text-sm font-medium', pr?.text)}>
                      <span className={cn('size-2 rounded-full', pr?.dot)} />
                      {t.priority_c}
                    </p>
                    <div>
                      <Badge variant='outline' className={cn('font-medium', st?.badge)}>
                        {t.status_c}
                      </Badge>
                    </div>
                    <p className='text-sm text-muted-foreground'>{formatLocalDate(t.CreatedOn, DATE_FORMATS.SHORT)}</p>
                  </div>
                </li>
              );
            })}
          </ul>
          {(page > 1 || data?.hasMore) && (
            <div className='mt-4 flex items-center justify-between'>
              <Button variant='outline' size='sm' disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                <ApperIcon name='ChevronLeft' size={14} /> Previous
              </Button>
              <span className='text-sm text-muted-foreground'>Page {page}</span>
              <Button variant='outline' size='sm' disabled={!data?.hasMore} onClick={() => setPage((p) => p + 1)}>
                Next <ApperIcon name='ChevronRight' size={14} />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
