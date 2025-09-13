"use client";

import { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/levels_dialog";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import InputField from "@/components/ui/InputField";
import { Upload, Plus, MoreVertical } from "lucide-react";
import { courseAPI } from "@/lib/api";
import { addBranchesToDB, getAllBranchesFromDB, updateBranchInDB, addCoursesGroupToDB, getCoursesGroupsByBranchName, updateCoursesGroupInDB } from "@/lib/localDb";
//import CoachingCourseForm from "./L2DialogBoxParts/Course/CoachingCourseForm";

// ✅ New imports for split forms
import CoachingCourseForm from "./L2DialogBoxParts/Course/CoachingCourseForm";
import StudyHallForm from "./L2DialogBoxParts/Course/StudyHallForm";
import TuitionCenterForm from "./L2DialogBoxParts/Course/TuitionCenterForm";
import UnderPostGraduateForm from "./L2DialogBoxParts/Course/UnderPostGraduateForm";
import BasicCourseForm from "./L2DialogBoxParts/Course/BasicCourseForm";
import FallbackCourseForm from "./L2DialogBoxParts/Course/FallbackCourseForm";
import BranchForm from "./L2DialogBoxParts/Branch/BranchForm";
import { error } from "console";
import { exportAndUploadInstitutionAndCourses, exportInstitutionAndCoursesToFile } from "@/lib/utility"

interface L2DialogBoxProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
  onPrevious?: () => void;
  initialSection?: "course" | "branch";
}
export interface Course {
  id: number;
  courseName: string;
  aboutCourse: string;
  courseDuration: string;
  mode: string;
  priceOfCourse: string;
  location: string;
  image: File | null;
  brochure: File | null;
  graduationType: string;
  streamType: string;
  selectBranch: string;
  aboutBranch: string;
  educationType: string;
  classSize: string;
  categoriesType: string;
  domainType: string;
  seatingOption: string;
  openingTime: string;
  closingTime: string;
  operationalDays: string[];
  totalSeats: string;
  availableSeats: string;
  pricePerSeat: string;
  hasWifi: boolean;
  hasChargingPoints: boolean;
  hasAC: boolean;
  hasPersonalLocker: boolean;
  tuitionType: string;
  instructorProfile: string;
  subject: string;
  createdBranch: string;
}

// Branch shape used locally in this component; dbId tracks IndexedDB id
interface Branch {
  id: number; // local UI id
  branchName: string;
  branchAddress: string;
  contactInfo: string;
  locationUrl: string;
  dbId?: number; // IndexedDB generated id when persisted
}

export default function L2DialogBox({
  trigger,
  open,
  onOpenChange,
  onSuccess,
  onPrevious,
  initialSection: initialSectionProp,
}: L2DialogBoxProps) {
  const router = useRouter();
  const isCoursrOrBranch = localStorage.getItem("selected");
  const institutionType = localStorage.getItem("institutionType");
  const isUnderPostGraduate =
    institutionType === "Under Graduation/Post Graduation";
  const isCoachingCenter = institutionType === "Coaching centers";
  const isStudyHall = institutionType === "Study Halls";
  const isTutionCenter = institutionType === "Tution Center's";
  const isKindergarten = institutionType === "Kindergarten/childcare center";
  const isSchool = institutionType === "School";
  const isIntermediateCollege = institutionType === "Intermediate college(K12)";

  // Basic course form (only common fields) for these institution types
  const isBasicCourseForm = isKindergarten || isSchool || isIntermediateCollege;

  // Institution types that should skip L3DialogBox and go directly to dashboard
  const shouldSkipL3 = isStudyHall || isTutionCenter;

  const [isOpen, setIsOpen] = useState(false);
  // Remove tab state; we will decide via parent selection
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState(1);
  const [showCourseAfterBranch, setShowCourseAfterBranch] = useState(false);
  const [branchOptions, setBranchOptions] = useState<string[]>([]);

  useEffect(() => {
    if (!dialogOpen) return;

    (async () => {
      try {
        const all = await getAllBranchesFromDB();
        setBranchOptions(all.map((b) => b.branchName).filter(Boolean));
      } catch (err) {
        console.error("Failed to load branches from IndexedDB", err);
      }
    })();
  }, []);

  // Get institution type from localStorage
  const [courses, setCourses] = useState([
    {
      id: 1,
      courseName: "",
      aboutCourse: "",
      courseDuration: "",
      mode: "Offline",
      priceOfCourse: "",
      location: "",
      image: null as File | null,
      brochure: null as File | null,
      // Additional fields for Under Graduate/Post graduate
      graduationType: "",
      streamType: "",
      selectBranch: "",
      aboutBranch: "",
      educationType: "Full time",
      classSize: "",
      // Additional fields for Coaching centers
      categoriesType: "",
      domainType: "",
      // Additional fields for Study Hall
      seatingOption: "",
      openingTime: "",
      closingTime: "",
      operationalDays: [] as string[],
      totalSeats: "",
      availableSeats: "",
      pricePerSeat: "",
      hasWifi: false,
      hasChargingPoints: false,
      hasAC: false,
      hasPersonalLocker: false,
      // Additional fields for Tuition Centers
      tuitionType: "",
      instructorProfile: "",
      subject: "",
      createdBranch: "",
    },
  ]);

  // Handle controlled open state
  const dialogOpen = open !== undefined ? open : isOpen;
  const setDialogOpen = onOpenChange || setIsOpen;

  // Get current course
  const currentCourse =
    courses.find((c) => c.id === selectedCourseId) || courses[0];

  // Branch state
  const [selectedBranchId, setSelectedBranchId] = useState(1);
  const [branches, setBranches] = useState<Branch[]>([
    {
      id: 1,
      branchName: "",
      branchAddress: "",
      contactInfo: "",
      locationUrl: "",
      dbId: undefined,
    },
  ]);

  // Get current branch
  const currentBranch =
    branches.find((b) => b.id === selectedBranchId) || branches[0];

  // Which section to show: "course" or "branch"; prioritize localStorage 'selected', fallback to prop, then 'course'
  const initialSection: "course" | "branch" =
    isCoursrOrBranch === "course" || isCoursrOrBranch === "branch"
      ? (isCoursrOrBranch as "course" | "branch")
      : initialSectionProp || "course";

  type UploadField = {
    label: string;
    type: "image" | "brochure";
    accept: string;
  };

  const uploadFields: UploadField[] = [
    { label: "Add Image", type: "image", accept: "image/jpeg,image/jpg" },
    { label: "Add Brochure", type: "brochure", accept: "application/pdf" },
  ];

  // Handlers
  const handleCourseChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setCourses(
      courses.map((course) =>
        course.id === selectedCourseId
          ? { ...course, [e.target.name]: e.target.value }
          : course
      )
    );
  };

  const handleBranchChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setBranches((prev) =>
      prev.map((branch) =>
        branch.id === selectedBranchId ? { ...branch, [name]: value } : branch
      )
    );
  };

  const handleFileChange = (
    e: ChangeEvent<HTMLInputElement>,
    type: "image" | "brochure"
  ) => {
    const files = e.target.files;
    if (files && files[0]) {
      setCourses(
        courses.map((course) =>
          course.id === selectedCourseId
            ? { ...course, [type]: files[0] }
            : course
        )
      );
    }
  };

  const handleOperationalDayChange = (day: string) => {
    setCourses(
      courses.map((course) =>
        course.id === selectedCourseId
          ? {
              ...course,
              operationalDays: course.operationalDays.includes(day)
                ? course.operationalDays.filter((d) => d !== day)
                : [...course.operationalDays, day],
            }
          : course
      )
    );
  };

  const addNewCourse = () => {
    const newId = Math.max(...courses.map((c) => c.id)) + 1;
    const newCourse = {
      id: newId,
      courseName: "",
      aboutCourse: "",
      courseDuration: "",
      mode: "Offline",
      priceOfCourse: "",
      location: "",
      image: null as File | null,
      brochure: null as File | null,
      // Additional fields for Under Graduate/Post graduate
      graduationType: "",
      streamType: "",
      selectBranch: "",
      aboutBranch: "",
      educationType: "Full time",
      classSize: "",
      // Additional fields for Coaching centers
      categoriesType: "",
      domainType: "",
      // Additional fields for Study Hall
      seatingOption: "",
      openingTime: "",
      closingTime: "",
      operationalDays: [] as string[],
      totalSeats: "",
      availableSeats: "",
      pricePerSeat: "",
      hasWifi: false,
      hasChargingPoints: false,
      hasAC: false,
      hasPersonalLocker: false,
      // Additional fields for Tuition Centers
      tuitionType: "",
      instructorProfile: "",
      subject: "",
      createdBranch: "",
    };
    setCourses([...courses, newCourse]);
    setSelectedCourseId(newId);
  };

  const deleteCourse = (courseId: number) => {
    if (courses.length > 1) {
      const updatedCourses = courses.filter((c) => c.id !== courseId);
      setCourses(updatedCourses);
      if (selectedCourseId === courseId) {
        setSelectedCourseId(updatedCourses[0].id);
      }
    }
  };

  const addNewBranch = () => {
    setBranches((prev) => {
      const newId = prev.length > 0 ? Math.max(...prev.map((b) => b.id)) + 1 : 1;
      const newBranch: Branch = {
        id: newId,
        branchName: "",
        branchAddress: "",
        contactInfo: "",
        locationUrl: "",
        dbId: undefined,
      };
      // Select the newly added branch
      setSelectedBranchId(newId);
      return [...prev, newBranch];
    });
  };

  const deleteBranch = (branchId: number) => {
    setBranches((prev) => {
      if (prev.length <= 1) return prev; // keep at least one branch
      const updated = prev.filter((b) => b.id !== branchId);
      if (selectedBranchId === branchId) {
        setSelectedBranchId(updated[0].id);
      }
      return updated;
    });
  };

  const validateCourses = () => {
    const requiredFields = [
      "courseName",
      "courseDuration",
      "priceOfCourse",
      "location",
    ];

    for (const course of courses) {
      for (const field of requiredFields) {
        if (
          !course[field as keyof typeof course] ||
          String(course[field as keyof typeof course]).trim() === ""
        ) {
          return `Please fill in the ${field} field for course: ${
            course.courseName || "Unnamed course"
          }`;
        }
      }

      // Additional validation for specific institution types
      if (isUnderPostGraduate) {
        if (
          !course.graduationType ||
          !course.streamType ||
          !course.selectBranch
        ) {
          return; //Please fill in all graduation details for course: ${course.courseName};
        }
      }

      if (isCoachingCenter) {
        if (!course.categoriesType || !course.domainType) {
          return; //Please fill in all coaching details for course: ${course.courseName};
        }
      }

      if (isStudyHall) {
        if (
          !course.openingTime ||
          !course.closingTime ||
          !course.totalSeats ||
          !course.availableSeats
        ) {
          return; // Please fill in all study hall details for: ${course.courseName};
        }
      }

      if (isTutionCenter) {
        if (
          !course.tuitionType ||
          !course.instructorProfile ||
          !course.subject ||
          !course.openingTime ||
          !course.closingTime ||
          !course.totalSeats ||
          !course.availableSeats
        ) {
          return; // Please fill in all tuition center details for: ${course.courseName};
        }
      }

      // Basic course form types (Kindergarten, School, Intermediate college) only need common fields
      // No additional validation needed for these types
    }

    return null;
  };


  const handleCourseSubmit = async (e: FormEvent<HTMLFormElement>) => {
  e.preventDefault();

  // ✅ Validate courses before submission
  const validationError = validateCourses();
  if (validationError) {
    alert(validationError);
    return;
  }

  setIsLoading(true);

  try {
    // ✅ Get all existing branches from IndexedDB
    const allBranches = await getAllBranchesFromDB();

    // Map of branchName -> branch object with courses[] (deduplication anchor)
    const branchMap = new Map(
      allBranches.map((b) => [
        b.branchName.trim().toLowerCase(),
        { ...b, courses: [] as typeof courses },
      ])
    );

    // --- Helpers ---
    const sanitizeBranch = (branch: any) => {
      const { createdAt, id, ...rest } = branch; // strip unwanted fields
      return rest;
    };

    const sanitizeCourse = (course: any) => {
      const cleaned: Record<string, any> = {};
      Object.entries(course).forEach(([key, value]) => {
        if (
          value !== null &&
          value !== "" &&
          !(Array.isArray(value) && value.length === 0) &&
          value !== false
        ) {
          cleaned[key] = value;
        }
      });
      return cleaned;
    };

    // --- Attach courses to their branches ---
    const unassignedCourses: any[] = [];

    courses.forEach((c) => {
      const key = (c.createdBranch || "").trim().toLowerCase();

      if (!key || !branchMap.has(key)) {
        // no matching branch → unassigned
        unassignedCourses.push(sanitizeCourse(c));
      } else {
        branchMap
          .get(key)!
          .courses.push(sanitizeCourse(c) as (typeof courses)[number]);
      }
    });

    // --- Prepare final payload (deduplicated) ---
    const sanitizedPayload = [
      ...Array.from(branchMap.values())
        .filter((b) => b.courses.length > 0)
        .map(sanitizeBranch),
    ];

    if (unassignedCourses.length > 0) {
      sanitizedPayload.push({
        // no branchName → "unassigned" bucket
        courses: unassignedCourses,
      } as any);
    }

    if (!sanitizedPayload.length) {
      alert("No valid courses found. Please select a branch or fill valid details.");
      setIsLoading(false);
      return;
    }

    console.log("Deduplicated payload to save:", sanitizedPayload);

    // ✅ Save deduplicated courses into IndexedDB
    for (const entry of sanitizedPayload) {
      if (!entry.branchName) {
        // handle unassigned courses
        const existingUnassigned = await getCoursesGroupsByBranchName("");
        if (existingUnassigned.length) {
          const group = existingUnassigned[0];
          // Deduplicate by courseName + (optional) subject + (optional) mode
          const existing = group.courses || [];
          const incoming = entry.courses || [];
          const keyOf = (c: any) => `${(c.courseName||"").trim().toLowerCase()}|${(c.subject||"").trim().toLowerCase()}|${(c.mode||"").trim().toLowerCase()}`;
          const existingSet = new Set(existing.map(keyOf));
          const uniqueIncoming = incoming.filter((c: any) => !existingSet.has(keyOf(c)));
          const merged = {
            ...group,
            courses: [...existing, ...uniqueIncoming],
          };
          await updateCoursesGroupInDB(merged);
        } else {
          await addCoursesGroupToDB({
            branchName: "",
            courses: entry.courses || [],
          });
        }
      } else {
        // handle branch-specific courses
        const existingGroups = await getCoursesGroupsByBranchName(entry.branchName);
        if (existingGroups.length) {
          // update existing group (merge courses)
          const group = existingGroups[0];
          // Deduplicate by courseName + (optional) subject + (optional) mode
          const existing = group.courses || [];
          const incoming = entry.courses || [];
          const keyOf = (c: any) => `${(c.courseName||"").trim().toLowerCase()}|${(c.subject||"").trim().toLowerCase()}|${(c.mode||"").trim().toLowerCase()}`;
          const existingSet = new Set(existing.map(keyOf));
          const uniqueIncoming = incoming.filter((c: any) => !existingSet.has(keyOf(c)));
          const merged = {
            ...group,
            branchName: entry.branchName,
            branchAddress: (entry as any).branchAddress,
            contactInfo: (entry as any).contactInfo,
            locationUrl: (entry as any).locationUrl,
            courses: [...existing, ...uniqueIncoming],
          };
          await updateCoursesGroupInDB(merged);
        } else {
          // new branch entry
          await addCoursesGroupToDB({
            branchName: entry.branchName,
            branchAddress: (entry as any).branchAddress,
            contactInfo: (entry as any).contactInfo,
            locationUrl: (entry as any).locationUrl,
            courses: entry.courses || [],
          });
        }
      }
    }

    // --- Reset after success ---
    setSelectedCourseId(1);
    if(shouldSkipL3){
      const response = await exportAndUploadInstitutionAndCourses()
      if(response.success){
        router.push("/payment");
      }else{
        alert("Failed to upload data")
      }
    }
    onSuccess?.()
  } catch (error) {
    console.error("Error saving courses:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to save course details. Please try again.";
    alert(errorMessage);
  } finally {
    setIsLoading(false);
  }
};


  const validateBranch = (branch: Branch) => {
    const requiredFields: (keyof Branch)[] = [
      "branchName",
      "branchAddress",
      "contactInfo",
      "locationUrl",
    ];

    for (const field of requiredFields) {
      const value = branch[field];
      if (!value || String(value).trim() === "") {
        return `Please fill in the ${String(field)} field for branch: ${
          branch.branchName || "Unnamed branch"
        }`;
      }
    }

    // Validate contact number format
    if (branch.contactInfo && !/^\d{10}$/.test(branch.contactInfo)) {
      return; // Please enter a valid 10-digit contact number for branch: ${branch.branchName};
    }

    return null;
  };

  const handleBranchSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("in branch parent handler");

    const currentBranch = branches.find((b) => b.id === selectedBranchId);
    if (!currentBranch) return;

    const validationError = validateBranch(currentBranch);
    if (validationError) {
      alert(validationError);
      return;
    }

    setIsLoading(true);

    try {
      // Save only the currently selected branch to prevent duplicates
      const payload = {
        branchName: currentBranch.branchName,
        branchAddress: currentBranch.branchAddress,
        contactInfo: currentBranch.contactInfo,
        locationUrl: currentBranch.locationUrl,
      };

      if (currentBranch.dbId) {
        // Update existing branch in IndexedDB
        await updateBranchInDB({ id: currentBranch.dbId, ...payload });
        console.log("Branch updated in DB with ID:", currentBranch.dbId);
      } else {
        // Add new branch and store the generated DB id back into state
        const [newId] = await addBranchesToDB([payload]);
        console.log("Branch saved locally with ID:", newId);
        setBranches((prev) =>
          prev.map((b) => (b.id === selectedBranchId ? { ...b, dbId: newId } : b))
        );
      }

      // Refresh branch options so the course dropdown has latest values
      try {
        const all = await getAllBranchesFromDB();
        setBranchOptions(all.map((b) => b.branchName).filter(Boolean));
      } catch (fetchErr) {
        console.error("Failed to refresh branches after save", fetchErr);
      }

      // 🔹 Instead of closing dialog, show course form if institution requires courses
      if (isStudyHall || isTutionCenter) {
        // These types skip courses and go dashboard
        setDialogOpen(false);
        router.push("/dashboard");
      } else {
        // Append course form after branch form
        setShowCourseAfterBranch(true);
      }
    } catch (error) {
      console.error("Error saving branch locally:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}

        <DialogContent
          className="w-[95vw] sm:w-[90vw] md:w-[800px] lg:w-[900px] xl:max-w-4xl scrollbar-hide"
          showCloseButton={false}
          onEscapeKeyDown={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <Card className="w-full sm:p-6 rounded-[24px] bg-white border-0 shadow-none">
            <CardContent className="space-y-6">
              {/* Render based on initialSection */}
              {initialSection === "course" ? (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-xl md:text-2xl font-bold">
                      {isStudyHall
                        ? "Study Hall"
                        : isTutionCenter
                        ? "Tuition Hall"
                        : "Course Details"}
                    </h3>
                    <p className="text-[#697282] text-sm">
                      {isStudyHall
                        ? "Enter the details of the study hall."
                        : isTutionCenter
                        ? "Enter the details of the tuition hall."
                        : "Enter the courses your institution offers."}
                    </p>
                  </div>

                  {/* Course items switching */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-wrap">
                      {courses.map((course) => (
                        <div key={course.id} className="flex items-center">
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setSelectedCourseId(course.id)}
                            className={`px-3 py-2 rounded-lg text-sm border transition-colors flex items-center gap-2 ${
                              selectedCourseId === course.id
                                ? "bg-blue-50 border-blue-200 text-blue-700"
                                : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                            }`}
                          >
                            <span>
                              {course.courseName ||
                                (isStudyHall
                                  ? `Hall ${course.id}`
                                  : isTutionCenter
                                  ? `Hall ${course.id}`
                                  : `Course ${course.id}`)}
                            </span>
                            {courses.length > 1 && (
                              <MoreVertical
                                size={14}
                                className="text-gray-400 hover:text-gray-600"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteCourse(course.id);
                                }}
                              />
                            )}
                          </Button>
                        </div>
                      ))}
                    </div>
                    <Button
                      type="button"
                      onClick={addNewCourse}
                      className="bg-[#0222D7] hover:bg-[#0222D7]/90 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2"
                    >
                      <Plus size={16} />
                      {isStudyHall
                        ? "Add Hall"
                        : isTutionCenter
                        ? "Add Hall"
                        : "Add Course"}
                    </Button>
                  </div>

                  <form onSubmit={handleCourseSubmit} className="space-y-6">
                    {isCoachingCenter ? (
                      <CoachingCourseForm
                        currentCourse={currentCourse}
                        handleCourseChange={handleCourseChange}
                        setCourses={setCourses}
                        courses={courses}
                        selectedCourseId={selectedCourseId}
                      />
                    ) : isStudyHall ? (
                      <StudyHallForm
                        currentCourse={currentCourse}
                        handleCourseChange={handleCourseChange}
                        handleOperationalDayChange={handleOperationalDayChange}
                        handleFileChange={handleFileChange}
                        setCourses={setCourses}
                        courses={courses}
                        selectedCourseId={selectedCourseId}
                      />
                    ) : isTutionCenter ? (
                      <TuitionCenterForm
                        currentCourse={currentCourse}
                        handleCourseChange={handleCourseChange}
                        handleOperationalDayChange={handleOperationalDayChange}
                        handleFileChange={handleFileChange}
                        setCourses={setCourses}
                        courses={courses}
                        selectedCourseId={selectedCourseId}
                      />
                    ) : isUnderPostGraduate ? (
                      <UnderPostGraduateForm
                        currentCourse={currentCourse}
                        handleCourseChange={handleCourseChange}
                        setCourses={setCourses}
                        courses={courses}
                        selectedCourseId={selectedCourseId}
                      />
                    ) : isBasicCourseForm ? (
                      <BasicCourseForm
                        currentCourse={currentCourse}
                        handleCourseChange={handleCourseChange}
                        setCourses={setCourses}
                        courses={courses}
                        selectedCourseId={selectedCourseId}
                      />
                    ) : (
                      <FallbackCourseForm
                        currentCourse={currentCourse}
                        handleCourseChange={handleCourseChange}
                        setCourses={setCourses}
                        courses={courses}
                        selectedCourseId={selectedCourseId}
                      />
                    )}

                    <div className="grid md:grid-cols-2 gap-6">
                      {uploadFields.map((f) => (
                        <div key={f.type} className="flex flex-col gap-2">
                          <label className="font-medium text-[16px]">
                            {f.label}
                          </label>
                          <label className="w-full h-[120px] rounded-[12px] border-2 border-dashed border-[#DADADD] bg-[#F8F9FA] flex flex-col items-center justify-center cursor-pointer hover:bg-[#F0F1F2] transition-colors">
                            <Upload size={24} className="text-gray-400 mb-2" />
                            <span className="text-sm text-gray-500">
                              {currentCourse[f.type]
                                ? (currentCourse[f.type] as File).name
                                : f.type === "image"
                                ? "Upload Course Image (jpg / jpeg)"
                                : "Upload Brochure Course (pdf)"}
                            </span>
                            <input
                              type="file"
                              accept={f.accept}
                              className="hidden"
                              onChange={(e) => handleFileChange(e, f.type)}
                            />
                          </label>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-center gap-10">
                      <button
                        type="button"
                        onClick={onPrevious}
                        className="w-[314px] h-[48px] border border-[#697282] text-[#697282] rounded-[12px] font-semibold text-[18px] leading-[22px] flex items-center justify-center shadow-inner"
                      >
                        Previous
                      </button>

                      <button
                        type="submit"
                        disabled={isLoading}
                        className={`w-[314px] h-[48px] rounded-[12px] font-semibold transition-colors 
            ${
              isLoading
                ? "opacity-50 cursor-not-allowed bg-gray-600"
                : "bg-[#6B7280] hover:bg-[#6B7280]/90"
            } 
            text-white flex items-center justify-center`}
                      >
                        {isLoading ? "Saving..." : "Save & Next"}
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                // Branch section
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-xl md:text-2xl font-bold">
                      Branch Details
                    </h3>
                    <p className="text-[#697282] text-sm">
                      here information about your institution's branches.
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-wrap">
                      {branches.map((branch) => (
                        <div key={branch.id} className="flex items-center">
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setSelectedBranchId(branch.id)}
                            className={`px-3 py-2 rounded-lg text-sm border transition-colors flex items-center gap-2 ${
                              selectedBranchId === branch.id
                                ? "bg-blue-50 border-blue-200 text-blue-700"
                                : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                            }`}
                          >
                            <span>
                              {branch.branchName || `Branch ${branch.id}`}
                            </span>
                            {branches.length > 1 && (
                              <MoreVertical
                                size={14}
                                className="text-gray-400 hover:text-gray-600"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteBranch(branch.id);
                                }}
                              />
                            )}
                          </Button>
                        </div>
                      ))}
                    </div>
                    <Button
                      type="button"
                      onClick={addNewBranch}
                      className="bg-[#0222D7] hover:bg-[#0222D7]/90 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2"
                    >
                      <Plus size={16} />
                      Add Branch
                    </Button>
                  </div>

                  <div className="b p-4 rounded-md">
                    <BranchForm
                      branches={branches}
                      setBranches={setBranches}
                      selectedBranchId={selectedBranchId}
                      setSelectedBranchId={setSelectedBranchId}
                      handleBranchChange={handleBranchChange}
                      handleBranchSubmit={handleBranchSubmit}
                      handlePreviousClick={onPrevious}
                      deleteBranch={deleteBranch}
                      addNewBranch={addNewBranch}
                      isLoading={isLoading}
                    />
                  </div>

                  {showCourseAfterBranch && (
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <h3 className="text-xl md:text-2xl font-bold">
                          {isStudyHall
                            ? "Study Hall"
                            : isTutionCenter
                            ? "Tuition Hall"
                            : "Course Details"}
                        </h3>
                        <p className="text-[#697282] text-sm">
                          {isStudyHall
                            ? "Enter the details of the study hall."
                            : isTutionCenter
                            ? "Enter the details of the tuition hall."
                            : "Enter the courses your institution offers."}
                        </p>
                      </div>

                      {/* Course items switching */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-wrap">
                          {courses.map((course) => (
                            <div key={course.id} className="flex items-center">
                              <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setSelectedCourseId(course.id)}
                                className={`px-3 py-2 rounded-lg text-sm border transition-colors flex items-center gap-2 ${
                                  selectedCourseId === course.id
                                    ? "bg-blue-50 border-blue-200 text-blue-700"
                                    : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                                }`}
                              >
                                <span>
                                  {course.courseName ||
                                    (isStudyHall
                                      ? `Hall ${course.id}`
                                      : isTutionCenter
                                      ? `Hall ${course.id}`
                                      : `Course ${course.id}`)}
                                </span>
                                {courses.length > 1 && (
                                  <MoreVertical
                                    size={14}
                                    className="text-gray-400 hover:text-gray-600"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteCourse(course.id);
                                    }}
                                  />
                                )}
                              </Button>
                            </div>
                          ))}
                        </div>
                        <Button
                          type="button"
                          onClick={addNewCourse}
                          className="bg-[#0222D7] hover:bg-[#0222D7]/90 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2"
                        >
                          <Plus size={16} />
                          {isStudyHall
                            ? "Add Hall"
                            : isTutionCenter
                            ? "Add Hall"
                            : "Add Course"}
                        </Button>
                      </div>

                      <form onSubmit={handleCourseSubmit} className="space-y-6">
                        <InputField
                          label="Branch"
                          name="createdBranch"
                          value={currentCourse.createdBranch}
                          onChange={handleCourseChange}
                          isSelect={true}
                          options={
                            branchOptions.length
                              ? branchOptions
                              : ["No branches saved yet"]
                          }
                          placeholder="Select branch"
                        />
                        {isCoachingCenter ? (
                          <CoachingCourseForm
                            currentCourse={currentCourse}
                            handleCourseChange={handleCourseChange}
                            setCourses={setCourses}
                            courses={courses}
                            selectedCourseId={selectedCourseId}
                          />
                        ) : isStudyHall ? (
                          <StudyHallForm
                            currentCourse={currentCourse}
                            handleCourseChange={handleCourseChange}
                            handleOperationalDayChange={
                              handleOperationalDayChange
                            }
                            handleFileChange={handleFileChange}
                            setCourses={setCourses}
                            courses={courses}
                            selectedCourseId={selectedCourseId}
                          />
                        ) : isTutionCenter ? (
                          <TuitionCenterForm
                            currentCourse={currentCourse}
                            handleCourseChange={handleCourseChange}
                            handleOperationalDayChange={
                              handleOperationalDayChange
                            }
                            handleFileChange={handleFileChange}
                            setCourses={setCourses}
                            courses={courses}
                            selectedCourseId={selectedCourseId}
                          />
                        ) : isUnderPostGraduate ? (
                          <UnderPostGraduateForm
                            currentCourse={currentCourse}
                            handleCourseChange={handleCourseChange}
                            setCourses={setCourses}
                            courses={courses}
                            selectedCourseId={selectedCourseId}
                          />
                        ) : isBasicCourseForm ? (
                          <BasicCourseForm
                            currentCourse={currentCourse}
                            handleCourseChange={handleCourseChange}
                            setCourses={setCourses}
                            courses={courses}
                            selectedCourseId={selectedCourseId}
                          />
                        ) : (
                          <FallbackCourseForm
                            currentCourse={currentCourse}
                            handleCourseChange={handleCourseChange}
                            setCourses={setCourses}
                            courses={courses}
                            selectedCourseId={selectedCourseId}
                          />
                        )}

                        <div className="grid md:grid-cols-2 gap-6">
                          {uploadFields.map((f) => (
                            <div key={f.type} className="flex flex-col gap-2">
                              <label className="font-medium text-[16px]">
                                {f.label}
                              </label>
                              <label className="w-full h-[120px] rounded-[12px] border-2 border-dashed border-[#DADADD] bg-[#F8F9FA] flex flex-col items-center justify-center cursor-pointer hover:bg-[#F0F1F2] transition-colors">
                                <Upload
                                  size={24}
                                  className="text-gray-400 mb-2"
                                />
                                <span className="text-sm text-gray-500">
                                  {currentCourse[f.type]
                                    ? (currentCourse[f.type] as File).name
                                    : f.type === "image"
                                    ? "Upload Course Image (jpg / jpeg)"
                                    : "Upload Brochure Course (pdf)"}
                                </span>
                                <input
                                  type="file"
                                  accept={f.accept}
                                  className="hidden"
                                  onChange={(e) => handleFileChange(e, f.type)}
                                />
                              </label>
                            </div>
                          ))}
                        </div>
                        <div className="flex justify-center gap-10">
                          <button
                            type="button"
                            onClick={onPrevious}
                            className="w-[314px] h-[48px] border border-[#697282] text-[#697282] rounded-[12px] font-semibold text-[18px] leading-[22px] flex items-center justify-center shadow-inner"
                          >
                            Previous
                          </button>

                          <button
                            type="submit"
                            disabled={isLoading}
                            className={`w-[314px] h-[48px] rounded-[12px] font-semibold transition-colors 
            ${
              isLoading
                ? "opacity-50 cursor-not-allowed bg-gray-600"
                : "bg-[#6B7280] hover:bg-[#6B7280]/90"
            } 
            text-white flex items-center justify-center`}
                          >
                            {isLoading ? "Saving..." : "Save & Next"}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </DialogContent>
      </Dialog>
    </>
  );
}
