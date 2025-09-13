// utility.ts
import {
  getAllInstitutionsFromDB,
  getCoursesGroupsByBranchName,
} from "@/lib/localDb"; // update import paths
import { institutionAPI, type ApiResponse } from "@/lib/api";

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

  // 2) Fetch all courses grouped by branch
  const coursesGroups = await getCoursesGroupsByBranchName();

  const sanitizedCourses = coursesGroups.map((branch: any) => {
    const { id, createdAt, ...branchRest } = branch;
    return {
      ...branchRest,
      courses: branch.courses.map((course: any) => {
        const { id, ...courseRest } = course;
        return courseRest;
      }),
    };
  });
  // 3) Build final JSON
  const exportData = {
    institution: latestInstitution,
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
  }

  return response;
}
