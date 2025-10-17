"use client";

// Assuming you have these icons installed from lucide-react
import { Upload, User, Book, Building, Clock, IndianRupee } from "lucide-react";
import type { Course } from "../../L2DialogBox";
// InputField is no longer used for this specific form, but kept in case other forms need it
import InputField from "@/components/ui/InputField";
import { Dispatch, SetStateAction } from "react";


interface TuitionCenterFormProps {
  currentCourse: Course;
  handleCourseChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => void;
  handleOperationalDayChange: (day: string) => void;
  handleFileChange: (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "image" | "brochure"
  ) => void;
  courseErrors: Record<string, string>;
  // ✅ ADD THESE MISSING PROPS BACK
  setCourses: Dispatch<SetStateAction<Course[]>>;
  courses: Course[];
  selectedCourseId: number;
  labelVariant?: 'course' | 'program';
}

// A helper component for inputs with icons to keep the code clean
const IconInput = ({ icon, children }: { icon: React.ReactNode, children: React.ReactNode }) => (
  <div className="relative flex items-center">
    <span className="absolute left-3 text-gray-400">{icon}</span>
    {children}
  </div>
);




export default function TuitionCenterForm({
  currentCourse,
  handleCourseChange,
  handleOperationalDayChange,
  handleFileChange,
  courseErrors = {},
  labelVariant = 'course',
}: TuitionCenterFormProps) {
  const isProgram = labelVariant === 'program';
  return (
    <div className="grid md:grid-cols-2 gap-6">
      
      {/* ✅ MODIFICATION: Replaced InputField with a styled <select> for consistent width */}
     {/* Wrapper for the custom styled dropdown */}
      <InputField
  label="Tuition type"
  name="tuitionType"
  value={currentCourse.tuitionType}
  onChange={handleCourseChange}
  isSelect
  options={["Home Tuition", "Center Tuition"]}
  placeholder="Select tuition type"
  required
  error={courseErrors.tuitionType}
/>


      {/* Instructor Profile with Icon */}
      <div className="flex flex-col gap-2">
        <label className="font-medium text-[16px]">Instructor Profile<span className="text-red-500 ml-1">*</span></label>
        <IconInput icon={<User size={18} />}>
            <input
                name="instructorProfile"
                value={currentCourse.instructorProfile}
                onChange={handleCourseChange}
                placeholder="Instructor name"
                className={`w-full pl-10 pr-3 py-2 border rounded-lg bg-white text-sm ${
                    courseErrors.instructorProfile ? "border-red-500" : "border-gray-300"
                }`}
            />
        </IconInput>
        {courseErrors.instructorProfile && <p className="text-sm text-red-600 mt-1">{courseErrors.instructorProfile}</p>}
      </div>

      {/* Subject with Icon */}
       <div className="flex flex-col gap-2">
        <label className="font-medium text-[16px]">Subject<span className="text-red-500 ml-1">*</span></label>
        <IconInput icon={<Book size={18} />}>
             <input
                name="subject"
                value={currentCourse.subject}
                onChange={handleCourseChange}
                placeholder="Enter subject name"
                className={`w-full pl-10 pr-3 py-2 border rounded-lg bg-white text-sm ${
                    courseErrors.subject ? "border-red-500" : "border-gray-300"
                }`}
            />
        </IconInput>
        {courseErrors.subject && <p className="text-sm text-red-600 mt-1">{courseErrors.subject}</p>}
      </div>

      {/* Total Seats */}
      <div className="flex flex-col gap-2">
        <label className="font-medium text-[16px]">Total Seats<span className="text-red-500 ml-1">*</span></label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <IconInput icon={<Building size={18} />}>
                <input
                    type="number"
                    name="totalSeats"
                    value={currentCourse.totalSeats}
                    onChange={handleCourseChange}
                    placeholder="Total seats"
                    className={`w-full pl-10 pr-3 py-2 border rounded-lg bg-white text-sm ${
                        courseErrors.totalSeats ? "border-red-500" : "border-gray-300"
                    }`}
                />
            </IconInput>
            {courseErrors.totalSeats && <p className="text-sm text-red-600 mt-1">{courseErrors.totalSeats}</p>}
          </div>
          <div>
            <IconInput icon={<Building size={18} />}>
                 <input
                    type="number"
                    name="availableSeats"
                    value={currentCourse.availableSeats}
                    onChange={handleCourseChange}
                    placeholder="Available seats"
                    className={`w-full pl-10 pr-3 py-2 border rounded-lg bg-white text-sm ${
                        courseErrors.availableSeats ? "border-red-500" : "border-gray-300"
                    }`}
                />
            </IconInput>
            {courseErrors.availableSeats && <p className="text-sm text-red-600 mt-1">{courseErrors.availableSeats}</p>}
          </div>
        </div>
      </div>

      {/* Operational Days */}
      <div className="flex flex-col gap-2">
        <label className="font-medium text-[16px]">Operational Day's<span className="text-red-500 ml-1">*</span></label>
        <div className="flex flex-wrap gap-2">
          {["Mon", "Tues", "Wed", "Thur", "Fri", "Sat"].map((day) => (
            <button
              key={day}
              type="button"
              onClick={() => handleOperationalDayChange(day)}
              className={`px-3 py-2 rounded-lg text-sm border transition-colors ${
                currentCourse.operationalDays.includes(day)
                  ? "bg-blue-50 border-blue-200 text-blue-700"
                  : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
              }`}
            >
              {day}
            </button>
          ))}
        </div>
        {courseErrors.operationalDays && <p className="text-sm text-red-600 mt-1">{courseErrors.operationalDays}</p>}
      </div>

      {/* Date Fields */}
      <div className="grid grid-cols-2 gap-6">
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
      </div>

      {/* Operational Times */}
      <div className="flex flex-col gap-2">
        <label className="font-medium text-[16px]">Operational Time's<span className="text-red-500 ml-1">*</span></label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <IconInput icon={<Clock size={18} />}>
                <input
                    type="time"
                    name="openingTime"
                    placeholder="From"
                    value={currentCourse.openingTime}
                    onChange={handleCourseChange}
                    className={`w-full pl-10 pr-3 py-2 border rounded-lg bg-white text-sm ${
                        courseErrors.openingTime ? "border-red-500" : "border-gray-300"
                    }`}
                />
            </IconInput>
            {courseErrors.openingTime && <p className="text-sm text-red-600 mt-1">{courseErrors.openingTime}</p>}
          </div>
          <div>
            <IconInput icon={<Clock size={18} />}>
                 <input
                    type="time"
                    name="closingTime"
                    placeholder="To"
                    value={currentCourse.closingTime}
                    onChange={handleCourseChange}
                    className={`w-full pl-10 pr-3 py-2 border rounded-lg bg-white text-sm ${
                        courseErrors.closingTime ? "border-red-500" : "border-gray-300"
                    }`}
                />
            </IconInput>
            {courseErrors.closingTime && <p className="text-sm text-red-600 mt-1">{courseErrors.closingTime}</p>}
          </div>
        </div>
      </div>

      {/* Price of the Seat with Rupee Icon */}
      <div className="flex flex-col gap-2">
        <label className="font-medium text-[16px]">Price of the Seat<span className="text-red-500 ml-1">*</span></label>
        <IconInput icon={<IndianRupee size={18} />}>
            <input
                type="number"
                name="pricePerSeat"
                value={currentCourse.pricePerSeat}
                onChange={handleCourseChange}
                placeholder="Enter price per seat"
                className={`w-full pl-10 pr-3 py-2 border rounded-lg bg-white text-sm ${
                    courseErrors.pricePerSeat ? "border-red-500" : "border-gray-300"
                }`}
            />
        </IconInput>
        {courseErrors.pricePerSeat && <p className="text-sm text-red-600 mt-1">{courseErrors.pricePerSeat}</p>}
      </div>

      {/* Upload Image */}
      <div className="flex flex-col gap-2">
        <label className="font-medium text-[16px] dark:text-gray-700">{isProgram ? 'Add Program Image' : 'Add Image'}<span className="text-red-500 ml-1">*</span></label>
        <label
          className={`w-full h-[120px] rounded-[12px] border-2 border-dashed bg-[#F8F9FA] flex flex-col items-center justify-center cursor-pointer hover:bg-[#F0F1F2] transition-colors ${
            courseErrors.image ? "border-red-500" : "border-[#DADADD]"
          }`}
        >
          <Upload size={24} className="text-gray-400 mb-2 dark:text-gray-300" />
          <span className="text-sm text-gray-500">
            {currentCourse.image
              ? (currentCourse.image as File).name
              : (isProgram ? "Upload Program Image (jpg / jpeg)" : "Upload Course Image (jpg / jpeg)")}
          </span>
          <input
            type="file"
            name="image"
            accept="image/jpeg,image/jpg"
            className="hidden dark:bg-gray-800"
            onChange={(e) => handleFileChange(e, "image")}
          />
        </label>
        {courseErrors.image && <p className="text-sm text-red-600 mt-1">{courseErrors.image}</p>}
      </div>

    </div>
  );
}