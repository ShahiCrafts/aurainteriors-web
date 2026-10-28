import { useState } from "react";
import { Plus, MapPin, Map } from "lucide-react";
import { toast } from "../../lib/toast";
import {
  useAddresses,
  useDeleteAddress,
  useSetDefaultAddress,
} from "../../hooks/profile/useAddressTan";
import AddEditAddressModal from "../modals/AddEditAddressModal";
import ConfirmationDialog from "../modals/ConfirmationDialog";
import AddressCard from "./AddressCard";
import formatError from "../../utils/errorHandler";
import Skeleton, { AddressSkeleton } from "../common/Skeleton";

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

  if (isLoading) {
    return (
      <div className="h-full flex flex-col space-y-6">
        {/* Header Info */}
        <div className="flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-[18px] font-semibold text-[#1A1714]">
              Saved Addresses
            </h2>
            <p className="text-[14px] text-neutral-400 mt-1">
              Manage your delivery locations and billing addresses for quick
              checkout.
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
          <h3 className="text-[16px] font-bold text-[#1A1714]">
            Unable to Load Addresses
          </h3>
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
          <h2 className="text-[18px] font-semibold text-[#1A1714]">
            Saved Addresses
          </h2>
          <p className="text-[14px] text-neutral-400 mt-1">
            Manage your delivery locations and billing addresses for quick
            checkout.
          </p>
        </div>
        {!isEmpty && (
          <button
            onClick={handleAddNew}
            aria-label="Add new address"
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
          <h3 className="text-[18px] font-semibold text-[#1A1714]">
            No addresses saved
          </h3>
          <p className="text-[14px] text-neutral-400 max-w-xs mt-1.5 mb-7 leading-relaxed">
            Please register your default shipping or billing addresses for a
            faster checkout flow.
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
          {/* Phase 6 (REUSE-013): the card is components/profile/
              AddressCard; this page owns the modal/delete/default
              state and passes callbacks down. */}
          {addresses.map((address) => (
            <AddressCard
              key={address._id}
              address={address}
              onEdit={handleEdit}
              onDelete={confirmDelete}
              onSetDefault={handleSetDefault}
              isDeleting={isDeleting}
              isSettingDefault={isSettingDefault}
            />
          ))}
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
