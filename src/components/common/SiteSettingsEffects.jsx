import { useEffect } from "react";
import useSiteSettingsStore from "../../store/siteSettingsStore";
import { applySiteSettingsDom } from "../../lib/siteSettingsDom";

// SiteSettingsEffects (Batch 3b) — applies the non-React side effects
// of site settings (theme CSS variables, favicon, SEO head alignment,
// analytics) whenever the settings store changes. Renders nothing.
// The implementations live in lib/siteSettingsDom.js.
export default function SiteSettingsEffects() {
  const settings = useSiteSettingsStore((s) => s.settings);

  useEffect(() => {
    applySiteSettingsDom(settings);
  }, [settings]);

  return null;
}
