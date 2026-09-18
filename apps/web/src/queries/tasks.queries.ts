import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import toast from 'react-hot-toast';

export interface Task {
  id: string; title: string; description?: string | null;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED';
  dueAt?: string | null; remindAt?: string | null; completedAt?: string | null;
  assignedToId?: string | null; createdById: string;
  contactId?: string | null; leadId?: string | null; dealId?: string | null;
  createdAt: string; updatedAt: string;
  assignedTo?: { id: string; firstName: string; lastName?: string | null; avatarUrl?: string | null } | null;
  createdBy: { id: string; firstName: string; lastName?: string | null };
  contact?: { id: string; firstName: string; lastName?: string | null; phone: string } | null;
  deal?: { id: string; title: string; value: number } | null;
}

export interface TasksResponse { data: Task[]; pagination: { hasNextPage: boolean; nextCursor: string | null; total: number } }
export interface KanbanTasks { columns: Array<{ status: 'TODO' | 'IN_PROGRESS' | 'DONE'; tasks: Task[]; count: number }> }

export function useTasks(params: Record<string, unknown> = {}) {
  return useQuery<TasksResponse>({
    queryKey: ['tasks', params],
    queryFn: async () => { const r = await apiClient.get<TasksResponse>('/tasks', { params }); return r.data; },
    staleTime: 30_000,
  });
}

export function useTasksKanban(assignedTo?: string) {
  return useQuery<KanbanTasks>({
    queryKey: ['tasks', 'kanban', assignedTo],
    queryFn: async () => { const r = await apiClient.get<KanbanTasks>('/tasks/kanban', { params: assignedTo ? { assignedTo } : {} }); return r.data; },
    staleTime: 30_000,
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => {
      // Clean up empty string values to null
      const cleanData = {
        ...data,
        assignedToId: data.assignedToId && typeof data.assignedToId === 'string' && data.assignedToId.trim() ? data.assignedToId : undefined,
        contactId: data.contactId && typeof data.contactId === 'string' && data.contactId.trim() ? data.contactId : undefined,
        dealId: data.dealId && typeof data.dealId === 'string' && data.dealId.trim() ? data.dealId : undefined,
      };
      return apiClient.post('/tasks', cleanData);
    },
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['tasks'] }); toast.success('Task created'); },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to create task';
      toast.error(message);
    },
  });
}

export function useUpdateTask(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => apiClient.patch(`/tasks/${id}`, data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Task updated');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to update task';
      toast.error(message);
    },
  });
}

export function useCompleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.post(`/tasks/${id}/complete`),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['tasks'] }); toast.success('Task completed ✓'); },
    onError: () => toast.error('Failed to complete task'),
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/tasks/${id}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Task deleted');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to delete task';
      toast.error(message);
    },
  });
}
