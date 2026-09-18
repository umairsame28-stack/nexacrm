import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateQuickReplyDto, UpdateQuickReplyDto } from '../dto/whatsapp.dto';

@Injectable()
export class QuickRepliesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(workspaceId: string) {
    return this.prisma.quickReply.findMany({
      where: { workspaceId },
      orderBy: { title: 'asc' },
    });
  }

  async create(workspaceId: string, dto: CreateQuickReplyDto) {
    return this.prisma.quickReply.create({
      data: {
        workspaceId,
        title: dto.title,
        content: dto.content,
        shortcut: dto.shortcut,
      },
    });
  }

  async update(workspaceId: string, id: string, dto: Partial<UpdateQuickReplyDto>) {
    const qr = await this.prisma.quickReply.findFirst({ where: { id, workspaceId } });
    if (!qr) throw new NotFoundException('Quick reply not found');

    return this.prisma.quickReply.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.content !== undefined && { content: dto.content }),
        ...(dto.shortcut !== undefined && { shortcut: dto.shortcut }),
      },
    });
  }

  async remove(workspaceId: string, id: string) {
    const qr = await this.prisma.quickReply.findFirst({ where: { id, workspaceId } });
    if (!qr) throw new NotFoundException('Quick reply not found');
    await this.prisma.quickReply.delete({ where: { id } });
  }
}
