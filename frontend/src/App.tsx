import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import RoleSelection from "./pages/RoleSelection";
import TenantDashboard from "./pages/TenantDashboard";
import TenantProfile from "./pages/TenantProfile";
import TenantMatches from "./pages/TenantMatches";
import TenantMyHouse from "./pages/TenantMyHouse";
import LandlordDashboard from "./pages/LandlordDashboard";
import LandlordMatches from "./pages/LandlordMatches";
import LandlordProfile from "./pages/LandlordProfile";
import PropertyDetails from "./pages/PropertyDetails";
import CreateListing from "./pages/CreateListing";
import ManageListing from "./pages/ManageListing";
import Payments from "./pages/Payments";
import Auth from "./pages/Auth";
import { AuthProvider } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { AuthCallback } from "./pages/AuthCallback";
import { RoleProtectedRoute } from "./components/auth/RoleProtectedRoute";
import { LandlordChats } from "./components/chat/LandlordChats";
import PaymentHistory from "./pages/PaymentHistory";
import LandlordPayments from './pages/LandlordPayments';

import { queryClient } from "./lib/queryClient";
import FinancialAccount from "./pages/FinancialAccount";
import ScrollToTop from './components/ScrollToTop';
import FAQ from './pages/FAQ';
import TenantMaintenanceRequest from "./pages/TenantMaintenanceRequest";
import LandlordMaintenanceRequests from "./pages/LandlordMaintenanceRequests";
import MapTest from "./pages/MapTest";
import LandlordViewingRequests from "./pages/LandlordViewingRequests";

import TenantLease from './pages/TenantLease';
import TenantLeasedProperties from "./pages/TenantLeasedProperties";
import RenewLease from "./pages/RenewLease";
import LandlordLeaseAgreement from "./pages/LandlordLeaseAgreement";

// Removed duplicate import of Payments (PaymentHistory)
// import Payments from "./pages/PaymentHistory";

// Removed duplicate declaration of queryClient
// const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <ScrollToTop />
      <AuthProvider>
        <SocketProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <Routes>
              {/* Public routes - ONLY Index page is public */}
              <Route path="/" element={<Index />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/map-test" element={<MapTest />} />
              
              {/* Auth-related routes - don't require existing auth but handle auth flow */}
              <Route 
                path="/auth" 
                element={
                  <ProtectedRoute requireAuth={false}>
                    <Auth />
                  </ProtectedRoute>
                } 
              />
              {/* Redirect old routes to new unified auth page */}
              <Route 
                path="/login" 
                element={
                  <ProtectedRoute requireAuth={false}>
                    <Auth />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/signup" 
                element={
                  <ProtectedRoute requireAuth={false}>
                    <Auth />
                  </ProtectedRoute>
                } 
              />
              <Route path="/auth/callback" element={<AuthCallback />} />

              {/* Role selection requires auth but allows incomplete profiles */}
              <Route 
                path="/role-selection" 
                element={
                  <ProtectedRoute>
                    <RoleSelection />
                  </ProtectedRoute>
                } 
              />

              {/* Role-protected routes - require auth + specific role */}
              <Route 
                path="/tenant/*" 
                element={
                  <RoleProtectedRoute requiredRole="tenant">
                    <Routes>
                      <Route path="/" element={<TenantDashboard />} />
                      <Route path="profile" element={<TenantProfile />} />
                      <Route path="matches" element={<TenantMatches />} />
                      <Route path="my-house" element={<TenantLeasedProperties />} />
                      <Route path="my-house/:listingId" element={<TenantMyHouse />} />
                      <Route path="financial-account" element={<FinancialAccount />} />
                      <Route path="payments/:listingId" element={<PaymentHistory/>} />
                      <Route path="payments" element={<Payments />} />
                      <Route path="maintenance/:listingId" element={<TenantMaintenanceRequest />} />
                      <Route path="renew-lease/:listingId" element={<RenewLease />} />
                      <Route path="lease/:leaseId" element={<TenantLease />} />
                    </Routes>
                  </RoleProtectedRoute>
                } 
              />
              <Route 
                path="/landlord/*" 
                element={
                  <RoleProtectedRoute requiredRole="landlord">
                    <Routes>
                      <Route path="/" element={<LandlordDashboard />} />
                      <Route path="profile" element={<LandlordProfile />} />
                      <Route path="matches" element={<LandlordMatches />} />
                      <Route path="chats" element={<LandlordChats />} />
                      <Route path="listing/:listingId/payments" element={<LandlordPayments />} />

                      <Route path="maintenance-requests" element={<LandlordMaintenanceRequests />} />
                      <Route path="viewing-requests" element={<LandlordViewingRequests />} />

                      <Route path="lease-agreement/:listingId" element={<LandlordLeaseAgreement />} />
                    </Routes>
                  </RoleProtectedRoute>
                } 
              />
              
              {/* General protected routes - require auth */}
              <Route 
                path="/property/:id" 
                element={
                  <ProtectedRoute>
                    <PropertyDetails />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/create-listing" 
                element={
                  <RoleProtectedRoute requiredRole="landlord">
                    <CreateListing />
                  </RoleProtectedRoute>
                } 
              />
              <Route 
                path="/manage-listing/:id" 
                element={
                  <RoleProtectedRoute requiredRole="landlord">
                    <ManageListing />
                  </RoleProtectedRoute>
                } 
              />
              <Route 
                path="/edit-listing/:currentListing" 
                element={
                  <RoleProtectedRoute requiredRole="landlord">
                    <CreateListing />
                  </RoleProtectedRoute>
                } 
              />
              <Route 
                path="/payments" 
                element={
                  <RoleProtectedRoute requiredRole="landlord">
                    <Payments />
                  </RoleProtectedRoute>
                } 
              />
              
              {/* 404 page - also requires auth (users must be logged in to see it) */}
              <Route 
                path="*" 
                element={
                  <ProtectedRoute>
                    <NotFound />
                  </ProtectedRoute>
                } 
              />
            </Routes>
          </TooltipProvider>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
