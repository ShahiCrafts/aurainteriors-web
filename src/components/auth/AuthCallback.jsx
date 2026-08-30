import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import useAuthStore from "../../store/authStore";
import { toast } from "react-toastify";
import { getProfile } from "../../api/profileApi";
import Skeleton from "../common/Skeleton";

export default function AuthCallback() {
  const signIn = useAuthStore((state) => state.signIn);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isProcessing = useRef(false);

  useEffect(() => {
    const handleOAuthCallback = async () => {
      const token = searchParams.get("token");

      if (token) {
        if (isProcessing.current) return;
        isProcessing.current = true;

        try {
          localStorage.setItem("token", token);

          const response = await getProfile();
          const user = response.data?.data?.user;

          if (!user) {
            throw new Error("Failed to fetch user profile");
          }

          signIn(user, token);
          toast.success(
            `Welcome${user.firstName ? `, ${user.firstName}` : ""}!`
          );

          if (user.role === "admin") {
            navigate("/admin", { replace: true });
          } else {
            navigate("/", { replace: true });
          }
        } catch (error) {
          console.error("Auth callback error:", error);
          localStorage.removeItem("token");
          toast.error("Authentication failed. Please try again.");
          navigate("/", { replace: true });
        }
      } else {
        navigate("/", { replace: true });
      }
    };

    handleOAuthCallback();
  }, [signIn, navigate, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FDFDFD]">
      <div className="text-center">
        {/* Logo/Brand */}
        <div className="mb-8">
          <h1 className="text-2xl font-playfair text-neutral-900">
            <span className="font-medium">Aura</span>{" "}
            <span className="italic text-teal-700">Interiors</span>
          </h1>
        </div>

        {/* Skeleton Card */}
        <div className="w-64 p-6 bg-white border border-neutral-100 rounded-2xl shadow-sm mx-auto space-y-3">
          <Skeleton className="w-12 h-12 rounded-full mx-auto" />
          <Skeleton className="w-3/4 h-4 rounded mx-auto" />
          <Skeleton className="w-1/2 h-3 rounded mx-auto" />
        </div>

        {/* Text */}
        <p className="text-neutral-600 font-dm-sans text-sm mt-4">
          Signing you in...
        </p>
      </div>
    </div>
  );
}
