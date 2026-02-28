import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../test/utils';
import Map from './Map';
import { mockListing } from '../test/utils';

// Mock mapbox-gl
vi.mock('mapbox-gl', () => ({
  default: {
    Map: vi.fn().mockImplementation(() => ({
      addControl: vi.fn(),
      on: vi.fn(),
      setCenter: vi.fn(),
      setZoom: vi.fn(),
      fitBounds: vi.fn(),
      remove: vi.fn(),
    })),
    accessToken: '',
    NavigationControl: vi.fn(),
    Marker: vi.fn().mockImplementation(() => ({
      setLngLat: vi.fn().mockReturnThis(),
      addTo: vi.fn().mockReturnThis(),
    })),
    LngLatBounds: vi.fn().mockImplementation(() => ({
      extend: vi.fn(),
      getWest: vi.fn(() => -80),
      getEast: vi.fn(() => -78),
      getNorth: vi.fn(() => 44),
      getSouth: vi.fn(() => 42),
    })),
  },
}));

// Mock geolocation
const mockGeolocation = {
  getCurrentPosition: vi.fn(),
  watchPosition: vi.fn(),
  clearWatch: vi.fn(),
};

Object.defineProperty(navigator, 'geolocation', {
  value: mockGeolocation,
  writable: true,
});

// Mock properties data
const mockProperties = [
  {
    ...mockListing,
    id: '1',
    title: 'Downtown Apartment',
    price: 2500,
    coordinates: { lat: 43.6532, lng: -79.3832 },
    city: 'Toronto',
    bedrooms: 2,
    bathrooms: 1,
    landlord_id: 'landlord-1',
    lease_type: 'long-term' as const,
    requirements: [],
    house_rules: [],
    type: 'apartment' as const,
    images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop'],
  },
  {
    ...mockListing,
    id: '2',
    title: 'Suburban House',
    price: 3500,
    coordinates: { lat: 43.5890, lng: -79.6441 },
    city: 'Mississauga',
    bedrooms: 3,
    bathrooms: 2,
    landlord_id: 'landlord-2',
    lease_type: 'long-term' as const,
    requirements: [],
    house_rules: [],
    type: 'house' as const,
    images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop'],
  },
];

describe('Map Component', () => {
  const mockOnPropertyClick = vi.fn();
  const mockOnTokenSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset geolocation mock
    mockGeolocation.getCurrentPosition.mockClear();
  });

  it('should render token input form when no mapbox token is provided', () => {
    render(
      <Map
        properties={mockProperties}
        onPropertyClick={mockOnPropertyClick}
        onTokenSubmit={mockOnTokenSubmit}
      />
    );

    expect(screen.getByText('Map View Requires Mapbox Token')).toBeInTheDocument();
    expect(screen.getByText(/To use the map functionality/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Enter your Mapbox public token/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Load Map/i })).toBeInTheDocument();
  });

  it('should handle token submission', async () => {
    render(
      <Map
        properties={mockProperties}
        onPropertyClick={mockOnPropertyClick}
        onTokenSubmit={mockOnTokenSubmit}
      />
    );

    const tokenInput = screen.getByPlaceholderText(/Enter your Mapbox public token/);
    const submitButton = screen.getByRole('button', { name: /Load Map/i });

    fireEvent.change(tokenInput, { target: { value: 'test-token-123' } });
    fireEvent.click(submitButton);

    expect(mockOnTokenSubmit).toHaveBeenCalledWith('test-token-123');
  });

  it('should render map container when token is provided', () => {
    render(
      <Map
        properties={mockProperties}
        onPropertyClick={mockOnPropertyClick}
        mapboxToken="test-token"
        onTokenSubmit={mockOnTokenSubmit}
      />
    );

    // Should not show token input form
    expect(screen.queryByText('Map View Requires Mapbox Token')).not.toBeInTheDocument();
    
    // Should render map container
    const mapContainer = document.querySelector('[class*="absolute inset-0"]');
    expect(mapContainer).toBeInTheDocument();
  });

  it('should show location button when showUserLocation is true', () => {
    render(
      <Map
        properties={mockProperties}
        onPropertyClick={mockOnPropertyClick}
        mapboxToken="test-token"
        showUserLocation={true}
      />
    );

    const locationButton = screen.getByTitle('Get my location');
    expect(locationButton).toBeInTheDocument();
  });

  it('should not show location button when showUserLocation is false', () => {
    render(
      <Map
        properties={mockProperties}
        onPropertyClick={mockOnPropertyClick}
        mapboxToken="test-token"
        showUserLocation={false}
      />
    );

    const locationButton = screen.queryByTitle('Get my location');
    expect(locationButton).not.toBeInTheDocument();
  });

  it('should handle geolocation success', async () => {
    const mockPosition = {
      coords: {
        latitude: 43.6532,
        longitude: -79.3832,
      },
    };

    mockGeolocation.getCurrentPosition.mockImplementation((success) => {
      success(mockPosition);
    });

    render(
      <Map
        properties={mockProperties}
        onPropertyClick={mockOnPropertyClick}
        mapboxToken="test-token"
        showUserLocation={true}
      />
    );

    await waitFor(() => {
      expect(mockGeolocation.getCurrentPosition).toHaveBeenCalled();
    });
  });

  it('should handle geolocation permission denied error', async () => {
    const mockError = {
      code: 1, // PERMISSION_DENIED
      message: 'User denied geolocation',
    };

    mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
      error(mockError);
    });

    render(
      <Map
        properties={mockProperties}
        onPropertyClick={mockOnPropertyClick}
        mapboxToken="test-token"
        showUserLocation={true}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/An unknown error occurred getting location/)).toBeInTheDocument();
    });
  });

  it('should handle geolocation timeout error', async () => {
    const mockError = {
      code: 3, // TIMEOUT
      message: 'Location request timed out',
    };

    mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
      error(mockError);
    });

    render(
      <Map
        properties={mockProperties}
        onPropertyClick={mockOnPropertyClick}
        mapboxToken="test-token"
        showUserLocation={true}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/An unknown error occurred getting location/)).toBeInTheDocument();
    });
  });

  it('should handle geolocation not supported', async () => {
    // Mock navigator.geolocation as undefined
    Object.defineProperty(navigator, 'geolocation', {
      value: undefined,
      writable: true,
    });

    render(
      <Map
        properties={mockProperties}
        onPropertyClick={mockOnPropertyClick}
        mapboxToken="test-token"
        showUserLocation={true}
      />
    );

    // Trigger location request by clicking the button
    const locationButton = screen.getByTitle('Get my location');
    fireEvent.click(locationButton);

    await waitFor(() => {
      expect(screen.getByText(/Geolocation is not supported/)).toBeInTheDocument();
    });
  });

  it('should handle empty properties array', () => {
    render(
      <Map
        properties={[]}
        onPropertyClick={mockOnPropertyClick}
        mapboxToken="test-token"
      />
    );

    // Should still render map container
    const mapContainer = document.querySelector('[class*="absolute inset-0"]');
    expect(mapContainer).toBeInTheDocument();
  });

  it('should handle properties without coordinates', () => {
    const propertiesWithoutCoordinates = [
      {
        ...mockListing,
        id: '1',
        title: 'No Coordinates Property',
        price: 2000,
        coordinates: null,
        landlord_id: 'landlord-1',
        lease_type: 'long-term' as const,
        requirements: [],
        house_rules: [],
        type: 'apartment' as const,
        images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop'],
      },
    ];

    render(
      <Map
        properties={propertiesWithoutCoordinates}
        onPropertyClick={mockOnPropertyClick}
        mapboxToken="test-token"
      />
    );

    // Should still render map container
    const mapContainer = document.querySelector('[class*="absolute inset-0"]');
    expect(mapContainer).toBeInTheDocument();
  });

  it('should handle token input validation', () => {
    render(
      <Map
        properties={mockProperties}
        onPropertyClick={mockOnPropertyClick}
        onTokenSubmit={mockOnTokenSubmit}
      />
    );

    const tokenInput = screen.getByPlaceholderText(/Enter your Mapbox public token/);
    const submitButton = screen.getByRole('button', { name: /Load Map/i });

    // Try to submit empty token
    fireEvent.change(tokenInput, { target: { value: '   ' } });
    fireEvent.click(submitButton);

    expect(mockOnTokenSubmit).not.toHaveBeenCalled();

    // Submit valid token
    fireEvent.change(tokenInput, { target: { value: 'valid-token' } });
    fireEvent.click(submitButton);

    expect(mockOnTokenSubmit).toHaveBeenCalledWith('valid-token');
  });

  it('should render Mapbox attribution link', () => {
    render(
      <Map
        properties={mockProperties}
        onPropertyClick={mockOnPropertyClick}
        onTokenSubmit={mockOnTokenSubmit}
      />
    );

    const mapboxLink = screen.getByText('mapbox.com');
    expect(mapboxLink).toBeInTheDocument();
    expect(mapboxLink).toHaveAttribute('href', 'https://mapbox.com');
    expect(mapboxLink).toHaveAttribute('target', '_blank');
    expect(mapboxLink).toHaveAttribute('rel', 'noopener noreferrer');
  });
}); 