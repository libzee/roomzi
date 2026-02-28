import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function checkPropertyIdTypes() {
  try {
    console.log('🔍 Checking property_id data types in chats table...\n');

    // Get all chats with their property_id values
    const chats = await prisma.chats.findMany({
      select: {
        id: true,
        property_id: true,
        created_at: true
      }
    });

    console.log(`📊 Found ${chats.length} chats to analyze\n`);

    let stringCount = 0;
    let numberCount = 0;
    let nullCount = 0;
    let invalidCount = 0;
    const invalidChats = [];

    for (const chat of chats) {
      const propertyId = chat.property_id;
      
      if (propertyId === null || propertyId === undefined) {
        nullCount++;
        invalidChats.push({ id: chat.id, property_id: propertyId, issue: 'NULL value' });
      } else if (typeof propertyId === 'string') {
        stringCount++;
        // Check if it's a valid number string
        if (isNaN(Number(propertyId))) {
          invalidCount++;
          invalidChats.push({ id: chat.id, property_id: propertyId, issue: 'Non-numeric string' });
        }
      } else if (typeof propertyId === 'number' || typeof propertyId === 'bigint') {
        numberCount++;
      } else {
        invalidCount++;
        invalidChats.push({ id: chat.id, property_id: propertyId, issue: 'Invalid type' });
      }
    }

    console.log('📈 Data Type Analysis:');
    console.log(`✅ Numbers/BigInt: ${numberCount}`);
    console.log(`📝 Strings: ${stringCount}`);
    console.log(`❌ Null values: ${nullCount}`);
    console.log(`🚨 Invalid entries: ${invalidCount}\n`);

    if (invalidChats.length > 0) {
      console.log('🚨 Invalid entries found:');
      invalidChats.forEach(chat => {
        console.log(`  - Chat ${chat.id}: ${chat.property_id} (${chat.issue})`);
      });
      console.log('\n⚠️  These entries need to be fixed before migration!\n');
    }

    // Check if property_id values actually exist in listings table
    console.log('🔍 Checking if property_id values exist in listings table...\n');
    
    let existingCount = 0;
    let missingCount = 0;
    const missingProperties = [];

    for (const chat of chats) {
      if (chat.property_id !== null && chat.property_id !== undefined) {
        try {
          const listing = await prisma.listings.findUnique({
            where: { id: BigInt(chat.property_id) }
          });
          
          if (listing) {
            existingCount++;
          } else {
            missingCount++;
            missingProperties.push({ 
              chat_id: chat.id, 
              property_id: chat.property_id,
              issue: 'Property not found in listings table'
            });
          }
        } catch (error) {
          missingCount++;
          missingProperties.push({ 
            chat_id: chat.id, 
            property_id: chat.property_id,
            issue: 'Cannot convert to BigInt'
          });
        }
      }
    }

    console.log('📊 Property Reference Analysis:');
    console.log(`✅ Valid property references: ${existingCount}`);
    console.log(`❌ Missing property references: ${missingCount}\n`);

    if (missingProperties.length > 0) {
      console.log('🚨 Missing property references:');
      missingProperties.forEach(item => {
        console.log(`  - Chat ${item.chat_id}: property_id ${item.property_id} (${item.issue})`);
      });
      console.log('\n⚠️  These references need to be fixed before migration!\n');
    }

    // Summary
    console.log('📋 MIGRATION READINESS SUMMARY:');
    console.log('================================');
    
    if (invalidCount === 0 && missingCount === 0) {
      console.log('✅ READY FOR MIGRATION!');
      console.log('   All property_id values are compatible with BigInt.');
    } else {
      console.log('❌ NOT READY FOR MIGRATION!');
      console.log('   Please fix the issues above before proceeding.');
    }

  } catch (error) {
    console.error('❌ Error during analysis:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the check
checkPropertyIdTypes()
  .then(() => {
    console.log('\n🎉 Analysis completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Analysis failed:', error);
    process.exit(1);
  }); 