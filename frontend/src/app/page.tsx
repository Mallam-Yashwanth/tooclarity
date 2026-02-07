"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import LandingPage from "@/components/student/StudentLandingPage2/StudentLandingPage";

const StudentLandingPage = () => {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If not authenticated, just return (or redirect to login, depending on flow)
    if (!isAuthenticated || !user) return;

    // Redirect logic for STUDENT
    if (user.role === "STUDENT") {
      // If student has not completed onboarding, send to onboarding
      if (user.isProfileCompleted === false) {
        router.replace("/student/onboarding");
        return;
      }

      // If student profile is complete, go to dashboard
      if (user.isProfileCompleted === true) {
        router.replace("/dashboard");
        return;
      }
    }

    // Redirect logic for any other roles (optional)
    if (user.role === "INSTITUTE_ADMIN") {
      // Prevent institute admins from accessing student landing
      router.replace("/dashboard");
      return;
    }

  }, [isAuthenticated, user, router]);

  // Show landing page only for unauthenticated users or guests
  return (
    <div className="min-h-screen bg-[#F5F6F9]">
      <LandingPage />
    </div>
  );
};



export default StudentLandingPage;

