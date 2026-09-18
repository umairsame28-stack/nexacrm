'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Mail } from 'lucide-react';
import { apiClient } from '@/lib/api-client';

const schema = z.object({ email: z.string().email('Please enter a valid email') });
type Form = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: Form) {
    setIsLoading(true);
    try {
      await apiClient.post('/auth/forgot-password', data);
    } finally {
      setIsLoading(false);
      setSubmitted(true);
    }
  }

  if (submitted) {
    return (
      <div className="space-y-6 text-center">
        <div className="mx-auto h-14 w-14 rounded-full bg-success/10 flex items-center justify-center">
          <Mail className="h-7 w-7 text-success" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">Check your inbox</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            If that email exists in our system, we've sent you a password reset link. Check your
            inbox (and spam folder).
          </p>
        </div>
        <Link href="/login" className="text-sm text-primary font-medium hover:underline">
          ← Back to login
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Reset your password</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter your email and we'll send you a reset link.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Email address</label>
          <input
            {...register('email')}
            type="email"
            placeholder="you@company.com"
            className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
          />
          {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          Send Reset Link
        </button>
      </form>

      <Link href="/login" className="block text-center text-sm text-muted-foreground hover:text-foreground transition-colors">
        ← Back to login
      </Link>
    </div>
  );
}
