import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Navbar from "@/components/Navbar";
import { frappeClient } from "@/integrations/frappe/client";
import { toast } from "sonner";
interface Property {
  name: string;
  title: string;
  location: string;
  price_tzs: number;
  bedrooms: number;
  bathroom: number;
  square_meters: number;
  description: string;
  status: string;
  image: string;
}

const Properties: React.FC = () => {
  const navigate = useNavigate();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const result = await frappeClient.getProperties();
        if (result.success) {
          setProperties(result.data || []);
        } else {
          toast.error(result.error || "Failed to fetch properties");
        }
      } catch (error) {
        console.error("Error fetching properties:", error);
        toast.error("An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, []);

  const handleEdit = (id: string) => {
    navigate(`/properties/edit/${id}`);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this property?")) {
      try {
        const result = await frappeClient.deleteProperty(id);
        if (result.success) {
          toast.success("Property deleted successfully");
          setProperties(properties.filter(p => p.name !== id));
        } else {
          toast.error(result.error || "Failed to delete property");
        }
      } catch (error) {
        console.error("Error deleting property:", error);
        toast.error("An unexpected error occurred");
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Property Management</h1>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => navigate('/admin-dashboard')}>
              Back to Dashboard
            </Button>
            <Button 
              onClick={() => navigate('/add-property')}
              className="bg-harmony-500 hover:bg-harmony-600"
            >
              Add New Property
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 text-center">Loading properties...</div>
            ) : properties.length === 0 ? (
              <div className="p-6 text-center">
                <p>No properties found.</p>
                <Button 
                  onClick={() => navigate('/add-property')}
                  className="mt-4 bg-harmony-500 hover:bg-harmony-600"
                >
                  Add Your First Property
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Price (TZS)</TableHead>
                    <TableHead>Bedrooms</TableHead>
                    <TableHead>Bathrooms</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {properties.map((property) => (
                    <TableRow key={property.name}>
                      <TableCell className="font-medium">{property.title}</TableCell>
                      <TableCell>{property.location}</TableCell>
                      <TableCell>{property.price_tzs.toLocaleString()}</TableCell>
                      <TableCell>{property.bedrooms}</TableCell>
                      <TableCell>{property.bathroom}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          property.status === 'available' 
                            ? 'bg-green-100 text-green-800' 
                            : property.status === 'rented' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {property.status.charAt(0).toUpperCase() + property.status.slice(1)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleEdit(property.name)}
                          >
                            Edit
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm" 
                            onClick={() => handleDelete(property.name)}
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

export default Properties;
