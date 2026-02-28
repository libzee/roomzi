import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { STORAGE_KEYS, USER_ROLES, ROUTES, APP_METADATA } from '@/utils/constants';

export const useUserRole = () => {
  const { user } = useAuth();
  
  /**
   * Get current user role with fallback priority:
   * 1. localStorage (primary - most reliable)
   * 2. Supabase user metadata (fallback)
   */
  const getCurrentRole = (): 'tenant' | 'landlord' | null => {
    const localStorageRole = localStorage.getItem(STORAGE_KEYS.SELECTED_ROLE) as 'tenant' | 'landlord' | null;
    const metadataRole = user?.user_metadata?.role;
    
    // Prefer localStorage as primary source
    if (localStorageRole === USER_ROLES.TENANT || localStorageRole === USER_ROLES.LANDLORD) {
      return localStorageRole;
    }
    
    // Fallback to metadata if localStorage is empty
    if (metadataRole === USER_ROLES.TENANT || metadataRole === USER_ROLES.LANDLORD) {
      // Sync localStorage with metadata
      localStorage.setItem(STORAGE_KEYS.SELECTED_ROLE, metadataRole);
      return metadataRole;
    }
    
    return null;
  };
  
  /**
   * Set user role and update both Supabase metadata and localStorage
   */
  const setUserRole = async (role: 'tenant' | 'landlord') => {
    // Update localStorage immediately
    localStorage.setItem(STORAGE_KEYS.SELECTED_ROLE, role);
    
    // Update Supabase metadata
    try {
      await supabase.auth.updateUser({
        data: {
          role,
          signup_source: APP_METADATA.SIGNUP_SOURCE,
          profile_completed: true,
          updated_at: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Failed to update user metadata:', error);
      // Don't throw - localStorage update succeeded
    }
  };
  
  /**
   * Clear user role from both sources
   */
  const clearUserRole = async () => {
    localStorage.removeItem(STORAGE_KEYS.SELECTED_ROLE);
    
    try {
      await supabase.auth.updateUser({
        data: {
          role: null,
          profile_completed: false,
          updated_at: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Failed to clear user metadata:', error);
    }
  };
  
  /**
   * Get redirect path based on current role
   */
  const getRedirectPath = (): string => {
    const role = getCurrentRole();
    if (role === USER_ROLES.TENANT) return ROUTES.TENANT_DASHBOARD;
    if (role === USER_ROLES.LANDLORD) return ROUTES.LANDLORD_DASHBOARD;
    return ROUTES.ROLE_SELECTION;
  };
  
  const currentRole = getCurrentRole();
  
  return {
    currentRole,
    setUserRole,
    clearUserRole,
    getRedirectPath,
    hasRole: !!currentRole,
    isTenant: currentRole === USER_ROLES.TENANT,
    isLandlord: currentRole === USER_ROLES.LANDLORD
  };
}; 