import { prisma } from "../config/prisma.js";

// Helper function to convert BigInt to string for JSON serialization
const convertBigIntToString = (obj) => {
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj === 'bigint') {
    return obj.toString();
  }
  
  // Don't convert Date objects to strings
  if (obj instanceof Date) {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(convertBigIntToString);
  }
  
  if (typeof obj === 'object') {
    const converted = {};
    for (const [key, value] of Object.entries(obj)) {
      converted[key] = convertBigIntToString(value);
    }
    return converted;
  }
  
  return obj;
};

// Create a new payment request
export const createPayment = async (req, res) => {
  try {

    const { tenantId, amount, listingId, month } = req.body;
    
    // Validate required fields
    if (!tenantId || !amount || !listingId || !month) {
      return res.status(400).json({ 
        success: false, 
        error: 'tenantId, listingId, amount and month are required' 
      });
    }

    // Validate amount
    if (parseFloat(amount) <= 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Amount must be greater than 0' 
      });
    }

    // Validate listingId format
    if (isNaN(listingId) || listingId <= 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid listingId format' 
      });
    }

    const proofUrl = req.file ? `/uploads/${req.file.filename}` : null;
    
    const paymentRequest = await prisma.payment_requests.create({
      data: {
        tenantId,
        listingId: BigInt(listingId),
        amount: parseFloat(amount),
        status: "Pending",
        proofUrl,
        month: month || null,
      },
    });
    
    // Convert BigInt to string for JSON serialization
    const responseData = convertBigIntToString(paymentRequest);
    res.status(201).json({ success: true, payment: responseData });
  } catch (err) {
    console.error("Error creating payment request:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// Get all payment requests for a tenant
export const getPaymentsByTenant = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const paymentRequests = await prisma.payment_requests.findMany({
      where: { tenantId: tenantId },
      orderBy: { date: "desc" },
    });
    
    // Convert BigInt to string for JSON serialization
    const responseData = convertBigIntToString(paymentRequests);
    res.json({ success: true, payments: responseData });
  } catch (err) {
    console.error("Error fetching payment requests:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// Get all payment requests for a listing
export const getPaymentsByListing = async (req, res) => {
  try {
    const { listingId } = req.params;
    
    // Validate listingId format
    if (isNaN(listingId) || listingId <= 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid listingId format' 
      });
    }

    const paymentRequests = await prisma.payment_requests.findMany({
      where: { listingId: BigInt(listingId) },
      orderBy: { date: "desc" },
    });
    
    // Convert BigInt to string for JSON serialization
    const responseData = convertBigIntToString(paymentRequests);
    res.json({ success: true, payments: responseData });
  } catch (err) {
    console.error("Error fetching payment requests:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// Update payment request status (approve or reject)
export const updatePaymentStatus = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { status } = req.body;
    
    // Validate paymentId format
    if (!paymentId || isNaN(paymentId) || paymentId <= 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid payment ID format' 
      });
    }

    // Validate status
    if (!status || !['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid status. Must be one of: Pending, Approved, Rejected' 
      });
    }
    
    // Get the payment request to find the tenant ID
    const paymentRequest = await prisma.payment_requests.findUnique({
      where: { id: parseInt(paymentId) },
    });
    
    if (!paymentRequest) {
      return res.status(404).json({ success: false, error: 'Payment request not found' });
    }
    
    const updatedPayment = await prisma.payment_requests.update({
      where: { id: parseInt(paymentId) },
      data: { status },
    });
    
    const responseData = convertBigIntToString(updatedPayment);
    
    // Emit WebSocket event to notify tenant about payment status update
    if (req.io) {
      req.io.emit('payment-status-updated', {
        paymentId: paymentId,
        status: status,
        tenantId: paymentRequest.tenantId
      });
    }
    
    res.json({ success: true, payment: responseData });
  } catch (err) {
    console.error('Error updating payment status:', err);
    
    if (err.code === 'P2025') {
      return res.status(404).json({ 
        success: false, 
        error: 'Payment request not found' 
      });
    }
    
    res.status(500).json({ success: false, error: err.message });
  }
};