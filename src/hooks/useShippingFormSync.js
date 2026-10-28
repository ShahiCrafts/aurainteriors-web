import { useEffect } from "react";
import useCheckoutStore from "../store/checkoutStore";
import { addressToShippingAddress } from "../utils/addressMapper";

/**
 * Phase 6 (REUSE-013) — CheckoutPage's shipping-form synchronisation,
 * extracted as a single-use hook with the effects moved VERBATIM
 * (same guards, same dependency arrays, same setValue options):
 *
 *  1. When the signed-in user is known, mirror their account fields
 *     into the checkout store's guestInfo (only when changed) and
 *     reset the RHF form to account + stored shipping values.
 *  2. When a default saved address arrives and the checkout holds
 *     no shipping data yet, adopt it: write the store's
 *     shippingAddress/shippingAddressId and push the fields into
 *     the form without dirtying it.
 *
 * The address -> shippingAddress field mapping is
 * utils/addressMapper.addressToShippingAddress.
 */
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
