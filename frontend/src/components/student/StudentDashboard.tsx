"use client";

import React, { useState, useEffect, useCallback } from "react";
import HomeHeader from "./home/HomeHeader";
import StudentNavbar from "./home/StudentNavbar";
import CategoryRow from "./home/CategoryRow";
import CourseCard from "./home/CourseCard";
import FilterSidebar from "./home/FilterSidebar";
import FooterNav from "./home/FooterNav";
import styles from "./StudentDashboard.module.css";
import { DashboardCourse, studentDashboardAPI } from "@/lib/students-api";
import { useAuth } from "@/lib/auth-context";
import { useNotifications } from "@/lib/hooks/notifications-hooks";
import { useRouter } from "next/navigation";
import {ActiveFilters} from './home/FilterSidebar'
import NotificationPane from "./notificationpane/NotificationPane";


interface Course {
  id: string;
  title: string;
  institution: string;
  image: string;
  rating: number;
  reviews: number;
  students: number;
  price: number;
  originalPrice?: number;
  level: string;
  mode: string;
  iswishlisted?: boolean;
  ageGroup?: string; // e.g., "2 - 3 Yrs", "3 - 4 Yrs"
  programDuration?: string; // e.g., "Summer Camp", "Academic Year", "2 Yrs"
  priceRange?: string; // e.g., "Below ₹75,000"
  instituteType?: string; // e.g., "Kindergarten", "School's", "Graduation"
  boardType?: string; // e.g., "State Board", "CBSE" (for School's/Intermediate)
  // Graduation-specific fields
  graduationType?: string; // e.g., "Under Graduation", "Post Graduation"
  streamType?: string; // e.g., "Engineering and Technology (B.E./B.Tech.)"
  educationType?: string; // e.g., "Full time", "Part time", "Distance learning"
  // Store original API data for detailed view
  apiData: DashboardCourse;
}

const CATEGORY_TO_INSTITUTE: Record<string, string> = {
  Kindergarten: "Kindergarten",
  School: "School's",
  Intermediate: "Intermediate",
  Graduation: "Graduation",
  Upskilling: "Coaching",
  "Exam Preparation": "Coaching",
  "Tuition Center": "Tuition Center's",
  "Study Abroad": "Study Abroad",
};

/**
 * Get price range category based on price
 */
const getPriceRange = (price: number): string => {
  if (price < 75000) return "Below ₹75,000";
  if (price <= 150000) return "₹75,000 - ₹1,50,000";
  if (price <= 300000) return "₹1,50,000 - ₹3,00,000";
  return "Above ₹3,00,000";
};

/**
 * Transform API course data to internal Course format
 */
const transformApiCourse = (apiCourse: DashboardCourse): Course => {

  const price = apiCourse.priceOfCourse || 0;
  
  return {
  id: apiCourse._id || "",
  title: apiCourse.courseName || "Untitled Course",
  institution: apiCourse.institutionDetails?.instituteName || "Unknown Institution",
  image: apiCourse.imageUrl || "/course-placeholder.jpg",
  // rating: apiCourse.rating || 4.5,
  // reviews: apiCourse.reviews || 0,
  // students: apiCourse.studentsEnrolled || 0,
  price: price,
  // level: "Lower kindergarten", // Default level if not provided
  // mode: modeMap[apiCourse.mode || "Online"] || apiCourse.mode || "Online",
  iswishlisted : apiCourse.isWishlisted,
  // Kindergarten-specific fields with defaults
  // ageGroup: "3 - 4 Yrs", // Default age group
  // programDuration: "Academic Year", // Default program duration
  priceRange: getPriceRange(price),
  instituteType: "Kindergarten", // Default to Kindergarten
  boardType: "CBSE", // Default board type for schools





  // Graduation-specific fields with defaults
  // graduationType: "Under Graduation", // Default graduation type
  // streamType: "Engineering and Technology (B.E./B.Tech.)", // Default stream
  // educationType: "Full time", // Default education type
  // Store original API data for course details page
  apiData: apiCourse,
  rating: 0,
  reviews: 0,
  students: 0,
  level: "",
  mode: "",
};
};

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [, setSearchResults] = useState<Course[] | null>(null);
  const [displayedCourses, setDisplayedCourses] = useState<Course[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const COURSES_PER_PAGE = 9;
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilters, setActiveFilters] = useState({
    instituteType: "" as string,
    kindergartenLevels: [] as string[],
    schoolLevels: [] as string[],
    modes: [] as string[],
    ageGroup: [] as string[],
    programDuration: [] as string[],
    priceRange: [] as string[],
    boardType: [] as string[],
    graduationType: [] as string[],
    streamType: [] as string[],
    levels: [] as string[],
    classSize: [] as string[],
    seatingType: [] as string[],
    operatingHours: [] as string[],
    duration: [] as string[],
    subjects: [] as string[],
    educationType: [] as string[],
  });
  const [activePane, setActivePane] = useState<"notifications" | "wishlist" | null>(null);
  const [isFilterBottomSheetOpen, setIsFilterBottomSheetOpen] = useState(false);

  const notificationsQuery = useNotifications();
  const notifications = notificationsQuery.data ?? [];
  const notificationsLoading = notificationsQuery.isLoading;

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await studentDashboardAPI.getVisibleCourses();
        if (!response.success || !response.data) {
          throw new Error(response.message || "Failed to fetch courses");
        }

        // Transform API courses to internal format
        const transformedCourses = (response.data as DashboardCourse[]).map((apiCourse) =>
          transformApiCourse(apiCourse)
        );
        setCourses(transformedCourses);
        setFilteredCourses(transformedCourses);
        setDisplayedCourses(transformedCourses.slice(0, COURSES_PER_PAGE));
        setCurrentPage(1);
      } catch (err) {
        console.error("Error fetching courses:", err);
        setError(err instanceof Error ? err.message : "Failed to load courses");
        setCourses([]);
        setFilteredCourses([]);
        setDisplayedCourses([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  useEffect(() => {
    setDisplayedCourses(filteredCourses.slice(0, COURSES_PER_PAGE));
    setCurrentPage(1);
    setIsLoadingMore(false);
  }, [filteredCourses]);

  const loadMoreCourses = useCallback(() => {
    if (isLoadingMore || displayedCourses.length >= filteredCourses.length) return;
    setIsLoadingMore(true);
    const nextPage = currentPage + 1;
    const endIndex = nextPage * COURSES_PER_PAGE;
    const startIndex = 0;
    const newDisplayedCourses = filteredCourses.slice(startIndex, endIndex);
    setDisplayedCourses(newDisplayedCourses);
    setCurrentPage(nextPage);
    setIsLoadingMore(false);
  }, [isLoadingMore, displayedCourses.length, filteredCourses, currentPage]);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollPosition = window.innerHeight + window.scrollY;
          const pageHeight = document.documentElement.scrollHeight;
          const threshold = 500;
          const shouldLoadMore =
            scrollPosition >= pageHeight - threshold &&
            !isLoadingMore &&
            displayedCourses.length < filteredCourses.length;
          if (shouldLoadMore) {
            loadMoreCourses();
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    // Check immediately on mount
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, [displayedCourses.length, filteredCourses.length, isLoadingMore, loadMoreCourses]);

  useEffect(() => {
    const isMobile = window.innerWidth < 1024;
    if (isFilterBottomSheetOpen && isMobile) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isFilterBottomSheetOpen]);

  const formatNotificationTime = (timestamp?: number) => {
    if (!timestamp) return "";
    const diff = Date.now() - timestamp;
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  const handleNotificationPaneToggle = () => {
    setActivePane((prev) => (prev === "notifications" ? null : "notifications"));
  };

  const handleWishlistPaneToggle = () => {
    setActivePane((prev) => (prev === "wishlist" ? null : "wishlist"));
  };

  const closePane = () => {
    setActivePane(null);
  };

  const handleViewCourseDetails = (courseId: string) => {
    router.push(`/dashboard/${courseId}`);
  };

  const filterCourses = useCallback((query: string, filters: typeof activeFilters, sourceCourses: Course[]) => {
    let result = sourceCourses;
    if (query) {
      result = result.filter(
        (course) =>
          course.title.toLowerCase().includes(query.toLowerCase()) ||
          course.institution.toLowerCase().includes(query.toLowerCase())
      );
    }
    if (filters.instituteType) {
      result = result.filter((course) => course.instituteType === filters.instituteType);
    }
    if (filters.kindergartenLevels.length > 0) {
      result = result.filter((course) => filters.kindergartenLevels.includes(course.level));
    }
    if (filters.schoolLevels.length > 0) {
      result = result.filter((course) => filters.schoolLevels.includes(course.level));
    }
    if (filters.modes.length > 0) {
      result = result.filter((course) => filters.modes.includes(course.mode));
    }
    if (filters.ageGroup.length > 0) {
      result = result.filter((course) => filters.ageGroup.includes(course.ageGroup || "3 - 4 Yrs"));
    }
    if (filters.programDuration.length > 0) {
      result = result.filter((course) => filters.programDuration.includes(course.programDuration || "Academic Year"));
    }
    if (filters.priceRange.length > 0) {
      result = result.filter((course) => filters.priceRange.includes(course.priceRange || ""));
    }
    if (filters.boardType.length > 0) {
      result = result.filter((course) => filters.boardType.includes(course.boardType || "CBSE"));
    }
    if (filters.graduationType.length > 0) {
      result = result.filter((course) => filters.graduationType.includes(course.graduationType || "Under Graduation"));
    }
    if (filters.streamType.length > 0) {
      result = result.filter((course) => filters.streamType.includes(course.streamType || "Engineering and Technology (B.E./B.Tech.)"));
    }
    if (filters.educationType.length > 0) {
      result = result.filter((course) => filters.educationType.includes(course.educationType || "Full time"));
    }
    setFilteredCourses(result);
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    if (!value.trim()) {
      setSearchResults(null);
      filterCourses("", activeFilters, courses);
    }
  }, [activeFilters, courses, filterCourses]);

  const handleSearchResults = useCallback((query: string, results: DashboardCourse[] | null) => {
  const trimmedQuery = query.trim();

  if (!trimmedQuery) {
    setSearchResults(null);
    filterCourses("", activeFilters, courses);
    setDisplayedCourses(courses.slice(0, COURSES_PER_PAGE));
    return;
  }

  if (!results || results.length === 0) {
    setSearchResults([]);
    setFilteredCourses([]);
    setDisplayedCourses([]);
    return;
  }
  

  const transformed = results.map((course) =>
    transformApiCourse(course)
  );

  setSearchResults(transformed);
  setFilteredCourses(transformed);
  setDisplayedCourses(transformed.slice(0, COURSES_PER_PAGE));
}, [activeFilters, courses, filterCourses]);


  const handleFilterChange = (filterType: string, value: string, isChecked: boolean) => {
    const updatedFilters = { ...activeFilters };
    if (filterType === "instituteType") {
      if (isChecked) {
        updatedFilters.instituteType = value;
        updatedFilters.kindergartenLevels = [];
        updatedFilters.schoolLevels = [];
        updatedFilters.boardType = [];
        updatedFilters.programDuration = [];
        updatedFilters.ageGroup = [];
        updatedFilters.graduationType = [];
        updatedFilters.streamType = [];
        updatedFilters.educationType = [];
      } else {
        updatedFilters.instituteType = "";
        updatedFilters.kindergartenLevels = [];
        updatedFilters.schoolLevels = [];
        updatedFilters.boardType = [];
        updatedFilters.programDuration = [];
        updatedFilters.ageGroup = [];
        updatedFilters.graduationType = [];
        updatedFilters.streamType = [];
        updatedFilters.educationType = [];
      }
    } else {
      const filterKey = filterType as keyof typeof updatedFilters;
      const filterArray = updatedFilters[filterKey] as string[];
      if (isChecked) {
        filterArray.push(value);
      } else {
        const index = filterArray.indexOf(value);
        if (index > -1) {
          filterArray.splice(index, 1);
        }
      }
    }
    setActiveFilters(updatedFilters);
  };

  const handleCategorySelect = async (categoryKey: string) => {
    const instituteType = CATEGORY_TO_INSTITUTE[categoryKey];

    setActiveCategory(categoryKey);

    const updatedFilters = {
      ...activeFilters,
      instituteType,
    };

    setActiveFilters(updatedFilters);

    await handleApplyFilters(updatedFilters);
  };



  const handleWishlistToggle = (courseId: string) => {

  const updatedCourses = courses.map((course) =>
    course.id === courseId
      ? { ...course, iswishlisted: !course.iswishlisted }
      : course
  );
  setCourses(updatedCourses);

  // Update filtered list
  const updatedFiltered = filteredCourses.map((course) =>
    course.id === courseId
      ? { ...course, iswishlisted: !course.iswishlisted }
      : course
  );
  setFilteredCourses(updatedFiltered);
};


  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActivePane(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
  
  const wishlistCourses = courses.filter((course) => course.iswishlisted);

  const handleFilterToggle = () => {
    setIsFilterBottomSheetOpen(!isFilterBottomSheetOpen);
  };

  const clearAllFilters = () => {
    const clearedFilters = {
      instituteType: "" as string,
      kindergartenLevels: [] as string[],
      schoolLevels: [] as string[],
      modes: [] as string[],
      ageGroup: [] as string[],
      programDuration: [] as string[],
      priceRange: [] as string[],
      boardType: [] as string[],
      graduationType: [] as string[],
      streamType: [] as string[],
      levels: [] as string[],
      classSize: [] as string[],
      seatingType: [] as string[],
      operatingHours: [] as string[],
      duration: [] as string[],
      subjects: [] as string[],
      educationType: [] as string[],
    };
    setActiveFilters(clearedFilters);
  };


  const handleApplyFilters = async (filters: ActiveFilters) => {
  try {
    setLoading(true);
    setError(null);

    const response = await studentDashboardAPI.filterInstitutionCourses(filters);

    if (!response.success && response.message === "No course found") {
      setFilteredCourses([]);
      setDisplayedCourses([]);
      setSearchResults([]);
      setCurrentPage(1);
      return; 
    }

    if (!response.success || !response.data) {
      throw new Error(response.message || "Failed to fetch filtered courses");
    }

    const transformedCourses = (response.data as DashboardCourse[])
      .map(transformApiCourse);

    setSearchResults(transformedCourses);
    setFilteredCourses(transformedCourses);
    setDisplayedCourses(transformedCourses.slice(0, COURSES_PER_PAGE));
    setCurrentPage(1);

  } catch (err) {
    console.error("Error applying filters:", err);
    setError(err instanceof Error ? err.message : "Failed to apply filters");
  } finally {
    setLoading(false);
  }
};


  const handleClearFilters = () => {
  clearAllFilters();

  setSearchQuery("");
  setSearchResults(null);

  setFilteredCourses(courses);

  setDisplayedCourses(courses.slice(0, COURSES_PER_PAGE));
  setCurrentPage(1);

  setIsFilterBottomSheetOpen(false);
};


  const handleExploreClick = () => {
    router.push('/student/explore');
  };

  const shouldShowFooter = !isFilterBottomSheetOpen;

    return (
    <div className="w-full min-h-screen flex flex-col bg-gradient-to-b from-[#dbe0ff] via-white to-white max-lg:pb-[80px]">
      <StudentNavbar
        userName={user?.name || 'Student'}
        userAvatar={user?.profilePicture}
        searchValue={searchQuery}
        onSearchChange={handleSearchChange}
        onSearchResults={handleSearchResults}
        onFilterClick={handleFilterToggle}
        onNotificationClick={handleNotificationPaneToggle}
        onWishlistClick={handleWishlistPaneToggle}
        onProfileClick={() => router.push('/student/profile')}
      />

      <CategoryRow
        activeCategory={activeCategory}
        onCategorySelect={handleCategorySelect}
      />


      {activePane && (
        <div
          className="fixed inset-0 bg-black/30 z-[5]"
          onClick={closePane}
        />
      )}


      {activePane === "notifications" && (
        <NotificationPane onClose={closePane} />
      )}


      {activePane === "wishlist" && (
        <aside
          role="complementary"
          aria-label="Wishlist"
          className="
            fixed top-0 h-screen bg-white z-[6]
            flex flex-col
            shadow-[-8px_0_20px_rgba(0,0,0,0.1)]
            transition-[right] duration-300 ease-in-out

            right-0
            w-[360px]

            max-md:w-full
            max-md:right-0
          "
        >
          {/* Header */}
          <header
            className="
              flex items-center justify-between
              p-5
              border-b border-[#e5e5e5]

              max-md:p-4
              max-[480px]:p-[14px]
            "
          >
            <h2 className="m-0 text-[18px] font-semibold text-[#222]">
              Wishlist
            </h2>

            <button
              onClick={closePane}
              aria-label="Close wishlist"
              className="
                bg-transparent border-none
                text-[24px] leading-none
                cursor-pointer text-[#666]
                p-1
                hover:text-[#222]
              "
            >
              ×
            </button>
          </header>

          {/* Content */}
          <div
            className="
              flex-1 overflow-y-auto
              p-5 flex flex-col gap-4

              max-md:p-4
              max-[480px]:p-[14px]
            "
          >
            {wishlistCourses.length === 0 ? (
              <div className="text-center text-[#666] text-[14px]">
                No courses in wishlist yet.
              </div>
            ) : (
              <ul className="list-none m-0 p-0 flex flex-col gap-3">
                {wishlistCourses.map((course) => (
                  <li
                    key={course.id}
                    className="
                      border border-[#e5e5e5]
                      rounded-[12px]
                      p-4
                      flex items-center justify-between gap-3
                      bg-white
                    "
                  >
                    <div className="flex flex-col gap-1">
                      <div className="text-[15px] font-semibold text-[#222]">
                        {course.title}
                      </div>
                      <div className="text-[13px] text-[#666]">
                        {course.institution}
                      </div>
                    </div>

                    <button
                      onClick={() => handleWishlistToggle(course.id)}
                      aria-label="Remove from wishlist"
                      className="
                        border border-[#d32f2f]
                        bg-transparent text-[#d32f2f]
                        rounded-[8px]
                        px-3 py-[6px]
                        cursor-pointer
                        text-[13px]
                        transition-all duration-200 ease-in-out
                        hover:bg-[#ffe5e5]
                      "
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      )}


      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-100px)] gap-4 bg-gray-100">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-[#0222d7] rounded-full animate-spin" />
          <p className="text-gray-500 font-medium">Loading courses...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-100px)] gap-2 bg-gray-100">
          <p className="text-lg font-semibold text-red-600">⚠️ {error}</p>
          <p className="text-sm text-gray-500">
            Please refresh the page or try again later.
          </p>
        </div>
      ) : (
        <div className="flex flex-1 w-full relative">
          <div className="hidden lg:block">
          <FilterSidebar activeFilters={activeFilters} onFilterChange={handleFilterChange} onApplyFilters={handleApplyFilters} onClearFilters={handleClearFilters}/>
          </div>
          <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
            <section className="w-full">
              {displayedCourses.length > 0 ? (
                <>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 animate-fadeIn">
                    {displayedCourses.map((course) => (
                      <CourseCard
                        key={course.id}
                        course={{
                          id: course.apiData?._id,
                          title: course.title,
                          institution: course.institution,
                          rating: course.rating,
                          reviews: course.reviews,
                          students: course.students,
                          price: course.price,
                          level: course.level,
                          mode: course.mode,
                          iswishlisted: course.iswishlisted,
                          location: course.apiData?.institutionDetails.locationURL || "",
                          description: course.apiData?.courseName || course.apiData.selectBranch || 'Quality education program',
                          duration: course.apiData?.courseDuration || '1 year',
                          brandLogo: course.apiData?.institutionDetails?.logoUrl || '',
                          imageUrl: course.apiData?.imageUrl || '',
                        }}
                        onWishlistToggle={handleWishlistToggle}
                        onViewDetails={handleViewCourseDetails}
                      />
                    ))}
                  </div>
                  {isLoadingMore && (
                    <div className="flex justify-center py-10">
                      <div className="w-10 h-10 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center min-h-[300px] bg-gray-100 border rounded-xl text-center p-10">
                  <p className="text-gray-500 font-medium max-w-md">
                    No courses found matching your filters. Try adjusting your search criteria.
                  </p>
                </div>
              )}
            </section>
          </main>
        </div>
      )}

      {isFilterBottomSheetOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-[998]" onClick={() => setIsFilterBottomSheetOpen(false)}/>
          <div className="fixed bottom-0 inset-x-0 bg-[#F5F6F9] rounded-t-3xl z-[999] max-h-[85vh] flex flex-col shadow-xl transition-transform duration-300 translate-y-0">
            <div className="flex justify-center py-3">
              <svg width="134" height="5" viewBox="0 0 134 5" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="134" height="5" rx="2.5" fill="#B0B1B3"/>
              </svg>
            </div>
            <div className="flex items-center gap-3 px-6 py-4 border-b">
              <button className="bg-transparent border-0 text-[32px] leading-none cursor-pointer text-[#666] p-0 w-8 h-8 flex items-center justify-center mr-[10px] hover:text-[#222] transition-colors" onClick={() => setIsFilterBottomSheetOpen(false)} aria-label="Close filters">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6.96939 12.531L14.4694 20.031C14.5391 20.1007 14.6218 20.156 14.7128 20.1937C14.8039 20.2314 14.9015 20.2508 15 20.2508C15.0986 20.2508 15.1961 20.2314 15.2872 20.1937C15.3782 20.156 15.461 20.1007 15.5306 20.031C15.6003 19.9614 15.6556 19.8786 15.6933 19.7876C15.731 19.6965 15.7504 19.599 15.7504 19.5004C15.7504 19.4019 15.731 19.3043 15.6933 19.2132C15.6556 19.1222 15.6003 19.0395 15.5306 18.9698L8.56032 12.0004L15.5306 5.03104C15.6714 4.89031 15.7504 4.69944 15.7504 4.50042C15.7504 4.30139 15.6714 4.11052 15.5306 3.96979C15.3899 3.82906 15.199 3.75 15 3.75C14.801 3.75 14.6101 3.82906 14.4694 3.96979L6.96939 11.4698C6.89965 11.5394 6.84433 11.6222 6.80659 11.7132C6.76885 11.8043 6.74942 11.9019 6.74942 12.0004C6.74942 12.099 6.76885 12.1966 6.80659 12.2876C6.84433 12.3787 6.89965 12.4614 6.96939 12.531Z" fill="#060B13"/>
                </svg>
              </button>
              <h2 className="text-lg font-medium">Filter&apos;s</h2>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <FilterSidebar activeFilters={activeFilters} onFilterChange={handleFilterChange} onApplyFilters={handleApplyFilters} />
            </div>
            <div className="flex gap-3 px-6 py-4 border-t bg-white">
              <button className="flex-1 border rounded-xl py-3 font-semibold" onClick={clearAllFilters}>Clear Filter</button>
              <button  className="flex-1 bg-blue-600 text-white rounded-xl py-3 font-semibold" onClick={() => setIsFilterBottomSheetOpen(false)}>Show {filteredCourses.length} Results</button>
            </div>
          </div>
        </>
      )}

      {shouldShowFooter && <FooterNav onExploreClick={handleExploreClick} />}
    </div>
  );
};

export default StudentDashboard;
