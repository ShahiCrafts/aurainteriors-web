import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import useAuthStore from "../../store/authStore";
import { useShallow } from "zustand/react/shallow";
import {
  getAllAddresses,
  getAddress,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from "../../api/addressApi";
import { addressKeys } from "../queryKeys";

const addressListKey = () =>
  addressKeys.list(useAuthStore.getState().user?._id);
const addressDetailKey = (id) =>
  addressKeys.detail(id, useAuthStore.getState().user?._id);

export const useAddresses = (options = {}) => {
  const userId = useAuthStore((state) => state.user?._id);
  return useQuery({
    queryKey: addressKeys.list(userId),
    queryFn: async () => {
      // Phase 6: addressApi resolves to the body (see api/addressApi).
      const body = await getAllAddresses();
      return body.data.addresses;
    },
    ...options,
    enabled: !!userId && options.enabled !== false,
  });
};

export const useAddress = (id) => {
  const userId = useAuthStore((state) => state.user?._id);
  return useQuery({
    queryKey: addressKeys.detail(id, userId),
    queryFn: async () => {
      return getAddress(id);
    },
    enabled: !!id && !!userId,
  });
};

export const useCreateAddress = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["createAddress"],
    mutationFn: async (data) => {
      try {
        return await createAddress(data);
      } catch (error) {
        throw error;
      }
    },
    onSuccess: () => {
      // FE-55: a create changes only the list — no detail exists yet.
      queryClient.invalidateQueries({ queryKey: addressListKey() });
    },
  });
};

export const useUpdateAddress = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["updateAddress"],
    mutationFn: async ({ id, data }) => {
      try {
        return await updateAddress(id, data);
      } catch (error) {
        throw error;
      }
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: addressListKey() });
      queryClient.invalidateQueries({ queryKey: addressDetailKey(id) });
    },
  });
};

export const useDeleteAddress = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["deleteAddress"],
    mutationFn: async (id) => {
      try {
        return await deleteAddress(id);
      } catch (error) {
        throw error;
      }
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: addressListKey() });
      queryClient.removeQueries({ queryKey: addressDetailKey(id) });
    },
  });
};

export const useDefaultAddress = () => {
  const { isAuthenticated } = useAuthStore(
    useShallow((state) => ({ isAuthenticated: state.isAuthenticated })),
  );
  const { data: addresses, isLoading } = useAddresses({
    enabled: isAuthenticated,
  });
  const defaultAddress =
    addresses?.find((addr) => addr.isDefault) || addresses?.[0];
  return { defaultAddress, isLoading };
};

export const useSetDefaultAddress = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["setDefaultAddress"],
    mutationFn: async (id) => {
      try {
        return await setDefaultAddress(id);
      } catch (error) {
        throw error;
      }
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: addressListKey() });
      queryClient.invalidateQueries({ queryKey: addressDetailKey(id) });
    },
  });
};
