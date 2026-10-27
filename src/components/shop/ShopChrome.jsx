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
                        src="/ad-banner.png"
                        alt="Promotion"
                        className="w-full object-cover block shadow-sm h-[30px] md:h-[40px] lg:h-auto"
                        style={{ objectPosition: "center center" }}
                    />
                </div>

                {children}
            </main>

            <Footer />
        </>
    );
}