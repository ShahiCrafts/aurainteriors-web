import { useEffect, useMemo, useState } from "react";
import { Truck, Check, MapPin, Home, Building2, Users, Edit3 } from "lucide-react";
import useCheckoutStore from "../../store/checkoutStore";
import useAuthStore from "../../store/authStore";
import { useAddresses } from "../../hooks/profile/useAddressTan";
import AddEditAddressModal from "../modals/AddEditAddressModal";
import PaymentStep from "./PaymentStep";

function AddressSummarySkeleton() {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
      <div className="px-5 md:px-6 py-5 animate-pulse">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-full bg-neutral-200 shrink-0" />
          <div className="flex-1 min-w-0 space-y-3">
            <div className="h-5 bg-neutral-200 rounded w-40" />
            <div className="h-4 bg-neutral-200 rounded w-56" />
            <div className="h-4 bg-neutral-200 rounded w-full max-w-md" />
          </div>
        </div>
      </div>
    </div>
  );
}

function AddressSkeletonCard() {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-neutral-200 shrink-0" />
        <div className="flex-1 space-y-3">
          <div className="h-4 bg-neutral-200 rounded w-24" />
          <div className="h-4 bg-neutral-200 rounded w-16" />
          <div className="h-4 bg-neutral-200 rounded w-full" />
        </div>
      </div>
    </div>
  );
}

export default function ShippingStep() {
  const {
    shippingMethod,
    setShippingMethod,
    shippingAddress,
    shippingAddressId,
    setShippingAddress,
    setShippingAddressId,
    currentStep,
    guestInfo,
    setGuestInfo,
  } = useCheckoutStore();
  const { isAuthenticated } = useAuthStore();
  const {
    data: addresses = [],
    isLoading: isAddressesLoading,
    isFetching: isAddressesFetching,
  } = useAddresses({ enabled: isAuthenticated });
  const [isAddressDrawerOpen, setIsAddressDrawerOpen] = useState(false);
  const [isAddAddressModalOpen, setIsAddAddressModalOpen] = useState(false);
  const [drawerSelectedAddressId, setDrawerSelectedAddressId] = useState(null);
  const [drawerOriginalAddressId, setDrawerOriginalAddressId] = useState(null);

  const selectedAddress = useMemo(() => {
    if (!isAuthenticated) {
      return shippingAddressId ? shippingAddress : null;
    }
    if (!addresses.length) return null;
    return (
      addresses.find((address) => address._id === shippingAddressId) ||
      addresses.find((address) => address.isDefault) ||
      addresses[0] ||
      null
    );
  }, [isAuthenticated, addresses, shippingAddress, shippingAddressId]);

  const drawerSelectedAddress = useMemo(() => {
    if (!addresses.length) return null;
    const targetId = drawerSelectedAddressId || selectedAddress?._id;
    return (
      addresses.find((address) => address._id === targetId) ||
      selectedAddress ||
      null
    );
  }, [addresses, drawerSelectedAddressId, selectedAddress]);

  // Sync shippingAddress store state with default address on first fetch
  useEffect(() => {
    if (isAuthenticated && selectedAddress && !shippingAddressId) {
      setShippingAddressId(selectedAddress._id);
      setShippingAddress(selectedAddress);
    }
  }, [isAuthenticated, selectedAddress, shippingAddressId, setShippingAddressId, setShippingAddress]);

  const addressLabelIcons = {
    home: Home,
    office: Building2,
    family: Users,
    other: MapPin,
  };

  useEffect(() => {
    if (!isAddressDrawerOpen) return;

    setDrawerOriginalAddressId(shippingAddressId || selectedAddress?._id || null);
    setDrawerSelectedAddressId(shippingAddressId || selectedAddress?._id || null);
  }, [isAddressDrawerOpen, selectedAddress, shippingAddressId]);

  useEffect(() => {
    if (isAddressDrawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isAddressDrawerOpen]);

  const handleSelectAddress = (address) => {
    setDrawerSelectedAddressId(address._id);
  };

  const handleOpenDrawer = () => {
    setIsAddressDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsAddressDrawerOpen(false);
  };

  const handleCancelDrawer = () => {
    setDrawerSelectedAddressId(drawerOriginalAddressId);
    setIsAddressDrawerOpen(false);
  };

  const handleSaveDrawer = () => {
    if (drawerSelectedAddress) {
      setShippingAddressId(drawerSelectedAddress._id);
      setShippingAddress(drawerSelectedAddress);
    }
    setIsAddressDrawerOpen(false);
  };

  const handleAddNewAddress = () => {
    setIsAddressDrawerOpen(false);
    setIsAddAddressModalOpen(true);
  };

  const handleSaveGuestAddress = (addressData) => {
    const nameParts = addressData.fullName.trim().split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    setGuestInfo({
      email: addressData.email || guestInfo.email || "",
      firstName,
      lastName,
      phone: addressData.phone,
    });
    setShippingAddress(addressData);
    setShippingAddressId("guest_temp");
    setIsAddAddressModalOpen(false);
  };

  const deliveryOptions = [
    {
      id: "standard",
      icon: Truck,
      title: "Standard Shipping",
      subtitle: "5-7 business days",
      price: "FREE",
    },
    {
      id: "express",
      icon: Truck,
      title: "Express Priority",
      subtitle: "2-3 business days",
      price: "NRs. 100",
    },
  ];

  if (isAddressesLoading) {
    return <AddressSummarySkeleton />;
  }

  const IconComponent = selectedAddress
    ? addressLabelIcons[selectedAddress.label?.toLowerCase()] || MapPin
    : MapPin;

  return (
    <div className="space-y-8 font-dm-sans">
      {/* Shipping Address Display Card */}
      {selectedAddress && (
        <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
          <div className="px-5 md:px-6 py-5">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-full bg-[#FFF8F2] text-[#F27318] flex items-center justify-center shrink-0">
                <IconComponent size={20} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3 flex-wrap">
                    <p className="text-[18px] font-semibold text-[#1A1714]">
                      {selectedAddress.fullName}
                    </p>
                    <span className="px-3 py-1 rounded-full bg-[#F27318] text-white text-[10px] font-black uppercase tracking-wider">
                      {selectedAddress.label === "other" && selectedAddress.customLabel
                        ? selectedAddress.customLabel
                        : selectedAddress.label}
                    </span>
                  </div>

                  {/* Render edit option on step 1 only */}
                  {currentStep === 1 && (
                    <button
                      type="button"
                      onClick={isAuthenticated ? handleOpenDrawer : () => setIsAddAddressModalOpen(true)}
                      className="text-[13px] font-semibold text-[#F27318] hover:text-[#D9620E] transition-colors flex items-center gap-1.5"
                    >
                      <Edit3 size={14} />
                      Edit Address
                    </button>
                  )}
                </div>

                <div className="mt-1 flex items-center gap-3 flex-wrap text-[15px] text-neutral-700">
                  <span>{selectedAddress.phone}</span>
                </div>

                <p className="mt-3 text-[15px] leading-relaxed text-neutral-600 max-w-4xl font-dm-sans">
                  {selectedAddress.addressLine1}
                  {selectedAddress.addressLine2 ? `, ${selectedAddress.addressLine2}` : ""}
                  {selectedAddress.city ? `, ${selectedAddress.city}` : ""}
                  {selectedAddress.state ? `, ${selectedAddress.state}` : ""}
                  {selectedAddress.postalCode ? ` ${selectedAddress.postalCode}` : ""}
                  {selectedAddress.country ? `, ${selectedAddress.country}` : ""}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {!isAddressesLoading && !selectedAddress && (
        <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-[#FFF8F2] text-[#F27318] flex items-center justify-center mx-auto mb-3">
            <MapPin size={20} />
          </div>
          <p className="text-[16px] font-semibold text-[#1A1714]">No saved address yet</p>
          <p className="text-[14px] text-neutral-500 mt-1 mb-4">
            Add a shipping address to continue with checkout.
          </p>
          <button
            type="button"
            onClick={handleAddNewAddress}
            className="inline-flex items-center justify-center h-11 px-6 rounded-xl bg-[#F27318] text-white text-[15px] font-semibold hover:bg-[#D9620E] transition-colors"
          >
            Add New Address
          </button>
        </div>
      )}

      {/* Conditionally swap Delivery Preference (Step 1) with Payment Options (Step 2) */}
      <div className="space-y-4 pt-4">
        <h3 className="text-[20px] font-semibold text-[#1A1714] font-dm-sans">
          {currentStep === 1 ? "Delivery Preference" : "Payment Options"}
        </h3>
        
        {currentStep === 1 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {deliveryOptions.map(({ id, icon: Icon, title, subtitle, price }) => {
              const selected = shippingMethod === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setShippingMethod(id)}
                  className={`relative flex items-center gap-4 p-5 rounded-xl border transition-all duration-300 text-left ${
                    selected
                      ? "border-[#F27318] bg-[#FFF8F2] ring-1 ring-[#F27318]/20"
                      : "border-neutral-200 bg-white hover:border-neutral-300"
                  }`}
                >
                  <div
                    className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                      selected ? "bg-[#F27318] text-white" : "bg-neutral-100 text-neutral-400"
                    }`}
                  >
                    <Icon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[16px] font-semibold text-[#1A1714]">{title}</p>
                    <p className="text-[14px] text-neutral-400 font-medium mt-0.5">{subtitle}</p>
                  </div>
                  <p className="text-[14px] font-bold text-[#F27318] shrink-0">{price}</p>
                  {selected && (
                    <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-[#F27318] flex items-center justify-center shadow-sm">
                      <Check size={11} className="text-white" strokeWidth={4} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <PaymentStep />
        )}
      </div>

      <>
        {/* Overlay */}
        <div
          className={`fixed inset-0 z-100 bg-black/40 h-screen transition-opacity duration-300 ${
            isAddressDrawerOpen
              ? "opacity-100 visible pointer-events-auto"
              : "opacity-0 invisible pointer-events-none"
          }`}
          onClick={handleCloseDrawer}
        />

        {/* Drawer */}
        <div
          className={`fixed top-0 right-0 z-101 h-full w-full sm:max-w-[460px] bg-white shadow-2xl transition-transform duration-300 ease-out flex flex-col font-dm-sans ${
            isAddressDrawerOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {/* Header */}
          <div className="shrink-0 px-6 pt-6 flex items-center justify-between">
            <h4 className="text-[20px] font-semibold text-[#1A1714]">
              Shipping Address
            </h4>

            <button
              type="button"
              onClick={handleAddNewAddress}
              className="text-[14px] font-medium text-[#F27318] hover:text-[#D9620E] transition-colors"
            >
              Add New Address
            </button>
          </div>

          {/* Address List */}
          <div className="flex-1 overflow-y-auto bg-gray-50/30 p-6 space-y-4">
            {isAddressesFetching ? (
              <>
                <AddressSkeletonCard />
                <AddressSkeletonCard />
                <AddressSkeletonCard />
              </>
            ) : (
              addresses.map((address) => {
                const Icon =
                  addressLabelIcons[address.label?.toLowerCase()] || MapPin;

                const isSelected =
                  drawerSelectedAddressId !== null
                    ? drawerSelectedAddressId === address._id
                    : selectedAddress?._id === address._id;

                return (
                  <button
                    key={address._id}
                    type="button"
                    onClick={() => handleSelectAddress(address)}
                    className="w-full text-left rounded-xl border border-neutral-200 bg-white p-4 transition-all duration-300 hover:border-neutral-300"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#F27318] text-white flex items-center justify-center shrink-0 mt-0.5">
                        <Icon size={16} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-[16px] font-semibold text-[#1A1714] truncate capitalize">
                              {address.label === "other" &&
                              address.customLabel
                                ? address.customLabel
                                : address.label}
                            </p>

                            <p className="text-[14px] capitalize text-neutral-400 mt-1">
                              {address.type} address
                            </p>
                          </div>

                          {isSelected && (
                            <div className="w-6 h-6 rounded-full bg-[#F27318] flex items-center justify-center shrink-0">
                              <Check
                                size={12}
                                className="text-white"
                                strokeWidth={4}
                              />
                            </div>
                          )}
                        </div>

                        <p className="mt-2 text-[14px] text-neutral-600 leading-relaxed">
                          <span className="font-semibold text-[#1A1714] text-[16px]">
                            {address.fullName}
                          </span>
                          <br />
                          {address.addressLine1}
                          {address.addressLine2
                            ? `, ${address.addressLine2}`
                            : ""}
                          <br />
                          {address.city}, {address.postalCode}
                          {address.state ? `, ${address.state}` : ""}
                          <br />
                          {address.country}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-neutral-200 p-6 bg-white">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleCancelDrawer}
                className="flex-1 h-12 rounded-xl border border-neutral-200 font-semibold hover:bg-neutral-50 transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSaveDrawer}
                className="flex-1 h-12 rounded-xl bg-[#F27318] hover:bg-[#D9620E] text-white font-semibold transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </>

      <AddEditAddressModal
        isOpen={isAddAddressModalOpen}
        onClose={() => setIsAddAddressModalOpen(false)}
        address={!isAuthenticated ? selectedAddress : null}
        isGuest={!isAuthenticated}
        onSubmitOverride={!isAuthenticated ? handleSaveGuestAddress : undefined}
      />
    </div>
  );
}