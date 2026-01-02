"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Sidebar from "@/components/dashboard/Sidebar";
import Topbar from "@/components/dashboard/Topbar";
import { useAuth } from "@/lib/auth-context";
import { motion } from "framer-motion";
import AdminDashboard from "@/components/dashboard/AdminDashboard";
import { SearchProvider } from "@/lib/search-context";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  // const [profileName, setProfileName] = useState<string | undefined>(undefined);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;

    // 🛑 If not logged in → redirect to correct login page
    if (!user) {
      if (pathname.startsWith("/admin")) {
        router.push("/admin-login");
      } else {
        router.push("/");
      }
      return;
    }

    // 🏫 Institute flow
    if (user.role === "INSTITUTE_ADMIN") {
      if (!user.isProfileCompleted) {
    // If L1 isn't done, send them to the signup/onboarding page
    router.push("/institute");
  }
    }
  }, [user, loading, router, pathname]);

  if (loading) return null;

  if (user?.role === "ADMIN") {
    return <AdminDashboard />;
  }

  if(user?.role === "STUDENT"){
    if(!user.isProfileCompleted){
      router.push("/student/onboarding");
    }
    return <>{children}</>;
  }

  if (
    user?.role === "INSTITUTE_ADMIN" &&
    user.isProfileCompleted === true
  ) {
    return (
      <SearchProvider>
        <div className="min-h-screen w-full font-[var(--font-Montserrat)]">
          <div className="flex flex-col lg:flex-row gap-2 lg:gap-6">
            <Sidebar />
            <motion.main
              className="flex-1 max-w-[1900px] mr-0 lg:mr-5 px-2 sm:px-4 lg:px-6 ml-0 h-[100dvh] overflow-y-auto scrollbar-hide pb-20 lg:pb-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              <Topbar
                userName={user?.name || user?.admin}
                onSearch={() => {}}
                onNotificationClick={() => {}}
                onProfileClick={() => {}}
              />
              {children}
            </motion.main>
          </div>
        </div>
      </SearchProvider>
    );
  }

  return <div></div>;
}
