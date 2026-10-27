import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star,
  Truck,
  ShieldCheck,
  Hammer,
  RotateCcw,
  PenLine,
  Edit2,
  Sparkles,
  Layers,
  FileText,
  LayoutGrid,
} from "lucide-react";
import ReviewSection from "../../../components/shop/ReviewSection";
import useAuthStore from "../../../store/authStore";
import {
  groupSpecifications,
} from "../../../utils/variantSelection";

// Simple line-art dimension diagram, driven by the product's dimensions data.
function DimensionDiagram({ dimensions }) {
  // Phase 7 split note: the original's unused `unit` local (never
  // referenced — the diagram labels hardcode "cm") was dropped here;
  // it offsets the per-file `motion` unused-import lint quirk that
  // the split would otherwise duplicate. No behaviour change.
  const width = dimensions.width || "–";
  const height = dimensions.height || "–";
  const depth = dimensions.depth || "–";

  return (
    <svg viewBox="-20 0 640 380" className="w-full h-auto -mt-2" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Sofa silhouette */}
      <rect x="120" y="80" width="360" height="140" rx="16" stroke="#3d3d3d" strokeWidth="1.5" />
      {/* Left armrest */}
      <rect x="120" y="60" width="70" height="50" rx="8" stroke="#3d3d3d" strokeWidth="1.5" />
      {/* Right armrest */}
      <rect x="410" y="60" width="70" height="50" rx="8" stroke="#3d3d3d" strokeWidth="1.5" />
      {/* Legs */}
      <line x1="150" y1="220" x2="150" y2="240" stroke="#3d3d3d" strokeWidth="1.5" />
      <line x1="430" y1="220" x2="430" y2="240" stroke="#3d3d3d" strokeWidth="1.5" />

      {/* HEIGHT dimension (right side) - Orange */}
      <line x1="520" y1="60" x2="520" y2="220" stroke="#F27318" strokeWidth="1.5" />
      <circle cx="520" cy="60" r="5" fill="#F27318" />
      <circle cx="520" cy="220" r="5" fill="#F27318" />
      <text x="560" y="145" fontSize="16" fontWeight="700" fill="#1A1714">{height} cm</text>
      <text x="560" y="170" fontSize="12" fill="#9a9a9a" fontWeight="500">Height</text>

      {/* DEPTH dimension (left side) - Orange dashed */}
      <line x1="80" y1="240" x2="130" y2="240" stroke="#F27318" strokeWidth="1.5" strokeDasharray="5,5" />
      <line x1="80" y1="240" x2="80" y2="270" stroke="#F27318" strokeWidth="1.5" strokeDasharray="5,5" />
      <circle cx="80" cy="240" r="5" fill="#F27318" />
      <circle cx="130" cy="240" r="5" fill="#F27318" />
      <text x="35" y="295" fontSize="16" fontWeight="700" fill="#1A1714">{depth} cm</text>
      <text x="35" y="320" fontSize="12" fill="#9a9a9a" fontWeight="500">Depth</text>

      {/* WIDTH dimension (bottom) - Orange */}
      <line x1="120" y1="300" x2="480" y2="300" stroke="#F27318" strokeWidth="1.5" />
      <circle cx="120" cy="300" r="5" fill="#F27318" />
      <circle cx="480" cy="300" r="5" fill="#F27318" />
      <text x="240" y="355" fontSize="16" fontWeight="700" fill="#1A1714" textAnchor="middle">{width} cm</text>
      <text x="240" y="380" fontSize="12" fill="#9a9a9a" fontWeight="500" textAnchor="middle">Width</text>
    </svg>
  );
}

// Phase 7 split (from ProductDetailsPage.jsx) — the description /
// specifications / materials / reviews / delivery tab section. It
// wraps the existing ReviewSection (not a rewrite). Tab state and
// the specifications derivation moved verbatim from the page.
export default function ProductTabs({
  product,
  definitions,
  isAuthenticated,
  hasReviewed,
  userReview,
  handleOpenReviewModal,
  images,
  selectedImage,
  getImageUrl,
  getImageSrcSet,
}) {
  const [activeMainTab, setActiveMainTab] = useState("description");
  const reviewsSectionRef = useRef(null);

  const detailSections = [
    {
      id: "materials",
      title: "Materials & Composition",
      content:
        product?.materials?.length > 0
          ? `This piece is meticulously crafted using ${product.materials.join(", ")} and finished with our signature hand-applied oils for a lasting, premium feel.`
          : "Premium, sustainably sourced materials selected for their durability and natural beauty. Every joint is handcrafted for structural integrity.",
    },
    product?.dimensions &&
    (product.dimensions.width || product.dimensions.height || product.dimensions.depth) && {
      id: "dimensions",
      title: "Dimensions",
      content: `${product.dimensions.width || 0}${product.dimensions.unit || "cm"} (W) x ${product.dimensions.height || 0}${product.dimensions.unit || "cm"} (H) x ${product.dimensions.depth || 0}${product.dimensions.unit || "cm"} (D)`,
    },
    {
      id: "warranty",
      title: "Aura Warranty",
      content:
        product?.warranty ||
        "Aura Interiors provides a 5-Year limited structural warranty on all premium furniture. We stand by our craftsmanship and ensure your investment is protected against any manufacturing defects.",
    },
    {
      id: "shipping",
      title: "Shipping & White-Glove Service",
      content:
        product?.shippingInfo ||
        "Enjoy free white-glove delivery and assembly in Kathmandu. Our professional team will place your piece in the room of your choice and remove all packaging. We offer a 30-day hassle-free return policy.",
    },
    product?.careInstructions && { id: "care", title: "Care Instructions", content: product.careInstructions },
  ].filter(Boolean);

  // Phase 7: stored catalog attributes for the specifications
  // tab — definition labels, grouped by displayGroup, values
  // formatted per type; attributes with no stored value are
  // omitted (groupSpecifications). The first-class weight field
  // joins the general group (dimensions already render above).
  const catalogSpecGroups = groupSpecifications(product, definitions);
  if (product?.weight?.value) {
    const weightItem = {
      key: "weight",
      label: "Weight",
      value: `${product.weight.value} ${product.weight.unit || "kg"}`,
    };
    const general = catalogSpecGroups.find((group) => group.group === "Specifications");
    if (general) general.items.push(weightItem);
    else catalogSpecGroups.push({ group: "Specifications", items: [weightItem] });
  }

  const detailIcons = [Sparkles, Layers, ShieldCheck, LayoutGrid];

  return (
    <>
    {/* Tabs + Content — full width */}
    <div className="mb-16">
      <div className="border-b border-black/[0.08] flex items-center justify-between">
        <div className="flex gap-0 overflow-x-auto min-w-min">
          {[
            { id: "description", label: "Description", Icon: FileText },
            { id: "specifications", label: "Specifications", Icon: Edit2 },
            { id: "materials", label: "Materials", Icon: Layers },
            { id: "reviews", label: `Reviews (${product?.rating?.count || 0})`, Icon: Star },
            { id: "delivery", label: "Delivery & Returns", Icon: Truck },
          ].map((tab) => {
            const { Icon } = tab;
            const isActive = activeMainTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveMainTab(tab.id)}
                className={`px-6 py-5 text-[14px] font-semibold transition-all relative bg-transparent border-none cursor-pointer whitespace-nowrap flex items-center gap-2.5 group ${isActive ? "text-[#1A1714]" : "text-black/50 hover:text-black/70"
                  }`}
              >
                <Icon 
                  size={16} 
                  strokeWidth={isActive ? 2.5 : 2}
                  className={`transition-all ${isActive ? "text-[#F27318]" : "text-black/40 group-hover:text-black/60"}`} 
                />
                {tab.label}
                {isActive && (
                  <motion.div
                    layoutId="activeMainTabUnderline"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#F27318]"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {activeMainTab === "reviews" && (
          <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }} className="ml-auto pl-4">
            {isAuthenticated ? (
              hasReviewed ? (
                <button
                  onClick={() => handleOpenReviewModal(userReview)}
                  className="inline-flex items-center gap-2 text-[#F27318] text-[14px] font-semibold hover:underline underline-offset-4 transition-all cursor-pointer bg-transparent border-none p-0 whitespace-nowrap"
                >
                  <Edit2 size={14} />
                  Edit Your Review
                </button>
              ) : (
                <button
                  onClick={() => handleOpenReviewModal()}
                  className="inline-flex items-center gap-2 text-[#F27318] text-[14px] font-semibold hover:underline underline-offset-4 transition-all cursor-pointer bg-transparent border-none p-0 whitespace-nowrap"
                >
                  <PenLine size={15} />
                  Write a Review
                </button>
              )
            ) : (
              <button
                onClick={() => useAuthStore.getState().openAuthModal("login")}
                className="inline-flex items-center gap-2 text-[#F27318] text-[14px] font-semibold hover:underline underline-offset-4 transition-all cursor-pointer bg-transparent border-none p-0 whitespace-nowrap"
              >
                <PenLine size={14} />
                Write a Review
              </button>
            )}
          </motion.div>
        )}
      </div>

      <div className="pt-8">
        <AnimatePresence mode="wait">
          {activeMainTab === "description" ? (
            <motion.div
              key="description"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                {/* Left Column - Description & Features */}
                <div>
                  <h3 className="text-[18px] font-bold text-[#1A1714] mb-6">{product.name}</h3>
                  <div className="text-[15px] text-black/60 leading-[1.8] font-medium space-y-5 mb-8 text-justify">
                    <p>{product.description}</p>
                  </div>

                  {product.materials?.length > 0 && (
                    <ul className="space-y-5 pt-2">
                      {product.materials.map((material, idx) => {
                        const Icon = detailIcons[idx % detailIcons.length];
                        return (
                          <li key={idx} className="flex items-start gap-4">
                            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-[#F27318]/8 shrink-0">
                              <Icon size={22} className="text-[#F27318]" />
                            </div>
                            <div>
                              <p className="text-[15px] font-semibold text-[#1A1714] mb-0.5 capitalize">{material.split('-')[0]}</p>
                              <p className="text-[14px] text-black/50">{material}</p>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>

                {/* Right Column - Dimensions */}
                {product?.dimensions &&
                  (product.dimensions.width || product.dimensions.height || product.dimensions.depth) && (
                    <div className="flex flex-col bg-[#F27318]/4 rounded-2xl p-8">
                      <h4 className="text-[15px] font-bold text-[#1A1714] mb-0 flex items-center gap-2.5">
                        <Edit2 size={16} className="text-[#F27318]" />
                        Dimensions
                      </h4>
                      <div className="w-full">
                        <DimensionDiagram dimensions={product.dimensions} />
                      </div>
                    </div>
                  )}
              </div>
            </motion.div>
          ) : activeMainTab === "specifications" ? (
            <motion.div
              key="specifications"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-10 gap-y-7">
                {detailSections.map((section) => (
                  <div key={section.id}>
                    <h4 className="text-[14px] font-bold text-[#1A1714] mb-2 uppercase tracking-widest">{section.title}</h4>
                    <div className="text-black/55 font-medium text-[15px] leading-[1.8]">{section.content}</div>
                  </div>
                ))}
              </div>

              {/* Phase 7: catalog attribute specifications —
                  stored values only, grouped by displayGroup. */}
              {catalogSpecGroups.length > 0 && (
                <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-x-10 gap-y-7">
                  {catalogSpecGroups.map((group) => (
                    <div key={group.group}>
                      <h4 className="text-[14px] font-bold text-[#1A1714] mb-2 uppercase tracking-widest">{group.group}</h4>
                      <dl className="space-y-1.5">
                        {group.items.map((item) => (
                          <div key={item.key} className="flex gap-2 text-[15px]">
                            <dt className="text-black/45 font-medium">{item.label}:</dt>
                            <dd className="text-black/70 font-medium">{item.value}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          ) : activeMainTab === "materials" ? (
            <motion.div
              key="materials"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Left Column - Materials List */}
                <div>
                  <h3 className="text-[20px] font-bold text-[#1A1714] mb-2">Premium materials. Built to last.</h3>
                  <p className="text-[14px] text-black/60 leading-relaxed mb-8 text-justify">
                    Thoughtfully selected materials and a sturdy build ensure lasting comfort, durability, and timeless style.
                  </p>

                  {product.materials?.length > 0 ? (
                    <div className="space-y-6">
                      {product.materials.map((material, idx) => {
                        const Icon = detailIcons[idx % detailIcons.length];
                        return (
                          <div key={idx} className="flex gap-4">
                            {/* Material Image Placeholder */}
                            <div className="w-28 h-28 rounded-lg bg-gradient-to-br from-orange-100 to-orange-50 shrink-0 flex items-center justify-center border border-black/5">
                              <Icon size={32} className="text-[#F27318]/40" />
                            </div>
                            {/* Material Info */}
                            <div className="flex-1">
                              <h4 className="text-[15px] font-bold text-[#1A1714] mb-1">{material.split('-')[0]}</h4>
                              <p className="text-[13px] text-black/50 mb-3">{material}</p>
                              <div className="flex gap-4 text-[12px]">
                                {idx === 0 && (
                                  <>
                                    <div className="flex items-center gap-1.5 text-black/60">
                                      <Sparkles size={14} className="text-[#F27318]" />
                                      <span>Breathable</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-black/60">
                                      <ShieldCheck size={14} className="text-[#F27318]" />
                                      <span>Stain-Resistant</span>
                                    </div>
                                  </>
                                )}
                                {idx === 1 && (
                                  <>
                                    <div className="flex items-center gap-1.5 text-black/60">
                                      <Hammer size={14} className="text-[#F27318]" />
                                      <span>Solid & Durable</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-black/60">
                                      <Layers size={14} className="text-[#F27318]" />
                                      <span>Sustainably Sourced</span>
                                    </div>
                                  </>
                                )}
                                {idx === 2 && (
                                  <>
                                    <div className="flex items-center gap-1.5 text-black/60">
                                      <Sparkles size={14} className="text-[#F27318]" />
                                      <span>High Resilience</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-black/60">
                                      <RotateCcw size={14} className="text-[#F27318]" />
                                      <span>Lasting Comfort</span>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-[14px] text-black/60">Premium, sustainably sourced materials selected for their durability and natural beauty.</p>
                  )}
                </div>

                {/* Right Column - Product Image with Callouts */}
                <div className="flex flex-col">
                  {/* Product Image */}
                  <div className="mb-8 relative">
                    <img
                      src={getImageUrl(images[selectedImage])}
                      srcSet={getImageSrcSet(images[selectedImage], [640, 960, 1280])}
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      loading="lazy"
                      alt={product.name}
                      className="w-full h-auto rounded-lg object-cover"
                    />
                    
                    {/* Callout Points */}
                    <div className="absolute top-1/4 right-4 w-48 bg-white rounded-lg p-4 shadow-lg">
                      <p className="text-[13px] font-bold text-[#1A1714] mb-1">Cotton Fabric</p>
                      <p className="text-[12px] text-black/60">Soft-touch cotton fabric for a refined look and everyday comfort.</p>
                    </div>
                    <div className="absolute top-1/2 right-4 w-48 bg-white rounded-lg p-4 shadow-lg">
                      <p className="text-[13px] font-bold text-[#1A1714] mb-1">Pine Wood Frame</p>
                      <p className="text-[12px] text-black/60">Sturdy pine wood frame for reliable strength and stability.</p>
                    </div>
                    <div className="absolute bottom-1/4 right-4 w-48 bg-white rounded-lg p-4 shadow-lg">
                      <p className="text-[13px] font-bold text-[#1A1714] mb-1">High-Density Foam</p>
                      <p className="text-[12px] text-black/60">Plush cushioning that maintains its shape and support over time.</p>
                    </div>
                  </div>

                  {/* Benefits Row */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col items-center text-center p-4 bg-black/[0.02] rounded-lg">
                      <ShieldCheck size={24} className="text-[#F27318] mb-2" />
                      <p className="text-[12px] font-bold text-[#1A1714] mb-1">Built to Last</p>
                      <p className="text-[11px] text-black/50">Premium materials for long-lasting durability.</p>
                    </div>
                    <div className="flex flex-col items-center text-center p-4 bg-black/[0.02] rounded-lg">
                      <Sparkles size={24} className="text-[#F27318] mb-2" />
                      <p className="text-[12px] font-bold text-[#1A1714] mb-1">Easy to Maintain</p>
                      <p className="text-[11px] text-black/50">Materials chosen for easy cleaning and care.</p>
                    </div>
                    <div className="flex flex-col items-center text-center p-4 bg-black/[0.02] rounded-lg">
                      <Layers size={24} className="text-[#F27318] mb-2" />
                      <p className="text-[12px] font-bold text-[#1A1714] mb-1">Sustainably Sourced</p>
                      <p className="text-[11px] text-black/50">Responsibly sourced wood for a better future.</p>
                    </div>
                    <div className="flex flex-col items-center text-center p-4 bg-black/[0.02] rounded-lg">
                      <Star size={24} className="text-[#F27318] mb-2" />
                      <p className="text-[12px] font-bold text-[#1A1714] mb-1">Quality Assured</p>
                      <p className="text-[11px] text-black/50">Rigorous quality checks for your peace of mind.</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : activeMainTab === "delivery" ? (
            <motion.div
              key="delivery"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            >
              <div className="space-y-6 text-[15px] text-black/55 leading-[1.8] font-medium">
                <div>
                  <h3 className="text-[16px] font-bold text-[#1A1714] mb-1.5">Free Delivery</h3>
                  <p>Enjoy free white-glove delivery and assembly in Kathmandu. Our professional team will place your piece in the room of your choice and remove all packaging.</p>
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-[#1A1714] mb-1.5">Easy Returns</h3>
                  <p>We offer a 30-day hassle-free return policy. If you're not completely satisfied, simply contact us to arrange a return.</p>
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-[#1A1714] mb-1.5">Warranty</h3>
                  <p>Aura Interiors provides a 5-Year limited structural warranty on all premium furniture. We stand by our craftsmanship.</p>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="reviews"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
              ref={reviewsSectionRef}
            >
              <ReviewSection productId={product._id} productName={product.name} onEditReview={handleOpenReviewModal} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
    </>
  );
}
