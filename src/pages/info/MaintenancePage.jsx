import useSiteSettingsStore from "../../store/siteSettingsStore";
import { validateMediaUrl } from "../../utils/safeUrl";

export function useMaintenanceMode() {
  const maintenance = useSiteSettingsStore((s) => s.settings?.maintenance);
  return { enabled: !!maintenance?.enabled, message: maintenance?.message || "" };
}

export default function MaintenancePage() {
  const settings = useSiteSettingsStore((s) => s.settings);
  const identity = settings?.identity || {};
  const contact = settings?.contact || {};
  const maintenance = settings?.maintenance || {};
  const storeName = identity.storeName || "Aura Interiors";
  const safeSrc = validateMediaUrl(identity.logoUrl) || "/logo-aura-interiors.webp";
  const email = identity.supportEmail || contact.email || "";
  const phone = contact.phone || "";
  const message = maintenance.message || "We're making some improvements to the store. Please check back shortly.";

  return (
    <div className="min-h-screen bg-[#f3f4f6] font-dm-sans flex items-center justify-center px-4 py-10">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 max-w-md w-full p-8 text-center">
        <img src={safeSrc} alt={storeName} className="h-12 mx-auto object-contain" />
        <p className="mt-3 text-sm font-medium text-gray-500">{storeName}</p>
        <div className="mx-auto mt-6 h-1 w-12 rounded-full bg-[#F27318]" />
        <h1 className="mt-4 text-2xl font-bold text-gray-900">We&apos;ll be back soon</h1>
        <p className="mt-3 text-sm text-gray-600 leading-relaxed">{message}</p>
        {(email || phone) && (
          <p className="mt-6 text-sm text-gray-600">
            Need help?{" "}
            {email && <a href={`mailto:${email}`} className="text-[#F27318] font-medium hover:underline">{email}</a>}
            {email && phone && " · "}
            {phone && <a href={`tel:${phone.replace(/\s+/g, "")}`} className="text-[#F27318] font-medium hover:underline">{phone}</a>}
          </p>
        )}
      </div>
    </div>
  );
}
