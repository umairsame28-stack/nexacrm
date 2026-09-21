'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useUpdateSmtpSettings, useTestSmtp } from '@/queries/settings.queries';

interface Form {
  smtpHost: string; smtpPort: number;
  smtpUser: string; smtpPassword: string;
  smtpFromEmail: string; smtpFromName: string;
}

export default function SmtpSettingsPage() {
  const update = useUpdateSmtpSettings();
  const testSmtp = useTestSmtp();
  const [showPassword, setShowPassword] = useState(false);
  const [testError, setTestError] = useState<string | null>(null);
  const [testSuccess, setTestSuccess] = useState(false);

  const { register, handleSubmit, formState: { isSubmitting } } = useForm<Form>({
    defaultValues: { smtpPort: 587 },
  });

  async function onSubmit(data: Form) {
    const payload: Record<string, unknown> = {};
    Object.entries(data).forEach(([k, v]) => { if (v) payload[k] = v; });
    await update.mutateAsync(payload);
  }

  async function handleTestEmail() {
    setTestError(null);
    setTestSuccess(false);
    try {
      const result = await testSmtp.mutateAsync();
      if (result.data.sent) {
        setTestSuccess(true);
        setTimeout(() => setTestSuccess(false), 5000);
      } else {
        setTestError(result.data.error || 'Failed to send test email');
      }
    } catch (error: any) {
      setTestError(error?.response?.data?.message || 'Failed to send test email');
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-foreground">Email (SMTP)</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Configure outbound email for notifications and password resets</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>SMTP Configuration</CardTitle>
          <CardDescription>Works with Resend, SendGrid, Postmark, AWS SES, or any SMTP server.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-foreground mb-1.5">SMTP Host</label>
                <Input {...register('smtpHost')} placeholder="smtp.resend.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Port</label>
                <Input {...register('smtpPort', { valueAsNumber: true })} type="number" placeholder="587" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Username</label>
                <Input {...register('smtpUser')} placeholder="resend" autoComplete="off" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Password</label>
                <div className="relative">
                  <Input
                    {...register('smtpPassword')}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="re_xxxxxxxxxx"
                    autoComplete="new-password"
                    className="pr-16"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">From Email</label>
                <Input {...register('smtpFromEmail')} type="email" placeholder="noreply@acme.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">From Name</label>
                <Input {...register('smtpFromName')} placeholder="Acme CRM" />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />} Save
              </Button>
              <Button type="button" variant="outline" disabled={testSmtp.isPending} onClick={handleTestEmail}>
                {testSmtp.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Send Test Email
              </Button>
            </div>

            {/* Test Email Status */}
            {testSuccess && (
              <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  ✓ Test email sent successfully! Check your inbox.
                </p>
              </div>
            )}
            
            {testError && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">
                  ✗ Failed to send test email
                </p>
                <p className="text-xs text-red-600 dark:text-red-300 font-mono">
                  {testError}
                </p>
              </div>
            )}

            {/* Help Text */}
            <div className="mt-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                📧 Resend Setup Guide
              </p>
              <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside">
                <li><strong>SMTP Host:</strong> smtp.resend.com</li>
                <li><strong>Port:</strong> 587 (recommended) or 465</li>
                <li><strong>Username:</strong> resend</li>
                <li><strong>Password:</strong> Your Resend API key (starts with re_)</li>
                <li><strong>From Email:</strong> Must be verified in Resend dashboard</li>
              </ul>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                💡 Make sure to <strong>Save</strong> settings first, then click <strong>Send Test Email</strong>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
