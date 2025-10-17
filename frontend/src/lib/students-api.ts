// Student-specific API configuration placeholder

import { API_BASE_URL, apiRequest, type ApiResponse } from "./api";

export type StudentApiResponse<T = unknown> = ApiResponse<T>;

// This helper mirrors the admin API setup but leaves implementation stubs for now
async function studentApiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<StudentApiResponse<T>> {
  // Delegate to shared request helper to keep behavior consistent
  return apiRequest<T>(endpoint, options);
}

// ===== Student Authentication Types =====
export interface StudentLoginData {
  email: string;
  password: string;
}

// ===== Student Dashboard Types =====
export interface StudentProfile {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string;
  profilePicture?: string;
  birthday?: string; // ISO or raw string if backend provides
}

export interface StudentCourse {
  id: string;
  title: string;
  progress: number; // 0-100
  enrolledAt: string;
  completedAt?: string | null;
}

export interface StudentListParams {
  search?: string;
  page?: number;
  limit?: number;
}

// ===== Onboarding types =====
export interface CreateStudentPayload {
  name: string;
  email: string;
  contactNumber?: string;
  address?: string;
  googleId?: string;
}

export interface UpdateAcademicProfilePayload {
  profileType:
    | "KINDERGARTEN"
    | "SCHOOL"
    | "INTERMEDIATE"
    | "GRADUATION"
    | "COACHING_CENTER"
    | "STUDY_HALLS"
    | "TUITION_CENTER"
    | "STUDY_ABROAD";
  details: any;
}

// ===== Course Types for Student Dashboard =====
export interface CourseForStudent {
  _id: string;
  id?: string;
  courseName: string;
  aboutCourse?: string;
  priceOfCourse?: number;
  mode?: "Offline" | "Online" | "Hybrid";
  imageUrl?: string;
  brochureUrl?: string;
  startDate?: string;
  endDate?: string;
  courseDuration?: string;
  location?: string;
  institution?: {
    _id: string;
    instituteName: string;
  };
  rating?: number;
  reviews?: number;
  studentsEnrolled?: number;
}

// ===== Student Dashboard API (stubs) =====
export const studentDashboardAPI = {
  // Fetch the current user's profile (shared profile endpoint)
  getProfile: async (): Promise<StudentApiResponse<StudentProfile>> => {
    const res = await studentApiRequest<any>("/v1/profile", { method: "GET" });
    // Normalize shape to StudentProfile best-effort
    const data: any = (res as any)?.data || res?.data || res;
    const normalized: StudentProfile = {
      id: data?.id || data?._id || "",
      name: data?.name || "",
      email: data?.email || "",
      phoneNumber: data?.contactNumber,
      profilePicture: data?.profilePicture, // backend may use ProfilePicture
      birthday: data?.birthday, // if backend provides
    };
    return { success: true, message: "ok", data: normalized } as StudentApiResponse<StudentProfile>;
  },

  // Fetch all visible courses (public endpoint - no auth required)
  getVisibleCourses: async (): Promise<StudentApiResponse<CourseForStudent[]>> => {
    return studentApiRequest<CourseForStudent[]>("/v1/public/courses", {
      method: "GET",
    });
  },

  // Fetch courses the student is enrolled in
  listCourses: async (
    params: StudentListParams = {}
  ): Promise<StudentApiResponse<{ items: StudentCourse[]; total: number }>> => {
    const query = new URLSearchParams();
    if (params.search) query.set("search", params.search);
    if (params.page) query.set("page", String(params.page));
    if (params.limit) query.set("limit", String(params.limit));
    const qs = query.toString();

    return studentApiRequest(`/v1/student/courses${qs ? `?${qs}` : ""}`, {
      method: "GET",
    });
  },

  // Update student profile details
  updateProfile: async (
    payload: Partial<StudentProfile>
  ): Promise<StudentApiResponse<StudentProfile>> => {
    return studentApiRequest("/v1/student/profile", {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },
};

// ===== Onboarding API =====
export const studentOnboardingAPI = {
  createStudent: async (
    payload: CreateStudentPayload
  ): Promise<StudentApiResponse<any>> => {
    return studentApiRequest("/v1/students", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  updateAcademicProfile: async (
    studentId: string,
    payload: UpdateAcademicProfilePayload
  ): Promise<StudentApiResponse<any>> => {
    return studentApiRequest(`/v1/students/${encodeURIComponent(studentId)}/academic-profile`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },
};

// ===== Student Authentication API =====
export const studentAuthAPI = {
  // Student login
  login: async (loginData: StudentLoginData): Promise<StudentApiResponse> => {
    return studentApiRequest("/v1/student/auth/login", {
      method: "POST",
      body: JSON.stringify(loginData),
    });
  },
};