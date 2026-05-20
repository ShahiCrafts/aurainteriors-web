import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, ArrowLeft, User, CheckSquare } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { API_V1_URL } from "../../config/constants";
import { useSendMagicLink } from "../../hooks/auth/useMagicLinkTan";
import { useUpdateProfile } from "../../hooks/profile/useProfileTan";
import useAuthStore from "../../store/authStore";
import { toast } from "react-toastify";
import formatError from "../../utils/errorHandler";

const ORANGE = "#F27318";

export default function AuthModal() {
  const {
    isAuthModalOpen,
    closeAuthModal,
    authModalView,
    setAuthModalView,
    setUser,
    user,
  } = useAuthStore();

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [isWelcomeBack, setIsWelcomeBack] = useState(false);

  const { mutate: sendMagicLink, isPending: isSending } = useSendMagicLink();
  const { mutate: updateProfile, isPending: isUpdating } = useUpdateProfile();

  // Prefill email on mount or when modal opens
  useEffect(() => {
    if (isAuthModalOpen) {
      const lastEmail = localStorage.getItem("lastUsedEmail");
      if (lastEmail) {
        setEmail(lastEmail);
        setIsWelcomeBack(true);
      } else {
        setEmail("");
        setIsWelcomeBack(false);
      }
      setFullName("");
    }
  }, [isAuthModalOpen]);

  if (!isAuthModalOpen) return null;

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    if (!email) return;

    sendMagicLink(
      { email },
      {
        onSuccess: () => {
          localStorage.setItem("lastUsedEmail", email);
          setAuthModalView("sent");
        },
        onError: (error) => {
          toast.error(formatError(error) || "Failed to send magic link. Please try again.");
        },
      }
    );
  };

  const handleOnboardingSubmit = (e) => {
    e.preventDefault();
    if (!fullName.trim()) return;

    const names = fullName.trim().split(/\s+/);
    const firstName = names[0] || "";
    const lastName = names.slice(1).join(" ") || "";

    updateProfile(
      { firstName, lastName },
      {
        onSuccess: (data) => {
          // Response shape: { status: 'success', data: { user } }
          const updatedUser = data?.data?.user || data?.user;
          if (updatedUser) {
            setUser(updatedUser);
            toast.success(`Welcome to DecorX Studio, ${updatedUser.firstName}!`);
          } else {
            toast.success("Profile setup completed successfully!");
          }
          closeAuthModal();
        },
        onError: (error) => {
          toast.error(formatError(error) || "Failed to update profile name.");
        },
      }
    );
  };

  const handleGoogleAuth = () => {
    window.location.href = `${API_V1_URL}/auth/google`;
  };

  // Determine if we should show close button (onboarding view is non-dismissible)
  const showCloseButton = authModalView !== "onboarding";

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="bg-white w-full max-w-[840px] h-full max-h-[560px] rounded-[16px] overflow-hidden flex relative shadow-[0_24px_70px_rgba(0,0,0,0.35)] font-dm-sans"
        >
          {/* Close Button */}
          {showCloseButton && (
            <button
              onClick={closeAuthModal}
              className="absolute top-4 right-4 z-20 w-8 h-8 flex items-center justify-center bg-gray-100 text-gray-600 hover:bg-black hover:text-white transition-all duration-200 rounded-[8px] border-none cursor-pointer"
            >
              <X size={18} />
            </button>
          )}

          {/* Left Side: Premium Visuals */}
          <div className="hidden md:flex w-1/2 relative bg-[#1A1714]">
            <img
              src="https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?q=80&w=2070&auto=format&fit=crop"
              alt="Premium Interiors"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 hover:scale-105"
            />
          </div>

          {/* Right Side: Identity-First State Machine Content */}
          <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center bg-white relative">
            <div className="w-full max-w-[340px] mx-auto">
              <AnimatePresence mode="wait">
                {/* 1. EMAIL ENTRY VIEW */}
                {authModalView === "email" && (
                  <motion.div
                    key="email-view"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <div className="mb-6">
                      <h3 className="text-[24px] font-bold text-[#1A1714] mb-1">
                        {isWelcomeBack ? "Welcome Back" : "Continue to DecorX Studio"}
                      </h3>
                      <p className="text-[#64748B] text-[14px]">
                        {isWelcomeBack
                          ? "Continue with your email to access your premium collection."
                          : "Enter your email to sign in or create an account."}
                      </p>
                    </div>

                    <form onSubmit={handleEmailSubmit} className="flex flex-col gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[13px] font-semibold text-[#1A1714] tracking-wide uppercase">
                          Email Address
                        </label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            if (isWelcomeBack) setIsWelcomeBack(false);
                          }}
                          className="w-full h-[46px] px-4 border border-[#E2E8F0] rounded-[8px] focus:border-[#F27318] focus:ring-1 focus:ring-[#F27318] outline-none transition-all duration-200 text-[15px]"
                          placeholder="e.g. name@example.com"
                          required
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isSending}
                        className="w-full h-[46px] bg-[#F27318] hover:bg-[#D9620E] text-white font-semibold text-[14px] rounded-[8px] mt-1 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed border-none cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                      >
                        {isSending ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                            Sending Magic Link...
                          </>
                        ) : (
                          "Send Magic Link"
                        )}
                      </button>

                      <div className="relative flex items-center justify-center my-2">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-[#F1F5F9]"></div>
                        </div>
                        <span className="relative px-3 bg-white text-[10px] text-[#94A3B8] font-bold uppercase tracking-[0.15em]">
                          or
                        </span>
                      </div>

                      {/* Google Authentication */}
                      <button
                        onClick={handleGoogleAuth}
                        type="button"
                        className="w-full h-[46px] bg-white border border-[#E2E8F0] hover:bg-gray-50 rounded-[8px] flex items-center justify-center gap-3 transition-all duration-200 font-semibold text-[#1A1714] cursor-pointer shadow-sm"
                      >
                        <FcGoogle size={20} />
                        <span className="text-[14px]">Continue with Google</span>
                      </button>
                    </form>

                    <div className="mt-8 text-center">
                      <p className="text-[11px] text-[#94A3B8] leading-relaxed">
                        By continuing, you agree to our{" "}
                        <a href="/terms" className="text-[#64748B] hover:text-[#1A1714] underline font-medium">Terms</a>
                        {" "}&{" "}
                        <a href="/privacy" className="text-[#64748B] hover:text-[#1A1714] underline font-medium">Privacy Policy</a>.
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* 2. SENT CONFIRMATION VIEW */}
                {authModalView === "sent" && (
                  <motion.div
                    key="sent-view"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="text-center flex flex-col items-center"
                  >
                    <div className="w-16 h-16 bg-[#F27318]/10 rounded-full flex items-center justify-center text-[#F27318] mb-6 animate-pulse">
                      <Mail size={32} />
                    </div>

                    <h3 className="text-[22px] font-bold text-[#1A1714] mb-2">
                      Check Your Email
                    </h3>
                    <p className="text-[#64748B] text-[14px] leading-relaxed mb-6">
                      A secure sign-in link has been sent to <strong className="text-[#1A1714] font-semibold">{email}</strong>.<br />
                      Click it to log in.
                    </p>

                    <div className="flex flex-col gap-3 w-full">
                      <button
                        onClick={() => window.open(`mailto:${email}`)}
                        className="w-full h-[46px] bg-[#F27318] hover:bg-[#D9620E] text-white font-semibold text-[14px] rounded-[8px] transition-all duration-200 border-none cursor-pointer shadow-sm"
                      >
                        Open Mail App
                      </button>

                      <button
                        onClick={() => setAuthModalView("email")}
                        className="text-[#64748B] hover:text-[#1A1714] text-[13px] font-medium transition-all duration-200 bg-transparent border-none cursor-pointer flex items-center justify-center gap-1.5 mt-2"
                      >
                        <ArrowLeft size={14} />
                        Change email address
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* 3. PROGRESSIVE PROFILE ONBOARDING VIEW */}
                {authModalView === "onboarding" && (
                  <motion.div
                    key="onboarding-view"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <div className="mb-6">
                      <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center text-green-600 mb-4">
                        <CheckSquare size={24} />
                      </div>
                      <h3 className="text-[24px] font-bold text-[#1A1714] mb-1">
                        Welcome to DecorX
                      </h3>
                      <p className="text-[#64748B] text-[14px]">
                        Your email is verified! Tell us your full name to personalize your experience.
                      </p>
                    </div>

                    <form onSubmit={handleOnboardingSubmit} className="flex flex-col gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[13px] font-semibold text-[#1A1714] tracking-wide uppercase">
                          Full Name
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="w-full h-[46px] pl-10 pr-4 border border-[#E2E8F0] rounded-[8px] focus:border-[#F27318] focus:ring-1 focus:ring-[#F27318] outline-none transition-all duration-200 text-[15px]"
                            placeholder="e.g. John Doe"
                            required
                            autoFocus
                          />
                          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={16} />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isUpdating || !fullName.trim()}
                        className="w-full h-[46px] bg-[#F27318] hover:bg-[#D9620E] text-white font-semibold text-[14px] rounded-[8px] mt-1 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed border-none cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                      >
                        {isUpdating ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                            Completing Setup...
                          </>
                        ) : (
                          "Complete Setup"
                        )}
                      </button>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

