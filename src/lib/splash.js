// Dismisses the branded splash from index.html.
//
// The splash covers the first paint — including the prerendered SEO
// snapshot inside #root — so it must stay up until the app has
// actually mounted and committed its first frame. Removing it any
// earlier (e.g. right after createRoot().render() is called, before
// React commits) flashes the unstyled snapshot and makes the page
// visibly jump when the real UI replaces it.
//
// Called from App's mount effect. Enforces a short minimum display
// so the splash never flickers on fast loads, then fades out.
let dismissed = false;

export function dismissSplash() {
  if (dismissed) return;
  dismissed = true;
  const el = document.getElementById("app-splash");
  if (!el) return;
  const MIN_DISPLAY_MS = 450;
  const wait = Math.max(0, MIN_DISPLAY_MS - performance.now());
  setTimeout(() => {
    el.classList.add("app-splash-done");
    setTimeout(() => el.remove(), 400);
  }, wait);
}
