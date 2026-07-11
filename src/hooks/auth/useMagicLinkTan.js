import { useMutation } from "@tanstack/react-query";
import { sendMagicLink, verifyMagicLink } from "../../api/authApi";

export const useSendMagicLink = () => {
  return useMutation({
    mutationKey: ["sendMagicLink"],
    mutationFn: async (data) => {
      try {
        const response = await sendMagicLink(data);
        return response.data;
      } catch (error) {
        throw error;
      }
    },
  });
};

export const useVerifyMagicLink = () => {
  return useMutation({
    mutationKey: ["verifyMagicLink"],
    mutationFn: async (token) => {
      try {
        const response = await verifyMagicLink(token);
        return response.data;
      } catch (error) {
        throw error;
      }
    },
    onError: (error) => {
      console.error("Magic link verification error:", error);
    },
  });
};
