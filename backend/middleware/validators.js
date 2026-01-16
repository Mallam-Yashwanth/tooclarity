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
      (value, { req }) =>
        req.body.type === "student" || req.body.type === "institution"
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
  .notEmpty()
  .withMessage("Password is required");

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

exports.validateL2Update = async (req, res, next) => {
  try {
    console.log("in l2UpdateValidators");
    const userId = req.userId;
    // const institution = await Institution.findById(req.user.institution);
    const institution = await Institution.findOne({ institutionAdmin: userId });
    if (!institution) {
      logger.warn(
        { userId: req.userId },
        "Attempted L2 update for a non-existent institution."
      );
      return res.status(404).json({
        status: "fail",
        message: "Institution not found for the logged-in user.",
      });
    }

    let validationChain = [];
    console.log("for type of " + institution.instituteType);
    switch (institution.instituteType) {
      case "Kindergarten/childcare center":
        validationChain = l2KindergartenRules;
        break;
      case "School's":
        validationChain = l2SchoolRules;
        break;
      case "Intermediate college(K12)":
        validationChain = l2IntermediateCollegeRules;
        break;
      case "Under Graduation/Post Graduation":
        validationChain = l2UgPgCourseRules;
        break;
      case "Coaching centers":
        validationChain = l2CoachingCourseRules;
        break;
      case "Tution Center's": // Note: Ensure spelling matches your L1Creation validator
        validationChain = l2TuitionCourseRules;
        break;
      case "Study Halls":
        validationChain = l2StudyHallRules;
        break;
      case "Study Abroad":
        validationChain = l2StudyAbroadRules;
        break;
      default:
        logger.error(
          { userId: req.userId, instituteType: institution.instituteType },
          "Unsupported institution type for L2 update."
        );
        return res.status(400).json({
          status: "fail",
          message: "Unsupported institution type for L2 update.",
        });
    }

    // Run the selected validation chain
    await Promise.all(validationChain.map((validation) => validation.run(req)));

    // Handle the results
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
// Pulls from SchoolForm.tsx & your old schoolL3Rules
const l2SchoolRules = [
  ...l2BaseCourseRules,

  body("schoolType")
    .isIn(["Co-Education", "Boys Only", "Girls Only"]) // Updated to match SchoolForm.tsx
    .withMessage("Invalid school type selected."),

  body("schoolCategory")
    .optional() // Made optional as it's not marked 'required' in your JSX
    .isIn(["Public", "Private", "Charter", "International"])
    .withMessage("Invalid school category selected."),

  body("curriculumType")
    .isIn(["State board", "CBSE", "ICSE", "IB", "IGCSE"]) // Updated 'board' to 'board'
    .withMessage("Invalid curriculum type selected."),

  body("classType")
    .notEmpty()
    .withMessage("Class Type is required.")
    .trim(),

  // Added missing field from SchoolForm.tsx
  body("classlanguage")
    .optional()
    .trim(),

  // --- Amenities (Kept old L3 messages, updated to "Yes/No" strings) ---
  body("hostelFacility")
    .isIn(["Yes", "No"])
    .withMessage("A selection for Hostel Facility is required."),

  body("playground")
    .isIn(["Yes", "No"])
    .withMessage("A selection for Playground is required."),

  body("busService")
    .isIn(["Yes", "No"])
    .withMessage("A selection for Bus Service is required."),

  // --- Operational Days (From old L3) ---
  body("operationalDays")
    .optional()
    .isArray({ min: 1 })
    .withMessage("Select at least one operational day."),

  body("operationalDays.*").isIn([
    "Mon", "Tues", "Wed", "Thur", "Fri", "Sat", "Sun",
  ]),
];

// --- UPDATED INTERMEDIATE COLLEGE RULES ---
// Pulls from CollegeForm.tsx & your old intermediateCollegeL3Rules
const l2IntermediateCollegeRules = [
  ...l2BaseCourseRules, // Validates common fields like courseName, duration, location, etc.

  body("collegeType")
    .isIn([
      "Junior College",
      "Senior Secondary",
      "Higher Secondary",
      "Intermediate",
      "Pre-University",
    ])
    .withMessage("Invalid college type selected."),

  body("collegeCategory")
    .isIn(["Government", "Private", "Semi-Government", "Aided", "Unaided"])
    .withMessage("Invalid college category selected."),

  body("curriculumType")
    .isIn(["State board", "CBSE", "ICSE", "IB", "Cambridge", "Other"]) // Match lowercase 'board' from JSX
    .withMessage("Invalid curriculum type selected."),

  body("year")
    .isIn(["1st Year", "2nd Year"])
    .withMessage("Please select the year."),

  body("specialization")
    .isIn(["MPC", "BiPC", "CEC", "HEC", "MEC"])
    .withMessage("Select a valid specialization."),

  body("classlanguage")
    .notEmpty()
    .withMessage("Language of class is required.")
    .trim(),

  // --- Amenities (Updated to String check, kept old L3 messages) ---
  body("hostelFacility")
    .isIn(["Yes", "No"])
    .withMessage("A selection for Hostel Facility is required."),

  body("playground")
    .isIn(["Yes", "No"])
    .withMessage("A selection for Playground is required."),

  body("busService")
    .isIn(["Yes", "No"])
    .withMessage("A selection for Bus Service is required."),

  // --- Operational Days (From old L3) ---
  body("operationalDays")
    .optional()
    .isArray({ min: 1 })
    .withMessage("Select at least one operational day."),

  body("operationalDays.*").isIn([
    "Mon", "Tues", "Wed", "Thur", "Fri", "Sat", "Sun",
  ]),
];

// --- UPDATED KINDERGARTEN RULES ---
// Merges old kindergartenL3Rules into L2
const l2KindergartenRules = [
  ...l2BaseCourseRules,

  body("graduationType")
    .isIn(["Kindergarten"])
    .withMessage("A valid Course type is required."),

  body("categoriesType")
    .isIn(["Nursery", "LKG", "UKG", "Playgroup"])
    .withMessage("Select Category Type"),

  body("schoolType")
    .isIn([
      "Public",
      "Private (For-profit)",
      "Private (Non-profit)",
      "International",
      "Home - based",
    ])
    .withMessage("Invalid school type selected."),

  body("curriculumType")
    .trim()
    .notEmpty()
    .withMessage("Curriculum type is required.")
    .isLength({ min: 3, max: 100 })
    .withMessage("Curriculum type must be between 3 and 100 characters.")
    .matches(/^[A-Za-z\s]+$/)
    .withMessage("Curriculum type must only contain letters and spaces.")
    .escape(),

  body("classSizeRatio")
    .notEmpty()
    .withMessage("Teacher: Student Ratio is required")
    .trim(),

  body("ownershipType")
    .isIn(["Private", "Government", "Trust", "Other"])
    .withMessage("Invalid school type selected."),

  // --- Amenities (Kept old L3 messages, updated to "Yes/No" strings) ---
  body("extendedCare")
    .isIn(["Yes", "No"])
    .withMessage("A selection for Extended Care is required."),

  body("mealsProvided")
    .isIn(["Yes", "No"])
    .withMessage("A selection for Meals Provided is required."),

  body("outdoorPlayArea")
    .isIn(["Yes", "No"])
    .withMessage("A selection for Outdoor Play Area is required."),
    
  // Added from your form as required fields
  body("playground")
    .isIn(["Yes", "No"])
    .withMessage("A selection for Playground is required."),
    
  body("busService")
    .isIn(["Yes", "No"])
    .withMessage("A selection for Bus Service is required."),
];

// --- UPDATED UG/PG RULES ---
// Pulls from UnderPostGraduateForm.tsx & your old l2UgPgCourseRules
const l2UgPgCourseRules = [
  ...l2BaseCourseRules,
  body("graduationType").notEmpty().withMessage("Graduation type is required."),
  body("streamType").notEmpty().withMessage("Stream type is required."),
  body("selectBranch").notEmpty().withMessage("A branch must be selected for the course."),
  body("aboutBranch")
    .trim()
    .isLength({ min: 3, max: 500 })
    .withMessage("About branch must be between 3 and 500 characters."),
  body("educationType")
    .isIn(["Full time", "part time", "Distance"])
    .withMessage("A valid education type is required."),
  body("classSize")
    .notEmpty()
    .withMessage("Class size is required.")
    .isNumeric()
    .withMessage("Class size must be a number."),
  body("eligibilityCriteria")
    .trim()
    .notEmpty()
    .withMessage("Eligibility criteria is required."),

  // --- NEW: Placement & Facility fields (Integrated from L3 / New Form) ---
  body("placementDrives").isIn(["Yes", "No"]).withMessage("A selection for Placement Drives is required."),
  body("entranceExam").isIn(["Yes", "No"]).withMessage("A selection for Entrance Exam is required."),
  body("managementQuota").isIn(["Yes", "No"]).withMessage("A selection for Management Quota is required."),
  body("library").isIn(["Yes", "No"]).withMessage("A selection for Library is required."),
  
  body("totalNumberRequires").optional().isNumeric().withMessage("Must be a number."),
  body("highestPackage").optional().trim(),
  body("averagePackage").optional().trim(),
  body("totalStudentsPlaced").optional().isNumeric().withMessage("Must be a number."),
  body("mockInterviews").optional().isIn(["Yes", "No"]),
  body("resumeBuilding").optional().isIn(["Yes", "No"]),
  body("linkedinOptimization").optional().isIn(["Yes", "No"]),
];

// --- UPDATED COACHING RULES ---
// Pulls from CoachingCourseForm.tsx & your old l2CoachingCourseRules
const l2CoachingCourseRules = [
  ...l2BaseCourseRules,

  body("categoriesType")
    .isIn(["Exam Preparation", "Upskilling"])
    .withMessage("Please select a valid categories type."),

  body("domainType")
    .notEmpty()
    .withMessage("Please select a valid domain type."),

  body("subDomainType")
    .notEmpty()
    .withMessage("Please select a valid sub-domain type."),

  body("classSize")
    .notEmpty()
    .withMessage("Class size is required.")
    .isNumeric()
    .withMessage("Class size must be a number."),

  // --- Upskilling Specific Fields ---
  body("classTimings")
    .trim()
    .notEmpty()
    .withMessage("Class timings are required."),

  body("courselanguage")
    .optional()
    .isIn(["English", "Hindi", "Telugu"])
    .withMessage("Select a valid course language."),

  // --- Exam Prep Specific Fields ---
  body("classlanguage")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Class language is required."),

  // --- Placement & Amenities (Updated to String check, kept old L3 messages) ---
  body("placementDrives")
    .isIn(["Yes", "No"])
    .withMessage("A selection for Placement Drives is required."),

  body("mockInterviews")
    .isIn(["Yes", "No"])
    .withMessage("A selection for Mock Interviews is required."),

  body("resumeBuilding")
    .isIn(["Yes", "No"])
    .withMessage("A selection for Resume Building is required."),

  body("linkedinOptimization")
    .isIn(["Yes", "No"])
    .withMessage("A selection for LinkedIn Optimization is required."),

  body("certification")
    .isIn(["Yes", "No"])
    .withMessage("A selection for Certification is required."),

  body("mockTests")
    .optional()
    .isIn(["Yes", "No"])
    .withMessage("A selection for Mock Tests is required."),

  body("studyMaterial")
    .optional()
    .isIn(["Yes", "No"])
    .withMessage("A selection for Study Material is required."),

  body("library")
    .optional()
    .isIn(["Yes", "No"])
    .withMessage("A selection for Library Facility is required."),

  // Numeric placement stats from form
  body("highestPackage").optional().trim(),
  body("averagePackage").optional().trim(),
  body("totalStudentsPlaced").optional().isNumeric().withMessage("Must be a number."),
  body("totalNumberRequires").optional().isNumeric().withMessage("Must be a number.")
];

// --- UPDATED TUITION CENTER RULES ---
// Merges your old l2TuitionCourseRules with the new academic/faculty arrays
const l2TuitionCourseRules = [
  ...l2BaseCourseRules,

  body("tuitionType")
    .isIn(["Home Tuition", "Center Tuition"])
    .withMessage("A valid tuition type is required (Home Tuition or Center Tuition)."),

  body("instructorProfile")
    .trim()
    .notEmpty()
    .withMessage("Instructor profile is required."),

  // Main subject field
  body("subject")
    .trim()
    .notEmpty()
    .withMessage("Subject is required.")
    .matches(/^[A-Za-z\s,]+$/)
    .withMessage("Subject can only contain letters, spaces, and commas."),

  body("classSize")
    .notEmpty()
    .withMessage("Class Size is required.")
    .trim(),

  // Kept your seat logic exactly as it was
  body("totalSeats")
    .notEmpty()
    .withMessage("Total seats is required.")
    .isInt({ min: 0 })
    .withMessage("Total seats must be a non-negative number."),

  body("availableSeats")
    .notEmpty()
    .withMessage("Available seats is required.")
    .isInt({ min: 0 })
    .withMessage("Available seats must be a non-negative number.")
    .custom((value, { req }) => {
      if (parseInt(value, 10) > parseInt(req.body.totalSeats, 10)) {
        throw new Error("Available seats cannot exceed total seats.");
      }
      return true;
    }),

  // Integrated Operational logic (Kept old messages/regex)
  body("operationalDays")
    .isArray({ min: 1 })
    .withMessage("At least one operational day must be selected."),

  body("openingTime")
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage("Opening time must be in a valid HH:MM format."),

  body("closingTime")
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage("Closing time must be in a valid HH:MM format."),

  // --- Nested Array Validation (Matches the "Add More" UI in your form) ---
  body("academicDetails")
    .optional()
    .isArray()
    .withMessage("Academic details must be an array."),
    
  body("academicDetails.*.subject")
    .notEmpty()
    .withMessage("Subject name is required in academic details."),
    
  body("academicDetails.*.monthlyFees")
    .notEmpty()
    .withMessage("Monthly Fees is required."),

  body("facultyDetails")
    .optional()
    .isArray()
    .withMessage("Faculty details must be an array."),
    
  body("facultyDetails.*.name")
    .notEmpty()
    .withMessage("Faculty name is required."),

  // Added Partly Payment from Form
  body("partlyPayment")
    .isIn(["Yes", "No"])
    .withMessage("A selection for Partly Payment is required."),
];

// ✅ --- L2 STUDY HALL COURSE RULES ---
// --- UPDATED STUDY HALL RULES ---
// Pulls from StudyHallForm.tsx & your old l2StudyHallRules
const l2StudyHallRules = [
  ...l2BaseCourseRules, // Validates common fields + Location Trio + Dates

  body("hallName")
    .trim()
    .notEmpty()
    .withMessage("Hall name is required."),

  body("seatingOption")
    .isIn(["Individual Desk", "Shared Table", "Private Cabin", "Open Seating"])
    .withMessage("Please select a valid seating option."),

  body("openingTime")
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage("Opening time must be in a valid HH:MM format."),

  body("closingTime")
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage("Closing time must be in a valid HH:MM format."),

  body("operationalDays")
    .isArray({ min: 1 })
    .withMessage("At least one operational day must be selected."),

  body("totalSeats")
    .notEmpty()
    .withMessage("Total seats is required.")
    .isInt({ min: 0 })
    .withMessage("Total seats must be a non-negative number."),

  body("availableSeats")
    .notEmpty()
    .withMessage("Available seats is required.")
    .isInt({ min: 0 })
    .withMessage("Available seats must be a non-negative number.")
    .custom((value, { req }) => {
      if (parseInt(value, 10) > parseInt(req.body.totalSeats, 10)) {
        throw new Error("Available seats cannot exceed total seats.");
      }
      return true;
    }),

  body("pricePerSeat")
    .notEmpty()
    .withMessage("Price per seat is required.")
    .isFloat({ min: 0 })
    .withMessage("Price must be a non-negative number."),

  body("hasWifi")
    .isIn(["Yes", "No"])
    .withMessage("A selection for Wi-Fi is required."),

  body("hasChargingPoints")
    .isIn(["Yes", "No"])
    .withMessage("A selection for Charging Points is required."),

  body("hasAC")
    .isIn(["Yes", "No"])
    .withMessage("A selection for Air Conditioner is required."),

  body("hasPersonalLocker")
    .isIn(["Yes", "No"])
    .withMessage("A selection for Personal Lockers is required."),
];

// --- UPDATED STUDY ABROAD RULES ---
// Pulls from StudyAbroadForm.tsx & merges old studyAbroadL3Rules
const l2StudyAbroadRules = [
  ...l2BaseCourseRules,

  body("consultancyName")
    .trim()
    .notEmpty()
    .withMessage("Consultancy name is required."),

  body("studentAdmissions")
    .notEmpty()
    .withMessage("Student admissions count is required.")
    .isInt({ min: 0 })
    .withMessage("Student admissions must be a non-negative number."),

  body("countriesOffered")
    .trim()
    .notEmpty()
    .withMessage("Country selection is required.")
    .not()
    .equals("Select Country")
    .withMessage("Please select a valid country."),

  body("academicOfferings")
    .trim()
    .notEmpty()
    .withMessage("Academic offering is required.")
    .not()
    .equals("Select Academic type")
    .withMessage("Please select a valid academic type."),

  body("budget")
    .trim()
    .notEmpty()
    .withMessage("Budget info is required."),

  body("studentsSent")
    .notEmpty()
    .withMessage("Students count is required.")
    .isInt({ min: 0 })
    .withMessage("Students count must be a number."),

  // --- Consultancy Services (Updated to String check, kept old L3 messages) ---
  body("applicationAssistance")
    .isIn(["Yes", "No"])
    .withMessage("A selection for Application Assistance is required."),

  body("visaProcessingSupport")
    .isIn(["Yes", "No"])
    .withMessage("A selection for Visa Processing Support is required."),

  body("preDepartureOrientation")
    .isIn(["Yes", "No"])
    .withMessage("A selection for Pre-departure orientation is required."),

  body("accommodationAssistance")
    .isIn(["Yes", "No"])
    .withMessage("A selection for Accommodation assistance is required."),

  body("educationLoans")
    .isIn(["Yes", "No"])
    .withMessage("A selection for Education loans/Financial aid guidance is required."),

  body("postArrivalSupport")
    .isIn(["Yes", "No"])
    .withMessage("A selection for Post-arrival support is required."),

  // Updated from 'testOperation' to match the new 'partTimeHelp' field in the form
  body("partTimeHelp")
    .isIn(["Yes", "No"])
    .withMessage("A selection for Part-time help is required."),

  // --- Legal Verification URLs (New from Form) ---
  body("businessProofUrl")
    .optional({ checkFalsy: true })
    .isURL()
    .withMessage("Invalid Business Proof URL."),

  body("panAadhaarUrl")
    .optional({ checkFalsy: true })
    .isURL()
    .withMessage("Invalid Document URL."),
];


exports.validateUploadedFile = async (req, res, next) => {
  console.log("\n--- 🚀 [START] Entered validateUploadedFile Middleware ---");

  if (!req.file) {
    console.error("❌ ERROR: No file found on the request.");
    return res.status(400).json({ message: "No file was uploaded." });
  }

  try {
    const fileContent = req.file.buffer.toString("utf8");
    const jsonData = JSON.parse(fileContent);

    if (!jsonData.institution || !jsonData.courses) {
      console.error("❌ ERROR: Missing 'institution' or 'courses'.");
      return res.status(400).json({
        message: "File must contain 'institution' and 'courses' properties.",
      });
    }

    const { institution, courses } = jsonData;

    // --- STEP 1: Run Branch Validation ---
    // Note: 'courses' in your JSON is actually an array of branch groups
    console.log("\n🕵️‍♂️ [Step 1] Running Branch Validation...");
    req.body = courses;

    await Promise.all(l2BranchRules.map((v) => v.run(req)));
    let errors = validationResult(req);

    if (!errors.isEmpty()) {
      console.error("❌ FAILED: Branch Validation.", errors.array());
      return res.status(422).json({
        context: "Branch Data Error",
        errors: errors.array(),
      });
    }
    console.log("✅ PASSED: Branch Validation.");

    // --- STEP 2: Run Merged L2 Course Validation ---
    console.log(
      `\n🕵️‍♂️ [Step 2] Running Merged L2 Validation for type: "${institution.instituteType}"...`
    );

    let courseValidationChain = [];

    switch (institution.instituteType) {
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
        courseValidationChain = l2BaseCourseRules;
    }

    if (courseValidationChain.length > 0) {
      // Iterate through each branch group
      for (const branchGroup of courses) {
        // Iterate through each course within that branch
        for (const course of branchGroup.courses || []) {
          // Set the individual course as the body for the validator to inspect
          req.body = course;

          await Promise.all(courseValidationChain.map((v) => v.run(req)));
          errors = validationResult(req);

          if (!errors.isEmpty()) {
            console.error(
              `❌ FAILED: Validation for course "${course.courseName}" in branch "${branchGroup.branchName}".`,
              errors.array()
            );
            return res.status(422).json({
              context: "Course Data Error",
              branch: branchGroup.branchName,
              course: course.courseName || "Unnamed Course",
              errors: errors.array(),
            });
          }
        }
      }
    }
    console.log("✅ PASSED: Merged Course Validation.");

    // --- STEP 3: L3 VALIDATION REMOVED ---
    // Logic: L3 fields are now inside the courseValidationChain above.
    console.log("⏭️ [Step 3] Skipping L3 (Merged into L2).");

    // --- FINAL: Success ---
    console.log("\n👍 SUCCESS: All merged validations passed.");
    req.institutionData = institution;
    req.coursesData = courses;

    next();
  } catch (error) {
    logger.error(
      { error: error.message },
      "Error during file upload validation."
    );
    console.error("🔥 CRITICAL ERROR:", error);

    return res.status(400).json({
      message: "Invalid JSON format or file structure.",
    });
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
