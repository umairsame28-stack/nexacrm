import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export interface CalendarEvent {
  id: string; title: string; description?: string | null;
  startAt: string; endAt: string; allDay: boolean;
  location?: string | null; color?: string | null;
  createdById: string; contactId?: string | null; leadId?: string | null; dealId?: string | null;
  remindAt?: string | null; createdAt: string;
  createdBy: { id: string; firstName: string; lastName?: string | null };
  attendees: Array<{ id: string; eventId: string; userId: string }>;
}

export function useCalendarEvents(from: Date, to: Date) {
  return useQuery<CalendarEvent[]>({
    queryKey: ['calendar', format(from, 'yyyy-MM-dd'), format(to, 'yyyy-MM-dd')],
    queryFn: async () => {
      const r = await apiClient.get<CalendarEvent[]>('/calendar/events', {
        params: { from: from.toISOString(), to: to.toISOString() },
      });
      return r.data;
    },
    staleTime: 60_000,
  });
}

export function useCreateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => apiClient.post('/calendar/events', data),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['calendar'] }); toast.success('Event created'); },
    onError: () => toast.error('Failed to create event'),
  });
}

export function useUpdateEvent(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => apiClient.patch(`/calendar/events/${id}`, data),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['calendar'] }); toast.success('Event updated'); },
    onError: () => toast.error('Failed to update event'),
  });
}

export function useDeleteEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/calendar/events/${id}`),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['calendar'] }); toast.success('Event deleted'); },
    onError: () => toast.error('Failed to delete event'),
  });
}
