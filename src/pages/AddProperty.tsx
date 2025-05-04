import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import { frappeClient, FRAPPE_URL } from "@/integrations/frappe/client";
import { toast } from "sonner";

const AddProperty: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [property, setProperty] = useState({
    title: '',
    location: '',
    price_tzs: '',
    bedrooms: '',
    bathroom: '',
    square_meters: '',
    description: '',
    status: 'Available', // Capitalized initial value
    image: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProperty(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setProperty(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    setUploading(true);
    
    try {
      // Create a temporary ID for the file upload
      const tempId = `new_property_${Date.now()}`;
      
      // Upload the file with the temporary ID
      const result = await frappeClient.uploadFile(file, 'Property', tempId);
      
      if (result.success && result.data) {
        // For Attach Image type fields, we need to store the file URL
        setProperty(prev => ({ ...prev, image: result.data.file_url }));
        setImagePreview(URL.createObjectURL(file));
        toast.success("Image uploaded successfully");
      } else {
        toast.error(result.error || "Failed to upload image");
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("An unexpected error occurred during upload");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await frappeClient.createProperty({
        ...property,
        price_tzs: Number(property.price_tzs),
        bedrooms: Number(property.bedrooms),
        bathroom: Number(property.bathroom),
        square_meters: Number(property.square_meters),
        // Make sure the image field is included as is
        image: property.image
      });

      if (result.success) {
        toast.success("Property added successfully");
        navigate('/properties');
      } else {
        toast.error(result.error || "Failed to add property");
      }
    } catch (error) {
      console.error("Error adding property:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Add New Property</h1>
          <Button variant="outline" onClick={() => navigate('/admin-dashboard')}>
            Back to Dashboard
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Property Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Property Title</Label>
                  <Input 
                    id="title" 
                    name="title" 
                    value={property.title} 
                    onChange={handleChange} 
                    required 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input 
                    id="location" 
                    name="location" 
                    value={property.location} 
                    onChange={handleChange} 
                    required 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="price_tzs">Price (TZS)</Label>
                  <Input 
                    id="price_tzs" 
                    name="price_tzs" 
                    type="number" 
                    value={property.price_tzs} 
                    onChange={handleChange} 
                    required 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="bedrooms">Bedrooms</Label>
                  <Input 
                    id="bedrooms" 
                    name="bedrooms" 
                    type="number" 
                    value={property.bedrooms} 
                    onChange={handleChange} 
                    required 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="bathroom">Bathrooms</Label>
                  <Input 
                    id="bathroom" 
                    name="bathroom" 
                    type="number" 
                    value={property.bathroom} 
                    onChange={handleChange} 
                    required 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="square_meters">Square Meters</Label>
                  <Input 
                    id="square_meters" 
                    name="square_meters" 
                    type="number" 
                    value={property.square_meters} 
                    onChange={handleChange} 
                    required 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select 
                    value={property.status} 
                    onValueChange={(value) => handleSelectChange('status', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Available">Available</SelectItem>
                      <SelectItem value="Rented">Rented</SelectItem>
                      <SelectItem value="Under Maintenance">Under Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="image">Property Image</Label>
                  <div className="flex flex-col space-y-2">
                    {imagePreview && (
                      <div className="mb-2">
                        <img 
                          src={imagePreview} 
                          alt="Property preview" 
                          className="w-full max-w-md h-auto rounded-md" 
                        />
                      </div>
                    )}
                    <Input 
                      id="image"
                      ref={fileInputRef}
                      type="file" 
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    <div className="flex space-x-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                      >
                        {uploading ? "Uploading..." : "Choose Image"}
                      </Button>
                      {property.image && (
                        <span className="text-sm text-gray-500 flex items-center">
                          {property.image.split('/').pop()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description" 
                  name="description" 
                  value={property.description} 
                  onChange={handleChange} 
                  rows={4} 
                  required 
                />
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate('/admin-dashboard')}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-harmony-500 hover:bg-harmony-600"
                  disabled={loading || uploading}
                >
                  {loading ? "Saving..." : "Save Property"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AddProperty;
