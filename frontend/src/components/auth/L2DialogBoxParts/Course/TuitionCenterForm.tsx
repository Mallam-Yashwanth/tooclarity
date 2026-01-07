"use client";

import { Upload, User, Book, Building, Clock, IndianRupee, Plus, X, ChevronDown, GraduationCap, Briefcase } from "lucide-react";
import type { Course } from "../../L2DialogBox";
import InputField from "@/components/ui/InputField";
import { Dispatch, SetStateAction, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import SlidingIndicator from "@/components/ui/SlidingIndicator";
import { getMyInstitution } from "@/lib/api";
import SearchableSelect from "@/components/ui/SearchableSelect";
import { STATE_DISTRICT_MAP, STATE_OPTIONS } from "@/constants/stateDistricts";

interface TuitionCenterFormProps {
  currentCourse: Course;
  handleCourseChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => void;
  handleOperationalDayChange: (day: string) => void;
  handleFileChange: (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "image" | "brochure" | "tuitionImage"
  ) => void;
  courseErrors: Record<string, string>;
  setCourses: Dispatch<SetStateAction<Course[]>>;
  courses: Course[];
  selectedCourseId: number;
  setSelectedCourseId: (id: number) => void;
  addNewCourse: () => void;
  deleteCourse: (id: number) => void;
  labelVariant?: 'course' | 'program';
  uniqueRemoteBranches: Array<{ _id: string; branchName: string; branchAddress?: string; state?: string; district?: string; town?: string; locationUrl?: string }>;
  selectedBranchId: string;
  isSubscriptionProgram?: boolean;
}

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
  courses,
  setCourses,
  selectedCourseId,
  courseErrors = {},
  setSelectedCourseId,
  addNewCourse,
  deleteCourse,
  labelVariant = 'course',
  uniqueRemoteBranches,
  selectedBranchId,
  isSubscriptionProgram = true,
}: TuitionCenterFormProps) {
  const isProgram = labelVariant === 'program';

  useEffect(() => {
    if (isSubscriptionProgram && selectedBranchId && currentCourse.createdBranch === "Main") {
      const branch = uniqueRemoteBranches.find(b => b._id === selectedBranchId);
      if (branch) {
        setCourses(prev => prev.map(c => 
          c.id === selectedCourseId ? {
            ...c,
            // Only sync these two specific fields
            aboutBranch: branch.branchAddress || "",
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
              locationURL: "",
            };
          }
          return { ...c, [name]: value };
        }
        return c;
      })
    );
  };

  const convertTo24Hour = (time: string, period: string): string => {
    if (!time) return "";
    let [hours, minutes] = time.split(":").map(Number);
    if (isNaN(hours)) return "";

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
    const time24 = convertTo24Hour(timeValue, period);

    setCourses((prev) =>
      prev.map((c) =>
        c.id === selectedCourseId
          ? { ...c, [`${name}Period`]: period, [name]: timeValue }
          : c
      )
    );
  };
  const districtOptions = useMemo(() => {
    if (!currentCourse.state) return [];
    return STATE_DISTRICT_MAP[currentCourse.state] || [];
  }, [currentCourse.state]);

  const [activeAcademicIdx, setActiveAcademicIdx] = useState(0);
  const [activeFacultyIdx, setActiveFacultyIdx] = useState(0);

  const addAcademicRow = () => {
    const newIdx = (currentCourse.academicDetails?.length || 0);
    setCourses(prev => prev.map(c => c.id === selectedCourseId ? {
      ...c,
      academicDetails: [...(c.academicDetails || []), { subject: '', classTiming: '', specialization: '', monthlyFees: '' }]
    } : c));
    setActiveAcademicIdx(newIdx);
  };

  const deleteAcademicRow = (e: React.MouseEvent, idxToDelete: number) => {
    e.stopPropagation();
    setCourses(prev => prev.map(c => {
      if (c.id !== selectedCourseId) return c;
      const updated = (c.academicDetails || []).filter((_, i) => i !== idxToDelete);
      return { ...c, academicDetails: updated };
    }));
    if (activeAcademicIdx >= idxToDelete && activeAcademicIdx > 0) {
      setActiveAcademicIdx(prev => prev - 1);
    }
  };

  // --- FACULTY LOGIC ---
  const addFacultyRow = () => {
    const newIdx = (currentCourse.facultyDetails?.length || 0);
    setCourses(prev => prev.map(c => c.id === selectedCourseId ? {
      ...c,
      facultyDetails: [...(c.facultyDetails || []), { name: '', qualification: '', experience: '', subjectTeach: '' }]
    } : c));
    setActiveFacultyIdx(newIdx);
  };

  const deleteFacultyRow = (e: React.MouseEvent, idxToDelete: number) => {
    e.stopPropagation();
    setCourses(prev => prev.map(c => {
      if (c.id !== selectedCourseId) return c;
      const updated = (c.facultyDetails || []).filter((_, i) => i !== idxToDelete);
      return { ...c, facultyDetails: updated };
    }));
    if (activeFacultyIdx >= idxToDelete && activeFacultyIdx > 0) {
      setActiveFacultyIdx(prev => prev - 1);
    }
  };

  return (
    <div className="space-y-8">
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
        <InputField label="Tuition centre name" name="courseName" value={currentCourse.courseName} onChange={handleCourseChange} placeholder="Aryabhatta tuition centre" required />

        <div className="flex flex-col gap-3">
          <label className="font-medium text-[16px] text-black dark:text-slate-200">Mode <span className="text-red-500">*</span></label>
          <SlidingIndicator options={["Offline", "Online", "Hybrid"] as const} activeOption={currentCourse.mode} onOptionChange={(val) => setCourses(courses.map(c => c.id === selectedCourseId ? { ...c, mode: val } : c))} size="md" />
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-medium text-[16px]">Operational Day's<span className="text-red-500 ml-1">*</span></label>
          <div className="flex flex-wrap gap-2">
            {["Mon", "Tues", "Wed", "Thur", "Fri", "Sat"].map((day) => (
              <button
                key={day}
                type="button"
                onClick={() => handleOperationalDayChange(day)}
                className={`px-2 py-2 rounded-lg text-sm border transition-colors ${currentCourse.operationalDays.includes(day)
                  ? "bg-blue-50 border-blue-200 text-blue-700 font-medium"
                  : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                  }`}
              >
                {day}
              </button>
            ))}
          </div>
          {courseErrors.operationalDays && <p className="text-sm text-red-600 mt-1">{courseErrors.operationalDays}</p>}
        </div>
        <div className="flex flex-col gap-3">
          <label className="font-medium text-[16px] text-gray-900">
            Operational Time's <span className="text-red-500">*</span>
          </label>

          <div className="flex items-center gap-4">
            {/* FROM CONTAINER */}
            <div className="flex items-center flex-1 h-[38px] border border-[#DADADD] rounded-md bg-white shadow-sm focus-within:ring-1 focus-within:ring-[#0222D7] overflow-hidden">
              {/* Input Part */}
              <div className="flex items-center gap-1 px-3 flex-1 h-full">
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
                  className="appearance-none pl-2 pr-8 h-full bg-transparent text-[13px] font-bold text-gray-700 outline-none cursor-pointer"
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
            <div className="flex items-center flex-1 h-[38px] border border-[#DADADD] rounded-md bg-white shadow-sm focus-within:ring-1 focus-within:ring-[#0222D7] overflow-hidden">
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
                  className="appearance-none pl-2 pr-8 h-full bg-transparent text-[13px] font-bold text-gray-700 outline-none cursor-pointer"
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

        <div className="flex flex-col gap-3">
          <label className="font-medium text-[16px]">Subject<span className="text-red-500 ml-1">*</span></label>
          <IconInput icon={<Book size={18} />}>
            <input
              name="subject"
              value={currentCourse.subject}
              onChange={handleCourseChange}
              placeholder="Enter subject name"
              className={`w-full pl-10 pr-3 py-3 border rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all ${courseErrors.subject ? "border-red-500" : "border-gray-300"
                }`}
            />
          </IconInput>
          {courseErrors.subject && <p className="text-sm text-red-600 mt-1">{courseErrors.subject}</p>}
        </div>

        <InputField
          label="Class Size"
          name="classSize"
          value={currentCourse.classSize}
          onChange={handleCourseChange}
          placeholder="Enter no of students per class"
          error={courseErrors.classSize}
          required
        />
      </div>

      {/* LOCATION BOX SECTION [cite: 14-25] */}

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
                error={courseErrors.locationURL}
                required
                disabled={currentCourse.createdBranch === "Main"} 
              />
          
              <InputField
                label="headquarters address"
                name="aboutBranch"
                value={currentCourse.aboutBranch || ""}
                onChange={handleCourseChange}
                placeholder="2-3, Uppal Hills Colony, Peerzadiguda"
                error={courseErrors.aboutBranch}
                required
                disabled={currentCourse.createdBranch === "Main"}
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
                disabled={false} 
              />
          
              <SearchableSelect
                label="District"
                name="district"
                value={currentCourse.district}
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
                value={currentCourse.town}
                onChange={handleCourseChange}
                placeholder="Medchal"
                error={courseErrors.town}
                required
                disabled={false} 
              />

      </div>


      {/* ACADEMIC DETAILS CONTAINER */}
      <div className="bg-[#DCDCFF] dark:bg-slate-900/50 p-6 rounded-[12px] border border-blue-100 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex items-center justify-between gap-4 overflow-x-auto pb-2 scrollbar-hide">
          <div className="flex items-center gap-2">
            {(currentCourse.academicDetails || [{}]).map((_, idx) => (
              <div key={idx} className="relative group">
                <button
                  onClick={() => setActiveAcademicIdx(idx)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold border flex items-center gap-2 transition-all ${activeAcademicIdx === idx
                    ? "bg-[#0222D7] text-white border-[#0222D7]"
                    : "bg-white dark:bg-slate-800 text-gray-600 border-gray-200 dark:border-slate-700"
                    }`}
                >
                  Subject {idx + 1}
                  {(currentCourse.academicDetails?.length || 0) > 1 && (
                    <X
                      size={14}
                      className="hover:text-red-400 cursor-pointer"
                      onClick={(e) => deleteAcademicRow(e, idx)}
                    />
                  )}
                </button>
              </div>
            ))}
          </div>
          <button onClick={addAcademicRow} type="button" className="flex-shrink-0 bg-[#0222D7] text-white px-4 py-1.5 rounded-md text-xs font-bold flex items-center gap-2 hover:bg-blue-700 transition-colors">
            <Plus size={14} /> Add more
          </button>
        </div>

        {/* ACTIVE ACADEMIC FORM GRID */}
        {currentCourse.academicDetails?.[activeAcademicIdx] && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
            <InputField
              label="Subject *"
              name={`academicDetails.${activeAcademicIdx}.subject`}
              value={currentCourse.academicDetails[activeAcademicIdx].subject || ""}
              onChange={handleCourseChange}
              isSelect
              options={["Math", "Science", "English", "Physics", "Chemistry"]}
              placeholder="Select Subject Type"
              required
            />
            <div className="flex flex-col gap-2">
              <label className="font-medium text-[16px] dark:text-slate-200">Class timing *</label>
              <IconInput icon={<Clock size={18} />}>
                <input
                  name={`academicDetails.${activeAcademicIdx}.classTiming`}
                  value={currentCourse.academicDetails[activeAcademicIdx].classTiming || ""}
                  onChange={handleCourseChange}
                  placeholder="Enter Fee's"
                  className="w-full pl-10 pr-3 py-2 border rounded-lg bg-white dark:bg-slate-800 text-sm outline-none border-gray-300 dark:border-slate-700 dark:text-slate-200"
                />
              </IconInput>
            </div>
            <InputField
              label="Specialization *"
              name={`academicDetails.${activeAcademicIdx}.specialization`}
              value={currentCourse.academicDetails[activeAcademicIdx].specialization || ""}
              onChange={handleCourseChange}
              isSelect
              options={["Foundation", "IIT-JEE", "NEET", "Olympiad"]}
              placeholder="Select Specialization type"
              required
            />
            <div className="flex flex-col gap-2">
              <label className="font-medium text-[16px] dark:text-slate-200">Monthly Fee's *</label>
              <IconInput icon={<IndianRupee size={18} />}>
                <input
                  type="number"
                  name={`academicDetails.${activeAcademicIdx}.monthlyFees`}
                  value={currentCourse.academicDetails[activeAcademicIdx].monthlyFees || ""}
                  onChange={handleCourseChange}
                  placeholder="Enter Fee's"
                  className="w-full pl-10 pr-3 py-2 border rounded-lg bg-white dark:bg-slate-800 text-sm outline-none border-gray-300 dark:border-slate-700 dark:text-slate-200"
                />
              </IconInput>
            </div>
          </div>
        )}
      </div>

      {/* FACULTY DETAILS CONTAINER */}
      <div className="bg-[#DCDCFF] dark:bg-slate-900/50 p-6 rounded-[12px] border border-blue-100 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex items-center justify-between gap-4 overflow-x-auto pb-2 scrollbar-hide">
          <div className="flex items-center gap-2">
            {(currentCourse.facultyDetails || [{}]).map((_, idx) => (
              <div key={idx} className="relative group">
                <button
                  onClick={() => setActiveFacultyIdx(idx)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold border flex items-center gap-2 transition-all ${activeFacultyIdx === idx
                    ? "bg-[#0222D7] text-white border-[#0222D7]"
                    : "bg-white dark:bg-slate-800 text-gray-600 border-gray-200 dark:border-slate-700"
                    }`}
                >
                  Faculty {idx + 1}
                  {(currentCourse.facultyDetails?.length || 0) > 1 && (
                    <X
                      size={14}
                      className="hover:text-red-400 cursor-pointer"
                      onClick={(e) => deleteFacultyRow(e, idx)}
                    />
                  )}
                </button>
              </div>
            ))}
          </div>
          <button onClick={addFacultyRow} type="button" className="flex-shrink-0 bg-[#0222D7] text-white px-4 py-1.5 rounded-md text-xs font-bold flex items-center gap-2 hover:bg-blue-700 transition-colors">
            <Plus size={14} /> Add more
          </button>
        </div>

        {/* ACTIVE FACULTY FORM GRID */}
        {currentCourse.facultyDetails?.[activeFacultyIdx] && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
            <div className="flex flex-col gap-2">
              <label className="font-medium text-[16px] dark:text-slate-200">Faculty name *</label>
              <IconInput icon={<User size={18} />}>
                <input
                  name={`facultyDetails.${activeFacultyIdx}.name`}
                  value={currentCourse.facultyDetails[activeFacultyIdx].name || ""}
                  onChange={handleCourseChange}
                  placeholder="Enter Name"
                  className="w-full pl-10 pr-3 py-2 border rounded-lg bg-white dark:bg-slate-800 text-sm outline-none border-gray-300 dark:border-slate-700 dark:text-slate-200"
                  required
                />
              </IconInput>
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-medium text-[16px] dark:text-slate-200">Experience *</label>
              <IconInput icon={<Briefcase size={18} />}>
                <input
                  name={`facultyDetails.${activeFacultyIdx}.experience`}
                  value={currentCourse.facultyDetails[activeFacultyIdx].experience || ""}
                  onChange={handleCourseChange}
                  placeholder="Years"
                  className="w-full pl-10 pr-3 py-2 border rounded-lg bg-white dark:bg-slate-800 text-sm outline-none border-gray-300 dark:border-slate-700 dark:text-slate-200"
                />
              </IconInput>
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-medium text-[16px] dark:text-slate-200">Qualification *</label>
              <IconInput icon={<GraduationCap size={18} />}>
                <input
                  name={`facultyDetails.${activeFacultyIdx}.qualification`}
                  value={currentCourse.facultyDetails[activeFacultyIdx].qualification || ""}
                  onChange={handleCourseChange}
                  placeholder="Qualification"
                  className="w-full pl-10 pr-3 py-2 border rounded-lg bg-white dark:bg-slate-800 text-sm outline-none border-gray-300 dark:border-slate-700 dark:text-slate-200"
                  required
                />
              </IconInput>
            </div>
            <InputField
              label="Subject you teach *"
              name={`facultyDetails.${activeFacultyIdx}.subjectTeach`}
              value={currentCourse.facultyDetails[activeFacultyIdx].subjectTeach || ""}
              onChange={handleCourseChange}
              isSelect
              options={["Physics", "Chemistry", "Math", "Biology"]}
              placeholder="Select Subject Type"
            />
          </div>
        )}
      </div>

      {/* PARTLY PAYMENT & CAMPUS PHOTOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
        {/* Partly Payment (Left) */}
        <div className="flex flex-col gap-3">
          <label className="font-medium text-[16px] text-gray-900 dark:text-slate-200">
            Partly payment available? *
          </label>
          <div className="flex gap-4">
            {["Yes", "No"].map((option) => (
              <label key={option} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="partlyPayment"
                  value={option}
                  checked={currentCourse.partlyPayment === option}
                  onChange={handleCourseChange}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-slate-300">{option}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="font-medium text-[16px] text-gray-900">Center Images</label>
          <div className="relative group">
            <input
              type="file"
              id="tuition-image-input"
              accept="image/*"
              // ✅ Change "image" to "centerImage"
              onChange={(e) => handleFileChange(e, "tuitionImage")}
              className="hidden"
            />
            <label
              htmlFor="center-image-input"
              className="flex items-center justify-between w-full h-[42px] px-4 bg-[#F5F6F9] border border-[#DADADD] rounded-lg cursor-pointer hover:bg-gray-100 transition-all overflow-hidden"
            >
              {/* ✅ Update check to use tuitionImagePreviewUrl */}
              {currentCourse.tuitionImagePreviewUrl ? (
                <div className="flex items-center gap-2 w-full">
                  <img
                    src={currentCourse.tuitionImagePreviewUrl}
                    alt="Preview"
                    className="h-8 w-8 object-cover rounded"
                  />
                  <span className="text-xs text-gray-600 truncate">Tuition Image Selected</span>
                </div>
              ) : (
                <>
                  <span className="text-sm text-gray-400 font-normal">Upload center images</span>
                  <Upload className="text-gray-400 w-4 h-4" />
                </>
              )}
            </label>
          </div>
        </div>
      </div>

      {/* IMAGE & BROCHURE UPLOADS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
        {/* Add Image (Left) */}
        <div className="flex flex-col gap-2">
          <label className="font-medium text-[16px] text-gray-900 dark:text-slate-200">
            Add image *
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
              className="flex flex-col items-center justify-center w-full h-[110px] bg-white dark:bg-slate-800 border border-[#DADADD] dark:border-slate-700 rounded-[12px] cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700 transition-all overflow-hidden"
            >
              {currentCourse.imagePreviewUrl ? (
                <img src={currentCourse.imagePreviewUrl} alt="Preview" className="w-full h-full object-contain p-2" />
              ) : (
                <div className="flex flex-col items-center gap-2 text-center px-4">
                  <div className="border border-slate-400 dark:border-slate-500 rounded-full p-1">
                    <Upload className="text-slate-500 dark:text-slate-400 w-4 h-4" />
                  </div>
                  <span className="text-[13px] text-slate-500 dark:text-slate-400 font-normal">
                    Upload Course image (jpg/jpeg)
                  </span>
                </div>
              )}
            </label>
          </div>
        </div>

        {/* Add Brochure (Right) */}
        <div className="flex flex-col gap-2">
          <label className="font-medium text-[16px] text-gray-900 dark:text-slate-200">
            Add Brochure *
          </label>
          <div className="relative group">
            <input
              type="file"
              id="course-brochure-input"
              accept="application/pdf"
              onChange={(e) => handleFileChange(e, "brochure")}
              className="hidden"
            />
            <label
              htmlFor="course-brochure-input"
              className="flex flex-col items-center justify-center w-full h-[110px] bg-white dark:bg-slate-800 border border-[#DADADD] dark:border-slate-700 rounded-[12px] cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700 transition-all overflow-hidden"
            >
              {currentCourse.brochurePreviewUrl ? (
                <div className="flex flex-col items-center gap-1">
                  <div className="text-red-500 font-bold text-xl">PDF</div>
                  <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">Brochure Added</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-center px-4">
                  <div className="border border-slate-400 dark:border-slate-500 rounded-full p-1">
                    <Upload className="text-slate-500 dark:text-slate-400 w-4 h-4" />
                  </div>
                  <span className="text-[13px] text-slate-500 dark:text-slate-400 font-normal">
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