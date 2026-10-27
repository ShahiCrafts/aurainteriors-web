// Phase 7 (catalog): ShopPage is now the chrome (navbar,
// category bar, promo banner, footer) around the shared
// CatalogListing engine — the listing itself (filters, facets,
// chips, pagination, category intro) lives in
// components/shop/CatalogListing.jsx and is shared with the
// Room and Collection context pages. /shop?categories=<slug>
// remains the canonical category URL.
import Navbar from "../../layouts/customer/Navbar";
import Footer from "../../layouts/customer/Footer";
import CategoryBar from "../../components/navigation/CategoryBar";
import CatalogListing from "../../components/shop/CatalogListing";

export default function ShopPage() {
  return (
    <>
      <Navbar />
      <CategoryBar />

      <main className="min-h-screen bg-white pb-12 md:pb-20 font-dm-sans">
        {/* AD BANNER */}
        <div className="w-full mb-6 md:mb-8">
          <img
            src="/ad-banner.png"
            alt="Promotion"
            className="w-full object-cover block shadow-sm h-[30px] md:h-[40px] lg:h-auto"
            style={{ objectPosition: "center center" }}
          />
        </div>

        <CatalogListing
          crumbPrefix={[{ name: "Shop", path: "/shop" }]}
        />
      </main>

      <Footer />
    </>
  );
}
