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
import { Clock } from "lucide-react";
import { institutionDetailsAPI, clearInstitutionData } from "@/lib/api";
import { validateField, validateForm } from "@/lib/validations/validateField";
import {
  KindergartenSchema,
  SchoolSchema,
  CoachingSchema,
  CollegeSchema,
  UndergraduateSchema,
} from "@/lib/validations/L3Schema";
import {
  addInstitutionToDB,
  getAllInstitutionsFromDB,
  updateInstitutionInDB,
} from "@/lib/localDb";
import {
  exportAndUploadInstitutionAndCourses,
  exportInstitutionAndCoursesToFile,
} from "@/lib/utility";

interface L3DialogBoxProps {
  trigger?: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  onPrevious?: () => void; // 👈 add this
}

interface InputFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => void;
  isSelect?: boolean;
  isRadio?: boolean;
  options?: string[];
  placeholder?: string;
  icon?: React.ReactNode;
  className?: string;
  error?: string;
}
interface InputFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => void;
  placeholder?: string;
  options?: string[];
  isSelect?: boolean;
  isRadio?: boolean;
  isTextarea?: boolean;
  rows?: number;
  error?: string;
}

interface FormData {
  schoolType: string;
  curriculumType: string;
  openingTime: string;
  closingTime: string;
  operationalDays: string[];
  extendedCare: string;
  mealsProvided: string;
  outdoorPlayArea: string;
}

interface SchoolFormData {
  schoolType: string;
  schoolCategory: string;
  curriculumType: string;
  operationalDays: string[];
  otherActivities: string;
  hostelFacility: string;
  playground: string;
  busService: string;
}

interface CoachingFormData {
  placementDrives: string;
  mockInterviews: string;
  resumeBuilding: string;
  linkedinOptimization: string;
  exclusiveJobPortal: string;
  certification: string;
}

interface IntermediateFormData {
  collegeType: string;
  collegeCategory: string;
  curriculumType: string;
  operationalDays: string[];
  otherActivities: string;
  hostelFacility: string;
  playground: string;
  busService: string;
}

interface UndergraduateFormData {
  ownershipType: string;
  collegeCategory: string;
  affiliationType: string;
  placementDrives: string;
  mockInterviews: string;
  resumeBuilding: string;
  linkedinOptimization: string;
  exclusiveJobPortal: string;
  library: string;
  hostelFacility: string;
  entranceExam: string;
  managementQuota: string;
  playground: string;
  busService: string;
}

export default function L3DialogBox({
  trigger,
  open,
  onOpenChange,
  onSuccess,
  onPrevious,
}: L3DialogBoxProps) {
  const router = useRouter();
  // const [institutionType, setInstitutionType] = useState<string | null>(null);const response = await courseAPI.createCourses(courses);

  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const institutionType = localStorage.getItem("institutionType");
  // Check institution types - default to kindergarten if no type is set
  const isKindergarten =
    institutionType === "Kindergarten/childcare center" ||
    institutionType === null;
  const isSchool = institutionType === "School's";
  const isCoaching = institutionType === "Coaching centers";
  const isIntermediate = institutionType === "Intermediate college(K12)";
  const isUndergraduate =
    institutionType === "Under Graduation/Post Graduation";

  useEffect(() => {
    if (!dialogOpen) return;

    let isMounted = true;
    (async () => {
      try {
        const institutions = await getAllInstitutionsFromDB();
        if (!isMounted) return;

        if (institutions && institutions.length > 0) {
          const latest = institutions.sort(
            (a, b) => (b.createdAt || 0) - (a.createdAt || 0)
          )[0];
          setFormData({
            schoolType: latest.schoolType || "",
            curriculumType: latest.curriculumType || "",
            openingTime: latest.openingTime || "",
            closingTime: latest.closingTime || "",
            operationalDays: latest.operationalDays || [],
            extendedCare: latest.extendedCare || "",
            mealsProvided: latest.mealsProvided || "",
            outdoorPlayArea: latest.outdoorPlayArea || "",
          });
        } else {
          // ensure blank state
          setFormData({
            schoolType: "",
            curriculumType: "",
            openingTime: "",
            closingTime: "",
            operationalDays: [],
            extendedCare: "",
            mealsProvided: "",
            outdoorPlayArea: "",
          });
        }
      } catch (err) {
        console.error("Failed to load institutions from IndexedDB", err);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  const [formData, setFormData] = useState<FormData>({
    schoolType: "",
    curriculumType: "",
    openingTime: "",
    closingTime: "",
    operationalDays: [],
    extendedCare: "",
    mealsProvided: "",
    outdoorPlayArea: "",
  });

  const [schoolFormData, setSchoolFormData] = useState<SchoolFormData>({
    schoolType: "",
    schoolCategory: "",
    curriculumType: "",
    operationalDays: [],
    otherActivities: "",
    hostelFacility: "",
    playground: "",
    busService: "",
  });

  const [coachingFormData, setCoachingFormData] = useState<CoachingFormData>({
    placementDrives: "",
    mockInterviews: "",
    resumeBuilding: "",
    linkedinOptimization: "",
    exclusiveJobPortal: "",
    certification: "",
  });

  const [collegeFormData, setCollegeFormData] = useState<IntermediateFormData>({
    collegeType: "",
    collegeCategory: "",
    curriculumType: "",
    operationalDays: [],
    otherActivities: "",
    hostelFacility: "",
    playground: "",
    busService: "",
  });

  const [undergraduateFormData, setUndergraduateFormData] =
    useState<UndergraduateFormData>({
      ownershipType: "",
      collegeCategory: "",
      affiliationType: "",
      placementDrives: "",
      mockInterviews: "",
      resumeBuilding: "",
      linkedinOptimization: "",
      exclusiveJobPortal: "",
      library: "",
      hostelFacility: "",
      entranceExam: "",
      managementQuota: "",
      playground: "",
      busService: "",
    });

  const [formErrors, setFormErrors] = useState<
    Partial<Record<keyof FormData, string>>
  >({});
  const [schoolFormErrors, setSchoolFormErrors] = useState<
    Partial<Record<keyof SchoolFormData, string>>
  >({});
  const [coachingFormErrors, setCoachingFormErrors] = useState<
    Partial<Record<keyof CoachingFormData, string>>
  >({});
  const [collegeFormErrors, setCollegeFormErrors] = useState<
    Partial<Record<keyof IntermediateFormData, string>>
  >({});
  const [undergraduateFormErrors, setUndergraduateFormErrors] = useState<
    Partial<Record<keyof UndergraduateFormData, string>>
  >({});

  // Handle controlled open state
  const dialogOpen = open !== undefined ? open : isOpen;
  const setDialogOpen = onOpenChange || setIsOpen;

  // ---------- Handlers ----------

  const handleRadioChangeField = (name: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    const error = validateField(KindergartenSchema, name, value);
    setFormErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleOperationalDayToggle = (day: string) => {
    setFormData((prev) => {
      const updatedDays = prev.operationalDays.includes(day)
        ? prev.operationalDays.filter((d) => d !== day)
        : [...prev.operationalDays, day];

      const error = validateField(
        KindergartenSchema,
        "operationalDays",
        updatedDays
      );
      setFormErrors((prevErrors) => ({
        ...prevErrors,
        operationalDays: error,
      }));

      return { ...prev, operationalDays: updatedDays };
    });
  };

  // --- ONCHANGE HANDLERS ---

  // Time fields (opening/closing) handler
  const handleTimeChange = (
    name: "openingTime" | "closingTime",
    value: string
  ) => {
    setFormData((prev) => ({ ...prev, [name]: value }));

    const error = validateField(KindergartenSchema, name, value); // Joi schema handles HH:MM + required
    setFormErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleFieldChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    const error = validateField(KindergartenSchema, name, value);
    setFormErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleSchoolFieldChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    // Update state
    setSchoolFormData((prev) => ({ ...prev, [name]: value }));

    // Dynamic validation
    const error = validateField(SchoolSchema, name, value);
    setSchoolFormErrors((prev) => ({ ...prev, [name]: error || "" }));
  };
  const handleSchoolRadioChangeWithValidation = (
    name: keyof SchoolFormData,
    value: string
  ) => {
    setSchoolFormData((prev) => ({ ...prev, [name]: value }));

    const error = validateField(SchoolSchema, name, value);
    setSchoolFormErrors((prev) => ({ ...prev, [name]: error || "" }));
  };

  const handleSchoolOperationalDayToggle = (day: string) => {
    setSchoolFormData((prev) => {
      const updatedDays = prev.operationalDays.includes(day)
        ? prev.operationalDays.filter((d) => d !== day)
        : [...prev.operationalDays, day];

      // Validate array
      const error = validateField(SchoolSchema, "operationalDays", updatedDays);
      setSchoolFormErrors((prev) => ({
        ...prev,
        operationalDays: error || "",
      }));

      return { ...prev, operationalDays: updatedDays };
    });
  };
  const handleSchoolSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // setSubmitted(true);

    // ✅ Validate with Joi (or your validateForm util)
    const errors = validateForm(SchoolSchema, schoolFormData);
    setSchoolFormErrors(errors);

    if (Object.keys(errors).length > 0) return; // stop if errors exist

    setIsLoading(true);

    try {
      // Normalize Yes/No → booleans
      const schoolFormDataWithBooleans = {
        ...schoolFormData,
        hostelFacility: schoolFormData.hostelFacility === "Yes",
        playground: schoolFormData.playground === "Yes",
        busService: schoolFormData.busService === "Yes",
      };

      // 1) Load existing schools
      const schools = await getAllInstitutionsFromDB?.(); // ✅ you’ll need this in your localDb.ts

      // Normalize for comparison
      const normalize = (x: any) => ({
        schoolType: x.schoolType || "",
        schoolCategory: x.schoolCategory || "",
        curriculumType: x.curriculumType || "",
        operationalDays: x.operationalDays || [],
        otherActivities: x.otherActivities || "",
        hostelFacility: !!x.hostelFacility,
        playground: !!x.playground,
        busService: !!x.busService,
      });

      const latest =
        schools && schools.length > 0
          ? schools.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))[0]
          : null;

      const current = normalize(schoolFormDataWithBooleans);
      let effectiveId: number | null = null;

      if (latest) {
        const latestNormalized = normalize(latest);
        const isSame =
          JSON.stringify(latestNormalized) === JSON.stringify(current);

        if (isSame) {
          // ✅ unchanged → skip saving
          effectiveId = latest.id || null;
        } else {
          // ✅ update existing
          await updateInstitutionInDB({
            ...(latest as any),
            ...current,
            id: latest.id,
          });
          effectiveId = latest.id || null;
        }
      } else {
        // ✅ insert new
        const id = await addInstitutionToDB(current);
        effectiveId = id;
        console.log("School saved locally with id:", id);
      }

      // 2) Store reference in localStorage (optional)
      if (typeof window !== "undefined") {
        if (effectiveId !== null) {
          localStorage.setItem("schoolId", String(effectiveId));
        }
      }

      // 3) Success → close dialog & reset form
      setDialogOpen(false);
        // setSubmitted(false);
      setSchoolFormErrors({});
        setSchoolFormData({
          schoolType: "",
          schoolCategory: "",
          curriculumType: "",
          operationalDays: [],
          otherActivities: "",
          hostelFacility: "",
          playground: "",
          busService: "",
        });

      //   router.push("/dashboard");
      const uploadResponse = await exportInstitutionAndCoursesToFile();
      console.log("Upload response:", uploadResponse);

      //   if (!uploadResponse.success) {
      //     alert(uploadResponse.message || "Failed to upload institution file.");
      //   }

      // Success → close dialog & reset form
      setDialogOpen(false);
      setSchoolFormErrors({});
      onSuccess?.();
    } catch (error) {
      console.error("Error saving school details:", error);
      alert("Failed to save school details locally. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSchoolChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setSchoolFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSchoolOperationalDayChange = (day: string) => {
    setSchoolFormData((prev) => ({
      ...prev,
      operationalDays: prev.operationalDays.includes(day)
        ? prev.operationalDays.filter((d) => d !== day)
        : [...prev.operationalDays, day],
    }));
  };

  const handleSchoolRadioChange = (name: string, value: string) => {
    setSchoolFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCoachingRadioChange = (name: string, value: string) => {
    setCoachingFormData((prev) => ({ ...prev, [name]: value }));
  };
  const handleCollegeFieldChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    // Update college form data
    setCollegeFormData((prev) => ({ ...prev, [name]: value }));

    // Dynamic validation
    const error = validateField(CollegeSchema, name, value);
    setCollegeFormErrors((prev) => ({ ...prev, [name]: error || "" }));
  };

  const handleCollegeOperationalDayToggle = (day: string) => {
    setCollegeFormData((prev) => {
      const updatedDays = prev.operationalDays.includes(day)
        ? prev.operationalDays.filter((d) => d !== day)
        : [...prev.operationalDays, day];

      // Validate array
      const error = validateField(
        CollegeSchema,
        "operationalDays",
        updatedDays
      );
      setCollegeFormErrors((prev) => ({
        ...prev,
        operationalDays: error || "",
      }));

      return { ...prev, operationalDays: updatedDays };
    });
  };
  const handleCollegeRadioChangeWithValidation = (
    name: keyof IntermediateFormData,
    value: string
  ) => {
    setCollegeFormData((prev) => ({ ...prev, [name]: value }));

    const error = validateField(CollegeSchema, name, value);
    setCollegeFormErrors((prev) => ({ ...prev, [name]: error || "" }));
  };

  const handleCollegeSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // setSubmitted(true);

    // ✅ Validate form
    const errors = validateForm(CollegeSchema, collegeFormData);
    setCollegeFormErrors(errors);

    if (Object.keys(errors).length > 0) return;

    setIsLoading(true);

    try {
      // ✅ Normalize Yes/No → boolean
      const collegeFormDataWithBooleans = {
        ...collegeFormData,
        hostelFacility: collegeFormData.hostelFacility === "Yes",
        playground: collegeFormData.playground === "Yes",
        busService: collegeFormData.busService === "Yes",
      };

      // 1) Load existing colleges from IndexedDB
      const colleges = await getAllInstitutionsFromDB?.(); // 🔑 need to implement in localDb.ts

      // Normalize for comparison
      const normalize = (x: any) => ({
        collegeType: x.collegeType || "",
        collegeCategory: x.collegeCategory || "",
        curriculumType: x.curriculumType || "",
        operationalDays: x.operationalDays || [],
        otherActivities: x.otherActivities || "",
        hostelFacility: !!x.hostelFacility,
        playground: !!x.playground,
        busService: !!x.busService,
      });

      const latest =
        colleges && colleges.length > 0
          ? colleges.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))[0]
          : null;

      const current = normalize(collegeFormDataWithBooleans);
      let effectiveId: number | null = null;

      if (latest) {
        const latestNormalized = normalize(latest);
        const isSame =
          JSON.stringify(latestNormalized) === JSON.stringify(current);

        if (isSame) {
          // ✅ unchanged → skip saving
          effectiveId = latest.id || null;
        } else {
          // ✅ update existing
          await updateInstitutionInDB({
            ...(latest as any),
            ...current,
            id: latest.id,
          });
          effectiveId = latest.id || null;
        }
      } else {
        // ✅ insert new
        const id = await addInstitutionToDB(current);
        effectiveId = id;
        console.log("College saved locally with id:", id);
      }

      // 2) Save reference in localStorage (optional)
      if (typeof window !== "undefined") {
        if (effectiveId !== null) {
          localStorage.setItem("collegeId", String(effectiveId));
        }
      }

      const response = await exportAndUploadInstitutionAndCourses();
      console.log("Upload response:", response);

      if (response.success) {
        // 3) Success → reset + redirect
        setDialogOpen(false);
        //   setSubmitted(false);
        setCollegeFormErrors({});
        setCollegeFormData({
          collegeType: "",
          collegeCategory: "",
          curriculumType: "",
          operationalDays: [],
          otherActivities: "",
          hostelFacility: "",
          playground: "",
          busService: "",
        });

        router.push("/payment");
        onSuccess?.();
      } else {
        alert(
          response.message ||
            "Failed to save college details. Please try again."
        );
      }
    } catch (error) {
      console.error("Error saving college details locally:", error);
      alert("Failed to save college details locally. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCollegeChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setCollegeFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCollegeOperationalDayChange = (day: string) => {
    setCollegeFormData((prev) => ({
      ...prev,
      operationalDays: prev.operationalDays.includes(day)
        ? prev.operationalDays.filter((d) => d !== day)
        : [...prev.operationalDays, day],
    }));
  };

  const handleCollegeRadioChange = (name: string, value: string) => {
    setCollegeFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCoachingSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // setSubmitted(true);

    // ✅ Validate form
    const errors = validateForm(CoachingSchema, coachingFormData);
    setCoachingFormErrors(errors);

    if (errors && Object.keys(errors).length > 0) return;

    setIsLoading(true);

    try {
      // ✅ Normalize Yes/No → booleans
      const coachingFormDataWithBooleans = {
        ...coachingFormData,
        placementDrives: coachingFormData.placementDrives === "Yes",
        mockInterviews: coachingFormData.mockInterviews === "Yes",
        resumeBuilding: coachingFormData.resumeBuilding === "Yes",
        linkedinOptimization: coachingFormData.linkedinOptimization === "Yes",
        exclusiveJobPortal: coachingFormData.exclusiveJobPortal === "Yes",
        certification: coachingFormData.certification === "Yes",
      };

      // 1) Load existing coaching records
      const coachings = await getAllInstitutionsFromDB?.(); // 🔑 needs to exist in localDb.ts

      // Normalize for comparison
      const normalize = (x: any) => ({
        placementDrives: !!x.placementDrives,
        mockInterviews: !!x.mockInterviews,
        resumeBuilding: !!x.resumeBuilding,
        linkedinOptimization: !!x.linkedinOptimization,
        exclusiveJobPortal: !!x.exclusiveJobPortal,
        certification: !!x.certification,
      });

      const latest =
        coachings && coachings.length > 0
          ? coachings.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))[0]
          : null;

      const current = normalize(coachingFormDataWithBooleans);
      let effectiveId: number | null = null;

      if (latest) {
        const latestNormalized = normalize(latest);
        const isSame =
          JSON.stringify(latestNormalized) === JSON.stringify(current);

        if (isSame) {
          // ✅ unchanged → skip saving
          effectiveId = latest.id || null;
        } else {
          // ✅ update existing
          await updateInstitutionInDB({
            ...(latest as any),
            ...current,
            id: latest.id,
          });
          effectiveId = latest.id || null;
        }
      } else {
        // ✅ insert new
        const id = await addInstitutionToDB(current);
        effectiveId = id;
        console.log("Coaching center saved locally with id:", id);
      }

      // 2) Save reference in localStorage
      if (typeof window !== "undefined") {
        if (effectiveId !== null) {
          localStorage.setItem("coachingId", String(effectiveId));
        }
      }

      const response = await exportAndUploadInstitutionAndCourses();
      console.log("Upload response:", response);

      if (response.success) {
        // 3) Success → reset + redirect
        setDialogOpen(false);
        //   setSubmitted(false);
        setCoachingFormErrors({});
        setCoachingFormData({
          placementDrives: "",
          mockInterviews: "",
          resumeBuilding: "",
          linkedinOptimization: "",
          exclusiveJobPortal: "",
          certification: "",
        });

        router.push("/payment");
        onSuccess?.();
      } else {
        alert(
          response.message ||
            "Failed to save coaching center details. Please try again."
        );
      }
    } catch (error) {
      console.error("Error saving coaching center details locally:", error);
      alert(
        "Failed to save coaching center details locally. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleUndergraduateChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    // Update form data
    setUndergraduateFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Validate the single field against the UndergraduateSchema
    const fieldSchema = UndergraduateSchema.extract(name);
    const { error } = fieldSchema.validate(value);

    // Update errors: clear if valid
    setUndergraduateFormErrors((prev) => ({
      ...prev,
      [name]: error ? error.message : "",
    }));
  };

  const handleUndergraduateSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // ✅ Validate form
    const errors = validateForm(UndergraduateSchema, undergraduateFormData);
    setUndergraduateFormErrors(errors);

    if (Object.keys(errors).length > 0) return;

    setIsLoading(true);

    try {
      // ✅ Normalize Yes/No → boolean
      const undergraduateFormDataWithBooleans = {
        ...undergraduateFormData,
        placementDrives: undergraduateFormData.placementDrives === "Yes",
        mockInterviews: undergraduateFormData.mockInterviews === "Yes",
        resumeBuilding: undergraduateFormData.resumeBuilding === "Yes",
        linkedinOptimization:
          undergraduateFormData.linkedinOptimization === "Yes",
        exclusiveJobPortal: undergraduateFormData.exclusiveJobPortal === "Yes",
        library: undergraduateFormData.library === "Yes",
        hostelFacility: undergraduateFormData.hostelFacility === "Yes",
        entranceExam: undergraduateFormData.entranceExam === "Yes",
        managementQuota: undergraduateFormData.managementQuota === "Yes",
        playground: undergraduateFormData.playground === "Yes",
        busService: undergraduateFormData.busService === "Yes",
      };

      // 1) Load existing undergraduates from IndexedDB
      const undergraduates = await getAllInstitutionsFromDB?.(); // 🔑 implement in localDb.ts

      // Normalize for comparison
      const normalize = (x: any) => ({
        ownershipType: x.ownershipType || "",
        collegeCategory: x.collegeCategory || "",
        affiliationType: x.affiliationType || "",
        placementDrives: !!x.placementDrives,
        mockInterviews: !!x.mockInterviews,
        resumeBuilding: !!x.resumeBuilding,
        linkedinOptimization: !!x.linkedinOptimization,
        exclusiveJobPortal: !!x.exclusiveJobPortal,
        library: !!x.library,
        hostelFacility: !!x.hostelFacility,
        entranceExam: !!x.entranceExam,
        managementQuota: !!x.managementQuota,
        playground: !!x.playground,
        busService: !!x.busService,
      });

      const latest =
        undergraduates && undergraduates.length > 0
          ? undergraduates.sort(
              (a, b) => (b.createdAt || 0) - (a.createdAt || 0)
            )[0]
          : null;

      const current = normalize(undergraduateFormDataWithBooleans);
      let effectiveId: number | null = null;

      if (latest) {
        const latestNormalized = normalize(latest);
        const isSame =
          JSON.stringify(latestNormalized) === JSON.stringify(current);

        if (isSame) {
          // ✅ unchanged → skip saving
          effectiveId = latest.id || null;
        } else {
          // ✅ update existing
          await updateInstitutionInDB({
            ...(latest as any),
            ...current,
            id: latest.id,
          });
          effectiveId = latest.id || null;
        }
      } else {
        // ✅ insert new
        const id = await addInstitutionToDB(current);
        effectiveId = id;
        console.log("Undergraduate details saved locally with id:", id);
      }

      // 2) Save reference in localStorage (optional)
      if (typeof window !== "undefined") {
        if (effectiveId !== null) {
          localStorage.setItem("undergraduateId", String(effectiveId));
        }
      }

      const response = await exportAndUploadInstitutionAndCourses();
      console.log("Upload response:", response);

      if (response.success) {
        // 3) Success → reset + redirect
        setDialogOpen(false);
        setUndergraduateFormErrors({});
        setUndergraduateFormData({
          ownershipType: "",
          collegeCategory: "",
          affiliationType: "",
          placementDrives: "",
          mockInterviews: "",
          resumeBuilding: "",
          linkedinOptimization: "",
          exclusiveJobPortal: "",
          library: "",
          hostelFacility: "",
          entranceExam: "",
          managementQuota: "",
          playground: "",
          busService: "",
        });

        router.push("/payment");
        onSuccess?.();
      } else {
        alert(
          response.message || "Failed to save UG details. Please try again."
        );
      }
    } catch (error) {
      console.error("Error saving UG details locally:", error);
      alert("Failed to save UG details locally. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Use the same handler for radios
  const handleUndergraduateRadioChange = handleUndergraduateChange;

  const operationalDaysOptions = ["Mon", "Tues", "Wed", "Thur", "Fri", "Sat"];

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    // Update form data
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Validate field
    const error = validateField(KindergartenSchema, name, value);
    setFormErrors((prev) => ({ ...prev, [name]: error || "" }));
  };

  // Handle radio button change
  const handleRadioChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));

    const error = validateField(KindergartenSchema, name, value);
    setFormErrors((prev) => ({ ...prev, [name]: error || "" }));
  };

  // Handle operational days toggle
  const handleOperationalDayChange = (day: string) => {
    const updatedDays = formData.operationalDays.includes(day)
      ? formData.operationalDays.filter((d) => d !== day)
      : [...formData.operationalDays, day];

    setFormData((prev) => ({ ...prev, operationalDays: updatedDays }));

    const error = validateField(
      KindergartenSchema,
      "operationalDays",
      updatedDays
    );
    setFormErrors((prev) => ({ ...prev, operationalDays: error || "" }));
  };

  const handleCoachingFieldChange = (
    name: keyof CoachingFormData,
    value: string
  ) => {
    setCoachingFormData((prev) => ({ ...prev, [name]: value }));

    // Validate single field dynamically
    const error = validateField(CoachingSchema, name, value);
    setCoachingFormErrors((prev) => ({ ...prev, [name]: error || "" }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validate with Joi
    const errors = validateForm(KindergartenSchema, formData);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsLoading(true);

    try {
      // ✅ Normalize Yes/No → booleans
      const formDataWithBooleans = {
        ...formData,
        extendedCare: formData.extendedCare === "Yes",
        mealsProvided: formData.mealsProvided === "Yes",
        outdoorPlayArea: formData.outdoorPlayArea === "Yes",
      };

      // 1) Load existing institutions
      const institutions = await getAllInstitutionsFromDB();
      const latest =
        institutions && institutions.length > 0
          ? institutions.sort(
              (a, b) => (b.createdAt || 0) - (a.createdAt || 0)
            )[0]
          : null;

      // Normalize for comparison
      const normalize = (x: any) => ({
        schoolType: x.schoolType || "",
        curriculumType: x.curriculumType || "",
        openingTime: x.openingTime || "",
        closingTime: x.closingTime || "",
        operationalDays: x.operationalDays || [],
        extendedCare: !!x.extendedCare,
        mealsProvided: !!x.mealsProvided,
        outdoorPlayArea: !!x.outdoorPlayArea,
      });

      const current = normalize(formDataWithBooleans);
      let effectiveId: number | null = null;

      if (latest) {
        const latestNormalized = normalize(latest);
        const isSame =
          JSON.stringify(latestNormalized) === JSON.stringify(current);

        if (isSame) {
          effectiveId = latest.id || null; // no changes
        } else {
          // ✅ update existing
          await updateInstitutionInDB({
            ...(latest as any),
            ...current,
            id: latest.id,
            createdAt: latest.createdAt, // preserve createdAt
            updatedAt: Date.now(),
          });
          effectiveId = latest.id || null;
        }
      } else {
        // ✅ insert new
        const id = await addInstitutionToDB({
          ...(latest as any),
          ...current,
          createdAt: Date.now(),
        });
        effectiveId = id;
        console.log("Kindergarten saved locally with id:", id);
      }

      // 2) Save reference in localStorage
      if (typeof window !== "undefined" && effectiveId !== null) {
        localStorage.setItem("institutionId", String(effectiveId));
      }

      // 3) Export + upload
      const response = await exportAndUploadInstitutionAndCourses();
      console.log("Upload response:", response);

      if (response.success) {
        // ✅ success → reset and redirect
        setDialogOpen(false);
        onSuccess?.();

        setFormData({
          schoolType: "",
          curriculumType: "",
          openingTime: "",
          closingTime: "",
          operationalDays: [],
          extendedCare: "",
          mealsProvided: "",
          outdoorPlayArea: "",
        });

        router.push("/payment");
      } else {
        alert(response.message || "Failed to save kindergarten details.");
      }
    } catch (error) {
      console.error("Error saving kindergarten details:", error);
      alert("Failed to save kindergarten details locally. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
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
            {isKindergarten && (
              <>
                <div className="space-y-2">
                  <h3 className="text-xl md:text-2xl font-bold">
                    Inside Your Kindergarten.
                  </h3>
                  <p className="text-[#697282] text-sm">
                    Fill in this checklist with the important details parents
                    look for.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Row 1: School Type and Curriculum Type */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField
                      label="School type"
                      name="schoolType"
                      value={formData.schoolType}
                      onChange={handleChange}
                      isSelect
                      options={[
                        "Public",
                        "Private (For-profit)",
                        "Private (Non-profit)",
                        "International",
                        "Home - based",
                      ]}
                      placeholder="Select school type"
                      error={formErrors.schoolType}
                      required
                    />

                    <InputField
                      label="Curriculum type"
                      name="curriculumType"
                      value={formData.curriculumType}
                      onChange={handleChange}
                      placeholder="Enter Curriculum type"
                      error={formErrors.curriculumType}
                      required
                    />
                  </div>

                  {/* Row 2: Operational Times */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-2">
                      <label className="font-[Montserrat] font-medium text-[16px] md:text-[18px] text-black">
                        Operational Time's{" "}
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <InputField
                          label=""
                          name="openingTime"
                          value={formData.openingTime}
                          onChange={handleChange}
                          placeholder="Opening time"
                          className="max-w-none"
                          icon={<Clock size={18} className="text-[#697282]" />}
                          error={formErrors.openingTime}
                        />
                        <InputField
                          label=""
                          name="closingTime"
                          value={formData.closingTime}
                          onChange={handleChange}
                          placeholder="Closing time"
                          className="max-w-none"
                          icon={<Clock size={18} className="text-[#697282]" />}
                          error={formErrors.closingTime}
                        />
                      </div>
                    </div>

                    {/* Operational Days */}
                    <div className="flex flex-col gap-4">
                      <label className="font-[Montserrat] font-medium text-[16px] md:text-[18px] text-black">
                        Operational Day's{" "}
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                      <div className="grid grid-cols-6 gap-2">
                        {operationalDaysOptions.map((day) => (
                          <Button
                            key={day}
                            type="button"
                            onClick={() => handleOperationalDayChange(day)}
                            className={`h-[48px] px-3 rounded-[8px] border text-sm ${
                              formData.operationalDays.includes(day)
                                ? "bg-[#0222D7] border-[#0222D7] text-white hover:!bg-[#0222D7]"
                                : "bg-[#F5F6F9] border-[#DADADD] text-[#697282] hover:!bg-[#F5F6F9] hover:!text-[#697282]"
                            }`}
                          >
                            {day}
                          </Button>
                        ))}
                      </div>
                      {formErrors.operationalDays && (
                        <p className="text-red-500 text-sm">
                          {formErrors.operationalDays}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Row 3: Radio Button Questions */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField
                      label="Extended care ?"
                      name="extendedCare"
                      value={formData.extendedCare}
                      onChange={(e) =>
                        handleRadioChange("extendedCare", e.target.value)
                      }
                      isRadio
                      options={["Yes", "No"]}
                      error={formErrors.extendedCare}
                      required
                    />

                    <InputField
                      label="Meals Provided?"
                      name="mealsProvided"
                      value={formData.mealsProvided}
                      onChange={(e) =>
                        handleRadioChange("mealsProvided", e.target.value)
                      }
                      isRadio
                      options={["Yes", "No"]}
                      error={formErrors.mealsProvided}
                      required
                    />
                  </div>

                  {/* Row 4: Outdoor Play area */}
                  <InputField
                    label="Outdoor Play area?"
                    name="outdoorPlayArea"
                    value={formData.outdoorPlayArea}
                    onChange={(e) =>
                      handleRadioChange("outdoorPlayArea", e.target.value)
                    }
                    isRadio
                    options={["Yes", "No"]}
                    error={formErrors.outdoorPlayArea}
                    required
                  />
                  {/* Button Group */}
                  <div className="flex justify-center pt-4">
                    <div className="flex flex-row items-center justify-center gap-10 w-full max-w-[668px]">
                      <button
                        type="button"
                        onClick={() => onPrevious?.()} // optional chaining
                        className="w-[314px] h-[48px] border border-[#697282] text-[#697282] rounded-[12px] font-semibold text-[18px] leading-[22px] flex items-center justify-center shadow-inner"
                      >
                        Previous
                      </button>

                      {/* Save & Next Button */}
                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-[314px] h-[48px] bg-[#697282] text-[#F5F6F9] rounded-[12px] font-semibold text-[18px] leading-[22px] flex items-center justify-center hover:bg-[#5b626f] transition-colors"
                      >
                        {isLoading ? "Saving..." : "Save & Next"}
                      </Button>
                    </div>
                  </div>
                </form>
              </>
            )}

            {isSchool && (
              <>
                <div className="space-y-2">
                  <h3 className="text-xl md:text-2xl font-bold">
                    Inside Your School.
                  </h3>
                  <p className="text-[#697282] text-sm">
                    Fill in this checklist with the important details students
                    and parents look for.
                  </p>
                </div>

                <form onSubmit={handleSchoolSubmit} className="space-y-6">
                  {/* Row 1: School Type and School Category */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField
                      label="School type"
                      name="schoolType"
                      value={schoolFormData.schoolType}
                      onChange={handleSchoolFieldChange}
                      isSelect={true}
                      options={["Co-ed", "Boys Only", "Girls Only"]}
                      placeholder="Select school type"
                      error={schoolFormErrors.schoolType}
                      required
                    />

                    <InputField
                      label="School category"
                      name="schoolCategory"
                      value={schoolFormData.schoolCategory}
                      onChange={handleSchoolFieldChange}
                      isSelect={true}
                      options={[
                        "Public",
                        "Private",
                        "Charter",
                        "International",
                      ]}
                      placeholder="Select school Category"
                      error={schoolFormErrors.schoolCategory}
                      required
                    />
                  </div>

                  {/* Row 2: Curriculum Type and Operational Days */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField
                      label="Curriculum type"
                      name="curriculumType"
                      value={schoolFormData.curriculumType}
                      onChange={handleSchoolFieldChange}
                      isSelect={true}
                      options={["State Board", "CBSE", "ICSE", "IB", "IGCSE"]}
                      placeholder="Select Curriculum type"
                      error={schoolFormErrors.curriculumType}
                      required
                    />

                    {/* Operational Days */}
                    <div className="flex flex-col gap-2">
                      <label className="font-[Montserrat] font-medium text-[16px] md:text-[18px] text-black">
                        Operational Days
                      </label>
                      <div className="grid grid-cols-6 gap-2">
                        {operationalDaysOptions.map((day) => (
                          <Button
                            key={day}
                            type="button"
                            onClick={() =>
                              handleSchoolOperationalDayToggle(day)
                            }
                            className={`h-[48px] px-3 rounded-[8px] border text-sm ${
                              schoolFormData.operationalDays.includes(day)
                                ? "bg-[#0222D7] border-[#0222D7] text-white hover:!bg-[#0222D7]"
                                : "bg-[#F5F6F9] border-[#DADADD] text-[#697282] hover:!bg-[#F5F6F9] hover:!text-[#697282]"
                            }`}
                          >
                            {day}
                          </Button>
                        ))}
                      </div>
                      {schoolFormErrors.operationalDays && (
                        <p className="text-red-500 text-sm">
                          {schoolFormErrors.operationalDays}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Row 3: Other Activities and Hostel Facility */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField
                      label="Other activities"
                      name="otherActivities"
                      value={schoolFormData.otherActivities}
                      onChange={handleSchoolFieldChange}
                      placeholder="Enter activities"
                      isTextarea={true}
                      rows={2}
                      error={schoolFormErrors.otherActivities}
                      required
                    />

                    <InputField
                      label="Hostel facility ?"
                      name="hostelFacility"
                      value={schoolFormData.hostelFacility}
                      onChange={(e) =>
                        handleSchoolRadioChangeWithValidation(
                          "hostelFacility",
                          e.target.value
                        )
                      }
                      isRadio={true}
                      options={["Yes", "No"]}
                      error={schoolFormErrors.hostelFacility}
                      required
                    />
                  </div>

                  {/* Row 4: Playground and Bus Service */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField
                      label="Playground ?"
                      name="playground"
                      value={schoolFormData.playground}
                      onChange={(e) =>
                        handleSchoolRadioChangeWithValidation(
                          "playground",
                          e.target.value
                        )
                      }
                      isRadio={true}
                      options={["Yes", "No"]}
                      error={schoolFormErrors.playground}
                      required
                    />

                    <InputField
                      label="Bus service ?"
                      name="busService"
                      value={schoolFormData.busService}
                      onChange={(e) =>
                        handleSchoolRadioChangeWithValidation(
                          "busService",
                          e.target.value
                        )
                      }
                      isRadio={true}
                      options={["Yes", "No"]}
                      error={schoolFormErrors.busService}
                      required
                    />
                  </div>

                  <div className="flex justify-center pt-4">
                    <div className="flex flex-row items-center justify-center gap-10 w-full max-w-[668px]">
                      <button
                        type="button"
                        onClick={() => onPrevious?.()} // optional chaining
                        className="w-[314px] h-[48px] border border-[#697282] text-[#697282] rounded-[12px] font-semibold text-[18px] leading-[22px] flex items-center justify-center shadow-inner"
                      >
                        Previous
                      </button>

                      {/* Save & Next Button */}
                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-[314px] h-[48px] bg-[#697282] text-[#F5F6F9] rounded-[12px] font-semibold text-[18px] leading-[22px] flex items-center justify-center hover:bg-[#5b626f] transition-colors"
                      >
                        {isLoading ? "Saving..." : "Save & Next"}
                      </Button>
                    </div>
                  </div>
                </form>
              </>
            )}

            {isCoaching && (
              <>
                <div className="space-y-2">
                  <h3 className="text-xl md:text-2xl font-bold">
                    Inside Your institute.
                  </h3>
                  <p className="text-[#697282] text-sm">
                    Share the key facts that students and parents choose you.
                  </p>
                </div>

                <form onSubmit={handleCoachingSubmit} className="space-y-6">
                  {/* Placements Section */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-black">
                      Placements
                    </h4>

                    {/* Row 1: Placement drives and Mock interviews */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Placement drives */}
                      <InputField
                        label="Placement drives ?"
                        name="placementDrives"
                        value={coachingFormData.placementDrives}
                        onChange={(e) =>
                          handleCoachingFieldChange(
                            "placementDrives",
                            e.target.value
                          )
                        }
                        isRadio
                        options={["Yes", "No"]}
                        error={coachingFormErrors.placementDrives}
                        required
                      />

                      {/* Mock interviews */}
                      <InputField
                        label="Mock interviews ?"
                        name="mockInterviews"
                        value={coachingFormData.mockInterviews}
                        onChange={(e) =>
                          handleCoachingFieldChange(
                            "mockInterviews",
                            e.target.value
                          )
                        }
                        isRadio
                        options={["Yes", "No"]}
                        error={coachingFormErrors.mockInterviews}
                        required
                      />
                    </div>

                    {/* Row 2: Resume building and LinkedIn optimization */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Resume building */}
                      <InputField
                        label="Resume building ?"
                        name="resumeBuilding"
                        value={coachingFormData.resumeBuilding}
                        onChange={(e) =>
                          handleCoachingFieldChange(
                            "resumeBuilding",
                            e.target.value
                          )
                        }
                        isRadio
                        options={["Yes", "No"]}
                        error={coachingFormErrors.resumeBuilding}
                        required
                      />

                      {/* LinkedIn optimization */}
                      <InputField
                        label="LinkedIn optimization ?"
                        name="linkedinOptimization"
                        value={coachingFormData.linkedinOptimization}
                        onChange={(e) =>
                          handleCoachingFieldChange(
                            "linkedinOptimization",
                            e.target.value
                          )
                        }
                        isRadio
                        options={["Yes", "No"]}
                        error={coachingFormErrors.linkedinOptimization}
                        required
                      />
                    </div>

                    {/* Row 3: Access to exclusive job portal and Certification */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Access to exclusive job portal */}
                      <InputField
                        label="Access to exclusive job portal ?"
                        name="exclusiveJobPortal"
                        value={coachingFormData.exclusiveJobPortal}
                        onChange={(e) =>
                          handleCoachingFieldChange(
                            "exclusiveJobPortal",
                            e.target.value
                          )
                        }
                        isRadio
                        options={["Yes", "No"]}
                        error={coachingFormErrors.exclusiveJobPortal}
                        required
                      />

                      {/* Certification */}
                      <InputField
                        label="Certification ?"
                        name="certification"
                        value={coachingFormData.certification}
                        onChange={(e) =>
                          handleCoachingFieldChange(
                            "certification",
                            e.target.value
                          )
                        }
                        isRadio
                        options={["Yes", "No"]}
                        error={coachingFormErrors.certification}
                        required
                      />
                    </div>
                  </div>

                  <div className="flex justify-center pt-4">
                    <div className="flex flex-row items-center justify-center gap-10 w-full max-w-[668px]">
                      <button
                        type="button"
                        onClick={() => onPrevious?.()} // optional chaining
                        className="w-[314px] h-[48px] border border-[#697282] text-[#697282] rounded-[12px] font-semibold text-[18px] leading-[22px] flex items-center justify-center shadow-inner"
                      >
                        Previous
                      </button>

                      {/* Save & Next Button */}
                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-[314px] h-[48px] bg-[#697282] text-[#F5F6F9] rounded-[12px] font-semibold text-[18px] leading-[22px] flex items-center justify-center hover:bg-[#5b626f] transition-colors"
                      >
                        {isLoading ? "Saving..." : "Save & Next"}
                      </Button>
                    </div>
                  </div>
                </form>
              </>
            )}

            {isIntermediate && (
              <>
                <div className="space-y-2">
                  <h3 className="text-xl md:text-2xl font-bold">
                    Inside Your College.
                  </h3>
                  <p className="text-[#697282] text-sm">
                    Share the key facts that make students and parents choose
                    you.
                  </p>
                </div>

                <form onSubmit={handleCollegeSubmit} className="space-y-6">
                  {/* Row 1: College Type and College Category */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField
                      label="College type"
                      name="collegeType"
                      value={collegeFormData.collegeType}
                      onChange={handleCollegeFieldChange}
                      isSelect={true}
                      options={[
                        "Junior College",
                        "Senior Secondary",
                        "Higher Secondary",
                        "Intermediate",
                        "Pre-University",
                      ]}
                      placeholder="Select college type"
                      error={collegeFormErrors.collegeType}
                      required
                    />

                    <InputField
                      label="College category"
                      name="collegeCategory"
                      value={collegeFormData.collegeCategory}
                      onChange={handleCollegeFieldChange}
                      isSelect={true}
                      options={[
                        "Government",
                        "Private",
                        "Semi-Government",
                        "Aided",
                        "Unaided",
                      ]}
                      placeholder="Select college category"
                      error={collegeFormErrors.collegeCategory}
                      required
                    />
                  </div>

                  {/* Row 2: Curriculum Type and Operational Days */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField
                      label="Curriculum type"
                      name="curriculumType"
                      value={collegeFormData.curriculumType}
                      onChange={handleCollegeFieldChange}
                      isSelect={true}
                      options={[
                        "State Board",
                        "CBSE",
                        "ICSE",
                        "IB",
                        "Cambridge",
                        "Other",
                      ]}
                      placeholder="Select Curriculum type"
                      error={collegeFormErrors.curriculumType}
                      required
                    />

                    {/* Operational Day's */}
                    <div className="flex flex-col gap-2">
                      <label className="font-[Montserrat] font-medium text-[16px] md:text-[18px] text-black">
                        Operational Day's{" "}
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                      <div className="grid grid-cols-6 gap-2">
                        {operationalDaysOptions.map((day) => (
                          <Button
                            key={day}
                            type="button"
                            onClick={() =>
                              handleCollegeOperationalDayToggle(day)
                            }
                            className={`h-[48px] px-3 rounded-[8px] border text-sm 
                ${
                  collegeFormData.operationalDays.includes(day)
                    ? "bg-[#0222D7] border-[#0222D7] text-white hover:!bg-[#0222D7]"
                    : "bg-[#F5F6F9] border-[#DADADD] text-[#697282] hover:!bg-[#F5F6F9] hover:!text-[#697282]"
                }`}
                          >
                            {day}
                          </Button>
                        ))}
                      </div>
                      {collegeFormErrors.operationalDays && (
                        <p className="text-red-500 text-xs mt-1">
                          {collegeFormErrors.operationalDays}
                        </p>
                      )}
                    </div>
                  </div>
                  {/* Row 3: Other Activities */}
                  <InputField
                    label="Other activities"
                    name="otherActivities"
                    value={collegeFormData.otherActivities}
                    onChange={handleCollegeFieldChange}
                    placeholder="Enter activities"
                    isTextarea={true}
                    rows={2}
                    error={collegeFormErrors.otherActivities} // will show error if empty
                    required={true} // optional: visually mark field as required
                  />

                  {/* Row 4: Radio Button Questions in 2x2 Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField
                      label="Hostel facility ?"
                      name="hostelFacility"
                      value={collegeFormData.hostelFacility}
                      onChange={(e) =>
                        handleCollegeRadioChangeWithValidation(
                          "hostelFacility",
                          e.target.value
                        )
                      }
                      isRadio={true}
                      options={["Yes", "No"]}
                      error={collegeFormErrors.hostelFacility}
                      required
                    />

                    <InputField
                      label="Playground ?"
                      name="playground"
                      value={collegeFormData.playground}
                      onChange={(e) =>
                        handleCollegeRadioChangeWithValidation(
                          "playground",
                          e.target.value
                        )
                      }
                      isRadio={true}
                      options={["Yes", "No"]}
                      error={collegeFormErrors.playground}
                      required
                    />
                  </div>

                  {/* Row 5: Bus Service (single column) */}
                  <InputField
                    label="Bus service ?"
                    name="busService"
                    value={collegeFormData.busService}
                    onChange={(e) =>
                      handleCollegeRadioChangeWithValidation(
                        "busService",
                        e.target.value
                      )
                    }
                    isRadio={true}
                    options={["Yes", "No"]}
                    error={collegeFormErrors.busService}
                    required
                  />

                  {/* Submit Button */}
                  <div className="flex justify-center pt-4">
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full max-w-[500px] h-[48px] bg-[#0222D7] text-white rounded-[12px] font-semibold hover:bg-blue-700 transition-colors"
                    >
                      {isLoading ? "Saving..." : "Save & Next"}
                    </Button>
                  </div>
                </form>
              </>
            )}

            {isUndergraduate && (
              <>
                <div className="space-y-2">
                  <h3 className="text-xl md:text-2xl font-bold">
                    Inside Your College.
                  </h3>
                  <p className="text-[#697282] text-sm">
                    Share the key facts that students and parents choose you.
                  </p>
                </div>

                <form
                  onSubmit={handleUndergraduateSubmit}
                  className="space-y-6"
                >
                  {/* Row 1: Ownership type and College category */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField
                      label="Ownership type"
                      name="ownershipType"
                      value={undergraduateFormData.ownershipType}
                      onChange={handleUndergraduateChange}
                      isSelect={true}
                      options={[
                        "Government",
                        "Private",
                        "Semi-Government",
                        "Aided",
                        "Unaided",
                      ]}
                      placeholder="Select ownership type"
                      error={undergraduateFormErrors.ownershipType}
                      required
                    />

                    <InputField
                      label="College category"
                      name="collegeCategory"
                      value={undergraduateFormData.collegeCategory}
                      onChange={handleUndergraduateChange}
                      isSelect={true}
                      options={[
                        "Engineering",
                        "Medical",
                        "Arts & Science",
                        "Commerce",
                        "Management",
                        "Law",
                        "Other",
                      ]}
                      placeholder="Select Category"
                      error={undergraduateFormErrors.collegeCategory}
                      required
                    />
                  </div>

                  {/* Row 2: Affiliation type */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField
                      label="Affiliation type"
                      name="affiliationType"
                      value={undergraduateFormData.affiliationType}
                      onChange={handleUndergraduateChange}
                      isSelect={true}
                      options={[
                        "University",
                        "Autonomous",
                        "Affiliated",
                        "Deemed University",
                        "Other",
                      ]}
                      placeholder="Select Affiliation type"
                      error={undergraduateFormErrors.affiliationType}
                      required
                    />
                    <div></div>
                  </div>

                  {/* Placements Section */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-black">
                      Placements
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <InputField
                        label="Placement drives ?"
                        name="placementDrives"
                        value={undergraduateFormData.placementDrives}
                        onChange={handleUndergraduateRadioChange}
                        isRadio={true}
                        options={["Yes", "No"]}
                        error={undergraduateFormErrors.placementDrives}
                        required
                      />

                      <InputField
                        label="Mock interviews ?"
                        name="mockInterviews"
                        value={undergraduateFormData.mockInterviews}
                        onChange={handleUndergraduateRadioChange}
                        isRadio={true}
                        options={["Yes", "No"]}
                        error={undergraduateFormErrors.mockInterviews}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <InputField
                        label="Resume building ?"
                        name="resumeBuilding"
                        value={undergraduateFormData.resumeBuilding}
                        onChange={handleUndergraduateRadioChange}
                        isRadio={true}
                        options={["Yes", "No"]}
                        error={undergraduateFormErrors.resumeBuilding}
                        required
                      />

                      <InputField
                        label="Linked-in optimization ?"
                        name="linkedinOptimization"
                        value={undergraduateFormData.linkedinOptimization}
                        onChange={handleUndergraduateRadioChange}
                        isRadio={true}
                        options={["Yes", "No"]}
                        error={undergraduateFormErrors.linkedinOptimization}
                        required
                      />
                    </div>

                    <InputField
                      label="Access to exclusive job portal ?"
                      name="exclusiveJobPortal"
                      value={undergraduateFormData.exclusiveJobPortal}
                      onChange={handleUndergraduateRadioChange}
                      isRadio={true}
                      options={["Yes", "No"]}
                      error={undergraduateFormErrors.exclusiveJobPortal}
                      required
                    />
                  </div>

                  {/* Other Questions Section */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-black">
                      Other questions
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <InputField
                        label="Library ?"
                        name="library"
                        value={undergraduateFormData.library}
                        onChange={handleUndergraduateRadioChange}
                        isRadio={true}
                        options={["Yes", "No"]}
                        error={undergraduateFormErrors.library}
                        required
                      />

                      <InputField
                        label="Hostel facility ?"
                        name="hostelFacility"
                        value={undergraduateFormData.hostelFacility}
                        onChange={handleUndergraduateRadioChange}
                        isRadio={true}
                        options={["Yes", "No"]}
                        error={undergraduateFormErrors.hostelFacility}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <InputField
                        label="Entrance exam ?"
                        name="entranceExam"
                        value={undergraduateFormData.entranceExam}
                        onChange={handleUndergraduateRadioChange}
                        isRadio={true}
                        options={["Yes", "No"]}
                        error={undergraduateFormErrors.entranceExam}
                        required
                      />

                      <InputField
                        label="Management Quota ?"
                        name="managementQuota"
                        value={undergraduateFormData.managementQuota}
                        onChange={handleUndergraduateRadioChange}
                        isRadio={true}
                        options={["Yes", "No"]}
                        error={undergraduateFormErrors.managementQuota}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <InputField
                        label="Playground ?"
                        name="playground"
                        value={undergraduateFormData.playground}
                        onChange={handleUndergraduateRadioChange}
                        isRadio={true}
                        options={["Yes", "No"]}
                        error={undergraduateFormErrors.playground}
                        required
                      />

                      <InputField
                        label="Bus service ?"
                        name="busService"
                        value={undergraduateFormData.busService}
                        onChange={handleUndergraduateRadioChange}
                        isRadio={true}
                        options={["Yes", "No"]}
                        error={undergraduateFormErrors.busService}
                        required
                      />
                    </div>
                  </div>

                  <div className="flex justify-center pt-4">
                    <div className="flex flex-row items-center justify-center gap-10 w-full max-w-[668px]">
                      <button
                        type="button"
                        onClick={() => onPrevious?.()} // optional chaining
                        className="w-[314px] h-[48px] border border-[#697282] text-[#697282] rounded-[12px] font-semibold text-[18px] leading-[22px] flex items-center justify-center shadow-inner"
                      >
                        Previous
                      </button>

                      {/* Save & Next Button */}
                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-[314px] h-[48px] bg-[#697282] text-[#F5F6F9] rounded-[12px] font-semibold text-[18px] leading-[22px] flex items-center justify-center hover:bg-[#5b626f] transition-colors"
                      >
                        {isLoading ? "Saving..." : "Save & Next"}
                      </Button>
                    </div>
                  </div>
                </form>
              </>
            )}
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}