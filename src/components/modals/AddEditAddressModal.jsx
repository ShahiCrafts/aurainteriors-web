import { useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Home, Building2, Users, MapPin, Loader2, Check, Truck, Receipt } from "lucide-react";
import { toast } from "react-toastify";
import * as yup from "yup";
import {
  useCreateAddress,
  useUpdateAddress,
} from "../../hooks/profile/useAddressTan";
import formatError from "../../utils/errorHandler";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { addressSchema } from "../../utils/validationSchemas";

const labelOptions = [
  { value: "home", label: "Home", icon: Home },
  { value: "office", label: "Office", icon: Building2 },
  { value: "family", label: "Family", icon: Users },
  { value: "other", label: "Other", icon: MapPin },
];

const typeOptions = [
  { value: "delivery", label: "Delivery Address", icon: Truck },
  { value: "billing", label: "Billing Address", icon: Receipt },
];

export default function AddEditAddressModal({
  isOpen,
  onClose,
  address,
  isGuest = false,
  onSubmitOverride,
  isPendingOverride,
}) {
  const isEditing = !!address;

  const schema = isGuest
    ? addressSchema.shape({
        email: yup.string().email("Invalid email").required("Email is required"),
      })
    : addressSchema;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    mode: "onTouched",
    defaultValues: {
      label: "home",
      customLabel: "",
      type: "delivery",
      fullName: "",
      email: "",
      phone: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      postalCode: "",
      country: "Nepal",
      isDefault: false,
    },
  });

  const { mutate: createAddress, isPending: isCreating } = useCreateAddress();
  const { mutate: updateAddress, isPending: isUpdating } = useUpdateAddress();

  const isPending = isPendingOverride ?? (isCreating || isUpdating);
  const currentLabel = watch("label");
  const currentType = watch("type");
  const currentIsDefault = watch("isDefault");

  useEffect(() => {
    if (isOpen) {
      if (address) {
        reset({
          label: address.label || "home",
          customLabel: address.customLabel || "",
          type: address.type || "delivery",
          fullName: address.fullName || "",
          email: address.email || "",
          phone: address.phone || "",
          addressLine1: address.addressLine1 || "",
          addressLine2: address.addressLine2 || "",
          city: address.city || "",
          state: address.state || "",
          postalCode: address.postalCode || "",
          country: address.country || "Nepal",
          isDefault: address.isDefault || false,
        });
      } else {
        reset({
          label: "home",
          customLabel: "",
          type: "delivery",
          fullName: "",
          email: "",
          phone: "",
          addressLine1: "",
          addressLine2: "",
          city: "",
          state: "",
          postalCode: "",
          country: "Nepal",
          isDefault: false,
        });
      }
    }
  }, [isOpen, address, reset]);

  const onSubmit = (data) => {
    const payload = { ...data };
    if (payload.label !== "other") {
      payload.customLabel = "";
    }

    if (onSubmitOverride) {
      onSubmitOverride(payload);
      return;
    }

    if (isEditing) {
      updateAddress(
        { id: address._id, data: payload },
        {
          onSuccess: () => {
            toast.success("Address updated successfully");
            onClose();
          },
          onError: (err) => {
            toast.error(formatError(err, "Failed to update address"));
          },
        }
      );
    } else {
      createAddress(payload, {
        onSuccess: () => {
          toast.success("Address added successfully");
          onClose();
        },
        onError: (err) => {
          toast.error(formatError(err, "Failed to add address"));
        },
      });
    }
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-[#0B0D12]/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 12 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="bg-white w-full max-w-[840px] max-h-[88vh] rounded-[14px] overflow-hidden relative shadow-[0_24px_70px_rgba(15,23,42,0.35)] border border-[#EEF0F3] font-dm-sans flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-7 py-5 border-b border-[#EEF0F3] shrink-0">
              <div>
                <h3 className="text-[19px] font-bold text-[#14151A] tracking-tight">
                  {isEditing ? "Update Address" : "Add New Address"}
                </h3>
                <p className="text-[#6B7280] text-[13px] mt-0.5">
                  {isEditing
                    ? "Modify your saved location details."
                    : "Save a delivery or billing location to your account."}
                </p>
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className="w-9 h-9 flex items-center justify-center bg-[#F5F6F8] text-[#6B7280] hover:bg-[#14151A] hover:text-white transition-colors rounded-lg border-none cursor-pointer shrink-0"
              >
                <X size={17} />
              </button>
            </div>

            {/* Body: horizontal split */}
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="flex flex-col md:flex-row flex-1 min-h-0"
            >
              {/* Left rail — classification */}
              <div className="w-full md:w-[320px] shrink-0 bg-[#FAFAFB] border-b md:border-b-0 md:border-r border-[#EEF0F3] px-6 py-6 overflow-y-auto">
                <div className="mb-6">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#9AA1AC]">
                    Label
                  </span>
                  <div className="grid grid-cols-2 gap-2.5 mt-3">
                    {labelOptions.map((option) => {
                      const Icon = option.icon;
                      const isSelected = currentLabel === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setValue("label", option.value)}
                          className={`h-11 px-4 rounded-lg border flex items-center gap-2.5 text-[13.5px] font-semibold transition-all cursor-pointer ${
                            isSelected
                              ? "bg-white border-[#F27318] text-[#F27318] shadow-[0_2px_8px_rgba(242,115,24,0.08)]"
                              : "bg-transparent border-[#E5E7EB] text-[#4B5563] hover:border-[#D1D5DB] hover:bg-white"
                          }`}
                        >
                          <Icon
                            size={16}
                            className={isSelected ? "text-[#F27318]" : "text-[#9CA3AF]"}
                          />
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {currentLabel === "other" && (
                  <div className="mb-6 animate-in fade-in slide-in-from-top-2 duration-200">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[#9AA1AC]">
                      Custom Label
                    </label>
                    <input
                      type="text"
                      {...register("customLabel")}
                      placeholder="e.g. Vacation House"
                      className="w-full h-[42px] px-3.5 mt-2 border border-[#E5E7EB] rounded-lg focus:border-[#F27318] focus:ring-1 focus:ring-[#F27318] outline-none transition-all text-[14px]"
                    />
                    {errors.customLabel && (
                      <p className="text-[11.5px] text-red-500 font-medium mt-1">
                        {errors.customLabel.message}
                      </p>
                    )}
                  </div>
                )}

                <div className="mb-6">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#9AA1AC]">
                    Address Type
                  </span>
                  <div className="flex flex-col gap-2 mt-3">
                    {typeOptions.map((option) => {
                      const Icon = option.icon;
                      const isSelected = currentType === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setValue("type", option.value)}
                          className={`h-12 px-4 rounded-lg border flex items-center justify-between text-[13.5px] font-semibold transition-all cursor-pointer ${
                            isSelected
                              ? "bg-white border-[#F27318] text-[#F27318] shadow-[0_2px_8px_rgba(242,115,24,0.08)]"
                              : "bg-transparent border-[#E5E7EB] text-[#4B5563] hover:border-[#D1D5DB] hover:bg-white"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <Icon
                              size={16}
                              className={isSelected ? "text-[#F27318]" : "text-[#9CA3AF]"}
                            />
                            {option.label}
                          </div>
                          {isSelected && (
                            <div className="w-5 h-5 rounded-full bg-[#FFF8F2] flex items-center justify-center">
                              <Check size={11} className="text-[#F27318]" strokeWidth={3} />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setValue("isDefault", !currentIsDefault)}
                    className="flex items-center gap-3 text-left bg-transparent border-none cursor-pointer p-0 group"
                  >
                    <div
                      className={`w-[18px] h-[18px] rounded-sm border flex items-center justify-center transition-all ${
                        currentIsDefault
                          ? "bg-[#F27318] border-[#F27318]"
                          : "border-[#D1D5DB] group-hover:border-[#9CA3AF]"
                      }`}
                    >
                      {currentIsDefault && <Check size={12} className="text-white" strokeWidth={3} />}
                    </div>
                    <span className="text-[13.5px] font-semibold text-[#374151] select-none">
                      Set as Default Address
                    </span>
                  </button>
                </div>
              </div>

              {/* Right rail — form details */}
              <div className="flex-1 flex flex-col min-h-0 bg-white">
                <div className="flex-1 p-7 overflow-y-auto space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[11px] font-bold uppercase tracking-wider text-[#9AA1AC]">
                        Full Name
                      </label>
                      <input
                        type="text"
                        {...register("fullName")}
                        placeholder="John Doe"
                        className="w-full h-[42px] px-3.5 mt-2 border border-[#E5E7EB] rounded-lg focus:border-[#F27318] focus:ring-1 focus:ring-[#F27318] outline-none transition-all text-[14px]"
                      />
                      {errors.fullName && (
                        <p className="text-[11.5px] text-red-500 font-medium mt-1">
                          {errors.fullName.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="text-[11px] font-bold uppercase tracking-wider text-[#9AA1AC]">
                        Phone Number
                      </label>
                      <input
                        type="text"
                        {...register("phone")}
                        placeholder="98XXXXXXXX"
                        className="w-full h-[42px] px-3.5 mt-2 border border-[#E5E7EB] rounded-lg focus:border-[#F27318] focus:ring-1 focus:ring-[#F27318] outline-none transition-all text-[14px]"
                      />
                      {errors.phone && (
                        <p className="text-[11.5px] text-red-500 font-medium mt-1">
                          {errors.phone.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {isGuest && (
                    <div>
                      <label className="text-[11px] font-bold uppercase tracking-wider text-[#9AA1AC]">
                        Email Address
                      </label>
                      <input
                        type="email"
                        {...register("email")}
                        placeholder="guest@example.com"
                        className="w-full h-[42px] px-3.5 mt-2 border border-[#E5E7EB] rounded-lg focus:border-[#F27318] focus:ring-1 focus:ring-[#F27318] outline-none transition-all text-[14px]"
                      />
                      {errors.email && (
                        <p className="text-[11.5px] text-red-500 font-medium mt-1">
                          {errors.email.message}
                        </p>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[#9AA1AC]">
                      Address Line 1
                    </label>
                    <input
                      type="text"
                      {...register("addressLine1")}
                      placeholder="Street address, P.O. box, company name"
                      className="w-full h-[42px] px-3.5 mt-2 border border-[#E5E7EB] rounded-lg focus:border-[#F27318] focus:ring-1 focus:ring-[#F27318] outline-none transition-all text-[14px]"
                    />
                    {errors.addressLine1 && (
                      <p className="text-[11.5px] text-red-500 font-medium mt-1">
                        {errors.addressLine1.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[#9AA1AC]">
                      Address Line 2 (Optional)
                    </label>
                    <input
                      type="text"
                      {...register("addressLine2")}
                      placeholder="Apartment, suite, unit, building, floor, etc."
                      className="w-full h-[42px] px-3.5 mt-2 border border-[#E5E7EB] rounded-lg focus:border-[#F27318] focus:ring-1 focus:ring-[#F27318] outline-none transition-all text-[14px]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[11px] font-bold uppercase tracking-wider text-[#9AA1AC]">
                        City
                      </label>
                      <input
                        type="text"
                        {...register("city")}
                        placeholder="Kathmandu"
                        className="w-full h-[42px] px-3.5 mt-2 border border-[#E5E7EB] rounded-lg focus:border-[#F27318] focus:ring-1 focus:ring-[#F27318] outline-none transition-all text-[14px]"
                      />
                      {errors.city && (
                        <p className="text-[11.5px] text-red-500 font-medium mt-1">
                          {errors.city.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="text-[11px] font-bold uppercase tracking-wider text-[#9AA1AC]">
                        State / Province
                      </label>
                      <input
                        type="text"
                        {...register("state")}
                        placeholder="Bagmati"
                        className="w-full h-[42px] px-3.5 mt-2 border border-[#E5E7EB] rounded-lg focus:border-[#F27318] focus:ring-1 focus:ring-[#F27318] outline-none transition-all text-[14px]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[11px] font-bold uppercase tracking-wider text-[#9AA1AC]">
                        Postal / ZIP Code
                      </label>
                      <input
                        type="text"
                        {...register("postalCode")}
                        placeholder="44600"
                        className="w-full h-[42px] px-3.5 mt-2 border border-[#E5E7EB] rounded-lg focus:border-[#F27318] focus:ring-1 focus:ring-[#F27318] outline-none transition-all text-[14px]"
                      />
                      {errors.postalCode && (
                        <p className="text-[11.5px] text-red-500 font-medium mt-1">
                          {errors.postalCode.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="text-[11px] font-bold uppercase tracking-wider text-[#9AA1AC]">
                        Country
                      </label>
                      <input
                        type="text"
                        {...register("country")}
                        placeholder="Nepal"
                        className="w-full h-[42px] px-3.5 mt-2 border border-[#E5E7EB] rounded-lg focus:border-[#F27318] focus:ring-1 focus:ring-[#F27318] outline-none transition-all text-[14px]"
                      />
                      {errors.country && (
                        <p className="text-[11.5px] text-red-500 font-medium mt-1">
                          {errors.country.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-7 py-4 border-t border-[#EEF0F3] shrink-0 bg-white">
                  <button
                    type="button"
                    onClick={onClose}
                    className="h-[42px] px-5 border border-[#E5E7EB] rounded-lg text-[#4B5563] font-semibold text-[13.5px] hover:bg-[#F5F6F8] transition-all cursor-pointer bg-transparent"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="h-[42px] px-6 bg-[#F27318] hover:bg-[#D9620E] text-white font-semibold text-[13.5px] rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed border-none cursor-pointer flex items-center justify-center gap-2 min-w-[140px]"
                  >
                    {isPending ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : isEditing ? (
                      "Update Address"
                    ) : (
                      "Add Address"
                    )}
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}