import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import Navbar from "@/components/Navbar";
import { frappeClient } from "@/integrations/frappe/client";
import { toast } from "sonner";
import Sidebar from "@/components/ui/Sidebar";

const EditTenant: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tenant, setTenant] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    enabled: true
  });

  useEffect(() => {
    if (!id) {
      navigate('/users');
      return;
    }

    const fetchTenant = async () => {
      setLoading(true);
      try {
        const result = await frappeClient.getTenant(id);
        if (result.success && result.data) {
          setTenant({
            first_name: result.data.first_name || '',
            last_name: result.data.last_name || '',
            email: result.data.email || '',
            phone: result.data.phone || '',
            enabled: result.data.enabled === 1
          });
        } else {
          toast.error(result.error || "Failed to fetch tenant");
          navigate('/users');
        }
      } catch (error) {
        console.error("Error fetching tenant:", error);
        toast.error("An unexpected error occurred");
        navigate('/users');
      } finally {
        setLoading(false);
      }
    };

    fetchTenant();
  }, [id, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTenant(prev => ({ ...prev, [name]: value }));
  };

  const handleToggleEnabled = (checked: boolean) => {
    setTenant(prev => ({ ...prev, enabled: checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    
    setSaving(true);

    try {
      const result = await frappeClient.updateTenant(id, tenant);

      if (result.success) {
        toast.success("Tenant updated successfully");
        navigate('/users');
      } else {
        toast.error(result.error || "Failed to update tenant");
      }
    } catch (error) {
      console.error("Error updating tenant:", error);
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
            <h1 className="text-2xl font-bold">Edit Tenant</h1>
            <Button variant="outline" onClick={() => navigate('/users')}>
              Back to Tenants
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Tenant Information</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-4">Loading tenant information...</div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="first_name">First Name</Label>
                      <Input 
                        id="first_name" 
                        name="first_name" 
                        value={tenant.first_name} 
                        onChange={handleChange} 
                        required 
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="last_name">Last Name</Label>
                      <Input 
                        id="last_name" 
                        name="last_name" 
                        value={tenant.last_name} 
                        onChange={handleChange} 
                        required 
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input 
                        id="email" 
                        name="email" 
                        type="email" 
                        value={tenant.email} 
                        onChange={handleChange} 
                        required 
                        disabled
                      />
                      <p className="text-sm text-gray-500">Email cannot be changed</p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input 
                        id="phone" 
                        name="phone" 
                        value={tenant.phone} 
                        onChange={handleChange} 
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 pt-4">
                    <Switch 
                      id="enabled" 
                      checked={tenant.enabled}
                      onCheckedChange={handleToggleEnabled}
                    />
                    <Label htmlFor="enabled">Account Active</Label>
                  </div>
                  
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => navigate('/users')}
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

export default EditTenant;
