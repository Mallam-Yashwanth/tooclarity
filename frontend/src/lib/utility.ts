import {
  getAllInstitutionsFromDB,
  getCoursesGroupsByBranchName,
} from "@/lib/localDb";
import { institutionAPI, type ApiResponse } from "@/lib/api";
import { useUserStore } from "@/lib/user-store";

/**
 * List of institutional-level fields that are now merged into L2 courses
 * but need to be sent as part of the Institution object to the backend.
 */
const INSTITUTION_LEVEL_FIELDS = [
  "schoolType", "curriculumType", "schoolCategory", "hostelFacility", "playground",
  "busService", "otherActivities", "extendedCare", "mealsProvided", "outdoorPlayArea",
  "placementDrives", "mockInterviews", "resumeBuilding", "linkedinOptimization",
  "exclusiveJobPortal", "certification", "ownershipType", "affiliationType", "library",
  "entranceExam", "managementQuota", "applicationAssistance", "visaProcessingSupport",
  "testOperation", "preDepartureOrientation", "accommodationAssistance", "educationLoans",
  "postArrivalSupport", "openingTime", "closingTime", "operationalDays"
];

// For dynamic field extraction
type InstitutionalFields = Record<string, unknown>;

// The structure of a Course as stored in LocalDB
interface CourseRecord extends Record<string, unknown> {
  id?: number | string;
}

// The structure of a Branch Group as returned by getCoursesGroupsByBranchName
interface BranchGroup {
  id?: number | string;
  createdAt?: number | string;
  branchName: string;
  courses: CourseRecord[];
}

/**
 * Fetch institution + courses and wrap into a JSON File
 */
export async function exportInstitutionAndCoursesToFile(): Promise<File> {
  // 1) Fetch all institutions (L1 data)
  const institutions = await getAllInstitutionsFromDB();
  const latestInstitution =
    institutions.length > 0
      ? institutions.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))[0]
      : null;

  // 2) Fetch all courses grouped by branch (Contains merged L2 + L3 data)
  const coursesGroups = (await getCoursesGroupsByBranchName()) as unknown as BranchGroup[];

  // 3) Extract Institutional metadata from the first available course
  // Since institutional facilities are the same for the whole institute, we pick them from the first course.
  const extractedInstitutionalData: InstitutionalFields = {};
  
  if (coursesGroups.length > 0 && coursesGroups[0].courses.length > 0) {
    const firstCourse = coursesGroups[0].courses[0];
    INSTITUTION_LEVEL_FIELDS.forEach((field) => {
      if (firstCourse[field] !== undefined) {
        extractedInstitutionalData[field] = firstCourse[field];
      }
    });
  }

  const finalInstitution = {
    ...(latestInstitution || {}),
    ...extractedInstitutionalData,
  };

  // 4) Sanitize courses: Remove the institutional metadata from individual course objects
  // and remove IDs to prevent backend conflicts.
  const sanitizedCourses = coursesGroups.map((branch: BranchGroup) => {
    const { id, createdAt, ...branchRest } = branch;
    return {
      ...branchRest,
      courses: branch.courses.map((course: CourseRecord) => {
        const { id, ...courseRest } = course;
        
        // Remove fields that we moved to the institution level
        INSTITUTION_LEVEL_FIELDS.forEach((f) => delete courseRest[f]);
        
        return courseRest;
      }),
    };
  });

  // 5) Build final JSON structure
  const exportData = {
    institution: finalInstitution,
    courses: sanitizedCourses,
    exportedAt: new Date().toISOString(),
  };

  console.log("Final Merged Export Data:", exportData);

  // 6) Convert to file
  const jsonString = JSON.stringify(exportData, null, 2);
  return new File([jsonString], "institution_and_courses.json", {
    type: "application/json",
  });
}

/**
 * Export institution + courses to a JSON file and upload to backend
 */
export async function exportAndUploadInstitutionAndCourses(): Promise<ApiResponse> {
  try {
    const file = await exportInstitutionAndCoursesToFile();
    const response = await institutionAPI.uploadInstitutionFile(file);

    if (response.success) {
      // ✅ Cleanup: Clear process-related localStorage items
      localStorage.removeItem("institutionType");
      localStorage.removeItem("selected");
      localStorage.removeItem("signupStep");
      localStorage.removeItem("institutionId");

      // ✅ Cleanup: Delete IndexedDB database
      try {
        const deleteRequest = indexedDB.deleteDatabase("tooclarity");
        deleteRequest.onerror = () => console.warn("Could not delete IndexedDB 'tooclarity'");
      } catch (err) {
        console.error("IndexedDB deletion error:", err);
      }

      // ✅ Update Zustand store so routing can proceed to payment
      try {
        useUserStore.getState().setProfileCompleted(true);
        console.log("[Utility] Profile marked as completed in store");
      } catch (e) {
        console.warn("[Utility] Failed to update Zustand store:", e);
      }
    }

    return response;
  } catch (error) {
    console.error("Export/Upload process failed:", error);
    return {
      success: false,
      message: "An error occurred during the final submission. Please try again.",
    } as ApiResponse;
  }
}

/**
 * Check if a program/course is currently active based on startDate and endDate
 */
export function isProgramActive(startDate: string, endDate: string): boolean {
  if (!startDate || !endDate) return false;
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return false;
  return now >= start && now <= end;
}

/**
 * Get program status with additional context
 */
export function getProgramStatus(startDate: string, endDate: string) {
  if (!startDate || !endDate) return { status: 'invalid', message: 'Invalid dates' };
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return { status: 'invalid', message: 'Invalid date format' };
  
  if (now < start) {
    const daysUntilStart = Math.ceil((start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return { status: 'upcoming', message: `Starts in ${daysUntilStart} days`, daysRemaining: daysUntilStart };
  }
  if (now > end) {
    const daysSinceEnd = Math.ceil((now.getTime() - end.getTime()) / (1000 * 60 * 60 * 24));
    return { status: 'expired', message: `Ended ${daysSinceEnd} days ago` };
  }
  const daysRemaining = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return { status: 'active', message: `${daysRemaining} days remaining`, daysRemaining };
}

/**
 * Format date for display
 */
export function formatDate(dateString: string): string {
  if (!dateString) return 'Not set';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Invalid date';
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}