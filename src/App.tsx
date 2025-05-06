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
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/auth/callback" element={<OAuthCallback />} />
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
            <Route path="/tenant-dashboard" element={<TenantDashboard />} />
            <Route path="/properties" element={<Properties />} />
            <Route path="/add-property" element={<AddProperty />} />
            <Route path="/properties/edit/:id" element={<EditProperty />} />
            <Route path="/users" element={<Users />} />
            <Route path="/tenants/create" element={<AddTenant />} />
            <Route path="/tenants/:id" element={<EditTenant />} />
            <Route path="/rentals" element={<Rentals />} />
            <Route path="/rentals/expiring" element={<ExpiringLeases />} />
            <Route path="/rentals/:id" element={<ViewRental />} />
            <Route path="/rentals/edit/:id" element={<EditRental />} />
            <Route path="/payments" element={<Payments />} />
            <Route path="/settings" element={<Profile />} />
            <Route path="/help" element={<About />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
