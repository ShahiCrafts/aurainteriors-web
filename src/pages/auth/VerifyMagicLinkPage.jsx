import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { verifyMagicLink as verifyMagicLinkApi } from "../../api/authApi";
import useAuthStore from "../../store/authStore";
import { toast } from "react-toastify";

// Module-level set to prevent double-firing in React 18 StrictMode
const processedTokens = new Set();

export default function VerifyMagicLinkPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();
  const { signIn, openAuthModal } = useAuthStore();
  useEffect(() => {
    if (!token) {
      toast.error("Invalid or missing magic link token.");
      navigate("/");
      return;
    }

    if (processedTokens.has(token)) return;
    processedTokens.add(token);

    const verify = async () => {
      try {
        const response = await verifyMagicLinkApi(token);
        const data = response.data;
        const user = data.data.user;
        signIn(user, data.token);
        
        if (user && user.email) {
          localStorage.setItem("lastUsedEmail", user.email);
        }

        const isProfileIncomplete = !user.firstName && !user.lastName;
        if (isProfileIncomplete) {
          openAuthModal("onboarding");
          toast.success("Signed in successfully! Let's complete your profile setup.");
        } else {
          toast.success(`Welcome back, ${user.firstName || "User"}!`);
        }
        navigate("/");
      } catch (error) {
        toast.error(error.displayMessage || "Failed to verify magic link.");
        navigate("/");
      }
    };

    verify();
  }, [token, navigate, signIn, openAuthModal]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#F8F9FA] font-dm-sans">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F27318] mb-4"></div>
      <h2 className="text-[20px] font-bold text-[#1A1714]">Verifying your sign-in link...</h2>
      <p className="text-[#64748B] mt-2 text-[14px]">Please wait while we authenticate you.</p>
    </div>
  );
}
