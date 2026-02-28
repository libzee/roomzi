const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');
const { updateAllChatNames } = require('../src/utils/chatNameUpdater.js');

dotenv.config();

const prisma = new PrismaClient();

async function updateChatNames() {
  try {
    console.log('🔄 Starting chat names update...');
    
    const result = await updateAllChatNames();
    
    console.log('🎉 Chat names update completed!');
    console.log('📊 Final Summary:', result);
  } catch (error) {
    console.error('❌ Error updating chat names:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the update if this script is executed directly
if (require.main === module) {
  updateChatNames();
}

module.exports = { updateChatNames }; 