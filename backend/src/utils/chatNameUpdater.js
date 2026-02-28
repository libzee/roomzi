import { prisma } from "../config/prisma.js";

/**
 * Updates chat names for a specific landlord when their profile is updated
 * @param {string} landlordId - The landlord's ID
 * @param {string} newFullName - The new full name
 */
export const updateChatNamesForLandlord = async (landlordId, newFullName) => {
  try {
    // Update all chats where this landlord is involved
    const result = await prisma.chats.updateMany({
      where: { landlord_id: landlordId },
      data: { landlord_name: newFullName }
    });
    console.log(`✅ Updated ${result.count} chat(s) for landlord ${landlordId} to "${newFullName}"`);
    return result;
  } catch (error) {
    console.error(`❌ Error updating chat names for landlord ${landlordId}:`, error);
    throw error;
  }
};

/**
 * Updates chat names for a specific tenant when their profile is updated
 * @param {string} tenantId - The tenant's ID
 * @param {string} newFullName - The new full name
 */
export const updateChatNamesForTenant = async (tenantId, newFullName) => {
  try {
    // Update all chats where this tenant is involved
    const result = await prisma.chats.updateMany({
      where: { tenant_id: tenantId },
      data: { tenant_name: newFullName }
    });
    console.log(`✅ Updated ${result.count} chat(s) for tenant ${tenantId} to "${newFullName}"`);
    return result;
  } catch (error) {
    console.error(`❌ Error updating chat names for tenant ${tenantId}:`, error);
    throw error;
  }
};

/**
 * Updates chat names for a specific listing when its title is updated
 * @param {string|number} listingId - The listing's ID
 * @param {string} newTitle - The new title
 */
export const updateChatNamesForListing = async (listingId, newTitle) => {
  try {
    // Update all chats where this listing is involved
    const result = await prisma.chats.updateMany({
      where: { property_id: listingId.toString() },
      data: { property_name: newTitle }
    });
    console.log(`✅ Updated ${result.count} chat(s) for listing ${listingId} to "${newTitle}"`);
    return result;
  } catch (error) {
    console.error(`❌ Error updating chat names for listing ${listingId}:`, error);
    throw error;
  }
};

/**
 * Bulk update all chat names to match current profile and listing data
 * This is useful for maintenance or fixing inconsistencies
 */
export const updateAllChatNames = async () => {
  try {
    console.log('🔄 Starting bulk chat names update...');

    // Get all chats with their related data
    const chats = await prisma.chats.findMany({
      include: {
        tenant_profile: {
          select: { full_name: true }
        },
        landlord_profile: {
          select: { full_name: true }
        },
        listing: {
          select: { title: true }
        }
      }
    });

    console.log(`📊 Found ${chats.length} chats to process`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const chat of chats) {
      try {
        const tenantName = chat.tenant_profile?.full_name || null;
        const landlordName = chat.landlord_profile?.full_name || null;
        const propertyName = chat.listing?.title || null;

        // Check if any names need updating
        const needsUpdate = 
          chat.tenant_name !== tenantName ||
          chat.landlord_name !== landlordName ||
          chat.property_name !== propertyName;

        if (needsUpdate) {
          await prisma.chats.update({
            where: { id: chat.id },
            data: {
              tenant_name: tenantName,
              landlord_name: landlordName,
              property_name: propertyName,
            },
          });
          updatedCount++;
          console.log(`✅ Updated chat ${chat.id}:`, {
            tenant: tenantName || 'null',
            landlord: landlordName || 'null',
            property: propertyName || 'null'
          });
        } else {
          skippedCount++;
          console.log(`⏭️  Skipped chat ${chat.id} - already up to date`);
        }
      } catch (error) {
        console.error(`❌ Error updating chat ${chat.id}:`, error.message);
      }
    }

    console.log('\n📈 Update Summary:');
    console.log(`✅ Updated: ${updatedCount} chats`);
    console.log(`⏭️  Skipped: ${skippedCount} chats`);
    console.log(`📊 Total processed: ${chats.length} chats`);

    return { updatedCount, skippedCount, totalCount: chats.length };
  } catch (error) {
    console.error('❌ Error in bulk chat names update:', error);
    throw error;
  }
}; 