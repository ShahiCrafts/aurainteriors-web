import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import useAuthStore from "../../store/authStore";
import {
  getAllAddresses,
  getAddress,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from "../../api/addressApi";

// FE-55: the mutation hooks below used to invalidate ["addresses"]
// and ["address"] — the latter prefix-matches EVERY cached address
// detail (every id, every user). Mutations now invalidate the
// caller's list key plus only the mutated address's own detail key,
// built with the exact shapes useAddresses/useAddress use.
const addressListKey = () => ["addresses", useAuthStore.getState().user?._id || "guest"];
const addressDetailKey = (id) => ["address", id, useAuthStore.getState().user?._id || "guest"];

export const useAddresses = (options = {}) => {
  const userId = useAuthStore(state => state.user?._id);
  return useQuery({
    queryKey: ["addresses", userId || "guest"],
    queryFn: async () => {
      const response = await getAllAddresses();
      return response.data.data.addresses;
    },
    ...options,
    enabled: !!userId && options.enabled !== false,
  });
};

export const useAddress = (id) => {
  const userId = useAuthStore(state => state.user?._id);
  return useQuery({
    queryKey: ["address", id, userId || "guest"],
    queryFn: async () => {
      const response = await getAddress(id);
      return response.data;
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
        const response = await createAddress(data);
        return response.data;
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
        const response = await updateAddress(id, data);
        return response.data;
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
        const response = await deleteAddress(id);
        return response.data;
      } catch (error) {
        throw error;
      }
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: addressListKey() });
      // FE-55: the deleted address's detail is removed outright —
      // invalidating it would refetch a 404 if it were mounted.
      queryClient.removeQueries({ queryKey: addressDetailKey(id) });
    },
  });
};

export const useDefaultAddress = () => {
  const { isAuthenticated } = useAuthStore();
  const { data: addresses, isLoading } = useAddresses({ enabled: isAuthenticated });
  const defaultAddress = addresses?.find((addr) => addr.isDefault) || addresses?.[0];
  return { defaultAddress, isLoading };
};

export const useSetDefaultAddress = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["setDefaultAddress"],
    mutationFn: async (id) => {
      try {
        const response = await setDefaultAddress(id);
        return response.data;
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
