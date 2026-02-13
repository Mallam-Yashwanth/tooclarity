const {
  body,
  param,
  query,
  validationResult,
  matchedData,
} = require("express-validator");
const { Institution } = require("../models/Institution");
const logger = require("../config/logger");

// --- UTILITY FUNCTION ---
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  next();
};

// --- AUTH VALIDATORS ---
const strongPasswordOptions = {
  minLength: 8,
  minLowercase: 1,
  minUppercase: 1,
  minNumbers: 1,
  minSymbols: 1,
};

exports.validateRegistration = [
  // Email → only required for institution
  body("email")
    .if((value, { req }) => req.body.type === "institution")
    .notEmpty()
    .withMessage("Email is required for institutions.")
    .bail()
    .isEmail()
    .withMessage("A valid email is required.")
    .normalizeEmail(),

  // Name → only required for institution
  body("name")
    .if((value, { req }) => req.body.type === "institution")
    .notEmpty()
    .withMessage("Name is required for institutions.")
    .trim()
    .escape(),

  // Password → required for both student & institution
  body("password")
    .if(
      (value, { req }) =>req.body.type === "institution"
    )
    .isStrongPassword(strongPasswordOptions)
    .withMessage(
      "Password must be at least 8 characters long and contain an uppercase letter, a lowercase letter, a number, and a symbol."
    ),

  // ✅ Contact Number → required for both student & institution
  body("contactNumber")
    .if(
      (value, { req }) =>
        req.body.type === "student" || req.body.type === "institution"
    )
    .matches(/^[0-9]{10}$/)
    .withMessage("A valid 10-digit contact number is required."),

  // ✅ Designation → required only for institution
  body("designation")
    .if((value, { req }) => req.body.type === "institution")
    .notEmpty()
    .withMessage("Designation is required for institutions.")
    .trim()
    .escape(),

  // ✅ LinkedIn URL → required only for institution
  body("linkedin")
    .if((value, { req }) => req.body.type === "institution")
    .notEmpty()
    .withMessage("LinkedIn URL is required for institutions.")
    .bail()
    .isURL()
    .withMessage("Invalid LinkedIn URL.")
    .trim(),

  handleValidationErrors,
];

const passwordRule = body("password")
  .if(body("type").equals("institution"))
  .notEmpty()
  .withMessage("Password is required for institutions.");

exports.validateLogin = [
  // ✅ Email → required only for institutions
  body("email")
    .if((value, { req }) => req.body.type === "institution")
    .notEmpty()
    .withMessage("Email is required for institutions.")
    .bail()
    .isEmail()
    .withMessage("A valid email is required.")
    .normalizeEmail(),

  // ✅ Contact Number → required only for students
  body("contactNumber")
    .if((value, { req }) => req.body.type === "student")
    .notEmpty()
    .withMessage("Contact number is required for students.")
    .bail()
    .matches(/^[0-9]{10}$/)
    .withMessage("A valid 10-digit contact number is required."),

  // ✅ Password → required for both
  passwordRule,

  handleValidationErrors,
];

// --- L1 INSTITUTION VALIDATOR ---
exports.validateL1Creation = [
  body("instituteName")
    .notEmpty()
    .withMessage("Institution name is required")
    .trim()
    .isLength({ max: 150 })
    .escape(),
  body("instituteType")
    .isIn([
      "Kindergarten/childcare center",
      "School's",
      "Intermediate college(K12)",
      "Under Graduation/Post Graduation",
      "Coaching centers",
      "Tuition Center's", // Corrected spelling
      "Study Halls",
      "Study Abroad",
    ])
    .withMessage("A valid institute type is required."),
  // body('establishmentDate').optional({ checkFalsy: true }).isISO8601().toDate().withMessage('Establishment date must be a valid date.'),
  body("approvedBy")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 100 })
    .escape(),
  handleValidationErrors,
];

// ✅ --- L2 BASE COURSE VALIDATOR ---
// These rules now correctly match your frontend baseCourseSchema
const l2BaseCourseRules = [
  body("courseName").trim().notEmpty().withMessage("Course name is required."),

  body("aboutCourse")
    .trim()
    .notEmpty()
    .withMessage("About course is required."),

  body("courseDuration")
    .trim()
    .notEmpty()
    .withMessage("Course duration is required."),

  body("startDate")
    .notEmpty()
    .withMessage("Course start date is required.")
    .isISO8601()
    .withMessage("Must be a valid date."),

  // ✅ ADDED: Missing endDate validation
  body("endDate")
    .notEmpty()
    .withMessage("Course end date is required.")
    .isISO8601()
    .withMessage("Must be a valid date."),

  body("mode")
    .isIn(["Offline", "Online", "Hybrid"])
    .withMessage("A valid mode is required."),

  body("priceOfCourse")
    .trim()
    .notEmpty()
    .withMessage("Price is required.")
    .withMessage("Price must be a number."),

  body("locationURL")
    .trim()
    .notEmpty()
    .withMessage("Location URL is required.")
    .matches(/^https?:\/\/.+/)
    .withMessage("Location URL must start with http:// or https://"),

  body("state").notEmpty().withMessage("State is required"),
  body("district").notEmpty().withMessage("District is required"),
  body("town").notEmpty().withMessage("Town is required"),

  body("createdBranch").optional({ checkFalsy: true }).trim(),

  // Integrated Amenities
  body("playground").optional().isIn(["Yes", "No"]).withMessage("A selection for Playground is required."),
  body("busService").optional().isIn(["Yes", "No"]).withMessage("A selection for Bus Service is required."),
  body("hostelFacility").optional().isIn(["Yes", "No"]).withMessage("A selection for Hostel Facility is required."),
  body("emioptions").optional().isIn(["Yes", "No"]).withMessage("A selection for EMI Options is required."),
  body("partlyPayment").optional().isIn(["Yes", "No"]).withMessage("A selection for Partly Payment is required."),
];

// --- UPDATED SCHOOL RULES ---
const l2SchoolRules = [
  body("courseName").trim().notEmpty().withMessage("School Name is required."),
  body("mode").isIn(["Offline", "Online", "Hybrid"]).withMessage("Invalid mode specified."),
  body("courseDuration").trim().notEmpty().withMessage("Course duration is required."),
  body("startDate").notEmpty().withMessage("Course start date is required.").isISO8601().withMessage("Must be a valid date."),
  body("classlanguage").optional().trim(),
  body("ownershipType").isIn(["Private", "Government", "Trust"]).withMessage("Invalid ownership type."),
  body("schoolType").isIn(["Co-Education", "Boys Only", "Girls Only"]).withMessage("Invalid school type selected."),
  body("curriculumType").isIn(["State board", "CBSE", "ICSE", "IB", "IGCSE"]).withMessage("Invalid curriculum type selected."),
  body("openingTime").notEmpty().withMessage("Opening time is required."),
  body("closingTime").notEmpty().withMessage("Closing time is required."),
  body("locationURL").trim().notEmpty().withMessage("Location URL is required."),
  body("aboutBranch").trim().notEmpty().withMessage("Campus address is required."),
  body("state").notEmpty().withMessage("State is required"),
  body("district").notEmpty().withMessage("District is required"),
  body("town").notEmpty().withMessage("Town is required"),
  body("classType").notEmpty().withMessage("Class Type is required."),
  body("priceOfCourse").notEmpty().withMessage("Price is required."),
  body("playground").isIn(["Yes", "No"]).withMessage("A selection for Playground is required."),
  body("busService").isIn(["Yes", "No"]).withMessage("A selection for Bus Service is required."),
  body("hostelFacility").isIn(["Yes", "No"]).withMessage("A selection for Hostel Facility is required."),
  body("emioptions").isIn(["Yes", "No"]).withMessage("A selection for EMI Options is required."),
  body("partlyPayment").isIn(["Yes", "No"]).withMessage("A selection for Partly Payment is required."),
  // --- File Validations ---
  body("schoolImageUrl").trim().isURL().withMessage("School photos are required."),
  body("imageUrl").trim().isURL().withMessage("Course image is required."),
  body("brochureUrl").trim().isURL().withMessage("Brochure URL is required.")
];

// --- UPDATED INTERMEDIATE COLLEGE RULES ---
const l2IntermediateCollegeRules = [
  body("courseName").trim().notEmpty().withMessage("Intermediate Name is required."),
  body("mode").isIn(["Offline", "Online", "Hybrid"]).withMessage("Invalid mode specified."),
  body("courseDuration").trim().notEmpty().withMessage("Course duration is required."),
  body("startDate").notEmpty().withMessage("Course start date is required.").isISO8601().withMessage("Must be a valid date."),
  body("classlanguage").notEmpty().withMessage("Language of class is required."),
  body("ownershipType").isIn(["Government", "Private", "Semi-Government", "Aided", "Unaided"]).withMessage("Invalid ownership type."),
  body("collegeType").isIn(["Junior College", "Senior Secondary", "Higher Secondary", "Intermediate", "Pre-University"]).withMessage("Invalid college type selected."),
  body("curriculumType").isIn(["State board", "CBSE", "ICSE", "IB", "Cambridge", "Other"]).withMessage("Invalid curriculum type selected."),
  body("openingTime").notEmpty().withMessage("Opening time is required."),
  body("closingTime").notEmpty().withMessage("Closing time is required."),
  body("locationURL").trim().notEmpty().withMessage("Location URL is required."),
  body("aboutBranch").trim().notEmpty().withMessage("Campus address is required."),
  body("state").notEmpty().withMessage("State is required"),
  body("district").notEmpty().withMessage("District is required"),
  body("town").notEmpty().withMessage("Town is required"),
  body("year").isIn(["1st Year", "2nd Year"]).withMessage("Please select the year."),
  body("classType").isIn(["Regular", "Vocational", "Honours", "Other"]).withMessage("Select class type."),
  body("specialization").isIn(["MPC", "BiPC", "CEC", "HEC", "MEC"]).withMessage("Select a valid specialization."),
  body("priceOfCourse").notEmpty().withMessage("Price is required."),
  body("playground").isIn(["Yes", "No"]).withMessage("A selection for Playground is required."),
  body("busService").isIn(["Yes", "No"]).withMessage("A selection for Bus Service is required."),
  body("hostelFacility").isIn(["Yes", "No"]).withMessage("A selection for Hostel Facility is required."),
  body("emioptions").isIn(["Yes", "No"]).withMessage("A selection for EMI Options is required."),
  body("partlyPayment").isIn(["Yes", "No"]).withMessage("A selection for Partly Payment is required."),
  // --- File Validations ---
  body("intermediateImageUrl").trim().isURL().withMessage("Campus photos are required."),
  body("imageUrl").trim().isURL().withMessage("Course image is required."),
  body("brochureUrl").trim().isURL().withMessage("Brochure URL is required.")
];

const l2KindergartenRules = [
  body("courseType").equals("Kindergarten").withMessage("A valid Course type is required."),
  body("courseName").trim().notEmpty().withMessage("Course name is required."),
  body("categoriesType").isIn(["Nursery", "LKG", "UKG", "Playgroup"]).withMessage("Select Category Type"),
  body("aboutCourse").trim().notEmpty().withMessage("About course is required."),
  body("courseDuration").trim().notEmpty().withMessage("Course duration is required."),
  body("mode").isIn(["Offline", "Online", "Hybrid"]).withMessage("Invalid mode specified."),
  body("priceOfCourse").notEmpty().withMessage("Price is required."),
  body("locationURL").trim().notEmpty().withMessage("Location URL is required."),
  body("aboutBranch").trim().notEmpty().withMessage("Campus address is required."),
  body("state").notEmpty().withMessage("State is required"),
  body("district").notEmpty().withMessage("District is required"),
  body("town").notEmpty().withMessage("Town is required"),
  body("curriculumType").trim().notEmpty().withMessage("Curriculum type is required."),
  body("classSizeRatio").notEmpty().withMessage("Teacher: Student Ratio is required"),
  body("ownershipType").isIn(["Private", "Government", "Trust", "Other"]).withMessage("Invalid school type selected."),
  body("extendedCare").isIn(["Yes", "No"]).withMessage("A selection for Extended Care is required."),
  body("mealsProvided").isIn(["Yes", "No"]).withMessage("A selection for Meals Provided is required."),
  body("playground").isIn(["Yes", "No"]).withMessage("A selection for Playground is required."),
  body("busService").isIn(["Yes", "No"]).withMessage("A selection for Bus Service is required."),
  body("installments").isIn(["Yes", "No"]).withMessage("A selection for Installments is required."),
  body("emioptions").isIn(["Yes", "No"]).withMessage("A selection for EMI Options is required."),
  // --- File Validations ---
  body("kindergartenImageUrl").trim().isURL().withMessage("Center image is required."),
  body("imageUrl").trim().isURL().withMessage("Course image is required."),
  body("brochureUrl").trim().isURL().withMessage("Brochure PDF is required.")
];
// --- UPDATED UG/PG RULES ---
// Pulls from UnderPostGraduateForm.tsx & your old l2UgPgCourseRules
const l2UgPgCourseRules = [
  body("graduationType").isIn(["Under Graduation", "Post Graduation"]).withMessage("Graduation type is required."),
  body("streamType").notEmpty().withMessage("Stream type is required."),
  body("selectBranch").notEmpty().withMessage("A branch must be selected."),
  body("branchDescription").notEmpty().withMessage("Branch description is required."),
  body("locationURL").trim().notEmpty().withMessage("Location URL is required."),
  body("aboutBranch").trim().notEmpty().withMessage("Campus address is required."),
  body("state").notEmpty().withMessage("State is required"),
  body("district").notEmpty().withMessage("District is required"),
  body("town").notEmpty().withMessage("Town is required"),
  body("educationType").isIn(["Full time", "part time", "Distance"]).withMessage("A valid education type is required."),
  body("mode").isIn(["Offline", "Online", "Hybrid"]).withMessage("Invalid mode specified."),
  body("classSize").notEmpty().withMessage("Class size is required.").isNumeric().withMessage("Must be a number."),
  body("eligibilityCriteria").trim().notEmpty().withMessage("Eligibility criteria is required."),
  body("ownershipType").isIn(["Government", "Private", "Semi-Government", "Aided", "Unaided"]).withMessage("Invalid ownership type."),
  body("collegeCategory").isIn(["Engineering", "Medical", "Arts & Science", "Commerce", "Management", "Law", "Other"]).withMessage("Invalid category."),
  body("affiliationType").isIn(["University", "Autonomous", "Affiliated", "Deemed University", "Other"]).withMessage("Select affiliation."),
  body("courseDuration").trim().notEmpty().withMessage("Course duration is required."),
  body("library").isIn(["Yes", "No"]).withMessage("A selection for Library is required."),
  body("hostelFacility").isIn(["Yes", "No"]).withMessage("A selection for Hostel Facility is required."),
  body("entranceExam").isIn(["Yes", "No"]).withMessage("A selection for Entrance Exam is required."),
  body("managementQuota").isIn(["Yes", "No"]).withMessage("A selection for Management Quota is required."),
  body("playground").isIn(["Yes", "No"]).withMessage("A selection for Playground is required."),
  body("busService").isIn(["Yes", "No"]).withMessage("A selection for Bus Service is required."),
  body("placementDrives").isIn(["Yes", "No"]).withMessage("A selection for Placement Drives is required."),
  body("totalNumberRequires").notEmpty().withMessage("This field is required."),
  body("mockInterviews").isIn(["Yes", "No"]).withMessage("A selection for Mock Interviews is required."),
  body("resumeBuilding").isIn(["Yes", "No"]).withMessage("A selection for Resume Building is required."),
  body("linkedinOptimization").isIn(["Yes", "No"]).withMessage("A selection for LinkedIn Optimization is required."),
  body("priceOfCourse").notEmpty().withMessage("Price is required."),
  body("installments").isIn(["Yes", "No"]).withMessage("A selection for Installments is required."),
  body("emioptions").isIn(["Yes", "No"]).withMessage("A selection for EMI Options is required."),
  // --- File Validations ---
  body("collegeImageUrl").trim().isURL().withMessage("College image is required."),
  body("imageUrl").trim().isURL().withMessage("Course image is required."),
  body("brochureUrl").trim().isURL().withMessage("Brochure URL is required.")
];

// --- UPDATED COACHING RULES ---
// Pulls from CoachingCourseForm.tsx & your old l2CoachingCourseRules
const l2CoachingCourseRules = [
  body("categoriesType").isIn(["Exam Preparation", "Upskilling"]).withMessage("Please select a valid categories type."),
  body("domainType").notEmpty().withMessage("Domain is required."),
  body("subDomainType").notEmpty().withMessage("Sub-domain is required."),
  body("courseName").trim().notEmpty().withMessage("Course name is required."),
  body("mode").isIn(["Offline", "Online", "Hybrid"]).withMessage("Invalid mode specified."),
  body("courseDuration").trim().notEmpty().withMessage("Course duration is required."),
  body("startDate").notEmpty().isISO8601().withMessage("Valid start date required."),
  body("locationURL").trim().notEmpty().withMessage("Location URL is required."),
  body("aboutBranch").trim().notEmpty().withMessage("Campus address is required."),
  body("state").notEmpty().withMessage("State is required"),
  body("district").notEmpty().withMessage("District is required"),
  body("town").notEmpty().withMessage("Town is required"),
  body("certification").isIn(["Yes", "No"]).withMessage("A selection for Certification is required."),
  body("installments").isIn(["Yes", "No"]).withMessage("A selection for Installments is required."),
  body("emioptions").isIn(["Yes", "No"]).withMessage("A selection for EMI Options is required."),
  body("priceOfCourse").notEmpty().withMessage("Price is required."),
  // Conditional fields based on UI logic
  body("classTiming").if(body("categoriesType").equals("Upskilling")).notEmpty().withMessage("Class timings are required."),
  body("courselanguage").if(body("categoriesType").equals("Upskilling")).isIn(["English", "Hindi", "Telugu"]).withMessage("Select language."),
  body("classlanguage").if(body("categoriesType").equals("Exam Preparation")).notEmpty().withMessage("Class language is required."),
  body("classSize").if(body("categoriesType").equals("Exam Preparation")).notEmpty().withMessage("Class size is required."),
  body("mockTests").if(body("categoriesType").equals("Exam Preparation")).isIn(["Yes", "No"]).withMessage("Selection required."),
  // --- File Validations ---
  body("centerImageUrl").trim().isURL().withMessage("Center images are required."),
  body("imageUrl").trim().isURL().withMessage("Course image is required."),
  body("brochureUrl").trim().isURL().withMessage("Brochure URL is required.")
];

// --- UPDATED TUITION CENTER RULES ---
const l2TuitionCourseRules = [
  body("courseName").trim().notEmpty().withMessage("Tuition centre name is required."),
  body("mode").isIn(["Offline", "Online", "Hybrid"]).withMessage("Invalid mode specified."),
  body("operationalDays").isArray({ min: 1 }).withMessage("At least one operational day required."),
  body("openingTime").notEmpty().withMessage("Opening time is required."),
  body("closingTime").notEmpty().withMessage("Closing time is required."),
  body("subject").trim().notEmpty().withMessage("Subject is required."),
  body("classSize").notEmpty().withMessage("Class size is required."),
  body("locationURL").trim().notEmpty().withMessage("Location URL is required."),
  body("aboutBranch").trim().notEmpty().withMessage("Campus address is required."),
  body("state").notEmpty().withMessage("State is required"),
  body("district").notEmpty().withMessage("District is required"),
  body("town").notEmpty().withMessage("Town is required"),
  body("partlyPayment").isIn(["Yes", "No"]).withMessage("A selection for Partly Payment is required."),
  body("priceOfCourse").notEmpty().withMessage("Price is required."),
  // Nested Arrays for "Add more" logic
  body("academicDetails").isArray().withMessage("Academic details required."),
  body("academicDetails.*.subject").notEmpty().withMessage("Academic subject required."),
  body("academicDetails.*.monthlyFees").notEmpty().withMessage("Monthly fees required."),
  body("facultyDetails").isArray().withMessage("Faculty details required."),
  body("facultyDetails.*.name").notEmpty().withMessage("Faculty name required."),
  // --- File Validations ---
  body("tuitionImageUrl").trim().isURL().withMessage("Tuition center image is required."),
  body("imageUrl").trim().isURL().withMessage("Course image is required."),
  body("brochureUrl").trim().isURL().withMessage("Brochure PDF is required.")
];

// ✅ --- L2 STUDY HALL COURSE RULES ---
const l2StudyHallRules = [
  body("hallName").trim().notEmpty().withMessage("Hall name is required."),
  body("seatingOption").isIn(["Individual Desk", "Shared Table", "Private Cabin", "Open Seating"]).withMessage("Select seating option."),
  body("openingTime").notEmpty().withMessage("Opening time is required."),
  body("closingTime").notEmpty().withMessage("Closing time is required."),
  body("operationalDays").isArray({ min: 1 }).withMessage("Select operational days."),
  body("startDate").notEmpty().isISO8601().withMessage("Valid start date required."),
  body("endDate").notEmpty().isISO8601().withMessage("Valid end date required."),
  body("totalSeats").notEmpty().withMessage("Total seats is required."),
  body("availableSeats").notEmpty().withMessage("Available seats is required."),
  body("pricePerSeat").notEmpty().withMessage("Price per seat is required."),
  body("hasWifi").isIn(["Yes", "No"]).withMessage("A selection for Wi-Fi is required."),
  body("hasChargingPoints").isIn(["Yes", "No"]).withMessage("A selection for Charging Points is required."),
  body("hasAC").isIn(["Yes", "No"]).withMessage("A selection for Air Conditioner is required."),
  body("hasPersonalLocker").isIn(["Yes", "No"]).withMessage("A selection for Personal Lockers is required."),
  // --- File Validations ---
  body("imageUrl").trim().isURL().withMessage("Hall image is required.")
];

// --- UPDATED STUDY ABROAD RULES ---
// Pulls from StudyAbroadForm.tsx & merges old studyAbroadL3Rules
const l2StudyAbroadRules = [
 body("consultancyName").trim().notEmpty().withMessage("Consultancy name is required."),
  body("studentAdmissions").notEmpty().withMessage("Student admissions count is required."),
  body("locationURL").trim().notEmpty().withMessage("Location URL is required."),
  body("aboutBranch").trim().notEmpty().withMessage("Campus address is required."),
  body("state").notEmpty().withMessage("State is required"),
  body("district").notEmpty().withMessage("District is required"),
  body("town").notEmpty().withMessage("Town is required"),
  body("countriesOffered").notEmpty().not().equals("Select Country").withMessage("Please select a valid country."),
  body("academicOfferings").notEmpty().not().equals("Select Academic type").withMessage("Please select a valid academic type."),
  body("budget").trim().notEmpty().withMessage("Budget info is required."),
  body("studentsSent").notEmpty().withMessage("Students count is required."),
  body("applicationAssistance").isIn(["Yes", "No"]).withMessage("A selection for Application Assistance is required."),
  body("visaProcessingSupport").isIn(["Yes", "No"]).withMessage("A selection for Visa Processing Support is required."),
  body("partTimeHelp").isIn(["Yes", "No"]).withMessage("A selection for Part-time help is required."),
  body("preDepartureOrientation").isIn(["Yes", "No"]).withMessage("Selection required."),
  body("accommodationAssistance").isIn(["Yes", "No"]).withMessage("Selection required."),
  body("educationLoans").isIn(["Yes", "No"]).withMessage("Selection required."),
  body("postArrivalSupport").isIn(["Yes", "No"]).withMessage("Selection required."),
  // --- File Validations ---
  body("consultancyImageUrl").trim().isURL().withMessage("Consultancy image is required."),
  body("imageUrl").trim().isURL().withMessage("Program image is required."),
  body("brochureUrl").trim().isURL().withMessage("Brochure URL is required."),
  body("businessProofUrl").trim().isURL().withMessage("Business Proof document is required."),
  body("panAadhaarUrl").trim().isURL().withMessage("PAN/Aadhaar document is required.")
];



// Define this at the top of your validator file
const BLUE_BOX_FIELDS = {
  "Intermediate college(K12)": ["year", "classType", "specialization", "priceOfCourse"],
  "School's": ["classType", "priceOfCourse"],
  "Kindergarten/childcare center": ["categoriesType", "priceOfCourse"],
  "Study Abroad": ["countriesOffered", "academicOfferings", "budget", "studentsSent"],
  "Tution Center's": ["academicDetails", "facultyDetails"],
  "Under Graduation/Post Graduation": ["graduationType", "streamType", "selectBranch", "branchDescription", "educationType", "priceOfCourse"]
};

exports.validateL2Update = async (req, res, next) => {
  try {
    const userId = req.userId;
    const institution = await Institution.findOne({ institutionAdmin: userId });

    if (!institution) return res.status(404).json({ message: "Institution not found" });

    

    if (req.body.courses && Array.isArray(req.body.courses)) {
      req.body.courses.forEach((topLevelCourse) => {
        // 1. Move fields from the top-level course object to root
        Object.keys(topLevelCourse).forEach(key => {
          if (key !== 'courses' && topLevelCourse[key] !== undefined) {
            req.body[key] = topLevelCourse[key];
          }
        });

        // 2. CRITICAL: Dig into the nested subarray (the "Blue Box" fields)
        if (topLevelCourse.courses && Array.isArray(topLevelCourse.courses)) {
          topLevelCourse.courses.forEach((subArrayItem) => {
            Object.keys(subArrayItem).forEach(subKey => {
              if (subArrayItem[subKey] !== undefined && subArrayItem[subKey] !== "") {
                // Move classType, priceOfCourse, etc. to root
                req.body[subKey] = subArrayItem[subKey];
              }
            });
          });
        }
      });
    }
    const type = institution.instituteType;
    console.log("validation", type);

    let validationChain = [];
    switch (type) {
      case "School's":
        validationChain = l2SchoolRules;
        break;
      case "Intermediate college(K12)":
        validationChain = l2IntermediateCollegeRules;
        break;
      case "Coaching centers":
        validationChain = l2CoachingCourseRules;
        break;
      case "Under Graduation/Post Graduation":
        validationChain = l2UgPgCourseRules;
        break;
      case "Kindergarten/childcare center":
        validationChain = l2KindergartenRules;
        break;
      case "Tution Center's":
        validationChain = l2TuitionCourseRules;
        break;
      case "Study Halls":
        validationChain = l2StudyHallRules;
        break;
      case "Study Abroad":
        validationChain = l2StudyAbroadRules;
        break;
      default:
        return res.status(400).json({ message: `Unsupported type: ${type}` });
    }

    await Promise.all(validationChain.map((v) => v.run(req)));

    handleValidationErrors(req, res, next);
  } catch (error) {
    next(error);
  }
};

// --- BRANCH VALIDATORS ---
exports.validateBranchCreation = [
  param("institutionId").isMongoId().withMessage("Invalid institution ID."),
  body("branchName")
    .trim()
    .notEmpty()
    .withMessage("Branch name is required.")
    .isLength({ max: 100 }),
  body("contactInfo.countryCode").optional().trim(),
  body("contactInfo.number")
    .trim()
    .notEmpty()
    .matches(/^\d{10}$/)
    .withMessage("A valid 10-digit contact number is required."),
  body("branchAddress")
    .trim()
    .notEmpty()
    .withMessage("Branch address is required.")
    .isLength({ max: 255 }),
  body("locationUrl").optional({ checkFalsy: true }),
  // .isURL()
  // .withMessage("Must be a valid URL."),
  handleValidationErrors,
];

exports.validateBranchUpdate = [
  param("institutionId").isMongoId().withMessage("Invalid institution ID."),
  param("branchId").isMongoId().withMessage("Invalid branch ID."),
  body("branchName")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Branch name cannot be empty.")
    .isLength({ max: 100 }),
  body("contactInfo.number")
    .optional()
    .trim()
    .notEmpty()
    .matches(/^\d{10}$/)
    .withMessage("A valid 10-digit contact number is required."),
  body("branchAddress")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Branch address cannot be empty.")
    .isLength({ max: 255 }),
  body("locationUrl").optional({ checkFalsy: true }),
  // .isURL()
  // .withMessage("Must be a valid URL."),
  handleValidationErrors,
];

// --- COURSE VALIDATORS---
exports.validateCourseCreation = [
  param("institutionId").isMongoId().withMessage("Invalid institution ID."),
  
  body("courseName")
    .trim()
    .notEmpty()
    .withMessage("Course name is required.")
    .isLength({ max: 150 }),

  body("aboutCourse")
    .trim()
    .notEmpty()
    .withMessage("About course is required.")
    .isLength({ max: 2000 }),

  body("courseDuration")
    .trim()
    .notEmpty()
    .withMessage("Course duration is required.")
    .isLength({ max: 50 }), // Now allows "4 Years"

  body("mode")
    .isIn(["Offline", "Online", "Hybrid"])
    .withMessage("Invalid mode specified."),

  body("priceOfCourse")
    .notEmpty()
    .withMessage("Price is required."),
    // Removed .isNumeric() because frontend sends it as a string "100000"

  // UPDATED: Changed from 'location' to 'locationURL' to match your frontend payload
  body("locationURL")
    .trim()
    .notEmpty()
    .withMessage("Location URL is required."),

  body("imageUrl")
    .trim()
    .isURL()
    .withMessage("Image URL must be a valid S3 URL."),

  // UPDATED: Fixed the spelling from 'brotureUrl' to 'brochureUrl'
  body("brochureUrl")
    .trim()
    .isURL()
    .withMessage("Brochure URL must be a valid S3 URL."),

  // NEW: Added these fields since they appear in your frontend network tab
  body("graduationType").optional().trim(),
  body("streamType").optional().trim(),
  body("selectBranch").optional().trim(),
  body("highestPackage").optional().trim(),
  body("averagePackage").optional().trim(),

  handleValidationErrors,
];

exports.validateCourseUpdate = [
  param("institutionId").isMongoId().withMessage("Invalid institution ID."),
  param("courseId").isMongoId().withMessage("Invalid course ID."),
  body("courseName")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Course name cannot be empty")
    .isLength({ max: 150 }),
  body("aboutCourse")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("About course cannot be empty")
    .isLength({ max: 2000 }),
  handleValidationErrors,
];


// --- L1 INSTITUTION VALIDATOR ---
exports.validateL1Creation = [
  // --- Institute Type ---
  body("instituteType")
    .isIn([
      "Kindergarten/childcare center",
      "School's",
      "Intermediate college(K12)",
      "Under Graduation/Post Graduation",
      "Coaching centers",
      "Tution Center's",
      "Study Halls",
      "Study Abroad",
    ])
    .withMessage("A valid institute type is required."),

  // --- Institute Name ---
  body("instituteName")
    .notEmpty()
    .withMessage("Institute Name is required")
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage("Institute Name must be between 3 and 100 characters")
    .matches(/^[A-Za-z][A-Za-z\s.&'-]*$/)
    .withMessage(
      "Institute Name must start with a letter and can only contain letters, numbers, spaces, . & ' -"
    )
    .escape(),

  // --- Conditional Validation for Approved By ---
  body("approvedBy")
    .if(body("instituteType").not().isIn(["Study Halls", "Study Abroad"])) // Skip for Study Halls and Study Abroad
    .notEmpty()
    .withMessage("Approved By is required")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Approved By must be between 2 and 100 characters")
    .matches(/^[A-Za-z][A-Za-z\s.&'-]*$/)
    .withMessage(
      "Approved By must start with a letter and can only contain letters, spaces, . & ' -"
    )
    .escape(),

  // --- Conditional Validation for Establishment Date ---
  body("establishmentDate")
    .if(body("instituteType").not().isIn(["Study Halls", "Study Abroad"])) // Skip for Study Halls and Study Abroad
    .notEmpty()
    .withMessage("Establishment Date is required")
    .isISO8601()
    .withMessage("Must be a valid date")
    .custom((value) => {
      const enteredDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (enteredDate > today) {
        throw new Error("Establishment Date cannot be in the future");
      }
      return true; // Indicates validation passed
    }),

  // --- Contact Info (Required) ---
  body("contactInfo")
    .notEmpty()
    .withMessage("Contact info is required")
    .isLength({ min: 10, max: 10 })
    .withMessage("Contact number must be exactly 10 digits")
    .isNumeric()
    .withMessage("Contact number must only contain digits"),

  // --- Additional Contact Info (Optional) ---
  body("additionalContactInfo")
    .optional({ checkFalsy: true }) // Makes the field optional
    .isLength({ min: 10, max: 10 })
    .withMessage("Additional contact must be 10 digits if provided")
    .isNumeric()
    .withMessage("Additional contact must only contain digits"),

  // --- Address Details ---
  body("headquartersAddress")
    .notEmpty()
    .withMessage("Headquarters Address is required"),

  body("state")
    .notEmpty()
    .withMessage("State is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("State must be between 2 and 50 characters")
    .matches(/^[A-Za-z][A-Za-z\s]*$/)
    .withMessage("State name should only include alphabets and spaces"),

  body("pincode")
    .notEmpty()
    .withMessage("Pincode is required")
    .isLength({ min: 6, max: 6 })
    .withMessage("Pincode must be exactly 6 digits")
    .isNumeric()
    .withMessage("Pincode must only contain digits"),

  // --- Location URL ---
  body("locationURL").notEmpty().withMessage("Location URL is required"),
  // .isURL()
  // .withMessage("Please enter a valid URL"),

  // --- Conditional Validation for Logo URL ---
  body("logoUrl")
    .optional({ checkFalsy: true })
    .if(body("instituteType").not().equals("Study Abroad")) // Skip for Study Abroad
    .trim()
    .isURL()
    .withMessage("Logo URL must be a valid URL."),

  handleValidationErrors, // Your existing error handler
];

// --- L2 BRANCH & COURSE VALIDATORS (For File Upload) ---

const l2BranchRules = [
  // Allow branchName to be an empty string (for the unassigned courses object),
  // but validate its length if it does exist.
  body("*.branchName")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage("Branch name must be between 3 and 100 characters."),

  // These fields are now ONLY required IF a branchName is provided.
  body("*.branchAddress")
    .if(body("*.branchName").notEmpty()) // The condition
    .trim()
    .notEmpty()
    .withMessage("Branch address is required when a branch name is provided."),

  body("*.contactInfo")
    .if(body("*.branchName").notEmpty()) // The condition
    .trim()
    .notEmpty()
    .withMessage("Contact info is required when a branch name is provided.")
    .matches(/^[0-9]{10}$/)
    .withMessage("A valid 10-digit contact number is required."),

  body("*.locationURL")
    .if(body("*.branchName").notEmpty()) // The condition
    .trim()
    .notEmpty()
    .withMessage("Location URL is required when a branch name is provided."),
  // .isURL()
  // .withMessage("Must be a valid URL."),
];



exports.validateUploadedFile = async (req, res, next) => {
  console.log("\n--- 🚀 [START] Bulk File Validation ---");

  if (!req.file) {
    return res.status(400).json({ message: "No file was uploaded." });
  }

  try {
    const fileContent = req.file.buffer.toString("utf8");
    const jsonData = JSON.parse(fileContent);

    if (!jsonData.institution || !jsonData.courses) {
      return res.status(400).json({
        message: "File must contain 'institution' and 'courses' properties.",
      });
    }

    const { institution, courses } = jsonData;
    const type = institution.instituteType;

    // 1. Determine the validation chain based on type
    let courseValidationChain = [];
    switch (type) {
      case "Kindergarten/childcare center":
        courseValidationChain = l2KindergartenRules;
        break;
      case "School's":
        courseValidationChain = l2SchoolRules;
        break;
      case "Intermediate college(K12)":
        courseValidationChain = l2IntermediateCollegeRules;
        break;
      case "Under Graduation/Post Graduation":
        courseValidationChain = l2UgPgCourseRules;
        break;
      case "Coaching centers":
        courseValidationChain = l2CoachingCourseRules;
        break;
      case "Tution Center's":
        courseValidationChain = l2TuitionCourseRules;
        break;
      case "Study Halls":
        courseValidationChain = l2StudyHallRules;
        break;
      case "Study Abroad":
        courseValidationChain = l2StudyAbroadRules;
        break;
      default:
        return res.status(400).json({ message: `Unsupported type: ${type}` });
    }

    // 

    // 2. Loop through each branch and each course
    for (const branchGroup of courses) {
      // Validate the branch structure itself
      req.body = branchGroup;
      await Promise.all(l2BranchRules.map((v) => v.run(req)));
      let branchErrors = validationResult(req);
      
      if (!branchErrors.isEmpty()) {
        return res.status(422).json({
          context: "Branch Data Error",
          branch: branchGroup.branchName,
          errors: branchErrors.array(),
        });
      }

      // 3. Validate every course within this branch
      for (const course of branchGroup.courses || []) {
        // We set req.body to the current course so express-validator can "see" it
        req.body = course;

        await Promise.all(courseValidationChain.map((v) => v.run(req)));
        let courseErrors = validationResult(req);

        if (!courseErrors.isEmpty()) {
          // Dynamic name lookup for the error response
          const cName = course.courseName || course.hallName || course.consultancyName || "Unnamed";
          
          console.error(`❌ FAILED: ${cName} in branch ${branchGroup.branchName}`);
          return res.status(422).json({
            context: "Course Data Error",
            branch: branchGroup.branchName,
            course: cName,
            errors: courseErrors.array(),
          });
        }
      }
    }

    console.log("✅ SUCCESS: All branches and courses passed validation.");
    req.institutionData = institution;
    req.coursesData = courses;
    next();

  } catch (error) {
    logger.error({ error: error.message }, "Critical File Validation Error");
    return res.status(400).json({ message: "Invalid JSON format or structure." });
  }
};

// 1. Updated Whitelist (Fixed typos and added missing fields from L2)
const allowedFilters = new Set([
  "page", "limit", "state", "pincode", "instituteType", "district", "town",
  "playground", "busService", "hostelFacility", "extendedCare", "mealsProvided",
  "outdoorPlayArea", "placementDrives", "mockInterviews", "resumeBuilding",
  "linkedinOptimization", "certification", "library", "entranceExam", 
  "managementQuota", "emioptions", "partlyPayment"
]);

exports.validateInstitutionFilter = [
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),

  query("state").optional().isString().trim(),
  query("instituteType")
    .optional()
    .isIn([
      "Kindergarten/childcare center",
      "School's",
      "Intermediate college(K12)",
      "Under Graduation/Post Graduation",
      "Coaching centers",
      "Tuition Center's", // Fixed spelling
      "Study Halls",
      "Study Abroad",
    ]),

  // Updated Amenity Validation: Match the "Yes"/"No" logic used in L2 rules
  [
    "playground", "busService", "hostelFacility", "extendedCare", 
    "mealsProvided", "outdoorPlayArea", "placementDrives", "mockInterviews",
    "resumeBuilding", "linkedinOptimization", "certification", "library",
    "entranceExam", "managementQuota", "emioptions", "partlyPayment"
  ].map(field => 
    query(field)
      .optional()
      .isIn(["Yes", "No"])
      .withMessage(`${field} must be either 'Yes' or 'No'.`)
  ),

  // 3. Strict Whitelist Check
  query().custom((value, { req }) => {
    for (const param in req.query) {
      if (!allowedFilters.has(param)) {
        throw new Error(`Unknown filter parameter: '${param}'.`);
      }
    }
    return true;
  }),

  handleValidationErrors,
];

// =======================
// --- L2 COURSE RULES ---
// =======================
module.exports.l2BaseCourseRules = l2BaseCourseRules;
module.exports.l2UgPgCourseRules = l2UgPgCourseRules;
module.exports.l2CoachingCourseRules = l2CoachingCourseRules;
module.exports.l2TuitionCourseRules = l2TuitionCourseRules;
module.exports.l2StudyHallRules = l2StudyHallRules;
module.exports.l2StudyAbroadRules = l2StudyAbroadRules;
module.exports.l2SchoolRules = l2SchoolRules;
module.exports.l2IntermediateCollegeRules = l2IntermediateCollegeRules;
module.exports.l2KindergartenRules = l2KindergartenRules;

// Export the validation error handler
module.exports.handleValidationErrors = handleValidationErrors;
module.exports.validateInstitutionFilter = this.validateInstitutionFilter;
