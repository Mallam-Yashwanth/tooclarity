// utility.ts
import {
  getAllInstitutionsFromDB,
  getCoursesGroupsByBranchName,
} from "@/lib/localDb"; // update import paths
import { institutionAPI, type ApiResponse } from "@/lib/api";
import { useUserStore } from "@/lib/user-store";

/**
 * Fetch institution + courses and wrap into a JSON File
 */
export async function exportInstitutionAndCoursesToFile(): Promise<File> {
  // 1) Fetch all institutions (should usually be only 1 latest)
  const institutions = await getAllInstitutionsFromDB();
  const latestInstitution =
    institutions.length > 0
      ? institutions.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))[0]
      : null;

  const sanitizedInstitution = latestInstitution
    ? (() => {
        const { logoPreviewUrl, ...restInstitution } = latestInstitution;
        return restInstitution;
      })()
    : null;

  // 2) Fetch all courses grouped by branch
  const coursesGroups = await getCoursesGroupsByBranchName();

  const sanitizedCourses = coursesGroups.map((branch: any) => {
    const { id, createdAt, ...branchRest } = branch;
    return {
      ...branchRest,
      courses: branch.courses.map((course: any) => {
        const { id, image, imagePreviewUrl, brochure, brochurePreviewUrl, ...courseRest } = course;
        return courseRest;
      }),
    };
  });
  // 3) Build final JSON
  const exportData = {
    institution: sanitizedInstitution,
    courses: sanitizedCourses,
    exportedAt: new Date().toISOString(),
  };

  console.log(exportData);

  // 4) Convert to file
  const jsonString = JSON.stringify(exportData, null, 2);
  const file = new File([jsonString], "institution_and_courses.json", {
    type: "application/json",
  });

  return file;
}

/**
 * Export institution + courses to a JSON file and upload to backend
 */
export async function exportAndUploadInstitutionAndCourses(): Promise<ApiResponse> {
  const file = await exportInstitutionAndCoursesToFile();

  // return institutionAPI.uploadInstitutionFile(file);
  const response = await institutionAPI.uploadInstitutionFile(file);

  if (response.success) {
    // ✅ Clear localStorage
    localStorage.clear();
    // ✅ Delete IndexedDB database "tooclarity"
    indexedDB.deleteDatabase("tooclarity");

    // ✅ Mark profile as completed in Zustand store so routing can proceed to payment
    try {
      useUserStore.getState().setProfileCompleted(true);
      console.log("[Utility] isProfileCompleted set to true in store");
    } catch (e) {
      console.warn("[Utility] Failed to set isProfileCompleted in store:", e);
    }
  }

  return response;
}

/**
 * Check if a program/course is currently active based on startDate and endDate
 */
export function isProgramActive(startDate: string, endDate: string): boolean {
  if (!startDate || !endDate) return false;
  
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Check if dates are valid
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return false;
  
  // Program is active if current date is between start and end date
  return now >= start && now <= end;
}

/**
 * Get program status with additional context
 */
export function getProgramStatus(startDate: string, endDate: string): {
  status: 'active' | 'inactive' | 'upcoming' | 'expired' | 'invalid';
  message: string;
  daysRemaining?: number;
} {
  if (!startDate || !endDate) {
    return {
      status: 'invalid',
      message: 'Invalid dates'
    };
  }
  
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Check if dates are valid
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return {
      status: 'invalid',
      message: 'Invalid date format'
    };
  }
  
  if (now < start) {
    const daysUntilStart = Math.ceil((start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return {
      status: 'upcoming',
      message: `Starts in ${daysUntilStart} days`,
      daysRemaining: daysUntilStart
    };
  }
  
  if (now > end) {
    const daysSinceEnd = Math.ceil((now.getTime() - end.getTime()) / (1000 * 60 * 60 * 24));
    return {
      status: 'expired',
      message: `Ended ${daysSinceEnd} days ago`
    };
  }
  
  const daysRemaining = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return {
    status: 'active',
    message: `${daysRemaining} days remaining`,
    daysRemaining
  };
}

/**
 * Format date for display
 */
export function formatDate(dateString: string): string {
  if (!dateString) return 'Not set';
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Invalid date';
  
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}