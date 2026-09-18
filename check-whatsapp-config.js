/**
 * Diagnostic Script: Check WhatsApp Configuration
 * 
 * This script checks if WhatsApp credentials are properly saved in the database.
 * Run with: node check-whatsapp-config.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Checking WhatsApp configuration...\n');

  try {
    // Get all workspace settings
    const allSettings = await prisma.workspaceSettings.findMany({
      select: {
        id: true,
        workspaceId: true,
        wabPhoneNumberId: true,
        wabAccessToken: true,
        wabWebhookSecret: true,
        wabVerifyToken: true,
        updatedAt: true,
      },
    });

    if (allSettings.length === 0) {
      console.log('❌ No workspace settings found in database');
      return;
    }

    console.log(`📊 Found ${allSettings.length} workspace(s):\n`);

    for (const settings of allSettings) {
      console.log(`Workspace: ${settings.workspaceId}`);
      console.log(`  Settings ID: ${settings.id}`);
      console.log(`  Phone Number ID: ${settings.wabPhoneNumberId || '❌ NOT SET'}`);
      console.log(`  Access Token: ${settings.wabAccessToken ? '✅ SET (encrypted)' : '❌ NOT SET'}`);
      console.log(`  Webhook Secret: ${settings.wabWebhookSecret ? '✅ SET (encrypted)' : '❌ NOT SET'}`);
      console.log(`  Verify Token: ${settings.wabVerifyToken || '❌ NOT SET'}`);
      console.log(`  Last Updated: ${settings.updatedAt}`);
      console.log('');
    }

    // Check for conversations
    const conversationCount = await prisma.conversation.count();
    console.log(`💬 Total conversations in database: ${conversationCount}`);

    // Check for messages
    const messageCount = await prisma.message.count();
    console.log(`📨 Total messages in database: ${messageCount}`);

    // Check for inbound messages specifically
    const inboundCount = await prisma.message.count({
      where: { direction: 'INBOUND' },
    });
    console.log(`📥 Inbound messages: ${inboundCount}`);

    // Check for WhatsApp messages
    const whatsappMsgCount = await prisma.message.count({
      where: { whatsappMsgId: { not: null } },
    });
    console.log(`📱 Messages with WhatsApp ID: ${whatsappMsgCount}\n`);

    // Show recent conversations if any
    if (conversationCount > 0) {
      console.log('📋 Recent conversations:');
      const recentConvos = await prisma.conversation.findMany({
        take: 5,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          status: true,
          lastMessageAt: true,
          lastMessageText: true,
          unreadCount: true,
          contact: {
            select: {
              phone: true,
              firstName: true,
            },
          },
        },
      });

      recentConvos.forEach((conv, idx) => {
        console.log(`  ${idx + 1}. ${conv.contact.firstName} (${conv.contact.phone})`);
        console.log(`     Status: ${conv.status}, Unread: ${conv.unreadCount}`);
        console.log(`     Last: ${conv.lastMessageText?.substring(0, 50) || 'N/A'}`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
