import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, ShieldCheck, ArrowLeft, ChevronLeft, ChevronRight, Eye, EyeOff } from "lucide-react";
import { useAdminLogin, useAdminVerifyOtp } from "../../hooks/auth/useAdminAuth";
import useAuthStore from "../../store/authStore";
import { toast } from "react-toastify";
import formatError from "../../utils/errorHandler";

const CAROUSEL_SLIDES = [
  {
    image:
      "https://images.unsplash.com/photo-1618220048045-10a6dbdf83e0?q=80&w=1480&auto=format&fit=crop",
    title: "Curating Space, Elevating Lifestyles",
    subtitle:
      "Manage luxury showroom collections, real-time client consultations, and digital interior catalogs.",
  },
  {
    image:
      "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=1480&auto=format&fit=crop",
    title: "Every Detail, Perfectly Placed",
    subtitle:
      "From product inventory to client orders — everything you need to run a world-class interiors brand.",
  },
  {
    image:
      "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=1480&auto=format&fit=crop",
    title: "Where Design Meets Intelligence",
    subtitle:
      "Real-time analytics, team tools, and seamless operations all in one secure administrative suite.",
  },
];

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const { signIn, isAuthenticated, user } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpValues, setOtpValues] = useState(["", "", "", "", "", ""]);
  const otp = otpValues.join("");
  const [step, setStep] = useState(1); // 1 = Login, 2 = OTP
  const [timer, setTimer] = useState(300); // 5 minutes countdown
  const [showPassword, setShowPassword] = useState(false);

  // Carousel state
  const [activeSlide, setActiveSlide] = useState(0);
  const carouselRef = useRef(null);

  const { mutate: login, isPending: isLoggingIn } = useAdminLogin();
  const { mutate: verifyOtp, isPending: isVerifying } = useAdminVerifyOtp();

  const inputRefs = useRef([]);

  // Focus first input on entering step 2
  useEffect(() => {
    if (step === 2) {
      const focusTimer = setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 50);
      return () => clearTimeout(focusTimer);
    }
  }, [step]);

  const handleOtpChange = (index, value) => {
    const lastChar = value.slice(-1);
    const cleanedValue = lastChar.replace(/\D/g, "");

    const newOtpValues = [...otpValues];
    newOtpValues[index] = cleanedValue;
    setOtpValues(newOtpValues);

    if (cleanedValue && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace") {
      if (!otpValues[index] && index > 0) {
        const newOtpValues = [...otpValues];
        newOtpValues[index - 1] = "";
        setOtpValues(newOtpValues);
        inputRefs.current[index - 1]?.focus();
      } else {
        const newOtpValues = [...otpValues];
        newOtpValues[index] = "";
        setOtpValues(newOtpValues);
      }
      e.preventDefault();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pastedData) {
      const newOtpValues = [...otpValues];
      for (let i = 0; i < 6; i++) {
        newOtpValues[i] = pastedData[i] || "";
      }
      setOtpValues(newOtpValues);
      const focusIndex = Math.min(pastedData.length, 5);
      inputRefs.current[focusIndex]?.focus();
    }
  };

  // If already authenticated as admin, redirect to admin dashboard
  useEffect(() => {
    if (isAuthenticated && user?.role === "admin") {
      navigate("/dashboard");
    }
  }, [isAuthenticated, user, navigate]);

  // Countdown timer for OTP
  useEffect(() => {
    let interval = null;
    if (step === 2 && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  // Auto-advance carousel every 5 seconds
  useEffect(() => {
    const id = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % CAROUSEL_SLIDES.length);
    }, 5000);
    return () => clearInterval(id);
  }, []);

  const prevSlide = () =>
    setActiveSlide((prev) => (prev - 1 + CAROUSEL_SLIDES.length) % CAROUSEL_SLIDES.length);
  const nextSlide = () =>
    setActiveSlide((prev) => (prev + 1) % CAROUSEL_SLIDES.length);

  /**
   * Resolves a login-specific error into a professional, actionable message.
   * Avoids exposing security-sensitive details while still being helpful.
   */
  const resolveLoginError = (error) => {
    if (!error) return "Something went wrong. Please try again.";

    // Network / no response
    if (!error.response) {
      return "Unable to reach the server. Please check your connection and try again.";
    }

    const status = error.response?.status;
    const serverMsg = (error.response?.data?.message || "").toLowerCase();

    if (status === 401 || status === 404) {
      // Backend hints at email not existing
      if (
        serverMsg.includes("not found") ||
        serverMsg.includes("no account") ||
        serverMsg.includes("does not exist") ||
        serverMsg.includes("user not found")
      ) {
        return "No account found with that email address. Please double-check and try again.";
      }
      // Hints at wrong password
      if (
        serverMsg.includes("password") ||
        serverMsg.includes("credentials") ||
        serverMsg.includes("invalid")
      ) {
        return "Incorrect email or password. Please try again.";
      }
      // Generic 401 for login context
      return "Incorrect email or password. Please try again.";
    }

    if (status === 429) {
      return "Too many login attempts. Please wait a moment before trying again.";
    }

    if (status === 403) {
      return "Your account does not have administrative access.";
    }

    if (status >= 500) {
      return "Our servers are experiencing an issue. Please try again in a moment.";
    }

    // Fall back to server message if it looks user-friendly
    const raw = error.response?.data?.message;
    if (raw && typeof raw === "string" && raw.length > 0) return raw;

    return "Something went wrong. Please try again.";
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) return;

    login(
      { email, password },
      {
        onSuccess: (data) => {
          if (data.otpRequired) {
            setStep(2);
            setTimer(300);
            toast.success("Verification code sent to your email.");
          }
        },
        onError: (error) => {
          toast.error(resolveLoginError(error));
        },
      }
    );
  };

  const handleOtpSubmit = (e) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      toast.error("Please enter a valid 6-digit code.");
      return;
    }

    verifyOtp(
      { email, otp },
      {
        onSuccess: (data) => {
          signIn(data.data.user, data.token);
          toast.success("Welcome back, Administrator!");
          navigate("/dashboard");
        },
        onError: (error) => {
          toast.error(formatError(error) || "Invalid or expired verification code.");
        },
      }
    );
  };

  const handleResendOtp = (e) => {
    e.preventDefault();
    login(
      { email, password },
      {
        onSuccess: () => {
          setTimer(300);
          toast.success("A new verification code has been sent.");
        },
        onError: (error) => {
          toast.error(resolveLoginError(error));
        },
      }
    );
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const slide = CAROUSEL_SLIDES[activeSlide];

  return (
    <div className="min-h-screen w-full flex bg-[#FCFBF7] font-dm-sans overflow-hidden">

      {/* LEFT PANEL: Image Carousel */}
      <div
        ref={carouselRef}
        className="hidden lg:flex lg:w-1/2 relative flex-col justify-end overflow-hidden select-none"
      >
        {/* Slide images with crossfade */}
        {CAROUSEL_SLIDES.map((s, i) => (
          <div
            key={i}
            className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000"
            style={{
              backgroundImage: `url('${s.image}')`,
              opacity: i === activeSlide ? 1 : 0,
            }}
          />
        ))}

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A]/90 via-[#1A1714]/40 to-black/10 z-0" />

        {/* Bottom content */}
        <div className="relative z-10 p-12 pb-10">
          <div className="max-w-[480px]">
            <h1
              key={activeSlide + "-title"}
              className="text-[36px] font-bold text-white leading-tight tracking-tight mb-3 transition-all duration-700"
            >
              {slide.title}
            </h1>
            <p className="text-white/70 text-[14px] leading-relaxed mb-8">
              {slide.subtitle}
            </p>
          </div>

          {/* Carousel Controls Row */}
          <div className="flex items-center gap-4">
            {/* Dot indicators */}
            <div className="flex items-center gap-2 flex-1">
              {CAROUSEL_SLIDES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveSlide(i)}
                  className="transition-all duration-300 rounded-full border-none cursor-pointer p-0"
                  style={{
                    width: i === activeSlide ? "28px" : "8px",
                    height: "8px",
                    backgroundColor:
                      i === activeSlide ? "#0066FF" : "rgba(255,255,255,0.35)",
                  }}
                />
              ))}
            </div>

            {/* Arrow buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={prevSlide}
                className="w-9 h-9 rounded-full flex items-center justify-center border border-white/20 bg-white/10 hover:bg-white/20 text-white transition-all duration-200 cursor-pointer backdrop-blur-sm"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={nextSlide}
                className="w-9 h-9 rounded-full flex items-center justify-center border border-white/20 bg-white/10 hover:bg-white/20 text-white transition-all duration-200 cursor-pointer backdrop-blur-sm"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* System footer */}
          <div className="mt-6 pt-5 border-t border-white/10 flex items-center justify-between text-white/40 text-[11px]">
            <span>System status: Operational</span>
            <span>SECURE ACCESS ONLY</span>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: Authentication Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 md:p-16 relative bg-white">

        <div className="w-full max-w-[420px] relative z-10 flex flex-col">

          {/* Form Header */}
          <div className="mb-8">
            <img
              src="/logo.png"
              alt="Aura Interiors"
              className="h-10 w-auto object-contain mb-6 select-none"
            />
            <h2 className="text-[28px] font-extrabold text-[#1A1714] tracking-tight">
              {step === 1 ? "Sign in to your account" : "Verify Identity"}
            </h2>
            <p className="text-neutral-500 text-[14px] mt-2">
              {step === 1
                ? "Enter your email and password to access the management suite."
                : "Enter the 6-digit one-time code sent to your email."}
            </p>
          </div>

          {step === 1 ? (
            /* STEP 1: PASSWORD LOGIN */
            <form onSubmit={handleLoginSubmit} className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-bold text-neutral-700 tracking-wider uppercase">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-[48px] pl-11 pr-4 bg-[#F0F5FF] hover:bg-[#E5EEFF] border border-transparent rounded-[8px] focus:border-[#0066FF] focus:ring-1 focus:ring-[#0066FF] outline-none transition-all duration-200 text-[15px] text-[#1A1714] placeholder-neutral-400"
                    placeholder="admin@aurainteriors.com"
                    required
                  />
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-bold text-neutral-700 tracking-wider uppercase">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-[48px] pl-11 pr-11 bg-[#F0F5FF] hover:bg-[#E5EEFF] border border-transparent rounded-[8px] focus:border-[#0066FF] focus:ring-1 focus:ring-[#0066FF] outline-none transition-all duration-200 text-[15px] text-[#1A1714] placeholder-neutral-400"
                    placeholder="••••••••••••"
                    required
                  />
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 bg-transparent border-none cursor-pointer p-0 transition-colors duration-200"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password Row */}
              <div className="flex items-center justify-between text-[13px] mt-1 select-none">
                <label className="flex items-center gap-2 cursor-pointer text-neutral-600 font-medium">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-neutral-300 text-[#0066FF] focus:ring-[#0066FF] cursor-pointer"
                  />
                  <span>Remember me</span>
                </label>
                <button
                  type="button"
                  className="text-neutral-500 hover:text-[#0066FF] font-semibold bg-transparent border-none cursor-pointer p-0 transition-colors duration-200"
                >
                  Forgot Password?
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full h-[48px] bg-[#0066FF] hover:bg-[#0052CC] text-white font-bold text-[14px] tracking-wide rounded-[8px] mt-4 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed border-none cursor-pointer flex items-center justify-center gap-2"
              >
                {isLoggingIn ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    Authenticating...
                  </>
                ) : (
                  "Continue"
                )}
              </button>
            </form>
          ) : (
            /* STEP 2: OTP VERIFICATION */
            <form onSubmit={handleOtpSubmit} className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-bold text-neutral-700 tracking-wider uppercase">
                  Verification Code
                </label>
                <div className="flex justify-between items-center gap-2 my-2" onPaste={handleOtpPaste}>
                  {otpValues.map((val, i) => (
                    <input
                      key={i}
                      ref={(el) => (inputRefs.current[i] = el)}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={val}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      className="w-12 h-14 text-center text-[22px] font-bold bg-[#F0F5FF] hover:bg-[#E5EEFF] border border-transparent rounded-[8px] focus:bg-white focus:border-[#0066FF] focus:ring-1 focus:ring-[#0066FF] outline-none transition-all duration-200 text-[#1A1714]"
                      required
                    />
                  ))}
                </div>
                <div className="flex justify-between items-center text-[12px] text-neutral-500 mt-2">
                  <span>Code expires in: <strong className="text-[#1A1714]">{formatTime(timer)}</strong></span>
                  {timer === 0 ? (
                    <button
                      onClick={handleResendOtp}
                      disabled={isLoggingIn}
                      className="text-[#0066FF] hover:underline font-semibold bg-transparent border-none cursor-pointer p-0"
                    >
                      Resend Code
                    </button>
                  ) : (
                    <span>Wait before resending</span>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={isVerifying || otp.length !== 6}
                className="w-full h-[48px] bg-[#0066FF] hover:bg-[#0052CC] text-white font-bold text-[14px] tracking-wide rounded-[8px] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed border-none cursor-pointer flex items-center justify-center gap-2"
              >
                {isVerifying ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    Verifying...
                  </>
                ) : (
                  "Verify & Log In"
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setOtpValues(["", "", "", "", "", ""]);
                }}
                className="text-neutral-500 hover:text-[#0066FF] text-[13px] font-semibold transition-all duration-200 bg-transparent border-none cursor-pointer flex items-center justify-center gap-1.5 mt-2"
              >
                <ArrowLeft size={14} />
                Back to Password Sign In
              </button>
            </form>
          )}

          {/* Secure disclaimer */}
          <div className="mt-12 text-center border-t border-neutral-200 pt-6">
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              Secure administrative gateway. Unauthorized access or actions violate security protocols and will be logged.
            </p>
          </div>

        </div>
      </div>

    </div>
  );
}
