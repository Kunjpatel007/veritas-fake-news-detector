import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { sdk } from '@/services/sdk';
import { useFetch } from '@/hooks/useFetch';
import { useProfile } from '@/hooks/useProfile';
import { getTableAccess } from '@/services/userPermissions';
import ApperIcon from '@/components/ApperIcon';
import { DetailSkeleton } from '@/components/PageSkeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { formatLocalDate, DATE_FORMATS } from '@/utils/date';
import { TICKET_FIELDS, TICKET_STATUSES, priorityStyles, statusStyles } from '@/lib/ticketMeta';
import TicketDialog from './TicketDialog';

export const route = { path: '/support/:id', layout: 'public', access: "profile === 'Member_c'" };

export default function TicketDetail({ basePath = '/support', backLabel = 'Support tickets', pad = true }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useProfile();
  const isAdmin = profile === 'Admin_c';
  const { canUpdate, canDelete } = getTableAccess(profile, 'support_tickets_c');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [changing, setChanging] = useState(false);

  const { data: ticket, loading, error, run } = useFetch(
    () =>
      sdk
        .table('support_tickets_c')
        .select(TICKET_FIELDS)
        .get(id)
        .then((r) => r.data ?? null),
    [id],
  );

  async function setStatus(next) {
    setChanging(true);
    try {
      const res = await sdk.table('support_tickets_c').update({ Id: ticket.Id, status_c: next });
      if (res.messages?.length) toast.error(res.messages[0]);
      if (!res.data?.length) return;
      toast.success(`Ticket marked ${next.toLowerCase()}`);
      run();
    } finally {
      setChanging(false);
    }
  }

  async function remove() {
    setDeleting(true);
    try {
      const res = await sdk.table('support_tickets_c').remove(ticket.Id);
      if (res.messages?.length) toast.error(res.messages[0]);
      if (!(res.data?.length > 0) && res.success !== true) return;
      toast.success('Ticket deleted');
      setConfirmOpen(false);
      navigate(basePath);
    } finally {
      setDeleting(false);
    }
  }

  const firstLoad = loading && ticket === undefined;
  const st = ticket ? statusStyles[ticket.status_c] : null;
  const pr = ticket ? priorityStyles[ticket.priority_c] : null;

  return (
    <div className={cn('mx-auto max-w-3xl space-y-6', pad && 'px-4 py-10 lg:px-8 lg:py-14')}>
      <Button variant='ghost' size='sm' asChild className='-ml-3'>
        <Link to={basePath}>
          <ApperIcon name='ArrowLeft' size={16} /> Back to {backLabel}
        </Link>
      </Button>

      {error ? (
        <div className='border border-border p-8 text-center'>
          <p className='font-heading text-xl font-semibold'>Could not load this ticket</p>
          <Button className='mt-4' variant='outline' onClick={run}>
            Try again
          </Button>
        </div>
      ) : firstLoad ? (
        <DetailSkeleton />
      ) : ticket === null ? (
        <div className='border border-dashed border-border p-10 text-center'>
          <p className='font-heading text-xl font-semibold'>Ticket not found</p>
          <p className='mt-1 text-sm text-muted-foreground'>It may have been deleted, or it belongs to another account.</p>
        </div>
      ) : (
        <>
          <div className={cn('border border-border p-6', st?.row)}>
            <div className='flex flex-wrap items-center gap-3'>
              <Badge variant='outline' className={cn('font-medium', st?.badge)}>
                {ticket.status_c}
              </Badge>
              <span className={cn('flex items-center gap-2 text-sm font-medium', pr?.text)}>
                <span className={cn('size-2 rounded-full', pr?.dot)} />
                {ticket.priority_c} priority
              </span>
              <span className='text-sm text-muted-foreground'>{ticket.category_c}</span>
            </div>
            <h1 className='mt-4 font-heading text-3xl font-semibold leading-tight tracking-tight'>{ticket.Name}</h1>
            <p className='mt-2 text-sm text-muted-foreground'>
              Opened by {ticket.Owner?.Name ?? 'unknown'} on {formatLocalDate(ticket.CreatedOn, DATE_FORMATS.SHORT)}
              {' \u00b7 '}Updated {formatLocalDate(ticket.ModifiedOn, DATE_FORMATS.SHORT)}
            </p>

            <div className='mt-5 flex flex-wrap items-center gap-2'>
              {canUpdate && (
                <TicketDialog
                  record={ticket}
                  isAdmin={isAdmin}
                  onSaved={run}
                  trigger={
                    <Button variant='outline' size='sm'>
                      <ApperIcon name='Pencil' size={14} /> Edit
                    </Button>
                  }
                />
              )}
              {canDelete && (
                <Button variant='outline' size='sm' onClick={() => setConfirmOpen(true)}>
                  <ApperIcon name='Trash2' size={14} /> Delete
                </Button>
              )}
              {!isAdmin && ticket.status_c === 'Resolved' && (
                <Button size='sm' disabled={changing} onClick={() => setStatus('Closed')}>
                  {changing ? 'Closing...' : 'Mark as closed'}
                </Button>
              )}
              {isAdmin && (
                <div className='ml-auto flex items-center gap-2'>
                  <span className='text-sm text-muted-foreground'>Status</span>
                  <Select value={ticket.status_c} onValueChange={setStatus} disabled={changing}>
                    <SelectTrigger className='h-8 w-36'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TICKET_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>

          <section className='border border-border p-6'>
            <h2 className='text-xs font-bold uppercase tracking-widest text-muted-foreground'>Message</h2>
            <p className='mt-3 whitespace-pre-wrap text-lg leading-relaxed'>{ticket.message_c}</p>
          </section>

          <section className='border border-border p-6'>
            <h2 className='text-xs font-bold uppercase tracking-widest text-muted-foreground'>Reply from the team</h2>
            {ticket.admin_reply_c ? (
              <p className='mt-3 whitespace-pre-wrap text-lg leading-relaxed'>{ticket.admin_reply_c}</p>
            ) : (
              <p className='mt-3 text-muted-foreground'>No reply yet. You will see it here as soon as the team answers.</p>
            )}
          </section>
        </>
      )}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this ticket?</AlertDialogTitle>
            <AlertDialogDescription>
              The conversation will be removed for good. Close the ticket instead if you only want it out of the way.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              onClick={(e) => {
                e.preventDefault();
                remove();
              }}
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
