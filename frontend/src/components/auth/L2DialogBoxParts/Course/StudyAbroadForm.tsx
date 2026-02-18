"use client";

import InputField from "@/components/ui/InputField";
import { FileText, Plus, Upload, X } from "lucide-react";
import type { Course } from "../../L2DialogBox";
import { ChangeEvent, useEffect, useMemo } from "react";
import Image from "next/image";
import StateDistrictFields from "./common/StateDistrictFields";
import { getMyInstitution } from "@/lib/api";
import { STATE_DISTRICT_MAP, STATE_OPTIONS } from "@/constants/stateDistricts";
import SearchableSelect from "@/components/ui/SearchableSelect";
import { Button } from "@/components/ui/button";

interface StudyAbroadFormProps {
  currentCourse: Course;
  handleCourseChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => void;
  handleFileChange: (
    e: ChangeEvent<HTMLInputElement>,
    type: "image" | "brochure" | "businessProof" | "panAadhaar" | "consultancyImage"
  ) => void;
  setSelectedCourseId: (id: number) => void;
  setCourses: React.Dispatch<React.SetStateAction<Course[]>>;
  courses: Course[];
  selectedCourseId: number;
  courseErrors: Record<string, string>;
  addNewCourse: () => void;
  deleteCourse: (id: number) => void;
  labelVariant?: "course" | "program";
  uniqueRemoteBranches?: Array<{ _id: string; branchName: string; branchAddress?: string; state?: string; district?: string; town?: string; locationUrl?: string }>;
  selectedBranchId?: string;
  isSubscriptionProgram?: boolean;
}

const countries = [
  "Select Country",
  "USA",
  "Canada",
  "UK",
  "Australia",
  "New Zealand",
  "Germany",
  "France",
  "Italy",
  "Spain",
  "Netherlands",
  "Switzerland",
  "Sweden",
  "Finland",
  "Austria",
  "Ireland",
  "Poland",
  "Lithuania",
  "Japan",
  "Singapore",
  "Malaysia",
  "UAE",
  "India",
];

const academicOfferings = [
  "Select Academic type",
  "Undergraduate",
  "Graduate",
  "Postgraduate",
  "Diploma",
  "Certificate",
  "Professional Course",
];


export default function StudyAbroadForm({
  currentCourse,
  handleCourseChange,
  handleFileChange,
  setSelectedCourseId,
  setCourses,
  courses,
  selectedCourseId,
  courseErrors = {},
  addNewCourse,
  deleteCourse,
  labelVariant = "course",
  uniqueRemoteBranches = [],
  selectedBranchId,
  isSubscriptionProgram = true,
}: StudyAbroadFormProps) {
  const yesNoOptions = ["Yes", "No"];

  useEffect(() => {
    if (isSubscriptionProgram && selectedBranchId && currentCourse.createdBranch === "Main") {
      const branch = uniqueRemoteBranches.find(b => b._id === selectedBranchId);
      if (branch) {
        setCourses(prev => prev.map(c =>
          c.id === selectedCourseId ? {
            ...c,
            // Only sync these two specific fields
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
    <div className="space-y-8">
      {/* Basic Fields */}
      <div className="grid md:grid-cols-2 gap-6 dark:text-slate-200">
        <InputField
          label="Consultancy name"
          name="consultancyName"
          value={currentCourse.consultancyName || ""}
          onChange={handleCourseChange}
          placeholder="Enter Consultancy name"
          error={courseErrors.consultancyName}
          required
        />

        <InputField
          label="Overall student admissions achieved"
          name="studentAdmissions"
          value={currentCourse.studentAdmissions || ""}
          onChange={handleCourseChange}
          placeholder="Enter Students Count"
          type="number"
          error={courseErrors.studentAdmissions}
          required
        />
      </div>

      {/* LOCATION BOX SECTION [cite: 14-25] */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-4">
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
        <div className="grid md:grid-cols-2 gap-6 dark:text-slate-200">
          <InputField
            label="Select Country"
            name="countriesOffered"
            value={currentCourse.countriesOffered || ""}
            onChange={handleCourseChange}
            isSelect
            options={countries}
            placeholder="Select Country"
            error={courseErrors.countriesOffered}
            required
          />

          <InputField
            label="Academic Offerings"
            name="academicOfferings"
            value={currentCourse.academicOfferings || ""}
            onChange={handleCourseChange}
            isSelect
            options={academicOfferings}
            placeholder="Select Academic type"
            error={courseErrors.academicOfferings}
            required
          />

          <InputField
            label="Budget"
            name="budget"
            value={currentCourse.budget || ""}
            onChange={handleCourseChange}
            placeholder="Budget"
            error={courseErrors.budget}
            required
          />

          <InputField
            label="Student send till now"
            name="studentsSent"
            value={currentCourse.studentsSent || ""}
            onChange={handleCourseChange}
            placeholder="Enter Count"
            error={courseErrors.studentsSent}
            required
          />
        </div>
      </div>



      {/* Merged L3 Consultancy Services Section */}


      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8 items-start transition-colors duration-300">
        {([
          { label: "Application Assistance", name: "applicationAssistance" },
          { label: "Visa Processing Support", name: "visaProcessingSupport" },
          { label: "Pre-departure orientation", name: "preDepartureOrientation" },
          { label: "Accommodation assisstance", name: "accommodationAssistance" },
          { label: "Education loans/Financial aid guidance", name: "educationLoans" },
          { label: "Post-arrival support", name: "postArrivalSupport" },

        ] as const).map((item) => (
          <div key={item.name} className="flex flex-col gap-3">
            <label className="font-medium text-[16px] text-gray-900 dark:text-slate-200">
              {item.label} <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-8">
              {["Yes", "No"].map((opt) => (
                <label
                  key={opt}
                  className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700 dark:text-slate-300"
                >
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
            {courseErrors[item.name] && (
              <p className="text-red-500 text-xs mt-1">{courseErrors[item.name]}</p>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8 items-start">
        {/* Row Left: Part-time Help Radio [cite: 217-218] */}
        <div className="flex flex-col gap-3">
          <label className="font-medium text-[16px] text-gray-900 dark:text-slate-200">
            Parttime Opportunities/Help <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-8 h-[50px] items-center">
            {["Yes", "No"].map((opt) => (
              <label key={opt} className="flex items-center gap-2 cursor-pointer text-sm font-medium dark:text-slate-300">
                <input
                  type="radio"
                  name="partTimeHelp"
                  value={opt}
                  checked={currentCourse.partTimeHelp === opt}
                  onChange={handleCourseChange}
                  className="accent-[#0222D7] w-4 h-4 cursor-pointer"
                  required
                />
                {opt}
              </label>
            ))}
          </div>
        </div>

        {/* Row Right: Consultancy Images Upload [cite: 220-221, 225] */}
        <div className="space-y-3">
          <label className="font-medium text-[16px] text-gray-900 dark:text-slate-200">
            Consultancy Images <span className="text-red-500">*</span>
          </label>
          <div
            onClick={() => document.getElementById('consultancy-images-input')?.click()}
            className="flex items-center justify-center w-full h-[70px] bg-white dark:bg-slate-800 border border-[#DADADD] dark:border-slate-700 rounded-[12px] cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700 transition-all gap-3 overflow-hidden px-4"
          >
            {/* ✅ CHECK: Use consultancyImage keys specifically */}
            {(currentCourse.consultancyImage || currentCourse.consultancyImagePreviewUrl) ? (
              <div className="flex items-center gap-3 w-full">
                <div className="relative h-10 w-10 shrink-0">
                  <img
                    src={currentCourse.consultancyImagePreviewUrl}
                    alt="Consultancy Preview"
                    className="h-full w-full object-cover rounded-md border border-blue-200"
                  />
                </div>
                <div className="flex flex-col truncate">
                  <span className="text-[13px] text-blue-600 font-bold truncate">Image Selected</span>
                  <span className="text-[10px] text-gray-400 truncate">Click to change photo</span>
                </div>
              </div>
            ) : (
              <>
                <div className="border border-slate-400 dark:border-slate-500 rounded-full p-1 flex-shrink-0">
                  <Upload className="text-slate-500 dark:text-slate-400 w-3 h-3" />
                </div>
                <span className="text-[13px] text-slate-500 dark:text-slate-400 font-normal truncate">
                  Photos of your consultancy
                </span>
              </>
            )}

            <input
              id="consultancy-images-input"
              type="file"
              className="hidden"
              accept="image/*"
              onChange={(e) => handleFileChange(e, "consultancyImage")} // ✅ Pass unique type
            />
          </div>
          {courseErrors.consultancyImageUrl && (
            <p className="text-red-500 text-xs mt-1">{courseErrors.consultancyImageUrl}</p>
          )}
        </div>
      </div>


      {/* Image and Brochure Upload */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
        <div className="space-y-3">
          <label className="font-medium text-[16px] text-gray-900">Add Image <span className="text-red-500">*</span></label>
          <div className="relative group">
            <input type="file" id="course-image-input" accept="image/*" onChange={(e) => handleFileChange(e, "image")} className="hidden" />
            <label htmlFor="course-image-input" className="flex flex-col items-center justify-center w-full h-[110px] bg-white border border-[#DADADD] rounded-[12px] cursor-pointer hover:bg-gray-50 transition-all overflow-hidden">
              {/* Logic: Check for the File object OR the Preview URL */}
              {(currentCourse.image || currentCourse.imagePreviewUrl) ? (
                <div className="relative w-full h-full flex items-center justify-center bg-gray-50">
                  <img
                    src={currentCourse.imagePreviewUrl}
                    alt="Preview"
                    className="h-full w-full object-contain p-2"
                  />
                  <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-xs font-bold text-white bg-black/40 px-2 py-1 rounded">Change Image</span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div className="border border-slate-400 rounded-full p-1">
                    <Upload className="text-slate-500 w-4 h-4" />
                  </div>
                  <span className="text-[13px] text-slate-500">Upload Course Image (jpg / jpeg)</span>
                </div>
              )}
            </label>
          </div>
          {courseErrors.imageUrl && <p className="text-xs text-red-500 mt-1">{courseErrors.imageUrl}</p>}
        </div>

        <div className="space-y-3">
          <label className="font-medium text-[16px] text-gray-900">Add Brochure <span className="text-red-500">*</span></label>
          <div className="relative group">
            <input type="file" id="brochure-input" accept="application/pdf" onChange={(e) => handleFileChange(e, "brochure")} className="hidden" />
            <label htmlFor="brochure-input" className="flex flex-col items-center justify-center w-full h-[110px] bg-white border border-[#DADADD] rounded-[12px] cursor-pointer hover:bg-gray-50 transition-all overflow-hidden">

              {/* Updated Logic: Check for file object OR preview URL */}
              {(currentCourse.brochure || currentCourse.brochurePreviewUrl) ? (
                <div className="flex flex-col items-center gap-1">
                  <FileText className="text-red-500 w-8 h-8" />
                  <span className="text-sm text-slate-700 font-bold">Brochure Attached</span>
                  <span className="text-[10px] text-gray-500 truncate max-w-[200px]">
                    {currentCourse.brochure?.name || "View PDF"}
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div className="border border-slate-400 rounded-full p-1">
                    <Upload className="text-slate-500 w-4 h-4" />
                  </div>
                  <span className="text-[13px] text-slate-500">Upload Brochure Course (pdf)</span>
                </div>
              )}
            </label>
          </div>
          {/* Display validation error if it exists */}
          {courseErrors.brochureUrl && <p className="text-xs text-red-500 mt-1">{courseErrors.brochureUrl}</p>}
        </div>
      </div>

      {/* Legal Verification Section */}
      <div className="space-y-4">
        <h4 className="font-semibold text-[18px]">Legal Verification</h4>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
            <label className="relative w-full h-[100px] rounded-[12px] border-2 border-dashed border-[#DADADD] bg-[#F8F9FA] flex flex-col items-center justify-center cursor-pointer hover:bg-[#F0F1F2] transition-colors overflow-hidden">
              {currentCourse.businessProofUrl || currentCourse.businessProofPreviewUrl ? (
                <Image
                  width={100}
                  height={100}
                  src={currentCourse.businessProofUrl || currentCourse.businessProofPreviewUrl || "/placeholder.png"}
                  alt="Business Proof Preview"
                  className="w-[100px] h-[100px] object-cover rounded-md"
                />
              ) : (
                <>
                  <Upload size={24} className="text-gray-400 mb-2" />
                  <span className="text-sm text-gray-500">Upload Business Proof (jpg / jpeg)</span>
                </>
              )}
              <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileChange(e, "businessProof")} />
            </label>
            {courseErrors.businessProofUrl && <p className="text-red-500 text-sm mt-1">{courseErrors.businessProofUrl}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <label className="relative w-full h-[100px] rounded-[12px] border-2 border-dashed border-[#DADADD] bg-[#F8F9FA] flex flex-col items-center justify-center cursor-pointer hover:bg-[#F0F1F2] transition-colors overflow-hidden">
              {currentCourse.panAadhaarUrl || currentCourse.panAadhaarPreviewUrl ? (
                <div className="flex flex-col items-center justify-center gap-2 p-4 w-full h-full text-center">
                  <span className="text-sm text-gray-500 truncate px-2">
                    {currentCourse.panAadhaar instanceof File ? currentCourse.panAadhaar.name : "Document uploaded"}
                  </span>
                </div>
              ) : (
                <>
                  <Upload size={24} className="text-gray-400 mb-2" />
                  <span className="text-sm text-gray-500">Upload PAN or Aadhar (pdf)</span>
                </>
              )}
              <input type="file" accept="application/pdf" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileChange(e, "panAadhaar")} />
            </label>
            {courseErrors.panAadhaarUrl && <p className="text-red-500 text-sm mt-1">{courseErrors.panAadhaarUrl}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}