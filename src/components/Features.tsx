
import { CheckCircle } from "lucide-react";

const featuresData = [
  {
    title: "For Landlords",
    description: "Comprehensive property management tools to streamline your rental business operations.",
    benefits: [
      "Property listing and tenant management",
      "Automated rent collection and payment tracking", 
      "Digital lease agreements and document storage",
      "Maintenance request handling and scheduling"
    ],
    image: "https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?auto=format&fit=crop&q=80&w=1740",
    color: "bg-harmony-100",
    highlight: "bg-harmony-500"
  },
  {
    title: "For Tenants",
    description: "Easy access to your rental information and transaction history in one place.",
    benefits: [
      "Track rent payment history and upcoming dues",
      "View lease agreement details and terms", 
      "Submit and monitor maintenance requests",
      "Communicate directly with property management"
    ],
    image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=1740",
    color: "bg-warm-100",
    highlight: "bg-warm-500"
  }
];

const Features = () => {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Streamlined Rental Management Platform
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            A complete solution for property owners to manage rentals efficiently and for tenants to stay informed about their rental status.
          </p>
        </div>
        
        <div className="space-y-20">
          {featuresData.map((feature, index) => (
            <div 
              key={index}
              className={`flex flex-col ${index % 2 === 1 ? 'md:flex-row-reverse' : 'md:flex-row'} items-center gap-8 md:gap-16`}
            >
              <div className="md:w-1/2 relative">
                <div className={`absolute -top-4 -left-4 right-4 bottom-4 ${feature.color} rounded-lg`}></div>
                <img
                  src={feature.image}
                  alt={feature.title}
                  className="relative z-10 rounded-lg shadow-md w-full h-[300px] md:h-[400px] object-cover"
                />
              </div>
              
              <div className="md:w-1/2">
                <h3 className="text-2xl md:text-3xl font-bold mb-4">{feature.title}</h3>
                <p className="text-gray-600 mb-6 text-lg">{feature.description}</p>
                
                <ul className="space-y-3">
                  {feature.benefits.map((benefit, idx) => (
                    <li key={idx} className="flex items-start">
                      <CheckCircle className={`h-6 w-6 mr-2 flex-shrink-0 ${feature.highlight} text-white rounded-full`} />
                      <span className="text-gray-700">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
