import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import AdminDashboard from "./pages/AdminDashboard";
import TenantDashboard from "./pages/TenantDashboard";
import NotFound from "./pages/NotFound";
import { useAuth, AuthProvider } from "./hooks/useAuth";
import { useEffect, useState } from "react";
import Properties from "./pages/Properties";
import AddProperty from "./pages/AddProperty";
import AddTenant from "./pages/AddTenant";
import Users from "./pages/Users";
import EditTenant from "./pages/EditTenant";
import EditProperty from "./pages/EditProperty";
import Profile from "./pages/Profile";
import AvailableProperties from "./pages/AvailableProperties";
import VerifyTenants from "./pages/VerifyTenants";
import Rentals from "./pages/Rentals";
import ViewRental from "./pages/ViewRental";
import EditRental from "./pages/EditRental";
import ExpiringLeases from "./pages/ExpiringLeases";
import Payments from "./pages/Payments";
import About from "./pages/About";
import LandlordInfo from "./pages/LandlordInfo";
import TenantInfo from "./pages/TenantInfo";
import PendingPayments from './pages/PendingPayments';
import OAuthCallback from "./pages/OAuthCallback";

const queryClient = new QueryClient();

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  
  if (loading) return <div>Loading...</div>;
  if (!user || !isAuthenticated) return <Navigate to="/auth" />;
  
  return <>{children}</>;
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/auth" />;
  
  // Check if user has admin role (from localStorage)
  const userRole = localStorage.getItem('userRole');
  if (userRole !== 'admin') return <Navigate to="/tenant-dashboard" />;
  
  return <>{children}</>;
};

const TenantRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/auth" />;
  
  // Check if user has tenant role (from localStorage)
  const userRole = localStorage.getItem('userRole');
  if (userRole !== 'tenant') return <Navigate to="/admin-dashboard" />;
  
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/about" element={<About />} />
            <Route path="/landlord-info" element={<LandlordInfo />} />
            <Route path="/tenant-info" element={<TenantInfo />} />
            <Route 
              path="/admin-dashboard" 
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              } 
            />
            <Route 
              path="/tenant-dashboard" 
              element={
                <TenantRoute>
                  <TenantDashboard />
                </TenantRoute>
              } 
            />
            <Route 
              path="/properties" 
              element={
                <AdminRoute>
                  <Properties />
                </AdminRoute>
              } 
            />
            <Route 
              path="/add-property" 
              element={
                <AdminRoute>
                  <AddProperty />
                </AdminRoute>
              } 
            />
            <Route 
              path="/properties/edit/:id" 
              element={
                <PrivateRoute>
                  <EditProperty />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/users" 
              element={
                <AdminRoute>
                  <Users />
                </AdminRoute>
              } 
            />
            <Route 
              path="/tenants/create" 
              element={
                <AdminRoute>
                  <AddTenant />
                </AdminRoute>
              } 
            />
            <Route 
              path="/tenants/edit/:id" 
              element={
                <AdminRoute>
                  <EditTenant />
                </AdminRoute>
              } 
            />
            <Route 
              path="/" 
              element={
                <PrivateRoute>
                  <Index />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <PrivateRoute>
                  <Profile />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/properties/available" 
              element={
                <AdminRoute>
                  <AvailableProperties />
                </AdminRoute>
              } 
            />
            <Route 
              path="/users/verify" 
              element={
                <AdminRoute>
                  <VerifyTenants />
                </AdminRoute>
              } 
            />
            <Route 
              path="/rentals" 
              element={
                <AdminRoute>
                  <Rentals />
                </AdminRoute>
              } 
            />
            <Route 
              path="/rentals/:id" 
              element={
                <AdminRoute>
                  <ViewRental />
                </AdminRoute>
              } 
            />
            <Route 
              path="/rentals/edit/:id" 
              element={
                <AdminRoute>
                  <EditRental />
                </AdminRoute>
              } 
            />
            <Route 
              path="/rentals/expiring" 
              element={
                <AdminRoute>
                  <ExpiringLeases />
                </AdminRoute>
              } 
            />
            <Route 
              path="/payments" 
              element={
                <AdminRoute>
                  <Payments />
                </AdminRoute>
              } 
            />
            <Route 
              path="/payments/pending" 
              element={
                <AdminRoute>
                  <PendingPayments />
                </AdminRoute>
              } 
            />
            <Route path="/auth/callback" element={<OAuthCallback />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
