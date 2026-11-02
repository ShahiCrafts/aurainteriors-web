import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  Search,
  HelpCircle,
  ShoppingBag,
  Truck,
  RotateCcw,
  Smartphone,
  Plus,
  Minus,
} from "lucide-react";
import Navbar from "../../layouts/customer/Navbar";
import Footer from "../../layouts/customer/Footer";

import { faqData } from "../../data/faqData.js";
import Seo from "../../components/common/Seo.jsx";

const FAQ_ICONS = { ShoppingBag, Truck, RotateCcw, Smartphone };

export default function FAQPage() {
  const [activeId, setActiveId] = useState(null);

  const toggleAccordion = (id) => {
    setActiveId(activeId === id ? null : id);
  };

  return (
    <>
      <Seo
        title="FAQs – Delivery, Returns & Warranty | Aura Interiors Nepal"
        description="Answers about ordering furniture online from Aura Interiors: delivery across Nepal, returns, payment options and the AR View in Room feature."
        path="/faq"
      />
      <Navbar />
      <main className="min-h-screen bg-white font-dm-sans pt-32 pb-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-14">
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[32px] sm:text-[44px] md:text-[52px] font-bold text-[#1A1714] mb-3 tracking-tight leading-[1.1]"
            >
              Frequently Asked <span className="text-brand">Questions</span>
            </motion.h1>
            <p className="text-gray-500 text-[14px] sm:text-[16px] max-w-xl mx-auto leading-relaxed mb-8">
              Find answers to common questions about our products, ordering
              process, shipping, and augmented reality features.
            </p>
          </div>

          {/* FAQ Sections */}
          <div className="space-y-10 max-w-2xl mx-auto">
            {faqData.map((category) => (
              <div key={category.category} className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-brand/10 flex items-center justify-center text-brand">
                    {(() => { const Icon = FAQ_ICONS[category.icon] || HelpCircle; return <Icon size={18} />; })()}
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-[#1A1714]">
                    {category.category}
                  </h2>
                </div>

                <div className="border border-gray-100 divide-y divide-gray-100 rounded-2xl overflow-hidden shadow-xs bg-white">
                  {category.questions.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white overflow-hidden transition-all duration-300"
                    >
                      <button
                        onClick={() => toggleAccordion(item.id)}
                        className="w-full px-5 py-4.5 flex items-start justify-between text-left group hover:bg-[#FFF8F3]/40 transition-colors"
                      >
                        <span
                          className={`text-[15px] font-semibold transition-colors duration-300 pr-4 leading-normal ${activeId === item.id ? "text-brand" : "text-gray-800"}`}
                        >
                          {item.q}
                        </span>
                        <div
                          className={`shrink-0 w-6 h-6 flex items-center justify-center transition-all duration-300 ${activeId === item.id ? "text-brand rotate-180" : "text-gray-400 group-hover:text-brand"}`}
                        >
                          <ChevronDown size={18} />
                        </div>
                      </button>

                      <AnimatePresence>
                        {activeId === item.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25, ease: "easeInOut" }}
                          >
                            <div className="px-5 pb-5 text-gray-500 text-[14px] leading-relaxed pt-1.5">
                              {item.a}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
