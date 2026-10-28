import { Link } from "react-router-dom";
import { MoveRight } from "lucide-react";
import { useRelatedProducts } from "../../../hooks/product/useProductTan";
import ProductCard from "../../../components/shop/ProductCard";

// Phase 7 split (from ProductDetailsPage.jsx) — the related
// products rail. The useRelatedProducts call moved with the rail
// (same product id, same limit of 5, same slice).
export default function RelatedProducts({ productId }) {
  const { data: relatedData } = useRelatedProducts(productId, 5); // PERF-F-003: matches the slice(0, 5) and the xl:grid-cols-5 layout below (was request 4 / slice 5)
  const relatedProducts = relatedData?.data?.products || [];

  return (
    <>
      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[23px] font-bold text-[#1A1714]">
              You May Also Like
            </h2>
            <Link
              to="/shop"
              className="hidden sm:flex items-center gap-1.5 text-[14px] font-bold text-[#1A1714] hover:text-[#F27318] transition-all group"
            >
              View all{" "}
              <MoveRight
                size={16}
                className="transition-transform group-hover:translate-x-1"
              />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
            {relatedProducts.slice(0, 5).map((relatedProduct) => (
              <ProductCard key={relatedProduct._id} product={relatedProduct} />
            ))}
          </div>
        </div>
      )}
    </>
  );
}
