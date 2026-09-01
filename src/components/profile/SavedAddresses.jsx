import { useState } from "react";
import {
  Plus,
  Home,
  Building2,
  Users,
  MapPin,
  Phone,
  Pencil,
  Trash2,
  Map,
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
import Skeleton, { AddressSkeleton } from "../common/Skeleton";

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
      <div className="h-full flex flex-col space-y-6">
        {/* Header Info */}
        <div className="flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-[18px] font-semibold text-[#1A1714]">Saved Addresses</h2>
            <p className="text-[14px] text-neutral-400 mt-1">
              Manage your delivery locations and billing addresses for quick checkout.
            </p>
          </div>
          <Skeleton className="w-10 h-10 rounded-lg" />
        </div>

        {/* Address Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <AddressSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center border border-red-100/60">
          <MapPin size={22} className="text-red-500" />
        </div>
        <div className="text-center space-y-1">
          <h3 className="text-[16px] font-bold text-[#1A1714]">Unable to Load Addresses</h3>
          <p className="text-[13px] text-neutral-400 max-w-xs">
            We couldn't retrieve your saved addresses. Please try again later.
          </p>
        </div>
      </div>
    );
  }

  const isEmpty = addresses.length === 0;

  return (
    <div className="h-full flex flex-col space-y-6">
      {/* Header Info */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-[18px] font-semibold text-[#1A1714]">Saved Addresses</h2>
          <p className="text-[14px] text-neutral-400 mt-1">
            Manage your delivery locations and billing addresses for quick checkout.
          </p>
        </div>
        {!isEmpty && (
          <button
            onClick={handleAddNew}
            className="flex items-center gap-1.5 px-3 py-3 bg-[#F27318] rounded-lg text-[14px] font-medium text-white transition-all"
          >
            <Plus size={16} />
          </button>
        )}
      </div>

      {isEmpty ? (
        /* Empty State */
        <div className="flex-1 min-h-0 flex flex-col items-center justify-center text-center bg-neutral-50 rounded-2xl">
          <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center mb-5 text-[#F27318]">
            <Map size={26} />
          </div>
          <h3 className="text-[18px] font-semibold text-[#1A1714]">No addresses saved</h3>
          <p className="text-[14px] text-neutral-400 max-w-xs mt-1.5 mb-7 leading-relaxed">
            Please register your default shipping or billing addresses for a faster checkout flow.
          </p>
          <button
            onClick={handleAddNew}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#F27318] hover:bg-[#E6651B] text-white text-[14px] font-medium rounded-lg transition-all"
          >
            Add First Address
            <Plus size={14} />
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                className="bg-white rounded-xl border border-neutral-200 flex flex-col h-full transition-all"
              >
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
                        onClick={() => handleSetDefault(address._id)}
                        disabled={isSettingDefault}
                        className="text-[13px] font-semibold text-[#F27318] hover:text-[#E6651B] transition-colors"
                      >
                        Set as Default
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleEdit(address)}
                      className="flex items-center gap-1 text-[13px] font-semibold text-[#1A1714]/60 hover:text-[#1A1714] transition-colors"
                    >
                      <Pencil size={12} />
                      Edit
                    </button>
                    <div className="w-px h-3 bg-neutral-200" />
                    <button
                      onClick={() => confirmDelete(address._id)}
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
          })}

        </div>
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