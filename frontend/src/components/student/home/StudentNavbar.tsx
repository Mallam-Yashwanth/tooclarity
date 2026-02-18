'use client';
import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { studentDashboardAPI, type DashboardCourse } from '@/lib/students-api';
import router from 'next/router';

interface StudentNavbarProps {
  userName: string;
  userAvatar?: string;
  searchValue?: string;
  onFilterClick?: () => void;
  onNotificationClick?: () => void;
  onWishlistClick?: () => void;
  onProfileClick?: () => void;
  onSearchChange?: (query: string) => void;
  onSearchResults?: (query: string, results: DashboardCourse[] | null) => void;
  showSearchAndFilter?: boolean;
}

const StudentNavbar: React.FC<StudentNavbarProps> = ({
  userName,
  userAvatar,
  searchValue = '',
  onFilterClick,
  onNotificationClick,
  onWishlistClick,
  onProfileClick,
  onSearchChange,
  onSearchResults,
  showSearchAndFilter = true,
}) => {
  const router = useRouter();
  const [, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [searchTerm, setSearchTerm] = useState(searchValue);
  const latestOnSearchChange = useRef(onSearchChange);
  const latestOnSearchResults = useRef(onSearchResults);

  useEffect(() => {
      const handler = (e: MouseEvent) => {
        if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
          setIsMenuOpen(false);
        }
      };
      document.addEventListener('mousedown', handler);
      return () => document.removeEventListener('mousedown', handler);
    }, []);

  useEffect(() => {
    latestOnSearchChange.current = onSearchChange;
  }, [onSearchChange]);

  useEffect(() => {
    latestOnSearchResults.current = onSearchResults;
  }, [onSearchResults]);

  useEffect(() => {
    setSearchTerm(searchValue);
  }, [searchValue]);

  useEffect(() => {
    if (!showSearchAndFilter) {
      return;
    }
    const controller = new AbortController();
        const timeoutId = window.setTimeout(async () => {
          const rawQuery = searchTerm;
          const trimmedQuery = rawQuery.trim();
          latestOnSearchChange.current?.(rawQuery);
          if (!trimmedQuery) {
            latestOnSearchResults.current?.(rawQuery, null);
            return;
          }
          try {
            const response = await studentDashboardAPI.searchInstitutionCourses(trimmedQuery, controller.signal);
            console.log("response", response.data);
            if (response.success && Array.isArray(response.data)) {
              latestOnSearchResults.current?.(rawQuery, response.data);
            } else {
              latestOnSearchResults.current?.(rawQuery, null);
            }
          } catch (error) {
            if (error instanceof DOMException && error.name === 'AbortError') {
              return;
            }
            console.error(error);
            latestOnSearchResults.current?.(rawQuery, null);
          }
        }, 500);

   return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [searchTerm, showSearchAndFilter]);
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  const handleFilterClick = () => {
    onFilterClick?.();
  };

  return (
    <header className="sticky top-0 z-60 bg-white border-b">
      <div className="mx-auto max-w-7xl px-1 py-5">
        <div className="flex items-center gap-3">

          <div onClick={() => router.push("/dashboard")} className="hidden lg:flex items-center gap-2 min-w-[160px]">
            {/* Replace with actual logo later */}
            <img
              src="/TCNewLogo.jpg"   
              alt="TooClarity Logo"
              className="h-12 w-12 object-contain"
            /> 
            <span className="text-xl font-bold text-blue-600">
              Tooclarity
            </span>
          </div>

          {/* 🔍 Search */}
          <div className="flex-1 relative">
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
              <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" />
            </svg>

            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search courses"
              className="
                w-full pl-11 pr-4 py-2.5
                rounded-full
                bg-gray-100
                focus:outline-none
                focus:ring-2
                focus:ring-blue-500
              "
            />
          </div>

          {/*actions */}
          <div className="flex items-center gap-2">

            {/* Filter */}
            <button
              title="Filters"
              onClick={handleFilterClick}
              aria-label="Open filters"
              className="p-2 rounded-full hover:bg-gray-100 md:hidden"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6.00002 9.84375V3.75C6.00002 3.55109 5.92101 3.36032 5.78035 3.21967C5.6397 3.07902 5.44894 3 5.25002 3C5.05111 3 4.86035 3.07902 4.71969 3.21967C4.57904 3.36032 4.50002 3.55109 4.50002 3.75V9.84375C3.85471 10.009 3.28274 10.3843 2.87429 10.9105C2.46584 11.4367 2.24414 12.0839 2.24414 12.75C2.24414 13.4161 2.46584 14.0633 2.87429 14.5895C3.28274 15.1157 3.85471 15.491 4.50002 15.6562V20.25C4.50002 20.4489 4.57904 20.6397 4.71969 20.7803C4.86035 20.921 5.05111 21 5.25002 21C5.44894 21 5.6397 20.921 5.78035 20.7803C5.92101 20.6397 6.00002 20.4489 6.00002 20.25V15.6562C6.64533 15.491 7.2173 15.1157 7.62575 14.5895C8.0342 14.0633 8.25591 13.4161 8.25591 12.75C8.25591 12.0839 8.0342 11.4367 7.62575 10.9105C7.2173 10.3843 6.64533 10.009 6.00002 9.84375ZM5.25002 14.25C4.95335 14.25 4.66334 14.162 4.41667 13.9972C4.16999 13.8324 3.97774 13.5981 3.8642 13.324C3.75067 13.0499 3.72097 12.7483 3.77885 12.4574C3.83672 12.1664 3.97958 11.8991 4.18936 11.6893C4.39914 11.4796 4.66642 11.3367 4.95739 11.2788C5.24836 11.2209 5.54996 11.2506 5.82405 11.3642C6.09814 11.4777 6.33241 11.67 6.49723 11.9166C6.66205 12.1633 6.75002 12.4533 6.75002 12.75C6.75002 13.1478 6.59199 13.5294 6.31068 13.8107C6.02938 14.092 5.64785 14.25 5.25002 14.25ZM12.75 5.34375V3.75C12.75 3.55109 12.671 3.36032 12.5304 3.21967C12.3897 3.07902 12.1989 3 12 3C11.8011 3 11.6103 3.07902 11.4697 3.21967C11.329 3.36032 11.25 3.55109 11.25 3.75V5.34375C10.6047 5.50898 10.0327 5.88428 9.62429 6.41048C9.21584 6.93669 8.99414 7.58387 8.99414 8.25C8.99414 8.91613 9.21584 9.56331 9.62429 10.0895C10.0327 10.6157 10.6047 10.991 11.25 11.1562V20.25C11.25 20.4489 11.329 20.6397 11.4697 20.7803C11.6103 20.921 11.8011 21 12 21C12.1989 21 12.3897 20.921 12.5304 20.7803C12.671 20.6397 12.75 20.4489 12.75 20.25V11.1562C13.3953 10.991 13.9673 10.6157 14.3758 10.0895C14.7842 9.56331 15.0059 8.91613 15.0059 8.25C15.0059 7.58387 14.7842 6.93669 14.3758 6.41048C13.9673 5.88428 13.3953 5.50898 12.75 5.34375ZM12 9.75C11.7034 9.75 11.4133 9.66203 11.1667 9.4972C10.92 9.33238 10.7277 9.09811 10.6142 8.82403C10.5007 8.54994 10.471 8.24834 10.5288 7.95736C10.5867 7.66639 10.7296 7.39912 10.9394 7.18934C11.1491 6.97956 11.4164 6.8367 11.7074 6.77882C11.9984 6.72094 12.3 6.75065 12.574 6.86418C12.8481 6.97771 13.0824 7.16997 13.2472 7.41665C13.412 7.66332 13.5 7.95333 13.5 8.25C13.5 8.64782 13.342 9.02936 13.0607 9.31066C12.7794 9.59196 12.3978 9.75 12 9.75ZM21.75 15.75C21.7494 15.0849 21.5282 14.4388 21.121 13.9129C20.7139 13.387 20.1438 13.011 19.5 12.8438V3.75C19.5 3.55109 19.421 3.36032 19.2804 3.21967C19.1397 3.07902 18.9489 3 18.75 3C18.5511 3 18.3603 3.07902 18.2197 3.21967C18.079 3.36032 18 3.55109 18 3.75V12.8438C17.3547 13.009 16.7827 13.3843 16.3743 13.9105C15.9658 14.4367 15.7441 15.0839 15.7441 15.75C15.7441 16.4161 15.9658 17.0633 16.3743 17.5895C16.7827 18.1157 17.3547 18.491 18 18.6562V20.25C18 20.4489 18.079 20.6397 18.2197 20.7803C18.3603 20.921 18.5511 21 18.75 21C18.9489 21 19.1397 20.921 19.2804 20.7803C19.421 20.6397 19.5 20.4489 19.5 20.25V18.6562C20.1438 18.489 20.7139 18.113 21.121 17.5871C21.5282 17.0612 21.7494 16.4151 21.75 15.75ZM18.75 17.25C18.4534 17.25 18.1633 17.162 17.9167 16.9972C17.67 16.8324 17.4777 16.5981 17.3642 16.324C17.2507 16.0499 17.221 15.7483 17.2788 15.4574C17.3367 15.1664 17.4796 14.8991 17.6894 14.6893C17.8991 14.4796 18.1664 14.3367 18.4574 14.2788C18.7484 14.2209 19.05 14.2506 19.324 14.3642C19.5981 14.4777 19.8324 14.67 19.9972 14.9166C20.1621 15.1633 20.25 15.4533 20.25 15.75C20.25 16.1478 20.092 16.5294 19.8107 16.8107C19.5294 17.092 19.1478 17.25 18.75 17.25Z" fill="#3553FD"/>
              </svg>
            </button>

            {/* Notification */}
            <button
              title="Notifications"
              onClick={onNotificationClick}
              aria-label="View notifications"
              className="p-2 rounded-full hover:bg-gray-100"
            >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20.9109 6.49958C20.7788 6.56707 20.6253 6.57963 20.4839 6.5345C20.3426 6.48937 20.2248 6.39022 20.1562 6.25864C19.4247 4.81416 18.317 3.59379 16.95 2.72614C16.8256 2.64576 16.7379 2.51957 16.7059 2.37494C16.674 2.23032 16.7004 2.07893 16.7794 1.95365C16.8584 1.82836 16.9836 1.73929 17.1279 1.70576C17.2721 1.67224 17.4238 1.69696 17.55 1.77458C19.0809 2.7539 20.3237 4.12292 21.1509 5.74114C21.1849 5.8067 21.2057 5.87832 21.2121 5.95191C21.2185 6.02551 21.2103 6.09963 21.188 6.17006C21.1657 6.24049 21.1297 6.30584 21.0822 6.36238C21.0347 6.41891 20.9765 6.46553 20.9109 6.49958ZM3.84371 6.25864C4.57524 4.81416 5.68291 3.59379 7.04996 2.72614C7.17436 2.64576 7.26205 2.51957 7.29398 2.37494C7.32592 2.23032 7.29952 2.07893 7.22052 1.95365C7.14153 1.82836 7.01631 1.73929 6.87204 1.70576C6.72777 1.67224 6.57611 1.69696 6.44996 1.77458C4.91902 2.7539 3.6762 4.12292 2.84902 5.74114C2.80764 5.80694 2.78035 5.88061 2.76887 5.95749C2.75738 6.03437 2.76196 6.1128 2.78231 6.18782C2.80266 6.26285 2.83834 6.33284 2.88709 6.39338C2.93585 6.45393 2.99662 6.50371 3.06558 6.53958C3.13454 6.57546 3.21019 6.59666 3.28775 6.60183C3.36531 6.607 3.4431 6.59605 3.51622 6.56965C3.58933 6.54325 3.65618 6.50199 3.71255 6.44845C3.76892 6.39493 3.81357 6.33029 3.84371 6.25864ZM20.625 16.588C20.7411 16.7868 20.8028 17.0127 20.8041 17.2429C20.8053 17.4732 20.7459 17.6997 20.632 17.8997C20.518 18.0997 20.3534 18.2663 20.1547 18.3826C19.956 18.4989 19.7302 18.5609 19.5 18.5624H15.5156C15.379 19.3963 14.9504 20.1544 14.3064 20.7015C13.6624 21.2485 12.8449 21.5489 12 21.5489C11.155 21.5489 10.3375 21.2485 9.69351 20.7015C9.04953 20.1544 8.62096 19.3963 8.48433 18.5624H4.49996C4.26925 18.5619 4.04275 18.5006 3.84327 18.3847C3.6438 18.2688 3.4784 18.1023 3.36375 17.9021C3.24911 17.7019 3.18926 17.475 3.19024 17.2443C3.19122 17.0136 3.25299 16.7872 3.36933 16.588C4.2309 15.1021 4.68746 12.9964 4.68746 10.4999C4.68746 8.56049 5.45788 6.70053 6.82924 5.32917C8.2006 3.95781 10.0606 3.18739 12 3.18739C13.9394 3.18739 15.7993 3.95781 17.1707 5.32917C18.542 6.70053 19.3125 8.56049 19.3125 10.4999C19.3125 13.0311 19.7568 15.0805 20.6325 16.588H20.625ZM14.3709 18.5624H9.62902C9.75623 19.0955 10.0594 19.5702 10.4896 19.9098C10.9198 20.2494 11.4519 20.4341 12 20.4341C12.548 20.4341 13.0801 20.2494 13.5103 19.9098C13.9405 19.5702 14.2437 19.0955 14.3709 18.5624ZM19.6603 17.1561C18.6834 15.4686 18.1875 13.2327 18.1875 10.4999C18.1875 8.85886 17.5356 7.28505 16.3752 6.12466C15.2148 4.96428 13.641 4.31239 12 4.31239C10.3589 4.31239 8.78512 4.96428 7.62474 6.12466C6.46435 7.28505 5.81246 8.85886 5.81246 10.4999C5.81246 13.2336 5.31652 15.4686 4.33965 17.1561C4.32319 17.1846 4.31453 17.217 4.31453 17.2499C4.31453 17.2828 4.32319 17.3151 4.33965 17.3436C4.35509 17.3724 4.37811 17.3963 4.40622 17.4128C4.43432 17.4293 4.46642 17.4378 4.49902 17.4374H19.5C19.5326 17.4378 19.5647 17.4293 19.5928 17.4128C19.6209 17.3963 19.6439 17.3724 19.6593 17.3436C19.6759 17.3152 19.6848 17.2829 19.6849 17.25C19.6851 17.2171 19.6766 17.1847 19.6603 17.1561Z" fill="#060B13"/>
            </svg>
            </button>

            {/* Wishlist – hide on very small screens */}
            <button
              title="Wishlist"
              onClick={() => router.push('/student/wishlist')}
              aria-label="View wishlist"
              className="hidden sm:flex p-2 rounded-full hover:bg-gray-100"
            >
              <svg width="24" height="24" viewBox="0 0 12 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 15.5V1.6155C0 1.15517 0.154167 0.770833 0.4625 0.4625C0.770833 0.154167 1.15517 0 1.6155 0H10.3845C10.8448 0 11.2292 0.154167 11.5375 0.4625C11.8458 0.770833 12 1.15517 12 1.6155V15.5L6 12.923L0 15.5ZM1 13.95L6 11.8L11 13.95V1.6155C11 1.4615 10.9359 1.32042 10.8077 1.19225C10.6796 1.06408 10.5385 1 10.3845 1H1.6155C1.4615 1 1.32042 1.06408 1.19225 1.19225C1.06408 1.32042 1 1.4615 1 1.6155V13.95Z" fill="#697282"/>
            </svg>
            </button>

            {/* Profile */}
            <button
              onClick={onProfileClick}
              className="
                w-9 h-9
                rounded-full
                bg-blue-600
                text-white
                flex items-center justify-center
                font-semibold text-sm
                overflow-hidden
              "
            >
              {userAvatar ? (
                <Image src={userAvatar} alt={userName} width={36} height={36} />
              ) : (
                <span>{getInitials(userName)}</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default StudentNavbar;
 