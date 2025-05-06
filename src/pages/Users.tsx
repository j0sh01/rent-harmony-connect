import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/ui/Sidebar";
import { frappeClient } from "@/integrations/frappe/client";
import { Users as UsersIcon, Search, Phone, Mail, Eye, Edit, Trash2 } from 'lucide-react';
import { toast } from "sonner";

interface Tenant {
  name: string;
  full_name: string;
  email: string;
  phone: string;
  enabled: number;
  property?: string;
  property_title?: string;
}

interface Rental {
  name: string;
  tenant: string;
  property: string;
  property_title?: string;
  status: string;
}

const Users = () => {
  const navigate = useNavigate();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [filteredTenants, setFilteredTenants] = useState<Tenant[]>([]);
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [propertyFilter, setPropertyFilter] = useState("All");

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch tenants
        const tenantsResult = await frappeClient.getTenants();
        if (tenantsResult.success && tenantsResult.data) {
          setTenants(tenantsResult.data);
        } else {
          console.error("Failed to fetch tenants:", tenantsResult.error);
          toast.error("Failed to load tenants");
        }

        // Fetch rentals
        const rentalsResult = await frappeClient.getRentals();
        if (rentalsResult.success && rentalsResult.data) {
          // Only consider active rentals
          const activeRentals = rentalsResult.data.filter(
            (rental: Rental) => rental.status === "Active"
          );
          setRentals(activeRentals);
        } else {
          console.error("Failed to fetch rentals:", rentalsResult.error);
        }

        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load data");
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Process tenants to include property information from rentals
  useEffect(() => {
    if (tenants.length > 0 && rentals.length > 0) {
      const tenantsWithProperties = tenants.map(tenant => {
        // Find active rental for this tenant
        const tenantRental = rentals.find(rental => rental.tenant === tenant.name);
        
        if (tenantRental) {
          return {
            ...tenant,
            property: tenantRental.property,
            property_title: tenantRental.property_title || tenantRental.property
          };
        }
        
        return tenant;
      });
      
      setTenants(tenantsWithProperties);
      setFilteredTenants(tenantsWithProperties);
    } else {
      setFilteredTenants(tenants);
    }
  }, [tenants, rentals]);

  useEffect(() => {
    let filtered = [...tenants];
    
    // Filter by search query
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(tenant => 
        tenant.full_name.toLowerCase().includes(query) || 
        tenant.email.toLowerCase().includes(query) || 
        tenant.phone.toLowerCase().includes(query)
      );
    }
    
    // Filter by property assignment
    if (propertyFilter === "Assigned") {
      filtered = filtered.filter(tenant => tenant.property);
    } else if (propertyFilter === "Unassigned") {
      filtered = filtered.filter(tenant => !tenant.property);
    }
    
    setFilteredTenants(filtered);
  }, [tenants, searchQuery, propertyFilter]);

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <Sidebar role="admin" />
      <div className="ml-[240px]">
        <Navbar />
        <main className="p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div>
              <h1 className="text-2xl font-bold mb-1">Tenants</h1>
              <p className="text-gray-500">Manage your property tenants</p>
            </div>
            <Button 
              onClick={() => navigate('/tenants/create')}
              className="bg-[#00b3d7] hover:bg-[#009bbf] text-white"
            >
              Add Tenant
            </Button>
          </div>

          <div className="bg-white p-4 rounded-md border border-gray-200 mb-6">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <Input
                  type="text"
                  placeholder="Search tenants..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-10 w-full"
                />
              </div>
              
              <div className="w-full sm:w-auto">
                <select
                  value={propertyFilter}
                  onChange={(e) => setPropertyFilter(e.target.value)}
                  className="h-10 rounded-md border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#00b3d7] w-full"
                >
                  <option value="All">All Tenants</option>
                  <option value="Assigned">With Property</option>
                  <option value="Unassigned">Without Property</option>
                </select>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00b3d7]"></div>
            </div>
          ) : filteredTenants.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-lg border">
              <UsersIcon className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No tenants found</h3>
              <p className="text-gray-500 mb-6">Add your first tenant to get started</p>
              <Button 
                onClick={() => navigate('/tenants/create')}
                className="bg-[#00b3d7] hover:bg-[#009bbf] text-white"
              >
                Add Tenant
              </Button>
            </div>
          ) : (
            <div className="bg-white rounded-md border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Property
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredTenants.map((tenant) => (
                      <tr key={tenant.name} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full bg-[#e6f7ff] flex items-center justify-center text-[#00b3d7] font-medium">
                              {tenant.full_name.charAt(0)}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{tenant.full_name}</div>
                              <div className="text-sm text-gray-500">{tenant.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 flex items-center mb-1">
                            <Mail className="h-4 w-4 mr-1 text-gray-400" />
                            {tenant.email}
                          </div>
                          <div className="text-sm text-gray-900 flex items-center">
                            <Phone className="h-4 w-4 mr-1 text-gray-400" />
                            {tenant.phone}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{tenant.property_title || "Not assigned"}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            tenant.enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {tenant.enabled ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="flex items-center justify-center"
                              onClick={() => navigate(`/tenants/${tenant.name}`)}
                            >
                              <Eye size={16} className="mr-1" /> View
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="flex items-center justify-center"
                              onClick={() => navigate(`/tenants/edit/${tenant.name}`)}
                            >
                              <Edit size={16} className="mr-1" /> Edit
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="flex items-center justify-center text-red-500 hover:text-red-600 hover:bg-red-50"
                              onClick={() => {
                                // Handle delete tenant
                                if (confirm("Are you sure you want to delete this tenant?")) {
                                  // Delete logic here
                                }
                              }}
                            >
                              <Trash2 size={16} className="mr-1" /> Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Users;
