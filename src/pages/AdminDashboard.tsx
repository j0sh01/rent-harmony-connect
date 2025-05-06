import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { Users, Building, CreditCard, FileText, AlertTriangle, Plus } from 'lucide-react';
import { frappeClient } from "@/integrations/frappe/client";
import { toast } from "sonner";

interface DashboardSummary {
  totalTenants: number;
  revenue: number;
  propertyCount: number;
  activeRentals: number;
}

interface UpcomingPayment {
  tenant: string;
  property: string;
  unit?: string;
  amount: number;
  dueDate: string;
  month?: string;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<DashboardSummary>({
    totalTenants: 0,
    revenue: 0,
    propertyCount: 0,
    activeRentals: 0
  });
  const [upcomingPayments, setUpcomingPayments] = useState<UpcomingPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("payments");

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const dashboardData = await frappeClient.getDashboardStats();
        if (dashboardData.success) {
          // Map the returned data to the expected format
          setSummary({
            totalTenants: dashboardData.data.tenantCount || 0,
            revenue: dashboardData.data.totalRevenue || 0,
            propertyCount: dashboardData.data.propertyCount || 0,
            activeRentals: dashboardData.data.activeRentalCount || 0
          });
          
          // If there's no upcoming payments data, use an empty array
          setUpcomingPayments(dashboardData.data.upcomingPayments || []);
        } else {
          toast.error(dashboardData.error || "Failed to fetch dashboard data");
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        toast.error("An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <DashboardLayout role="admin">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-gray-500">Welcome back! Here's an overview of your rental properties.</p>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-md border border-gray-200">
          <div className="flex items-center">
            <div className="mr-4 bg-blue-50 p-3 rounded-md">
              <Users className="h-6 w-6 text-[#00b3d7]" />
            </div>
            <div>
              <p className="text-3xl font-bold">{summary.totalTenants}</p>
              <p className="text-sm text-gray-500">Active Tenants</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-md border border-gray-200">
          <div className="flex items-center">
            <div className="mr-4 bg-blue-50 p-3 rounded-md">
              <CreditCard className="h-6 w-6 text-[#00b3d7]" />
            </div>
            <div>
              <p className="text-3xl font-bold">TSh {summary.revenue}</p>
              <p className="text-sm text-gray-500">Total Collected</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-md border border-gray-200">
          <div className="flex items-center">
            <div className="mr-4 bg-blue-50 p-3 rounded-md">
              <Building className="h-6 w-6 text-[#00b3d7]" />
            </div>
            <div>
              <p className="text-3xl font-bold">{summary.propertyCount}</p>
              <p className="text-sm text-gray-500">Available Properties</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-md border border-gray-200">
          <div className="flex items-center">
            <div className="mr-4 bg-blue-50 p-3 rounded-md">
              <FileText className="h-6 w-6 text-[#00b3d7]" />
            </div>
            <div>
              <p className="text-3xl font-bold">{Math.round((summary.activeRentals / (summary.propertyCount || 1)) * 100)}%</p>
              <p className="text-sm text-gray-500">Occupancy Rate</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Tabs and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 bg-white rounded-md border border-gray-200">
          <div className="border-b border-gray-200">
            <div className="flex">
              <button 
                className={`px-6 py-4 text-sm font-medium flex items-center ${activeTab === 'payments' ? 'border-b-2 border-[#00b3d7] text-[#00b3d7]' : 'text-gray-500'}`}
                onClick={() => setActiveTab('payments')}
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Upcoming Payments
              </button>
              <button 
                className={`px-6 py-4 text-sm font-medium flex items-center ${activeTab === 'leases' ? 'border-b-2 border-[#00b3d7] text-[#00b3d7]' : 'text-gray-500'}`}
                onClick={() => setActiveTab('leases')}
              >
                <FileText className="mr-2 h-4 w-4" />
                Expiring Leases
              </button>
            </div>
          </div>
          
          <div className="p-6">
            {activeTab === 'payments' ? (
              upcomingPayments.length > 0 ? (
                <div>
                  {upcomingPayments.map((payment, index) => (
                    <div key={index} className="mb-4 last:mb-0">
                      <p>{payment.tenant}</p>
                      <p className="text-sm text-gray-500">{payment.property}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No upcoming payments
                </div>
              )
            ) : (
              <div className="text-center py-8 text-gray-500">
                No leases expiring soon
              </div>
            )}
          </div>
        </div>
        
        <div className="bg-white rounded-md border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="font-medium flex items-center">
              <Plus className="mr-2 h-4 w-4 text-[#00b3d7]" />
              Quick Actions
            </h2>
          </div>
          
          <div className="p-4">
            <div className="space-y-3">
              <button 
                className="w-full text-left px-4 py-3 border border-gray-200 rounded-md hover:bg-gray-50 flex items-start"
                onClick={() => navigate('/add-property')}
              >
                <Building className="h-5 w-5 text-[#00b3d7] mr-3 mt-0.5" />
                <div>
                  <p className="font-medium">Add Property</p>
                  <p className="text-xs text-gray-500">Register a new rental property</p>
                </div>
              </button>
              
              <button 
                className="w-full text-left px-4 py-3 border border-gray-200 rounded-md hover:bg-gray-50 flex items-start"
                onClick={() => navigate('/tenants/create')}
              >
                <Users className="h-5 w-5 text-[#00b3d7] mr-3 mt-0.5" />
                <div>
                  <p className="font-medium">Add Tenant</p>
                  <p className="text-xs text-gray-500">Register a new tenant</p>
                </div>
              </button>
              
              <button 
                className="w-full text-left px-4 py-3 border border-gray-200 rounded-md hover:bg-gray-50 flex items-start"
                onClick={() => navigate('/payments')}
              >
                <CreditCard className="h-5 w-5 text-[#00b3d7] mr-3 mt-0.5" />
                <div>
                  <p className="font-medium">Record Payment</p>
                  <p className="text-xs text-gray-500">Log a new rent payment</p>
                </div>
              </button>
              
              <button 
                className="w-full text-left px-4 py-3 border border-gray-200 rounded-md hover:bg-gray-50 flex items-start"
                onClick={() => navigate('/generate-reports')}
              >
                <FileText className="h-5 w-5 text-[#00b3d7] mr-3 mt-0.5" />
                <div>
                  <p className="font-medium">Generate Report</p>
                  <p className="text-xs text-gray-500">Create financial reports</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Maintenance Alerts */}
      <div className="mb-6">
        <div className="bg-white rounded-md border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="font-medium flex items-center">
              <AlertTriangle className="mr-2 h-4 w-4 text-[#00b3d7]" />
              Maintenance Alerts
            </h2>
          </div>
          
          <div className="p-6 text-center text-gray-500">
            No maintenance alerts at this time
          </div>
        </div>
      </div>
      
      {/* Recent Activity */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-medium">Recent Activity</h2>
          <button className="text-gray-500">
            -
          </button>
        </div>
        
        <div className="bg-white rounded-md border border-gray-200">
          {/* Activity items would go here */}
          <div className="p-6 text-center text-gray-500">
            No recent activity
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
