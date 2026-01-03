"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import { toast } from "react-toastify";
import {
  Loader2,
  Smartphone,
  
  type LucideIcon,
  ChevronLeft,
  
} from "lucide-react";
import { useRouter } from "next/navigation";

import { authAPI, LoginData } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import {
  initializeGoogleIdentity,
  loadGoogleIdentityScript,
  GoogleCredentialResponse,
  redirectToGoogleOAuth,
} from "@/lib/google-auth";

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

interface StudentLoginProps {
  onSuccess?: () => void;
}

const StudentLogin: React.FC<StudentLoginProps> = ({ onSuccess }) => {
  const router = useRouter();
  const { login, refreshUser } = useAuth();

  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<LoginData>({
    contactNumber: "",
    password: "",
    type: "student",
  });
  const [otpSend, setotpSend] = useState(false);
  const [otpError, setotpError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otpTimer, setOtpTimer] = useState(30);
  const otpRefs = useRef<HTMLInputElement[]>([]);
  const desktopOtpRefs = useRef<HTMLInputElement[]>([]);
  const [buttonDisabled, setButtonDisabled] = useState(true);



  

  // Load Google Script
  React.useEffect(() => {
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
              const response = await authAPI.googleAuth(credential);
              if (!response.success) {
                console.error("Google sign-in failed", response.message);
                return;
              }

              await refreshUser();

              // If parent provided a success handler, use it
              if (onSuccess) {
                onSuccess();
                return;
              }
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
  }, [refreshUser, router, onSuccess]);

  const handleGoogleClick = useCallback(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";
    const redirectUri = process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI ?? "";
    const state = JSON.stringify({
      state: "student",
      type: "login",
      device: "web",
    });
    redirectToGoogleOAuth({
      clientId,
      redirectUri,
      userType: "student",
      state: state,
      type: "login",
    });
  }, []);

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    const phone = formData.contactNumber?.trim() || "";
    if (phone?.length === 9) {
      setButtonDisabled(false);
    } else setButtonDisabled(true);

    // Clear error when user starts typing
    if (error) setError(null);
  };

  // Handle form submission
   const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    
    setIsLoading(true);
    setError(null);
    try {
      const response = await authAPI.verifyOTP({
        otp: formData.password || "",
        contactNumber: formData.contactNumber || "",
        isLogin: true,
      });




      if (response?.success) {
        if (onSuccess) {
          onSuccess();
        }

        await refreshUser();

     
      
      toast.success("Login successful!");
      router.replace("/dashboard");
      } else {
        setotpError(true);
        setFormData((prev) => ({
          ...prev,
          password: "",
        }));

        setError( "Login failed");
        toast.error("Login failed");
         return;
      }

     

      
    } catch (error) {
      setotpError(true);
      setFormData((prev) => ({
        ...prev,
        password: "",
      }));
      console.error("Login error:", error);
      toast.error(error as string);
      setError("An error occurred during login. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
  if (!otpSend) return;

  setTimeout(() => {
    const isMobile = window.innerWidth < 640;

    if (isMobile) {
      otpRefs.current[0]?.focus();
    } else {
      desktopOtpRefs.current[0]?.focus();
    }
  }, 0);
}, [otpSend]);


  // handle  send otp
  const handleotp = async (e: React.FormEvent) => {
    e.preventDefault();
 
    const phone = formData.contactNumber?.trim() || "";

      if (!/^\d{10}$/.test(phone) ) {
        toast.error("Enter a valid 10-digit mobile number");
        return;
      }

    setotpSend(true);
    

    setIsLoading(true);
    setError(null);
    setotpError(false);
    try {
       
      // call api to send otp
      const response = await login(formData);

      if (!response) {
        toast.error(error as string);
        setButtonDisabled(true);
        setError("An error occurred during login. Please try again.");
        return;
      }




      toast.success("OTP sent successfully");
      setotpSend(true);
      
    } catch (error) {
    
      toast.error(error as string);
      setButtonDisabled(true);
      setError("An error occurred during login. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendotp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setOtpTimer(30);
    setotpError(false);
    try {
      // call api to resend otp
      
       const response = await authAPI.resendOTP(formData);
      
      if (!response) {
        toast.error(error as string);
        setError("An error occurred during login. Please try again.");
        return;
      }


      // so success otp send
      toast.success("OTP resend successfully");
      setotpSend(true);
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Invalid OTP");

      setError("An error occurred during login. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const renderedProviders = useMemo(
    () =>
      oauthProviders.map((provider) => {
        const isGoogle = provider.id === "google";
        const isLoading = loadingProvider === provider.id;
        const disableGoogleButton = isGoogle && !isScriptLoaded;

        if (typeof provider.icon === "function") {
          const Icon = provider.icon;
          return (
            <button
              key={provider.id}
              type="button"
              onClick={isGoogle ? handleGoogleClick : undefined}
              disabled={disableGoogleButton}
              className="flex w-full items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-900 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <span className="flex h-2 w-2 items-center justify-center rounded-full bg-gray-100 text-gray-900">
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Icon className="h-5 w-5" />
                )}
              </span>
              <span>
                {disableGoogleButton ? "Loading Google..." : provider.label}
              </span>
            </button>
          );
        }

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

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    setotpError(false);
    const otpArray = (formData.password || "").split("");
    otpArray[index] = value;

    setFormData((prev) => ({
      ...prev,
      password: otpArray.join(""),
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

  
  const handleBackClick = () => {
    
      router.replace("/");
    
  };
  return (
    <>
      {/* // desktop view  */}
      <section className="hidden sm:flex min-h-screen w-full bg-white">
        {/* LEFT SIDE – DESIGN */}
        <div className="hidden lg:flex relative w-1/2 min-h-screen overflow-hidden">
          <div className=" w-full max-w-xl h-full">
            {/* 1st BIG bubble */}
            <div
              className="
                absolute
                -top-[40%]
                -left-[23%]
                h-[120%]
                w-[120%]
                rounded-full
                bg-linear-to-br
                from-[#0222d7]
                to-[#011481]
              "
            />

            {/* CONTENT */}
            <div className="absolute top-14 left-20 z-10 text-white">
              <Image
                src="/TCNewLogo.jpg"
                alt="Too Clarity Logo"
                width={90}
                height={90}
                priority
              />

              <h1
                className="absolute font-bold"
                style={{
                  width: "294px",
                  top: "21px",
                  left: "105px",
                  fontSize: "40px",
                  lineHeight: "100%",
                }}
              >
                Tooclarity
              </h1>

              <h2
                className="absolute font-semibold"
                style={{
                  top: "140px",
                  fontSize: "50px",
                  lineHeight: "122%",
                }}
              >
                Welcome
              </h2>

              <p
                className="relative font-semibold"
                style={{
                  top: "110px",
                  fontSize: "31px",
                }}
              >
                Login to your account
              </p>
            </div>

            {/* 2nd bubble */}
            <div
              className="
                absolute
                top-[62%]
                left-[50%]
                h-[290px]
                w-[290px]
                rounded-full
                bg-linear-to-br
                from-[#0222d7]
                to-[#011481]
              "
            />

            {/* 3rd bubble */}
            <div
              className="
                absolute
                -bottom-[16%]
                -left-[15%]
                h-[420px]
                w-[420px]
                rounded-full
                bg-gradient-to-br
                from-[#0222d7]
                to-[#011481]
              "
            />
          </div>
        </div>

        {/* Right side - Login Form */}
        <div className=" w-full sm:w-1/2 lg:w-1/2 min-h-screen flex items-center justify-center">
          <div className="w-full max-w-[540px] rounded-3xl bg-white p-15 shadow-2xl">
            <div className="flex justify-center mb-6 px-4 py-2 text-3xl font-bold tracking-wide text-[#242f6d]">
              Login
            </div>

            {otpSend ? (
              // OTP verification form
              <div className="m-4 flex flex-col">
                <div className="p-1 text-[#000000]">
                  <h1 className="text-5 font-semibold">
                    Verify account with OTP
                  </h1>
                  <p className="text-[14px] text-gray-500 pl-1">
                    We have sent 6 digit code to {formData.contactNumber}
                  </p>

                  <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
                    <div className="pb-10">
                      {/* OTP INPUT BOXES */}
                      <div className="flex justify-start gap-3 mt-6 text-black mb-0">
                        {[0, 1, 2, 3, 4, 5].map((i) => (
                          <input
                            key={i}
                            ref={(el) => {
                              if (el) desktopOtpRefs.current[i] = el;
                            }}

                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={formData.password?.[i] || ""}
                            onChange={(e) => {
                              handleOtpChange(i, e.target.value);

                              // move to next box on input
                              if (e.target.value && i < 5) {
                                desktopOtpRefs.current[i + 1]?.focus();
                              }
                            }}
                            onKeyDown={(e) => {
                              // move back on backspace
                              if (
                                e.key === "Backspace" &&
                                !formData.password?.[i] &&
                                i > 0
                              ) {
                                desktopOtpRefs.current[i - 1]?.focus();
                              }
                            }}
                            className={`
                              w-12 h-12 text-center text-lg font-semibold rounded-2
                              border text-black
                              ${
                                otpError
                                  ? "border-red-500"
                                  : formData.password?.[i]
                                  ? "border-green-500"
                                  : "border-gray-300"
                              }
                              focus:outline-none focus:ring-2 ${
                                otpError
                                  ? "focus:ring-red-500"
                                  : "focus:ring-green-500"
                              }
                            `}
                          />
                        ))}
                      </div>

                      {/* OTP TIMER */}
                      <div className="mt-4 text-start text-sm text-gray-500">
                        {otpTimer > 0 ? (
                          <>
                            Didn't get a code?{" "}
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
                        disabled={isLoading || formData.password?.length !== 6}
                        className={`w-full rounded-[30px] py-3 text-base font-semibold text-[18px]
                          flex items-center justify-center bg-[#EEEEEE] text-[#B0B1B3]
                          disabled:bg-[#EEEEEE] disabled:opacity-60 disabled:cursor-not-allowed
                          enabled:bg-[#0222D7] enabled:text-white transition-colors duration-300 ease-in-out
                        `}
                      >
                        {isLoading && <Loader2 className="h-5 w-5 animate-spin" />}
                        {isLoading ? "Verifying OTP..." : "Verify OTP "}
                      </button>

                      <div className="mt-[15px]">
                        <p className="text-[14px] text-[#060B13] text-center">
                          By continuing, you agree to our T&C and Privacy policy
                        </p>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            ) : (
              // Phone number form
              <div className="m-4 flex flex-col">
                <div className="p-1 text-[#000000]">
                  <h1 className="text-5 font-semibold">Enter your phone number</h1>
                  <p className="text-[14px] text-gray-500 pl-1">
                    We'll send you a text with a verification code.
                  </p>

                  <form className="mt-6 space-y-6" onSubmit={handleotp}>
                    <label className="block relative group">
                      {/* Smartphone Icon */}
                      <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 transition-colors duration-200 group-focus-within:text-[#0222D7]">
                        <Smartphone size={18} />
                      </span>

                      <input
                        type="tel"
                        name="contactNumber"
                        value={formData.contactNumber}
                        placeholder="Enter mobile number"
                        required
                        disabled={isLoading}
                        onChange={handleInputChange}
                        className="
                          w-full h-[53px] text-[18px] rounded-[30px]
                          border border-gray-200 bg-gray-50
                          py-3 pl-12 pr-4 text-base text-[#000000]
                          outline-none transition
                          hover:border-[#0222D7]
                          focus:border-[#0222D7] focus:bg-white
                          disabled:opacity-50 disabled:cursor-not-allowed
                        "
                      />
                    </label>

                    <button
                      type="submit"
                      disabled={isLoading || formData.contactNumber?.trim().length !== 10}
                      className={`w-full rounded-[30px] py-3 text-base font-semibold text-[18px]
                        flex items-center justify-center bg-[#EEEEEE] text-[#B0B1B3]
                        disabled:bg-[#EEEEEE] disabled:opacity-60 disabled:cursor-not-allowed
                        enabled:bg-[#0222D7] enabled:text-white transition-colors duration-300 ease-in-out
                      `}
                    >
                      {isLoading && <Loader2 className="h-5 w-5 animate-spin" />}
                      {isLoading ? "Sending OTP..." : "Continue "}
                    </button>
                  </form>

                  <div className="mt-6 text-center text-[16px] text-[#000000]">
                    Don't have an account?{" "}
                    <button
                      onClick={() => router.push("/student/signup")}
                      className="font-semibold text-blue-600 hover:underline"
                    >
                      Sign up
                    </button>
                  </div>

                  <div className="mt-6 flex items-center gap-3 text-xs text-gray-400">
                    <span className="h-px flex-1 bg-gray-200" />
                    <span>Or Login with</span>
                    <span className="h-px flex-1 bg-gray-200" />
                  </div>

                  <div className="mt-6">{renderedProviders}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* // mobile view  */}
      <section className="sm:hidden  font-montserrat  min-h-screen bg-linear-to-b from-[#0222D7] to-[#000D56] flex flex-col text-white ">
        {/* upper blue box */}
        <div className="flex flex-col w-full h-[234px] p-4 pt-10 ">
          <div className="flex h-11 w-full pt-4 ">
            <div onClick={handleBackClick} className=" h-full w-11 p-2.5 ">
              <ChevronLeft className="h-6 w-6" />
            </div>
          </div>

          <div className=" flex flex-1 mt-10 p-4">
            <div className=" w-[258px] text-[#ffffff] ">
              <div className="font-semibold pb-[5px] text-[25px] leading-none">
                Login
              </div>
              <p className=" opacity-70 font-normal text-[14px] leading-none ">
                Please Login here to continue the application
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
                          value={formData.password?.[i] || ""}
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
                              !formData.password?.[i] &&
                              i > 0
                            ) {
                              otpRefs.current[i - 1]?.focus();
                            }
                          }}
                          className={`
                            w-12 h-12 text-center text-lg font-semibold rounded-2
                            border
                            ${
                              otpError
                                ? "border-red-500"
                                : formData.password?.[i]
                                ? "border-green-500"
                                : "border-gray-300"
                            }
                            focus:outline-none focus:ring-2 ${
                              otpError
                                ? "focus:ring-red-500"
                                : "focus:ring-green-500"
                            }
                          `}
                        />
                      ))}
                    </div>

                    {/* OTP TIMER */}
                    <div className="mt-4  text-start text-sm text-gray-500">
                      {otpTimer > 0 ? (
                        <>
                          Didn't get a code?{" "}
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
                      disabled={isLoading || formData.password?.length !== 6}
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
                <h1 className="text-5  font-semibold">
                  Enter your phone number
                </h1>
                <p className="text-[14px] text-gray-500 pl-1 ">
                  We'll send you a text with a verification code.
                </p>

                <form className="mt-6 space-y-6" onSubmit={handleotp}>
                
                
                <label className="block relative group ">
                  {/* Smartphone Icon */}
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 transition-colors duration-200 group-focus-within:text-[#0222D7]">
                    <Smartphone size={18} />
                  </span>

                  <input
                    type="tel"
                    name="contactNumber"
                    value={formData.contactNumber}
                    placeholder="Enter mobile number"
                    required
                    disabled={isLoading}
                    onChange={handleInputChange}
                    className="
                      w-full h-[53px] text-[18px] rounded-[30px]
                      border border-gray-200 bg-gray-50
                      py-3 pl-12 pr-4 text-base text-[#000000]
                      outline-none transition
                      hover:border-[#0222D7]
                      focus:border-[#0222D7] focus:bg-white
                      disabled:opacity-50 disabled:cursor-not-allowed
                    "
                  />
                </label>
                  
                  <button
                    type="submit"
                    disabled={isLoading || (formData.contactNumber?.length ?? 0) < 10}
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
                  Don't have an account?{" "}
                  <button
                    onClick={() => router.push("/student/signup")}
                    className="font-semibold text-blue-600 hover:underline"
                  >
                    Sign up
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

export default StudentLogin;

