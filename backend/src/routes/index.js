import express from "express";
import landlordRoutes from "./landlordRoutes.js";
import tenantRoutes from "./tenantRoutes.js";
import listingRoutes from "./listingRoutes.js";
import chatRoutes from "./chatRoutes.js";
import paymentRoutes from "./paymentRoutes.js";
import viewingRoutes from "./viewingRoutes.js";
import leaseRoutes from "./leaseRoutes.js";
import notificationRoutes from "./notificationRoutes.js";
import { createListing, getListings } from "../controllers/landlordController.js";

const router = express.Router();

// Create landlord router
const landlordRouter = express.Router();

// Health check
router.get("/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Server is running",
    environment: process.env.NODE_ENV,
    frontendUrl: process.env.FRONTEND_URL,
  });
});

// Mount routes
router.use("/landlords", landlordRoutes);
router.use("/tenants", tenantRoutes);
router.use("/listings", listingRoutes);
router.use("/chats", chatRoutes);
router.use("/payments", paymentRoutes);
router.use("/viewings", viewingRoutes);
router.use("/notifications", notificationRoutes);

router.use("/leases", leaseRoutes);
router.use("/landlord", landlordRouter);
router.use("/leases", leaseRoutes);

landlordRouter.post("/create-listing", createListing);
landlordRouter.get("/get-listings/:id", getListings);

export default router;
