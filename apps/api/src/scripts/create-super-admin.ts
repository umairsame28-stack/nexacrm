#!/usr/bin/env ts-node

/**
 * Script to create or promote a user to SUPER_ADMIN role
 * 
 * Usage:
 *   npm run create-super-admin -- email@example.com
 *   
 * Or with ts-node:
 *   npx ts-node src/scripts/create-super-admin.ts email@example.com
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createSuperAdmin(email: string) {
  try {
    console.log(`\n🔍 Searching for user with email: ${email}`);

    let user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        systemRole: true,
        status: true,
      },
    });

    if (user) {
      // User exists, promote to super admin
      if (user.systemRole === 'SUPER_ADMIN') {
        console.log(`\n✅ User ${email} is already a SUPER_ADMIN`);
        return;
      }

      await prisma.user.update({
        where: { email },
        data: { systemRole: 'SUPER_ADMIN' },
      });

      console.log(`\n✅ Successfully promoted ${user.firstName} ${user.lastName} to SUPER_ADMIN`);
      console.log(`   Email: ${user.email}`);
      console.log(`   User ID: ${user.id}`);
    } else {
      // User doesn't exist, create new super admin
      console.log(`\n❌ User not found. Creating new super admin account...`);
      
      const defaultPassword = 'Admin123!'; // Change this on first login!
      const passwordHash = await bcrypt.hash(defaultPassword, 10);

      user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          firstName: 'Super',
          lastName: 'Admin',
          systemRole: 'SUPER_ADMIN',
          status: 'ACTIVE',
          emailVerified: true,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          systemRole: true,
          status: true,
        },
      });

      console.log(`\n✅ Successfully created SUPER_ADMIN account`);
      console.log(`   Email: ${user.email}`);
      console.log(`   User ID: ${user.id}`);
      console.log(`   Temporary Password: ${defaultPassword}`);
      console.log(`\n⚠️  IMPORTANT: Change this password immediately after first login!`);
    }

    // Log the action in audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        workspaceId: null, // System-wide action
        action: 'UPDATE',
        entityType: 'User',
        entityId: user.id,
        changes: {
          systemRole: { to: 'SUPER_ADMIN' },
          action: 'Promoted to super admin via script',
        },
      },
    });

    console.log(`\n📝 Action logged in audit log\n`);

  } catch (error) {
    console.error('\n❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Get email from command line arguments
const email = process.argv[2];

if (!email) {
  console.error('\n❌ Error: Email address required');
  console.log('\nUsage:');
  console.log('  npm run create-super-admin -- email@example.com');
  console.log('  OR');
  console.log('  npx ts-node src/scripts/create-super-admin.ts email@example.com\n');
  process.exit(1);
}

// Validate email format
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
  console.error('\n❌ Error: Invalid email format\n');
  process.exit(1);
}

createSuperAdmin(email)
  .then(() => {
    console.log('✨ Done!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Failed to create super admin:', error.message);
    process.exit(1);
  });
