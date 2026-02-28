import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock the AuthContext
const mockUseAuth = vi.fn();
const MockAuthProvider = ({ children }: { children: React.ReactNode }) => {
  return <div data-testid="auth-provider">{children}</div>;
};

// Mock the SocketContext
const mockUseSocket = vi.fn();
const MockSocketProvider = ({ children }: { children: React.ReactNode }) => {
  return <div data-testid="socket-provider">{children}</div>;
};

vi.mock('../context/AuthContext', () => ({
  AuthProvider: MockAuthProvider,
  useAuth: () => mockUseAuth(),
}));

vi.mock('../context/SocketContext', () => ({
  SocketProvider: MockSocketProvider,
  useSocket: () => mockUseSocket(),
}));

// Create a test query client for each test
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

interface AllTheProvidersProps {
  children: React.ReactNode;
}

const AllTheProviders = ({ children }: AllTheProvidersProps) => {
  const queryClient = createTestQueryClient();

  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <MockAuthProvider>
          <MockSocketProvider>
            {children}
          </MockSocketProvider>
        </MockAuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
};

const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// Mock user objects for testing
export const mockTenantUser = {
  id: 'test-tenant-id',
  email: 'tenant@test.com',
  user_metadata: {
    role: 'tenant',
    full_name: 'Test Tenant',
  },
  app_metadata: {},
  aud: 'authenticated',
  created_at: '2024-01-01T00:00:00Z',
};

export const mockLandlordUser = {
  id: 'test-landlord-id',
  email: 'landlord@test.com',
  user_metadata: {
    role: 'landlord',
    full_name: 'Test Landlord',
  },
  app_metadata: {},
  aud: 'authenticated',
  created_at: '2024-01-01T00:00:00Z',
};

// Mock listing data
export const mockListing = {
  id: '1',
  title: 'Test Listing',
  type: 'Apartment',
  address: '123 Test St',
  city: 'Test City',
  state: 'TS',
  zip_code: '12345',
  bedrooms: 2,
  bathrooms: 1,
  area: 900,
  price: 2500,
  description: 'Test description',
  amenities: ['Parking', 'Gym'],
  landlord_name: 'Test Landlord',
  landlord_phone: '+1234567890',
  available: true,
  images: '["https://test.com/image1.jpg"]',
  coordinates: '40.7128,-74.0060',
};

// Mock chat data
export const mockChat = {
  id: 'chat-1',
  tenant_id: 'test-tenant-id',
  landlord_id: 'test-landlord-id',
  property_id: '1',
  tenantName: 'Test Tenant',
  landlordName: 'Test Landlord',
  propertyTitle: 'Test Property',
  messages: [
    {
      id: 'msg-1',
      content: 'Hello!',
      sender_type: 'tenant' as const,
      created_at: '2024-01-01T00:00:00Z',
    },
  ],
};

// Helper function to wait for async operations
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0));

// Helper to mock localStorage
export const mockLocalStorage = {
  store: {} as Record<string, string>,
  setItem: (key: string, value: string) => {
    mockLocalStorage.store[key] = value;
  },
  getItem: (key: string) => mockLocalStorage.store[key] || null,
  removeItem: (key: string) => {
    delete mockLocalStorage.store[key];
  },
  clear: () => {
    mockLocalStorage.store = {};
  },
};

// Re-export everything
export * from '@testing-library/react';
export { customRender as render };
export { createTestQueryClient };
export { mockUseAuth, mockUseSocket }; 