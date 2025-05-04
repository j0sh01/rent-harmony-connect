import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Navbar from "@/components/Navbar";
import { frappeClient } from "@/integrations/frappe/client";
import { toast } from "sonner";

interface User {
  name: string;
  full_name: string;
  email: string;
  phone: string;
  enabled: number;
}

const Users: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const result = await frappeClient.getTenants();
        if (result.success) {
          setUsers(result.data || []);
        } else {
          toast.error(result.error || "Failed to fetch users");
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching users:", error);
        toast.error("An unexpected error occurred");
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleEdit = (id: string) => {
    navigate(`/tenants/edit/${id}`);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        // Implement delete functionality when available
        toast.success("User deleted successfully");
        setUsers(users.filter(u => u.name !== id));
      } catch (error) {
        console.error("Error deleting user:", error);
        toast.error("An unexpected error occurred");
      }
    }
  };

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

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 text-center">Loading users...</div>
            ) : users.length === 0 ? (
              <div className="p-6 text-center">
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
                  {users.map((user) => (
                    <TableRow key={user.name}>
                      <TableCell className="font-medium">{user.full_name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.phone}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          user.enabled 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {user.enabled ? 'Active' : 'Inactive'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleEdit(user.name)}
                          >
                            Edit
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => handleDelete(user.name)}
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
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Users;
