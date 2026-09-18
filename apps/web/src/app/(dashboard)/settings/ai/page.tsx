'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useUpdateAISettings, useTestAI } from '@/queries/settings.queries';

interface Form { aiProvider: string; aiApiKey: string; aiModel: string }

const PROVIDERS = [
  { 
    value: 'OPENAI', 
    label: 'OpenAI', 
    models: [
      'gpt-6-astra',                // Most difficult reasoning, coding, professional work
      'gpt-5.6-sol',                // Complex professional work
      'gpt-5.6-terra',              // Intelligence + cost balance
      'gpt-5.6-luna',               // Cheap, high-volume workloads
      'gpt-4o',                     // Legacy: GPT-4 Optimized
      'gpt-4o-mini',                // Legacy: GPT-4 Mini
      'gpt-4-turbo',                // Legacy: GPT-4 Turbo
      'gpt-3.5-turbo',              // Legacy: GPT-3.5
    ] 
  },
  { 
    value: 'ANTHROPIC', 
    label: 'Anthropic', 
    models: [
      'claude-fable-5',             // 🥇 Hardest reasoning, long-running agents
      'claude-opus-5',              // 🏆 Deep reasoning, advanced coding, complex tasks
      'claude-opus-4-8',            // ⚡ Very advanced reasoning/coding
      'claude-opus-4-7',            // ⚡ Advanced coding & reasoning
      'claude-opus-4-6',            // ⚡ Complex coding/agents
      'claude-opus-4-5-20251101',   // 💎 Advanced general work
      'claude-sonnet-5',            // ⚖️ Best balance of intelligence + speed
      'claude-sonnet-4-6',          // ⚖️ Coding, agents, production
      'claude-sonnet-4-5-20250929', // ⚖️ Strong coding/general work
      'claude-haiku-4-5-20251001',  // 🚀 Fast, cheaper, high-volume
      'claude-3-5-sonnet-20241022', // Legacy: Claude 3.5
      'claude-3-haiku-20240307',    // Legacy: Claude 3 Haiku
      'claude-3-opus-20240229',     // Legacy: Claude 3 Opus
    ] 
  },
  { 
    value: 'GEMINI', 
    label: 'Google Gemini', 
    models: [
      'gemini-3.8-flash',           // Latest: coding, agentic, rapid reasoning
      'gemini-3.5-flash',           // High-efficiency, ultra-low latency
      'gemini-3.5-flash-lite',      // Lightweight for high-volume tasks
      'gemini-3.1-pro',             // Most advanced reasoning
      'gemini-2.5-pro',             // Enterprise fallback
      'gemini-2.5-flash',           // Balanced cost/performance
      'gemini-1.5-flash',           // Legacy stable
      'gemini-1.5-pro',             // Legacy pro
    ] 
  },
];

export default function AISettingsPage() {
  const [testResult, setTestResult] = useState<{ connected: boolean; model?: string; error?: string } | null>(null);
  const [showKey, setShowKey] = useState(false);
  const update = useUpdateAISettings();
  const testConn = useTestAI();

  const { register, handleSubmit, watch, formState: { isSubmitting } } = useForm<Form>({
    defaultValues: { aiProvider: 'OPENAI', aiModel: 'gpt-4o' },
  });

  const selectedProvider = PROVIDERS.find(p => p.value === watch('aiProvider'));

  async function onSubmit(data: Form) {
    const payload: Record<string, string> = {};
    if (data.aiProvider) payload.aiProvider = data.aiProvider;
    if (data.aiApiKey) payload.aiApiKey = data.aiApiKey;
    if (data.aiModel) payload.aiModel = data.aiModel;
    await update.mutateAsync(payload);
  }

  async function handleTest() {
    const r = await testConn.mutateAsync();
    setTestResult(r.data);
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-foreground">AI Provider</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Configure the AI model used for suggestions, summaries, and insights</p>
      </div>

      {testResult && (
        <div className={`flex items-start gap-3 rounded-xl p-4 ${testResult.connected ? 'bg-success/10 border border-success/20' : 'bg-destructive/10 border border-destructive/20'}`}>
          {testResult.connected
            ? <CheckCircle className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
            : <XCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />}
          <div>
            <p className={`text-sm font-semibold ${testResult.connected ? 'text-success' : 'text-destructive'}`}>
              {testResult.connected ? `Connected · ${testResult.model ?? ''}` : 'Connection failed'}
            </p>
            {!testResult.connected && <p className="text-xs text-muted-foreground mt-0.5">{testResult.error}</p>}
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Provider Configuration</CardTitle>
          <CardDescription>Your API key is encrypted before storage and never returned in API responses.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Provider</label>
              <select {...register('aiProvider')} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20">
                {PROVIDERS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">API Key</label>
              <div className="relative">
                <Input {...register('aiApiKey')} type={showKey ? 'text' : 'password'} placeholder="sk-… or key-…" className="pr-16" />
                <button type="button" onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground">
                  {showKey ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Model</label>
              <select {...register('aiModel')} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20">
                {(selectedProvider?.models ?? []).map(m => <option key={m} value={m}>{m}</option>)}
              </select>
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
        <CardHeader><CardTitle>Available AI Features</CardTitle></CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {['Smart reply suggestions in inbox','Conversation summarization','Rewrite & grammar correction','Message translation','Lead qualification scoring','Customer sentiment analysis','Auto-suggest contact tags','Follow-up message generation','Semantic CRM search','Business insights dashboard'].map(f => (
              <li key={f} className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                {f}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
