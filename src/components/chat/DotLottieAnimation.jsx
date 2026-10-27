import { Sparkles } from "lucide-react";

// FE-07 FALLBACK — read before "fixing" this back to dotlottie.
//
// This module was the lazily loaded DotLottieReact wrapper (FE-49).
// FE-07 required the dotlottie WASM runtime to stop coming from
// the unpkg CDN. Wiring setWasmUrl() to a Vite-emitted local .wasm
// asset was implemented and measured first: the asset WAS emitted
// and the player chunk DID reference the local path — but the
// installed @lottiefiles/dotlottie-web@0.76.0 loader keeps the
// unpkg player-wasm URL as a hard-coded BACKUP source (loader
// factory in dist/index.js:
// q(init, primary, backup); setWasmUrl replaces only the primary),
// load() retries from that backup when the primary fails, and the
// package exports no API to replace or clear the backup. Exclusive
// self-hosting is therefore impossible with the installed version,
// so per the FE-07 fallback the player is dropped for a CSS/SVG
// animation of the same visual role: a decorative, continuously
// animated assistant motif in the chat empty state's 160x160 box.
// APPEARANCE CHANGE (owner-visible): the original .lottie animation
// asset no longer plays; a chat bubble with bouncing typing dots and
// a pulsing sparkle renders instead, with no network fetch, no WASM
// and no third-party runtime. The dotlottie dependency and the
// animation asset were removed in FE-61/FE-62. The file keeps its
// name so the lazy import path from ChatWindow is unchanged.
const EmptyStateAnimation = () => (
  <div
    className="relative w-full h-full flex items-center justify-center"
    role="img"
    aria-label="Aura assistant is ready to chat"
  >
    <div className="relative flex h-24 w-28 items-center justify-center rounded-[1.75rem] bg-[#FFF3EB] shadow-sm">
      <div className="flex items-center gap-1.5" aria-hidden="true">
        <span className="h-2.5 w-2.5 rounded-full bg-[#F27318] animate-bounce [animation-delay:0ms]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#F27318] animate-bounce [animation-delay:150ms]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#F27318] animate-bounce [animation-delay:300ms]" />
      </div>
      <span
        className="absolute -bottom-1.5 left-6 h-4 w-4 rotate-45 bg-[#FFF3EB]"
        aria-hidden="true"
      />
    </div>
    <Sparkles
      size={22}
      className="absolute right-5 top-5 text-[#F27318] animate-pulse"
      aria-hidden="true"
    />
  </div>
);

export default EmptyStateAnimation;
