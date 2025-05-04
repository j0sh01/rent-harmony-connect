
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";

const Hero = () => {
  const isMobile = useIsMobile();

  return (
    <section className="relative bg-gradient-to-r from-harmony-50 to-harmony-100 py-12 md:py-20 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center">
          <div className="w-full md:w-2/3 mb-10 md:mb-0">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 md:mb-6">
              Find Your Perfect Rental Property
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-gray-700 mb-6 md:mb-8 md:w-4/5">
              Simplifying the rental experience for both landlords and tenants with our comprehensive property management platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/auth">
                <Button size={isMobile ? "default" : "lg"} className="w-full sm:w-auto bg-harmony-500 hover:bg-harmony-600 text-white">
                  Login to Access
                </Button>
              </Link>
              <Link to="/about">
                <Button 
                  variant="outline" 
                  size={isMobile ? "default" : "lg"} 
                  className="w-full sm:w-auto border-harmony-300 text-harmony-700 hover:bg-harmony-50"
                >
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
          
          {/* Mobile image */}
          <div className="w-full md:hidden rounded-xl overflow-hidden h-48 sm:h-64 mt-6">
            <img 
              src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=773&q=80" 
              alt="Modern apartment building" 
              className="object-cover h-full w-full"
            />
          </div>
        </div>
      </div>
      
      {/* Desktop/tablet image */}
      <div className="absolute right-0 bottom-0 hidden md:block md:w-1/3 lg:w-1/3 h-full">
        <img 
          src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=773&q=80" 
          alt="Modern apartment building" 
          className="object-cover h-full w-full rounded-l-3xl"
        />
      </div>
    </section>
  );
};

export default Hero;
