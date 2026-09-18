import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import toast from 'react-hot-toast';

export interface WorkspaceSettings {
  id: string; workspaceId: string;
  wabPhoneNumberId: string | null; wabAccessToken: string | null; wabVerifyToken: string | null;
  aiProvider: string | null; aiModel: string | null; aiApiKey: string | null;
  smtpHost: string | null; smtpPort: number | null; smtpUser: string | null;
  smtpPassword: string | null; smtpFromEmail: string | null; smtpFromName: string | null;
  enforce2FA: boolean; sessionTimeoutMins: number; ipWhitelist: string[];
  updatedAt: string;
}

export interface ApiKey {
  id: string; name: string; keyPrefix: string;
  lastUsedAt: string | null; expiresAt: string | null; createdAt: string;
}

export function useSettings() {
  return useQuery<WorkspaceSettings>({
    queryKey: ['settings'],
    queryFn: async () => { const r = await apiClient.get<WorkspaceSettings>('/settings'); return r.data; },
    staleTime: 60_000,
  });
}

export function useUpdateWhatsappSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => apiClient.patch('/settings/whatsapp', data),
    onSuccess: () => { 
      void qc.invalidateQueries({ queryKey: ['settings'] }); 
      void qc.invalidateQueries({ queryKey: ['whatsapp-status'] }); 
      toast.success('WhatsApp settings saved'); 
    },
    onError: () => toast.error('Failed to save settings'),
  });
}

export function useTestWhatsapp() {
  return useMutation({
    mutationFn: (credentials: { wabAccessToken: string; wabPhoneNumberId: string }) =>
      apiClient.post<{ connected: boolean; phoneNumber?: string; displayName?: string; error?: string; qualityRating?: string }>(
        '/settings/whatsapp/test',
        credentials,
      ),
  });
}

export function useWhatsappStatus() {
  return useQuery<{ connected: boolean; phoneNumberId: string | null; configured: boolean }>({
    queryKey: ['whatsapp-status'],
    queryFn: async () => { const r = await apiClient.get('/settings/whatsapp/status'); return r.data; },
    staleTime: 30_000,
    refetchInterval: 60_000, // Refetch every minute
  });
}

export function useWebhookHealth() {
  return useQuery<{ 
    webhookConfigured: boolean; 
    lastWebhookReceived: string | null; 
    isHealthy: boolean;
    webhookUrl: string;
    credentialsSaved: boolean;
  }>({
    queryKey: ['webhook-health'],
    queryFn: async () => { const r = await apiClient.get('/settings/whatsapp/webhook-health'); return r.data; },
    staleTime: 10_000,
    refetchInterval: 30_000, // Refetch every 30 seconds
  });
}

export function useUpdateAISettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => apiClient.patch('/settings/ai', data),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['settings'] }); toast.success('AI settings saved'); },
    onError: () => toast.error('Failed to save settings'),
  });
}

export function useTestAI() {
  return useMutation({
    mutationFn: () => apiClient.post<{ connected: boolean; model?: string; error?: string }>('/settings/ai/test'),
  });
}

export function useUpdateSmtpSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => apiClient.patch('/settings/smtp', data),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['settings'] }); toast.success('SMTP settings saved'); },
    onError: () => toast.error('Failed to save settings'),
  });
}

export function useTestSmtp() {
  return useMutation({
    mutationFn: () => apiClient.post<{ sent: boolean; error?: string }>('/settings/smtp/test'),
    onSuccess: (r) => r.data.sent ? toast.success('Test email sent!') : toast.error(r.data.error ?? 'SMTP test failed'),
  });
}

export function useUpdateSecuritySettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => apiClient.patch('/settings/security', data),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['settings'] }); toast.success('Security settings saved'); },
    onError: () => toast.error('Failed to save settings'),
  });
}

export function useApiKeys() {
  return useQuery<ApiKey[]>({
    queryKey: ['api-keys'],
    queryFn: async () => { const r = await apiClient.get<ApiKey[]>('/settings/api-keys'); return r.data; },
    staleTime: 60_000,
  });
}

export function useCreateApiKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => apiClient.post<{ id: string; name: string; key: string; keyPrefix: string }>('/settings/api-keys', { name }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['api-keys'] }),
    onError: () => toast.error('Failed to create API key'),
  });
}

export function useRevokeApiKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/settings/api-keys/${id}`),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['api-keys'] }); toast.success('API key revoked'); },
    onError: () => toast.error('Failed to revoke key'),
  });
}
