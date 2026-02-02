"use client";

import React, { useState } from "react";
import Image from "next/image";
import { studentWishlistApi } from "@/lib/students-api";
import { useUserStore } from "@/lib/user-store";

export interface Course {
  id: string;
  title: string;
  institution: string;
  rating?: number;
  reviews?: number;
  students: number;
  price: number;
  level?: string;
  mode?: string;
  iswishlisted?: boolean;
  imageUrl?: string;
  location?: string;
  description?: string;
  duration?: string;
  brandLogo?: string;
}

interface CourseCardProps {
  course: Course;
  onWishlistToggle: (courseId: string) => void;
  onViewDetails?: (courseId: string) => void;
}

export const CourseCard: React.FC<CourseCardProps> = ({
  course,
  onWishlistToggle,
  onViewDetails,
}) => {

  const [isWishlisted, setIsWishlisted] = useState(!!course.iswishlisted);
  const [loading, setLoading] = useState(false);
  const { updateUser, user } = useUserStore();

  const handleWishlistClick = async () => {
    if (loading) return;
    setLoading(true);

    const newState = !isWishlisted;
    setIsWishlisted(newState);

    try {
      const res = await studentWishlistApi.toggleWishlist(course.id, newState);

      if (!res.success) {
        setIsWishlisted(!newState);
      } else {
        onWishlistToggle(course.id);

        if (user?.wishlistCount !== undefined) {
          const countChange = newState ? 1 : -1;
          updateUser({ wishlistCount: user.wishlistCount + countChange });
        }
      }
    } catch {
      setIsWishlisted(!newState);
    }

    setLoading(false);
  };

  const handleViewMore = () => {
    onViewDetails?.(course.id);
  };

  return (
    <div className="w-full max-w-[300px] rounded-sm overflow-hidden border bg-white shadow-sm hover:shadow-md transition">
      {/*image section*/}
      <div className="relative bg-blue-100 h-40 md:h-[120px] lg:h-[150px] flex items-center justify-center">
        <Image
          src={
            course.imageUrl ||
            "https://res.cloudinary.com/daq0xtstq/image/upload/v1759253728/Gemini_Generated_Image_82dkbt82dkbt82dk_chvp3e.png"
          }
          alt={course.title}
          fill
          className="object-contain"
        />

        {/* Wishlist Button */}
        <button
          onClick={handleWishlistClick}
          disabled={loading}
          aria-label="wishlist"
          className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center 
            bg-white shadow ${
              isWishlisted ? "text-red-500" : "text-gray-500"
            }`}
        >
          <svg
            viewBox="0 0 24 24"
            fill={isWishlisted ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="2"
            className="w-4 h-4"
          >
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
        </button>
      </div>

      {/* content */}
      <div className="p-4 space-y-1 bg-gray-200">
        {/* institution */}
        <div className="flex items-center gap-2">
          <Image
            src={
              course.brandLogo ||
              "https://res.cloudinary.com/daq0xtstq/image/upload/v1759253728/Gemini_Generated_Image_82dkbt82dkbt82dk_chvp3e.png"
            }
            alt={course.institution}
            width={20}
            height={20}
            className="rounded"
          />
          <p className="text-sm font-semibold text-gray-800">
            {course.institution}
          </p>
        </div>

        {/* title */}
        <p className="text-sm text-gray-600">{course.description || course.title}</p>

        {/* fee + Button */}
        <div className="flex items-center justify-between">
          <p className="text-base font-semibold text-gray-900">
            ₹ {(course.price / 100000).toFixed(2)} L
          </p>

          <button
            onClick={handleViewMore}
            className="px-6 py-1.5 text-sm border border-blue-500 text-blue-600 rounded-md hover:bg-blue-50 transition"
          >
            View More
          </button>
        </div>
      </div>
    </div>
  );
};

export default CourseCard;
