"use client";

import React from "react";
import { Button } from "../ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHome,
  faUser,
  faChartBar,
  faCreditCard,
} from "@fortawesome/free-regular-svg-icons";
import { faGear, faRightFromBracket } from "@fortawesome/free-solid-svg-icons";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "@/lib/auth-context";
import { usePathname } from "next/navigation";
import Link from "next/link";

const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { logout } = useAuth();

  const items = [
    { icon: faHome, label: "Dashboard", href: "/dashboard" },
    { icon: faUser, label: "Leads", href: "/dashboard/leads" },
    { icon: faChartBar, label: "Analytics", href: "/dashboard/analytics" },
    { icon: faPlus, label: "Listings", href: "/dashboard/listings" },
    {
      icon: faCreditCard,
      label: "Subscription",
      href: "/dashboard/subscription",
    },
    { icon: faGear, label: "Settings", href: "/dashboard/settings" },
  ];

  const getActiveIndex = () => {
    if (!pathname) return 0;
    // Pick the longest matching href prefix so nested routes select the most specific item
    let bestIdx = 0;
    let bestLen = -1;
    items.forEach((it, idx) => {
      if (
        pathname === it.href ||
        pathname.startsWith(it.href + "/") ||
        (pathname.startsWith(it.href) && it.href !== "/dashboard")
      ) {
        const len = it.href.length;
        if (len > bestLen) {
          bestLen = len;
          bestIdx = idx;
        }
      }
    });
    // Fallback: exact dashboard root
    if (bestLen === -1 && pathname === "/dashboard") return 0;
    return bestIdx;
  };

  const activeIndex = getActiveIndex();

  const easeInOut = [0.4, 0.0, 0.2, 1] as const;
  const easeOut = [0.0, 0.0, 0.2, 1] as const;

  const sidebarVariants = {
    hidden: { x: -100, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: { duration: 0.5, ease: easeInOut },
    },
  };

  const iconVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: (i: number) => ({
      opacity: 1,
      scale: 1,
      transition: { delay: i * 0.1, duration: 0.3, ease: easeOut },
    }),
  };

  const handleLogout = async () => {
    try {
      await logout();
      localStorage.removeItem("auth_token");
      window.location.href = "/";
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  // Hover control
  const [isHovered, setIsHovered] = React.useState(false);
  const hideTimerRef = React.useRef<number | null>(null);
  const clearHideTimer = () => {
    if (hideTimerRef.current !== null) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  };
  const showNow = () => {
    clearHideTimer();
    setIsHovered(true);
  };
  const _hideSoon = () => {
    clearHideTimer();
    hideTimerRef.current = window.setTimeout(() => {
      setIsHovered(false);
      hideTimerRef.current = null;
    }, 140);
  };
  const hideNow = () => {
    clearHideTimer();
    setIsHovered(false);
  };
  React.useEffect(() => () => clearHideTimer(), []);

  return (
    <>
      {/* Desktop / large screens */}
      <motion.aside
        className={`hidden lg:flex relative group flex-col items-center gap-3 py-6 w-18 bg-gray-50 dark:bg-gray-900 shadow-sm rounded-2xl ml-[50px] my-6 border border-gray-100 dark:border-gray-800 h-100vh ${
          isHovered ? "bg-transparent shadow-none border-transparent z-50" : ""
        }`}
        variants={sidebarVariants}
        initial="hidden"
        animate="visible"
        onMouseEnter={showNow}
        onMouseLeave={hideNow}
      >
        <motion.div
          className="text-blue-600 font-bold text-xl mb-4 cursor-pointer relative z-20"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
          onMouseEnter={showNow}
          onMouseLeave={hideNow}
        >
          <Link href="/dashboard">Tc</Link>
        </motion.div>

        {/* Compact rail (only when not hovered) */}
        <AnimatePresence initial={false}>
          {!isHovered && (
            <motion.div
              key="rail"
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -6 }}
              transition={{ duration: 0.18, ease: easeInOut }}
              className="contents"
            >
              {items.map((item, idx) => (
                <motion.div
                  key={idx}
                  variants={iconVariants}
                  custom={idx}
                  initial="hidden"
                  animate="visible"
                  className="relative z-20"
                >
                  <Link
                    href={item.href}
                    prefetch
                    className="block focus:outline-none"
                  >
                    <div
                      className={`h-11 w-11 rounded-xl flex items-center justify-center transition-all duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/40 ${
                        activeIndex === idx
                          ? "bg-blue-600 text-white shadow-sm"
                          : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 hover:text-blue-600"
                      }`}
                    >
                      <FontAwesomeIcon
                        icon={item.icon}
                        className="text-[18px]"
                      />
                    </div>
                  </Link>
                </motion.div>
              ))}
              <div className="mt-auto relative z-20 w-full flex justify-center">
                <button
                  onClick={handleLogout}
                  className="h-11 w-11 rounded-xl flex items-center justify-center transition-all duration-200 ease-in-out hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/40"
                >
                  <FontAwesomeIcon
                    icon={faRightFromBracket}
                    className="text-[18px]"
                  />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Expanded panel (replaces rail when hovered) */}
        <AnimatePresence initial={false}>
          {isHovered && (
            <motion.div
              key="expanded"
              className="absolute inset-y-0 left-0 w-[calc(4.5rem+14rem)] z-50"
              onMouseEnter={showNow}
              onMouseLeave={hideNow}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.22, ease: easeInOut }}
            >
              <div className="h-full w-full bg-gray-50 dark:bg-gray-900 rounded-2xl flex flex-col">
                <div className="px-4 pt-6 pb-2 mb-5 text-blue-600 font-bold text-xl">
                  <Link href="/dashboard">TooClarity</Link>
                </div>
                <nav className="px-2 space-y-3">
                  {items.map((item, idx) => (
                    <Link
                      href={item.href}
                      key={idx}
                      prefetch
                      className="block focus:outline-none"
                    >
                      <div
                        className={`h-11 w-full rounded-xl flex items-center gap-3 px-3 transition-colors duration-150 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/40 ${
                          activeIndex === idx
                            ? "bg-blue-600 text-white shadow-sm"
                            : "hover:bg-indigo-100 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-200"
                        }`}
                      >
                        <div className="h-11 w-11 rounded-xl flex items-center justify-center">
                          <FontAwesomeIcon
                            icon={item.icon}
                            className="text-[18px]"
                          />
                        </div>
                        <span className="text-sm font-medium">
                          {item.label}
                        </span>
                      </div>
                    </Link>
                  ))}
                </nav>
                <div className="mt-auto px-2 pb-4">
                  <button
                    onClick={handleLogout}
                    className="h-11 w-full rounded-xl flex items-center gap-3 px-3 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-150 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/40"
                  >
                    <div className="h-11 w-11 rounded-xl flex items-center justify-center">
                      <FontAwesomeIcon
                        icon={faRightFromBracket}
                        className="text-[18px]"
                      />
                    </div>
                    <span className="text-sm font-medium">Logout</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.aside>

      {/* Glass/blur overlay for the rest of the UI when expanded (desktop only) */}
      {isHovered && (
        <div
          className="hidden lg:block fixed inset-0 z-40 bg-white/10 dark:bg-black/20 backdrop-blur-md"
          onMouseEnter={hideNow}
        />
      )}

      {/* Mobile / small screens bottom bar */}
      <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 lg:hidden">
        <motion.div
          className="bg-white dark:bg-gray-900 shadow-lg rounded-2xl px-3 py-2 flex items-center gap-1 border border-gray-100 dark:border-gray-800"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: easeInOut }}
        >
          {items.map((item, idx) => (
            <Button
              asChild
              key={idx}
              size="icon"
              variant="ghost"
              className={`h-10 w-10 rounded-xl transition-all duration-200 ease-in-out ${
                activeIndex === idx
                  ? "bg-blue-600 text-white"
                  : "hover:bg-blue-50 text-gray-600"
              }`}
              aria-current={activeIndex === idx ? "page" : undefined}
            >
              <Link href={item.href} prefetch>
                <FontAwesomeIcon icon={item.icon} className="text-[18px]" />
              </Link>
            </Button>
          ))}
        </motion.div>
      </nav>
    </>
  );
};

export default Sidebar;
