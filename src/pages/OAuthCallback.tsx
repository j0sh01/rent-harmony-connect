import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { frappeClient, FRAPPE_URL } from "@/integrations/frappe/client";
import { toast } from "sonner";

const OAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code');
        const state = searchParams.get('state') || '';
        const savedState = localStorage.getItem('oauth_state');
        
        console.log("OAuth Callback - Code:", code);
        console.log("OAuth Callback - State:", state);
        console.log("OAuth Callback - Saved State:", savedState);
        
        if (!code) {
          console.error("Authorization code missing");
          toast.error("Authorization code missing");
          navigate('/auth');
          return;
        }
        
        // Handle OAuth callback
        console.log("Starting token exchange...");
        const result = await frappeClient.handleCallback(code, state);
        console.log("Token exchange result:", result);
        
        if (result.success) {
          console.log("Token exchange successful, fetching user profile...");
          const profileResult = await frappeClient.getUserProfile();
          console.log("Profile result:", profileResult);
          
          if (profileResult.success && profileResult.data) {
            const userInfo = profileResult.data;
            console.log("User info:", userInfo);
            
            localStorage.setItem('userEmail', userInfo.email || '');
            localStorage.setItem('userName', userInfo.name || userInfo.email?.split('@')[0] || 'User');
            localStorage.setItem('isAuthenticated', 'true');
            
            const roles = userInfo.roles || [];
            console.log("User roles:", roles);
            
            let userRole = 'user';
            let redirectPath = '/auth';
            
            if (roles.includes('System Manager') || roles.includes('Landlord')) {
              userRole = 'admin';
              redirectPath = '/admin-dashboard';
            } else if (roles.includes('Tenant')) {
              userRole = 'tenant';
              redirectPath = '/tenant-dashboard';
            }
            
            console.log("Assigned role:", userRole);
            console.log("Redirect path:", redirectPath);
            
            localStorage.setItem('userRole', userRole);
            toast.success("Login successful");
            window.location.href = redirectPath;
            return;
          } else {
            console.error("Failed to get user profile:", profileResult.error);
            toast.error("Failed to get user profile. Please try again.");
            navigate('/auth');
          }
        } else {
          console.error("OAuth callback failed:", result.error);
          toast.error(result.error || "Authentication failed");
          navigate('/auth');
        }
      } catch (error) {
        console.error("OAuth callback error:", error);
        toast.error("Authentication failed");
        navigate('/auth');
      } finally {
        setLoading(false);
      }
    };
    
    handleCallback();
  }, [navigate, searchParams]);
  
  return (
    <div className="flex items-center justify-center min-h-screen">
      {loading && <p>Completing authentication...</p>}
    </div>
  );
};

export default OAuthCallback;
