import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DatePicker } from "@/components/ui/date-picker";
import Navbar from "@/components/Navbar";
import { frappeClient } from "@/integrations/frappe/client";
import { toast } from "sonner";

interface Tenant {
  name: string;
  full_name: string;
  email: string;
  phone: string;
  enabled: number;
}

interface Property {
  name: string;
  title: string;
  location: string;
  price_tzs: number;
  status: string;
}

interface RentalForm {
  tenant: string;
  property: string;
  start_date: Date;
  end_date: Date;
  monthly_rent_tzs: number;
  total_rent_tzs: number;
  frequency: string;
}

const VerifyTenants: React.FC = () => {
  const navigate = useNavigate();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [rentalForm, setRentalForm] = useState<RentalForm>({
    tenant: '',
    property: '',
    start_date: new Date(),
    end_date: new Date(new Date().setMonth(new Date().getMonth() + 12)),
    monthly_rent_tzs: 0,
    total_rent_tzs: 0,
    frequency: '12'
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch tenants
        const tenantsResult = await frappeClient.getTenants();
        if (tenantsResult.success && tenantsResult.data) {
          setTenants(tenantsResult.data);
        } else {
          toast.error(tenantsResult.error || "Failed to fetch tenants");
        }

        // Fetch available properties
        const propertiesResult = await frappeClient.getProperties();
        if (propertiesResult.success && propertiesResult.data) {
          // Filter only available properties
          const availableProperties = (propertiesResult.data || []).filter(
            property => property.status.toLowerCase() === 'available'
          );
          setProperties(availableProperties);
        } else {
          toast.error(propertiesResult.error || "Failed to fetch properties");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAssignProperty = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setRentalForm({
      ...rentalForm,
      tenant: tenant.name
    });
    setDialogOpen(true);
  };

  const handlePropertySelect = (propertyId: string) => {
    const selectedProperty = properties.find(p => p.name === propertyId);
    const monthlyRent = selectedProperty ? selectedProperty.price_tzs : 0;
    const totalRent = monthlyRent * parseInt(rentalForm.frequency);
    
    setRentalForm({
      ...rentalForm,
      property: propertyId,
      monthly_rent_tzs: monthlyRent,
      total_rent_tzs: totalRent
    });
  };

  const handleStartDateChange = (date: Date | undefined) => {
    if (date) {
      // Calculate end date based on duration months
      const endDate = new Date(date);
      endDate.setMonth(endDate.getMonth() + parseInt(rentalForm.frequency));
      
      setRentalForm({
        ...rentalForm,
        start_date: date,
        end_date: endDate
      });
    }
  };

  const handleEndDateChange = (date: Date | undefined) => {
    if (date) {
      setRentalForm({
        ...rentalForm,
        end_date: date
      });
    }
  };

  const handleFrequencyChange = (value: string) => {
    const months = parseInt(value);
    
    // Calculate new end date based on start date and frequency
    const endDate = new Date(rentalForm.start_date);
    endDate.setMonth(endDate.getMonth() + months);
    
    // Calculate total rent
    const totalRent = rentalForm.monthly_rent_tzs * months;
    
    setRentalForm({
      ...rentalForm,
      frequency: value,
      end_date: endDate,
      total_rent_tzs: totalRent
    });
  };

  const handleRentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const monthlyRent = Number(e.target.value);
    const totalRent = monthlyRent * parseInt(rentalForm.frequency);
    
    setRentalForm({
      ...rentalForm,
      monthly_rent_tzs: monthlyRent,
      total_rent_tzs: totalRent
    });
  };

  const handleSubmit = async () => {
    if (!rentalForm.property || !rentalForm.tenant) {
      toast.error("Please select a property");
      return;
    }

    setSubmitting(true);
    try {
      // Create rental record
      const rentalResult = await frappeClient.createRental({
        property: rentalForm.property,
        tenant: rentalForm.tenant,
        start_date: rentalForm.start_date.toISOString().split('T')[0],
        end_date: rentalForm.end_date.toISOString().split('T')[0],
        monthly_rent_tzs: rentalForm.monthly_rent_tzs,
        status: 'Active',
        frequency: rentalForm.frequency,
        total_rent_tzs: rentalForm.total_rent_tzs
      });

      if (rentalResult.success) {
        // Update property status to Rented
        const propertyResult = await frappeClient.updateProperty(rentalForm.property, {
          status: 'Rented'
        });

        if (propertyResult.success) {
          toast.success("Tenant verified and property assigned successfully");
          setDialogOpen(false);
          
          // Update local properties list
          setProperties(properties.filter(p => p.name !== rentalForm.property));
        } else {
          toast.error(propertyResult.error || "Failed to update property status");
        }
      } else {
        toast.error(rentalResult.error || "Failed to create rental");
      }
    } catch (error) {
      console.error("Error creating rental:", error);
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
          <h1 className="text-2xl font-bold">Verify Tenants</h1>
          <Button variant="outline" onClick={() => navigate('/admin-dashboard')}>
            Back to Dashboard
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Assign Properties to Tenants</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="p-6 text-center">Loading data...</div>
            ) : tenants.length === 0 ? (
              <div className="p-6 text-center">
                <p>No tenants found.</p>
                <Button 
                  onClick={() => navigate('/tenants/create')}
                  className="mt-4 bg-harmony-500 hover:bg-harmony-600"
                >
                  Add New Tenant
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
                      <TableCell>{tenant.phone}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          tenant.enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {tenant.enabled ? "Active" : "Inactive"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleAssignProperty(tenant)}
                          disabled={properties.length === 0}
                        >
                          Assign Property
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Assign Property to {selectedTenant?.full_name}</DialogTitle>
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
                  {properties.map(property => (
                    <SelectItem key={property.name} value={property.name}>
                      {property.title} - {property.location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date</Label>
              <DatePicker 
                date={rentalForm.start_date}
                onSelect={handleStartDateChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration_months">Duration (Months)</Label>
              <Input 
                id="duration_months" 
                type="number" 
                min="1"
                value={rentalForm.frequency} 
                onChange={(e) => handleFrequencyChange(e.target.value)} 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_date">End Date (Calculated)</Label>
              <DatePicker 
                date={rentalForm.end_date}
                onSelect={handleEndDateChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="frequency">Payment Frequency</Label>
              <Select 
                value={rentalForm.frequency} 
                onValueChange={handleFrequencyChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Monthly (1)</SelectItem>
                  <SelectItem value="3">Quarterly (3)</SelectItem>
                  <SelectItem value="6">Biannually (6)</SelectItem>
                  <SelectItem value="12">Annually (12)</SelectItem>
                </SelectContent>
              </Select>
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
              onClick={handleSubmit}
              className="bg-harmony-500 hover:bg-harmony-600"
              disabled={submitting || !rentalForm.property}
            >
              {submitting ? "Processing..." : "Assign Property"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VerifyTenants;
