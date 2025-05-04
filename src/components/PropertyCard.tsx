import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

export interface PropertyCardProps {
  imageUrl: string;
  title: string;
  address: string;
  price: number;
  beds: number;
  baths: number;
  sqft: string;
  featured?: boolean;
}

const PropertyCard = ({
  imageUrl,
  title,
  address,
  price,
  beds,
  baths,
  sqft,
  featured = false,
}: PropertyCardProps) => {
  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Card className={`overflow-hidden card-hover border hover-lift ${featured ? 'border-harmony-300' : 'border-gray-200'}`}>
      <div className="relative h-48 overflow-hidden">
        {featured && (
          <div className="absolute top-0 right-0 bg-warm-500 text-white text-xs font-bold px-2 py-1 z-10">
            Featured
          </div>
        )}
        <img
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
          src={imageUrl}
          alt={title}
        />
      </div>
      <CardContent className="pt-4">
        <h3 className="font-bold text-lg mb-1 text-gray-800">{title}</h3>
        <p className="text-gray-600 text-sm mb-2">{address}</p>
        <p className="text-harmony-600 font-bold text-xl mb-3">{formatPrice(price)}/month</p>
        <div className="flex justify-between text-sm text-gray-600">
          <span>{beds} {beds === 1 ? 'Bed' : 'Beds'}</span>
          <span>{baths} {baths === 1 ? 'Bath' : 'Baths'}</span>
          <span>{sqft} sqft</span>
        </div>
      </CardContent>
      <CardFooter className="pt-0">
        <Button variant="outline" className="w-full border-harmony-300 text-harmony-700 hover:bg-harmony-50">
          View Details
        </Button>
      </CardFooter>
    </Card>
  );
};

export default PropertyCard;
