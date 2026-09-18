import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger, UnauthorizedException } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

interface SocketUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

interface AuthenticatedSocket extends Socket {
  user?: SocketUser;
}

@WebSocketGateway({
  cors: {
    origin: '*', // Configured per environment
    credentials: true,
  },
  namespace: '/',
})
export class AppGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(AppGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  afterInit(server: Server): void {
    this.logger.log('WebSocket Gateway initialized');

    // JWT authentication middleware
    server.use((socket: AuthenticatedSocket, next: (err?: Error) => void) => {
      const token =
        (socket.handshake.query['token'] as string) ??
        socket.handshake.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        return next(new UnauthorizedException('Token not provided'));
      }

      try {
        const secret = this.config.get<string>('jwt.accessSecret', 'dev-secret');
        const payload = this.jwtService.verify<SocketUser & { sub: string }>(token, { secret });
        socket.user = {
          id: payload.sub,
          email: payload.email,
          firstName: payload.firstName,
          lastName: payload.lastName,
        };
        next();
      } catch {
        next(new UnauthorizedException('Invalid token'));
      }
    });
  }

  handleConnection(socket: AuthenticatedSocket): void {
    if (!socket.user) {
      socket.disconnect();
      return;
    }
    this.logger.log(`Client connected: ${socket.id} (user: ${socket.user.id})`);
    // Join personal user room
    void socket.join(`user:${socket.user.id}`);
  }

  handleDisconnect(socket: AuthenticatedSocket): void {
    this.logger.log(`Client disconnected: ${socket.id}`);
  }

  @SubscribeMessage('typing:start')
  handleTypingStart(
    @ConnectedSocket() socket: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string },
  ): void {
    if (!socket.user) return;
    socket.to(`conversation:${data.conversationId}`).emit('typing:start', {
      conversationId: data.conversationId,
      userId: socket.user.id,
    });
  }

  @SubscribeMessage('typing:stop')
  handleTypingStop(
    @ConnectedSocket() socket: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string },
  ): void {
    if (!socket.user) return;
    socket.to(`conversation:${data.conversationId}`).emit('typing:stop', {
      conversationId: data.conversationId,
      userId: socket.user.id,
    });
  }

  @SubscribeMessage('conversation:join')
  handleConversationJoin(
    @ConnectedSocket() socket: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string },
  ): void {
    void socket.join(`conversation:${data.conversationId}`);
  }

  @SubscribeMessage('conversation:leave')
  handleConversationLeave(
    @ConnectedSocket() socket: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string },
  ): void {
    void socket.leave(`conversation:${data.conversationId}`);
  }

  // ─── Emit helpers (called from services) ────────────────────────────────────

  emitToWorkspace(workspaceId: string, event: string, data: unknown): void {
    this.server.to(`workspace:${workspaceId}`).emit(event, data);
  }

  emitToUser(userId: string, event: string, data: unknown): void {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  emitToConversation(conversationId: string, event: string, data: unknown): void {
    this.server.to(`conversation:${conversationId}`).emit(event, data);
  }

  joinWorkspaceRoom(socket: Socket, workspaceId: string): void {
    void socket.join(`workspace:${workspaceId}`);
  }
}
