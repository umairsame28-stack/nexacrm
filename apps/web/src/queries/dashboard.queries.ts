import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface DashboardData {
  kpis: {
    totalContacts: number;
    activeConversations: number;
    openLeads: number;
    closedDealsThisMonth: number;
    revenueThisMonth: number;
    revenuePrevMonth: number;
    revenueChange: number;
    conversionRate: number;
  };
  salesTrend: Array<{ date: string; revenue: number; deals: number }>;
  customerGrowth: Array<{ date: string; newContacts: number; cumulative: number }>;
  teamPerformance: Array<{
    agentId: string;
    name: string;
    conversations: number;
    dealsWon: number;
    avgResponseMins: number;
  }>;
  activityFeed: Array<{ type: string; actor: string; resource: string; resourceId: string | null; at: string }>;
  upcomingTasks: Array<{ id: string; title: string; priority: string; dueAt: string | null; contact?: { firstName: string; lastName?: string | null } | null }>;
  todayEvents: Array<{ id: string; title: string; startAt: string; endAt: string }>;
}

export function useDashboard() {
  return useQuery<DashboardData>({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const res = await apiClient.get<DashboardData>('/dashboard');
      return res.data;
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}

export function useAIInsights() {
  return useQuery<{ insights: string[] }>({
    queryKey: ['ai', 'insights'],
    queryFn: async () => {
      const res = await apiClient.post<{ insights: string[] }>('/ai/insights', { period: 'last_30_days' });
      return res.data;
    },
    staleTime: 5 * 60_000,
    retry: false,
  });
}
