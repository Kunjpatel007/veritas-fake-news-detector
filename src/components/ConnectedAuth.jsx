import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { APP_CONFIG, AUTH_PROFILES } from '@/config/app.config';
import { sdk } from '@/services/sdk';
import { setUser } from '@/store/userSlice';
import ApperIcon from '@/components/ApperIcon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function ConnectedAuth({ profileKey, mode }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const profile = AUTH_PROFILES.find((item) => item.key === profileKey);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const isSignup = mode === 'signup';

  const retry = async () => {
    setLoading(true);
    setError('');
    try {
      if (sdk.session.initFailed) await sdk.session.retry();
      if (sdk.session.initFailed) throw new Error('Unable to connect. Check your connection and try again.');
    } catch (err) {
      setError(err?.message || 'Unable to connect. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    if (loading) return;
    setError('');
    if (isSignup && password !== confirmation) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const credentials = { email: email.trim(), password };
      const result = isSignup
        ? await sdk.session.register(credentials)
        : await sdk.session.login(credentials);
      if (!result.ok) throw new Error(result.error?.message || 'Authentication failed. Please try again.');
      if (result.value) {
        dispatch(setUser(result.value));
        navigate(profile.redirectAfterAuth, { replace: true });
      }
    } catch (err) {
      setError(err?.message || 'Unable to sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!profile) return <Navigate to={`/member/${mode}`} replace />;
  if (isSignup && !profile.hasSignup) return <Navigate to={`/${profile.key}/login`} replace />;

  const unavailable = sdk.session.initFailed;
  const authCopy = profile.authPage;
  const title = isSignup ? authCopy.signupTitle : authCopy.loginTitle;
  const description = isSignup ? authCopy.signupDescription : authCopy.loginDescription;

  return (
    <div className="space-y-6">
      <div className="space-y-3 text-left">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-highlight">
          <ApperIcon name={APP_CONFIG.icon} size={15} /> Veritas account
        </p>
        <div className="space-y-2">
          <h1 className="font-heading text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">{title}</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
        </div>
      </div>

      {(error || unavailable) && (
        <Alert variant="destructive" role="alert">
          <AlertDescription className="break-words">
            {error || 'Unable to connect to the Veritas server. Please retry.'}
          </AlertDescription>
        </Alert>
      )}

      {(error || unavailable) && (
        <Button type="button" variant="outline" onClick={retry} disabled={loading} className="h-11 w-full active:scale-[0.98]">
          {loading ? 'Connecting…' : 'Try again'}
        </Button>
      )}

      {!unavailable && (
        <form onSubmit={submit} className="space-y-5" aria-busy={loading}>
          <div className="space-y-2">
            <Label htmlFor="auth-email">Email address</Label>
            <Input id="auth-email" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} required disabled={loading} className="h-11" />
          </div>
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Label htmlFor="auth-password">Password</Label>
              {!isSignup && <Link to="/forgot-password" className="text-sm text-primary hover:underline">Forgot password?</Link>}
            </div>
            <Input id="auth-password" type="password" autoComplete={isSignup ? 'new-password' : 'current-password'} value={password} onChange={(event) => setPassword(event.target.value)} minLength={isSignup ? 8 : undefined} maxLength={128} required disabled={loading} className="h-11" />
          </div>
          {isSignup && (
            <div className="space-y-2">
              <Label htmlFor="auth-confirmation">Confirm password</Label>
              <Input id="auth-confirmation" type="password" autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} minLength={8} maxLength={128} required disabled={loading} className="h-11" />
            </div>
          )}
          <Button type="submit" disabled={loading} className="h-11 w-full active:scale-[0.98]">
            {loading ? 'Please wait…' : isSignup ? 'Create account' : 'Sign in'}
          </Button>
        </form>
      )}

      <div className="space-y-4 border-t border-border pt-6">
        {(isSignup || profile.hasSignup) && (
          <p className="text-center text-sm text-muted-foreground">
            {isSignup ? 'Already have an account?' : 'Don’t have an account?'}{' '}
            <Link to={`/${profile.key}/${isSignup ? 'login' : 'signup'}`} className="font-medium text-primary hover:underline">
              {isSignup ? 'Sign in' : 'Sign up'}
            </Link>
          </p>
        )}
        {(profile.altLinks ?? []).map((link) => (
          <Link key={link.href} to={link.href} className="flex min-w-0 items-center justify-between gap-3 rounded-lg border border-border px-4 py-3 text-sm text-muted-foreground transition-colors duration-(--transition-fast) hover:bg-accent hover:text-accent-foreground active:scale-[0.98]">
            <span className="min-w-0 break-words">{link.label}</span>
            <ApperIcon name="ArrowRight" size={16} className="shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  );
}