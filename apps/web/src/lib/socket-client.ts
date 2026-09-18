import { io, type Socket } from 'socket.io-client';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? 'http://localhost:3001';

let socket: Socket | null = null;

export function getSocket(): Socket | null {
  return socket;
}

export function connectSocket(accessToken: string): Socket {
  if (socket?.connected) return socket;

  socket = io(WS_URL, {
    query: { token: accessToken },
    withCredentials: true,
    transports: ['websocket', 'polling'],
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
  });

  socket.on('connect', () => {
    console.info('[WS] Connected:', socket?.id);
  });

  socket.on('disconnect', (reason) => {
    console.info('[WS] Disconnected:', reason);
  });

  socket.on('connect_error', (err) => {
    console.warn('[WS] Connection error:', err.message);
  });

  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function joinConversation(conversationId: string): void {
  socket?.emit('conversation:join', { conversationId });
}

export function leaveConversation(conversationId: string): void {
  socket?.emit('conversation:leave', { conversationId });
}

export function emitTypingStart(conversationId: string): void {
  socket?.emit('typing:start', { conversationId });
}

export function emitTypingStop(conversationId: string): void {
  socket?.emit('typing:stop', { conversationId });
}
