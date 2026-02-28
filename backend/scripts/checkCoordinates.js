import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function checkCoordinates() {
  try {
    console.log('🔍 Checking coordinates for all listings...\n');

    const listings = await prisma.listings.findMany({
      select: {
        id: true,
        title: true,
        address: true,
        coordinates: true
      },
      orderBy: {
        id: 'asc'
      }
    });

    console.log(`📊 Found ${listings.length} listings:\n`);

    console.log('📍 Listing Coordinates:');
    console.log('=======================');
    
    let validCoordinates = 0;
    let invalidCoordinates = 0;
    
    listings.forEach(listing => {
      const hasValidCoords = listing.coordinates && 
                           listing.coordinates !== 'null' && 
                           listing.coordinates !== '' &&
                           listing.coordinates !== '0,0';
      
      if (hasValidCoords) {
        validCoordinates++;
        console.log(`  ✅ ID: ${listing.id} | Title: ${listing.title || 'No title'} | Coords: ${listing.coordinates}`);
      } else {
        invalidCoordinates++;
        console.log(`  ❌ ID: ${listing.id} | Title: ${listing.title || 'No title'} | Coords: ${listing.coordinates || 'NULL'}`);
      }
    });

    console.log('\n📈 Summary:');
    console.log('===========');
    console.log(`✅ Valid coordinates: ${validCoordinates}`);
    console.log(`❌ Invalid coordinates: ${invalidCoordinates}`);
    console.log(`📊 Total listings: ${listings.length}`);

    if (invalidCoordinates > 0) {
      console.log('\n💡 RECOMMENDATIONS:');
      console.log('===================');
      console.log('1. Add coordinates to listings without valid coordinates');
      console.log('2. Use format: "latitude,longitude" (e.g., "43.6532,-79.3832")');
      console.log('3. Or use JSON format: \'{"lat": 43.6532, "lng": -79.3832}\'');
    }

  } catch (error) {
    console.error('❌ Error during analysis:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the check
checkCoordinates()
  .then(() => {
    console.log('\n🎉 Analysis completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Analysis failed:', error);
    process.exit(1);
  }); 