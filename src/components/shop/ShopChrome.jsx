import Navbar from "../../layouts/customer/Navbar";
import Footer from "../../layouts/customer/Footer";
import CategoryBar from "../navigation/CategoryBar";

export default function ShopChrome({ children }) {
  return (
    <>
      <Navbar />
      <CategoryBar />

      <main className="min-h-screen bg-white pb-12 md:pb-20 font-dm-sans">
        {/* AD BANNER */}
        <div className="w-full mb-6 md:mb-8">
          <img
            src="/promo-ad-banner.webp"
            alt="Promotion"
            width={1915}
            height={68}
            loading="lazy"
            decoding="async"
            className="w-full object-cover block shadow-sm h-7.5 md:h-10 lg:h-auto"
            style={{ objectPosition: "center center" }}
          />
        </div>

        {children}
      </main>

      <Footer />
    </>
  );
}
