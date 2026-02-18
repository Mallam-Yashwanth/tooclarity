"use client";

import React from "react";
import { Course } from "../../L2DialogBox";
import ExamPrepCourseForm from "./ExamPrepCourseForm";
import UpskillingCourseForm from "./UpskillingCourseForm";

interface CoachingCourseFormProps {
  currentCourse: Course;
  handleCourseChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => void;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>, type: "image" | "brochure" | "centerImage") => void;
  setCourses: React.Dispatch<React.SetStateAction<Course[]>>;
  courses: Course[];
  selectedCourseId: number;
  setSelectedCourseId: (id: number) => void;
  addNewCourse: () => void;
  deleteCourse: (id: number) => void;
  courseErrors?: Record<string, string>;
  labelVariant?: 'course' | 'program';
  uniqueRemoteBranches?: Array<{ _id: string; branchName: string; branchAddress?: string; locationUrl?: string }>;
  selectedBranchId?: string;
  isSubscriptionProgram?: boolean;
  fixedCategory?: "Exam Preparation" | "Upskilling";
}

/**
 * CoachingCourseForm — legacy wrapper for "Coaching centers" institution type.
 * Renders either ExamPrepCourseForm or UpskillingCourseForm based on the
 * course category. Defaults to ExamPrepCourseForm since "Coaching centers"
 * maps to EXAM_PREP on the backend.
 */
export default function CoachingCourseForm({
  currentCourse,
  handleCourseChange,
  setCourses,
  courses,
  selectedCourseId,
  setSelectedCourseId,
  addNewCourse,
  deleteCourse,
  courseErrors = {},
  labelVariant = 'course',
  handleFileChange,
  uniqueRemoteBranches = [],
  selectedBranchId,
  isSubscriptionProgram = true,
  fixedCategory
}: CoachingCourseFormProps) {

  // If category is "Upskilling", render Upskilling form
  if (currentCourse.categoriesType === "Upskilling") {
    return (
      <UpskillingCourseForm
        currentCourse={currentCourse}
        handleCourseChange={handleCourseChange}
        handleFileChange={handleFileChange}
        setCourses={setCourses}
        courses={courses}
        selectedCourseId={selectedCourseId}
        setSelectedCourseId={setSelectedCourseId}
        addNewCourse={addNewCourse}
        deleteCourse={deleteCourse}
        courseErrors={courseErrors}
        labelVariant={labelVariant}
        uniqueRemoteBranches={uniqueRemoteBranches}
        selectedBranchId={selectedBranchId}
        isSubscriptionProgram={isSubscriptionProgram}
      />
    );
  }

  // Default: Exam Preparation (since Coaching centers → EXAM_PREP on backend)
  return (
    <ExamPrepCourseForm
      currentCourse={currentCourse}
      handleCourseChange={handleCourseChange}
      handleFileChange={handleFileChange}
      setCourses={setCourses}
      courses={courses}
      selectedCourseId={selectedCourseId}
      setSelectedCourseId={setSelectedCourseId}
      addNewCourse={addNewCourse}
      deleteCourse={deleteCourse}
      courseErrors={courseErrors}
      labelVariant={labelVariant}
      uniqueRemoteBranches={uniqueRemoteBranches}
      selectedBranchId={selectedBranchId}
      isSubscriptionProgram={isSubscriptionProgram}
    />
  );
}