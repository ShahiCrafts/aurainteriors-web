// Phase 7 (catalog) — collection landing page. Manual and
// rule-based collections both resolve server-side (the products
// endpoint's collection dimension); the page is the shared
// CatalogListing with the collection pinned, plus a hero from
// the collection registry record.
import { Link, useParams } from "react-router-dom";
import Navbar from "../../layouts/customer/Navbar";
import Footer from "../../layouts/customer/Footer";
import CategoryBar from "../../components/navigation/CategoryBar";
import CatalogListing from "../../components/shop/CatalogListing";
import { useCollections } from "../../hooks/catalog/useCatalogTan";
import { getImageUrl } from "../../utils/imageUrl";

export default function CollectionPage() {
  const { slug } = useParams();
  const { data: collectionsData, isLoading } = useCollections();
  const collections =
    collectionsData?.data?.collections || collectionsData?.data || [];
  const collection =
    collections.find((entry) => entry.slug === slug) || null;

  const hero = collection ? (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-5 md:px-6 lg:px-4 mb-8">
      {collection.image && (
        <img
          src={getImageUrl(collection.image, "categories")}
          alt={collection.label}
          className="mb-5 h-44 w-full rounded-2xl object-cover sm:h-56"
        />
      )}
      {collection.description && (
        <p className="max-w-2xl text-[15px] leading-relaxed text-black/50">
          {collection.description}
        </p>
      )}
    </div>
  ) : null;

  return (
    <>
      <Navbar />
      <CategoryBar />
      <main className="min-h-screen bg-white pb-12 md:pb-20 font-dm-sans pt-6">
        {!isLoading && !collection ? (
          <div className="max-w-[1440px] mx-auto px-4 sm:px-5 md:px-6 lg:px-4">
            <div className="text-center py-16 sm:py-24 bg-[#F9F8F6] rounded-2xl px-4">
              <h1 className="text-[18px] font-bold text-[#1A1714]">
                Collection not found
              </h1>
              <p className="text-black/40 text-[14px] mt-1">
                This collection is not available right now.
              </p>
              <Link
                to="/shop"
                className="mt-6 inline-block px-6 py-2 bg-[#1A1714] text-white rounded-lg text-[12px] font-bold"
              >
                Browse all products
              </Link>
            </div>
          </div>
        ) : (
          <CatalogListing
            pinned={{ collection: slug }}
            crumbPrefix={[{ name: "Collections", path: "/shop" }]}
            title={collection?.label}
            header={hero}
            showCategoryIntro={false}
          />
        )}
      </main>
      <Footer />
    </>
  );
}
