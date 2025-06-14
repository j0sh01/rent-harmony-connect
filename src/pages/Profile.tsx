import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/ui/Sidebar"; // Import Sidebar
import { frappeClient } from "@/integrations/frappe/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [fullName, setFullName] = useState<string>('');

  // Add this function to get user initials
  const getUserInitials = (name: string) => {
    console.log("Getting initials for name:", name);
    
    if (!name || name.trim() === '') {
      console.log("Name is empty, returning U");
      return "U";
    }
    
    const nameParts = name.trim().split(/\s+/);
    console.log("Name parts:", nameParts);
    
    if (nameParts.length === 0 || (nameParts.length === 1 && nameParts[0] === '')) {
      console.log("No valid name parts, returning U");
      return "U";
    }
    
    if (nameParts.length === 1) {
      const initial = nameParts[0].charAt(0).toUpperCase();
      console.log("Single name part, returning initial:", initial);
      return initial;
    }
    
    const initials = (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
    console.log("Multiple name parts, returning initials:", initials);
    return initials;
  };

  useEffect(() => {
    console.log("Current user data:", user);
    console.log("Current profile data:", profile);
    
    // Check if user is authenticated
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    
    if (!isAuthenticated || !user) {
      navigate('/auth');
      return;
    }

    const fetchUserProfile = async () => {
      setLoading(true);
      try {
        // If we're using the demo admin account, just use the localStorage data
        if (user.email === "admin@rentalflow-pro.com") {
          const userName = localStorage.getItem('userName') || 'Admin User';
          const nameParts = userName.split(' ');
          
          setProfile({
            first_name: nameParts[0] || 'Admin',
            last_name: nameParts.slice(1).join(' ') || 'User',
            email: user.email,
            phone: '',
            current_password: '',
            new_password: '',
            confirm_password: ''
          });
          
          console.log("Set profile for demo admin:", {
            first_name: nameParts[0] || 'Admin',
            last_name: nameParts.slice(1).join(' ') || 'User'
          });
          
          setLoading(false);
          return;
        }
        
        // For regular users, use the email from the user object
        console.log("Fetching profile for email:", user.email);
        
        // If we don't have user details from Frappe yet, use the name from localStorage
        const userName = localStorage.getItem('userName');
        if (userName) {
          const nameParts = userName.split(' ');
          
          setProfile({
            first_name: nameParts[0] || '',
            last_name: nameParts.slice(1).join(' ') || '',
            email: user.email,
            phone: '',
            current_password: '',
            new_password: '',
            confirm_password: ''
          });
          
          console.log("Using profile from localStorage:", {
            first_name: nameParts[0] || '',
            last_name: nameParts.slice(1).join(' ') || ''
          });
        }
        
        // Still try to fetch from Frappe
        const result = await frappeClient.getUserDetails();
        if (result.success && result.data) {
          setProfile({
            first_name: result.data.first_name || '',
            last_name: result.data.last_name || '',
            email: result.data.email || user.email || '',
            phone: result.data.phone || '',
            current_password: '',
            new_password: '',
            confirm_password: ''
          });
          console.log("Profile fetched from Frappe:", result.data);
        } else {
          console.error("Failed to fetch profile from Frappe:", result.error);
          toast.error(result.error || "Failed to fetch profile");
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        toast.error("An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [user, navigate]);

  useEffect(() => {
    // Set the full name whenever profile data changes
    if (profile.first_name || profile.last_name) {
      const name = `${profile.first_name} ${profile.last_name}`.trim();
      setFullName(name);
      console.log("Set full name:", name);
    } else if (user?.name) {
      setFullName(user.name);
      console.log("Set full name from user:", user.name);
    } else {
      const storedName = localStorage.getItem('userName');
      if (storedName) {
        setFullName(storedName);
        console.log("Set full name from localStorage:", storedName);
      }
    }
  }, [profile, user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const result = await frappeClient.updateUserProfile({
        first_name: profile.first_name,
        last_name: profile.last_name,
        phone: profile.phone
      });

      if (result.success) {
        toast.success("Profile updated successfully");
        // Update local storage with new name
        const fullName = `${profile.first_name} ${profile.last_name}`.trim();
        localStorage.setItem('userName', fullName);
      } else {
        toast.error(result.error || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (profile.new_password !== profile.confirm_password) {
      toast.error("New passwords do not match");
      return;
    }
    
    setSaving(true);

    try {
      const result = await frappeClient.changePassword(
        profile.current_password,
        profile.new_password
      );

      if (result.success) {
        toast.success("Password changed successfully");
        setProfile(prev => ({
          ...prev,
          current_password: '',
          new_password: '',
          confirm_password: ''
        }));
      } else {
        toast.error(result.error || "Failed to change password");
      }
    } catch (error) {
      console.error("Error changing password:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Sidebar role={user?.role || 'admin'} /> {/* Add Sidebar */}
      <div className="ml-[240px]"> {/* Add margin to accommodate sidebar */}
        <Navbar />
        <main className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">My Profile</h1>
            <Button 
              variant="outline" 
              onClick={() => navigate(user?.role === 'admin' ? '/admin-dashboard' : '/tenant-dashboard')}
            >
              Back to Dashboard
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Profile Information */}
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your personal details</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-4">Loading profile information...</div>
                ) : (
                  <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <div className="flex justify-center mb-4">
                      <Avatar className="h-24 w-24">
                        <AvatarFallback 
                          className="bg-[#e6f7ff] text-[#00b3d7] text-3xl font-medium"
                        >
                          {fullName ? getUserInitials(fullName) : "U"}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="first_name">First Name</Label>
                      <Input 
                        id="first_name" 
                        name="first_name" 
                        value={profile.first_name} 
                        onChange={handleChange} 
                        required 
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="last_name">Last Name</Label>
                      <Input 
                        id="last_name" 
                        name="last_name" 
                        value={profile.last_name} 
                        onChange={handleChange} 
                        required 
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input 
                        id="email" 
                        name="email" 
                        type="email" 
                        value={profile.email} 
                        disabled 
                      />
                      <p className="text-sm text-gray-500">Email cannot be changed</p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input 
                        id="phone" 
                        name="phone" 
                        value={profile.phone} 
                        onChange={handleChange} 
                      />
                    </div>
                    
                    <div className="flex justify-end pt-4">
                      <Button 
                        type="submit" 
                        className="bg-harmony-500 hover:bg-harmony-600"
                        disabled={saving}
                      >
                        {saving ? "Saving..." : "Update Profile"}
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>

            {/* Change Password */}
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>Update your account password</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-4">Loading...</div>
                ) : (
                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="current_password">Current Password</Label>
                      <Input 
                        id="current_password" 
                        name="current_password" 
                        type="password" 
                        value={profile.current_password} 
                        onChange={handleChange} 
                        required 
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="new_password">New Password</Label>
                      <Input 
                        id="new_password" 
                        name="new_password" 
                        type="password" 
                        value={profile.new_password} 
                        onChange={handleChange} 
                        required 
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="confirm_password">Confirm New Password</Label>
                      <Input 
                        id="confirm_password" 
                        name="confirm_password" 
                        type="password" 
                        value={profile.confirm_password} 
                        onChange={handleChange} 
                        required 
                      />
                    </div>
                    
                    <div className="flex justify-end pt-4">
                      <Button 
                        type="submit" 
                        className="bg-harmony-500 hover:bg-harmony-600"
                        disabled={saving}
                      >
                        {saving ? "Changing..." : "Change Password"}
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Profile;
