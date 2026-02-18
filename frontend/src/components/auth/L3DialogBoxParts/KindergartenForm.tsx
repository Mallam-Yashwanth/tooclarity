"use client";
import React, { useEffect, useMemo } from "react";
import InputField from "@/components/ui/InputField";
import { ChevronDown, Clock, Clock as ClockIcon, FileText, ImageIcon, MapPin, Plus, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Course } from "@/components/auth/L2DialogBox";
import SlidingIndicator from "@/components/ui/SlidingIndicator";
import SearchableSelect from "@/components/ui/SearchableSelect";
import { STATE_DISTRICT_MAP, STATE_OPTIONS } from "@/constants/stateDistricts";
import { getAllInstitutionsFromDB } from "@/lib/localDb";
import { programsAPI } from "@/lib/api";
import { getMyInstitution } from "@/lib/api";

interface KindergartenFormProps {
  currentCourse: Course;
  institutionId?: string;
  handleCourseChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => void;
  handleOperationalDayChange: (day: string) => void;
  handleFileChange: (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "image" | "brochure" | "kindergartenImage"
  ) => void;
  setCourses: React.Dispatch<React.SetStateAction<Course[]>>;
  courses: Course[];
  selectedCourseId: number;
  setSelectedCourseId: (id: number) => void;
  addNewCourse: () => void;
  deleteCourse: (id: number) => void;
  courseErrors: Record<string, string>;
  labelVariant?: "course" | "program";
  uniqueRemoteBranches?: Array<{ _id: string; branchName: string; branchAddress?: string; state?: string; district?: string; town?: string; locationUrl?: string }>;
  selectedBranchId?: string;
  isSubscriptionProgram?: boolean;
}

export default function KindergartenForm({
  currentCourse,
  handleCourseChange,
  handleOperationalDayChange,
  handleFileChange,
  setCourses,
  courses,
  selectedCourseId,
  institutionId,
  setSelectedCourseId,
  addNewCourse,
  deleteCourse,
  courseErrors = {},
  labelVariant = "course",
  uniqueRemoteBranches = [],
  selectedBranchId,
  isSubscriptionProgram = true,
}: KindergartenFormProps) {
  const isProgram = labelVariant === "program";
  const operationalDaysOptions = ["Mon", "Tues", "Wed", "Thur", "Fri", "Sat"];

  useEffect(() => {
    if (isSubscriptionProgram && selectedBranchId && currentCourse.createdBranch === "Main") {
      const branch = uniqueRemoteBranches.find(b => b._id === selectedBranchId);
      if (branch) {
        setCourses(prev => prev.map(c =>
          c.id === selectedCourseId ? {
            ...c,
            // Only sync these two specific fields
            aboutBranch: branch.branchAddress || "",
            headquatersAddress: branch.branchAddress || "",
            locationURL: branch.locationUrl || "",
          } : c
        ));
      }
    }
  }, [selectedBranchId, uniqueRemoteBranches, selectedCourseId, currentCourse.createdBranch, setCourses, isSubscriptionProgram]);

  const handleRadioChange = (name: keyof Course, value: string) => {
    if (name === "createdBranch" && value === "Main") {
      if (selectedBranchId) {
        const branch = uniqueRemoteBranches.find((b) => b._id === selectedBranchId);
        if (branch) {
          setCourses((prev) =>
            prev.map((c) =>
              c.id === selectedCourseId
                ? {
                  ...c,
                  createdBranch: "Main",
                  // Only pull address and map link
                  aboutBranch: branch.branchAddress || "",
                  headquatersAddress: branch.branchAddress || "",
                  locationURL: branch.locationUrl || "",
                }
                : c
            )
          );
          return;
        }
      }
    }

    setCourses((prev) =>
      prev.map((c) => {
        if (c.id === selectedCourseId) {
          // When switching to "No", only clear the synced fields
          if (name === "createdBranch" && value === "") {
            return {
              ...c,
              createdBranch: "",
              aboutBranch: "",
              headquatersAddress: "",
              locationURL: "",
            };
          }
          return { ...c, [name]: value };
        }
        return c;
      })
    );
  };
  const districtOptions = useMemo(() => {
    if (!currentCourse.state) return [];
    return STATE_DISTRICT_MAP[currentCourse.state] || [];
  }, [currentCourse.state]);


  const convertTo24Hour = (time: string, period: string): string => {
    if (!time) return "";

    // 1. Destructure using const for both
    const [rawHours, minutes] = time.split(":").map(Number);
    if (isNaN(rawHours)) return "";
    let hours = rawHours;

    if (period === "PM" && hours < 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;

    const h = hours.toString().padStart(2, '0');
    const m = (minutes || 0).toString().padStart(2, '0');
    return `${h}:${m}`;
  };

  const handleTimeUIChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const period = name === "openingTime" ? currentCourse.openingTimePeriod : currentCourse.closingTimePeriod;

    // 1. Update the raw text input for the UI
    handleCourseChange(e);

    // 2. Update the hidden 24h format for the backend
    const time24 = convertTo24Hour(value, period || "AM");
    // We effectively update the state twice: once for display, once for data integrity
  };

  const handlePeriodChange = (name: "openingTime" | "closingTime", period: string) => {
    const timeValue = name === "openingTime" ? currentCourse.openingTime : currentCourse.closingTime;
    const time24 = convertTo24Hour(timeValue || "", period);

    setCourses((prev) =>
      prev.map((c) =>
        c.id === selectedCourseId
          ? { ...c, [`${name}Period`]: period, [name]: timeValue }
          : c
      )
    );
  };

  return (
    <div className="space-y-8">
      {/* Primary Course Details [cite: 4-13] */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
        {/* <InputField
          label="Course Type"
          name="graduationType"
          value={currentCourse.graduationType}
          onChange={handleCourseChange}
          isSelect
          options={["Kindergarten"]}
          placeholder="Select Course type"
          required
          error={courseErrors.graduationType}
        /> */}

        <InputField
          label="Name of Course"
          name="courseName"
          value={currentCourse.courseName}
          onChange={handleCourseChange}
          placeholder="Enter the course"
          required
          error={courseErrors.courseName}
        />


      </div>

      <div className="bg-[#DCDCFF] p-6 rounded-[6px] space-y-6 border border-blue-100 shadow-[0px_4px_20px_rgba(0,0,0,0.1)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            {courses.map((course) => (
              <Button
                key={course.id}
                type="button"
                variant="ghost"
                onClick={() => setSelectedCourseId(course.id)}
                className={`px-3 py-2 rounded-lg text-sm border transition-colors flex items-center gap-2 ${selectedCourseId === course.id
                  ? "bg-blue-50 border-blue-200 text-blue-700 font-medium"
                  : "bg-gray-50 border-gray-200 dark:bg-gray-800 text-gray-600 hover:bg-gray-100"
                  }`}
              >
                {course.courseName || `Course ${course.id}`}
                {courses.length > 1 && (
                  <span
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      deleteCourse(course.id);
                    }}
                    className="ml-1 hover:text-red-500 transition-colors cursor-pointer"
                  >
                    <X size={14} />
                  </span>
                )}
              </Button>
            ))}
          </div>
          <Button
            type="button"
            onClick={addNewCourse}
            className="bg-[#0222D7] text-white flex items-center gap-2 px-5 py-2 rounded-lg font-semibold shadow-sm transition-transform active:scale-95"
          >
            <div className="bg-white rounded-full p-0.5 flex items-center justify-center">
              <Plus size={12} className="text-[#0222D7]" strokeWidth={3} />
            </div>
            Add Course
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
          <InputField
            label="Category Type"
            name="categoriesType"
            value={currentCourse.categoriesType || ""}
            onChange={handleCourseChange}
            isSelect
            options={["Nursery", "LKG", "UKG", "Playgroup"]}
            placeholder="Select Category Type"
            error={courseErrors.categoriesType}
            required
          />

          <InputField
            label="Fee's"
            name="priceOfCourse"
            value={currentCourse.priceOfCourse}
            onChange={handleCourseChange}
            placeholder="Enter Fee's"
            type="number"
            error={courseErrors.priceOfCourse}
            required
          />
        </div>
      </div>

      {/* LOCATION BOX SECTION [cite: 14-25] */}
      <div className="bg-[#DCDCFF] p-6 rounded-[6px] space-y-6 border border-blue-100 shadow-[0px_4px_20px_rgba(0,0,0,0.1)]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-4">
          <div className="flex flex-col gap-4">
            <span className="font-[Montserrat] font-medium text-[16px] md:text-[18px] text-black dark:text-slate-200">
              This is same as Campus Address
            </span>
            <div className="flex gap-8">
              {["Yes", "No"].map((opt) => (
                <label key={opt} className="flex items-center gap-2 cursor-pointer text-sm font-medium dark:text-slate-200">
                  <input
                    type="radio"
                    name="sameAsCampus"
                    value={opt}
                    checked={currentCourse.createdBranch === (opt === "Yes" ? "Main" : "")}
                    onChange={(e) => handleRadioChange("createdBranch", e.target.value === "Yes" ? "Main" : "")}
                    className="accent-[#0222D7] w-4 h-4 cursor-pointer"
                  />
                  {opt}
                </label>
              ))}
            </div>
            {currentCourse.createdBranch === "Main" && !selectedBranchId && (
              <p className="text-red-600 text-[10px] font-bold italic">* Select a branch at the top first</p>
            )}
          </div>

          <InputField
            label="Location URL"
            name="locationURL"
            value={currentCourse.locationURL || ""}
            onChange={handleCourseChange}
            placeholder="https://maps.app.goo.gl/4mPv8SX6cD52i9B"
            error={courseErrors.locationUrl}
            required
          />

          <InputField
            label="headquarters address"
            name="headquatersAddress"
            value={currentCourse.headquatersAddress || ""}
            onChange={handleCourseChange}
            placeholder="2-3, Uppal Hills Colony, Peerzadiguda"
            error={courseErrors.aboutBranch}
            required
          />

          <SearchableSelect
            label="State"
            name="state"
            value={currentCourse.state}
            onChange={handleCourseChange}
            options={STATE_OPTIONS}
            placeholder="Select state"
            required
            error={courseErrors.state}
          />

          <SearchableSelect
            label="District"
            name="district"
            value={currentCourse.district}
            onChange={handleCourseChange}
            options={districtOptions}
            placeholder={
              currentCourse.state ? "Select district" : "Select state first"
            }
            required
            disabled={!currentCourse.state}
            error={courseErrors.district}
          />

          <InputField
            label="Town"
            name="town"
            value={currentCourse.town}
            onChange={handleCourseChange}
            placeholder="Medchal"
            error={courseErrors.town}
            required
          />
        </div>
      </div>

      {/* Secondary Course Info [cite: 26-39] */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
        <InputField
          label="About Course"
          name="aboutCourse"
          value={currentCourse.aboutCourse || ""}
          onChange={handleCourseChange}
          placeholder="Enter the course info"
          error={courseErrors.aboutCourse}
          required
        />

        <InputField
          label="Course Duration"
          name="courseDuration"
          value={currentCourse.courseDuration || ""}
          onChange={handleCourseChange}
          placeholder="eg. 3 months"
          error={courseErrors.courseDuration}
          required
        />

        <div className="flex flex-col gap-3">
          <label className="font-small text-[16px] text-black">Mode <span className="text-red-500">*</span></label>
          <SlidingIndicator
            options={["Offline", "Online", "Hybrid"] as const}
            activeOption={currentCourse.mode as "Offline" | "Online" | "Hybrid" || "Offline"}
            onOptionChange={(val) => {
              setCourses((prev) =>
                prev.map((c) => (c.id === selectedCourseId ? { ...c, mode: val } : c))
              );
            }}
            size="md"

          />
          {courseErrors.mode && <p className="text-red-500 text-xs">{courseErrors.mode}</p>}
        </div>

        <InputField
          label="Class Size"
          name="classSize"
          value={currentCourse.classSize || ""}
          onChange={handleCourseChange}
          placeholder="Enter no of students per class"
          error={courseErrors.classSize}
          required
        />

        <InputField
          label="Curriculum type"
          name="curriculumType"
          value={currentCourse.curriculumType || ""}
          onChange={handleCourseChange}
          placeholder="Enter Curriculum type"
          error={courseErrors.curriculumType}
          required
        />

        <InputField
          label="Ownership Type"
          name="ownershipType"
          value={currentCourse.ownershipType || ""}
          onChange={handleCourseChange}
          isSelect
          options={["Private", "Government", "Trust", "Other"]}
          placeholder="Select Ownership type"
          error={courseErrors.ownershipType}
          required
        />
      </div>

      {/* Operational Section [cite: 40-50] */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="flex flex-col gap-4">
          <label className="font-medium text-[16px] text-gray-900">Operational Day&apos;s</label>
          <div className="flex flex-wrap gap-2">
            {operationalDaysOptions.map((day) => (
              <Button
                key={day}
                type="button"
                onClick={() => handleOperationalDayChange(day)}
                className={`h-10 px-3 rounded-lg border transition-all ${currentCourse.operationalDays?.includes(day)
                  ? "bg-[#0222D7] text-white border-[#0222D7]"
                  : "bg-[#F5F6F9] text-[#697282] border-[#DADADD] hover:bg-gray-100"
                  }`}
              >
                {day}
              </Button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <label className="font-medium text-[16px] text-gray-900">
            Operational Time&apos;s <span className="text-red-500">*</span>
          </label>

          <div className="flex items-center gap-4">
            {/* FROM CONTAINER */}
            <div className="flex items-center flex-1 h-[48px] border border-[#DADADD] rounded-xl bg-white shadow-sm focus-within:ring-1 focus-within:ring-[#0222D7] overflow-hidden">
              {/* Input Part */}
              <div className="flex items-center gap-2 px-3 flex-1 h-full">
                <Clock size={18} className="text-[#697282]" />
                <input
                  type="text"
                  name="openingTime"
                  placeholder="From"
                  value={currentCourse.openingTime || ""}
                  onChange={handleCourseChange}
                  className="w-full bg-transparent text-[15px] outline-none placeholder:text-[#9CA3AF]"
                />
              </div>

              {/* Dropdown Part (The "Box" look) */}
              <div className="relative h-full flex items-center border-l border-[#DADADD] bg-white hover:bg-gray-50 transition-colors">
                <select
                  className="appearance-none pl-4 pr-10 h-full bg-transparent text-[13px] font-bold text-gray-700 outline-none cursor-pointer"
                  value={currentCourse.openingTimePeriod || "AM"}
                  onChange={(e) => handlePeriodChange("openingTime", e.target.value)}
                >
                  <option value="AM" className="bg-white text-gray-700">AM</option>
                  <option value="PM" className="bg-white text-gray-700">PM</option>
                </select>
                <ChevronDown size={14} className="absolute right-3 pointer-events-none text-gray-500" />
              </div>
            </div>

            {/* TO CONTAINER */}
            <div className="flex items-center flex-1 h-[48px] border border-[#DADADD] rounded-xl bg-white shadow-sm focus-within:ring-1 focus-within:ring-[#0222D7] overflow-hidden">
              {/* Input Part */}
              <div className="flex items-center gap-2 px-3 flex-1 h-full">
                <Clock size={18} className="text-[#697282]" />
                <input
                  type="text"
                  name="closingTime"
                  placeholder="To"
                  value={currentCourse.closingTime || ""}
                  onChange={handleCourseChange}
                  className="w-full bg-transparent text-[15px] outline-none placeholder:text-[#9CA3AF]"
                />
              </div>

              {/* Dropdown Part (The "Box" look) */}
              <div className="relative h-full flex items-center border-l border-[#DADADD] bg-white hover:bg-gray-50 transition-colors">
                <select
                  className="appearance-none pl-4 pr-10 h-full bg-transparent text-[13px] font-bold text-gray-700 outline-none cursor-pointer"
                  value={currentCourse.closingTimePeriod || "PM"}
                  onChange={(e) => handlePeriodChange("closingTime", e.target.value)}
                >
                  <option value="AM" className="bg-white text-gray-700">AM</option>
                  <option value="PM" className="bg-white text-gray-700">PM</option>
                </select>
                <ChevronDown size={14} className="absolute right-3 pointer-events-none text-gray-500" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Facility Checklists [cite: 51-61] */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
        {[
          { label: "Extended care ?", name: "extendedCare" },
          { label: "Meals Provided ?", name: "mealsProvided" },
          { label: "Playground ?", name: "playground" },
          { label: "Pickup/Drop Services ?", name: "pickupDropService" },
          { label: "Installments ?", name: "installments" },
          { label: "EMI Options", name: "emioptions" }
        ].map((item) => (
          <div key={item.name} className="flex flex-col gap-3">
            <label className="font-medium text-[15px] text-gray-900">{item.label} <span className="text-red-500">*</span></label>
            <div className="flex gap-6">
              {["Yes", "No"].map((opt) => (
                <label key={opt} className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                  <input
                    type="radio"
                    name={item.name}
                    value={opt}
                    checked={currentCourse[item.name as keyof Course] === opt}
                    onChange={(e) => handleRadioChange(item.name as keyof Course, e.target.value)}
                    className="accent-[#0222D7] w-4 h-4 cursor-pointer"
                    required
                  />
                  {opt}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Teacher Ratio & Center Images Row [cite: 55-56, 62-63] */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6 items-end">
        <InputField
          label="Teacher: Student Ratio"
          name="teacherStudentRatio"
          value={currentCourse.teacherStudentRatio || ""}
          onChange={handleCourseChange}
          placeholder="Eg. 5 students per 1 teacher"
          error={courseErrors.teacherStudentRatio}
          required
        />

        <div className="space-y-2">
          <label className="font-medium text-[16px] text-gray-900">
            Center Images <span className="text-red-500">*</span>
          </label>
          <div className="relative group">
            {/* 1. id must match the htmlFor below */}
            <input
              type="file"
              id="kindergarten-center-input"
              accept="image/*"
              multiple
              onChange={(e) => handleFileChange(e, "kindergartenImage")}
              className="hidden"
            />
            <label
              htmlFor="kindergarten-center-input"
              className="flex items-center justify-between w-full h-[42px] px-3 bg-[#F5F6F9] border border-[#DADADD] rounded-lg cursor-pointer hover:bg-gray-100 transition-all overflow-hidden"
            >
              {/* 2. Check for the specific Kindergarten preview key */}
              {(currentCourse.kindergartenImage || currentCourse.kindergartenImagePreviewUrl) ? (
                <div className="absolute inset-0 w-full h-full">
                  <img
                    src={currentCourse.kindergartenImagePreviewUrl}
                    alt="Center Preview"
                    className="w-full h-full object-cover"
                  />
                  {/* Optional: Add a semi-transparent overlay on hover to show it's still clickable */}
                  <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center">
                    <span className="text-white text-xs font-bold opacity-0 hover:opacity-100 bg-black/40 px-2 py-1 rounded">Change Photo</span>
                  </div>
                </div>
              ) : (
                <>
                  <span className="text-sm text-gray-400 font-normal">Upload center images</span>
                  <Upload className="text-gray-400 w-4 h-4" />
                </>
              )}
            </label>
          </div>
          {/* 3. Match the error key to the schema field */}
          {courseErrors.kindergartenImageUrl && (
            <p className="text-red-500 text-[10px] mt-1">{courseErrors.kindergartenImageUrl}</p>
          )}
        </div>
      </div>


      {/* FINAL UPLOAD SECTION (MATCHING SCREENSHOT) [cite: 57, 64-67] */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6  border-t border-gray-100 items-end">
        {/* Add Image Section */}
        <div className="space-y-3">
          <label className="font-medium text-[16px] text-gray-900">
            Add Image <span className="text-red-500">*</span>
          </label>
          <div className="relative group">
            <input
              type="file"
              id="course-image-input"
              accept="image/*"
              onChange={(e) => handleFileChange(e, "image")}
              className="hidden"
            />
            <label
              htmlFor="course-image-input"
              className="flex flex-col items-center justify-center w-full h-[110px] bg-white border border-[#DADADD] rounded-[12px] cursor-pointer hover:bg-gray-50 transition-all overflow-hidden"
            >
              {currentCourse.imagePreviewUrl ? (
                <img
                  src={currentCourse.imagePreviewUrl}
                  alt="Preview"
                  className="w-full h-full object-contain p-2"
                />
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div className="border border-slate-400 rounded-full p-1">
                    <Upload className="text-slate-500 w-4 h-4" />
                  </div>
                  <span className="text-[13px] text-slate-500 font-normal">
                    Upload Course Image (jpg / jpeg)
                  </span>
                </div>
              )}
            </label>
          </div>
        </div>

        {/* Add Brochure Section */}
        <div className="space-y-3">
          <label className="font-medium text-[16px] text-gray-900">
            Add Brochure <span className="text-red-500">*</span>
          </label>
          <div className="relative group">
            <input
              type="file"
              id="brochure-input"
              accept="application/pdf"
              onChange={(e) => handleFileChange(e, "brochure")}
              className="hidden"
            />
            <label
              htmlFor="brochure-input"
              className="flex flex-col items-center justify-center w-full h-[110px] bg-white border border-[#DADADD] rounded-[12px] cursor-pointer hover:bg-gray-50 transition-all overflow-hidden"
            >
              {currentCourse.brochurePreviewUrl ? (
                <div className="flex flex-col items-center gap-1">
                  <FileText className="text-red-500 w-6 h-6" />
                  <span className="text-xs text-slate-600 font-medium">Brochure Added</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div className="border border-slate-400 rounded-full p-1">
                    <Upload className="text-slate-500 w-4 h-4" />
                  </div>
                  <span className="text-[13px] text-slate-500 font-normal">
                    Upload Brochure Course (pdf)
                  </span>
                </div>
              )}
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}