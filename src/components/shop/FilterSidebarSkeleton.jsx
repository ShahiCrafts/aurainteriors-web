const Block = ({ className = "" }) => <div className={`rounded bg-[#F0EFED] motion-safe:animate-pulse ${className}`} />;
const Rows = ({ count }) => <div className="space-y-1">{Array.from({ length: count }, (_, i) => <div key={i} className="flex items-center gap-3 py-1.5"><Block className="w-5 h-5 shrink-0" /><Block className={`${i % 2 ? "w-24" : "w-32"} max-w-full h-5 flex-1`} /><Block className="w-4 h-4" /></div>)}</div>;
export default function FilterSidebarSkeleton() {
  return <div className="space-y-6" aria-busy="true">
    <span className="sr-only" role="status">Loading filters</span>
    <div aria-hidden="true"><Block className="w-28 h-5 mb-4" /><Rows count={6} /></div>
    <div className="w-full h-px bg-neutral-100" />
    <div aria-hidden="true"><div className="flex items-center justify-between mb-4"><Block className="w-28 h-5" /><Block className="w-10 h-4" /></div><div className="flex items-center gap-4 mb-6">{[0, 1].map(i => <div key={i} className="flex-1"><Block className="w-7 h-[15px] mb-1.5" /><Block className="w-full h-[34px] rounded-lg" /></div>)}</div><div className="relative h-4"><Block className="absolute top-1/2 w-full h-1 -translate-y-1/2" /><Block className="absolute right-1/3 w-4 h-4 rounded-full" /></div></div>
    <div className="w-full h-px bg-neutral-100" />
    <div aria-hidden="true"><Block className="w-16 h-5 mb-4" /><div className="flex flex-wrap gap-2.5">{Array.from({ length: 6 }, (_, i) => <Block key={i} className="w-6 h-6 rounded-full" />)}</div></div>
    <div className="w-full h-px bg-neutral-100" />
    <div aria-hidden="true"><Block className="w-24 h-5 mb-4" /><Rows count={5} /></div>
  </div>;
}
