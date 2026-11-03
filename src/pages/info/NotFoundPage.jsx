import React, { Suspense, lazy } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Navbar from "../../layouts/customer/Navbar";
import Seo from "../../components/common/Seo.jsx";
import Footer from "../../layouts/customer/Footer";

// The owner's Lottie artwork (Market_research.lottie) — lazy so the
// lottie-web player stays out of the main bundle; see
// NotFoundAnimation.jsx for the playback approach.
const NotFoundAnimation = lazy(() => import("./NotFoundAnimation"));

const NotFoundPage = () => {
  return (
    <>
      <Seo title="Page Not Found | Aura Interiors" description="The page you are looking for could not be found." noindex />
      <Navbar />
      <div className="py-20 flex flex-col items-center justify-center px-4 bg-neutral-50 font-dm-sans">
        <div className="w-64 h-64 md:w-80 md:h-80 mb-3">
          <Suspense
            fallback={
              <div className="w-full h-full" aria-hidden="true" />
            }
          >
            <NotFoundAnimation />
          </Suspense>
        </div>

        <h1 className="text-2xl md:text-3xl font-playfair font-semibold text-neutral-900 mb-4 text-center">
          Page Not Found
        </h1>

        <p className="text-neutral-500 text-lg mb-5 text-center max-w-md">
          Oops! The page you are looking for seems to have vanished into thin
          air.
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
