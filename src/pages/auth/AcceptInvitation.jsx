import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { sdk } from '@/services/sdk';
import { AUTH_PROFILES } from '@/config/app.config';
import { setUser } from '@/store/userSlice';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import AuthLayout from './AuthLayout';

export default function AcceptInvitation() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError('');
    if (!token) return setError('This invitation link is missing its token. Ask an administrator to send a new one.');
    if (password !== confirmation) return setError('Passwords do not match.');
    setLoading(true);
    const result = await sdk.session.acceptInvitation({ token, password });
    setLoading(false);
    if (!result.ok) return setError(result.error?.message || 'Could not accept this invitation.');
    dispatch(setUser(result.value));
    const profile = AUTH_PROFILES.find((item) => item.name === result.value.profile);
    navigate(profile?.redirectAfterAuth || '/home', { replace: true });
  }

  return (
    <AuthLayout title='Accept invitation' description='Create a password to finish setting up your Veritas account.' icon='UserPlus'>
      <form onSubmit={submit} className='space-y-4'>
        <div className='space-y-2'>
          <Label htmlFor='invite-password'>Password</Label>
          <Input id='invite-password' type='password' autoComplete='new-password' minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} />
        </div>
        <div className='space-y-2'>
          <Label htmlFor='invite-confirmation'>Confirm password</Label>
          <Input id='invite-confirmation' type='password' autoComplete='new-password' minLength={8} required value={confirmation} onChange={(event) => setConfirmation(event.target.value)} />
        </div>
        {error && <p className='text-sm text-destructive' role='alert'>{error}</p>}
        <Button type='submit' disabled={loading} className='w-full'>
          {loading ? 'Creating account…' : 'Accept invitation'}
        </Button>
      </form>
    </AuthLayout>
  );
}
