'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, UserMinus } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/format';
import { RemoveMemberDialog } from '@/components/features/settings/remove-member-dialog';
import toast from 'react-hot-toast';

const ROLES = ['OWNER', 'ADMINISTRATOR', 'MANAGER', 'SALES_AGENT', 'SUPPORT_AGENT', 'VIEWER'];

interface Member {
  id: string; role: string; isActive: boolean; joinedAt: string;
  user: { id: string; firstName: string; lastName: string; email: string; avatarUrl: string | null };
}

export default function TeamSettingsPage() {
  const { workspace } = useAuthStore();
  const qc = useQueryClient();
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('SALES_AGENT');
  const [removingMember, setRemovingMember] = useState<Member | null>(null);

  const { data: members, isLoading } = useQuery<{ data: Member[] }>({
    queryKey: ['workspace-members'],
    queryFn: async () => { const r = await apiClient.get(`/workspaces/${workspace?.id}/members`); return r.data; },
    enabled: !!workspace?.id,
    staleTime: 60_000,
  });

  const invite = useMutation({
    mutationFn: () => apiClient.post(`/workspaces/${workspace?.id}/invitations`, { email: inviteEmail, role: inviteRole }),
    onSuccess: () => { toast.success(`Invitation sent to ${inviteEmail}`); setInviteEmail(''); },
    onError: (e: { response?: { data?: { message?: string } } }) => toast.error(e?.response?.data?.message ?? 'Failed to send invitation'),
  });

  const updateRole = useMutation({
    mutationFn: ({ memberId, role }: { memberId: string; role: string }) =>
      apiClient.patch(`/workspaces/${workspace?.id}/members/${memberId}`, { role }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['workspace-members'] }); toast.success('Role updated'); },
    onError: () => toast.error('Failed to update role'),
  });

  const removeMember = useMutation({
    mutationFn: (memberId: string) => apiClient.delete(`/workspaces/${workspace?.id}/members/${memberId}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['workspace-members'] });
      toast.success('Member removed');
      setRemovingMember(null);
    },
    onError: () => {
      toast.error('Failed to remove member');
      setRemovingMember(null);
    },
  });

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold text-foreground">Team & Members</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage who has access to this workspace</p>
      </div>

      {/* Invite */}
      <Card>
        <CardHeader><CardTitle>Invite Member</CardTitle></CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              placeholder="colleague@company.com"
              type="email"
              className="flex-1"
              onKeyDown={e => e.key === 'Enter' && invite.mutate()}
            />
            <select
              value={inviteRole}
              onChange={e => setInviteRole(e.target.value)}
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
            >
              {ROLES.filter(r => r !== 'OWNER').map(r => (
                <option key={r} value={r}>{r.replace('_', ' ')}</option>
              ))}
            </select>
            <Button onClick={() => invite.mutate()} disabled={!inviteEmail || invite.isPending}>
              <Plus className="h-4 w-4" /> Invite
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Members list */}
      <Card>
        <CardHeader><CardTitle>Members ({members?.data.length ?? 0})</CardTitle></CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-1.5"><Skeleton className="h-4 w-36" /><Skeleton className="h-3 w-48" /></div>
                </div>
              ))}
            </div>
          ) : (
            members?.data.map(member => (
              <div key={member.id} className="flex items-center gap-4 px-6 py-4 border-b border-border/50 last:border-0">
                <Avatar
                  firstName={member.user.firstName}
                  lastName={member.user.lastName}
                  src={member.user.avatarUrl}
                  size="sm"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {member.user.firstName} {member.user.lastName}
                    {!member.isActive && <span className="ml-2 text-xs text-muted-foreground">(inactive)</span>}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{member.user.email}</p>
                </div>
                <div className="hidden sm:block text-xs text-muted-foreground">
                  Joined {formatDate(member.joinedAt)}
                </div>
                <select
                  defaultValue={member.role}
                  onChange={e => updateRole.mutate({ memberId: member.id, role: e.target.value })}
                  disabled={member.role === 'OWNER'}
                  className="rounded-lg border border-input bg-background px-2 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none disabled:opacity-50"
                >
                  {ROLES.map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
                </select>
                <button
                  onClick={() => {
                    if (member.role === 'OWNER') return;
                    setRemovingMember(member);
                  }}
                  disabled={member.role === 'OWNER'}
                  className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Remove member"
                  aria-label={`Remove ${member.user.firstName} ${member.user.lastName}`}
                >
                  <UserMinus className="h-4 w-4" />
                </button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Remove member dialog */}
      {removingMember && (
        <RemoveMemberDialog
          open={!!removingMember}
          onOpenChange={(open) => !open && setRemovingMember(null)}
          onConfirm={() => removeMember.mutate(removingMember.id)}
          memberName={`${removingMember.user.firstName} ${removingMember.user.lastName}`}
          memberEmail={removingMember.user.email}
          isRemoving={removeMember.isPending}
        />
      )}
    </div>
  );
}
