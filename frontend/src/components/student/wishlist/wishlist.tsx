"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Bell } from "lucide-react";

import CourseCard, { Course } from "@/components/student/home/CourseCard";
import { DashboardCourse, studentWishlistApi, studentDashboardAPI } from "@/lib/students-api";

interface WishlistProps {
  courses: DashboardCourse[];
}



const Wishlist: React.FC<WishlistProps> = ({ courses }) => {
  const router = useRouter();
  const [wishlist, setWishlist] = useState<DashboardCourse[]>(courses);
  const [loading, setLoading] = useState(true);

  const [profile, setProfile] = useState<{
  name: string;
  profilePicture?: string;
} | null>(null);

const getInitials = (name: string) => {
  if (!name) return "";
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
};


  // Fetch wishlist on load
  useEffect(() => {
    const fetchWishlist = async () => {
      try {
        const res = await studentWishlistApi.getWishlist();
        if (res.success && Array.isArray(res.data)) {
          setWishlist(res.data);
        }
      } catch (err) {
        console.error("Failed to load wishlist", err);
      } finally {
        setLoading(false);
      }
    };

    fetchWishlist();
  }, []);


  useEffect(() => {
  const fetchProfile = async () => {
    try {
      const res = await studentDashboardAPI.getProfile();
      if (res.success && res.data) {
        setProfile({
          name: res.data.name,
          profilePicture: res.data.profilePicture,
        });
      }
    } catch (error) {
      console.error("Failed to fetch profile", error);
    }
  };

  fetchProfile();
  }, []);


  

  // Remove from UI after wishlist toggle
  const handleWishlistToggle = (courseId: string) => {
    setWishlist((prev) => prev.filter((c) => c._id !== courseId));
  };

  const handleViewDetails = (courseId: string) => {
    router.push(`/dashboard/${courseId}`);
  };

  const handleBack = () => {
    router.push("/dashboard");
  };

  

  return (
    <div className="min-h-screen bg-gray-50">
      {/*top navbar */}
      <header className="flex items-center justify-between bg-[#0222d7] px-8 py-6">
        {/* Left */}
        <div onClick={() => router.push("/dashboard")} className="flex items-center gap-2 text-white ">
            <img
              src="/TCNewLogo.jpg"   
              alt="TooClarity Logo"
              className="h-12 w-12 object-contain"
            />
            <span  className="text-3xl font-bold font-maven">
              TooClarity
            </span>
          
        </div>

      {/* Right */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.push("/student/notifications")} className="flex h-10 w-10 items-center justify-center rounded-full bg-white">
          <Bell className="h-5 w-5 text-[#0222d7]" />
        </button>

        <button
          onClick={() => router.push("/student/profile")}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white overflow-hidden"
          aria-label="Open profile"
        >
          {profile?.profilePicture ? (
            <Image
              src={profile.profilePicture}
              alt={profile.name}
              width={40}
              height={40}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-sm font-semibold text-[#0222d7]">
              {profile?.name ? getInitials(profile.name) : ""}
            </span>
          )}
        </button>
      </div>


        
      </header>

      {/* 🔹 Page Content */}
      <main className="px-4 py-10">
        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-20 text-gray-600">
            Loading wishlist...
          </div>
        )}

        {/* Empty State */}
        {!loading && wishlist.length === 0 && (
          <div className="flex justify-center">
            <div className="w-full max-w-4xl rounded-2xl bg-white p-10 text-center border shadow-sm">
              <div className="mx-auto mb-6 flex justify-center items-center">
                <img
                  src="/wishlisticon.png"   
                  className="h-40 w-50 object-contain"
                />
                  
                
              </div>

              <h2 className="mb-2 text-2xl font-semibold">
                Your Wishlist is empty ?
              </h2>
              <p className="mx-auto mb-6 max-w-md text-gray-600">
                Start exploring and click the icon to add courses you'd like to
                revisit later.
              </p>

              <button
                onClick={() => router.push("/dashboard")}
                className="rounded-full bg-[#0222d7] px-11 py-1 text-white font-medium hover:bg-blue-700 transition"
              >
                Browse Courses Now
              </button>
            </div>
          </div>
        )}

        {/* Courses Grid */}
        {!loading && wishlist.length > 0 && (
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {wishlist.map((course) => {
              const mappedCourse: Course = {
                id: course._id,
                title: course.courseName || course.selectBranch || "",
                institution: "",
                rating: 0,
                reviews: 0,
                students: 0,
                price: course.priceOfCourse || 0,
                level: "",
                mode: "",
                iswishlisted: course.isWishlisted || false,
                imageUrl: course.imageUrl || "",
                brandLogo: course.institutionDetails?.logoUrl || "",
                location: course.institutionDetails?.locationURL || "",
                description: "Quality education program",
                duration: course.courseDuration || "1 year",
              };

              return (
                <CourseCard
                  key={course._id}
                  course={mappedCourse}
                  onWishlistToggle={handleWishlistToggle}
                  onViewDetails={handleViewDetails}
                />
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default Wishlist;
