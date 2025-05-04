import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/components/ui/sonner';
import { frappeClient } from '@/integrations/frappe/client';
import { Badge } from '@/components/ui/badge';
import Navbar from '@/components/Navbar';

interface Tenant {
  name: string;
  full_name: string;
  email: string;
  phone: string;
  enabled: number;
}

const TenantManagement: React.FC = () => {
  const navigate = useNavigate();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTenants = async () => {
      setLoading(true);
      try {
        const result = await frappeClient.getTenants();
        console.log("Tenant fetch result:", result);
        
        if (result.success && result.data) {
          setTenants(result.data);
        } else {
          toast.error(result.error || "Failed to fetch tenants");
        }
      } catch (error) {
        console.error("Error fetching tenants:", error);
        toast.error("An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchTenants();
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Tenant Management</h1>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => navigate('/admin-dashboard')}>
              Back to Dashboard
            </Button>
            <Button 
              onClick={() => navigate('/tenants/create')}
              className="bg-harmony-500 hover:bg-harmony-600"
            >
              Add New Tenant
            </Button>
          </div>
        </div>
        
        <p className="text-gray-500 mb-6">View and manage tenant information and accounts.</p>
        
        {loading ? (
          <div className="text-center py-4">Loading tenants...</div>
        ) : tenants.length === 0 ? (
          <div className="text-center py-4">
            <p>No tenants found.</p>
            <Button 
              onClick={() => navigate('/tenants/create')}
              className="mt-4 bg-harmony-500 hover:bg-harmony-600"
            >
              Add Your First Tenant
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenants.map((tenant) => (
                <TableRow key={tenant.name}>
                  <TableCell className="font-medium">{tenant.full_name}</TableCell>
                  <TableCell>{tenant.email}</TableCell>
                  <TableCell>{tenant.phone || 'N/A'}</TableCell>
                  <TableCell>
                    <Badge variant={tenant.enabled ? "default" : "destructive"} className={tenant.enabled ? "bg-yellow-100 text-yellow-800" : ""}>
                      {tenant.enabled ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigate(`/tenants/edit/${tenant.name}`)}
                      >
                        Edit
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm"
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </main>
    </div>
  );
};

export default TenantManagement;
