import React, { useState, useEffect } from "react";
import { Star, Quote, ChevronLeft, ChevronRight, Calendar } from "lucide-react";

const testimonials = [
  {
    id: 1,
    name: "Sarah Jenkins",
    location: "London, UK",
    date: "12 Mar 2024",
    text: "The Albus sofa completely transformed my living room. The quality of the fabric and the minimalist design is exactly what I was looking for. DecorX truly understands modern living.",
    rating: 5,
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah"
  },
  {
    id: 2,
    name: "Michael Chen",
    location: "Singapore",
    date: "28 Feb 2024",
    text: "I was hesitant about ordering furniture online, but the experience was seamless. The attention to detail in the packaging and the craftsmanship of the oak bed is world-class.",
    rating: 5,
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Michael"
  },
  {
    id: 3,
    name: "Elena Rodriguez",
    location: "Madrid, Spain",
    date: "15 Feb 2024",
    text: "DecorX is my go-to for interior inspiration. Their pieces are not just furniture; they are works of art. The customer service was exceptionally helpful and professional.",
    rating: 5,
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Elena"
  },
  {
    id: 4,
    name: "David Wilson",
    location: "New York, USA",
    date: "02 Feb 2024",
    text: "Minimalism done right. The textures are incredibly rich, and the assembly was surprisingly straightforward. Definitely worth every penny.",
    rating: 5,
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=David"
  },
  {
    id: 5,
    name: "Sophie Müller",
    location: "Berlin, Germany",
    date: "20 Jan 2024",
    text: "Excellent curation! It's rare to find a brand that balances ethics with such high-end aesthetics. My apartment feels like a design journal now.",
    rating: 5,
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sophie"
  }
];

export default function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visibleCount, setVisibleCount] = useState(3);

  useEffect(() => {
    const updateVisible = () => {
      if (window.innerWidth >= 1024) setVisibleCount(3);
      else if (window.innerWidth >= 768) setVisibleCount(2);
      else setVisibleCount(1);
    };
    updateVisible();
    window.addEventListener("resize", updateVisible);
    return () => window.removeEventListener("resize", updateVisible);
  }, []);

  const maxIndex = testimonials.length - visibleCount;

  // Clamp currentIndex when visibleCount changes
  useEffect(() => {
    if (currentIndex > maxIndex) setCurrentIndex(Math.max(0, maxIndex));
  }, [visibleCount, maxIndex, currentIndex]);

  const nextSlide = () => {
    setCurrentIndex((prev) => Math.min(prev + 1, maxIndex));
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  };

  const slidePercent = 100 / visibleCount;

  return (
    <section className="py-8 md:py-12 bg-white font-dm-sans overflow-hidden">
      <div className="max-w-[1440px] mx-auto px-2 md:px-6 lg:px-9 relative">
        
        {/* HEADER */}
        <div className="flex flex-col items-center text-center mb-6">
          <h2 className="text-[24px] md:text-[32px] lg:text-[36px] font-bold text-[#1A1714] tracking-tight mb-3">
            Voices of Decor<em className="text-[#F27318] not-italic">X</em>
          </h2>
          <p className="text-[13px] md:text-[14px] text-black/40 max-w-[500px]">
            Hear from our global community about their journey in creating a curated, soul-filled home.
          </p>
        </div>

        {/* CAROUSEL CONTAINER */}
        <div className="relative">
          {/* NAVIGATION BUTTONS */}
          <div className="absolute top-1/2 -left-4 -right-4 -translate-y-1/2 flex justify-between pointer-events-none z-10 hidden lg:flex">
             <button 
                onClick={prevSlide}
                className={`w-12 h-12 rounded-full bg-white shadow-lg border border-black/5 flex items-center justify-center text-black/40 hover:text-[#F27318] hover:scale-110 transition-all pointer-events-auto ${currentIndex === 0 ? 'opacity-30 pointer-events-none' : ''}`}
             >
                <ChevronLeft size={20} />
             </button>
             <button 
                onClick={nextSlide}
                className={`w-12 h-12 rounded-full bg-white shadow-lg border border-black/5 flex items-center justify-center text-black/40 hover:text-[#F27318] hover:scale-110 transition-all pointer-events-auto ${currentIndex >= maxIndex ? 'opacity-30 pointer-events-none' : ''}`}
             >
                <ChevronRight size={20} />
             </button>
          </div>

          {/* SLIDER WINDOW */}
          <div className="overflow-hidden -mx-2 px-2 md:-mx-6 md:px-6 lg:-mx-6 lg:px-6 py-10 -my-10">
             <div 
                className="flex transition-transform duration-700 ease-out gap-2 md:gap-4 lg:gap-8 py-6"
                style={{ transform: `translateX(-${currentIndex * slidePercent}%)` }}
             >
               {testimonials.map((item) => (
                 <div key={item.id} className="min-w-[calc(100%-0px)] md:min-w-[calc(50%-8px)] lg:min-w-[calc(33.333%-22px)] bg-white p-4 md:p-6 rounded-lg border border-black/[0.04] shadow-[0_15px_45px_rgba(0,0,0,0.07)] hover:shadow-[0_20px_60px_rgba(0,0,0,0.1)] transition-all duration-500 relative flex flex-col group">
                   
                   {/* QUOTE ICON ACCENT */}
                   <div className="absolute top-4 right-6 opacity-[0.05] group-hover:opacity-[0.1] transition-opacity duration-500">
                     <Quote size={32} className="text-black" />
                   </div>

                   {/* RATING */}
                   <div className="flex items-center gap-1 mb-4">
                     {[...Array(item.rating)].map((_, i) => (
                       <Star key={i} size={12} className="fill-[#F27318] text-[#F27318]" />
                     ))}
                   </div>

                   {/* TEXT */}
                   <p className="text-[14px] md:text-[15px] text-[#1A1714] leading-[1.7] font-light italic mb-6 flex-1">
                     "{item.text}"
                   </p>

                   {/* CLIENT INFO & DATE */}
                   <div className="flex items-center justify-between pt-4 border-t border-black/[0.03]">
                     <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full overflow-hidden bg-[#f6f6f6] border border-black/5">
                          <img src={item.avatar} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[13px] md:text-[14px] font-bold text-[#1A1714] leading-tight">{item.name}</span>
                          <span className="text-[11px] md:text-[12px] text-black/30">{item.location}</span>
                        </div>
                     </div>
                     <div className="hidden md:flex items-center gap-1.5 opacity-30 self-end mb-0.5">
                        <Calendar size={12} />
                        <span className="text-[11px] font-bold uppercase tracking-wider">{item.date}</span>
                     </div>
                   </div>
                 </div>
               ))}
             </div>
          </div>
        </div>

        {/* PAGINATION DOTS */}
        <div className="flex justify-center gap-2 mt-2 lg:hidden">
           {Array.from({ length: maxIndex + 1 }).map((_, i) => (
              <button 
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`w-2 h-2 rounded-full transition-all ${currentIndex === i ? "bg-[#F27318] w-6" : "bg-black/10"}`}
              />
           ))}
        </div>

      </div>
    </section>
  );
}
