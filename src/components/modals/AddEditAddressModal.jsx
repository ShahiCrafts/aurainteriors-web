import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Home, Building2, Users, MapPin, Loader2, Check, Truck, Receipt } from "lucide-react";
import { toast } from "react-toastify";
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

export default function AddEditAddressModal({ isOpen, onClose, address }) {
  const isEditing = !!address;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(addressSchema),
    mode: "onTouched",
    defaultValues: {
      label: "home",
      customLabel: "",
      type: "delivery",
      fullName: "",
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

  const isPending = isCreating || isUpdating;
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

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0B0D12]/60 backdrop-blur-sm">
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
                className="w-9 h-9 flex items-center justify-center bg-[#F5F6F8] text-[#6B7280] hover:bg-[#14151A] hover:text-white transition-colors rounded-[8px] border-none cursor-pointer shrink-0"
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
                          onClick={() => setValue("label", option.value, { shouldValidate: true })}
                          className={`flex flex-col items-center justify-center gap-1.5 py-3 rounded-[8px] border text-center transition-all ${
                            isSelected
                              ? "border-[#F27318] bg-[#FFF4EC] text-[#F27318]"
                              : "border-[#E5E7EB] bg-white hover:border-[#C7CBD1] text-[#6B7280]"
                          }`}
                        >
                          <Icon size={17} strokeWidth={isSelected ? 2.4 : 2} />
                          <span className="text-[11px] font-semibold">
                            {option.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {currentLabel === "other" && (
                    <div className="flex flex-col gap-1.5 mt-3">
                      <input
                        type="text"
                        {...register("customLabel")}
                        placeholder="Custom label, e.g. Parents' Home"
                        className="w-full h-[40px] px-3.5 border border-[#E5E7EB] rounded-[8px] focus:border-[#F27318] focus:ring-1 focus:ring-[#F27318] outline-none transition-all text-[13.5px] bg-white"
                      />
                      {errors.customLabel && (
                        <p className="text-[11.5px] text-red-500 font-medium">
                          {errors.customLabel.message}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="mb-6">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#9AA1AC]">
                    Address Type
                  </span>
                  <div className="flex flex-col gap-2 mt-3">
                    {typeOptions.map((option) => {
                      const Icon = option.icon;
                      const isSelected = currentType === option.value;
                      return (
                        <label
                          key={option.value}
                          className={`flex items-center gap-3 pl-3 pr-3.5 py-2.5 rounded-[8px] border cursor-pointer transition-all ${
                            isSelected
                              ? "border-[#F27318] bg-[#FFF4EC]"
                              : "border-[#E5E7EB] bg-white hover:border-[#C7CBD1]"
                          }`}
                        >
                          <span
                            className={`w-8 h-8 shrink-0 flex items-center justify-center rounded-[7px] border transition-all ${
                              isSelected
                                ? "border-[#F27318] bg-white text-[#F27318]"
                                : "border-[#E5E7EB] bg-[#FAFAFB] text-[#9AA1AC]"
                            }`}
                          >
                            <Icon size={15} strokeWidth={isSelected ? 2.4 : 2} />
                          </span>
                          <span
                            className={`flex-1 text-[13px] font-semibold ${
                              isSelected ? "text-[#F27318]" : "text-[#6B7280]"
                            }`}
                          >
                            {option.label}
                          </span>
                          <input
                            type="radio"
                            value={option.value}
                            {...register("type")}
                            className="sr-only"
                          />
                          {isSelected && (
                            <Check
                              size={15}
                              strokeWidth={2.6}
                              className="text-[#F27318] shrink-0"
                            />
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>

                <label
                  className={`flex items-start gap-2.5 px-3.5 py-3 rounded-[8px] border cursor-pointer transition-all ${
                    currentIsDefault
                      ? "border-[#F27318] bg-[#FFF4EC]"
                      : "border-[#E5E7EB] bg-white hover:border-[#C7CBD1]"
                  }`}
                >
                  <input
                    type="checkbox"
                    {...register("isDefault")}
                    className="w-4 h-4 mt-0.5 rounded border-[#D1D5DB] text-[#F27318] focus:ring-[#F27318] cursor-pointer accent-[#F27318]"
                  />
                  <span className="text-[13px] leading-snug text-[#4B5563]">
                    <span className="block font-semibold text-[#14151A]">
                      Set as default
                    </span>
                    Used automatically at checkout.
                  </span>
                </label>
              </div>

              {/* Right — details */}
              <div className="flex-1 min-w-0 flex flex-col">
                <div className="flex-1 overflow-y-auto px-7 py-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-5">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[13px] font-semibold text-[#374151]">
                        Full Name
                      </label>
                      <input
                        type="text"
                        {...register("fullName")}
                        placeholder="John Doe"
                        className="w-full h-[42px] px-3.5 border border-[#E5E7EB] rounded-[8px] focus:border-[#F27318] focus:ring-1 focus:ring-[#F27318] outline-none transition-all text-[14px]"
                      />
                      {errors.fullName && (
                        <p className="text-[11.5px] text-red-500 font-medium">
                          {errors.fullName.message}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[13px] font-semibold text-[#374151]">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        {...register("phone")}
                        placeholder="+977 98XXXXXXXX"
                        className="w-full h-[42px] px-3.5 border border-[#E5E7EB] rounded-[8px] focus:border-[#F27318] focus:ring-1 focus:ring-[#F27318] outline-none transition-all text-[14px]"
                      />
                      {errors.phone && (
                        <p className="text-[11.5px] text-red-500 font-medium">
                          {errors.phone.message}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col gap-1.5 sm:col-span-2">
                      <label className="text-[13px] font-semibold text-[#374151]">
                        Address Line 1
                      </label>
                      <input
                        type="text"
                        {...register("addressLine1")}
                        placeholder="Street address, P.O. box"
                        className="w-full h-[42px] px-3.5 border border-[#E5E7EB] rounded-[8px] focus:border-[#F27318] focus:ring-1 focus:ring-[#F27318] outline-none transition-all text-[14px]"
                      />
                      {errors.addressLine1 && (
                        <p className="text-[11.5px] text-red-500 font-medium">
                          {errors.addressLine1.message}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col gap-1.5 sm:col-span-2">
                      <label className="text-[13px] font-semibold text-[#374151]">
                        Address Line 2{" "}
                        <span className="text-[#9AA1AC] font-normal">(Optional)</span>
                      </label>
                      <input
                        type="text"
                        {...register("addressLine2")}
                        placeholder="Apartment, suite, unit, floor, etc."
                        className="w-full h-[42px] px-3.5 border border-[#E5E7EB] rounded-[8px] focus:border-[#F27318] focus:ring-1 focus:ring-[#F27318] outline-none transition-all text-[14px]"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[13px] font-semibold text-[#374151]">
                        City
                      </label>
                      <input
                        type="text"
                        {...register("city")}
                        placeholder="Kathmandu"
                        className="w-full h-[42px] px-3.5 border border-[#E5E7EB] rounded-[8px] focus:border-[#F27318] focus:ring-1 focus:ring-[#F27318] outline-none transition-all text-[14px]"
                      />
                      {errors.city && (
                        <p className="text-[11.5px] text-red-500 font-medium">
                          {errors.city.message}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[13px] font-semibold text-[#374151]">
                        Postal Code
                      </label>
                      <input
                        type="text"
                        {...register("postalCode")}
                        placeholder="44600"
                        className="w-full h-[42px] px-3.5 border border-[#E5E7EB] rounded-[8px] focus:border-[#F27318] focus:ring-1 focus:ring-[#F27318] outline-none transition-all text-[14px]"
                      />
                      {errors.postalCode && (
                        <p className="text-[11.5px] text-red-500 font-medium">
                          {errors.postalCode.message}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[13px] font-semibold text-[#374151]">
                        State / Province{" "}
                        <span className="text-[#9AA1AC] font-normal">(Optional)</span>
                      </label>
                      <input
                        type="text"
                        {...register("state")}
                        placeholder="Bagmati"
                        className="w-full h-[42px] px-3.5 border border-[#E5E7EB] rounded-[8px] focus:border-[#F27318] focus:ring-1 focus:ring-[#F27318] outline-none transition-all text-[14px]"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[13px] font-semibold text-[#374151]">
                        Country
                      </label>
                      <input
                        type="text"
                        {...register("country")}
                        placeholder="Nepal"
                        className="w-full h-[42px] px-3.5 border border-[#E5E7EB] rounded-[8px] focus:border-[#F27318] focus:ring-1 focus:ring-[#F27318] outline-none transition-all text-[14px]"
                      />
                      {errors.country && (
                        <p className="text-[11.5px] text-red-500 font-medium">
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
                    className="h-[42px] px-5 border border-[#E5E7EB] rounded-[8px] text-[#4B5563] font-semibold text-[13.5px] hover:bg-[#F5F6F8] transition-all cursor-pointer bg-transparent"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="h-[42px] px-6 bg-[#F27318] hover:bg-[#D9620E] text-white font-semibold text-[13.5px] rounded-[8px] transition-all disabled:opacity-50 disabled:cursor-not-allowed border-none cursor-pointer flex items-center justify-center gap-2 min-w-[140px]"
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
    </AnimatePresence>
  );
}