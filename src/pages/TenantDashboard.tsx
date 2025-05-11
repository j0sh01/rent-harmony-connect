import React, { useEffect, useState } from 'react';
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { frappeClient, FRAPPE_URL } from "@/integrations/frappe/client";
import { toast } from "sonner";
import { Home, CreditCard, Calendar, FileText, Bell, ArrowRight, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface Property {
  name: string;
  title: string;
  location: string;
  price_tzs: number;
  image: string;
  bedrooms?: number;
  bathroom?: number;
  square_meters?: number;
  description?: string; // Added description field
  status?: string; // Added status field
}

interface RentalDetails {
  name: string;
  property: string;
  property_details?: Property;
  start_date: string;
  end_date: string;
  monthly_rent_tzs: number;
}

interface Payment {
  name: string;
  amount_tzs: number;
  payment_date: string;
  payment_method: string;
  receipt_number: string;
  docstatus: number;
}

const TenantDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [rentals, setRentals] = useState<RentalDetails[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [tenantName, setTenantName] = useState<string>("");

  // Add a new state for properties and property display
  const [showProperties, setShowProperties] = useState(false);
  const [availableProperties, setAvailableProperties] = useState<Property[]>([]);

  // Add these states for the maintenance request
  const [maintenanceDialogOpen, setMaintenanceDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [maintenanceRequests, setMaintenanceRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [maintenanceRequest, setMaintenanceRequest] = useState({
    title: '',
    category: 'Plumbing',
    description: '',
    priority: 'Medium',
    rental: ''
  });

  // Add validation state
  const [validationErrors, setValidationErrors] = useState({
    title: false,
    description: false,
    category: false,
  });

  // Calculate days remaining for the active rental
  const getActiveRental = () => {
    if (rentals.length === 0) return null;
    return rentals.find(rental => new Date(rental.end_date) > new Date()) || rentals[0];
  };

  const activeRental = getActiveRental();
  const daysRemaining = activeRental 
    ? Math.ceil((new Date(activeRental.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  // Then, update the rental field when activeRental changes
  useEffect(() => {
    if (activeRental?.name) {
      setMaintenanceRequest(prev => ({
        ...prev,
        rental: activeRental.name
      }));
    }
  }, [activeRental]);

  const handlePrintPayment = (paymentId: string) => {
    const printUrl = frappeClient.getPaymentPrintUrl(paymentId);
    window.open(printUrl, '_blank');
  };

  // Add a function to fetch available properties
  const fetchAvailableProperties = async () => {
    try {
      const result = await frappeClient.getProperties();
      if (result.success && result.data) {
        // Filter only available properties
        const available = result.data.filter(
          (property: Property) => property.status === 'Available'
        );
        setAvailableProperties(available);
        setShowProperties(true);
        // Switch to the properties tab if we're adding it to the tabs
        setActiveTab("properties");
      } else {
        toast.error("Failed to load available properties");
      }
    } catch (error) {
      console.error("Error fetching properties:", error);
      toast.error("Failed to load available properties");
    }
  };

  // Add this function to fetch maintenance requests
  const fetchMaintenanceRequests = async () => {
    if (!user?.name) return;
    
    setLoadingRequests(true);
    try {
      const result = await frappeClient.getMaintenanceRequests();
      console.log("Raw Maintenance Requests API Response:", result); // Debugging log

      if (result.success && result.data) {
        // Ensure proper mapping of fields
        const mappedRequests = result.data.map((request: any) => ({
          name: request.name || "Unknown",
          title: request.title || "Untitled Request",
          category: request.category || "N/A",
          priority: request.priority || "N/A",
          status: request.status || "Unknown Status",
          description: request.description || "No description provided.",
          creation: request.creation || null,
          resolution_date: request.resolution_date || null,
          resolution_notes: request.resolution_notes || null,
        }));

        console.log("Mapped Maintenance Requests:", mappedRequests); // Debugging log
        setMaintenanceRequests(mappedRequests);
      } else {
        toast.error("Failed to load maintenance requests");
      }
    } catch (error) {
      console.error("Error fetching maintenance requests:", error);
    } finally {
      setLoadingRequests(false);
    }
  };

  useEffect(() => {
    const fetchTenantData = async () => {
      const userEmail = user?.email || localStorage.getItem('userEmail');
      
      if (!userEmail) {
        console.error("User email not found in user object or localStorage");
        toast.error("User email not found. Please log in again.");
        navigate('/auth');
        return;
      }
      
      try {
        setLoading(true);
        console.log("Fetching data for user email:", userEmail);
        
        // Fetch tenant details to get the full name
        try {
          const { success: tenantSuccess, data: tenantData, error: tenantError } = 
            await frappeClient.getTenantDetailsByEmail(userEmail);
            
          if (tenantSuccess && tenantData) {
            console.log("Tenant data:", tenantData);
            setTenantName(tenantData.full_name || tenantData.name || user?.name || "Tenant");
            localStorage.setItem('userName', tenantData.full_name || tenantData.name || user?.name || "Tenant");
          } else {
            console.error("Tenant not found:", tenantError);
            toast.error("Could not find tenant details. Please contact support.");
            setTenantName("Unknown Tenant");
          }
        } catch (error) {
          console.error("Error fetching tenant details:", error);
          toast.error("Failed to fetch tenant details. Please contact support.");
          setTenantName("Unknown Tenant");
        }
        
        // Fetch rentals and payments
        try {
          const { success: rentalSuccess, data: rentalData, error: rentalError } = 
            await frappeClient.getTenantRentalsByEmail(userEmail);
          
          if (!rentalSuccess || !rentalData || rentalData.length === 0) {
            console.error("Failed to fetch rentals:", rentalError);
            toast.error("No rentals found for your account");
            setRentals([]);
          } else {
            console.log("Tenant rentals:", rentalData);
            const rentalsWithProperties = await Promise.all(
              rentalData.map(async (rental) => {
                try {
                  const { success: propertySuccess, data: propertyData } = 
                    await frappeClient.getProperty(rental.property);
                    
                  return {
                    ...rental,
                    property_details: propertySuccess ? propertyData : undefined
                  };
                } catch (error) {
                  console.error("Error fetching property details:", error);
                  return {
                    ...rental,
                    property_details: undefined
                  };
                }
              })
            );
            setRentals(rentalsWithProperties);
            
            if (rentalsWithProperties.length > 0) {
              try {
                const { success: paymentSuccess, data: paymentData } = 
                  await frappeClient.getPaymentsByRental(rentalsWithProperties[0].name);
                  
                if (paymentSuccess && paymentData) {
                  setPayments(paymentData.map(payment => ({
                    name: payment.name,
                    amount_tzs: payment.amount_tzs,
                    payment_date: payment.payment_date,
                    payment_method: payment.payment_method,
                    receipt_number: payment.receipt_number,
                    docstatus: payment.docstatus ?? 0, 
                  })));
                } else {
                  setPayments([]);
                }
              } catch (error) {
                console.error("Error fetching payments:", error);
                setPayments([]);
              }
            }
          }
        } catch (error) {
          console.error("Error fetching rentals:", error);
          toast.error("Failed to load rental information");
          setRentals([]);
        }
      } catch (error) {
        console.error("Error fetching tenant data:", error);
        toast.error("Failed to load your dashboard data");
      } finally {
        setLoading(false);
      }
    };
    
    fetchTenantData();
    if (user?.name) {
      fetchMaintenanceRequests();
    }
  }, [user, navigate]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto py-8 px-4">
          <div className="flex flex-col items-center justify-center h-64">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <h2 className="mt-4 text-xl font-medium text-gray-700">Loading your dashboard...</h2>
          </div>
        </div>
      </div>
    );
  }

  // Calculate lease progress
  const calculateLeaseProgress = (rental: RentalDetails) => {
    const startDate = new Date(rental.start_date).getTime();
    const endDate = new Date(rental.end_date).getTime();
    const today = new Date().getTime();
    
    const totalDuration = endDate - startDate;
    const elapsed = today - startDate;
    
    return Math.min(Math.max(Math.round((elapsed / totalDuration) * 100), 0), 100);
  };

  // Get upcoming payment date (simulate next month's payment)
  const getNextPaymentDate = () => {
    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    return nextMonth;
  };

  // Add this function to handle maintenance request submission
  const handleMaintenanceRequest = async () => {
    if (!maintenanceRequest.title || !maintenanceRequest.description || !maintenanceRequest.category) {
      toast.error("Please fill in all required fields");
      setValidationErrors({
        title: !maintenanceRequest.title,
        description: !maintenanceRequest.description,
        category: !maintenanceRequest.category,
      });
      return;
    }
    
    setSubmitting(true);
    setValidationErrors({ title: false, description: false, category: false });
    try {
      const result = await frappeClient.createMaintenanceRequest({
        title: maintenanceRequest.title,
        category: maintenanceRequest.category,
        description: maintenanceRequest.description,
        priority: maintenanceRequest.priority,
        rental: activeRental?.name || '',
        tenant: user?.name || '',
        property: activeRental?.property || '',
        status: 'Open',
      });
      
      if (result.success) {
        toast.success("Maintenance request submitted successfully");
        setMaintenanceDialogOpen(false);
        setMaintenanceRequest({
          title: '',
          category: 'Plumbing',
          description: '',
          priority: 'Medium',
          rental: activeRental?.name || '',
        });
        fetchMaintenanceRequests();
      } else {
        toast.error(result.error || "Failed to submit maintenance request");
      }
    } catch (error) {
      console.error("Error submitting maintenance request:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto py-8 px-4">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Welcome, {tenantName}</h1>
              <p className="text-gray-500 mt-1">Here's an overview of your rental information</p>
            </div>
            <div className="mt-4 md:mt-0">
              <Button 
                variant="outline" 
                className="mr-2"
                onClick={() => window.open(`mailto:support@example.com?subject=Support Request`)}
              >
                <Bell className="mr-2 h-4 w-4" />
                Request Support
              </Button>
              <Button 
                className="bg-primary hover:bg-primary/90"
                onClick={fetchAvailableProperties}
              >
                <Home className="mr-2 h-4 w-4" />
                Browse Properties
              </Button>
            </div>
          </div>
        </div>
        
        {/* Tabs Navigation */}
        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="grid grid-cols-5 md:w-[600px]">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="properties">Properties</TabsTrigger>
          </TabsList>
          
          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-6">
            {rentals.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Property Card */}
                <Card className="lg:col-span-2 overflow-hidden">
                  <CardHeader className="pb-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-2xl">{activeRental?.property_details?.title || "Your Property"}</CardTitle>
                        <CardDescription className="flex items-center mt-1">
                          <Home className="h-4 w-4 mr-1 text-gray-400" />
                          {activeRental?.property_details?.location || "Location unavailable"}
                        </CardDescription>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        daysRemaining > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {daysRemaining > 0 ? "Active Lease" : "Expired Lease"}
                      </span>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-6">
                    {activeRental?.property_details?.image && (
                      <div className="w-full h-64 mb-6 overflow-hidden rounded-md">
                        <img 
                          src={activeRental.property_details.image.startsWith('http') 
                            ? activeRental.property_details.image 
                            : `${FRAPPE_URL}${activeRental.property_details.image}`} 
                          alt={activeRental.property_details.title} 
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-gray-500 text-sm">Monthly Rent</p>
                        <p className="text-xl font-bold">{formatCurrency(activeRental?.monthly_rent_tzs || 0)}</p>
                      </div>
                      
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-gray-500 text-sm">Bedrooms</p>
                        <p className="text-xl font-bold">{activeRental?.property_details?.bedrooms || "N/A"}</p>
                      </div>
                      
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-gray-500 text-sm">Bathrooms</p>
                        <p className="text-xl font-bold">{activeRental?.property_details?.bathroom || "N/A"}</p>
                      </div>
                      
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-gray-500 text-sm">Area</p>
                        <p className="text-xl font-bold">{activeRental?.property_details?.square_meters || "N/A"} m²</p>
                      </div>
                    </div>
                    
                    {/* Lease Progress */}
                    {activeRental && (
                      <div className="mb-6">
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="font-medium">Lease Progress</h3>
                          <span className="text-sm text-gray-500">
                            {calculateLeaseProgress(activeRental)}% Complete
                          </span>
                        </div>
                        <Progress value={calculateLeaseProgress(activeRental)} className="h-2" />
                        <div className="flex justify-between mt-2 text-xs text-gray-500">
                          <span>{formatDate(activeRental.start_date)}</span>
                          <span>{formatDate(activeRental.end_date)}</span>
                        </div>
                      </div>
                    )}
                    
                    {/* Property Description */}
                    {activeRental?.property_details?.description && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <h3 className="font-medium mb-2">Property Description</h3>
                        <p className="text-gray-600 text-sm">
                          {activeRental.property_details.description}
                        </p>
                      </div>
                    )}
                  </CardContent>
                  
                  <CardFooter className="bg-gray-50 border-t flex justify-between">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.open(`mailto:support@example.com?subject=Question about ${activeRental?.property_details?.title || 'my rental'}`)}
                    >
                      Contact Property Manager
                    </Button>
                    
                    <Button 
                      size="sm"
                      className="bg-primary hover:bg-primary/90"
                      onClick={() => setMaintenanceDialogOpen(true)}
                    >
                      Request Maintenance
                    </Button>
                  </CardFooter>
                </Card>
                
                {/* Sidebar Cards */}
                <div className="space-y-6">
                  {/* Lease Summary Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Lease Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Start Date</span>
                        <span className="font-medium">{activeRental ? formatDate(activeRental.start_date) : "N/A"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">End Date</span>
                        <span className="font-medium">{activeRental ? formatDate(activeRental.end_date) : "N/A"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Duration</span>
                        <span className="font-medium">
                          {activeRental ? Math.ceil((new Date(activeRental.end_date).getTime() - new Date(activeRental.start_date).getTime()) / (1000 * 60 * 60 * 24 * 30)) : 0} months
                        </span>
                      </div>
                      
                      {daysRemaining > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <div className="flex items-center">
                            <Clock className="h-5 w-5 text-amber-500 mr-2" />
                            <div>
                              <p className="font-medium">{daysRemaining} days remaining</p>
                              <p className="text-xs text-gray-500">Until lease expiration</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  
                  {/* Next Payment Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Next Payment</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center mb-4">
                        <Calendar className="h-10 w-10 text-primary mr-4" />
                        <div>
                          <p className="text-sm text-gray-500">Due Date</p>
                          <p className="text-xl font-bold">{formatDate(getNextPaymentDate().toISOString())}</p>
                        </div>
                      </div>
                      
                      <div className="p-4 bg-gray-50 rounded-lg mb-4">
                        <div className="flex justify-between mb-2">
                          <span className="text-gray-500">Amount Due</span>
                          <span className="font-bold">{formatCurrency(activeRental?.monthly_rent_tzs || 0)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Payment Method</span>
                          <span>Bank Transfer</span>
                        </div>
                      </div>
                      
                      <Button className="w-full bg-primary hover:bg-primary/90">
                        <CreditCard className="mr-2 h-4 w-4" />
                        Pay Now
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>No Active Rentals</CardTitle>
                  <CardDescription>You don't have any active rental agreements at the moment.</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="mb-4">Browse available properties to find your next home.</p>
                  <Button 
                    onClick={() => navigate('/properties')}
                    className="bg-primary hover:bg-primary/90"
                  >
                    <Home className="mr-2 h-4 w-4" />
                    Browse Properties
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          {/* Payments Tab */}
          <TabsContent value="payments" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Payment Summary */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Payment History</CardTitle>
                    <CardDescription>Your recent payment transactions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {payments.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50 text-xs uppercase">
                            <tr>
                              <th className="px-6 py-3 text-left font-medium text-gray-500">Date</th>
                              <th className="px-6 py-3 text-left font-medium text-gray-500">Receipt #</th>
                              <th className="px-6 py-3 text-left font-medium text-gray-500">Amount</th>
                              <th className="px-6 py-3 text-left font-medium text-gray-500">Method</th>
                              <th className="px-6 py-3 text-left font-medium text-gray-500">Status</th>
                              <th className="px-6 py-3 text-right font-medium text-gray-500">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {payments.map((payment) => (
                              <tr key={payment.name} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm">{formatDate(payment.payment_date)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{payment.receipt_number}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{formatCurrency(payment.amount_tzs)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">{payment.payment_method}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    payment.docstatus === 1 ? 'bg-green-100 text-green-800' : 
                                    payment.docstatus === 0 ? 'bg-yellow-100 text-yellow-800' : 
                                    'bg-red-100 text-red-800'
                                  }`}>
                                    {payment.docstatus === 1 ? (
                                      <><CheckCircle className="mr-1 h-3 w-3" /> Confirmed</>
                                    ) : payment.docstatus === 0 ? (
                                      <><Clock className="mr-1 h-3 w-3" /> Pending</>
                                    ) : (
                                      <><AlertCircle className="mr-1 h-3 w-3" /> Cancelled</>
                                    )}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                                  {payment.docstatus === 1 && (
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => handlePrintPayment(payment.name)}
                                    >
                                      <FileText className="mr-1 h-3 w-3" />
                                      Receipt
                                    </Button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-1">No payment records</h3>
                        <p className="text-gray-500">Your payment history will appear here</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
              
              {/* Payment Summary Card */}
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Payment Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-gray-500 text-sm">Total Paid</p>
                        <p className="text-2xl font-bold">
                          {formatCurrency(payments.reduce((sum, payment) => 
                            payment.docstatus === 1 ? sum + payment.amount_tzs : sum, 0))}
                        </p>
                      </div>
                      
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-gray-500 text-sm">Pending Payments</p>
                        <p className="text-2xl font-bold">
                          {formatCurrency(payments.reduce((sum, payment) => 
                            payment.docstatus === 0 ? sum + payment.amount_tzs : sum, 0))}
                        </p>
                      </div>
                      
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-gray-500 text-sm">Last Payment</p>
                        <p className="text-2xl font-bold">
                          {payments.length > 0 
                            ? formatDate(payments.sort((a, b) => 
                                new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime()
                              )[0].payment_date)
                            : "N/A"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
          
          {/* Documents Tab */}
          <TabsContent value="documents" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Lease Agreement</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-gray-600 text-sm">Your lease agreement document</p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="mt-4"
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Property Insurance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-gray-600 text-sm">Your property insurance document</p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="mt-4"
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Utility Bills</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-gray-600 text-sm">Your utility bills</p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="mt-4"
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Properties Tab */}
          <TabsContent value="properties" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {availableProperties.length > 0 ? (
                availableProperties.map((property) => (
                  <Card key={property.name} className="overflow-hidden">
                    <div className="h-48 bg-gray-100">
                      <img 
                        src={property.image ? `${FRAPPE_URL}${property.image}` : "https://via.placeholder.com/300x200?text=No+Image"} 
                        alt={property.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-medium text-lg mb-1">{property.title}</h3>
                      <div className="flex items-center text-gray-500 text-sm mb-3">
                        <Home size={14} className="mr-1" />
                        <span>{property.location}</span>
                      </div>
                      <div className="flex justify-between mb-4">
                        <div className="flex items-center text-sm">
                          <span>{property.bedrooms} Beds</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <span>{property.bathroom} Baths</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <span>{property.square_meters} m²</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="font-bold text-lg">{formatCurrency(property.price_tzs)}/mo</div>
                        <Button 
                          size="sm"
                          className="bg-primary hover:bg-primary/90"
                          onClick={() => toast.info("Contact property manager to inquire about this property")}
                        >
                          Inquire
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-3 text-center py-8">
                  <Home className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No available properties</h3>
                  <p className="text-gray-500 mb-4">There are no available properties at the moment.</p>
                  <Button 
                    variant="outline"
                    onClick={fetchAvailableProperties}
                  >
                    Refresh Properties
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Maintenance Tab */}
          <TabsContent value="maintenance" className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Maintenance Requests</CardTitle>
                  <CardDescription>View and manage your maintenance requests</CardDescription>
                </div>
                <Dialog open={maintenanceDialogOpen} onOpenChange={setMaintenanceDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-primary hover:bg-primary/90">New Request</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Submit Maintenance Request</DialogTitle>
                      <DialogDescription>
                        Fill in the details below to submit a new maintenance request.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Label htmlFor="title">
                        Title <span className="text-red-500">*</span>
                      </Label>
                      <Textarea
                        id="title"
                        placeholder="Enter the title of your request"
                        value={maintenanceRequest.title}
                        onChange={(e) =>
                          setMaintenanceRequest((prev) => ({ ...prev, title: e.target.value }))
                        }
                        className={validationErrors.title ? "border-red-500" : ""}
                      />
                      {validationErrors.title && (
                        <p className="text-red-500 text-sm">Title is required.</p>
                      )}

                      <Label htmlFor="category">
                        Category <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={maintenanceRequest.category}
                        onValueChange={(value) =>
                          setMaintenanceRequest((prev) => ({ ...prev, category: value }))
                        }
                      >
                        <SelectTrigger className={validationErrors.category ? "border-red-500" : ""}>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Plumbing">Plumbing</SelectItem>
                          <SelectItem value="Electrical">Electrical</SelectItem>
                          <SelectItem value="Appliance">Appliance</SelectItem>
                          <SelectItem value="Structural">Structural</SelectItem>
                          <SelectItem value="Pest">Pest</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      {validationErrors.category && (
                        <p className="text-red-500 text-sm">Category is required.</p>
                      )}

                      <Label htmlFor="description">
                        Description <span className="text-red-500">*</span>
                      </Label>
                      <Textarea
                        id="description"
                        placeholder="Describe the issue"
                        value={maintenanceRequest.description}
                        onChange={(e) =>
                          setMaintenanceRequest((prev) => ({ ...prev, description: e.target.value }))
                        }
                        className={validationErrors.description ? "border-red-500" : ""}
                      />
                      {validationErrors.description && (
                        <p className="text-red-500 text-sm">Description is required.</p>
                      )}

                      <Label htmlFor="priority">Priority</Label>
                      <Select
                        value={maintenanceRequest.priority}
                        onValueChange={(value) =>
                          setMaintenanceRequest((prev) => ({ ...prev, priority: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Low">Low</SelectItem>
                          <SelectItem value="Medium">Medium</SelectItem>
                          <SelectItem value="High">High</SelectItem>
                          <SelectItem value="Emergency">Emergency</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setMaintenanceDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleMaintenanceRequest} disabled={submitting}>
                        {submitting ? "Submitting..." : "Submit"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {loadingRequests ? (
                  <div className="text-center py-8">
                    <p>Loading maintenance requests...</p>
                  </div>
                ) : maintenanceRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No maintenance requests</h3>
                    <p className="text-gray-500 mb-4">You haven't submitted any maintenance requests yet.</p>
                    <Button onClick={() => setMaintenanceDialogOpen(true)} className="bg-primary hover:bg-primary/90">
                      Submit New Request
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {maintenanceRequests.map((request) => (
                      <div key={request.name} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-medium">{request.title}</h3>
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
                            {request.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-500 mb-2">
                          <span className="font-medium">Category:</span> {request.category} |{' '}
                          <span className="font-medium ml-2">Priority:</span> {request.priority}
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{request.description}</p>
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
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default TenantDashboard;
