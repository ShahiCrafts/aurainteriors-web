import React from "react";
import { 
  Instagram, Facebook, Twitter, Youtube, Linkedin,
  Phone, Mail, MapPin, ArrowRight
} from "lucide-react";
import { Link } from "react-router-dom";

import BrandMarquee from "../../components/sections/BrandMarquee";

const footerLinks = [
  {
    title: "Our Company",
    links: [
      { name: "About Us", href: "/about" },
      { name: "Our Story", href: "/story" },
      { name: "Careers", href: "/careers" },
      { name: "Press & Media", href: "/press" },
      { name: "Contact Us", href: "/contact" }
    ]
  },
  {
    title: "Popular Categories",
    links: [
      { name: "Sofas & Couches", href: "/category/sofas" },
      { name: "King Size Beds", href: "/category/beds" },
      { name: "Dining Table Sets", href: "/category/dining" },
      { name: "Wardrobes", href: "/category/wardrobes" },
      { name: "TV Units", href: "/category/tv-units" }
    ]
  },
  {
    title: "Customer Service",
    links: [
      { name: "Track Order", href: "/track" },
      { name: "Returns & Refunds", href: "/returns" },
      { name: "Shipping Policy", href: "/shipping" },
      { name: "Warranty Policy", href: "/warranty" },
      { name: "FAQs", href: "/faq" }
    ]
  },
  {
    title: "Our Services",
    links: [
      { name: "Interior Design", href: "/interior-design" },
      { name: "Bulk Orders", href: "/bulk-orders" },
      { name: "Custom Furniture", href: "/custom" },
      { name: "Aura Interiors Business", href: "/business" },
      { name: "Experience Stores", href: "/stores" }
    ]
  }
];

export default function Footer() {
  return (
    <>
      <BrandMarquee />
      <footer className="bg-[#f6f6f6] font-dm-sans border-t border-black/[0.03]">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-8">
        
        {/* MIDDLE SECTION: MAIN LINKS GRID */}
        <div className="py-12 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-10 border-b border-black/[0.05]">
          
          {/* COLUMN 1: BRAND & CONTACT */}
          <div className="flex flex-col gap-6 col-span-2 lg:col-span-1">
            <div className="flex flex-col gap-4">
              <Link to="/" className="no-underline">
              <img 
                src="/logo.png" 
                alt="AuraInteriors Logo"
                className="h-12 w-auto object-contain"
              />
            </Link>
              <div className="flex flex-col gap-2.5">
                 <div className="flex items-start gap-3">
                   <Phone size={14} className="text-[#F27318] mt-0.5" />
                   <p className="text-[14px] font-bold text-[#1A1714]">+977 1 44XXXXX</p>
                 </div>
                 <div className="flex items-start gap-3">
                   <Mail size={14} className="text-[#F27318] mt-0.5" />
                   <p className="text-[14px] text-black/50">care@aurainteriors.live</p>
                 </div>
                 <div className="flex items-start gap-3">
                   <MapPin size={14} className="text-[#F27318] mt-0.5" />
                   <p className="text-[14px] text-black/50 leading-relaxed">
                     Durbarmarg, Kathmandu, Nepal
                   </p>
                 </div>
              </div>
            </div>

            {/* SOCIAL LINKS */}
            <div className="flex items-center gap-3">
              <a href="#" className="w-8 h-8 rounded-full bg-white border border-black/5 flex items-center justify-center text-black/30 hover:text-[#F27318] hover:border-[#F27318] transition-all">
                <Instagram size={14} />
              </a>
              <a href="#" className="w-8 h-8 rounded-full bg-white border border-black/5 flex items-center justify-center text-black/30 hover:text-[#F27318] hover:border-[#F27318] transition-all">
                <Facebook size={14} />
              </a>
              <a href="#" className="w-8 h-8 rounded-full bg-white border border-black/5 flex items-center justify-center text-black/30 hover:text-[#F27318] hover:border-[#F27318] transition-all">
                <Twitter size={14} />
              </a>
              <a href="#" className="w-8 h-8 rounded-full bg-white border border-black/5 flex items-center justify-center text-black/30 hover:text-[#F27318] hover:border-[#F27318] transition-all">
                <Linkedin size={14} />
              </a>
            </div>
          </div>

          {/* OTHER LINK COLUMNS */}
          {footerLinks.map((column, idx) => (
            <div key={idx} className="flex flex-col gap-3">
              <h5 className="text-[18px] font-medium text-black">{column.title}</h5>
              <ul className="flex flex-col gap-2">
                {column.links.map((link, lIdx) => (
                  <li key={lIdx}>
                    <Link to={link.href} className="text-[14px] text-black/50 hover:text-[#F27318] transition-colors">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

        </div>

        {/* BOTTOM SECTION: NEWSLETTER & PAYMENTS */}
        <div className="py-10 flex flex-col lg:flex-row items-center justify-between gap-10">
           
           {/* NEWSLETTER (LEFT) */}
           <div className="flex flex-col sm:flex-row items-center gap-6 w-full lg:w-auto">
              <div className="flex flex-col gap-1 text-center sm:text-left min-w-[200px]">
                <h4 className="text-[18px] font-semibold text-[#1A1714]">Join the Aura Interiors Circle</h4>
                <p className="text-[14px] text-black/40">Subscribe for the latest collections and trends.</p>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <input 
                  type="email" 
                  placeholder="Your email address" 
                  className="w-full sm:w-[260px] bg-white border border-black/10 rounded-lg px-4 py-2.5 text-[14px] outline-none focus:border-[#F27318] transition-all"
                />
                <button className="w-[42px] h-[42px] flex items-center justify-center bg-[#F27318] hover:bg-[#D9620E] text-white rounded-lg transition-all shadow-sm shrink-0">
                  <ArrowRight size={18} strokeWidth={2.5} />
                </button>
              </div>
           </div>

           {/* WE ACCEPT SECTION (RIGHT) */}
           <div className="flex flex-col items-center lg:items-end gap-4">
              <h5 className="text-[11px] font-bold text-black/40 uppercase tracking-[0.2em]">We Accept</h5>
              <div className="flex items-center gap-6">
                 <img 
                    src="https://img.favpng.com/7/14/6/esewa-fonepay-pvt-ltd-logo-portable-network-graphics-image-brand-png-favpng-aLLyxWtspEZQckmv19jDj2TWC.jpg" 
                    alt="eSewa" 
                    className="h-10 w-auto object-contain transition-transform hover:scale-110"
                 />
                 <img 
                    src="https://khaltibyime.khalti.com/wp-content/uploads/2025/07/cropped-Logo-for-Blog-1024x522.png" 
                    alt="Khalti" 
                    className="h-10 w-auto object-contain transition-transform hover:scale-110"
                 />
                 <img 
                    src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/330px-Mastercard-logo.svg.png" 
                    alt="Mastercard" 
                    className="h-9 w-auto object-contain transition-transform hover:scale-110"
                 />
              </div>
           </div>
        </div>

        {/* FINAL STRIP: COPYRIGHT */}
        <div className="py-6 border-t border-black/[0.05] text-center">
           <p className="text-[13px] text-black/40 tracking-wide">
             &copy; 2024 Aura Interiors Private Limited. All rights reserved.
           </p>
        </div>

      </div>
    </footer>
    </>
  );
}