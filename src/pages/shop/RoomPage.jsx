// Phase 7 (catalog) — room landing page. Rooms are an
// independent axis (a product appears in every room it suits);
// the page is the shared CatalogListing with the room dimension
// pinned, plus a hero from the room registry record. Filters stay
// fully functional inside the room scope; the room facet itself
// is hidden (the scope IS the room).
import { Link, useParams } from "react-router-dom";
import Navbar from "../../layouts/customer/Navbar";
import Footer from "../../layouts/customer/Footer";
import CategoryBar from "../../components/navigation/CategoryBar";
import CatalogListing from "../../components/shop/CatalogListing";
import { useRooms } from "../../hooks/catalog/useCatalogTan";
import { getImageUrl } from "../../utils/imageUrl";

export default function RoomPage() {
  const { slug } = useParams();
  const { data: roomsData, isLoading } = useRooms();
  const rooms = roomsData?.data?.rooms || roomsData?.data || [];
  const room = rooms.find((entry) => entry.slug === slug) || null;

  const hero = room ? (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-5 md:px-6 lg:px-4 mb-8">
      {room.image && (
        <img
          src={getImageUrl(room.image, "categories")}
          alt={room.label}
          className="mb-5 h-44 w-full rounded-2xl object-cover sm:h-56"
        />
      )}
      {room.description && (
        <p className="max-w-2xl text-[15px] leading-relaxed text-black/50">
          {room.description}
        </p>
      )}
    </div>
  ) : null;

  return (
    <>
      <Navbar />
      <CategoryBar />
      <main className="min-h-screen bg-white pb-12 md:pb-20 font-dm-sans pt-6">
        {!isLoading && !room ? (
          <div className="max-w-[1440px] mx-auto px-4 sm:px-5 md:px-6 lg:px-4">
            <div className="text-center py-16 sm:py-24 bg-[#F9F8F6] rounded-2xl px-4">
              <h1 className="text-[18px] font-bold text-[#1A1714]">Room not found</h1>
              <p className="text-black/40 text-[14px] mt-1">
                This room is not part of the current collection.
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
            pinned={{ room: slug }}
            crumbPrefix={[{ name: "Rooms", path: "/shop" }]}
            title={room?.label}
            header={hero}
            showCategoryIntro={false}
          />
        )}
      </main>
      <Footer />
    </>
  );
}
