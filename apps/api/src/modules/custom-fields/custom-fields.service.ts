import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCustomFieldDto, ReorderCustomFieldsDto } from './dto/create-custom-field.dto';

@Injectable()
export class CustomFieldsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(workspaceId: string, dto: CreateCustomFieldDto) {
    const existing = await this.prisma.customFieldDefinition.findUnique({
      where: {
        workspaceId_entityType_key: {
          workspaceId,
          entityType: dto.entityType,
          key: dto.key,
        },
      },
    });
    if (existing) throw new ConflictException('A custom field with this key already exists');

    const count = await this.prisma.customFieldDefinition.count({
      where: { workspaceId, entityType: dto.entityType },
    });

    return this.prisma.customFieldDefinition.create({
      data: {
        workspaceId,
        entityType: dto.entityType,
        name: dto.name,
        key: dto.key,
        type: dto.type,
        options: dto.options ? dto.options : undefined,
        isRequired: dto.isRequired ?? false,
        isVisible: dto.isVisible ?? true,
        sortOrder: dto.sortOrder ?? count,
      },
    });
  }

  async findAll(workspaceId: string, entityType?: string) {
    return this.prisma.customFieldDefinition.findMany({
      where: {
        workspaceId,
        ...(entityType && { entityType }),
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async update(workspaceId: string, id: string, dto: Partial<CreateCustomFieldDto>) {
    const field = await this.prisma.customFieldDefinition.findFirst({
      where: { id, workspaceId },
    });
    if (!field) throw new NotFoundException('Custom field not found');

    return this.prisma.customFieldDefinition.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.options !== undefined && { options: dto.options }),
        ...(dto.isRequired !== undefined && { isRequired: dto.isRequired }),
        ...(dto.isVisible !== undefined && { isVisible: dto.isVisible }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
      },
    });
  }

  async remove(workspaceId: string, id: string) {
    const field = await this.prisma.customFieldDefinition.findFirst({
      where: { id, workspaceId },
    });
    if (!field) throw new NotFoundException('Custom field not found');

    // Remove all values for this field
    await this.prisma.contactCustomFieldValue.deleteMany({ where: { fieldId: id } });
    await this.prisma.customFieldDefinition.delete({ where: { id } });
  }

  async reorder(workspaceId: string, dto: ReorderCustomFieldsDto) {
    const updates = dto.fieldIds.map((fieldId, index) =>
      this.prisma.customFieldDefinition.updateMany({
        where: { id: fieldId, workspaceId },
        data: { sortOrder: index },
      }),
    );
    await this.prisma.$transaction(updates);
    return { success: true };
  }
}
