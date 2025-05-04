import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Home, Search, FileText, MessageSquare, Bell, Wallet } from "lucide-react";

const TenantInfo = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-harmony-50 py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Find Your Perfect Rental Home
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                RentHarmony helps you discover quality rental properties and manage your tenancy with ease.
              </p>
              <Button 
                className="bg-harmony-500 hover:bg-harmony-600 text-white px-8 py-6 text-lg"
                asChild
              >
                <Link to="/properties">Browse Properties</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Benefits for Tenants</h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="w-12 h-12 bg-harmony-100 rounded-full flex items-center justify-center mb-4">
                  <Search className="h-6 w-6 text-harmony-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Easy Property Search</h3>
                <p className="text-gray-600">
                  Find your ideal rental home with our advanced search filters for location, price, amenities, and more.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="w-12 h-12 bg-harmony-100 rounded-full flex items-center justify-center mb-4">
                  <Home className="h-6 w-6 text-harmony-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Virtual Tours</h3>
                <p className="text-gray-600">
                  Explore properties remotely with detailed photos and virtual tours before scheduling in-person viewings.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="w-12 h-12 bg-harmony-100 rounded-full flex items-center justify-center mb-4">
                  <FileText className="h-6 w-6 text-harmony-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Online Applications</h3>
                <p className="text-gray-600">
                  Apply for properties online with a streamlined application process and secure document submission.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="w-12 h-12 bg-harmony-100 rounded-full flex items-center justify-center mb-4">
                  <Wallet className="h-6 w-6 text-harmony-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Online Rent Payments</h3>
                <p className="text-gray-600">
                  Pay rent securely online and access your complete payment history anytime.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="w-12 h-12 bg-harmony-100 rounded-full flex items-center justify-center mb-4">
                  <MessageSquare className="h-6 w-6 text-harmony-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Maintenance Requests</h3>
                <p className="text-gray-600">
                  Submit and track maintenance requests directly through the platform with real-time updates.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="w-12 h-12 bg-harmony-100 rounded-full flex items-center justify-center mb-4">
                  <Bell className="h-6 w-6 text-harmony-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Notifications & Reminders</h3>
                <p className="text-gray-600">
                  Receive timely notifications about rent due dates, lease renewals, and maintenance updates.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="bg-gray-50 py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">What Our Tenants Say</h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-harmony-200 rounded-full flex items-center justify-center mr-4">
                    <span className="text-harmony-700 font-semibold">JD</span>
                  </div>
                  <div>
                    <h4 className="font-semibold">John Doe</h4>
                    <p className="text-sm text-gray-500">Tenant since 2022</p>
                  </div>
                </div>
                <p className="text-gray-600">
                  "Finding my apartment was so easy with RentHarmony. The virtual tour feature saved me so much time, and the online application process was seamless."
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-harmony-200 rounded-full flex items-center justify-center mr-4">
                    <span className="text-harmony-700 font-semibold">SM</span>
                  </div>
                  <div>
                    <h4 className="font-semibold">Sarah Miller</h4>
                    <p className="text-sm text-gray-500">Tenant since 2021</p>
                  </div>
                </div>
                <p className="text-gray-600">
                  "I love being able to pay my rent online and submit maintenance requests through the app. It makes communication with my landlord so much easier."
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-harmony-200 rounded-full flex items-center justify-center mr-4">
                    <span className="text-harmony-700 font-semibold">RJ</span>
                  </div>
                  <div>
                    <h4 className="font-semibold">Robert Johnson</h4>
                    <p className="text-sm text-gray-500">Tenant since 2023</p>
                  </div>
                </div>
                <p className="text-gray-600">
                  "The notification system is fantastic. I never miss a rent payment or important update about my apartment. Highly recommend RentHarmony!"
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-harmony-600 text-white py-16">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-6">Ready to Find Your New Home?</h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Browse our available properties and experience a better way to rent.
            </p>
            <Button 
              className="bg-white text-harmony-600 hover:bg-gray-100 px-8 py-6 text-lg"
              asChild
            >
              <Link to="/properties">Browse Properties</Link>
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default TenantInfo;