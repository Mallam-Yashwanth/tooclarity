"use client";

import React, { useMemo } from "react";
import SearchableSelect from "@/components/ui/SearchableSelect";
import type { Course } from "../../../L2DialogBox";
import { STATE_DISTRICT_MAP, STATE_OPTIONS } from "@/constants/stateDistricts";

interface StateDistrictFieldsProps {
  currentCourse: Course;
  handleCourseChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => void;
  courseErrors: Record<string, string>;
}

const StateDistrictFields: React.FC<StateDistrictFieldsProps> = ({
  currentCourse,
  handleCourseChange,
  courseErrors,
}) => {
  const districtOptions = useMemo(() => {
    if (!currentCourse.state) return [];
    return STATE_DISTRICT_MAP[currentCourse.state] || [];
  }, [currentCourse.state]);

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <SearchableSelect
        label="State"
        name="state"
        value={currentCourse.state || ""}
        onChange={handleCourseChange as React.ChangeEventHandler<HTMLSelectElement>}
        options={STATE_OPTIONS}
        placeholder="Select state"
        required
        error={courseErrors.state}
      />

      <SearchableSelect
        label="District"
        name="district"
        value={currentCourse.district || ""}
        onChange={handleCourseChange as React.ChangeEventHandler<HTMLSelectElement>}
        options={districtOptions}
        placeholder={
          currentCourse.state ? "Select district" : "Select state first"
        }
        required
        disabled={!currentCourse.state}
        error={courseErrors.district}
      />
    </div>
  );
};

export default StateDistrictFields;

