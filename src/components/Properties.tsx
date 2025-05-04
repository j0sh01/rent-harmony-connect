
import { useState, useEffect } from "react";
import PropertyCard from "./PropertyCard";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { frappeClient, FRAPPE_URL } from "@/integrations/frappe/client";

const Properties = () => {
  const [properties, setProperties] = useState([]);
  const [visibleProperties, setVisibleProperties] = useState(4);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const result = await frappeClient.getProperties();
        if (result.success) {
          setProperties(result.data || []);
        } else {
          console.error("Failed to fetch properties:", result.error);
        }
      } catch (error) {
        console.error("Error fetching properties:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, []);
  
  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Featured Properties
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Discover our hand-picked selection of properties available for rent
          </p>
        </div>
        
        {loading ? (
          <div className="text-center py-8">Loading properties...</div>
        ) : properties.length === 0 ? (
          <div className="text-center py-8">No properties available at the moment.</div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {properties.slice(0, visibleProperties).map((property) => (
                <PropertyCard
                  key={property.name}
                  imageUrl={property.image ? `${FRAPPE_URL}${property.image}` : "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80"}
                  title={property.title}
                  address={property.location}
                  price={property.price_tzs}
                  beds={property.bedrooms}
                  baths={property.bathroom}
                  sqft={property.square_meters?.toString() || "N/A"}
                  featured={property.status === "Available"}
                />
              ))}
            </div>
            
            {properties.length > visibleProperties && (
              <div className="mt-12 text-center">
                <Button 
                  variant="outline"
                  size="lg"
                  className="border-harmony-300 text-harmony-700 hover:bg-harmony-50"
                  onClick={() => setVisibleProperties(prev => prev + 4)}
                >
                  Load More Properties
                </Button>
              </div>
            )}
          </>
        )}
        
        <div className="mt-12 text-center">
          <Link to="/auth">
            <Button 
              size="lg"
              className="bg-harmony-500 hover:bg-harmony-600 text-white"
            >
              Login to Access
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Properties;
