"use client";

import { Upload, Clock, Building, IndianRupee } from "lucide-react";
import type { Course } from "../../L2DialogBox";
import React from "react";
import InputField from "@/components/ui/InputField";


interface StudyHallFormProps {
  currentCourse: Course;
  handleCourseChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => void;
  handleOperationalDayChange: (day: string) => void;
  handleFileChange: (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "image" | "brochure"
  ) => void;
  setCourses: React.Dispatch<React.SetStateAction<Course[]>>;
  courses: Course[];
  hallName?: string; 
  selectedCourseId: number;
  courseErrors: Record<string, string>;
  labelVariant?: 'course' | 'program';
}

const IconInput = ({ icon, children }: { icon: React.ReactNode, children: React.ReactNode }) => (
  <div className="relative flex items-center">
    <span className="absolute left-4 text-gray-400">{icon}</span>
    {children}
  </div>
);

type FacilityKey = "hasWifi" | "hasChargingPoints" | "hasAC" | "hasPersonalLocker";

export default function StudyHallForm({
  currentCourse,
  handleCourseChange,
  handleOperationalDayChange,
  handleFileChange,
  setCourses,
  courses,
  selectedCourseId,
  courseErrors = {},
  labelVariant = 'course',
}: StudyHallFormProps) {

  // ✅ 1. REMOVED the local handleFacilityChange function.
  // We will call the handleCourseChange prop directly.

  return (
    <div className="grid md:grid-cols-2 gap-x-10 gap-y-6">
       <InputField
        label="Hall Name"
        name="hallName"
        value={currentCourse.hallName || ""}
        onChange={handleCourseChange}
        placeholder="Enter the hall name"
        required
        error={courseErrors.hallName}
      />
      
      <InputField
        label="Seating option"
        name="seatingOption"
        value={currentCourse.seatingOption}
        onChange={handleCourseChange}
        isSelect
        options={["Individual Desk", "Shared Table", "Private Cabin", "Open Seating"]}
        placeholder="Select seating option"
        required
        error={courseErrors.seatingOption}
      />

      {/* ... (Operational Times, Days, Seats, Price, Image sections are unchanged) ... */}
       {/* Operational Times */}
       <div className="flex flex-col gap-3">
        <label className="font-medium text-lg text-black">Operational Time’s<span className="text-red-500 ml-1">*</span></label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <IconInput icon={<Clock size={20} />}>
              <input type="time" name="openingTime" value={currentCourse.openingTime} onChange={handleCourseChange} placeholder="From"
                className={`w-full h-12 pl-12 pr-4 bg-white border rounded-xl font-normal text-base ${courseErrors.openingTime ? "border-red-500" : "border-[#DADADD]"}`} />
            </IconInput>
            {courseErrors.openingTime && <p className="text-sm text-red-600 mt-1">{courseErrors.openingTime}</p>}
          </div>
          <div>
            <IconInput icon={<Clock size={20} />}>
              <input type="time" name="closingTime" value={currentCourse.closingTime} onChange={handleCourseChange} placeholder="To"
                className={`w-full h-12 pl-12 pr-4 bg-white border rounded-xl font-normal text-base ${courseErrors.closingTime ? "border-red-500" : "border-[#DADADD]"}`} />
            </IconInput>
            {courseErrors.closingTime && <p className="text-sm text-red-600 mt-1">{courseErrors.closingTime}</p>}
          </div>
        </div>
      </div>

      {/* Operational Days */}
      <div className="flex flex-col gap-3">
        <label className="font-medium text-lg text-black">Operational Day’s<span className="text-red-500 ml-1">*</span></label>
        <div className="flex flex-wrap gap-2">
          {["Mon", "Tues", "Wed", "Thur", "Fri", "Sat"].map((day) => (
            <button key={day} type="button" onClick={() => handleOperationalDayChange(day)}
              className={`h-12 w-[60px] rounded-lg text-base border transition-colors ${currentCourse.operationalDays.includes(day) ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-white border-[#DADADD] text-[#060B13] hover:bg-gray-100"}`}>
              {day}
            </button>
          ))}
        </div>
        {courseErrors.operationalDays && <p className="text-sm text-red-600 mt-1">{courseErrors.operationalDays}</p>}
      </div>

      {/* Date Fields */}
      <div className="grid grid-cols-2 gap-6">
        <InputField
          label="Hall Start Date"
          name="startDate"
          value={currentCourse.startDate}
          onChange={handleCourseChange}
          type="date"
          error={courseErrors.startDate}
          required
        />

        <InputField
          label="Hall End Date"
          name="endDate"
          value={currentCourse.endDate}
          onChange={handleCourseChange}
          type="date"
          error={courseErrors.endDate}
          required
        />
      </div>

      {/* Total Seats */}
      <div className="flex flex-col gap-3">
        <label className="font-medium text-lg text-black">Total Seats<span className="text-red-500 ml-1">*</span></label>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <IconInput icon={<Building size={20} />}>
              <input type="number" name="totalSeats" value={currentCourse.totalSeats} onChange={handleCourseChange} placeholder="Total seats"
                className={`w-full h-12 pl-12 pr-4 bg-white border rounded-xl font-normal text-base ${courseErrors.totalSeats ? "border-red-500" : "border-[#DADADD]"}`} />
            </IconInput>
            {courseErrors.totalSeats && <p className="text-sm text-red-600 mt-1">{courseErrors.totalSeats}</p>}
          </div>
          <div>
            <IconInput icon={<Building size={20} />}>
              <input type="number" name="availableSeats" value={currentCourse.availableSeats} onChange={handleCourseChange} placeholder="Available seats"
                className={`w-full h-12 pl-12 pr-4 bg-white border rounded-xl font-normal text-base ${courseErrors.availableSeats ? "border-red-500" : "border-[#DADADD]"}`} />
            </IconInput>
            {courseErrors.availableSeats && <p className="text-sm text-red-600 mt-1">{courseErrors.availableSeats}</p>}
          </div>
        </div>
      </div>

      {/* Price of the Seat */}
      <div className="flex flex-col gap-3">
        <label className="font-medium text-lg text-black">Price of the Seat<span className="text-red-500 ml-1">*</span></label>
        <IconInput icon={<IndianRupee size={20} />}>
          <input type="number" name="pricePerSeat" value={currentCourse.pricePerSeat} onChange={handleCourseChange} placeholder="Enter price per seat"
            className={`w-full h-12 pl-12 pr-4 bg-white border rounded-xl font-normal text-base ${courseErrors.pricePerSeat ? "border-red-500" : "border-[#DADADD]"}`} />
        </IconInput>
        {courseErrors.pricePerSeat && <p className="text-sm text-red-600 mt-1">{courseErrors.pricePerSeat}</p>}
      </div>
      
      {/* Add Image */}
      <div className="flex flex-col gap-3">
        <label className="font-medium text-lg text-black dark:text-gray-700">{labelVariant === 'program' ? 'Add Program Image' : 'Add Image'}<span className="text-red-500 ml-1">*</span></label>
        <label className={`dark:bg-gray-800 w-full h-[81px] rounded-xl border border-dashed bg-white flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors ${courseErrors.image ? "border-red-500" : "border-[#DADADD]"}`}>
          <Upload size={24} className="text-gray-400 mb-2 dark:text-gray-300" />
          <span className="text-sm text-[#697282]">{currentCourse.image ? (currentCourse.image as File).name : (labelVariant === 'program' ? "Upload Program Image (jpg / jpeg)." : "Upload Course Image (jpg / jpeg).")}</span>
          <input type="file" accept="image/jpeg,image/jpg" className="hidden" onChange={(e) => handleFileChange(e, "image")} />
        </label>
        {courseErrors.image && <p className="text-sm text-red-600 mt-1">{courseErrors.image}</p>}
      </div>

      {/* Facilities */}
      {([
        { name: "hasWifi", label: "Wi-fi ?" },
        { name: "hasChargingPoints", label: "Charging Points ?" },
        { name: "hasAC", label: "Air Conditioner (AC) ?" },
        { name: "hasPersonalLocker", label: "Personal Locker's ?" },
      ] as { name: FacilityKey; label: string }[]).map((f) => (
        <div key={f.name} className="flex flex-col gap-3">
          <label className="font-medium text-lg">{f.label}<span className="text-red-500 ml-1">*</span></label>
          <div className="flex items-center gap-4 h-12">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name={f.name}
                value="yes" 
                checked={currentCourse[f.name] === "Yes"} 
                // ✅ 2. Call handleCourseChange directly with a synthetic event
                onChange={() => handleCourseChange({
                  target: { name: f.name, value: "Yes" },
                } as React.ChangeEvent<HTMLInputElement>)}
                className="h-4 w-4" 
              />
              <span className="text-base text-[#060B13]">Yes</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name={f.name}
                value="no" 
                checked={currentCourse[f.name] === "No"} 
                // ✅ 3. Call handleCourseChange directly with a synthetic event
                onChange={() => handleCourseChange({
                  target: { name: f.name, value: "No" },
                } as React.ChangeEvent<HTMLInputElement>)} 
                className="h-4 w-4" 
              />
              <span className="text-base text-[#060B13]">No</span>
            </label>
          </div>
          {courseErrors[f.name] && <p className="text-sm text-red-600 mt-1">{courseErrors[f.name]}</p>}
        </div>
      ))}

    </div>
  );
}