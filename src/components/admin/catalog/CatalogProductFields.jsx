import {
  useProductTypes,
  useRooms,
} from "../../../hooks/catalog/useCatalogTan";

// Phase 6 (catalog) — productType select + rooms multi-select for
// the admin product form's Basic tab. A child component (rather
// than hooks in the Products page itself) so the page's module
// surface — and the tests that render the list without opening the
// modal — stay untouched.
export default function CatalogProductFields({
  productType,
  onProductTypeChange,
  roomSlugs,
  onRoomSlugsChange,
}) {
  const { data: typesData } = useProductTypes();
  const productTypes = typesData?.data?.productTypes || [];
  const { data: roomsData } = useRooms();
  const rooms = roomsData?.data?.rooms || [];

  const toggleRoom = (slug, checked) => {
    onRoomSlugsChange(
      checked ? [...roomSlugs, slug] : roomSlugs.filter((s) => s !== slug),
    );
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label
          htmlFor="product-form-type"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Product Type
        </label>
        <select
          id="product-form-type"
          value={productType}
          onChange={(e) => onProductTypeChange(e.target.value)}
          className="w-full px-4 h-10 rounded-lg border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 outline-none text-sm transition-all bg-white"
        >
          <option value="">None (use the category's type)</option>
          {productTypes.map((type) => (
            <option key={type.key} value={type.key}>
              {type.label}
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-400 mt-1">
          Overrides the category's type for attribute resolution.
        </p>
      </div>
      <div>
        <span className="block text-sm font-medium text-gray-700 mb-2">
          Rooms
        </span>
        {rooms.length === 0 ? (
          <p className="text-xs text-gray-400 pt-2">No rooms defined yet.</p>
        ) : (
          <div className="flex flex-wrap gap-x-4 gap-y-2 pt-2">
            {rooms.map((room) => (
              <label
                key={room.slug}
                className="flex items-center gap-2 cursor-pointer text-sm text-gray-700"
              >
                <input
                  type="checkbox"
                  checked={roomSlugs.includes(room.slug)}
                  onChange={(e) => toggleRoom(room.slug, e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-[#025E5D] focus:ring-[#025E5D]"
                />
                {room.label}
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
