// Frappe API client for authentication and data operations
export const FRAPPE_URL = import.meta.env.VITE_FRAPPE_URL || "http://localhost:8080";

// Get the current app URL
const APP_URL = window.location.origin;

// OAuth2 configuration
const OAUTH2_CONFIG = {
  clientId: import.meta.env.VITE_OAUTH_CLIENT_ID || '6qqbee8sj8',
  redirectUri: import.meta.env.VITE_REDIRECT_URI || 'http://localhost:8080/auth/callback',
  scope: 'all openid',
  responseType: 'code',
  grantType: 'authorization_code'
};

// For debugging
console.log('Current APP_URL:', APP_URL);
console.log('Redirect URI:', OAUTH2_CONFIG.redirectUri);
console.log('OAuth Configuration:', {
  FRAPPE_URL,
  clientId: OAUTH2_CONFIG.clientId,
  redirectUri: OAUTH2_CONFIG.redirectUri
});

// Token storage utility
const tokenStorage = {
  setTokens: (data: any) => {
    const tokens = {
      access_token: data.access_token || data.message?.access_token,
      refresh_token: data.refresh_token || data.message?.refresh_token,
      expires_in: data.expires_in || data.message?.expires_in || 3600,
      expires_at: Date.now() + ((data.expires_in || data.message?.expires_in || 3600) * 1000)
    };
    localStorage.setItem('oauth_tokens', JSON.stringify(tokens));
  },
  
  getTokens: () => {
    const tokensStr = localStorage.getItem('oauth_tokens');
    return tokensStr ? JSON.parse(tokensStr) : null;
  },
  
  clearTokens: () => {
    localStorage.removeItem('oauth_tokens');
  },
  
  isTokenExpired: () => {
    const tokens = tokenStorage.getTokens();
    if (!tokens) return true;
    return Date.now() > tokens.expires_at;
  }
};

// Add this helper function at the top of the file, after the tokenStorage object
const getAuthHeaders = () => {
  const tokens = tokenStorage.getTokens();
  if (!tokens) {
    throw new Error('Not authenticated');
  }
  return {
    'Authorization': `Bearer ${tokens.access_token}`,
    'Accept': 'application/json'
  };
};

export const frappeClient = {
  // Generate OAuth authorization URL
  getAuthUrl: () => {
    const state = Math.random().toString(36).substring(2, 15);
    localStorage.setItem('oauth_state', state);
    
    const params = new URLSearchParams({
      client_id: OAUTH2_CONFIG.clientId,
      redirect_uri: OAUTH2_CONFIG.redirectUri,
      scope: OAUTH2_CONFIG.scope,
      response_type: OAUTH2_CONFIG.responseType,
      state,
      prompt: 'login'
    });
    
    const authUrl = `${FRAPPE_URL}/api/method/frappe.integrations.oauth2.authorize?${params.toString()}`;
    console.log('Generated Auth URL:', authUrl);
    
    return authUrl;
  },
  
  // Handle the OAuth callback
  handleCallback: async (code: string, state: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const params = new URLSearchParams({
        grant_type: OAUTH2_CONFIG.grantType,
        code,
        client_id: OAUTH2_CONFIG.clientId,
        redirect_uri: OAUTH2_CONFIG.redirectUri,
        scope: OAUTH2_CONFIG.scope
      });
      
      console.log("Token exchange request params:", params.toString());
      console.log("Using redirect URI:", OAUTH2_CONFIG.redirectUri);
      
      const response = await fetch(`${FRAPPE_URL}/api/method/frappe.integrations.oauth2.get_token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: params.toString()
      });
      
      const data = await response.json();
      console.log("Token exchange response:", data);
      
      if (!response.ok) {
        const errorMessage = data.message || data.error_description || data.error || 'Failed to exchange code for tokens';
        console.error("Token exchange error:", errorMessage);
        return { success: false, error: errorMessage };
      }
      
      // Check for access token in the response
      if (!data.access_token) {
        console.error("No access token in response:", data);
        return { success: false, error: 'No access token received' };
      }
      
      // Store tokens
      tokenStorage.setTokens(data);
      
      return { success: true };
    } catch (error) {
      console.error("OAuth token exchange error:", error);
      return { success: false, error: 'Network error occurred during token exchange' };
    }
  },
  
  // Refresh the access token
  refreshToken: async (): Promise<boolean> => {
    const tokens = tokenStorage.getTokens();
    if (!tokens || !tokens.refresh_token) return false;
    
    try {
      const params = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: tokens.refresh_token,
        client_id: OAUTH2_CONFIG.clientId
      });
      
      const response = await fetch(`${FRAPPE_URL}/api/method/frappe.integrations.oauth2.get_token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: params.toString()
      });
      
      const data = await response.json();
      
      if (!response.ok || !data.message?.access_token) {
        tokenStorage.clearTokens();
        return false;
      }
      
      tokenStorage.setTokens(data);
      return true;
    } catch (error) {
      console.error("Token refresh error:", error);
      tokenStorage.clearTokens();
      return false;
    }
  },

  // Replace the existing login method with OAuth-based login
  login: async (email: string, password: string): Promise<{ success: boolean; data?: any; error?: string }> => {
    try {
      // For OAuth, we'll redirect to the authorization URL
      window.location.href = frappeClient.getAuthUrl();
      // This function will not return normally as we're redirecting
      return { success: true };
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, error: 'Network error occurred' };
    }
  },
  
  // Replace the existing logout method with OAuth-based logout
  logout: async (): Promise<{ success: boolean; error?: string }> => {
    try {
      // Clear tokens from storage
      tokenStorage.clearTokens();
      return { success: true };
    } catch (error) {
      console.error("Logout error:", error);
      return { success: false, error: 'Network error occurred' };
    }
  },
  
  // Replace the existing getUserProfile method with OAuth-based profile retrieval
  getUserProfile: async (): Promise<{ success: boolean; data?: any; error?: string }> => {
    try {
      // Check if token is expired and refresh if needed
      if (tokenStorage.isTokenExpired()) {
        console.log("Token expired, attempting to refresh...");
        const refreshed = await frappeClient.refreshToken();
        if (!refreshed) {
          console.error("Failed to refresh token");
          return { success: false, error: 'Authentication expired' };
        }
        console.log("Token refreshed successfully");
      }
      
      const tokens = tokenStorage.getTokens();
      if (!tokens) {
        console.error("No tokens found in storage");
        return { success: false, error: 'Not authenticated' };
      }
      
      console.log("Fetching user profile with token:", tokens.access_token);
      
      const response = await fetch(`${FRAPPE_URL}/api/method/frappe.integrations.oauth2.openid_profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
          'Accept': 'application/json'
        }
      });
      
      const data = await response.json();
      console.log("Profile response:", data);
      
      if (!response.ok) {
        console.error("Profile fetch failed:", data);
        return { success: false, error: data.message || 'Failed to fetch user profile' };
      }
      
      // The profile data is directly in the response
      const userInfo = data;
      console.log("User info from profile:", userInfo);
      
      // Get user roles
      const email = userInfo.email;
      if (!email) {
        console.error("Email not found in profile:", userInfo);
        return { success: false, error: 'Email not found in profile' };
      }
      
      // Fetch user details including roles
      console.log("Fetching user details for email:", email);
      const userResponse = await fetch(`${FRAPPE_URL}/api/resource/User/${email}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
          'Accept': 'application/json'
        }
      });
      
      const userData = await userResponse.json();
      console.log("User details response:", userData);
      
      if (!userResponse.ok) {
        console.error("Failed to fetch user details:", userData);
        return { success: false, error: 'Failed to fetch user details' };
      }
      
      // Combine profile and user data
      const combinedData = {
        ...userInfo,
        ...userData.data,
        roles: userInfo.roles || [] // Use roles from the profile response
      };
      
      console.log("Combined user data:", combinedData);
      return { success: true, data: combinedData };
    } catch (error) {
      console.error("Error in getUserProfile:", error);
      return { success: false, error: 'Failed to fetch user profile' };
    }
  },
  
  // Property methods
  getProperties: async (): Promise<{ success: boolean; data?: any[]; error?: string }> => {
    try {
      const response = await fetch(`${FRAPPE_URL}/api/resource/Property?fields=["name","title","location","price_tzs","bedrooms","bathroom","square_meters","description","status","image"]`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      
      const data = await response.json();
      return { success: true, data: data.data };
    } catch (error) {
      console.error("Error fetching properties:", error);
      return { success: false, error: 'Failed to fetch properties' };
    }
  },
  
  getProperty: async (id: string): Promise<{ success: boolean; data?: any; error?: string }> => {
    try {
      const response = await fetch(`${FRAPPE_URL}/api/resource/Property/${id}`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      
      const data = await response.json();
      return { success: true, data: data.data };
    } catch (error) {
      console.error(`Error fetching property ${id}:`, error);
      return { success: false, error: 'Failed to fetch property' };
    }
  },
  
  deleteProperty: async (id: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch(`${FRAPPE_URL}/api/resource/Property/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        const data = await response.json();
        return { success: false, error: data.message || 'Failed to delete property' };
      }
      
      return { success: true };
    } catch (error) {
      console.error(`Error deleting property ${id}:`, error);
      return { success: false, error: 'Network error occurred' };
    }
  },
  
  updateProperty: async (id: string, propertyData: any): Promise<{ success: boolean; data?: any; error?: string }> => {
    try {
      const response = await fetch(`${FRAPPE_URL}/api/resource/Property/${id}`, {
        method: 'PUT',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          data: propertyData
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        const errorMsg = data.message || data._server_messages || 'Failed to update property';
        return { success: false, error: errorMsg };
      }
      
      return { success: true, data: data.data };
    } catch (error) {
      console.error("Error updating property:", error);
      return { success: false, error: 'Network error occurred' };
    }
  },
  
  // Rental methods
  getRentals: async (): Promise<{ success: boolean; data?: any[]; error?: string }> => {
    try {
      const response = await fetch(`${FRAPPE_URL}/api/resource/Rental?fields=["name","property","tenant","status","monthly_rent_tzs","total_rent_tzs","start_date","end_date","frequency"]`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      
      const data = await response.json();
      return { success: true, data: data.data };
    } catch (error) {
      console.error("Error fetching rentals:", error);
      return { success: false, error: 'Failed to fetch rentals' };
    }
  },
  
  getRental: async (id: string): Promise<{ success: boolean; data?: any; error?: string }> => {
    try {
      const response = await fetch(`${FRAPPE_URL}/api/resource/Rental/${id}`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      
      const data = await response.json();
      return { success: true, data: data.data };
    } catch (error) {
      console.error(`Error fetching rental ${id}:`, error);
      return { success: false, error: 'Failed to fetch rental' };
    }
  },
  
  updateRental: async (id: string, rentalData: any): Promise<{ success: boolean; data?: any; error?: string }> => {
    try {
      const response = await fetch(`${FRAPPE_URL}/api/resource/Rental/${id}`, {
        method: 'PUT',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          data: rentalData
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        const errorMsg = data.message || data._server_messages || 'Failed to update rental';
        return { success: false, error: errorMsg };
      }
      
      return { success: true, data: data.data };
    } catch (error) {
      console.error("Error updating rental:", error);
      return { success: false, error: 'Network error occurred' };
    }
  },
  
  // Payment methods
  getRentalPayments: async (rentalId: string): Promise<{ success: boolean; data?: any[]; error?: string }> => {
    try {
      const response = await fetch(`${FRAPPE_URL}/api/resource/Payment?filters=[["rental","=","${rentalId}"]]&fields=["name","amount_tzs","payment_date","payment_method","receipt_number","docstatus"]`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      
      const data = await response.json();
      return { success: true, data: data.data };
    } catch (error) {
      console.error("Error fetching rental payments:", error);
      return { success: false, error: 'Failed to fetch rental payments' };
    }
  },
  getPayment: async (id: string): Promise<{ success: boolean; data?: any; error?: string }> => {
    try {
      const response = await fetch(`${FRAPPE_URL}/api/resource/Payment/${id}`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      
      const data = await response.json();
      return { success: true, data: data.data };
    } catch (error) {
      console.error(`Error fetching payment ${id}:`, error);
      return { success: false, error: 'Failed to fetch payment' };
    }
  },
  
  // Testimonial methods
  getActiveTestimonials: async (): Promise<{ success: boolean; data?: any[]; error?: string }> => {
    try {
      const response = await fetch(`${FRAPPE_URL}/api/resource/Testimonial?filters=[["is_active","=",1]]`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      
      const data = await response.json();
      return { success: true, data: data.data };
    } catch (error) {
      console.error("Error fetching testimonials:", error);
      return { success: false, error: 'Failed to fetch testimonials' };
    }
  },

  // Admin dashboard methods
  getPropertyCount: async (): Promise<{ success: boolean; data?: number; error?: string }> => {
    try {
      const response = await fetch(`${FRAPPE_URL}/api/resource/Property?limit_page_length=0&fields=["count(name) as count"]`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      
      const data = await response.json();
      return { success: true, data: data.data[0]?.count || 0 };
    } catch (error) {
      console.error("Error fetching property count:", error);
      return { success: false, error: 'Failed to fetch property count' };
    }
  },

  getActiveRentalsCount: async (): Promise<{ success: boolean; data?: number; error?: string }> => {
    try {
      const response = await fetch(`${FRAPPE_URL}/api/resource/Rental?filters=[["status","=","active"]]&limit_page_length=0&fields=["count(name) as count"]`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      
      const data = await response.json();
      return { success: true, data: data.data[0]?.count || 0 };
    } catch (error) {
      console.error("Error fetching active rentals count:", error);
      return { success: false, error: 'Failed to fetch active rentals count' };
    }
  },

  getTenantCount: async (): Promise<{ success: boolean; data?: number; error?: string }> => {
    try {
      const response = await fetch(`${FRAPPE_URL}/api/resource/User?filters=[["role","=","Tenant"]]&limit_page_length=0&fields=["count(name) as count"]`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      
      const data = await response.json();
      return { success: true, data: data.data[0]?.count || 0 };
    } catch (error) {
      console.error("Error fetching tenant count:", error);
      return { success: false, error: 'Failed to fetch tenant count' };
    }
  },

  getTotalPayments: async (): Promise<{ success: boolean; data?: number; error?: string }> => {
    try {
      const response = await fetch(`${FRAPPE_URL}/api/resource/Payment?fields=["sum(amount_tzs) as total"]`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      
      const data = await response.json();
      return { success: true, data: data.data[0]?.total || 0 };
    } catch (error) {
      console.error("Error fetching total payments:", error);
      return { success: false, error: 'Failed to fetch total payments' };
    }
  },

  createProperty: async (propertyData: any): Promise<{ success: boolean; data?: any; error?: string }> => {
    try {
      const response = await fetch(`${FRAPPE_URL}/api/resource/Property`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          data: propertyData
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        const errorMsg = data.message || data._server_messages || 'Failed to create property';
        return { success: false, error: errorMsg };
      }
      
      return { success: true, data: data.data };
    } catch (error) {
      console.error("Error creating property:", error);
      return { success: false, error: 'Network error occurred' };
    }
  },

  createTenant: async (tenantData: any): Promise<{ success: boolean; data?: any; error?: string }> => {
    try {
      const response = await fetch(`${FRAPPE_URL}/api/resource/User`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          data: {
            email: tenantData.email,
            first_name: tenantData.first_name,
            last_name: tenantData.last_name,
            new_password: tenantData.password,
            send_welcome_email: 0,
            roles: [
              { role: "System Manager" },
              { role: "Tenant" }
            ],
            phone: tenantData.phone
          }
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        const errorMsg = data.message || data._server_messages || 'Failed to create tenant';
        return { success: false, error: errorMsg };
      }
      
      return { success: true, data: data.data };
    } catch (error) {
      console.error("Error creating tenant:", error);
      return { success: false, error: 'Network error occurred' };
    }
  },

  getTenants: async (): Promise<{ success: boolean; data?: any[]; error?: string }> => {
    try {
      const response = await fetch(`${FRAPPE_URL}/api/resource/User?filters=[[\"Has Role\",\"role\",\"=\",\"Tenant\"]]&fields=["name","full_name","email","phone","enabled"]`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        return { success: false, error: 'Failed to fetch tenants' };
      }
      
      const userData = await response.json();
      console.log("Tenant data:", userData);
      
      return { success: true, data: userData.data };
    } catch (error) {
      console.error("Error fetching tenants:", error);
      return { success: false, error: 'Failed to fetch tenants' };
    }
  },

  uploadFile: async (file: File, doctype: string = 'Property', docname?: string): Promise<{ success: boolean; data?: { file_url: string }; error?: string }> => {
    try {
      const tokens = tokenStorage.getTokens();
      if (!tokens) {
        return { success: false, error: 'Not authenticated' };
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('is_private', '0');
      formData.append('doctype', doctype);
      formData.append('fieldname', 'image');
      
      // If we have a docname (for existing documents), attach the file to it
      if (docname) {
        formData.append('docname', docname);
      }
      
      console.log("Uploading file:", {
        doctype,
        docname,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size
      });
      
      const response = await fetch(`${FRAPPE_URL}/api/method/upload_file`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
          'Accept': 'application/json'
        },
        body: formData
      });
      
      const data = await response.json();
      console.log("Upload response:", data);
      
      if (!response.ok || !data.message) {
        let errorMsg = 'Failed to upload file';
        if (data._server_messages) {
          try {
            const serverMessages = JSON.parse(data._server_messages);
            errorMsg = Array.isArray(serverMessages) 
              ? serverMessages.map(msg => JSON.parse(msg).message).join(', ')
              : JSON.parse(serverMessages).message;
          } catch (e) {
            errorMsg = data._server_messages || errorMsg;
          }
        } else if (data.message) {
          errorMsg = data.message;
        }
        return { success: false, error: errorMsg };
      }
      
      return { 
        success: true, 
        data: { 
          file_url: data.message.file_url 
        } 
      };
    } catch (error) {
      console.error("Error uploading file:", error);
      return { success: false, error: 'Network error occurred' };
    }
  },

  updateTenant: async (id: string, tenantData: any): Promise<{ success: boolean; data?: any; error?: string }> => {
    try {
      const response = await fetch(`${FRAPPE_URL}/api/resource/User/${id}`, {
        method: 'PUT',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          data: {
            first_name: tenantData.first_name,
            last_name: tenantData.last_name,
            email: tenantData.email,
            phone: tenantData.phone,
            enabled: tenantData.enabled ? 1 : 0
          }
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        const errorMsg = data.message || data._server_messages || 'Failed to update tenant';
        return { success: false, error: errorMsg };
      }
      
      return { success: true, data: data.data };
    } catch (error) {
      console.error("Error updating tenant:", error);
      return { success: false, error: 'Network error occurred' };
    }
  },

  getTenant: async (id: string): Promise<{ success: boolean; data?: any; error?: string }> => {
    try {
      const response = await fetch(`${FRAPPE_URL}/api/resource/User/${id}?fields=["name","first_name","last_name","email","phone","enabled"]`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        return { success: false, error: 'Failed to fetch tenant' };
      }
      
      const userData = await response.json();
      return { success: true, data: userData.data };
    } catch (error) {
      console.error("Error fetching tenant:", error);
      return { success: false, error: 'Failed to fetch tenant' };
    }
  },

  getUserDetails: async (): Promise<{ success: boolean; data?: any; error?: string }> => {
    try {
      const response = await fetch(`${FRAPPE_URL}/api/method/frappe.auth.get_logged_user`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        return { success: false, error: 'Failed to fetch user details' };
      }
      
      const data = await response.json();
      const email = data.message;
      
      const userResponse = await fetch(`${FRAPPE_URL}/api/resource/User/${email}?fields=["name","first_name","last_name","email","phone"]`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      
      if (!userResponse.ok) {
        return { success: false, error: 'Failed to fetch user details' };
      }
      
      const userData = await userResponse.json();
      return { success: true, data: userData.data };
    } catch (error) {
      console.error("Error fetching user details:", error);
      return { success: false, error: 'Failed to fetch user details' };
    }
  },

  updateUserProfile: async (profileData: any): Promise<{ success: boolean; data?: any; error?: string }> => {
    try {
      const userResponse = await fetch(`${FRAPPE_URL}/api/method/frappe.auth.get_logged_user`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      
      if (!userResponse.ok) {
        return { success: false, error: 'Failed to identify current user' };
      }
      
      const userData = await userResponse.json();
      const email = userData.message;
      
      const response = await fetch(`${FRAPPE_URL}/api/resource/User/${email}`, {
        method: 'PUT',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          data: {
            first_name: profileData.first_name,
            last_name: profileData.last_name,
            phone: profileData.phone
          }
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        const errorMsg = data.message || data._server_messages || 'Failed to update profile';
        return { success: false, error: errorMsg };
      }
      
      return { success: true, data: data.data };
    } catch (error) {
      console.error("Error updating profile:", error);
      return { success: false, error: 'Network error occurred' };
    }
  },

  changePassword: async (oldPassword: string, newPassword: string): Promise<{ success: boolean; data?: any; error?: string }> => {
    try {
      const response = await fetch(`${FRAPPE_URL}/api/method/frappe.core.doctype.user.user.update_password`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          old_password: oldPassword,
          new_password: newPassword
        })
      });
      
      const data = await response.json();
      
      if (!response.ok || data.exc) {
        const errorMsg = data.message || data._server_messages || 'Failed to change password';
        return { success: false, error: errorMsg };
      }
      
      return { success: true };
    } catch (error) {
      console.error("Error changing password:", error);
      return { success: false, error: 'Network error occurred' };
    }
  },

  createRental: async (rentalData: any): Promise<{ success: boolean; data?: any; error?: string }> => {
    try {
      const response = await fetch(`${FRAPPE_URL}/api/resource/Rental`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          data: rentalData
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        const errorMsg = data.message || data._server_messages || 'Failed to create rental';
        return { success: false, error: errorMsg };
      }
      
      return { success: true, data: data.data };
    } catch (error) {
      console.error("Error creating rental:", error);
      return { success: false, error: 'Network error occurred' };
    }
  },

  createPayment: async (paymentData: any): Promise<{ success: boolean; data?: any; error?: string }> => {
    try {
      const response = await fetch(`${FRAPPE_URL}/api/resource/Payment`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          data: paymentData
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        const errorMsg = data.message || data._server_messages || 'Failed to create payment';
        return { success: false, error: errorMsg };
      }
      
      return { success: true, data: data.data };
    } catch (error) {
      console.error("Error creating payment:", error);
      return { success: false, error: 'Network error occurred' };
    }
  },

  // Dashboard statistics methods
  getDashboardStats: async (): Promise<{ success: boolean; data?: any; error?: string }> => {
    try {
      const propertiesResult = await fetch(`${FRAPPE_URL}/api/resource/Property?limit_page_length=0`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      const propertiesData = await propertiesResult.json();
      
      const rentalsResult = await fetch(`${FRAPPE_URL}/api/resource/Rental?filters=[["status","=","Active"]]&limit_page_length=0`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      const rentalsData = await rentalsResult.json();
      
      const tenantsResult = await fetch(`${FRAPPE_URL}/api/resource/User?filters=[[\"Has Role\",\"role\",\"=\",\"Tenant\"]]&limit_page_length=0`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      const tenantsData = await tenantsResult.json();
      
      const pendingPaymentsResult = await fetch(`${FRAPPE_URL}/api/resource/Payment?filters=[["docstatus","=",0]]&limit_page_length=0`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      const pendingPaymentsData = await pendingPaymentsResult.json();
      
      const revenueResult = await fetch(`${FRAPPE_URL}/api/resource/Payment?filters=[["docstatus","=",1]]&fields=["sum(amount_tzs) as total"]`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      const revenueData = await revenueResult.json();
      
      return { 
        success: true, 
        data: {
          propertyCount: propertiesData.data?.length || 0,
          activeRentalCount: rentalsData.data?.length || 0,
          tenantCount: tenantsData.data?.length || 0,
          pendingPaymentCount: pendingPaymentsData.data?.length || 0,
          totalRevenue: revenueData.data?.[0]?.total || 0
        }
      };
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      return { success: false, error: 'Failed to fetch dashboard statistics' };
    }
  },

  // Get all payments
  getAllPayments: async (): Promise<{ success: boolean; data?: any[]; error?: string }> => {
    try {
      const response = await fetch(`${FRAPPE_URL}/api/resource/Payment?fields=["name","rental","amount_tzs","payment_date","payment_method","receipt_number","docstatus"]`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      
      const data = await response.json();
      return { success: true, data: data.data };
    } catch (error) {
      console.error("Error fetching payments:", error);
      return { success: false, error: 'Failed to fetch payments' };
    }
  },

  getPendingPayments: async (): Promise<{ success: boolean; data?: any[]; error?: string }> => {
    try {
      const response = await fetch(`${FRAPPE_URL}/api/resource/Payment?filters=[["docstatus","=",0]]&fields=["name","rental","amount_tzs","payment_date","payment_method","receipt_number","docstatus"]`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      
      const data = await response.json();
      return { success: true, data: data.data };
    } catch (error) {
      console.error("Error fetching pending payments:", error);
      return { success: false, error: 'Failed to fetch pending payments' };
    }
  },

  submitPayment: async (paymentId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const getResponse = await fetch(`${FRAPPE_URL}/api/resource/Payment/${paymentId}`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      
      const docData = await getResponse.json();
      
      if (!getResponse.ok) {
        return { success: false, error: 'Failed to retrieve payment document' };
      }
      
      const doc = docData.data;
      doc.docstatus = 1;
      
      const updateResponse = await fetch(`${FRAPPE_URL}/api/resource/Payment/${paymentId}`, {
        method: 'PUT',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          data: doc
        })
      });
      
      const updateData = await updateResponse.json();
      
      if (!updateResponse.ok) {
        let errorMsg = 'Failed to submit payment';
        if (updateData._server_messages) {
          try {
            const messages = JSON.parse(updateData._server_messages);
            errorMsg = Array.isArray(messages) 
              ? messages.map(msg => typeof msg === 'string' ? msg : JSON.parse(msg).message).join(', ')
              : typeof messages === 'string' ? messages : JSON.parse(messages).message;
          } catch (e) {
            errorMsg = updateData._server_messages || errorMsg;
          }
        } else if (updateData.message) {
          errorMsg = updateData.message;
        }
        return { success: false, error: errorMsg };
      }
      
      return { success: true };
    } catch (error) {
      console.error(`Error submitting payment ${paymentId}:`, error);
      return { success: false, error: 'Network error occurred' };
    }
  },

  // Generate print URL for a payment
  getPaymentPrintUrl: (paymentId: string, printFormat: string = "Standard"): string => {
    return `${FRAPPE_URL}/api/method/frappe.utils.print_format.download_pdf?doctype=Payment&name=${paymentId}&format=Payment%20Print&no_letterhead=0&letterhead=Company%20Letter%20Head&settings=%7B%7D&_lang=en`;
  },

  // Alternative method that doesn't rely on custom API endpoint
  getTenantRentalsByEmail: async (email: string): Promise<{ success: boolean; data?: any[]; error?: string }> => {
    try {
      const tokens = tokenStorage.getTokens();
      if (!tokens) {
        return { success: false, error: 'Not authenticated' };
      }
      
      // Directly use the email as the tenant identifier
      const response = await fetch(`${FRAPPE_URL}/api/resource/Rental?filters=[["tenant","=","${email}"]]&fields=["name","property","tenant","status","monthly_rent_tzs","total_rent_tzs","start_date","end_date","frequency"]`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Failed to fetch rentals:", errorData);
        return { success: false, error: `Failed to fetch rentals: ${response.statusText}` };
      }
      
      const data = await response.json();
      console.log("Tenant rentals from standard API:", data);
      
      return { success: true, data: data.data || [] };
    } catch (error) {
      console.error("Error in getTenantRentalsByEmail:", error);
      return { success: false, error: 'Failed to fetch tenant rentals' };
    }
  },
  
  // Alternative method for payments that doesn't rely on custom API
  getPaymentsByRental: async (rentalId: string): Promise<{ success: boolean; data?: any[]; error?: string }> => {
    try {
      const response = await fetch(`${FRAPPE_URL}/api/resource/Payment?filters=[["rental","=","${rentalId}"]]&fields=["name","amount_tzs","payment_date","payment_method","receipt_number","docstatus"]`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      
      const data = await response.json();
      return { success: true, data: data.data };
    } catch (error) {
      console.error(`Error fetching payments for rental ${rentalId}:`, error);
      return { success: false, error: 'Failed to fetch payments' };
    }
  },

  getRecentActivities: async (limit: number = 10): Promise<{ success: boolean; data?: any[]; error?: string }> => {
    try {
      // First, fetch recent activities from various doctype audit logs
      // We'll combine activities from different sources: payments, rentals, properties, and users

      // Get recent payments
      const paymentsResponse = await fetch(`${FRAPPE_URL}/api/resource/Payment?fields=["name","creation","modified","modified_by","rental","amount_tzs","payment_date"]&limit=${limit}&order_by=creation desc`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      const paymentsData = await paymentsResponse.json();
      
      // Get recent rentals
      const rentalsResponse = await fetch(`${FRAPPE_URL}/api/resource/Rental?fields=["name","creation","modified","modified_by","property","tenant","status","start_date","end_date"]&limit=${limit}&order_by=creation desc`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      const rentalsData = await rentalsResponse.json();
      
      // Get recent property changes
      const propertiesResponse = await fetch(`${FRAPPE_URL}/api/resource/Property?fields=["name","creation","modified","modified_by","title","status"]&limit=${limit}&order_by=creation desc`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      const propertiesData = await propertiesResponse.json();
      
      // Get recent user changes (tenants)
      const usersResponse = await fetch(`${FRAPPE_URL}/api/resource/User?filters=[[\"Has Role\",\"role\",\"=\",\"Tenant\"]]&fields=["name","creation","modified","modified_by","full_name"]&limit=${limit}&order_by=creation desc`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      const usersData = await usersResponse.json();
      
      // Transform payment data into activity items
      const paymentActivities = (paymentsData.data || []).map(payment => ({
        id: `payment-${payment.name}`,
        type: 'payment',
        title: `Payment Recorded: ${payment.name}`,
        description: `Payment of TZS ${payment.amount_tzs.toLocaleString()} for rental ${payment.rental} on ${new Date(payment.payment_date).toLocaleDateString()}`,
        timestamp: payment.creation || payment.modified,
        relatedId: payment.name,
        actor: payment.modified_by
      }));
      
      // Transform rental data into activity items
      const rentalActivities = (rentalsData.data || []).map(rental => ({
        id: `rental-${rental.name}`,
        type: 'lease',
        title: `Rental ${rental.status === 'Active' ? 'Activated' : 'Updated'}: ${rental.name}`,
        description: `Rental agreement for ${rental.property} with tenant ${rental.tenant} (${rental.start_date} to ${rental.end_date})`,
        timestamp: rental.creation || rental.modified,
        relatedId: rental.name,
        actor: rental.modified_by
      }));
      
      // Transform property data into activity items
      const propertyActivities = (propertiesData.data || []).map(property => ({
        id: `property-${property.name}`,
        type: 'property',
        title: `Property ${property.creation === property.modified ? 'Added' : 'Updated'}: ${property.title}`,
        description: `Property ${property.title} (${property.name}) was ${property.creation === property.modified ? 'added' : 'updated'} with status: ${property.status}`,
        timestamp: property.creation || property.modified,
        relatedId: property.name,
        actor: property.modified_by
      }));
      
      // Transform user data into activity items
      const tenantActivities = (usersData.data || []).map(user => ({
        id: `tenant-${user.name}`,
        type: 'tenant',
        title: `Tenant ${user.creation === user.modified ? 'Added' : 'Updated'}: ${user.full_name}`,
        description: `Tenant ${user.full_name} (${user.name}) was ${user.creation === user.modified ? 'added to' : 'updated in'} the system`,
        timestamp: user.creation || user.modified,
        relatedId: user.name,
        actor: user.modified_by
      }));
      
      // Combine all activities and sort by timestamp (newest first)
      const allActivities = [
        ...paymentActivities,
        ...rentalActivities,
        ...propertyActivities,
        ...tenantActivities
      ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit); // Limit to the requested number of activities
      
      return { success: true, data: allActivities };
    } catch (error) {
      console.error("Error fetching recent activities:", error);
      return { success: false, error: 'Failed to fetch recent activities' };
    }
  },

  getTenantDetailsByEmail: async (email: string): Promise<{ success: boolean; data?: any; error?: string }> => {
    try {
      const tokens = tokenStorage.getTokens();
      if (!tokens) {
        return { success: false, error: 'Not authenticated' };
      }
      
      // Skip Tenant doctype lookup and directly use User doctype
      const userResponse = await fetch(`${FRAPPE_URL}/api/resource/User/${email}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
          'Accept': 'application/json'
        }
      });
      
      const userData = await userResponse.json();
      
      if (!userResponse.ok) {
        console.error("Failed to fetch user details:", userData);
        return { success: false, error: userData.message || 'Failed to fetch user details' };
      }
      
      // Construct a full name from first_name and last_name
      const fullName = [userData.data.first_name, userData.data.last_name]
        .filter(Boolean)
        .join(' ');
        
      return { 
        success: true, 
        data: {
          name: userData.data.name,
          full_name: fullName || userData.data.name,
          email: userData.data.email,
          phone: userData.data.phone
        }
      };
    } catch (error) {
      console.error("Error in getTenantDetailsByEmail:", error);
      return { success: false, error: 'Failed to fetch tenant details' };
    }
  },

  createMaintenanceRequest: async (requestData: any): Promise<{ success: boolean; data?: any; error?: string }> => {
    try {
      const response = await fetch(`${FRAPPE_URL}/api/resource/Maintenance Request`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          data: requestData
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        const errorMsg = data.message || data._server_messages || 'Failed to create maintenance request';
        return { success: false, error: errorMsg };
      }
      
      return { success: true, data: data.data };
    } catch (error) {
      console.error("Error creating maintenance request:", error);
      return { success: false, error: 'Network error occurred' };
    }
  },

  getMaintenanceRequests: async (): Promise<{ success: boolean; data?: any; error?: string }> => {
    try {
      const url = `${FRAPPE_URL}/api/resource/Maintenance Request`;
      console.log("Fetching all Maintenance Requests from URL:", url); // Debugging log

      const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.message || data._server_messages || 'Failed to fetch maintenance requests';
        console.error("Error Response from Maintenance Requests API:", data); // Debugging log
        return { success: false, error: errorMsg };
      }

      console.log("Raw Maintenance Requests Data:", data.data); // Debugging log

      return { success: true, data: data.data };
    } catch (error) {
      console.error("Error fetching maintenance requests:", error);
      return { success: false, error: 'Network error occurred' };
    }
  },

  updateMaintenanceRequest: async (requestId: string, updateData: any): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch(`${FRAPPE_URL}/api/resource/Maintenance Request/${requestId}`, {
        method: 'PUT',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: updateData }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.message || data._server_messages || 'Failed to update maintenance request';
        return { success: false, error: errorMsg };
      }

      return { success: true };
    } catch (error) {
      console.error("Error updating maintenance request:", error);
      return { success: false, error: 'Network error occurred' };
    }
  }
};
