/**
 * Development seed script
 * Usage: npx ts-node infra/scripts/seed-dev.ts
 */
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding development data...');

  // Create demo user
  const passwordHash = await bcrypt.hash('Demo1234!', 12);
  const user = await prisma.user.upsert({
    where: { email: 'admin@nexacrm.io' },
    update: {},
    create: {
      email: 'admin@nexacrm.io',
      passwordHash,
      firstName: 'Admin',
      lastName: 'User',
      status: 'ACTIVE',
      emailVerified: true,
    },
  });

  // Create demo workspace
  const workspace = await prisma.workspace.upsert({
    where: { slug: 'nexacrm-demo' },
    update: {},
    create: {
      name: 'NexaCRM Demo',
      slug: 'nexacrm-demo',
      timezone: 'America/New_York',
      currency: 'USD',
      members: { create: { userId: user.id, role: 'OWNER' } },
      settings: { create: {} },
    },
  });

  // Create lead pipeline
  const pipeline = await prisma.pipeline.create({
    data: {
      workspaceId: workspace.id,
      name: 'Inbound Sales',
      isDefault: true,
      stages: {
        create: [
          { name: 'New', color: '#6366f1', sortOrder: 0, probability: 10 },
          { name: 'Contacted', color: '#8b5cf6', sortOrder: 1, probability: 30 },
          { name: 'Qualified', color: '#f59e0b', sortOrder: 2, probability: 60 },
          { name: 'Proposal', color: '#10b981', sortOrder: 3, probability: 80 },
        ],
      },
    },
    include: { stages: true },
  });

  // Create deal pipeline
  const dealPipeline = await prisma.dealPipeline.create({
    data: {
      workspaceId: workspace.id,
      name: 'Enterprise',
      isDefault: true,
      currency: 'USD',
      stages: {
        create: [
          { name: 'Discovery', color: '#6366f1', sortOrder: 0, probability: 20 },
          { name: 'Proposal', color: '#f59e0b', sortOrder: 1, probability: 50 },
          { name: 'Negotiation', color: '#8b5cf6', sortOrder: 2, probability: 75 },
          { name: 'Contract', color: '#10b981', sortOrder: 3, probability: 90, isWon: false },
        ],
      },
    },
  });

  // Create sample tags
  await prisma.tag.createMany({
    data: [
      { workspaceId: workspace.id, name: 'VIP', color: '#f59e0b' },
      { workspaceId: workspace.id, name: 'Enterprise', color: '#6366f1' },
      { workspaceId: workspace.id, name: 'Hot Lead', color: '#ef4444' },
      { workspaceId: workspace.id, name: 'Follow-up', color: '#10b981' },
    ],
    skipDuplicates: true,
  });

  console.log(`✅ Seed complete!`);
  console.log(`   Workspace: ${workspace.name} (${workspace.slug})`);
  console.log(`   Login: admin@nexacrm.io / Demo1234!`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
