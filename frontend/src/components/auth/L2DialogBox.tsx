"use client";

import { useState, useEffect, ChangeEvent, FormEvent } from "react";
import React from "react";
import { ApiResponse, branchAPI, courseAPI, programsAPI } from "@/lib/api";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import {
  _Dialog,
  _DialogContent,
  _DialogHeader,
  _DialogTitle,
  _DialogDescription,
  _DialogTrigger,
} from "@/components/ui/dialog";
import {
  _Card,
  _CardHeader,
  _CardTitle,
  _CardDescription,
  _CardContent,
  _CardFooter,
} from "@/components/ui/card";
import InputField from "@/components/ui/InputField";
import { Upload, Plus, MoreVertical, X } from "lucide-react";
import {
  addBranchesToDB,
  getAllBranchesFromDB,
  updateBranchInDB,
  addCoursesGroupToDB,
  getCoursesGroupsByBranchName,
  updateCoursesGroupInDB,
  getAllInstitutionsFromDB, // Added
} from "@/lib/localDb";

// ✅ New imports for split forms
import CoachingCourseForm from "./L2DialogBoxParts/Course/CoachingCourseForm";
import StudyHallForm from "./L2DialogBoxParts/Course/StudyHallForm";
import TuitionCenterForm from "./L2DialogBoxParts/Course/TuitionCenterForm";
import UnderPostGraduateForm from "./L2DialogBoxParts/Course/UnderPostGraduateForm";
import BasicCourseForm from "./L2DialogBoxParts/Course/BasicCourseForm";
import FallbackCourseForm from "./L2DialogBoxParts/Course/FallbackCourseForm";
import StudyAbroadForm from "./L2DialogBoxParts/Course/StudyAbroadForm";
import KindergartenForm from "./L3DialogBoxParts/KindergartenForm";
import CollegeForm from "./L3DialogBoxParts/CollegeForm";
import StateDistrictFields from "./L2DialogBoxParts/Course/common/StateDistrictFields";
import BranchForm from "./L2DialogBoxParts/Branch/BranchForm";
import {
  exportAndUploadInstitutionAndCourses,
} from "@/lib/utility";
import { L2Schemas } from "@/lib/validations/L2Schema";
import { uploadToS3 } from "@/lib/awsUpload";
import AppSelect from "@/components/ui/AppSelect";
import { toast } from "react-toastify";
import SchoolForm from "./L3DialogBoxParts/SchoolForm";
import { sub } from "date-fns";

interface L2DialogBoxProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
  onPrevious?: () => void;
  initialSection?: "course" | "branch";
  renderMode?: "_Dialog" | "inline";
  mode?: "default" | "subscriptionProgram" | "settingsEdit";
  institutionId?: string;
  editMode?: boolean;
  existingCourseData?: Partial<Course> & { _id?: string; branch?: string };
  onEditSuccess?: () => void;
  institutionType?: string;
  adminFlow?: boolean;
}

export interface AcademicDetail {
  subject: string;
  classTiming: string;
  specialization: string;
  monthlyFees: string | number;
}

export interface FacultyDetail {
  name: string;
  qualification: string;
  experience: string;
  subjectTeach: string;
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
  locationURL: string;
  state: string;
  district: string;
  town: string;
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
  classSizeRatio?: string;
  categoriesType: string;
  domainType: string;
  subDomainType: string;
  courseHighlights: string;
  seatingOption: string;
  openingTime: string;
  closingTime: string;
  openingTimePeriod: string;
  closingTimePeriod: string;
  hallName?: string;
  operationalDays: string[];
  totalSeats: string;
  availableSeats: string;
  pricePerSeat: string;
  hasWifi: string;
  hasChargingPoints: string;
  hasAC: string;
  hasPersonalLocker: string;
  eligibilityCriteria: string;
  tuitionType: string;
  instructorProfile: string;
  subject: string;
  createdBranch: string;
  consultancyName: string;
  studentAdmissions: string;
  countriesOffered: string;
  academicOfferings: string;
  businessProof: File | null;
  businessProofPreviewUrl: string;
  businessProofUrl: string;
  panAadhaar: File | null;
  panAadhaarPreviewUrl: string;
  panAadhaarUrl: string;
  consultancyImage: File | null;
  consultancyImagePreviewUrl: string;
  consultancyImageUrl?: string;
  centerImage: File | null;
  centerImagePreviewUrl: string;
  centerImageUrl?: string;

  // --- MERGED L3 FIELDS ---
  collegeType: string;
  collegeCategory: string;
  schoolType: string;
  curriculumType: string;
  schoolCategory: string;
  hostelFacility: string;
  playground: string;
  busService: string;
  otherActivities: string;
  extendedCare: string;
  mealsProvided: string;
  outdoorPlayArea: string;
  placementDrives: string;
  mockInterviews: string;
  resumeBuilding: string;
  linkedinOptimization: string;
  exclusiveJobPortal: string;
  certification: string;
  ownershipType: string;
  affiliationType: string;
  library: string;
  entranceExam: string;
  managementQuota: string;
  applicationAssistance: string;
  visaProcessingSupport: string;
  testOperation: string;
  preDepartureOrientation: string;
  accommodationAssistance: string;
  educationLoans: string;
  postArrivalSupport: string;
  emioptions: string;
  installments: string;
  totalNumberRequires: string | number;
  totalStudentsPlaced: string | number;
  highestPackage: string;
  averagePackage: string;
  budget: string | number;
  studentsSent: string | number;
  partTimeHelp: string;
  academicDetails: AcademicDetail[];
  facultyDetails: FacultyDetail[];
  qualification?: string;
  experience?: string;
  specialization: string;
  subjectTeach?: string;
  monthlyFees?: string | number;
  classTiming?: string;
  courselanguage: string;
  classlanguage: string;
  mockTests: string;
  collegeImage: File | null;
  collegeImagePreviewUrl: string;
  collegeImageUrl?: string;
  tuitionImage: File | null;
  tuitionImagePreviewUrl: string;
  tuitionImageUrl?: string;
  partlyPayment: string;
  kindergartenImage: File | null;
  kindergartenImagePreviewUrl: string;
  kindergartenImageUrl?: string;

  schoolImage: File | null;
  schoolImagePreviewUrl: string;
  schoolImageUrl?: string;
  classType: string;

  intermediateImage: File | null;      // ✅ Unique key for campus photos
  intermediateImagePreviewUrl: string;
  intermediateImageUrl?: string;
  year: string;
  studyMaterial:string;



}

interface Branch {
  id: number;
  branchName: string;
  branchAddress: string;
  contactInfo: string;
  locationUrl: string;
  contactCountryCode?: string;
  dbId?: number;
}

// Define the shape of the branch objects coming from the API
interface RemoteBranch {
  _id: string;
  branchName?: string;
}

// Define the shape of the response from programsAPI.listBranchesForInstitutionAdmin
interface BranchListResponse {
  data: {
    branches: RemoteBranch[];
  };
}

// Define the shape of the S3 upload result
interface S3UploadResult {
  success: boolean;
  fileUrl?: string;
}

// Define the shape of the export result
interface ExportResponse {
  success: boolean;
  message?: string;
}

interface BranchGroup {
  branchName: string;
  branchAddress: string;
  contactInfo: string;
  locationUrl: string;
  courses: import("@/lib/localDb").CourseRecord[];
}

export default function L2DialogBox({
  trigger,
  open,
  onOpenChange,
  onSuccess,
  onPrevious,
  initialSection: initialSectionProp,
  renderMode = "_Dialog",
  mode = "default",
  institutionId,
  editMode = false,
  existingCourseData,
  onEditSuccess,
  institutionType: institutionTypeProp,
  adminFlow = false,
}: L2DialogBoxProps) {
  const router = useRouter();
  const [isCoursrOrBranch, setIsCourseOrBranch] = useState<string | null>(null);
  const [institutionType, setInstitutionType] = useState<string | null>(null);

  // Default initial values for the merged L3 fields
  const mergedL3Defaults = {
    collegeType: "",
    collegeCategory: "",
    schoolType: "",
    curriculumType: "",
    schoolCategory: "",
    hostelFacility: "",
    playground: "",
    busService: "",
    otherActivities: "",
    extendedCare: "",
    mealsProvided: "",
    outdoorPlayArea: "",
    placementDrives: "",
    mockInterviews: "",
    resumeBuilding: "",
    linkedinOptimization: "",
    exclusiveJobPortal: "",
    certification: "",
    ownershipType: "",
    affiliationType: "",
    library: "",
    mockTests: "",
    entranceExam: "",
    managementQuota: "",
    applicationAssistance: "",
    visaProcessingSupport: "",
    testOperation: "",
    preDepartureOrientation: "",
    accommodationAssistance: "",
    educationLoans: "",
    postArrivalSupport: "",
    emioptions: "",
    installments: "",
    totalNumberRequires: "",
    totalStudentsPlaced: "",
    highestPackage: "",
    averagePackage: "",
    budget: "",
    studentsSent: "",
    subjectTeach: "",
    classTiming: "",
    courselanguage: "",
    classlanguage: "",
    centerImage: null,
    centerImagePreviewUrl: "",
    consultancyImage: null,
    consultancyImagePreviewUrl: "",
    partTimeHelp: "",
    CollegeImage: null,
    collegeImagePreviewUrl: "",
    collegeImage: null,
    collegeImageUrl: "",
    centerImageUrl: "",
    consultancyImageUrl: "",
    tuitionImage: null,
    tuitionImagePreviewUrl: "",
    partlyPayment: "",
    kindergartenImage: null,
    kindergartenImagePreviewUrl: "",
    classSizeRatio: "",
    schoolImage: null,
    schoolImagePreviewUrl: "",
    classType: "",
    intermediateImage: null,
    intermediateImagePreviewUrl: "",
    specialization: "",
    year: "",
    studyMaterial:"",
  };

  const isUnderPostGraduate = institutionType === "Under Graduation/Post Graduation";
  const isCoachingCenter = institutionType === "Coaching centers";
  const isStudyHall = institutionType === "Study Halls";
  const isTutionCenter = institutionType === "Tution Center's";
  const isKindergarten = institutionType === "Kindergarten/childcare center";
  const isSchool = institutionType === "School's";
  const isIntermediateCollege = institutionType === "Intermediate college(K12)";
  const isStudyAbroad = institutionType === "Study Abroad";
  const isBasicCourseForm = isKindergarten || isSchool || isIntermediateCollege;
  const isCoachingOrUGPG = isCoachingCenter || isUnderPostGraduate;

  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState(1);
  const [showCourseAfterBranch, setShowCourseAfterBranch] = useState(false);
  const [branchOptions, setBranchOptions] = useState<string[]>([]);
  const [remoteBranches, setRemoteBranches] = useState<Array<{ _id: string; branchName: string }>>([]);
  const [selectedBranchIdForProgram, setSelectedBranchIdForProgram] = useState<string>("");
  const [programBranchError, setProgramBranchError] = useState<string>("");
  const [assetPreview, setAssetPreview] = useState<{ type: "image" | "brochure"; url: string } | null>(null);

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
    return result.sort((a, b) => a.branchName.localeCompare(b.branchName));
  }, [remoteBranches]);

  const toInputDateValue = (value?: string | null) => {
    if (!value) return "";
    const trimmed = value.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
    const parsed = new Date(trimmed);
    return isNaN(parsed.getTime()) ? trimmed : parsed.toISOString().slice(0, 10);
  };

  const sanitizeCourseForLocalDb = (course: Course | Record<string, unknown>): import("@/lib/localDb").CourseRecord => {
    // 1. Define all keys that should be converted from "Yes"/"No" strings to Booleans
    const booleanKeys = [
      "hasWifi", "hasChargingPoints", "hasAC", "hasPersonalLocker",
      "hostelFacility", "playground", "busService", "extendedCare", "mealsProvided",
      "outdoorPlayArea", "placementDrives", "mockInterviews", "resumeBuilding",
      "linkedinOptimization", "exclusiveJobPortal", "certification", "library",
      "entranceExam", "managementQuota", "applicationAssistance", "visaProcessingSupport",
      "testOperation", "preDepartureOrientation", "accommodationAssistance",
      "educationLoans", "postArrivalSupport", "installments", "emioptions",
      "mockTests", "libraryFacility", "partTimeHelp"
    ];

    // 2. Define all keys that should be kept as they are (Strings/Numbers/URLs)
    const entries = Object.entries(course as Record<string, unknown>).map(([key, value]) => {
      // Convert "Yes"/"No" to true/false
      if (booleanKeys.includes(key)) return [key, value === "Yes"];

      // Explicitly ensure new URL fields are included
      if (key === "centerImageUrl") return ["centerImageUrl", value];
      if (key === "consultancyImageUrl") return ["consultancyImageUrl", value];
      if (key === "collegeImageUrl") return ["collegeImageUrl", value];
      if (key === "tuitionImageUrl") return ["tuitionImageUrl", value];
      if (key === "kindergartenImageUrl") return ["kindergartenImageUrl", value];
      if (key === "schoolImageUrl") return ["schoolImageUrl", value];
      if (key === "town") return ["town", value];
      if (key === "locationURL") return ["locationURL", value];

      return [key, value];
    });

    // 3. Filter out nulls, empty strings, and File objects (IndexedDB can't store Files easily)
    return Object.fromEntries(
      entries.filter(([, value]) =>
        value !== null &&
        value !== "" &&
        !(value instanceof File) && // Don't save raw File objects to DB
        !(Array.isArray(value) && value.length === 0) &&
        value !== false
      )
    ) as import("@/lib/localDb").CourseRecord;
  };

  const resolveLocalBranchName = () => {
    if (selectedBranchIdForProgram) {
      const match = uniqueRemoteBranches.find((b) => b._id === selectedBranchIdForProgram);
      if (match?.branchName) return match.branchName;
    }
    return "Main Institution";
  };

  const persistAdminProgramsToIndexedDb = async (coursesToPersist: Course[]) => {
    const branchName = resolveLocalBranchName();
    const sanitizedCourses = coursesToPersist.map((course) => sanitizeCourseForLocalDb(course));
    const existingGroups = await getCoursesGroupsByBranchName(branchName);
    if (existingGroups.length) {
      const current = existingGroups[0];
      await updateCoursesGroupInDB({ ...current, branchName, courses: sanitizedCourses });
    } else {
      await addCoursesGroupToDB({ branchName, courses: sanitizedCourses });
    }
  };

  const isSubscriptionProgram = adminFlow || mode === "subscriptionProgram" || mode === "settingsEdit";
  const DialogOpen = renderMode === "inline" ? true : open !== undefined ? open : isOpen;
  const setDialogOpen = onOpenChange || setIsOpen;

  // ✅ New DB Sync Logic
  useEffect(() => {
    const syncInstitutionData = async () => {
      try {
        const institutions = await getAllInstitutionsFromDB();
        const latestInstitution =
          institutions.length > 0
            ? institutions.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))[0]
            : null;

        if (latestInstitution) {
          // Use instituteType from DB (as per your InstitutionRecord interface)
          const type = latestInstitution.instituteType || latestInstitution.instituteType;
          console.log("🏢 Database Sync - Institute Type Found:", type);
          setInstitutionType(type || null);
        } else if (institutionTypeProp) {
          setInstitutionType(institutionTypeProp);
        } else {
          setInstitutionType(localStorage.getItem("institutionType"));
        }
        setIsCourseOrBranch(localStorage.getItem("selected"));
      } catch (err) {
        console.error("❌ DB sync failed:", err);
        setInstitutionType(localStorage.getItem("institutionType"));
      }
    };

    if (DialogOpen) {
      syncInstitutionData();
    }
  }, [DialogOpen, institutionTypeProp]);


  useEffect(() => {
    if (!DialogOpen || !isSubscriptionProgram) return;
    (async () => {
      try {
        const res = await programsAPI.listBranchesForInstitutionAdmin(String(institutionId || "")) as BranchListResponse;
      const branches = res?.data?.branches || [];
      setRemoteBranches(branches.map((b) => ({ 
        _id: String(b._id), 
        branchName: b.branchName || "Branch" 
      })));
    } catch (e) {
      console.error("Error loading branches:", e);
    }
  })();
  }, [DialogOpen, institutionId, isSubscriptionProgram]);

  const [courses, setCourses] = useState<Course[]>(() => {
    if (editMode && existingCourseData) {
      return [{
        id: 1,
        courseName: existingCourseData.courseName,
      aboutCourse: existingCourseData.aboutCourse || "",
        courseDuration: existingCourseData.courseDuration || "",
        startDate: toInputDateValue(existingCourseData.startDate || ""),
        endDate: toInputDateValue(existingCourseData.endDate || ""),
        mode: existingCourseData.mode || "Offline",
        priceOfCourse: existingCourseData.priceOfCourse || "",
        eligibilityCriteria: existingCourseData.eligibilityCriteria || "",
        locationURL: existingCourseData.locationURL || "",
        state: existingCourseData.state || "",
        district: existingCourseData.district || "",
        town: existingCourseData.town || "",
        image: null,
        imageUrl: existingCourseData.imageUrl || "",
        imagePreviewUrl: existingCourseData.imagePreviewUrl || "",
        brochureUrl: existingCourseData.brochureUrl || "",
        brochure: null,
        brochurePreviewUrl: existingCourseData.brochurePreviewUrl || "",
        graduationType: existingCourseData.graduationType || "",
        streamType: existingCourseData.streamType || "",
        selectBranch: existingCourseData.selectBranch || "",
        aboutBranch: existingCourseData.aboutBranch || "",
        educationType: existingCourseData.educationType || "Full time",
        classSize: existingCourseData.classSize || "",
        categoriesType: existingCourseData.categoriesType || "",
        domainType: existingCourseData.domainType || "",
        subDomainType: existingCourseData.subDomainType || "",
        courseHighlights: existingCourseData.courseHighlights || "",
        seatingOption: existingCourseData.seatingOption || "",
        openingTime: existingCourseData.openingTime || "",
        closingTime: existingCourseData.closingTime || "",
        openingTimePeriod: existingCourseData.openingTimePeriod || "",
        closingTimePeriod: existingCourseData.closingTimePeriod || "",
        operationalDays: existingCourseData.operationalDays || [],
        totalSeats: existingCourseData.totalSeats || "",
        availableSeats: existingCourseData.availableSeats || "",
        pricePerSeat: existingCourseData.pricePerSeat || "",
        hasWifi: existingCourseData.hasWifi || "",
        hasChargingPoints: existingCourseData.hasChargingPoints || "",
        hasAC: existingCourseData.hasAC || "",
        hasPersonalLocker: existingCourseData.hasPersonalLocker || "",
        tuitionType: existingCourseData.tuitionType || "",
        instructorProfile: existingCourseData.instructorProfile || "",
        subject: existingCourseData.subject || "",
        createdBranch: existingCourseData.createdBranch || "",
        consultancyName: existingCourseData.consultancyName || "",
        studentAdmissions: existingCourseData.studentAdmissions || "",
        countriesOffered: existingCourseData.countriesOffered || "",
        academicOfferings: existingCourseData.academicOfferings || "",
        businessProof: null,
        businessProofPreviewUrl: existingCourseData.businessProofPreviewUrl || "",
        businessProofUrl: existingCourseData.businessProofUrl || "",
        panAadhaar: null,
        panAadhaarPreviewUrl: existingCourseData.panAadhaarPreviewUrl || "",
        panAadhaarUrl: existingCourseData.panAadhaarUrl || "",
        academicDetails: existingCourseData.academicDetails || [],
        facultyDetails: existingCourseData.facultyDetails || [],


        ...mergedL3Defaults
      } as Course];
    }
    return [{
      id: 1, courseName: "", aboutCourse: "", courseDuration: "", startDate: "", endDate: "", mode: "Offline",
      priceOfCourse: "", eligibilityCriteria: "", locationURL: "", town: "", state: "", district: "", image: null,
      imageUrl: "", imagePreviewUrl: "", brochureUrl: "", brochure: null, brochurePreviewUrl: "",
      graduationType: "", streamType: "", selectBranch: "", aboutBranch: "", educationType: "Full time",
      classSize: "", categoriesType: "", domainType: "", subDomainType: "", courseHighlights: "",
      seatingOption: "", openingTime: "", closingTime: "", openingTimePeriod: "", closingTimePeriod: "", operationalDays: [], totalSeats: "",
      availableSeats: "", pricePerSeat: "", hasWifi: "", hasChargingPoints: "", hasAC: "", hasPersonalLocker: "",
      tuitionType: "", instructorProfile: "", subject: "", createdBranch: "", consultancyName: "",
      studentAdmissions: "", countriesOffered: "", academicOfferings: "", businessProof: null,
      businessProofPreviewUrl: "", businessProofUrl: "", panAadhaar: null, panAadhaarPreviewUrl: "", panAadhaarUrl: "", academicDetails: [], facultyDetails: [],
      ...mergedL3Defaults
    }];
  });

  useEffect(() => {
    if (DialogOpen && !editMode && !isSubscriptionProgram) {
      const loadCoursesFromDB = async () => {
        try {
          const groups = await getCoursesGroupsByBranchName();
          const loadedCourses: Course[] = [];
          const mapRecordToCourse = (record: import("@/lib/localDb").CourseRecord, index: number): Course => {
            const toYesNoHelper = (val: unknown): string =>
              typeof val === 'boolean' ? (val ? "Yes" : "No") : (String(val ?? ""));
            return {
              id: index + 1,
              courseName: record.courseName || "",
              aboutCourse: record.aboutCourse || "",
              courseDuration: record.courseDuration || "",
              startDate: toInputDateValue(record.startDate),
              endDate: toInputDateValue(record.endDate),
              mode: record.mode || "Offline",
              priceOfCourse: record.priceOfCourse || "",
              eligibilityCriteria: record.eligibilityCriteria || "",
              locationURL: record.locationURL || "",
              state: record.state || "",
              district: record.district || "",
              town: record.town || "",
              image: null,
              imageUrl: record.imageUrl || "",
              imagePreviewUrl: record.imageUrl || "",
              brochureUrl: record.brochureUrl || "",
              brochure: null,
              brochurePreviewUrl: record.brochureUrl || "",
              graduationType: record.graduationType || "",
              streamType: record.streamType || "",
              selectBranch: record.selectBranch || "",
              aboutBranch: record.aboutBranch || "",
              educationType: record.educationType || "Full time",
              classSize: record.classSize || "",
              categoriesType: record.categoriesType || "",
              domainType: record.domainType || "",
              subDomainType: record.subDomainType || "",
              courseHighlights: record.courseHighlights || "",
              seatingOption: record.seatingOption || "",
              openingTime: record.openingTime || "",
              closingTime: record.closingTime || "",
              operationalDays: record.operationalDays || [],
              totalSeats: record.totalSeats || "",
              availableSeats: record.availableSeats || "",
              pricePerSeat: record.pricePerSeat || "",
              hasWifi: toYesNoHelper(record.hasWifi),
              hasChargingPoints: toYesNoHelper(record.hasChargingPoints),
              hasAC: toYesNoHelper(record.hasAC),
              hasPersonalLocker: toYesNoHelper(record.hasPersonalLocker),
              tuitionType: record.tuitionType || "",
              instructorProfile: record.instructorProfile || "",
              subject: record.subject || "",
              createdBranch: record.createdBranch || "",
              consultancyName: record.consultancyName || "",
              studentAdmissions: record.studentAdmissions ? String(record.studentAdmissions) : "",
              countriesOffered: record.countriesOffered || "",
              academicOfferings: record.academicOfferings || "",
              businessProof: null,
              businessProofPreviewUrl: record.businessProofPreviewUrl || "",
              businessProofUrl: record.businessProofUrl || "",
              panAadhaar: null,
              panAadhaarPreviewUrl: record.panAadhaarPreviewUrl || "",
              panAadhaarUrl: record.panAadhaarUrl || "",
              // Map merged institutional fields
              schoolType: record.schoolType || "",
              collegeType: record.collegeType || "",
              collegeCategory: record.collegeCategory || "",
              curriculumType: record.curriculumType || "",
              schoolCategory: record.schoolCategory || "",
              hostelFacility: toYesNoHelper(record.hostelFacility),
              playground: toYesNoHelper(record.playground),
              busService: toYesNoHelper(record.busService),
              otherActivities: record.otherActivities || "",
              extendedCare: toYesNoHelper(record.extendedCare),
              mealsProvided: toYesNoHelper(record.mealsProvided),
              outdoorPlayArea: toYesNoHelper(record.outdoorPlayArea),
              placementDrives: toYesNoHelper(record.placementDrives),
              mockInterviews: toYesNoHelper(record.mockInterviews),
              resumeBuilding: toYesNoHelper(record.resumeBuilding),
              linkedinOptimization: toYesNoHelper(record.linkedinOptimization),
              exclusiveJobPortal: toYesNoHelper(record.exclusiveJobPortal),
              certification: toYesNoHelper(record.certification),
              ownershipType: record.ownershipType || "",
              affiliationType: record.affiliationType || "",
              library: toYesNoHelper(record.library),
              entranceExam: toYesNoHelper(record.entranceExam),
              managementQuota: toYesNoHelper(record.managementQuota),
              applicationAssistance: toYesNoHelper(record.applicationAssistance),
              visaProcessingSupport: toYesNoHelper(record.visaProcessingSupport),
              testOperation: toYesNoHelper(record.testOperation),
              preDepartureOrientation: toYesNoHelper(record.preDepartureOrientation),
              accommodationAssistance: toYesNoHelper(record.accommodationAssistance),
              educationLoans: toYesNoHelper(record.educationLoans),
              postArrivalSupport: toYesNoHelper(record.postArrivalSupport),
              emioptions: toYesNoHelper(record.emioptions),
              installments: toYesNoHelper(record.installments),
              collegeImage: null,
              collegeImagePreviewUrl: record.collegeImageUrl || "",
              collegeImageUrl: record.collegeImageUrl || "",

              centerImage: null,
              centerImagePreviewUrl: record.centerImageUrl || "",
              centerImageUrl: record.centerImageUrl || "",

              consultancyImage: null,
              consultancyImagePreviewUrl: record.consultancyImageUrl || "",
              consultancyImageUrl: record.consultancyImageUrl || "",

            } as Course;
          };

          let globalIndex = 0;
          groups.forEach(group => {
            if (group.courses && group.courses.length > 0) {
              group.courses.forEach(c => {
                loadedCourses.push(mapRecordToCourse(c, globalIndex++));
              });
            }
          });

          if (loadedCourses.length > 0) {
            setCourses(loadedCourses);
            setSelectedCourseId(1);
          }
        } catch (err) {
          console.error("Failed to load courses from DB", err);
        }
      };

      loadCoursesFromDB();
    }
  }, [DialogOpen, editMode, isSubscriptionProgram]);

  const currentCourse = courses.find((c) => c.id === selectedCourseId) || courses[0];
  const [selectedBranchId, setSelectedBranchId] = useState(1);
  const [branches, setBranches] = useState<Branch[]>([
    { id: 1, branchName: "", branchAddress: "", contactInfo: "", locationUrl: "" },
  ]);

  const [branchErrors, setBranchErrors] = useState<Record<number, Record<string, string>>>({});
  const initialSection = (isCoursrOrBranch as "course" | "branch") || initialSectionProp || "course";
  const [courseErrorsById, setCourseErrorsById] = useState<Record<number, Record<string, string>>>({});

  const uploadFields: Array<{ label: string; type: "image" | "brochure"; accept: string }> = [
    { label: "Add Image", type: "image", accept: "image/*" },
    { label: "Add Brochure", type: "brochure", accept: "application/pdf" },
  ];

  const handleCourseChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const courseToUpdate = courses.find((c) => c.id === selectedCourseId);
    if (!courseToUpdate) return;

    let updatedCourse: Course;

    // 1. Handle Nested Array Updates (e.g., academicDetails.0.subject)
    if (name.includes(".")) {
      const [arrayName, indexStr, fieldName] = name.split(".");
      const index = parseInt(indexStr);

      const key = arrayName as keyof Course;
      const currentArray = (courseToUpdate[key] as AcademicDetail[] | FacultyDetail[]) || [];
      const updatedArray = [...currentArray];
      updatedArray[index] = {
        ...updatedArray[index],
        [fieldName]: value,
      };

      updatedCourse = {
        ...courseToUpdate,
        [arrayName]: updatedArray,
      };
    } else {
      // 2. Standard Top-level Updates
      updatedCourse = {
        ...courseToUpdate,
        [name]: value,
        ...(name === "state" ? { district: "" } : {})
      };
    }

    setCourses(courses.map((course) => (course.id === selectedCourseId ? updatedCourse : course)));
    const schema = L2Schemas[getSchemaKey()];
    if (!schema) return;

    const { error } = schema.validate(updatedCourse, { abortEarly: false, allowUnknown: true });

    const fieldError = error?.details.find((detail) => {
      const pathString = detail.path.join('.');
      return pathString === name || detail.path[0] === name;
    });

    setCourseErrorsById((prevErrors) => {
      const updatedErrorsForCourse = { ...(prevErrors[selectedCourseId] || {}) };
      if (fieldError) {
        updatedErrorsForCourse[name] = fieldError.message;
      } else {
        delete updatedErrorsForCourse[name];
      }
      return { ...prevErrors, [selectedCourseId]: updatedErrorsForCourse };
    });
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>, type: "image" | "brochure" | "businessProof" | "panAadhaar" | "centerImage" | "consultancyImage" | "collegeImage" | "tuitionImage" | "kindergartenImage" | "schoolImage" | "intermediateImage") => {
    const files = e.target.files;
    if (!files || !files[0]) return;
    const selectedFile = files[0];
    const allowedImageTypes = ["image/png", "image/jpg", "image/jpeg"];
    const allowedPdfTypes = ["application/pdf"];
    let errorMessage = "";
    if ((type === "image" || type === "businessProof" || type === "centerImage") && !allowedImageTypes.includes(selectedFile.type)) {
      errorMessage = "Only PNG, JPG, or JPEG images are allowed.";
    } else if ((type === "brochure" || type === "panAadhaar") && !allowedPdfTypes.includes(selectedFile.type)) {
      errorMessage = "Only PDF files are allowed.";
    }
    if (selectedFile.size > 4 * 1024 * 1024) errorMessage = "File size must be 4 MB or less.";

    if (errorMessage) {
      setCourseErrorsById((prev) => ({ ...prev, [selectedCourseId]: { ...(prev[selectedCourseId] || {}), [`${type}Url`]: errorMessage } }));
      return;
    }



    setCourseErrorsById((prev) => {
      const updated = { ...(prev[selectedCourseId] || {}) };
      delete updated[`${type}Url`];
      return { ...prev, [selectedCourseId]: updated };
    });

    const previewUrl = URL.createObjectURL(selectedFile);
    setCourses((prevCourses) =>
      prevCourses.map((course) =>
        course.id === selectedCourseId ? { ...course, [`${type}`]: selectedFile, [`${type}PreviewUrl`]: previewUrl } : course
      )
    );
  };

  const handleOperationalDayChange = (day: string) => {
    const courseToUpdate = courses.find((c) => c.id === selectedCourseId);
    if (!courseToUpdate) return;
    const newOperationalDays = courseToUpdate.operationalDays.includes(day)
      ? courseToUpdate.operationalDays.filter((d: string) => d !== day)
      : [...courseToUpdate.operationalDays, day];

    setCourses(courses.map((course) => course.id === selectedCourseId ? { ...course, operationalDays: newOperationalDays } : course));
    const schema = L2Schemas[getSchemaKey()];
    let validationError = "";
    if (schema && schema.extract("operationalDays")) {
      const { error } = schema.extract("operationalDays").validate(newOperationalDays);
      if (error) validationError = error.details[0].message;
    }
    setCourseErrorsById((prevErrors) => ({ ...prevErrors, [selectedCourseId]: { ...(prevErrors[selectedCourseId] || {}), operationalDays: validationError } }));
  };

  const addNewCourse = () => {
    const newId = Math.max(...courses.map((c) => c.id)) + 1;
    setCourses([...courses, {
      id: newId, courseName: "", aboutCourse: "", courseDuration: "", startDate: "", endDate: "", mode: "Offline",
      priceOfCourse: "", eligibilityCriteria: "", locationURL: "", state: "", district: "", town: "", image: null,
      imageUrl: "", imagePreviewUrl: "", brochureUrl: "", brochure: null, brochurePreviewUrl: "",
      graduationType: "", streamType: "", selectBranch: "", aboutBranch: "", educationType: "Full time",
      classSize: "", categoriesType: "", domainType: "", subDomainType: "", courseHighlights: "",
      seatingOption: "", openingTime: "", closingTime: "", openingTimePeriod: "", closingTimePeriod: "", operationalDays: [], totalSeats: "",
      availableSeats: "", pricePerSeat: "", hasWifi: "", hasChargingPoints: "", hasAC: "", hasPersonalLocker: "",
      tuitionType: "", instructorProfile: "", subject: "", createdBranch: "", consultancyName: "",
      studentAdmissions: "", countriesOffered: "", academicOfferings: "", businessProof: null,
      businessProofPreviewUrl: "", businessProofUrl: "", panAadhaar: null, panAadhaarPreviewUrl: "", panAadhaarUrl: "", academicDetails: [],
      facultyDetails: [],
      ...mergedL3Defaults
    }]);
    setSelectedCourseId(newId);
  };

  const deleteCourse = (courseId: number) => {
    if (courses.length > 1) {
      const updatedCourses = courses.filter((c) => c.id !== courseId);
      setCourses(updatedCourses);
      if (selectedCourseId === courseId) setSelectedCourseId(updatedCourses[0].id);
    }
  };

  const addNewBranch = () => {
    setBranches((prev) => {
      const newId = prev.length > 0 ? Math.max(...prev.map((b) => b.id)) + 1 : 1;
      setSelectedBranchId(newId);
      return [...prev, { id: newId, branchName: "", branchAddress: "", contactInfo: "", locationUrl: "", dbId: undefined }];
    });
  };

  const deleteBranch = (branchId: number) => {
    setBranches((prev) => {
      if (prev.length <= 1) return prev;
      const updated = prev.filter((b) => b.id !== branchId);
      if (selectedBranchId === branchId) setSelectedBranchId(updated[0].id);
      return updated;
    });
  };

const handleCourseSubmit = async (e: FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  setIsLoading(true);

  try {
    /* ----------------------------------------------------
       1. VALIDATION
    ---------------------------------------------------- */
    const validationMessage = validateCourses();
    if (validationMessage) {
      toast.error(validationMessage);
      return;
    }

    /* ----------------------------------------------------
       2. UPLOAD FILES TO S3
    ---------------------------------------------------- */
    const uploadedCourses = await Promise.all(
      courses.map(async (course) => {
        const updated: Partial<Course> = { ...course };

        const fileFields: { file: File | null; urlKey: keyof Course }[] = [
          { file: course.image, urlKey: "imageUrl" },
          { file: course.brochure, urlKey: "brochureUrl" },
          { file: course.centerImage, urlKey: "centerImageUrl" },
          { file: course.tuitionImage, urlKey: "tuitionImageUrl" },
          { file: course.kindergartenImage, urlKey: "kindergartenImageUrl" },
          { file: course.schoolImage, urlKey: "schoolImageUrl" },
          { file: course.intermediateImage, urlKey: "intermediateImageUrl" },
        ];

        await Promise.all(
          fileFields.map(async ({ file, urlKey }) => {
            if (file instanceof File) {
              try {
                const res = (await uploadToS3(file)) as S3UploadResult;
                if (res.success && res.fileUrl) {
                  (updated[urlKey] as string) = res.fileUrl;
                }
              } catch (err) {
                console.warn(`Failed to upload ${urlKey}:`, err);
              }
            }
          })
        );

        return updated as Course;
      })
    );

    /* ----------------------------------------------------
       3. ATTACH BRANCH ID
    ---------------------------------------------------- */
    const payload = uploadedCourses.map((course) => ({
      ...course,
      branchId: course.selectBranch || null,
    }));

    /* ----------------------------------------------------
       4. BACKEND API CALL
    ---------------------------------------------------- */
    let apiResponse: ApiResponse = { success: false };

    if (editMode) {
      for (const course of payload) {
        if (!course.id) continue;
        try {
          await courseAPI.updateCourse(course.id, course);
        } catch (err) {
          console.error("Failed to update course:", course.id, err);
        }
      }
      apiResponse.success = true;
    } else {
      apiResponse = await courseAPI.createCourses(payload);
    }

    if (!apiResponse.success) {
      toast.error(apiResponse.message || "Failed to save courses");
      return;
    }

    /* ----------------------------------------------------
       6. FINAL UI ACTIONS
    ---------------------------------------------------- */
    toast.success(editMode ? "Course updated" : "Courses created");
    editMode ? onEditSuccess?.() : onSuccess?.();

    /* ----------------------------------------------------
       7. ROUTER NAVIGATION
    ---------------------------------------------------- */
    router.push("/dashboard/subscription");

  } catch (error) {
    console.error("Course submit error:", error);
    toast.error("Something went wrong while saving courses");
  } finally {
    setIsLoading(false);
  }
};


  const handleBranchChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setBranches((prev) => prev.map((b) => b.id === selectedBranchId ? { ...b, [name]: value } : b));
    const { error } = L2Schemas.branch.extract(name).validate(value);
    setBranchErrors((prev) => ({ ...prev, [selectedBranchId]: { ...(prev[selectedBranchId] || {}), [name]: error ? error.details[0].message : "" } }));
  };

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
      console.log("❌ Validation Error:", error.details);
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
      toast.error("Please fix the errors: " + error.details[0].message);
      return; // Stop the submission
    }

    // If validation passes, clear any previous errors for this branch
    setBranchErrors((prev) => ({
      ...prev,
      [selectedBranchId]: {},
    }));

    setIsLoading(true);
    try {

      const payload = {
        id: currentBranch.id,
        branchName: currentBranch.branchName,
        branchAddress: currentBranch.branchAddress,
        contactInfo: currentBranch.contactInfo,
        contactCountryCode: currentBranch.contactCountryCode,
        locationUrl: currentBranch.locationUrl,
      };

      const response = await branchAPI.createBranch(payload, institutionId);

      if (currentBranch.dbId) {
        await updateBranchInDB({
          id: currentBranch.dbId,
          branchName: currentBranch.branchName,
          branchAddress: currentBranch.branchAddress,
          contactInfo: currentBranch.contactInfo,
          locationUrl: currentBranch.locationUrl
        });
      } else {
        const [newId] = await addBranchesToDB([payload]);
        setBranches((prev) =>
          prev.map((b) =>
            b.id === selectedBranchId ? { ...b, dbId: newId } : b
          )
        );
      }

      const all = await getAllBranchesFromDB();
      setBranchOptions(all.map((b) => b.branchName).filter(Boolean));
      setShowCourseAfterBranch(true);
      setIsCourseOrBranch("course");
      // --- END OF YOUR SAVE LOGIC ---
    } catch (err) {
      console.error("Error saving branch:", err);
    } finally {
      setIsLoading(false);
    }
  };
  const validateCourses = () => {
    const requiredFields = getRequiredFields();

    for (const course of courses) {
      // 1. Validate Top-Level Required Fields
      for (const field of requiredFields) {
        if (!course[field as keyof Course] || String(course[field as keyof Course]).trim() === "") {
          return `Please fill in the ${field} field for course: ${course.courseName || "Unnamed course"}`;
        }
      }

      // 2. Validate Academic Details Sub-Tabs
      if (course.academicDetails && course.academicDetails.length > 0) {
        for (let i = 0; i < course.academicDetails.length; i++) {
          const detail = course.academicDetails[i];
          if (!detail.subject?.trim() || !detail.specialization?.trim() || !detail.monthlyFees) {
            return `Please complete all fields in Subject Tab ${i + 1} for ${course.courseName || "Tuition Center"}`;
          }
        }
      } else if (getSchemaKey() === 'tuitionCenter') {
        return `Please add at least one Academic/Subject entry.`;
      }

      // 3. Validate Faculty Details Sub-Tabs
      if (course.facultyDetails && course.facultyDetails.length > 0) {
        for (let i = 0; i < course.facultyDetails.length; i++) {
          const faculty = course.facultyDetails[i];
          if (!faculty.name?.trim() || !faculty.qualification?.trim() || !faculty.subjectTeach?.trim()) {
            return `Please complete all fields in Faculty Tab ${i + 1} for ${course.courseName || "Tuition Center"}`;
          }
        }
      } else if (getSchemaKey() === 'tuitionCenter') {
        return `Please add at least one Faculty entry.`;
      }

      // 4. Validate Uploads
      if (!course.image && !course.imageUrl) return `Please upload an image for course: ${course.courseName || "Unnamed"}`;
      if (!course.brochure && !course.brochureUrl) return `Please upload a brochure for course: ${course.courseName || "Unnamed"}`;
    }
    return null;
  };

  const getRequiredFields = () => {
    // Added "town" and "aboutBranch" to the required list
    const locationFields = ["state", "district", "town", "locationURL", "aboutBranch"];
    const coachingCommon = ["categoriesType", "domainType", "subDomainType", "courseName", "courseDuration", "startDate", "priceOfCourse", "installments", "emioptions"];

    switch (true) {
      case isStudyAbroad: return ["consultancyName", "studentAdmissions", "countriesOffered", "academicOfferings"];
      case isBasicCourseForm: return [...locationFields, "courseName", "courseDuration", "priceOfCourse", "startDate"];
      case isKindergarten:
        return [
          ...locationFields,
          "graduationType", "courseName", "categoriesType", "priceOfCourse",
          "aboutCourse", "courseDuration", "mode", "classSize", "curriculumType",
          "ownershipType", "operationalDays", "openingTime", "closingTime",
          "extendedCare", "mealsProvided", "playground", "busService", "classSizeRatio"
        ];
      case isSchool:
        return [
          ...locationFields,
          "courseName",
          "mode",
          "courseDuration",
          "startDate",
          "classlanguage",
          "ownershipType",
          "schoolType",
          "curriculumType",
          "classType",
          "priceOfCourse",
          "playground",
          "busService",
          "hostelFacility",
          "emioptions",
          "partlyPayment",
        ];
      case isIntermediateCollege:
        return [
          ...locationFields,
          "courseName", "mode", "courseDuration", "startDate", "language",
          "ownershipType", "collegeType", "curriculumType", "year", "classType",
          "specialization", "priceOfCourse", "playground", "busService",
          "hostelFacility", "emioptions", "partlyPayment"
        ];
      case isUnderPostGraduate:
        return [
          ...locationFields,
          "graduationType",
          "streamType",
          "selectBranch",
          "aboutBranch",
          "courseDuration",
          "classSize",
          "eligibilityCriteria",
          "ownershipType",
          "collegeCategory",
          "affiliationType",
          "placementDrives",
          "totalStudentsPlaced",
          "highestPackage",
          "averagePackage",
          "priceOfCourse",
          "installments",
          "emioptions"
        ];

      case isCoachingCenter:
        return currentCourse.categoriesType === "Upskilling"
          ? [...locationFields, ...coachingCommon, "classTiming", "courselanguage", "certification", "placementDrives", "highestPackage", "averagePackage", "totalStudentsPlaced"]
          : [...locationFields, ...coachingCommon, "classlanguage", "classSize", "mockTests", "libraryFacility", "studyMaterial"];

      case isTutionCenter:
        return [
          ...locationFields,
          "courseName",
          "mode",
          "operationalDays",
          "openingTime",
          "closingTime",
          "subject",
          "classSize",
          "partlyPayment"
        ];
      case isStudyHall: return [...locationFields, "hallName", "seatingOption", "openingTime", "closingTime", "operationalDays", "startDate", "totalSeats", "availableSeats", "pricePerSeat", "hasPersonalLocker", "hasWifi", "hasChargingPoints", "hasAC"];
      default: return [...locationFields, "courseName", "courseDuration", "priceOfCourse"];
    }
  };

  const getSchemaKey = (): keyof typeof L2Schemas => {
    if (isStudyAbroad) return "studyAbroad";
    if (isCoachingCenter) return "coaching";
    if (isStudyHall) return "studyHall";
    if (isTutionCenter) return "tuition";
    if (isUnderPostGraduate) return "ugpg";
    if (isKindergarten) return "kindergarten";
    if (isSchool) return "school";
    if (isIntermediateCollege) return "college";
    return "basic";
  };

  const content = (
    <_Card className="w-full sm:p-6 rounded-[24px] bg-[#F5F6F9] dark:bg-gray-900 border-0 shadow-none">
      <_CardContent className="space-y-6 text-gray-900 dark:text-gray-100 ">
        {initialSection === "course" ? (
          <div className="space-y-6">
            <div className="space-y-2">
              <h3 className="text-xl md:text-2xl font-bold dark:text-gray-50">
                {isStudyHall ? "Study Hall" : isTutionCenter ? "Tuition Hall" : isSubscriptionProgram ? "Program Details" : "Course Details"}
              </h3>
              <p className="text-[#697282] dark:text-gray-300 text-sm">
                Enter the details of your {isSubscriptionProgram ? "programs" : "courses"}.
              </p>
            </div>
            {/* <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-wrap">
                {courses.map((course) => (
                  <Button key={course.id} type="button" variant="ghost" onClick={() => setSelectedCourseId(course.id)} className={`px-3 py-2 rounded-lg text-sm border transition-colors flex items-center gap-2 ${selectedCourseId === course.id ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-gray-50 border-gray-200 dark:bg-gray-800"}`}>
                    {course.courseName || (isStudyHall ? `Hall ${course.id}` : `Course ${course.id}`)}
                    {courses.length > 1 && <MoreVertical size={14} onClick={(e) => { e.stopPropagation(); deleteCourse(course.id); }} />}
                  </Button>
                ))}
              </div>
              <Button type="button" onClick={addNewCourse} className="bg-[#0222D7] text-white flex items-center gap-2"><Plus size={16} /> Add Item</Button>
            </div> */}
            <form onSubmit={handleCourseSubmit} className="space-y-6 ">
              {isStudyAbroad ? <StudyAbroadForm currentCourse={currentCourse} handleCourseChange={handleCourseChange} handleFileChange={handleFileChange} setCourses={setCourses} courses={courses} selectedCourseId={selectedCourseId} courseErrors={courseErrorsById[currentCourse.id] || {}} setSelectedCourseId={setSelectedCourseId} addNewCourse={addNewCourse} deleteCourse={deleteCourse} />
                : isCoachingCenter ? <CoachingCourseForm currentCourse={currentCourse} handleCourseChange={handleCourseChange} setCourses={setCourses} courses={courses} selectedCourseId={selectedCourseId} courseErrors={courseErrorsById[currentCourse.id] || {}} handleFileChange={handleFileChange} setSelectedCourseId={setSelectedCourseId} addNewCourse={addNewCourse} deleteCourse={deleteCourse} />
                  : isKindergarten ? <KindergartenForm currentCourse={currentCourse} handleCourseChange={handleCourseChange} handleOperationalDayChange={handleOperationalDayChange} courseErrors={courseErrorsById[currentCourse.id] || {}} labelVariant={isSubscriptionProgram ? "program" : "course"} setCourses={setCourses} courses={courses} institutionId={institutionId} selectedCourseId={selectedCourseId} handleFileChange={handleFileChange} setSelectedCourseId={setSelectedCourseId} addNewCourse={addNewCourse} deleteCourse={deleteCourse} />
                    : isSchool ? <SchoolForm currentCourse={currentCourse} handleCourseChange={handleCourseChange} courseErrors={courseErrorsById[currentCourse.id] || {}} setCourses={setCourses} courses={courses} institutionId={institutionId} selectedCourseId={selectedCourseId} handleFileChange={handleFileChange} setSelectedCourseId={setSelectedCourseId} addNewCourse={addNewCourse} deleteCourse={deleteCourse} />
                      : isIntermediateCollege ? <CollegeForm currentCourse={currentCourse}
                        handleCourseChange={handleCourseChange}
                        handleFileChange={handleFileChange}
                        handleOperationalDayChange={handleOperationalDayChange}
                        courseErrors={courseErrorsById[currentCourse.id] || {}}
                        setCourses={setCourses}
                        selectedCourseId={selectedCourseId}
                        setSelectedCourseId={setSelectedCourseId}
                        courses={courses}
                        addNewCourse={addNewCourse}
                        deleteCourse={deleteCourse}
                        labelVariant={isSubscriptionProgram ? "program" : "course"} />
                        : isStudyHall ? <StudyHallForm currentCourse={currentCourse} handleCourseChange={handleCourseChange} handleOperationalDayChange={handleOperationalDayChange} handleFileChange={handleFileChange} setCourses={setCourses} courses={courses} selectedCourseId={selectedCourseId} courseErrors={courseErrorsById[currentCourse.id] || {}} labelVariant={isSubscriptionProgram ? "program" : "course"} />
                          : isTutionCenter ? <TuitionCenterForm currentCourse={currentCourse} handleCourseChange={handleCourseChange} handleOperationalDayChange={handleOperationalDayChange} handleFileChange={handleFileChange} setCourses={setCourses} courses={courses} selectedCourseId={selectedCourseId} courseErrors={courseErrorsById[currentCourse.id] || {}} labelVariant={isSubscriptionProgram ? "program" : "course"} setSelectedCourseId={setSelectedCourseId} addNewCourse={addNewCourse} deleteCourse={deleteCourse} />
                            : isUnderPostGraduate ? <UnderPostGraduateForm currentCourse={currentCourse} handleCourseChange={handleCourseChange} handleFileChange={handleFileChange} setCourses={setCourses} setSelectedCourseId={setSelectedCourseId} addNewCourse={addNewCourse} deleteCourse={deleteCourse} courses={courses} selectedCourseId={selectedCourseId} courseErrors={courseErrorsById[currentCourse.id] || {}} labelVariant={isSubscriptionProgram ? "program" : "course"} />
                              : <BasicCourseForm currentCourse={currentCourse} handleCourseChange={handleCourseChange} setCourses={setCourses} courses={courses} selectedCourseId={selectedCourseId} courseErrors={courseErrorsById[currentCourse.id] || {}} labelVariant={isSubscriptionProgram ? "program" : "course"} />}
              {/* {!isStudyAbroad && <StateDistrictFields currentCourse={currentCourse} handleCourseChange={handleCourseChange} courseErrors={courseErrorsById[currentCourse.id] || {}} />} */}
              <div className="flex flex-col sm:flex-row justify-center items-center pt-8 gap-4 w-full">
                {/* Render "Save & Add Course" ONLY for Coaching and UG/PG */}
                {isCoachingOrUGPG && (
                  <Button
                    type="button"
                    disabled={isLoading}
                    onClick={() => {
                      // We call addNewCourse to add a new tab/slot in the local state
                      addNewCourse();
                      toast.info("Course added! You can now fill details for the next one.");
                    }}
                    className="w-full sm:w-[280px] h-[48px] border-2 border-[#0222D7] text-[#0222D7] bg-white hover:bg-blue-50 rounded-[12px] font-semibold text-[16px] flex items-center justify-center gap-2 transition-all active:scale-95"
                  >
                    <Plus size={18} strokeWidth={3} />
                    Save & Add Course
                  </Button>
                )}

                {/* Always show "Save & Listing Now" - This triggers handleCourseSubmit */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className={`${isCoachingOrUGPG ? 'w-full sm:w-[280px]' : 'w-full sm:w-[400px]'
                    } h-[48px] bg-[#0222D7] hover:bg-[#021bb0] text-white rounded-[12px] font-semibold text-[16px] shadow-md transition-all flex items-center justify-center gap-2 active:scale-95`}
                >
                  {isLoading ? (
                    "Saving..."
                  ) : (
                    <>
                      <Upload size={18} />
                      Save & Listing Now
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-2">
              <h3 className="text-xl md:text-2xl font-bold">Branch Details</h3>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-wrap">
                {branches.map(b => (
                  <Button key={b.id} variant="ghost" onClick={() => setSelectedBranchId(b.id)} className={`border ${selectedBranchId === b.id ? "bg-blue-50" : ""}`}>
                    {b.branchName || `Branch ${b.id}`}
                    {branches.length > 1 && (
                      <span
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          deleteBranch(b.id);
                        }}
                        className="ml-1 hover:text-red-500 transition-colors cursor-pointer flex items-center"
                      >
                        <X size={14} />
                      </span>
                    )}
                  </Button>
                ))}
              </div>
              <Button onClick={addNewBranch} className="bg-[#0222D7] text-white"><Plus size={16} /> Add Branch</Button>
            </div>
            <BranchForm branches={branches} selectedBranchId={selectedBranchId} handleBranchChange={handleBranchChange} handleBranchSubmit={handleBranchSubmit} handlePreviousClick={onPrevious} isLoading={isLoading} errors={branchErrors[selectedBranchId] || {}} />
          </div>
        )}
      </_CardContent>
    </_Card>
  );

  if (renderMode === "inline") return content;

  return (
    <>
      {assetPreview && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex flex-col items-center justify-center p-6">
          <button onClick={() => setAssetPreview(null)} className="absolute top-5 right-5 bg-white p-2 rounded-full"><X size={18} /></button>
          {assetPreview.type === "image" ? <img src={assetPreview.url} className="max-h-[85vh] object-contain" alt="Preview" /> : <iframe src={assetPreview.url} className="w-full h-full" />}
        </div>
      )}
      <_Dialog open={DialogOpen} onOpenChange={setDialogOpen}>
        {trigger && <_DialogTrigger asChild>{trigger}</_DialogTrigger>}
        <_DialogContent className="w-[95vw] sm:w-[90vw] md:w-[800px] lg:w-[900px] xl:max-w-4xl scrollbar-hide top-[65%]" showCloseButton={false}>
          {content}
        </_DialogContent>
      </_Dialog>
    </>
  );
}

function updateCoursesInIndexedDb(payload: {
  branchId: string | null; id: number; courseName: string; aboutCourse: string; courseDuration: string; startDate: string; endDate: string; mode: string; priceOfCourse: string; locationURL: string; state: string; district: string; town: string; image: File | null; imageUrl: string; imagePreviewUrl: string; brochureUrl: string; brochurePreviewUrl: string; brochure: File | null; graduationType: string; streamType: string; selectBranch: string; aboutBranch: string; educationType: string; classSize: string; classSizeRatio?: string; categoriesType: string; domainType: string; subDomainType: string; courseHighlights: string; seatingOption: string; openingTime: string; closingTime: string; openingTimePeriod: string; closingTimePeriod: string; hallName?: string; operationalDays: string[]; totalSeats: string; availableSeats: string; pricePerSeat: string; hasWifi: string; hasChargingPoints: string; hasAC: string; hasPersonalLocker: string; eligibilityCriteria: string; tuitionType: string; instructorProfile: string; subject: string; createdBranch: string; consultancyName: string; studentAdmissions: string; countriesOffered: string; academicOfferings: string; businessProof: File | null; businessProofPreviewUrl: string; businessProofUrl: string; panAadhaar: File | null; panAadhaarPreviewUrl: string; panAadhaarUrl: string; consultancyImage: File | null; consultancyImagePreviewUrl: string; consultancyImageUrl?: string; centerImage: File | null; centerImagePreviewUrl: string; centerImageUrl?: string;
  // --- MERGED L3 FIELDS ---
  collegeType: string; collegeCategory: string; schoolType: string; curriculumType: string; schoolCategory: string; hostelFacility: string; playground: string; busService: string; otherActivities: string; extendedCare: string; mealsProvided: string; outdoorPlayArea: string; placementDrives: string; mockInterviews: string; resumeBuilding: string; linkedinOptimization: string; exclusiveJobPortal: string; certification: string; ownershipType: string; affiliationType: string; library: string; entranceExam: string; managementQuota: string; applicationAssistance: string; visaProcessingSupport: string; testOperation: string; preDepartureOrientation: string; accommodationAssistance: string; educationLoans: string; postArrivalSupport: string; emioptions: string; installments: string; totalNumberRequires: string | number; totalStudentsPlaced: string | number; highestPackage: string; averagePackage: string; budget: string | number; studentsSent: string | number; partTimeHelp: string; academicDetails: AcademicDetail[]; facultyDetails: FacultyDetail[]; qualification?: string; experience?: string; specialization: string; subjectTeach?: string; monthlyFees?: string | number; classTiming?: string; courselanguage: string; classlanguage: string; mockTests: string; collegeImage: File | null; collegeImagePreviewUrl: string; collegeImageUrl?: string; tuitionImage: File | null; tuitionImagePreviewUrl: string; tuitionImageUrl?: string; partlyPayment: string; kindergartenImage: File | null; kindergartenImagePreviewUrl: string; kindergartenImageUrl?: string; schoolImage: File | null; schoolImagePreviewUrl: string; schoolImageUrl?: string; classType: string; intermediateImage: File | null; // ✅ Unique key for campus photos
  // ✅ Unique key for campus photos
  intermediateImagePreviewUrl: string; intermediateImageUrl?: string; year: string; studyMaterial: string;
}[]) {
  throw new Error("Function not implemented.");
}
function persistCoursesToIndexedDb(payload: {
  branchId: string | null; id: number; courseName: string; aboutCourse: string; courseDuration: string; startDate: string; endDate: string; mode: string; priceOfCourse: string; locationURL: string; state: string; district: string; town: string; image: File | null; imageUrl: string; imagePreviewUrl: string; brochureUrl: string; brochurePreviewUrl: string; brochure: File | null; graduationType: string; streamType: string; selectBranch: string; aboutBranch: string; educationType: string; classSize: string; classSizeRatio?: string; categoriesType: string; domainType: string; subDomainType: string; courseHighlights: string; seatingOption: string; openingTime: string; closingTime: string; openingTimePeriod: string; closingTimePeriod: string; hallName?: string; operationalDays: string[]; totalSeats: string; availableSeats: string; pricePerSeat: string; hasWifi: string; hasChargingPoints: string; hasAC: string; hasPersonalLocker: string; eligibilityCriteria: string; tuitionType: string; instructorProfile: string; subject: string; createdBranch: string; consultancyName: string; studentAdmissions: string; countriesOffered: string; academicOfferings: string; businessProof: File | null; businessProofPreviewUrl: string; businessProofUrl: string; panAadhaar: File | null; panAadhaarPreviewUrl: string; panAadhaarUrl: string; consultancyImage: File | null; consultancyImagePreviewUrl: string; consultancyImageUrl?: string; centerImage: File | null; centerImagePreviewUrl: string; centerImageUrl?: string;
  // --- MERGED L3 FIELDS ---
  collegeType: string; collegeCategory: string; schoolType: string; curriculumType: string; schoolCategory: string; hostelFacility: string; playground: string; busService: string; otherActivities: string; extendedCare: string; mealsProvided: string; outdoorPlayArea: string; placementDrives: string; mockInterviews: string; resumeBuilding: string; linkedinOptimization: string; exclusiveJobPortal: string; certification: string; ownershipType: string; affiliationType: string; library: string; entranceExam: string; managementQuota: string; applicationAssistance: string; visaProcessingSupport: string; testOperation: string; preDepartureOrientation: string; accommodationAssistance: string; educationLoans: string; postArrivalSupport: string; emioptions: string; installments: string; totalNumberRequires: string | number; totalStudentsPlaced: string | number; highestPackage: string; averagePackage: string; budget: string | number; studentsSent: string | number; partTimeHelp: string; academicDetails: AcademicDetail[]; facultyDetails: FacultyDetail[]; qualification?: string; experience?: string; specialization: string; subjectTeach?: string; monthlyFees?: string | number; classTiming?: string; courselanguage: string; classlanguage: string; mockTests: string; collegeImage: File | null; collegeImagePreviewUrl: string; collegeImageUrl?: string; tuitionImage: File | null; tuitionImagePreviewUrl: string; tuitionImageUrl?: string; partlyPayment: string; kindergartenImage: File | null; kindergartenImagePreviewUrl: string; kindergartenImageUrl?: string; schoolImage: File | null; schoolImagePreviewUrl: string; schoolImageUrl?: string; classType: string; intermediateImage: File | null; // ✅ Unique key for campus photos
  // ✅ Unique key for campus photos
  intermediateImagePreviewUrl: string; intermediateImageUrl?: string; year: string; studyMaterial: string;
}[]) {
  throw new Error("Function not implemented.");
}

