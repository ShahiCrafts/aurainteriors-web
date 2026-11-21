import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { verifyMagicLink as verifyMagicLinkApi } from "../../api/authApi";
import BrandLoader from "../../components/common/BrandLoader";
import useAuthStore, { getAuthRevision } from "../../store/authStore";
import { useShallow } from "zustand/react/shallow";
import { toast } from "../../lib/toast";

const processedTokens = new Set();

export default function VerifyMagicLinkPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();
  const { signIn, openAuthModal } = useAuthStore(
    useShallow((state) => ({
      signIn: state.signIn,
      openAuthModal: state.openAuthModal,
    })),
  );
  useEffect(() => {
    if (!token) {
      toast.error("Invalid or missing magic link token.");
      navigate("/");
      return;
    }

    if (processedTokens.has(token)) return;
    processedTokens.add(token);

    const verify = async () => {
      const revisionAtStart = getAuthRevision();
      try {
        const response = await verifyMagicLinkApi(token);
        const data = response.data;
        const user = data.data.user;
        if (getAuthRevision() !== revisionAtStart) {
          navigate("/");
          return;
        }
        signIn(user, data.token);

        if (user && user.email) {
          localStorage.setItem("lastUsedEmail", user.email);
        }

        const isProfileIncomplete = !user.firstName && !user.lastName;
        if (isProfileIncomplete) {
          openAuthModal("onboarding");
          toast.success(
            "Signed in successfully! Let's complete your profile setup.",
          );
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

  // Identical to the app splash (same #f3f4f6 background, same 168px
  // animation, no text) so the splash fades into this screen seamlessly —
  // the user sees one continuous loading animation, not two loaders.
  // Success and failure both navigate home with a toast.
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#f3f4f6]">
      <BrandLoader size={168} />
    </div>
  );
}
