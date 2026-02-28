import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '../../test/utils';
import { SupabaseAuth } from './SupabaseAuth';
import { mockUseAuth } from '../../test/utils';

// Mock the supabase client
vi.mock('../../lib/supabaseClient', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signInWithOAuth: vi.fn(),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
  },
}));

// Mock the navigate function
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('SupabaseAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock useAuth to return null user by default
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      signInWithMagicLink: vi.fn(),
      signUpWithMagicLink: vi.fn(),
      signOut: vi.fn(),
    });
  });

  it('should render sign in form by default', () => {
    render(<SupabaseAuth />);
    
    expect(screen.getByText('Welcome to Roomzi')).toBeInTheDocument();
    expect(screen.getByText('Enter your email to sign in or create an account')).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /continue with email/i })).toBeInTheDocument();
  });

  it('should show magic link info', () => {
    render(<SupabaseAuth />);
    
    expect(screen.getByText(/we'll send you a secure magic link/i)).toBeInTheDocument();
    expect(screen.getByText(/new users will automatically create an account/i)).toBeInTheDocument();
  });

  it('should redirect authenticated users', () => {
    // Mock useAuth to return a user
    mockUseAuth.mockReturnValue({
      user: { id: '123', email: 'test@example.com' },
      loading: false,
      signInWithMagicLink: vi.fn(),
      signUpWithMagicLink: vi.fn(),
      signOut: vi.fn(),
    });

    render(<SupabaseAuth />);
    
    // Should redirect to role selection for authenticated users
    expect(mockNavigate).toHaveBeenCalledWith('/role-selection');
  });
}); 