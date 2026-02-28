import express from "express";
import multer from "multer";
import { 
  createMaintenanceRequest, 
  getRequestsByTenant, 
  getRequestsByLandlord, 
  updateRequestStatus 
} from "../controllers/maintenanceController.js";

const router = express.Router();

// Set up multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  },
});
const upload = multer({ storage });

// Create a new maintenance request (with images)
router.post("/", upload.array("images", 5), createMaintenanceRequest);

// Get all requests for a tenant
router.get("/tenant/:tenantId", getRequestsByTenant);

// Get all requests for a landlord
router.get("/landlord/:landlordId", getRequestsByLandlord);

// Update request status
router.patch("/:id", updateRequestStatus);

export default router; 