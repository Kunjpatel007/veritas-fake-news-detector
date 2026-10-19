import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'sonner';
import { sdk } from '@/services/sdk';
import { useFetch } from '@/hooks/useFetch';
import { getProfileMeta } from '@/services/userPermissions';
import ApperIcon from '@/components/ApperIcon';
import { DetailSkeleton } from '@/components/PageSkeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export const route = { path: '/account', layout: 'public', access: "profile === 'Member_c'" };

const LANGUAGES = ['English', 'Hindi', 'Gujarati'];

function toForm(rec) {
  return {
    FirstName: rec?.FirstName ?? '',
    LastName: rec?.LastName ?? '',
    phone_c: rec?.phone_c ?? '',
    city_c: rec?.city_c ?? '',
    organisation_c: rec?.organisation_c ?? '',
    language_c: rec?.language_c ?? 'English',
    newsletter_c: rec?.newsletter_c === true,
  };
}

export default function Account({ pad = true, supportPath = '/support' }) {
  const user = useSelector((s) => s.user.user);
  const userId = user?.userId ?? user?.Id;
  const meta = getProfileMeta(user?.profile);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  const { data: record, loading, error, run } = useFetch(
    () =>
      sdk.admin.get('user', userId).then((res) => {
        const rec = res?.data ?? res;
        return rec ?? null;
      }),
    [userId],
  );

  useEffect(() => {
    if (record) setForm(toForm(record));
  }, [record]);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  async function save(e) {
    e.preventDefault();
    if (!form.FirstName.trim()) {
      toast.error('Your first name is required');
      return;
    }
    setSaving(true);
    try {
      const res = await sdk.admin.update('user', {
        Id: userId,
        FirstName: form.FirstName.trim(),
        LastName: form.LastName.trim(),
        phone_c: form.phone_c.trim(),
        city_c: form.city_c.trim(),
        organisation_c: form.organisation_c.trim(),
        language_c: form.language_c,
        newsletter_c: form.newsletter_c,
      });
      if (res?.success === false) {
        toast.error(res.messages?.[0] ?? res.message ?? 'Could not save your details');
        return;
      }
      toast.success('Your details are saved');
      run();
    } finally {
      setSaving(false);
    }
  }

  const firstLoad = loading && record === undefined;

  return (
    <div className={`mx-auto max-w-4xl ${pad ? 'px-4 py-10 lg:px-8 lg:py-14' : ''}`}>
      <div className='border-b border-border pb-6'>
        <h1 className='font-heading text-3xl font-semibold tracking-tight'>Your details</h1>
        <p className='mt-1 text-sm text-muted-foreground'>
          These are saved with your sign-in, so staff see the same details when they answer a ticket.
        </p>
      </div>

      {error ? (
        <div className='mt-8 border border-border p-8 text-center'>
          <p className='font-heading text-xl font-semibold'>Could not load your details</p>
          <Button className='mt-4' variant='outline' onClick={run}>
            Try again
          </Button>
        </div>
      ) : firstLoad || (record && !form) ? (
        <div className='mt-8'>
          <DetailSkeleton />
        </div>
      ) : !form ? (
        <div className='mt-8 border border-dashed border-border p-10 text-center'>
          <p className='font-heading text-xl font-semibold'>We could not find your account record</p>
        </div>
      ) : (
        <div className='mt-8 grid gap-10 lg:grid-cols-[1fr_16rem]'>
          <form onSubmit={save} className='space-y-8'>
            <fieldset className='space-y-5'>
              <legend className='font-heading text-xl font-semibold'>Profile</legend>
              <div className='grid gap-5 sm:grid-cols-2'>
                <div className='space-y-2'>
                  <Label htmlFor='first-name'>First name</Label>
                  <Input
                    id='first-name'
                    value={form.FirstName}
                    onChange={(e) => set('FirstName', e.target.value)}
                    placeholder='Diya'
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='last-name'>Last name</Label>
                  <Input
                    id='last-name'
                    value={form.LastName}
                    onChange={(e) => set('LastName', e.target.value)}
                    placeholder='Patel'
                  />
                </div>
              </div>
              <div className='grid gap-5 sm:grid-cols-2'>
                <div className='space-y-2'>
                  <Label htmlFor='phone'>Phone</Label>
                  <Input
                    id='phone'
                    type='tel'
                    value={form.phone_c}
                    onChange={(e) => set('phone_c', e.target.value)}
                    placeholder='+91 98765 43210'
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='city'>City</Label>
                  <Input
                    id='city'
                    value={form.city_c}
                    onChange={(e) => set('city_c', e.target.value)}
                    placeholder='Ahmedabad'
                  />
                </div>
              </div>
              <div className='space-y-2'>
                <Label htmlFor='organisation'>Organisation</Label>
                <Input
                  id='organisation'
                  value={form.organisation_c}
                  onChange={(e) => set('organisation_c', e.target.value)}
                  placeholder='College, school or company'
                />
              </div>
            </fieldset>

            <fieldset className='space-y-5 border-t border-border pt-8'>
              <legend className='font-heading text-xl font-semibold'>Preferences</legend>
              <div className='space-y-2'>
                <Label>Preferred language</Label>
                <Select value={form.language_c} onValueChange={(v) => set('language_c', v)}>
                  <SelectTrigger className='w-full sm:w-64'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map((l) => (
                      <SelectItem key={l} value={l}>
                        {l}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className='flex items-center justify-between border border-border p-4'>
                <div>
                  <Label htmlFor='newsletter'>Veritas newsletter</Label>
                  <p className='text-sm text-muted-foreground'>New scam alerts and Help Center articles, by email.</p>
                </div>
                <Switch id='newsletter' checked={form.newsletter_c} onCheckedChange={(v) => set('newsletter_c', v)} />
              </div>
            </fieldset>

            <Button type='submit' disabled={saving}>
              {saving ? (
                <>
                  <ApperIcon name='LoaderCircle' size={16} className='animate-spin' /> Saving...
                </>
              ) : (
                'Save details'
              )}
            </Button>
          </form>

          <aside className='space-y-6 border-t border-border pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0'>
            <div>
              <p className='text-xs font-bold uppercase tracking-widest text-muted-foreground'>Sign-in email</p>
              <p className='mt-1 break-all font-semibold'>{record?.Email ?? user?.Email}</p>
            </div>
            <div>
              <p className='text-xs font-bold uppercase tracking-widest text-muted-foreground'>Account type</p>
              <p className='mt-1 font-semibold'>{meta.label}</p>
            </div>
            <p className='text-sm leading-relaxed text-muted-foreground'>
              Want a copy of your data, or want it removed? Open a ticket in the Privacy request category from{' '}
              <Link to={supportPath} className='font-semibold text-foreground underline underline-offset-4'>
                Support tickets
              </Link>
              . Read how we handle it in the{' '}
              <Link to='/privacy' className='font-semibold text-foreground underline underline-offset-4'>
                privacy policy
              </Link>
              .
            </p>
          </aside>
        </div>
      )}
    </div>
  );
}
