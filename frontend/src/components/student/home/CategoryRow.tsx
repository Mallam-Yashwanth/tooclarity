"use client";

import Image from "next/image";
import React from "react";

interface Category {
  key: string;
  label: string;
  icon: string;
}

interface CategoryRowProps {
  activeCategory: string | null;
  onCategorySelect: (categoryKey: string) => void;
}

const categories: Category[] = [
  { key: "Kindergarten", label: "Kindergarten", icon: "/CRKindergarten.png" },
  { key: "School", label: "School", icon: "/CRSchool.png" },
  { key: "Intermediate", label: "Intermediate", icon: "/CRIntermediate.png" },
  { key: "Graduation", label: "Graduation", icon: "/CRGraduation.png" },
  { key: "Upskilling", label: "Upskilling", icon: "/CRUpskilling.png" },
  { key: "Exam Preparation", label: "Exam Preparation", icon: "/CRExamPreparation.png" },
  { key: "Tuition Center", label: "Tuition Center", icon: "/CRTutionCentre.png" },
  { key: "Study Abroad", label: "Study Abroad", icon: "/CRStudyAbroad.png" },
];

const CategoryRow: React.FC<CategoryRowProps> = ({
  activeCategory,
  onCategorySelect,
}) => {
  return (
    <div className="w-full bg-white">
      <div className="max-w-8xl mx-auto px-3 py-5">
        {/* GRID LAYOUT */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-4">
          {categories.map((cat) => {
            const isActive = activeCategory === cat.key;

            return (
              <button
                key={cat.key}
                onClick={() => onCategorySelect(cat.key)}
                className={`
                  relative flex flex-col items-center justify-center
                  rounded-xl border bg-white
                  px-3 py-3
                  transition-all
                  hover:shadow-md
                  ${isActive ? "border-blue-600" : "border-gray-200"}
                `}
              >
                {/* ICON */}
                <div className="w-16 h-16 flex items-center justify-center mb-3">
                  <Image
                    src={cat.icon}
                    alt={cat.label}
                    width={48}
                    height={48}
                  />
                </div>

                {/* LABEL */}
                <span className="text-sm font-medium text-blue-600 text-center">
                  {cat.label}
                </span>

                {/* ACTIVE INDICATOR */}
                {isActive && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-[3px] bg-blue-600 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CategoryRow;
