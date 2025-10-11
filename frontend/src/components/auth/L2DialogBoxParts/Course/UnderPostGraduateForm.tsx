"use client";

import InputField from "@/components/ui/InputField";
import SlidingIndicator from "@/components/ui/SlidingIndicator";
import type { Course } from "../../L2DialogBox";

interface UnderPostGraduateFormProps {
  currentCourse: Course;
  handleCourseChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => void;
  setCourses: React.Dispatch<React.SetStateAction<Course[]>>;
  courses: Course[];
  selectedCourseId: number;
  courseErrors: Record<string, string>; 
  labelVariant?: 'course' | 'program';
}

export default function UnderPostGraduateForm({
  currentCourse,
  handleCourseChange,
  setCourses,
  courses,
  selectedCourseId,
  courseErrors,
  labelVariant = 'course', 
}: UnderPostGraduateFormProps) {
  const isProgram = labelVariant === 'program';
  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Row 1 */}
      <InputField
        label="Graduation type"
        name="graduationType"
        value={currentCourse.graduationType}
        onChange={handleCourseChange}
        isSelect
        // ✅ Options updated from your image
        options={["Under Graduation", "Post Graduation"]}
        placeholder="Select graduation type"
        required
        error={courseErrors.graduationType}
      />

      <InputField
        label="Stream type"
        name="streamType"
        value={currentCourse.streamType}
        onChange={handleCourseChange}
        isSelect
        // ✅ Options updated from your image
        options={[
          "Engineering and Technology (B.E./B.Tech.)",
          "Medical Sciences",
          "Arts and Humanities (B.A.)",
          "Science (B.Sc.)",
          "Commerce (B.Com.)",
          "Business Administration (BBA)",
          "Computer Applications (BCA)",
          "Fine Arts (BFA)",
          "Law (LL.B./Integrated Law Courses)",
        ]}
        placeholder="Select Stream type"
        required
        error={courseErrors.streamType}
      />

      {/* Row 2 */}
      <InputField
        label="Select branch"
        name="selectBranch"
        value={currentCourse.selectBranch}
        onChange={handleCourseChange}
        isSelect
        // ✅ Options updated from your images
        options={[
            "Computer Science and Engineering",
            "Electronics and Communication Engineering",
            "Electrical Engineering",
            "Mechanical Engineering",
            "Civil Engineering",
            "Chemical Engineering",
            "Aerospace Engineering",
            "Biotechnology Engineering",
            "Information Technology",
            "Marine Engineering",
            "Mining Engineering",
            "Metallurgical Engineering",
            "Agricultural Engineering",
        ]}
        placeholder="Select branch type"
        required
        error={courseErrors.selectBranch}
      />

      <InputField
        label="About branch"
        name="aboutBranch"
        value={currentCourse.aboutBranch}
        onChange={handleCourseChange}
        placeholder="Enter the course info"
        required
        error={courseErrors.aboutBranch}
      />

      {/* Row 3 */}
      <div className="flex flex-col gap-2">
        <label className="font-medium text-[16px]">Education type</label>
        <SlidingIndicator
          options={["Full time", "part time", "Distance"] as const}
          activeOption={currentCourse.educationType}
          onOptionChange={(educationType) =>
            setCourses(
              courses.map((course) =>
                course.id === selectedCourseId ? { ...course, educationType } : course
              )
            )
          }
          size="md"
        />
        {courseErrors.educationType && <p className="text-red-500 text-xs mt-1">{courseErrors.educationType}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <label className="font-medium text-[16px]">Mode</label>
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
        {courseErrors.mode && <p className="text-red-500 text-xs mt-1">{courseErrors.mode}</p>}
      </div>

      {/* Row 4 */}
      <InputField
        label={isProgram ? "Program Duration" : "Course Duration"}
        name="courseDuration"
        value={currentCourse.courseDuration}
        onChange={handleCourseChange}
        placeholder="e.g, 3 months"
        required
        error={courseErrors.courseDuration}
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

      {/* Row 5 */}
      <InputField
        label={isProgram ? "Program End Date" : "Course End Date"}
        name="endDate"
        value={currentCourse.endDate}
        onChange={handleCourseChange}
        type="date"
        error={courseErrors.endDate}
        required
      />

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
      
      {/* Row 6 */}
      <InputField
        label="Class size"
        name="classSize"
        value={currentCourse.classSize}
        onChange={handleCourseChange}
        placeholder="Enter no of students per class"
        type="number"
        required
        error={courseErrors.classSize}
      />

      <InputField
        label="Eligibility Criteria"
        name="eligibilityCriteria"
        value={currentCourse.eligibilityCriteria}
        onChange={handleCourseChange}
        placeholder="e.g., Must have completed 10th Grade"
        required
        error={courseErrors.eligibilityCriteria}
      />
    </div>
  );
}