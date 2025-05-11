import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/ui/Sidebar";
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

interface Property {
  name: string;
  title: string;
}

interface Tenant {
  name: string;
  full_name: string;
}

const EditRental: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [rental, setRental] = useState({
    property: '',
    tenant: '',
    status: '',
    monthly_rent_tzs: 0,
    total_rent_tzs: 0,
    start_date: '',
    end_date: '',
    frequency: '12'
  });

  useEffect(() => {
    const fetchRental = async () => {
      if (!id) {
        navigate('/rentals');
        return;
      }
      
      setLoading(true);
      try {
        // Fetch rental details
        const result = await frappeClient.getRental(id);
        if (result.success && result.data) {
          setRental({
            property: result.data.property,
            tenant: result.data.tenant,
            status: result.data.status,
            monthly_rent_tzs: result.data.monthly_rent_tzs,
            total_rent_tzs: result.data.total_rent_tzs ?? 0,
            start_date: result.data.start_date,
            end_date: result.data.end_date,
            frequency: result.data.frequency?.toString() || '12'
          });
        } else {
          toast.error(result.error || "Failed to fetch rental details");
          navigate('/rentals');
          return;
        }

        // Fetch properties and tenants for dropdowns
        const [propertiesResult, tenantsResult] = await Promise.all([
          frappeClient.getProperties(),
          frappeClient.getTenants()
        ]);

        if (propertiesResult.success) {
          setProperties(propertiesResult.data || []);
        }

        if (tenantsResult.success) {
          setTenants(tenantsResult.data || []);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("An unexpected error occurred");
        navigate('/rentals');
      } finally {
        setLoading(false);
      }
    };

    fetchRental();
  }, [id, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'monthly_rent_tzs') {
      const monthlyRent = Number(value);
      const totalRent = monthlyRent * parseInt(rental.frequency);
      
      setRental(prev => ({
        ...prev,
        [name]: monthlyRent,
        total_rent_tzs: totalRent
      }));
    } else {
      setRental(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    if (name === 'frequency') {
      const months = parseInt(value);
      const totalRent = rental.monthly_rent_tzs * months;
      
      setRental(prev => ({
        ...prev,
        frequency: value,
        total_rent_tzs: totalRent
      }));
    } else {
      setRental(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleDateChange = (name: string, value: string) => {
    setRental(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    
    setSaving(true);

    try {
      const result = await frappeClient.updateRental(id, {
        property: rental.property,
        tenant: rental.tenant,
        status: rental.status,
        monthly_rent_tzs: rental.monthly_rent_tzs,
        total_rent_tzs: rental.total_rent_tzs,
        start_date: rental.start_date,
        end_date: rental.end_date,
        frequency: rental.frequency
      });

      if (result.success) {
        toast.success("Rental updated successfully");
        navigate('/rentals');
      } else {
        toast.error(result.error || "Failed to update rental");
      }
    } catch (error) {
      console.error("Error updating rental:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <Sidebar role="admin" />
      <div className="ml-[240px]">
        <Navbar />
        <main className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Edit Rental</h1>
            <Button variant="outline" onClick={() => navigate('/rentals')}>
              Back to Rentals
            </Button>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Rental Information</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-4">Loading rental information...</div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="property">Property</Label>
                      <Select 
                        value={rental.property} 
                        onValueChange={(value) => handleSelectChange('property', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select property" />
                        </SelectTrigger>
                        <SelectContent>
                          {properties.map((property) => (
                            <SelectItem key={property.name} value={property.name}>
                              {property.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="tenant">Tenant</Label>
                      <Select 
                        value={rental.tenant} 
                        onValueChange={(value) => handleSelectChange('tenant', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select tenant" />
                        </SelectTrigger>
                        <SelectContent>
                          {tenants.map((tenant) => (
                            <SelectItem key={tenant.name} value={tenant.name}>
                              {tenant.full_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select 
                        value={rental.status} 
                        onValueChange={(value) => handleSelectChange('status', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Active">Active</SelectItem>
                          <SelectItem value="Pending">Pending</SelectItem>
                          <SelectItem value="Expired">Expired</SelectItem>
                          <SelectItem value="Terminated">Terminated</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="frequency">Rental Period (Months)</Label>
                      <Select 
                        value={rental.frequency} 
                        onValueChange={(value) => handleSelectChange('frequency', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select period" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 Month</SelectItem>
                          <SelectItem value="3">3 Months</SelectItem>
                          <SelectItem value="6">6 Months</SelectItem>
                          <SelectItem value="12">12 Months</SelectItem>
                          <SelectItem value="24">24 Months</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="start_date">Start Date</Label>
                      <Input 
                        id="start_date" 
                        name="start_date" 
                        type="date" 
                        value={rental.start_date} 
                        onChange={(e) => handleDateChange('start_date', e.target.value)} 
                        required 
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="end_date">End Date</Label>
                      <Input 
                        id="end_date" 
                        name="end_date" 
                        type="date" 
                        value={rental.end_date} 
                        onChange={(e) => handleDateChange('end_date', e.target.value)} 
                        required 
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="monthly_rent_tzs">Monthly Rent (TZS)</Label>
                      <Input 
                        id="monthly_rent_tzs" 
                        name="monthly_rent_tzs" 
                        type="number" 
                        value={rental.monthly_rent_tzs} 
                        onChange={handleChange} 
                        required 
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="total_rent_tzs">Total Rent (TZS)</Label>
                      <Input 
                        id="total_rent_tzs" 
                        name="total_rent_tzs" 
                        type="number" 
                        value={rental.total_rent_tzs} 
                        readOnly 
                        className="bg-gray-50"
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => navigate('/rentals')}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      className="bg-harmony-500 hover:bg-harmony-600"
                      disabled={saving}
                    >
                      {saving ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
};

export default EditRental;
