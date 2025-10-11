const { body, param, validationResult } = require("express-validator");
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
  body("email")
    .isEmail()
    .withMessage("A valid email is required")
    .normalizeEmail(),
  body("name").notEmpty().withMessage("Name is required").trim().escape(),
  body("password")
    .isStrongPassword(strongPasswordOptions)
    .withMessage(
      "Password must be at least 8 characters long and contain an uppercase letter, a lowercase letter, a number, and a symbol."
    ),
  // body('contactNumber').isMobilePhone('any', { strictMode: true }).withMessage('A valid 10-digit contact number is required.'),
  body("contactNumber")
    .matches(/^[0-9]{10}$/)
    .withMessage("A valid 10-digit contact number is required."),

  body("designation")
    .notEmpty()
    .withMessage("Designation is required")
    .trim()
    .escape(),
  body("linkedinUrl")
    .optional({ checkFalsy: true })
    .isURL()
    .withMessage("Invalid LinkedIn URL")
    .trim(),
  body("logoUrl").isURL().withMessage("Logo URL must be a valid URL").trim(),
  handleValidationErrors,
];

exports.validateLogin = [
  body("email")
    .isEmail()
    .withMessage("A valid email is required")
    .normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required"),
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

// --- L2 INSTITUTION VALIDATOR---

const ugPgUniversityL2Rules = [
  body("ownershipType")
    .isIn(["Government", "Private", "Public-Private Partnership"])
    .withMessage("Invalid ownership type."),
  body("collegeCategory")
    .isIn(["Engineering", "Medical", "Arts & Science", "Management", "Law"])
    .withMessage("Invalid college category."),
  body("affiliationType")
    .trim()
    .notEmpty()
    .withMessage("Affiliation type is required.")
    .isLength({ max: 100 })
    .escape(),
  body("placements.placementDrives").optional().isBoolean(),
  body("placements.mockInterviews").optional().isBoolean(),
  body("placements.resumeBuilding").optional().isBoolean(),
];

const coachingCenterL2Rules = [
  body("placementDrives")
    .notEmpty()
    .withMessage("placementDrives is required")
    .isBoolean()
    .withMessage("placementDrives must be true or false"),

  body("mockInterviews")
    .notEmpty()
    .withMessage("mockInterviews is required")
    .isBoolean()
    .withMessage("mockInterviews must be true or false"),

  body("resumeBuilding")
    .notEmpty()
    .withMessage("resumeBuilding is required")
    .isBoolean()
    .withMessage("resumeBuilding must be true or false"),

  body("linkedinOptimization")
    .notEmpty()
    .withMessage("linkedinOptimization is required")
    .isBoolean()
    .withMessage("linkedinOptimization must be true or false"),

  body("exclusiveJobPortal")
    .notEmpty()
    .withMessage("exclusiveJobPortal is required")
    .isBoolean()
    .withMessage("exclusiveJobPortal must be true or false"),

  body("certification")
    .notEmpty()
    .withMessage("certification is required")
    .isBoolean()
    .withMessage("certification must be true or false"),
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
      return res
        .status(404)
        .json({
          status: "fail",
          message: "Institution not found for the logged-in user.",
        });
    }

    let validationChain = [];
    console.log("for type of " + institution.instituteType);
    switch (institution.instituteType) {
      case "Kindergarten/childcare center":
        validationChain = kindergartenL2Rules;
        break;
      case "School's":
        validationChain = schoolRules;
        break;
      case "Intermediate college(K12)":
        validationChain = intermediateCollegeL2Rules;
        break;
      case "Under Graduation/Post Graduation":
        validationChain = ugPgUniversityL2Rules;
        break;
      case "Study Abroad":
        return next();
      case "Coaching centers":
        validationChain = coachingCenterL2Rules;
        break;
      case "Tution Center's":
        return next();
      case "Study Halls":
        return next();

      default:
        logger.error(
          { userId: req.userId, instituteType: institution.instituteType },
          "Unsupported institution type for L2 update."
        );
        return res
          .status(400)
          .json({
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
  body("locationUrl")
    .optional({ checkFalsy: true })
    .isURL()
    .withMessage("Must be a valid URL."),
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
  body("locationUrl")
    .optional({ checkFalsy: true })
    .isURL()
    .withMessage("Must be a valid URL."),
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
    .isLength({ max: 50 }),
  body("mode")
    .isIn(["Offline", "Online", "Hybrid"])
    .withMessage("Invalid mode specified."),
  body("priceOfCourse")
    .isNumeric()
    .withMessage("Price must be a number.")
    .custom((val) => val >= 0)
    .withMessage("Price cannot be negative."),
  body("location")
    .trim()
    .notEmpty()
    .withMessage("Location is required.")
    .isLength({ max: 100 }),
  body("imageUrl").trim().isURL().withMessage("Image URL must be a valid URL."),
  body("brotureUrl")
    .trim()
    .isURL()
    .withMessage("Broture URL must be a valid URL."),
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

// // --- L1 INSTITUTION VALIDATOR ---
// exports.validateL1Creation = [
//     body('instituteName').notEmpty().withMessage('Institution name is required').trim().isLength({ max: 150 }).escape(),
//     body('instituteType').isIn([
//         'Kindergarten/childcare center', "School's", 'Intermediate college(K12)', 'Under Graduation/Post Graduation', 'Coaching centers', "Tution Center's", 'Study Halls', 'Study Abroad'
//     ]).withMessage('A valid institute type is required.'),
//     body('approvedBy').optional({ checkFalsy: true }).trim().isLength({ max: 100 }).escape(),
//     handleValidationErrors,
// ];

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
    .if(body("instituteType").not().equals("Study Halls")) // Only validate if type is NOT 'Study Halls'
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
    .if(body("instituteType").not().equals("Study Halls")) // Only validate if type is NOT 'Study Halls'
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
  body("locationURL")
    .notEmpty()
    .withMessage("Location URL is required")
    .isURL()
    .withMessage("Please enter a valid URL"),

  body("logoUrl").trim().isURL().withMessage("Logo URL must be a valid URL."),

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

  body("*.locationUrl")
    .if(body("*.branchName").notEmpty()) // The condition
    .trim()
    .notEmpty()
    .withMessage("Location URL is required when a branch name is provided.")
    .isURL()
    .withMessage("Must be a valid URL."),
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

  body("mode")
    .isIn(["Offline", "Online", "Hybrid"])
    .withMessage("A valid mode is required."),

  body("priceOfCourse")
    .trim()
    .notEmpty()
    .withMessage("Price is required.")
    .isNumeric()
    .withMessage("Price must be a number."),
  body("location")
    .trim()
    .notEmpty()
    .withMessage("Location URL is required.")
    .matches(/^https?:\/\/.+/)
    .withMessage("Location URL must start with http:// or https://"),

  // This field is handled by the branch assignment logic, so it can be optional here.
  body("createdBranch").optional({ checkFalsy: true }).trim(),
];

const l2UgPgCourseRules = [
  body("graduationType").notEmpty().withMessage("Graduation type is required."),

  body("streamType").notEmpty().withMessage("Stream type is required."),

  body("selectBranch")
    .notEmpty()
    .withMessage("A branch must be selected for the course."),

  body("aboutBranch")
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage("About branch must be between 10 and 500 characters."),

  body("educationType")
    .isIn(["Full time", "part time", "Distance"])
    .withMessage("A valid education type is required."),

  body("mode")
    .isIn(["Offline", "Online", "Hybrid"])
    .withMessage("A valid mode is required."),

  body("courseDuration")
    .trim()
    .notEmpty()
    .withMessage("Course duration is required."),

  body("priceOfCourse")
    .notEmpty()
    .withMessage("Price is required.")
    .isNumeric()
    .withMessage("Price must be a number."),

  body("classSize")
    .notEmpty()
    .withMessage("Class size is required.")
    .isNumeric()
    .withMessage("Class size must be a number."),

  body("eligibilityCriteria")
    .trim()
    .notEmpty()
    .withMessage("Eligibility criteria is required."),
  // This field is handled by the branch assignment logic, so it can be optional here.
  body("createdBranch").optional({ checkFalsy: true }).trim(),
];

const l2CoachingCourseRules = [
  // --- Base Course Rules ---
  body("courseName").trim().notEmpty().withMessage("Course name is required."),

  body("courseDuration")
    .trim()
    .notEmpty()
    .withMessage("Course duration is required."),

  body("priceOfCourse")
    .notEmpty()
    .withMessage("Price is required.")
    .isNumeric()
    .withMessage("Price must be a number."),
  body("location")
    .trim()
    // This regex checks if the string starts with 'http://' or 'https://'
    .matches(/^https?:\/\/.+/)
    .withMessage("URL must start with http:// or https://"),
  body("mode")
    .isIn(["Offline", "Online", "Hybrid"])
    .withMessage("A valid mode is required."),

  body("createdBranch").optional({ checkFalsy: true }).trim(),

  // --- Coaching-specific Rules ---
  body("categoriesType")
    .isIn([
      "Academic",
      "Competitive Exam",
      "Professional",
      "Skill Development",
      "Language",
      "Arts & Crafts",
      "Sports",
      "Music & Dance",
    ])
    .withMessage("Please select a valid categories type."),

  body("domainType")
    .isIn([
      "Engineering",
      "Medical",
      "Management",
      "Law",
      "Banking",
      "Government Jobs",
      "IT & Software",
      "Design",
      "Marketing",
      "Finance",
    ])
    .withMessage("Please select a valid domain type."),

  body("classSize")
    .notEmpty()
    .withMessage("Class size is required.")
    .isNumeric()
    .withMessage("Class size must be a number."),
];

const l2TuitionCourseRules = [
  // Validates the 'tuitionType' dropdown
  body("tuitionType")
    .isIn(["Home Tuition", "Center Tuition"])
    .withMessage(
      "A valid tuition type is required (Home Tuition or Center Tuition)."
    ),

  // Validates 'instructorProfile' is not empty
  body("instructorProfile")
    .trim()
    .notEmpty()
    .withMessage("Instructor profile is required."),

  // Validates 'subject' format
  body("subject")
    .trim()
    .notEmpty()
    .withMessage("Subject is required.")
    .matches(/^[A-Za-z\s,]+$/)
    .withMessage("Subject can only contain letters, spaces, and commas."),

  // Validates 'totalSeats' is a non-negative number
  body("totalSeats")
    .notEmpty()
    .withMessage("Total seats is required.")
    .isInt({ min: 0 })
    .withMessage("Total seats must be a non-negative number."),

  // Validates 'availableSeats' and ensures it's not greater than 'totalSeats'
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

  // Validates 'operationalDays' has at least one day selected
  body("operationalDays")
    .isArray({ min: 1 })
    .withMessage("At least one operational day must be selected."),

  // Validates 'openingTime' and 'closingTime' are in HH:MM format
  body("openingTime")
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage("Opening time must be in a valid HH:MM format."),

  body("closingTime")
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage("Closing time must be in a valid HH:MM format."),

  // Validates 'pricePerSeat' is a non-negative number
  body("pricePerSeat")
    .notEmpty()
    .withMessage("Price per seat is required.")
    .isFloat({ min: 0 })
    .withMessage("Price must be a non-negative number."),

  // Allows 'createdBranch' to be optional
  body("createdBranch").optional({ checkFalsy: true }).trim(),
];

// ✅ --- L2 STUDY HALL COURSE RULES ---
const l2StudyHallRules = [
  body("hallName").trim().notEmpty().withMessage("Hall name is required."),
  // Validates 'seatingOption' dropdown
  body("seatingOption")
    .isIn(["Individual Desk", "Shared Table", "Private Cabin", "Open Seating"])
    .withMessage("Please select a valid seating option."),

  // Validates time formats
  body("openingTime")
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage("Opening time must be in a valid HH:MM format."),

  body("closingTime")
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage("Closing time must be in a valid HH:MM format."),

  // Validates 'operationalDays' is an array with at least one day
  body("operationalDays")
    .isArray({ min: 1 })
    .withMessage("At least one operational day must be selected."),

  // Validates seats are non-negative numbers
  body("totalSeats")
    .notEmpty()
    .withMessage("Total seats is required.")
    .isInt({ min: 0 })
    .withMessage("Total seats must be a non-negative number."),

  // Validates available seats and ensures it's not greater than total seats
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

  // Validates 'pricePerSeat' is a non-negative number
  body("pricePerSeat")
    .notEmpty()
    .withMessage("Price per seat is required.")
    .isFloat({ min: 0 })
    .withMessage("Price must be a non-negative number."),

  //      // ✅ Validates that the facility fields are either "yes" or "no"
  //   body('hasWifi').isIn(['yes', 'no']).withMessage('A selection for Wi-Fi is required.'),
  //   body('hasChargingPoints').isIn(['yes', 'no']).withMessage('A selection for Charging Points is required.'),
  //   body('hasAC').isIn(['yes', 'no']).withMessage('A selection for Air Conditioner is required.'),
  //   body('hasPersonalLocker').isIn(['yes', 'no']).withMessage('A selection for Personal Lockers is required.'),
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

  // Allows 'createdBranch' to be optional
  body("createdBranch").optional({ checkFalsy: true }).trim(),
];

// --- L3 DETAILS VALIDATOR MIDDLEWARE ---
exports.validateL3Details = async (req, res, next) => {
  // This function remains the same as you provided
  try {
    const institution = await Institution.findOne({
      institutionAdmin: req.userId,
    });
    if (!institution) {
      return res.status(404).json({ message: "Institution not found." });
    }
    let validationChain = [];
    switch (institution.instituteType) {
      case "Kindergarten/childcare center":
        validationChain = kindergartenL3Rules;
        break;
      case "School's":
        validationChain = schoolL3Rules;
        break;
      case "Intermediate college(K12)":
        validationChain = intermediateCollegeL3Rules;
        break;
      case "Under Graduation/Post Graduation":
        validationChain = ugPgUniversityL3Rules;
        break;
      case "Coaching centers":
        validationChain = coachingCenterL3Rules;
        break;
      case "Study Abroad":
      case "Tution Center's":
      case "Study Halls":
        return next(); // Skip validation for these types as per your logic
      default:
        return res
          .status(400)
          .json({ message: "Unsupported institution type for L3 update." });
    }
    await Promise.all(validationChain.map((validation) => validation.run(req)));
    handleValidationErrors(req, res, next);
  } catch (error) {
    next(error);
  }
};
const kindergartenL3Rules = [
  // Validates the 'schoolType' dropdown selection
  body("schoolType")
    .isIn([
      "Public",
      "Private (For-profit)",
      "Private (Non-profit)",
      "International",
      "Home - based",
    ])
    .withMessage("Invalid school type selected."),

  // Validates 'curriculumType' text input
  body("curriculumType")
    .trim()
    .notEmpty()
    .withMessage("Curriculum type is required.")
    .isLength({ min: 3, max: 100 })
    .withMessage("Curriculum type must be between 3 and 100 characters.")
    .matches(/^[A-Za-z\s]+$/)
    .withMessage("Curriculum type must only contain letters and spaces.")
    .escape(),

  // Validates time fields are not empty
  body("openingTime")
    .trim()
    .notEmpty()
    .withMessage("Opening time is required."),

  body("closingTime")
    .trim()
    .notEmpty()
    .withMessage("Closing time is required."),

  // Validates the array of operational days
  body("operationalDays")
    .isArray({ min: 1 })
    .withMessage("Select at least one operational day."),

  body("operationalDays.*").isIn([
    "Mon",
    "Tues",
    "Wed",
    "Thur",
    "Fri",
    "Sat",
    "Sun",
  ]),

  // Validates the Yes/No fields, which are converted to booleans on the backend
  body("extendedCare")
    .isBoolean()
    .withMessage("A selection for Extended Care is required."),

  body("mealsProvided")
    .isBoolean()
    .withMessage("A selection for Meals Provided is required."),

  body("outdoorPlayArea")
    .isBoolean()
    .withMessage("A selection for Outdoor Play Area is required."),
];

const schoolL3Rules = [
  // Validates the 'schoolType' dropdown selection
  body("schoolType")
    .isIn(["Co-ed", "Boys Only", "Girls Only"])
    .withMessage("Invalid school type selected."),

  // Validates the 'schoolCategory' dropdown selection
  body("schoolCategory")
    .isIn(["Public", "Private", "Charter", "International"])
    .withMessage("Invalid school category selected."),

  // Validates the 'curriculumType' dropdown selection
  body("curriculumType")
    .isIn(["State Board", "CBSE", "ICSE", "IB", "IGCSE"])
    .withMessage("Invalid curriculum type selected."),

  // Validates the array of operational days
  body("operationalDays")
    .isArray({ min: 1 })
    .withMessage("Select at least one operational day."),

  body("operationalDays.*").isIn([
    "Mon",
    "Tues",
    "Wed",
    "Thur",
    "Fri",
    "Sat",
    "Sun",
  ]),

  // Validates 'otherActivities' text area
  body("otherActivities")
    .trim()
    .notEmpty()
    .withMessage("Other activities is required.")
    .isLength({ max: 200 })
    .withMessage("Other activities must not exceed 200 characters.")
    .escape(),

  // Validates the Yes/No fields, expecting booleans after normalization
  body("hostelFacility")
    .isBoolean()
    .withMessage("A selection for Hostel Facility is required."),

  body("playground")
    .isBoolean()
    .withMessage("A selection for Playground is required."),

  body("busService")
    .isBoolean()
    .withMessage("A selection for Bus Service is required."),
];

const intermediateCollegeL3Rules = [
  // Validates the 'collegeType' dropdown selection
  body("collegeType")
    .isIn([
      "Junior College",
      "Senior Secondary",
      "Higher Secondary",
      "Intermediate",
      "Pre-University",
    ])
    .withMessage("Invalid college type selected."),

  // Validates the 'collegeCategory' dropdown selection
  body("collegeCategory")
    .isIn(["Government", "Private", "Semi-Government", "Aided", "Unaided"])
    .withMessage("Invalid college category selected."),

  // Validates the 'curriculumType' dropdown selection
  body("curriculumType")
    .isIn(["State Board", "CBSE", "ICSE", "IB", "Cambridge", "Other"])
    .withMessage("Invalid curriculum type selected."),

  // Validates the array of operational days
  body("operationalDays")
    .isArray({ min: 1 })
    .withMessage("Select at least one operational day."),

  body("operationalDays.*").isIn([
    "Mon",
    "Tues",
    "Wed",
    "Thur",
    "Fri",
    "Sat",
    "Sun",
  ]),

  // Validates 'otherActivities' text area
  body("otherActivities")
    .trim()
    .notEmpty()
    .withMessage("Other activities is required.")
    .isLength({ max: 200 })
    .withMessage("Other activities must not exceed 200 characters.")
    .escape(),

  // Validates the Yes/No fields, which are converted to booleans on the backend
  body("hostelFacility")
    .isBoolean()
    .withMessage("A selection for Hostel Facility is required."),

  body("playground")
    .isBoolean()
    .withMessage("A selection for Playground is required."),

  body("busService")
    .isBoolean()
    .withMessage("A selection for Bus Service is required."),
];

const ugPgUniversityL3Rules = [
  // Validates dropdowns
  // ✅ Updated to match the new frontend options
  body("ownershipType")
    .isIn(["Government", "Private", "Semi-Government", "Aided", "Unaided"])
    .withMessage("Invalid ownership type selected."),

  // ✅ Updated to match the new frontend options
  body("collegeCategory")
    .isIn([
      "Engineering",
      "Medical",
      "Arts & Science",
      "Commerce",
      "Management",
      "Law",
      "Other",
    ])
    .withMessage("Invalid college category selected."),

  // ✅ Updated from a text validation to a specific dropdown validation
  body("affiliationType")
    .isIn([
      "University",
      "Autonomous",
      "Affiliated",
      "Deemed University",
      "Other",
    ])
    .withMessage("Invalid affiliation type selected."),
  // Validates the Yes/No fields, which are converted to booleans on the backend
  body("placementDrives")
    .isBoolean()
    .withMessage("A selection for Placement Drives is required."),
  body("mockInterviews")
    .isBoolean()
    .withMessage("A selection for Mock Interviews is required."),
  body("resumeBuilding")
    .isBoolean()
    .withMessage("A selection for Resume Building is required."),
  body("linkedinOptimization")
    .isBoolean()
    .withMessage("A selection for LinkedIn Optimization is required."),
  body("exclusiveJobPortal")
    .isBoolean()
    .withMessage("A selection for Exclusive Job Portal is required."),
  body("library")
    .isBoolean()
    .withMessage("A selection for Library is required."),
  body("hostelFacility")
    .isBoolean()
    .withMessage("A selection for Hostel Facility is required."),
  body("entranceExam")
    .isBoolean()
    .withMessage("A selection for Entrance Exam is required."),
  body("managementQuota")
    .isBoolean()
    .withMessage("A selection for Management Quota is required."),
  body("playground")
    .isBoolean()
    .withMessage("A selection for Playground is required."),
  body("busService")
    .isBoolean()
    .withMessage("A selection for Bus Service is required."),
];

const coachingCenterL3Rules = [
  body("placementDrives")
    .isBoolean()
    .withMessage("A selection for Placement Drives is required."),

  body("mockInterviews")
    .isBoolean()
    .withMessage("A selection for Mock Interviews is required."),

  body("resumeBuilding")
    .isBoolean()
    .withMessage("A selection for Resume Building is required."),

  body("linkedinOptimization")
    .isBoolean()
    .withMessage("A selection for LinkedIn Optimization is required."),

  body("exclusiveJobPortal")
    .isBoolean()
    .withMessage("A selection for Exclusive Job Portal is required."),

  body("certification")
    .isBoolean()
    .withMessage("A selection for Certification is required."),
];

// ✅ --- MASTER FILE UPLOAD VALIDATOR ---

exports.validateUploadedFile = async (req, res, next) => {
  console.log("\n--- 🚀 [START] Entered validateUploadedFile Middleware ---");

  if (!req.file) {
    console.error("❌ ERROR: No file found on the request.");
    return res.status(400).json({ message: "No file was uploaded." });
  }

  try {
    const fileContent = req.file.buffer.toString("utf8");
    const jsonData = JSON.parse(fileContent);
    console.log("Fil data", JSON.stringify(jsonData, null, 2));
    if (!jsonData.institution || !jsonData.courses) {
      console.error(
        "❌ ERROR: JSON must contain 'institution' and 'courses' keys."
      );
      return res
        .status(400)
        .json({
          message: "File must contain 'institution' and 'courses' properties.",
        });
    }

    const { institution, courses } = jsonData;

    // --- STEP 1: Run L1 Validation ---
    console.log("\n🕵️‍♂️ [Step 1] Running L1 Validation...");
    req.body = institution;
    await Promise.all(
      exports.validateL1Creation.slice(0, -1).map((v) => v.run(req))
    );
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error("❌ FAILED: L1 Validation.", errors.array());
      return res
        .status(422)
        .json({ context: "L1 Data Error", errors: errors.array() });
    }
    console.log("✅ PASSED: L1 Validation.");

    // --- STEP 2: Run L2 Branch Validation ---
    console.log("\n🕵️‍♂️ [Step 2] Running L2 Branch Validation...");
    req.body = courses;
    await Promise.all(l2BranchRules.map((v) => v.run(req)));
    errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error("❌ FAILED: L2 Branch Validation.", errors.array());
      return res
        .status(422)
        .json({ context: "L2 Branch Data Error", errors: errors.array() });
    }
    console.log("✅ PASSED: L2 Branch Validation.");

    // --- STEP 3: Run L2 Course Validation (Conditionally) ---
    console.log(
      `\n🕵️‍♂️ [Step 3] Running L2 Course Validation for type: "${institution.instituteType}"...`
    );
    let courseValidationChain;
    switch (institution.instituteType) {
      case "Kindergarten/childcare center":
      case "School's":
      case "Intermediate college(K12)":
        courseValidationChain = l2BaseCourseRules;
        break;
      // ✅ Case added for UG/PG courses
      case "Under Graduation/Post Graduation":
        courseValidationChain = l2UgPgCourseRules;
        break;
      // ✅ Case added for Coaching Centers
      case "Coaching centers":
        courseValidationChain = l2CoachingCourseRules;
        break;
      // Add other cases here
      case "Tution Center's":
        courseValidationChain = l2TuitionCourseRules;
        break;
      case "Study Halls":
        courseValidationChain = l2StudyHallRules;
        break;
      default:
        courseValidationChain = [];
    }

    if (courseValidationChain.length > 0) {
      for (const branch of courses) {
        for (const course of branch.courses || []) {
          req.body = course;
          await Promise.all(courseValidationChain.map((v) => v.run(req)));
          errors = validationResult(req);
          if (!errors.isEmpty()) {
            console.error(
              `❌ FAILED: L2 Course Validation for course "${course.courseName}".`,
              errors.array()
            );
            return res
              .status(422)
              .json({
                context: "L2 Course Data Error",
                branch: branch.branchName,
                course: course.courseName,
                errors: errors.array(),
              });
          }
        }
      }
    }
    console.log("✅ PASSED: L2 Course Validation.");

    // --- STEP 4: Run L3 Validation (Conditionally) ---
    console.log(
      `\n🕵️‍♂️ [Step 4] Running L3 Details Validation for type: "${institution.instituteType}"...`
    );
    req.body = institution; // Set body back to institution data
    let l3ValidationChain;
    switch (institution.instituteType) {
      case "Kindergarten/childcare center":
        l3ValidationChain = kindergartenL3Rules;
        break;
      // ✅ Case added for School's
      case "School's":
        l3ValidationChain = schoolL3Rules;
        break;
      // ✅ Case added for Intermediate College
      case "Intermediate college(K12)":
        l3ValidationChain = intermediateCollegeL3Rules;
        break;
      // ✅ Case added for UG/PG
      case "Under Graduation/Post Graduation":
        l3ValidationChain = ugPgUniversityL3Rules;
        break;
      // ✅ Case added for Coaching Centers
      case "Coaching centers":
        l3ValidationChain = coachingCenterL3Rules;
        break;
      default:
        l3ValidationChain = [];
    }

    if (l3ValidationChain.length > 0) {
      await Promise.all(
        l3ValidationChain.map((validation) => validation.run(req))
      );
      errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.error("❌ FAILED: L3 Validation.", errors.array());
        return res
          .status(422)
          .json({ context: "L3 Data Error", errors: errors.array() });
      }
    }
    console.log("✅ PASSED: L3 Details Validation.");

    // --- STEP 5: Success ---
    console.log("\n👍 SUCCESS: All validations passed. Moving to controller.");
    req.institutionData = institution;
    req.coursesData = courses;
    next();
  } catch (error) {
    logger.error(
      { error: error.message },
      "Error during file upload validation."
    );
    console.error("🔥 CRITICAL ERROR in validateUploadedFile:", error);
    return res
      .status(400)
      .json({ message: "Invalid JSON format or file structure." });
  }
};

// =======================
// --- L2 COURSE RULES ---
// =======================
module.exports.l2BaseCourseRules = l2BaseCourseRules;
module.exports.l2UgPgCourseRules = l2UgPgCourseRules;
module.exports.l2CoachingCourseRules = l2CoachingCourseRules;
module.exports.l2TuitionCourseRules = l2TuitionCourseRules;
module.exports.l2StudyHallRules = l2StudyHallRules;

// =======================
// --- L3 DETAILS RULES ---
// =======================
module.exports.kindergartenL3Rules = kindergartenL3Rules;
module.exports.schoolL3Rules = schoolL3Rules;
module.exports.intermediateCollegeL3Rules = intermediateCollegeL3Rules;
module.exports.ugPgUniversityL3Rules = ugPgUniversityL3Rules;
module.exports.coachingCenterL3Rules = coachingCenterL3Rules;

// Export the validation error handler
module.exports.handleValidationErrors = handleValidationErrors;
