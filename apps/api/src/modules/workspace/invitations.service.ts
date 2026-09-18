import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InviteMemberDto } from './dto/invite-member.dto';
import { addHours } from 'date-fns';
import { randomBytes } from 'crypto';

@Injectable()
export class InvitationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(workspaceId: string, dto: InviteMemberDto) {
    const workspace = await this.prisma.workspace.findUnique({ where: { id: workspaceId } });
    if (!workspace) throw new NotFoundException('Workspace not found');

    // Check if already a member
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (existingUser) {
      const existingMember = await this.prisma.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId, userId: existingUser.id } },
      });
      if (existingMember) {
        throw new ConflictException('User is already a member of this workspace');
      }
    }

    // Check for pending invitation
    const existingInvite = await this.prisma.workspaceInvitation.findFirst({
      where: {
        workspaceId,
        email: dto.email.toLowerCase(),
        acceptedAt: null,
        expiresAt: { gt: new Date() },
      },
    });
    if (existingInvite) {
      throw new ConflictException('An active invitation already exists for this email');
    }

    const token = randomBytes(32).toString('hex');
    const expiresAt = addHours(new Date(), 48);

    const invitation = await this.prisma.workspaceInvitation.create({
      data: {
        workspaceId,
        email: dto.email.toLowerCase(),
        role: dto.role,
        token,
        expiresAt,
      },
    });

    this.eventEmitter.emit('workspace.invitation_created', {
      workspaceId,
      workspaceName: workspace.name,
      email: dto.email,
      role: dto.role,
      token,
      expiresAt,
    });

    return invitation;
  }

  async accept(token: string) {
    const invitation = await this.prisma.workspaceInvitation.findUnique({
      where: { token },
    });

    if (!invitation) throw new NotFoundException('Invitation not found');
    if (invitation.acceptedAt) throw new ConflictException('Invitation already accepted');
    if (invitation.expiresAt < new Date()) throw new ConflictException('Invitation has expired');

    const user = await this.prisma.user.findUnique({
      where: { email: invitation.email },
    });

    if (!user) {
      // User needs to register first — return invitation details
      return { requiresRegistration: true, email: invitation.email, role: invitation.role };
    }

    await this.prisma.$transaction([
      this.prisma.workspaceMember.create({
        data: {
          workspaceId: invitation.workspaceId,
          userId: user.id,
          role: invitation.role,
          isActive: true,
        },
      }),
      this.prisma.workspaceInvitation.update({
        where: { id: invitation.id },
        data: { acceptedAt: new Date() },
      }),
    ]);

    return { success: true, workspaceId: invitation.workspaceId };
  }

  async list(workspaceId: string) {
    return this.prisma.workspaceInvitation.findMany({
      where: { workspaceId, acceptedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });
  }
}
