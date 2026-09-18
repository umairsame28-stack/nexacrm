'use client';

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { connectSocket, disconnectSocket, getSocket } from '@/lib/socket-client';
import { useAuthStore } from '@/stores/auth.store';
import { useNotificationStore } from '@/stores/notification.store';
import { useInboxStore } from '@/stores/inbox.store';

export function useSocket() {
  const { accessToken, isAuthenticated } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const { setTyping, incrementUnread } = useInboxStore();
  const queryClient = useQueryClient();
  const initialized = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || !accessToken || initialized.current) return;
    initialized.current = true;

    const socket = connectSocket(accessToken);

    socket.on('message:new', (data: { conversationId: string }) => {
      void queryClient.invalidateQueries({ queryKey: ['messages', data.conversationId] });
      void queryClient.invalidateQueries({ queryKey: ['conversations'] });
      incrementUnread(data.conversationId);
    });

    socket.on('message:status', () => {
      void queryClient.invalidateQueries({ queryKey: ['messages'] });
    });

    socket.on('conversation:updated', () => {
      void queryClient.invalidateQueries({ queryKey: ['conversations'] });
    });

    socket.on('typing:start', (data: { userId: string; conversationId: string }) => {
      setTyping(data.userId, data.conversationId, true);
      // Auto-clear after 3 seconds
      setTimeout(() => setTyping(data.userId, data.conversationId, false), 3000);
    });

    socket.on('typing:stop', (data: { userId: string; conversationId: string }) => {
      setTyping(data.userId, data.conversationId, false);
    });

    socket.on('notification:new', (notification: Parameters<typeof addNotification>[0]) => {
      addNotification(notification);
    });

    socket.on('deal:updated', () => {
      void queryClient.invalidateQueries({ queryKey: ['deals'] });
    });

    socket.on('lead:updated', () => {
      void queryClient.invalidateQueries({ queryKey: ['leads'] });
    });

    return () => {
      initialized.current = false;
      disconnectSocket();
    };
  }, [isAuthenticated, accessToken]);

  return getSocket();
}
