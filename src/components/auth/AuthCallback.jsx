import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore, { getAuthRevision } from "../../store/authStore";
import { useShallow } from "zustand/react/shallow";
import { toast } from "../../lib/toast";
import { getProfile } from "../../api/profileApi";
import BrandLoader from "../common/BrandLoader";

export default function AuthCallback() {
  const { signIn } = useAuthStore(
    useShallow((state) => ({ signIn: state.signIn })),
  );
  const navigate = useNavigate();
  const isProcessing = useRef(false);

  useEffect(() => {
    const handleOAuthCallback = async () => {
      window.history.replaceState({}, "", window.location.pathname);

      {
        if (isProcessing.current) return;
        isProcessing.current = true;

        // FE-18: not cancelled by unmount — if a sign-out intervened
        // while the profile fetch was in flight, skip the sign-in
        // rather than resurrecting the session.
        const revisionAtStart = getAuthRevision();
        try {
          const response = await getProfile();
          const user = response.data?.data?.user;

          if (!user) {
            throw new Error("Failed to fetch user profile");
          }

          if (getAuthRevision() === revisionAtStart) {
            signIn(user);
            toast.success(
              `Welcome${user.firstName ? `, ${user.firstName}` : ""}!`,
            );
          }

          // FE-16: admins previously navigated to the /admin path, a route that
          // does not exist in the customer app (404 catch-all), and no
          // admin-origin config exists in this codebase. Admins complete
          // sign-in like other users and land on the storefront home.
          navigate("/", { replace: true });
        } catch (error) {
          console.error("Auth callback error:", error);
          localStorage.removeItem("token");
          toast.error("Authentication failed. Please try again.");
          navigate("/", { replace: true });
        }
      }
    };

    handleOAuthCallback();
  }, [signIn, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FDFDFD]">
      <div className="text-center flex flex-col items-center">
        {/* The one standard loading animation (BrandLoader). */}
        <BrandLoader size={120} />
        <p className="text-neutral-600 font-dm-sans text-sm mt-4">
          Signing you in...
        </p>
      </div>
    </div>
  );
}
