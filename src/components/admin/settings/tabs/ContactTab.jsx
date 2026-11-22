import {
  Phone,
  Mail,
  MapPin,
  Link as LinkIcon,
  Clock,
  Info,
  ExternalLink,
  MessageCircle,
} from "lucide-react";
import { Card, Field, Toggle, inputClass, textareaClass } from "../ui";
import { SOCIAL_PLATFORMS, SocialChip } from "../fields";

// Contact & Social tab (Batch 3d, reference image 4). Left: contact
// information + social links. Right: the map preview (renders the
// stored Google Maps embed URL) and the structured per-day business
// hours (contact.businessHours). On save, the parent composes
// contact.hours from the structured rows when any day is open —
// that composed line is what the storefront footer/contact page
// render today.

function IconInput({ Icon, ...props }) {
  return (
    <div className="relative">
      <Icon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
      <input {...props} className={`${inputClass} !pl-10`} />
    </div>
  );
}

const isMapEmbed = (url) =>
  typeof url === "string" &&
  url.includes("google") &&
  (url.includes("embed") || url.includes("maps"));

export default function ContactTab({ contact, onContact }) {
  const patchSocial = (key, value) =>
    onContact({ socials: { ...contact.socials, [key]: value } });
  const patchDay = (index, patch) =>
    onContact({
      businessHours: contact.businessHours.map((row, i) =>
        i === index ? { ...row, ...patch } : row,
      ),
    });

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
      <div className="space-y-6">
        <Card
          title="Contact Information"
          description="Update your store's contact details."
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Phone Number" required>
              <IconInput
                Icon={Phone}
                type="text"
                aria-label="Phone"
                value={contact.phone}
                onChange={(e) => onContact({ phone: e.target.value })}
              />
            </Field>
            <Field label="Map Embed URL">
              <IconInput
                Icon={LinkIcon}
                type="text"
                aria-label="Map link"
                value={contact.mapUrl}
                onChange={(e) => onContact({ mapUrl: e.target.value })}
                placeholder="https://www.google.com/maps/embed?…"
              />
            </Field>
            <Field label="Email Address" required>
              <IconInput
                Icon={Mail}
                type="email"
                aria-label="Contact email"
                value={contact.email}
                onChange={(e) => onContact({ email: e.target.value })}
              />
            </Field>
            <Field label="Business Hours">
              <div className="relative">
                <Clock className="w-4 h-4 text-gray-400 absolute left-3 top-3 pointer-events-none" />
                <textarea
                  aria-label="Opening hours"
                  value={contact.hours}
                  onChange={(e) => onContact({ hours: e.target.value })}
                  placeholder={"Mon - Sat: 9AM – 6PM\nSunday: Closed"}
                  className={`${textareaClass} !pl-10 !min-h-20`}
                />
              </div>
            </Field>
            <Field label="WhatsApp Number">
              <IconInput
                Icon={MessageCircle}
                type="text"
                aria-label="WhatsApp"
                value={contact.socials.whatsapp}
                onChange={(e) => patchSocial("whatsapp", e.target.value)}
                placeholder="Number or wa.me link"
              />
            </Field>
            <Field label="Address">
              <IconInput
                Icon={MapPin}
                type="text"
                aria-label="Address"
                value={contact.address}
                onChange={(e) => onContact({ address: e.target.value })}
              />
            </Field>
          </div>
          <div className="flex items-start gap-2.5 bg-brand/10 text-brand-hover rounded-lg px-4 py-3 mt-5">
            <Info className="w-4 h-4 mt-0.5 shrink-0" />
            <p className="text-sm">
              These details will appear on your store's footer, contact
              page and emails.
            </p>
          </div>
        </Card>

        <Card
          title="Social Media Links"
          description="Connect your social media profiles."
        >
          <div className="space-y-3">
            {SOCIAL_PLATFORMS.map((platform) => {
              const value = contact.socials[platform.key] || "";
              return (
                <div key={platform.key} className="flex items-center gap-3">
                  <SocialChip platform={platform} />
                  <input
                    type="text"
                    aria-label={`${platform.label} URL`}
                    value={value}
                    onChange={(e) => patchSocial(platform.key, e.target.value)}
                    placeholder={"https://" + platform.key + ".com/…"}
                    className={inputClass}
                  />
                  <button
                    type="button"
                    aria-label={`Open ${platform.label} link`}
                    disabled={!value}
                    onClick={() => window.open(value, "_blank", "noopener")}
                    className="p-2.5 border border-gray-200 rounded-lg text-brand hover:bg-brand/10 transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <div className="space-y-6">
        <Card
          title="Store Location"
          description="Show your store location on the map."
        >
          {isMapEmbed(contact.mapUrl) ? (
            <iframe
              title="Store location map"
              src={contact.mapUrl}
              className="w-full h-64 rounded-xl border border-gray-200"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-64 rounded-xl border border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center gap-2 text-center px-6">
              <MapPin className="w-8 h-8 text-gray-300" />
              <p className="text-sm text-gray-400">
                Add a Google Maps embed URL to preview your location
                here.
              </p>
            </div>
          )}
          <button
            type="button"
            onClick={() =>
              window.open("https://www.google.com/maps", "_blank", "noopener")
            }
            className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 text-brand rounded-lg text-sm font-medium hover:bg-brand/10 transition-colors"
          >
            <MapPin className="w-4 h-4" />
            Update Location on Map
          </button>
        </Card>

        <Card
          title="Business Hours"
          description="Set your store's operating hours."
        >
          <div className="space-y-2.5">
            {contact.businessHours.map((row, index) => (
              <div
                key={row.day}
                className="grid grid-cols-[6.5rem_auto_1fr] items-center gap-3"
              >
                <span className="text-sm text-gray-700">{row.day}</span>
                <Toggle
                  ariaLabel={`${row.day} open`}
                  checked={row.open}
                  onChange={(v) => patchDay(index, { open: v })}
                />
                <input
                  type="text"
                  aria-label={`${row.day} hours`}
                  value={row.open ? row.hours : ""}
                  disabled={!row.open}
                  onChange={(e) => patchDay(index, { hours: e.target.value })}
                  placeholder={row.open ? "9:00 AM - 6:00 PM" : "Closed"}
                  className={inputClass}
                />
              </div>
            ))}
          </div>
          <div className="flex items-start gap-2.5 bg-brand/10 text-brand-hover rounded-lg px-4 py-3 mt-5">
            <Info className="w-4 h-4 mt-0.5 shrink-0" />
            <p className="text-sm">
              When you save, open days are combined into the
              opening-hours line shown on your store's footer and
              contact page.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
