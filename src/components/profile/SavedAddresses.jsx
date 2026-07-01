import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Plus,
  Home,
  Building2,
  Users,
  MapPin,
  Phone,
  Pencil,
  Trash2,
} from "lucide-react";
import { toast } from "react-toastify";
import {
  useAddresses,
  useDeleteAddress,
  useSetDefaultAddress,
} from "../../hooks/profile/useAddressTan";
import AddEditAddressModal from "../modals/AddEditAddressModal";
import ConfirmationDialog from "../modals/ConfirmationDialog";
import formatError from "../../utils/errorHandler";

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

export default function SavedAddresses() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState(null);

  const { data, isLoading, error } = useAddresses();
  const { mutate: deleteAddress, isPending: isDeleting } = useDeleteAddress();
  const { mutate: setDefault, isPending: isSettingDefault } =
    useSetDefaultAddress();

  const addresses = data || [];

  const [isFab, setIsFab] = useState(false);
  const [fabLeft, setFabLeft] = useState(null);
  const [isPastSection, setIsPastSection] = useState(false);
  const gridRef = useRef(null);

  useEffect(() => {
    const checkOverflow = () => {
      if (!gridRef.current) {
        setIsFab(false);
        return;
      }
      const rect = gridRef.current.getBoundingClientRect();
      const footerEl = document.querySelector("footer");
      const footerRect = footerEl?.getBoundingClientRect();
      const footerIsVisible = footerRect ? footerRect.top < window.innerHeight - 96 : false;

      setIsFab(rect.bottom > 0 && !footerIsVisible);
      setFabLeft(rect.left + rect.width / 2);
    };

    checkOverflow();
    window.addEventListener("resize", checkOverflow);

    let observer;
    if (gridRef.current && "ResizeObserver" in window) {
      observer = new ResizeObserver(checkOverflow);
      observer.observe(gridRef.current);
    }

    return () => {
      window.removeEventListener("resize", checkOverflow);
      if (observer) observer.disconnect();
    };
  }, [addresses.length]);

  useEffect(() => {
    const checkSectionVisibility = () => {
      if (!gridRef.current) {
        setIsPastSection(false);
        return;
      }
      const rect = gridRef.current.getBoundingClientRect();
      const footerEl = document.querySelector("footer");
      const footerRect = footerEl?.getBoundingClientRect();
      const footerIsVisible = footerRect ? footerRect.top < window.innerHeight - 96 : false;

      // Hide once the footer starts entering the viewport so the FAB never overlaps it.
      setIsPastSection(rect.bottom < 0 || footerIsVisible);
    };

    checkSectionVisibility();
    window.addEventListener("scroll", checkSectionVisibility, { passive: true });
    window.addEventListener("resize", checkSectionVisibility);

    return () => {
      window.removeEventListener("scroll", checkSectionVisibility);
      window.removeEventListener("resize", checkSectionVisibility);
    };
  }, [addresses.length]);

  const handleEdit = (address) => {
    setEditingAddress(address);
    setModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingAddress(null);
    setModalOpen(true);
  };

  const handleDelete = () => {
    deleteAddress(addressToDelete, {
      onSuccess: () => {
        toast.success("Address deleted successfully");
        setDeleteModalOpen(false);
        setAddressToDelete(null);
      },
      onError: (err) => {
        toast.error(formatError(err, "Failed to delete address"));
      },
    });
  };

  const confirmDelete = (id) => {
    setAddressToDelete(id);
    setDeleteModalOpen(true);
  };

  const handleSetDefault = (id) => {
    setDefault(id, {
      onSuccess: () => {
        toast.success("Default address updated");
      },
      onError: (err) => {
        toast.error(formatError(err, "Failed to set default address"));
      },
    });
  };

  const getIcon = (label) => {
    const Icon = labelIcons[label?.toLowerCase()] || MapPin;
    return Icon;
  };

  const getIconColor = (label) => {
    return labelColors[label?.toLowerCase()] || labelColors.other;
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-8">
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-teal-700 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-8">
        <div className="text-center text-red-500 py-8">
          Failed to load addresses. Please try again.
        </div>
      </div>
    );
  }

  const isEmpty = addresses.length === 0;

  return (
    <div className="space-y-6">
      {isEmpty ? (
        <div className="flex flex-col items-center justify-center gap-3 pt-8 pb-4">
          <button
            onClick={handleAddNew}
            className="w-11 h-11 rounded-full bg-neutral-100 hover:bg-[#F27318] group flex items-center justify-center transition-colors"
          >
            <Plus
              size={20}
              className="text-neutral-400 group-hover:text-white transition-colors"
            />
          </button>
          <p className="text-[13px] text-neutral-400 font-dm-sans">
            No saved addresses yet
          </p>
        </div>
      ) : (
        <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((address) => {
            const Icon = getIcon(address.label);
            const iconColor = getIconColor(address.label);
            const displayLabel =
              address.label === "other" && address.customLabel
                ? address.customLabel
                : address.label;

            return (
              <div
                key={address._id}
                className="bg-white rounded-lg border border-neutral-200 flex flex-col hover:border-neutral-300 transition-colors"
              >
                <div className="p-5">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${iconColor}`}
                      >
                        <Icon size={16} />
                      </div>
                      <div className="min-w-0 flex items-baseline gap-1.5">
                        <h3 className="text-[15px] font-semibold text-[#1A1714] font-dm-sans capitalize leading-tight truncate">
                          {displayLabel}
                        </h3>
                        <span className="text-[12px] capitalize text-neutral-400 font-medium shrink-0">
                          · {address.type}
                        </span>
                      </div>
                    </div>
                    {address.isDefault && (
                      <span className="px-2 py-0.5 bg-[#F27318] text-white text-[10px] font-bold uppercase tracking-wider rounded font-dm-sans shrink-0">
                        Default
                      </span>
                    )}
                    {address.type === "billing" && !address.isDefault && (
                      <span className="px-2 py-0.5 bg-neutral-100 text-neutral-500 text-[10px] font-bold uppercase tracking-wider rounded font-dm-sans shrink-0">
                        Billing
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5 pl-[46px]">
                    <p className="font-semibold text-[#1A1714] font-dm-sans text-[14px] capitalize">
                      {address.fullName}
                    </p>
                    <div className="flex items-start gap-2.5 text-[13px] text-neutral-500 font-dm-sans leading-snug">
                      <MapPin
                        size={14}
                        className="text-neutral-300 mt-0.5 shrink-0"
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
                    <div className="flex items-center gap-2.5 text-[13px] text-neutral-500 font-dm-sans">
                      <Phone size={14} className="text-neutral-300 shrink-0" />
                      <span>{address.phone}</span>
                    </div>
                  </div>
                </div>

                <div className="px-5 py-3 border-t border-neutral-100 flex items-center justify-between gap-3">
                  <div>
                    {!address.isDefault && (
                      <button
                        onClick={() => handleSetDefault(address._id)}
                        disabled={isSettingDefault}
                        className="text-[12px] font-semibold text-[#F27318] hover:text-[#E6651B] transition-colors font-dm-sans"
                      >
                        Set as Default
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleEdit(address)}
                      className="flex items-center gap-1.5 text-[12px] font-semibold text-neutral-500 hover:text-neutral-900 transition-colors font-dm-sans"
                    >
                      <Pencil size={13} />
                      Edit
                    </button>
                    <div className="w-px h-3 bg-neutral-200" />
                    <button
                      onClick={() => confirmDelete(address._id)}
                      disabled={isDeleting}
                      className="flex items-center gap-1.5 text-[12px] font-semibold text-neutral-500 hover:text-red-500 transition-colors font-dm-sans"
                    >
                      <Trash2 size={13} />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {!isFab && (
            <button
              onClick={handleAddNew}
              className={`rounded-lg flex items-center justify-center min-h-[120px] group ${
                addresses.length % 2 === 0 ? "col-span-1 md:col-span-2" : ""
              }`}
            >
              <div className="w-11 h-11 rounded-full bg-neutral-100 group-hover:bg-[#F27318] flex items-center justify-center transition-colors">
                <Plus
                  size={20}
                  className="text-neutral-400 group-hover:text-white transition-colors"
                />
              </div>
            </button>
          )}
        </div>
      )}

      {!isEmpty &&
        isFab &&
        !isPastSection &&
        createPortal(
          <button
            onClick={handleAddNew}
            aria-label="Add new address"
            style={fabLeft !== null ? { left: fabLeft } : undefined}
            className="fixed bottom-8 -translate-x-1/2 z-40 w-11 h-11 rounded-full bg-neutral-100 hover:bg-[#F27318] shadow-lg flex items-center justify-center transition-colors group"
          >
            <Plus
              size={20}
              className="text-neutral-400 group-hover:text-white transition-colors"
            />
          </button>,
          document.body
        )}

      <AddEditAddressModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingAddress(null);
        }}
        address={editingAddress}
      />

      <ConfirmationDialog
        isOpen={deleteModalOpen}
        title="Delete Address?"
        message="Are you sure you want to delete this address? This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => {
          setDeleteModalOpen(false);
          setAddressToDelete(null);
        }}
        confirmText="Delete"
        isLoading={isDeleting}
      />
    </div>
  );
}