// Script to create super admin on Railway PostgreSQL
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

// Read DATABASE_URL from environment or use the one from .env
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl || databaseUrl.includes('YOUR_PASSWORD')) {
  console.error('\n❌ Error: DATABASE_URL not properly configured!');
  console.error('\nPlease provide your Railway DATABASE_URL in one of these ways:');
  console.error('1. Set it as environment variable:');
  console.error('   $env:DATABASE_URL="postgresql://user:pass@host:port/db" (PowerShell)');
  console.error('   node apps/api/create-railway-admin.js');
  console.error('\n2. Or update apps/api/.env with your Railway DATABASE_URL');
  console.error('\nYou can get your Railway DATABASE_URL from:');
  console.error('Railway Dashboard → Your Project → PostgreSQL → Connect → DATABASE_URL\n');
  process.exit(1);
}

console.log('\n🚂 Connecting to Railway PostgreSQL database...');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
});

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
    
    console.log(`\n✅ Successfully created SUPER_ADMIN account on Railway!`);
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`   User ID: ${user.id}`);
  }
  
  // Log the action
  try {
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
  } catch (error) {
    console.log(`\n⚠️  Warning: Could not create audit log (table might not exist yet)`);
  }
  
  console.log(`\n✨ Done! You can now login with:`);
  console.log(`   Email: ${email}`);
  console.log(`   Password: ${password}`);
  console.log(`\n🌐 Access the admin panel at: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin\n`);
}

main()
  .catch((error) => {
    console.error('\n❌ Error:', error.message);
    if (error.message.includes('does not exist')) {
      console.error('\n💡 Hint: Run database migrations first:');
      console.error('   cd apps/api');
      console.error('   npx prisma migrate deploy\n');
    }
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
