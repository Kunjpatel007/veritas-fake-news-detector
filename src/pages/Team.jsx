import { useState } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'sonner';
import { sdk } from '@/services/sdk';
import { useFetch } from '@/hooks/useFetch';
import { PROFILES } from '@/services/userPermissions';
import ApperIcon from '@/components/ApperIcon';
import { ListSkeleton } from '@/components/PageSkeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
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
import { formatLocalDate, DATE_FORMATS } from '@/utils/date';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

export const route = { path: '/admin/customers', layout: 'owner', access: "profile === 'Admin_c'" };
export const nav = {
  icon: 'Users',
  label: 'Customers',
  section: 'People',
  profiles: ['Admin_c'],
  order: 40,
};

const PROFILE_OPTIONS = Object.entries(PROFILES)
  .filter(([, p]) => !p.isPublic)
  .map(([key, p]) => ({ value: key, label: p.label }));

const PAGE_SIZE = 25;

function ListPager({ page, total, hasMore, loading, onChange }) {
  return (
    <div className='mt-4 flex flex-wrap items-center justify-between gap-3'>
      <p className='text-sm text-muted-foreground tabular-nums'>{total} total · Page {page}</p>
      <div className='flex shrink-0 gap-2'>
        <Button variant='outline' size='sm' disabled={loading || page === 1} onClick={() => onChange(page - 1)}>Previous</Button>
        <Button variant='outline' size='sm' disabled={loading || !hasMore} onClick={() => onChange(page + 1)}>Next</Button>
      </div>
    </div>
  );
}

const initialsOf = (name) =>
  (name ?? '?')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

export default function Team() {
  const me = useSelector((s) => s.user.user);
  const [email, setEmail] = useState('');
  const [inviteProfile, setInviteProfile] = useState('Member_c');
  const [inviting, setInviting] = useState(false);
  const [removeTarget, setRemoveTarget] = useState(null);
  const [removing, setRemoving] = useState(false);
  const [memberPage, setMemberPage] = useState(1);
  const [invitePage, setInvitePage] = useState(1);
  const [revokeTarget, setRevokeTarget] = useState(null);
  const [revoking, setRevoking] = useState(false);
  const [details, setDetails] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);

  async function openDetails(member) {
    setDetails({ member, record: null, failed: false });
    setDetailsOpen(true);
    setDetailsLoading(true);
    try {
      const res = await sdk.admin.get('user', member.userId ?? member.id);
      const record = res?.data ?? res ?? null;
      const ok = Boolean(record && record.Email);
      setDetails({ member, record: ok ? record : null, failed: !ok });
    } catch {
      setDetails({ member, record: null, failed: true });
    } finally {
      setDetailsLoading(false);
    }
  }

  const { data: members, loading: membersLoading, error: membersError, run: refetchMembers } = useFetch(async () => {
    try {
      const r = await sdk.teams.getMembers((memberPage - 1) * PAGE_SIZE, PAGE_SIZE);
      return { rows: r.data ?? [], total: r.total, hasMore: r.hasMore };
    } catch (e) {
      throw new Error(e?.message ?? 'Could not load members');
    }
  }, [memberPage]);

  const { data: invitations, loading: invitesLoading, error: invitesError, run: refetchInvites } = useFetch(async () => {
    try {
      const r = await sdk.teams.getInvitedMembers((invitePage - 1) * PAGE_SIZE, PAGE_SIZE);
      return { rows: r.data ?? [], total: r.total, hasMore: r.hasMore };
    } catch (e) {
      throw new Error(e?.message ?? 'Could not load invitations');
    }
  }, [invitePage]);

  async function invite(e) {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Enter an email address');
      return;
    }
    setInviting(true);
    try {
      await sdk.teams.inviteUsers({ invitations: [{ email: email.trim(), profileName: inviteProfile }] });
      toast.success(`Invitation sent to ${email.trim()}`);
      setEmail('');
      refetchInvites();
    } catch (err) {
      toast.error(err?.message ?? 'Could not send the invitation');
    } finally {
      setInviting(false);
    }
  }

  async function changeProfile(member, profile) {
    try {
      await sdk.teams.updateMemberProfile(member.id, { profile });
      toast.success(`${member.name} is now ${PROFILES[profile]?.label ?? profile}`);
      refetchMembers();
    } catch (err) {
      toast.error(err?.message ?? 'Could not change the role');
    }
  }

  async function removeMember() {
    setRemoving(true);
    try {
      await sdk.teams.deleteMember(removeTarget.id);
      toast.success(`${removeTarget.name} was removed`);
      setRemoveTarget(null);
      if (list.length === 1 && memberPage > 1) setMemberPage((page) => page - 1);
      else refetchMembers();
    } catch (err) {
      toast.error(err?.message ?? 'Could not remove this person');
    } finally {
      setRemoving(false);
    }
  }

  async function resend(row) {
    try {
      await sdk.teams.resendInvitation(row.invitationId);
      toast.success(`Invitation resent to ${row.invitedEmail}`);
      refetchInvites();
    } catch (err) {
      toast.error(err?.message ?? 'Could not resend');
    }
  }

  async function cancelInvite() {
    setRevoking(true);
    try {
      await sdk.teams.deleteInvitation(revokeTarget.invitationId);
      toast.success('Invitation cancelled');
      setRevokeTarget(null);
      if (inviteList.length === 1 && invitePage > 1) setInvitePage((page) => page - 1);
      else refetchInvites();
    } catch (err) {
      toast.error(err?.message ?? 'Could not cancel');
    } finally {
      setRevoking(false);
    }
  }

  const list = members?.rows ?? [];
  const inviteList = invitations?.rows ?? [];
  const firstLoad = membersLoading && members === undefined;
  const isMe = (m) => String(m.id) === String(me?.Id) || Boolean(m.email && (me?.emailAddress ?? me?.Email) && m.email.toLowerCase() === (me.emailAddress ?? me.Email).toLowerCase());

  return (
    <div className='mx-auto max-w-5xl space-y-10'>
      <div className='border-b border-border pb-6'>
        <h1 className='font-heading text-3xl font-semibold tracking-tight'>Customers and team</h1>
        <p className='mt-1 text-sm text-muted-foreground'>
          Everyone who can sign in, with the role that decides what they see.
        </p>
      </div>

      <section>
        <h2 className='font-heading text-2xl font-semibold'>Invite someone</h2>
        <form onSubmit={invite} className='mt-4 flex flex-col gap-3 md:flex-row md:items-end'>
          <div className='flex-1 space-y-2'>
            <Label htmlFor='invite-email'>Email</Label>
            <Input
              id='invite-email'
              type='email'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder='name@example.com'
            />
          </div>
          <div className='space-y-2'>
            <Label>Role</Label>
            <Select value={inviteProfile} onValueChange={setInviteProfile}>
              <SelectTrigger className='w-full md:w-44'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROFILE_OPTIONS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type='submit' disabled={inviting}>
            {inviting ? 'Sending...' : 'Send invitation'}
          </Button>
        </form>
      </section>

      <section>
        <h2 className='font-heading text-2xl font-semibold'>People</h2>
        {membersError ? (
          <div className='mt-4 border border-border p-8 text-center'>
            <p className='font-semibold'>{membersError.message}</p>
            <Button className='mt-3' variant='outline' size='sm' onClick={refetchMembers}>
              Try again
            </Button>
          </div>
        ) : firstLoad ? (
          <div className='mt-4'>
            <ListSkeleton rows={4} />
          </div>
        ) : list.length === 0 ? (
          <div className='mt-4 border border-dashed border-border p-8 text-center text-muted-foreground'>
            No members yet.
          </div>
        ) : (
          <ul className='mt-4 divide-y divide-border border-y border-border'>
            {list.map((m) => (
              <li key={m.id} className='grid gap-3 py-4 md:grid-cols-[1fr_11rem_auto_auto] md:items-center md:gap-6'>
                <div className='flex min-w-0 items-center gap-3'>
                  <Avatar className='size-10 shrink-0 border border-border'>
                    <AvatarImage src={m.avatarUrl} alt={m.name} />
                    <AvatarFallback>{initialsOf(m.name)}</AvatarFallback>
                  </Avatar>
                  <div className='min-w-0'>
                    <p className='truncate font-semibold'>
                      {m.name}
                      {isMe(m) && (
                        <Badge variant='outline' className='ml-2 align-middle'>
                          You
                        </Badge>
                      )}
                    </p>
                    <p className='truncate text-sm text-muted-foreground'>{m.email}</p>
                  </div>
                </div>
                <Select value={m.profile?.name} onValueChange={(v) => changeProfile(m, v)} disabled={isMe(m)}>
                  <SelectTrigger className='w-full'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROFILE_OPTIONS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant='ghost' size='sm' onClick={() => openDetails(m)}>
                  Details
                </Button>
                <Button variant='outline' size='sm' disabled={isMe(m)} onClick={() => setRemoveTarget(m)}>
                  <ApperIcon name='Trash2' size={14} /> Remove
                </Button>
              </li>
            ))}
          </ul>
        )}
        {!membersError && members && <ListPager page={memberPage} total={members.total ?? 0} hasMore={members.hasMore} loading={membersLoading} onChange={setMemberPage} />}
      </section>

      <section>
          <h2 className='text-lg font-heading font-semibold'>Pending invitations</h2>
          {invitesError ? (
            <div className='mt-4 space-y-3 border border-border p-6 text-center'>
              <p className='text-sm leading-relaxed'>{invitesError.message}</p>
              <Button variant='outline' size='sm' onClick={refetchInvites}>Try again</Button>
            </div>
          ) : invitesLoading && invitations === undefined ? (
            <div className='mt-4'><ListSkeleton rows={3} /></div>
          ) : inviteList.length === 0 ? (
            <p className='mt-4 border border-dashed border-border p-6 text-sm text-muted-foreground'>No pending invitations. New invitations will appear here.</p>
          ) : (
          <ul className='mt-4 divide-y divide-border border-y border-border'>
            {inviteList.map((row) => (
              <li key={row.invitationId} className='flex flex-wrap items-center justify-between gap-3 py-4'>
                <div className='min-w-0'>
                  <p className='truncate font-semibold'>{row.invitedEmail}</p>
                  <p className='text-xs text-muted-foreground'>
                    Invited {row.createdOn ? formatLocalDate(row.createdOn, DATE_FORMATS.SHORT) : '—'} · Sent {row.invitationCount ?? 1} times
                  </p>
                </div>
                <div className='flex gap-2'>
                  <Button variant='outline' size='sm' onClick={() => resend(row)}>
                    Resend
                  </Button>
                  <Button variant='ghost' size='sm' onClick={() => setRevokeTarget(row)}>
                    Cancel
                  </Button>
                </div>
              </li>
            ))}
          </ul>
          )}
          {!invitesError && invitations && <ListPager page={invitePage} total={invitations.total ?? 0} hasMore={invitations.hasMore} loading={invitesLoading} onChange={setInvitePage} />}
      </section>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className='max-w-[calc(100vw-2rem)] sm:max-w-md'>
          <DialogHeader>
            <DialogTitle className='font-heading text-2xl'>{details?.member?.name ?? 'Details'}</DialogTitle>
            <DialogDescription>What this person saved on their account.</DialogDescription>
          </DialogHeader>
          {detailsLoading ? (
            <div className='space-y-3'>
              <Skeleton className='h-5 w-3/4' />
              <Skeleton className='h-5 w-1/2' />
              <Skeleton className='h-5 w-2/3' />
            </div>
          ) : details?.failed ? (
            <p className='text-sm text-muted-foreground'>Details are not available for this person yet.</p>
          ) : (
            <dl className='divide-y divide-border border-y border-border text-sm'>
              {[
                ['Email', details?.record?.Email],
                ['Phone', details?.record?.phone_c],
                ['City', details?.record?.city_c],
                ['Organisation', details?.record?.organisation_c],
                ['Language', details?.record?.language_c],
                ['Newsletter', details?.record?.newsletter_c ? 'Subscribed' : 'Not subscribed'],
              ].map(([label, value]) => (
                <div key={label} className='flex justify-between gap-4 py-2.5'>
                  <dt className='text-muted-foreground'>{label}</dt>
                  <dd className='text-right font-medium'>{value || '-'}</dd>
                </div>
              ))}
            </dl>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(revokeTarget)} onOpenChange={(open) => !open && !revoking && setRevokeTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel invitation?</AlertDialogTitle>
            <AlertDialogDescription>The invitation for {revokeTarget?.invitedEmail} will no longer be usable.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={revoking}>Keep invitation</AlertDialogCancel>
            <AlertDialogAction disabled={revoking} onClick={(event) => { event.preventDefault(); cancelInvite(); }}>
              {revoking ? 'Cancelling...' : 'Cancel invitation'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={Boolean(removeTarget)} onOpenChange={(o) => !o && !removing && setRemoveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {removeTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              They will lose access to their account straight away. Their support tickets are kept.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={removing}
              onClick={(e) => {
                e.preventDefault();
                removeMember();
              }}
            >
              {removing ? 'Removing...' : 'Remove'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
