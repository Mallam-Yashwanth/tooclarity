"use client";

import { useState, useEffect, ChangeEvent, FormEvent, useMemo } from "react";
import React from "react";
import { branchAPI, programsAPI } from "@/lib/api";
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
  onLoading?: (loading: boolean) => void;
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
  // --- SECTION 1: COMMON BASE FIELDS ---
  id: number;
  _id?: string;
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
  brochure: File | null;
  brochureUrl: string;
  brochurePreviewUrl: string;
  createdBranch: string;
  aboutBranch: string;

  // --- SECTION 2: COLLEGE & K12 FIELDS ---
  collegeType: string;
  collegeCategory: string;
  specialization: string;
  year: string;
  intermediateImage: File | null;
  intermediateImagePreviewUrl: string;
  intermediateImageUrl?: string;

  // --- SECTION 3: SCHOOL & KINDERGARTEN FIELDS ---
  schoolType: string;
  curriculumType: string;
  schoolCategory: string;
  classType: string;
  classSizeRatio?: string;
  extendedCare: string;
  mealsProvided: string;
  schoolImage: File | null;
  schoolImagePreviewUrl: string;
  schoolImageUrl?: string;
  kindergartenImage: File | null;
  kindergartenImagePreviewUrl: string;
  kindergartenImageUrl?: string;

  // --- SECTION 4: COACHING & UG/PG FIELDS ---
  categoriesType: string;
  domainType: string;
  subDomainType: string;
  classTiming: string;
  courselanguage: string;
  branchDescription: string;
  classlanguage: string;
  certification: string;
  placementDrives: string;
  totalStudentsPlaced: string | number;
  highestPackage: string;
  averagePackage: string;
  mockInterviews: string;
  resumeBuilding: string;
  linkedinOptimization: string;
  mockTests: string;
  studyMaterial: string;
  centerImage: File | null;
  centerImagePreviewUrl: string;
  centerImageUrl?: string;
  entranceExam: string;
  managementQuota: string;
  totalNumberRequires: string | number;
  collegeImage: File | null;
  collegeImagePreviewUrl: string;
  collegeImageUrl?: string;

  // --- SECTION 5: STUDY ABROAD FIELDS ---
  consultancyName: string;
  studentAdmissions: string;
  countriesOffered: string;
  academicOfferings: string;
  budget: string | number;
  studentsSent: string | number;
  applicationAssistance: string;
  visaProcessingSupport: string;
  preDepartureOrientation: string;
  accommodationAssistance: string;
  educationLoans: string;
  postArrivalSupport: string;
  partTimeHelp: string;
  consultancyImage: File | null;
  consultancyImagePreviewUrl: string;
  consultancyImageUrl?: string;
  businessProof: File | null;
  businessProofPreviewUrl: string;
  businessProofUrl: string;
  panAadhaar: File | null;
  panAadhaarPreviewUrl: string;
  panAadhaarUrl: string;

  // --- SECTION 6: TUITION & ACADEMIC ARRAYS ---
  subject: string;
  tuitionType: string;
  instructorProfile: string;
  academicDetails: AcademicDetail[];
  facultyDetails: FacultyDetail[];
  tuitionImage: File | null;
  tuitionImagePreviewUrl: string;
  tuitionImageUrl?: string;

  // --- SECTION 7: STUDY HALL & SEATING FIELDS ---
  hallName?: string;
  seatingOption: string;
  totalSeats: string;
  availableSeats: string;
  pricePerSeat: string;
  hasWifi: string;
  hasChargingPoints: string;
  hasAC: string;
  hasPersonalLocker: string;

  // --- SECTION 8: SHARED OPERATIONAL & FACILITIES ---
  operationalDays: string[];
  openingTime: string;
  closingTime: string;
  openingTimePeriod: string;
  closingTimePeriod: string;
  playground: string;
  busService: string;
  hostelFacility: string;
  emioptions: string;
  installments: string;
  partlyPayment: string;
  graduationType: string;
  courseType: string;
  streamType: string;
  selectBranch: string;
  educationType: string;
  classSize: string;
  eligibilityCriteria: string;
  ownershipType: string;
  affiliationType: string;
  library: string;
}

const FORM_WHITELISTS: Record<string, (keyof Course)[]> = {
  "Intermediate college(K12)": [
    "courseName", "mode", "courseDuration", "startDate", "classlanguage", "ownershipType", "collegeType", "curriculumType", "operationalDays", "openingTime", "openingTimePeriod", "closingTime", "closingTimePeriod", "year", "classType", "specialization", "priceOfCourse", "createdBranch", "aboutBranch", "state", "district", "town", "locationURL", "playground", "busService", "hostelFacility", "emioptions", "partlyPayment", "intermediateImageUrl", "imageUrl", "brochureUrl"
  ],
  "School's": [
    "courseName", "mode", "courseDuration", "startDate", "classlanguage", "ownershipType", "schoolType", "curriculumType", "openingTime", "openingTimePeriod", "closingTime", "closingTimePeriod", "createdBranch", "aboutBranch", "state", "district", "town", "locationURL", "classType", "priceOfCourse", "playground", "busService", "hostelFacility", "emioptions", "partlyPayment", "schoolImageUrl", "imageUrl", "brochureUrl"
  ],
  "Coaching centers": [
    "categoriesType", "domainType", "subDomainType", "courseName", "mode", "courseDuration", "startDate", "createdBranch", "aboutBranch", "state", "district", "town", "locationURL", "classTiming", "courselanguage", "classlanguage", "certification", "placementDrives", "totalStudentsPlaced", "highestPackage", "averagePackage", "mockInterviews", "resumeBuilding", "linkedinOptimization", "mockTests", "library", "studyMaterial", "priceOfCourse", "installments", "emioptions", "centerImageUrl", "imageUrl", "brochureUrl"
  ],
  "Kindergarten/childcare center": [
    "courseName","courseType", "categoriesType", "priceOfCourse", "createdBranch", "aboutBranch", "state", "district", "town", "locationURL", "aboutCourse", "courseDuration", "mode", "classSize", "curriculumType", "ownershipType", "operationalDays", "openingTime", "openingTimePeriod", "closingTime", "closingTimePeriod", "extendedCare", "mealsProvided", "playground", "busService", "installments", "emioptions", "classSizeRatio", "kindergartenImageUrl", "imageUrl", "brochureUrl"
  ],
  "Study Abroad": [
    "consultancyName", "studentAdmissions", "createdBranch", "aboutBranch", "state", "district", "town", "locationURL", "countriesOffered", "academicOfferings", "budget", "studentsSent", "applicationAssistance", "visaProcessingSupport", "preDepartureOrientation", "accommodationAssistance", "educationLoans", "postArrivalSupport", "partTimeHelp", "consultancyImageUrl", "imageUrl", "brochureUrl", "businessProofUrl", "panAadhaarUrl"
  ],
  "Tution Center's": [
    "courseName", "mode", "operationalDays", "openingTime", "openingTimePeriod", "closingTime", "closingTimePeriod", "subject", "classSize", "createdBranch", "aboutBranch", "state", "district", "town", "locationURL", "academicDetails", "facultyDetails", "partlyPayment", "tuitionImageUrl", "imageUrl", "brochureUrl"
  ],
  "Study Halls": [
    "hallName", "seatingOption", "totalSeats", "availableSeats", "pricePerSeat", "openingTime", "closingTime", "operationalDays", "startDate", "endDate", "hasWifi", "hasChargingPoints", "hasAC", "hasPersonalLocker", "imageUrl", "brochureUrl", "state", "district", "town", "locationURL"
  ],
  "Under Graduation/Post Graduation": [
    "graduationType", "streamType", "selectBranch","branchDescription", "createdBranch", "aboutBranch", "state", "district", "town", "locationURL", "educationType", "mode", "classSize", "eligibilityCriteria", "ownershipType", "collegeCategory", "affiliationType", "courseDuration", "library", "hostelFacility", "entranceExam", "managementQuota", "playground", "busService", "placementDrives", "totalNumberRequires", "highestPackage", "averagePackage", "totalStudentsPlaced", "mockInterviews", "resumeBuilding", "linkedinOptimization", "priceOfCourse", "installments", "emioptions", "collegeImageUrl", "imageUrl", "brochureUrl"
  ]
};

const SMART_COPY_FORMS = [
  "Kindergarten/childcare center",
  "School's",
  "Intermediate college(K12)",
  "Study Abroad",
  "Tution Center's"
];

const BLUE_BOX_FIELDS: Record<string, (keyof Course)[]> = {
  "Intermediate college(K12)": ["year", "classType", "specialization", "priceOfCourse"],
  "School's": ["classType", "priceOfCourse"],
  "Kindergarten/childcare center": ["categoriesType", "priceOfCourse",],
  "Study Abroad": ["countriesOffered", "academicOfferings", "budget", "studentsSent"],
  "Tution Center's": ["academicDetails", "facultyDetails"]
};

export const getInitialCourseData = (
  id: number,
  type: string | null,
  existing?: Record<string, unknown>
): Course => {
  const base: Course = {
    id,
    _id: typeof existing?._id === "string" ? existing._id : undefined,
    courseName: (existing?.courseName as string) || (existing?.programName as string) || (existing?.hallName as string) || (existing?.consultancyName as string) || "",
    aboutCourse: (existing?.aboutCourse as string) || "",
    courseDuration: (existing?.courseDuration as string) || "",
    startDate: typeof existing?.startDate === "string" ? existing.startDate.split('T')[0] : "",
    endDate: typeof existing?.endDate === "string" ? existing.endDate.split('T')[0] : "",
    mode: (existing?.mode as string) || "Offline",
    priceOfCourse: String(existing?.priceOfCourse || ""),
    state: (existing?.state as string) || "",
    district: (existing?.district as string) || "",
    town: (existing?.town as string) || "",
    locationURL: (existing?.locationURL as string) || (existing?.locationUrl as string) || "",

    // --- DATABASE URLS ---
    imageUrl: (existing?.imageUrl as string) || "",
    brochureUrl: (existing?.brochureUrl as string) || "",
    businessProofUrl: (existing?.businessProofUrl as string) || "",
    panAadhaarUrl: (existing?.panAadhaarUrl as string) || "",
    intermediateImageUrl: (existing?.intermediateImageUrl as string) || "",
    schoolImageUrl: (existing?.schoolImageUrl as string) || "",
    kindergartenImageUrl: (existing?.kindergartenImageUrl as string) || "",
    centerImageUrl: (existing?.centerImageUrl as string) || "",
    consultancyImageUrl: (existing?.consultancyImageUrl as string) || "",
    collegeImageUrl: (existing?.collegeImageUrl as string) || "",
    tuitionImageUrl: (existing?.tuitionImageUrl as string) || "",

    createdBranch: (existing?.createdBranch as string) || "",
    aboutBranch: (existing?.aboutBranch as string) || "",
    image: null,
    brochure: null,

    // --- UI PREVIEW MAPPING ---
    // This maps existing S3 URLs to the preview fields so they show up in the Edit Modal
    imagePreviewUrl: (existing?.imageUrl as string) || "",
    brochurePreviewUrl: (existing?.brochureUrl as string) || "",
    businessProofPreviewUrl: (existing?.businessProofUrl as string) || "",
    panAadhaarPreviewUrl: (existing?.panAadhaarUrl as string) || "",
    intermediateImagePreviewUrl: (existing?.intermediateImageUrl as string) || "",
    schoolImagePreviewUrl: (existing?.schoolImageUrl as string) || "",
    kindergartenImagePreviewUrl: (existing?.kindergartenImageUrl as string) || "",
    centerImagePreviewUrl: (existing?.centerImageUrl as string) || "",
    consultancyImagePreviewUrl: (existing?.consultancyImageUrl as string) || "",
    collegeImagePreviewUrl: (existing?.collegeImageUrl as string) || "",
    tuitionImagePreviewUrl: (existing?.tuitionImageUrl as string) || "",

    // ... (rest of your existing fields)
    collegeType: (existing?.collegeType as string) || "",
    collegeCategory: (existing?.collegeCategory as string) || "",
    specialization: (existing?.specialization as string) || "",
    year: (existing?.year as string) || "",
    branchDescription: (existing?.branchDescription as string) || "",
    classTiming: (existing?.classTiming as string) || "",
    intermediateImage: null,
    schoolType: (existing?.schoolType as string) || "",
    curriculumType: (existing?.curriculumType as string) || "",
    schoolCategory: (existing?.schoolCategory as string) || "",
    classType: (existing?.classType as string) || "",
    courseType: (existing?.courseType as string) || "",
    extendedCare: (existing?.extendedCare as string) || "No",
    mealsProvided: (existing?.mealsProvided as string) || "No",
    schoolImage: null,
    kindergartenImage: null,
    categoriesType: (existing?.categoriesType as string) || "",
    domainType: (existing?.domainType as string) || "",
    subDomainType: (existing?.subDomainType as string) || "",
    courselanguage: (existing?.courselanguage as string) || "",
    classlanguage: (existing?.classlanguage as string) || "",
    certification: (existing?.certification as string) || "No",
    placementDrives: (existing?.placementDrives as string) || "No",
    totalStudentsPlaced: String(existing?.totalStudentsPlaced || ""),
    highestPackage: (existing?.highestPackage as string) || "",
    averagePackage: (existing?.averagePackage as string) || "",
    mockInterviews: (existing?.mockInterviews as string) || "No",
    resumeBuilding: (existing?.resumeBuilding as string) || "No",
    linkedinOptimization: (existing?.linkedinOptimization as string) || "No",
    mockTests: (existing?.mockTests as string) || "No",
    studyMaterial: (existing?.studyMaterial as string) || "",
    centerImage: null,
    consultancyName: (existing?.consultancyName as string) || "",
    studentAdmissions: String(existing?.studentAdmissions || ""),
    countriesOffered: (existing?.countriesOffered as string) || "",
    academicOfferings: (existing?.academicOfferings as string) || "",
    budget: String(existing?.budget || ""),
    studentsSent: String(existing?.studentsSent || ""),
    applicationAssistance: (existing?.applicationAssistance as string) || "No",
    visaProcessingSupport: (existing?.visaProcessingSupport as string) || "No",
    preDepartureOrientation: (existing?.preDepartureOrientation as string) || "No",
    accommodationAssistance: (existing?.accommodationAssistance as string) || "No",
    educationLoans: (existing?.educationLoans as string) || "No",
    postArrivalSupport: (existing?.postArrivalSupport as string) || "No",
    partTimeHelp: (existing?.partTimeHelp as string) || "No",
    consultancyImage: null,
    businessProof: null,
    panAadhaar: null,
    subject: (existing?.subject as string) || "",
    tuitionType: (existing?.tuitionType as string) || "",
    instructorProfile: (existing?.instructorProfile as string) || "",
    academicDetails: Array.isArray(existing?.academicDetails) ? existing.academicDetails as AcademicDetail[] : [],
    facultyDetails: Array.isArray(existing?.facultyDetails) ? existing.facultyDetails as FacultyDetail[] : [],
    tuitionImage: null,
    hallName: (existing?.hallName as string) || "",
    seatingOption: (existing?.seatingOption as string) || "",
    totalSeats: String(existing?.totalSeats || ""),
    availableSeats: String(existing?.availableSeats || ""),
    pricePerSeat: String(existing?.pricePerSeat || ""),
    hasWifi: (existing?.hasWifi as string) || "No",
    hasChargingPoints: (existing?.hasChargingPoints as string) || "No",
    hasAC: (existing?.hasAC as string) || "No",
    hasPersonalLocker: (existing?.hasPersonalLocker as string) || "No",
    operationalDays: Array.isArray(existing?.operationalDays) ? existing.operationalDays as string[] : [],
    openingTime: (existing?.openingTime as string) || "",
    closingTime: (existing?.closingTime as string) || "",
    openingTimePeriod: (existing?.openingTimePeriod as string) || "AM",
    closingTimePeriod: (existing?.closingTimePeriod as string) || "PM",
    playground: (existing?.playground as string) || "No",
    busService: (existing?.busService as string) || "No",
    hostelFacility: (existing?.hostelFacility as string) || "No",
    emioptions: (existing?.emioptions as string) || "No",
    installments: (existing?.installments as string) || "No",
    partlyPayment: (existing?.partlyPayment as string) || "No",
    graduationType: (existing?.graduationType as string) || "",
    streamType: (existing?.streamType as string) || "",
    selectBranch: (existing?.selectBranch as string) || "",
    educationType: (existing?.educationType as string) || "Full time",
    classSize: (existing?.classSize as string) || "",
    eligibilityCriteria: (existing?.eligibilityCriteria as string) || "",
    ownershipType: (existing?.ownershipType as string) || "",
    affiliationType: (existing?.affiliationType as string) || "",
    library: (existing?.library as string) || "No",
    entranceExam: (existing?.entranceExam as string) || "No",
    managementQuota: (existing?.managementQuota as string) || "No",
    totalNumberRequires: String(existing?.totalNumberRequires || ""),
    collegeImage: null,
  };

  return base;
};

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
  branchAddress?: string;
  locationUrl?: string;
  contactInfo?: string;
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

export const convertBooleansToStrings = (record: Record<string, unknown>): Record<string, unknown> => {
  const facilityKeys = [
    "hasWifi", "hasChargingPoints", "hasAC", "hasPersonalLocker",
    "hostelFacility", "playground", "busService", "extendedCare", "mealsProvided",
    "outdoorPlayArea", "placementDrives", "mockInterviews", "resumeBuilding",
    "linkedinOptimization", "exclusiveJobPortal", "certification", "library",
    "entranceExam", "managementQuota", "applicationAssistance", "visaProcessingSupport",
    "testOperation", "preDepartureOrientation", "accommodationAssistance",
    "educationLoans", "postArrivalSupport", "installments", "emioptions",
    "mockTests", "libraryFacility", "partTimeHelp", "partlyPayment"
  ];

  const converted = { ...record };

  facilityKeys.forEach((key) => {
    if (typeof converted[key] === "boolean") {
      converted[key] = converted[key] ? "Yes" : "No";
    }
  });

  return converted;
};

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
  onLoading,
  institutionType: institutionTypeProp,
  adminFlow = false,
}: L2DialogBoxProps) {
  const router = useRouter();
  const [isCoursrOrBranch, setIsCourseOrBranch] = useState<string | null>(null);
  const [institutionType, setInstitutionType] = useState<string | null>(null);

  // Default initial values for the merged L3 fields
  const mergedL3Defaults: Omit<Course, "id"> = {
    courseName: "",
    aboutCourse: "",
    courseDuration: "",
    startDate: "",
    endDate: "",
    mode: "Offline",
    priceOfCourse: "",
    locationURL: "",
    state: "",
    district: "",
    town: "",
    image: null,
    imageUrl: "",
    imagePreviewUrl: "",
    brochureUrl: "",
    brochure: null,
    brochurePreviewUrl: "",
    createdBranch: "",
    aboutBranch: "",

    // Specialized Fields
    collegeType: "",
    collegeCategory: "",
    specialization: "",
    year: "",
    intermediateImage: null,
    intermediateImagePreviewUrl: "",
    intermediateImageUrl: "",
    schoolType: "",
    curriculumType: "",
    schoolCategory: "",
    classType: "",
    courseType: "",
    classSizeRatio: "",
    extendedCare: "No",
    mealsProvided: "No",
    schoolImage: null,
    schoolImagePreviewUrl: "",
    kindergartenImage: null,
    kindergartenImagePreviewUrl: "",
    kindergartenImageUrl: "",
    categoriesType: "",
    domainType: "",
    subDomainType: "",
    classTiming: "",
    branchDescription: "",
    courselanguage: "",
    classlanguage: "",
    certification: "No",
    placementDrives: "No",
    totalStudentsPlaced: "",
    highestPackage: "",
    averagePackage: "",
    mockInterviews: "No",
    resumeBuilding: "No",
    linkedinOptimization: "No",
    mockTests: "No",
    studyMaterial: "",
    centerImage: null,
    centerImagePreviewUrl: "",
    centerImageUrl: "",
    consultancyName: "",
    studentAdmissions: "",
    countriesOffered: "",
    academicOfferings: "",
    budget: "",
    studentsSent: "",
    applicationAssistance: "No",
    visaProcessingSupport: "No",
    preDepartureOrientation: "No",
    accommodationAssistance: "No",
    educationLoans: "No",
    postArrivalSupport: "No",
    partTimeHelp: "No",
    consultancyImage: null,
    consultancyImagePreviewUrl: "",
    consultancyImageUrl: "",
    businessProof: null,
    businessProofPreviewUrl: "",
    businessProofUrl: "",
    panAadhaar: null,
    panAadhaarPreviewUrl: "",
    panAadhaarUrl: "",
    subject: "",
    tuitionType: "",
    instructorProfile: "",
    academicDetails: [],
    facultyDetails: [],
    tuitionImage: null,
    tuitionImagePreviewUrl: "",
    tuitionImageUrl: "",
    hallName: "",
    seatingOption: "",
    totalSeats: "",
    availableSeats: "",
    pricePerSeat: "",
    hasWifi: "No",
    hasChargingPoints: "No",
    hasAC: "No",
    hasPersonalLocker: "No",
    operationalDays: [],
    openingTime: "",
    closingTime: "",
    openingTimePeriod: "AM",
    closingTimePeriod: "PM",
    playground: "No",
    busService: "No",
    hostelFacility: "No",
    emioptions: "No",
    installments: "No",
    partlyPayment: "No",
    graduationType: "",
    streamType: "",
    selectBranch: "",
    educationType: "Full time",
    classSize: "",
    eligibilityCriteria: "",
    ownershipType: "",
    affiliationType: "",
    library: "No",
    entranceExam: "No",
    managementQuota: "No",
    totalNumberRequires: "",
    collegeImage: null,
    collegeImagePreviewUrl: "",

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
  const [remoteBranches, setRemoteBranches] = useState<Array<{
    _id: string;
    branchName: string;
    branchAddress: string;
    locationUrl: string
  }>>([]);
  const [selectedBranchIdForProgram, setSelectedBranchIdForProgram] = useState<string>("");
  const [programBranchError, setProgramBranchError] = useState<string>("");
  const [assetPreview, setAssetPreview] = useState<{ type: "image" | "brochure"; url: string } | null>(null);

  const uniqueRemoteBranches = React.useMemo(() => {
    const seenNames = new Set<string>();
    const seenIds = new Set<string>();
    const result: Array<{
      _id: string;
      branchName: string;
      branchAddress: string;
      locationUrl: string;
    }> = [];
    for (const b of remoteBranches) {
      const id = String(b?._id || "");
      const name = (b?.branchName || "Branch").trim();
      const keyName = name.toLowerCase();
      if (!id || seenIds.has(id) || seenNames.has(keyName)) continue;
      seenIds.add(id);
      seenNames.add(keyName);
      result.push({
        _id: id,
        branchName: name,
        branchAddress: b.branchAddress || "",
        locationUrl: b.locationUrl || "",
      });
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

  const sanitizeCourseForLocalDb = (course: Course): import("@/lib/localDb").CourseRecord => {
    // 1. Identify facility keys that we want to ensure stay as "Yes" or "No"
    const facilityKeys = [
      "hasWifi", "hasChargingPoints", "hasAC", "hasPersonalLocker",
      "hostelFacility", "playground", "busService", "extendedCare", "mealsProvided",
      "outdoorPlayArea", "placementDrives", "mockInterviews", "resumeBuilding",
      "linkedinOptimization", "exclusiveJobPortal", "certification", "library",
      "entranceExam", "managementQuota", "applicationAssistance", "visaProcessingSupport",
      "testOperation", "preDepartureOrientation", "accommodationAssistance",
      "educationLoans", "postArrivalSupport", "installments", "emioptions",
      "mockTests", "libraryFacility", "partTimeHelp", "partlyPayment"
    ];

    // 2. Process the entries
    const entries = Object.entries(course).map(([key, value]) => {
      // Force facility fields to "Yes"/"No" strings if they aren't already
      if (facilityKeys.includes(key)) {
        return [key, value === "Yes" ? "Yes" : "No"];
      }
      return [key, value];
    });

    // 3. Filter out data that IndexedDB cannot or should not store
    const filteredEntries = entries.filter(([, value]) => {
      return (
        value !== null &&
        value !== "" &&
        value !== undefined &&
        !(value instanceof File) && // Files must be uploaded to S3 first
        !(Array.isArray(value) && value.length === 0)
      );
    });

    return Object.fromEntries(filteredEntries) as import("@/lib/localDb").CourseRecord;
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
          branchName: b.branchName || "Branch",
          branchAddress: b.branchAddress || "",
          contactInfo: b.contactInfo || "",
          locationUrl: b.locationUrl || ""
        })));
      } catch (e) {
        console.error("Error loading branches:", e);
      }
    })();
  }, [DialogOpen, institutionId, isSubscriptionProgram]);

  const [courses, setCourses] = useState<Course[]>(() => {
    if (editMode && existingCourseData) {
      const rawData = existingCourseData as unknown as Record<string, unknown>;
      const initial = getInitialCourseData(1, institutionType, rawData);

      // ✅ 1. Standard Previews
      initial.imagePreviewUrl = (rawData.imageUrl as string) || (rawData.imageURL as string) || "";
      initial.brochurePreviewUrl = (rawData.brochureUrl as string) || (rawData.brochureURL as string) || "";

      // ✅ 2. Specialized Previews (Map these directly without 'if' checks)
      // This ensures that if the data exists in rawData, it MOVES to the Preview field
      initial.intermediateImagePreviewUrl = (rawData.intermediateImageUrl as string) || "";
      initial.schoolImagePreviewUrl = (rawData.schoolImageUrl as string) || "";
      initial.kindergartenImagePreviewUrl = (rawData.kindergartenImageUrl as string) || "";
      initial.centerImagePreviewUrl = (rawData.centerImageUrl as string) || "";
      initial.tuitionImagePreviewUrl = (rawData.tuitionImageUrl as string) || "";
      initial.consultancyImagePreviewUrl = (rawData.consultancyImageUrl as string) || "";
      initial.collegeImagePreviewUrl = (rawData.collegeImageUrl as string) || "";

      return [initial];
    }

    return [getInitialCourseData(1, institutionType)];
  });

  // 1. Add this useEffect to handle "Resetting" the form when props change
  useEffect(() => {
    if (editMode && existingCourseData) {
      const rawData = existingCourseData as any;

      if (rawData.courses && Array.isArray(rawData.courses)) {
        // Re-construct the full course objects for the React state
        const reconstructedCourses = rawData.courses.map((subCourse: any, index: number) => {
          return {
            ...getInitialCourseData(index + 1, institutionType, { ...rawData, ...subCourse }),
            _id: rawData._id // Share the parent ID
          };
        });

        setCourses(reconstructedCourses);
        setSelectedCourseId(1);
      } else {
        // Fallback for flat data
        const mapped = getInitialCourseData(1, institutionType, rawData);
        mapped._id = rawData._id;
        setCourses([mapped]);
      }

      if (rawData.branch) setSelectedBranchIdForProgram(String(rawData.branch));
    }
  }, [existingCourseData, editMode, institutionType]);
  // Triggers every time you click "Edit" on a different listing

  useEffect(() => {
    if (DialogOpen && !editMode && !isSubscriptionProgram) {
      const loadCoursesFromDB = async () => {
        try {
          const groups = await getCoursesGroupsByBranchName();
          const loadedCourses: Course[] = [];

          /**
           * Internal mapper to transform DB records into full Course objects
           */
          const mapRecordToCourse = (record: import("@/lib/localDb").CourseRecord, index: number): Course => {
            // 1. Cast the database record to a generic object to allow processing
            const rawRecord = record as unknown as Record<string, unknown>;

            // 2. Convert boolean fields (true/false) to UI strings ("Yes"/"No")
            const stringifiedRecord = convertBooleansToStrings(rawRecord);

            // 3. Use the factory to generate a complete Course object
            // This fills in all 80+ properties required by the interface
            const course = getInitialCourseData(index + 1, institutionType, stringifiedRecord);

            // 4. Map existing cloud URLs to the UI Preview fields
            course.imagePreviewUrl = record.imageUrl || "";
            course.brochurePreviewUrl = record.brochureUrl || "";

            // 5. Handle specialized form image previews
            // Using type narrowing checks to see if property exists in record
            if (record.collegeImageUrl) course.collegeImagePreviewUrl = record.collegeImageUrl as string;
            if (record.schoolImageUrl) course.schoolImagePreviewUrl = record.schoolImageUrl as string;
            if (record.centerImageUrl) course.centerImagePreviewUrl = record.centerImageUrl as string;
            if (record.tuitionImageUrl) course.tuitionImagePreviewUrl = record.tuitionImageUrl as string;
            if (record.kindergartenImageUrl) course.kindergartenImagePreviewUrl = record.kindergartenImageUrl as string;
            if (record.intermediateImageUrl) course.intermediateImagePreviewUrl = record.intermediateImageUrl as string;
            if (record.consultancyImageUrl) course.consultancyImagePreviewUrl = record.consultancyImageUrl as string;

            return course;
          };

          // Iterate through branch groups and flatten courses into a single list
          let globalIndex = 0;
          groups.forEach((group) => {
            if (group.courses && group.courses.length > 0) {
              group.courses.forEach((c) => {
                loadedCourses.push(mapRecordToCourse(c, globalIndex++));
              });
            }
          });

          if (loadedCourses.length > 0) {
            setCourses(loadedCourses);
            setSelectedCourseId(1);
          }
        } catch (err) {
          console.error("❌ Failed to load courses from DB:", err);
          toast.error("Could not load saved data.");
        }
      };

      loadCoursesFromDB();
    }
  }, [DialogOpen, editMode, isSubscriptionProgram, institutionType]);

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
    const { name: originalName, value } = e.target;
    const name = originalName === "locationUrl" ? "locationURL" : originalName;
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
      return pathString.toLowerCase() === name.toLowerCase() || detail.path[0] === name;
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

  const handleFileChange = (
    e: ChangeEvent<HTMLInputElement>,
    type:
      | "image" | "brochure" | "businessProof" | "panAadhaar"
      | "centerImage" | "consultancyImage" | "collegeImage"
      | "tuitionImage" | "kindergartenImage" | "schoolImage"
      | "intermediateImage"
  ) => {
    const files = e.target.files;
    if (!files || !files[0]) return;
    const selectedFile = files[0];

    const allowedImageTypes = ["image/png", "image/jpg", "image/jpeg"];
    const allowedPdfTypes = ["application/pdf"];
    let errorMessage = "";

    // 1. Unified Validation Logic
    // Fields that MUST be PDF
    const pdfFields = ["brochure", "panAadhaar"];

    if (pdfFields.includes(type)) {
      if (!allowedPdfTypes.includes(selectedFile.type)) {
        errorMessage = "Only PDF files are allowed.";
      }
    } else {
      // All other fields (image, businessProof, and all 7 specialized campus images)
      if (!allowedImageTypes.includes(selectedFile.type)) {
        errorMessage = "Only PNG, JPG, or JPEG images are allowed.";
      }
    }

    // 2. Size Validation
    if (selectedFile.size > 4 * 1024 * 1024) {
      errorMessage = "File size must be 4 MB or less.";
    }

    // 3. Handle Error State
    if (errorMessage) {
      setCourseErrorsById((prev) => ({
        ...prev,
        [selectedCourseId]: {
          ...(prev[selectedCourseId] || {}),
          [`${type}Url`]: errorMessage
        }
      }));
      toast.error(errorMessage);
      return;
    }

    // 4. Clear existing errors on success
    setCourseErrorsById((prev) => {
      const updated = { ...(prev[selectedCourseId] || {}) };
      delete updated[`${type}Url`];
      return { ...prev, [selectedCourseId]: updated };
    });

    // 5. Update Course State with File and Preview URL
    const previewUrl = URL.createObjectURL(selectedFile);

    setCourses((prevCourses) =>
      prevCourses.map((course) =>
        course.id === selectedCourseId
          ? {
            ...course,
            [type]: selectedFile,
            [`${type}PreviewUrl`]: previewUrl
          }
          : course
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
    const current = courses.find((c) => c.id === selectedCourseId) || courses[0];
    const newId = courses.length > 0 ? Math.max(...courses.map((c) => c.id)) + 1 : 1;
    const type = institutionType || "";

    let newCourse: Course;

    if (SMART_COPY_FORMS.includes(type)) {
      newCourse = {
        ...current,
        id: newId,
        _id: undefined
      };
      const fieldsToReset = BLUE_BOX_FIELDS[type] || [];
      const freshDefaults = getInitialCourseData(newId, type);

      fieldsToReset.forEach((field) => {
        (newCourse[field] as any) = freshDefaults[field];
      });

      if (type === "Tution Center's") {
        newCourse.academicDetails = [];
        newCourse.facultyDetails = [];
      }


    } else {
      newCourse = getInitialCourseData(newId, type);
    }

    setCourses([...courses, newCourse]);
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

  const getCleanedPayload = (course: Course): Partial<Course> => {
    const type = institutionType || "";
    const allowedKeys = FORM_WHITELISTS[type] || [];

    // Use Record type to allow dynamic string indexing safely
    const cleaned: Record<string, unknown> = {};
    if (course._id) {
      cleaned._id = course._id;
    }

    allowedKeys.forEach((key) => {
      const value = course[key];

      // Logic: Only include data that is not "empty"
      // This keeps your database records small and searchable
      if (value === "Yes" || value === "No") {
        cleaned[key as string] = value;
        return;
      }

      if (
        value !== undefined &&
        value !== null &&
        value !== "" &&
        !(Array.isArray(value) && value.length === 0)
      ) {
        cleaned[key as string] = value;
      }
    });

    return cleaned as Partial<Course>;
  };

  const handleSaveAndAddAnother = () => {
  // Validate ONLY the current tab's data
  const currentCourseToValidate = courses.filter(c => c.id === selectedCourseId);
  const validationError = validateCourses(currentCourseToValidate);

  if (validationError) {
    toast.error(validationError);
    return;
  }

  addNewCourse(); 
  toast.success("Course details saved locally. You can now add another!");
};

  const handleCourseSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    onLoading?.(true);

    try {
      // --- STEP 1: PREPARE DATA ---
      const preparedForValidation = courses.map((course) => {
        if (course.createdBranch === "Main" && isSubscriptionProgram) {
          const branch = uniqueRemoteBranches.find((b) => b._id === selectedBranchIdForProgram);
          if (branch) {
            return {
              ...course,
              aboutBranch: branch.branchAddress || course.aboutBranch || "",
              locationURL: branch.locationUrl || course.locationURL || "",
            };
          }
        }
        return course;
      });

      // --- STEP 2: VALIDATE ALL COURSES ---
      const validationMessage = validateCourses(preparedForValidation);
      if (validationMessage) {
        toast.error(validationMessage);
        setIsLoading(false);
        onLoading?.(false);
        return;
      }

      // --- STEP 3: SMART S3 UPLOADS (With File Caching) ---
      // This prevents re-uploading the same campus image multiple times
      const fileCache = new Map<File, string>();

      const uploadedCourses = await Promise.all(
        preparedForValidation.map(async (course) => {
          const updated = { ...course };
          const fileFields: { file: File | null; urlKey: keyof Course }[] = [
            { file: course.image, urlKey: "imageUrl" },
            { file: course.brochure, urlKey: "brochureUrl" },
            { file: course.centerImage, urlKey: "centerImageUrl" },
            { file: course.tuitionImage, urlKey: "tuitionImageUrl" },
            { file: course.kindergartenImage, urlKey: "kindergartenImageUrl" },
            { file: course.schoolImage, urlKey: "schoolImageUrl" },
            { file: course.intermediateImage, urlKey: "intermediateImageUrl" },
            { file: course.collegeImage, urlKey: "collegeImageUrl" },
            { file: course.consultancyImage, urlKey: "consultancyImageUrl" },
          ];

          for (const item of fileFields) {
            if (item.file instanceof File) {
              // Check if this specific file was already uploaded in this session
              if (fileCache.has(item.file)) {
                (updated[item.urlKey] as string) = fileCache.get(item.file)!;
              } else {
                const res = (await uploadToS3(item.file)) as S3UploadResult;
                if (res.success && res.fileUrl) {
                  fileCache.set(item.file, res.fileUrl); // Store in cache
                  (updated[item.urlKey] as string) = res.fileUrl;
                }
              }
            }
          }
          return updated;
        })
      );

      // Sync state for UI consistency
      setCourses(uploadedCourses);

      // --- STEP 4: API SUBMISSION (Subscription/Admin Flow) ---
      if (isSubscriptionProgram) {
        if (!institutionId) throw new Error("institutionId required");

        // 1. Identify Common Root Fields (Shared by all courses)
        const firstCourse = uploadedCourses[0];

        // 2. Map Unique "Blue Box" Fields into a Sub-Array
        const type = institutionType || "";
        const blueBoxKeys = BLUE_BOX_FIELDS[type] || [];

        const courseSubArray = uploadedCourses.map(course => {
          const uniqueFields: Record<string, any> = {};
          blueBoxKeys.forEach(key => {
            uniqueFields[key] = course[key as keyof Course];
          });
          return uniqueFields;
        });

        // 1. Define a mapping for types that differ between UI and Backend
const typeMapping: Record<string, string> = {
  "Kindergarten/childcare center": "Kindergarten",
  "School's": "School",
  "Tution Center's": "Tuition Center",
  "Intermediate college(K12)": "College"
};

        // 3. Build the Normalized Payload
        // Common fields stay at the top, dynamic fields go inside "courses"
        const normalizedPayload = {
          ...getCleanedPayload(firstCourse),
          institution: institutionId,
          branch: selectedBranchIdForProgram || null,
          branchName: resolveLocalBranchName(),
          type: "PROGRAM" as const,
          courseType: firstCourse.courseType || typeMapping[institutionType || ""] || institutionType,
          courses: courseSubArray, // Only contains the bluebox variations
        };

        // 4. Remove the sub-array fields from the root to prevent redundancy
        blueBoxKeys.forEach(key => {
          delete (normalizedPayload as any)[key];
        });

        // 5. Send to API
        if (editMode && firstCourse._id) {
          await programsAPI.update(firstCourse._id, normalizedPayload);
        } else {
          await programsAPI.create(normalizedPayload);
        }

        await persistAdminProgramsToIndexedDb(uploadedCourses);
        if (editMode) {
            onEditSuccess?.();
        } else {
            router.push("/dashboard/subscription");
            onSuccess?.();
        }
        return;
      }

      // --- STEP 5: LOCAL DB & REDIRECT (Non-Subscription) ---
      const allBranches = await getAllBranchesFromDB();
      const branchMap = new Map<string, BranchGroup>(
        allBranches.map((b) => [
          b.branchName.trim().toLowerCase(),
          {
            branchName: b.branchName,
            branchAddress: b.branchAddress,
            contactInfo: b.contactInfo,
            locationUrl: b.locationUrl || "",
            courses: [],
          },
        ])
      );

      const unassigned: import("@/lib/localDb").CourseRecord[] = [];
      uploadedCourses.forEach((c) => {
        const key = (c.createdBranch || "").trim().toLowerCase();
        const existingBranch = branchMap.get(key);
        if (existingBranch) {
          existingBranch.courses.push(sanitizeCourseForLocalDb(c));
        } else {
          unassigned.push(sanitizeCourseForLocalDb(c));
        }
      });

      const payload: BranchGroup[] = Array.from(branchMap.values()).filter((b) => b.courses.length > 0);

      if (unassigned.length > 0) {
        payload.push({
          branchName: "Main Institution",
          branchAddress: "Default",
          contactInfo: "0000000000",
          locationUrl: "",
          courses: unassigned,
        });
      }

      for (const entry of payload) {
        const existingGroups = await getCoursesGroupsByBranchName(entry.branchName);
        if (existingGroups.length > 0) {
          const currentGroup = existingGroups[0];
          await updateCoursesGroupInDB({
            ...currentGroup,
            ...entry,
            courses: [...(currentGroup.courses || []), ...entry.courses],
          });
        } else {
          await addCoursesGroupToDB(entry);
        }
      }

      const response = (await exportAndUploadInstitutionAndCourses()) as ExportResponse;
      if (response.success) {
        router.push("/payment");
      } else {
        toast.error(response.message || "Export failed");
      }

      onSuccess?.();
    } catch (error) {
      console.error("Error saving:", error);
      toast.error("An error occurred while saving.");
    } finally {
      setIsLoading(false);
      onLoading?.(false);
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
  // ✅ Updated to accept a parameter: dataToValidate
  const validateCourses = (dataToValidate: Course[]) => {
    const requiredFields = getRequiredFields();

    for (let index = 0; index < dataToValidate.length; index++) {
      const course = dataToValidate[index];

      const courseLabel = course.courseName
        ? `"${course.courseName}"`
        : `Program #${index + 1}`;

      // 1. Validate Top-Level Required Fields
      for (const field of requiredFields) {
        const value = course[field as keyof Course];
        if (!value || String(value).trim() === "") {
          // We convert CamelCase field names to readable strings for the user
          const readableField = field.replace(/([A-Z])/g, ' $1').toLowerCase();
          return `Please fill in the ${readableField} for ${courseLabel}.`;
        }
      }

      // 2. Specialized Logic for Tuition Centers (Arrays)
      if (getSchemaKey() === 'tuition') {
        if (!course.academicDetails || course.academicDetails.length === 0) {
          return `Please add at least one Subject entry for ${courseLabel}.`;
        }
        for (let i = 0; i < course.academicDetails.length; i++) {
          const detail = course.academicDetails[i];
          if (!detail.subject?.trim() || !detail.specialization?.trim() || !detail.monthlyFees) {
            return `Please complete all fields in Subject Tab ${i + 1} for ${courseLabel}.`;
          }
        }

        if (!course.facultyDetails || course.facultyDetails.length === 0) {
          return `Please add at least one Faculty entry for ${courseLabel}.`;
        }
      }

      // 3. Image & Brochure Validation
      const hasImage = course.image instanceof File || (typeof course.imageUrl === 'string' && course.imageUrl.length > 0);
      const hasBrochure = course.brochure instanceof File || (typeof course.brochureUrl === 'string' && course.brochureUrl.length > 0);

      if (!hasImage) {
        return `Please upload an image for ${courseLabel}.`;
      }
      if (!hasBrochure) {
        return `Please upload a brochure for ${courseLabel}.`;
      }
    }

    return null;
  };

  const getRequiredFields = () => {
    // Added "town" and "aboutBranch" to the required list
    const locationFields = ["state", "district", "town", "locationURL", "aboutBranch"];
    const coachingCommon = ["categoriesType", "domainType", "subDomainType", "courseName", "courseDuration", "startDate", "priceOfCourse", "installments", "emioptions"];

    switch (true) {
      case isStudyAbroad: return ["consultancyName", "studentAdmissions", "countriesOffered", "academicOfferings"];
      case isKindergarten:
        return [
          ...locationFields,
           "courseName", "categoriesType", "priceOfCourse",
          "aboutCourse", "courseDuration", "mode", "classSize", "curriculumType",
          "ownershipType", "operationalDays", "openingTime", "closingTime",
          "extendedCare", "mealsProvided", "playground", "busService", "classSizeRatio"
        ];
      case isBasicCourseForm: return [...locationFields, "courseName", "courseDuration", "priceOfCourse", "startDate"];

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
          "courseName", "mode", "courseDuration", "startDate", "classlanguage",
          "ownershipType", "collegeType", "curriculumType", "operationalDays","openingTime", "closingTime","year", "classType",
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
          : [...locationFields, ...coachingCommon, "classlanguage", "classSize", "mockTests", "library", "studyMaterial"];

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

   const isFormIncomplete = useMemo(() => {
  const requiredFields = getRequiredFields();
  const hasMissingTextFields = requiredFields.some((field) => {
    const value = currentCourse[field as keyof Course];
    if (Array.isArray(value)) return value.length === 0;
    return !value || String(value).trim() === "";
  });

  const hasMissingFiles = !currentCourse.imagePreviewUrl || !currentCourse.brochurePreviewUrl;
  let hasMissingCampusImage = false;
  if (isKindergarten) hasMissingCampusImage = !currentCourse.kindergartenImagePreviewUrl;
  if (isSchool) hasMissingCampusImage = !currentCourse.schoolImagePreviewUrl;
  if (isUnderPostGraduate) hasMissingCampusImage = !currentCourse.collegeImagePreviewUrl;
  if (isCoachingCenter) hasMissingCampusImage = !currentCourse.centerImagePreviewUrl;

  return hasMissingTextFields || hasMissingFiles || hasMissingCampusImage;
}, [currentCourse, institutionType]);

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

            {/* --- NEW: Branch Selection Dropdown for Admin/Subscription Flow --- */}
            {isSubscriptionProgram && !editMode && (
              <div className="bg-white dark:bg-gray-800 p-5 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                  Assign to Branch <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={selectedBranchIdForProgram}
                    onChange={(e) => {
                      setSelectedBranchIdForProgram(e.target.value);
                      setProgramBranchError("");
                    }}
                    className={`w-full h-12 pl-4 pr-10 rounded-xl border bg-gray-50 dark:bg-gray-900 appearance-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer font-medium ${programBranchError ? "border-red-500" : "border-gray-200 dark:border-gray-700"
                      }`}
                  >
                    <option value="">-- Select Branch --</option>
                    {uniqueRemoteBranches.map((branch) => (
                      <option key={branch._id} value={branch._id}>
                        {branch.branchName}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg width="12" height="8" viewBox="0 0 12 8" fill="none" className="stroke-gray-400"><path d="M1 1L6 6L11 1" strokeWidth="2" strokeLinecap="round" /></svg>
                  </div>
                </div>
                {programBranchError && <p className="text-red-500 text-xs mt-2 font-semibold">{programBranchError}</p>}
              </div>
            )}

            <form id="l2-course-form" onSubmit={handleCourseSubmit} className="space-y-6 ">
              {/* NOTE: We added `uniqueRemoteBranches` and `selectedBranchId` props 
                  to each form below to facilitate the autofill logic.
              */}
              {isStudyAbroad ? (
                <StudyAbroadForm
                  currentCourse={currentCourse} handleCourseChange={handleCourseChange} handleFileChange={handleFileChange}
                  setCourses={setCourses} courses={courses} selectedCourseId={selectedCourseId}
                  courseErrors={courseErrorsById[currentCourse.id] || {}} setSelectedCourseId={setSelectedCourseId}
                  addNewCourse={addNewCourse} deleteCourse={deleteCourse}
                  uniqueRemoteBranches={uniqueRemoteBranches}
                  selectedBranchId={selectedBranchIdForProgram}
                  isSubscriptionProgram={isSubscriptionProgram}
                />
              ) : isCoachingCenter ? (
                <CoachingCourseForm
                  currentCourse={currentCourse} handleCourseChange={handleCourseChange} setCourses={setCourses}
                  courses={courses} selectedCourseId={selectedCourseId} courseErrors={courseErrorsById[currentCourse.id] || {}}
                  handleFileChange={handleFileChange} setSelectedCourseId={setSelectedCourseId} addNewCourse={addNewCourse}
                  deleteCourse={deleteCourse}
                  uniqueRemoteBranches={uniqueRemoteBranches}
                  selectedBranchId={selectedBranchIdForProgram}
                  isSubscriptionProgram={isSubscriptionProgram}
                />
              ) : isKindergarten ? (
                <KindergartenForm
                  currentCourse={currentCourse} handleCourseChange={handleCourseChange} handleOperationalDayChange={handleOperationalDayChange}
                  courseErrors={courseErrorsById[currentCourse.id] || {}} labelVariant={isSubscriptionProgram ? "program" : "course"}
                  setCourses={setCourses} courses={courses} institutionId={institutionId} selectedCourseId={selectedCourseId}
                  handleFileChange={handleFileChange} setSelectedCourseId={setSelectedCourseId} addNewCourse={addNewCourse} deleteCourse={deleteCourse}
                  uniqueRemoteBranches={uniqueRemoteBranches}
                  selectedBranchId={selectedBranchIdForProgram}
                  isSubscriptionProgram={isSubscriptionProgram}
                />
              ) : isSchool ? (
                <SchoolForm
                  currentCourse={currentCourse} handleCourseChange={handleCourseChange} courseErrors={courseErrorsById[currentCourse.id] || {}}
                  setCourses={setCourses} courses={courses} institutionId={institutionId} selectedCourseId={selectedCourseId}
                  handleFileChange={handleFileChange} setSelectedCourseId={setSelectedCourseId} addNewCourse={addNewCourse} deleteCourse={deleteCourse}
                  uniqueRemoteBranches={uniqueRemoteBranches}
                  selectedBranchId={selectedBranchIdForProgram}
                  isSubscriptionProgram={isSubscriptionProgram}
                />
              ) : isIntermediateCollege ? (
                <CollegeForm
                  currentCourse={currentCourse} handleCourseChange={handleCourseChange} handleFileChange={handleFileChange}
                  handleOperationalDayChange={handleOperationalDayChange} courseErrors={courseErrorsById[currentCourse.id] || {}}
                  setCourses={setCourses} selectedCourseId={selectedCourseId} setSelectedCourseId={setSelectedCourseId}
                  courses={courses} addNewCourse={addNewCourse} deleteCourse={deleteCourse}
                  labelVariant={isSubscriptionProgram ? "program" : "course"}
                  uniqueRemoteBranches={uniqueRemoteBranches}
                  selectedBranchId={selectedBranchIdForProgram}
                  isSubscriptionProgram={isSubscriptionProgram}
                />
              ) : isStudyHall ? (
                <StudyHallForm
                  currentCourse={currentCourse} handleCourseChange={handleCourseChange} handleOperationalDayChange={handleOperationalDayChange}
                  handleFileChange={handleFileChange} setCourses={setCourses} courses={courses} selectedCourseId={selectedCourseId}
                  courseErrors={courseErrorsById[currentCourse.id] || {}} labelVariant={isSubscriptionProgram ? "program" : "course"}
                />
              ) : isTutionCenter ? (
                <TuitionCenterForm
                  currentCourse={currentCourse} handleCourseChange={handleCourseChange} handleOperationalDayChange={handleOperationalDayChange}
                  handleFileChange={handleFileChange} setCourses={setCourses} courses={courses} selectedCourseId={selectedCourseId}
                  courseErrors={courseErrorsById[currentCourse.id] || {}} labelVariant={isSubscriptionProgram ? "program" : "course"}
                  setSelectedCourseId={setSelectedCourseId} addNewCourse={addNewCourse} deleteCourse={deleteCourse}
                  uniqueRemoteBranches={uniqueRemoteBranches}
                  selectedBranchId={selectedBranchIdForProgram}
                  isSubscriptionProgram={isSubscriptionProgram}
                />
              ) : isUnderPostGraduate ? (
                <UnderPostGraduateForm
                  currentCourse={currentCourse} handleCourseChange={handleCourseChange} handleFileChange={handleFileChange}
                  setCourses={setCourses} setSelectedCourseId={setSelectedCourseId} addNewCourse={addNewCourse} deleteCourse={deleteCourse}
                  courses={courses} selectedCourseId={selectedCourseId} courseErrors={courseErrorsById[currentCourse.id] || {}}
                  labelVariant={isSubscriptionProgram ? "program" : "course"}
                  uniqueRemoteBranches={uniqueRemoteBranches}
                  selectedBranchId={selectedBranchIdForProgram}
                  isSubscriptionProgram={isSubscriptionProgram}
                />
              ) : (
                <BasicCourseForm
                  currentCourse={currentCourse} handleCourseChange={handleCourseChange} setCourses={setCourses}
                  courses={courses} selectedCourseId={selectedCourseId} courseErrors={courseErrorsById[currentCourse.id] || {}}
                  labelVariant={isSubscriptionProgram ? "program" : "course"}

                />
              )}

              <div className="flex flex-col sm:flex-row justify-center items-center pt-8 gap-4 w-full">
                {isCoachingOrUGPG && (
                  <Button
                    type="button"
                    disabled={isLoading || isFormIncomplete}
                    onClick={handleSaveAndAddAnother}
                    className="w-full sm:w-[280px] h-[48px] border-2 border-[#0222D7] text-[#0222D7] bg-white hover:bg-blue-50 rounded-[12px] font-semibold text-[16px] flex items-center justify-center gap-2 transition-all active:scale-95"
                  >
                    <Plus size={18} strokeWidth={3} />
                    Save & Add Course
                  </Button>
                )}

                <Button
                  type="submit"
                  disabled={isLoading || isFormIncomplete}
                  className={`${isCoachingOrUGPG ? 'w-full sm:w-[280px]' : 'w-full sm:w-[400px]'} h-[48px] bg-[#0222D7] hover:bg-[#021bb0] text-white rounded-[12px] font-semibold text-[16px] shadow-md transition-all flex items-center justify-center gap-2 active:scale-95`}
                >
                  {isLoading ? "Saving..." : <><Upload size={18} /> Save & Listing Now</>}
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
                      <span onClick={(e) => { e.preventDefault(); e.stopPropagation(); deleteBranch(b.id); }} className="ml-1 hover:text-red-500 transition-colors cursor-pointer flex items-center">
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