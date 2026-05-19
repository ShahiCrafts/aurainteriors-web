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

  const addresses = data?.data?.addresses || [];

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

  return (
    <div className="space-y-6 px-6 sm:px-8">

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {addresses.map((address) => {
          const Icon = getIcon(address.label);
          const iconColor = getIconColor(address.label);

          return (
            <div
              key={address._id}
              className={`group relative bg-white rounded-2xl border transition-all duration-300 overflow-hidden flex flex-col h-full ${address.isDefault
                  ? "border-[#F27318]/20 shadow-md"
                  : "border-neutral-100 shadow-sm hover:border-neutral-200"
                }`}
            >
              <div className="p-6 flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconColor}`}
                    >
                      <Icon size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-neutral-900 font-dm-sans capitalize tracking-tight">
                        {address.label === "other"
                          ? address.customLabel
                          : address.label}
                      </h3>
                      <p className="text-[11px] font-black uppercase text-neutral-400 tracking-widest">
                        {address.type} Address
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {address.isDefault && (
                      <span className="px-2.5 py-1 bg-[#F27318] text-white text-[10px] font-black uppercase tracking-wider rounded-md font-dm-sans">
                        DEFAULT
                      </span>
                    )}
                    {address.type === "billing" && !address.isDefault && (
                      <span className="px-2.5 py-1 bg-neutral-100 text-neutral-600 text-[10px] font-black uppercase tracking-wider rounded-md font-dm-sans">
                        BILLING
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-3 mb-2">
                  <p className="font-bold text-neutral-900 font-dm-sans text-sm uppercase tracking-tight">
                    {address.fullName}
                  </p>
                  <div className="flex items-start gap-3 text-sm text-neutral-500 font-dm-sans leading-relaxed">
                    <MapPin
                      size={16}
                      className="text-neutral-300 mt-1 shrink-0"
                    />
                    <span>
                      {address.addressLine1}
                      {address.addressLine2 && `, ${address.addressLine2}`}
                      <br />
                      {address.city}, {address.postalCode}
                      <br />
                      {address.state && `${address.state}, `}
                      {address.country}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-neutral-500 font-dm-sans">
                    <Phone size={16} className="text-neutral-300" />
                    <span>{address.phone}</span>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 bg-neutral-50/50 border-t border-neutral-100 flex items-center justify-between gap-3 mt-auto">
                <div>
                  {!address.isDefault && (
                    <button
                      onClick={() => handleSetDefault(address._id)}
                      disabled={isSettingDefault}
                      className="text-[13px] font-bold text-[#F27318] hover:text-[#E6651B] transition-colors font-dm-sans uppercase tracking-wider"
                    >
                      Set as Default
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleEdit(address)}
                    className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-neutral-400 hover:text-neutral-900 transition-colors font-dm-sans"
                  >
                    <Pencil size={14} />
                    Edit
                  </button>
                  <div className="w-[1px] h-3 bg-neutral-200" />
                  <button
                    onClick={() => confirmDelete(address._id)}
                    disabled={isDeleting}
                    className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-neutral-400 hover:text-red-500 transition-colors font-dm-sans"
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        <button
          onClick={handleAddNew}
          className="p-8 rounded-2xl border-2 border-dashed border-neutral-200 hover:border-[#F27318] hover:bg-orange-50/30 transition-all duration-300 flex flex-col items-center justify-center gap-4 min-h-[260px] group bg-white"
        >
          <div className="w-14 h-14 rounded-full bg-neutral-100 group-hover:bg-[#F27318] flex items-center justify-center transition-all duration-500 group-hover:scale-110">
            <Plus
              size={28}
              className="text-neutral-400 group-hover:text-white transition-colors"
            />
          </div>
          <div className="text-center">
            <p className="font-bold text-neutral-900 group-hover:text-[#F27318] font-dm-sans transition-colors uppercase tracking-tight">
              Add New Address
            </p>
            <p className="text-xs text-neutral-400 font-dm-sans mt-1 tracking-wide">
              Securely save a new location
            </p>
          </div>
        </button>
      </div>

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
