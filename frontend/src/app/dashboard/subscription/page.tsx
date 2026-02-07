"use client";

import React, { useMemo, useState } from "react";
import { _Card, _CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useInstitution } from "@/lib/hooks/dashboard-hooks";
import { programsAPI, paymentAPI } from "@/lib/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { withAuth } from "@/lib/auth-context";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import AppSelect from "@/components/ui/AppSelect";
import L2DialogBox from "@/components/auth/L2DialogBox";
import { getProgramStatus, formatDate } from "@/lib/utility";
import {useSearchParams, usePathname, useRouter } from "next/navigation";
import AnalyticsTable from "@/components/dashboard/AnalyticsTable";
import { loadRazorpayScript } from "@/lib/razorpay";
import { useUserStore } from "@/lib/user-store";
import PaymentCheckout from "@/components/payment/PaymentCheckout";
import { Suspense } from "react";

type InactiveCourseRow = {
  id: string;
  sno: string;
  name: string;
  status: "Live" | "Draft" | "Paused" | "Expired" | "Inactive";
  startDate: string;
  endDate: string;
  price: number;
};

const statusDisplayMap: Record<string, InactiveCourseRow["status"]> = {
  active: "Live",
  upcoming: "Paused",
  expired: "Expired",
  invalid: "Draft",
  inactive: "Draft",
};

const statusBadgeClasses: Record<InactiveCourseRow["status"], string> = {
  Live: "bg-green-100 text-green-700",
  Draft: "bg-gray-100 text-gray-700",
  Paused: "bg-yellow-100 text-yellow-700",
  Expired: "bg-red-100 text-red-700",
  Inactive: "bg-gray-200 text-gray-700 border border-gray-300",
};

const parsePrice = (value: unknown): number => {
  if (typeof value === "number" && !Number.isNaN(value)) return value;
  if (typeof value === "string") {
    const numeric = Number(value.replace(/[^0-9.]/g, ""));
    return Number.isNaN(numeric) ? 0 : numeric;
  }
  return 0;
};

const DEFAULT_COURSE_PRICE = 1188;

function ProgramsPage() {
  const { data: institution } = useInstitution();
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Derive activeTab from the URL. If no ?tab= is present, default to 'details'
  const activeTab = (searchParams.get("tab") as 'details' | 'add' | 'inactive') || 'details';

  // Function to update the URL
  const handleTabChange = (tabName: 'details' | 'add' | 'inactive') => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tabName);
    router.push(`${pathname}?${params.toString()}`);
  };
  const [search, setSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState<string>("");
  const [addInlineMode, setAddInlineMode] = useState<'none' | 'course' | 'branch'>('none');
  const [visibleCount, setVisibleCount] = useState<number>(10);
  const [selectedInactive, setSelectedInactive] = useState<Record<string, boolean>>({});
  const [isPaying, setIsPaying] = useState(false);
  const [, setPaymentProcessing] = useState<{ paymentId?: string | null; orderId?: string | null } | null>(null);
  const [, setPaymentVerified] = useState<{ transactionId?: string | null; paymentId?: string | null; orderId?: string | null } | null>(null);
  const [, setPaymentFailed] = useState<{ paymentId?: string | null; orderId?: string | null } | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const selectedPlan = "yearly" as const;
  const appliedCoupon: string | null = null;
  // Add/Branch forms are delegated to L2DialogBox for reuse across the app

  const { data: programs } = useQuery({
    queryKey: ['programs-page-list-institution-admin', institution?._id],
    enabled: !!institution?._id,
    queryFn: async () => {
      const res = await programsAPI.listForInstitutionAdminWithMetrics(String(institution?._id)) as { data?: { programs?: Record<string, unknown>[] } };
      return (res?.data?.programs || []) as Array<Record<string, unknown>>;
    },
    staleTime: 60 * 1000,
  });

  // Branch dropdown options - load from backend
  const { data: branchList } = useQuery({
    queryKey: ['programs-page-branches', institution?._id],
    enabled: !!institution?._id,
    queryFn: async () => {
      const res = await programsAPI.listBranchesForInstitutionAdmin(String(institution?._id)) as { data?: { branches?: Record<string, unknown>[] } };
      return (res?.data?.branches || []) as Array<Record<string, unknown>>;
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: invoices } = useQuery({
    queryKey: ['subscription-history', institution?._id],
    enabled: !!institution?._id,
    queryFn: async () => {
      const res = await programsAPI.subscriptionHistory(String(institution?._id)) as { data?: { items?: Record<string, unknown>[] } };
      return (res?.data?.items || []) as Array<Record<string, unknown>>;
    },
    staleTime: 60 * 1000,
  });
  const paidInvoices = React.useMemo(() => {
    if (!Array.isArray(invoices)) return [];
    // Show all paid transactions (active, expired, but not pending)
    // All records returned from API already have razorpayPaymentId, so they're all paid
    return invoices.filter((inv) => {
      const status = String(inv?.status || '').toLowerCase();
      return status === 'active' || status === 'expired';
    });
  }, [invoices]);

  const onL2Success = () => {
  queryClient.invalidateQueries({ queryKey: ['programs-page-list-institution-admin'] });
  handleTabChange('details'); 
};

  // Navigation function for edit button
  const handleEditProgram = (programId: string) => {
    router.push(`/dashboard/settings?editProgram=${programId}`);
  };

  const branchOptions = useMemo(() => {
    const seenIds = new Set<string>();
    const seenNames = new Set<string>();
    const arr: Array<{ value: string; label: string }> = [{ value: '', label: 'All Branches' }];
    (branchList || []).forEach((b: Record<string, unknown>) => {
      const id = String(b?._id || "");
      if (!id || seenIds.has(id)) return;
      const label = String(b?.branchName || 'Branch').trim();
      const keyName = label.toLowerCase();
      if (seenNames.has(keyName)) return;
      seenIds.add(id);
      seenNames.add(keyName);
      arr.push({ value: id, label });
    });
    return arr.sort((a, b) => a.label.localeCompare(b.label));
  }, [branchList]);

  // Reset visible count when filters change
  React.useEffect(() => { setVisibleCount(10); }, [search, branchFilter, activeTab]);

  const filteredPrograms = (Array.isArray(programs) ? programs : []).filter((p: Record<string, unknown>) => {
    const q = search.trim().toLowerCase();
    const name = String(p?.CourseName || p?.selectBranch || "").toLowerCase();
    const branch = String(p?.branchName || (p.branch as Record<string, unknown>)?.branchName || (p.institution as Record<string, unknown>)?.name || "").toLowerCase();
    const passSearch = !q || name.includes(q) || branch.includes(q);
    const branchId = typeof p.branch === 'object' && p.branch !== null ? String((p.branch as Record<string, unknown>)?._id || '') : String(p.branch || '');
    const passBranch = !branchFilter || branchFilter === '' || branchId === branchFilter;
    return passSearch && passBranch;
  });
  const visiblePrograms = filteredPrograms.slice(0, visibleCount);

  const inactiveCourses = useMemo<InactiveCourseRow[]>(() => {
    const list = (Array.isArray(programs) ? programs : [])
      .map((p: Record<string, unknown>, idx: number) => {
        const statusInfo = getProgramStatus(String(p?.startDate || ''), String(p?.endDate || ''));
        const id = String(p?._id ?? `inactive-${idx}`);
        const rawStatus = String(p?.status || "").toLowerCase();
        const isBackendInactive = rawStatus === "inactive";
        const displayStatus = isBackendInactive ? "Inactive" : (statusDisplayMap[statusInfo.status] ?? "Draft");
        return {
          id,
          isInactive: isBackendInactive || statusInfo.status !== 'active',
          preferBackendStatus: isBackendInactive,
          name: String(p?.programName || p?.CourseName || 'Untitled course'),
          status: displayStatus,
          startDate: formatDate(String(p?.startDate || '')),
          endDate: formatDate(String(p?.endDate || '')),
          price: parsePrice((p as Record<string, unknown>)?.priceOfCourse),
        };
      })
      .filter((item) => item.preferBackendStatus);

    return list.map((item, idx) => {
      const { preferBackendStatus, isInactive, ...rest } = item;
      return {
        ...rest,
        sno: String(idx + 1).padStart(2, '0'),
      };
    });
  }, [programs]);

  const inactiveSelectedCount = inactiveCourses.reduce((count, course) => count + (selectedInactive[course.id] ? 1 : 0), 0);
  const totalInactivePrice = inactiveSelectedCount * DEFAULT_COURSE_PRICE;
  const allInactiveSelected = inactiveCourses.length > 0 && inactiveCourses.every((course) => selectedInactive[course.id]);

  const formatCurrency = (value: number) => `₹ ${value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

  const handleSelectAllInactive = (checked: boolean) => {
    if (!checked) {
      setSelectedInactive({});
      return;
    }
    const next: Record<string, boolean> = {};
    inactiveCourses.forEach((course) => {
      next[course.id] = true;
    });
    setSelectedInactive(next);
  };

  const handleToggleInactiveCourse = (courseId: string, checked: boolean) => {
    setSelectedInactive((prev) => {
      const next = { ...prev };
      if (checked) {
        next[courseId] = true;
      } else {
        delete next[courseId];
      }
      return next;
    });
  };

  const handleFreeListing = async () => {
    if (!inactiveSelectedCount || isPaying) return;

    const selectedCourseIds = inactiveCourses
      .filter((course) => !!selectedInactive[course.id])
      .map((course) => course.id)
      .filter((courseId) => !!courseId && !courseId.startsWith("inactive-"));

    if (!selectedCourseIds.length) return;

    try {
      setIsPaying(true);

      const res = await paymentAPI.initiateFreeListing({
        courseIds: selectedCourseIds,
      });

      // Check if the response indicates direct activation (no Razorpay needed)
      const responseData = res.data as {
        status?: string;
        listingType?: string;
        message?: string;
        totalActivatedCourses?: number;
        validUntil?: string;
        orderId?: string;
      };

      if (res.success && responseData?.listingType === "free") {
        // Free listing was activated directly by backend - no Razorpay needed
        console.log("[FreeListing] Direct activation successful:", responseData);

        try {
          useUserStore.getState().setPaymentStatus(true);
        } catch (storeError) {
          console.warn("[FreeListing] Failed to set payment status:", storeError);
        }

        // Refresh course lists
        programsAPI.invalidateCache(institution?._id ? String(institution._id) : undefined);
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['programs-page-list-institution-admin', institution?._id] }),
          queryClient.invalidateQueries({ queryKey: ['subscription-history', institution?._id] }),
        ]);
        setSelectedInactive({});

        // Show success state
        setPaymentVerified({
          transactionId: responseData.orderId || null,
          paymentId: null,
          orderId: responseData.orderId || null,
        });

        setIsPaying(false);
        return;
      }

      // Fallback: If backend returns Razorpay order, open payment popup (shouldn't happen for free)
      if (!res.success || !res.data) {
        console.error("Free listing init failed:", res.message);
        setIsPaying(false);
        return;
      }

      console.warn("[FreeListing] Unexpected Razorpay flow for free listing");
      setIsPaying(false);
    } catch (error) {
      console.error("Free listing init error:", error);
      setIsPaying(false);
    }
  };

  const handleProceedToPay = async () => {
    if (!inactiveSelectedCount || isPaying) return;

    const selectedCourseIds = inactiveCourses
      .filter((course) => !!selectedInactive[course.id])
      .map((course) => course.id)
      .filter((courseId) => !!courseId && !courseId.startsWith("inactive-"));

    if (!selectedCourseIds.length) return;

    setShowCheckout(true);
  };

  React.useEffect(() => {
    setSelectedInactive({});
  }, [programs]);

  return (
    <div className="p-2 mt-5 space-y-6">
      {showCheckout ? (
        <>
          <div className="mb-4">
            <Button variant="ghost" onClick={() => setShowCheckout(false)} className="gap-2">
              ← Back to courses
            </Button>
          </div>
          <PaymentCheckout
            customPaymentDetails={{
              totalInactiveCourses: inactiveSelectedCount,
              pricePerCourse: DEFAULT_COURSE_PRICE,
              totalAmount: totalInactivePrice,
              courseIds: inactiveCourses
                .filter((course) => !!selectedInactive[course.id])
                .map((course) => course.id)
                .filter((courseId) => !!courseId && !courseId.startsWith("inactive-")),
            }}
            onSuccess={() => {
              programsAPI.invalidateCache(institution?._id ? String(institution._id) : undefined);
              queryClient.invalidateQueries({ queryKey: ['programs-page-list-institution-admin', institution?._id] });
              queryClient.invalidateQueries({ queryKey: ['subscription-history', institution?._id] });
              setSelectedInactive({});
              setShowCheckout(false);
            }}
          />
        </>
      ) : (
        <>
          {/* _Card 1: Your Listed Programs */}
          <_Card className="bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl">
            <_CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="text-2xl font-semibold">Your Listed Programs</div>
              </div>

          {/* Tabs header */}
          <div className="flex items-center gap-6 border-b border-gray-200 dark:border-gray-800 mb-4 text-gray-900 dark:text-gray-100">
            <button
              onClick={() => handleTabChange('details')}
              className={`py-2 px-1 ${activeTab === 'details' ? 'border-b-2 border-blue-600 font-medium' : 'text-gray-500'}`}
            >
              Program Details
            </button>

            <button
              onClick={() => handleTabChange('inactive')}
              className={`py-2 px-1 ${activeTab === 'inactive' ? 'border-b-2 border-blue-600 font-medium' : 'text-gray-500'}`}
            >
              Inactive Courses
            </button>
          </div>

              {/* Utilities row: search + filter */}
              {activeTab === 'details' && (
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div className="flex-1">
                    <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search program or branch" className="w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-700" />
                  </div>
                  <div className="w-64">
                    <AppSelect
                      value={branchFilter}
                      onChange={(val) => setBranchFilter(val)}
                      options={branchOptions}
                      placeholder="Filter by Branch"
                      variant="white"
                      size="md"
                      rounded="lg"
                      className="w-full"
                    />
                  </div>
                </div>
              )}

              {/* Inactive Courses tab */}
              {activeTab === 'inactive' && (
                <div className="mt-6">
                  <AnalyticsTable<InactiveCourseRow>
                    variant="embedded"
                    hideDefaultCta
                    rows={inactiveCourses}
                    titleOverride="Inactive Courses"
                    renderTable={(rows) => (
                      <div className="space-y-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                            <input
                              type="checkbox"
                              className="h-4 w-4 accent-blue-600"
                              checked={rows.length > 0 && allInactiveSelected}
                              onChange={(e) => handleSelectAllInactive(e.target.checked)}
                            />
                            Select all
                          </label>
                          <span className="text-sm text-gray-500">{rows.length} inactive course{rows.length === 1 ? '' : 's'}</span>
                        </div>
                        {rows.length === 0 ? (
                          <div className="py-8 text-center text-gray-500 bg-white dark:bg-gray-900 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                            No inactive courses available right now.
                          </div>
                        ) : (
                          <div className="w-full overflow-x-auto">
                            <table className="min-w-full text-left">
                              <thead className="text-gray-600 text-sm">
                                <tr>
                                  <th className="py-3 pr-4 w-24">Select</th>
                                  <th className="py-3 pr-4 w-20">S.No</th>
                                  <th className="py-3 pr-4">Course Name</th>
                                  <th className="py-3 pr-4">Status</th>
                                  <th className="py-3 pr-4">Start Date</th>
                                  <th className="py-3 pr-4">End Date</th>
                                </tr>
                              </thead>
                              <tbody>
                                {rows.map((course) => (
                                  <tr key={course.id} className="border-t border-gray-100 dark:border-gray-800">
                                    <td className="py-4 pr-2">
                                      <input
                                        type="checkbox"
                                        className="h-4 w-4 accent-blue-600"
                                        checked={!!selectedInactive[course.id]}
                                        onChange={(e) => handleToggleInactiveCourse(course.id, e.target.checked)}
                                      />
                                    </td>
                                    <td className="py-4 pr-4">{course.sno}</td>
                                    <td className="py-4 pr-4">
                                      <div className="font-medium text-gray-900 dark:text-gray-100">{course.name}</div>
                                    </td>
                                    <td className="py-4 pr-4">
                                      <span className={`inline-flex items-center text-xs rounded-full px-3 py-1 ${statusBadgeClasses[course.status]}`}>
                                        ● {course.status}
                                      </span>
                                    </td>
                                    <td className="py-4 pr-4 text-sm">{course.startDate}</td>
                                    <td className="py-4 pr-4 text-sm">{course.endDate}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                    footerContent={
                      <div className="mt-6 border-t border-gray-200 dark:border-gray-800 pt-4">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-sm text-gray-500">
                              {inactiveSelectedCount} course{inactiveSelectedCount === 1 ? '' : 's'} × ₹{DEFAULT_COURSE_PRICE.toLocaleString('en-IN')} per course
                            </p>
                            <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                              {formatCurrency(totalInactivePrice)}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="relative group">
                              <Button
                                disabled={!inactiveSelectedCount || isPaying}
                                onClick={handleFreeListing}
                                variant="outline"
                                className="px-6 py-3 rounded-2xl border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 disabled:opacity-60"
                              >
                                Free Listing
                              </Button>
                              {/* Hover Tooltip */}
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-4 py-3 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 w-64 z-50 pointer-events-none">
                                <div className="font-semibold mb-1 text-amber-600 dark:text-amber-500">⚠️ Limited Features</div>
                                <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                                  <li>• Basic listing visibility only</li>
                                  <li>• No analytics or lead tracking</li>
                                  <li>• Limited support priority</li>
                                </ul>
                                {/* Arrow */}
                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-white dark:border-t-gray-900"></div>
                              </div>
                            </div>
                            <Button
                              disabled={!inactiveSelectedCount || isPaying}
                              onClick={handleProceedToPay}
                              className="px-6 py-3 rounded-2xl bg-blue-600 text-white dark:text-gray-100 hover:bg-blue-700 dark:hover:bg-blue-800 disabled:opacity-60"
                            >
                              {isPaying ? "Processing..." : "Proceed To Pay"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    }
                  />
                </div>
              )}

              {/* Program Details table */}
              {activeTab === 'details' && (
                <div className="overflow-x-auto">
                  {Array.isArray(filteredPrograms) && filteredPrograms.length === 0 ? (
                    <div className="py-10 text-center text-gray-500">No programs found yet.</div>
                  ) : (
                    <table className="min-w-full text-left">
                      <thead className="text-gray-600 text-sm">
                        <tr>
                          <th className="py-2 pr-4 w-16">S.No</th>
                          <th className="py-2 pr-4">Course Name</th>
                          <th className="py-2 pr-4">Status</th>
                          <th className="py-2 pr-4">Start Date</th>
                          <th className="py-2 pr-4">End Date</th>
                          <th className="py-2 pr-4">Leads Generated</th>
                          <th className="py-2 pr-4">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visiblePrograms.map((p: Record<string, unknown>, idx: number) => (
                          <tr key={String(p._id) || idx} className="border-t border-gray-100 dark:border-gray-800">
                            <td className="py-4 pr-4">{String(idx + 1).padStart(2, '0')}</td>
                            <td className="py-4 pr-4">
                              <div className="font-medium">{String(p.programName || p.selectBranch)}</div>
                              <div className="text-xs text-gray-500 flex items-center gap-1">
                                <span className="opacity-60">◎</span> {String(p.branchName || (p.branch as Record<string, unknown>)?.branchName || 'Public')}
                              </div>
                            </td>
                            <td className="py-4 pr-4">
                              {(() => {
                                // const status = getProgramStatus(String(p.startDate || ''), String(p.endDate || ''));
                                const status = p.status as string;
                                const statusColors = {
                                  active: 'bg-green-100 text-green-700',
                                  // upcoming: 'bg-blue-100 text-blue-700',
                                  // expired: 'bg-red-100 text-red-700',
                                  inactive: 'bg-gray-100 text-gray-700'
                                };
                                // Map status to match analytics page
                                // const displayStatus = status.status === 'active' ? 'Live' : 
                                //                     status.status === 'upcoming' ? 'Paused' : 
                                //                     status.status === 'expired' ? 'Expired' : 
                                //                     'Draft';
                                return (
                                  <span className={`inline-flex items-center text-xs rounded-full px-2 py-1 ${statusColors[status as keyof typeof statusColors]}`}>
                                    ● {status}
                                  </span>
                                );
                              })()}
                            </td>
                            <td className="py-4 pr-4 text-sm">{formatDate(String(p.startDate || ''))}</td>
                            <td className="py-4 pr-4 text-sm">{formatDate(String(p.endDate || ''))}</td>
                            <td className="py-4 pr-4 text-sm">{typeof p.leadsGenerated === 'number' ? p.leadsGenerated : 0}</td>
                            <td className="py-4 pr-4 text-sm">
                              <div className="flex items-center gap-3 text-gray-500">
                                <button title="Delete" onClick={async () => { try { await programsAPI.remove(String(p._id), String(institution?._id)); queryClient.invalidateQueries({ queryKey: ['programs-page-list-institution-admin', institution?._id] }); } catch { } }} className="h-10 w-10 rounded-full border border-gray-200 dark:border-gray-800 flex items-center justify-center">
                                  <Image src="/Trash.png" alt="Delete" width={20} height={20} className="h-5 w-5 object-contain" />
                                </button>
                                <button title="Edit" onClick={() => handleEditProgram(String(p._id))} className="h-10 w-10 rounded-full border border-gray-200 dark:border-gray-800 flex items-center justify-center">
                                  <Image src="/Edit.png" alt="Edit" width={20} height={20} className="h-5 w-5 object-contain" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                  {Array.isArray(filteredPrograms) && filteredPrograms.length > visibleCount && (
                    <div className="flex items-center justify-center py-5">
                      <Button variant="outline" onClick={() => setVisibleCount((c) => c + 10)} className="rounded-full">View more ▾</Button>
                    </div>
                  )}
                </div>
              )}

              {/* Add Program tab */}
              {activeTab === 'add' && (
                <div className="mt-6">
                  {addInlineMode === 'none' && (
                    <div className="flex items-center justify-center gap-6 flex-wrap">
                      <button onClick={() => setAddInlineMode('course')} className="rounded-2xl bg-blue-50/70 dark:bg-gray-800 border border-blue-100 dark:border-gray-700 flex flex-col items-center justify-center text-center w-[200px] h-[120px]">
                        <div className="h-12 w-12 rounded-full bg-white text-gray-700 flex items-center justify-center text-2xl mb-3">+</div>
                        <div className="text-gray-800 dark:text-gray-100 font-medium">Add Program</div>
                      </button>
                      <button onClick={() => setAddInlineMode('branch')} className="rounded-2xl bg-blue-50/70 dark:bg-gray-800 border border-blue-100 dark:border-gray-700 flex flex-col items-center justify-center text-center w-[200px] h-[120px]">
                        <div className="h-12 w-12 rounded-full bg-white text-gray-700 flex items-center justify-center text-2xl mb-3">+</div>
                        <div className="text-gray-800 dark:text-gray-100 font-medium">Add Branch</div>
                      </button>
                    </div>
                  )}
                  {addInlineMode !== 'none' && (
                    <div className="space-y-4">
                      <div>
                        <Button variant="outline" onClick={() => setAddInlineMode('none')}>Back</Button>
                      </div>
                      <L2DialogBox
                        renderMode="inline"
                        initialSection={addInlineMode === 'course' ? 'course' : 'branch'}
                        mode={addInlineMode === 'course' ? 'subscriptionProgram' : 'default'}
                        institutionId={institution?._id}
                        onSuccess={() => { onL2Success(); setAddInlineMode('none'); }}
                        onPrevious={() => setAddInlineMode('none')}
                      />
                    </div>
                  )}
                </div>
              )}

            </_CardContent>
          </_Card>

          {/* _Card 2: Transaction History */}
          <_Card className="bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl">
            <_CardContent className="p-4 sm:p-6">
              <div className="text-2xl font-semibold mb-4">Transaction History</div>
              {/* Header row */}
              <div className="grid grid-cols-12 text-sm text-gray-600 px-3 pb-2">
                <div className="col-span-2 sm:col-span-1">S.No</div>
                <div className="col-span-4 sm:col-span-3">Invoice ID</div>
                <div className="col-span-3 sm:col-span-3">Date</div>
                <div className="col-span-3 sm:col-span-2">Plan type</div>
                <div className="hidden sm:block col-span-2">Amount</div>
                <div className="col-span-1 text-right">Action</div>
              </div>
              <div className="space-y-3">
                {Array.isArray(paidInvoices) && paidInvoices.length === 0 ? (
                  <div className="py-6 text-center text-gray-500">No transactions found yet.</div>
                ) : (
                  (paidInvoices || []).map((inv: Record<string, unknown>, idx: number) => (
                    <div key={String(inv._id) || idx} className="grid grid-cols-12 items-center bg-white dark:bg-gray-900 rounded-xl px-3 py-4 shadow-[0_1px_0_rgba(0,0,0,0.03)]">
                      <div className="col-span-2 sm:col-span-1 text-gray-700">{String(idx + 1).padStart(2, '0')}</div>
                      <div className="col-span-4 sm:col-span-3 font-medium text-gray-900">{String(inv.invoiceId)}</div>
                      <div className="col-span-3 sm:col-span-3 text-gray-700">{inv.date ? new Date((inv.date as string | number)).toLocaleDateString('en-GB') : '—'}</div>
                      <div className="col-span-3 sm:col-span-2 text-gray-700">{String(inv.planType || '—')}</div>
                      <div className="hidden sm:block col-span-2 text-gray-900">{typeof inv.amount === 'number' ? `₹ ${inv.amount.toFixed(2)}` : '—'}</div>
                      <div className="col-span-1 flex justify-end">
                        <button title="Download" className="h-9 w-9 rounded-full border border-gray-200 dark:border-gray-700 flex items-center justify-center">⬇︎</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </_CardContent>
          </_Card>
        </>
      )}
    </div>
  );
}

function ProgramsPageWrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProgramsPage />
    </Suspense>
  );
}

export default withAuth(ProgramsPage);