'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Loader2, Mail, Lock } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth.store';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

const totpSchema = z.object({
  code: z.string().length(6, 'Code must be 6 digits'),
});

const recoveryCodeSchema = z.object({
  code: z.string().min(5, 'Recovery code is required'),
});

type LoginForm = z.infer<typeof loginSchema>;
type TotpForm = z.infer<typeof totpSchema>;
type RecoveryCodeForm = z.infer<typeof recoveryCodeSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [requiresTOTP, setRequiresTOTP] = useState(false);
  const [showRecoveryCode, setShowRecoveryCode] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const loginForm = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });
  const totpForm = useForm<TotpForm>({ resolver: zodResolver(totpSchema) });
  const recoveryCodeForm = useForm<RecoveryCodeForm>({ resolver: zodResolver(recoveryCodeSchema) });

  async function onLogin(data: LoginForm) {
    setIsLoading(true);
    try {
      const res = await apiClient.post<{
        accessToken: string;
        expiresIn: number;
        user: { id: string; email: string; firstName: string; lastName: string; totpEnabled: boolean };
        workspace?: { id: string; name: string; slug: string; role: string };
        requiresTOTP: boolean;
        tempToken?: string;
      }>('/auth/login', data);

      if (res.data.requiresTOTP && res.data.tempToken) {
        setTempToken(res.data.tempToken);
        setRequiresTOTP(true);
        return;
      }

      if (res.data.accessToken) {
        const workspace = res.data.workspace;
        if (!workspace) {
          toast.error('No workspace found for this account.');
          return;
        }
        setAuth(
          { ...res.data.user, avatarUrl: null },
          workspace,
          res.data.accessToken,
        );
        router.push('/dashboard');
      }
    } catch (error: unknown) {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Invalid email or password';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }

  async function onTotp(data: TotpForm) {
    setIsLoading(true);
    try {
      const res = await apiClient.post<{
        accessToken: string;
        user: { id: string; email: string; firstName: string; lastName: string; totpEnabled: boolean };
        workspace?: { id: string; name: string; slug: string; role: string };
      }>('/auth/login/totp', { tempToken, code: data.code });

      if (res.data.accessToken && res.data.workspace) {
        setAuth(
          { ...res.data.user, avatarUrl: null },
          res.data.workspace,
          res.data.accessToken,
        );
        router.push('/dashboard');
      }
    } catch {
      toast.error('Invalid verification code');
    } finally {
      setIsLoading(false);
    }
  }

  async function onRecoveryCode(data: RecoveryCodeForm) {
    setIsLoading(true);
    try {
      const res = await apiClient.post<{
        accessToken: string;
        user: { id: string; email: string; firstName: string; lastName: string; totpEnabled: boolean };
        workspace?: { id: string; name: string; slug: string; role: string };
      }>('/auth/login/recovery-code', { tempToken, recoveryCode: data.code });

      if (res.data.accessToken && res.data.workspace) {
        setAuth(
          { ...res.data.user, avatarUrl: null },
          res.data.workspace,
          res.data.accessToken,
        );
        router.push('/dashboard');
      }
    } catch {
      toast.error('Invalid or already used recovery code');
    } finally {
      setIsLoading(false);
    }
  }

  function handleGoogleLogin() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    window.location.href = `${apiUrl}/auth/google`;
  }

  if (showRecoveryCode) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Recovery Code</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter one of your recovery codes to access your account.
          </p>
        </div>

        <form onSubmit={recoveryCodeForm.handleSubmit(onRecoveryCode)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Recovery Code
            </label>
            <input
              {...recoveryCodeForm.register('code')}
              type="text"
              placeholder="XXXXX-XXXXX"
              className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-center text-lg tracking-wider text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 uppercase"
            />
            {recoveryCodeForm.formState.errors.code && (
              <p className="mt-1 text-xs text-destructive">
                {recoveryCodeForm.formState.errors.code.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            Verify Code
          </button>
        </form>

        <button
          onClick={() => { setShowRecoveryCode(false); setRequiresTOTP(true); }}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Back to authenticator code
        </button>
      </div>
    );
  }

  if (requiresTOTP) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Two-Factor Authentication</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter the 6-digit code from your authenticator app.
          </p>
        </div>

        <form onSubmit={totpForm.handleSubmit(onTotp)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Verification Code
            </label>
            <input
              {...totpForm.register('code')}
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-center text-2xl tracking-widest text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            {totpForm.formState.errors.code && (
              <p className="mt-1 text-xs text-destructive">
                {totpForm.formState.errors.code.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            Verify Code
          </button>
        </form>

        <div className="text-center">
          <button
            onClick={() => { setRequiresTOTP(false); setShowRecoveryCode(true); }}
            className="text-sm text-primary hover:text-primary-hover font-medium transition-colors"
          >
            Use recovery code instead
          </button>
        </div>

        <button
          onClick={() => setRequiresTOTP(false)}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Back to login
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground">Welcome back</h2>
        <p className="mt-2 text-sm text-muted-foreground">Sign in to your account to continue</p>
      </div>

      <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Email address</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              {...loginForm.register('email')}
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              className="w-full rounded-xl border border-input bg-background pl-11 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
          {loginForm.formState.errors.email && (
            <p className="mt-1.5 text-xs text-destructive">
              {loginForm.formState.errors.email.message}
            </p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-foreground">Password</label>
            <Link
              href="/forgot-password"
              className="text-xs text-primary hover:text-primary-hover font-medium transition-colors"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              {...loginForm.register('password')}
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-full rounded-xl border border-input bg-background pl-11 pr-11 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {loginForm.formState.errors.password && (
            <p className="mt-1.5 text-xs text-destructive">
              {loginForm.formState.errors.password.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] shadow-sm hover:shadow-md"
        >
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          {isLoading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border"></div>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
        </div>
      </div>

      <button
        type="button"
        onClick={handleGoogleLogin}
        className="w-full flex items-center justify-center gap-3 rounded-xl border border-input bg-background px-4 py-3 text-sm font-semibold text-foreground hover:bg-accent transition-all active:scale-[0.98]"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="currentColor"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="currentColor"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="currentColor"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        Continue with Google
      </button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border"></div>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">New to NexaCRM?</span>
        </div>
      </div>

      <Link
        href="/register"
        className="block w-full text-center px-4 py-3 text-sm font-semibold text-primary bg-primary-soft hover:bg-primary/10 rounded-xl transition-all active:scale-[0.98]"
      >
        Create Account
      </Link>
    </div>
  );
}
