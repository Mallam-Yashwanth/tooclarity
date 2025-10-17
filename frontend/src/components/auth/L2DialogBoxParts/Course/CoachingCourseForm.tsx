
"use client";

import InputField from "@/components/ui/InputField";
import SlidingIndicator from "@/components/ui/SlidingIndicator";
import { Course } from "../../L2DialogBox";

interface CoachingCourseFormProps {
  currentCourse: Course;
  handleCourseChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => void;
  setCourses: React.Dispatch<React.SetStateAction<Course[]>>;
  courses: Course[];
  selectedCourseId: number;
  // ✅ Add courseErrors prop to receive validation errors
  courseErrors?: Record<string, string>; 
  labelVariant?: 'course' | 'program';

}

export default function CoachingCourseForm({
  currentCourse,
  handleCourseChange,
  setCourses,
  courses,
  selectedCourseId,
  // ✅ Destructure courseErrors with a default empty object
  courseErrors = {},
  labelVariant = 'course',
}: CoachingCourseFormProps) {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <InputField
        label="Categories type"
        name="categoriesType"
        value={currentCourse.categoriesType}
        onChange={handleCourseChange}
        isSelect
        options={[
          "Academic",
          "Competitive Exam",
          "Professional",
          "Skill Development",
          "Language",
          "Arts & Crafts",
          "Sports",
          "Music & Dance",
        ]}
        placeholder="Select Categories type"
        required
        // ✅ Display validation error for this field
        error={courseErrors.categoriesType}
      />

      <InputField
        label="Domain type"
        name="domainType"
        value={currentCourse.domainType}
        onChange={handleCourseChange}
        isSelect
        options={[
          "Engineering",
          "Medical",
          "Management",
          "Law",
          "Banking",
          "Government Jobs",
          "IT & Software",
          "Design",
          "Marketing",
          "Finance",
        ]}
        placeholder="Select domain type"
        required
        // ✅ Display validation error for this field
        error={courseErrors.domainType}
      />

      <InputField
        label={labelVariant === 'program' ? 'Program name' : 'Course name'}
        name="courseName"
        value={currentCourse.courseName}
        onChange={handleCourseChange}
        placeholder={labelVariant === 'program' ? 'Enter program name' : 'Enter course name'}
        required
        // ✅ Display validation error for this field
        error={courseErrors.courseName}
      />

      <div className="flex flex-col gap-2 dark:bg-gray-50">
        <label className="font-medium text-[16px] ">Mode</label>
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
         {/* You can add a text element here for errors if SlidingIndicator doesn't support it */}
         {courseErrors.mode && <p className="text-sm text-red-500">{courseErrors.mode}</p>}
      </div>

      <InputField
        label={labelVariant === 'program' ? 'Program Duration' : 'Course Duration'}
        name="courseDuration"
        value={currentCourse.courseDuration}
        onChange={handleCourseChange}
        placeholder="e.g, 3 months"
        required
        // ✅ Display validation error for this field
        error={courseErrors.courseDuration}
      />

      <InputField
        label={labelVariant === 'program' ? "Program Start Date" : "Course Start Date"}
        name="startDate"
        value={currentCourse.startDate}
        onChange={handleCourseChange}
        type="date"
        error={courseErrors.startDate}
        required
      />

      <InputField
        label={labelVariant === 'program' ? "Program End Date" : "Course End Date"}
        name="endDate"
        value={currentCourse.endDate}
        onChange={handleCourseChange}
        type="date"
        error={courseErrors.endDate}
        required
      />

      <InputField
        label={labelVariant === 'program' ? 'Price of Program' : 'Price of Course'}
        name="priceOfCourse"
        value={currentCourse.priceOfCourse}
        onChange={handleCourseChange}
        placeholder={labelVariant === 'program' ? 'Enter Program price' : 'Enter Course price'}
        type="number"
        required
        // ✅ Display validation error for this field
        error={courseErrors.priceOfCourse}
      />

      <InputField
        label="Location"
        name="location"
        value={currentCourse.location}
        onChange={handleCourseChange}
        placeholder="Enter a valid URL (e.g., https://...)"
        required
        // ✅ Display validation error for this field
        error={courseErrors.location}
      />

      <InputField
        label="Class size"
        name="classSize"
        value={currentCourse.classSize}
        onChange={handleCourseChange}
        placeholder="Enter no of students per class"
        type="number"
        // ✅ Display validation error for this field
        error={courseErrors.classSize}
      />
    </div>
  );
}