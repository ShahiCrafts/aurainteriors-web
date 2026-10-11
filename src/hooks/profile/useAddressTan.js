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
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      queryClient.invalidateQueries({ queryKey: ["address"] });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      queryClient.invalidateQueries({ queryKey: ["address"] });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      queryClient.invalidateQueries({ queryKey: ["address"] });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      queryClient.invalidateQueries({ queryKey: ["address"] });
    },
  });
};
