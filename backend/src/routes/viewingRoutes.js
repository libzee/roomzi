import express from "express";
import viewingController from "../controllers/viewingController.js";

const router = express.Router();

// POST /api/viewings - Create a new viewing request
router.post("/", viewingController.createViewingRequest);
// GET /api/viewings?landlordId= - Get all viewing requests for a landlord
router.get("/", viewingController.getViewingRequestsForLandlord);
// GET /api/viewings/tenant?tenantId= - Get all viewing requests for a tenant
router.get("/tenant", viewingController.getViewingRequestsForTenant);
// GET /api/viewings/approved?userId=&role= - Get approved viewings for a user
router.get("/approved", viewingController.getApprovedViewings);
// PATCH /api/viewings/:id - Approve or decline a viewing request
router.patch("/:id", viewingController.updateViewingRequestStatus);

export default router;
