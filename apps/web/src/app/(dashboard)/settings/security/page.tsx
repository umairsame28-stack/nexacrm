'use client';

import { useForm } from 'react-hook-form';
import { Loader2, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useUpdateSecuritySettings, useSettings } from '@/queries/settings.queries';

interface Form { enforce2FA: boolean; sessionTimeoutMins: number; ipWhitelistRaw: string }

export default function SecuritySettingsPage() {
  const { data: settings } = useSettings();
  const update = useUpdateSecuritySettings();

  const { register, handleSubmit, formState: { isSubmitting } } = useForm<Form>({
    values: {
      enforce2FA: settings?.enforce2FA ?? false,
      sessionTimeoutMins: settings?.sessionTimeoutMins ?? 1440,
      ipWhitelistRaw: settings?.ipWhitelist?.join(', ') ?? '',
    },
  });

  async function onSubmit(data: Form) {
    await update.mutateAsync({
      enforce2FA: data.enforce2FA,
      sessionTimeoutMins: Number(data.sessionTimeoutMins),
      ipWhitelist: data.ipWhitelistRaw ? data.ipWhitelistRaw.split(',').map(s => s.trim()).filter(Boolean) : [],
    });
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-foreground">Security</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Workspace-wide security policies</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Access Policies</CardTitle>
          <CardDescription>These settings apply to all members of this workspace.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="flex items-start gap-3">
              <input {...register('enforce2FA')} type="checkbox" id="enforce2fa" className="mt-0.5 h-4 w-4 rounded border-input" />
              <div>
                <label htmlFor="enforce2fa" className="text-sm font-medium text-foreground cursor-pointer">
                  Enforce Two-Factor Authentication
                </label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Require all workspace members to enable 2FA before accessing the app.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Session timeout (minutes)</label>
              <Input {...register('sessionTimeoutMins', { valueAsNumber: true })} type="number" min={15} max={43200} className="w-40" />
              <p className="mt-1 text-xs text-muted-foreground">Default: 1440 (24 hours). Minimum: 15 minutes.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">IP Whitelist</label>
              <Input {...register('ipWhitelistRaw')} placeholder="203.0.113.0/24, 192.168.1.0/24" />
              <p className="mt-1 text-xs text-muted-foreground">
                Comma-separated CIDR ranges. Leave empty to allow all IPs.
              </p>
            </div>

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              <Shield className="h-4 w-4" /> Save Security Settings
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
