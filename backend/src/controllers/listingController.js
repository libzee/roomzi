import { prisma } from "../config/prisma.js";
import {
  successResponse,
  errorResponse,
  paginatedResponse,
} from "../utils/response.js";
import { geocodeAddress, getFallbackCoordinates } from "../utils/geocoding.js";
import { updateChatNamesForListing } from "../utils/chatNameUpdater.js";

// Get all listings with pagination and filtering
export const getListings = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      city,
      state,
      minPrice,
      maxPrice,
      bedrooms,
      bathrooms,
      type,
      available = true,
    } = req.query;

    const skip = (page - 1) * limit;
    const take = parseInt(limit);

    // Build where clause for filtering
    const where = {
      ...(available !== "false" && { available: true }),
      ...(city && { city: { contains: city, mode: "insensitive" } }),
      ...(state && { state: { contains: state, mode: "insensitive" } }),
      ...(type && { type: { contains: type, mode: "insensitive" } }),
      ...(minPrice && { price: { gte: parseFloat(minPrice) } }),
      ...(maxPrice && { price: { lte: parseFloat(maxPrice) } }),
      ...(bedrooms && { bedrooms: { gte: parseInt(bedrooms) } }),
      ...(bathrooms && { bathrooms: { gte: parseInt(bathrooms) } }),
    };

    const [listings, total] = await Promise.all([
      prisma.listings.findMany({
        where,
        include: {
          landlord_profiles: {
            select: {
              id: true,
              full_name: true,
              email: true,
              phone: true,
            },
          },
          tenant_profiles: {
            select: {
              id: true,
              full_name: true,
              email: true,
            },
          },
        },
        orderBy: { created_at: "desc" },
        skip,
        take,
      }),
      prisma.listings.count({ where }),
    ]);

    // Convert BigInt fields to strings for JSON serialization
    const safeListings = listings.map(listing => ({
      ...listing,
      id: listing.id.toString(),
      landlord_id: listing.landlord_id?.toString(),
      tenant_id: listing.tenant_id?.toString(),
      landlord_profiles: listing.landlord_profiles
        ? {
            ...listing.landlord_profiles,
            id: listing.landlord_profiles.id?.toString(),
          }
        : undefined,
      tenant_profiles: listing.tenant_profiles
        ? {
            ...listing.tenant_profiles,
            id: listing.tenant_profiles.id?.toString(),
          }
        : undefined,
      images: Array.isArray(listing.images)
        ? listing.images
        : (typeof listing.images === 'string' && listing.images.trim().startsWith('[')
            ? JSON.parse(listing.images)
            : []),
      amenities: Array.isArray(listing.amenities)
        ? listing.amenities
        : (typeof listing.amenities === 'string' && listing.amenities.trim().startsWith('[')
            ? JSON.parse(listing.amenities)
            : []),
      requirements: Array.isArray(listing.requirements)
        ? listing.requirements
        : (typeof listing.requirements === 'string' && listing.requirements.trim().startsWith('[')
            ? JSON.parse(listing.requirements)
            : (listing.requirements ? [listing.requirements] : [])),
      house_rules: Array.isArray(listing.house_rules)
        ? listing.house_rules
        : (typeof listing.house_rules === 'string' && listing.house_rules.trim().startsWith('[')
            ? JSON.parse(listing.house_rules)
            : (listing.house_rules ? [listing.house_rules] : [])),
    }));

    res.json(paginatedResponse(safeListings, parseInt(page), take, total));
  } catch (error) {
    console.error("Error fetching listings:", error);
    res.status(500).json(errorResponse(error));
  }
};

// Get listing by ID
export const getListingById = async (req, res) => {
  try {
    const { id } = req.params;

    const listing = await prisma.listings.findUnique({
      where: { id: BigInt(id) },
      include: {
        landlord_profiles: {
          select: {
            id: true,
            full_name: true,
            email: true,
            phone: true,
            image_url: true,
          },
        },
        tenant_profiles: {
          select: {
            id: true,
            full_name: true,
            email: true,
            phone: true,
            image_url: true,
          },
        },
        leases: {
          orderBy: { created_at: "desc" },
          take: 1, // Get the most recent lease
        },
      },
    });

    if (!listing) {
      return res
        .status(404)
        .json(errorResponse(new Error("Listing not found"), 404));
    }

    // Convert BigInt to string for JSON serialization and map landlord/tenant data
    const responseData = {
      // Explicitly select fields to avoid BigInt serialization issues
      id: listing.id.toString(),
      created_at: listing.created_at,
      landlord_id: listing.landlord_id?.toString(),
      tenant_id: listing.tenant_id?.toString(),
      title: listing.title,
      type: listing.type,
      address: listing.address,
      city: listing.city,
      state: listing.state,
      zip_code: listing.zip_code,
      bedrooms: listing.bedrooms,
      bathrooms: listing.bathrooms,
      area: listing.area,
      price: listing.price,
      description: listing.description,
      lease_type: listing.lease_type,
      requirements: listing.requirements,
      coordinates: listing.coordinates,
      available: listing.available,
      landlord_name: listing.landlord_name,
      landlord_phone: listing.landlord_phone,
      // Process lease data
      leases: listing.leases?.map(lease => ({
        id: lease.id.toString(),
        created_at: lease.created_at,
        tenant_id: lease.tenant_id?.toString(),
        listing_id: lease.listing_id?.toString(),
        start_date: lease.start_date,
        end_date: lease.end_date,
        rent: lease.rent,
        signed: lease.signed,
        document: lease.document,
      })) || [],
      // Landlord profile data
      landlord_name: listing.landlord_profiles?.full_name,
      landlord_phone: listing.landlord_profiles?.phone,
      landlord_email: listing.landlord_profiles?.email,
      // Tenant profile data
      tenant_name: listing.tenant_profiles?.full_name,
      tenant_phone: listing.tenant_profiles?.phone,
      images: Array.isArray(listing.images)
        ? listing.images
        : (typeof listing.images === 'string' && listing.images.trim().startsWith('[')
            ? (() => {
                try { return JSON.parse(listing.images); }
                catch (e) { return []; }
              })()
            : []),
      amenities: Array.isArray(listing.amenities)
        ? listing.amenities
        : (typeof listing.amenities === 'string' && listing.amenities.trim().startsWith('[')
            ? (() => {
                try { return JSON.parse(listing.amenities); }
                catch (e) { return []; }
              })()
            : []),
      requirements: Array.isArray(listing.requirements)
        ? listing.requirements
        : (typeof listing.requirements === 'string' && listing.requirements.trim().startsWith('[')
            ? (() => {
                try { return JSON.parse(listing.requirements); }
                catch (e) { return []; }
              })()
            : (listing.requirements ? [listing.requirements] : [])),
      house_rules: Array.isArray(listing.house_rules)
        ? listing.house_rules
        : (typeof listing.house_rules === 'string' && listing.house_rules.trim().startsWith('[')
            ? (() => {
                try { return JSON.parse(listing.house_rules); }
                catch (e) { return []; }
              })()
            : (listing.house_rules ? [listing.house_rules] : [])),
      // Add lease data with safe handling
      lease_start: listing.leases && listing.leases.length > 0 && listing.leases[0]?.start_date 
        ? listing.leases[0].start_date.toISOString().split('T')[0] 
        : "N/A",
      lease_end: listing.leases && listing.leases.length > 0 && listing.leases[0]?.end_date 
        ? listing.leases[0].end_date.toISOString().split('T')[0] 
        : "N/A",
    };

    res.json(successResponse(responseData, "Listing retrieved successfully"));
  } catch (error) {
    console.error("Error fetching listing:", error);
    res.status(500).json(errorResponse(error));
  }
};

// Create new listing
export const createListing = async (req, res) => {
  try {
    const {
      landlord_id,
      tenant_id,
      title,
      type,
      address,
      city,
      state,
      zip_code,
      bedrooms,
      bathrooms,
      area,
      price,
      description,
      lease_type,
      amenities,
      requirements,
      house_rules,
      images,
      landlord_name,
      landlord_phone,
      coordinates,
      available = true,
    } = req.body;

    // Generate coordinates if not provided
    let finalCoordinates = coordinates;
    if (!finalCoordinates && address && city && state && zip_code) {
      try {
        finalCoordinates = await geocodeAddress(address, city, state, zip_code);
        if (!finalCoordinates) {
          // Use fallback coordinates if geocoding fails
          finalCoordinates = getFallbackCoordinates(city, state);
        }
      } catch (error) {
        console.error("Error generating coordinates:", error);
        // Use fallback coordinates
        finalCoordinates = getFallbackCoordinates(city, state);
      }
    }

    const listing = await prisma.listings.create({
      data: {
        landlord_id,
        tenant_id,
        title,
        type,
        address,
        city,
        state,
        zip_code,
        bedrooms: bedrooms ? parseInt(bedrooms) : null,
        bathrooms: bathrooms ? parseInt(bathrooms) : null,
        area: area ? parseFloat(area) : null,
        price: price ? parseFloat(price) : null,
        description,
        lease_type,
        amenities: amenities || [],
        requirements,
        house_rules,
        images,
        landlord_name,
        landlord_phone,
        coordinates: finalCoordinates,
        available,
      },
      include: {
        landlord_profiles: {
          select: {
            id: true,
            full_name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    // Convert BigInt to string for JSON serialization
    const responseData = {
      ...listing,
      id: listing.id.toString(),
    };

    res
      .status(201)
      .json(successResponse(responseData, "Listing created successfully"));
  } catch (error) {
    console.error("Error creating listing:", error);
    res.status(500).json(errorResponse(error));
  }
};



// Update listing
export const updateListing = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
        type,
        address,
        city,
        state,
        zipCode,
        bedrooms,
        bathrooms,
        area,
        price,
        description,
        leaseType,
        amenities,
        requirements,
        houseRules,
        images,
        landlordId,
    } = req.body;

    const listing = await prisma.listings.update({
      where: { id: id },
      data: {
        title,
        type,
        address,
        city,
        state,
        zip_code: zipCode,
        bedrooms: parseInt(bedrooms),
        bathrooms: parseInt(bathrooms),
        area: parseFloat(area),
        price: parseFloat(price),
        description,
        lease_type: leaseType,
        amenities,
        requirements,
        house_rules: houseRules,
        images: { set: images },
        landlord_id: landlordId,
      },
      include: {
        landlord_profiles: {
          select: {
            id: true,
            full_name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    // Update chat names if title was changed
    if (updateData.title) {
      await updateChatNamesForListing(id, updateData.title);
    }

    // Convert BigInt to string for JSON serialization
    const responseData = {
      ...listing,
      id: listing.id.toString(),
    };

    res.json(successResponse(responseData, "Listing updated successfully"));
  } catch (error) {
    console.error("Error updating listing:", error);

    if (error.code === "P2025") {
      return res
        .status(404)
        .json(errorResponse(new Error("Listing not found"), 404));
    }

    res.status(500).json(errorResponse(error));
  }
};

// Delete listing
export const deleteListing = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.listings.delete({
      where: { id: id },
    });

    res.json(successResponse(null, "Listing deleted successfully"));
  } catch (error) {
    console.error("Error deleting listing:", error);

    if (error.code === "P2025") {
      return res
        .status(404)
        .json(errorResponse(new Error("Listing not found"), 404));
    }

    res.status(500).json(errorResponse(error));
  }
};

// Get listings by landlord
export const getListingsByLandlord = async (req, res) => {
  try {
    const { landlordId } = req.params;
    const { includeUnavailable = false } = req.query;

    const where = {
      landlord_id: landlordId,
      ...(includeUnavailable !== "true" && { available: true }),
    };

    const listings = await prisma.listings.findMany({
      where,
      include: {
        tenant_profiles: {
          select: {
            id: true,
            full_name: true,
            email: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
    });

    // Convert BigInt to string for JSON serialization
    const responseData = listings.map((listing) => ({
      ...listing,
      id: listing.id.toString(),
    }));

    res.json(
      successResponse(responseData, "Landlord listings retrieved successfully")
    );
  } catch (error) {
    console.error("Error fetching landlord listings:", error);
    res.status(500).json(errorResponse(error));
  }
};

// Get listings by tenant
export const getListingsByTenant = async (req, res) => {
  try {
    const { tenantId } = req.params;

    const listings = await prisma.listings.findMany({
      where: {
        tenant_id: tenantId,
      },
      include: {
        landlord_profiles: {
          select: {
            id: true,
            full_name: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
    });

    // Convert BigInt to string for JSON serialization
    const responseData = listings.map((listing) => ({
      ...listing,
      id: listing.id.toString(),
    }));

    res.json(
      successResponse(responseData, "Tenant listings retrieved successfully")
    );
  } catch (error) {
    console.error("Error fetching tenant listings:", error);
    res.status(500).json(errorResponse(error));
  }
};
