import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Home, User, Users, Loader2 } from 'lucide-react';
import { useUserRole } from '@/hooks/useUserRole';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { profileUtils, ApiError } from '@/utils/api';
import { validateUserData, updateUserMetadata } from '@/utils/auth';

const RoleSelection = () => {
  const navigate = useNavigate();
  const { setUserRole, clearUserRole } = useUserRole();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'tenant' | 'landlord' | null>(null);

  // Clear any existing role when user comes to role selection
  useEffect(() => {
    clearUserRole();
  }, [clearUserRole]);

  // Redirect if user is not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  const validateUserData = (user: any) => {
    if (!user) {
      throw new Error('User data is missing');
    }
    
    if (!user.id) {
      throw new Error('User ID is missing');
    }
    
    if (!user.email) {
      throw new Error('User email is missing');
    }
    
    return true;
  };

  const handleRoleSelect = async (role: 'tenant' | 'landlord') => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in first.",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }

    try {
      // Validate user data
      validateUserData(user);
    } catch (validationError) {
      console.error('User validation failed:', validationError);
      toast({
        title: "Invalid User Data",
        description: "Please try signing in again.",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }

    setSelectedRole(role);
    setLoading(true);
    
    try {
      console.log('=== Starting role selection process ===');
      console.log('User:', { id: user.id, email: user.email });
      console.log('Selected role:', role);
      
      // Step 1: Set the role in context, localStorage, and Supabase metadata
      await setUserRole(role);
      console.log('✅ Role set in context, localStorage, and Supabase metadata');
      
      // Step 3: Create the user profile using centralized API
      console.log('Creating user profile...');
      const profileResult = await profileUtils.createForRole(role, user.id, user.email, user.user_metadata);
      
      if (profileResult.success) {
        if (profileResult.alreadyExists) {
          console.log('✅ Profile already exists - user can proceed');
        } else {
          console.log('✅ New profile created successfully');
        }
      }
      
      // Step 4: Show success message
      toast({
        title: "Profile Setup Complete",
        description: `Welcome to Roomzi! Your ${role} profile is ready.`,
        variant: "default",
      });
      
      console.log('=== Role selection process completed successfully ===');
      
      // Step 5: Redirect to appropriate dashboard
      setTimeout(() => {
        if (role === 'tenant') {
          navigate('/tenant');
        } else if (role === 'landlord') {
          navigate('/landlord');
        }
      }, 1000); // Small delay to show success message
      
    } catch (error) {
      console.error('=== Error in role selection process ===');
      console.error('Error details:', error);
      
      let errorMessage = "Something went wrong. Please try again.";
      
      if (error instanceof ApiError) {
        if (error.status === 0) {
          errorMessage = "Unable to connect to server. Please check your internet connection.";
        } else {
          errorMessage = error.message;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Setup Failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      // Reset the role if profile creation failed
      clearUserRole();
      
    } finally {
      setLoading(false);
      setSelectedRole(null);
    }
  };

  // Don't render if user is not authenticated
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to Room<span className="text-roomzi-blue">zi</span>
          </h1>
          <p className="text-xl text-gray-600">
            Select your role to complete your profile
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Hello {user.email} 👋
          </p>
        </div>

        {loading && (
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-2 text-roomzi-blue">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Setting up your {selectedRole} profile...</span>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-8 animate-slide-up">
          <Card 
            className={`p-8 text-center hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-105 border-2 hover:border-roomzi-blue ${
              loading && selectedRole === 'tenant' ? 'opacity-75 cursor-not-allowed' : ''
            }`}
            onClick={() => !loading && handleRoleSelect('tenant')}
          >
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              {loading && selectedRole === 'tenant' ? (
                <Loader2 className="w-8 h-8 text-roomzi-blue animate-spin" />
              ) : (
                <User className="w-8 h-8 text-roomzi-blue" />
              )}
            </div>
            <h3 className="text-2xl font-semibold mb-4 text-gray-900">I'm a Renter</h3>
            <p className="text-gray-600 mb-6">
              Looking for a room, apartment, or house to rent
            </p>
            <Button 
              className="w-full roomzi-gradient text-white font-semibold py-3 rounded-lg"
              disabled={loading}
            >
              {loading && selectedRole === 'tenant' ? 'Setting up...' : 'Find Properties'}
            </Button>
          </Card>

          <Card 
            className={`p-8 text-center hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-105 border-2 hover:border-roomzi-blue ${
              loading && selectedRole === 'landlord' ? 'opacity-75 cursor-not-allowed' : ''
            }`}
            onClick={() => !loading && handleRoleSelect('landlord')}
          >
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              {loading && selectedRole === 'landlord' ? (
                <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
              ) : (
                <Home className="w-8 h-8 text-green-600" />
              )}
            </div>
            <h3 className="text-2xl font-semibold mb-4 text-gray-900">I'm a Landlord</h3>
            <p className="text-gray-600 mb-6">
              I have properties to rent out and manage
            </p>
            <Button 
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg"
              disabled={loading}
            >
              {loading && selectedRole === 'landlord' ? 'Setting up...' : 'List Property'}
            </Button>
          </Card>

          <Card 
            className={`p-8 text-center hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-105 border-2 hover:border-gray-300 ${
              loading ? 'opacity-75 cursor-not-allowed' : ''
            }`}
            onClick={() => !loading && handleRoleSelect('tenant')}
          >
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Users className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-2xl font-semibold mb-4 text-gray-900">Just Looking</h3>
            <p className="text-gray-600 mb-6">
              Exploring options and getting familiar with the platform
            </p>
            <Button 
              variant="outline" 
              className="w-full border-2 font-semibold py-3 rounded-lg hover:bg-gray-50"
              disabled={loading}
            >
              Browse Properties
            </Button>
          </Card>
        </div>

        <div className="text-center mt-8">
          <p className="text-gray-500">
            Don't worry, you can always switch between roles later
          </p>
        </div>
      </div>
    </div>
  );
};

export default RoleSelection;
