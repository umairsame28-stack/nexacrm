import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import toast from 'react-hot-toast';

export interface Contact {
  id: string;
  firstName: string;
  lastName?: string | null;
  phone: string;
  email?: string | null;
  company?: string | null;
  jobTitle?: string | null;
  avatarUrl?: string | null;
  status: string;
  source?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  tags: Array<{ tag: { id: string; name: string; color: string } }>;
}

export interface ContactsResponse {
  data: Contact[];
  pagination: { hasNextPage: boolean; nextCursor: string | null; total: number };
}

export interface ContactNote {
  id: string;
  content: string;
  isPrivate: boolean;
  authorId: string;
  createdAt: string;
}

export interface ContactTimelineEvent {
  id: string;
  eventType: string;
  title: string;
  description?: string | null;
  actorId?: string | null;
  createdAt: string;
}

export function useContacts(params: Record<string, unknown> = {}) {
  return useQuery<ContactsResponse>({
    queryKey: ['contacts', params],
    queryFn: async () => {
      const res = await apiClient.get<ContactsResponse>('/contacts', { params });
      return res.data;
    },
    staleTime: 30_000,
  });
}

export function useContact(id: string) {
  return useQuery<Contact & { timeline: ContactTimelineEvent[]; contactNotes: ContactNote[] }>({
    queryKey: ['contacts', id],
    queryFn: async () => {
      const res = await apiClient.get(`/contacts/${id}`);
      return res.data;
    },
    enabled: !!id,
  });
}

export function useContactTimeline(id: string) {
  return useQuery<{ data: ContactTimelineEvent[] }>({
    queryKey: ['contacts', id, 'timeline'],
    queryFn: async () => {
      const res = await apiClient.get(`/contacts/${id}/timeline`);
      return res.data;
    },
    enabled: !!id,
  });
}

export function useCreateContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => apiClient.post('/contacts', data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['contacts'] });
      toast.success('Contact created');
    },
    onError: (err: { response?: { data?: { message?: string } } }) =>
      toast.error(err?.response?.data?.message ?? 'Failed to create contact'),
  });
}

export function useUpdateContact(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => apiClient.patch(`/contacts/${id}`, data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['contacts', id] });
      void qc.invalidateQueries({ queryKey: ['contacts'] });
      toast.success('Contact updated');
    },
    onError: () => toast.error('Failed to update contact'),
  });
}

export function useDeleteContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/contacts/${id}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['contacts'] });
      toast.success('Contact deleted');
    },
    onError: () => toast.error('Failed to delete contact'),
  });
}

export function useAddContactNote(contactId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (content: string) =>
      apiClient.post(`/contacts/${contactId}/notes`, { content, isPrivate: false }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['contacts', contactId] });
      toast.success('Note added');
    },
  });
}

export function useMergeContacts() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ primaryId, duplicateId }: { primaryId: string; duplicateId: string }) =>
      apiClient.post('/contacts/merge', { primaryId, duplicateId }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['contacts'] });
      toast.success('Contacts merged successfully');
    },
    onError: () => toast.error('Failed to merge contacts'),
  });
}
