"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
// import CoursePage from "@/components/student/home/CoursePage";
import InstituteCoursePage from "@/components/student/home/InstituteCoursePage";
import HomeHeader from "@/components/student/home/HomeHeader";
import FooterNav from "@/components/student/home/FooterNav";
import { coursePageData, studentDashboardAPI } from "@/lib/students-api";
import { useAuth } from "@/lib/auth-context";
import styles from "./CoursePage.module.css";

const CourseDetailsPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const courseId = params.courseId as string;
  
  const [courseData, setCourseData] = useState<coursePageData| null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
  console.log("Effect running for courseId:", courseId);
  // ...fetch code
}, [courseId]);

  useEffect(() => {
    const fetchCourseDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch all courses and find the specific one
        const response = await studentDashboardAPI.getCoursebyId(courseId);
        if (!response.success || !response.data) {
          throw new Error(response.message || "Failed to fetch course details");
        }

        setCourseData(response.data);
      } catch (err) {
        console.error("Error fetching course:", err);
        setError(err instanceof Error ? err.message : "Failed to load course");
      } finally {
        setLoading(false);
      }
    };

    if (courseId) {
      fetchCourseDetails();
    }
  }, [courseId]);

  const handleBackFromDetails = () => {
    router.push('/dashboard');
  };

  const handleRequestCall = () => {
    console.log('Request call clicked');
    // Add API call here
  };

  const handleBookDemo = () => {
    console.log('Book demo clicked');
    // Add API call here
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // Could implement search functionality if needed
  };

  const handleNotificationClick = () => {
    router.push("/student/notifications");
  };

  const handleWishlistClick = () => {
    router.push("/dashboard"); // Navigate back to dashboard
  };

  const handleProfileClick = () => {
    router.push("/student/profile");
  };

  const handleExploreClick = () => {
    router.push('/student/explore');
  };

  if (loading) {
    return (
      <>
      <div className={styles.pageContainer}>
        <HomeHeader
          userName={user?.name || "Student"}
          userAvatar={user?.profilePicture}
          searchValue={searchQuery}
          onSearchChange={handleSearch}
          onFilterClick={() => {}}
          onNotificationClick={handleNotificationClick}
          onWishlistClick={handleWishlistClick}
          onProfileClick={handleProfileClick}
          showSearchAndFilter={false}
        />
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p className={styles.loadingText}>Loading course details...</p>
        </div>
        <FooterNav onExploreClick={handleExploreClick} />
        </div>
      </>
    );
  }

  if (error || !courseData) {
    return (
      <>
      <div className={styles.pageContainer}>
        <HomeHeader
          userName={user?.name || "Student"}
          userAvatar={user?.profilePicture}
          searchValue={searchQuery}
          onSearchChange={handleSearch}
          onFilterClick={() => {}}
          onNotificationClick={handleNotificationClick}
          onWishlistClick={handleWishlistClick}
          onProfileClick={handleProfileClick}
          showSearchAndFilter={false}
        />
        <div className={styles.errorContainer}>
          <p className={styles.errorText}>⚠️ {error || "Course not found"}</p>
          <button 
            className={styles.backButton}
            onClick={handleBackFromDetails}
          >
            Back to Dashboard
          </button>
        </div>
        <FooterNav onExploreClick={handleExploreClick} />
        </div>
      </>
    );
  }

  const extendedCareString = courseData.institution.extendedCare ? "Yes" : "No";
  const mealsProvided = courseData.institution.mealsProvided ? "Yes" : "No";
  const playground = courseData.institution.playground ? "Yes" : "No";

  return (
    <>
    <div className={styles.pageContainer}>
      <HomeHeader
        userName={user?.name || "Student"}
        userAvatar={user?.profilePicture}
        searchValue={searchQuery}
        onSearchChange={handleSearch}
        onFilterClick={() => {}}
        onNotificationClick={handleNotificationClick}
        onWishlistClick={handleWishlistClick}
        onProfileClick={handleProfileClick}
        showSearchAndFilter={false}
      />
      <InstituteCoursePage
        course={{
          id: courseId,
          institutionId: courseData.institution.id || ``,
          title: courseData.course.courseName || courseData.course.selectBranch|| "Untitled Course",
          institution: courseData.institution?.instituteName || "Unknown Institution",
          location: courseData.institution?.locationURL || courseData.course.locationURL || "Location not specified",
          description: courseData.course.aboutCourse || 'Discover quality education with comprehensive learning programs',
          aboutCourse: courseData.course.aboutCourse || 'Our institution provides world-class education with experienced faculty and modern facilities.',
          eligibility: courseData.course.eligibilityCriteria || 'All students meeting basic requirements',
          price: courseData.course.priceOfCourse || '0',
          duration: courseData.course.courseDuration ||'1 year',
          mode: courseData.course.mode || 'Classroom',
          timings: (courseData.institution.openingTime && courseData.institution.closingTime 
            ? `${courseData.institution.openingTime} - ${courseData.institution.closingTime}`
            : '9:00 AM - 5:00 PM') || (courseData.course.openingTime && courseData.course.closingTime
            ? `${courseData.course.openingTime} - ${courseData.course.closingTime}` 
            : '9:00 AM - 5:00 PM'),
          image: courseData.course.imageUrl || '',
          brandLogo: courseData.institution?.logoUrl || '',
          startDate: courseData.course.startDate 
            ? new Date(courseData.course.startDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
            : 'July 2024',
          operationalDays: courseData.institution?.operationalDays || courseData.course.operationalDays || ['Mon', 'Tues', 'Wed', 'Thu', 'Fri'],
          instructor: courseData.course.instructorProfile || '',
          subject: courseData.course.subject || '',
          hallName: courseData.course.hallName || '',
          totalSeats: courseData.course.totalSeats || '0',
          isWishlisted: courseData.isWishlisted || false,
          features: {
            recognized: true,
            activities: true,
            transport: courseData.institution.busService === true,
            extraCare: extendedCareString === "Yes",
            mealsProvided: mealsProvided === "Yes",
            playground: courseData.institution.playground === true || playground === "Yes",
            resumeBuilding: courseData.institution.resumeBuilding === true,
            linkedinOptimization: courseData.institution.linkedinOptimization === true,
            mockInterviews: courseData.institution.mockInterviews === true,
            placementDrives: courseData.institution.placementDrives === true,
            library: courseData.institution.library === true,
            entranceExam: courseData.institution.entranceExam === true,
            managementQuota: courseData.institution.managementQuota === true,
            classSize: courseData.course.classSize || '0',
            classSizeRatio: courseData.course.classSizeRatio || '0',
            schoolCategory : courseData.institution.schoolCategory || '',
            curriculumType : courseData.institution.curriculumType || '',
            hostelFacility : courseData.institution.hostelFacility === true,
            certification : courseData.institution.certification === true,
            exclusiveJobPortal : courseData.institution.exclusiveJobPortal === true,
            hasWifi: courseData.course.hasWifi === 'yes',
            hasChargingPoints: courseData.course.hasChargingPoints === 'yes',
            hasAC: courseData.course.hasAC === 'yes',
            hasPersonalLocker: courseData.course.hasPersonalLocker === 'yes',
            collegeCategory: courseData.institution.collegeCategory || '',
          },
        }}
        onBack={handleBackFromDetails}
        onRequestCall={handleRequestCall}
        onBookDemo={handleBookDemo}
        instituteType={courseData.institution?.instituteType}
      />
      <FooterNav onExploreClick={handleExploreClick} />
      </div>
    </>
  );
};

export default CourseDetailsPage;
