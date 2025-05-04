import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

const Payments: React.FC = () => {
  const navigate = useNavigate();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPayments = async () => {
      setLoading(true);
      try {
        const result = await frappeClient.getAllPayments();
        
        if (result.success && result.data) {
          setPayments(result.data as Payment[]);
        } else {
          toast.error(result.error || "Failed to fetch payments");
        }
      } catch (error) {
        console.error("Error fetching payments:", error);
        toast.error("An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, []);

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

  const getStatusBadge = (docstatus: number) => {
    if (docstatus === 0) {
      return <Badge className="bg-yellow-500">Draft</Badge>;
    } else if (docstatus === 1) {
      return <Badge className="bg-green-500">Submitted</Badge>;
    } else {
      return <Badge className="bg-red-500">Cancelled</Badge>;
    }
  };

  const handlePrint = (paymentId: string) => {
    const printUrl = frappeClient.getPaymentPrintUrl(paymentId);
    window.open(printUrl, '_blank');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Payment Records</h1>
          <Button 
            onClick={() => navigate('/payments/record')}
            className="bg-harmony-500 hover:bg-harmony-600"
          >
            Record New Payment
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Payments</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center p-6">
                <p>Loading payments...</p>
              </div>
            ) : payments.length === 0 ? (
              <div className="text-center p-6">
                <p>No payments found.</p>
                <Button 
                  onClick={() => navigate('/payments/record')}
                  className="mt-4 bg-harmony-500 hover:bg-harmony-600"
                >
                  Record First Payment
                </Button>
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
                      <TableHead>Status</TableHead>
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
                        <TableCell>{getStatusBadge(payment.docstatus)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handlePrint(payment.name)}
                            >
                              Print
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => navigate(`/payments/${payment.name}`)}
                            >
                              View
                            </Button>
                          </div>
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

export default Payments;
