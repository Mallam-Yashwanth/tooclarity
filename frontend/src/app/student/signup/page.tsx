"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import StudentRegistration from "@/components/student/StudentRegistration";
import StudentOtpScreen from "@/components/student/StudentOtpScreen";
import StudentOtpSuccess from "@/components/student/StudentOtpSuccess";
import { useAuth } from "@/lib/auth-context";
import { useUserStore } from "@/lib/user-store";

type SignupStage = "registration" | "otp" | "success";

const StudentSignupPage = () => {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const user = useUserStore((state) => state.user);
  const [stage, setStage] = useState<SignupStage>("registration");
  const [phoneNumber, setPhoneNumber] = useState("");

  const handleOtpRequired = (phone: string) => {
    setPhoneNumber(phone);
    setStage("otp");
  };

  const handleOtpVerified = async () => {
    await refreshUser();
    setStage("success");
  };

  const handleSuccessContinue = async () => {
    const latestUser = useUserStore.getState().user;
    const role = latestUser?.role;
    const isProfileCompleted = !!latestUser?.isProfileCompleted;

    if (role === "STUDENT") {
      router.replace(
        isProfileCompleted ? "/dashboard" : "/student/onboarding"
      );
    } else {
      router.replace("/dashboard");
    }
  };

  // Redirect after user state updates during registration
  useEffect(() => {
    if (!user || stage !== "registration") return;

    const role = user.role;
    const isProfileCompleted = !!user.isProfileCompleted;

    console.log("[Student Signup Page] Redirecting with flags:", {
      role,
      isProfileCompleted,
    });

    if (role === "STUDENT") {
      if (!isProfileCompleted) {
        router.replace("/student/onboarding");
        return;
      }
      if (isProfileCompleted) {
        router.replace("/dashboard");
        return;
      }
    }

    router.replace("/dashboard");
  }, [user, router, stage]);


  
  // const bgClass = stage === "success" 
  //   ? "bg-[#AEE6A6]" 
  //   : "bg-gradient-to-b from-white via-white to-blue-50";

  return (
    <StudentRegistration onOtpRequired={handleOtpRequired} />
 

    
    // <section className={`flex min-h-screen flex-col justify-between px-5 py-10 md:px-8 lg:px-12 ${bgClass}`}>
      
    //    <section className={` ${bgClass}`}>

    //   {stage === "registration" && (
    //     <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
    //       <StudentRegistration onOtpRequired={handleOtpRequired} />
    //     </div>
        
    //   )}
    //   {stage === "otp" && (
    //     <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
    //       <StudentOtpScreen
    //         phoneNumber={phoneNumber}
    //         onSuccess={handleOtpVerified}
    //         onBack={() => setStage("registration")}
    //       />
    //     </div>
    //   )}
    //   {stage === "success" && (
    //     <StudentOtpSuccess
    //       title="OTP Verified Successfully!"
    //       description="Your mobile number has been verified successfully."
    //       continueLabel="Continue"
    //       onContinue={handleSuccessContinue}
    //       fullScreen={false}
    //     />
    //   )}
    //  </section>

      );
};

export default StudentSignupPage;