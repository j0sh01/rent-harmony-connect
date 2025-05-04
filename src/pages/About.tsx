import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const About = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-harmony-50 py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                About RentHarmony
              </h1>
              <p className="text-xl text-gray-600">
                Transforming property management through innovation and exceptional service.
              </p>
            </div>
          </div>
        </section>

        {/* Our Story Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold mb-8">Our Story</h2>
              <div className="prose prose-lg max-w-none">
                <p>
                  RentHarmony was founded in 2020 with a simple mission: to create harmony between property owners and tenants through technology. We recognized the challenges faced by both landlords and renters in the traditional property management process and set out to build a solution that would benefit everyone involved.
                </p>
                <p>
                  Our team of real estate professionals, technology experts, and customer service specialists came together to develop a platform that streamlines every aspect of property management—from listing and tenant screening to rent collection and maintenance requests.
                </p>
                <p>
                  Today, RentHarmony serves thousands of property owners and tenants across the country, helping them save time, reduce stress, and build better relationships. We're proud of the positive impact we've made in the rental industry and remain committed to continuous innovation and improvement.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Our Values Section */}
        <section className="bg-gray-50 py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Our Values</h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-3 text-harmony-600">Transparency</h3>
                <p className="text-gray-600">
                  We believe in clear communication and honest business practices. Our platform provides complete visibility into all aspects of property management.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-3 text-harmony-600">Innovation</h3>
                <p className="text-gray-600">
                  We continuously improve our platform with new features and technologies to provide the best possible experience for landlords and tenants.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-3 text-harmony-600">Reliability</h3>
                <p className="text-gray-600">
                  Our users depend on our platform for critical business operations. We're committed to providing a stable, secure, and dependable service.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-3 text-harmony-600">Accessibility</h3>
                <p className="text-gray-600">
                  We design our platform to be intuitive and easy to use for everyone, regardless of technical expertise or background.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-3 text-harmony-600">Community</h3>
                <p className="text-gray-600">
                  We foster positive relationships between landlords and tenants, creating communities where everyone feels respected and valued.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-3 text-harmony-600">Integrity</h3>
                <p className="text-gray-600">
                  We operate with the highest ethical standards, ensuring that our business practices align with our values and the best interests of our users.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Our Team Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-12">Our Leadership Team</h2>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="w-32 h-32 bg-gray-200 rounded-full mx-auto mb-4"></div>
                  <h3 className="text-xl font-semibold">Sarah Johnson</h3>
                  <p className="text-harmony-600">CEO & Co-Founder</p>
                  <p className="text-gray-600 mt-2">
                    15+ years in real estate and property management
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-32 h-32 bg-gray-200 rounded-full mx-auto mb-4"></div>
                  <h3 className="text-xl font-semibold">Michael Chen</h3>
                  <p className="text-harmony-600">CTO & Co-Founder</p>
                  <p className="text-gray-600 mt-2">
                    Former tech lead at major property platforms
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-32 h-32 bg-gray-200 rounded-full mx-auto mb-4"></div>
                  <h3 className="text-xl font-semibold">David Rodriguez</h3>
                  <p className="text-harmony-600">COO</p>
                  <p className="text-gray-600 mt-2">
                    Expert in operations and customer experience
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact CTA Section */}
        <section className="bg-harmony-600 text-white py-16">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-6">Ready to Transform Your Property Management?</h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Join thousands of property owners and tenants who trust RentHarmony to simplify their rental experience.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button 
                className="bg-white text-harmony-600 hover:bg-gray-100 px-8 py-6 text-lg"
                asChild
              >
                <Link to="/auth">Get Started Today</Link>
              </Button>
              <Button 
                variant="outline" 
                className="border-white text-white hover:bg-harmony-700 px-8 py-6 text-lg"
                asChild
              >
                <Link to="/properties">Browse Properties</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default About;
