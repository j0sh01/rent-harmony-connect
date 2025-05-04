import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, Link } from "react-router-dom";
import { frappeClient } from "@/integrations/frappe/client";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Get user initials from name
  const getUserInitials = (name: string) => {
    if (!name) return "U";
    const nameParts = name.split(" ");
    if (nameParts.length === 1) return nameParts[0].charAt(0).toUpperCase();
    return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
  };

  const handleSignOut = async () => {
    await frappeClient.logout();
    
    // Clear local storage
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    
    toast.success("You have been signed out");
    navigate('/auth');
  };

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <div className="h-8 w-8 bg-harmony-500 rounded-md flex items-center justify-center">
                <span className="text-white font-bold">RH</span>
              </div>
              <span className="ml-2 text-xl font-heading font-semibold text-gray-900">
                RentHarmony
              </span>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:ml-6 md:flex md:items-center md:space-x-4">
            <Link to="/properties" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-harmony-600 hover:bg-gray-50">
              Properties
            </Link>
            <Link to="/landlord-info" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-harmony-600 hover:bg-gray-50">
              For Landlords
            </Link>
            <Link to="/tenant-info" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-harmony-600 hover:bg-gray-50">
              For Tenants
            </Link>
            <Link to="/about" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-harmony-600 hover:bg-gray-50">
              About
            </Link>
          </div>
          
          {/* Desktop CTA Buttons */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="h-10 w-10 rounded-full bg-harmony-100 hover:bg-harmony-200 p-0"
                  >
                    <span className="font-medium text-harmony-700">
                      {getUserInitials(user.name)}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="font-medium text-sm">{user.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">Role: {user.role}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="cursor-pointer"
                    onClick={() => navigate('/profile')}
                  >
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="cursor-pointer text-red-500 focus:text-red-500" 
                    onClick={handleSignOut}
                  >
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button 
                className="bg-harmony-500 hover:bg-harmony-600 text-white"
                onClick={() => navigate('/auth')}
              >
                Sign In
              </Button>
            )}
          </div>
          
          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-harmony-600 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-harmony-500"
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu, show/hide based on menu state */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 bg-white">
            <Link
              to="/properties"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-harmony-600 hover:bg-gray-50"
              onClick={() => setIsMenuOpen(false)}
            >
              Properties
            </Link>
            <Link
              to="/landlord-info"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-harmony-600 hover:bg-gray-50"
              onClick={() => setIsMenuOpen(false)}
            >
              For Landlords
            </Link>
            <Link
              to="/tenant-info"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-harmony-600 hover:bg-gray-50"
              onClick={() => setIsMenuOpen(false)}
            >
              For Tenants
            </Link>
            <Link
              to="/about"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-harmony-600 hover:bg-gray-50"
              onClick={() => setIsMenuOpen(false)}
            >
              About
            </Link>
            <div className="pt-4 pb-3 border-t border-gray-200">
              {user ? (
                <>
                  <div className="flex items-center px-4 mb-3">
                    <div className="h-10 w-10 rounded-full bg-harmony-100 flex items-center justify-center mr-3">
                      <span className="font-medium text-harmony-700">
                        {getUserInitials(user.name)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-700">{user.name}</p>
                      <p className="text-xs text-gray-500 capitalize">Role: {user.role}</p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start text-gray-700 hover:text-harmony-600 mb-2"
                    onClick={() => {
                      navigate('/profile');
                      setIsMenuOpen(false);
                    }}
                  >
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start text-red-500 hover:text-red-600 mb-2"
                    onClick={handleSignOut}
                  >
                    Sign Out
                  </Button>
                </>
              ) : (
                <Button 
                  className="w-full justify-center bg-harmony-500 hover:bg-harmony-600 text-white"
                  onClick={() => {
                    navigate('/auth');
                    setIsMenuOpen(false);
                  }}
                >
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
