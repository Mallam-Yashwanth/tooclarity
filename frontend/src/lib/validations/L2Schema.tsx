import Joi from "joi";
import { alphaNumericNameRule } from "./ValidationRules";
import {
  urlRule,
  nameRule,
  stateRule,
  createdBranchRule,
  categoriesTypeRule,
  graduationTypeRule,
  streamTypeRule,
  selectBranchRule,
  phoneRule,
  domainTypeRule,
  durationRule,
} from "./ValidationRules";
import {
  branchNameRule,
  branchPhoneRule,
  branchUrlRule,
  addressRule,
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
    .greater(0) // ensures value is > 0
    .required()
    .messages({
      "number.base": "Price must be a number",
      "number.greater": "Price must be greater than 0",
      "any.required": "Price is required",
    }),
  location: urlRule.required(),
  mode: Joi.string().valid("Offline", "Online", "Hybrid").required().messages({
    "any.only": "Mode must be Offline, Online, or Hybrid",
    "string.empty": "Mode is required",
  }),
  createdBranch: createdBranchRule,
  image: Joi.any().optional(),
  /*imageUrl: Joi.string().uri().required().messages({
    "string.empty": "Image is required", */
    imageUrl: Joi.string().uri().allow("").optional().messages({
    "string.uri": "Must be a valid URL (e.g., https://...)",
  }),
  imagePreviewUrl: Joi.string().allow("").optional(), // ✅ only preview, not mandatory
  brochure: Joi.any().optional(),
  /*brochureUrl: Joi.string().uri().required().messages({
    "string.empty": "Brochure URL is required", */
    brochureUrl: Joi.string().uri().allow("").optional().messages({
    "string.uri": "Must be a valid URL (e.g., https://...)",
  }),
  brochurePreviewUrl: Joi.string().allow("").optional(),
});

export const CoachingCenterSchema = Joi.object({
  // --- Rules copied from baseCourseSchema (except aboutCourse) ---
  courseName: nameRule.required(),
  courseDuration: durationRule,
  priceOfCourse: Joi.number().required().messages({
    "number.base": "Price must be a number",
    "any.required": "Price is required",
  }),
  location: urlRule.required(),
  mode: Joi.string().valid("Offline", "Online", "Hybrid").required().messages({
    "any.only": "Mode must be Offline, Online, or Hybrid",
    "string.empty": "Mode is required",
  }),
  createdBranch: createdBranchRule,

  // --- Coaching-specific rules ---
  categoriesType: categoriesTypeRule,
  domainType: domainTypeRule,
  classSize: Joi.number()
    .min(0) // Ensures the number is at least 0
    .required()
    .messages({
      "number.base": "Class size must be a number",
      "number.min": "Class size cannot be negative",
      "any.required": "Class size is required",
    }),
});

export const StudyHallSchema = Joi.object({
  // This schema is now self-contained and does not inherit from baseCourseSchema
  hallName: nameRule.required().messages({
    // Assumes nameRule is imported
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

  // ✅ UPDATED VALIDATION FOR AVAILABLE SEATS
  availableSeats: Joi.number()
    .integer()
    .min(0)
    .required()
    .max(Joi.ref("totalSeats")) // ✅ Compares dynamically to totalSeats
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

  // Boolean fields should be explicitly required as the user must select one
  // ✅ Add .allow(null) to each boolean validation rule
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
  createdBranch: createdBranchRule,
});

export const TuitionCenterSchema = Joi.object({
  // This schema is now defined from scratch to match your form exactly.

  tuitionType: Joi.string()
    .valid("Home Tuition", "Center Tuition")
    .required()
    .messages({
      "string.empty": "Tuition Type is required.",
      "any.only": "Please select a valid Tuition Type.",
      "any.required": "Tuition Type is required.",
    }),

  instructorProfile: nameRule.required().messages({
    "string.empty": "Instructor Profile is required.",
    "any.required": "Instructor Profile is required.",
  }),

  subject: Joi.string()
    .pattern(/^[A-Za-z\s,]+$/)
    .required()
    .messages({
      "string.empty": "Subject is required.",
      "string.pattern.base":
        "Subject can only contain letters, spaces, and commas.",
      "any.required": "Subject is required.",
    }),

  totalSeats: Joi.number().min(0).required().messages({
    "number.base": "Value must be a number.",
    "number.min": "Total Seats cannot be negative.",
    "any.required": "Total Seats is required.",
  }),
  availableSeats: Joi.number()
    .min(0)
    .required()
    .max(Joi.ref("totalSeats")) // Ensures available seats is not greater than total seats
    .messages({
      "number.base": "Value must be a number.",
      "number.min": "Available Seats cannot be negative.", // Fixed typo
      "any.required": "Available Seats is required.", // Fixed typo
      "number.max": "Available seats cannot be greater than total seats.", // New error message
    }),
  operationalDays: Joi.array().items(Joi.string()).min(1).required().messages({
    // ✅ Added custom messages for operational days
    "array.min": "At least one operational day must be selected.",
    "any.required": "At least one operational day must be selected.",
  }),

  // ✅ Improved time validation to check for HH:MM format
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

  pricePerSeat: Joi.number().min(0).required().messages({
    "number.base": "Value must be a number.",
    "number.min": "Price cannot be negative.",
    "any.required": "Price Per Seat is required.",
  }),

  // You might need to add 'image' validation if it's required
  image: Joi.any().optional(), // Or .required() if needed

  // This field is used for associating with a branch
  createdBranch: createdBranchRule,
});

export const UGPGSchema = Joi.object({
  // This schema is now defined from scratch and does NOT inherit from baseCourseSchema.

  // --- Fields from your form ---
  graduationType: graduationTypeRule,
  streamType: streamTypeRule,
  selectBranch: selectBranchRule,

  aboutBranch: Joi.string().min(10).max(500).required().messages({
    "string.empty": "About branch is required.",
    "string.min": "About branch must be at least 10 characters.",
    "string.max": "About branch cannot exceed 500 characters.",
  }),

  educationType: Joi.string()
    .valid("Full time", "part time", "Distance")
    .required()
    .messages({
      "string.empty": "Please select an education type.",
      "any.required": "Please select an education type.",
    }),

  mode: Joi.string().valid("Offline", "Online", "Hybrid").required().messages({
    "string.empty": "Please select a mode.",
    "any.required": "Please select a mode.",
  }),

  courseDuration: durationRule,

  priceOfCourse: Joi.number().required().messages({
    "number.base": "Price must be a number.",
    "any.required": "Price is required.",
  }),

  classSize: Joi.number().required().messages({
    "number.base": "Class size must be a number.",
    "any.required": "Class size is required.",
  }),

  eligibilityCriteria: nameRule.messages({
    "string.empty": "Eligibility criteria is required.",
    "any.required": "Eligibility criteria is required.",
    "string.pattern.base":
      "Eligibility criteria Including at least one letter and can only include letters, numbers, spaces, . & ' -",
  }),
  createdBranch: createdBranchRule,
});

// ✅ Branch Schema
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
      "string.pattern.base":
        "Branch Name must start with a letter and may include numbers, spaces, and . & ' -",
    }),

  contactInfo: phoneRule.messages({
    "string.empty": "Contact info is required.",
    "any.required": "Contact info is required.",
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

// L2Schema.tsx
export const L2Schemas: Record<string, Joi.ObjectSchema> = {
  basic: baseCourseSchema,
  coaching: CoachingCenterSchema,
  studyHall: StudyHallSchema,
  tuition: TuitionCenterSchema,
  ugpg: UGPGSchema,
  branch: branchSchema,
};
