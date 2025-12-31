"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { toast } from "react-toastify";
import {
  Loader2,
  Smartphone,
  Lock,
  Eye,
  EyeOff,
  type LucideIcon,
  ChevronLeft,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { authAPI } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useUserStore } from "@/lib/user-store";
import {
  GoogleCredentialResponse,
  initializeGoogleIdentity,
  loadGoogleIdentityScript,
  redirectToGoogleOAuth,
} from "@/lib/google-auth";

type OAuthProvider = {
  id: string;
  label: string;
  icon: string | LucideIcon;
};

interface StudentRegistrationProps {
  onSuccess?: () => Promise<void>;
  onOtpRequired?: (phoneNumber: string) => void;
}

const oauthProviders: OAuthProvider[] = [
  {
    id: "google",
    label: "Continue with Google",
    icon: "/google.png",
  },
];

const StudentRegistration: React.FC<StudentRegistrationProps> = ({
  onSuccess,
  onOtpRequired,
}) => {
  const router = useRouter();
  const { refreshUser } = useAuth();

  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    contactNumber: "",
    username: "",
    otpvalue: "",
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [otpSend, setotpSend] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const otpRefs = React.useRef<Array<HTMLInputElement | null>>([]);

  const handleRegisterSuccess = useCallback(async () => {
    await refreshUser();
    if (onSuccess) await onSuccess();

    const latestUser = useUserStore.getState().user;
    const role = latestUser?.role;
    const isProfileCompleted = !!latestUser?.isProfileCompleted;

    if (role === "STUDENT") {
      router.replace(isProfileCompleted ? "/dashboard" : "/student/onboarding");
    }
  }, [refreshUser, onSuccess, router]);

  // 🔹 Google Identity
  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) return console.error("Missing GOOGLE_CLIENT_ID");

    let isMounted = true;
    (async () => {
      const loaded = await loadGoogleIdentityScript();
      if (!loaded) return console.error("Failed to load Google script");

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
            const response = await authAPI.googleAuth(credential);
            if (!response.success)
              throw new Error(response.message || "Google sign-up failed");
            await handleRegisterSuccess();
          } catch (err) {
            console.error("Google auth error:", err);
          } finally {
            setLoadingProvider(null);
          }
        },
      });

      if (isMounted) setIsScriptLoaded(true);
    })();

    return () => {
      isMounted = false;
    };
  }, [handleRegisterSuccess]);

  // 🔹 Google click handler
  const handleGoogleClick = useCallback(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";
    const redirectUri = process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI ?? "";
    const state = JSON.stringify({
      state: "student",
      type: "register",
      device: "web",
    });
    redirectToGoogleOAuth({
      clientId,
      redirectUri,
      userType: "student",
      state,
      type: "register",
    });
  }, []);

  // 🔹 Input change handler
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formError) setFormError(null);
  };

  // 🔹 Form submission
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    const sanitizedPhone = formData.contactNumber.replace(/\D/g, "");

    if (!/^\d{10}$/.test(sanitizedPhone)) {
      toast.error("Phone number must be exactly 10 digits.");
      return setFormError("Phone number must be exactly 10 digits.");
    }

    setIsLoading(true);
    try {
      const response = await authAPI.signUp({
        contactNumber: sanitizedPhone,
        password: formData.username,
        type: "student",
      });

      if (!response.success) {
        toast.error(response.message || "Registration failed.");
        return setFormError(response.message || "Registration failed.");
      }

      if (onOtpRequired) {
        onOtpRequired(sanitizedPhone);
      }
    } catch (err) {
      console.error("Registration error:", err);
      toast.error("Unexpected error. Please try again.");
      setFormError("Unexpected error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleotp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setFormError(null);

    try {
      // call api to send otp
      console.log("sending otp to ", formData.contactNumber);
      // so success otp send
      toast.success("OTP sent successfully");
      setotpSend(true);
    } catch (error) {
      console.error("Login error:", error);
      toast.error(error as string);
      setFormError("An error occurred during login. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  const handleResendotp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setFormError(null);
    setOtpTimer(30);

    try {
      // call api to resend otp
      console.log("sending otp to ", formData.contactNumber);
      // so success otp send
      toast.success("OTP sent successfully");
      setotpSend(true);
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Invalid OTP");

      setFormError("An error occurred during login. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  // 🔹 Providers
  const renderedProviders = useMemo(
    () =>
      oauthProviders.map((provider) => {
        const isGoogle = provider.id === "google";
        const isLoading = loadingProvider === provider.id;
        const disabled = isGoogle && !isScriptLoaded;

        return (
          <button
            key={provider.id}
            type="button"
            onClick={isGoogle ? handleGoogleClick : undefined}
            disabled={disabled}
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
                />
              )}
            </span>
            <span>{disabled ? "Loading Google..." : provider.label}</span>
          </button>
        );
      }),
    [isScriptLoaded, loadingProvider, handleGoogleClick]
  );

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;

    const otpArray = formData.otpvalue.split("");
    otpArray[index] = value;

    setFormData((prev) => ({
      ...prev,
      otpvalue: otpArray.join(""),
    }));
  };

  useEffect(() => {
    if (otpSend) {
      if (otpTimer === 0) return;

      const interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [otpTimer, otpSend]);

  useEffect(() => {
    if (otpSend) {
      // slight delay ensures DOM is painted
      setTimeout(() => {
        otpRefs.current[0]?.focus();
      }, 0);
    }
  }, [otpSend]);

  return (
    <>
      <section className="hidden sm:flex min-h-screen bg-white">
        desktop view
      </section>

      {/* // mobile view  */}
      <section className="sm:hidden  font-montserrat  min-h-screen bg-linear-to-b from-[#0222D7] to-[#000D56] flex flex-col text-white ">
        {/* upper blue box */}
        <div className="flex flex-col w-full h-[234px] p-4 pt-10 ">
          <div className="flex h-11 w-full pt-4 ">
            <div
              onClick={() => router.replace("/")}
              className=" h-full w-11 p-2.5 "
            >
              <ChevronLeft className="h-6 w-6" />
            </div>
          </div>

          <div className=" flex flex-1 mt-10 p-4">
            <div className=" w-[258px] text-[#ffffff] ">
              <div className="font-semibold pb-[5px] text-[25px] leading-none">
                SignUp
              </div>
              <p className=" opacity-70  text-[14px] leading-relaxed ">
                Please SignUp here to continue the application
              </p>
            </div>
          </div>
        </div>

        {/* lower white box */}
        <div className="w-full  flex-1  bg-white rounded-t-[30px]  text-gray-900 ">
          <div className="flex w-full h-[167px] justify-center mt-2  ">
            <img
              className="w-[167px] h-full"
              src="/login.gif"
              alt="Login GIF"
            />
          </div>

          {otpSend ? (
            // take otp form
            <div className="m-4 flex flex-col ">
              <div className="p-1 text-[#000000]">
                <h1 className="text-5  font-semibold">
                  Verify account with OTP
                </h1>
                <p className="text-[14px] text-gray-500 pl-1">
                  We have sent 6 digit code to {formData.contactNumber}
                </p>

                <form className="mt-6  space-y-6" onSubmit={handleSubmit}>
                  <div className="pb-[116px]  ">
                    {/* OTP INPUT BOXES */}
                    <div className="flex justify-start gap-3 mt-6 mb-0">
                      {[0, 1, 2, 3, 4, 5].map((i) => (
                        <input
                          key={i}
                          ref={(el) => {
                            if (el) otpRefs.current[i] = el;
                          }}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={formData.otpvalue[i] || ""}
                          onChange={(e) => {
                            handleOtpChange(i, e.target.value);

                            // move to next box on input
                            if (e.target.value && i < 5) {
                              otpRefs.current[i + 1]?.focus();
                            }
                          }}
                          onKeyDown={(e) => {
                            // move back on backspace
                            if (
                              e.key === "Backspace" &&
                              !formData.otpvalue[i] &&
                              i > 0
                            ) {
                              otpRefs.current[i - 1]?.focus();
                            }
                          }}
                          className={`
                            w-12 h-12 text-center text-lg font-semibold rounded-2
                            border
                            ${
                              formData.otpvalue[i]
                                ? "border-green-500"
                                : "border-gray-300"
                            }
                            focus:outline-none focus:ring-2 focus:ring-green-500
                          `}
                        />
                      ))}
                    </div>

                    {/* OTP TIMER */}
                    <div className="mt-4  text-start text-sm text-gray-500">
                      {otpTimer > 0 ? (
                        <>
                          Didn’t get a code?{" "}
                          <span className="text-blue-600 font-medium">
                            Resend OTP in 0:
                            {otpTimer.toString().padStart(2, "0")}
                          </span>
                        </>
                      ) : (
                        <button
                          onClick={handleResendotp}
                          className="text-blue-600 font-medium hover:underline"
                        >
                          Resend OTP
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <button
                      type="submit"
                      disabled={isLoading || !formData.otpvalue}
                      className={`w-full rounded-[30px] py-3 text-base font-semibold  text-[18px]   flex items-center justify-center bg-[#EEEEEE] text-[#B0B1B3]
                    disabled:bg-[#EEEEEE] disabled:opacity-60 disabled:cursor-not-allowed
                    enabled:bg-[#0222D7] enabled:text-white transition-colors duration-300 ease-in-out
                     `}
                    >
                      {isLoading && (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      )}
                      {isLoading ? "Verifying OTP..." : "Verify OTP "}
                    </button>
                    <div className="mt-[15px]">
                      <p className="w-[315px] text-[14px] text-[#060B13] pl-12 pr-12 text-center">
                        By continuing, you agree to our T&C and Privacy policy
                      </p>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          ) : (
            <div className="m-4 flex flex-col ">
              <div className="p-1 text-[#000000]">
                <h1 className="text-5  font-semibold">Enter your Details</h1>

                <form className="mt-6 space-y-6" onSubmit={handleotp}>
                  <div className="relative w-full">
  <input
    type="text"
    id="fullName"
    className="
      peer
      w-full h-[55px]
      rounded-[30px]
      border border-gray-300
      focus:border-[#0222D7]
      bg-white
      px-5 py-3
      text-[18px] text-[#000]
      outline-none
      focus:ring-0
    "
  />

  <label
  htmlFor="fullName"
  className="
    absolute left-5
    top-[-10px]
    bg-white px-2
    text-[16px]
    text-gray-300
    peer-focus:text-[#0222D7]
    transition-colors duration-200
    pointer-events-none
  "
>
  Full name
</label>

</div>


                  <label className="block">
                    <input
                      type="tel"
                      name="contactNumber"
                      value={formData.contactNumber}
                      placeholder="+91 Mobile Number"
                      required
                      disabled={isLoading}
                      onFocus={() => {
                        if (!formData.contactNumber) {
                          setFormData((prev) => ({
                            ...prev,
                            contactNumber: "+91 ",
                          }));
                        }
                      }}
                      onBlur={() => {
                        if (formData.contactNumber === "+91 ") {
                          setFormData((prev) => ({
                            ...prev,
                            contactNumber: "",
                          }));
                        }
                      }}
                      onChange={handleInputChange}
                      className="
                        w-full h-[53px] text-[18px] rounded-[30px]
                        border border-gray-200 bg-gray-50
                        py-3 pl-6 pr-4 text-base text-[#000000]
                        outline-none transition
                        hover:border-[#0222D7]
                        focus:border-[#0222D7] focus:bg-white
                        disabled:opacity-50 disabled:cursor-not-allowed
                      "
                    />
                  </label>

                  <button
                    type="submit"
                    disabled={isLoading || !formData.contactNumber}
                    className={`w-full rounded-[30px] py-3 text-base font-semibold  text-[18px]   flex items-center justify-center bg-[#EEEEEE] text-[#B0B1B3]
                    disabled:bg-[#EEEEEE] disabled:opacity-60 disabled:cursor-not-allowed
                    enabled:bg-[#0222D7] enabled:text-white transition-colors duration-300 ease-in-out
                     `}
                  >
                    {isLoading && <Loader2 className="h-5 w-5 animate-spin" />}
                    {isLoading ? "Sending OTP..." : "Continue "}
                  </button>
                </form>

                <div className="mt-6 text-center text-[16px]  text-[#000000]">
                  Don&apos;t have an account?{" "}
                  <button
                    onClick={() => router.push("/student/login")}
                    className="font-semibold text-blue-600 hover:underline"
                  >
                    Sign In
                  </button>
                </div>

                <div className="mt-6 flex items-center gap-3 text-xs text-gray-400">
                  <span className="h-px flex-1 bg-gray-200" />
                  <span>Or Login with</span>
                  <span className="h-px flex-1 bg-gray-200" />
                </div>
                <div className="mt-6 ">{renderedProviders}</div>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
};

export default StudentRegistration;
