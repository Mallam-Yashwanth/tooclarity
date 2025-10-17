
"use client";

import InputField from "@/components/ui/InputField";
import SlidingIndicator from "@/components/ui/SlidingIndicator";
import type { Course } from "../../L2DialogBox";

interface BasicCourseFormProps {
  currentCourse: Course;
  handleCourseChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => void;
  setCourses: React.Dispatch<React.SetStateAction<Course[]>>;
  courses: Course[];
  selectedCourseId: number;
  // ✅ 1. Accept an error object for the current course
  courseErrors: Record<string, string>; 
  // Optional: switch labels to Program wording
  labelVariant?: 'course' | 'program';
}

export default function BasicCourseForm({
  currentCourse,
  handleCourseChange,
  setCourses,
  courses,
  selectedCourseId,
  courseErrors = {}, // ✅ 2. Destructure with a default value
  labelVariant = 'course',
}: BasicCourseFormProps) {
  const isProgram = labelVariant === 'program';
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <InputField
        label={isProgram ? "Program Name" : "Course Name"}
        name="courseName"
        value={currentCourse.courseName}
        onChange={handleCourseChange}
        placeholder={isProgram ? "Enter Program name" : "Enter Course name"}
        error={courseErrors.courseName} // ✅ 3. Display the error
        required
      />

      <InputField
        label={isProgram ? "About Program" : "About Course"}
        name="aboutCourse"
        value={currentCourse.aboutCourse}
        onChange={handleCourseChange}
        placeholder={isProgram ? "Enter the program info" : "Enter the course info"}
        error={courseErrors.aboutCourse} // ✅ 3. Display the error
        required
      />

      <InputField
        label={isProgram ? "Program Duration" : "Course Duration"}
        name="courseDuration"
        value={currentCourse.courseDuration}
        onChange={handleCourseChange}
        placeholder="e.g, 3 months"
        error={courseErrors.courseDuration} // ✅ 3. Display the error
        required
      />

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

      <div className="flex flex-col gap-2 dark:bg-gray-50">
        <label className="font-medium text-[16px] dark:text-gray-50">Mode</label>
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
        {/* ✅ 4. Conditionally render the error message for the slider */}
        {courseErrors.mode && (
          <p className="text-sm text-red-600 mt-1">{courseErrors.mode}</p>
        )}
      </div>

      <InputField
        label={isProgram ? "Price of Program" : "Price of Course"}
        name="priceOfCourse"
        value={currentCourse.priceOfCourse}
        onChange={handleCourseChange}
        placeholder={isProgram ? "Enter Program price" : "Enter Course price"}
        type="number"
        error={courseErrors.priceOfCourse} // ✅ 3. Display the error
        required
      />

      <InputField
        label="Location"
        name="location"
        value={currentCourse.location}
        onChange={handleCourseChange}
        placeholder="Enter Place name"
        error={courseErrors.location} // ✅ 3. Display the error
        required
      />
    </div>
  );
}
