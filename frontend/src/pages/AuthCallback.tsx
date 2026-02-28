import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { Home, Loader2 } from "lucide-react";
import { getRedirectPath } from '@/utils/auth';

export const AuthCallback = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the session from the URL
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          setError('Authentication failed. Please try again.');
          return;
        }

        if (data.session?.user) {
          const user = data.session.user;
          const userRoleFromAuth = user.user_metadata?.role;
          
          console.log('Auth callback - User:', user);
          console.log('Auth callback - Role from metadata:', userRoleFromAuth);

          // Redirect based on user role
          const redirectPath = getRedirectPath(user);
          console.log('Redirecting to:', redirectPath);
          navigate(redirectPath);
        } else {
          // No session, redirect to auth
          navigate('/auth');
        }
      } catch (error) {
        console.error('Error in auth callback:', error);
        setError('Something went wrong. Please try logging in again.');
      } finally {
        setLoading(false);
      }
    };

    handleAuthCallback();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
          {/* Roomzi Brand */}
          <div className="flex items-center justify-center mb-6">
            <Home className="text-roomzi-blue text-3xl mr-2" />
            <span className="text-3xl font-extrabold text-roomzi-blue select-none">
              Room
              <span className="text-yellow-400">zi</span>
            </span>
          </div>

          <div className="flex items-center justify-center mb-4">
            <Loader2 className="animate-spin text-roomzi-blue text-2xl" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Completing authentication...
          </h2>
          <p className="text-gray-600">
            Please wait while we set up your account.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
          {/* Roomzi Brand */}
          <div className="flex items-center justify-center mb-6">
            <Home className="text-roomzi-blue text-3xl mr-2" />
            <span className="text-3xl font-extrabold text-roomzi-blue select-none">
              Room
              <span className="text-yellow-400">zi</span>
            </span>
          </div>

          <div className="text-red-500 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Authentication Error
          </h2>
          <p className="text-gray-600 mb-6">
            {error}
          </p>
          
          <button
            onClick={() => navigate('/auth')}
            className="w-full bg-roomzi-blue text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return null;
};
