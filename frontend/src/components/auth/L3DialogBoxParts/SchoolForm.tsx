"use client";
import React, { useMemo } from "react";
import InputField from "@/components/ui/InputField";
import { Course } from "@/components/auth/L2DialogBox";
import { getMyInstitution } from "@/lib/api";
import { STATE_DISTRICT_MAP, STATE_OPTIONS } from "@/constants/stateDistricts";
import SearchableSelect from "@/components/ui/SearchableSelect";
import SlidingIndicator from "@/components/ui/SlidingIndicator";
import { Clock, ChevronDown, Plus, X, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SchoolFormProps {
  currentCourse: Course;
  courseErrors: Record<string, string>;
  handleCourseChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleFileChange: (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "image" | "brochure" | "schoolImage"
  ) => void;
  handleOperationalDayChange?: (day: string) => void;
  setCourses: React.Dispatch<React.SetStateAction<Course[]>>;
  selectedCourseId: number;
  setSelectedCourseId: (id: number) => void;
  courses: Course[];
  institutionId?: string;
  addNewCourse: () => void;
  deleteCourse: (id: number) => void;
  isLoading?: boolean;
  onPrevious?: () => void;
  labelVariant?: "course" | "program";
}

interface InstitutionResponse {
  data?: {
    headquartersAddress?: string;
    state?: string;
    locationURL?: string;
  };
  headquartersAddress?: string;
  state?: string;
  locationURL?: string;
}

export default function SchoolForm({
  currentCourse,
  courseErrors = {},
  handleCourseChange,
  handleFileChange,
  handleOperationalDayChange,
  setCourses,
  selectedCourseId,
  setSelectedCourseId,
  courses,
  institutionId,
  addNewCourse,
  deleteCourse,
  isLoading,
  onPrevious,
  labelVariant = "course",
}: SchoolFormProps) {
  const isProgram = labelVariant === "program";
  const operationalDaysOptions = ["Mon", "Tues", "Wed", "Thur", "Fri", "Sat", "Sun"];
  const yesNoOptions = ["Yes", "No"];

  const handleRadioChange = async (name: keyof Course, value: string) => {
    if (name === "createdBranch" && value === "Main") {
      try {
        const response = await getMyInstitution() as InstitutionResponse;
        const mainInst = response?.data || response;
        if (mainInst) {
          setCourses((prev) => prev.map((c) => c.id === selectedCourseId ? {
            ...c,
            createdBranch: "Main",
            aboutBranch: mainInst.headquartersAddress || "",
            state: mainInst.state || "",
            locationUrl: mainInst.locationURL || "",
            district: c.district || "",
            town: c.town || "",
          } : c));
          return;
        }
      } catch (error) { console.error("Autofill failed:", error); }
    }
    setCourses((prev) => prev.map((c) => (c.id === selectedCourseId ? { ...c, [name]: value } : c)));
  };

  const handlePeriodChange = (name: "openingTime" | "closingTime", period: string) => {
    setCourses((prev) => prev.map((c) => (c.id === selectedCourseId ? { ...c, [`${name}Period`]: period } : c)));
  };

  const districtOptions = useMemo(() => {
    if (!currentCourse.state) return [];
    return STATE_DISTRICT_MAP[currentCourse.state] || [];
  }, [currentCourse.state]);

  return (
    <div className="space-y-6">
      {/* SECTION 1: SCHOOL & COURSE DETAILS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
        {/* Row 1: School Name & Mode */}
        <InputField label="School Name" name="courseName" value={currentCourse.courseName} onChange={handleCourseChange} placeholder="Aryabhatta concept school" required error={courseErrors.courseName} />
        <div className="flex flex-col gap-3">
          <label className="font-medium text-[16px] text-black">Mode <span className="text-red-500">*</span></label>
          <SlidingIndicator
            options={["Offline", "Online", "Hybrid"] as const}
            activeOption={currentCourse.mode || "Offline"}
            onOptionChange={(val) => setCourses((prev) => prev.map((c) => (c.id === selectedCourseId ? { ...c, mode: val } : c)))}
            size="md"
          />
        </div>

        {/* Row 2: Duration & Starting Date */}
        <InputField label="Course Duration" name="courseDuration" value={currentCourse.courseDuration} onChange={handleCourseChange} placeholder="e.g. 3 months" required />
        <InputField label="Starting date" name="startDate" value={currentCourse.startDate} onChange={handleCourseChange} type="date" required />

        {/* Row 3: Language & Ownership */}
        <InputField label="Language of Class" name="classlanguage" value={currentCourse.classlanguage} onChange={handleCourseChange} placeholder="Eg English" />
        <InputField label="Ownership Type" name="ownershipType" value={currentCourse.ownershipType} onChange={handleCourseChange} isSelect options={["Private", "Government", "Trust"]} placeholder="Select Ownership type" required />

        {/* Row 4: School Type & Curriculum */}
        <InputField label="School Type" name="schoolType" value={currentCourse.schoolType} onChange={handleCourseChange} isSelect options={["Co-Education", "Boys Only", "Girls Only"]} placeholder="Select school type" required />
        <InputField label="Curriculum Type *" name="curriculumType" value={currentCourse.curriculumType} onChange={handleCourseChange} isSelect options={["State board", "CBSE", "ICSE", "IB", "IGCSE"]} placeholder="Select Curriculum type" required />
      </div>

      {/* Row 5: Operational Times (Left aligned) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
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
                  value={currentCourse.openingTime}
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
                  value={currentCourse.closingTime}
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


      {/* SECTION 2: LOCATION & ADDRESS SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-4">
        <div className="flex flex-col gap-4">
          <span className="font-[Montserrat] font-medium text-[16px] md:text-[18px] text-black">
            This is same as Campus Address?
          </span>
          <div className="flex gap-8">
            {["Yes", "No"].map((opt) => (
              <label key={opt} className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                <input
                  type="radio"
                  name="sameAsCampus"
                  value={opt}
                  checked={currentCourse.createdBranch === (opt === "Yes" ? "Main" : "")}
                  onChange={(e) =>
                    handleRadioChange("createdBranch", e.target.value === "Yes" ? "Main" : "")
                  }
                  className="accent-[#0222D7] w-4 h-4 cursor-pointer"
                />
                {opt}
              </label>
            ))}
          </div>
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
          name="aboutBranch"
          value={currentCourse.aboutBranch || ""}
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

      {/* SECTION 3: CLASS TYPE & FEES (Purple-styled container) */}
      <div className="bg-[#DCDCFF] p-6 rounded-[12px] border border-[#E9D7FE] shadow-sm space-y-6 relative">
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
            label="Class Type"
            name="classType"
            value={currentCourse.classType || ""}
            onChange={handleCourseChange}
            isSelect
            options={["Primary", "Secondary", "Higher Secondary", "Nursery", "Class 1st", "Class 2nd", "Class 3rd", "Class 4th", "Class 5th", "Class 6th", "Class 7th", "Class 8th", "Class 9th", "Class 10th"]}
            placeholder="Select Class Type"
            error={courseErrors.classType}
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

      {/* SECTION 4: FACILITIES (Radio Toggles) */}
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
          {([
            { label: "Out door Playground?", name: "playground" },
            { label: "Pickup/Drop services (Bus)?", name: "busService" },
            { label: "Hostel facility?", name: "hostelFacility" },
            { label: "EMI Options", name: "emioptions" },
          ] as const).map((item) => (
            <div key={item.name} className="flex flex-col gap-3">
              <label className="font-medium text-[16px] text-gray-900">
                {item.label} <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-8">
                {["Yes", "No"].map((opt) => (
                  <label key={opt} className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                    <input
                      type="radio"
                      name={item.name}
                      value={opt}
                      checked={currentCourse[item.name] === opt}
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6 items-start">
        {/* Left: Payment Toggle */}
        <div className="flex flex-col gap-4">
          <label className="font-medium text-[16px] text-gray-900">
            Payment (Partly Payment) ? <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-8">
            {["Yes", "No"].map((opt) => (
              <label key={opt} className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                <input
                  type="radio"
                  name="partlyPayment"
                  value={opt}
                  checked={currentCourse.partlyPayment === opt}
                  onChange={(e) => handleRadioChange("partlyPayment" as keyof Course, e.target.value)}
                  className="accent-[#0222D7] w-4 h-4 cursor-pointer"
                  required
                />
                {opt}
              </label>
            ))}
          </div>
        </div>

        {/* Right: Add Photos of School */}
        <div className="space-y-3">
          <label className="font-medium text-[16px] text-gray-900">
            Add Photos of School <span className="text-red-500">*</span>
          </label>
          <div className="relative group">
            <input
              type="file"
              id="school-photos-input"
              accept="image/*"
              onChange={(e) => handleFileChange(e, "schoolImage")}
              className="hidden"
            />
            <label
              htmlFor="school-photos-input"
              className="flex flex-col items-center justify-center w-full h-[80px] bg-white border border-[#DADADD] rounded-[12px] cursor-pointer hover:bg-gray-50 transition-all overflow-hidden"
            >
              {(currentCourse.schoolImage || currentCourse.schoolImagePreviewUrl) ? (
                <img src={currentCourse.schoolImagePreviewUrl} alt="Preview" className="w-full h-full object-contain p-2" />
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div className="border border-slate-400 rounded-full p-1">
                    <Upload className="text-slate-500 w-4 h-4" />
                  </div>
                  <span className="text-[13px] text-slate-500 font-normal">Upload Photos of School (pdf)</span>
                </div>
              )}
            </label>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6 items-end">
        {/* Add Image Section */}
        <div className="space-y-3">
          <label className="font-medium text-[16px] text-gray-900">
            Add Image <span className="text-red-500">*</span>
          </label>
          <div className="relative group">
            <input
              type="file"
              id="school-image-input"
              accept="image/*"
              onChange={(e) => handleFileChange(e, "image")}
              className="hidden"
            />
            <label
              htmlFor="school-image-input"
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
                    Upload Course Image (jpg/jpeg)
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
              id="school-brochure-input"
              accept="application/pdf"
              onChange={(e) => handleFileChange(e, "brochure")}
              className="hidden"
            />
            <label
              htmlFor="school-brochure-input"
              className="flex flex-col items-center justify-center w-full h-[110px] bg-white border border-[#DADADD] rounded-[12px] cursor-pointer hover:bg-gray-50 transition-all overflow-hidden"
            >
              {currentCourse.brochurePreviewUrl ? (
                <div className="flex flex-col items-center gap-1">
                  <div className="text-red-500 font-bold text-xl">PDF</div>
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