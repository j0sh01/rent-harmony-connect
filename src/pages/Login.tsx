import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { frappeClient } from "@/integrations/frappe/client";

const Login: React.FC = () => {
  const handleOAuthLogin = () => {
    // Redirect to Frappe OAuth authorization endpoint
    window.location.href = frappeClient.getAuthUrl();
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Login</CardTitle>
          <CardDescription>
            Sign in to your account using Frappe OAuth
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            className="w-full" 
            onClick={handleOAuthLogin}
          >
            Continue with Frappe
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;