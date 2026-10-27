import { Home, Building2, Users, MapPin, Phone, Pencil, Trash2 } from "lucide-react";

/**
 * @typedef {Object} AddressCardProps
 * @property {Object} address API address (see utils/addressMapper
 *   for the shape).
 * @property {(address: Object) => void} onEdit
 * @property {(id: string) => void} onDelete Asks the parent to
 *   confirm/delete this address id.
 * @property {(id: string) => void} onSetDefault
 * @property {boolean} [isDeleting]
 * @property {boolean} [isSettingDefault]
 */

const labelIcons = {
  home: Home,
  office: Building2,
  family: Users,
  other: MapPin,
};

const labelColors = {
  home: "bg-orange-50 text-[#F27318]",
  office: "bg-blue-50 text-blue-700",
  family: "bg-purple-50 text-purple-700",
  other: "bg-neutral-100 text-neutral-600",
};

/**
 * Phase 6 (REUSE-013) — the saved-address card, extracted verbatim
 * from SavedAddresses (label icon/colour maps and display-label
 * rule included). Pure presentation + callbacks; the parent owns
 * the modal/delete/default state.
 *
 * ShippingStep's checkout address renderings were NOT folded into
 * this card: the summary card (label pill + phone row + edit
 * affordance, different line composition) and the drawer item (a
 * selectable <button> with its own selected check) differ
 * materially from this profile card — see the Phase 6 log.
 *
 * @param {AddressCardProps} props
 */
export default function AddressCard({
  address,
  onEdit,
  onDelete,
  onSetDefault,
  isDeleting = false,
  isSettingDefault = false,
}) {
  const Icon = labelIcons[address.label?.toLowerCase()] || MapPin;
  const iconColor = labelColors[address.label?.toLowerCase()] || labelColors.other;
  const displayLabel =
    address.label === "other" && address.customLabel
      ? address.customLabel
      : address.label;

  return (
    <div className="bg-white rounded-xl border border-neutral-200 flex flex-col h-full transition-all">
      <div className="p-5 flex-1">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${iconColor}`}
            >
              <Icon size={20} />
            </div>
            <div className="min-w-0 flex items-baseline gap-1.5">
              <h3 className="text-[16px] font-semibold text-[#1A1714] capitalize leading-tight truncate">
                {displayLabel}
              </h3>
              <span className="text-[15px] capitalize text-neutral-400 font-medium shrink-0">
                · {address.type}
              </span>
            </div>
          </div>
          {address.isDefault && (
            <span className="px-2 py-1 bg-[#F27318] text-white text-[11px] font-semibold uppercase tracking-wider rounded shrink-0">
              Default
            </span>
          )}
          {address.type === "billing" && !address.isDefault && (
            <span className="px-2 py-1 bg-neutral-100 text-neutral-500 text-[11px] font-semibold uppercase tracking-wider rounded shrink-0">
              Billing
            </span>
          )}
        </div>

        <div className="space-y-2 pl-[52px]">
          <p className="font-semibold text-[#1A1714] text-[16px] capitalize">
            {address.fullName}
          </p>
          <div className="flex items-start gap-2.5 text-[14px] text-neutral-500 leading-snug">
            <MapPin
              size={13}
              className="text-neutral-500 mt-0.5 shrink-0"
            />
            <span>
              {address.addressLine1}
              {address.addressLine2 && `, ${address.addressLine2}`}
              {", "}
              {address.city}, {address.postalCode}
              {address.state && `, ${address.state}`}
              {", "}
              {address.country}
            </span>
          </div>
          <div className="flex items-center gap-2.5 text-[14px] text-neutral-500">
            <Phone size={13} className="text-neutral-500 shrink-0" />
            <span>{address.phone}</span>
          </div>
        </div>
      </div>

      <div className="px-5 py-4 flex items-center justify-between gap-3 bg-gray-100 rounded-b-xl mt-auto">
        <div>
          {!address.isDefault && (
            <button
              onClick={() => onSetDefault(address._id)}
              disabled={isSettingDefault}
              className="text-[13px] font-semibold text-[#F27318] hover:text-[#E6651B] transition-colors"
            >
              Set as Default
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onEdit(address)}
            className="flex items-center gap-1 text-[13px] font-semibold text-[#1A1714]/60 hover:text-[#1A1714] transition-colors"
          >
            <Pencil size={12} />
            Edit
          </button>
          <div className="w-px h-3 bg-neutral-200" />
          <button
            onClick={() => onDelete(address._id)}
            disabled={isDeleting}
            className="flex items-center gap-1 text-[13px] font-semibold text-neutral-500 hover:text-red-500 transition-colors"
          >
            <Trash2 size={12} />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
