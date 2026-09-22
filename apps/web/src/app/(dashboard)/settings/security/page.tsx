'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Loader2, Shield, Smartphone, Download, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useUpdateSecuritySettings, useSettings } from '@/queries/settings.queries';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth.store';
import toast from 'react-hot-toast';
import Image from 'next/image';

interface Form { enforce2FA: boolean; sessionTimeoutMins: number; ipWhitelistRaw: string }

export default function SecuritySettingsPage() {
  const { data: settings } = useSettings();
  const update = useUpdateSecuritySettings();
  const { user } = useAuthStore();
  
  const [totpSetup, setTotpSetup] = useState<{ secret: string; qrCodeUrl: string } | null>(null);
  const [totpConfirmCode, setTotpConfirmCode] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [disableCode, setDisableCode] = useState('');
  const [isEnabling, setIsEnabling] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isDisabling, setIsDisabling] = useState(false);

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

  async function handleEnable2FA() {
    setIsEnabling(true);
    try {
      const res = await apiClient.post<{ secret: string; qrCodeUrl: string }>('/auth/2fa/enable');
      setTotpSetup(res.data);
    } catch {
      toast.error('Failed to initiate 2FA setup');
    } finally {
      setIsEnabling(false);
    }
  }

  async function handleConfirm2FA() {
    if (!totpConfirmCode || totpConfirmCode.length !== 6) {
      toast.error('Please enter a valid 6-digit code');
      return;
    }

    setIsConfirming(true);
    try {
      const res = await apiClient.post<{ recoveryCodes: string[] }>('/auth/2fa/confirm', { code: totpConfirmCode });
      setRecoveryCodes(res.data.recoveryCodes);
      setTotpSetup(null);
      toast.success('Two-factor authentication enabled!');
      window.location.reload(); // Refresh to update user.totpEnabled
    } catch {
      toast.error('Invalid code. Please try again.');
    } finally {
      setIsConfirming(false);
    }
  }

  async function handleDisable2FA() {
    if (!disableCode || disableCode.length !== 6) {
      toast.error('Please enter a valid 6-digit code');
      return;
    }

    setIsDisabling(true);
    try {
      await apiClient.delete('/auth/2fa/disable', { data: { code: disableCode } });
      setDisableCode('');
      toast.success('Two-factor authentication disabled');
      window.location.reload();
    } catch {
      toast.error('Invalid code');
    } finally {
      setIsDisabling(false);
    }
  }

  function downloadRecoveryCodes() {
    const text = recoveryCodes.join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'nexacrm-recovery-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-foreground">Security</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage your security settings and two-factor authentication</p>
      </div>

      {/* Personal 2FA Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Two-Factor Authentication
          </CardTitle>
          <CardDescription>
            Add an extra layer of security to your account with TOTP-based 2FA.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!user?.totpEnabled && !totpSetup && !recoveryCodes.length && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Two-factor authentication is currently <strong>disabled</strong> for your account.
              </p>
              <Button onClick={handleEnable2FA} disabled={isEnabling}>
                {isEnabling && <Loader2 className="h-4 w-4 animate-spin" />}
                <Smartphone className="h-4 w-4" />
                Enable Two-Factor Authentication
              </Button>
            </div>
          )}

          {totpSetup && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg space-y-3">
                <h3 className="font-semibold text-sm">Step 1: Scan QR Code</h3>
                <p className="text-sm text-muted-foreground">
                  Scan this QR code with your authenticator app (Google Authenticator, Authy, 1Password, etc.)
                </p>
                <div className="flex justify-center p-4 bg-white rounded-lg">
                  <Image
                    src={totpSetup.qrCodeUrl}
                    alt="QR Code"
                    width={200}
                    height={200}
                    className="rounded"
                  />
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Or enter this code manually: <code className="bg-background px-2 py-1 rounded">{totpSetup.secret}</code>
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Step 2: Verify Code</h3>
                <p className="text-sm text-muted-foreground">
                  Enter the 6-digit code from your authenticator app to complete setup.
                </p>
                <div className="flex gap-2">
                  <Input
                    value={totpConfirmCode}
                    onChange={(e) => setTotpConfirmCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    maxLength={6}
                    className="text-center text-lg tracking-widest font-mono"
                  />
                  <Button onClick={handleConfirm2FA} disabled={isConfirming || totpConfirmCode.length !== 6}>
                    {isConfirming && <Loader2 className="h-4 w-4 animate-spin" />}
                    Verify
                  </Button>
                </div>
              </div>

              <Button variant="outline" size="sm" onClick={() => setTotpSetup(null)}>
                Cancel
              </Button>
            </div>
          )}

          {recoveryCodes.length > 0 && (
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg space-y-3">
              <div className="flex items-start gap-2">
                <Key className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-sm text-yellow-900 dark:text-yellow-100">
                    Save Your Recovery Codes
                  </h3>
                  <p className="text-sm text-yellow-800 dark:text-yellow-200 mt-1">
                    Store these codes in a safe place. Each code can only be used once to access your account if you lose your authenticator device.
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 font-mono text-sm bg-background p-3 rounded">
                {recoveryCodes.map((code, i) => (
                  <div key={i} className="text-center py-1 px-2 bg-muted rounded">
                    {code}
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Button onClick={downloadRecoveryCodes} variant="outline" size="sm">
                  <Download className="h-4 w-4" />
                  Download Codes
                </Button>
                <Button onClick={() => setRecoveryCodes([])} size="sm">
                  I've Saved My Codes
                </Button>
              </div>
            </div>
          )}

          {user?.totpEnabled && !totpSetup && !recoveryCodes.length && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <Shield className="h-5 w-5" />
                <span className="font-semibold">Two-factor authentication is enabled</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Your account is protected with TOTP-based two-factor authentication.
              </p>
              
              <div className="pt-3 border-t space-y-3">
                <h3 className="font-semibold text-sm">Disable 2FA</h3>
                <p className="text-sm text-muted-foreground">
                  Enter your current 6-digit code to disable two-factor authentication.
                </p>
                <div className="flex gap-2">
                  <Input
                    value={disableCode}
                    onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    maxLength={6}
                    className="text-center text-lg tracking-widest font-mono w-40"
                  />
                  <Button
                    onClick={handleDisable2FA}
                    disabled={isDisabling || disableCode.length !== 6}
                    variant="destructive"
                  >
                    {isDisabling && <Loader2 className="h-4 w-4 animate-spin" />}
                    Disable 2FA
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Workspace Security Policies */}
      <Card>
        <CardHeader>
          <CardTitle>Workspace Security Policies</CardTitle>
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
