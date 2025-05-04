
import { Card, CardContent } from "@/components/ui/card";

const testimonials = [
  {
    id: 1,
    content: "Rent Harmony Connect simplified my life as a landlord. Their tenant screening process saved me time and found me reliable tenants.",
    author: "Michael P.",
    role: "Property Owner",
    avatar: "https://randomuser.me/api/portraits/men/32.jpg"
  },
  {
    id: 2,
    content: "I found my dream apartment in less than a week. The virtual tours and transparent application process made everything so easy!",
    author: "Sarah J.",
    role: "Tenant",
    avatar: "https://randomuser.me/api/portraits/women/44.jpg"
  },
  {
    id: 3,
    content: "The automated rent collection feature is a game-changer. No more chasing late payments or dealing with paper checks.",
    author: "David K.",
    role: "Property Manager",
    avatar: "https://randomuser.me/api/portraits/men/62.jpg"
  }
];

const Testimonials = () => {
  return (
    <section className="py-16 bg-harmony-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            What Our Users Say
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Join thousands of satisfied landlords and tenants who have transformed their rental experience
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={testimonial.id} className="border-none shadow-lg hover-lift">
              <CardContent className="pt-6 px-6 pb-8">
                <div className="flex items-center mb-6">
                  <div className="flex-shrink-0 mr-3">
                    <img
                      className="h-12 w-12 rounded-full"
                      src={testimonial.avatar}
                      alt={testimonial.author}
                    />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">{testimonial.author}</h4>
                    <p className="text-harmony-600">{testimonial.role}</p>
                  </div>
                </div>
                <div className="mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span key={star} className="text-warm-500">★</span>
                  ))}
                </div>
                <p className="text-gray-600 italic">"{testimonial.content}"</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
