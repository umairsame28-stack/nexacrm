import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { format, subDays } from 'date-fns';
import toast from 'react-hot-toast';

export interface ReportFilter {
  from?: string;
  to?: string;
  agentId?: string;
  pipelineId?: string;
}

export interface SalesReport {
  period: { from: string; to: string };
  totalDeals: number; wonDeals: number; lostDeals: number;
  totalRevenue: number; avgDealValue: number; winRate: number;
  byAgent: Array<{ agentId: string; name: string; won: number; lost: number; revenue: number }>;
  trend: Array<{ date: string; revenue: number; deals: number }>;
}

export interface RevenueReport {
  period: { from: string; to: string };
  totalActual: number; totalForecast: number; momGrowth: number;
  monthly: Array<{ month: string; actual: number; forecast: number; pipeline: number; deals: number }>;
}

export interface AgentPerformanceReport {
  period: { from: string; to: string };
  data: Array<{
    agentId: string; name: string; avatarUrl?: string | null;
    conversationsHandled: number; dealsWon: number; revenueGenerated: number;
    tasksCompleted: number; avgResponseTimeMinutes: number | null;
  }>;
}

export interface PipelineReport {
  pipelines: Array<{
    pipelineId: string; pipelineName: string; currency: string;
    totalPipelineValue: number; totalWeightedValue: number;
    stages: Array<{
      stageId: string; stageName: string; color: string; sortOrder: number; probability: number;
      dealCount: number; totalValue: number; weightedValue: number;
      avgTimeInStageDays: number | null; conversionRateToNext: number | null;
    }>;
  }>;
}

export interface WhatsAppReport {
  period: { from: string; to: string };
  messagesSent: number; messagesReceived: number;
  avgFirstResponseMinutes: number | null; p95FirstResponseMinutes: number | null;
  templatesUsed: Array<{ templateName: string | null; sent: number; delivered: number; read: number }>;
  broadcastsDelivered: number; broadcastReach: number;
  dailyVolume: Array<{ date: string; sent: number; received: number }>;
}

function defaultFilter(): { from: string; to: string } {
  return { from: format(subDays(new Date(), 30), 'yyyy-MM-dd'), to: format(new Date(), 'yyyy-MM-dd') };
}

export function useSalesReport(filter?: ReportFilter) {
  const f = { ...defaultFilter(), ...filter };
  return useQuery<SalesReport>({
    queryKey: ['reports', 'sales', f],
    queryFn: async () => { const r = await apiClient.get<SalesReport>('/reports/sales', { params: f }); return r.data; },
    staleTime: 120_000,
  });
}

export function useRevenueReport(filter?: ReportFilter) {
  const f = { ...defaultFilter(), ...filter };
  return useQuery<RevenueReport>({
    queryKey: ['reports', 'revenue', f],
    queryFn: async () => { const r = await apiClient.get<RevenueReport>('/reports/revenue', { params: f }); return r.data; },
    staleTime: 120_000,
  });
}

export function useAgentPerformance(filter?: ReportFilter) {
  const f = { ...defaultFilter(), ...filter };
  return useQuery<AgentPerformanceReport>({
    queryKey: ['reports', 'agents', f],
    queryFn: async () => { const r = await apiClient.get<AgentPerformanceReport>('/reports/agent-performance', { params: f }); return r.data; },
    staleTime: 120_000,
  });
}

export function usePipelineReport(filter?: ReportFilter) {
  return useQuery<PipelineReport>({
    queryKey: ['reports', 'pipeline', filter?.pipelineId],
    queryFn: async () => { const r = await apiClient.get<PipelineReport>('/reports/pipeline', { params: filter }); return r.data; },
    staleTime: 120_000,
  });
}

export function useWhatsAppReport(filter?: ReportFilter) {
  const f = { ...defaultFilter(), ...filter };
  return useQuery<WhatsAppReport>({
    queryKey: ['reports', 'whatsapp', f],
    queryFn: async () => { const r = await apiClient.get<WhatsAppReport>('/reports/whatsapp', { params: f }); return r.data; },
    staleTime: 120_000,
  });
}

export function useExportReport() {
  return useMutation({
    mutationFn: async ({ report, from, to }: { report: string; from: string; to: string }) => {
      const r = await apiClient.post<Blob>('/reports/export', { report, format: 'csv', from, to }, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([r.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `nexacrm_${report}_${from}_${to}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
    },
    onSuccess: () => toast.success('Report exported'),
    onError: () => toast.error('Export failed'),
  });
}
