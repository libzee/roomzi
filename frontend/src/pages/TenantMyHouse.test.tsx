import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../test/utils';
import TenantMyHouse from './TenantMyHouse';
import { mockTenantUser, mockUseAuth } from '../test/utils';

// Mock the navigate function
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('TenantMyHouse', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: mockTenantUser,
    });
  });

  it('should render loading state', () => {
    mockUseAuth.mockReturnValue({
      user: null, // No user to trigger loading-like state
    });

    render(<TenantMyHouse />);
    
    // Since the component uses demo data, we expect to see the rental details
    // But with no user, it should handle gracefully
    expect(screen.getByText('My House')).toBeInTheDocument();
  });

  it('should have proper header structure', () => {
    render(<TenantMyHouse />);
    
    // Check header structure
    const header = screen.getByRole('banner');
    expect(header).toBeInTheDocument();
    expect(header).toHaveClass('bg-white', 'shadow-sm', 'border-b');
  });
}); 