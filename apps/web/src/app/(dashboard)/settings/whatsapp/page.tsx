'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { CheckCircle, XCircle, Loader2, Copy, ExternalLink, Wifi, WifiOff, Activity, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useUpdateWhatsappSettings, useTestWhatsapp, useWebhookHealth } from '@/queries/settings.queries';
import toast from 'react-hot-toast';
import { formatRelative } from '@/lib/format';

interface Form {
  wabPhoneNumberId: string;
  wabAccessToken: string;
  wabWebhookSecret: string;
  wabVerifyToken: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export default function WhatsAppSettingsPage() {
  const [testResult, setTestResult] = useState<{ connected: boolean; phoneNumber?: string; displayName?: string; error?: string } | null>(null);
  const [showToken, setShowToken] = useState(false);
  const update = useUpdateWhatsappSettings();
  const testConn = useTestWhatsapp();
  const { data: webhookHealth } = useWebhookHealth();

  const { register, handleSubmit, getValues, formState: { isSubmitting } } = useForm<Form>();

  const webhookUrl = `${API_URL}/api/v1/webhooks/whatsapp`;

  async function onSubmit(data: Form) {
    const payload: Record<string, string> = {};
    if (data.wabPhoneNumberId) payload.wabPhoneNumberId = data.wabPhoneNumberId;
    if (data.wabAccessToken) payload.wabAccessToken = data.wabAccessToken;
    if (data.wabWebhookSecret) payload.wabWebhookSecret = data.wabWebhookSecret;
    if (data.wabVerifyToken) payload.wabVerifyToken = data.wabVerifyToken;
    await update.mutateAsync(payload);
  }

  async function handleTest() {
    const values = getValues();
    
    // Validate required fields before sending
    if (!values.wabAccessToken || !values.wabPhoneNumberId) {
      toast.error('Please enter both Access Token and Phone Number ID before testing');
      return;
    }

    const r = await testConn.mutateAsync({
      wabAccessToken: values.wabAccessToken,
      wabPhoneNumberId: values.wabPhoneNumberId,
    });
    setTestResult(r.data);
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-foreground">WhatsApp Integration</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Connect your Meta WhatsApp Business Account</p>
      </div>

      {/* Setup Instructions Banner */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1 text-sm">
              <p className="font-semibold text-foreground mb-1">Important: Use Permanent Token</p>
              <p className="text-muted-foreground text-xs mb-2">
                The token from Meta's "Quick Start" tab expires in 24 hours and will cause Error 190.
              </p>
              <p className="text-muted-foreground text-xs">
                ✅ <strong>Correct:</strong> Generate a permanent token from <strong>Meta Business Suite → Settings → System Users</strong>
                <br />
                ❌ <strong>Wrong:</strong> Using the temporary token from the Quick Start tab
              </p>
              <a
                href="https://business.facebook.com/settings/system-users"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-2 text-xs text-primary hover:underline"
              >
                Open System Users <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Connection status */}
      {testResult && (
        <Card className={testResult.connected ? 'border-success/50' : 'border-destructive/50'}>
          <CardContent className="pt-6">
            <div className={`flex items-start gap-3 rounded-xl p-4 ${testResult.connected ? 'bg-success/10 border border-success/20' : 'bg-destructive/10 border border-destructive/20'}`}>
              {testResult.connected
                ? <CheckCircle className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                : <XCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />}
              <div className="flex-1">
                <p className={`text-sm font-semibold ${testResult.connected ? 'text-success' : 'text-destructive'}`}>
                  {testResult.connected
                    ? `✓ Connection successful`
                    : '✗ Connection failed'}
                </p>
                {testResult.connected ? (
                  <div className="mt-1 text-xs text-muted-foreground space-y-0.5">
                    <p>📱 Phone: {testResult.phoneNumber}</p>
                    <p>🏢 Business: {testResult.displayName}</p>
                  </div>
                ) : (
                  <div className="mt-2 space-y-2">
                    <p className="text-xs text-muted-foreground">{testResult.error}</p>
                    {testResult.error?.includes('190') && (
                      <div className="rounded-lg bg-background border border-warning/20 p-3 text-xs">
                        <p className="font-semibold text-warning mb-1">⚠️ Error 190 Fix:</p>
                        <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                          <li>Go to <a href="https://business.facebook.com/settings/system-users" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Meta Business Suite → System Users</a></li>
                          <li>Create or select a System User</li>
                          <li>Click "Generate New Token"</li>
                          <li>Select your WhatsApp app</li>
                          <li>Choose permissions: <code className="text-xs bg-muted px-1 py-0.5 rounded">whatsapp_business_messaging</code> + <code className="text-xs bg-muted px-1 py-0.5 rounded">whatsapp_business_management</code></li>
                          <li>Set expiration to <strong>"Never"</strong></li>
                          <li>Copy the new token and paste it above</li>
                        </ol>
                      </div>
                    )}
                    {testResult.error?.includes('100') && (
                      <div className="rounded-lg bg-background border border-warning/20 p-3 text-xs">
                        <p className="font-semibold text-warning mb-1">⚠️ Error 100 Fix:</p>
                        <p className="text-muted-foreground">Your Phone Number ID is incorrect. Get it from your WhatsApp app's API Setup page (it's a 15-digit number, not the phone number itself).</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Credentials</CardTitle>
          <CardDescription>Enter your Meta App credentials. Sensitive fields are encrypted at rest.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Phone Number ID <span className="text-destructive">*</span>
              </label>
              <Input {...register('wabPhoneNumberId')} placeholder="1162237840315924" />
              <p className="mt-1 text-xs text-muted-foreground">
                Find this in WhatsApp dashboard → API Setup → From (15-digit number)
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Access Token <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <Input {...register('wabAccessToken')} type={showToken ? 'text' : 'password'} placeholder="EAAxxxxxxxxxx (very long token)" className="pr-20 font-mono text-xs" />
                <button type="button" onClick={() => setShowToken(!showToken)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground">
                  {showToken ? 'Hide' : 'Show'}
                </button>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                <strong className="text-warning">⚠️ Use permanent token from System Users</strong> (not Quick Start tab)
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Webhook Secret</label>
              <Input {...register('wabWebhookSecret')} type="password" placeholder="my-webhook-secret" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Verify Token</label>
              <Input {...register('wabVerifyToken')} placeholder="my-verify-token" />
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />} Save
              </Button>
              <Button type="button" variant="outline" disabled={testConn.isPending} onClick={handleTest}>
                {testConn.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Test Connection
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Webhook URL</CardTitle>
          <CardDescription>Paste this URL into your Meta App's Webhook settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Webhook Health Indicator */}
          {webhookHealth && (
            <div className={`rounded-lg border p-4 ${
              webhookHealth.isHealthy
                ? 'bg-success/10 border-success/30'
                : webhookHealth.webhookConfigured
                ? 'bg-primary/10 border-primary/30'
                : webhookHealth.credentialsSaved
                ? 'bg-warning/10 border-warning/30'
                : 'bg-muted border-border'
            }`}>
              <div className="flex items-start gap-3">
                {webhookHealth.isHealthy ? (
                  <Activity className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                ) : webhookHealth.webhookConfigured ? (
                  <Wifi className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                ) : webhookHealth.credentialsSaved ? (
                  <Clock className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                ) : (
                  <WifiOff className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">
                    {webhookHealth.isHealthy
                      ? '✅ Webhook Active'
                      : webhookHealth.webhookConfigured
                      ? '✅ Webhook Working'
                      : webhookHealth.credentialsSaved
                      ? '⚠️ Webhook Not Connected'
                      : '⚪ Webhook Not Configured'}
                  </p>
                  {webhookHealth.isHealthy && webhookHealth.lastWebhookReceived ? (
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Last received: {formatRelative(webhookHealth.lastWebhookReceived)}
                    </p>
                  ) : webhookHealth.webhookConfigured && webhookHealth.lastWebhookReceived ? (
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Last received: {formatRelative(webhookHealth.lastWebhookReceived)} (not recently active)
                    </p>
                  ) : webhookHealth.credentialsSaved ? (
                    <div className="text-xs text-muted-foreground mt-1 space-y-1">
                      <p>⚠️ Credentials saved but no messages received yet.</p>
                      <p className="font-medium">Next steps:</p>
                      <ol className="list-decimal list-inside space-y-0.5 ml-2">
                        <li>Configure webhook in Meta dashboard</li>
                        <li>Send a test message to your WhatsApp Business number</li>
                      </ol>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-1">
                      Fill in Webhook Secret and Verify Token above, then configure in Meta.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2.5">
            <code className="flex-1 text-xs text-foreground font-mono break-all">{webhookHealth?.webhookUrl || webhookUrl}</code>
            <button onClick={() => { navigator.clipboard.writeText(webhookHealth?.webhookUrl || webhookUrl); toast.success('Copied!'); }}
              className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors">
              <Copy className="h-4 w-4" />
            </button>
          </div>
          <p className="text-xs text-muted-foreground">Subscribe to: <strong>messages</strong></p>
        </CardContent>
      </Card>
    </div>
  );
}
