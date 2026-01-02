"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import L1DialogBox from "@/components/auth/L1DialogBox";
import Image from "next/image";
// --- NEW IMPORT FOR INSTITUTION CHECK ---
import { useInstitution } from "@/lib/hooks/dashboard-hooks"; 

export default function SignupPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading, updateUser } = useAuth(); // Added updateUser

  // --- NEW HOOK: TO CHECK IF INSTITUTION ALREADY EXISTS ---
  const { data: inst, isLoading: instLoading } = useInstitution();

  const [l1DialogOpen, setL1DialogOpen] = useState(true);
  const [formData, setFormData] = useState<{ instituteType?: string }>({});

  const isAllowed = useMemo(() => {
    if (!user) return false;
    return (
      user.role === "INSTITUTE_ADMIN" &&
      !user.isProfileCompleted
    );
  }, [user]);

  // Redirect if not eligible for signup route
  useEffect(() => {
    if (loading || instLoading) return; 

    if (!isAuthenticated) {
      router.replace("/institute");
      return;
    }

    if (isAllowed) {
      return;
    }

    if (!isAllowed) {
      if (user?.role === "INSTITUTE_ADMIN") {
        if (user.isProfileCompleted) {
          router.replace("/dashboard");
          return;
        }
      }
      router.replace("/institute"); // Fallback
    }
  }, [loading, instLoading, inst, isAuthenticated, isAllowed, user, router, updateUser]);

  
  // ✅ THIS CONDITIONAL RETURN IS NOW AFTER ALL HOOKS
  // Added instLoading to ensure we don't flash the dialog while checking the DB
  if (loading || instLoading || !isAuthenticated || !isAllowed) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Your component logic and handlers can now safely be below the conditional return
  const handleInstituteTypeChange = (type: string) => {
    setFormData((prev) => ({ ...prev, instituteType: type }));
  };

  const handleL1Success = () => {
    setL1DialogOpen(false);
    if (updateUser) {
    updateUser({ isProfileCompleted:  true });
  }
    setTimeout(() => {
      router.replace("/dashboard");
    }, 100);
  };


  // Show loader while verifying or redirecting
  if (loading || !isAuthenticated || !isAllowed) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FBF9F5] pt-[104px]">
      {/* Top navigation bar */}
      <div className="w-full h-auto sm:h-[64px] md:h-[80px] flex flex-col sm:flex-row justify-between items-center px-4 sm:px-6 md:px-20 z-10 fixed top-0 left-0 py-3 sm:py-0">
        <Image
          src="/Too%20Clarity.png"
          alt="Too Clarity Logo"
          width={120}
          height={28}
          className="h-6 sm:h-7 w-auto mb-2 sm:mb-0"
        />
        <a
          href="tel:+919391160205"
          className="text-xs sm:text-sm text-blue-700 flex items-center gap-1 hover:underline transition-all duration-200"
        >
          <span className="hidden sm:inline">Need help? Call</span>
          <span className="sm:hidden">Call</span>
          +91 9391160205
        </a>
      </div>


      {/* L1 _Dialog Box */}
      <L1DialogBox
        open={l1DialogOpen}
        onOpenChange={setL1DialogOpen}
        onSuccess={handleL1Success}
        onInstituteTypeChange={handleInstituteTypeChange}
      />
      
    </div>
  );
}