import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { 
  getListings, 
  getListingById, 
  createListing, 
  updateListing, 
  deleteListing, 
  getListingsByLandlord, 
  getListingsByTenant 
} from '../../src/controllers/listingController.js';

// Mock the response and request objects
const mockRes = {
  json: jest.fn().mockReturnThis(),
  status: jest.fn().mockReturnThis(),
};

const mockReq = {
  params: {},
  body: {},
  query: {},
};

describe('Listing Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRes.json.mockClear();
    mockRes.status.mockClear();
  });

  describe('getListings', () => {
    it('should return all listings with pagination', async () => {
      const mockListings = [
        {
          id: BigInt(1),
          title: 'Test Listing',
          price: 2500,
          available: true,
          landlord_profiles: {
            id: 'landlord-1',
            full_name: 'John Doe',
            email: 'john@example.com',
            phone: '+1234567890',
          },
          tenant_profiles: null,
        },
      ];

      mockReq.query = { page: '1', limit: '10' };
      global.mockPrisma.listings.findMany.mockResolvedValue(mockListings);
      global.mockPrisma.listings.count.mockResolvedValue(1);

      await getListings(mockReq, mockRes);

      expect(global.mockPrisma.listings.findMany).toHaveBeenCalledWith({
        where: { available: true },
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
        orderBy: { created_at: 'desc' },
        skip: 0,
        take: 10,
      });
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: expect.arrayContaining([
          expect.objectContaining({
            id: '1',
            title: 'Test Listing',
            price: 2500,
          }),
        ]),
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      });
    });

    it('should filter listings by type', async () => {
      const mockListings = [
        {
          id: BigInt(1),
          title: 'Apartment Listing',
          type: 'Apartment',
          available: true,
        },
      ];

      mockReq.query = { type: 'Apartment' };
      global.mockPrisma.listings.findMany.mockResolvedValue(mockListings);
      global.mockPrisma.listings.count.mockResolvedValue(1);

      await getListings(mockReq, mockRes);

      expect(global.mockPrisma.listings.findMany).toHaveBeenCalledWith({
        where: {
          available: true,
          type: { contains: 'Apartment', mode: 'insensitive' },
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
          tenant_profiles: {
            select: {
              id: true,
              full_name: true,
              email: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
        skip: 0,
        take: 10,
      });
    });

    it('should include unavailable listings when available=false', async () => {
      const mockListings = [
        {
          id: BigInt(1),
          title: 'Unavailable Listing',
          available: false,
        },
      ];

      mockReq.query = { available: 'false' };
      global.mockPrisma.listings.findMany.mockResolvedValue(mockListings);
      global.mockPrisma.listings.count.mockResolvedValue(1);

      await getListings(mockReq, mockRes);

      expect(global.mockPrisma.listings.findMany).toHaveBeenCalledWith({
        where: {},
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
        orderBy: { created_at: 'desc' },
        skip: 0,
        take: 10,
      });
    });

    it('should handle database errors', async () => {
      const error = new Error('Database connection failed');
      global.mockPrisma.listings.findMany.mockRejectedValue(error);

      await getListings(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Database connection failed',
        statusCode: 500,
      });
    });
  });

  describe('getListingById', () => {


    it('should return 404 when listing not found', async () => {
      mockReq.params = { id: '999' };
      global.mockPrisma.listings.findUnique.mockResolvedValue(null);

      await getListingById(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Listing not found',
        statusCode: 404,
      });
    });

    it('should handle invalid listing ID', async () => {
      mockReq.params = { id: 'invalid-id' };
      global.mockPrisma.listings.findUnique.mockRejectedValue(new Error('Cannot convert invalid-id to a BigInt'));

      await getListingById(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Cannot convert invalid-id to a BigInt',
        statusCode: 500,
      });
    });
  });

  describe('createListing', () => {
    it('should create listing successfully', async () => {
      const listingData = {
        landlord_id: 'landlord-1',
        title: 'New Apartment',
        type: 'Apartment',
        address: '123 New St',
        city: 'Toronto',
        state: 'ON',
        zip_code: 'M5V 3A8',
        bedrooms: 2,
        bathrooms: 1,
        area: 900,
        price: 2500,
        description: 'Beautiful apartment',
        lease_type: '12 months',
        amenities: ['Parking', 'Gym'],
        requirements: 'Good credit',
        house_rules: 'No smoking',
        images: ['image1.jpg'],
        landlord_name: 'John Doe',
        landlord_phone: '+1234567890',
        coordinates: '43.6532,-79.3832',
      };

      const createdListing = {
        id: BigInt(1),
        ...listingData,
        available: true,
        landlord_profiles: {
          id: 'landlord-1',
          full_name: 'John Doe',
          email: 'john@example.com',
          phone: '+1234567890',
        },
      };

      mockReq.body = listingData;
      global.mockPrisma.listings.create.mockResolvedValue(createdListing);

      await createListing(mockReq, mockRes);

      expect(global.mockPrisma.listings.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          landlord_id: 'landlord-1',
          title: 'New Apartment',
          type: 'Apartment',
          price: 2500,
        }),
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
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          id: '1',
          title: 'New Apartment',
          price: 2500,
        }),
        message: 'Listing created successfully',
      });
    });

    it('should handle missing landlord_id', async () => {
      const listingData = {
        title: 'New Apartment',
        type: 'Apartment',
        price: 2500,
      };

      mockReq.body = listingData;
      global.mockPrisma.listings.create.mockResolvedValue({
        id: BigInt(1),
        ...listingData,
      });

      await createListing(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          id: '1',
          title: 'New Apartment',
        }),
        message: 'Listing created successfully',
      });
    });

    it('should create basic landlord profile if not exists', async () => {
      const listingData = {
        landlord_id: 'new-landlord',
        title: 'New Apartment',
        type: 'Apartment',
        price: 2500,
      };

      mockReq.body = listingData;
      global.mockPrisma.listings.create.mockResolvedValue({
        id: BigInt(1),
        ...listingData,
        landlord_profiles: null,
      });

      await createListing(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          id: '1',
          title: 'New Apartment',
        }),
        message: 'Listing created successfully',
      });
    });

    it('should handle invalid coordinates format', async () => {
      const listingData = {
        landlord_id: 'landlord-1',
        title: 'New Apartment',
        type: 'Apartment',
        price: 2500,
        coordinates: 'invalid-coordinates',
      };

      mockReq.body = listingData;
      global.mockPrisma.listings.create.mockResolvedValue({
        id: BigInt(1),
        ...listingData,
      });

      await createListing(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          id: '1',
          title: 'New Apartment',
        }),
        message: 'Listing created successfully',
      });
    });
  });

  describe('updateListing', () => {


    it('should return 404 when listing not found', async () => {
      mockReq.params = { id: '999' };
      mockReq.body = { title: 'Updated' };
      global.mockPrisma.listings.update.mockRejectedValue({ code: 'P2025' });

      await updateListing(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Listing not found',
        statusCode: 404,
      });
    });

    it('should handle invalid listing ID', async () => {
      mockReq.params = { id: 'invalid-id' };
      mockReq.body = { title: 'Updated' };
      global.mockPrisma.listings.update.mockRejectedValue(new Error('Invalid ID'));

      await updateListing(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid ID',
        statusCode: 500,
      });
    });
  });

  describe('deleteListing', () => {
    it('should delete listing successfully', async () => {
      mockReq.params = { id: '1' };
      global.mockPrisma.listings.delete.mockResolvedValue({ id: BigInt(1) });

      await deleteListing(mockReq, mockRes);

      expect(global.mockPrisma.listings.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      });
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: null,
        message: 'Listing deleted successfully',
      });
    });

    it('should return 404 when listing not found', async () => {
      mockReq.params = { id: '999' };
      global.mockPrisma.listings.delete.mockRejectedValue({ code: 'P2025' });

      await deleteListing(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Listing not found',
        statusCode: 404,
      });
    });
  });

  describe('getListingsByLandlord', () => {
    it('should return landlord listings successfully', async () => {
      const mockListings = [
        {
          id: BigInt(1),
          title: 'Property 1',
          landlord_id: 'landlord-1',
          tenant_profiles: null,
        },
        {
          id: BigInt(2),
          title: 'Property 2',
          landlord_id: 'landlord-1',
          tenant_profiles: null,
        },
      ];

      mockReq.params = { landlordId: 'landlord-1' };
      global.mockPrisma.listings.findMany.mockResolvedValue(mockListings);

      await getListingsByLandlord(mockReq, mockRes);

      expect(global.mockPrisma.listings.findMany).toHaveBeenCalledWith({
        where: { landlord_id: 'landlord-1', available: true },
        include: {
          tenant_profiles: {
            select: {
              id: true,
              full_name: true,
              email: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
      });
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: expect.arrayContaining([
          expect.objectContaining({
            id: '1',
            title: 'Property 1',
            landlord_id: 'landlord-1',
          }),
          expect.objectContaining({
            id: '2',
            title: 'Property 2',
            landlord_id: 'landlord-1',
          }),
        ]),
        message: 'Landlord listings retrieved successfully',
      });
    });
  });

  describe('getListingsByTenant', () => {
    it('should return tenant listings successfully', async () => {
      const mockListings = [
        {
          id: BigInt(1),
          title: 'Property 1',
          tenant_id: 'tenant-1',
          landlord_profiles: {
            id: 'landlord-1',
            full_name: 'John Doe',
            email: 'john@example.com',
            phone: '+1234567890',
          },
        },
      ];

      mockReq.params = { tenantId: 'tenant-1' };
      global.mockPrisma.listings.findMany.mockResolvedValue(mockListings);

      await getListingsByTenant(mockReq, mockRes);

      expect(global.mockPrisma.listings.findMany).toHaveBeenCalledWith({
        where: { tenant_id: 'tenant-1' },
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
        orderBy: { created_at: 'desc' },
      });
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: expect.arrayContaining([
          expect.objectContaining({
            id: '1',
            title: 'Property 1',
            tenant_id: 'tenant-1',
          }),
        ]),
        message: 'Tenant listings retrieved successfully',
      });
    });
  });
}); 