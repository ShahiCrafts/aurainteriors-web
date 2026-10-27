import { Loader2 } from "lucide-react";

// FE-56 — real loading fallback (the customer App's previous local
// LoadingSpinner returned null, so every Suspense fallback was blank).
export default function LoadingSpinner() {
  return (
    <div role="status" aria-label="Loading…" className="flex min-h-[200px] items-center justify-center gap-2 p-8">
      <Loader2 className="animate-spin" size={24} aria-hidden="true" />
      <span>Loading…</span>
    </div>
  );
}
