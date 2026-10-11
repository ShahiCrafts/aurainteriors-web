import { useMutation } from "@tanstack/react-query";
import { adminLogin, adminVerifyOtp } from "../../api/authApi";

export const useAdminLogin = () => {
  return useMutation({
    mutationKey: ["adminLogin"],
    mutationFn: async ({ email, password }) => {
      try {
        const response = await adminLogin(email, password);
        return response.data;
      } catch (error) {
        throw error;
      }
    },
  });
};

export const useAdminVerifyOtp = () => {
  return useMutation({
    mutationKey: ["adminVerifyOtp"],
    mutationFn: async ({ email, otp, challengeId }) => {
      try {
        const response = await adminVerifyOtp(email, otp, challengeId);
        return response.data;
      } catch (error) {
        throw error;
      }
    },
  });
};
