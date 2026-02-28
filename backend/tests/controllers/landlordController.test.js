import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { 
  getLandlords, 
  getLandlordById, 
  createLandlord, 
  updateLandlord, 
  deleteLandlord, 
  getLandlordListings 
} from '../../src/controllers/landlordController.js';

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

describe('Landlord Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRes.json.mockClear();
    mockRes.status.mockClear();
  });

  describe('getLandlords', () => {
    it('should return all landlords successfully', async () => {
      const mockLandlords = [
        {
          id: 'landlord-1',
          full_name: 'John Doe',
          email: 'john@example.com',
          phone: '+1234567890',
          created_at: new Date('2024-01-01'),
        },
        {
          id: 'landlord-2',
          full_name: 'Jane Smith',
          email: 'jane@example.com',
          phone: '+0987654321',
          created_at: new Date('2024-01-02'),
        },
      ];

      global.mockPrisma.landlord_profiles.findMany.mockResolvedValue(mockLandlords);

      await getLandlords(mockReq, mockRes);

      expect(global.mockPrisma.landlord_profiles.findMany).toHaveBeenCalledWith({
        orderBy: { created_at: 'desc' },
      });
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockLandlords,
        message: 'Landlords retrieved successfully',
      });
    });

    it('should handle database errors', async () => {
      const error = new Error('Database connection failed');
      global.mockPrisma.landlord_profiles.findMany.mockRejectedValue(error);

      await getLandlords(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Database connection failed',
        statusCode: 500,
      });
    });
  });

  describe('getLandlordById', () => {
    it('should return landlord by ID successfully', async () => {
      const mockLandlord = {
        id: 'landlord-1',
        full_name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        created_at: new Date('2024-01-01'),
      };

      mockReq.params = { id: 'landlord-1' };
      global.mockPrisma.landlord_profiles.findUnique.mockResolvedValue(mockLandlord);

      await getLandlordById(mockReq, mockRes);

      expect(global.mockPrisma.landlord_profiles.findUnique).toHaveBeenCalledWith({
        where: { id: 'landlord-1' },
      });
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockLandlord,
        message: 'Landlord retrieved successfully',
      });
    });

    it('should return 404 when landlord not found', async () => {
      mockReq.params = { id: 'non-existent-id' };
      global.mockPrisma.landlord_profiles.findUnique.mockResolvedValue(null);

      await getLandlordById(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Landlord not found',
        statusCode: 404,
      });
    });

    it('should handle invalid UUID format', async () => {
      mockReq.params = { id: 'invalid-uuid' };
      global.mockPrisma.landlord_profiles.findUnique.mockResolvedValue(null);

      await getLandlordById(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Landlord not found',
        statusCode: 404,
      });
    });
  });

  describe('createLandlord', () => {
    it('should create new landlord successfully', async () => {
      const landlordData = {
        id: 'landlord-1',
        full_name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
      };

      const createdLandlord = {
        id: 'landlord-1',
        full_name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        updated_at: new Date('2025-07-20T13:10:00.569Z'),
      };

      mockReq.body = landlordData;
      global.mockPrisma.landlord_profiles.upsert.mockResolvedValue(createdLandlord);

      await createLandlord(mockReq, mockRes);

      expect(global.mockPrisma.landlord_profiles.upsert).toHaveBeenCalledWith({
        where: { id: 'landlord-1' },
        update: expect.objectContaining({
          full_name: 'John Doe',
          email: 'john@example.com',
          phone: '+1234567890',
        }),
        create: expect.objectContaining({
          id: 'landlord-1',
          full_name: 'John Doe',
          email: 'john@example.com',
          phone: '+1234567890',
        }),
      });
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: createdLandlord,
        message: 'Landlord profile created/updated successfully',
      });
    });

    it('should handle missing required fields', async () => {
      const landlordData = {
        id: 'landlord-1',
        // Missing email
      };

      mockReq.body = landlordData;

      await createLandlord(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'id and email are required',
        statusCode: 400,
      });
    });

    it('should handle invalid email format', async () => {
      const landlordData = {
        id: 'landlord-1',
        full_name: 'John Doe',
        email: 'invalid-email',
        phone: '+1234567890',
      };

      mockReq.body = landlordData;
      global.mockPrisma.landlord_profiles.upsert.mockResolvedValue({
        id: 'landlord-1',
        full_name: 'John Doe',
        email: 'invalid-email',
        phone: '+1234567890',
      });

      await createLandlord(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          id: 'landlord-1',
          full_name: 'John Doe',
          email: 'invalid-email',
        }),
        message: 'Landlord profile created/updated successfully',
      });
    });

    it('should normalize documents array', async () => {
      const landlordData = {
        id: 'landlord-1',
        full_name: 'John Doe',
        email: 'john@example.com',
        documents: ['doc1.pdf', 'doc2.pdf'],
      };

      const expectedDocuments = [
        { displayName: 'doc1.pdf', path: 'doc1.pdf' },
        { displayName: 'doc2.pdf', path: 'doc2.pdf' },
      ];

      const createdLandlord = {
        id: 'landlord-1',
        full_name: 'John Doe',
        email: 'john@example.com',
        documents: expectedDocuments,
      };

      mockReq.body = landlordData;
      global.mockPrisma.landlord_profiles.upsert.mockResolvedValue(createdLandlord);

      await createLandlord(mockReq, mockRes);

      expect(global.mockPrisma.landlord_profiles.upsert).toHaveBeenCalledWith({
        where: { id: 'landlord-1' },
        update: expect.objectContaining({
          documents: { set: expectedDocuments },
        }),
        create: expect.objectContaining({
          documents: { set: expectedDocuments },
        }),
      });
    });
  });

  describe('updateLandlord', () => {


    it('should return 404 when updating non-existent landlord', async () => {
      mockReq.params = { id: 'non-existent-id' };
      mockReq.body = { full_name: 'John Updated' };
      global.mockPrisma.landlord_profiles.update.mockRejectedValue({ code: 'P2025' });

      await updateLandlord(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Landlord not found',
        statusCode: 404,
      });
    });
  });

  describe('deleteLandlord', () => {
    it('should delete landlord successfully', async () => {
      mockReq.params = { id: 'landlord-1' };
      global.mockPrisma.landlord_profiles.delete.mockResolvedValue({ id: 'landlord-1' });

      await deleteLandlord(mockReq, mockRes);

      expect(global.mockPrisma.landlord_profiles.delete).toHaveBeenCalledWith({
        where: { id: 'landlord-1' },
      });
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: null,
        message: 'Landlord deleted successfully',
      });
    });

    it('should return 404 when deleting non-existent landlord', async () => {
      mockReq.params = { id: 'non-existent-id' };
      global.mockPrisma.landlord_profiles.delete.mockRejectedValue({ code: 'P2025' });

      await deleteLandlord(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Landlord not found',
        statusCode: 404,
      });
    });
  });

  describe('getLandlordListings', () => {
    it('should return landlord listings successfully', async () => {
      const mockListings = [
        {
          id: BigInt(1),
          title: 'Property 1',
          address: '123 Main St',
          landlord_id: 'landlord-1',
          created_at: new Date('2024-01-01'),
        },
        {
          id: BigInt(2),
          title: 'Property 2',
          address: '456 Oak Ave',
          landlord_id: 'landlord-1',
          created_at: new Date('2024-01-02'),
        },
      ];

      mockReq.params = { id: 'landlord-1' };
      global.mockPrisma.listings.findMany.mockResolvedValue(mockListings);

      await getLandlordListings(mockReq, mockRes);

      expect(global.mockPrisma.listings.findMany).toHaveBeenCalledWith({
        where: { landlord_id: 'landlord-1' },
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

    it('should return 404 when landlord not found', async () => {
      mockReq.params = { id: 'non-existent-id' };
      global.mockPrisma.listings.findMany.mockResolvedValue([]);

      await getLandlordListings(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: [],
        message: 'Landlord listings retrieved successfully',
      });
    });
  });
}); 