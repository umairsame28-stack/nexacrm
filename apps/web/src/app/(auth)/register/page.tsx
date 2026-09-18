'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth.store';

const schema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().optional(),
  email: z.string().email('Please enter a valid email'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[0-9]/, 'Must contain a number'),
  workspaceName: z.string().min(2, 'Company name is required'),
});

type RegisterForm = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: RegisterForm) {
    setIsLoading(true);
    try {
      const res = await apiClient.post<{
        accessToken: string;
        user: { id: string; email: string; firstName: string; lastName: string; totpEnabled: boolean };
        workspace: { id: string; name: string; slug: string; role: string };
      }>('/auth/register', data);

      setAuth({ ...res.data.user, avatarUrl: null }, res.data.workspace, res.data.accessToken);
      toast.success('Account created! Welcome to NexaCRM.');
      router.push('/dashboard');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Registration failed. Please try again.';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }

  const inputClass =
    'w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors';

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 lg:hidden mb-6">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-white font-bold text-sm">N</span>
          </div>
          <span className="text-xl font-bold text-foreground">NexaCRM</span>
        </div>
        <h2 className="text-2xl font-bold text-foreground">Create your account</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Start your free trial — no credit card required.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">First name</label>
            <input {...register('firstName')} placeholder="Sarah" className={inputClass} />
            {errors.firstName && <p className="mt-1 text-xs text-destructive">{errors.firstName.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Last name</label>
            <input {...register('lastName')} placeholder="Chen" className={inputClass} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Company name</label>
          <input {...register('workspaceName')} placeholder="Acme Corp" className={inputClass} />
          {errors.workspaceName && <p className="mt-1 text-xs text-destructive">{errors.workspaceName.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Email address</label>
          <input {...register('email')} type="email" placeholder="you@company.com" className={inputClass} />
          {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Password</label>
          <div className="relative">
            <input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              placeholder="Min. 8 chars, uppercase, number"
              className={`${inputClass} pr-10`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && <p className="mt-1 text-xs text-destructive">{errors.password.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          Create Account
        </button>

        <p className="text-center text-xs text-muted-foreground">
          By creating an account you agree to our{' '}
          <span className="text-primary cursor-pointer hover:underline">Terms of Service</span>.
        </p>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/login" className="text-primary font-medium hover:underline">Sign in →</Link>
      </p>
    </div>
  );
}
