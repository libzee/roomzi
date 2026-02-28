import express from "express";
import {
  getListings,
  getListingById,
  createListing,
  updateListing,
  deleteListing,
  getListingsByLandlord,
  getListingsByTenant,
} from "../controllers/listingController.js";

const router = express.Router();

// GET /api/listings - Get all listings with filtering and pagination
router.get("/", getListings);

// GET /api/listings/:id - Get listing by ID
router.get("/:id", getListingById);

// POST /api/listings - Create new listing
router.post("/", createListing);

// PUT /api/listings/:id - Update listing
router.put("/:id", updateListing);

// DELETE /api/listings/:id - Delete listing
router.delete("/:id", deleteListing);

// GET /api/listings/landlord/:landlordId - Get landlord's listings
router.get("/landlord/:landlordId", getListingsByLandlord);

// GET /api/listings/tenant/:tenantId - Get tenant's listings
router.get("/tenant/:tenantId", getListingsByTenant);

export default router;
