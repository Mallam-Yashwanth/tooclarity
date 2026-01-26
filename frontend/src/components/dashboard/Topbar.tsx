"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faSpinner
} from "@fortawesome/free-solid-svg-icons"; // Added faSpinner
import { faBell, faMoon } from "@fortawesome/free-regular-svg-icons"; // Outline icons
import { faSun, faSearch, faTimes } from "@fortawesome/free-solid-svg-icons";
import { useTheme } from "next-themes";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { notificationsAPI } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { useProfile } from "@/lib/hooks/user-hooks";
import { useSearch } from "@/lib/search-context";
import { useInfiniteNotifications, NOTIFICATION_QUERY_KEY } from "@/lib/hooks/notification-hooks"; // Import hook
import { useInView } from "react-intersection-observer"; // You might need to install this or use a simple ref-based observer


interface TopbarProps {
  userName?: string;
  onSearch?: (query: string) => void;
  onNotificationClick?: () => void;
  onProfileClick?: () => void;
}

type NotificationItem = {
  id: string;
  title: string;
  description?: string;
  time: number; // epoch
  read: boolean;
  category?: "system" | "billing" | "user" | "security" | "other";
  metadata?: Record<string, unknown>;
};

const Topbar: React.FC<TopbarProps> = ({
  userName,
  onSearch,
  onProfileClick
}) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { searchQuery, setSearchQuery, searchInPage, clearSearch } = useSearch();
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  // Derived state from allNotifications
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const themeMenuRef = useRef<HTMLDivElement | null>(null);
  const hideTimerRef = useRef<number | null>(null);

  const { data: userProfile } = useProfile();
  const roleLabel = (userProfile?.role || '').toString().toUpperCase();

  // --- Infinite Scroll Hook Integration ---
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch, // <-- Added refetch
    status
  } = useInfiniteNotifications();

  // Flatten the infinite query data into a single list
  const allNotifications = React.useMemo(() => {
    return data?.pages.flatMap(page => page.items) || [];
  }, [data]);

  const notificationCount = allNotifications.filter(n => !n.read).length;
  const unreadTop = allNotifications.filter(n => !n.read).slice(0, 3);

  // Sentinel for infinite scroll
  const { ref: loadMoreRef, inView } = useInView();

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);
  // ----------------------------------------

  const timeAgo = (ts: number): string => {
    const diff = Date.now() - ts;
    const m = Math.floor(diff / 60000);
    if (m < 1) return "just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    return `${d}d ago`;
  };

  const clearHideTimer = () => {
    if (hideTimerRef.current !== null) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  };

  const openDropdown = () => {
    clearHideTimer();
    setShowDropdown(true);


    // Auto mark all notifications as read when dropdown opens
    if (notificationCount > 0) {
      const unreadIds = allNotifications.filter(n => !n.read).map(n => n.id);
      if (unreadIds.length > 0) {
        notificationsAPI.markRead(unreadIds).then(() => {
          // Iterate over all pages in the cache and update 'read' status
          queryClient.setQueryData(NOTIFICATION_QUERY_KEY, (oldData: any) => {
            if (!oldData) return oldData;
            return {
              ...oldData,
              pages: oldData.pages.map((page: any) => ({
                ...page,
                items: page.items.map((item: NotificationItem) => ({ ...item, read: true }))
              }))
            };
          });
        }).catch(err => {
          if (process.env.NODE_ENV === 'development') console.error('Topbar: markRead failed', err);
        });
      }
    }
  };


  const closeDropdownSoon = () => {
    clearHideTimer();
    hideTimerRef.current = window.setTimeout(() => {
      setShowDropdown(false);
      hideTimerRef.current = null;
    }, 120);
  };
  useEffect(() => () => clearHideTimer(), []);

  // Ensure mounted before reading theme to avoid hydration mismatch
  useEffect(() => { setMounted(true); }, []);

  // Socket event handlers
  const handleNotificationCreated = useCallback((data: unknown) => {
    const notification = data as { notification: Record<string, unknown> };
    const newNotification: NotificationItem = {
      id: String(notification.notification._id || notification.notification.id || ''),
      title: String(notification.notification.title || ''),
      description: String(notification.notification.description || ''),
      time: notification.notification.createdAt ? new Date(notification.notification.createdAt as string).getTime() : Date.now(),
      read: false,
      category: String(notification.notification.category || '') as NotificationItem['category'],
      metadata: notification.notification.metadata as Record<string, unknown> | undefined,
    };

    // Optimistically update Infinite Query Cache (Inject at top)
    queryClient.setQueryData(NOTIFICATION_QUERY_KEY, (oldData: any) => {
      if (!oldData) return { pages: [{ items: [newNotification], nextCursor: null }], pageParams: [null] };
      const newPages = [...oldData.pages];
      // Prepend to the first page's items
      if (newPages.length > 0) {
        newPages[0] = {
          ...newPages[0],
          items: [newNotification, ...newPages[0].items]
        };
      }
      return { ...oldData, pages: newPages };
    });
  }, [queryClient]);

  const handleNotificationUpdated = useCallback((data: unknown) => {
    const notification = data as { notificationId: string, read: boolean };
    queryClient.setQueryData(NOTIFICATION_QUERY_KEY, (oldData: any) => {
      if (!oldData) return oldData;
      return {
        ...oldData,
        pages: oldData.pages.map((page: any) => ({
          ...page,
          items: page.items.map((n: NotificationItem) => n.id === notification.notificationId ? { ...n, read: notification.read } : n)
        }))
      };
    });
  }, [queryClient]);

  const handleNotificationRemoved = useCallback((data: unknown) => {
    const notification = data as { notificationId: string };
    queryClient.setQueryData(NOTIFICATION_QUERY_KEY, (oldData: any) => {
      if (!oldData) return oldData;
      return {
        ...oldData,
        pages: oldData.pages.map((page: any) => ({
          ...page,
          items: page.items.filter((n: NotificationItem) => n.id !== notification.notificationId)
        }))
      };
    });
  }, [queryClient]);

  // Setup Socket.IO for real-time notifications
  useEffect(() => {
    let socket: { on: (ev: string, h: (...args: unknown[]) => void) => void; off: (ev: string, h: (...args: unknown[]) => void) => void; emit: (ev: string, ...args: unknown[]) => void } | null = null;
    let isMounted = true;

    const setupSocket = async () => {
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_URL || "";
        let origin = apiBase.replace('/api', '');
        if (!origin) origin = typeof window !== 'undefined' ? window.location.origin : '';

        const s = await getSocket(origin);
        if (!isMounted) return;
        socket = s;

        socket?.on('connect', async () => {
          if (!isMounted) return;
          // console.log('[Topbar DEBUG] Socket connected:', (socket as any)?.id);
          // Join appropriate room based on role
          const prof = userProfile;
          const role = (prof?.role || '').toString().toUpperCase();
          const id = prof?.id || prof?._id;
          if (role === 'INSTITUTE_ADMIN' && id) {
            socket?.emit('joinInstitutionAdmin', id);
          } else if (role === 'ADMIN' && id) {
            socket?.emit('joinAdmin', id);
          } else if (role === 'STUDENT' && id) {
            socket?.emit('joinStudent', id);
          }
        });

        // Listen for new notifications
        socket?.on('notificationCreated', handleNotificationCreated);
        // Listen for notification updates (mark as read)
        socket?.on('notificationUpdated', handleNotificationUpdated);
        // Listen for notification deletions
        socket?.on('notificationRemoved', handleNotificationRemoved);

      } catch (error) {
        if (process.env.NODE_ENV === 'development') console.error('Topbar: socket setup error', error);
      }
    };

    setupSocket();

    return () => {
      isMounted = false;
      try {
        socket?.off('notificationCreated', handleNotificationCreated);
        socket?.off('notificationUpdated', handleNotificationUpdated);
        socket?.off('notificationRemoved', handleNotificationRemoved);
      } catch (err) {
        if (process.env.NODE_ENV === 'development') console.error('Topbar: socket cleanup error', err);
      }
    };
  }, [queryClient, userProfile, handleNotificationCreated, handleNotificationUpdated, handleNotificationRemoved]);


  const topbarVariants = {
    hidden: { y: -50, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5 }
    }
  } as const;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      searchInPage(searchQuery);
    } else {
      clearSearch();
    }
    if (onSearch) {
      onSearch(searchQuery);
    }
  };

  const toggleSearch = () => {
    setIsSearchOpen(!isSearchOpen);
    if (isSearchOpen) {
      clearSearch();
    }
  };

  const _cycleTheme = () => {
    // Cycle order: system -> light -> dark -> system
    const current = theme || 'system';
    if (current === 'system') setTheme('light');
    else if (current === 'light') setTheme('dark');
    else setTheme('system');
  };

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Node | null;
      if (!themeMenuRef.current) return;
      if (target && themeMenuRef.current.contains(target)) return;
      setShowThemeMenu(false);
    };
    if (showThemeMenu) document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [showThemeMenu]);

  const _markOneUnreadAsRead = (id: string) => {
    // Optimistically update cache
    queryClient.setQueryData(NOTIFICATION_QUERY_KEY, (oldData: any) => {
      if (!oldData) return oldData;
      return {
        ...oldData,
        pages: oldData.pages.map((page: any) => ({
          ...page,
          items: page.items.map((n: NotificationItem) => n.id === id ? { ...n, read: true } : n)
        }))
      };
    });
  };

  const badge = notificationCount > 99 ? "99+" : String(notificationCount);

  return (
    <>
      <motion.header
        className="sticky top-0 z-40 flex items-center justify-between pl-3 rounded-lg py-4 bg-white/80 dark:bg-gray-900/70 backdrop-blur border-b border-gray-100 dark:border-gray-800"
        variants={topbarVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Left: Search - Desktop only */}
        <div className="hidden sm:flex items-center gap-3">
          <form onSubmit={handleSearch} className="relative">
            <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search"
              className="pl-10 md:w-[400px] w-[220px]"
            />
            {searchQuery && (
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
                onClick={clearSearch}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            )}
          </form>
        </div>

        {/* Mobile: Logo */}
        <div className="flex sm:hidden items-center">
          <Link href="/dashboard" className="text-blue-600 font-bold text-lg">
            TooClarity
          </Link>
        </div>

        {/* Right Side Icons and Profile */}
        <div className="flex items-center gap-2 sm:gap-3 md:mr-[170px]">
          {/* Mobile Search Icon */}
          <motion.div className="sm:hidden">
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 rounded-full border border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
              onClick={toggleSearch}
              aria-label="Search"
            >
              <FontAwesomeIcon icon={faSearch} className="text-sm dark:text-gray-100" />
            </Button>
          </motion.div>

          {/* Notification Icon with hover dropdown */}
          <motion.div
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.96 }}
            className="relative"
            onMouseEnter={openDropdown}
            onMouseLeave={closeDropdownSoon}
          >
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 sm:h-11 sm:w-11 rounded-full border border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
              onClick={() => router.push("/notifications")}
              aria-label="Notifications"
            >
              <FontAwesomeIcon icon={faBell} className="text-sm sm:text-lg text-[#060B13] dark:text-gray-100" />
            </Button>
            <AnimatePresence>
              {notificationCount > 0 && (
                <motion.span
                  className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 sm:h-5 sm:min-w-5 px-0 sm:px-1 flex items-center justify-center font-medium"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                >
                  {badge}
                </motion.span>
              )}
            </AnimatePresence>

            {/* Hover dropdown - Mobile Responsive */}
            <AnimatePresence>
              {showDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.18, ease: [0.4, 0.0, 0.2, 1] }}
                  className="absolute right-2 sm:right-0 mt-2 w-[50vw] md:w-[80vw] max-w-[20rem] sm:w-96 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xl rounded-xl overflow-hidden z-50"
                  onMouseEnter={openDropdown}
                  onMouseLeave={closeDropdownSoon}
                >
                  <div className="p-2 sm:p-4 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs sm:text-base font-semibold text-gray-900 dark:text-gray-100">Notifications</h3>
                      <span className="text-[10px] sm:text-sm text-gray-500 dark:text-gray-400">{notificationCount} unread</span>
                    </div>
                  </div>

                  <div className="max-h-[55vh] sm:max-h-80 overflow-y-auto">
                    {allNotifications.length === 0 ? (
                      <div className="p-3 sm:p-4 text-center text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                        No new notifications
                      </div>
                    ) : (
                      <>
                        {allNotifications.map((notification) => (
                          <motion.div
                            key={notification.id}
                            className="p-2 sm:p-3 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                            whileHover={{ backgroundColor: "rgba(0,0,0,0.05)" }}
                            onClick={() => {
                              // Auto-read on interaction
                              if (!notification.read) {
                                // Optimistically update local state
                                _markOneUnreadAsRead(notification.id);
                                // Sync to backend
                                notificationsAPI.markRead([notification.id]).catch(err => {
                                  if (process.env.NODE_ENV === 'development') console.error('Topbar: markRead on click failed', err);
                                });
                              }

                              try {
                                const t = (notification.metadata?.type || '').toString().toUpperCase();
                                if (t === 'CALLBACK_REQUEST') router.push('/dashboard/leads');
                                else if (t === 'NEW_STUDENT') router.push('/dashboard');
                                else if (t === 'WELCOME') router.push('/dashboard');
                                else router.push('/notifications');
                              } catch { router.push('/notifications'); }
                            }}
                          >
                            <div className="flex items-start gap-2 sm:gap-3">
                              {!notification.read && (
                                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className={`text-xs sm:text-sm font-medium truncate ${!notification.read ? 'text-gray-900 dark:text-gray-100 font-bold' : 'text-gray-600 dark:text-gray-300'}`}>
                                  {notification.title}
                                </p>
                                {notification.description && (
                                  <p className="text-[11px] sm:text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                                    {notification.description}
                                  </p>
                                )}
                                <p className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500 mt-1">
                                  {timeAgo(notification.time)}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                        {/* Sentinel and Loading Spinner */}
                        <div ref={loadMoreRef} className="py-4 flex justify-center w-full">
                          {isFetchingNextPage ? (
                            <FontAwesomeIcon icon={faSpinner} className="animate-spin text-gray-400" />
                          ) : hasNextPage ? (
                            <span className="text-xs text-gray-400">Scroll for more...</span>
                          ) : (
                            <span className="text-xs text-gray-300">No more notifications</span>
                          )}
                        </div>
                      </>
                    )}
                  </div>


                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Dark Mode Toggle */}
          <motion.div
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.96 }}
            className="relative"
            ref={themeMenuRef}
          >
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 sm:h-11 sm:w-11 rounded-full border border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
              onClick={() => setShowThemeMenu((v) => !v)}
              aria-label="Toggle theme menu"
            >
              {mounted && (
                <FontAwesomeIcon
                  icon={(theme === 'dark' || (theme === 'system' && systemTheme === 'dark')) ? faSun : faMoon}
                  className={`text-sm sm:text-lg ${(theme === 'dark' || (theme === 'system' && systemTheme === 'dark')) ? "text-yellow-400" : "text-[#060B13] dark:text-gray-100"}`}
                />
              )}
            </Button>

            {/* Theme Menu: system / light / dark */}
            <AnimatePresence>
              {showThemeMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.16 }}
                  className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xl rounded-md overflow-hidden z-50"
                >
                  <button
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 ${theme === 'system' ? 'font-semibold' : ''}`}
                    onClick={() => { setTheme('system'); setShowThemeMenu(false); }}
                  >
                    System
                  </button>
                  <button
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 ${theme === 'light' ? 'font-semibold' : ''}`}
                    onClick={() => { setTheme('light'); setShowThemeMenu(false); }}
                  >
                    Light
                  </button>
                  <button
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 ${theme === 'dark' ? 'font-semibold' : ''}`}
                    onClick={() => { setTheme('dark'); setShowThemeMenu(false); }}
                  >
                    Dark
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          <div className="h-6 w-px sm:h-9 bg-gray-400 mx-1 sm:mx-2 border border-gray-400 dark:bg-gray-600 dark:border-gray-600" />

          {/* User Profile */}
          <motion.div
            className="flex items-center gap-2 sm:gap-3 cursor-pointer"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.2 }}
            onClick={onProfileClick}
          >
            <motion.div
              className="h-8 w-8 sm:h-11 sm:w-11 rounded-full bg-yellow-400 flex items-center justify-center text-gray-600"
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.5 }}
            >
              <FontAwesomeIcon icon={faUser} className="text-sm sm:text-xl" />
            </motion.div>
            <div className="leading-tight hidden sm:block">
              <div className="text-sm font-bold text-gray-900 dark:text-gray-100">{userName}</div>
              <div className="text-xs text-gray-500 dark:text-gray-300">{roleLabel || "User"}</div>
            </div>
          </motion.div>
        </div>
      </motion.header>

      {/* Mobile Search Bar - Expandable */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="sm:hidden bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-3 py-3"
          >
            <form onSubmit={handleSearch} className="relative">
              <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="pl-10 w-full h-10"
                autoFocus
              />
              {searchQuery && (
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
                  onClick={clearSearch}
                >
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              )}
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Topbar;
