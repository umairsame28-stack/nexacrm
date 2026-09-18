import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { MetaWhatsAppAdapter } from '../adapters/meta-whatsapp.adapter';
import { CreateTemplateDto } from '../dto/whatsapp.dto';
import { CryptoService } from '../../../common/utils/crypto.service';

@Injectable()
export class TemplatesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly metaAdapter: MetaWhatsAppAdapter,
    private readonly crypto: CryptoService,
  ) {}

  async findAll(workspaceId: string) {
    return this.prisma.messageTemplate.findMany({
      where: { workspaceId },
      orderBy: { name: 'asc' },
    });
  }

  async findById(workspaceId: string, id: string) {
    const tpl = await this.prisma.messageTemplate.findFirst({ where: { id, workspaceId } });
    if (!tpl) throw new NotFoundException('Template not found');
    return tpl;
  }

  async create(workspaceId: string, dto: CreateTemplateDto) {
    return this.prisma.messageTemplate.create({
      data: {
        workspaceId,
        name: dto.name,
        language: dto.language ?? 'en',
        category: dto.category,
        headerText: dto.headerText,
        bodyText: dto.bodyText,
        footerText: dto.footerText,
        buttons: dto.buttons as import('@prisma/client').Prisma.InputJsonValue ?? undefined,
        status: 'PENDING',
      },
    });
  }

  async update(workspaceId: string, id: string, dto: Partial<CreateTemplateDto>) {
    const tpl = await this.prisma.messageTemplate.findFirst({ where: { id, workspaceId } });
    if (!tpl) throw new NotFoundException('Template not found');

    return this.prisma.messageTemplate.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.language !== undefined && { language: dto.language }),
        ...(dto.category !== undefined && { category: dto.category }),
        ...(dto.headerText !== undefined && { headerText: dto.headerText }),
        ...(dto.bodyText !== undefined && { bodyText: dto.bodyText }),
        ...(dto.footerText !== undefined && { footerText: dto.footerText }),
        ...(dto.buttons !== undefined && { buttons: dto.buttons as import('@prisma/client').Prisma.InputJsonValue }),
      },
    });
  }

  async remove(workspaceId: string, id: string) {
    const tpl = await this.prisma.messageTemplate.findFirst({ where: { id, workspaceId } });
    if (!tpl) throw new NotFoundException('Template not found');
    await this.prisma.messageTemplate.delete({ where: { id } });
  }

  async syncFromMeta(workspaceId: string): Promise<{ synced: number; new: number; updated: number }> {
    const settings = await this.prisma.workspaceSettings.findUnique({ where: { workspaceId } });
    if (!settings?.wabAccessToken) {
      return { synced: 0, new: 0, updated: 0 };
    }

    const accessToken = this.crypto.decrypt(settings.wabAccessToken);
    // Business account ID derived from the access token — use phone number ID as proxy
    const businessAccountId = settings.wabPhoneNumberId ?? '';

    const metaTemplates = await this.metaAdapter.getTemplates(businessAccountId, accessToken) as Array<{
      id: string;
      name: string;
      language: string;
      category: string;
      status: string;
      components: Array<{ type: string; text?: string }>;
    }>;

    let newCount = 0;
    let updatedCount = 0;

    for (const tpl of metaTemplates) {
      const bodyComponent = tpl.components.find((c) => c.type === 'BODY');
      const existing = await this.prisma.messageTemplate.findUnique({
        where: { workspaceId_name_language: { workspaceId, name: tpl.name, language: tpl.language } },
      });

      if (existing) {
        await this.prisma.messageTemplate.update({
          where: { id: existing.id },
          data: {
            status: tpl.status,
            whatsappTplId: tpl.id,
            bodyText: bodyComponent?.text ?? existing.bodyText,
          },
        });
        updatedCount++;
      } else {
        await this.prisma.messageTemplate.create({
          data: {
            workspaceId,
            name: tpl.name,
            language: tpl.language,
            category: tpl.category,
            status: tpl.status,
            whatsappTplId: tpl.id,
            bodyText: bodyComponent?.text ?? '',
          },
        });
        newCount++;
      }
    }

    return { synced: metaTemplates.length, new: newCount, updated: updatedCount };
  }
}
