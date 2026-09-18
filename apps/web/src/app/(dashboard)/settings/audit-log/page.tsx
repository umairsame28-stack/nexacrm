'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { formatDateTime } from '@/lib/format';
import { subDays, format } from 'date-fns';

interface AuditEntry {
  id: string; action: string; resource: string; resourceId: string | null;
  ipAddress: string | null; userAgent: string | null; createdAt: string;
  user: { id: string; firstName: string; lastName: string; email: string } | null;
}

const ACTION_VARIANT: Record<string, 'success' | 'destructive' | 'muted' | 'warning'> = {
  CREATE: 'success', UPDATE: 'muted', DELETE: 'destructive',
  LOGIN: 'success', LOGOUT: 'muted', LOGIN_FAILED: 'destructive',
  EXPORT: 'warning', IMPORT: 'warning', SETTINGS_CHANGED: 'warning',
};

export default function AuditLogPage() {
  const [from, setFrom] = useState(format(subDays(new Date(), 7), 'yyyy-MM-dd'));
  const [to, setTo] = useState(format(new Date(), 'yyyy-MM-dd'));

  const { data, isLoading } = useQuery<{ data: AuditEntry[] }>({
    queryKey: ['audit-log', from, to],
    queryFn: async () => { const r = await apiClient.get('/settings/audit-logs', { params: { from, to, limit: 100 } }); return r.data; },
    staleTime: 60_000,
  });

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold text-foreground">Audit Log</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Track all actions performed in this workspace</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground">From</label>
          <input type="date" value={from} onChange={e => setFrom(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-1.5 text-sm focus:border-primary focus:outline-none" />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground">To</label>
          <input type="date" value={to} onChange={e => setTo(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-1.5 text-sm focus:border-primary focus:outline-none" />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}</div>
          ) : !data?.data.length ? (
            <div className="py-12 text-center text-sm text-muted-foreground">No audit entries for this period</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {['Time', 'User', 'Action', 'Resource', 'IP'].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-medium text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.data.map(entry => (
                  <tr key={entry.id} className="border-b border-border/50 last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{formatDateTime(entry.createdAt)}</td>
                    <td className="px-4 py-3">
                      {entry.user ? (
                        <div>
                          <p className="font-medium text-foreground">{entry.user.firstName} {entry.user.lastName}</p>
                          <p className="text-xs text-muted-foreground">{entry.user.email}</p>
                        </div>
                      ) : <span className="text-muted-foreground">System</span>}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={ACTION_VARIANT[entry.action] ?? 'muted'}>{entry.action}</Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <span className="capitalize">{entry.resource}</span>
                      {entry.resourceId && <span className="ml-1 text-xs opacity-60 font-mono">{entry.resourceId.slice(0, 8)}</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground font-mono">{entry.ipAddress ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
