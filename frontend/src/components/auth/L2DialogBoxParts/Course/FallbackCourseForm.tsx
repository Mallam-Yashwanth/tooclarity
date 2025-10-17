
"use client";

import InputField from "@/components/ui/InputField";
import SlidingIndicator from "@/components/ui/SlidingIndicator";
import type { Course } from "../../L2DialogBox";



interface FallbackCourseFormProps {
  currentCourse: Course;
  handleCourseChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => void;
  setCourses: React.Dispatch<React.SetStateAction<Course[]>>;
  courses: Course[];
  selectedCourseId: number;
  labelVariant?: 'course' | 'program';
  courseErrors?: Record<string, string>;
}

export default function FallbackCourseForm({
  currentCourse,
  handleCourseChange,
  setCourses,
  courses,
  selectedCourseId,
  labelVariant = 'course',
  courseErrors = {},
}: FallbackCourseFormProps) {
  const isProgram = labelVariant === 'program';
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <InputField
        label={isProgram ? "Program Name" : "Course Name"}
        name="courseName"
        value={currentCourse.courseName}
        onChange={handleCourseChange}
        placeholder={isProgram ? "Enter Program name" : "Enter Course name"}
        required
        error={courseErrors.courseName}
      />

      <InputField
        label={isProgram ? "About Program" : "About Course"}
        name="aboutCourse"
        value={currentCourse.aboutCourse}
        onChange={handleCourseChange}
        placeholder={isProgram ? "Enter the program info" : "Enter the course info"}
        required
        error={courseErrors.aboutCourse}
      />

      <InputField
        label={isProgram ? "Program Duration" : "Course Duration"}
        name="courseDuration"
        value={currentCourse.courseDuration}
        onChange={handleCourseChange}
        placeholder="e.g, 3 months"
        required
        error={courseErrors.courseDuration}
      />

      <div className="flex flex-col gap-2">
        <label className="font-medium text-[16px] dark:text-gray-400">Mode</label>
        <SlidingIndicator
          options={["Offline", "Online", "Hybrid"] as const}
          activeOption={currentCourse.mode}
          onOptionChange={(mode) =>
            setCourses(
              courses.map((course) =>
                course.id === selectedCourseId ? { ...course, mode } : course
              )
            )
          }
          size="md"
        />
      </div>

      <InputField
        label={isProgram ? "Price of Program" : "Price of Course"}
        name="priceOfCourse"
        value={currentCourse.priceOfCourse}
        onChange={handleCourseChange}
        placeholder={isProgram ? "Enter Program price" : "Enter Course price"}
        type="number"
        required
        error={courseErrors.priceOfCourse}
      />

      <InputField
        label={isProgram ? "Location" : "Location"}
        name="location"
        value={currentCourse.location}
        onChange={handleCourseChange}
        placeholder="Enter Place name"
        required
        error={courseErrors.location}
      />

      {/* Date Fields */}
      <InputField
        label={isProgram ? "Program Start Date" : "Course Start Date"}
        name="startDate"
        value={currentCourse.startDate}
        onChange={handleCourseChange}
        type="date"
        error={courseErrors.startDate}
        required
      />

      <InputField
        label={isProgram ? "Program End Date" : "Course End Date"}
        name="endDate"
        value={currentCourse.endDate}
        onChange={handleCourseChange}
        type="date"
        error={courseErrors.endDate}
        required
      />
    </div>
  );
}
