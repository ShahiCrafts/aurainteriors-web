import { useRef } from "react";

/**
 * @typedef {Object} TabItem
 * @property {string} id
 * @property {string} label
 * @property {boolean} [disabled]
 * @property {React.ComponentType<{ size?: number, className?: string }>} [Icon]
 *   Optional lucide-style icon component, as used by the PDP tab strip.
 */

/**
 * @typedef {Object} TabsProps
 * @property {TabItem[]} tabs
 * @property {string} activeId Controlled active tab id.
 * @property {(id: string) => void} onChange
 * @property {string} [ariaLabel] Accessible name for the tab list.
 * @property {string} [className]
 * @property {(activeTab: TabItem) => React.ReactNode} children Render
 *   function for the active panel. (Chosen over a `panels` map so panel
 *   content stays colocated with the page, matching how PDP / ProfilePage
 *   / admin Products already switch on an active-id state.)
 */

/**
 * Controlled tab strip (REUSE-012). The three existing tab UIs (PDP,
 * ProfilePage, admin Products) all keep an active-id in state and switch
 * content on it, but none implemented the tablist ARIA pattern; this
 * primitive keeps that same controlled shape and adds role/aria wiring
 * plus arrow-key navigation (automatic activation, disabled tabs skipped).
 *
 * @param {TabsProps} props
 */
export default function Tabs({
  tabs = [],
  activeId,
  onChange,
  ariaLabel,
  className = "",
  children,
}) {
  const tabRefs = useRef({});
  const activeTab = tabs.find((tab) => tab.id === activeId) || tabs[0];

  const activate = (tab, focus = false) => {
    if (!tab || tab.disabled) return;
    onChange(tab.id);
    if (focus) tabRefs.current[tab.id]?.focus();
  };

  const handleKeyDown = (event) => {
    const enabled = tabs.filter((tab) => !tab.disabled);
    if (!enabled.length) return;
    const currentIndex = enabled.findIndex((tab) => tab.id === activeTab?.id);
    let next = null;
    if (event.key === "ArrowRight")
      next = enabled[(currentIndex + 1) % enabled.length];
    else if (event.key === "ArrowLeft")
      next = enabled[(currentIndex - 1 + enabled.length) % enabled.length];
    else if (event.key === "Home") next = enabled[0];
    else if (event.key === "End") next = enabled[enabled.length - 1];
    if (next) {
      event.preventDefault();
      activate(next, true);
    }
  };

  if (!tabs.length) return null;

  return (
    <div className={className}>
      <div
        role="tablist"
        aria-label={ariaLabel}
        className="flex gap-0 overflow-x-auto border-b border-neutral-200"
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab?.id;
          const { Icon } = tab;
          return (
            <button
              key={tab.id}
              ref={(el) => {
                tabRefs.current[tab.id] = el;
              }}
              type="button"
              role="tab"
              id={`tab-${tab.id}`}
              aria-selected={isActive}
              aria-controls={`panel-${tab.id}`}
              tabIndex={isActive ? 0 : -1}
              disabled={tab.disabled}
              onClick={() => activate(tab)}
              onKeyDown={handleKeyDown}
              className={`relative flex items-center gap-2 whitespace-nowrap px-5 py-3.5 text-sm font-semibold transition-colors cursor-pointer bg-transparent border-none disabled:opacity-40 disabled:cursor-not-allowed ${
                isActive
                  ? "text-neutral-900"
                  : "text-neutral-400 hover:text-neutral-600"
              }`}
            >
              {Icon && (
                <Icon
                  size={16}
                  aria-hidden="true"
                  className={isActive ? "text-brand" : "text-neutral-300"}
                />
              )}
              {tab.label}
              {isActive && (
                <span
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand"
                  aria-hidden="true"
                />
              )}
            </button>
          );
        })}
      </div>
      {activeTab && (
        <div
          role="tabpanel"
          id={`panel-${activeTab.id}`}
          aria-labelledby={`tab-${activeTab.id}`}
        >
          {typeof children === "function" ? children(activeTab) : children}
        </div>
      )}
    </div>
  );
}
