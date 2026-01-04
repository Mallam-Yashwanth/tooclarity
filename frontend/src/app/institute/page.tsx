"use client";

import Footer from "@/components/ui/footer";
import React, { useEffect } from "react";
import Header from "@/components/ui/Header";
import { useAuth } from "../../lib/auth-context";
import { useRouter, usePathname } from "next/navigation";
import FeaturesPage from ".././features/page";
import HomePage from "@/components/LandingPage/HomePage";

// Main App Component
const App = () => {
  const { isAuthenticated, user } = useAuth(); // <-- Added
  const router = useRouter();
  const pathname = usePathname();
  
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    // Redirect rules for INSTITUTE_ADMIN
    if (user.role === "INSTITUTE_ADMIN") {
      if (user.isProfileCompleted === true) {
        router.replace("/dashboard");
        return;
      }
      if (user.isProfileCompleted == false) {
        router.replace("/signup");
        return;
      }
    }

    if (user.role === "STUDENT") {
      if (user.isProfileCompleted === false) {
        router.replace("/student/onboarding");
        return;
      }
      router.replace("/dashboard");
      return;
    }

  }, [isAuthenticated, user, router]);

  return (
    <div className="min-h-screen bg-[#F5F6F9]">
      <Header />
      <main className="pt-20">
        {pathname === "/features" ? (
          <FeaturesPage />
        ) : (
          <HomePage/>
        )}
      </main>
      <Footer />

    </div>
  );
};

export default App;