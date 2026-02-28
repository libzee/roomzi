import { prisma } from "../config/prisma.js";
import path from "path";

// Helper to convert BigInt to string for JSON serialization
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

// Create a new maintenance request
export const createMaintenanceRequest = async (req, res) => {
  try {
    const { tenantId, landlordId, listingId, description } = req.body;
    let images = [];
    if (req.files && req.files.length > 0) {
      images = req.files.map(file => `/uploads/${file.filename}`);
    }
    const request = await prisma.maintenance_requests.create({
      data: {
        tenantId,
        landlordId,
        listingId: BigInt(listingId),
        description,
        images,
        status: "Pending",
      },
    });
    res.status(201).json({ success: true, request: convertBigIntToString(request) });
  } catch (err) {
    console.error("Error creating maintenance request:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// Get all requests for a tenant
export const getRequestsByTenant = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const requests = await prisma.maintenance_requests.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });

    console.log("Fetched requests from DB:", requests);

    res.json({ success: true, requests: convertBigIntToString(requests) });
  } catch (err) {
    console.error("Error fetching tenant maintenance requests:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// Get all requests for a landlord
export const getRequestsByLandlord = async (req, res) => {
  try {
    const { landlordId } = req.params;
    const requests = await prisma.maintenance_requests.findMany({
      where: { landlordId },
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, requests: convertBigIntToString(requests) });
  } catch (err) {
    console.error("Error fetching landlord maintenance requests:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// Update request status (landlord action)
export const updateRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, landlordcomment } = req.body;
    if (!['Pending', 'In Progress', 'Completed', 'Rejected'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }
    const updateData = { status };
    if (landlordcomment !== undefined) updateData.landlordcomment = landlordcomment;
    const updated = await prisma.maintenance_requests.update({
      where: { id: parseInt(id) },
      data: updateData,
    });
    res.json({ success: true, request: convertBigIntToString(updated) });
  } catch (err) {
    console.error("Error updating maintenance request status:", err);
    res.status(500).json({ success: false, error: err.message });
  }
}; 