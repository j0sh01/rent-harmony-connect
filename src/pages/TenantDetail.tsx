import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/ui/Sidebar";
import { frappeClient, FRAPPE_URL } from "@/integrations/frappe/client";
import { toast } from "sonner";
import { User, Mail, Phone, Calendar, Home, CreditCard, ArrowLeft, Plus, Edit, Trash2, Eye } from 'lucide-react';

interface Tenant {
  name: string;
  full_name: string;
  email: string;
  phone: string;
  enabled: number;
  created_at?: string;
}

interface Property {
  name: string;
  title: string;
  location: string;
  price_tzs: number;
  status: string;
  image?: string;
  bedrooms?: number;
  bathroom?: number;
  square_meters?: number;
}

interface Rental {
  name: string;
  tenant: string;
  property: string;
  property_title?: string;
  property_details?: Property;
  start_date: string;
  end_date: string;
  monthly_rent_tzs: number;
  status: string;
}

interface Payment {
  name: string;
  rental: string;
  rental_name?: string;
  property_name?: string;
  amount_tzs: number;
  payment_date: string;
  payment_method: string;
  receipt_number: string;
  docstatus: number;
}

interface RentalForm {
  property: string;
  start_date: string;
  end_date: string;
  monthly_rent_tzs: number;
  frequency: string;
  total_rent_tzs: number;
}

const TenantDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [availableProperties, setAvailableProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [rentalForm, setRentalForm] = useState<RentalForm>({
    property: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
    monthly_rent_tzs: 0,
    frequency: '12',
    total_rent_tzs: 0
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        // Fetch tenant details
        const tenantResult = await frappeClient.getTenant(id);
        if (tenantResult.success && tenantResult.data) {
          setTenant(tenantResult.data);
        } else {
          toast.error("Failed to load tenant details");
          navigate('/users');
          return;
        }

        // Fetch tenant's rentals
        const rentalsResult = await frappeClient.getTenantRentalsByEmail(id);
        if (rentalsResult.success && rentalsResult.data) {
          // For each rental, fetch the property details
          const rentalsWithProperties = await Promise.all(
            rentalsResult.data.map(async (rental) => {
              const { success: propertySuccess, data: propertyData } = 
                await frappeClient.getProperty(rental.property);
                
              return {
                ...rental,
                property_details: propertySuccess ? propertyData : undefined
              };
            })
          );
          
          setRentals(rentalsWithProperties);
          
          // Fetch payments for each rental
          const allPayments: Payment[] = [];
          for (const rental of rentalsResult.data) {
            const paymentsResult = await frappeClient.getPaymentsByRental(rental.name);
            if (paymentsResult.success && paymentsResult.data) {
              // Add rental name to each payment for reference
              const paymentsWithRental = paymentsResult.data.map(payment => ({
                ...payment,
                rental_name: rental.name,
                property_name: rental.property
              }));
              allPayments.push(...paymentsWithRental);
            }
          }
          setPayments(allPayments);
        }

        // Fetch available properties
        const propertiesResult = await frappeClient.getProperties();
        if (propertiesResult.success && propertiesResult.data) {
          const available = propertiesResult.data.filter(
            (property: Property) => property.status === 'Available'
          );
          setAvailableProperties(available);
        }
      } catch (error) {
        console.error("Error fetching tenant data:", error);
        toast.error("An error occurred while loading tenant data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, navigate]);

  const handlePropertySelect = (propertyId: string) => {
    const selectedProperty = availableProperties.find(p => p.name === propertyId);
    const monthlyRent = selectedProperty ? selectedProperty.price_tzs : 0;
    const totalRent = monthlyRent * parseInt(rentalForm.frequency);
    
    setRentalForm({
      ...rentalForm,
      property: propertyId,
      monthly_rent_tzs: monthlyRent,
      total_rent_tzs: totalRent
    });
  };

  const handleFrequencyChange = (value: string) => {
    const months = parseInt(value);
    
    // Calculate new end date based on start date and frequency
    const startDate = new Date(rentalForm.start_date);
    const endDate = new Date(startDate);
    
    // Properly adjust the date by adding months
    // This handles month/year rollover correctly
    const newMonth = endDate.getMonth() + months;
    endDate.setMonth(newMonth);
    
    // Calculate total rent
    const totalRent = rentalForm.monthly_rent_tzs * months;
    
    setRentalForm({
      ...rentalForm,
      frequency: value,
      end_date: endDate.toISOString().split('T')[0],
      total_rent_tzs: totalRent
    });
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const startDate = e.target.value;
    
    // Recalculate end date based on frequency
    const newStartDate = new Date(startDate);
    const endDate = new Date(newStartDate);
    
    // Properly adjust the date by adding months
    const months = parseInt(rentalForm.frequency);
    const newMonth = endDate.getMonth() + months;
    endDate.setMonth(newMonth);
    
    setRentalForm({
      ...rentalForm,
      start_date: startDate,
      end_date: endDate.toISOString().split('T')[0]
    });
  };

  const handleRentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const monthlyRent = parseInt(e.target.value);
    const totalRent = monthlyRent * parseInt(rentalForm.frequency);
    
    setRentalForm({
      ...rentalForm,
      monthly_rent_tzs: monthlyRent,
      total_rent_tzs: totalRent
    });
  };

  const handleAssignProperty = async () => {
    if (!tenant || !rentalForm.property) {
      toast.error("Please select a property");
      return;
    }

    setSubmitting(true);
    try {
      // Create rental record
      const rentalResult = await frappeClient.createRental({
        property: rentalForm.property,
        tenant: tenant.name,
        start_date: rentalForm.start_date,
        end_date: rentalForm.end_date,
        monthly_rent_tzs: rentalForm.monthly_rent_tzs,
        status: 'Active',
        frequency: rentalForm.frequency,
        total_rent_tzs: rentalForm.total_rent_tzs
      });

      if (rentalResult.success) {
        // Update property status to Rented
        await frappeClient.updateProperty(rentalForm.property, {
          status: 'Rented'
        });

        toast.success("Property assigned successfully");
        setDialogOpen(false);
        
        // Refresh rentals data
        const rentalsResult = await frappeClient.getTenantRentalsByEmail(tenant.email);
        if (rentalsResult.success && rentalsResult.data) {
          // For each rental, fetch the property details
          const rentalsWithProperties = await Promise.all(
            rentalsResult.data.map(async (rental) => {
              const { success: propertySuccess, data: propertyData } = 
                await frappeClient.getProperty(rental.property);
                
              return {
                ...rental,
                property_details: propertySuccess ? propertyData : undefined
              };
            })
          );
          
          setRentals(rentalsWithProperties);
        }
        
        // Update available properties
        setAvailableProperties(availableProperties.filter(p => p.name !== rentalForm.property));
      } else {
        toast.error(rentalResult.error || "Failed to assign property");
      }
    } catch (error) {
      console.error("Error assigning property:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  };

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

  const handlePrintPayment = (paymentId: string) => {
    const printUrl = frappeClient.getPaymentPrintUrl(paymentId);
    window.open(printUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f9fa]">
        <Sidebar role="admin" />
        <div className="ml-[240px]">
          <Navbar />
          <main className="p-6">
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00b3d7]"></div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="min-h-screen bg-[#f8f9fa]">
        <Sidebar role="admin" />
        <div className="ml-[240px]">
          <Navbar />
          <main className="p-6">
            <div className="text-center py-16">
              <h2 className="text-xl font-semibold mb-2">Tenant Not Found</h2>
              <p className="text-gray-500 mb-4">The tenant you're looking for doesn't exist or has been removed.</p>
              <Button onClick={() => navigate('/users')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Tenants
              </Button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <Sidebar role="admin" />
      <div className="ml-[240px]">
        <Navbar />
        <main className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              <Button 
                variant="outline" 
                size="sm" 
                className="mr-4"
                onClick={() => navigate('/users')}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <h1 className="text-2xl font-bold">Tenant Details</h1>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => navigate(`/tenants/edit/${tenant.name}`)}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit Tenant
              </Button>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-[#00b3d7] hover:bg-[#009bbf] text-white">
                    <Plus className="mr-2 h-4 w-4" />
                    Assign Property
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Assign Property to {tenant.full_name}</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="property">Select Property</Label>
                      <Select 
                        value={rentalForm.property} 
                        onValueChange={handlePropertySelect}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select property" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableProperties.length === 0 ? (
                            <SelectItem value="none" disabled>No available properties</SelectItem>
                          ) : (
                            availableProperties.map(property => (
                              <SelectItem key={property.name} value={property.name}>
                                {property.title} - {property.location}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="start_date">Start Date</Label>
                      <Input 
                        id="start_date" 
                        type="date" 
                        value={rentalForm.start_date}
                        onChange={handleStartDateChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="frequency">Rental Period (Months)</Label>
                      <Select 
                        value={rentalForm.frequency} 
                        onValueChange={handleFrequencyChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select period" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 Month</SelectItem>
                          <SelectItem value="2">2 Months</SelectItem>
                          <SelectItem value="3">3 Months</SelectItem>
                          <SelectItem value="4">4 Months</SelectItem>
                          <SelectItem value="5">5 Months</SelectItem>
                          <SelectItem value="6">6 Months</SelectItem>
                          <SelectItem value="7">7 Months</SelectItem>
                          <SelectItem value="8">8 Months</SelectItem>
                          <SelectItem value="9">9 Months</SelectItem>
                          <SelectItem value="10">10 Months</SelectItem>
                          <SelectItem value="11">11 Months</SelectItem>
                          <SelectItem value="12">12 Months</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="end_date">End Date (Calculated)</Label>
                      <Input 
                        id="end_date" 
                        type="date" 
                        value={rentalForm.end_date}
                        disabled
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="monthly_rent_tzs">Monthly Rent (TZS)</Label>
                      <Input 
                        id="monthly_rent_tzs" 
                        type="number" 
                        value={rentalForm.monthly_rent_tzs}
                        onChange={handleRentChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="total_rent_tzs">Total Rent (TZS)</Label>
                      <Input 
                        id="total_rent_tzs" 
                        type="number" 
                        value={rentalForm.total_rent_tzs}
                        disabled
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                    <Button 
                      onClick={handleAssignProperty}
                      className="bg-[#00b3d7] hover:bg-[#009bbf] text-white"
                      disabled={submitting || !rentalForm.property}
                    >
                      {submitting ? "Processing..." : "Assign Property"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <div className="flex flex-col md:flex-row">
              <div className="md:w-1/4 mb-4 md:mb-0 flex justify-center md:justify-start">
                <div className="h-24 w-24 rounded-full bg-[#e6f7ff] flex items-center justify-center text-[#00b3d7] text-3xl font-medium">
                  {tenant.full_name.charAt(0)}
                </div>
              </div>
              <div className="md:w-3/4">
                <h2 className="text-2xl font-bold mb-2">{tenant.full_name}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center">
                    <Mail className="h-5 w-5 text-gray-400 mr-2" />
                    <span>{tenant.email}</span>
                  </div>
                  <div className="flex items-center">
                    <Phone className="h-5 w-5 text-gray-400 mr-2" />
                    <span>{tenant.phone || "No phone number"}</span>
                  </div>
                  <div className="flex items-center">
                    <User className="h-5 w-5 text-gray-400 mr-2" />
                    <span>ID: {tenant.name}</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 text-gray-400 mr-2" />
                    <span>Joined: {tenant.created_at ? formatDate(tenant.created_at) : "Unknown"}</span>
                  </div>
                </div>
                <div className="mt-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    tenant.enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {tenant.enabled ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="properties">Properties</TabsTrigger>
              <TabsTrigger value="payments">Payment History</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Property Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Total Properties</span>
                        <span className="font-semibold">{rentals.length}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Active Leases</span>
                        <span className="font-semibold">
                          {rentals.filter(rental => rental.status === 'Active').length}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Monthly Rent (Total)</span>
                        <span className="font-semibold">
                          {formatCurrency(rentals.reduce((sum, rental) => sum + rental.monthly_rent_tzs, 0))}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Payment Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Total Payments</span>
                        <span className="font-semibold">{payments.length}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Total Amount Paid</span>
                        <span className="font-semibold">
                          {formatCurrency(payments.reduce((sum, payment) => sum + payment.amount_tzs, 0))}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Last Payment</span>
                        <span className="font-semibold">
                          {payments.length > 0 
                            ? formatDate(payments.sort((a, b) => 
                                new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime()
                              )[0].payment_date) 
                            : "No payments"}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="properties">
              {rentals.length === 0 ? (
                <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
                  <p className="text-gray-500 mb-4">This tenant has no properties assigned.</p>
                  <Button 
                    onClick={() => setDialogOpen(true)}
                    className="bg-[#00b3d7] hover:bg-[#009bbf] text-white"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Assign Property
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  {rentals.map((rental) => (
                    <Card key={rental.name}>
                      <CardContent className="p-0">
                        <div className="flex flex-col md:flex-row">
                          <div className="md:w-1/3 p-6 bg-gray-50 border-r border-gray-200">
                            <div className="flex items-center mb-4">
                              <Home className="h-5 w-5 text-[#00b3d7] mr-2" />
                              <h3 className="font-semibold text-lg">
                                {rental.property_details?.title || rental.property}
                              </h3>
                            </div>
                            <div className="space-y-3 text-sm">
                              <div>
                                <span className="text-gray-500 block">Location:</span>
                                <span>{rental.property_details?.location || "Unknown"}</span>
                              </div>
                              {rental.property_details?.bedrooms && (
                                <div>
                                  <span className="text-gray-500 block">Bedrooms:</span>
                                  <span>{rental.property_details.bedrooms}</span>
                                </div>
                              )}
                              {rental.property_details?.bathroom && (
                                <div>
                                  <span className="text-gray-500 block">Bathrooms:</span>
                                  <span>{rental.property_details.bathroom}</span>
                                </div>
                              )}
                              {rental.property_details?.square_meters && (
                                <div>
                                  <span className="text-gray-500 block">Area:</span>
                                  <span>{rental.property_details.square_meters} m²</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="md:w-2/3 p-6">
                            <div className="flex justify-between mb-4">
                              <h3 className="font-semibold text-lg">Rental Details</h3>
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                rental.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {rental.status}
                              </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                              <div>
                                <span className="text-gray-500 block text-sm">Start Date:</span>
                                <span>{formatDate(rental.start_date)}</span>
                              </div>
                              <div>
                                <span className="text-gray-500 block text-sm">End Date:</span>
                                <span>{formatDate(rental.end_date)}</span>
                              </div>
                              <div>
                                <span className="text-gray-500 block text-sm">Monthly Rent:</span>
                                <span className="font-semibold">{formatCurrency(rental.monthly_rent_tzs)}</span>
                              </div>
                              <div>
                                <span className="text-gray-500 block text-sm">Rental ID:</span>
                                <span>{rental.name}</span>
                              </div>
                            </div>
                            <div className="flex justify-end space-x-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => navigate(`/rentals/${rental.name}`)}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View Rental
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="payments">
              {payments.length === 0 ? (
                <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
                  <p className="text-gray-500 mb-4">No payment records found for this tenant.</p>
                  {rentals.length > 0 && (
                    <Button 
                      onClick={() => navigate(`/rentals/${rentals[0].name}`)}
                      className="bg-[#00b3d7] hover:bg-[#009bbf] text-white"
                    >
                      <CreditCard className="mr-2 h-4 w-4" />
                      Record Payment
                    </Button>
                  )}
                </div>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Payment History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Receipt #</TableHead>
                          <TableHead>Property</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Method</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payments.map((payment) => (
                          <TableRow key={payment.name}>
                            <TableCell>{payment.receipt_number}</TableCell>
                            <TableCell>
                              {rentals.find(r => r.name === payment.rental)?.property_details?.title || payment.property_name || payment.rental}
                            </TableCell>
                            <TableCell>{formatDate(payment.payment_date)}</TableCell>
                            <TableCell>{formatCurrency(payment.amount_tzs)}</TableCell>
                            <TableCell>{payment.payment_method}</TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                payment.docstatus === 1 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {payment.docstatus === 1 ? "Submitted" : "Draft"}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handlePrintPayment(payment.name)}
                              >
                                Print
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
};

export default TenantDetail;
