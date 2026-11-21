import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { verifyMagicLink as verifyMagicLinkApi } from "../../api/authApi";
import BrandLoader from "../../components/common/BrandLoader";
import useAuthStore, { getAuthRevision } from "../../store/authStore";
import { useShallow } from "zustand/react/shallow";
import { toast } from "../../lib/toast";
import { dismissSplash } from "../../lib/splash";

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
    // The splash has covered this page since first paint (App does not
    // auto-dismiss it on /auth/* routes). Release it only as we leave,
    // so the user sees exactly one loader for the whole verification.
    const goHome = () => {
      dismissSplash();
      navigate("/");
    };

    if (!token) {
      toast.error("Invalid or missing magic link token.");
      goHome();
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
          goHome();
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
        goHome();
      } catch (error) {
        toast.error(error.displayMessage || "Failed to verify magic link.");
        goHome();
      }
    };

    verify();
  }, [token, navigate, signIn, openAuthModal]);

  // Fallback only: the splash normally covers this page for the whole
  // verification (see App.jsx), and this identical loader (same #f3f4f6
  // background, same 112px animation, no text) is what shows if the
  // splash's 6s safety net in main.jsx ever fires first on a very slow
  // verification request. Success and failure both go home with a toast.
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#f3f4f6]">
      <BrandLoader size={112} />
    </div>
  );
}
