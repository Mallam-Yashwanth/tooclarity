"use client";
import React, { useState, useEffect, useRef } from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faBell, 
  faMoon, 
  faUser
} from "@fortawesome/free-regular-svg-icons";
import { faSun,faSearch, faTimes, faCheck } from "@fortawesome/free-solid-svg-icons";
import { useTheme } from "next-themes";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { notificationsAPI } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { cacheSet, CACHE_DURATION } from "@/lib/localDb";
import { useProfile } from "@/lib/hooks/user-hooks";
import { useSearch } from "@/lib/search-context";

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
  metadata?: any;
};

const STORAGE_KEY = "app_notifications_v1";
const QUERY_KEY = ['notifications','list'] as const;
const CACHE_KEY = 'notifications:list:v1';

const Topbar: React.FC<TopbarProps> = ({ 
  userName, 
  onSearch, 
  onNotificationClick,
  onProfileClick 
}) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { searchQuery, setSearchQuery, searchInPage, clearSearch, isSearchActive } = useSearch();
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const themeMenuRef = useRef<HTMLDivElement | null>(null);
  const [institutionAdminId, setInstitutionAdminId] = useState<string | null>(null);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [platformAdminId, setPlatformAdminId] = useState<string | null>(null);
  const [roleLabel, setRoleLabel] = useState<string>('');

  const [allNotifications, setAllNotifications] = useState<NotificationItem[]>([]);
  const [unreadTop, setUnreadTop] = useState<NotificationItem[]>([]);

  const hideTimerRef = useRef<number | null>(null);
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

  const seedIfEmpty = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const existing: NotificationItem[] = raw ? JSON.parse(raw) : [];
      if (!existing || existing.length === 0) {
        const now = Date.now();
        const seed: NotificationItem[] = [
          { id: "n1", title: "Welcome to TooClarity", description: "Thanks for joining!", time: now - 2 * 60 * 1000, read: false, category: "user" },
          { id: "n2", title: "Subscription renewed", description: "Your Pro plan was renewed.", time: now - 60 * 60 * 1000, read: false, category: "billing" },
          { id: "n3", title: "Maintenance complete", description: "Servers are back online.", time: now - 3 * 60 * 60 * 1000, read: true, category: "system" },
          { id: "n4", title: "Backup completed", description: "Nightly backup finished.", time: now - 26 * 60 * 60 * 1000, read: true, category: "system" },
        ];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
      }
    } catch (err) {
      console.error('Topbar: seedIfEmpty failed', err);
    }
  };

  const loadFromStorage = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const items: NotificationItem[] = raw ? JSON.parse(raw) : [];
      const sorted = items.sort((a, b) => b.time - a.time);
      const unread = sorted.filter(n => !n.read);
      setAllNotifications(sorted);
      setNotificationCount(unread.length);
      setUnreadTop(unread.slice(0, 3));
    } catch (err) {
      console.error('Topbar: loadFromStorage failed', err);
    }
  };

  const clearHideTimer = () => {
    if (hideTimerRef.current !== null) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  };

  const { data: userProfile } = useProfile();

  const loadFromBackend = async () => {
    try {
      // Default admin scope if available
      let scopeParams: any = {};
      try {
        const prof = userProfile;
        const role = prof?.role;
        const id = prof?.id || prof?._id;
        const upper = (role || '').toString().toUpperCase();
        setRoleLabel(upper || '');
        if (upper === 'INSTITUTE_ADMIN' && id) {
          scopeParams.scope = 'admin';
          scopeParams.institutionAdminId = id;
          setInstitutionAdminId(id);
          setPlatformAdminId(null);
          setStudentId(null);
        } else if (upper === 'ADMIN' && id) {
          // Platform admin
          scopeParams.scope = 'admin';
          scopeParams.institutionAdminId = id;
          setPlatformAdminId(id);
          setInstitutionAdminId(null);
          setStudentId(null);
        } else if (upper === 'STUDENT' && id) {
          scopeParams.scope = 'student';
          scopeParams.studentId = id;
          setStudentId(id);
          setInstitutionAdminId(null);
          setPlatformAdminId(null);
        }
      } catch (err) {
        console.error('Topbar: failed to read profile for notifications scope', err);
      }
      const res = await notificationsAPI.list({ ...scopeParams, page: 1, limit: 10 });
      if ((res as any)?.success) {
        const items = ((res as any).data?.items || []).map((n: any) => ({
          id: n._id,
          title: n.title,
          description: n.description,
          time: n.createdAt ? new Date(n.createdAt).getTime() : Date.now(),
          read: !!n.read,
          category: n.category,
          metadata: n.metadata,
        })) as NotificationItem[];
        const sorted = items.sort((a, b) => b.time - a.time);
        const unread = sorted.filter(n => !n.read);
        setAllNotifications(sorted);
        setNotificationCount(unread.length);
        setUnreadTop(unread.slice(0, 3));
        // Persist to IndexedDB and update Query cache so notifications page updates
        try {
          await cacheSet(CACHE_KEY, sorted, CACHE_DURATION.INSTITUTION);
          queryClient.setQueryData(QUERY_KEY, sorted);
        } catch (err) {
          console.error('Topbar: cacheSet/queryCache update failed', err);
        }
      }
    } catch (err) {
      console.error('Topbar: loadFromBackend failed', err);
    }
  };

  // Setup Socket.IO for real-time notifications
  useEffect(() => {
    let socket: any;
    
    const setupSocket = async () => {
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_URL || "";
        let origin = apiBase.replace('/api','');
        if (!origin) origin = typeof window !== 'undefined' ? window.location.origin : '';
        
        socket = await getSocket(origin);
        
        socket.on('connect', async () => {
          // Join appropriate room based on role
          const prof = userProfile;
          const role = (prof?.role || '').toString().toUpperCase();
          const id = prof?.id || prof?._id;
          if (role === 'INSTITUTE_ADMIN' && id) {
            socket.emit('joinInstitutionAdmin', id);
          } else if (role === 'ADMIN' && id) {
            socket.emit('joinAdmin', id);
          } else if (role === 'STUDENT' && id) {
            socket.emit('joinStudent', id);
          }
        });

        // Listen for new notifications
        socket.on('notificationCreated', async (data: { notification: any }) => {
          const newNotification: NotificationItem = {
            id: data.notification._id,
            title: data.notification.title,
            description: data.notification.description,
            time: data.notification.createdAt ? new Date(data.notification.createdAt).getTime() : Date.now(),
            read: false,
            category: data.notification.category,
            metadata: data.notification.metadata,
          };
          // Toast popup per role/category
          try {
            const cat = (newNotification.category || 'other').toString().toLowerCase();
            const message = `${newNotification.title}${newNotification.description ? ` — ${newNotification.description}` : ''}`;
            if (cat === 'system') toast.info(message);
            else if (cat === 'billing') toast.warning(message);
            else if (cat === 'security') toast.error(message);
            else toast.success(message);
          } catch {}
          // Update local UI list
          setAllNotifications(prev => {
            const updated = [newNotification, ...prev].sort((a, b) => b.time - a.time);
            return updated;
          });
          setNotificationCount(prev => prev + 1);
          setUnreadTop(prev => {
            const updated = [newNotification, ...prev].slice(0, 3);
            return updated;
          });
          // Persist and update Query cache for notifications page
          try {
            const current = (queryClient.getQueryData(QUERY_KEY) as NotificationItem[] | undefined) || [];
            const next = [newNotification, ...current].sort((a, b) => b.time - a.time);
            await cacheSet(CACHE_KEY, next, CACHE_DURATION.INSTITUTION);
            queryClient.setQueryData(QUERY_KEY, next);
          } catch (err) {
            console.error('Topbar: cacheSet/queryCache update on socket create failed', err);
          }
        });

        // Listen for notification updates (mark as read)
        socket.on('notificationUpdated', async (data: { notificationId: string, read: boolean }) => {
          setAllNotifications(prev => 
            prev.map(n => n.id === data.notificationId ? { ...n, read: data.read } : n)
          );
          if (data.read) {
            setNotificationCount(prev => Math.max(0, prev - 1));
            setUnreadTop(prev => prev.filter(n => n.id !== data.notificationId));
          }
          // Persist and update Query cache
          try {
            const current = (queryClient.getQueryData(QUERY_KEY) as NotificationItem[] | undefined) || [];
            const next = current.map(n => n.id === data.notificationId ? { ...n, read: data.read } : n);
            await cacheSet(CACHE_KEY, next, CACHE_DURATION.STUDENTS);
            queryClient.setQueryData(QUERY_KEY, next);
          } catch (err) {
            console.error('Topbar: cacheSet/queryCache update on socket update failed', err);
          }
        });

        // Listen for notification deletions
        socket.on('notificationRemoved', async (data: { notificationId: string }) => {
          setAllNotifications(prev => prev.filter(n => n.id !== data.notificationId));
          setUnreadTop(prev => prev.filter(n => n.id !== data.notificationId));
          setNotificationCount(prev => {
            const wasUnread = allNotifications.some(n => n.id === data.notificationId && !n.read);
            return wasUnread ? Math.max(0, prev - 1) : prev;
          });
          try {
            const current = (queryClient.getQueryData(QUERY_KEY) as NotificationItem[] | undefined) || [];
            const next = current.filter(n => n.id !== data.notificationId);
            await cacheSet(CACHE_KEY, next, CACHE_DURATION.INSTITUTION);
            queryClient.setQueryData(QUERY_KEY, next);
          } catch (err) {
            console.error('Topbar: cacheSet/queryCache update on socket removal failed', err);
          }
        });

      } catch (error) {
        console.error('Topbar: socket setup error', error);
      }
    };

    setupSocket();

    return () => {
      try {
        if (socket) {
          socket.off('notificationCreated');
          socket.off('notificationUpdated');
          socket.off('notificationRemoved');
        }
      } catch (err) {
        console.error('Topbar: socket cleanup error', err);
      }
    };
  }, [institutionAdminId, studentId, platformAdminId, queryClient, userProfile]);

  const openDropdown = () => {
    clearHideTimer();
    setShowDropdown(true);
    // refresh from backend when opening
    loadFromBackend();
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

  // Load notifications on mount
  useEffect(() => {
    seedIfEmpty();
    loadFromStorage();
    loadFromBackend();
  }, []);

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

  const cycleTheme = () => {
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

  const markOneUnreadAsRead = (id: string) => {
    const updated = allNotifications.map(n => n.id === id ? { ...n, read: true } : n);
    setAllNotifications(updated);
    // saveToStorage(updated); // Socket.IO handles updates
    const unread = updated.filter(n => !n.read).sort((a, b) => (b.time || 0) - (a.time || 0));
    setNotificationCount(unread.length);
    setUnreadTop(unread.slice(0, 3));
  };

  const badge = notificationCount > 99 ? "99+" : String(notificationCount);

  const { data: profileData } = useProfile();

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
              <FontAwesomeIcon icon={faBell} className="text-sm sm:text-lg dark:text-gray-100" />
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
                    {unreadTop.length === 0 ? (
                      <div className="p-3 sm:p-4 text-center text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                        No new notifications
                      </div>
                    ) : (
                      unreadTop.map((notification) => (
                        <motion.div
                          key={notification.id}
                          className="p-2 sm:p-3 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                          whileHover={{ backgroundColor: "rgba(0,0,0,0.05)" }}
                          onClick={() => {
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
                            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
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
                      ))
                    )}
                  </div>
                  
                  <div className="p-2 sm:p-3 border-t border-gray-100 dark:border-gray-800">
                    <button 
                      className="w-full text-center text-xs sm:text-base cursor-pointer text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                      onClick={() => {
                        router.push("/notifications");
                        setShowDropdown(false);
                      }}
                    >
                      View all notifications
                    </button>
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
                  className="text-sm sm:text-lg dark:text-gray-100" 
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
              <div className="text-xs text-gray-500 dark:text-gray-300">{roleLabel||"User"}</div>
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
