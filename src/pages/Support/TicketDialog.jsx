import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { sdk } from '@/services/sdk';
import ApperIcon from '@/components/ApperIcon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TICKET_CATEGORIES, TICKET_PRIORITIES, TICKET_STATUSES } from '@/lib/ticketMeta';

const BLANK = {
  Name: '',
  category_c: TICKET_CATEGORIES[0],
  priority_c: 'Medium',
  message_c: '',
  status_c: 'Open',
  admin_reply_c: '',
};

function fromRecord(record) {
  return {
    Name: record.Name ?? '',
    category_c: record.category_c,
    priority_c: record.priority_c,
    message_c: record.message_c ?? '',
    status_c: record.status_c,
    admin_reply_c: record.admin_reply_c ?? '',
  };
}

export default function TicketDialog({ record, isAdmin, onSaved, trigger }) {
  const editing = Boolean(record);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(BLANK);

  useEffect(() => {
    if (open) setForm(editing ? fromRecord(record) : BLANK);
  }, [open]);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  async function submit(e) {
    e.preventDefault();
    if (!form.Name.trim()) {
      toast.error('Add a subject');
      return;
    }
    if (!form.message_c.trim()) {
      toast.error('Describe the problem');
      return;
    }
    setSaving(true);
    try {
      const base = {
        Name: form.Name.trim(),
        category_c: form.category_c,
        priority_c: form.priority_c,
        message_c: form.message_c.trim(),
      };
      let res;
      if (editing) {
        const staff = isAdmin ? { status_c: form.status_c, admin_reply_c: form.admin_reply_c.trim() } : {};
        res = await sdk.table('support_tickets_c').update({ Id: record.Id, ...base, ...staff });
      } else {
        res = await sdk.table('support_tickets_c').create({ ...base, status_c: 'Open' });
      }
      if (res.messages?.length) {
        toast.error(res.messages[0], { description: res.messages.slice(1).join('\n') || undefined });
      }
      if (!res.data?.length) return;
      toast.success(editing ? 'Ticket updated' : 'Ticket opened');
      setOpen(false);
      setForm(BLANK);
      onSaved?.(res.data[0]);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className='max-h-[90svh] max-w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle className='font-heading text-2xl'>{editing ? 'Edit ticket' : 'Open a support ticket'}</DialogTitle>
          <DialogDescription>
            {editing ? 'Update the details of this ticket.' : 'Tell us what happened and our team will reply here.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='ticket-subject'>Subject</Label>
            <Input
              id='ticket-subject'
              value={form.Name}
              onChange={(e) => set('Name', e.target.value)}
              placeholder='e.g. The score looks wrong for my message'
            />
          </div>

          <div className='grid gap-4 sm:grid-cols-2'>
            <div className='space-y-2'>
              <Label>Category</Label>
              <Select value={form.category_c} onValueChange={(v) => set('category_c', v)}>
                <SelectTrigger className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TICKET_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-2'>
              <Label>Priority</Label>
              <Select value={form.priority_c} onValueChange={(v) => set('priority_c', v)}>
                <SelectTrigger className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TICKET_PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='ticket-message'>Message</Label>
            <Textarea
              id='ticket-message'
              rows={5}
              value={form.message_c}
              onChange={(e) => set('message_c', e.target.value)}
              placeholder='What did you do, what did you expect and what happened instead?'
            />
          </div>

          {editing && isAdmin && (
            <div className='space-y-4 border-t border-border pt-4'>
              <div className='space-y-2'>
                <Label>Status</Label>
                <Select value={form.status_c} onValueChange={(v) => set('status_c', v)}>
                  <SelectTrigger className='w-full'>
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
              <div className='space-y-2'>
                <Label htmlFor='ticket-reply'>Reply from the team</Label>
                <Textarea
                  id='ticket-reply'
                  rows={4}
                  value={form.admin_reply_c}
                  onChange={(e) => set('admin_reply_c', e.target.value)}
                  placeholder='Write the answer the customer will see on this ticket'
                />
              </div>
            </div>
          )}

          <DialogFooter className='gap-2 sm:gap-2'>
            <Button type='button' variant='outline' onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type='submit' disabled={saving}>
              {saving ? (
                <>
                  <ApperIcon name='LoaderCircle' size={16} className='animate-spin' /> Saving...
                </>
              ) : editing ? (
                'Save changes'
              ) : (
                'Open ticket'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
