import { prisma } from "../config/prisma.js";
import convertBigIntToString from "../utils/convertBigIntToString.js";

const createViewingRequest = async (req, res) => {
  try {
    const { propertyId, tenantId, landlordId, requestedDateTime } = req.body;
    console.log("Received viewing request:", req.body);

    // Validate required fields
    if (!propertyId || !tenantId || !landlordId || !requestedDateTime) {
      return res.status(400).json({
        error: "Missing required fields.",
        required: ["propertyId", "tenantId", "landlordId", "requestedDateTime"],
        received: { propertyId, tenantId, landlordId, requestedDateTime },
      });
    }

    // Validate propertyId is a valid number
    if (isNaN(propertyId)) {
      return res.status(400).json({ error: "Invalid propertyId format." });
    }

    // Convert propertyId to BigInt for Prisma
    const propertyIdBigInt = BigInt(propertyId);
    console.log("Converted propertyId to BigInt:", propertyIdBigInt);

    // Validate that the property exists
    console.log("Checking if property exists...");
    const property = await prisma.listings.findUnique({
      where: { id: propertyIdBigInt },
    });

    if (!property) {
      console.log("Property not found for ID:", propertyIdBigInt);
      return res.status(404).json({ error: "Property not found." });
    }
    console.log("Property found:", property.title);

    console.log("Creating viewing request with data:", {
      propertyId: propertyIdBigInt,
      tenantId,
      landlordId,
      requestedDateTime: new Date(requestedDateTime),
    });

    const viewingRequest = await prisma.viewingRequest.create({
      data: {
        propertyId: propertyIdBigInt,
        tenantId,
        landlordId,
        requestedDateTime: new Date(requestedDateTime),
      },
      include: {
        listings: true,
        tenant_profiles: true,
        landlord_profiles: true,
      },
    });

    console.log("Successfully created viewing request:", viewingRequest.id);
    res.status(201).json(convertBigIntToString(viewingRequest));
  } catch (error) {
    console.error("Error creating viewing request:", error);
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      meta: error.meta,
      stack: error.stack,
    });

    // Provide more specific error messages
    if (error.code === "P2002") {
      return res.status(409).json({
        error: "A viewing request for this property and tenant already exists.",
      });
    }
    if (error.code === "P2003") {
      return res
        .status(400)
        .json({ error: "Invalid property, tenant, or landlord ID." });
    }

    res.status(500).json({ error: "Failed to create viewing request." });
  }
};

const getViewingRequestsForLandlord = async (req, res) => {
  try {
    const { landlordId } = req.query;
    if (!landlordId) {
      return res.status(400).json({ error: "Missing landlordId." });
    }
    const requests = await prisma.viewingRequest.findMany({
      where: { landlordId },
      include: { listings: true, tenant_profiles: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(convertBigIntToString(requests));
  } catch (error) {
    console.error("Error fetching viewing requests for landlord:", error);
    res.status(500).json({ error: "Failed to fetch viewing requests." });
  }
};

const getViewingRequestsForTenant = async (req, res) => {
  try {
    const { tenantId } = req.query;
    console.log("🔄 Fetching viewing requests for tenant:", tenantId);

    if (!tenantId) {
      return res.status(400).json({ error: "Missing tenantId." });
    }

    const startTime = Date.now();

    // Test if the table exists first
    try {
      const tableExists = await prisma.$queryRaw`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'viewingRequest'
        );
      `;
      console.log("📋 Table exists check:", tableExists);
    } catch (tableError) {
      console.error("❌ Error checking if table exists:", tableError);
    }

    // First try with includes, if that fails, try without includes
    let requests;
    try {
      requests = await prisma.viewingRequest.findMany({
        where: { tenantId },
        include: {
          listings: {
            select: {
              id: true,
              title: true,
              address: true,
              city: true,
              state: true,
              price: true,
              type: true,
              images: true,
            },
          },
          landlord_profiles: {
            select: {
              id: true,
              full_name: true,
              email: true,
              phone: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    } catch (includeError) {
      console.log(
        "⚠️ Include query failed, trying without includes:",
        includeError.message
      );
      // Fallback to basic query without includes
      requests = await prisma.viewingRequest.findMany({
        where: { tenantId },
        orderBy: { createdAt: "desc" },
      });
    }

    const endTime = Date.now();

    console.log(
      `✅ Found ${requests.length} viewing requests in ${endTime - startTime}ms`
    );
    console.log("📊 Viewing requests data:", requests);

    res.json(convertBigIntToString(requests));
  } catch (error) {
    console.error("❌ Error fetching viewing requests for tenant:", error);
    console.error("❌ Error details:", {
      message: error.message,
      code: error.code,
      meta: error.meta,
      stack: error.stack,
    });
    res.status(500).json({ error: "Failed to fetch viewing requests." });
  }
};

const updateViewingRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, proposedDateTime } = req.body;
    if (!["Approved", "Declined", "Proposed", "Closed"].includes(status)) {
      return res.status(400).json({ error: "Invalid status." });
    }
    const updateData = { status };
    if (status === "Proposed" && proposedDateTime) {
      updateData.proposedDateTime = new Date(proposedDateTime);
    } else if (status === "Approved") {
      // If approving a proposed time, set requestedDateTime to proposedDateTime and clear proposedDateTime
      const req = await prisma.viewingRequest.findUnique({
        where: { id: parseInt(id) },
      });
      if (req && req.proposedDateTime) {
        updateData.requestedDateTime = req.proposedDateTime;
        updateData.proposedDateTime = null;
      }
    } else if (status !== "Proposed") {
      updateData.proposedDateTime = null;
    }
    const updated = await prisma.viewingRequest.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        listings: true,
        tenant_profiles: true,
        landlord_profiles: true,
      },
    });
    res.json(convertBigIntToString(updated));
  } catch (error) {
    console.error("Error updating viewing request status:", error);
    res.status(500).json({ error: "Failed to update viewing request status." });
  }
};

const getApprovedViewings = async (req, res) => {
  try {
    const { userId, role } = req.query;
    if (!userId || !role) {
      return res.status(400).json({ error: "Missing userId or role." });
    }
    let where = { status: "Approved" };
    if (role === "tenant") {
      where.tenantId = userId;
    } else if (role === "landlord") {
      where.landlordId = userId;
    } else {
      return res.status(400).json({ error: "Invalid role." });
    }
    const viewings = await prisma.viewingRequest.findMany({
      where,
      include: { listings: true },
      orderBy: { requestedDateTime: "asc" },
    });
    res.json(convertBigIntToString(viewings));
  } catch (error) {
    console.error("Error fetching approved viewings:", error);
    res.status(500).json({ error: "Failed to fetch approved viewings." });
  }
};

export default {
  createViewingRequest,
  getViewingRequestsForLandlord,
  getViewingRequestsForTenant,
  updateViewingRequestStatus,
  getApprovedViewings,
};
