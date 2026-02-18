"use client";

import React, { useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";



export interface ActiveFilters {
  instituteType?: string;
  kindergartenLevels?: string[];
  schoolLevels?: string[];
  modes?: string[];
  ageGroup?: string[];
  programDuration?: string[];
  priceRange?: string[];
  boardType?: string[];
  graduationType?: string[];
  streamType?: string[];
  educationType?: string[];
  classSize?: string[];
  seatingType?: string[];
  operatingHours?: string[];
  duration?: string[];
  subjects?: string[];
}



const INSTITUTE_TYPES = [
  "Kindergarten",
  "School's",
  "Intermediate",
  "Graduation",
  "Coaching",
  "Study Hall's",
  "Tuition Center's",
  "Study Abroad",
];

const FILTER_CONFIG: Record<
  string,
  {
    levels?: string[];
    boardType?: string[];
    programDuration?: string[];
    ageGroup?: string[];
    modes?: string[];
    priceRange?: string[];
    graduationType?: string[];
    streamType?: string[];
    educationType?: string[];
    classSize?: string[];
    seatingType?: string[];
    operatingHours?: string[];
    duration?: string[];
    subjects?: string[];
  }
> = {
  Kindergarten: {
    levels: ["Play School", "Lower kindergarten", "Upper kindergarten"],
    ageGroup: ["2 - 3 Yrs", "3 - 4 Yrs", "4 - 5 Yrs", "5 - 6 Yrs"],
    modes: ["Offline", "Online"],
    programDuration: [
      "Summer Camp",
      "Academic Year",
      "Half-Day Care",
      "Full-Day Care",
    ],
    priceRange: [
      "Below ₹75,000",
      "₹75,000 - ₹1,50,000",
      "₹1,50,000 - ₹3,00,000",
      "Above ₹3,00,000",
    ],
  },
  "School's": {
    levels: ["Primary", "Secondary", "Senior Secondary"],
    boardType: ["State Board", "CBSE"],
    programDuration: ["Academic Year", "Semester"],
    priceRange: [
      "Below ₹75,000",
      "₹75,000 - ₹1,50,000",
      "₹1,50,000 - ₹3,00,000",
      "Above ₹3,00,000",
    ],
  },
  Intermediate: {
    levels: ["Science", "Commerce", "Arts"],
    boardType: ["State Board", "CBSE"],
    programDuration: ["Academic Year", "Semester"],
    priceRange: [
      "Below ₹75,000",
      "₹75,000 - ₹1,50,000",
      "₹1,50,000 - ₹3,00,000",
      "Above ₹3,00,000",
    ],
  },
  Graduation: {
    graduationType: ["Under Graduation", "Post Graduation"],
    streamType: [
      "Engineering and Technology (B.E./B.Tech.)",
      "Medical Sciences",
      "Fine Arts (BFA)",
      "Arts and Humanities (B.A.)",
    ],
    educationType: ["Full time", "Part time", "Distance learning"],
    modes: ["Offline", "Online"],
    programDuration: ["2 Yrs", "3 Yrs", "4 Yrs"],
    priceRange: [
      "Below ₹75,000",
      "₹75,000 - ₹1,50,000",
      "₹1,50,000 - ₹3,00,000",
      "Above ₹3,00,000",
    ],
  },
  Coaching: {
    levels: [
      "Upskilling / Skill Development",
      "Exam Preparation",
      "Vocational Training",
    ],
    modes: ["Offline", "Online", "Hybrid"],
    programDuration: ["3 Months", "6 Months", "1 Year+"],
    classSize: ["Small Batch (<20)", "Medium Batch (20-50)", "Large Batch"],
    priceRange: [
      "Below ₹75,000",
      "₹75,000 - ₹1,50,000",
      "₹1,50,000 - ₹3,00,000",
      "Above ₹3,00,000",
    ],
  },
  "Study Hall's": {
    seatingType: ["Hot Desk", "Dedicated Desk", "Private Cabin / Cubicle"],
    priceRange: [
      "Below ₹2,000",
      "₹2,000 - ₹3,500",
      "₹3,500 - ₹5,000",
      "Above ₹5,000",
    ],
    operatingHours: [
      "24/7 Access",
      "Day Shift",
      "Night Shift",
      "Weekends Only",
    ],
    duration: ["Daily Pass", "Weekly Pass", "Monthly Plan", "Quarterly"],
  },
  "Tuition Center's": {
    subjects: [
      "All Subjects",
      "Languages",
      "English",
      "Mathematics",
      "Physics",
      "Chemistry",
      "Biology",
      "MPC / BiPC",
    ],
    modes: ["Online", "Home Tuition"],
    priceRange: [
      "Below ₹1,000",
      "₹1,000 - ₹2,500",
      "₹2,500 - ₹5,000",
      "Above ₹5,000",
    ],
    operatingHours: ["Morning", "Evening", "Weekdays", "Weekend tuition"],
    duration: ["Monthly", "Quarterly", "Full Academic Year"],
  },
  "Study Abroad": {
    modes: ["Offline", "Online"],
    priceRange: [
      "Below ₹75,000",
      "₹75,000 - ₹1,50,000",
      "₹1,50,000 - ₹3,00,000",
      "Above ₹3,00,000",
    ],
  },
};



interface FilterSectionProps {
  title: string;
  filterKey: string;
  options: string[];
  isSingle?: boolean;
  selectedValues: string[];
  onToggle: (key: string, value: string, checked: boolean) => void;
}

const FilterSection: React.FC<FilterSectionProps> = ({
  title,
  filterKey,
  options,
  isSingle = false,
  selectedValues,
  onToggle,
}) => {
  return (
    <div className="border-b border-gray-200 pb-3 mb-3">
      <h3 className="text-xs font-semibold text-gray-700 uppercase mb-2">
        {title}
      </h3>
      <div className="flex flex-wrap gap-1.5">
        {options.map(option => {
          const selected = selectedValues.includes(option);
          return (
            <button
              key={option}
              type="button"
              onClick={() => onToggle(filterKey, option, !selected)}
              className={`px-2 py-1 text-xs rounded border transition ${
                selected
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
};



const FilterSidebar: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const selectedInstituteType = searchParams.get("instituteType") || "";

  const getSelected = (key: string) =>
  searchParams.get(key)?.split("|") ?? [];



  const updateQueryParam = useCallback(
  (key: string, value: string, checked: boolean) => {
    const params = new URLSearchParams(searchParams.toString());

    if (key === "instituteType") {

      [
        "kindergartenLevels",
        "schoolLevels",
        "boardType",
        "programDuration",
        "ageGroup",
        "graduationType",
        "streamType",
        "educationType",
        "subjects",
        "seatingType",
        "operatingHours",
        "duration",
        "classSize",
        "modes",
        "priceRange",
      ].forEach(k => params.delete(k));

      params.set("instituteType", value);

      router.replace(`?${params.toString()}`);
      return; 
    }

    const existing = params.get(key)?.split("|") ?? [];

const updated = checked
  ? Array.from(new Set([...existing, value]))
  : existing.filter(v => v !== value);

if (updated.length) {
  params.set(key, updated.join("|"));
} else {
  params.delete(key);
}



    router.replace(`?${params.toString()}`);
  },
  [router, searchParams]
);


  const filterConfig = useMemo(
    () => FILTER_CONFIG[selectedInstituteType] ?? null,
    [selectedInstituteType]
  );

  

  return (
    <aside className="w-full lg:w-64 bg-white border border-gray-200 rounded-md p-3 text-sm">
      <FilterSection
        title="Institute Type"
        filterKey="instituteType"
        options={INSTITUTE_TYPES}
        isSingle
        selectedValues={selectedInstituteType ? [selectedInstituteType] : []}
        onToggle={updateQueryParam}
      />

     {/* Levels */}
      {filterConfig?.levels && (
        <FilterSection
          title={
            selectedInstituteType === "Kindergarten"
              ? "Kindergarten Levels"
              : selectedInstituteType === "School's"
              ? "School Levels"
              : "Levels"
          }
          filterKey={
            selectedInstituteType === "Kindergarten"
              ? "kindergartenLevels"
              : "schoolLevels"
          }
          options={filterConfig.levels}
          selectedValues={getSelected(
            selectedInstituteType === "Kindergarten"
              ? "kindergartenLevels"
              : "schoolLevels"
          )}
          onToggle={updateQueryParam}
        />
      )}

      {/* Mode */}
      {filterConfig?.modes && (
        <FilterSection
          title="Mode"
          filterKey="modes"
          options={filterConfig.modes}
          selectedValues={getSelected("modes")}
          onToggle={updateQueryParam}
        />
      )}

      {/* Board Type */}
      {filterConfig?.boardType && (
        <FilterSection
          title="Board Type"
          filterKey="boardType"
          options={filterConfig.boardType}
          selectedValues={getSelected("boardType")}
          onToggle={updateQueryParam}
        />
      )}

      {/* Graduation Type */}
      {filterConfig?.graduationType && (
        <FilterSection
          title="Graduation Type"
          filterKey="graduationType"
          options={filterConfig.graduationType}
          selectedValues={getSelected("graduationType")}
          onToggle={updateQueryParam}
        />
      )}

      {/* Stream Type */}
      {filterConfig?.streamType && (
        <FilterSection
          title="Stream Type"
          filterKey="streamType"
          options={filterConfig.streamType}
          selectedValues={getSelected("streamType")}
          onToggle={updateQueryParam}
        />
      )}

      {/* Education Type */}
      {filterConfig?.educationType && (
        <FilterSection
          title="Education Type"
          filterKey="educationType"
          options={filterConfig.educationType}
          selectedValues={getSelected("educationType")}
          onToggle={updateQueryParam}
        />
      )}

      {/* Program Duration */}
      {filterConfig?.programDuration && (
        <FilterSection
          title="Program Duration"
          filterKey="programDuration"
          options={filterConfig.programDuration}
          selectedValues={getSelected("programDuration")}
          onToggle={updateQueryParam}
        />
      )}

      {/* Age Group */}
      {filterConfig?.ageGroup && (
        <FilterSection
          title="Age Group"
          filterKey="ageGroup"
          options={filterConfig.ageGroup}
          selectedValues={getSelected("ageGroup")}
          onToggle={updateQueryParam}
        />
      )}

      {/* Seating Type */}
      {filterConfig?.seatingType && (
        <FilterSection
          title="Seating Type"
          filterKey="seatingType"
          options={filterConfig.seatingType}
          selectedValues={getSelected("seatingType")}
          onToggle={updateQueryParam}
        />
      )}

      {/* Operating Hours */}
      {filterConfig?.operatingHours && (
        <FilterSection
          title="Operating Hours"
          filterKey="operatingHours"
          options={filterConfig.operatingHours}
          selectedValues={getSelected("operatingHours")}
          onToggle={updateQueryParam}
        />
      )}

      {/* Duration */}
      {filterConfig?.duration && (
        <FilterSection
          title="Duration"
          filterKey="duration"
          options={filterConfig.duration}
          selectedValues={getSelected("duration")}
          onToggle={updateQueryParam}
        />
      )}

      {/* Subjects */}
      {filterConfig?.subjects && (
        <FilterSection
          title="Subjects"
          filterKey="subjects"
          options={filterConfig.subjects}
          selectedValues={getSelected("subjects")}
          onToggle={updateQueryParam}
        />
      )}

      {/* Price Range */}
      {filterConfig?.priceRange && (
        <FilterSection
          title="Price Range"
          filterKey="priceRange"
          options={filterConfig.priceRange}
          selectedValues={getSelected("priceRange")}
          onToggle={updateQueryParam}
        />
      )}

    </aside>
  );
};

export default FilterSidebar;