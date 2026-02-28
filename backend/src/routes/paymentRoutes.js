import express from "express";
import multer from "multer";
import {
  createPayment,
  getPaymentsByTenant,
  getPaymentsByListing,
  updatePaymentStatus,
} from "../controllers/paymentController.js";
import { getIO } from "../config/socket.js";

const router = express.Router();

const upload = multer({ dest: "uploads/" }); // You can configure storage as needed

// Create a new payment (with file upload)
router.post("/", upload.single("proof"), createPayment);

// Get all payments for a tenant
router.get("/tenant/:tenantId", getPaymentsByTenant);

// Get all payments for a listing
router.get("/listing/:listingId", getPaymentsByListing);

// Update payment status (approve/reject)
router.patch('/:paymentId/status', (req, res) => {
  req.io = getIO();
  updatePaymentStatus(req, res);
});

export default router;
