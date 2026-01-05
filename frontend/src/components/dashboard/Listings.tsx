"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { _Card, _CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth-context";
import { useInstitution, useProgramsList } from "@/lib/hooks/dashboard-hooks";
import { programsAPI, getMyInstitution, branchAPI } from "@/lib/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faPhone,
  faMapMarkerAlt,
  faLink,
  faLocationArrow,
  faTrashAlt,
} from "@fortawesome/free-solid-svg-icons";
import L2DialogBox from "@/components/auth/L2DialogBox";
import { toast } from "react-toastify";

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";
import { faBuilding } from "@fortawesome/free-regular-svg-icons";

// --- Types ---
interface ExtendedProgram {
  _id: string;
  programName: string;
  courseName?: string;
  categoriesType?: string;
  domainType?: string;
  subDomainType?: string;
  mode?: string;
  courseDuration?: string;
}

interface BranchDetail {
  _id: string;
  branchName: string;
  branchAddress: string;
  contactInfo: string;
  locationUrl: string;
}

type ViewModalState =
  | { type: "branch"; data: BranchDetail }
  | { type: "course"; data: ExtendedProgram }
  | null;

const DetailRow = ({
  label,
  value,
  isLink,
}: {
  label: string;
  value: string;
  isLink?: boolean;
}) => (
  <div className="border-b border-gray-100 dark:border-gray-800 py-3">
    <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
      {label}
    </p>
    {isLink ? (
      <a
        href={value}
        target="_blank"
        rel="noreferrer"
        className="text-[#0222D7] dark:text-blue-400 break-all text-sm hover:underline"
      >
        {value || "N/A"}
      </a>
    ) : (
      <p className="text-gray-700 dark:text-gray-200 font-medium text-sm">
        {value || "N/A"}
      </p>
    )}
  </div>
);

export function Listings() {
  const { user, loading } = useAuth();
  const { data: inst } = useInstitution();
  const { data: programs, isLoading: isProgramsLoading } = useProgramsList();
  const queryClient = useQueryClient();

  const [addInlineMode, setAddInlineMode] = useState<
    "none" | "course" | "branch"
  >("none");
  const [viewToggle, setViewToggle] = useState<"branch" | "course">("branch");
  const [viewModal, setViewModal] = useState<ViewModalState>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<BranchDetail | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Pagination
  const [branchPage, setBranchPage] = useState(1);
  const [coursePage, setCoursePage] = useState(1);
  const itemsPerPage = 4;

  const { data: branchList, isLoading: isBranchesLoading } = useQuery({
    queryKey: ["programs-page-branches", inst?._id],
    enabled: !!inst?._id,
    queryFn: async () => {
      const res = await programsAPI.listBranchesForInstitutionAdmin(
        String(inst?._id)
      );
      const payload = res as any;
      return payload?.data?.branches || [];
    },
  });

  const { data: rawInst, isLoading: isInstLoading } = useQuery({
    queryKey: ["raw-institution-header"],
    queryFn: async () => {
      const res = await getMyInstitution();
      return res as Record<string, string>;
    },
  });

  if (loading || !user) return null;

  const currentBranches = (branchList || []).slice(
    (branchPage - 1) * itemsPerPage,
    branchPage * itemsPerPage
  );
  const currentCourses = (programs || []).slice(
    (coursePage - 1) * itemsPerPage,
    coursePage * itemsPerPage
  ) as ExtendedProgram[];

  const totalBranchPages = Math.ceil((branchList?.length || 0) / itemsPerPage);
  const totalCoursePages = Math.ceil((programs?.length || 0) / itemsPerPage);

  // --- Handlers ---
  const handleDeleteBranch = async (id: string) => {
    if (!inst?._id || !window.confirm("Delete this branch?")) return;
    setIsDeleting(true);
    try {
      const res = await branchAPI.deleteBranch(id as any, inst._id);
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: ["programs-page-branches"] });
        setViewModal(null);
        toast.success("Branch removed");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCourse = async (id: string) => {
    if (!inst?._id || !window.confirm("Delete this course?")) return;
    setIsDeleting(true);
    try {
      const res = await programsAPI.remove(id, inst._id);
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: ["programs-list"] });
        setViewModal(null);
        toast.success("Course removed");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpdateBranch = async () => {
    if (!editData || !inst?._id) return;
    setIsUpdating(true);
    try {
      const res = await branchAPI.updateBranch(
        editData._id as any,
        editData,
        inst._id
      );
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: ["programs-page-branches"] });
        setIsEditing(false);
        setViewModal(null);
        toast.success("Branch updated");
      }
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full space-y-6 p-4 sm:p-6 bg-background"
    >
      {/* 1. Header */}
      <_Card className="border-none shadow-sm rounded-3xl bg-gray-50 dark:bg-gray-900/50 min-h-[140px] flex items-center">
        <_CardContent className="w-full px-4 sm:px-10">
          <div className="relative flex flex-col sm:flex-row items-center justify-center">
            <h1 className="text-xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100 text-center">
              {isInstLoading ? "..." : rawInst?.instituteName || "Institution"}
            </h1>
            <div className="mt-4 sm:mt-0 sm:absolute sm:right-0 bg-[#0222D7] text-white rounded-xl px-4 py-2 text-xs font-medium">
              {rawInst?.instituteType || "Education"}
            </div>
          </div>
        </_CardContent>
      </_Card>

      {/* 2. Listing Buttons */}
      <_Card className="border-none shadow-sm rounded-3xl bg-gray-50 dark:bg-gray-900/50 p-8">
        <h2 className="text-lg font-bold mb-6">Create New Listing</h2>
        {addInlineMode === "none" ? (
          <div className="flex gap-6 justify-center">
            <button
              onClick={() => setAddInlineMode("branch")}
              className="flex flex-col items-center justify-center gap-2 bg-white dark:bg-gray-800 w-36 h-28 rounded-2xl shadow-sm hover:bg-indigo-50 transition-colors"
            >
              <FontAwesomeIcon icon={faPlus} className="text-indigo-600" />
              <span className="text-xs font-semibold">Add Branch</span>
            </button>
            <button
              onClick={() => setAddInlineMode("course")}
              className="flex flex-col items-center justify-center gap-2 bg-white dark:bg-gray-800 w-36 h-28 rounded-2xl shadow-sm hover:bg-indigo-50 transition-colors"
            >
              <FontAwesomeIcon icon={faPlus} className="text-indigo-600" />
              <span className="text-xs font-semibold">Add Course</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <Button variant="ghost" onClick={() => setAddInlineMode("none")}>
              ← Back to Dashboard
            </Button>
            <L2DialogBox
              renderMode="inline"
              initialSection={addInlineMode === "course" ? "course" : "branch"}
              institutionId={inst?._id}
              institutionType={rawInst?.instituteType}
              onSuccess={() => {
                queryClient.invalidateQueries({ queryKey: ["programs-list"] });
                queryClient.invalidateQueries({
                  queryKey: ["programs-page-branches"],
                });
                setAddInlineMode("none");
              }}
            />
          </div>
        )}
      </_Card>

      {/* 3. Toggle */}
      <div className="flex justify-end gap-2 bg-gray-100 dark:bg-gray-800 w-fit ml-auto p-1 rounded-full">
        <button
          onClick={() => setViewToggle("branch")}
          className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${
            viewToggle === "branch"
              ? "bg-white shadow-sm text-blue-600"
              : "text-gray-500"
          }`}
        >
          Branches
        </button>
        <button
          onClick={() => setViewToggle("course")}
          className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${
            viewToggle === "course"
              ? "bg-white shadow-sm text-blue-600"
              : "text-gray-500"
          }`}
        >
          Courses
        </button>
      </div>

      {/* 4. Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {viewToggle === "branch"
          ? currentBranches.map((branch: BranchDetail, idx: number) => (
              <_Card
                key={branch._id}
                className="border-none shadow-sm rounded-[32px] bg-white dark:bg-gray-900 p-8"
              >
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="font-bold text-lg">{branch.branchName}</h3>
                    {/* <p className="text-xs text-gray-400">Branch ID: {branch._id.slice(-6)}</p> */}
                  </div>
                  <Button
                    variant="link"
                    onClick={() => {
                      setViewModal({ type: "branch", data: branch });
                      setIsEditing(false);
                    }}
                    className="text-blue-600 font-bold p-0"
                  >
                    View Details
                  </Button>
                </div>
                {/* <div className="space-y-3">
                 <div className="flex items-center gap-3 text-sm text-gray-600"><FontAwesomeIcon icon={faPhone} className="w-3" /> {branch.branchName}</div>
                 <div className="flex items-center gap-3 text-sm text-gray-600"><FontAwesomeIcon icon={faMapMarkerAlt} className="w-3" /> {branch.branchAddress}</div>
                 <div className="flex items-center gap-3 text-sm text-gray-600"><FontAwesomeIcon icon={faPhone} className="w-3" /> {branch.contactInfo}</div>
                 <div className="flex items-center gap-3 text-sm text-gray-600"><FontAwesomeIcon icon={faMapMarkerAlt} className="w-3" /> {branch.locationUrl}</div>
               </div> */}
                <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm text-gray-600">
                  <div className="flex items-center gap-3">
                    <FontAwesomeIcon icon={faBuilding} className="w-3" />
                    {branch.branchName}
                  </div>

                  <div className="flex items-center gap-3">
                    <FontAwesomeIcon icon={faPhone} className="w-3" />
                    {branch.contactInfo}
                  </div>
                  <div className="flex items-center gap-3">
                    <FontAwesomeIcon icon={faMapMarkerAlt} className="w-3" />
                    {branch.branchAddress}
                  </div>

                  <div className="flex items-center gap-3">
                    <FontAwesomeIcon icon={faLink} className="w-3" />
                    {branch.locationUrl}
                  </div>
                </div>
              </_Card>
            ))
          : currentCourses.map((p, idx) => (
              <_Card
                key={p._id}
                className="border-none shadow-sm rounded-[32px] bg-white dark:bg-gray-900 p-8"
              >
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="font-bold text-lg">
                      {p.courseName || p.programName}
                    </h3>
                    <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded font-bold uppercase">
                      {p.categoriesType || "Standard"}
                    </span>
                  </div>
                  <Button
                    variant="link"
                    onClick={() => {
                      setViewModal({ type: "course", data: p });
                      setIsEditing(true);
                    }}
                    className="text-blue-600 font-bold p-0"
                  >
                    Edit Listing
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm pt-4 border-t border-gray-50">
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">
                      Mode
                    </p>
                    <p>{p.mode || "Offline"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">
                      Duration
                    </p>
                    <p>{p.courseDuration || "N/A"}</p>
                  </div>
                </div>
              </_Card>
            ))}
      </div>

      {/* 5. The Unified Modal */}
      {viewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-900 rounded-[32px] w-full max-w-5xl shadow-2xl overflow-hidden"
          >
            <div className="p-8 sm:p-10">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="text-2xl font-bold">
                    {viewModal.type === "branch"
                      ? "Branch Management"
                      : "Edit Program Details"}
                  </h2>
                  <p className="text-sm text-gray-500">
                    Update information and preferences
                  </p>
                </div>
                <button
                  onClick={() => {
                    setViewModal(null);
                    setIsEditing(false);
                  }}
                  className="text-gray-400 text-3xl hover:text-gray-600 transition-colors"
                >
                  ×
                </button>
              </div>

              <div className="max-h-[60vh] overflow-y-auto pr-4 custom-scrollbar">
                {viewModal.type === "branch" ? (
                  isEditing ? (
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-bold">Branch Name</label>
                        <Input
                          value={editData?.branchName}
                          onChange={(e) =>
                            setEditData({
                              ...editData!,
                              branchName: e.target.value,
                            })
                          }
                          className="rounded-xl h-12"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold">Contact</label>
                        <Input
                          value={editData?.contactInfo}
                          onChange={(e) =>
                            setEditData({
                              ...editData!,
                              contactInfo: e.target.value,
                            })
                          }
                          className="rounded-xl h-12"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold">Address</label>
                        <Input
                          value={editData?.branchAddress}
                          onChange={(e) =>
                            setEditData({
                              ...editData!,
                              branchAddress: e.target.value,
                            })
                          }
                          className="rounded-xl h-12"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold">Locaton</label>
                        <Input
                          value={editData?.locationUrl}
                          onChange={(e) =>
                            setEditData({
                              ...editData!,
                              locationUrl: e.target.value,
                            })
                          }
                          className="rounded-xl h-12"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 gap-x-10">
                      <DetailRow
                        label="Branch Name"
                        value={viewModal.data.branchName}
                      />
                      <DetailRow
                        label="Contact Info"
                        value={viewModal.data.contactInfo}
                      />
                      <DetailRow
                        label="Address"
                        value={viewModal.data.branchAddress}
                      />
                      <DetailRow
                        label="Location"
                        value={viewModal.data.locationUrl}
                        isLink
                      />
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
                    onEditSuccess={() => {
                      queryClient.invalidateQueries({
                        queryKey: ["programs-list"],
                      });
                      setViewModal(null);
                      toast.success("Updated!");
                    }}
                  />
                )}
              </div>

              {/* Action Footer */}
              <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-10 pt-6 border-t border-gray-100">
                <button
                  onClick={() =>
                    viewModal.type === "branch"
                      ? handleDeleteBranch(viewModal.data._id)
                      : handleDeleteCourse(viewModal.data._id)
                  }
                  disabled={isDeleting}
                  className="w-full sm:w-[200px] h-[48px] border border-red-200 text-red-500 hover:bg-red-50 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
                >
                  <FontAwesomeIcon icon={faTrashAlt} />{" "}
                  {isDeleting ? "..." : "Delete Listing"}
                </button>

                {viewModal.type === "branch" && !isEditing && (
                  <Button
                    onClick={() => {
                      setEditData(viewModal.data);
                      setIsEditing(true);
                    }}
                    className="w-full sm:w-[200px] h-[48px] bg-blue-600 rounded-xl"
                  >
                    Edit Branch
                  </Button>
                )}

                {isEditing && viewModal.type === "branch" && (
                  <Button
                    onClick={handleUpdateBranch}
                    disabled={isUpdating}
                    className="w-full sm:w-[200px] h-[48px] bg-green-600 rounded-xl"
                  >
                    Save Changes
                  </Button>
                )}

                <Button
                  variant="ghost"
                  onClick={() => {
                    setViewModal(null);
                    setIsEditing(false);
                  }}
                  className="w-full sm:w-[150px] h-[48px]"
                >
                  Close
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* 6. Pagination UI (Optional but recommended) */}
      <div className="pt-8">
        <Pagination>
          <PaginationContent>
            {Array.from({
              length:
                viewToggle === "branch" ? totalBranchPages : totalCoursePages,
            }).map((_, i) => (
              <PaginationItem key={i}>
                <PaginationLink
                  isActive={
                    (viewToggle === "branch" ? branchPage : coursePage) ===
                    i + 1
                  }
                  onClick={() =>
                    viewToggle === "branch"
                      ? setBranchPage(i + 1)
                      : setCoursePage(i + 1)
                  }
                  className="cursor-pointer"
                >
                  {i + 1}
                </PaginationLink>
              </PaginationItem>
            ))}
          </PaginationContent>
        </Pagination>
      </div>
    </motion.div>
  );
}
