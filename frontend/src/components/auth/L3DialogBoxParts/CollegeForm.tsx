"use client";
import React, { useEffect, useMemo } from "react";
import { Clock, ChevronDown, Plus, Upload, X, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import InputField from "@/components/ui/InputField";
import { Course } from "@/components/auth/L2DialogBox";
import { STATE_DISTRICT_MAP, STATE_OPTIONS } from "@/constants/stateDistricts";
import SearchableSelect from "@/components/ui/SearchableSelect";
import SlidingIndicator from "@/components/ui/SlidingIndicator";

interface CollegeFormProps {
  currentCourse: Course;
  courseErrors: Record<string, string>;
  handleCourseChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleOperationalDayChange?: (day: string) => void;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>, type: "image" | "brochure" | "intermediateImage") => void;
  setCourses: React.Dispatch<React.SetStateAction<Course[]>>;
  selectedCourseId: number;
  setSelectedCourseId: (id: number) => void;
  courses: Course[];
  addNewCourse: () => void;
  deleteCourse: (id: number) => void;
  labelVariant?: "course" | "program";
  uniqueRemoteBranches?: Array<{ _id: string; branchName: string; branchAddress?: string; state?: string; district?: string; town?: string; locationUrl?: string }>;
  selectedBranchId?: string;
  isSubscriptionProgram?: boolean;

}


export default function CollegeForm({
  currentCourse,
  courseErrors = {},
  handleCourseChange,
  handleOperationalDayChange,
  handleFileChange,
  setCourses,
  selectedCourseId,
  setSelectedCourseId,
  courses,
  addNewCourse,
  deleteCourse,
  labelVariant = "course",
  uniqueRemoteBranches = [],
  selectedBranchId,
  isSubscriptionProgram = true,
}: CollegeFormProps) {

  const isProgram = labelVariant === "program";
  const operationalDaysOptions = ["Mon", "Tues", "Wed", "Thur", "Fri", "Sat"];
  const yesNoOptions = ["Yes", "No"];

  const handlePeriodChange = (name: "openingTime" | "closingTime", period: string) => {
    setCourses((prev) => prev.map((c) => (c.id === selectedCourseId ? { ...c, [`${name}Period`]: period } : c)));
  };

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

  return (
    <div className="space-y-6">
      {/* SECTION 1: CORE INTERMEDIATE DETAILS */}
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
          <InputField label="Intermediate Name" name="intermediateName" value={currentCourse.intermediateName || ""} onChange={handleCourseChange} placeholder="Aryabhatta concept school" required error={courseErrors.intermediateName} />

          <div className="flex flex-col gap-3">
            <label className="font-medium text-[16px] text-black">Mode <span className="text-red-500">*</span></label>
            <SlidingIndicator
              options={["Offline", "Online", "Hybrid"] as const}
              activeOption={currentCourse.mode || "Offline"}
              onOptionChange={(val) => setCourses((prev) => prev.map((c) => (c.id === selectedCourseId ? { ...c, mode: val } : c)))}
              size="md"
            />
          </div>

          <InputField label="Course Duration" name="courseDuration" value={currentCourse.courseDuration || ""} onChange={handleCourseChange} placeholder="e.g. 3 months" required />
          <InputField label="Starting date" name="startDate" value={currentCourse.startDate || ""} onChange={handleCourseChange} type="date" required />

          <InputField label="Language of Class" name="classlanguage" value={currentCourse.classlanguage || ""} onChange={handleCourseChange} placeholder="Eg English" required />
          <InputField label="Ownership Type" name="ownershipType" value={currentCourse.ownershipType || ""} onChange={handleCourseChange} isSelect options={["Government", "Private", "Semi-Government", "Aided", "Unaided"]} placeholder="Select Ownership type" required />

          <InputField label="Intermediate Type" name="intermediateType" value={currentCourse.intermediateType || ""} onChange={handleCourseChange} isSelect options={["Junior College", "Senior Secondary", "Higher Secondary", "Intermediate", "Pre-University"]} required />
          <InputField label="Curriculum Type" name="curriculumType" value={currentCourse.curriculumType || ""} onChange={handleCourseChange} isSelect options={["State board", "CBSE", "ICSE", "IB", "Cambridge", "Other"]} required />

          {/* OPERATIONAL DAYS (LEFT) */}
          <div className="flex flex-col gap-3">
            <label className="font-medium text-[16px] text-black">
              Operational Day&apos;s
            </label>
            <div className="flex flex-wrap gap-1">
              {["Mon", "Tues", "Wed", "Thur", "Fri", "Sat"].map((day) => (
                <Button
                  key={day}
                  type="button"
                  onClick={() => handleOperationalDayChange?.(day)}
                  className={`h-[40px] px-3 rounded-[8px] border text-xs transition-colors ${(currentCourse.operationalDays || []).includes(day)
                    ? "bg-[#0222D7] border-[#0222D7] text-white hover:bg-[#0222D7]"
                    : "bg-white border-[#DADADD] text-[#697282] hover:bg-gray-100"
                    }`}
                >
                  {day}
                </Button>
              ))}
            </div>
          </div>

          {/* OPERATIONAL TIMES (RIGHT) */}
          <div className="flex flex-col gap-3">
            <label className="font-medium text-[16px] text-gray-900">
              Operational Time&apos;s <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-4">
              {[{ label: "From", name: "openingTime" as const }, { label: "To", name: "closingTime" as const }].map((time) => (
                <div key={time.name} className="flex items-center flex-1 h-[48px] border border-[#DADADD] rounded-xl bg-white overflow-hidden focus-within:ring-1 focus-within:ring-[#0222D7]">
                  <div className="flex items-center gap-2 px-3 flex-1 h-full">
                    <Clock size={18} className="text-[#697282]" />
                    <input type="text" name={time.name} placeholder={time.label} value={currentCourse[time.name] || ""} onChange={handleCourseChange} className="w-full bg-transparent text-[15px] outline-none" />
                  </div>
                  <div className="relative h-full flex items-center border-l border-[#DADADD] bg-gray-50/30">
                    <select className="appearance-none pl-3 pr-8 h-full bg-transparent text-[13px] font-bold outline-none cursor-pointer" value={currentCourse[`${time.name}Period`] || "AM"} onChange={(e) => handlePeriodChange(time.name, e.target.value)}>
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>


      {/* SECTION 2: LOCATION & ADDRESS */}
      <div className="space-y-6">
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
            error={courseErrors.headquatersAddress}
            required
            disabled={currentCourse.createdBranch === "Main"}
          />

          <SearchableSelect
            label="State"
            name="state"
            value={currentCourse.state || ""}
            onChange={handleCourseChange}
            options={STATE_OPTIONS}
            placeholder="Select state"
            required
            error={courseErrors.state}
            disabled={false}
          />

          <SearchableSelect
            label="District"
            name="district"
            value={currentCourse.district || ""}
            onChange={handleCourseChange}
            options={districtOptions}
            placeholder={currentCourse.state ? "Select district" : "Select state first"}
            required
            error={courseErrors.district}
            disabled={!currentCourse.state}
          />

          <InputField
            label="Town"
            name="town"
            value={currentCourse.town || ""}
            onChange={handleCourseChange}
            placeholder="Medchal"
            error={courseErrors.town}
            required
            disabled={false}
          />
        </div>
      </div>

      {/* SECTION 3: CLASS TYPE & SPECIALIZATION (Purple Section) */}
      <div className="bg-[#DCDCFF] p-6 rounded-[12px] border border-[#E9D7FE] shadow-sm space-y-6">
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
          <InputField label="Year" name="yearString" value={currentCourse.yearString || ""} onChange={handleCourseChange} isSelect options={["1st Year", "2nd Year"]} placeholder="select the year" />
          <InputField label="Class Type" name="classType" value={currentCourse.classType || ""} onChange={handleCourseChange} isSelect options={["Regular", "Vocational", "Honours", "Other"]} placeholder="Select Class type" required />
          <InputField label="Specialization" name="specialization" value={currentCourse.specialization || ""} onChange={handleCourseChange} isSelect options={["MPC", "BiPC", "CEC", "HEC", "MEC"]} placeholder="Select Specialization type" required />
          <InputField label="Fee's" name="priceOfCourse" value={currentCourse.priceOfCourse || ""} onChange={handleCourseChange} placeholder="Enter Fee's" type="number" required />
        </div>
      </div>

      {/* SECTION 4: FACILITIES & CAMPUS PHOTOS */}
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8 items-start">
          {([
            { label: "Out door Playground?", name: "playground" },
            { label: "Pickup/Drop services (Bus)?", name: "pickupDropService" },
            { label: "Hostel facility?", name: "hostelFacility" },
            { label: "EMI Options", name: "emioptions" },
            { label: "Payment (Partly Payment)?", name: "partlyPayment" },
          ] as const).map((item) => (
            <div key={item.name} className="flex flex-col gap-3">
              <label className="font-medium text-[16px] text-gray-900">{item.label}</label>
              <div className="flex gap-8">
                {["Yes", "No"].map((opt) => (
                  <label key={opt} className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                    <input type="radio" name={item.name} value={opt} checked={currentCourse[item.name] === opt} onChange={handleCourseChange} className="accent-[#0222D7] w-4 h-4 cursor-pointer" />
                    {opt}
                  </label>
                ))}
              </div>
            </div>
          ))}

          {/* Add Photos of campus Section */}
          <div className="space-y-3">
            <label className="font-medium text-[16px] text-gray-900">
              Add Photos of campus<span className="text-red-500">*</span>
            </label>
            <div className="relative group">
              <input
                type="file"
                id="campus-photos-input"
                accept="image/*"
                onChange={(e) => handleFileChange(e, "intermediateImage")}
                className="hidden"
              />
              <label
                htmlFor="campus-photos-input"
                className="flex items-center justify-center w-full h-[70px] bg-white border border-[#DADADD] rounded-[12px] cursor-pointer hover:bg-gray-50 transition-all gap-3 overflow-hidden"
              >
                {/* ✅ FIX: Removed the requirement for File object. Check only the preview URL */}
                {currentCourse.intermediateImagePreviewUrl ? (
                  <img
                    src={currentCourse.intermediateImagePreviewUrl}
                    alt="Campus Preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <>
                    <div className="border border-slate-400 rounded-full p-1">
                      <Upload className="text-slate-500 w-3 h-3" />
                    </div>
                    <span className="text-[13px] text-slate-500 font-normal">Add Photos of campus</span>
                  </>
                )}
              </label>
            </div>
          </div>
        </div>

        {/* Course Image and Brochure Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6 items-end">
          {/* Add Image Section */}
          <div className="space-y-3">
            <label className="font-medium text-[16px] text-gray-900">
              Add Image <span className="text-red-500">*</span>
            </label>
            <div className="relative group">
              <input
                type="file"
                id="college-image-input"
                accept="image/*"
                onChange={(e) => handleFileChange(e, "image")}
                className="hidden"
              />
              <label
                htmlFor="college-image-input"
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
                id="college-brochure-input"
                accept="application/pdf"
                onChange={(e) => handleFileChange(e, "brochure")}
                className="hidden"
              />
              <label
                htmlFor="college-brochure-input"
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
    </div>
  );
}