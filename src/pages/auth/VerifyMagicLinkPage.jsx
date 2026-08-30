import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { verifyMagicLink as verifyMagicLinkApi } from "../../api/authApi";
import Skeleton from "../../components/common/Skeleton";
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
      <div className="p-8 bg-white border border-neutral-100 rounded-2xl shadow-sm text-center max-w-sm w-full mx-4 space-y-4">
        <Skeleton className="w-12 h-12 rounded-full mx-auto" />
        <Skeleton className="w-3/4 h-6 rounded mx-auto" />
        <Skeleton className="w-1/2 h-4 rounded mx-auto" />
        <h2 className="text-[18px] font-bold text-[#1A1714] pt-2">Verifying your sign-in link...</h2>
        <p className="text-[#64748B] text-[13px]">Please wait while we authenticate you.</p>
      </div>
    </div>
  );
}
