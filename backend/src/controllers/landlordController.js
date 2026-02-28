import { prisma } from "../config/prisma.js";
import { successResponse, errorResponse } from "../utils/response.js";
import { geocodeAddress, getFallbackCoordinates } from "../utils/geocoding.js";
import { supabase } from "../config/supabase.js";
import { updateChatNamesForLandlord } from "../utils/chatNameUpdater.js";


// Helper function to convert BigInt to string for JSON serialization
const convertBigIntToString = (obj) => {
  if (obj === null || obj === undefined) return obj;

  if (typeof obj === "bigint") {
    return obj.toString();
  }

  // Handle Date objects
  if (obj instanceof Date) {
    return obj.toISOString();
  }

  if (Array.isArray(obj)) {
    return obj.map(convertBigIntToString);
  }

  if (typeof obj === "object") {
    const converted = {};
    for (const [key, value] of Object.entries(obj)) {
      converted[key] = convertBigIntToString(value);
    }
    return converted;
  }

  return obj;
};

function normalizeDocuments(docs) {
  if (!Array.isArray(docs)) return [];
  return docs
    .map((doc) => {
      if (typeof doc === "string") {
        return { path: doc, displayName: doc.split("/").pop() || "Document" };
      }
      if (doc && typeof doc === "object" && doc.path) {
        return {
          path: doc.path,
          displayName:
            doc.displayName || doc.path.split("/").pop() || "Document",
        };
      }
      return null;
    })
    .filter(Boolean);
}



// Get all landlords
export const getLandlords = async (req, res) => {
  try {
    const landlords = await prisma.landlord_profiles.findMany({
      orderBy: { created_at: "desc" },
    });

    res.json(successResponse(landlords, "Landlords retrieved successfully"));
  } catch (error) {
    console.error("Error fetching landlords:", error);
    res.status(500).json(errorResponse(error));
  }
};

// Get landlord by ID
export const getLandlordById = async (req, res) => {
  try {
    const { id } = req.params;

    const landlord = await prisma.landlord_profiles.findUnique({
      where: { id },
    });

    if (!landlord) {
      return res
        .status(404)
        .json(errorResponse(new Error("Landlord not found"), 404));
    }

    res.json(successResponse(landlord, "Landlord retrieved successfully"));
  } catch (error) {
    console.error("Error fetching landlord:", error);
    res.status(500).json(errorResponse(error));
  }
};

// Create new landlord (with upsert functionality)
export const createLandlord = async (req, res) => {
  try {
    const {
      id,
      full_name,
      email,
      phone,
      image_url,
      address,
      documents,
      viewingRequestNotifications,
      rentReminderDays,
    } = req.body;

    // Validate required fields
    if (!id || !email) {
      return res.status(400).json({
        success: false,
        error: "id and email are required",
        statusCode: 400,
      });
    }

    // Use upsert to handle both create and update scenarios
    const landlord = await prisma.landlord_profiles.upsert({
      where: { id },
      update: {
        // Update existing profile with new data if provided
        ...(full_name && { full_name }),
        ...(email && { email }),
        ...(phone !== undefined && { phone }),
        ...(image_url !== undefined && { image_url }),
        ...(address !== undefined && { address }),
        ...(viewingRequestNotifications !== undefined && {
          viewingRequestNotifications,
        }),
        ...(rentReminderDays !== undefined && { rentReminderDays }),
        ...(documents !== undefined && {
          documents: { set: normalizeDocuments(documents) },
        }), // expects array of objects
        updated_at: new Date(),
      },
      create: {
        id,
        full_name: full_name || email.split("@")[0], // Use email prefix as fallback
        email,
        phone,
        image_url,
        address,
        viewingRequestNotifications:
          viewingRequestNotifications !== undefined
            ? viewingRequestNotifications
            : true,
        rentReminderDays: rentReminderDays !== undefined ? rentReminderDays : 3,
        documents: { set: normalizeDocuments(documents || []) }, // expects array of objects
      },
    });

    res
      .status(201)
      .json(
        successResponse(
          landlord,
          "Landlord profile created/updated successfully"
        )
      );
  } catch (error) {
    console.error("Error creating/updating landlord:", error);
    res.status(500).json(errorResponse(error));
  }
};

// Update landlord
export const updateLandlord = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      full_name,
      email,
      phone,
      image_url,
      address,
      documents,
      viewingRequestNotifications,
      rentReminderDays,
    } = req.body;

    console.log("Updating landlord profile:", { id, documents });

    // Update landlord profile
    const updateData = {
      ...(full_name && { full_name }),
      ...(email && { email }),
      ...(phone !== undefined && { phone }),
      ...(image_url !== undefined && { image_url }),
      ...(address !== undefined && { address }),
      ...(viewingRequestNotifications !== undefined && {
        viewingRequestNotifications,
      }),
      ...(rentReminderDays !== undefined && { rentReminderDays }),
      updated_at: new Date(),
    };

    // Handle documents separately to avoid issues with normalization
    if (documents !== undefined) {
      console.log("Normalizing documents:", documents);
      const normalizedDocuments = normalizeDocuments(documents);
      console.log("Normalized documents:", normalizedDocuments);
      // Use set operation for JSON array to avoid Prisma validation issues
      updateData.documents = {
        set: normalizedDocuments,
      };
    }

    const landlord = await prisma.landlord_profiles.update({
      where: { id },
      data: updateData,
    });

    // Update chat names if full_name was changed
    if (full_name) {
      await updateChatNamesForLandlord(id, full_name);
    }

    // Real-time sync: update tenant profile if exists
    const tenantProfile = await prisma.tenant_profiles.findUnique({
      where: { id },
    });
    if (tenantProfile) {
      await prisma.tenant_profiles.update({
        where: { id },
        data: {
          ...(full_name && { full_name }),
          ...(email && { email }),
          ...(phone !== undefined && { phone }),
          ...(image_url !== undefined && { image_url }),
          ...(address !== undefined && { address }),
          updated_at: new Date(),
        },
      });
    }

    res.json(successResponse(landlord, "Landlord updated successfully"));
  } catch (error) {
    console.error("Error updating landlord:", error);

    if (error.code === "P2025") {
      return res
        .status(404)
        .json(errorResponse(new Error("Landlord not found"), 404));
    }

    res.status(500).json(errorResponse(error));
  }
};

// Delete landlord
export const deleteLandlord = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.landlord_profiles.delete({
      where: { id },
    });

    res.json(successResponse(null, "Landlord deleted successfully"));
  } catch (error) {
    console.error("Error deleting landlord:", error);

    if (error.code === "P2025") {
      return res
        .status(404)
        .json(errorResponse(new Error("Landlord not found"), 404));
    }

    res.status(500).json(errorResponse(error));
  }
};

// Get landlord's listings
export const getLandlordListings = async (req, res) => {
  try {
    const { id } = req.params;
    // No available filter, so all listings for this landlord are returned
    const where = { landlord_id: id };
    const listings = await prisma.listings.findMany({
      where,
      orderBy: { created_at: "desc" },
    });
    // Convert BigInt to string for JSON serialization
    const responseData = convertBigIntToString(listings);
    res.json(
      successResponse(responseData, "Landlord listings retrieved successfully")
    );
  } catch (error) {
    console.error("Error fetching landlord listings:", error);
    res.status(500).json(errorResponse(error));
  }
};

export const createListing = async (req, res) => {
  try {
    console.log("incoming data", req.body);
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

    // Validate required fields
    if (
      !title ||
      !type ||
      !address ||
      !city ||
      !state ||
      !zipCode ||
      !price ||
      !landlordId
    ) {
      return res.status(400).json({
        error: "Missing required fields",
      });
    }

    // Check if landlord profile exists, create if it doesn't
    let landlordProfile = await prisma.landlord_profiles.findUnique({
      where: { id: landlordId },
    });

    if (!landlordProfile) {
      // Create a basic landlord profile
      landlordProfile = await prisma.landlord_profiles.create({
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
      console.log("Created new landlord profile:", landlordProfile.id);
    }

    // Generate coordinates from address
    let coordinates = null;
    try {
      coordinates = await geocodeAddress(address, city, state, zipCode);
      if (!coordinates) {
        // Use fallback coordinates if geocoding fails
        coordinates = getFallbackCoordinates(city, state);
      }
    } catch (error) {
      console.error("Error generating coordinates:", error);
      // Use fallback coordinates
      coordinates = getFallbackCoordinates(city, state);
    }

    const listing = await prisma.listings.create({
      data: {
        title,
        type,
        address,
        city,
        state,
        zip_code: zipCode,
        bedrooms: bedrooms ? parseInt(bedrooms) : null,
        bathrooms: bathrooms ? parseInt(bathrooms) : null,
        area: area ? parseFloat(area) : null,
        price: parseFloat(price),
        description,
        lease_type: leaseType,
        amenities: amenities || [],
        requirements,
        house_rules: houseRules,
        images: images ? JSON.stringify(images) : null,
        landlord_id: landlordId,
        coordinates,
        available: true,
      },
    });

    // Convert BigInt to string for JSON serialization
    const responseData = {
      ...listing,
      id: listing.id.toString(),
    };

    res.status(201).json({
      message: "The listing has been created.",
      listing: responseData,
    });
  } catch (err) {
    console.error("Error creating listing:", err);

    // Provide more specific error messages
    if (err.code === "P2002") {
      return res.status(400).json({
        error: "A listing with this title already exists.",
        details: err.message,
      });
    }

    if (err.code === "P2003") {
      return res.status(400).json({
        error: "Invalid landlord ID or database constraint violation.",
        details: err.message,
      });
    }

    if (err.code === "P2025") {
      return res.status(404).json({
        error: "Landlord profile not found.",
        details: err.message,
      });
    }

    res.status(500).json({
      error: "An error occurred while creating the listing.",
      details: err.message,
      code: err.code,
    });
  }
};

export const getListings = async (req, res) => {
  try {
    const { id } = req.params;

    const listings = await prisma.listings.findMany({
      where: { landlord_id: id },
      orderBy: { created_at: "desc" },
    });

    // Convert BigInt to string for JSON serialization
    const responseData = convertBigIntToString(listings);
    res.status(200).json(responseData);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "An error occurred while getting the listings.",
    });
  }
};

export const getPayments = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("getPayments called with id:", id, "type:", typeof id);

    // Validate that id is a valid number
    if (!id || isNaN(parseInt(id))) {
      console.log("Invalid ID provided:", id);
      return res.status(400).json({
        error: "Invalid listing ID provided.",
      });
    }

    const listingId = BigInt(id);
    console.log("Converted listingId to BigInt:", listingId.toString());

    // First, let's check if the table exists and has any data
    const allPayments = await prisma.payment_requests.findMany();
    console.log("Total payments in database:", allPayments.length);

    const payments = await prisma.payment_requests.findMany({
      where: { listingId: listingId },
      orderBy: { date: "desc" },
    });

    console.log("Found payments:", payments.length);

    // Convert BigInt to string for JSON serialization
    const responseData = convertBigIntToString(payments);
    console.log("Response data prepared, sending response");
    res.status(200).json(responseData);
  } catch (err) {
    console.error("Error in getPayments:", err);
    console.error("Error stack:", err.stack);
    res.status(500).json({
      error: "An error occurred while getting the payments.",
      details: err.message,
    });
  }
};
