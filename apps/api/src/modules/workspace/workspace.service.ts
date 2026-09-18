import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';

@Injectable()
export class WorkspaceService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(workspaceId: string) {
    const workspace = await this.prisma.workspace.findFirst({
      where: { id: workspaceId, deletedAt: null },
      select: {
        id: true,
        name: true,
        slug: true,
        logoUrl: true,
        primaryColor: true,
        timezone: true,
        currency: true,
        language: true,
        createdAt: true,
      },
    });
    if (!workspace) throw new NotFoundException('Workspace not found');
    return workspace;
  }

  async update(workspaceId: string, dto: UpdateWorkspaceDto) {
    const workspace = await this.prisma.workspace.findFirst({
      where: { id: workspaceId, deletedAt: null },
    });
    if (!workspace) throw new NotFoundException('Workspace not found');

    return this.prisma.workspace.update({
      where: { id: workspaceId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.timezone !== undefined && { timezone: dto.timezone }),
        ...(dto.currency !== undefined && { currency: dto.currency }),
        ...(dto.language !== undefined && { language: dto.language }),
        ...(dto.primaryColor !== undefined && { primaryColor: dto.primaryColor }),
      },
      select: {
        id: true, name: true, slug: true, logoUrl: true,
        primaryColor: true, timezone: true, currency: true, language: true,
      },
    });
  }

  async updateLogo(workspaceId: string, logoUrl: string) {
    return this.prisma.workspace.update({
      where: { id: workspaceId },
      data: { logoUrl },
      select: { id: true, logoUrl: true },
    });
  }

  async getStats(workspaceId: string) {
    const [contacts, conversations, leads, deals] = await Promise.all([
      this.prisma.contact.count({ where: { workspaceId, deletedAt: null } }),
      this.prisma.conversation.count({ where: { workspaceId, status: 'OPEN' } }),
      this.prisma.lead.count({ where: { workspaceId, deletedAt: null } }),
      this.prisma.deal.count({ where: { workspaceId, status: 'OPEN', deletedAt: null } }),
    ]);
    return { contacts, activeConversations: conversations, openLeads: leads, openDeals: deals };
  }
}
