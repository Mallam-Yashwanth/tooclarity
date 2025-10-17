"use client";

import { useState, useEffect, ChangeEvent, FormEvent } from "react";
import React from "react";
import { programsAPI } from "@/lib/api";
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
import {
  addBranchesToDB,
  getAllBranchesFromDB,
  updateBranchInDB,
  addCoursesGroupToDB,
  getCoursesGroupsByBranchName,
  updateCoursesGroupInDB,
} from "@/lib/localDb";
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
import {
  exportAndUploadInstitutionAndCourses,
  exportInstitutionAndCoursesToFile,
} from "@/lib/utility";
import { L2Schemas } from "@/lib/validations/L2Schema";
import { createdBranchRule } from "@/lib/validations/ValidationRules";
import { uploadToS3 } from "@/lib/awsUpload";
import AppSelect from "@/components/ui/AppSelect";

interface L2DialogBoxProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
  onPrevious?: () => void;
  initialSection?: "course" | "branch";
  // New: render inline (non-dialog) for subscription page usage
  renderMode?: "dialog" | "inline";
  // New: subscription mode for Program creation flow on Subscription page
  mode?: "default" | "subscriptionProgram" | "settingsEdit";
  institutionId?: string;
  // New: for editing existing programs in settings
  editMode?: boolean;
  existingCourseData?: any;
  onEditSuccess?: () => void;
}
export interface Course {
  id: number;
  courseName: string;
  aboutCourse: string;
  courseDuration: string;
  startDate: string;
  endDate: string;
  mode: string;
  priceOfCourse: string;
  location: string;
  image: File | null;
  imageUrl: string;
  imagePreviewUrl: string;
  brochureUrl: string;
  brochurePreviewUrl: string;
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
  hallName?: string;
  operationalDays: string[];
  totalSeats: string;
  availableSeats: string;
  pricePerSeat: string;
  hasWifi: string; // Changed from null
  hasChargingPoints: string; // Changed from null
  hasAC: string; // Changed from null
  hasPersonalLocker: string; // Changed from null
  eligibilityCriteria: string; // Add this line
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
  renderMode = "dialog",
  mode = "default",
  institutionId,
  editMode = false,
  existingCourseData,
  onEditSuccess,
}: L2DialogBoxProps) {
  const router = useRouter();
  const [isCoursrOrBranch, setIsCourseOrBranch] = useState<string | null>(null);
  const [institutionType, setInstitutionType] = useState<string | null>(null);
  // const isCoursrOrBranch = localStorage.getItem("selected");
  // const institutionType = localStorage.getItem("institutionType");

  useEffect(() => {
    // runs only in browser
    setIsCourseOrBranch(localStorage.getItem("selected"));
    setInstitutionType(localStorage.getItem("institutionType"));
  }, []);
  const isUnderPostGraduate =
    institutionType === "Under Graduation/Post Graduation";
  const isCoachingCenter = institutionType === "Coaching centers";
  const isStudyHall = institutionType === "Study Halls";
  const isTutionCenter = institutionType === "Tution Center's";
  const isKindergarten = institutionType === "Kindergarten/childcare center";
  const isSchool = institutionType === "School's";
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
  const [remoteBranches, setRemoteBranches] = useState<Array<{ _id: string; branchName: string }>>([]);
  const [selectedBranchIdForProgram, setSelectedBranchIdForProgram] = useState<string>("");
  const [programBranchError, setProgramBranchError] = useState<string>("");
  

  const uniqueRemoteBranches = React.useMemo(() => {
    const seenNames = new Set<string>();
    const seenIds = new Set<string>();
    const result: Array<{ _id: string; branchName: string }> = [];
    for (const b of remoteBranches) {
      const id = String(b?._id || "");
      const name = (b?.branchName || "Branch").trim();
      const keyName = name.toLowerCase();
      if (!id || seenIds.has(id) || seenNames.has(keyName)) continue;
      seenIds.add(id);
      seenNames.add(keyName);
      result.push({ _id: id, branchName: name });
    }
    return result.sort((a,b)=> a.branchName.localeCompare(b.branchName));
  }, [remoteBranches]);

  // ✅ 1. Add state to hold validation errors for each branch
  const [branchErrors, setBranchErrors] = useState<
    Record<number, Record<string, string>>
  >({});

  useEffect(() => {
    if (!dialogOpen) return;

    (async () => {
      try {
        const all = await getAllBranchesFromDB();
        setBranchOptions(all.map((b) => b.branchName).filter(Boolean));
        if (isSubscriptionProgram) {
          try {
            const res: any = await programsAPI.listBranchesForInstitutionAdmin(String(institutionId||''));
            const branches = (res?.data?.branches || []) as Array<any>;
            setRemoteBranches(branches.map((b:any)=> ({ _id: String(b._id), branchName: b.branchName || "Branch" })));
          } catch (e) {}
        }
      } catch (err) {
        console.error("Failed to load branches from IndexedDB", err);
      }
    })();
  }, []);

  // Get institution type from localStorage
  const [courses, setCourses] = useState(() => {
    if (editMode && existingCourseData) {
      // Convert existing course data to the expected format
      return [{
        id: 1,
        courseName: existingCourseData.courseName || "",
        aboutCourse: existingCourseData.aboutCourse || "",
        courseDuration: existingCourseData.courseDuration || "",
        startDate: existingCourseData.startDate || "",
        endDate: existingCourseData.endDate || "",
        mode: existingCourseData.mode || "Offline",
        priceOfCourse: existingCourseData.priceOfCourse || "",
        eligibilityCriteria: existingCourseData.eligibilityCriteria || "",
        location: existingCourseData.location || "",
        image: null as File | null,
        imageUrl: existingCourseData.imageUrl || "",
        imagePreviewUrl: "",
        brochureUrl: existingCourseData.brochureUrl || "",
        brochure: null as File | null,
        brochurePreviewUrl: "",
        // Additional fields for Under Graduate/Post graduate
        graduationType: existingCourseData.graduationType || "",
        streamType: existingCourseData.streamType || "",
        selectBranch: existingCourseData.selectBranch || "",
        aboutBranch: existingCourseData.aboutBranch || "",
        educationType: existingCourseData.educationType || "Full time",
        classSize: existingCourseData.classSize || "",
        // Additional fields for Coaching centers
        categoriesType: existingCourseData.categoriesType || "",
        domainType: existingCourseData.domainType || "",
        // Additional fields for Study Hall
        seatingOption: existingCourseData.seatingOption || "",
        openingTime: existingCourseData.openingTime || "",
        closingTime: existingCourseData.closingTime || "",
        operationalDays: existingCourseData.operationalDays || [],
        totalSeats: existingCourseData.totalSeats || "",
        availableSeats: existingCourseData.availableSeats || "",
        pricePerSeat: existingCourseData.pricePerSeat || "",
        hasWifi: existingCourseData.hasWifi || "",
        hasChargingPoints: existingCourseData.hasChargingPoints || "",
        hasAC: existingCourseData.hasAC || "",
        hasPersonalLocker: existingCourseData.hasPersonalLocker || "",
        // Additional fields for Tuition Centers
        tuitionType: existingCourseData.tuitionType || "",
        instructorProfile: existingCourseData.instructorProfile || "",
        subject: existingCourseData.subject || "",
        createdBranch: existingCourseData.createdBranch || "",
      }];
    }
    
    // Default initialization for new courses
    return [{
      id: 1,
      courseName: "",
      aboutCourse: "",
      courseDuration: "",
      startDate: "",
      endDate: "",
      mode: "Offline",
      priceOfCourse: "",
      eligibilityCriteria: "",
      location: "",
      image: null as File | null,
      imageUrl: "",
      imagePreviewUrl: "",
      brochureUrl: "",
      brochure: null as File | null,
      brochurePreviewUrl: "",
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
      hasWifi: "",
      hasChargingPoints: "",
      hasAC: "",
      hasPersonalLocker: "",
      // Additional fields for Tuition Centers
      tuitionType: "",
      instructorProfile: "",
      subject: "",
      createdBranch: "",
    }];
  });

  // Handle controlled open state; in inline mode we treat it as always open
  const dialogOpen = renderMode === "inline" ? true : (open !== undefined ? open : isOpen);
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
    { label: "Add Image", type: "image", accept: "image/*" },
    { label: "Add Brochure", type: "brochure", accept: "application/pdf" },
  ];

  // Handlers
  // L2DialogBox.tsx

  const handleCourseChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    const courseToUpdate = courses.find((c) => c.id === selectedCourseId);
    if (!courseToUpdate) return;

    const updatedCourse = { ...courseToUpdate, [name]: value };

    setCourses(
      courses.map((course) =>
        course.id === selectedCourseId ? updatedCourse : course
      )
    );

    const schema = L2Schemas[getSchemaKey()];
    if (!schema) return;

    const { error } = schema.validate(updatedCourse, {
      abortEarly: false,
      allowUnknown: true,
    });

    const fieldError = error?.details.find((detail) => detail.path[0] === name);

    // ✅ CORRECTED ERROR HANDLING TO FIX TYPESCRIPT ERROR
    setCourseErrorsById((prevErrors) => {
      // Get a copy of the errors for the current course
      const updatedErrorsForCourse = {
        ...(prevErrors[selectedCourseId] || {}),
      };

      if (fieldError) {
        // If there's a new error, add or update it
        updatedErrorsForCourse[name] = fieldError.message;
      } else {
        // If the field is now valid, remove the error key from the object
        delete updatedErrorsForCourse[name];
      }

      // Return the updated state
      return {
        ...prevErrors,
        [selectedCourseId]: updatedErrorsForCourse,
      };
    });
  };

  const handleFileChange = (
    e: ChangeEvent<HTMLInputElement>,
    type: "image" | "brochure"
  ) => {
    const files = e.target.files;
    if (!files || !files[0]) return;

    const selectedFile = files[0];
    const courseId = selectedCourseId;

    // Allowed file types
    const allowedImageTypes = ["image/png", "image/jpg", "image/jpeg"];
    const allowedBrochureTypes = ["application/pdf"];

    let errorMessage = "";

    // 🔍 File type validation
    if (type === "image" && !allowedImageTypes.includes(selectedFile.type)) {
      errorMessage = "Only PNG, JPG, or JPEG images are allowed.";
    } else if (
      type === "brochure" &&
      !allowedBrochureTypes.includes(selectedFile.type)
    ) {
      errorMessage = "Only PDF files are allowed.";
    }

    // 📏 File size validation (max 4 MB)
    const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4 MB
    if (selectedFile.size > MAX_FILE_SIZE) {
      errorMessage = "File size must be 4 MB or less.";
    }

    // ❌ If validation failed → show error inline & stop further execution
    if (errorMessage) {
      setCourseErrorsById((prev) => ({
        ...prev,
        [courseId]: {
          ...(prev[courseId] || {}),
          [`${type}Url`]: errorMessage,
        },
      }));
      return;
    }

    // ✅ If valid → clear previous error for this file type
    setCourseErrorsById((prev) => {
      const updated = { ...(prev[courseId] || {}) };
      delete updated[`${type}Url`];
      return { ...prev, [courseId]: updated };
    });

    // ✅ Create a local preview URL
    const previewUrl = URL.createObjectURL(selectedFile);

    // ✅ Update selected course state
    setCourses((prevCourses) =>
      prevCourses.map((course) =>
        course.id === courseId
          ? {
              ...course,
              [`${type}`]: selectedFile,
              [`${type}PreviewUrl`]: previewUrl,
            }
          : course
      )
    );
  };

  // L2DialogBox.tsx

  const handleOperationalDayChange = (day: string) => {
    // Find the current course to get its existing days
    const courseToUpdate = courses.find((c) => c.id === selectedCourseId);
    if (!courseToUpdate) return;

    // Calculate the new array of operational days
    const newOperationalDays = courseToUpdate.operationalDays.includes(day)
      ? courseToUpdate.operationalDays.filter((d: string) => d !== day)
      : [...courseToUpdate.operationalDays, day];

    // 1. Update the state for the UI
    setCourses(
      courses.map((course) =>
        course.id === selectedCourseId
          ? { ...course, operationalDays: newOperationalDays }
          : course
      )
    );

    // 2. Get the correct Joi schema (works for both Study Hall and Tuition Center)
    const schema = L2Schemas[getSchemaKey()];
    let validationError = "";

    // 3. Validate just the operationalDays field with the new value
    if (schema && schema.extract("operationalDays")) {
      const { error } = schema
        .extract("operationalDays")
        .validate(newOperationalDays);
      if (error) {
        validationError = error.details[0].message;
      }
    }

    // 4. Update the error state for this specific field
    setCourseErrorsById((prevErrors) => ({
      ...prevErrors,
      [selectedCourseId]: {
        ...(prevErrors[selectedCourseId] || {}),
        operationalDays: validationError, // If validation passed, this will be empty
      },
    }));
  };
  // const handleOperationalDayChange = (day: string) => {
  //   setCourses(
  //     courses.map((course) =>
  //       course.id === selectedCourseId
  //         ? {
  //             ...course,
  //             operationalDays: course.operationalDays.includes(day)
  //               ? course.operationalDays.filter((d) => d !== day)
  //               : [...course.operationalDays, day],
  //           }
  //         : course
  //     )
  //   );
  // };

  const addNewCourse = () => {
    const newId = Math.max(...courses.map((c) => c.id)) + 1;
    const newCourse = {
      id: newId,
      courseName: "",
      aboutCourse: "",
      courseDuration: "",
      startDate: "",
      endDate: "",
      mode: "Offline",
      priceOfCourse: "",
      location: "",
      image: null as File | null,
      imagePreviewUrl: "",
      imageUrl: "",
      brochureUrl: "",
      brochurePreviewUrl: "",
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
      eligibilityCriteria: "",
      // Additional fields for Study Hall
      seatingOption: "",
      openingTime: "",
      closingTime: "",
      operationalDays: [] as string[],
      totalSeats: "",
      availableSeats: "",
      pricePerSeat: "",
      hasWifi: "", // Changed from null
      hasChargingPoints: "", // Changed from null
      hasAC: "", // Changed from null
      hasPersonalLocker: "", // Changed from null
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
      const newId =
        prev.length > 0 ? Math.max(...prev.map((b) => b.id)) + 1 : 1;
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

  // const [selectedCourseId, setSelectedCourseId] = useState(1);
  const [courseErrorsById, setCourseErrorsById] = useState<
    Record<number, Record<string, string>>
  >({}); // ✅ ADD THIS LINE
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
  useEffect(() => {
    if (dialogOpen) {
      setIsCourseOrBranch(localStorage.getItem("selected"));
      setInstitutionType(localStorage.getItem("institutionType"));
    }
  }, [dialogOpen]); // Dependency on dialogOpen is the key.

  // Auto-select branch for edit mode
  useEffect(() => {
    if (editMode && existingCourseData && existingCourseData.branch) {
      setSelectedBranchIdForProgram(String(existingCourseData.branch));
    }
  }, [editMode, existingCourseData]);

  // Inside L2DialogBox.tsx

  const getSchemaKey = (): keyof typeof L2Schemas => {
    if (isCoachingCenter) {
      return "coaching";
    }
    if (isStudyHall) {
      return "studyHall";
    }
    if (isTutionCenter) {
      return "tuition";
    }
    if (isUnderPostGraduate) {
      return "ugpg";
    }
    // Default for Kindergarten, School, etc.
    return "basic";
  };

  const handleCourseSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log("🚀 Starting course submission...");

      const uploadedCourses = await Promise.all(
        courses.map(async (course) => {
          const updated = { ...course };

          // --- 🖼️ Image Upload ---
          if (course.image instanceof File) {
            const isNewLocalFile =
              !course.imageUrl || course.imageUrl.startsWith("blob:");
            if (isNewLocalFile) {
              console.log(`🪣 Uploading new image for: ${course.courseName}`);
              try {
                const uploadImage = await uploadToS3(course.image);
                if (uploadImage.success && uploadImage.fileUrl) {
                  updated.imageUrl = uploadImage.fileUrl;
                  updated.imagePreviewUrl = URL.createObjectURL(course.image);
                  console.log(`✅ Image uploaded for: ${course.courseName}`);
                }
              } catch (err) {
                console.error(
                  `❌ Failed to upload image for ${course.courseName}:`,
                  err
                );
              }
            } else {
              console.log(
                `⚡ Skipping image upload (already uploaded): ${course.courseName}`
              );
            }
          }

          // --- 📘 Brochure Upload ---
          if (course.brochure instanceof File) {
            const isNewLocalFile =
              !course.brochureUrl || course.brochureUrl.startsWith("blob:");
            if (isNewLocalFile) {
              console.log(
                `🪣 Uploading new brochure for: ${course.courseName}`
              );
              try {
                const uploadBrochure = await uploadToS3(course.brochure);
                if (uploadBrochure.success && uploadBrochure.fileUrl) {
                  updated.brochureUrl = uploadBrochure.fileUrl;
                  updated.brochurePreviewUrl = URL.createObjectURL(
                    course.brochure
                  );
                  console.log(`✅ Brochure uploaded for: ${course.courseName}`);
                }
              } catch (err) {
                console.error(
                  `❌ Failed to upload brochure for ${course.courseName}:`,
                  err
                );
              }
            } else {
              console.log(
                `⚡ Skipping brochure upload (already uploaded): ${course.courseName}`
              );
            }
          }

          return updated;
        })
      );

      setCourses(uploadedCourses);
      console.log("🪣 All uploads completed successfully.");

      // --- 2️⃣ Check missing branch selection ---
      if (showCourseAfterBranch) {
        const initialErrors: Record<number, Record<string, string>> = {};
        let hasMissingBranch = false;

        for (const course of uploadedCourses) {
          if (!course.createdBranch) {
            hasMissingBranch = true;
            initialErrors[course.id] = {
              createdBranch: "Please select a branch for this course.",
            };
          }
        }

        if (hasMissingBranch) {
          setCourseErrorsById(initialErrors);
          console.warn("⛔ Submission stopped: Missing branch selection.");
          setIsLoading(false);
          return;
        }
      }

      // --- 3️⃣ Custom Date Validation ---
      const allCourseErrors: Record<number, Record<string, string>> = {};
      let hasErrors = false;

      // Custom date validation before Joi validation
      for (const course of uploadedCourses) {
        const courseErrors: Record<string, string> = {};
        
        // Validate startDate
        if (!course.startDate || course.startDate.trim() === "") {
          courseErrors.startDate = "Start date is required";
          hasErrors = true;
        } else {
          const startDate = new Date(course.startDate);
          if (isNaN(startDate.getTime())) {
            courseErrors.startDate = "Start date must be a valid date";
            hasErrors = true;
          }
        }
        
        // Validate endDate
        if (!course.endDate || course.endDate.trim() === "") {
          courseErrors.endDate = "End date is required";
          hasErrors = true;
        } else {
          const endDate = new Date(course.endDate);
          if (isNaN(endDate.getTime())) {
            courseErrors.endDate = "End date must be a valid date";
            hasErrors = true;
          } else if (course.startDate && course.startDate.trim() !== "") {
            const startDate = new Date(course.startDate);
            if (!isNaN(startDate.getTime()) && endDate <= startDate) {
              courseErrors.endDate = "End date must be after start date";
              hasErrors = true;
            }
          }
        }
        
        if (Object.keys(courseErrors).length > 0) {
          allCourseErrors[course.id] = courseErrors;
        }
      }

      // --- 4️⃣ Joi Validation ---
      let schema = L2Schemas[getSchemaKey()];
      if (!showCourseAfterBranch) {
        schema = schema.fork("createdBranch", (field) =>
          field.optional().allow("")
        );
      }

      for (const course of uploadedCourses) {
        console.group(
          `🔍 Validating course: ${course.courseName} (ID: ${course.id})`
        );
        console.log("📦 Course data before validation:", course);

        const { error } = schema.validate(course, {
          abortEarly: false,
          allowUnknown: true,
        });

        if (error) {
          hasErrors = true;
          const fieldErrors = error.details.reduce((acc, detail) => {
            const key = detail.path[0] as string;
            acc[key] = detail.message;
            return acc;
          }, {} as Record<string, string>);

          // Merge with existing custom date errors
          const existingErrors = allCourseErrors[course.id] || {};
          allCourseErrors[course.id] = { ...existingErrors, ...fieldErrors };
          console.warn("❌ Validation errors:", allCourseErrors[course.id]);
        } else {
          console.log("✅ Course passed validation!");
        }

        console.groupEnd();
      }

      setCourseErrorsById(allCourseErrors);

      if (hasErrors) {
        console.error("🚫 Validation failed for one or more courses.");
        setIsLoading(false);
        return;
      }

      console.log("✅ All courses validated successfully.");

      // --- 4️⃣ Prepare and Save in IndexedDB ---
    // Subscription Program mode: create PROGRAMs via backend and exit
    if (isSubscriptionProgram) {
      if (!institutionId) {
        throw new Error("institutionId required for subscription program mode");
      }
      if (uniqueRemoteBranches.length > 0 && !selectedBranchIdForProgram) {
        setProgramBranchError("Please select a branch");
        setIsLoading(false);
        return;
      }
      const toCreate = courses.map((c) => {
        const programName = (c.courseName || "").trim();
        const programSlug = programName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "");
        return {
          institution: String(institutionId),
          branch: selectedBranchIdForProgram || null, // Allow null for new users without branches
          // Program-style fields
          mode: c.mode || "Offline",
          classSize: c.classSize || "",
          location: c.location || "",
          // Unified Course model expectations for type PROGRAM
          type: 'PROGRAM',
          courseName: programName,
          aboutCourse: c.aboutCourse || "",
          courseDuration: c.courseDuration || "",
          startDate: c.startDate || undefined,
          endDate: c.endDate || undefined,
          priceOfCourse: c.priceOfCourse ? Number(c.priceOfCourse) : undefined,
          // keep location for Course model too
          // additional optional mirrors
          graduationType: c.graduationType || undefined,
          streamType: c.streamType || undefined,
          selectBranch: c.selectBranch || undefined,
        } as any;
      }).filter((p) => p.courseName && p.courseName.length > 0);

      for (const payload of toCreate) {
        if (editMode && existingCourseData) {
          // Update existing course
          await programsAPI.update(existingCourseData._id, payload);
        } else {
          // Create new course
          await programsAPI.create(payload);
        }
      }

      if (editMode) {
        onEditSuccess?.();
      } else {
        onSuccess?.();
      }
      setIsLoading(false);
      return;
    }

      const allBranches = await getAllBranchesFromDB();
      const branchMap = new Map(
        allBranches.map((b) => [
          b.branchName.trim().toLowerCase(),
          { ...b, courses: [] as typeof uploadedCourses },
        ])
      );

      const sanitizeBranch = (branch: any) => {
        const { createdAt, id, ...rest } = branch;
        return rest;
      };

      const sanitizeCourse = (course: any) =>
        Object.fromEntries(
          Object.entries(course).filter(
            ([_, value]) =>
              value !== null &&
              value !== "" &&
              !(Array.isArray(value) && value.length === 0) &&
              value !== false
          )
        );

      const unassignedCourses: any[] = [];
      uploadedCourses.forEach((c) => {
        const key = (c.createdBranch || "").trim().toLowerCase();
        if (!key || !branchMap.has(key)) {
          unassignedCourses.push(sanitizeCourse(c));
        } else {
          branchMap
            .get(key)!
            .courses.push(
              sanitizeCourse(c) as (typeof uploadedCourses)[number]
            );
        }
      });

      const sanitizedPayload = [
        ...Array.from(branchMap.values())
          .filter((b) => b.courses.length > 0)
          .map(sanitizeBranch),
      ];

      if (unassignedCourses.length > 0) {
        sanitizedPayload.push({ courses: unassignedCourses } as any);
      }

      if (!sanitizedPayload.length) {
        alert(
          "No valid courses found. Please select a branch or fill valid details."
        );
        setIsLoading(false);
        return;
      }

      console.log("🧾 Final Payload Ready:", sanitizedPayload);

      // --- 5️⃣ Save Courses in DB ---
      for (const entry of sanitizedPayload) {
        const isUnassigned = !entry.branchName;
        const existingGroups = await getCoursesGroupsByBranchName(
          entry.branchName || ""
        );

        if (existingGroups.length) {
          const group = existingGroups[0];
          const existing = group.courses || [];
          const incoming = entry.courses || [];

          const keyOf = (c: any) =>
            `${(c.courseName || "").trim().toLowerCase()}|${(c.subject || "")
              .trim()
              .toLowerCase()}|${(c.mode || "").trim().toLowerCase()}`;

          const existingSet = new Set(existing.map(keyOf));
          const uniqueIncoming = incoming.filter(
            (c: any) => !existingSet.has(keyOf(c))
          );
          const merged = {
            ...group,
            branchName: entry.branchName || "",
            branchAddress: entry.branchAddress || "",
            contactInfo: entry.contactInfo || "",
            locationUrl: entry.locationUrl || "",            
            courses: [...existing, ...uniqueIncoming],
          };
          await updateCoursesGroupInDB(merged);
        } else {
          await addCoursesGroupToDB({
            branchName: entry.branchName || "",
            branchAddress: entry.branchAddress || "",
            contactInfo: entry.contactInfo || "",
            locationUrl: entry.locationUrl || "",
            courses: entry.courses || [],

          });
        }
      }

      console.log("💾 All courses saved successfully.");

      setSelectedCourseId(1);

      // --- 6️⃣ Export if required ---
      if (shouldSkipL3) {
        const response = await exportAndUploadInstitutionAndCourses();
        if (response.success) {
          router.push("/payment");
        } else {
          alert("Failed to upload data");
        }
      }

      onSuccess?.();
    } catch (error) {
      console.error("❌ Error saving courses:", error);
      alert("Failed to save course details. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // / Helper function to validate a single field using your Joi schema
  const validateField = (name: string, value: string) => {
    // Check if the field exists in the branch schema to avoid errors
    const keyExists = L2Schemas.branch.$_terms.keys?.some(
      (k: any) => k.key === name
    );
    if (!keyExists) return "";

    const { error } = L2Schemas.branch.extract(name).validate(value);
    return error ? error.details[0].message : "";
  };

  // ✅ 2. Update handleBranchChange to validate as the user types
  const handleBranchChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    // First, update the branch state
    setBranches((prev) =>
      prev.map((branch) =>
        branch.id === selectedBranchId ? { ...branch, [name]: value } : branch
      )
    );

    // Then, validate the changed field and update the error state
    const error = validateField(name, value);
    setBranchErrors((prev) => ({
      ...prev,
      [selectedBranchId]: {
        ...(prev[selectedBranchId] || {}),
        [name]: error,
      },
    }));
  };

  // ✅ 3. Replace your old handleBranchSubmit with this Joi-powered version
  const handleBranchSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const currentBranch = branches.find((b) => b.id === selectedBranchId);
    if (!currentBranch) return;

    // Validate the entire form using the Joi schema
    const { error } = L2Schemas.branch.validate(currentBranch, {
      abortEarly: false,
      allowUnknown: true, // Important to ignore fields like 'id' or 'dbId'
    });

    // If validation fails...
    if (error) {
      const newErrors: Record<string, string> = {};
      // Collect all error messages
      error.details.forEach((err) => {
        const field = err.path[0] as string;
        newErrors[field] = err.message;
      });
      // Update the state to display all errors at once
      setBranchErrors((prev) => ({
        ...prev,
        [selectedBranchId]: newErrors,
      }));
      return; // Stop the submission
    }

    // If validation passes, clear any previous errors for this branch
    setBranchErrors((prev) => ({
      ...prev,
      [selectedBranchId]: {},
    }));

    setIsLoading(true);
    try {
      // Save branch to backend for subscriptions flow (and general use)
      const payload = {
        branchName: currentBranch.branchName,
        branchAddress: currentBranch.branchAddress,
        contactInfo: currentBranch.contactInfo,
        locationUrl: currentBranch.locationUrl,
      };

    if ((currentBranch as any).dbId) {
      await updateBranchInDB({ id: (currentBranch as any).dbId, ...payload });
    } else {
      const [newId] = await addBranchesToDB([payload]);
      setBranches((prev) =>
        prev.map((b) => (b.id === selectedBranchId ? { ...b, dbId: newId } : b))
      );
    }

    const all = await getAllBranchesFromDB();
    setBranchOptions(all.map((b) => b.branchName).filter(Boolean));
    setShowCourseAfterBranch(true);
    // --- END OF YOUR SAVE LOGIC ---
  } catch (err) {
    console.error("Error saving branch:", err);
  } finally {
    setIsLoading(false);
  }
};

  const isSubscriptionProgram = mode === "subscriptionProgram" || mode === "settingsEdit";

  const content = (
    <Card className="w-full sm:p-6 rounded-[24px] bg-white dark:bg-gray-900 border-0 shadow-none">
      <CardContent className="space-y-6 text-gray-900 dark:text-gray-100">
              {/* Render based on initialSection */}
              {initialSection === "course" ? (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-xl md:text-2xl font-bold dark:text-gray-50">
                      {isStudyHall
                        ? "Study Hall"
                        : isTutionCenter
                        ? "Tuition Hall"
                        : isSubscriptionProgram
                        ? "Program Details"
                        : "Course Details"}
                    </h3>
                    <p className="text-[#697282] dark:text-gray-300 text-sm">
                      {isStudyHall
                        ? "Enter the details of the study hall."
                        : isTutionCenter
                        ? "Enter the details of the tuition hall."
                        : isSubscriptionProgram
                        ? "Enter the programs your institution offers."
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
                                : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
                            }`} 
                          >
                            <span>
                              {course.courseName ||
                                (isStudyHall
                                  ? `Hall ${course.id}`
                                  : isTutionCenter
                                  ? `Hall ${course.id}`
                                  : isSubscriptionProgram
                                  ? `Program ${course.id}`
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
                        : isSubscriptionProgram
                        ? "Add Program"
                        : "Add Course"}
                    </Button>
                  </div>

                  <form onSubmit={handleCourseSubmit} className="space-y-6">
                    {/* Branch Selection - Only show for subscription programs and when branches exist */}
                    {isSubscriptionProgram && uniqueRemoteBranches.length > 0 && (
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Branch</label>
                        <AppSelect
                          value={selectedBranchIdForProgram}
                          onChange={(val)=> { setSelectedBranchIdForProgram(val); setProgramBranchError(""); }}
                          options={uniqueRemoteBranches.map(b=> ({ label: b.branchName, value: b._id }))}
                          placeholder="Select Branch"
                          variant="white"
                          size="md"
                          rounded="lg"
                          className="w-full"
                        />
                        {programBranchError && <p className="text-red-600 text-xs mt-1">{programBranchError}</p>}
                      </div>
                    )}
                    {/*isSubscriptionProgram && uniqueRemoteBranches.length === 0 && (
                      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-700">
                          <strong>Note:</strong> You don't have any branches yet. You can add a branch first, or the program will be added to your main institution.
                        </p>
                      </div>
                    )}*/}
                    
                    {isCoachingCenter ? (
                      <CoachingCourseForm
                        currentCourse={currentCourse}
                        handleCourseChange={handleCourseChange}
                        setCourses={setCourses}
                        courses={courses}
                        selectedCourseId={selectedCourseId}
                        // ✅ Add this line to pass down the errors
                        courseErrors={courseErrorsById[currentCourse.id] || {}}
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
                        courseErrors={courseErrorsById[currentCourse.id] || {}}
                        labelVariant={isSubscriptionProgram ? 'program' : 'course'}
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
                        // ✅ Pass errors to TuitionCenterForm
                        courseErrors={courseErrorsById[currentCourse.id] || {}}
            labelVariant={isSubscriptionProgram ? 'program' : 'course'}
                      />
                    ) : isUnderPostGraduate ? (
                      <UnderPostGraduateForm
                        currentCourse={currentCourse}
                        handleCourseChange={handleCourseChange}
                        setCourses={setCourses}
                        courses={courses}
                        selectedCourseId={selectedCourseId}
                        // ✅ Add this prop to pass the errors down
                        courseErrors={courseErrorsById[currentCourse.id] || {}}
        labelVariant={isSubscriptionProgram ? 'program' : 'course'}
                      />
                    ) : isBasicCourseForm ? (
                      <BasicCourseForm
                        currentCourse={currentCourse}
                        handleCourseChange={handleCourseChange}
                        setCourses={setCourses}
                        courses={courses}
                        selectedCourseId={selectedCourseId}
                        // ✅ This line passes the validation errors for the currently selected course
                        // to the child component. The `|| {}` ensures it's always an object.
                            courseErrors={courseErrorsById[currentCourse.id] || {}}
        labelVariant={isSubscriptionProgram ? 'program' : 'course'}
                      />
                    ) : (
                      <FallbackCourseForm
                        currentCourse={currentCourse}
                        handleCourseChange={handleCourseChange}
                        setCourses={setCourses}
                        courses={courses}
                        selectedCourseId={selectedCourseId}
                        courseErrors={courseErrorsById[currentCourse.id] || {}}
                        labelVariant={isSubscriptionProgram ? 'program' : 'course'}
                      />
                    )}
                    {!isStudyHall && !isTutionCenter && (
                      <div className="grid md:grid-cols-2 gap-6">
                        {uploadFields.map((f) => (
                          <div key={f.type} className="flex flex-col gap-2">
                            <label className="font-medium text-[16px]">
                              {f.label} <span className="text-red-500">*</span>
                            </label>

                            <label className="relative w-full h-[180px] rounded-[12px] border-2 border-dashed border-[#DADADD] bg-[#F8F9FA] flex flex-col items-center justify-center cursor-pointer hover:bg-[#F0F1F2] transition-colors overflow-hidden">
                              {/* ✅ Determine which URL to show first */}
                              {(() => {
                                const previewUrl = currentCourse[
                                  `${f.type}PreviewUrl`
                                ] as string;
                                const uploadedUrl = currentCourse[
                                  `${f.type}Url`
                                ] as string;

                                if (previewUrl) {
                                  if (f.type === "image") {
                                    // 🖼️ Show image (preview first, then uploaded)
                                    return (
                                      <img
                                        src={previewUrl}
                                        alt={`${f.label} Preview`}
                                        // className="object-cover w-full h-full rounded-[12px]"
                                        className="w-[100px] h-[100px] object-cover rounded-md"
                                      />
                                    );
                                  } else {
                                    // 📄 Show brochure (PDF) preview
                                    return (
                                      <div className="flex flex-col items-center justify-center gap-2 p-4 w-full h-full">
                                        <span className="text-sm text-gray-500 truncate">
                                          {(currentCourse[f.type] as File).name}
                                        </span>
                                      </div>
                                    );
                                  }
                                }

                                // 🆕 Default placeholder
                                return (
                                  <>
                                    <Upload
                                      size={24}
                                      className="text-gray-400 dark:text-gray-300 mb-2"
                                    />
                                    <span className="text-sm text-gray-500 dark:text-gray-300">
                                      {f.type === "image"
                                        ? (isSubscriptionProgram ? "Upload Program Image (jpg / jpeg)" : "Upload Course Image (jpg / jpeg / png)")
                                        : (isSubscriptionProgram ? "Upload Program Brochure (pdf)" : "Upload Course Brochure (pdf)")}
                                    </span>
                                  </>
                                );
                              })()}

                              {/* Hidden file input */}
                              <input
                                type="file"
                                accept={f.accept}
                                className="absolute inset-0 opacity-0 cursor-pointer dark:bg-gray-800"
                                onChange={(e) => handleFileChange(e, f.type)}
                              />
                            </label>

                            {/* Show validation error if required */}
                            {courseErrorsById[currentCourse.id]?.[
                              `${f.type}Url`
                            ] && (
                              <p className="text-red-500 text-sm mt-1">
                                {
                                  courseErrorsById[currentCourse.id][
                                    `${f.type}Url`
                                  ]
                                }
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

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
                      selectedBranchId={selectedBranchId}
                      handleBranchChange={handleBranchChange}
                      handleBranchSubmit={handleBranchSubmit}
                      handlePreviousClick={onPrevious}
                      isLoading={isLoading}
                      errors={branchErrors[selectedBranchId] || {}} // Pass the errors for the selected branch
                      // Pass other necessary props like setBranches, setSelectedBranchId etc.
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
                            : isSubscriptionProgram
                            ? "Program Details"
                            : "Course Details"}
                        </h3>
                        <p className="text-[#697282] text-sm">
                          {isStudyHall
                            ? "Enter the details of the study hall."
                            : isTutionCenter
                            ? "Enter the details of the tuition hall."
                            : isSubscriptionProgram
                            ? "Enter the programs your institution offers."
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
                                      : isSubscriptionProgram
                                      ? `Program ${course.id}`
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
                            : isSubscriptionProgram
                            ? "Add Program"
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
                          // ✅ ADD THIS PROP TO DISPLAY THE ERROR
                          error={
                            courseErrorsById[currentCourse.id]?.createdBranch
                          }
                        />
                        
                        {/* Branch Selection for Subscription Programs - Only show when branches exist */}
                        {isSubscriptionProgram && uniqueRemoteBranches.length > 0 && (
                          <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Branch</label>
                            <AppSelect
                              value={selectedBranchIdForProgram}
                              onChange={(val)=> { setSelectedBranchIdForProgram(val); setProgramBranchError(""); }}
                              options={uniqueRemoteBranches.map(b=> ({ label: b.branchName, value: b._id }))}
                              placeholder="Select Branch"
                              variant="white"
                              size="md"
                              rounded="lg"
                              className="w-full"
                            />
                            {programBranchError && <p className="text-red-600 text-xs mt-1">{programBranchError}</p>}
                          </div>
                        )}
                        {isSubscriptionProgram && (
                          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-sm text-blue-700">
                              <strong>Note:</strong> You don't have any branches yet. You can add a branch first, or the program will be added to your main institution.
                            </p>
                          </div>
                        )}
                        
                        {isCoachingCenter ? (
                          <CoachingCourseForm
                            currentCourse={currentCourse}
                            handleCourseChange={handleCourseChange}
                            setCourses={setCourses}
                            courses={courses}
                            selectedCourseId={selectedCourseId}
                            // ✅ Add this line to pass down the errors
                            courseErrors={
                              courseErrorsById[currentCourse.id] || {}
                            }
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
                            courseErrors={
                              courseErrorsById[currentCourse.id] || {}
                            }
                            labelVariant={isSubscriptionProgram ? 'program' : 'course'}
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
                            // ✅ Pass errors to TuitionCenterForm
                            courseErrors={
                              courseErrorsById[currentCourse.id] || {}
                            }
            labelVariant={isSubscriptionProgram ? 'program' : 'course'}
                          />
                        ) : isUnderPostGraduate ? (
                          <UnderPostGraduateForm
                            currentCourse={currentCourse}
                            handleCourseChange={handleCourseChange}
                            setCourses={setCourses}
                            courses={courses}
                            selectedCourseId={selectedCourseId}
                            // ✅ Add this prop to pass the errors down
                            courseErrors={
                              courseErrorsById[currentCourse.id] || {}
                            }
        labelVariant={isSubscriptionProgram ? 'program' : 'course'}
                          />
                        ) : isBasicCourseForm ? (
                          <BasicCourseForm
                            currentCourse={currentCourse}
                            handleCourseChange={handleCourseChange}
                            setCourses={setCourses}
                            courses={courses}
                            selectedCourseId={selectedCourseId}
                            // ✅ This line passes the validation errors for the currently selected course
                            // to the child component. The `|| {}` ensures it's always an object.
                                courseErrors={
                              courseErrorsById[currentCourse.id] || {}
                            }
        labelVariant={isSubscriptionProgram ? 'program' : 'course'}
                          />
                        ) : (
                          <FallbackCourseForm
                            currentCourse={currentCourse}
                            handleCourseChange={handleCourseChange}
                            setCourses={setCourses}
                            courses={courses}
                            selectedCourseId={selectedCourseId}
                            courseErrors={courseErrorsById[currentCourse.id] || {}}
                            labelVariant={isSubscriptionProgram ? 'program' : 'course'}
                          />
                        )}
                        {!isStudyHall && !isTutionCenter && (
                          <div className="grid md:grid-cols-2 gap-6">
                            {uploadFields.map((f) => (
                              <div key={f.type} className="flex flex-col gap-2">
                                <label className="font-medium text-[16px]">
                                  {f.label}{" "}
                                  <span className="text-red-500">*</span>
                                </label>

                                <label className="relative w-full h-[180px] rounded-[12px] border-2 border-dashed border-[#DADADD] bg-[#F8F9FA] flex flex-col items-center justify-center cursor-pointer hover:bg-[#F0F1F2] transition-colors overflow-hidden">
                                  {/* ✅ Determine which URL to show first */}
                                  {(() => {
                                    const previewUrl = currentCourse[
                                      `${f.type}PreviewUrl`
                                    ] as string;
                                    const uploadedUrl = currentCourse[
                                      `${f.type}Url`
                                    ] as string;

                                    if (previewUrl || uploadedUrl) {
                                      if (f.type === "image") {
                                        // 🖼️ Show image (preview first, then uploaded)
                                        return (
                                          <img
                                            src={previewUrl || uploadedUrl}
                                            alt={`${f.label} Preview`}
                                            className="object-cover w-full h-full rounded-[12px]"
                                          />
                                        );
                                      } else {
                                        // 📄 Show brochure (PDF) preview
                                        return (
                                          <div className="flex flex-col items-center justify-center gap-2 p-4 w-full h-full">
                                            <span className="text-sm text-gray-500 truncate">
                                              {
                                                (currentCourse[f.type] as File)
                                                  .name
                                              }
                                            </span>
                                          </div>
                                        );
                                      }
                                    }

                                    // 🆕 Default placeholder
                                    return (
                                      <>
                                        <Upload
                                          size={24}
                                          className="text-gray-400 dark:text-gray-300 mb-2"
                                        />
                                        <span className="text-sm text-gray-500 dark:text-gray-300">
                                          {f.type === "image"
                                            ? "Upload Course Image (jpg / jpeg / png)"
                                            : "Upload Course Brochure (pdf)"}
                                        </span>
                                      </>
                                    );
                                  })()}

                                  {/* Hidden file input */}
                                  <input
                                    type="file"
                                    accept={f.accept}
                                    className="absolute inset-0 opacity-0 cursor-pointer dark:bg-gray-800"
                                    onChange={(e) =>
                                      handleFileChange(e, f.type)
                                    }
                                  />
                                </label>

                                {/* Show validation error if required */}
                                {courseErrorsById[currentCourse.id]?.[
                                  `${f.type}Url`
                                ] && (
                                  <p className="text-red-500 text-sm mt-1">
                                    {
                                      courseErrorsById[currentCourse.id][
                                        `${f.type}Url`
                                      ]
                                    }
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

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
  );

  if (renderMode === "inline") {
    return content;
  }

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
          {content}
        </DialogContent>
      </Dialog>
    </>
  );
}
