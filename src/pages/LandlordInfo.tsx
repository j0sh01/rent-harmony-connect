import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Building, Shield, BarChart, Clock, CreditCard, Users } from "lucide-react";

const LandlordInfo = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-harmony-50 py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Property Management Made Simple
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                RentHarmony provides landlords with powerful tools to streamline property management, 
                reduce vacancies, and increase rental income.
              </p>
              <Button 
                className="bg-harmony-500 hover:bg-harmony-600 text-white px-8 py-6 text-lg"
                asChild
              >
                <Link to="/auth">Get Started Today</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Benefits for Landlords</h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="w-12 h-12 bg-harmony-100 rounded-full flex items-center justify-center mb-4">
                  <Building className="h-6 w-6 text-harmony-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Property Listing Management</h3>
                <p className="text-gray-600">
                  Easily create and manage property listings with detailed information, photos, and availability status.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="w-12 h-12 bg-harmony-100 rounded-full flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-harmony-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Tenant Screening</h3>
                <p className="text-gray-600">
                  Streamline tenant applications and verification processes to find reliable renters quickly.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="w-12 h-12 bg-harmony-100 rounded-full flex items-center justify-center mb-4">
                  <CreditCard className="h-6 w-6 text-harmony-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Payment Tracking</h3>
                <p className="text-gray-600">
                  Monitor rent payments, send reminders, and maintain complete financial records in one place.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="w-12 h-12 bg-harmony-100 rounded-full flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-harmony-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Lease Management</h3>
                <p className="text-gray-600">
                  Create, store, and manage lease agreements with automatic renewal notifications.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="w-12 h-12 bg-harmony-100 rounded-full flex items-center justify-center mb-4">
                  <Clock className="h-6 w-6 text-harmony-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Maintenance Requests</h3>
                <p className="text-gray-600">
                  Receive and track maintenance requests from tenants to address issues promptly.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="w-12 h-12 bg-harmony-100 rounded-full flex items-center justify-center mb-4">
                  <BarChart className="h-6 w-6 text-harmony-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Financial Reporting</h3>
                <p className="text-gray-600">
                  Generate detailed financial reports to track income, expenses, and property performance.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-harmony-600 text-white py-16">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-6">Ready to Simplify Your Property Management?</h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Join thousands of landlords who trust RentHarmony to manage their rental properties efficiently.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button 
                className="bg-white text-harmony-600 hover:bg-gray-100 px-8 py-6 text-lg"
                asChild
              >
                <Link to="/auth">Sign Up Now</Link>
              </Button>
              <Button 
                variant="outline" 
                className="border-white text-white hover:bg-harmony-700 px-8 py-6 text-lg"
                asChild
              >
                <Link to="/about">Learn More</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default LandlordInfo;