// API configuration and methods for authentication

import { AcademicDetail, FacultyDetail } from "@/components/auth/L2DialogBox";

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

// Types for API requests and responses

export interface SignUpData {
  name?: string;
  email?: string;
  contactNumber: string;
  designation?: string;
  linkedin?: string;
  password?: string;
  type?: "admin" | "institution" | "student";
}

export interface LoginData {
  email?: string;
  contactNumber?: string;
  password?: string;
  type?: "admin" | "institution" | "student";
}

export interface OTPData {
  email?: string;
  contactNumber?: string;
  otp: string;
  isLogin?: boolean 
}

export interface resendOtpData {
  email?: string;
  contactNumber?: string;
}

export interface ResetPasswordData {
  password: string;
  passwordConfirm: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface InstitutionData {
  instituteName: string;
  instituteType: string;
  establishmentDate?: string;
  approvedBy?: string;
  contactInfo?: string;
  additionalContactInfo?: string;
  headquartersAddress?: string;
  state?: string;
  pincode?: string;
  locationURL?: string;
}

// L2DialogBox Types
export interface CourseData {
  // id: number;
  // courseName: string;
  // aboutCourse: string;
  // courseDuration: string;
  // mode: string;
  // priceOfCourse: string;
  // location: string;
  // image?: File | null;
  // brochure?: File | null;
  // // Additional fields for Under Graduate/Post graduate
  // graduationType?: string;
  // streamType?: string;
  // selectBranch?: string;
  // aboutBranch?: string;
  // educationType?: string;
  // classSize?: string;
  // // Additional fields for Coaching centers
  // categoriesType?: string;
  // domainType?: string;
  // subDomainType?: string;
  // courseHighlights?: string;
  // // Additional fields for Study Hall
  // seatingOption?: string;
  // openingTime?: string;
  // closingTime?: string;
  // operationalDays?: string[];
  // totalSeats?: string;
  // availableSeats?: string;
  // pricePerSeat?: string;
  // hasWifi?: boolean;
  // hasChargingPoints?: boolean;
  // hasAC?: boolean;
  // hasPersonalLocker?: boolean;
  // // Additional fields for Tuition Centers
  // tuitionType?: string;
  // instructorProfile?: string;
  // subject?: string;

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

export interface BranchData {
  id: number;
  branchName: string;
  branchAddress: string;
  contactInfo: string;
  locationUrl: string;
}

// L3DialogBox Types
export interface KindergartenData {
  schoolType: string;
  curriculumType: string;
  openingTime: string;
  closingTime: string;
  operationalDays: string[];
  extendedCare: boolean;
  mealsProvided: boolean;
  outdoorPlayArea: boolean;
}

export interface SchoolData {
  schoolType: string;
  schoolCategory: string;
  curriculumType: string;
  operationalDays: string[];
  otherActivities: string;
  hostelFacility: boolean;
  playground: boolean;
  busService: boolean;
}

export interface CoachingData {
  placementDrives: boolean;
  mockInterviews: boolean;
  resumeBuilding: boolean;
  linkedinOptimization: boolean;
  exclusiveJobPortal: boolean;
  certification: boolean;
}

export interface CollegeData {
  collegeType: string;
  collegeCategory: string;
  curriculumType: string;
  operationalDays: string[];
  otherActivities: string;
  hostelFacility: boolean;
  playground: boolean;
  busService: boolean;
}

export interface UndergraduateData {
  ownershipType: string;
  collegeCategory: string;
  affiliationType: string;
  placementDrives: boolean;
  mockInterviews: boolean;
  resumeBuilding: boolean;
  linkedinOptimization: boolean;
  exclusiveJobPortal: boolean;
  library: boolean;
  hostelFacility: boolean;
  entranceExam: boolean;
  managementQuota: boolean;
  playground: boolean;
  busService: boolean;
}

export interface PaymentInitPayload {
  amount: number; // Payable amount in INR
  planType?: string; // e.g., "yearly" | "monthly"
  couponCode?: string | null;
  courseIds?: string[];
  noOfMonths?: number;
  // institutionId: string;
}

export interface PaymentVerifyPayload {
  orderId: string;
  paymentId: string;
  signature: string;
  planType?: string;
  coupon?: string | null;
  amount?: number;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };

    // Automatically set Content-Type for requests with JSON body
    // Don't set Content-Type for FormData - browser will set it automatically with boundary
    if (options.body && typeof options.body === "string") {
      headers["Content-Type"] = "application/json";
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers,
      credentials: "include",
      ...options,
    });

    // Safely parse JSON; if non-JSON (e.g., HTML from 404), fallback to text
    const raw = await response.text();
    let data: unknown;
    try {
      data = raw ? JSON.parse(raw) : {};
    } catch {
      data = { message: raw };
    }

    if (!response.ok) {
      throw new Error((data as { message?: string }).message || "Something went wrong");
    }

    // Ensure the response always has a success field
    // Handle different response formats from backend
    if (typeof (data as { success?: boolean }).success === "undefined") {
      // Check if backend uses 'status' field instead of 'success'
      if ((data as { status?: string }).status === "success") {
        return {
          success: true,
          message: (data as { message?: string }).message || "Operation successful",
          data: data,
        } as ApiResponse<T>;
      }

      // If no success or status field but response is ok, assume success
      return {
        success: true,
        message: (data as { message?: string }).message || "Operation successful",
        data: data,
      } as ApiResponse<T>;
    }

    return data as ApiResponse<T>;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') console.error("API Error:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Network error occurred",
    };
  }
}

// Authentication API methods
export const authAPI = {
  // Sign up user
  signUp: async (userData: SignUpData): Promise<ApiResponse> => {
    return apiRequest("/v1/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  },

  // Login user
  login: async (loginData: LoginData): Promise<ApiResponse> => {
    return apiRequest("/v1/auth/login", {
      method: "POST",
      body: JSON.stringify(loginData),
    });
  },

  // Verify OTP
  verifyOTP: async (otpData: OTPData): Promise<ApiResponse> => {
    return apiRequest("/v1/auth/verify-email", {
      method: "POST",
      body: JSON.stringify(otpData),
    });
  },

  verifyContactNumberAndEmail: async (payload: {
    contactNumber?: string;
    email?: string;
    userName?: string;
  }): Promise<ApiResponse> => {
    return apiRequest("/v1/auth/verify-contact-number", {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  // Resend OTP
  resendOTP: async (resendOtpData: resendOtpData): Promise<ApiResponse> => {
    return apiRequest("/v1/auth/resend-otp", {
      method: "POST",
      body: JSON.stringify(resendOtpData),
    });
  },

  // Google OAuth
  googleAuth: async (token: string): Promise<ApiResponse> => {
    return apiRequest("/v1/auth/google", {
      method: "POST",
      body: JSON.stringify({ token }),
    });
  },

  // Logout
  logout: async (): Promise<ApiResponse> => {
    return apiRequest("/v1/auth/logout", {
      method: "POST",
    });
  },

  // Get user profile
  getProfile: async (): Promise<ApiResponse> => {
    return apiRequest("/v1/profile", {
      method: "GET",
    });
  },

  // Forgot password
  forgotPassword: async (email: string): Promise<ApiResponse> => {
    return apiRequest("/v1/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },

  // Reset password
  resetPassword: async (token: string, passwordData: ResetPasswordData): Promise<ApiResponse> => {
    return apiRequest(`/v1/auth/reset-password/${token}`, {
      method: "PATCH",
      body: JSON.stringify(passwordData),
    });
  },

};

// Institution API methods
export const institutionAPI = {
  // Create institution
  createInstitution: async (
    institutionData: InstitutionData
  ): Promise<ApiResponse> => {
    return apiRequest("/v1/institutions", {
      method: "POST",
      body: JSON.stringify(institutionData),
    });
  },

  // Upload institution JSON file
  uploadInstitutionFile: async (file: File): Promise<ApiResponse> => {
    const formData = new FormData();
    formData.append("file", file);
    return apiRequest("/v1/institutions/upload", {
      method: "POST",
      body: formData,
    });
  },



  saveL1Details: async (formData: any, logoUrl: string): Promise<ApiResponse> => {
    const payload = {
      ...formData,
      logoUrl: logoUrl,
    };

    // Use the base apiRequest helper
    return apiRequest("/v1/institutions", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
};


// Utility functions for institution data management
export const getInstitutionId = (): string | null => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("institutionId");
  }
  return null;
};

export const getInstitutionType = (): string | null => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("institutionType");
  }
  return null;
};

export const clearInstitutionData = (): void => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("institutionId");
    localStorage.removeItem("institutionType");
  }
};

// Filter course fields based on institution type
const filterCourseFieldsByInstitutionType = (
  course: Record<string, unknown>,
  institutionType: string | null
) => {
  // Common fields for all institution types
  const commonFields = {
    id: course.id,
    courseName: course.courseName,
    aboutCourse: course.aboutCourse,
    courseDuration: course.courseDuration,
    mode: course.mode,
    priceOfCourse: course.priceOfCourse,
    location: course.location,
    image: course.image,
    brochure: course.brochure,
  };

  // Add institution-specific fields
  switch (institutionType) {
    case "Under Graduation/Post Graduation":
      return {
        ...commonFields,
        graduationType: course.graduationType,
        streamType: course.streamType,
        selectBranch: course.selectBranch,
        aboutBranch: course.aboutBranch,
        educationType: course.educationType,
        classSize: course.classSize,
      };

    case "Coaching centers":
      return {
        ...commonFields,
        categoriesType: course.categoriesType,
        domainType: course.domainType,
        subDomainType: course.subDomainType,
        courseHighlights: course.courseHighlights,
      };

    case "Study Halls":
      return {
        ...commonFields,
        seatingOption: course.seatingOption,
        openingTime: course.openingTime,
        closingTime: course.closingTime,
        operationalDays: course.operationalDays,
        totalSeats: course.totalSeats,
        availableSeats: course.availableSeats,
        pricePerSeat: course.pricePerSeat,
        hasWifi: course.hasWifi,
        hasChargingPoints: course.hasChargingPoints,
        hasAC: course.hasAC,
        hasPersonalLocker: course.hasPersonalLocker,
      };

    case "Tution Center's":
      return {
        ...commonFields,
        tuitionType: course.tuitionType,
        instructorProfile: course.instructorProfile,
        subject: course.subject,
        openingTime: course.openingTime,
        closingTime: course.closingTime,
        operationalDays: course.operationalDays,
        totalSeats: course.totalSeats,
        availableSeats: course.availableSeats,
        pricePerSeat: course.pricePerSeat,
      };

    case "Kindergarten/childcare center":
    case "School":
    case "Intermediate college(K12)":
      // These institution types only need common fields (basic course form)
      return commonFields;

    default:
      // If institution type is not recognized, send only common fields
      return commonFields;
  }
};

// L2DialogBox API methods
export const courseAPI = {
  /**
   * Create courses - accepts single course or array of courses
   * @param courseData - Single CourseData object or array of CourseData objects
   * @param institutionId - Optional institution ID (will use localStorage if not provided)
   * @returns Promise<ApiResponse>
   */

  createCourse: async (
    courseData: CourseData | CourseData[],
    institutionId?: string
  ): Promise<ApiResponse> => {
    // Use provided institutionId or get from localStorage
    const finalInstitutionId = institutionId || getInstitutionId();

    if (!finalInstitutionId) {
      return {
        success: false,
        message:
          "Institution ID not found. Please complete L1 (Institution Details) first.",
      };
    }

    // Convert single course to array for consistent processing
    const coursesArray = Array.isArray(courseData) ? courseData : [courseData];

    // Get institution type to filter relevant fields
    const institutionType = getInstitutionType();

    // Filter fields (remove invalid ones based on institution type)
    const filteredCourses = coursesArray.map((course) =>
      filterCourseFieldsByInstitutionType(course as unknown as Record<string, unknown>, institutionType)
    );

    // Create request payload
    const requestData = {
      courses: filteredCourses,
      totalCourses: filteredCourses.length,
      ...(institutionType && { institutionType }),
    };

    return apiRequest(`/v1/institutions/${finalInstitutionId}/courses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestData),
    });
  },

  /**
   * Create multiple courses (explicit function for better clarity)
   * @param coursesData - Array of CourseData objects
   * @param institutionId - Optional institution ID (will use localStorage if not provided)
   * @returns Promise<ApiResponse>
   */
  createCourses: async (
    coursesData: CourseData[],
  ): Promise<ApiResponse> => {
    const response = {
      courses : coursesData
    }
    return apiRequest(`/v1/course/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(response),
    });
  },

  // Update course
  updateCourse: async (
    courseId: number,
    courseData: Partial<CourseData>
  ): Promise<ApiResponse> => {
    const formData = new FormData();

    Object.entries(courseData).forEach(([key, value]) => {
      if (key === "image" || key === "brochure") {
        if (value instanceof File) {
          formData.append(key, value);
        }
      } else if (key === "operationalDays" && Array.isArray(value)) {
        formData.append(key, JSON.stringify(value));
      } else if (value !== null && value !== undefined) {
        formData.append(key, String(value));
      }
    });

    return apiRequest(`/v1/courses/${courseId}`, {
      method: "PUT",
      body: formData,
    });
  },

  // Get courses
  getCourses: async (): Promise<ApiResponse> => {
    return apiRequest("/v1/courses", {
      method: "GET",
    });
  },

  // Delete course
  deleteCourse: async (courseId: number): Promise<ApiResponse> => {
    return apiRequest(`/v1/courses/${courseId}`, {
      method: "DELETE",
    });
  },
};

export const branchAPI = {
  /**
   * Create branches - accepts single branch or array of branches
   * @param branchData - Single BranchData object or array of BranchData objects
   * @param institutionId - Optional institution ID (will use localStorage if not provided)
   * @returns Promise<ApiResponse>
   */
  createBranch: async (
    branchData: BranchData | BranchData[],
    institutionId?: string
  ): Promise<ApiResponse> => {
    // Use provided institutionId or get from localStorage
    const finalInstitutionId = institutionId || getInstitutionId();

    if (!finalInstitutionId) {
      return {
        success: false,
        message:
          "Institution ID not found. Please complete L1 (Institution Details) first.",
      };
    }

    // Convert single branch to array for consistent processing
    const branchesArray = Array.isArray(branchData) ? branchData : [branchData];

    // Create request payload
    const requestData = {
      branches: branchesArray,
      totalBranches: branchesArray.length,
    };

    return apiRequest(`/v1/institutions/${finalInstitutionId}/branches`, {
      method: "POST",
      body: JSON.stringify(requestData),
    });
  },

  /**
   * Create multiple branches (explicit function for better clarity)
   * @param branchesData - Array of BranchData objects
   * @param institutionId - Optional institution ID (will use localStorage if not provided)
   * @returns Promise<ApiResponse>
   */
  createBranches: async (
    branchesData: BranchData[],
    institutionId?: string
  ): Promise<ApiResponse> => {
    return branchAPI.createBranch(branchesData, institutionId);
  },

  // Update branch
  updateBranch: async (
    branchId: string,
    branchData: Partial<BranchData>,
    institutionId : string,
  ): Promise<ApiResponse> => {
    return apiRequest(`/v1/institutions/${institutionId}/branches/${branchId}`, {
      method: "PUT",
      body: JSON.stringify(branchData),
    });
  },

  // Get branches
  getBranches: async (institutionId: string): Promise<ApiResponse> => {
    return apiRequest("/v1/institutions/${institutionId}/branches", {
      method: "GET",
    });
  },

  getBranchesWithCursor: async (institutionId: string, cursor?: string | null, limit: number = 10) => {
    const params = new URLSearchParams({
      limit: String(limit),
      ...(cursor && { cursor }),
    });
    return apiRequest(`/v1/institutions/${institutionId}/branches?${params.toString()}`, {
      method: "GET",
    });
  },

  // Delete branch
  deleteBranch: async (
    branchId: number,
    institutionId :string
  ): Promise<ApiResponse> => {
    return apiRequest(`/v1/institutions/${institutionId}/branches/${branchId}`, {
      method: "DELETE",
    });
  },
};

// Union type for all institution detail data types
export type InstitutionDetailsData =
  | KindergartenData
  | SchoolData
  | CoachingData
  | CollegeData
  | UndergraduateData;

// L3DialogBox API methods
export const institutionDetailsAPI = {
  // Create institution details (unified endpoint)
  createInstitutionDetails: async (
    detailsData: InstitutionDetailsData
  ): Promise<ApiResponse> => {
    // Get institution type to include in the request
    // const institutionType = getInstitutionType();


    const requestData = {
      ...detailsData,
      // institutionType,
    };

    return apiRequest(`/v1/institutions/details`, {
      method: "PUT",
      body: JSON.stringify(requestData),
    });
  },

  // Get institution details
  getInstitutionDetails: async (): Promise<ApiResponse> => {
    return apiRequest("/v1/institution-details", {
      method: "GET",
    });
  },
};

// Dashboard data helpers (non-destructive additions)
// Cached loader for /v1/institutions/me to avoid repeated calls across dashboard
let __myInstitutionCache: unknown | null = null;
let __myInstitutionCacheAt = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const getMyInstitution = async (forceRefresh = false): Promise<unknown> => {
  try {
    // Check if cache is still valid (not expired)
    if (!forceRefresh && __myInstitutionCache && (Date.now() - __myInstitutionCacheAt) < CACHE_DURATION) {
      return __myInstitutionCache;
    }

    const res = await apiRequest<unknown>("/v1/institutions/me", { method: "GET" });
    const payload = res as { data?: unknown };
    const data = payload?.data || payload;
    __myInstitutionCache = data;
    __myInstitutionCacheAt = Date.now();
    return data;
  } catch (err) {
    // on error, do not clear existing cache; return what we have if present
    if (__myInstitutionCache) return __myInstitutionCache;
    throw err;
  }
};

export const refreshMyInstitution = async (): Promise<unknown> => {
  __myInstitutionCache = null;
  __myInstitutionCacheAt = 0;
  return getMyInstitution(true);
};

// Cache invalidation functions
export const clearMetricsCache = () => {
  metricsCache.clear();
};

export const clearEnquiriesCache = () => {
  enquiriesCache.clear();
};

export const clearAllCaches = () => {
  metricsCache.clear();
  enquiriesCache.clear();
  __myInstitutionCache = null;
  __myInstitutionCacheAt = 0;
};

// Analytics API helpers
export type TimeRangeParam = "weekly" | "monthly" | "yearly";

export const analyticsAPI = {
  getSummary: async (range: TimeRangeParam = "weekly"): Promise<ApiResponse> => {
    return apiRequest(`/v1/analytics/summary?range=${range}`, { method: "GET" });
  },
  getCoursePerformance: async (range: TimeRangeParam = "weekly"): Promise<ApiResponse> => {
    return apiRequest(`/v1/analytics/course-performance?range=${range}`, { method: "GET" });
  },
  getLeadTypes: async (range: TimeRangeParam = "weekly"): Promise<ApiResponse> => {
    return apiRequest(`/v1/analytics/lead-types?range=${range}`, { method: "GET" });
  },
  getSummaryPrevious: async (range: TimeRangeParam = "weekly"): Promise<ApiResponse> => {
    return apiRequest(`/v1/analytics/summary?range=${range}&compare=prev`, { method: "GET" });
  },
  // Unified analytics endpoint using AnalyticsDaily model
  getInstitutionAnalytics: async (
    metric: 'views' | 'comparisons' | 'leads',
    type: 'weekly' | 'monthly' | 'yearly'
  ): Promise<ApiResponse> => {
    // Note: Using POST method as GET requests cannot have a body in fetch API
    // Backend route should be changed from GET to POST to match this
    return apiRequest(`/v1/analytics/institution`, {
      method: "POST",
      body: JSON.stringify({ metric, type }),
    });
  }
};

// Unified metrics (views or comparisons) with caching
const metricsCache = new Map<string, { data: unknown; timestamp: number }>();
const METRICS_CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

export const metricsAPI = {
  increment: async (institutionId: string, courseId: string, metric: 'views' | 'comparisons'): Promise<ApiResponse> => {
    return apiRequest(`/v1/institutions/${institutionId}/courses/${courseId}/metrics?metric=${metric}`, { method: "POST" });
  },
  // Accept optional institutionId; if missing, resolve via getMyInstitution()
  getInstitutionAdminSummary: async (metric: 'views' | 'comparisons', institutionId?: string): Promise<ApiResponse> => {
    let iid = institutionId;
    if (!iid) {
      try {
        const inst = await getMyInstitution() as { _id?: string; data?: { _id?: string } };
        iid = inst?._id || inst?.data?._id;
      } catch (err) {
        if (process.env.NODE_ENV === 'development') console.error('metricsAPI.getInstitutionAdminSummary: resolve institution failed', err);
      }
    }
    if (!iid) throw new Error('institutionId not available');
    return apiRequest(`/v1/institutions/${iid}/courses/summary/metrics/institution-admin?metric=${metric}`, { method: "GET" });
  },
  getInstitutionAdminByRange: async (
    metric: 'views' | 'comparisons' | 'leads' | string,
    range: 'weekly' | 'monthly' | 'yearly',
    institutionId?: string
  ): Promise<ApiResponse> => {
    let iid = institutionId as string | undefined;
    if (!iid) {
      try {
        const inst = await getMyInstitution() as { _id?: string; data?: { _id?: string } };
        iid = inst?._id || inst?.data?._id;
      } catch (err) {
        if (process.env.NODE_ENV === 'development') console.error('metricsAPI.getInstitutionAdminByRange: resolve institution failed', err);
      }
    }
    if (!iid) throw new Error('institutionId not available');

    // Check cache first
    const cacheKey = `range_${iid}_${metric}_${range}`;
    const cached = metricsCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < METRICS_CACHE_DURATION) {
      return cached.data as ApiResponse<unknown>;
    }

    const response = await apiRequest(`/v1/institutions/${iid}/courses/summary/metrics/institution-admin/range?metric=${metric}&range=${range}`, { method: "GET" });

    // Cache the response
    metricsCache.set(cacheKey, { data: response, timestamp: Date.now() });

    return response;
  },
  getInstitutionAdminSeries: async (
    metric: 'views' | 'comparisons' | 'leads',
    year?: number,
    institutionId?: string
  ): Promise<ApiResponse> => {
    const currentYear = year || new Date().getFullYear();
    let iid = institutionId;
    if (!iid) {
      try {
        const inst = await getMyInstitution() as { _id?: string; data?: { _id?: string } };
        iid = inst?._id || inst?.data?._id;
      } catch (err) {
        if (process.env.NODE_ENV === 'development') console.error('metricsAPI.getInstitutionAdminSeries: resolve institution failed', err);
      }
    }
    if (!iid) throw new Error('institutionId not available');

    // Check cache first
    const cacheKey = `series_${iid}_${metric}_${currentYear}`;
    const cached = metricsCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < METRICS_CACHE_DURATION) {
      return cached.data as ApiResponse<unknown>;
    }

    const q = [`metric=${metric}`, `year=${currentYear}`];
    const response = await apiRequest(`/v1/institutions/${iid}/courses/summary/metrics/institution-admin/series?${q.join('&')}`, { method: "GET" });

    // Cache the response
    metricsCache.set(cacheKey, { data: response, timestamp: Date.now() });

    return response;
  }
};

// Enquiries API helpers with caching
const enquiriesCache = new Map<string, { data: ApiResponse; timestamp: number }>();
const ENQUIRIES_CACHE_DURATION = 1 * 60 * 1000; // 1 minute

export const enquiriesAPI = {
  getLeadsSummary: async (): Promise<ApiResponse> => {
    const cacheKey = 'leads_summary';
    const cached = enquiriesCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < ENQUIRIES_CACHE_DURATION) {
      return cached.data;
    }

    const response = await apiRequest(`/v1/enquiries/summary/leads`, { method: "GET" });
    enquiriesCache.set(cacheKey, { data: response, timestamp: Date.now() });
    return response;
  },
  getEnquiriesForChart: async (year?: number): Promise<ApiResponse> => {
    const currentYear = year || new Date().getFullYear();
    const cacheKey = `enquiries_chart_${currentYear}`;
    const cached = enquiriesCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < ENQUIRIES_CACHE_DURATION) {
      return cached.data;
    }

    const yearParam = year ? `?year=${year}` : "";
    const response = await apiRequest(`/v1/enquiries/chart${yearParam}`, { method: "GET" });
    enquiriesCache.set(cacheKey, { data: response, timestamp: Date.now() });
    return response;
  },
  getRecentEnquiries: async (): Promise<ApiResponse> => {
    const cacheKey = 'recent_enquiries';
    const cached = enquiriesCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < ENQUIRIES_CACHE_DURATION) {
      return cached.data;
    }

    const response = await apiRequest(`/v1/enquiries/recent`, { method: "GET" });
    enquiriesCache.set(cacheKey, { data: response, timestamp: Date.now() });
    return response;
  },
  getRecentEnquiriesWithOffset: async (offset: number, limit: number): Promise<ApiResponse> => {
    const q = [`offset=${Math.max(0, offset)}`, `limit=${Math.max(1, Math.min(100, limit))}`].join('&');
    return apiRequest(`/v1/enquiries/recent?${q}`, { method: "GET" });
  },
  // Students list for current institution admin's institutions
  getStudentsWithOffset: async (offset: number, limit: number): Promise<ApiResponse> => {
    const q = [`offset=${Math.max(0, offset)}`, `limit=${Math.max(1, Math.min(100, limit))}`].join('&');
    return apiRequest(`/v1/enquiries/students?${q}`, { method: "GET" });
  },
  // Students list for institution derived from a specific enquiry id
  getStudentsByEnquiryId: async (enquiryId: string, offset: number, limit: number): Promise<ApiResponse> => {
    const q = [`offset=${Math.max(0, offset)}`, `limit=${Math.max(1, Math.min(100, limit))}`].join('&');
    return apiRequest(`/v1/enquiries/students/by-enquiry/${encodeURIComponent(enquiryId)}?${q}`, { method: 'GET' });
  },
  getTypeSummary: async (range: 'weekly' | 'monthly' | 'yearly'): Promise<ApiResponse> => {
    const cacheKey = `type_summary_${range}`;
    const cached = enquiriesCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < ENQUIRIES_CACHE_DURATION) {
      return cached.data;
    }

    const response = await apiRequest(`/v1/enquiries/summary/types?range=${range}`, { method: "GET" });
    enquiriesCache.set(cacheKey, { data: response, timestamp: Date.now() });
    return response;
  },
  getTypeSummaryRollups: async (range: 'weekly' | 'monthly' | 'yearly', type?: 'callback' | 'demo'): Promise<ApiResponse> => {
    const q = [`range=${range}`];
    if (type) q.push(`type=${type}`);
    const cacheKey = `type_rollups_${range}_${type || 'all'}`;
    const cached = enquiriesCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < ENQUIRIES_CACHE_DURATION) {
      return cached.data;
    }

    const response = await apiRequest(`/v1/enquiries/summary/types/range?${q.join('&')}`, { method: "GET" });
    enquiriesCache.set(cacheKey, { data: response, timestamp: Date.now() });
    return response;
  },
  createEnquiry: async (enquiryData: {
    student: string;
    institution: string;
    programInterest: string;
    enquiryType: string;
  }): Promise<ApiResponse> => {
    return apiRequest(`/v1/enquiries/createEnquiry`, {
      method: "POST",
      body: JSON.stringify(enquiryData)
    });
  },
  updateEnquiryStatus: async (enquiryId: string, statusData: {
    status: string;
    notes?: string;
  }): Promise<ApiResponse> => {
    return apiRequest(`/v1/enquiries/${enquiryId}/status`, {
      method: "PUT",
      body: JSON.stringify(statusData)
    });
  }
};

// Programs API
const programsCache = new Map<string, { data: unknown; timestamp: number }>();
const PROGRAMS_CACHE_DURATION = 60 * 1000; // 1 min

export const programsAPI = {
  create: async (payload: Record<string, unknown>): Promise<ApiResponse> => {
    const institutionId = String(payload.institution || '');
    if (!institutionId) throw new Error('institution required');
    const normalized = { ...payload, type: payload?.type || 'PROGRAM' };
    const wrapper = { totalCourses: 1, courses: [normalized] };
    return apiRequest(`/v1/institutions/${encodeURIComponent(institutionId)}/courses`, { method: 'POST', body: JSON.stringify(wrapper) });
  },
  list: async (institutionId: string): Promise<ApiResponse> => {
    const cacheKey = `programs_${institutionId}`;
    const cached = programsCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < PROGRAMS_CACHE_DURATION) return cached.data as ApiResponse<unknown>;
    const res = await apiRequest(`/v1/institutions/${encodeURIComponent(institutionId)}/courses`, { method: 'GET' });
    const payload = res as { data?: unknown; courses?: unknown };
    const raw = payload?.data || payload?.courses || [];
    const arr = Array.isArray(raw) ? raw : Array.isArray((raw as { data?: unknown })?.data) ? (raw as { data: unknown[] }).data : [];
    const programs = arr.map((c: Record<string, unknown>) => ({ ...c, programName: c.programName || c.courseName || c.selectBranch }));
    const shaped = { success: true, data: { programs } } as ApiResponse;
    programsCache.set(cacheKey, { data: shaped, timestamp: Date.now() });
    return shaped;
  },
  listForInstitutionAdmin: async (institutionId: string): Promise<ApiResponse> => {
    return programsAPI.list(institutionId);
  },
  listForInstitutionAdminWithMetrics: async (institutionId: string): Promise<ApiResponse> => {
    // Use list() and attach placeholder metrics if none
    const res = await programsAPI.list(institutionId) as { data?: { programs?: Record<string, unknown>[] } };
    const programs = (res?.data?.programs || []).map((p: Record<string, unknown>) => ({
      ...p,
      leadsGenerated: typeof p.leadsGenerated === 'number' ? p.leadsGenerated : 0,
      status: p.status || 'Live',
      startDate: p.startDate || p.createdAt,
      endDate: p.endDate || p.updatedAt,
    }));
    return { success: true, data: { programs } } as ApiResponse;
  },
  listBranchesForInstitutionAdmin: async (institutionId: string): Promise<ApiResponse> => {
    const res = await apiRequest(`/v1/institutions/${encodeURIComponent(institutionId)}/branches`, { method: 'GET' });
    const payload = res as { data?: unknown } | unknown[];
    const branches = Array.isArray((payload as { data?: unknown })?.data) ? (payload as { data: unknown[] }).data : (Array.isArray(payload) ? payload : []);
    return { success: true, data: { branches } } as ApiResponse;
  },
  update: async (programId: string, payload: Record<string, unknown> & { institution?: string }): Promise<ApiResponse> => {
    const institutionId = String(payload?.institution || '');
    if (!institutionId) throw new Error('institution required');
    return apiRequest(`/v1/institutions/${encodeURIComponent(institutionId)}/courses/${encodeURIComponent(programId)}`, { method: 'PUT', body: JSON.stringify(payload) });
  },
  remove: async (programId: string, institutionId: string): Promise<ApiResponse> => {
    return apiRequest(`/v1/institutions/${encodeURIComponent(institutionId)}/courses/${encodeURIComponent(programId)}`, { method: 'DELETE' });
  },
  incrementViews: async (programId: string, institutionId: string): Promise<ApiResponse> => {
    const qs = new URLSearchParams({ metric: 'views' }).toString();
    return apiRequest(`/v1/institutions/${encodeURIComponent(institutionId)}/courses/${encodeURIComponent(programId)}/metrics?${qs}`, { method: 'POST' });
  },
  summaryViews: async (institutionId: string, range: 'weekly' | 'monthly' | 'yearly'): Promise<ApiResponse> => {
    const cacheKey = `program_summary_${institutionId}_${range}`;
    const cached = programsCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < PROGRAMS_CACHE_DURATION) return cached.data as ApiResponse<unknown>;
    const qs = new URLSearchParams({ metric: 'views', range }).toString();
    const res = await apiRequest(`/v1/institutions/${encodeURIComponent(institutionId)}/courses/summary/metrics/institution-admin?${qs}`, { method: 'GET' });
    programsCache.set(cacheKey, { data: res, timestamp: Date.now() });
    return res;
  },
  summaryComparisons: async (institutionId: string, range: 'weekly' | 'monthly' | 'yearly'): Promise<ApiResponse> => {
    const cacheKey = `program_cmp_${institutionId}_${range}`;
    const cached = programsCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < PROGRAMS_CACHE_DURATION) return cached.data as ApiResponse<unknown>;
    const qs = new URLSearchParams({ metric: 'comparisons', range }).toString();
    const res = await apiRequest(`/v1/institutions/${encodeURIComponent(institutionId)}/courses/summary/metrics/institution-admin?${qs}`, { method: 'GET' });
    programsCache.set(cacheKey, { data: res, timestamp: Date.now() });
    return res;
  },
  viewsSeries: async (institutionId: string, year?: number): Promise<ApiResponse> => {
    const y = year || new Date().getFullYear();
    const cacheKey = `program_series_${institutionId}_${y}`;
    const cached = programsCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < PROGRAMS_CACHE_DURATION) return cached.data as ApiResponse<unknown>;
    const qs = new URLSearchParams({ metric: 'views', year: String(y) }).toString();
    const res = await apiRequest(`/v1/institutions/${encodeURIComponent(institutionId)}/courses/summary/metrics/institution-admin/series?${qs}`, { method: 'GET' });
    programsCache.set(cacheKey, { data: res, timestamp: Date.now() });
    return res;
  },

  subscriptionHistory: async (institutionId: string): Promise<ApiResponse> => {
    // Use unified institutions scope with single controller/routes; fallback safe
    try {
      return await apiRequest(`/v1/institutions/${encodeURIComponent(institutionId)}/subscriptions/history`, { method: 'GET' });
    } catch {
      return { success: true, data: { items: [] } } as ApiResponse;
    }
  },
  downloadInvoicePdf: async (subscriptionId: string): Promise<Blob> => {
    // Placeholder: hook to your backend PDF endpoint if implemented
    const res = await apiRequest(`/v1/payment/invoice/${encodeURIComponent(subscriptionId)}`, { method: 'GET' });
    return res as unknown as Blob;
  },
  invalidateCache: (institutionId?: string): void => {
    if (!programsCache.size) return;
    if (!institutionId) {
      programsCache.clear();
      return;
    }
    const keys = Array.from(programsCache.keys());
    keys.forEach((key) => {
      if (key.includes(institutionId)) {
        programsCache.delete(key);
      }
    });
  }
};

// Notifications API helpers
export const notificationsAPI = {
  list: async (params: {
    scope?: 'student' | 'institution' | 'branch' | 'admin';
    studentId?: string;
    institutionId?: string;
    branchId?: string;
    institutionAdminId?: string;
    page?: number;
    limit?: number;
    cursor?: string | null;
    unread?: boolean;
    category?: string;
  } = {}): Promise<ApiResponse> => {
    const q: string[] = [];
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) q.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
    });
    const qs = q.length ? `?${q.join('&')}` : '';
    return apiRequest(`/v1/notifications${qs}`, { method: 'GET' });
  },
  listCursor: async (params: {
    scope?: 'student' | 'institution' | 'branch' | 'admin';
    studentId?: string;
    institutionId?: string;
    branchId?: string;
    institutionAdminId?: string;
    limit?: number;
    cursor?: string | null;
    unread?: boolean;
    category?: string;
  } = {}): Promise<ApiResponse> => {
    const q: string[] = [];
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) q.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
    });
    const qs = q.length ? `?${q.join('&')}` : '';
    return apiRequest(`/v1/notifications${qs}`, { method: 'GET' });
  },
  create: async (payload: {
    title: string;
    description?: string;
    category?: string;
    recipientType: 'STUDENT' | 'INSTITUTION' | 'BRANCH' | 'ADMIN' | 'SYSTEM';
    student?: string;
    institution?: string;
    branch?: string;
    institutionAdmin?: string;
    metadata?: Record<string, unknown>;
  }): Promise<ApiResponse> => {
    return apiRequest(`/v1/notifications`, { method: 'POST', body: JSON.stringify(payload) });
  },
  markRead: async (ids: string[]): Promise<ApiResponse> => {
    return apiRequest(`/v1/notifications/read`, { method: 'POST', body: JSON.stringify({ ids }) });
  },
  remove: async (ids: string[]): Promise<ApiResponse> => {
    return apiRequest(`/v1/notifications`, { method: 'DELETE', body: JSON.stringify({ ids }) });
  },
  // Get count of unread notifications for current user
  getUnreadCount: async (): Promise<ApiResponse<{ count: number }>> => {
    return apiRequest(`/v1/notifications/unread-count`, { method: 'GET' });
  },
  // Mark all notifications as read for current user
  markAllRead: async (): Promise<ApiResponse<{ modifiedCount: number }>> => {
    return apiRequest(`/v1/notifications/mark-all-read`, { method: 'PATCH' });
  }
};

export const getInstitutionBranches = async (
  institutionId: string
): Promise<unknown[]> => {
  const res = await apiRequest<unknown>(
    `/v1/institutions/${institutionId}/branches`,
    { method: "GET" }
  );
  const payload = res as { data?: unknown[] } | unknown[];
  if (payload && Array.isArray((payload as { data?: unknown[] }).data)) return (payload as { data: unknown[] }).data;
  if (Array.isArray(payload)) return payload;
  return [];
};

export const getInstitutionCourses = async (
  institutionId: string
): Promise<unknown[]> => {
  const res = await apiRequest<unknown>(
    `/v1/institutions/${institutionId}/courses`,
    { method: "GET" }
  );
  const payload = res as { data?: unknown[] } | unknown[];
  if (payload && Array.isArray((payload as { data?: unknown[] }).data)) return (payload as { data: unknown[] }).data;
  if (Array.isArray(payload)) return payload;
  return [];
};

export const paymentAPI = {
  /**
   * Initiate a payment on the backend
   * - Sends the payable amount and optional context to create an order/session
   */
  initiatePayment: async (
    payload: PaymentInitPayload
  ): Promise<ApiResponse> => {
    return apiRequest("/v1/payment/create-order", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  /**
   * Initiate a FREE listing (₹0 payment) for selected courses
   * - Creates a Razorpay order with amount 0
   * - Courses will be activated with limited features
   */
  initiateFreeListing: async (
    payload: { courseIds: string[] }
  ): Promise<ApiResponse> => {
    return apiRequest("/v1/payment/create-order", {
      method: "POST",
      body: JSON.stringify({
        amount: 0,
        planType: "free",
        courseIds: payload.courseIds,
        listingType: "free", // Backend will use this to mark courses as limited
      }),
    });
  },

  /**
   * Apply coupon to get discount amount from backend
   */
  applyCoupon: async (code: string): Promise<ApiResponse<{ discountAmount: number }>> => {
    return apiRequest("/v1/coupon/apply-coupon", {
      method: "POST",
      body: JSON.stringify({ code }),
    });
  },

  getPaymentDetails: async (): Promise<ApiResponse<{ totalInactiveCourses?: number; totalAmount?: number; planPrice?: number; pricePerCourse?: number }>> => {
    return apiRequest("/v1/payment/details", {
      method: "GET",
    });
  },

  /**
   * Verify Razorpay payment on backend with polling until status is final
   * - Polls the backend until message is "active" or "expired"
   * - Treats intermediate "pending" as continue polling
   */
  verifyPayment: async (
    payload: PaymentVerifyPayload,
    options?: { intervalMs?: number; timeoutMs?: number }
  ): Promise<ApiResponse> => {
    const intervalMs = options?.intervalMs ?? 2000; // 2s poll interval
    const timeoutMs = options?.timeoutMs ?? 120000; // 2 min timeout
    const start = Date.now();
    let lastRes: ApiResponse | null = null;

    while (Date.now() - start < timeoutMs) {
      // Build query string for GET verification (preserves original method)
      const qs = new URLSearchParams({
        orderId: payload.orderId,
        paymentId: payload.paymentId,
        signature: payload.signature,
        ...(payload.planType ? { planType: payload.planType } : {}),
        ...(payload.coupon ? { coupon: String(payload.coupon) } : {}),
        ...(typeof payload.amount !== "undefined" ? { amount: String(payload.amount) } : {}),
      }).toString();
      const endpoint = `/v1/payment/verify-payment?${qs}`;

      lastRes = await apiRequest(endpoint, {
        method: "GET",
      });

      const statusMsg = (lastRes.message || "").toLowerCase();

      // Break on final states
      if (statusMsg === "active" || statusMsg === "expired") {
        return lastRes;
      }

      // Continue polling on pending/unknown states
      await new Promise((r) => setTimeout(r, intervalMs));
    }

    // Timed out waiting for final status
    return {
      success: false,
      message: "verification_timeout",
      data: lastRes?.data,
    };
  },

  /**
   * Build receipt URL for opening/downloading receipt
   */
  getReceiptUrl: (q: { transactionId?: string | null; paymentId?: string | null; orderId?: string | null }): string => {
    const params = new URLSearchParams({
      ...(q.paymentId ? { paymentId: q.paymentId } : {}),
      ...(q.orderId ? { orderId: q.orderId } : {}),
      ...(q.transactionId ? { transactionId: q.transactionId } : {}),
    }).toString();
    return `${API_BASE_URL}/v1/payment/receipt?${params}`;
  },

  /**
   * Optional helper to programmatically download receipt as file
   */
  downloadReceiptFile: async (
    q: { transactionId?: string | null; paymentId?: string | null; orderId?: string | null },
    filename = "receipt.pdf"
  ): Promise<ApiResponse> => {
    try {
      const url = paymentAPI.getReceiptUrl(q);
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) {
        return { success: false, message: `Failed to download receipt (${res.status})` };
      }
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);
      return { success: true, message: "Receipt downloaded" };
    } catch (e) {
      return { success: false, message: e instanceof Error ? e.message : "Download failed" };
    }
  },
};