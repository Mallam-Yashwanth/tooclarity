"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import InputField from "@/components/ui/InputField";
import { useAuth } from "@/lib/auth-context";
import { useUserStore } from "@/lib/user-store";
import { authAPI } from "@/lib/api";

import {
  initializeGoogleIdentity,
  loadGoogleIdentityScript,
  GoogleCredentialResponse,
  redirectToGoogleOAuth,
} from "@/lib/google-auth";

type LoginCaller = "admin" | "institution";

type OAuthProvider = {
  id: string;
  label: string;
  icon: string | LucideIcon;
};

const oauthProviders: OAuthProvider[] = [
  {
    id: "google",
    label: "Continue with Google",
    icon: "/google.png",
  },
//   {
//     id: "microsoft",
//     label: "Continue with Microsoft",
//     icon: "/window.svg",
//   },
//   {
//     id: "apple",
//     label: "Continue with Apple",
//     icon: Apple,
//   },
];
interface LoginDialogBoxProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caller?: LoginCaller;
  onSuccess?: () => void;
}

const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 488 512">
    <path
      fill="#4285F4"
      d="M488 261.8c0-17.7-1.6-35.3-4.7-52H249v98h134c-6 32-24.4 59-52 77l84 65c49-45 77-111 77-188z"
    />
    <path
      fill="#34A853"
      d="M249 492c70 0 129-23 172-62l-84-65c-23 15-52 24-88 24-68 0-125-46-146-107H17v67c43 86 132 143 232 143z"
    />
    <path
      fill="#FBBC05"
      d="M103 282c-5-15-8-30-8-46s3-31 8-46V123H17a243 243 0 0 0 0 266l86-67z"
    />
    <path
      fill="#EA4335"
      d="M249 97c38 0 72 13 98 39l74-74C378 23 319 0 249 0 149 0 60 57 17 141l86 67c21-61 78-107 146-107z"
    />
  </svg>
);

const MicrosoftIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 23 23">
    <path fill="#f25022" d="M1 1h10v10H1z" />
    <path fill="#00a4ef" d="M12 1h10v10H12z" />
    <path fill="#7fba00" d="M1 12h10v10H1z" />
    <path fill="#ffb900" d="M12 12h10v10H12z" />
  </svg>
);

const AppleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 384 512">
    <path
      fill="currentColor"
      d="M318.7 268c-.2-36.7 16-64.6 49-85.2-18.6-26.8-46.7-41.7-83.7-45-35.1-3.1-74 20.7-87.8 20.7-14.5 0-51.4-19.6-79.7-19.1-41 0-79.8 23.8-100.9 60.8-43.2 75-11.1 186 30.8 247 20.4 29.4 44.8 62.5 77 61 30.6-1.2 42.2-19.7 79.2-19.7 36.6 0 47 19.7 79.2 19.1 32.9-.5 53.6-29.5 73.7-58.9 22.9-33.5 32.3-66.1 32.6-67.8-1-.4-62.5-24-62.7-94.9zM251.1 79c15.6-18.9 26.2-45.1 23.3-71.5-22.4 1-49.4 15-65.4 33.9-14.3 17.1-27 44.7-23.6 70.8 25 .9 50.7-12.7 65.7-33.2z"
    />
  </svg>
);

export default function LoginDialogBox({
  open,
  onOpenChange,
  caller = "institution",
  onSuccess,
}: LoginDialogBoxProps) {
  const router = useRouter();
  const { login, refreshUser } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);

  // Forgot Password State
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [forgotPasswordError, setForgotPasswordError] = useState("");
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [timer, setTimer] = useState(20);
  const [canResend, setCanResend] = useState(false);

  // Google OAuth State
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);

  // ✅ Initialize Google Identity
  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      console.error("NEXT_PUBLIC_GOOGLE_CLIENT_ID is not configured");
      return;
    }

    let isMounted = true;

    const initialize = async () => {
      const loaded = await loadGoogleIdentityScript();
      if (!loaded) {
        console.error("Failed to load Google Identity Services script");
        return;
      }

      try {
        initializeGoogleIdentity({
          clientId,
          autoSelect: false,
          uxMode: "redirect",
          callback: async ({ credential }: GoogleCredentialResponse) => {
            if (!credential) {
              setLoadingProvider(null);
              return;
            }

            try {
              // 🔹 Send credential to backend for institution login
              const response = await authAPI.googleAuth(credential);
              if (!response.success) {
                console.error("Google sign-in failed", response.message);
                return;
              }

              await refreshUser();
              const latestUser = useUserStore.getState().user;

              onOpenChange(false);

              if (onSuccess) {
                onSuccess();
                return;
              }

              // 🔹 Redirects based on institution user profile
              if (latestUser?.role === "INSTITUTE_ADMIN") {
                if (!latestUser.isPaymentDone && !latestUser.isProfileCompleted) {
                  router.push("/signup");
                  return;
                }
                if (!latestUser.isPaymentDone && latestUser.isProfileCompleted) {
                  router.push("/payment");
                  return;
                }
                if (latestUser.isPaymentDone && latestUser.isProfileCompleted) {
                  router.push("/dashboard");
                  return;
                }
              }

              router.push("/");
            } catch (error) {
              console.error("Error sending Google token", error);
            } finally {
              setLoadingProvider(null);
            }
          },
        });

        if (isMounted) setIsScriptLoaded(true);
      } catch (error) {
        console.error("Failed to initialize Google Identity Services", error);
      }
    };

    void initialize();
    return () => {
      isMounted = false;
    };
  }, [refreshUser, router, onOpenChange, onSuccess]);

  // ✅ Handle Google OAuth button click
  const handleGoogleClick = () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";
    const redirectUri = process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI ?? "";
    const state = JSON.stringify({ state: "institution", type: "login", device: "web" });

    redirectToGoogleOAuth({
      clientId,
      redirectUri,
      userType: "institution",
      state: state,
      type: "login",
    });
  };

  // Forgot Password Timer Effect
  useEffect(() => {
    if (emailSent && timer > 0) {
      const interval = setInterval(() => setTimer((t) => t - 1), 1000);
      return () => clearInterval(interval);
    } else if (timer === 0) {
      setCanResend(true);
    }
  }, [emailSent, timer]);

  const validateEmail = (email: string) => {
    const trimmed = email.trim();
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(trimmed);
  };

  const handleForgotPassword = async () => {
    setForgotPasswordError("");

    if (!forgotPasswordEmail.trim()) {
      setForgotPasswordError("Email address is required.");
      return;
    }

    if (!validateEmail(forgotPasswordEmail)) {
      setForgotPasswordError("Please enter a valid email address.");
      return;
    }

    setForgotPasswordLoading(true);

    try {
      const response = await authAPI.forgotPassword(forgotPasswordEmail);

      if (response.success) {
        setEmailSent(true);
        setTimer(20);
        setCanResend(false);
      } else {
        setForgotPasswordError(response.message || "Failed to send reset email. Please try again.");
      }
    } catch (error) {
      setForgotPasswordError("Network error. Please try again.");
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const handleResendForgotPassword = async () => {
    setForgotPasswordLoading(true);

    try {
      const response = await authAPI.forgotPassword(forgotPasswordEmail);

      if (response.success) {
        setTimer(20);
        setCanResend(false);
      } else {
        setForgotPasswordError(response.message || "Failed to resend email. Please try again.");
      }
    } catch (error) {
      setForgotPasswordError("Network error. Please try again.");
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.email.trim()) newErrors.email = "Email is required.";
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = "Please enter a valid email.";
    if (!formData.password.trim()) newErrors.password = "Password is required.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setLoading(true);
    setErrors({});

    try {
      const success = await login(formData.email, formData.password, caller);

      if (success) {
        await refreshUser();
        const user = useUserStore.getState().user;

        onOpenChange(false);
        setFormData({ email: "", password: "" });

        if (onSuccess) return onSuccess();

        if (user?.role === "INSTITUTE_ADMIN") {
          if (!user?.isProfileCompleted && !user?.isPaymentDone) router.push("/signup");
          else if (user?.isProfileCompleted && !user?.isPaymentDone) router.push("/payment");
          else router.push("/dashboard");
          return;
        }

        router.push("/");
      } else {
        setErrors({ general: "Invalid email or password. Please try again." });
      }
    } catch {
      setErrors({ general: "Network error. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  // ---- Render OAuth Providers ----
  const renderedProviders = useMemo(
    () =>
      oauthProviders.map((provider) => {
        const isGoogle = provider.id === "google";
        const isLoading = loadingProvider === provider.id;
        const disableGoogleButton = isGoogle && !isScriptLoaded;

        return (
          <button
            key={provider.id}
            type="button"
            onClick={isGoogle ? handleGoogleClick : undefined}
            disabled={disableGoogleButton}
            className="flex w-full items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-900 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Image
                  src={provider.icon as string}
                  alt={provider.label}
                  width={20}
                  height={20}
                  className="object-contain"
                />
              )}
            </span>
            <span>
              {disableGoogleButton ? "Loading Google..." : provider.label}
            </span>
          </button>
        );
      }),
    [handleGoogleClick, isScriptLoaded, loadingProvider]
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg flex flex-col justify-between scrollbar-hide"
        overlayClassName="bg-black/50"
        >
          <DialogHeader className="flex flex-col items-center gap-2">
            <DialogTitle className="text-xl sm:text-[24px] font-bold">
              Welcome Back!
            </DialogTitle>
            <DialogDescription className="text-center text-gray-600">
              Please sign in to your account
            </DialogDescription>
          </DialogHeader>

          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-sm text-center">
              {errors.general}
            </div>
          )}

          <div className="grid gap-4">
            {!showForgotPassword ? (
              <>
                <InputField
                  label="Email Address"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  error={errors.email}
                />

                <InputField
                  label="Password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  error={errors.password}
                  icon={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  }
                />

                <div className="text-right">
                  <button
                    onClick={() => setShowForgotPassword(true)}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="text-center mb-4">
                  <button
                    onClick={() => {
                      setShowForgotPassword(false);
                      setEmailSent(false);
                      setForgotPasswordEmail("");
                      setForgotPasswordError("");
                    }}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    ← Back to login
                  </button>
                </div>

                <InputField
                  label="Email Address"
                  name="forgotEmail"
                  type="email"
                  placeholder="Enter your registered email"
                  value={forgotPasswordEmail}
                  onChange={(e) => setForgotPasswordEmail(e.target.value)}
                  required
                  error={forgotPasswordError}
                />

                {forgotPasswordError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-sm text-center">
                    {forgotPasswordError}
                  </div>
                )}

                {!emailSent ? (
                  <Button
                    onClick={handleForgotPassword}
                    disabled={forgotPasswordLoading}
                    className="w-full h-12 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                  >
                    {forgotPasswordLoading ? "Sending..." : "Send Reset Link"}
                  </Button>
                ) : (
                  <div className="text-center">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-green-600 text-sm mb-4">
                      Password reset link sent! Please check your email.
                    </div>

                    <div className="text-sm text-gray-600 mb-4">
                      Didn't receive the email? Please wait and check your spam folder.
                    </div>

                    <Button
                      onClick={handleResendForgotPassword}
                      disabled={forgotPasswordLoading || !canResend}
                      variant="outline"
                      className="w-full"
                    >
                      {forgotPasswordLoading ? "Sending..." : canResend ? "Resend Email" : `Resend in ${timer}s`}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>

          {!showForgotPassword && (
            <div className="flex flex-col gap-4 mt-4">
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full h-12 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
              >
                {loading ? "Signing In..." : "Sign In"}
              </Button>
            </div>
          )}

          {/* Google OAuth Section - Only show for login */}
          {!showForgotPassword && (
            <>
              <div className="flex items-center gap-3 text-xs text-gray-400">
                <span className="h-px flex-1 bg-gray-200" />
                <span>OR</span>
                <span className="h-px flex-1 bg-gray-200" />
              </div>
              <div className="space-y-3">{renderedProviders}</div>
            </>
          )}

        </DialogContent>
      </Dialog>
    </>
  );
}