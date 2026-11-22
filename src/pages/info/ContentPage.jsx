import { Link } from "react-router-dom";
import Navbar from "../../layouts/customer/Navbar";
import Footer from "../../layouts/customer/Footer";
import Seo from "../../components/common/Seo.jsx";
import useSiteSettingsStore from "../../store/siteSettingsStore";

// Static content page (Batch 3b — NEW route family: /about, /privacy,
// /terms, /shipping, /returns). The footer has always linked to these
// paths, but no routes existed, so they rendered the 404 page. Each
// page renders the admin-editable copy from site settings
// (pages.about / privacyPolicy / terms / shippingReturns) in the same
// shell as the FAQ page. Until an admin writes copy, the settings text
// is "" and the page shows its title with a short coming-soon line and
// the support email — a real page, not a 404.
export default function ContentPage({ title, settingsKey, path }) {
  const text = useSiteSettingsStore((s) => s.settings.pages?.[settingsKey]);
  const storeName = useSiteSettingsStore((s) => s.settings.identity.storeName);
  const supportEmail = useSiteSettingsStore(
    (s) => s.settings.identity.supportEmail || s.settings.contact.email,
  );

  const paragraphs = String(text || "")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <>
      <Seo title={`${title} | ${storeName || "Aura Interiors"}`} path={path} />
      <Navbar />
      <main className="min-h-screen bg-white font-dm-sans pt-32 pb-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h1 className="text-[32px] sm:text-[44px] md:text-[52px] font-bold text-[#1A1714] mb-3 tracking-tight leading-[1.1]">
              {title}
            </h1>
          </div>

          <div className="max-w-2xl mx-auto">
            {paragraphs.length > 0 ? (
              <div className="space-y-5">
                {paragraphs.map((paragraph, i) => (
                  <p
                    key={i}
                    className="text-gray-600 text-[15px] sm:text-[16px] leading-relaxed whitespace-pre-line"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            ) : (
              <div className="text-center">
                <p className="text-gray-500 text-[15px] sm:text-[16px] leading-relaxed mb-6">
                  This page is being updated — content is coming soon. If you
                  need anything in the meantime, we are happy to help.
                </p>
                {supportEmail && (
                  <p className="text-gray-500 text-[15px] sm:text-[16px] leading-relaxed">
                    Reach us at{" "}
                    <a
                      href={`mailto:${supportEmail}`}
                      className="text-brand hover:text-brand-hover font-medium"
                    >
                      {supportEmail}
                    </a>{" "}
                    or through our{" "}
                    <Link
                      to="/contact"
                      className="text-brand hover:text-brand-hover font-medium"
                    >
                      contact page
                    </Link>
                    .
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
