import Joi from "joi";
import {
  urlRule,
  nameRule,
  createdBranchRule,
  categoriesTypeRule,
  graduationTypeRule,
  streamTypeRule,
  selectBranchRule,
  phoneRule,
  domainTypeRule,
  subDomainTypeRule,
  courseHighlightsRule,
  durationRule,
  stateRule,
  districtRule,
} from "./ValidationRules";



// ✅ Common base
export const baseCourseSchema = Joi.object({
  courseName: nameRule.required(),
  aboutCourse: Joi.string().min(10).max(500).required().messages({
    "string.empty": "About Course is required",
    "string.min": "About Course must be at least 10 characters",
    "string.max": "About Course must be at most 500 characters",
  }),
  courseDuration: durationRule,
  startDate: Joi.string().required().messages({
    "string.empty": "Start date is required",
    "any.required": "Start date is required",
  }),
  endDate: Joi.string().required().messages({
    "string.empty": "End date is required",
    "any.required": "End date is required",
  }),
  priceOfCourse: Joi.number()
    .greater(0)
    .required()
    .messages({
      "number.base": "Price must be a number",
      "number.greater": "Price must be greater than 0",
      "any.required": "Price is required",
    }),
  // ✅ Fixed Casing
  locationURL: urlRule.required().messages({
    "string.empty": "Location URL is required",
    "any.required": "Location URL is required",
  }),
  state: stateRule,
  district: districtRule,
  town: Joi.string().allow("").optional(),
  mode: Joi.string().valid("Offline", "Online", "Hybrid").required().messages({
    "any.only": "Mode must be Offline, Online, or Hybrid",
    "string.empty": "Mode is required",
  }),
  createdBranch: createdBranchRule,
  
  // Assets
  imageUrl: Joi.string().uri().allow("").optional().messages({
    "string.uri": "Must be a valid URL (e.g., https://...)",
  }),
  brochureUrl: Joi.string().uri().allow("").optional().messages({
    "string.uri": "Must be a valid URL (e.g., https://...)",
  }),
  
  // System Fields
  institution: Joi.string().optional(),
  courseType: Joi.string().optional(),
  branch: Joi.string().optional(),
  branchName: Joi.string().optional(),

  // UI-only placeholders (kept to prevent validation crashes)
  image: Joi.any().optional(),
  brochure: Joi.any().optional(),
  imagePreviewUrl: Joi.string().allow("").optional(),
  brochurePreviewUrl: Joi.string().allow("").optional(),
}).unknown(true);

export const CoachingCenterSchema = Joi.object({
  courseName: nameRule.required(),
  courseDuration: durationRule,
  startDate: Joi.string().required().messages({
    "string.empty": "Start date is required",
    "any.required": "Start date is required",
  }),
  priceOfCourse: Joi.number().required().messages({
    "number.base": "Price must be a number",
    "any.required": "Price is required",
  }),
  // ✅ Fixed Casing
  locationURL: urlRule.required().messages({
    "string.empty": "Location URL is required",
    "any.required": "Location URL is required",
  }),
  state: stateRule,
  district: districtRule,
  town: Joi.string().required().messages({
    "string.empty": "Town is required",
  }),
  mode: Joi.string().valid("Offline", "Online", "Hybrid").required().messages({
    "any.only": "Mode must be Offline, Online, or Hybrid",
    "string.empty": "Mode is required",
  }),
  createdBranch: createdBranchRule,
  categoriesType: categoriesTypeRule,
  domainType: domainTypeRule,
  subDomainType: subDomainTypeRule,
  courseHighlights: courseHighlightsRule,
  classSize: Joi.number()
    .min(0)
    .required()
    .messages({
      "number.base": "Class size must be a number",
      "number.min": "Class size cannot be negative",
      "any.required": "Class size is required",
    }),

  // ✅ Facility fields changed to strictly validate "Yes"/"No" strings
  placementDrives: Joi.string().valid("Yes", "No").required().messages({
    "any.only": "Please select Yes or No for Placement Drives",
    "string.empty": "Placement Drives selection is required",
  }),
  mockInterviews: Joi.string().valid("Yes", "No").required().messages({
    "any.only": "Please select Yes or No for Mock Interviews",
    "string.empty": "Mock Interviews selection is required",
  }),
  resumeBuilding: Joi.string().valid("Yes", "No").required().messages({
    "any.only": "Please select Yes or No for Resume Building",
    "string.empty": "Resume Building selection is required",
  }),
  linkedinOptimization: Joi.string().valid("Yes", "No").required().messages({
    "any.only": "Please select Yes or No for LinkedIn Optimization",
    "string.empty": "LinkedIn Optimization selection is required",
  }),
  libraryFacility: Joi.string().valid("Yes", "No").required().messages({
    "any.only": "Please select Yes or No for Library Facility",
    "string.empty": "Library Facility selection is required",
  }),
  studyMaterial: Joi.string().valid("Yes", "No").required().messages({
    "any.only": "Please select Yes or No for Study Material",
    "string.empty": "Study Material selection is required",
  }),
  mockTests: Joi.string().valid("Yes", "No").required().messages({
    "any.only": "Please select Yes or No for Mock Tests",
    "string.empty": "Mock Tests selection is required",
  }),
  certification: Joi.string().valid("Yes", "No").required().messages({
    "any.only": "Please select Yes or No for Certification",
    "string.empty": "Certification selection is required",
  }),
  installments: Joi.string().valid("Yes", "No").required().messages({
    "any.only": "Please select Yes or No for Installments",
    "string.empty": "Installments selection is required",
  }),
  emioptions: Joi.string().valid("Yes", "No").required().messages({
    "any.only": "Please select Yes or No for EMI Options",
    "string.empty": "EMI Options selection is required",
  }),

  highestPackage: Joi.string().required().messages({
    "string.empty": "Highest Package is required (e.g. 15 LPA)",
    "any.required": "Highest Package is required",
  }),
  averagePackage: Joi.string().required().messages({
    "string.empty": "Average Package is required (e.g. 8 LPA)",
    "any.required": "Average Package is required",
  }),
  totalNumberRequires: Joi.number().min(0).required().messages({
    "number.base": "Total number required must be a number",
    "any.required": "Total number required is required",
  }),
  totalStudentsPlaced: Joi.number().min(0).required().messages({
    "number.base": "Students placed must be a number",
    "any.required": "Students placed is required",
  }),
  
  classlanguage: Joi.string().required().messages({
    "string.empty": "Language of class is required",
    "any.required": "Language of class is required",
  }),
  courselanguage: Joi.string().required().messages({
    "string.empty": "Language of course is required",
    "any.required": "Language of course is required",
  }),
  // ✅ Fixed key to classTiming (singular) to match interface
  classTiming: Joi.string().required().messages({
    "string.empty": "Class timings are required (e.g. 9 AM - 5 PM)",
    "any.required": "Class timings are required",
  }),
  centerImageUrl: Joi.string().uri().allow("").optional(),
}).unknown(true);

export const StudyHallSchema = Joi.object({
  hallName: nameRule.required().messages({
    "any.required": "Hall name is required.",
  }),
  seatingOption: nameRule.required().messages({
    "string.empty": "Please select a seating option.",
    "any.required": "Please select a seating option.",
  }),
  openingTime: Joi.string()
    .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .required()
    .messages({
      "string.pattern.base": "Please enter a valid time (HH:MM).",
      "string.empty": "Opening Time is required.",
      "any.required": "Opening Time is required.",
    }),
  closingTime: Joi.string()
    .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .required()
    .messages({
      "string.pattern.base": "Please enter a valid time (HH:MM).",
      "string.empty": "Closing Time is required.",
      "any.required": "Closing Time is required.",
    }),
  operationalDays: Joi.array().items(Joi.string()).min(1).required().messages({
    "array.min": "At least one operational day must be selected.",
    "any.required": "At least one operational day must be selected.",
  }),
  totalSeats: Joi.number().min(0).required().messages({
    "number.base": "Value must be a number.",
    "number.min": "Total Seats cannot be negative.",
    "any.required": "Total Seats is required.",
  }),
  availableSeats: Joi.number()
    .integer()
    .min(0)
    .required()
    .max(Joi.ref("totalSeats"))
    .messages({
      "number.base": "Value must be a number.",
      "number.min": "Available Seats cannot be negative.",
      "any.required": "Available Seats is required.",
      "number.integer": "Available Seats must be a whole number.",
      "number.max": "Available seats cannot be greater than total seats.",
    }),
  pricePerSeat: Joi.number().min(0).required().messages({
    "number.base": "Value must be a number.",
    "number.min": "Price cannot be negative.",
    "any.required": "Price Per Seat is required.",
  }),
  state: stateRule,
  district: districtRule,
  town: Joi.string().required().messages({
    "string.empty": "Town is required.",
  }),
  locationURL: urlRule.required().messages({ // ✅ Key alignment
    "string.empty": "Location URL is required.",
    "string.uri": "Please enter a valid URL.",
  }),
  hasWifi: Joi.string().valid("Yes", "No").required().messages({
    "any.only": "Please select an option for Wi-Fi.",
  }),
  hasChargingPoints: Joi.string().valid("Yes", "No").required().messages({
    "any.only": "Please select an option for Charging Points.",
  }),
  hasAC: Joi.string().valid("Yes", "No").required().messages({
    "any.only": "Please select an option for Air Conditioner.",
  }),
  hasPersonalLocker: Joi.string().valid("Yes", "No").required().messages({
    "any.only": "Please select an option for Personal Lockers.",
  }),
  image: Joi.any().optional(),
  imageUrl: Joi.string().uri().allow("").optional(),
  createdBranch: createdBranchRule,
  startDate: Joi.string().required().messages({
    "string.empty": "Start date is required",
  }),
}).unknown(true);

// Sub-schema for individual academic rows
// Sub-schemas (Keep these as they are used inside TuitionCenterSchema)
const academicDetailSchema = Joi.object({
  subject: Joi.string().required().messages({ "string.empty": "Subject is required" }),
  classTiming: Joi.string().required().messages({ "string.empty": "Class timing is required" }),
  specialization: Joi.string().required().messages({ "string.empty": "Specialization is required" }),
  monthlyFees: Joi.number().min(0).required().messages({ "number.base": "Monthly fees must be a number" }),
});

const facultyDetailSchema = Joi.object({
  name: Joi.string().required().messages({ "string.empty": "Faculty name is required" }),
  qualification: Joi.string().required().messages({ "string.empty": "Qualification is required" }),
  experience: Joi.string().allow("", null),
  subjectTeach: Joi.string().required().messages({ "string.empty": "Subject taught is required" }),
});

export const TuitionCenterSchema = Joi.object({
  courseName: Joi.string().required().messages({
    "string.empty": "Tuition centre name is required.",
    "any.required": "Tuition centre name is required.",
  }),
  mode: Joi.string()
    .valid("Offline", "Online", "Hybrid")
    .required()
    .messages({
      "string.empty": "Mode is required.",
      "any.only": "Please select a valid Mode.",
      "any.required": "Mode is required.",
    }),
  subject: Joi.string()
    .pattern(/^[A-Za-z\s,]+$/)
    .required()
    .messages({
      "string.empty": "Subject is required.",
      "string.pattern.base": "Subject can only contain letters, spaces, and commas.",
      "any.required": "Subject is required.",
    }),
  classSize: Joi.number().min(1).required().messages({
    "number.base": "Class size must be a number.",
    "number.min": "Class size must be at least 1.",
    "any.required": "Class size is required.",
  }),
  state: stateRule.required(),
  district: districtRule.required(),
  town: Joi.string().required().messages({
    "string.empty": "Town is required.",
    "any.required": "Town is required.",
  }),
  locationURL: Joi.string().uri().required().messages({ // ✅ Fixed casing to match Interface
    "string.empty": "Location URL is required.",
    "string.uri": "Please enter a valid URL.",
    "any.required": "Location URL is required.",
  }),
  createdBranch: createdBranchRule.required(),
  operationalDays: Joi.array().items(Joi.string()).min(1).required().messages({
    "array.min": "At least one operational day must be selected.",
    "any.required": "At least one operational day must be selected.",
  }),
  openingTime: Joi.string()
    .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .required()
    .messages({
      "string.pattern.base": "Please enter a valid time (HH:MM).",
      "string.empty": "Opening Time is required.",
      "any.required": "Opening Time is required.",
    }),
  closingTime: Joi.string()
    .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .required()
    .messages({
      "string.pattern.base": "Please enter a valid time (HH:MM).",
      "string.empty": "Closing Time is required.",
      "any.required": "Closing Time is required.",
    }),
  partlyPayment: Joi.string().valid("Yes", "No").required().messages({
    "any.only": "Please select Yes or No for partly payment.",
    "any.required": "Partly payment selection is required.",
  }),
  academicDetails: Joi.array()
    .items(academicDetailSchema)
    .min(1)
    .required()
    .messages({
      "array.min": "Please add at least one subject in academic details.",
      "any.required": "Academic details are required.",
    }),
  facultyDetails: Joi.array()
    .items(facultyDetailSchema)
    .min(1)
    .required()
    .messages({
      "array.min": "Please add at least one faculty member.",
      "any.required": "Faculty details are required.",
    }),
  tuitionImageUrl: Joi.string().uri().allow("").optional(),
}).unknown(true);

export const KindergartenSchema = Joi.object({
  courseName: nameRule.required().messages({
    "string.empty": "Course name is required",
    "any.required": "Course name is required",
  }),
  aboutCourse: Joi.string().min(10).max(500).required().messages({
    "string.empty": "About Course is required",
    "string.min": "About Course must be at least 10 characters",
    "string.max": "About Course must be at most 500 characters",
  }),
  courseDuration: durationRule.required().messages({
    "string.empty": "Course duration is required",
  }),
  priceOfCourse: Joi.number().greater(0).required().messages({
    "number.base": "Price must be a number",
    "number.greater": "Price must be greater than 0",
    "any.required": "Price is required",
  }),
  mode: Joi.string().valid("Offline", "Online", "Hybrid").required().messages({
    "any.only": "Mode must be Offline, Online, or Hybrid",
    "string.empty": "Mode is required",
  }),
  state: stateRule,
  district: districtRule,
  town: Joi.string().required().messages({
    "string.empty": "Town is required.",
  }),
  // ✅ Key alignment: locationURL
  locationURL: Joi.string().uri().required().messages({
    "string.empty": "Location URL is required.",
    "string.uri": "Please enter a valid URL.",
  }),
  createdBranch: createdBranchRule,
  graduationType: Joi.string().valid("Kindergarten").required().messages({
    "any.only": "Invalid Course type",
    "string.empty": "Course type is required",
  }),
  categoriesType: Joi.string().valid("Nursery", "LKG", "UKG", "Playgroup").required().messages({
    "any.only": "Please select a valid category (Nursery/LKG/UKG/Playgroup)",
    "string.empty": "Category type is required",
  }),
  classSize: Joi.number().required().messages({
    "number.base": "Class size must be a number",
    "any.required": "Class size is required",
  }),
  classSizeRatio: Joi.string().required().messages({
    "string.empty": "Teacher:Student ratio is required",
  }),
  curriculumType: Joi.string().required().messages({
    "string.empty": "Curriculum type is required",
  }),
  ownershipType: Joi.string().required().messages({
    "string.empty": "Ownership type is required",
  }),
  operationalDays: Joi.array().items(Joi.string()).min(1).required().messages({
    "array.min": "Please select at least one operational day",
    "any.required": "Operational days are required",
  }),
  openingTime: Joi.string().required().messages({
    "string.empty": "Opening time is required",
  }),
  closingTime: Joi.string().required().messages({
    "string.empty": "Closing time is required",
  }),

  // ✅ Facilities as strings
  playground: Joi.string().valid("Yes", "No").required().messages({
    "any.only": "Please select Yes or No for Playground",
  }),
  busService: Joi.string().valid("Yes", "No").required().messages({
    "any.only": "Please select Yes or No for Pickup/Drop services",
  }),
  extendedCare: Joi.string().valid("Yes", "No").required().messages({
    "any.only": "Please select Yes or No for Extended Care",
  }),
  mealsProvided: Joi.string().valid("Yes", "No").required().messages({
    "any.only": "Please select Yes or No for Meals Provided",
  }),
  installments: Joi.string().valid("Yes", "No").required().messages({
    "any.only": "Please select Yes or No for Installments",
  }),
  emioptions: Joi.string().valid("Yes", "No").required().messages({
    "any.only": "Please select Yes or No for EMI Options",
  }),

  // ✅ specialized asset keys
  kindergartenImageUrl: Joi.string().uri().allow("").optional(),
  imageUrl: Joi.string().uri().allow("").optional(),
  brochureUrl: Joi.string().uri().allow("").optional(),
}).unknown(true);

export const SchoolSchema = Joi.object({
  courseName: nameRule.required().messages({
    "string.empty": "School Name is required",
  }),
  mode: Joi.string().valid("Offline", "Online", "Hybrid").required().messages({
    "string.empty": "Mode is required",
  }),
  courseDuration: Joi.string().required().messages({
    "string.empty": "Course duration is required",
  }),
  startDate: Joi.string().required().messages({
    "string.empty": "Starting date is required",
  }),
  classlanguage: Joi.string().required().messages({
    "string.empty": "Language of class is required",
  }),
  ownershipType: Joi.string().valid("Private", "Government", "Trust").required().messages({
    "string.empty": "Ownership Type is required",
  }),
  schoolType: Joi.string().valid("Co-Education", "Boys Only", "Girls Only").required().messages({
    "string.empty": "School type is required",
  }),
  curriculumType: Joi.string().valid("State board", "CBSE", "ICSE", "IB", "IGCSE").required().messages({
    "string.empty": "Curriculum type is required",
  }),
  classType: Joi.string().required().messages({ 
    "string.empty": "Class type is required" 
  }),
  priceOfCourse: Joi.number().required().messages({
    "number.base": "Price must be a number",
  }),
  state: stateRule.required(),
  district: districtRule.required(),
  town: Joi.string().required().messages({
    "string.empty": "Town is required",
  }),
  // ✅ Key alignment: locationURL
  locationURL: Joi.string().uri().required().messages({
    "string.empty": "Location URL is required",
    "string.uri": "Invalid URL format",
  }),
  operationalDays: Joi.array().items(Joi.string()).min(1).required().messages({
    "array.min": "Please select at least one operational day",
    "any.required": "Operational days are required",
  }),
  playground: Joi.string().valid("Yes", "No").required().messages({
    "any.only": "Please select Yes or No for Playground",
  }),
  busService: Joi.string().valid("Yes", "No").required().messages({
    "any.only": "Please select Yes or No for Bus Service",
  }),
  hostelFacility: Joi.string().valid("Yes", "No").required().messages({
    "any.only": "Please select Yes or No for Hostel Facility",
  }),
  emioptions: Joi.string().valid("Yes", "No").required().messages({
    "any.only": "Please select Yes or No for EMI Options",
  }),
  partlyPayment: Joi.string().valid("Yes", "No").required().messages({
    "any.only": "Please select Yes or No for Partial Payment",
  }),
  // ✅ specialized asset keys
  schoolImageUrl: Joi.string().uri().allow("").optional(),
  imageUrl: Joi.string().uri().allow("").optional(),
  brochureUrl: Joi.string().uri().allow("").optional(),
  createdBranch: createdBranchRule.required(),
}).unknown(true);

export const CollegeSchema = Joi.object({
  courseName: nameRule.required().messages({
    "string.empty": "Intermediate Name is required",
    "any.required": "Intermediate Name is required",
  }),
  collegeType: Joi.string().required().messages({
    "string.empty": "Intermediate Type is required",
    "any.required": "Intermediate Type is required",
  }),
  curriculumType: Joi.string().required().messages({
    "string.empty": "Curriculum type is required",
    "any.required": "Curriculum type is required",
  }),
  mode: Joi.string().valid("Offline", "Online", "Hybrid").required().messages({
    "any.only": "Please select a valid mode (Offline, Online, or Hybrid)",
    "string.empty": "Mode is required",
  }),
  courseDuration: Joi.string().required().messages({
    "string.empty": "Course duration is required",
  }),
  startDate: Joi.string().required().messages({
    "string.empty": "Starting date is required",
  }),
  classlanguage: Joi.string().required().messages({
    "string.empty": "Language of class is required",
  }),
  ownershipType: Joi.string().required().messages({
    "string.empty": "Ownership type is required",
  }),
  operationalDays: Joi.array().items(Joi.string()).min(1).required().messages({
    "array.min": "Please select at least one operational day",
    "any.required": "Operational days are required",
  }),
  state: stateRule.required(),
  district: districtRule.required(),
  town: Joi.string().required().messages({
    "string.empty": "Town is required",
  }),
  // ✅ Fixed Key
  locationURL: Joi.string().uri().required().messages({
    "string.empty": "Location URL is required",
    "string.uri": "Invalid URL format",
  }),
  year: Joi.string().required().messages({
    "string.empty": "Please select the year",
  }),
  classType: Joi.string().required().messages({
    "string.empty": "Class type is required",
  }),
  specialization: Joi.string().required().messages({
    "string.empty": "Specialization is required",
  }),
  priceOfCourse: Joi.number().required().messages({
    "number.base": "Fees must be a number",
    "any.required": "Fees are required",
  }),
  playground: Joi.string().valid("Yes", "No").required().messages({
    "any.only": "Please select Yes or No for Playground",
  }),
  busService: Joi.string().valid("Yes", "No").required().messages({
    "any.only": "Please select Yes or No for Bus Service",
  }),
  hostelFacility: Joi.string().valid("Yes", "No").required().messages({
    "any.only": "Please select Yes or No for Hostel Facility",
  }),
  emioptions: Joi.string().valid("Yes", "No").required().messages({
    "any.only": "Please select Yes or No for EMI Options",
  }),
  partlyPayment: Joi.string().valid("Yes", "No").required().messages({
    "any.only": "Please select Yes or No for Partial Payment",
  }),
  // ✅ Asset Keys
  intermediateImageUrl: Joi.string().uri().allow("").optional(),
  imageUrl: Joi.string().uri().allow("").optional(),
  brochureUrl: Joi.string().uri().allow("").optional(),
  createdBranch: createdBranchRule.required(),
}).unknown(true);

export const UGPGSchema = Joi.object({
  graduationType: graduationTypeRule,
  streamType: streamTypeRule,
  selectBranch: selectBranchRule,
  aboutBranch: Joi.string().min(10).max(500).required().messages({
    "string.empty": "About branch is required.",
    "string.min": "About branch must be at least 10 characters.",
    "string.max": "About branch cannot exceed 500 characters.",
  }),
  educationType: Joi.string().valid("Full time", "part time", "Distance").required().messages({
    "string.empty": "Please select an education type.",
  }),
  mode: Joi.string().valid("Offline", "Online", "Hybrid").required().messages({
    "string.empty": "Please select a mode.",
  }),
  courseDuration: durationRule,
  priceOfCourse: Joi.number().required().messages({
    "number.base": "Price must be a number.",
    "any.required": "Course price is required.",
  }),
  classSize: Joi.number().required().messages({
    "number.base": "Class size must be a number.",
    "any.required": "Class size is required.",
  }),
  eligibilityCriteria: nameRule.required().messages({
    "string.empty": "Eligibility criteria is required.",
  }),
  state: stateRule,
  district: districtRule,
  town: Joi.string().required().messages({
    "string.empty": "Town is required.",
  }),
  // ✅ Fixed Casing
  locationURL: Joi.string().uri().required().messages({
    "string.empty": "Location URL is required.",
    "string.uri": "Please enter a valid URL.",
  }),
  createdBranch: createdBranchRule,

  // --- MERGED L3 UG/PG FIELDS ---
  ownershipType: Joi.string().valid("Government", "Private", "Semi-Government", "Aided", "Unaided").required().messages({
    "any.only": "Invalid Ownership Type.",
    "string.empty": "Ownership Type is required",
  }),
  collegeCategory: Joi.string().required().messages({
    "string.empty": "College Category is required",
  }),
  affiliationType: Joi.string().valid("University", "Autonomous", "Affiliated", "Deemed University", "Other").required().messages({
    "any.only": "Invalid Affiliation Type.",
    "string.empty": "Affiliation Type is required.",
  }),

  // PLACEMENT FIELDS
  totalStudentsPlaced: Joi.number().min(0).required().messages({
    "number.base": "Total students placed must be a number.",
    "any.required": "Total students placed is required.",
  }),
  totalNumberRequires: Joi.number().min(0).required().messages({
    "number.base": "Total number required must be a number",
    "any.required": "Total number required is required",
  }),
  highestPackage: Joi.string().required().messages({
    "string.empty": "Highest package info is required (e.g. 15 LPA).",
  }),
  averagePackage: Joi.string().required().messages({
    "string.empty": "Average package info is required (e.g. 6 LPA).",
  }),

  // ✅ FACILITY RADIOS (Strictly validated as Strings)
  placementDrives: Joi.string().valid("Yes", "No").required().messages({
    "any.only": "Please select Yes or No for Placement Drives",
  }),
  mockInterviews: Joi.string().valid("Yes", "No").required().messages({
    "any.only": "Please select Yes or No for Mock Interviews",
  }),
  resumeBuilding: Joi.string().valid("Yes", "No").required().messages({
    "any.only": "Please select Yes or No for Resume Building",
  }),
  linkedinOptimization: Joi.string().valid("Yes", "No").required().messages({
    "any.only": "Please select Yes or No for LinkedIn Optimization",
  }),
  exclusiveJobPortal: Joi.string().valid("Yes", "No").required().messages({
    "any.only": "Please select Yes or No for Exclusive Job Portal",
  }),
  library: Joi.string().valid("Yes", "No").required().messages({
    "any.only": "Please select Yes or No for Library",
  }),
  hostelFacility: Joi.string().valid("Yes", "No").required().messages({
    "any.only": "Please select Yes or No for Hostel Facility",
  }),
  entranceExam: Joi.string().valid("Yes", "No").required().messages({
    "any.only": "Please select Yes or No for Entrance Exam",
  }),
  managementQuota: Joi.string().valid("Yes", "No").required().messages({
    "any.only": "Please select Yes or No for Management Quota",
  }),
  playground: Joi.string().valid("Yes", "No").required().messages({
    "any.only": "Please select Yes or No for Playground",
  }),
  busService: Joi.string().valid("Yes", "No").required().messages({
    "any.only": "Please select Yes or No for Bus Service",
  }),

  // PAYMENT FIELDS
  installments: Joi.string().valid("Yes", "No").required().messages({
    "any.only": "Please select Yes or No for Installments",
  }),
  emioptions: Joi.string().valid("Yes", "No").required().messages({
    "any.only": "Please select Yes or No for EMI Options",
  }),

  // ASSETS
  collegeImageUrl: Joi.string().uri().allow("").optional(),
  imageUrl: Joi.string().uri().allow("").optional(),
  brochureUrl: Joi.string().uri().allow("").optional(),
}).unknown(true);

export const StudyAbroadSchema = Joi.object({
  consultancyName: nameRule.required().messages({
    "string.empty": "Consultancy name is required",
  }),
  studentAdmissions: Joi.number().min(0).required().messages({
    "number.base": "Student admissions must be a number",
    "number.min": "Student admissions cannot be negative",
  }),
  countriesOffered: Joi.string().required().invalid("Select Country").messages({
    "any.invalid": "Please select a valid country",
  }),
  academicOfferings: Joi.string().required().invalid("Select Academic type").messages({
    "any.invalid": "Please select a valid academic type",
  }),
  state: Joi.string().required().messages({
    "string.empty": "State is required",
  }),
  district: Joi.string().required().messages({
    "string.empty": "District is required",
  }),
  town: Joi.string().required().messages({
    "string.empty": "Town is required",
  }),
  // ✅ Fixed Casing
  locationURL: Joi.string().uri().required().messages({
    "string.empty": "Location URL is required",
    "string.uri": "Must be a valid URL",
  }),
  aboutBranch: Joi.string().required().messages({
    "string.empty": "Headquarters address is required",
  }),
  budget: Joi.string().required().messages({
    "string.empty": "Budget is required",
  }),
  studentsSent: Joi.number().min(0).required().messages({
    "number.base": "Students sent must be a number",
    "any.required": "Students sent count is required",
  }),

  // ASSETS (Urls from S3)
  imageUrl: Joi.string().uri().allow("").optional(),
  brochureUrl: Joi.string().uri().allow("").optional(),
  businessProofUrl: Joi.string().uri().allow("").optional(),
  panAadhaarUrl: Joi.string().uri().allow("").optional(),
  consultancyImageUrl: Joi.string().uri().allow("").optional(),

  createdBranch: createdBranchRule,

  // ✅ Radios as Strings
  applicationAssistance: Joi.string().valid("Yes", "No").required().messages({
    "any.only": "Please select Yes or No for Application Assistance",
  }),
  visaProcessingSupport: Joi.string().valid("Yes", "No").required().messages({
    "any.only": "Please select Yes or No for Visa Processing Support",
  }),
  testOperation: Joi.string().valid("Yes", "No").required().messages({
    "any.only": "Please select Yes or No for Test Operation",
  }),
  preDepartureOrientation: Joi.string().valid("Yes", "No").required().messages({
    "any.only": "Please select Yes or No for Pre-departure orientation",
  }),
  accommodationAssistance: Joi.string().valid("Yes", "No").required().messages({
    "any.only": "Please select Yes or No for Accommodation assistance",
  }),
  educationLoans: Joi.string().valid("Yes", "No").required().messages({
    "any.only": "Please select Yes or No for Education loans",
  }),
  postArrivalSupport: Joi.string().valid("Yes", "No").required().messages({
    "any.only": "Please select Yes or No for Post-arrival support",
  }),
  partTimeHelp: Joi.string().valid("Yes", "No").required().messages({
    "any.only": "Please select Yes or No for Part-time opportunities",
    "string.empty": "Part-time help selection is required",
  }),
}).unknown(true);

export const branchSchema = Joi.object({
  branchName: Joi.string()
    .min(3)
    .max(100)
    .pattern(/^[A-Za-z][A-Za-z0-9\s.&'-]*$/)
    .required()
    .messages({
      "string.empty": "Branch Name is required",
      "string.min": "Branch Name must be at least 3 characters",
      "string.max": "Branch Name must be at most 100 characters",
      "string.pattern.base": "Branch Name must start with a letter and may include numbers, spaces, and . & ' -",
    }),
  contactInfo: phoneRule.messages({
    "string.empty": "Contact info is required.",
    "string.pattern.base": "Please enter a valid 10-digit mobile number.",
  }),
  branchAddress: Joi.string().min(5).required().messages({
    "string.empty": "Branch Address is required",
    "string.min": "Branch Address must be at least 5 characters",
  }),
  locationUrl: Joi.string().uri().required().messages({
    "string.empty": "Location URL is required",
    "string.uri": "Must be a valid URL (e.g., https://...)",
  }),
});

export const L2Schemas: Record<string, Joi.ObjectSchema> = {
  basic: baseCourseSchema,
  coaching: CoachingCenterSchema,
  studyHall: StudyHallSchema,
  tuition: TuitionCenterSchema,
  ugpg: UGPGSchema,
  studyAbroad: StudyAbroadSchema,
  kindergarten: KindergartenSchema,
  school : SchoolSchema,
  college : CollegeSchema,
  branch: branchSchema,
}; 