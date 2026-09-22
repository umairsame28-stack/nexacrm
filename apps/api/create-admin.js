// One-time script to create super admin with specific credentials
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const email = 'umairsame28@gmail.com';
  const password = 'umairqasim2';
  
  console.log(`\n🔍 Checking if user exists: ${email}`);
  
  let user = await prisma.user.findUnique({
    where: { email },
  });
  
  if (user) {
    console.log(`\n✅ User found! Promoting to SUPER_ADMIN...`);
    
    // Update existing user to super admin
    await prisma.user.update({
      where: { email },
      data: { 
        systemRole: 'SUPER_ADMIN',
        status: 'ACTIVE',
      },
    });
    
    console.log(`\n✅ Successfully promoted ${email} to SUPER_ADMIN`);
    console.log(`   User ID: ${user.id}`);
    console.log(`   Name: ${user.firstName} ${user.lastName}`);
  } else {
    console.log(`\n❌ User not found. Creating new SUPER_ADMIN account...`);
    
    const passwordHash = await bcrypt.hash(password, 10);
    
    user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName: 'Umair',
        lastName: 'Qasim',
        systemRole: 'SUPER_ADMIN',
        status: 'ACTIVE',
        emailVerified: true,
      },
    });
    
    console.log(`\n✅ Successfully created SUPER_ADMIN account`);
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`   User ID: ${user.id}`);
  }
  
  // Log the action
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      workspaceId: null,
      action: 'UPDATE',
      entityType: 'User',
      entityId: user.id,
      changes: {
        systemRole: { to: 'SUPER_ADMIN' },
        action: 'Created/promoted to super admin',
      },
    },
  });
  
  console.log(`\n📝 Action logged in audit log`);
  console.log(`\n✨ Done! You can now login with:`);
  console.log(`   Email: ${email}`);
  console.log(`   Password: ${password}\n`);
}

main()
  .catch((error) => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
