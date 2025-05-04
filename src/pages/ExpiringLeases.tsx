import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
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

const ExpiringLeases: React.FC = () => {
  const navigate = useNavigate();
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExpiringRentals = async () => {
      setLoading(true);
      try {
        const result = await frappeClient.getRentals();
        
        if (result.success && result.data) {
          // Filter rentals that expire in the current month
          const now = new Date();
          const currentMonth = now.getMonth();
          const currentYear = now.getFullYear();
          
          const expiringRentals = result.data.filter(rental => {
            const endDate = new Date(rental.end_date);
            return endDate.getMonth() === currentMonth && 
                   endDate.getFullYear() === currentYear;
          });
          
          setRentals(expiringRentals);
        } else {
          toast.error(result.error || "Failed to fetch rentals");
        }
      } catch (error) {
        console.error("Error fetching rentals:", error);
        toast.error("An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchExpiringRentals();
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

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      'Active': 'bg-green-100 text-green-800',
      'Expired': 'bg-red-100 text-red-800',
      'Pending': 'bg-yellow-100 text-yellow-800',
      'Terminated': 'bg-gray-100 text-gray-800'
    };
    
    return (
      <Badge className={statusColors[status] || 'bg-blue-100 text-blue-800'}>
        {status}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Expiring Leases</h1>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => navigate('/rentals')}>
              Back to Rentals
            </Button>
            <Button 
              onClick={() => navigate('/rentals/create')}
              className="bg-harmony-500 hover:bg-harmony-600"
            >
              Create New Rental
            </Button>
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Leases Expiring This Month</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="p-6 text-center">Loading rentals...</div>
            ) : rentals.length === 0 ? (
              <div className="p-6 text-center">
                <p>No leases expiring this month.</p>
                <Button 
                  onClick={() => navigate('/rentals')}
                  className="mt-4 bg-harmony-500 hover:bg-harmony-600"
                >
                  View All Rentals
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Property</TableHead>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Monthly Rent</TableHead>
                    <TableHead>Total Rent</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rentals.map((rental) => (
                    <TableRow key={rental.name}>
                      <TableCell>{rental.property}</TableCell>
                      <TableCell>{rental.tenant}</TableCell>
                      <TableCell>
                        {formatDate(rental.start_date)} - {formatDate(rental.end_date)}
                      </TableCell>
                      <TableCell>{formatCurrency(rental.monthly_rent_tzs)}</TableCell>
                      <TableCell>{rental.total_rent_tzs ? formatCurrency(rental.total_rent_tzs) : 'N/A'}</TableCell>
                      <TableCell>{getStatusBadge(rental.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => navigate(`/rentals/${rental.name}`)}
                          >
                            View
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => navigate(`/rentals/edit/${rental.name}`)}
                          >
                            Edit
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default ExpiringLeases;