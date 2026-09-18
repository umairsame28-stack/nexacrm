import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import toast from 'react-hot-toast';

export interface Conversation {
  id: string; status: string; isPinned: boolean; isArchived: boolean;
  unreadCount: number; lastMessageAt: string | null; lastMessageText: string | null;
  contact: { id: string; firstName: string; lastName?: string | null; phone: string; avatarUrl?: string | null };
  assignedTo?: { id: string; firstName: string; lastName?: string | null } | null;
  labels: Array<{ label: { id: string; name: string; color: string } }>;
}

export interface Message {
  id: string; conversationId: string; direction: 'INBOUND' | 'OUTBOUND';
  type: string; status: string; body?: string | null;
  mediaUrl?: string | null; mediaMimeType?: string | null; mediaCaption?: string | null; mediaFileName?: string | null;
  whatsappMsgId?: string | null; isInternal: boolean;
  sender?: { id: string; firstName: string; lastName?: string | null; avatarUrl?: string | null } | null;
  replyTo?: { id: string; body?: string | null; type: string; direction: string } | null;
  sentAt?: string | null; deliveredAt?: string | null; readAt?: string | null;
  createdAt: string;
}

export interface InternalNote { id: string; conversationId: string; authorId: string; content: string; createdAt: string }

export function useConversations(params: Record<string, unknown> = {}) {
  return useQuery<{ data: Conversation[]; pagination: { hasNextPage: boolean; nextCursor: string | null; total: number } }>({
    queryKey: ['conversations', params],
    queryFn: async () => { const r = await apiClient.get('/conversations', { params }); return r.data; },
    refetchInterval: 30_000,
    staleTime: 15_000,
  });
}

export function useGetOrCreateConversation() {
  const qc = useQueryClient();
  return useMutation<Conversation, unknown, string>({
    mutationFn: async (contactId: string) => {
      const r = await apiClient.post<Conversation>(`/conversations/by-contact/${contactId}`);
      return r.data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to create conversation';
      toast.error(message);
    },
  });
}

export function useMessages(conversationId: string, enabled = true) {
  return useInfiniteQuery<{ data: Message[]; pagination: { hasNextPage: boolean; nextCursor: string | null } }>({
    queryKey: ['messages', conversationId],
    queryFn: async ({ pageParam }) => {
      const r = await apiClient.get(`/conversations/${conversationId}/messages`, { params: { limit: 50, cursor: pageParam } });
      return r.data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.pagination.hasNextPage ? last.pagination.nextCursor ?? undefined : undefined,
    enabled: enabled && !!conversationId,
    staleTime: 10_000,
  });
}

export function useInternalNotes(conversationId: string) {
  return useQuery<InternalNote[]>({
    queryKey: ['internal-notes', conversationId],
    queryFn: async () => { const r = await apiClient.get(`/conversations/${conversationId}/internal-notes`); return r.data; },
    enabled: !!conversationId,
  });
}

export function useSendMessage(conversationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => apiClient.post(`/conversations/${conversationId}/messages`, data),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['messages', conversationId] }),
    onError: () => toast.error('Failed to send message'),
  });
}

export function useAddInternalNote(conversationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => apiClient.post(`/conversations/${conversationId}/internal-notes`, { content }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['internal-notes', conversationId] }),
    onError: () => toast.error('Failed to add note'),
  });
}

export function useUpdateConversation(conversationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => apiClient.patch(`/conversations/${conversationId}`, data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useMarkConversationRead(conversationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.post(`/conversations/${conversationId}/read`),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['conversations'] }),
  });
}

export function useAISuggestReply(conversationId: string) {
  return useMutation({
    mutationFn: () => apiClient.post<{ suggestions: string[] }>('/ai/suggest-reply', { conversationId }),
    onError: () => toast.error('AI suggestions unavailable'),
  });
}

export function useQuickReplies() {
  return useQuery<Array<{ id: string; title: string; content: string; shortcut?: string | null }>>({
    queryKey: ['quick-replies'],
    queryFn: async () => { const r = await apiClient.get('/quick-replies'); return r.data; },
    staleTime: 120_000,
  });
}
