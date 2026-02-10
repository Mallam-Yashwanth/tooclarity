"use client";

import React, { useState, Suspense, useEffect } from "react";
import { motion } from "framer-motion";
import { _Card, _CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth-context";
import { useInfiniteBranches, useInfinitePrograms, useInstitution, useProgramsList } from "@/lib/hooks/dashboard-hooks";
import { programsAPI, getMyInstitution, branchAPI } from "@/lib/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faPhone, faMapMarkerAlt, faLink, faLocationArrow, faTrashAlt, faEdit } from "@fortawesome/free-solid-svg-icons";
import L2DialogBox from "@/components/auth/L2DialogBox";
import { toast } from "react-toastify";
import { useSearchParams, usePathname, useRouter } from "next/navigation";



interface BranchDetail {
  _id: string;
  branchName: string;
  branchAddress: string;
  contactInfo: string;
  locationUrl: string;
}

interface InfinitePage<T> {
  data: T[];
  nextCursor: string | null;
}

interface KindergartenSubItem {
  courseName?: string;
  categoriesType: string;
  priceOfCourse: string | number;
  classSizeRatio: string;
  aboutCourse: string;
}

interface IntermediateSubItem {
  courseName?: string;
  year: string;
  classType: string;
  specialization: string;
  priceOfCourse: string | number;
}

interface SchoolSubItem {
  courseName?: string;
  classType: string;
  priceOfCourse: string | number;
}

interface StudyAbroadSubItem {
  courseName?: string;
  countriesOffered: string;
  academicOfferings: string;
  budget: string | number;
  studentsSent: string | number;
}
interface TuitionSubItem {
  courseName?: string;
  subject: string;
  classSize: string;
  academicDetails: any[];
  facultyDetails: any[];
  priceOfCourse: string | number;
}

type CourseSubItem =
  | KindergartenSubItem
  | IntermediateSubItem
  | SchoolSubItem
  | StudyAbroadSubItem
  | TuitionSubItem;

interface ExtendedProgram {
  _id: string;
  programName: string;
  courseType?: string;
  courseName?: string;
  branchName?: string;
  categoriesType?: string;
  mode?: string;
  courseDuration?: string;
  courses?: CourseSubItem[];
  selectBranch?: string;
  streamType?: string;
  specialization?: string;
  countriesOffered?: string;
}

type ViewModalState =
  | { type: 'branch'; data: BranchDetail }
  | { type: 'course'; data: ExtendedProgram }
  | null;

const DetailRow = ({ label, value, isLink }: { label: string; value: string; isLink?: boolean }) => (
  <div className="border-b border-gray-100 dark:border-gray-800 py-3">
    <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">{label}</p>
    {isLink ? (
      <a href={value} target="_blank" rel="noreferrer" className="text-[#0222D7] dark:text-blue-400 break-all text-sm hover:underline">
        {value || "N/A"}
      </a>
    ) : (
      <p className="text-gray-700 dark:text-gray-200 font-medium text-sm">{value || "N/A"}</p>
    )}
  </div>
);

function ListingsContent() {
  const { user, loading } = useAuth();
  const { data: inst } = useInstitution();
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Get values from URL query params with defaults
  const viewFromUrl = (searchParams.get('view') as 'branch' | 'course') || 'course';
  const modeFromUrl = (searchParams.get('mode') as 'none' | 'course' | 'branch') || 'none';
  const editProgramId = searchParams.get('edit') || null;

  // Helper function to update URL params
  const updateUrlParams = (params: { view?: string; mode?: string }) => {
    const newParams = new URLSearchParams(searchParams.toString());
    Object.entries(params).forEach(([key, value]) => {
      if (key === 'view') {
        // Always set view param explicitly (course or branch)
        if (value) {
          newParams.set(key, value);
        }
      } else if (key === 'mode') {
        // For mode, only set if it's not 'none' (default)
        if (value && value !== 'none') {
          newParams.set(key, value);
        } else {
          newParams.delete(key);
        }
      }
    });
    const newUrl = newParams.toString() ? `${pathname}?${newParams.toString()}` : pathname;
    router.push(newUrl, { scroll: false });
  };

  const {
    data: branchPages,
    fetchNextPage: fetchNextBranches,
    hasNextPage: hasMoreBranches,
    isLoading: isBranchesLoading
  } = useInfiniteBranches(inst?._id);

  const {
    data: programPages,
    fetchNextPage: fetchNextPrograms,
    hasNextPage: hasMorePrograms,
    isLoading: isProgramsLoading
  } = useInfinitePrograms(inst?._id);

  console.log("Branch Pages Raw:", branchPages);
  console.log("Program Pages Raw:", programPages);

  const allBranches = branchPages?.pages.flatMap((page: any) =>
    Array.isArray(page?.data) ? page.data : []
  ) || [];

  const allProgramsRaw = programPages?.pages.flatMap((page: any) => {
    return Array.isArray(page?.data) ? page.data : [];
  }) || [];

  // Use URL-based state for view toggle and add mode
  const [viewModal, setViewModal] = useState<ViewModalState>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<BranchDetail | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // 3. Header Query
  const { data: rawInst, isLoading: isInstLoading } = useQuery({
    queryKey: ['raw-institution-header'],
    queryFn: async () => {
      const res = await getMyInstitution();
      return res as Record<string, string>;
    },
  });

  const normalizedPrograms = allProgramsRaw.map(p => {
    if (!p || (!p._id && !p.id)) return null;

    const normalized: ExtendedProgram = { ...p };

    // Safety check for the 'courses' array in your JSON
    const hasSubItems = Array.isArray(p.courses) && p.courses.length > 0;
    const firstSub = hasSubItems ? p.courses[0] : null;

    let resolvedTitle: string = "";
    if (p.selectBranch) {
      resolvedTitle = String(p.selectBranch);
    } else if (p.courseName) {
      resolvedTitle = String(p.courseName);
    } else if (firstSub && "courseName" in firstSub && firstSub.courseName) {
      resolvedTitle = String(firstSub.courseName);
    } else {
      resolvedTitle = String(p.programName || "Unnamed Listing");
    }

    let resolvedCategory: string = "Standard";
    if (p.streamType) {
      resolvedCategory = String(p.streamType);
    } else if (p.categoriesType) {
      resolvedCategory = String(p.categoriesType);
    } else if (firstSub && "categoriesType" in firstSub && firstSub.categoriesType) {
      resolvedCategory = String(firstSub.categoriesType);
    }

    normalized.courseName = resolvedTitle;
    normalized.categoriesType = resolvedCategory;
    normalized.programName = resolvedTitle;

    return normalized;
  }).filter((p): p is ExtendedProgram => p !== null);

  console.log("Final Branch Count:", allBranches.length);
  console.log("Final Course Count:", normalizedPrograms.length);

  // Auto-open edit modal when editProgramId is in URL
  useEffect(() => {
    if (editProgramId && normalizedPrograms.length > 0) {
      const programToEdit = normalizedPrograms.find(p => p._id === editProgramId);
      if (programToEdit) {
        setViewModal({ type: 'course', data: programToEdit });
        setIsEditing(true);
        // Clear the edit param from URL after opening modal
        const newParams = new URLSearchParams(searchParams.toString());
        newParams.delete('edit');
        const newUrl = newParams.toString() ? `${pathname}?${newParams.toString()}` : pathname;
        router.replace(newUrl, { scroll: false });
      }
    }
  }, [editProgramId, normalizedPrograms, searchParams, pathname, router]);

  if (loading || !user) return null;

  // --- Handlers (Updated to invalidate the correct infinite keys) ---
  const handleDeleteBranch = async (id: string) => {
    if (!inst?._id || !window.confirm("Delete this branch?")) return;
    setIsDeleting(true);
    try {
      const res = await branchAPI.deleteBranch(id as any, inst._id);
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: ['branches-infinite'] });
        setViewModal(null);
        toast.success("Branch removed");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCourse = async (id: string) => {
    if (!inst?._id || !window.confirm("Delete this listing?")) return;
    setIsDeleting(true);
    try {
      const res = await programsAPI.remove(id, inst._id);
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: ['programs-infinite'] });
        setViewModal(null);
        toast.success("Listing removed");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpdateBranch = async () => {
    if (!editData || !inst?._id) return;
    setIsUpdating(true);
    try {
      const res = await branchAPI.updateBranch(editData._id as any, editData, inst._id);
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: ['branches-infinite'] });
        setIsEditing(false);
        setViewModal(null);
        toast.success("Branch updated");
      }
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full space-y-6 p-4 sm:p-6 bg-background">

      {/* 1. Header */}
      <_Card className="border-none shadow-sm rounded-3xl bg-gray-50 dark:bg-gray-900/50 min-h-[140px] flex items-center justify-center">
        <_CardContent className="w-full px-4 sm:px-10">
          <div className="relative flex items-center justify-center">
            <h1 className="text-xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100 text-center">
              {isInstLoading ? "..." : (rawInst?.instituteName || "Institution")}
            </h1>
            <div className="absolute right-0 bg-[#0222D7] text-white rounded-xl px-4 py-2 text-xs font-medium whitespace-nowrap">
              {rawInst?.instituteType || "Education"}
            </div>
          </div>
        </_CardContent>
      </_Card>

      {/* 2. Listing Buttons */}
      <_Card className="border-none shadow-sm rounded-3xl bg-gray-50 dark:bg-gray-900/50 p-8">
        <h2 className="text-lg font-bold mb-6">Create New Listing</h2>
        {modeFromUrl === 'none' ? (
          <div className="flex gap-6 justify-center">
            <button onClick={() => updateUrlParams({ mode: 'branch' })} className="flex flex-col items-center justify-center gap-2 bg-white dark:bg-gray-800 w-36 h-28 rounded-2xl shadow-sm hover:bg-indigo-50 transition-colors">
              <FontAwesomeIcon icon={faPlus} className="text-indigo-600" />
              <span className="text-xs font-semibold">Add Branch</span>
            </button>
            <button onClick={() => updateUrlParams({ mode: 'course' })} className="flex flex-col items-center justify-center gap-2 bg-white dark:bg-gray-800 w-36 h-28 rounded-2xl shadow-sm hover:bg-indigo-50 transition-colors">
              <FontAwesomeIcon icon={faPlus} className="text-indigo-600" />
              <span className="text-xs font-semibold">Add Course</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <Button variant="ghost" onClick={() => updateUrlParams({ mode: 'none' })}>← Back to Dashboard</Button>
            <L2DialogBox
              renderMode="inline"
              initialSection={modeFromUrl === 'course' ? 'course' : 'branch'}
              institutionId={inst?._id}
              institutionType={rawInst?.instituteType}
              mode="subscriptionProgram"
              adminFlow={true}
              onSuccess={() => {
                queryClient.invalidateQueries({ queryKey: ['programs-list'] });
                queryClient.invalidateQueries({ queryKey: ['programs-page-branches'] });
                updateUrlParams({ mode: 'none' });
              }}
            />
          </div>
        )}
      </_Card>

      {/* 3. Toggle */}
      <div className="flex justify-end gap-2 bg-gray-100 dark:bg-gray-800 w-fit ml-auto p-1 rounded-full">
        <button onClick={() => updateUrlParams({ view: 'branch' })} className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${viewFromUrl === 'branch' ? "bg-white shadow-sm text-blue-600" : "text-gray-500"}`}>Branches</button>
        <button onClick={() => updateUrlParams({ view: 'course' })} className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${viewFromUrl === 'course' ? "bg-white shadow-sm text-blue-600" : "text-gray-500"}`}>Courses</button>
      </div>

      {/* 4. Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {viewFromUrl === 'branch' ? (
          allBranches.map((branch) => {
            // 🛡️ Guard Clause: Skip if branch data is missing
            if (!branch || !branch._id) return null;

            return (
              <_Card key={branch._id} className="border-none shadow-sm rounded-[32px] bg-white dark:bg-gray-900 p-8">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    {/* 🛡️ Optional Chaining (?.) for extra safety */}
                    <h3 className="font-bold text-lg">{branch?.branchName || "Unnamed Branch"}</h3>
                    <p className="text-xs text-gray-400">Branch ID: {branch?._id?.slice(-6)}</p>
                  </div>
                  <Button
                    variant="link"
                    onClick={() => { setViewModal({ type: 'branch', data: branch }); setIsEditing(false); }}
                    className="text-blue-600 font-bold p-0"
                  >
                    View Details
                  </Button>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <FontAwesomeIcon icon={faPhone} className="w-3" /> {branch?.contactInfo || "N/A"}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <FontAwesomeIcon icon={faMapMarkerAlt} className="w-3" /> {branch?.branchAddress || "N/A"}
                  </div>
                </div>
              </_Card>
            );
          })
        ) : (
          normalizedPrograms.map((p) => (
            <_Card key={p._id} className="border-none shadow-sm rounded-[32px] bg-white dark:bg-gray-900 p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="font-bold text-lg">{p.programName || p.courseName}</h3>
                  <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded font-bold uppercase">{p.categoriesType || "Standard"}</span>
                  {p.courses && p.courses.length > 1 && (
                    <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-1 rounded font-bold uppercase">
                      + {p.courses.length - 1} More
                    </span>
                  )}
                </div>
                <Button variant="link" onClick={() => { setViewModal({ type: 'course', data: p }); setIsEditing(true); }} className="text-blue-600 font-bold p-0">Edit Listing</Button>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm pt-4 border-t border-gray-50">
                <div><p className="text-[10px] text-gray-400 font-bold uppercase">Mode</p><p>{p.mode || "Offline"}</p></div>
                <div><p className="text-[10px] text-gray-400 font-bold uppercase">Duration</p><p>{p.courseDuration || "N/A"}</p></div>
              </div>
            </_Card>
          ))
        )}
      </div>

      {/* 5. The Unified Modal */}
      {viewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-gray-900 rounded-[32px] w-full max-w-5xl shadow-2xl overflow-hidden">
            <div className="p-8 sm:p-10">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="text-2xl font-bold">{viewModal.type === 'branch' ? 'Branch Management' : 'Edit Program Details'}</h2>
                  <p className="text-sm text-gray-500">Update information and preferences</p>
                </div>
                <button onClick={() => { setViewModal(null); setIsEditing(false); }} className="text-gray-400 text-3xl hover:text-gray-600 transition-colors">×</button>
              </div>

              <div className="max-h-[60vh] overflow-y-auto pr-4 custom-scrollbar">
                {viewModal.type === 'branch' ? (
                  isEditing ? (
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-gray-400">Branch Name</label>
                        <Input
                          value={editData?.branchName || ""}
                          onChange={e => setEditData({ ...editData!, branchName: e.target.value })}
                          className="rounded-xl h-12 border-gray-200"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-gray-400">Contact Number</label>
                        <Input
                          value={editData?.contactInfo || ""}
                          onChange={e => setEditData({ ...editData!, contactInfo: e.target.value })}
                          className="rounded-xl h-12 border-gray-200"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-gray-400">Branch Address</label>
                        <Input
                          value={editData?.branchAddress || ""}
                          onChange={e => setEditData({ ...editData!, branchAddress: e.target.value })}
                          className="rounded-xl h-12 border-gray-200"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-gray-400">Google Maps URL</label>
                        <Input
                          value={editData?.locationUrl || ""}
                          onChange={e => setEditData({ ...editData!, locationUrl: e.target.value })}
                          className="rounded-xl h-12 border-gray-200"
                          placeholder="https://goo.gl/maps/..."
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 gap-x-10">
                      <DetailRow label="Branch Name" value={viewModal.data.branchName} />
                      <DetailRow label="Contact Info" value={viewModal.data.contactInfo} />
                      <DetailRow label="Address" value={viewModal.data.branchAddress} />
                      <DetailRow label="Location" value={viewModal.data.locationUrl} isLink />
                    </div>
                  )
                ) : (
                  <L2DialogBox
                    renderMode="inline"
                    editMode={true}
                    existingCourseData={viewModal.data as any}
                    institutionId={inst?._id}
                    institutionType={rawInst?.instituteType}
                    mode="subscriptionProgram"
                    onEditSuccess={() => { queryClient.invalidateQueries({ queryKey: ['programs-list'] }); setViewModal(null); toast.success("Updated!"); }}
                  />
                )}
              </div>

              {/* Action Footer */}
              <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-10 pt-6 border-t border-gray-100">
                <button
                  onClick={() => viewModal.type === 'branch' ? handleDeleteBranch(viewModal.data._id) : handleDeleteCourse(viewModal.data._id)}
                  disabled={isDeleting}
                  className="w-full sm:w-[200px] h-[48px] border border-red-200 text-red-500 hover:bg-red-50 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
                >
                  <FontAwesomeIcon icon={faTrashAlt} /> {isDeleting ? "..." : "Delete Listing"}
                </button>

                {viewModal.type === 'branch' && !isEditing && (
                  <Button onClick={() => { setEditData({ ...viewModal.data }); setIsEditing(true); }} className="w-full sm:w-[200px] h-[48px] bg-blue-600 rounded-xl">Edit Branch</Button>
                )}

                {isEditing && viewModal.type === 'branch' && (
                  <Button onClick={handleUpdateBranch} disabled={isUpdating} className="w-full sm:w-[200px] h-[48px] bg-green-600 rounded-xl">Save Changes</Button>
                )}

                <Button variant="ghost" onClick={() => { setViewModal(null); setIsEditing(false); }} className="w-full sm:w-[150px] h-[48px]">Close</Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* 6. Pagination UI (Optional but recommended) */}
      <div className="flex justify-center pt-8">
        {viewFromUrl === 'branch' && hasMoreBranches && (
          <Button
            onClick={() => fetchNextBranches()}
            variant="outline"
            className="rounded-xl px-10"
          >
            Load More Branches
          </Button>
        )}
        {viewFromUrl === 'course' && hasMorePrograms && (
          <Button
            onClick={() => fetchNextPrograms()}
            variant="outline"
            className="rounded-xl px-10"
          >
            Load More Courses
          </Button>
        )}
      </div>
    </motion.div>
  );
}

// Export wrapped component with Suspense for useSearchParams
export function Listings() {
  return (
    <Suspense fallback={<div className="p-6 text-center">Loading...</div>}>
      <ListingsContent />
    </Suspense>
  );
}
