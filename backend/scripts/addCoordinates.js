import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();



async function addCoordinates() {
  try {
    console.log('🔍 Checking properties without coordinates...\n');

    // Get all listings without coordinates
    const listingsWithoutCoords = await prisma.listings.findMany({
      where: {
        OR: [
          { coordinates: null },
          { coordinates: '' },
          { coordinates: 'null' }
        ]
      },
      select: {
        id: true,
        title: true,
        address: true,
        city: true
      }
    });

    console.log(`📊 Found ${listingsWithoutCoords.length} listings without coordinates:\n`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (let i = 0; i < listingsWithoutCoords.length; i++) {
      const listing = listingsWithoutCoords[i];

      console.log(`⏭️  Skipping ID: ${listing.id} | Title: ${listing.title} | City: ${listing.city} (no coordinates available)`);
      skippedCount++;
    }

    console.log('\n📈 Summary:');
    console.log('===========');
    console.log(`✅ Updated: ${updatedCount} listings`);
    console.log(`⏭️  Skipped: ${skippedCount} listings`);
    console.log(`📊 Total processed: ${listingsWithoutCoords.length}`);

  } catch (error) {
    console.error('❌ Error during update:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the update
addCoordinates()
  .then(() => {
    console.log('\n🎉 Update completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Update failed:', error);
    process.exit(1);
  }); 