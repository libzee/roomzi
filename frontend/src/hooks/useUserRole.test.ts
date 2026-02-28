import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useUserRole } from './useUserRole';
import { mockLocalStorage } from '../test/utils';

// Mock the useAuth hook
const mockUseAuth = vi.fn();
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock the supabase client
vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    auth: {
      updateUser: vi.fn(),
      getUser: vi.fn(),
    },
  },
}));

// Mock localStorage
const originalLocalStorage = global.localStorage;
Object.defineProperty(global, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

describe('useUserRole', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.clear();
    // Mock useAuth to return a default user
    mockUseAuth.mockReturnValue({
      user: { id: 'test-user', email: 'test@example.com' },
      loading: false,
      signInWithMagicLink: vi.fn(),
      signUpWithMagicLink: vi.fn(),
      signOut: vi.fn(),
    });
  });

  afterEach(() => {
    mockLocalStorage.clear();
  });

  describe('getCurrentRole', () => {
    it('should return role from localStorage if available', () => {
      mockLocalStorage.setItem('roomzi_selected_role', 'tenant');
      
      const { result } = renderHook(() => useUserRole());
      
      expect(result.current.currentRole).toBe('tenant');
    });

    it('should return null if no role in localStorage', () => {
      const { result } = renderHook(() => useUserRole());
      
      expect(result.current.currentRole).toBeNull();
    });

    it('should return null for invalid role in localStorage', () => {
      mockLocalStorage.setItem('roomzi_selected_role', 'invalid-role');
      
      const { result } = renderHook(() => useUserRole());
      
      expect(result.current.currentRole).toBeNull();
    });
  });

  describe('getRedirectPath', () => {
    it('should return tenant dashboard path for tenant role', () => {
      mockLocalStorage.setItem('roomzi_selected_role', 'tenant');
      
      const { result } = renderHook(() => useUserRole());
      
      expect(result.current.getRedirectPath()).toBe('/tenant');
    });

    it('should return landlord dashboard path for landlord role', () => {
      mockLocalStorage.setItem('roomzi_selected_role', 'landlord');
      
      const { result } = renderHook(() => useUserRole());
      
      expect(result.current.getRedirectPath()).toBe('/landlord');
    });

    it('should return role selection path for no role', () => {
      const { result } = renderHook(() => useUserRole());
      
      expect(result.current.getRedirectPath()).toBe('/role-selection');
    });

    it('should return role selection path for invalid role', () => {
      mockLocalStorage.setItem('roomzi_selected_role', 'invalid-role');
      
      const { result } = renderHook(() => useUserRole());
      
      expect(result.current.getRedirectPath()).toBe('/role-selection');
    });
  });

  describe('role properties', () => {
    it('should have correct role properties for tenant', () => {
      mockLocalStorage.setItem('roomzi_selected_role', 'tenant');
      
      const { result } = renderHook(() => useUserRole());
      
      expect(result.current.hasRole).toBe(true);
      expect(result.current.isTenant).toBe(true);
      expect(result.current.isLandlord).toBe(false);
    });

    it('should have correct role properties for landlord', () => {
      mockLocalStorage.setItem('roomzi_selected_role', 'landlord');
      
      const { result } = renderHook(() => useUserRole());
      
      expect(result.current.hasRole).toBe(true);
      expect(result.current.isTenant).toBe(false);
      expect(result.current.isLandlord).toBe(true);
    });

    it('should have correct role properties for no role', () => {
      const { result } = renderHook(() => useUserRole());
      
      expect(result.current.hasRole).toBe(false);
      expect(result.current.isTenant).toBe(false);
      expect(result.current.isLandlord).toBe(false);
    });
  });
}); 