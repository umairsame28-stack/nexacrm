import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import toast from 'react-hot-toast';

export interface Pipeline { id: string; name: string; isDefault: boolean; stages: PipelineStage[] }
export interface PipelineStage { id: string; name: string; color: string; sortOrder: number; probability: number }
export interface Lead {
  id: string; workspaceId: string; contactId: string; pipelineId: string; stageId: string;
  title: string; score: number; status: string; source: string;
  followUpAt?: string | null; followUpNote?: string | null; assignedToId?: string | null;
  createdAt: string; updatedAt: string;
  contact: { id: string; firstName: string; lastName?: string | null; phone: string; avatarUrl?: string | null };
  stage: { id: string; name: string; color: string };
  assignedTo?: { id: string; firstName: string; lastName?: string | null } | null;
  pipeline?: { id: string; name: string } | null;
}
export interface KanbanData { stages: Array<{ id: string; name: string; color: string; sortOrder: number; leads: Lead[]; totalCount: number }> }

export function usePipelines() {
  return useQuery<Pipeline[]>({ queryKey: ['pipelines'], queryFn: async () => { const r = await apiClient.get<Pipeline[]>('/pipelines'); return r.data; }, staleTime: 120_000 });
}

export function useLeadsKanban(pipelineId?: string) {
  return useQuery<KanbanData>({
    queryKey: ['leads', 'kanban', pipelineId],
    queryFn: async () => { const r = await apiClient.get<KanbanData>('/leads/kanban', { params: pipelineId ? { pipelineId } : {} }); return r.data; },
    staleTime: 30_000,
  });
}

export function useLead(id: string) {
  return useQuery<Lead & { history: Array<{ id: string; field: string; oldValue: string | null; newValue: string | null; createdAt: string }> }>({
    queryKey: ['leads', id], queryFn: async () => { const r = await apiClient.get(`/leads/${id}`); return r.data; }, enabled: !!id,
  });
}

export function useCreateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => apiClient.post('/leads', data),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['leads'] }); toast.success('Lead created'); },
    onError: () => toast.error('Failed to create lead'),
  });
}

export function useMoveLeadStage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, stageId }: { id: string; stageId: string }) => apiClient.patch(`/leads/${id}/stage`, { stageId }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['leads'] }); },
    onError: () => toast.error('Failed to move lead'),
  });
}

export function useUpdateLead(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => apiClient.patch(`/leads/${id}`, data),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['leads'] }); toast.success('Lead updated'); },
    onError: () => toast.error('Failed to update lead'),
  });
}

export function useConvertLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ leadId, ...data }: { leadId: string; dealPipelineId: string; dealStageId: string; dealValue?: number }) =>
      apiClient.post(`/leads/${leadId}/convert`, data),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['leads'] }); void qc.invalidateQueries({ queryKey: ['deals'] }); toast.success('Lead converted to deal!'); },
    onError: () => toast.error('Failed to convert lead'),
  });
}
