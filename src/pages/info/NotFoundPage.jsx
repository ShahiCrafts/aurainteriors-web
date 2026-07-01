import React from "react";
import { Link } from "react-router-dom";
import Lottie from "lottie-react";
import { ArrowLeft } from "lucide-react";
import Navbar from "../../layouts/customer/Navbar";
import Footer from "../../layouts/customer/Footer";

/**
 * The 264 KB Lottie JSON was previously a static import, which bundled it
 * inline into this chunk and ballooned the 404 page to ~589 KB.
 *
 * By using fetch() + useState we load it from the public directory at runtime
 * instead — keeping it out of any JS bundle entirely.
 */
const NotFoundPage = () => {
  const [animationData, setAnimationData] = React.useState(null);

  React.useEffect(() => {
    fetch("/not_found.json")
      .then((r) => r.json())
      .then(setAnimationData)
      .catch(() => {}); // animation is purely cosmetic — silently swallow errors
  }, []);

  return (
    <>
      <Navbar />
      <div className="py-20 flex flex-col items-center justify-center px-4 bg-neutral-50 font-dm-sans">
        <div className="w-full max-w-xs mb-3">
          {animationData && <Lottie animationData={animationData} loop={true} />}
        </div>

        <h1 className="text-2xl md:text-3xl font-playfair font-semibold text-neutral-900 mb-4 text-center">
          Page Not Found
        </h1>

        <p className="text-neutral-500 text-lg mb-5 text-center max-w-md">
          Oops! The page you are looking for seems to have vanished into thin air.
        </p>

        <Link
          to="/"
          className="inline-flex items-center gap-2 px-8 py-3 text-teal-700 font-medium rounded-full transition-all duration-300"
        >
          <ArrowLeft size={20} />
          Go Back Home
        </Link>
      </div>
      <Footer />
    </>
  );
};

export default NotFoundPage;
