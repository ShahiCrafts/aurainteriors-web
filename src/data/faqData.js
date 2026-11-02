// FAQ content — single source for the FAQ page AND the build-time
// prerenderer (scripts/prerender.mjs), so search engines see the exact
// same answers users do. `icon` is the lucide icon name; FAQPage maps
// names to components.
//
// NOTE (flagged to the owner 2026-11-02): the international-shipping
// answer previously claimed US/EU shipping, which is template copy that
// does not match this Nepal store; it now states Nepal delivery.
// Delivery timeframes and the financing claim still need the owner's
// confirmation that they are accurate.
export const faqData = [
  {
    category: "Ordering",
    icon: "ShoppingBag",
    questions: [
      {
        id: "o1",
        q: "How do I place an order?",
        a: "To place an order, browse our shop, select your desired items, and add them to your cart. Once you're ready, click on the cart icon and proceed to checkout. Follow the prompts to enter your shipping and payment information.",
      },
      {
        id: "o2",
        q: "Can I modify my order after it's placed?",
        a: "We process orders quickly to ensure timely delivery. If you need to change or cancel your order, please contact our support team within 1 hour of placement. After this window, we may not be able to make changes.",
      },
      {
        id: "o3",
        q: "Do you offer financing options?",
        a: "Yes, we partner with several financing providers to offer flexible payment plans. You can view available options during the checkout process.",
      },
    ],
  },
  {
    category: "Shipping & Delivery",
    icon: "Truck",
    questions: [
      {
        id: "s1",
        q: "What are your shipping rates?",
        a: "Shipping rates vary based on the item size and your location. Small items typically ship for a flat rate, while white-glove delivery for large furniture is calculated at checkout.",
      },
      {
        id: "s2",
        q: "How long will it take to receive my order?",
        a: "Standard shipping takes 5-7 business days for in-stock items. Custom or larger furniture pieces may take 4-8 weeks. You can track your order status in the 'Track Order' section of our website.",
      },
      {
        id: "s3",
        q: "Do you deliver outside Nepal?",
        a: "We currently deliver within Nepal, including the Kathmandu Valley and major cities across the country. We are not yet able to deliver internationally.",
      },
    ],
  },
  {
    category: "Returns & Exchanges",
    icon: "RotateCcw",
    questions: [
      {
        id: "r1",
        q: "What is your return policy?",
        a: "We offer a 30-day return policy for most items in their original condition. Custom-made pieces aren't eligible for return unless they arrive damaged or defective.",
      },
      {
        id: "r2",
        q: "How do I start a return?",
        a: "To initiate a return, log into your account, go to your 'Order History', and select the item you wish to return. You will receive a return label and instructions via email.",
      },
    ],
  },
  {
    category: "AR Features",
    icon: "Smartphone",
    questions: [
      {
        id: "a1",
        q: "How does the AR 'View in Room' feature work?",
        a: "Simply browse a product on your mobile device and tap the 'View in AR' button. Our application uses your phone's camera to place a digital 3D model of the furniture in your space at actual scale.",
      },
      {
        id: "a2",
        q: "Which devices support AR features?",
        a: "Most modern iOS (iPhone 6s and later) and Android devices with ARCore support are compatible. Ensure your browser is up to date for the best experience.",
      },
    ],
  },
];
