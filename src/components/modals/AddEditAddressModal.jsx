import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Home, Building2, Users, MapPin, Loader2 } from "lucide-react";
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
  { value: "delivery", label: "Delivery Address" },
  { value: "billing", label: "Billing Address" },
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white w-full max-w-[540px] rounded-[12px] overflow-hidden relative shadow-[0_20px_60px_rgba(0,0,0,0.3)] font-dm-sans"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-20 w-8 h-8 flex items-center justify-center bg-gray-100 text-gray-600 hover:bg-black hover:text-white transition-all rounded-[8px] border-none cursor-pointer"
            >
              <X size={18} />
            </button>

            {/* Form Content */}
            <div className="w-full p-8 md:p-10 bg-white overflow-y-auto max-h-[90vh]">
              <div className="mb-6">
                <h3 className="text-[24px] font-bold text-[#1A1714] mb-1">
                  {isEditing ? "Update Address" : "Add New Address"}
                </h3>
                <p className="text-[#64748B] text-[14px]">
                  {isEditing
                    ? "Modify your location details below."
                    : "Save a new delivery or billing location."}
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
                {/* Address Label */}
                <div>
                  <label className="text-[14px] font-medium text-[#1A1714] mb-2 block">
                    Address Label
                  </label>
                  <div className="grid grid-cols-4 gap-3">
                    {labelOptions.map((option) => {
                      const Icon = option.icon;
                      const isSelected = currentLabel === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setValue("label", option.value)}
                          className={`flex flex-col items-center gap-1.5 p-3 rounded-[8px] border transition-all ${
                            isSelected
                              ? "border-[#F27318] bg-[#F27318]/5 text-[#F27318]"
                              : "border-[#E2E8F0] hover:border-[#1A1714] text-[#64748B]"
                          }`}
                        >
                          <Icon size={18} />
                          <span className="text-[11px] font-bold uppercase tracking-tight">
                            {option.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {currentLabel === "other" && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[14px] font-medium text-[#1A1714]">
                      Custom Label *
                    </label>
                    <input
                      type="text"
                      {...register("customLabel")}
                      placeholder="e.g. Parents' Home"
                      className="w-full h-[44px] px-4 border border-[#E2E8F0] rounded-[8px] focus:border-[#F27318] focus:ring-1 focus:ring-[#F27318] outline-none transition-all text-[15px]"
                    />
                    {errors.customLabel && (
                      <p className="text-[12px] text-red-500 font-medium">
                        {errors.customLabel.message}
                      </p>
                    )}
                  </div>
                )}

                {/* Address Type */}
                <div>
                  <label className="text-[14px] font-medium text-[#1A1714] mb-2 block">
                    Address Type
                  </label>
                  <div className="flex gap-3">
                    {typeOptions.map((option) => (
                      <label
                        key={option.value}
                        className={`flex-1 flex items-center justify-center gap-2 h-[44px] rounded-[8px] border cursor-pointer transition-all ${
                          currentType === option.value
                            ? "border-[#F27318] bg-[#F27318]/5 text-[#F27318]"
                            : "border-[#E2E8F0] hover:border-[#1A1714] text-[#64748B]"
                        }`}
                      >
                        <input
                          type="radio"
                          value={option.value}
                          {...register("type")}
                          className="sr-only"
                        />
                        <span className="text-[13px] font-bold uppercase tracking-tight">
                          {option.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[14px] font-medium text-[#1A1714]">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      {...register("fullName")}
                      placeholder="John Doe"
                      className="w-full h-[44px] px-4 border border-[#E2E8F0] rounded-[8px] focus:border-[#F27318] focus:ring-1 focus:ring-[#F27318] outline-none transition-all text-[15px]"
                    />
                    {errors.fullName && (
                      <p className="text-[12px] text-red-500 font-medium">
                        {errors.fullName.message}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[14px] font-medium text-[#1A1714]">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      {...register("phone")}
                      placeholder="+977 98XXXXXXXX"
                      className="w-full h-[44px] px-4 border border-[#E2E8F0] rounded-[8px] focus:border-[#F27318] focus:ring-1 focus:ring-[#F27318] outline-none transition-all text-[15px]"
                    />
                    {errors.phone && (
                      <p className="text-[12px] text-red-500 font-medium">
                        {errors.phone.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[14px] font-medium text-[#1A1714]">
                    Address Line 1 *
                  </label>
                  <input
                    type="text"
                    {...register("addressLine1")}
                    placeholder="Street address, P.O. box"
                    className="w-full h-[44px] px-4 border border-[#E2E8F0] rounded-[8px] focus:border-[#F27318] focus:ring-1 focus:ring-[#F27318] outline-none transition-all text-[15px]"
                  />
                  {errors.addressLine1 && (
                    <p className="text-[12px] text-red-500 font-medium">
                      {errors.addressLine1.message}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[14px] font-medium text-[#1A1714]">
                    Address Line 2 (Optional)
                  </label>
                  <input
                    type="text"
                    {...register("addressLine2")}
                    placeholder="Apartment, suite, unit, floor, etc."
                    className="w-full h-[44px] px-4 border border-[#E2E8F0] rounded-[8px] focus:border-[#F27318] focus:ring-1 focus:ring-[#F27318] outline-none transition-all text-[15px]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[14px] font-medium text-[#1A1714]">
                      City *
                    </label>
                    <input
                      type="text"
                      {...register("city")}
                      placeholder="Kathmandu"
                      className="w-full h-[44px] px-4 border border-[#E2E8F0] rounded-[8px] focus:border-[#F27318] focus:ring-1 focus:ring-[#F27318] outline-none transition-all text-[15px]"
                    />
                    {errors.city && (
                      <p className="text-[12px] text-red-500 font-medium">
                        {errors.city.message}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[14px] font-medium text-[#1A1714]">
                      Postal Code *
                    </label>
                    <input
                      type="text"
                      {...register("postalCode")}
                      placeholder="44600"
                      className="w-full h-[44px] px-4 border border-[#E2E8F0] rounded-[8px] focus:border-[#F27318] focus:ring-1 focus:ring-[#F27318] outline-none transition-all text-[15px]"
                    />
                    {errors.postalCode && (
                      <p className="text-[12px] text-red-500 font-medium">
                        {errors.postalCode.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[14px] font-medium text-[#1A1714]">
                      State/Province
                    </label>
                    <input
                      type="text"
                      {...register("state")}
                      placeholder="Bagmati"
                      className="w-full h-[44px] px-4 border border-[#E2E8F0] rounded-[8px] focus:border-[#F27318] focus:ring-1 focus:ring-[#F27318] outline-none transition-all text-[15px]"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[14px] font-medium text-[#1A1714]">
                      Country *
                    </label>
                    <input
                      type="text"
                      {...register("country")}
                      placeholder="Nepal"
                      className="w-full h-[44px] px-4 border border-[#E2E8F0] rounded-[8px] focus:border-[#F27318] focus:ring-1 focus:ring-[#F27318] outline-none transition-all text-[15px]"
                    />
                    {errors.country && (
                      <p className="text-[12px] text-red-500 font-medium">
                        {errors.country.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 py-2">
                  <input
                    type="checkbox"
                    {...register("isDefault")}
                    className="w-4 h-4 rounded border-[#E2E8F0] text-[#F27318] focus:ring-[#F27318] cursor-pointer"
                  />
                  <label className="text-[14px] text-[#64748B] cursor-pointer hover:text-[#1A1714] transition-colors">
                    Set as default address
                  </label>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 h-[44px] border border-[#E2E8F0] rounded-[8px] text-[#64748B] font-semibold text-[14px] hover:bg-gray-50 transition-all cursor-pointer bg-transparent"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="flex-1 h-[44px] bg-[#F27318] hover:bg-[#D9620E] text-white font-semibold text-[14px] rounded-[8px] transition-all disabled:opacity-50 disabled:cursor-not-allowed border-none cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isPending ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : isEditing ? (
                      "Update Address"
                    ) : (
                      "Add Address"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
