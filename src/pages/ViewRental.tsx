import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Navbar from "@/components/Navbar";
import { frappeClient } from "@/integrations/frappe/client";
import { toast } from "sonner";

interface Rental {
  name: string;
  property: string;
  tenant: string;
  status: string;
  monthly_rent_tzs: number;
  total_rent_tzs?: number;
  start_date: string;
  end_date: string;
  frequency?: string | number;
}

interface Payment {
  rental: string;
  amount_tzs: number;
  payment_date: string;
  payment_method: string;
  receipt_number: string;
}

const ViewRental: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [rental, setRental] = useState<Rental | null>(null);
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [paymentForm, setPaymentForm] = useState<Omit<Payment, 'name'>>({
    rental: '',
    amount_tzs: 0,
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'Cash',
    receipt_number: ''
  });

  useEffect(() => {
    const fetchRentalAndPayments = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        // Fetch rental details
        const rentalResult = await frappeClient.getRental(id);
        
        if (rentalResult.success && rentalResult.data) {
          setRental(rentalResult.data);
          setPaymentForm(prev => ({
            ...prev,
            rental: rentalResult.data.name,
            amount_tzs: rentalResult.data.monthly_rent_tzs
          }));
          
          // Fetch payments for this rental
          const paymentsResult = await frappeClient.getRentalPayments(rentalResult.data.name);
          if (paymentsResult.success && paymentsResult.data) {
            console.log("Fetched payments:", paymentsResult.data);
            
            // If we only get payment names, fetch the full payment details for each
            if (paymentsResult.data.length > 0 && paymentsResult.data[0].name && !paymentsResult.data[0].payment_date) {
              const fullPayments = await Promise.all(
                paymentsResult.data.map(async (payment) => {
                  const paymentDetails = await frappeClient.getPayment(payment.name);
                  return paymentDetails.success ? paymentDetails.data : null;
                })
              );
              
              // Filter out any null values and set the payments
              setPayments(fullPayments.filter(Boolean));
            } else {
              setPayments(paymentsResult.data);
            }
          }
        } else {
          toast.error(rentalResult.error || "Failed to fetch rental details");
          navigate('/rentals');
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("An unexpected error occurred");
        navigate('/rentals');
      } finally {
        setLoading(false);
      }
    };

    fetchRentalAndPayments();
  }, [id, navigate]);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "N/A";
      }
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "N/A";
    }
  };

  const formatCurrency = (amount: number) => {
    try {
      if (isNaN(amount)) {
        return "N/A";
      }
      return new Intl.NumberFormat('en-TZ', {
        style: 'currency',
        currency: 'TZS',
        minimumFractionDigits: 0
      }).format(amount);
    } catch (error) {
      console.error("Error formatting currency:", error);
      return "N/A";
    }
  };

  const handlePaymentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPaymentForm(prev => ({
      ...prev,
      [name]: name === 'amount_tzs' ? Number(value) : value
    }));
  };

  const handlePaymentMethodChange = (value: string) => {
    setPaymentForm(prev => ({
      ...prev,
      payment_method: value
    }));
  };

  const handlePaymentDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPaymentForm(prev => ({
      ...prev,
      payment_date: e.target.value
    }));
  };

  const handleRecordPayment = async () => {
    if (!paymentForm.receipt_number) {
      toast.error("Please enter a receipt number");
      return;
    }

    if (paymentForm.amount_tzs <= 0) {
      toast.error("Payment amount must be greater than zero");
      return;
    }

    setSubmitting(true);
    try {
      const result = await frappeClient.createPayment({
        rental: paymentForm.rental,
        amount_tzs: paymentForm.amount_tzs,
        payment_date: paymentForm.payment_date,
        payment_method: paymentForm.payment_method,
        receipt_number: paymentForm.receipt_number
      });

      if (result.success) {
        toast.success("Payment recorded successfully");
        setPaymentDialogOpen(false);
        
        // Refresh payments list - use rental.name instead of id
        const paymentsResult = await frappeClient.getRentalPayments(rental?.name || '');
        if (paymentsResult.success && paymentsResult.data) {
          setPayments(paymentsResult.data);
        }
        
        // Reset form
        setPaymentForm(prev => ({
          ...prev,
          amount_tzs: rental?.monthly_rent_tzs || 0,
          payment_date: new Date().toISOString().split('T')[0],
          payment_method: 'Cash',
          receipt_number: ''
        }));
      } else {
        toast.error(result.error || "Failed to record payment");
      }
    } catch (error) {
      console.error("Error recording payment:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Rental Details</h1>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => navigate('/rentals')}>
              Back to Rentals
            </Button>
            {rental && (
              <>
                <Button 
                  onClick={() => navigate(`/rentals/edit/${rental.name}`)}
                  className="bg-harmony-500 hover:bg-harmony-600"
                >
                  Edit Rental
                </Button>
                <Button 
                  onClick={() => setPaymentDialogOpen(true)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Record Payment
                </Button>
              </>
            )}
          </div>
        </div>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Rental Information</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="p-6 text-center">Loading rental details...</div>
            ) : rental ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h2 className="text-xl font-semibold mb-4">Property & Tenant</h2>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Property</h3>
                      <p className="mt-1 text-lg">{rental.property}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Tenant</h3>
                      <p className="mt-1 text-lg">{rental.tenant}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Status</h3>
                      <div className="mt-1">
                        <Badge className={
                          rental.status === 'Active' ? 'bg-green-100 text-green-800' :
                          rental.status === 'Expired' ? 'bg-red-100 text-red-800' :
                          rental.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }>
                          {rental.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h2 className="text-xl font-semibold mb-4">Rental Terms</h2>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Rental Period</h3>
                      <p className="mt-1 text-lg">
                        {formatDate(rental.start_date)} - {formatDate(rental.end_date)}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Monthly Rent</h3>
                      <p className="mt-1 text-lg">{formatCurrency(rental.monthly_rent_tzs)}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Total Rent</h3>
                      <p className="mt-1 text-lg">{rental.total_rent_tzs ? formatCurrency(rental.total_rent_tzs) : 'N/A'}</p>
                    </div>
                    {rental.frequency && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Rental Frequency (Months)</h3>
                        <p className="mt-1 text-lg">{rental.frequency}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center">Rental not found</div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
          </CardHeader>
          <CardContent>
            {payments.length === 0 ? (
              <div className="p-6 text-center">
                <p>No payments recorded yet.</p>
                <Button 
                  onClick={() => setPaymentDialogOpen(true)}
                  className="mt-4 bg-green-600 hover:bg-green-700"
                >
                  Record First Payment
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-4">Date</th>
                      <th className="text-left py-2 px-4">Amount</th>
                      <th className="text-left py-2 px-4">Method</th>
                      <th className="text-left py-2 px-4">Receipt #</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment) => (
                      <tr key={`${payment.rental}-${payment.receipt_number}`} className="border-b">
                        <td className="py-2 px-4">{formatDate(payment.payment_date)}</td>
                        <td className="py-2 px-4">{formatCurrency(payment.amount_tzs)}</td>
                        <td className="py-2 px-4">{payment.payment_method}</td>
                        <td className="py-2 px-4">{payment.receipt_number}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="amount_tzs">Payment Amount (TZS)</Label>
              <Input
                id="amount_tzs"
                name="amount_tzs"
                type="number"
                value={paymentForm.amount_tzs}
                onChange={handlePaymentChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="payment_date">Payment Date</Label>
              <Input
                id="payment_date"
                name="payment_date"
                type="date"
                value={paymentForm.payment_date}
                onChange={handlePaymentDateChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="payment_method">Payment Method</Label>
              <Select
                value={paymentForm.payment_method}
                onValueChange={handlePaymentMethodChange}
              >
                <SelectTrigger id="payment_method">
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                  <SelectItem value="Mobile Money">Mobile Money</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="receipt_number">Receipt Number</Label>
              <Input
                id="receipt_number"
                name="receipt_number"
                type="text"
                value={paymentForm.receipt_number}
                onChange={handlePaymentChange}
                required
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleRecordPayment}
              className="bg-green-600 hover:bg-green-700"
              disabled={submitting}
            >
              {submitting ? "Processing..." : "Record Payment"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ViewRental;
