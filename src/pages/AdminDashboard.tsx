import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { Users, Building, CreditCard, FileText, AlertTriangle, Plus } from 'lucide-react';
import { frappeClient } from "@/integrations/frappe/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";

interface DashboardSummary {
  totalTenants: number;
  revenue: number;
  propertyCount: number;
  activeRentals: number;
}

interface UpcomingPayment {
  name: string;
  tenant: string;
  property: string;
  unit?: string;
  amount: number;
  dueDate: string;
  month?: string;
}

interface ExpiringLease {
  name: string;
  property: string;
  tenant: string;
  end_date: string;
  monthly_rent_tzs: number;
}

interface ActivityItem {
  id: string;
  type: 'payment' | 'lease' | 'tenant' | 'property' | 'maintenance';
  title: string;
  description: string;
  timestamp: string;
  relatedId?: string;
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
  const [expiringLeases, setExpiringLeases] = useState<ExpiringLease[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("payments");
  const [recentActivities, setRecentActivities] = useState<ActivityItem[]>([]);
  const [maintenanceRequests, setMaintenanceRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  // Add this function to format currency values
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

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
          
          // Fetch pending payments (docstatus=0)
          const pendingPaymentsResult = await frappeClient.getPendingPayments();
          if (pendingPaymentsResult.success && pendingPaymentsResult.data) {
            console.log("Pending payments data:", pendingPaymentsResult.data);
            
            // Transform the data to match UpcomingPayment interface
            const upcomingPaymentsData = pendingPaymentsResult.data.map(payment => ({
              name: payment.name,
              tenant: payment.tenant_name || payment.tenant || "Unknown Tenant",
              property: payment.property_name || payment.property || payment.rental || "Unknown Property",
              amount: payment.amount_tzs,
              dueDate: payment.payment_date,
              month: new Date(payment.payment_date).toLocaleString('default', { month: 'long' })
            }));
            
            setUpcomingPayments(upcomingPaymentsData);
          } else {
            setUpcomingPayments([]);
          }
          
          // Fetch rentals to find expiring leases
          const rentalsResult = await frappeClient.getRentals();
          if (rentalsResult.success && rentalsResult.data) {
            // Filter rentals that expire in the current month
            const now = new Date();
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();
            
            const expiringRentals = rentalsResult.data.filter(rental => {
              const endDate = new Date(rental.end_date);
              return endDate.getMonth() === currentMonth && 
                     endDate.getFullYear() === currentYear;
            });
            
            setExpiringLeases(expiringRentals);
          }
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

    const fetchRecentActivities = async () => {
      try {
        // You can implement this in your frappeClient
        const activitiesResult = await frappeClient.getRecentActivities();
        if (activitiesResult.success && activitiesResult.data) {
          setRecentActivities(activitiesResult.data);
        }
      } catch (error) {
        console.error("Error fetching recent activities:", error);
      }
    };

    fetchDashboardData();
    fetchRecentActivities();
  }, []);

  // Fetch all maintenance requests
  const fetchMaintenanceRequests = async () => {
    setLoadingRequests(true);
    try {
      const result = await frappeClient.getMaintenanceRequests();
      if (result.success && result.data) {
        setMaintenanceRequests(result.data);
      } else {
        console.error("Failed to fetch maintenance requests:", result.error);
      }
    } catch (error) {
      console.error("Error fetching maintenance requests:", error);
    } finally {
      setLoadingRequests(false);
    }
  };

  useEffect(() => {
    fetchMaintenanceRequests();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const updateMaintenanceRequestStatus = async (requestId: string, newStatus: string) => {
    try {
      const result = await frappeClient.updateMaintenanceRequest(requestId, { status: newStatus });
      if (result.success) {
        toast.success(`Maintenance request marked as ${newStatus}`);
        fetchMaintenanceRequests(); // Refresh the list
      } else {
        toast.error(result.error || "Failed to update maintenance request");
      }
    } catch (error) {
      console.error("Error updating maintenance request:", error);
      toast.error("An unexpected error occurred");
    }
  };

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
              <p className="text-3xl font-bold">{formatCurrency(summary.revenue)}</p>
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
                <div className="space-y-4">
                  {upcomingPayments.map((payment, index) => (
                    <div key={index} className="flex justify-between items-center p-3 border rounded-md hover:bg-gray-50">
                      <div>
                        <p className="font-medium">{payment.tenant}</p>
                        <p className="text-sm text-gray-500">{payment.property}</p>
                        <p className="text-xs text-gray-400">Due: {new Date(payment.dueDate).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-[#00b3d7]">
                          TSh {payment.amount.toLocaleString()}
                        </p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-1 text-xs"
                          onClick={() => navigate('/pending-payments')}
                        >
                          Review
                        </Button>
                      </div>
                    </div>
                  ))}
                  {upcomingPayments.length > 5 && (
                    <div className="text-center pt-2">
                      <Button 
                        variant="link" 
                        onClick={() => navigate('/pending-payments')}
                        className="text-[#00b3d7]"
                      >
                        View all pending payments
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No pending payments
                </div>
              )
            ) : (
              expiringLeases.length > 0 ? (
                <div className="space-y-4">
                  {expiringLeases.map((lease, index) => (
                    <div key={index} className="flex justify-between items-center p-3 border rounded-md hover:bg-gray-50">
                      <div>
                        <p className="font-medium">{lease.tenant}</p>
                        <p className="text-sm text-gray-500">{lease.property}</p>
                        <p className="text-xs text-gray-400">Expires: {formatDate(lease.end_date)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-[#00b3d7]">
                          TSh {lease.monthly_rent_tzs.toLocaleString()}/month
                        </p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-1 text-xs"
                          onClick={() => navigate(`/rentals/${lease.name}`)}
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))}
                  {expiringLeases.length > 5 && (
                    <div className="text-center pt-2">
                      <Button 
                        variant="link" 
                        onClick={() => navigate('/rentals/expiring')}
                        className="text-[#00b3d7]"
                      >
                        View all expiring leases
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No leases expiring this month
                </div>
              )
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
          
          {loadingRequests ? (
            <div className="text-center py-8">
              <p>Loading maintenance requests...</p>
            </div>
          ) : maintenanceRequests.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No maintenance requests</h3>
              <p className="text-gray-500">There are no maintenance requests at the moment.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {maintenanceRequests.map((request: any) => (
                <div key={request.name} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium">{request.title || "Untitled Request"}</h3>
                    <Badge
                      className={
                        request.status === 'Open'
                          ? 'bg-blue-500'
                          : request.status === 'In Progress'
                          ? 'bg-yellow-500'
                          : request.status === 'Completed'
                          ? 'bg-green-500'
                          : 'bg-red-500'
                      }
                    >
                      {request.status || "Unknown Status"}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-500 mb-2">
                    <span className="font-medium">Category:</span> {request.category || "N/A"} |{' '}
                    <span className="font-medium ml-2">Priority:</span> {request.priority || "N/A"}
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{request.description || "No description provided."}</p>
                  {request.resolution_date && (
                    <div className="text-sm text-gray-500 mb-2">
                      <span className="font-medium">Resolved On:</span>{' '}
                      {new Date(request.resolution_date).toLocaleString()}
                    </div>
                  )}
                  {request.resolution_notes && (
                    <div className="text-sm text-gray-500">
                      <span className="font-medium">Resolution Notes:</span> {request.resolution_notes}
                    </div>
                  )}
                  <div className="text-xs text-gray-400">
                    Submitted on{' '}
                    {request.creation
                      ? new Date(request.creation).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })
                      : "Unknown Date"}
                  </div>
                  <div className="mt-4 flex space-x-2">
                    {request.status !== 'Completed' && (
                      <Button
                        size="sm"
                        className="bg-yellow-500 hover:bg-yellow-600 text-white"
                        onClick={() => updateMaintenanceRequestStatus(request.name, 'In Progress')}
                      >
                        Mark as In Progress
                      </Button>
                    )}
                    {request.status !== 'Completed' && (
                      <Button
                        size="sm"
                        className="bg-green-500 hover:bg-green-600 text-white"
                        onClick={() => updateMaintenanceRequestStatus(request.name, 'Completed')}
                      >
                        Mark as Completed
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Recent Activity */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-medium">Recent Activity</h2>
        </div>
        
        <div className="bg-white rounded-md border border-gray-200">
          {recentActivities.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start">
                    <div className="mr-4 mt-1">
                      {activity.type === 'payment' && <CreditCard className="h-5 w-5 text-green-500" />}
                      {activity.type === 'lease' && <FileText className="h-5 w-5 text-blue-500" />}
                      {activity.type === 'tenant' && <Users className="h-5 w-5 text-purple-500" />}
                      {activity.type === 'property' && <Building className="h-5 w-5 text-orange-500" />}
                      {activity.type === 'maintenance' && <AlertTriangle className="h-5 w-5 text-red-500" />}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{activity.title}</p>
                      <p className="text-sm text-gray-500">{activity.description}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(activity.timestamp).toLocaleString()}
                      </p>
                    </div>
                    {activity.relatedId && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          // Check if the route exists before navigating
                          const route = 
                            activity.type === 'payment' ? `/pending-payments` : // Navigate to payments list instead of individual payment
                            activity.type === 'lease' ? `/rentals/${activity.relatedId}` :
                            activity.type === 'tenant' ? `/tenants/${activity.relatedId}` :
                            activity.type === 'property' ? `/properties` : // Navigate to properties list instead of individual property
                            null; // Set to null if no valid route
                          
                          if (route) {
                            navigate(route);
                          } else {
                            toast.error("Details view not available");
                          }
                        }}
                      >
                        View
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-gray-500">
              No recent activity
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
