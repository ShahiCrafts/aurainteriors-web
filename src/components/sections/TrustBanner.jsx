import { useEffect, useMemo, useState } from "react";
import { Truck, ShieldCheck, Home } from "lucide-react";

function endOfToday() {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return end;
}

function timeRemaining(target) {
  const ms = Math.max(0, target.getTime() - Date.now());
  const totalSeconds = Math.floor(ms / 1000);
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

export default function TrustBanner({ saleEndsAt } = {}) {
  const target = useMemo(
    () => (saleEndsAt ? new Date(saleEndsAt) : endOfToday()),
    [saleEndsAt],
  );
  const [timeLeft, setTimeLeft] = useState(() => timeRemaining(target));

  useEffect(() => {
    setTimeLeft(timeRemaining(target));
    const timer = setInterval(() => setTimeLeft(timeRemaining(target)), 1000);
    return () => clearInterval(timer);
  }, [target]);

  return (
    <section className="font-dm-sans px-2 md:px-6 lg:px-8 py-2 md:py-4 bg-[#f6f6f6]">
      <div className="max-w-360 mx-auto flex flex-col lg:flex-row gap-2 md:gap-4 items-stretch">
        {/* CARD 1 (LEFT): SALE COUNTDOWN */}
        <div className="bg-white rounded-lg shadow-[0_4px_25px_rgba(0,0,0,0.06)] flex items-center gap-6 p-4 lg:px-8 shrink-0">
          <div className="flex flex-col">
            <span className="text-brand text-[22px] font-bold tracking-tight leading-none">
              SALE
            </span>
            <span className="text-black/40 text-[12px] font-medium mt-1 whitespace-nowrap">
              Ends In
            </span>
          </div>

          <div className="flex gap-5">
            {[
              { label: "Days", value: timeLeft.days },
              { label: "Hrs", value: timeLeft.hours },
              { label: "Mins", value: timeLeft.minutes },
              { label: "Secs", value: timeLeft.seconds },
            ].map((item) => (
              <div key={item.label} className="flex flex-col items-center">
                <span className="text-[20px] font-bold text-[#1A1714] tabular-nums leading-none">
                  {String(item.value).padStart(2, "0")}
                </span>
                <span className="text-[12px] font-medium text-black/30 tracking-tight mt-1">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* CARD 2 (RIGHT): TRUST + APP */}
        <div className="flex-1 bg-white rounded-lg shadow-[0_4px_25px_rgba(0,0,0,0.06)] flex flex-col xl:flex-row items-center overflow-hidden">
          {/* VALUE PROPS */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-0 p-4 lg:px-6 w-full">
            <div className="flex items-center gap-4 lg:justify-center md:border-r border-black/5">
              <div className="w-9 h-9 rounded-full bg-black/3 flex items-center justify-center text-brand">
                <Home size={18} strokeWidth={2.5} />
              </div>
              <div className="flex flex-col gap-0.5">
                <p className="text-[15px] font-medium text-[#1A1714] leading-tight">
                  5000+ Homes
                </p>
                <p className="text-[12px] text-black/50">Trusted Globally</p>
              </div>
            </div>

            <div className="flex items-center gap-4 lg:justify-center md:border-r border-black/5">
              <div className="w-9 h-9 rounded-full bg-black/3 flex items-center justify-center text-brand">
                <Truck size={18} strokeWidth={2.5} />
              </div>
              <div className="flex flex-col gap-0.5">
                <p className="text-[15px] font-medium text-[#1A1714] leading-tight">
                  Free Delivery
                </p>
                <p className="text-[12px] text-black/50">Pan-Nepal</p>
              </div>
            </div>

            <div className="flex items-center gap-4 lg:justify-center">
              <div className="w-9 h-9 rounded-full bg-black/3 flex items-center justify-center text-brand">
                <ShieldCheck size={18} strokeWidth={2.5} />
              </div>
              <div className="flex flex-col gap-0.5">
                <p className="text-[15px] font-medium text-[#1A1714] leading-tight">
                  10 Year Warranty
                </p>
                <p className="text-[12px] text-black/50">Certified Quality</p>
              </div>
            </div>
          </div>

          {/* APP DOWNLOAD (NOW LAST) */}
          <div className="hidden md:flex p-0.5 px-2.5 lg:px-4 py-3 xl:py-0 border-t xl:border-t-0 xl:border-l border-black/5 shrink-0 items-center justify-center gap-3 xl:self-stretch">
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/Google_Play_Store_badge_EN.svg/3840px-Google_Play_Store_badge_EN.svg.png"
              alt="Get it on Google Play"
              loading="lazy"
              decoding="async"
              className="h-11 w-auto object-contain transition-transform hover:scale-105"
            />
            <img
              src="https://developer.apple.com/app-store/marketing/guidelines/images/badge-download-on-the-app-store.svg"
              alt="Download on the App Store"
              loading="lazy"
              decoding="async"
              className="h-11 w-auto object-contain transition-transform hover:scale-105"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
