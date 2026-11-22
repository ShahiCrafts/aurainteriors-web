// Analytics injection (Batch 3b) — loads the standard GA4 / Meta
// Pixel / TikTok Pixel snippets ONLY when the admin has configured an
// ID in Settings → SEO. All three IDs default to "" in site settings,
// so nothing is injected on the site as it ships today. There was no
// pre-existing analytics snippet in the app or index.html (checked
// Batch 3b); if one is ever added statically, the data-analytics
// markers below let this module detect and skip duplicates.

const injected = new Set();

const alreadyPresent = (marker) =>
  typeof document !== "undefined" &&
  document.querySelector(`script[data-analytics="${marker}"]`) !== null;

const addScript = (marker, src, inlineText) => {
  if (injected.has(marker) || alreadyPresent(marker)) return;
  injected.add(marker);
  if (src) {
    const s = document.createElement("script");
    s.async = true;
    s.src = src;
    s.setAttribute("data-analytics", marker);
    document.head.appendChild(s);
  }
  if (inlineText) {
    const inline = document.createElement("script");
    inline.textContent = inlineText;
    inline.setAttribute("data-analytics", marker);
    document.head.appendChild(inline);
  }
};

export const injectAnalytics = (seo) => {
  if (typeof document === "undefined" || !seo) return;
  const ga = String(seo.googleAnalyticsId || "").trim();
  if (ga) {
    addScript(
      "ga4",
      `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ga)}`,
      `window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', '${ga.replace(/'/g, "")}');`,
    );
  }
  const meta = String(seo.metaPixelId || "").trim();
  if (meta) {
    addScript(
      "meta-pixel",
      null,
      `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init', '${meta.replace(/'/g, "")}');fbq('track', 'PageView');`,
    );
  }
  const tiktok = String(seo.tiktokPixelId || "").trim();
  if (tiktok) {
    addScript(
      "tiktok-pixel",
      null,
      `!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["track","page","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"];ttq.factory=function(e){return function(){var n=ttq._i[e]||[];n.push(arguments);ttq._t[e]=+new Date;return ttq}};for(var e=0;e<ttq.methods.length;e++)ttq[ttq.methods[e]]=ttq.factory(ttq.methods[e]);ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{};ttq._i[e]=[];ttq._i[e]._u=r;var o=d.createElement("script");o.type="text/javascript";o.async=!0;o.src=r+"?sdkid="+e+"&lib="+t;var a=d.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};ttq.load('${tiktok.replace(/'/g, "")}');ttq.page();}(window,document,'ttq');`,
    );
  }
};

// Test-only reset.
export const __resetAnalytics = () => injected.clear();
