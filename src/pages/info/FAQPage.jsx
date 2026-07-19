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
    Minus
} from "lucide-react";
import Navbar from "../../layouts/customer/Navbar";
import Footer from "../../layouts/customer/Footer";

const faqData = [
    {
        category: "Ordering",
        icon: ShoppingBag,
        questions: [
            {
                id: "o1",
                q: "How do I place an order?",
                a: "To place an order, browse our shop, select your desired items, and add them to your cart. Once you're ready, click on the cart icon and proceed to checkout. Follow the prompts to enter your shipping and payment information."
            },
            {
                id: "o2",
                q: "Can I modify my order after it's placed?",
                a: "We process orders quickly to ensure timely delivery. If you need to change or cancel your order, please contact our support team within 1 hour of placement. After this window, we may not be able to make changes."
            },
            {
                id: "o3",
                q: "Do you offer financing options?",
                a: "Yes, we partner with several financing providers to offer flexible payment plans. You can view available options during the checkout process."
            }
        ]
    },
    {
        category: "Shipping & Delivery",
        icon: Truck,
        questions: [
            {
                id: "s1",
                q: "What are your shipping rates?",
                a: "Shipping rates vary based on the item size and your location. Small items typically ship for a flat rate, while white-glove delivery for large furniture is calculated at checkout."
            },
            {
                id: "s2",
                q: "How long will it take to receive my order?",
                a: "Standard shipping takes 5-7 business days for in-stock items. Custom or larger furniture pieces may take 4-8 weeks. You can track your order status in the 'Track Order' section of our website."
            },
            {
                id: "s3",
                q: "Do you ship internationally?",
                a: "Currently, we ship to the continental United States and select European countries. We are working on expanding our international reach soon."
            }
        ]
    },
    {
        category: "Returns & Exchanges",
        icon: RotateCcw,
        questions: [
            {
                id: "r1",
                q: "What is your return policy?",
                a: "We offer a 30-day return policy for most items in their original condition. Custom-made pieces are't eligible for return unless they arrive damaged or defective."
            },
            {
                id: "r2",
                q: "How do I start a return?",
                a: "To initiate a return, log into your account, go to your 'Order History', and select the item you wish to return. You will receive a return label and instructions via email."
            }
        ]
    },
    {
        category: "AR Features",
        icon: Smartphone,
        questions: [
            {
                id: "a1",
                q: "How does the AR 'View in Room' feature work?",
                a: "Simply browse a product on your mobile device and tap the 'View in AR' button. Our application uses your phone's camera to place a digital 3D model of the furniture in your space at actual scale."
            },
            {
                id: "a2",
                q: "Which devices support AR features?",
                a: "Most modern iOS (iPhone 6s and later) and Android devices with ARCore support are compatible. Ensure your browser is up to date for the best experience."
            }
        ]
    }
];

export default function FAQPage() {
    const [activeId, setActiveId] = useState(null);

    const toggleAccordion = (id) => {
        setActiveId(activeId === id ? null : id);
    };

    return (
        <>
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
                            Frequently Asked <span className="text-[#F27318]">Questions</span>
                        </motion.h1>
                        <p className="text-gray-500 text-[14px] sm:text-[16px] max-w-xl mx-auto leading-relaxed mb-8">
                            Find answers to common questions about our products, ordering process, shipping, and augmented reality features.
                        </p>
                    </div>

                    {/* FAQ Sections */}
                    <div className="space-y-10 max-w-2xl mx-auto">
                        {faqData.map((category) => (
                            <div key={category.category} className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-[#F27318]/10 flex items-center justify-center text-[#F27318]">
                                        <category.icon size={18} />
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
                                                <span className={`text-[15px] font-semibold transition-colors duration-300 pr-4 leading-normal ${activeId === item.id ? 'text-[#F27318]' : 'text-gray-800'}`}>
                                                    {item.q}
                                                </span>
                                                <div className={`shrink-0 w-6 h-6 flex items-center justify-center transition-all duration-300 ${activeId === item.id ? 'text-[#F27318] rotate-180' : 'text-gray-400 group-hover:text-[#F27318]'}`}>
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
