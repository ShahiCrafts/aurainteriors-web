import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Eye, EyeOff } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { useNavigate } from "react-router-dom";
import { API_V1_URL } from "../../config/constants";
import { useLogin } from "../../hooks/auth/useLoginTan";
import { useSendMagicLink } from "../../hooks/auth/useMagicLinkTan";
import useAuthStore from "../../store/authStore";
import { toast } from "react-toastify";
import formatError from "../../utils/errorHandler";

const ORANGE = "#F27318";

const inputBaseStyle = {
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "#E5E7EB",
  background: "#FFFFFF",
  outline: "none",
};

const inputFocusStyle = {
  borderColor: ORANGE,
  boxShadow: `0 0 0 4px ${ORANGE}15`,
  outline: "none",
};

const inputBlurStyle = {
  borderColor: "#E5E7EB",
  boxShadow: "none",
  outline: "none",
};

export default function AuthModal() {
  const {
    isAuthModalOpen,
    closeAuthModal,
    authModalView,
    setAuthModalView,
    signIn,
  } = useAuthStore();
  const navigate = useNavigate();

  // Mode state
  const isLogin = authModalView === "login";

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Signup state
  const [signupEmail, setSignupEmail] = useState("");
  const [signupFullName, setSignupFullName] = useState("");

  const { mutate: login, isPending: isLoginPending } = useLogin();
  const { mutate: sendMagicLink, isPending: isSendMagicLinkPending } =
    useSendMagicLink();

  if (!isAuthModalOpen) return null;

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    login(
      { email: loginEmail, password: loginPassword },
      {
        onSuccess: (data) => {
          const user = data.data.user;
          signIn(user, data.token);
          toast.success(`Welcome back, ${user.firstName}!`);
          closeAuthModal();
        },
        onError: (error) => {
          toast.error(formatError(error));
        },
      },
    );
  };

  const handleSignupSubmit = (e) => {
    e.preventDefault();
    sendMagicLink(
      { email: signupEmail, fullName: signupFullName },
      {
        onSuccess: () => {
          toast.success("Magic link sent! Check your email to sign in.");
          closeAuthModal();
        },
        onError: (error) => {
          toast.error(formatError(error));
        },
      },
    );
  };

  const handleGoogleAuth = () => {
    window.location.href = `${API_V1_URL}/auth/google`;
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white w-full max-w-[840px] h-full max-h-[560px] rounded-[12px] overflow-hidden flex relative shadow-[0_20px_60px_rgba(0,0,0,0.3)] font-dm-sans"
        >
          {/* Close Button */}
          <button
            onClick={closeAuthModal}
            className="absolute top-4 right-4 z-20 w-8 h-8 flex items-center justify-center bg-gray-100 text-gray-600 hover:bg-black hover:text-white transition-all rounded-[8px] border-none cursor-pointer"
          >
            <X size={18} />
          </button>

          {/* Left Side: Visual (Image Only) */}
          <div className="hidden md:flex w-1/2 relative bg-[#F8F9FA]">
            <img
              src="https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?q=80&w=2070&auto=format&fit=crop"
              alt="Premium Interiors"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/5" />
          </div>

          {/* Right Side: Form Content */}
          <div className="w-full md:w-1/2 p-8 md:p-10 flex flex-col justify-center bg-white">
            <div className="w-full max-w-[340px] mx-auto min-h-[480px]">
              <div className="mb-6">
                <h3 className="text-[24px] font-bold text-[#1A1714] mb-1">
                  {isLogin ? "Welcome Back" : "Join DecorX Studio"}
                </h3>
                <p className="text-[#64748B] text-[14px]">
                  {isLogin
                    ? "Sign in to access your curated collection."
                    : "Create an account for a premium experience."}
                </p>
              </div>
              {isLogin ? (
                /* LOGIN FORM */
                <form
                  onSubmit={handleLoginSubmit}
                  className="flex flex-col gap-4"
                >
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[14px] font-medium text-[#1A1714]">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="w-full h-[44px] px-4 border border-[#E2E8F0] rounded-[8px] focus:border-[#F27318] focus:ring-1 focus:ring-[#F27318] outline-none transition-all text-[15px]"
                      placeholder="e.g. name@example.com"
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[14px] font-medium text-[#1A1714]">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="w-full h-[44px] px-4 pr-12 border border-[#E2E8F0] rounded-[8px] focus:border-[#F27318] focus:ring-1 focus:ring-[#F27318] outline-none transition-all text-[15px]"
                        placeholder="••••••••"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#1A1714] border-none bg-transparent cursor-pointer"
                      >
                        {showPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={() => setRememberMe(!rememberMe)}
                        className="w-4 h-4 rounded border-[#E2E8F0] text-[#F27318] text-[13px] focus:ring-[#F27318] cursor-pointer"
                      />
                      <span className="text-[13px] text-[#64748B] group-hover:text-[#1A1714] transition-colors">
                        Remember me
                      </span>
                    </label>
                    <button
                      type="button"
                      className="text-[13px] font-medium text-[#F27318] hover:underline bg-transparent border-none p-0 cursor-pointer"
                    >
                      Forgot Password?
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoginPending}
                    className="w-full h-[44px] bg-[#F27318] hover:bg-[#D9620E] text-white font-semibold text-[14px] rounded-[8px] mt-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed border-none cursor-pointer"
                  >
                    {isLoginPending ? "Processing..." : "Login Now"}
                  </button>

                  <div className="relative flex items-center justify-center my-1">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-[#F1F5F9]"></div>
                    </div>
                    <span className="relative px-3 bg-white text-[11px] text-[#94A3B8] font-bold uppercase tracking-[0.1em]">
                      or
                    </span>
                  </div>

                  {/* Google Auth */}
                  <button
                    onClick={handleGoogleAuth}
                    type="button"
                    className="w-full h-[44px] bg-white border border-[#E2E8F0] hover:bg-gray-50 rounded-[8px] flex items-center justify-center gap-3 transition-all duration-300 font-semibold text-[#1A1714] cursor-pointer"
                  >
                    <FcGoogle size={20} />
                    <span className="text-[14px]">Sign in with Google</span>
                  </button>
                </form>
              ) : (
                /* SIGNUP FORM */
                <form
                  onSubmit={handleSignupSubmit}
                  className="flex flex-col gap-4"
                >
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[14px] font-medium text-[#1A1714]">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={signupFullName}
                      onChange={(e) => setSignupFullName(e.target.value)}
                      className="w-full h-[44px] px-4 border border-[#E2E8F0] rounded-[8px] focus:border-[#F27318] focus:ring-1 focus:ring-[#F27318] outline-none transition-all text-[15px]"
                      placeholder="e.g. John Doe"
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[14px] font-medium text-[#1A1714]">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      className="w-full h-[44px] px-4 border border-[#E2E8F0] rounded-[8px] focus:border-[#F27318] focus:ring-1 focus:ring-[#F27318] outline-none transition-all text-[15px]"
                      placeholder="e.g. name@example.com"
                      required
                    />
                  </div>

                  <p className="text-[12px] text-[#64748B] text-center">
                    By continuing, I agree to the{" "}
                    <button
                      type="button"
                      className="text-[#F27318] font-bold hover:underline bg-transparent border-none p-0 cursor-pointer"
                    >
                      Terms of Use
                    </button>{" "}
                    &{" "}
                    <button
                      type="button"
                      className="text-[#F27318] font-bold hover:underline bg-transparent border-none p-0 cursor-pointer"
                    >
                      Privacy Policy
                    </button>
                  </p>

                  <button
                    type="submit"
                    disabled={isSendMagicLinkPending}
                    className="w-full h-[44px] bg-[#F27318] hover:bg-[#D9620E] text-white font-semibold text-[14px] rounded-[8px] mt-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed border-none cursor-pointer"
                  >
                    {isSendMagicLinkPending ? "Sending..." : "Send Magic Link"}
                  </button>

                  <div className="relative flex items-center justify-center my-1">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-[#F1F5F9]"></div>
                    </div>
                    <span className="relative px-3 bg-white text-[11px] text-[#94A3B8] font-bold uppercase tracking-[0.1em]">
                      or
                    </span>
                  </div>

                  {/* Google Auth for Signup */}
                  <button
                    onClick={handleGoogleAuth}
                    type="button"
                    className="w-full h-[44px] bg-white border border-[#E2E8F0] hover:bg-gray-50 rounded-[8px] flex items-center justify-center gap-3 transition-all duration-300 font-semibold text-[#1A1714] cursor-pointer"
                  >
                    <FcGoogle size={20} />
                    <span className="text-[14px]">Sign up with Google</span>
                  </button>
                </form>
              )}

              <div className="mt-8 text-center">
                <p className="text-[13px] text-[#64748B]">
                  {isLogin ? "New customer?" : "Already have an account?"}{" "}
                  <button
                    onClick={() =>
                      setAuthModalView(isLogin ? "signup" : "login")
                    }
                    className="text-[#F27318] font-medium hover:underline bg-transparent border-none p-0 cursor-pointer ml-1"
                  >
                    {isLogin ? "Create an account" : "Sign in"}
                  </button>
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
