
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { frappeClient } from "@/integrations/frappe/client";
import { FRAPPE_URL } from "@/integrations/frappe/client";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    console.log("Attempting login with:", email);
    
    try {
      if (isLogin) {
        // Handle demo admin account
        if (email === "admin@rentalflow-pro.com" && password === "Aakvatech@123") {
          // Store admin role in localStorage
          localStorage.setItem('userRole', 'admin');
          localStorage.setItem('userName', 'Admin User');
          localStorage.setItem('userEmail', email);
          localStorage.setItem('isAuthenticated', 'true');
          
          toast.success("Welcome, Admin!");
          navigate('/admin-dashboard');
          return;
        }
        
        // Regular login with Frappe
        const { success, data, error } = await frappeClient.login(email, password);

        if (!success) {
          toast.error(error || "Invalid login credentials");
          setLoading(false);
          return;
        }

        // Debug: Log the response data and roles
        console.log("Frappe login response:", data);
        console.log("User roles type:", typeof data?.roles);
        console.log("User roles value:", JSON.stringify(data?.roles, null, 2));

        // Check for specific roles regardless of other roles the user might have
        const hasLandlordRole = Array.isArray(data?.roles) && data.roles.some(role => role === 'Landlord');
        const hasSystemManagerRole = Array.isArray(data?.roles) && data.roles.some(role => role === 'System Manager');
        const hasTenantRole = Array.isArray(data?.roles) && data.roles.some(role => role === 'Tenant');

        console.log("Has Landlord role:", hasLandlordRole);
        console.log("Has System Manager role:", hasSystemManagerRole);
        console.log("Has Tenant role:", hasTenantRole);

        // Determine user role based on Frappe roles
        let userRole = 'user'; // Default role
        let redirectPath = '/auth'; // Default redirect

        // Check if user has both System Manager and Tenant roles
        if (hasSystemManagerRole && hasTenantRole) {
          userRole = 'tenant';
          redirectPath = '/tenant-dashboard';
        } 
        // Admin roles take precedence in other cases
        else if (hasLandlordRole || hasSystemManagerRole) {
          userRole = 'admin';
          redirectPath = '/admin-dashboard';
        } else if (hasTenantRole) {
          userRole = 'tenant';
          redirectPath = '/tenant-dashboard';
        }

        console.log("Assigned user role:", userRole);
        console.log("Redirect path:", redirectPath);

        // Store user info in localStorage
        localStorage.setItem('userRole', userRole);
        localStorage.setItem('userName', data?.full_name || email.split('@')[0]);
        localStorage.setItem('userEmail', email);
        localStorage.setItem('isAuthenticated', 'true');

        toast.success(`Welcome back, ${data?.full_name || 'User'}!`);

        // Redirect based on role
        if (userRole === 'admin' || userRole === 'tenant') {
          navigate(redirectPath);
        } else {
          // Default fallback if role is neither admin nor tenant
          toast.error("Your account doesn't have proper role assignments. Please contact administrator.");
          setLoading(false);
          return;
        }
      } else {
        // Sign up is not implemented in this simple version
        toast.error("Registration is not available. Please contact your administrator.");
        setIsLogin(true);
      }
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error(error.message || "Failed to authenticate");
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = () => {
    // Use the frappeClient's getAuthUrl method which properly handles state
    const authUrl = frappeClient.getAuthUrl();
    window.location.href = authUrl;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h1 className="text-center text-3xl font-bold text-gray-900 mb-2">
            RentalFlow Pro
          </h1>
          <h2 className="mt-2 text-center text-2xl font-extrabold text-gray-900">
            {isLogin ? "Sign in to your account" : "Create your account"}
          </h2>

        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mb-2"
                required
                autoComplete="email"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete={isLogin ? "current-password" : "new-password"}
                minLength={6}
              />
            </div>
          </div>

          <div>
            <Button
              type="submit"
              className="w-full bg-harmony-500 hover:bg-harmony-600"
              disabled={loading || !email || !password}
            >
              {loading ? "Processing..." : isLogin ? "Sign in" : "Sign up"}
            </Button>
          </div>
          <Button 
            variant="outline" 
            type="button"
            className="w-full mt-2"
            onClick={handleOAuthLogin}
          >
            Login with OAuth
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Auth;
