import { useState } from "react";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { API_V1_URL } from "../../config/constants";
import { useLogin } from "../../hooks/auth/useLoginTan";
import useAuthStore from "../../store/authStore";
import { toast } from "react-toastify";
import formatError from "../../utils/errorHandler";

const inputBaseStyle = {
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "#E5E7EB",
  background: "#FFFFFF",
  outline: "none",
};

const inputFocusStyle = {
  borderColor: "#0D9488",
  boxShadow: "none",
  outline: "none",
};

const inputBlurStyle = {
  borderColor: "#E5E7EB",
  boxShadow: "none",
  outline: "none",
};

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const { signIn } = useAuthStore();
  const { mutate: login, isPending } = useLogin();

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);

    login(
      { email, password },
      {
        onSuccess: (data) => {
          const user = data.data.user;
          signIn(user, data.token);
          toast.success(`Welcome back, ${user.firstName}!`);
          navigate("/");
          setIsLoading(false);
        },
        onError: (error) => {
          const message = formatError(error);
          toast.error(message);
          setIsLoading(false);
        },
      },
    );
  };

  const handleGoogleLogin = () => {
    window.location.href = `${API_V1_URL}/auth/google`;
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-6 py-12 font-dm-sans bg-white">
      <div className="w-full max-w-sm mb-8">
        <button
          onClick={() => navigate("/")}
          className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors hover:opacity-70"
          style={{ color: "#64748B" }}
        >
          <ArrowLeft size={14} />
          Back to home
        </button>
      </div>

      <div className="w-full max-w-sm">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back
          </h1>
          <p className="text-base text-gray-600">
            Sign in to your Aura Interiors account.
          </p>
        </div>

        <button
          onClick={handleGoogleLogin}
          className="w-full py-3 bg-white border border-neutral-200 hover:bg-neutral-50 rounded-lg flex items-center justify-center gap-3 transition-all duration-300 font-dm-sans mb-6"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          <span className="text-neutral-700 font-semibold">
            Continue with Google
          </span>
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px" style={{ background: "#E5E7EB" }} />
          <span className="text-sm font-medium text-gray-400">
            or sign in with email
          </span>
          <div className="flex-1 h-px" style={{ background: "#E5E7EB" }} />
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label className="text-base font-semibold text-gray-700">
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg px-4 py-3 text-base transition-colors"
              placeholder="you@example.com"
              style={inputBaseStyle}
              onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
              onBlur={(e) => Object.assign(e.target.style, inputBlurStyle)}
              required
            />
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between">
              <label className="text-base font-semibold text-gray-700">
                Password
              </label>
              <button
                type="button"
                onClick={() => navigate("/forgot-password")}
                className="text-sm font-medium hover:underline transition-colors"
                style={{ color: "#0D9488" }}
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg px-4 py-3 pr-11 text-base transition-colors"
                placeholder="••••••••"
                style={inputBaseStyle}
                onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                onBlur={(e) => Object.assign(e.target.style, inputBlurStyle)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Remember me */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setRememberMe(!rememberMe)}
              className="w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0"
              style={{
                borderColor: rememberMe ? "#0D9488" : "#E5E7EB",
                background: rememberMe ? "#0D9488" : "#FFFFFF",
              }}
            >
              {rememberMe && (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path
                    d="M2 5l2.5 2.5L8 3"
                    stroke="#fff"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>
            <span className="text-sm text-gray-600">
              Remember me for 30 days
            </span>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading || isPending}
            className="w-full rounded-lg py-3 text-base font-bold text-white transition-all hover:opacity-90 active:scale-[0.98] mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: "#0D9488" }}
          >
            {isLoading || isPending ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Don't have an account?{" "}
          <button
            onClick={() => navigate("/signup")}
            className="font-semibold hover:underline transition-colors"
            style={{ color: "#0D9488" }}
          >
            Sign up free
          </button>
        </p>
      </div>
    </div>
  );
}
