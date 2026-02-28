import { jest } from '@jest/globals';

// Mock Prisma client
const mockPrisma = {
  landlord_profiles: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    upsert: jest.fn(),
    delete: jest.fn(),
  },
  tenant_profiles: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    upsert: jest.fn(),
    delete: jest.fn(),
  },
  listings: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  chats: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  },
  messages: {
    findMany: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  },
  payment_requests: {
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    findUnique: jest.fn(),
  },
  maintenance_requests: {
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  $disconnect: jest.fn(),
};

// Mock Supabase client
const mockSupabase = {
  storage: {
    from: jest.fn(() => ({
      upload: jest.fn(),
      remove: jest.fn(),
      getPublicUrl: jest.fn(),
    })),
    createBucket: jest.fn(),
    listBuckets: jest.fn(),
  },
};

// Mock Socket.IO
const mockIO = {
  to: jest.fn(() => ({
    emit: jest.fn(),
  })),
  emit: jest.fn(),
};

// Mock modules before they are imported
jest.mock('../src/config/prisma.js', () => ({
  prisma: mockPrisma,
}));

jest.mock('../src/config/supabase.js', () => ({
  supabase: mockSupabase,
}));

jest.mock('../src/config/socket.js', () => ({
  getIO: jest.fn(() => mockIO),
}));

// Global test utilities
global.mockPrisma = mockPrisma;
global.mockSupabase = mockSupabase;
global.mockIO = mockIO;

// Setup test environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_ANON_KEY = 'test-key';

// Clear all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
}); 