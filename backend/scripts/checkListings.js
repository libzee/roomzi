import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function checkListings() {
  try {
    console.log('🔍 Checking listings table...\n');

    const listings = await prisma.listings.findMany({
      select: {
        id: true,
        title: true,
        address: true,
        created_at: true
      },
      orderBy: {
        id: 'asc'
      }
    });

    console.log(`📊 Found ${listings.length} listings:\n`);

    if (listings.length === 0) {
      console.log('❌ No listings found in the database!');
      console.log('   This explains why the property_id references are invalid.');
      return;
    }

    console.log('📋 Available Listings:');
    console.log('======================');
    listings.forEach(listing => {
      console.log(`  ID: ${listing.id} | Title: ${listing.title || 'No title'} | Address: ${listing.address || 'No address'}`);
    });

    // Check which property_ids from chats are missing
    const chats = await prisma.chats.findMany({
      select: {
        id: true,
        property_id: true
      }
    });

    const chatPropertyIds = [...new Set(chats.map(chat => chat.property_id))];
    const existingListingIds = listings.map(listing => listing.id);

    console.log('\n🔍 Missing Property References:');
    console.log('===============================');
    chatPropertyIds.forEach(propertyId => {
      if (!existingListingIds.includes(BigInt(propertyId))) {
        console.log(`  ❌ Property ID ${propertyId} - Referenced by ${chats.filter(chat => chat.property_id === propertyId).length} chats`);
      }
    });

    console.log('\n💡 RECOMMENDATIONS:');
    console.log('===================');
    console.log('1. Create the missing listings with IDs 17, 18, 19');
    console.log('2. OR update the chats to reference existing listing IDs');
    console.log('3. OR set property_id to NULL for chats without valid properties');

  } catch (error) {
    console.error('❌ Error during analysis:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the check
checkListings()
  .then(() => {
    console.log('\n🎉 Analysis completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Analysis failed:', error);
    process.exit(1);
  }); 