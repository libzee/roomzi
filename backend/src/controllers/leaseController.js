import { prisma } from "../config/prisma.js";
import { successResponse, errorResponse } from "../utils/response.js";
import { supabase } from "../config/supabase.js";

export const createLease = async (req, res) => {
  try {
    console.log('incoming data:', req.body);
    const {
      listingId,
      tenantId,
      startDate,
      endDate,
      rent,
      document,
      signed
    } = req.body;

    // Validate required fields
    if (
      !listingId ||
      !tenantId ||
      !startDate ||
      !endDate ||
      !rent ||
      !document
    ) {
      return res.status(400).json({
        error: "Missing required fields",
      });
    }

    // Create a signed URL for the document
    const { data, error } = await supabase
      .storage
      .from("leases")
      .createSignedUrl(document, 60 * 60 * 24 * 365); // 1 year expiry

    if (error) {
      return res.status(500).json({
        error: "Failed to create signed URL for document",
      });
    }

    const lease = await prisma.leases.create({
      data: {
        tenant_id: tenantId,
        listing_id: listingId,
        start_date: new Date(startDate).toISOString(),
        end_date: new Date(endDate).toISOString(),
        rent: parseFloat(rent),
        document: data.signedUrl,
        signed,
        landlordseen: false, // Mark as unseen so landlord gets notification
      },
    });

    const responseData = {
      ...lease,
      listing_id: lease.listing_id.toString(),
    };

    res.status(201).json({
      message: "The lease has been created.",
      listing: responseData,
    });
  } catch (err) {
    console.error('Error in createLease:', err);
    console.error('Error stack:', err.stack);
    res.status(500).json({
      error: 'An error occurred while creating the lease.',
      details: err.message,
    })
  }
}

export const checkHasLease = async (req, res) => {
  try {
    const { listingId, tenantId } = req.params;

    const lease = await prisma.leases.findFirst({
      where: {
        listing_id: BigInt(listingId),
        tenant_id: tenantId,
      },
      select: {
        id: true,
        signed: true,
      },
    });

    if (lease) {
      const responseData = {
        exists: true,
        leaseId: lease.id,
        signed: lease.signed,
      };
      res.json(responseData);
    } else {
      res.json({ exists: false });
    }
  } catch (err) {
    console.error('Error checking if lease exists:', err);
    res.status(500).json({
      error: 'An error occurred while checking if lease exists.',
      details: err.message,
    });
  }
};

export const getLeaseWithDocument = async (req, res) => {
  try {
    const { id } = req.params;

    const lease = await prisma.leases.findUnique({
      where: { id: id },
    });

    if (!lease) {
      return res.status(404).json({ error: "Lease not found" });
    }

    const responseData = {
      lease: {
        ...lease,
        listing_id: lease.listing_id.toString(),
      }
    };

    res.json(responseData);
  } catch (err) {
    console.error('Error getting lease:', err);
    res.status(500).json({
      error: 'An error occurred while getting the lease.',
      details: err.message,
    });
  }
}

// Helper to convert BigInt and Date to string
const convertBigIntToString = (obj) => {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'bigint') return obj.toString();
  if (obj instanceof Date) return obj.toISOString();
  if (Array.isArray(obj)) return obj.map(convertBigIntToString);
  if (typeof obj === 'object') {
    const converted = {};
    for (const [key, value] of Object.entries(obj)) {
      converted[key] = convertBigIntToString(value);
    }
    return converted;
  }
  return obj;
};

// Get all leases for a tenant
export const getLeasesForTenant = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const leases = await prisma.leases.findMany({
      where: { tenant_id: tenantId },
      orderBy: { created_at: "desc" },
      include: {
        listings: {
          select: {
            id: true,
            title: true,
            address: true,
            images: true,
          },
        },
      },
    });
    res.json(successResponse(convertBigIntToString(leases), "Leases retrieved successfully"));
  } catch (error) {
    console.error("Error fetching leases:", error);
    res.status(500).json(errorResponse(error));
  }
};



// Get a specific lease by ID
export const getLeaseById = async (req, res) => {
  try {
    const { leaseId } = req.params;
    // Explicitly select all relevant fields, including document
    const lease = await prisma.leases.findUnique({
      where: { id: leaseId },
      select: {
        id: true,
        created_at: true,
        tenant_id: true,
        listing_id: true,
        start_date: true,
        end_date: true,
        rent: true,
        signed: true,
        document: true, // Ensure document is always included
      },
    });
    if (!lease) {
      return res.status(404).json(errorResponse(new Error("Lease not found"), 404));
    }
    res.json(successResponse(convertBigIntToString(lease), "Lease retrieved successfully"));
  } catch (error) {
    console.error("Error fetching lease:", error);
    res.status(500).json(errorResponse(error));
  }
};

// Upload a signed lease file
export const uploadSignedLease = async (req, res) => {
  try {
    const { leaseId } = req.params;
    if (!req.file) {
      return res.status(400).json(errorResponse(new Error("No file uploaded"), 400));
    }
    // Upload to Supabase Storage
    const file = req.file;
    const fileExt = file.originalname.split('.').pop();
    const fileName = `signed_${leaseId}_${Date.now()}.${fileExt}`;
    const { data, error: uploadError } = await supabase.storage.from('leases').upload(fileName, file.buffer, { contentType: file.mimetype });
    if (uploadError) {
      throw uploadError;
    }
    // Create signed URL for document
    const { data: urlData, error: urlError } = await supabase
      .storage
      .from("leases")
      .createSignedUrl(fileName, 60 * 60 * 24 * 365); // 1 year expiry

    if (urlError || !urlData?.signedUrl) {
      throw new Error("Could not generate signed URL for document");
    }

    // Update lease record
    const updatedLease = await prisma.leases.update({
      where: { id: leaseId },
      data: { 
        document: urlData.signedUrl, 
        signed: true,
        landlordseen: false // Mark as unseen so landlord gets notification
      },
    });

    // Also update the corresponding listing: set tenant_id and available = false
    if (updatedLease.listing_id && updatedLease.tenant_id) {
      await prisma.listings.update({
        where: { id: BigInt(updatedLease.listing_id) },
        data: {
          tenant_id: updatedLease.tenant_id,
          available: false,
        },
      });
    }

    res.json(successResponse(convertBigIntToString(updatedLease), "Signed lease uploaded successfully"));
  } catch (error) {
    console.error("Error uploading signed lease:", error);
    res.status(500).json(errorResponse(error));
  }
};

// Get lease history for a tenant and a specific listing
export const getLeaseHistoryForTenantAndListing = async (req, res) => {
  try {
    const { tenantId, listingId } = req.query;
    if (!tenantId || !listingId) {
      return res.status(400).json(errorResponse(new Error("Missing tenantId or listingId"), 400));
    }
    const leases = await prisma.leases.findMany({
      where: {
        tenant_id: tenantId,
        listing_id: BigInt(listingId),
      },
      orderBy: { start_date: "desc" },
    });
    res.json(successResponse(convertBigIntToString(leases), "Lease history retrieved successfully"));
  } catch (error) {
    console.error("Error fetching lease history:", error);
    res.status(500).json(errorResponse(error));
  }
};

// Get all leases for a specific listing
export const getLeasesForListing = async (req, res) => {
  try {
    const { listingId } = req.params;
    if (!listingId) {
      return res.status(400).json(errorResponse(new Error("Missing listingId"), 400));
    }
    const leases = await prisma.leases.findMany({
      where: {
        listing_id: BigInt(listingId),
      },
      include: {
        tenant_profiles: {
          select: {
            full_name: true,
          },
        },
        listings: {
          select: {
            title: true,
            address: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
    });
    res.json(successResponse(convertBigIntToString(leases), "Leases for listing retrieved successfully"));
  } catch (error) {
    console.error("Error fetching leases for listing:", error);
    res.status(500).json(errorResponse(error));
  }
};

// Mark leases as seen by landlord
export const markLeasesAsSeen = async (req, res) => {
  try {
    const { leaseIds } = req.body;
    if (!leaseIds || !Array.isArray(leaseIds)) {
      return res.status(400).json(errorResponse(new Error("Missing leaseIds array"), 400));
    }
    
    const updatedLeases = await prisma.leases.updateMany({
      where: {
        id: {
          in: leaseIds
        }
      },
      data: {
        landlordseen: true
      }
    });
    
    res.json(successResponse(updatedLeases, "Leases marked as seen successfully"));
  } catch (error) {
    console.error("Error marking leases as seen:", error);
    res.status(500).json(errorResponse(error));
  }
}; 
