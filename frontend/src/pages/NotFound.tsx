import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";
import { getRedirectPath } from "@/utils/auth";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  const handleGoHome = () => {
    if (user) {
      const redirectPath = getRedirectPath(user);
      navigate(redirectPath);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4">
        {/* Roomzi Brand */}
        <div className="flex items-center justify-center mb-6">
          <Home className="text-roomzi-blue text-3xl mr-2" />
          <span className="text-3xl font-extrabold text-roomzi-blue select-none">
            Room
            <span className="text-yellow-400">zi</span>
          </span>
        </div>

        <div className="text-6xl font-bold text-gray-300 mb-4">404</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Page Not Found</h1>
        <p className="text-gray-600 mb-6">
          Sorry, the page you're looking for doesn't exist. 
          {user ? " Let's get you back to your dashboard." : " Let's get you back home."}
        </p>
        
        <div className="space-y-3">
          <Button
            onClick={handleGoHome}
            className="w-full bg-roomzi-blue hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            {user ? 'Go to Dashboard' : 'Go Home'}
          </Button>
          
          {user && (
            <Button
              variant="outline"
              onClick={() => navigate(-1)}
              className="w-full border-roomzi-blue text-roomzi-blue hover:bg-blue-50"
            >
              Go Back
            </Button>
          )}
        </div>
        
        <p className="text-xs text-gray-500 mt-6">
          Error Code: 404 | Path: {location.pathname}
        </p>
      </div>
    </div>
  );
};

export default NotFound;
