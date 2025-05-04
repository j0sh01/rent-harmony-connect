
import React, { useEffect, useState } from 'react';
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { frappeClient, FRAPPE_URL } from "@/integrations/frappe/client";
import { toast } from "sonner";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";

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

  const handlePrintPayment = (paymentId: string) => {
    const printUrl = frappeClient.getPaymentPrintUrl(paymentId);
    window.open(printUrl, '_blank');
  };

  useEffect(() => {
    const fetchTenantData = async () => {
      if (!user?.email) {
        toast.error("User email not found. Please log in again.");
        navigate('/auth');
        return;
      }
      
      try {
        setLoading(true);
        console.log("Fetching data for user:", user);
        
        // Use the alternative method that doesn't rely on custom API
        const { success: rentalSuccess, data: rentalData, error: rentalError } = 
          await frappeClient.getTenantRentalsByEmail(user.email);
        
        if (!rentalSuccess || !rentalData || rentalData.length === 0) {
          console.error("Failed to fetch rentals:", rentalError);
          toast.error("No rentals found for your account");
          setLoading(false);
          return;
        }
        
        console.log("Tenant rentals:", rentalData);
        
        // For each rental, fetch the property details
        const rentalsWithProperties = await Promise.all(
          rentalData.map(async (rental) => {
            const { success: propertySuccess, data: propertyData } = 
              await frappeClient.getProperty(rental.property);
              
            return {
              ...rental,
              property_details: propertySuccess ? propertyData : undefined
            };
          })
        );
        
        console.log("Rentals with properties:", rentalsWithProperties);
        setRentals(rentalsWithProperties);
        
        // If there's at least one rental, fetch its payments
        if (rentalData.length > 0) {
          const { success: paymentSuccess, data: paymentData, error: paymentError } = 
            await frappeClient.getPaymentsByRental(rentalData[0].name);
            
          if (paymentSuccess && paymentData) {
            console.log("Rental payments:", paymentData);
            setPayments(paymentData.map(payment => ({
              name: payment.name,
              amount_tzs: payment.amount_tzs,
              payment_date: payment.payment_date,
              payment_method: payment.payment_method,
              receipt_number: payment.receipt_number,
              docstatus: payment.docstatus ?? 0, 
            })));
          } else {
            console.error("Failed to fetch payments:", paymentError);
            // Don't show error toast for payments, just log it
            console.warn("No payment data available");
          }
        }
      } catch (error) {
        console.error("Error fetching tenant data:", error);
        toast.error("Failed to load your dashboard data");
      } finally {
        setLoading(false);
      }
    };
    
    fetchTenantData();
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
        <div className="container mx-auto py-8">
          <h1 className="text-2xl font-bold mb-6">Loading your dashboard...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold mb-6">Tenant Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {rentals.length > 0 ? (
            rentals.map((rental) => (
              <Card key={rental.name} className="overflow-hidden">
                <CardHeader className="pb-0">
                  <CardTitle>{rental.property_details?.title || "Property"}</CardTitle>
                  <CardDescription>{rental.property_details?.location || "Location unavailable"}</CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  {rental.property_details?.image && (
                    <HoverCard>
                      <HoverCardTrigger asChild>
                        <div className="w-full h-48 mb-4 overflow-hidden rounded-md cursor-pointer transition-transform duration-300 hover:scale-105">
                          <img 
                            src={rental.property_details.image.startsWith('http') 
                              ? rental.property_details.image 
                              : `${FRAPPE_URL}${rental.property_details.image}`} 
                            alt={rental.property_details.title} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </HoverCardTrigger>
                      <HoverCardContent className="w-80">
                        <div className="space-y-2">
                          <h4 className="text-sm font-semibold">{rental.property_details.title}</h4>
                          <p className="text-sm">{rental.property_details.location}</p>
                          {rental.property_details.description && (
                            <p className="text-xs text-gray-500">{rental.property_details.description}</p>
                          )}
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                  )}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Lease Start</p>
                      <p className="font-medium">{formatDate(rental.start_date)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Lease End</p>
                      <p className="font-medium">{formatDate(rental.end_date)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Monthly Rent</p>
                      <p className="font-medium">{formatCurrency(rental.monthly_rent_tzs)}</p>
                    </div>
                    {rental.property_details?.bedrooms && (
                      <div>
                        <p className="text-gray-500">Bedrooms</p>
                        <p className="font-medium">{rental.property_details.bedrooms}</p>
                      </div>
                    )}
                    {rental.property_details?.bathroom && (
                      <div>
                        <p className="text-gray-500">Bathrooms</p>
                        <p className="font-medium">{rental.property_details.bathroom}</p>
                      </div>
                    )}
                    {rental.property_details?.square_meters && (
                      <div>
                        <p className="text-gray-500">Area</p>
                        <p className="font-medium">{rental.property_details.square_meters} m²</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Lease status */}
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex justify-between items-center">
                      <p className="text-gray-500">Lease Status</p>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        new Date(rental.end_date) > new Date() ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {new Date(rental.end_date) > new Date() ? "Active" : "Expired"}
                      </span>
                    </div>
                    
                    {/* Days remaining calculation */}
                    {new Date(rental.end_date) > new Date() && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-500">
                          {Math.ceil((new Date(rental.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days remaining
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="bg-gray-50 border-t">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => window.open(`mailto:support@example.com?subject=Question about ${rental.property_details?.title || 'my rental'}`)}
                  >
                    Contact Property Manager
                  </Button>
                </CardFooter>
              </Card>
            ))
          ) : (
            <Card className="col-span-full">
              <CardHeader>
                <CardTitle>No Active Rentals</CardTitle>
              </CardHeader>
              <CardContent>
                <p>You don't have any active rental agreements at the moment.</p>
              </CardContent>
            </Card>
          )}
        </div>
        
        {/* Payment Summary Card */}
        {payments.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Payment Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
        )}
        
        <h2 className="text-xl font-bold mb-4">Recent Payments</h2>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {payments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Receipt #</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {payments.map((payment) => (
                    <tr key={payment.name}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{formatDate(payment.payment_date)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{formatCurrency(payment.amount_tzs)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{payment.payment_method}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{payment.receipt_number}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          payment.docstatus === 1 ? 'bg-green-100 text-green-800' : 
                          payment.docstatus === 0 ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-red-100 text-red-800'
                        }`}>
                          {payment.docstatus === 1 ? "Submitted" : 
                           payment.docstatus === 0 ? "Draft" : 
                           "Cancelled"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                        {payment.docstatus === 1 && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handlePrintPayment(payment.name)}
                          >
                            Print
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6 text-center text-gray-500">
              No payment records found.
            </div>
          )}
        </div>
        
        {/* Upcoming Payments Section */}
        {rentals.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-bold mb-4">Upcoming Payments</h2>
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => {
                    const dueDate = new Date();
                    dueDate.setMonth(dueDate.getMonth() + i + 1);
                    
                    return (
                      <div key={i} className="flex justify-between items-center p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">Monthly Rent</p>
                          <p className="text-sm text-gray-500">Due {formatDate(dueDate.toISOString())}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{formatCurrency(rentals[0].monthly_rent_tzs)}</p>
                          <Button size="sm" variant="outline" className="mt-2">
                            Pay Now
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default TenantDashboard;
