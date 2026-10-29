import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Navbar from "../../layouts/customer/Navbar";
import Footer from "../../layouts/customer/Footer";

const NotFoundPage = () => {
  return (
    <>
      <Navbar />
      <div className="py-20 flex flex-col items-center justify-center px-4 bg-neutral-50 font-dm-sans">
        <div className="w-full max-w-xs mb-3 flex justify-center" aria-hidden="true">
          <svg viewBox="0 0 200 120" className="w-56 h-auto">
            <style>{`
              @keyframes aura-404-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
              @keyframes aura-404-fade { 0%,100% { opacity: .35; } 50% { opacity: 1; } }
              .aura-404-float { animation: aura-404-float 3s ease-in-out infinite; }
              .aura-404-dot { animation: aura-404-fade 1.6s ease-in-out infinite; }
            `}</style>
            <g className="aura-404-float">
              <text x="100" y="72" textAnchor="middle" fontSize="56" fontWeight="700" fill="#0f766e" fontFamily="Georgia, serif">404</text>
            </g>
            <circle className="aura-404-dot" cx="52" cy="94" r="4" fill="#f27318" />
            <circle className="aura-404-dot" cx="100" cy="100" r="4" fill="#0f766e" style={{ animationDelay: "0.3s" }} />
            <circle className="aura-404-dot" cx="148" cy="94" r="4" fill="#f27318" style={{ animationDelay: "0.6s" }} />
          </svg>
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
