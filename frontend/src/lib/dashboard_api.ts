import { apiRequest, getMyInstitution, getInstitutionBranches, getInstitutionCourses } from "./api"; // For standard JSON requests and unified helpers

// --- Local Type Definitions ---

/**
 * A generic shape for API responses that return JSON.
 */
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}

/**
 * Defines the shape of a single course from the backend.
 */
export interface CourseData {
  _id: string;
  institution: string;
  branch?: string;
  courseName?: string;
  // ... other fields
}

/**
 * Defines the shape of a single branch from the backend.
 */
export interface BranchData {
  _id: string;
  branchName: string;
  contactInfo: string;
  branchAddress: string;
  institution: string;
  // ... other fields
}

/**
 * Defines the shape of the data object returned by the
 * paginated dashboard details endpoint.
 */
export interface DashboardDetailsResponse {
  courses: CourseData[];
  branches: BranchData[];
}

export interface CourseUpdateData {
  courseId?: string | null;
  [key: string]: any; 
}

// --- Local API Helper for Files ---

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

/**
 * A specialized helper for fetching file/blob responses.
 */
async function apiFileRequest(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const url = `${API_BASE_URL}${endpoint}`;
  try {
    const response = await fetch(url, {
      ...options,
      credentials: 'include',
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Request for file failed' }));
      const msg = String(errorData.message || '').toLowerCase();
      if (msg.includes('no institution found')) {
        const fallback = { institution: null, branchesWithCourses: [] };
        const blob = new Blob([JSON.stringify(fallback)], { type: 'application/json' });
        // Return a synthetic successful Response so callers can proceed normally
        return new Response(blob, { status: 200, statusText: 'OK' });
      }
      throw new Error(errorData.message);
    }
    return response;
  } catch (error) {
    console.error("API File Request Error:", error);
    throw error;
  }
}


// --- Main Exported API Object ---

export const dashboardAPI = {
  /**
   * Fetches the list of dashboard details (uses the main JSON helper).
   */
  getDashboardDetails: async (): Promise<ApiResponse<DashboardDetailsResponse>> => {
    return apiRequest("/v1/dashboard/details");
  },

  /**
   * Fetches the FULL, structured dashboard data as a File object.
   */
  getFullDashboardDetails: async (): Promise<File> => {
    try {
      // Calls the local helper for files
      const response = await apiFileRequest("/v1/dashboard/get-entire-details", {
        method: "GET",
      });
      
      const blob = await response.blob();
      const file = new File([blob], "full_dashboard_details.json", { type: "application/json" });
      
      return file;
    } catch (error) {
      console.error("Error in getFullDashboardDetails API call:", error);
      // Gracefully handle missing/legacy endpoint by synthesizing from unified course backend
      try {
        // 1) Resolve current institution (unified backend)
        const institution: any = await getMyInstitution().catch(() => null);
        if (!institution || !institution._id) {
          const fallback = { institution: null, branchesWithCourses: [] };
          const blob = new Blob([JSON.stringify(fallback)], { type: "application/json" });
          return new File([blob], "full_dashboard_details.json", { type: "application/json" });
        }

        // 2) Fetch branches and courses scoped to institution
        const [branches, courses] = await Promise.all([
          getInstitutionBranches(institution._id).catch(() => []),
          getInstitutionCourses(institution._id).catch(() => []),
        ]);

        // 3) Shape into expected structure
        const branchesWithCourses = (Array.isArray(branches) ? branches : []).map((b: any) => ({
          ...b,
          courses: (Array.isArray(courses) ? courses : []).filter((c: any) => {
            const branchId = c.branch || c.branch?._id;
            return branchId && String(branchId) === String(b._id);
          }),
        }));

        const shaped = { institution, branchesWithCourses };
        const blob = new Blob([JSON.stringify(shaped)], { type: "application/json" });
        return new File([blob], "full_dashboard_details.json", { type: "application/json" });
      } catch (fallbackErr) {
        console.error("Fallback synthesis for getFullDashboardDetails failed:", fallbackErr);
        const fallback = { institution: null, branchesWithCourses: [] };
        const blob = new Blob([JSON.stringify(fallback)], { type: "application/json" });
        return new File([blob], "full_dashboard_details.json", { type: "application/json" });
      }
    }
  },

  // Other functions using the main JSON helper
  sendVerificationOTP: async (): Promise<ApiResponse> => {
    return apiRequest("/v1/dashboard/send-password-otp", { method: "POST" });
  },

  verifyActionOTP: async (otp: string): Promise<ApiResponse> => {
    return apiRequest("/v1/dashboard/verify-password-otp", {
      method: "POST",
      body: JSON.stringify({ otp }),
    });
  },

  updatePassword: async (newPassword: string): Promise<ApiResponse> => {
    return apiRequest("/v1/dashboard/update-password", {
      method: "POST",
      body: JSON.stringify({ newPassword }),
    });
  },
  updateInstitutionAndCourse: async (
    institutionId: number,
    data: CourseUpdateData
  ): Promise<ApiResponse> => {
    // Align to unified Course backend (single controller/routes). Requires courseId in payload.
    const courseId = data.courseId;
    return apiRequest(`/v1/institutions/${institutionId}/courses/${courseId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
  },
};