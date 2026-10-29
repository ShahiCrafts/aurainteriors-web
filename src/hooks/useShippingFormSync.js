import { useEffect } from "react";
import useCheckoutStore from "../store/checkoutStore";
import { addressToShippingAddress } from "../utils/addressMapper";

export function useShippingFormSync({
  isAuthenticated,
  user,
  defaultAddress,
  shippingAddress,
  shippingAddressId,
  setGuestInfo,
  setShippingAddress,
  setShippingAddressId,
  resetForm,
  setValue,
}) {
  useEffect(() => {
    if (isAuthenticated && user) {
      const userData = {
        email: user.email || "",
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        phone: user.phone || "",
      };
      const state = useCheckoutStore.getState();
      const guestInfoChanged =
        state.guestInfo.email !== userData.email ||
        state.guestInfo.firstName !== userData.firstName ||
        state.guestInfo.lastName !== userData.lastName ||
        state.guestInfo.phone !== userData.phone;

      if (guestInfoChanged) {
        setGuestInfo(userData);
      }

      resetForm({
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        phone: userData.phone,
        addressLine1: state.shippingAddress.addressLine1 || "",
        city: state.shippingAddress.city || "",
        postalCode: state.shippingAddress.postalCode || "",
        country: state.shippingAddress.country || "Nepal",
        state: state.shippingAddress.state || "",
      });
    }
  }, [isAuthenticated, user, setGuestInfo, resetForm]);

  useEffect(() => {
    if (!isAuthenticated || !user || !defaultAddress || shippingAddressId) {
      return;
    }

    const hasSavedShippingData = Boolean(
      shippingAddress.addressLine1 ||
      shippingAddress.city ||
      shippingAddress.postalCode ||
      shippingAddress.state ||
      shippingAddress.phone,
    );

    if (hasSavedShippingData) {
      return;
    }

    const defaultShippingAddress = addressToShippingAddress(
      defaultAddress,
      user.phone,
    );

    setShippingAddress(defaultShippingAddress);
    setShippingAddressId(defaultAddress._id);
    setValue("phone", defaultShippingAddress.phone, { shouldDirty: false });
    setValue("addressLine1", defaultShippingAddress.addressLine1, {
      shouldDirty: false,
    });
    setValue("city", defaultShippingAddress.city, { shouldDirty: false });
    setValue("state", defaultShippingAddress.state, { shouldDirty: false });
    setValue("postalCode", defaultShippingAddress.postalCode, {
      shouldDirty: false,
    });
    setValue("country", defaultShippingAddress.country, { shouldDirty: false });
  }, [
    defaultAddress,
    isAuthenticated,
    shippingAddress,
    shippingAddressId,
    setShippingAddress,
    setShippingAddressId,
    setValue,
    user,
  ]);
}

export default useShippingFormSync;
