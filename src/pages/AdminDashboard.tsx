
import React, { useEffect, useState } from 'react';
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { frappeClient } from "@/integrations/frappe/client";

interface DashboardSummary {
  propertyCount: number;
  activeRentals: number;
  totalTenants: number;
  pendingPayments: number;
  revenue: number;
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary>({
    propertyCount: 0,
    activeRentals: 0,
    totalTenants: 0,
    pendingPayments: 0,
    revenue: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const { success, data, error } = await frappeClient.getDashboardStats();
        
        if (success && data) {
          setSummary({
            propertyCount: data.propertyCount,
            activeRentals: data.activeRentalCount,
            totalTenants: data.tenantCount,
            pendingPayments: data.pendingPaymentCount,
            revenue: data.totalRevenue
          });
        } else {
          console.error("Error fetching dashboard data:", error);
        }
      } catch (error) {
        console.error("Error in data fetching:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  if (!user) {
    navigate('/auth');
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <div className="flex space-x-2">
            <Button onClick={() => navigate('/add-property')} variant="outline">Add New Property</Button>
            <Button onClick={() => navigate('/generate-reports')}>Generate Reports</Button>
          </div>
        </div>
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Properties</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.propertyCount}</div>
              <p className="text-xs text-gray-500">Total properties</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Active Rentals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.activeRentals}</div>
              <p className="text-xs text-gray-500">Current leases</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Tenants</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalTenants}</div>
              <p className="text-xs text-gray-500">Registered users</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Pending Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.pendingPayments}</div>
              <p className="text-xs text-gray-500">Awaiting payments</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.revenue.toLocaleString()} TZS</div>
              <p className="text-xs text-gray-500">Total collection</p>
            </CardContent>
          </Card>
        </div>
        
        {/* Management Tabs */}
        <Tabs defaultValue="properties" className="w-full">
          <TabsList className="w-full justify-start mb-4">
            <TabsTrigger value="properties">Properties</TabsTrigger>
            <TabsTrigger value="tenants">Tenants</TabsTrigger>
            <TabsTrigger value="rentals">Rentals</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="testimonials">Testimonials</TabsTrigger>
          </TabsList>
          
          <TabsContent value="properties" className="border rounded-md p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Property Management</h2>
              <Button 
                onClick={() => navigate('/add-property')}
                className="bg-harmony-500 hover:bg-harmony-600"
              >
                Add New Property
              </Button>
            </div>
            <p className="text-gray-500">View and manage all properties in the system.</p>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button 
                onClick={() => navigate('/properties')}
                className="bg-harmony-500 hover:bg-harmony-600"
              >
                Manage Properties
              </Button>
              <Button 
                onClick={() => navigate('/properties/available')}
                variant="outline"
              >
                Available Properties
              </Button>
              <Button 
                onClick={() => navigate('/properties/maintenance')}
                variant="outline"
              >
                Maintenance Requests
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="tenants" className="border rounded-md p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Tenant Management</h2>
              <Button 
                onClick={() => navigate('/tenants/create')}
                className="bg-harmony-500 hover:bg-harmony-600"
              >
                Add New Tenant
              </Button>
            </div>
            <p className="text-gray-500">View and manage tenant information and accounts.</p>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button 
                onClick={() => navigate('/users')}
                className="bg-harmony-500 hover:bg-harmony-600"
              >
                Manage Tenants
              </Button>
              <Button 
                onClick={() => navigate('/users/verify')}
                variant="outline"
              >
                Verify Tenants
              </Button>
              <Button 
                onClick={() => navigate('/users/communications')}
                variant="outline"
              >
                Tenant Communications
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="rentals" className="border rounded-md p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Rental Management</h2>
              <Button 
                onClick={() => navigate('/rentals/create')}
                className="bg-harmony-500 hover:bg-harmony-600"
              >
                Create New Rental
              </Button>
            </div>
            <p className="text-gray-500">Manage active and upcoming rental agreements.</p>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button 
                onClick={() => navigate('/rentals')}
                className="bg-harmony-500 hover:bg-harmony-600"
              >
                Manage Rentals
              </Button>
              <Button 
                onClick={() => navigate('/rentals/expiring')}
                variant="outline"
              >
                Expiring Leases
              </Button>
              <Button 
                onClick={() => navigate('/rentals/documents')}
                variant="outline"
              >
                Rental Documents
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="payments" className="border rounded-md p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Payment Management</h2>
              <Button 
                onClick={() => navigate('/payments/record')}
                className="bg-harmony-500 hover:bg-harmony-600"
              >
                Record Payment
              </Button>
            </div>
            <p className="text-gray-500">Track, record and verify rental payments.</p>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button 
                onClick={() => navigate('/payments')}
                className="bg-harmony-500 hover:bg-harmony-600"
              >
                View Payments
              </Button>
              <Button 
                onClick={() => navigate('/payments/pending')}
                variant="outline"
              >
                Pending Payments
              </Button>
              <Button 
                onClick={() => navigate('/payments/reports')}
                variant="outline"
              >
                Payment Reports
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="testimonials" className="border rounded-md p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Testimonial Management</h2>
              <Button 
                onClick={() => navigate('/testimonials/create')}
                className="bg-harmony-500 hover:bg-harmony-600"
              >
                Add Testimonial
              </Button>
            </div>
            <p className="text-gray-500">Manage testimonials displayed on the website.</p>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button 
                onClick={() => navigate('/testimonials')}
                className="bg-harmony-500 hover:bg-harmony-600"
              >
                Manage Testimonials
              </Button>
              <Button 
                onClick={() => navigate('/testimonials/pending')}
                variant="outline"
              >
                Review Submissions
              </Button>
              <Button 
                onClick={() => navigate('/testimonials/settings')}
                variant="outline"
              >
                Display Settings
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;
