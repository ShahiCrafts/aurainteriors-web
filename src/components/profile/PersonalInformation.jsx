import { useState, useRef, useEffect } from "react";
import { Upload, Trash2, Lock, Check, Camera, Loader } from "lucide-react";
import { toast } from "react-toastify";
import useAuthStore from "../../store/authStore";
import {
  useProfile,
  useUpdateProfile,
  useUpdateAvatar,
  useRemoveAvatar,
} from "../../hooks/profile/useProfileTan";

import { getAvatarUrl } from "../../utils/imageUrl";
import formatError from "../../utils/errorHandler";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { personalInfoSchema } from "../../utils/validationSchemas";

const currentYear = new Date().getFullYear();

export default function PersonalInformation() {
  const fileInputRef = useRef(null);
  const { user: authUser, signIn } = useAuthStore();


  const { data, isLoading } = useProfile();
  const { mutate: updateProfile, isPending: isUpdating } = useUpdateProfile();
  const { mutate: updateAvatar, isPending: isUploadingAvatar } =
    useUpdateAvatar();
  const { mutate: removeAvatar, isPending: isRemovingAvatar } =
    useRemoveAvatar();

  const user = data?.data?.user;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm({
    resolver: yupResolver(personalInfoSchema),
    mode: "onTouched",
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      gender: "",
      dateOfBirth: "",
    },
  });

  const gender = watch("gender");

  useEffect(() => {
    if (user) {
      reset({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phone: user.phone || "",
        gender: user.gender || "",
        dateOfBirth: user.dateOfBirth
          ? new Date(user.dateOfBirth).toISOString().split("T")[0]
          : "",
      });
    }
  }, [user, reset]);

  const handleCancel = () => {
    if (user) {
      reset({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phone: user.phone || "",
        gender: user.gender || "",
        dateOfBirth: user.dateOfBirth
          ? new Date(user.dateOfBirth).toISOString().split("T")[0]
          : "",
      });
    }
  };

  const onSubmit = (data) => {
    const updateData = {
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      gender: data.gender || null,
      dateOfBirth: data.dateOfBirth || null,
    };

    updateProfile(updateData, {
      onSuccess: (resData) => {
        toast.success("Profile updated successfully");
        // Reset form with new values to clear isDirty
        reset(data);
        if (resData?.data?.user) {
          const token = localStorage.getItem("token");
          signIn(resData.data.user, token);
        }
      },
      onError: (err) => {
        toast.error(formatError(err, "Failed to update profile"));
      },
    });
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }
      if (!file.type.startsWith("image/")) {
        toast.error("Please upload an image file");
        return;
      }
      updateAvatar(file, {
        onSuccess: (data) => {
          toast.success("Avatar updated successfully");
          if (data?.data?.user) {
            const token = localStorage.getItem("token");
            signIn(data.data.user, token);
          }
        },
        onError: (err) => {
          toast.error(formatError(err, "Failed to update avatar"));
        },
      });
    }
  };

  const handleRemoveAvatar = () => {
    removeAvatar(undefined, {
      onSuccess: (data) => {
        toast.success("Avatar removed successfully");
        if (data?.data?.user) {
          const token = localStorage.getItem("token");
          signIn(data.data.user, token);
        }
      },
      onError: (err) => {
        toast.error(formatError(err, "Failed to remove avatar"));
      },
    });
  };

  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""
      }`.toUpperCase();
  };

  const getUserAvatar = () => {
    return getAvatarUrl(user);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-8">
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-[#F27318] border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6 sm:p-8">
        <div className="mb-6">
          <h2 className="text-[18px] font-semibold text-[#1A1714] font-dm-sans">
            Profile Picture
          </h2>
          <p className="text-neutral-500 font-dm-sans text-[14px] mt-1">
            Update your profile photo
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="relative shrink-0">
            {user?.avatar ? (
              <img
                src={getUserAvatar()}
                alt="Profile"
                className="w-24 h-24 rounded-2xl object-cover"
              />
            ) : (
              <div className="w-24 h-24 rounded-2xl bg-[#F27318] flex items-center justify-center text-white text-3xl font-semibold font-dm-sans">
                {getInitials(user?.firstName, user?.lastName)}
              </div>
            )}
          </div>

          <div className="flex-1 text-center sm:text-left">
            <p className="font-semibold text-neutral-800 font-dm-sans mb-1 text-[16px]">
              Upload a new photo
            </p>
            <p className="text-sm text-neutral-500 font-dm-sans mb-3">
              Recommended: Square image, at least 400x400 pixels. Max file size:
              5MB
            </p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
              <button
                onClick={handleAvatarClick}
                disabled={isUploadingAvatar}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#F27318] hover:bg-[#D96515] disabled:bg-[#F27318]/70 text-white text-sm font-semibold rounded-lg transition-all font-dm-sans"
              >
                {isUploadingAvatar ? (
                  <Loader className="animate-spin" size={16} />
                ) : (
                  <>
                    <Upload size={16} />
                    Upload Photo
                  </>
                )}
              </button>
              {user?.avatar && (
                <button
                  onClick={handleRemoveAvatar}
                  disabled={isRemovingAvatar}
                  className="flex items-center gap-2 px-4 py-2.5 border border-neutral-200 hover:bg-neutral-50 text-neutral-600 text-sm font-medium rounded-lg transition-all font-dm-sans"
                >
                  {isRemovingAvatar ? (
                    <Loader className="animate-spin" size={16} />
                  ) : (
                    <>
                      <Trash2 size={16} />
                      Remove
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8">
        <div className="mb-6">
          <h2 className="text-[18px] font-semibold text-[#1A1714] font-dm-sans">
            Personal Information
          </h2>
          <p className="text-neutral-500 font-dm-sans text-sm mt-1">
            Update your personal details here
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* First Name & Last Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-800 mb-1 font-dm-sans">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register("firstName")}
                className={`w-full px-4 py-2.5 rounded-lg border focus:ring-1 outline-none transition-all font-dm-sans text-neutral-900 ${errors.firstName ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : "border-neutral-200 focus:border-[#F27318] focus:ring-[#F27318]"}`}
              />
              {errors.firstName && (
                <p className="text-xs text-red-500 mt-1 font-dm-sans">
                  {errors.firstName.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-800 mb-1 font-dm-sans">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register("lastName")}
                className={`w-full px-4 py-2.5 rounded-lg border focus:ring-1 outline-none transition-all font-dm-sans text-neutral-900 ${errors.lastName ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : "border-neutral-200 focus:border-[#F27318] focus:ring-[#F27318]"}`}
              />
              {errors.lastName && (
                <p className="text-xs text-red-500 mt-1 font-dm-sans">
                  {errors.lastName.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-800 mb-1 font-dm-sans">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  {...register("email")}
                  disabled
                  className="w-full px-4 py-2.5 rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-500 font-dm-sans cursor-not-allowed"
                />
                {user?.isEmailVerified && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[#F27318]">
                    <Check size={14} />
                    <span className="text-xs font-medium">Verified</span>
                  </div>
                )}
              </div>
              {user?.isEmailVerified && (
                <p className="text-xs text-[#F27318] mt-1 flex items-center gap-1 font-dm-sans">
                  <Check size={12} />
                  Email verified
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-800 mb-1 font-dm-sans">
                Phone Number
              </label>
              <div className="flex gap-2">
                <select
                  className="px-3 py-2.5 rounded-lg border border-neutral-200 focus:border-[#F27318] focus:ring-1 focus:ring-[#F27318] outline-none transition-all font-dm-sans text-neutral-900 bg-white"
                  defaultValue="+977"
                >
                  <option value="+977">+977</option>
                </select>
                <input
                  type="tel"
                  {...register("phone")}
                  placeholder="98XXXXXXXX"
                  className={`flex-1 px-4 py-2.5 rounded-lg border focus:ring-1 outline-none transition-all font-dm-sans text-neutral-900 ${errors.phone ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : "border-neutral-200 focus:border-[#F27318] focus:ring-[#F27318]"}`}
                />
              </div>
              {errors.phone && (
                <p className="text-xs text-red-500 mt-1 font-dm-sans">
                  {errors.phone.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-800 mb-2 font-dm-sans">
                Gender
              </label>
              <div className="flex flex-wrap gap-2">
                {["male", "female", "other"].map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() =>
                      setValue("gender", option, { shouldDirty: true })
                    }
                    className={`px-4 py-2.5 rounded-lg border-2 text-sm font-medium transition-all font-dm-sans capitalize flex-1 sm:flex-none min-w-[80px] ${gender === option
                        ? "border-[#F27318] bg-[#F27318]/5 text-[#F27318]"
                        : "border-neutral-200 text-neutral-600 hover:border-neutral-300"
                      }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
              {errors.gender && (
                <p className="text-xs text-red-500 mt-1 font-dm-sans">
                  {errors.gender.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-800 mb-2 font-dm-sans text-left">
                Date of Birth
              </label>
              <input
                type="date"
                {...register("dateOfBirth")}
                max={new Date().toISOString().split("T")[0]}
                className={`w-full px-4 py-2.5 rounded-lg border focus:ring-1 outline-none transition-all font-dm-sans text-neutral-900 bg-white ${errors.dateOfBirth ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : "border-neutral-200 focus:border-[#F27318] focus:ring-[#F27318]"}`}
              />
              {errors.dateOfBirth && (
                <p className="text-xs text-red-500 mt-1 font-dm-sans">
                  {errors.dateOfBirth.message}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={handleCancel}
              disabled={!isDirty}
              className="w-full sm:w-auto px-6 py-3 sm:py-2.5 border border-neutral-200 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed text-neutral-700 font-semibold rounded-lg transition-all font-dm-sans"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUpdating || !isDirty}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 sm:py-2.5 bg-[#F27318] hover:bg-[#D96515] disabled:bg-[#F27318]/70 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all font-dm-sans"
            >
              {isUpdating ? (
                <Loader className="animate-spin" size={16} />
              ) : (
                <>
                  <Check size={16} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>


    </div>
  );
}

function getTimeAgo(date) {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now - past;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffYears > 0) return `${diffYears} year${diffYears > 1 ? "s" : ""} ago`;
  if (diffMonths > 0)
    return `${diffMonths} month${diffMonths > 1 ? "s" : ""} ago`;
  if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  return "today";
}
