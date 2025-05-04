import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import { frappeClient, FRAPPE_URL } from "@/integrations/frappe/client";
import { toast } from "sonner";
import PropertyCard from "@/components/PropertyCard";

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

const AvailableProperties: React.FC = () => {
  const navigate = useNavigate();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const result = await frappeClient.getProperties();
        if (result.success) {
          // Filter only available properties
          const availableProperties = (result.data || []).filter(
            property => property.status.toLowerCase() === 'available'
          );
          setProperties(availableProperties);
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

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Available Properties</h1>
          <Button variant="outline" onClick={() => navigate('/properties')}>
            Back to All Properties
          </Button>
        </div>

        {loading ? (
          <div className="p-6 text-center">Loading properties...</div>
        ) : properties.length === 0 ? (
          <div className="p-6 text-center">
            <p>No available properties found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {properties.map((property) => (
              <PropertyCard
                key={property.name}
                imageUrl={property.image ? `${FRAPPE_URL}${property.image}` : "https://placehold.co/600x400?text=No+Image"}
                title={property.title}
                address={property.location}
                price={property.price_tzs}
                beds={property.bedrooms}
                baths={property.bathroom}
                sqft={property.square_meters.toString()}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default AvailableProperties;
