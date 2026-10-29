import { useMemo, useState } from "react";
import { Search, Star, X } from "lucide-react";
import { FilterCheckbox } from "./FilterSidebar";
import {
  LEGACY_FACET_KEYS,
  facetGroupVisible,
} from "../../utils/catalogListing";

function withSelectedOptions(facet, entry) {
  const base = facet.options || [];
  const known = new Set(base.map((option) => String(option.value)));
  const extra = (entry?.values || [])
    .filter((value) => !known.has(String(value)))
    .map((value) => ({ value }));
  return extra.length > 0 ? [...base, ...extra] : base;
}

const SectionLabel = ({ children }) => (
  <h3 className="text-sm font-bold text-[#1A1714] font-dm-sans mb-4 uppercase tracking-wider">
    {children}
  </h3>
);

const optionCount = (option) =>
  option?.count === undefined ? undefined : option.count;

function BooleanFacet({ facet, entry, onToggle }) {
  const option = (facet.options || []).find(
    (item) => String(item.value) === "true",
  );
  const checked = (entry?.values || []).includes("true");
  if (!option && !checked) return null;
  return (
    <div>
      <SectionLabel>{facet.label}</SectionLabel>
      <FilterCheckbox
        checked={checked}
        onChange={() => onToggle(facet.key, "true")}
        label="Yes"
        count={optionCount(option)}
      />
    </div>
  );
}

function ColorFacet({ facet, entry, onToggle }) {
  const selected = new Set(entry?.values || []);
  const options = withSelectedOptions(facet, entry);
  return (
    <div>
      <SectionLabel>{facet.label}</SectionLabel>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const value = String(option.value);
          const isHex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value);
          const active = selected.has(value);
          return (
            <button
              key={value}
              type="button"
              onClick={() => onToggle(facet.key, value)}
              aria-pressed={active}
              title={
                option.count === undefined
                  ? value
                  : `${value} (${option.count})`
              }
              className={`flex items-center gap-1.5 rounded-full border py-1 pl-1 pr-2.5 text-xs font-dm-sans transition-all ${active
                ? "border-brand bg-brand/10 text-[#1A1714]"
                : "border-neutral-200 bg-white text-neutral-700 hover:border-brand"
                }`}
            >
              <span
                className="h-4 w-4 rounded-full border border-black/10"
                style={{ backgroundColor: isHex ? value : "#D6CFC2" }}
              />
              {value}
              {option.count !== undefined && (
                <span className="text-[11px] font-bold text-black/30">
                  {option.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function RangeFacet({ facet, entry, onRange }) {
  const numeric = (facet.options || [])
    .map((option) => Number(option.value))
    .filter((value) => Number.isFinite(value));
  const bounds =
    numeric.length > 0
      ? { min: Math.min(...numeric), max: Math.max(...numeric) }
      : null;
  const [min, setMin] = useState(entry?.min ?? "");
  const [max, setMax] = useState(entry?.max ?? "");
  const [prevEntry, setPrevEntry] = useState({
    min: entry?.min ?? null,
    max: entry?.max ?? null,
  });
  if (
    prevEntry.min !== (entry?.min ?? null) ||
    prevEntry.max !== (entry?.max ?? null)
  ) {
    setPrevEntry({ min: entry?.min ?? null, max: entry?.max ?? null });
    setMin(entry?.min ?? "");
    setMax(entry?.max ?? "");
  }
  const commit = () =>
    onRange(facet.key, min === "" ? null : min, max === "" ? null : max);
  return (
    <div>
      <SectionLabel>{facet.label}</SectionLabel>
      <div className="flex items-center gap-2">
        <input
          type="number"
          aria-label={`${facet.label} minimum`}
          value={min}
          onChange={(event) => setMin(event.target.value)}
          onBlur={commit}
          placeholder={bounds ? String(bounds.min) : "Min"}
          className="w-full min-w-0 rounded-lg border border-neutral-200 px-2.5 py-2 text-xs font-dm-sans outline-none transition-all focus:border-brand focus:ring-1 focus:ring-brand"
        />
        <span className="text-neutral-300">–</span>
        <input
          type="number"
          aria-label={`${facet.label} maximum`}
          value={max}
          onChange={(event) => setMax(event.target.value)}
          onBlur={commit}
          placeholder={bounds ? String(bounds.max) : "Max"}
          className="w-full min-w-0 rounded-lg border border-neutral-200 px-2.5 py-2 text-xs font-dm-sans outline-none transition-all focus:border-brand focus:ring-1 focus:ring-brand"
        />
      </div>
      {bounds && (
        <p className="mt-1.5 text-[11px] text-neutral-400 font-dm-sans">
          Available {bounds.min} – {bounds.max}
          {facet.unit ? ` ${facet.unit}` : ""}
        </p>
      )}
    </div>
  );
}

function CheckboxFacet({ facet, entry, onToggle }) {
  const [query, setQuery] = useState("");
  const options = useMemo(
    () => withSelectedOptions(facet, entry),
    [facet, entry],
  );
  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return options;
    return options.filter((option) =>
      String(option.value).toLowerCase().includes(needle),
    );
  }, [options, query]);
  const selected = new Set(entry?.values || []);
  return (
    <div>
      <SectionLabel>{facet.label}</SectionLabel>
      {options.length > 8 && (
        <div className="relative mb-2.5">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
          <input
            type="search"
            aria-label={`Search ${facet.label} values`}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={`Search ${facet.label.toLowerCase()}…`}
            className="w-full rounded-lg border border-neutral-200 bg-white py-2 pl-8 pr-2.5 text-xs font-dm-sans outline-none transition-all focus:border-brand focus:ring-1 focus:ring-brand"
          />
        </div>
      )}
      <div className="max-h-56 space-y-1 overflow-y-auto pr-1">
        {visible.map((option) => {
          const value = String(option.value);
          return (
            <FilterCheckbox
              key={value}
              checked={selected.has(value)}
              onChange={() => onToggle(facet.key, value)}
              label={value}
              count={optionCount(option)}
            />
          );
        })}
        {visible.length === 0 && (
          <p className="text-xs text-neutral-400 font-dm-sans">
            No matching values.
          </p>
        )}
      </div>
    </div>
  );
}

export function AttributeFacet({ facet, entry, onToggle, onRange }) {
  if (!facet || !facetGroupVisible(facet, entry)) return null;
  if (facet.type === "boolean") {
    return <BooleanFacet facet={facet} entry={entry} onToggle={onToggle} />;
  }
  if (facet.type === "color") {
    return <ColorFacet facet={facet} entry={entry} onToggle={onToggle} />;
  }
  if (["integer", "decimal", "measurement", "money"].includes(facet.type)) {
    return <RangeFacet facet={facet} entry={entry} onRange={onRange} />;
  }
  return <CheckboxFacet facet={facet} entry={entry} onToggle={onToggle} />;
}

export default function FacetSections({
  facets,
  selection = {},
  selectedRooms = [],
  inStockOnly = false,
  hideRoom = false,
  onAttrToggle,
  onAttrRange,
  onRoomToggle,
  onInStockToggle,
}) {
  if (!facets) return null;
  const roomOptions = facets.room?.options || [];
  const availability = (facets.availability?.options || []).find(
    (option) => option.value === "inStock",
  );
  const attributes = (facets.attributes || []).filter(
    (facet) =>
      !LEGACY_FACET_KEYS.has(facet.key) &&
      facetGroupVisible(facet, selection[facet.key]),
  );
  const showRoom = !hideRoom && roomOptions.length > 0;
  if (!showRoom && !availability && attributes.length === 0) return null;

  return (
    <div className="space-y-6">
      {showRoom && (
        <div>
          <SectionLabel>Room</SectionLabel>
          <div className="space-y-1">
            {roomOptions.map((option) => (
              <FilterCheckbox
                key={String(option.value)}
                checked={selectedRooms.includes(String(option.value))}
                onChange={() => onRoomToggle(String(option.value))}
                label={option.label || String(option.value)}
                count={optionCount(option)}
              />
            ))}
          </div>
        </div>
      )}

      {availability && (
        <div>
          <SectionLabel>Availability</SectionLabel>
          <FilterCheckbox
            checked={inStockOnly}
            onChange={onInStockToggle}
            label="In stock only"
            count={optionCount(availability)}
          />
        </div>
      )}

      {attributes.map((facet) => (
        <div key={facet.key}>
          <AttributeFacet
            facet={facet}
            entry={selection[facet.key]}
            onToggle={onAttrToggle}
            onRange={onAttrRange}
          />
        </div>
      ))}
    </div>
  );
}

export function FilterChips({ chips = [], onRemove, onClearAll }) {
  if (chips.length === 0) return null;
  return (
    <div
      className="flex flex-wrap items-center gap-2.5"
      aria-label="Active filters"
    >
      {chips.map((chip) => (
        <span
          key={chip.id}
          className="inline-flex items-center gap-2 rounded-full border border-black/8 bg-white px-4 py-2 text-[13px] font-semibold text-[#1A1714] shadow-[0_1px_2px_rgba(26,23,20,0.05)] transition-colors hover:border-brand font-dm-sans"
        >
          {chip.swatch && (
            <span
              data-chip-swatch=""
              aria-hidden="true"
              className="h-5 w-5 shrink-0 rounded-full border border-black/10"
              style={{ backgroundColor: chip.swatch }}
            />
          )}
          {chip.kind === "rating" && (
            <Star
              aria-hidden="true"
              className="h-4 w-4 shrink-0 fill-brand text-brand"
            />
          )}
          {chip.label}
          <button
            type="button"
            onClick={() => onRemove(chip)}
            aria-label={`Remove filter ${chip.label}`}
            className="-mr-1.5 flex h-5 w-5 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-brand/10 hover:text-[#1A1714] focus-visible:outline-2 focus-visible:outline-brand"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </span>
      ))}
      <button
        type="button"
        onClick={onClearAll}
        className="px-1 text-[13px] font-bold text-brand hover:text-brand-hover font-dm-sans underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-brand"
      >
        Clear all filters
      </button>
    </div>
  );
}
