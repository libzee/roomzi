import { prisma } from "../config/prisma.js";

// Middleware to automatically create tenant profile if it doesn't exist
export const autoCreateTenantProfile = async (req, res, next) => {
  try {
    const tenantId = req.params.id || req.body.id;
    
    if (!tenantId) {
      return next();
    }

    // Check if tenant profile exists
    const existingProfile = await prisma.tenant_profiles.findUnique({
      where: { id: tenantId },
    });

    if (!existingProfile) {
      // Create a basic tenant profile
      await prisma.tenant_profiles.create({
        data: {
          id: tenantId,
          full_name: `Tenant ${tenantId.slice(0, 8)}`,
          email: `${tenantId.slice(0, 8)}@example.com`,
          phone: null,
          image_url: null,
          address: null,
        },
      });
      console.log("Auto-created tenant profile for:", tenantId);
    }

    next();
  } catch (error) {
    console.error("Error in autoCreateTenantProfile middleware:", error);
    next();
  }
};

// Middleware to automatically create landlord profile if it doesn't exist
export const autoCreateLandlordProfile = async (req, res, next) => {
  try {
    const landlordId = req.params.id || req.params.landlordId || req.body.id || req.body.landlordId;
    
    if (!landlordId) {
      return next();
    }

    // Check if landlord profile exists
    const existingProfile = await prisma.landlord_profiles.findUnique({
      where: { id: landlordId },
    });

    if (!existingProfile) {
      // Create a basic landlord profile
      await prisma.landlord_profiles.create({
        data: {
          id: landlordId,
          full_name: `Landlord ${landlordId.slice(0, 8)}`,
          email: `${landlordId.slice(0, 8)}@example.com`,
          phone: null,
          image_url: null,
          address: null,
          documents: [],
        },
      });
      console.log("Auto-created landlord profile for:", landlordId);
    }

    next();
  } catch (error) {
    console.error("Error in autoCreateLandlordProfile middleware:", error);
    next();
  }
}; 