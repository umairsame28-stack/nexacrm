'use client';

import { useState } from 'react';
import { Plus, Copy, Trash2, Key } from 'lucide-react';
import { useApiKeys, useCreateApiKey, useRevokeApiKey } from '@/queries/settings.queries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDateTime } from '@/lib/format';
import { RevokeApiKeyDialog } from '@/components/features/settings/revoke-api-key-dialog';
import toast from 'react-hot-toast';

interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  lastUsedAt: string | null;
  createdAt: string;
}

export default function ApiKeysPage() {
  const { data: keys, isLoading } = useApiKeys();
  const createKey = useCreateApiKey();
  const revokeKey = useRevokeApiKey();
  const [newKeyName, setNewKeyName] = useState('');
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [revokingKey, setRevokingKey] = useState<ApiKey | null>(null);

  async function handleCreate() {
    if (!newKeyName.trim()) { toast.error('Enter a name for the API key'); return; }
    const r = await createKey.mutateAsync(newKeyName.trim());
    setRevealedKey(r.data.key);
    setNewKeyName('');
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-foreground">API Keys</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Create keys for external integrations (Zapier, Make, custom apps)</p>
      </div>

      {/* New key — shown only once after creation */}
      {revealedKey && (
        <div className="rounded-xl border border-success/30 bg-success/5 p-4">
          <p className="text-sm font-semibold text-success mb-2">⚠ Copy this key now — it will never be shown again</p>
          <div className="flex items-center gap-2 bg-background rounded-lg px-3 py-2 border border-border">
            <code className="flex-1 text-xs font-mono text-foreground break-all">{revealedKey}</code>
            <button
              onClick={() => { navigator.clipboard.writeText(revealedKey); toast.success('Key copied'); }}
              className="flex-shrink-0 text-muted-foreground hover:text-foreground"
              aria-label="Copy API key"
            >
              <Copy className="h-4 w-4" />
            </button>
          </div>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => setRevealedKey(null)}>Dismiss</Button>
        </div>
      )}

      {/* Create new key */}
      <Card>
        <CardHeader><CardTitle>Create New Key</CardTitle></CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input value={newKeyName} onChange={e => setNewKeyName(e.target.value)}
              placeholder="e.g. Zapier Integration" className="flex-1"
              onKeyDown={e => e.key === 'Enter' && void handleCreate()} />
            <Button onClick={handleCreate} disabled={createKey.isPending}>
              <Plus className="h-4 w-4" /> Create
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Keys list */}
      <Card>
        <CardHeader><CardTitle>Active Keys</CardTitle></CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}</div>
          ) : !keys?.length ? (
            <div className="flex flex-col items-center py-10 text-center gap-2">
              <Key className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No API keys yet</p>
            </div>
          ) : (
            keys.map(key => (
              <div key={key.id} className="flex items-center gap-4 px-6 py-4 border-b border-border/50 last:border-0">
                <Key className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{key.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">{key.keyPrefix}••••••••••••••••</p>
                </div>
                <div className="text-right text-xs text-muted-foreground hidden sm:block">
                  <p>Created {formatDateTime(key.createdAt)}</p>
                  {key.lastUsedAt && <p>Last used {formatDateTime(key.lastUsedAt)}</p>}
                </div>
                <button
                  onClick={() => setRevokingKey(key)}
                  className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
                  title="Revoke key"
                  aria-label={`Revoke ${key.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Revoke key dialog */}
      {revokingKey && (
        <RevokeApiKeyDialog
          open={!!revokingKey}
          onOpenChange={(open) => !open && setRevokingKey(null)}
          onConfirm={() => {
            revokeKey.mutate(revokingKey.id);
            setRevokingKey(null);
          }}
          keyName={revokingKey.name}
          keyPrefix={revokingKey.keyPrefix}
          isRevoking={revokeKey.isPending}
        />
      )}
    </div>
  );
}
