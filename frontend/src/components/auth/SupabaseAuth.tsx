import { useEffect } from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Home } from "lucide-react";
import { getRedirectPath } from '@/utils/auth';

interface SupabaseAuthProps {
  redirectTo?: string;
}

export const SupabaseAuth = ({ 
  redirectTo 
}: SupabaseAuthProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Redirect if user is already authenticated
  useEffect(() => {
    if (user) {
      const redirectPath = getRedirectPath(user);
      navigate(redirectPath);
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Background Illustration */}
      <img
        src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80"
        alt="Roomzi background"
        className="absolute inset-0 w-full h-full object-cover opacity-30"
        style={{ zIndex: 0 }}
      />
      {/* Overlay for readability */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-100/60 to-indigo-200/60" style={{ zIndex: 1 }} />
      
      <div className="relative z-10 bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        {/* Roomzi Brand */}
        <div className="flex items-center justify-center mb-6">
          <Home className="text-roomzi-blue text-3xl mr-2" />
          <span className="text-3xl font-extrabold text-roomzi-blue select-none">
            Room
            <span className="text-yellow-400">zi</span>
          </span>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">
          Welcome to Roomzi
        </h2>
        <p className="text-gray-600 mb-6 text-center">
          Enter your email to sign in or create an account
        </p>

        {/* Supabase Auth UI - Magic Link Only */}
        <Auth
          supabaseClient={supabase}
          view="magic_link"
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: '#2563eb', // roomzi-blue
                  brandAccent: '#1d4ed8',
                  brandButtonText: 'white',
                  defaultButtonBackground: '#f8fafc',
                  defaultButtonBackgroundHover: '#f1f5f9',
                  inputBackground: 'white',
                  inputBorder: '#e2e8f0',
                  inputBorderHover: '#cbd5e1',
                  inputBorderFocus: '#2563eb',
                },
                space: {
                  spaceSmall: '4px',
                  spaceMedium: '8px',
                  spaceLarge: '16px',
                  labelBottomMargin: '8px',
                  anchorBottomMargin: '4px',
                  emailInputSpacing: '4px',
                  socialAuthSpacing: '4px',
                  buttonPadding: '10px 15px',
                  inputPadding: '10px 15px',
                },
                fontSizes: {
                  baseBodySize: '14px',
                  baseInputSize: '14px',
                  baseLabelSize: '14px',
                  baseButtonSize: '14px',
                },
                fonts: {
                  bodyFontFamily: `ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif`,
                  buttonFontFamily: `ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif`,
                  inputFontFamily: `ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif`,
                  labelFontFamily: `ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif`,
                },
                borderWidths: {
                  buttonBorderWidth: '1px',
                  inputBorderWidth: '1px',
                },
                radii: {
                  borderRadiusButton: '6px',
                  buttonBorderRadius: '6px',
                  inputBorderRadius: '6px',
                },
              },
            },
            className: {
              anchor: 'text-roomzi-blue hover:text-blue-800',
              button: 'bg-roomzi-blue hover:bg-blue-700 text-white font-semibold transition-colors',
              container: 'space-y-4',
              divider: 'text-gray-400',
              input: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-roomzi-blue focus:border-transparent',
              label: 'block text-sm font-medium text-gray-700 mb-1',
              loader: 'text-roomzi-blue',
              message: 'text-red-600 text-sm text-center',
            },
          }}
          theme="default"
          providers={['google', 'facebook']}
          redirectTo={redirectTo || `${window.location.origin}/auth/callback`}
          additionalData={{
            signup_source: 'web_app'
          }}
          localization={{
            variables: {
              magic_link: {
                email_label: 'Email address',
                button_label: 'Continue with Email',
                loading_button_label: 'Sending magic link...',
                link_text: 'Send a magic link to your email',
                confirmation_text: 'Check your email for the magic link',
              },
            },
          }}
          onlyThirdPartyProviders={false}
          showLinks={false}
        />

        {/* Info about magic links */}
        <div className="mt-6 p-3 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-800 text-center">
            🔗 We'll send you a secure magic link - no passwords needed!
          </p>
          <p className="text-xs text-blue-600 text-center mt-1">
            New users will automatically create an account
          </p>
        </div>
      </div>
    </div>
  );
}; 