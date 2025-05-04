
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const CallToAction = () => {
  return (
    <section className="py-16 bg-harmony-600 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Ready to Simplify Your Property Management?
        </h2>
        <p className="text-xl text-harmony-100 max-w-3xl mx-auto mb-8">
          Access your dashboard to manage properties, track payments, and streamline your rental operations.
        </p>
        <div className="flex justify-center">
          <Link to="/auth">
            <Button size="lg" className="bg-white text-harmony-600 hover:bg-gray-100 px-8">
              Sign In to Dashboard
            </Button>
          </Link>
        </div>
        <p className="mt-6 text-harmony-200 text-sm">
          Need an account? Contact your administrator for access.
        </p>
      </div>
    </section>
  );
};

export default CallToAction;
