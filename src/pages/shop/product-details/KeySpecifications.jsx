import { Box, Weight, Layers, Droplet, DoorClosed, ArrowRight } from "lucide-react";

// ---------------------------------------------------------------
// Adapt this to your product schema. Each entry reads the first
// non-empty value; entries with no value are hidden automatically.
// A selected variant's fields win over the product's.
// ---------------------------------------------------------------
const present = (v) => v !== undefined && v !== null && String(v).trim() !== "";

const formatDimensions = (d) => {
    if (!d) return null;
    if (typeof d === "string") return d;
    const { width, depth, height, unit = "cm" } = d;
    if (![width, depth, height].every(present)) return null;
    return `W ${width} × D ${depth} × H ${height} ${unit}`;
};

const formatWeight = (w) => {
    if (!present(w)) return null;
    if (typeof w === "object") return present(w.value) ? `${w.value} ${w.unit || "kg"}` : null;
    return typeof w === "number" ? `${w} kg` : String(w);
};

export function buildKeySpecs(product, variant) {
    const get = (key) => (present(variant?.[key]) ? variant[key] : product?.[key]);
    const specs = product?.specifications || {};

    return [
        {
            icon: Box,
            label: "Dimensions",
            value: formatDimensions(get("dimensions")),
        },
        {
            icon: Weight,
            label: "Weight",
            value: formatWeight(get("weight")),
        },
        {
            icon: Layers,
            label: "Material",
            value: get("material") ?? specs.material,
        },
        {
            icon: Droplet,
            label: "Finish",
            value: get("finish") ?? get("color") ?? specs.finish,
        },
        {
            icon: DoorClosed,
            label: "Number of Doors",
            value: get("doors") ?? get("numberOfDoors") ?? specs.doors,
        },
    ].filter((s) => present(s.value));
}

export default function KeySpecifications({ product, selectedVariant, onViewAll }) {
    const specs = buildKeySpecs(product, selectedVariant);
    if (specs.length === 0) return null;

    return (
        <section aria-labelledby="key-specs-heading" className="mb-10">
            <div className="mb-5 flex items-center justify-between">
                <h2
                    id="key-specs-heading"
                    className="font-dm-sans text-3xl font-bold tracking-tight text-neutral-900"
                >
                    Key Specifications
                </h2>
                {onViewAll && (
                    <button
                        type="button"
                        onClick={onViewAll}
                        className="flex items-center gap-2 font-dm-sans text-sm font-semibold text-neutral-900 underline underline-offset-4 hover:text-[#F27318] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F27318]"
                    >
                        View All
                        <ArrowRight size={16} aria-hidden="true" />
                    </button>
                )}
            </div>

            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
                {specs.map(({ icon: Icon, label, value }) => (
                    <li
                        key={label}
                        className="flex items-center gap-4 rounded-2xl border border-neutral-100 bg-[#FCFAF8] px-5 py-6"
                    >
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#FBEBD9]/60">
                            <Icon size={24} strokeWidth={1.5} className="text-[#7A3E12]" aria-hidden="true" />
                        </span>
                        <div className="min-w-0">
                            <p className="font-dm-sans text-sm text-neutral-500">{label}</p>
                            <p className="mt-0.5 font-dm-sans text-[15px] font-medium text-neutral-900">
                                {value}
                            </p>
                        </div>
                    </li>
                ))}
            </ul>
        </section>
    );
}