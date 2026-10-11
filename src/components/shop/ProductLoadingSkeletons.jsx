const Block = ({ className = "" }) => <div aria-hidden="true" className={`rounded bg-[#F0EFED] motion-safe:animate-pulse ${className}`} />;

export function ListingCardSkeleton({ viewMode = "grid" }) {
  const list = viewMode === "list";
  return (
    <div aria-hidden="true" className={list ? "flex flex-col sm:flex-row gap-3 sm:gap-4 bg-white rounded-lg p-3 sm:p-4 shadow-sm" : "flex flex-col gap-3 sm:gap-4"}>
      <div className={list ? "relative w-full sm:w-40 lg:w-52 shrink-0 aspect-video sm:aspect-auto sm:h-32 lg:h-40 rounded-lg bg-[#F0EFED] motion-safe:animate-pulse" : "relative aspect-[5/3] rounded-lg bg-[#F0EFED] motion-safe:animate-pulse"}>
        <div className="absolute top-2 right-2 sm:top-3 sm:right-3 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/80" />
      </div>
      <div className="flex flex-col flex-1 min-w-0">
        <div className="text-[11px] sm:text-[12px] mb-2"><Block className="h-[1lh] w-20 max-w-full" /></div>
        <div className="text-[13px] sm:text-[15px] mb-2 sm:mb-3"><Block className="h-[1lh] w-3/4" /></div>
        {list && <div className="text-[11px] sm:text-[13px] leading-snug mb-2 sm:mb-3 space-y-1"><Block className="h-[1lh] w-full" /><Block className="h-[1lh] w-4/5" /></div>}
        <div className="flex items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4 text-[10px] sm:text-[11px]">
          <div className="flex gap-0.5">{Array.from({ length: 5 }, (_, i) => <Block key={i} className="w-3 h-3 sm:w-3.5 sm:h-3.5" />)}</div>
          <Block className="w-10 h-[1lh]" />
        </div>
        <div className="mt-auto text-[14px] sm:text-[16px] lg:text-[18px]"><Block className="h-[1lh] w-28 max-w-full" /></div>
      </div>
    </div>
  );
}

export function ProductDetailsSkeleton() {
  return (
    <main className="min-h-screen bg-white pt-4 font-dm-sans pb-32 lg:pb-28" aria-busy="true">
      <span role="status" className="sr-only">Loading product details</span>
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-3">
        <nav aria-hidden="true" className="flex flex-wrap items-center gap-y-1 gap-x-2 text-[14px] font-medium mb-5"><Block className="h-[1lh] w-12" /><Block className="h-[1lh] w-20" /><Block className="h-[1lh] w-36" /></nav>
        <div className="flex gap-10 mb-14" aria-hidden="true">
          <div className="flex-[1.2] flex gap-3 justify-end overflow-hidden">
            <div className="flex flex-col gap-3 overflow-y-auto no-scrollbar">{Array.from({ length: 5 }, (_, i) => <Block key={i} className="shrink-0 w-20 h-20 rounded-lg border-2 border-transparent" />)}</div>
            <div className="space-y-6 flex-1"><Block className="w-full h-[444px] rounded-xl border border-[#F0EFED]" /></div>
          </div>
          <div className="flex-1 min-w-0">
            <Block className="w-24 h-6 mb-5" />
            <Block className="w-4/5 h-9 mb-3" />
            <div className="flex flex-wrap gap-2 mb-4"><Block className="w-24 h-5" /><Block className="w-32 h-5" /></div>
            <Block className="w-44 h-[45px] mb-1.5" />
            <Block className="w-36 h-5 mb-4" />
            <div className="mb-6 space-y-2"><Block className="w-full h-[21px]" /><Block className="w-full h-[21px]" /><Block className="w-3/4 h-[21px]" /></div>
            <div className="mb-5"><Block className="w-32 h-[22px] mb-3" /><div className="flex flex-wrap gap-3">{Array.from({ length: 4 }, (_, i) => <Block key={i} className="w-10 h-10 rounded-full" />)}</div></div>
            <div className="flex flex-col sm:flex-row items-stretch gap-3 mb-5"><Block className="h-[52px] sm:w-[116px] shrink-0 rounded-lg" /><Block className="h-[52px] flex-2 rounded-lg" /><Block className="h-[52px] flex-1 rounded-lg" /></div>
            <div className="flex items-start gap-12 mt-10"><Block className="w-32 h-5" /><Block className="w-16 h-5" /></div>
          </div>
        </div>
        <div aria-hidden="true" className="mb-16"><div className="flex gap-8 py-4 border-b border-[#F0EFED]">{Array.from({ length: 4 }, (_, i) => <Block key={i} className="w-24 h-5" />)}</div><div className="space-y-3 py-6"><Block className="w-full h-4" /><Block className="w-full h-4" /><Block className="w-3/4 h-4" /></div></div>
      </div>
    </main>
  );
}
