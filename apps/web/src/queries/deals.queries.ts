import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import toast from 'react-hot-toast';

export interface DealPipeline { id: string; name: string; isDefault: boolean; currency: string }
export interface DealStage { id: string; name: string; color: string; sortOrder: number; probability: number; isWon: boolean; isLost: boolean }
export interface Deal {
  id: string; workspaceId: string; pipelineId: string; stageId: string;
  title: string; value: number; currency: string; probability: number;
  status: 'OPEN' | 'WON' | 'LOST' | 'ABANDONED';
  expectedCloseDate?: string | null; closedAt?: string | null; lostReason?: string | null;
  assignedToId?: string | null; createdAt: string; updatedAt: string;
  stage: { id: string; name: string; color: string };
  pipeline: { id: string; name: string };
  assignedTo?: { id: string; firstName: string; lastName?: string | null } | null;
  contacts: Array<{ contact: { id: string; firstName: string; lastName?: string | null } }>;
}

export interface KanbanDeals {
  stages: Array<{ id: string; name: string; color: string; sortOrder: number; probability: number; deals: Deal[]; totalValue: number; totalCount: number }>;
}

export interface ForecastData {
  pipeline: string; currency: string; totalPipelineValue: number; totalWeightedValue: number;
  stages: Array<{ name: string; probability: number; totalValue: number; weightedValue: number; dealCount: number }>;
}

export function useDealPipelines() {
  return useQuery<DealPipeline[]>({ queryKey: ['deal-pipelines'], queryFn: async () => { const r = await apiClient.get<DealPipeline[]>('/deal-pipelines'); return r.data; }, staleTime: 120_000 });
}

export function usePipelineStages(pipelineId?: string) {
  return useQuery<DealStage[]>({
    queryKey: ['deal-pipelines', pipelineId, 'stages'],
    queryFn: async () => { const r = await apiClient.get<DealStage[]>(`/deal-pipelines/${pipelineId}/stages`); return r.data; },
    enabled: !!pipelineId,
    staleTime: 120_000,
  });
}

export function useDealsKanban(pipelineId?: string) {
  return useQuery<KanbanDeals>({
    queryKey: ['deals', 'kanban', pipelineId],
    queryFn: async () => { const r = await apiClient.get<KanbanDeals>('/deals/kanban', { params: pipelineId ? { pipelineId } : {} }); return r.data; },
    staleTime: 30_000,
  });
}

export function useDealForecast(pipelineId?: string) {
  return useQuery<ForecastData[]>({
    queryKey: ['deals', 'forecast', pipelineId],
    queryFn: async () => { const r = await apiClient.get<{ pipelines: ForecastData[] }>('/deals/forecast', { params: pipelineId ? { pipelineId } : {} }); return r.data.pipelines; },
    staleTime: 60_000,
  });
}

export function useCreateDeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => apiClient.post('/deals', data),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['deals'] }); toast.success('Deal created'); },
    onError: () => toast.error('Failed to create deal'),
  });
}

export function useUpdateDeal(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => apiClient.patch(`/deals/${id}`, data),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['deals'] }); toast.success('Deal updated'); },
    onError: () => toast.error('Failed to update deal'),
  });
}

export function useMarkDealWon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, closedAt }: { id: string; closedAt?: string }) => apiClient.post(`/deals/${id}/won`, { closedAt }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['deals'] }); toast.success('🎉 Deal marked as won!'); },
    onError: () => toast.error('Failed to update deal'),
  });
}

export function useMarkDealLost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, lostReason }: { id: string; lostReason?: string }) => apiClient.post(`/deals/${id}/lost`, { lostReason }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['deals'] }); toast.success('Deal marked as lost'); },
    onError: () => toast.error('Failed to update deal'),
  });
}

export function useMoveDealStage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, stageId }: { id: string; stageId: string }) => apiClient.patch(`/deals/${id}`, { stageId }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['deals'] }); },
    onError: () => toast.error('Failed to move deal'),
  });
}
