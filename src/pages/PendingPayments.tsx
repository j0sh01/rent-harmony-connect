import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import { frappeClient } from "@/integrations/frappe/client";
import { toast } from "sonner";

interface Payment {
  name: string;
  rental: string;
  amount_tzs: number;
  payment_date: string;
  payment_method: string;
  receipt_number: string;
  docstatus: number;
}

const PendingPayments: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);

  useEffect(() => {
    fetchPendingPayments();
  }, []);

  const fetchPendingPayments = async () => {
    setLoading(true);
    try {
      const result = await frappeClient.getPendingPayments();
      
      if (result.success && result.data) {
        setPayments(result.data as Payment[]);
      } else {
        toast.error(result.error || "Failed to fetch pending payments");
      }
    } catch (error) {
      console.error("Error fetching pending payments:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitPayment = async (paymentId: string) => {
    setSubmitting(paymentId);
    try {
      const result = await frappeClient.submitPayment(paymentId);
      
      if (result.success) {
        toast.success("Payment submitted successfully");
        // Remove the submitted payment from the list
        setPayments(payments.filter(payment => payment.name !== paymentId));
      } else {
        toast.error(result.error || "Failed to submit payment");
      }
    } catch (error) {
      console.error("Error submitting payment:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setSubmitting(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Pending Payments</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Payments Awaiting Submission</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center p-6">
                <p>Loading pending payments...</p>
              </div>
            ) : payments.length === 0 ? (
              <div className="text-center p-6">
                <p>No pending payments found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Receipt #</TableHead>
                      <TableHead>Rental</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment.name}>
                        <TableCell>{payment.receipt_number}</TableCell>
                        <TableCell>{payment.rental}</TableCell>
                        <TableCell>{formatDate(payment.payment_date)}</TableCell>
                        <TableCell>{formatCurrency(payment.amount_tzs)}</TableCell>
                        <TableCell>{payment.payment_method}</TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="default" 
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handleSubmitPayment(payment.name)}
                            disabled={submitting === payment.name}
                          >
                            {submitting === payment.name ? "Submitting..." : "Submit Payment"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default PendingPayments;