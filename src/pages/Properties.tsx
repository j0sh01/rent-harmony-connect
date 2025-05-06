import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/ui/Sidebar";
import { frappeClient, FRAPPE_URL } from "@/integrations/frappe/client";
import { Building, MapPin, Bed, Bath, Square, Eye, Edit, Search, Grid, List } from 'lucide-react';
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

const Properties = () => {
  const navigate = useNavigate();
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [statusFilter, setStatusFilter] = useState<string>("All");

  // Add this helper function to get the appropriate status badge styling
  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      'Available': 'bg-green-100 text-green-800',
      'Rented': 'bg-blue-100 text-blue-800',
      'Under Maintenance': 'bg-yellow-100 text-yellow-800'
    };
    
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const result = await frappeClient.getProperties();
        if (result.success) {
          setProperties(result.data || []);
          setFilteredProperties(result.data || []);
        } else {
          console.error("Failed to fetch properties:", result.error);
          toast.error("Failed to load properties");
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching properties:", error);
        toast.error("Failed to load properties");
        setLoading(false);
      }
    };

    fetchProperties();
  }, []);

  useEffect(() => {
    let filtered = [...properties];
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(property => 
        property.title.toLowerCase().includes(query) || 
        property.location.toLowerCase().includes(query)
      );
    }
    
    // Filter by status
    if (statusFilter !== "All") {
      filtered = filtered.filter(property => 
        property.status === statusFilter
      );
    }
    
    setFilteredProperties(filtered);
  }, [properties, searchQuery, statusFilter]);

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <Sidebar role="admin" />
      <div className="ml-[240px]">
        <Navbar />
        <main className="p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div>
              <h1 className="text-2xl font-bold mb-1">Properties</h1>
              <p className="text-gray-500">Manage your rental properties</p>
            </div>
            <Button 
              onClick={() => navigate('/add-property')}
              className="bg-[#00b3d7] hover:bg-[#009bbf] text-white"
            >
              Add Property
            </Button>
          </div>

          <div className="bg-white p-4 rounded-md border border-gray-200 mb-6">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <Input
                  type="text"
                  placeholder="Search properties..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-10 w-full"
                />
              </div>
              
              <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-10 rounded-md border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#00b3d7]"
                >
                  <option value="All">All</option>
                  <option value="Available">Available</option>
                  <option value="Rented">Rented</option>
                </select>
                
                <div className="flex border rounded-md overflow-hidden">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 ${viewMode === 'grid' ? 'bg-gray-100' : 'bg-white'}`}
                  >
                    <Grid size={20} className="text-gray-600" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 ${viewMode === 'list' ? 'bg-gray-100' : 'bg-white'}`}
                  >
                    <List size={20} className="text-gray-600" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00b3d7]"></div>
            </div>
          ) : filteredProperties.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-lg border">
              <Building className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No properties found</h3>
              <p className="text-gray-500 mb-6">Add your first property to get started</p>
              <Button 
                onClick={() => navigate('/add-property')}
                className="bg-[#00b3d7] hover:bg-[#009bbf] text-white"
              >
                Add Property
              </Button>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProperties.map((property) => (
                <Card key={property.name} className="overflow-hidden border border-gray-200">
                  <div className="relative h-48 bg-gray-100">
                    <img 
                      src={property.image ? `${FRAPPE_URL}${property.image}` : "https://via.placeholder.com/300x200?text=No+Image"} 
                      alt={property.title}
                      className="w-full h-full object-cover"
                    />
                    <div className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-medium ${getStatusBadge(property.status)}`}>
                      {property.status}
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-medium text-lg mb-1">{property.title}</h3>
                    <div className="flex items-center text-gray-500 text-sm mb-3">
                      <MapPin size={14} className="mr-1" />
                      <span>{property.location}</span>
                    </div>
                    <div className="flex justify-between mb-4">
                      <div className="flex items-center text-sm">
                        <Bed size={14} className="mr-1" />
                        <span>{property.bedrooms} Beds</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <Bath size={14} className="mr-1" />
                        <span>{property.bathroom} Baths</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <Square size={14} className="mr-1" />
                        <span>{property.square_meters} m²</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="font-bold text-lg">TSh {property.price_tzs.toLocaleString()}/mo</div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="p-0 w-8 h-8"
                          onClick={() => navigate(`/properties/${property.name}`)}
                        >
                          <Eye size={16} />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="p-0 w-8 h-8"
                          onClick={() => navigate(`/properties/edit/${property.name}`)}
                        >
                          <Edit size={16} />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredProperties.map((property) => (
                <div key={property.name} className="bg-white border border-gray-200 rounded-md p-4 flex flex-col sm:flex-row gap-4">
                  <div className="w-full sm:w-48 h-32 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                    <img 
                      src={property.image ? `${FRAPPE_URL}${property.image}` : "https://via.placeholder.com/300x200?text=No+Image"} 
                      alt={property.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between mb-2">
                      <h3 className="font-medium text-lg">{property.title}</h3>
                      <span className={`text-xs font-medium px-2 py-1 rounded ${getStatusBadge(property.status)}`}>
                        {property.status}
                      </span>
                    </div>
                    <div className="flex items-center text-gray-500 text-sm mb-3">
                      <MapPin size={14} className="mr-1" />
                      <span>{property.location}</span>
                    </div>
                    <div className="flex gap-4 mb-4">
                      <div className="flex items-center text-sm">
                        <Bed size={14} className="mr-1" />
                        <span>{property.bedrooms} Beds</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <Bath size={14} className="mr-1" />
                        <span>{property.bathroom} Baths</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <Square size={14} className="mr-1" />
                        <span>{property.square_meters} m²</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="font-bold text-lg">TSh {property.price_tzs.toLocaleString()}/mo</div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => navigate(`/properties/${property.name}`)}
                        >
                          <Eye size={16} className="mr-1" />
                          View
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => navigate(`/properties/edit/${property.name}`)}
                        >
                          <Edit size={16} className="mr-1" />
                          Edit
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Properties;
