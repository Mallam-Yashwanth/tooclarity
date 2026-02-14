"use client";

import React, { useEffect, useState } from "react";
import { _Card, _CardContent } from "@/components/ui/card";
import AnalyticsTable, { CoursePerformanceRow } from "@/components/dashboard/AnalyticsTable";
import CourseReachChart from "@/components/dashboard/CourseReachChart";
import LeadTypeAnalytics, { LeadTypeData } from "@/components/dashboard/LeadTypeAnalytics";
import { programsAPI } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import { withAuth, useAuth } from "@/lib/auth-context";
import Loading from "@/components/ui/loading";
import { motion, AnimatePresence } from "framer-motion";
import StatCard from "@/components/dashboard/StatCard";
import TimeRangeToggle, { TimeRangeValue } from "@/components/ui/TimeRangeToggle";
import { useInstitution, useProgramViews, useProgramsList, useRecentEnquiriesAll, QUERY_KEYS } from "@/lib/hooks/dashboard-hooks";
import { useAnalyticsContext } from "@/components/providers/AnalyticsProvider";
import { useQueryClient } from "@tanstack/react-query";
import { getProgramStatus } from "@/lib/utility";
import { useRouter } from "next/navigation";

function AnalyticsPage() {
	// Helper function to calculate appropriate Y-axis ticks based on data
	const calculateYAxisTicks = (values: number[], leadsValues: number[]): number[] => {
		const allValues = [...values, ...leadsValues];
		const maxValue = Math.max(...allValues, 1);

		let upperBound: number;
		if (maxValue <= 10) {
			upperBound = 10;
		} else if (maxValue <= 50) {
			upperBound = 50;
		} else if (maxValue <= 100) {
			upperBound = 100;
		} else if (maxValue <= 500) {
			upperBound = Math.ceil(maxValue / 100) * 100;
		} else if (maxValue <= 1000) {
			upperBound = Math.ceil(maxValue / 200) * 200;
		} else if (maxValue <= 5000) {
			upperBound = Math.ceil(maxValue / 1000) * 1000;
		} else {
			upperBound = Math.ceil(maxValue / 5000) * 5000;
		}

		const step = upperBound / 5;
		return [0, step, step * 2, step * 3, step * 4, upperBound];
	};

	const [analyticsRange, setAnalyticsRange] = useState<"Weekly" | "Monthly" | "Yearly">("Weekly");
	const [coursePerformance, setCoursePerformance] = useState<CoursePerformanceRow[]>([]);
	const [, setKpiCourseViews] = useState<number>(0);
	const [kpiLeads, setKpiLeads] = useState<number>(0);
	const [, setKpiViewsDelta] = useState<{ value: number; isPositive: boolean }>({ value: 0, isPositive: true });
	const [kpiCallbacks, setKpiCallbacks] = useState<number>(0);
	const [kpiLeadsDelta, setKpiLeadsDelta] = useState<{ value: number; isPositive: boolean }>({ value: 0, isPositive: true });
	const [isKpiLoading, setIsKpiLoading] = useState<boolean>(false);
	const [viewLeadTrends, setViewLeadTrends] = useState<{ views: number[]; leads: number[]; labels?: string[]; yTicks?: number[] } | null>(null);
	const [leadTypes, setLeadTypes] = useState<LeadTypeData | null>(null);
	const [isPerfLoading, setIsPerfLoading] = useState<boolean>(false);
	const [isTrendLoading, setIsTrendLoading] = useState<boolean>(false);
	const [institutionId, setInstitutionId] = useState<string | null>(null);
	const [institutionAdminId, setInstitutionAdminId] = useState<string | null>(null);
	const queryClient = useQueryClient();
	const router = useRouter();
	const { user } = useAuth();

	// Pagination state
	const [visibleCount, setVisibleCount] = useState<number>(5);

	const handleLoadMore = () => {
		setVisibleCount((prev) => prev + 5);
	};

	// Use shared analytics context (fetched once at layout level)
	const { weekly, monthly, yearly, isLoading: analyticsLoading } = useAnalyticsContext();
	const analyticsRangeLower = analyticsRange.toLowerCase() as 'weekly' | 'monthly' | 'yearly';
	const allAnalytics = analyticsRangeLower === 'weekly' ? weekly : analyticsRangeLower === 'monthly' ? monthly : yearly;
	const yearlyAnalytics = yearly;

	// Program views KPI via unified analytics (views) only (context)
	const kpiProgramViews = allAnalytics?.views ? allAnalytics.views.totalCount : 0;

	// Data for Program Performance Table
	const { data: programsList } = useProgramsList();
	const { data: recentEnquiries } = useRecentEnquiriesAll();
	const { data: institution } = useInstitution();

	// Effect 1: Update KPIs from unified analytics (views/leads/callbacks/demos)
	useEffect(() => {
		setIsKpiLoading(analyticsLoading);

		if (allAnalytics) {
			setKpiLeads(allAnalytics.leads.totalCount);
			// Calculate trend (can be enhanced later with previous period comparison)
			setKpiLeadsDelta({ value: 0, isPositive: true });

			// Callback & demo requests from unified analytics controller
			setKpiCallbacks(allAnalytics.callbackRequest?.totalCount || 0);
			setKpiViewsDelta({ value: 0, isPositive: true });
		}
	}, [analyticsLoading, allAnalytics]);

	// Effect 2: Trends derived purely from unified analytics (context)
	useEffect(() => {
		if (!allAnalytics) {
			setIsTrendLoading(true);
			return;
		}

		try {
			setIsTrendLoading(true);
			let viewsArr: number[] = [];
			let leadsArr: number[] = [];
			let labels: string[] = [];

			const range = analyticsRangeLower;

			if (range === 'weekly') {
				viewsArr = new Array(7).fill(0);
				leadsArr = new Array(7).fill(0);
				const today = new Date();
				const buckets: string[] = [];

				for (let i = 6; i >= 0; i--) {
					const d = new Date();
					d.setDate(today.getDate() - i);
					labels.push(d.toLocaleDateString('en-US', { weekday: 'short' }));
					buckets.push(d.toISOString().split('T')[0]);
				}

				// Helper to fill array with timezone tolerance
				const fillArr = (source: { label: string; count: number }[], target: number[]) => {
					if (!source) return;
					source.forEach(item => {
						let idx = buckets.indexOf(item.label);
						// Try +1 day shift correction
						if (idx === -1) {
							try {
								const d = new Date(item.label);
								d.setDate(d.getDate() + 1);
								const nextDay = d.toISOString().split('T')[0];
								idx = buckets.indexOf(nextDay);
							} catch { /* ignore */ }
						}

						if (idx >= 0) target[idx] = (target[idx] || 0) + item.count;
						else {
							const bucketIdx = labels.findIndex(l => item.label.includes(l));
							if (bucketIdx >= 0) target[bucketIdx] = (target[bucketIdx] || 0) + item.count;
						}
					});
				};

				fillArr(allAnalytics.views?.analytics || [], viewsArr);
				fillArr(allAnalytics.leads?.analytics || [], leadsArr);

			} else if (range === 'monthly') {
				const days = 30;
				viewsArr = new Array(days).fill(0);
				leadsArr = new Array(days).fill(0);
				const today = new Date();
				const buckets: string[] = [];

				for (let i = days - 1; i >= 0; i--) {
					const d = new Date();
					d.setDate(today.getDate() - i);
					labels.push(d.getDate().toString());
					buckets.push(d.toISOString().split('T')[0]);
				}

				const fillArr = (source: { label: string; count: number }[], target: number[]) => {
					if (!source) return;
					source.forEach(item => {
						let idx = buckets.indexOf(item.label);
						// Try +1 day shift correction
						if (idx === -1) {
							try {
								const d = new Date(item.label);
								d.setDate(d.getDate() + 1);
								const nextDay = d.toISOString().split('T')[0];
								idx = buckets.indexOf(nextDay);
							} catch { /* ignore */ }
						}
						if (idx >= 0) target[idx] = (target[idx] || 0) + item.count;
					});
				};

				fillArr(allAnalytics.views?.analytics || [], viewsArr);
				fillArr(allAnalytics.leads?.analytics || [], leadsArr);

				labels = labels.map((l, i) => i % 5 === 0 ? l : '');

			} else {
				viewsArr = new Array(12).fill(0);
				leadsArr = new Array(12).fill(0);
				labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

				const fillYearly = (source: { label: string; count: number }[], target: number[]) => {
					if (!source) return;
					source.forEach(item => {
						const monthMatch = item.label.match(/(\d{4})-(\d{2})/) || item.label.match(/Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/i);
						if (!monthMatch) return;
						let monthIndex = -1;
						if (monthMatch[2]) monthIndex = parseInt(monthMatch[2], 10) - 1;
						else if (monthMatch[0]) {
							const mNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
							monthIndex = mNames.findIndex(m => monthMatch[0].toLowerCase().startsWith(m));
						}
						if (monthIndex >= 0 && monthIndex < 12) target[monthIndex] = item.count || 0;
					});
				};

				fillYearly(allAnalytics.views?.analytics || [], viewsArr);
				fillYearly(allAnalytics.leads?.analytics || [], leadsArr);
			}

			// Calculate appropriate Y-axis ticks based on actual data
			const yTicks = calculateYAxisTicks(viewsArr, leadsArr);

			console.log('DEBUG: viewLeadTrends data:', { views: viewsArr, leads: leadsArr, labels, yTicks });
			setViewLeadTrends({ views: viewsArr, leads: leadsArr, labels, yTicks });
		} catch (err) {
			console.error('Analytics: trends processing failed', err);
		} finally {
			setIsTrendLoading(false);
		}
	}, [allAnalytics, analyticsRangeLower]);

	// Effect 2.5: Derive identifiers for socket rooms from context/hooks (no extra profile API)
	useEffect(() => {
		const iid = institution?._id || null;
		const oid = (user as { id?: string; _id?: string } | null)?.id || (user as { id?: string; _id?: string } | null)?._id || null;
		setInstitutionId(iid);
		setInstitutionAdminId(oid);
	}, [institution?._id, user]);


	// Build Program Performance Table from programs list + program views summary + recent enquiries
	useEffect(() => {
		try {
			setIsPerfLoading(true);
			const programs = Array.isArray(programsList) ? programsList : [];
			console.log('DEBUG: Programs List for Analytics:', programs);
			const viewsMap = new Map<string, number>();
			// Use unified yearly views context as aggregate only; no extra range-based API calls
			const leadCounts = new Map<string, { leads: number; lastTs: number | null }>();
			(Array.isArray(recentEnquiries) ? recentEnquiries : []).forEach((e: Record<string, unknown>) => {
				const p = e.programInterest || 'Unknown Program';
				const ts = e.createdAt ? new Date((e.createdAt as string | number)).getTime() : Date.now();
				const prev = leadCounts.get((p as string)) || { leads: 0, lastTs: null };
				prev.leads += 1;
				prev.lastTs = Math.max(prev.lastTs || 0, ts);
				leadCounts.set((p as string), prev);
			});
			const NOW = Date.now();
			const WINDOW_MS = 30 * 24 * 60 * 60 * 1000;
			const rows: CoursePerformanceRow[] = programs.map((pg, idx) => {
				// Fix: Ensure program name is never empty
				// The programsList hook maps api response to { programName, courseName, ... }
				// If programName is missing, try courseName, then selectBranch, then fallback.
				const name = pg.programName || pg.courseName || pg.selectBranch || `Program ${idx + 1}`;
				const views = viewsMap.get(name) || 0;
				const lead = leadCounts.get(name) || { leads: 0, lastTs: null };

				// Normalize to simple "Active"/"Inactive" status
				// PRIORITY: Use backend status field first (set when payment is successful)
				const backendStatus = String(pg.status || '').toLowerCase();
				let status: 'Active' | 'Inactive' = 'Inactive';

				if (backendStatus === 'active') {
					// Backend explicitly says Active (payment completed)
					status = 'Active';
				} else if (backendStatus === 'inactive') {
					// Backend explicitly says Inactive
					status = 'Inactive';
				} else {
					// Fallback: use date-based calculation if backend status is missing
					const programStatus = getProgramStatus(pg.startDate || '', pg.endDate || '');
					if (programStatus.status === 'active') {
						status = 'Active';
					} else if (lead.leads > 0 && (lead.lastTs || 0) >= (NOW - WINDOW_MS)) {
						// Additional fallback: recent leads indicate activity
						status = 'Active';
					}
				}

				return {
					sno: (idx + 1).toString().padStart(2, '0'),
					name,
					status,
					views,
					leads: lead.leads
				};
			});
			rows.sort((a, b) => (b.leads - a.leads) || b.views - a.views || a.name.localeCompare(b.name));
			const resequenced = rows.map((r, i) => ({ ...r, sno: (i + 1).toString().padStart(2, '0') }));
			setCoursePerformance(resequenced);
		} catch (err) {
			console.error('Analytics: build program performance failed', err);
		} finally {
			setIsPerfLoading(false);
		}
	}, [programsList, recentEnquiries, yearlyAnalytics]);

	// Effect 4: Lead type totals once; independent of KPI time range
	useEffect(() => {
		if (!institution?._id || !yearlyAnalytics) return;

		try {
			const callbacksTotal = yearlyAnalytics.callbackRequest?.totalCount || 0;
			const demosTotal = yearlyAnalytics.bookDemoRequest?.totalCount || 0;

			// Derive "course comparisons" from yearly leads as a proxy
			const comparisonsTotal =
				yearlyAnalytics.leads?.totalCount || 0;

			setLeadTypes({
				callBackRequests: callbacksTotal,
				demoRequests: demosTotal,
				courseComparisons: comparisonsTotal,
			});
		} catch {
			console.error("Analytics: lead types derivation failed");
		}
	}, [institution?._id, yearlyAnalytics]);

	// Effect 5: Realtime updates via Socket.IO
	useEffect(() => {
		if (!institutionId && !institutionAdminId) return;
		let s: { on: (event: string, handler: (...args: unknown[]) => void) => void; emit: (event: string, ...args: unknown[]) => void; off: (event: string, handler: (...args: unknown[]) => void) => void } | null;
		(async () => {
			try {
				const apiBase = process.env.NEXT_PUBLIC_API_URL || "";
				let origin = apiBase.replace('/api', '');
				if (!origin) origin = typeof window !== 'undefined' ? window.location.origin : '';
				s = await getSocket(origin);
				if (s) {
					s.on('connect', async () => {
						if (institutionId) s?.emit('joinInstitution', institutionId);
						if (institutionAdminId) s?.emit('joinInstitutionAdmin', institutionAdminId);
					});

					// When views change, invalidate unified analytics cache
					s.on('courseViewsUpdated', async () => {
						try {
							// Invalidate all time ranges since they're all fetched at once
							queryClient.invalidateQueries({ queryKey: ['all-unified-analytics'], exact: false });
							queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CHART_DATA('views', new Date().getFullYear(), institutionId || undefined) });
						} catch (err) { console.error('Analytics: realtime courseViews update failed', err); }
					});

					// When an enquiry is created, invalidate caches: leads KPI, series, and recent enquiries used for program table
					s.on('enquiryCreated', async () => {
						try {
							// Invalidate all time ranges since they're all fetched at once
							queryClient.invalidateQueries({ queryKey: ['all-unified-analytics'], exact: false });
							queryClient.invalidateQueries({ queryKey: ['chart-data', 'leads', new Date().getFullYear(), institutionId] });
							queryClient.invalidateQueries({ queryKey: ['recent-enquiries-all', institutionId] });
							queryClient.invalidateQueries({ queryKey: ['recent-enquiries', institutionId] });
						} catch (err) { console.error('Analytics: realtime enquiryCreated invalidation failed', err); }
					});

					// When program views change, invalidate program-views query to refetch lazily
					s.on('programViewsUpdated', async () => {
						try {
							queryClient.invalidateQueries({ queryKey: ['program-views', institutionId], exact: false });
							queryClient.invalidateQueries({ queryKey: ['programs-list', institutionId] });
						} catch (err) { console.error('Analytics: programViews invalidate failed', err); }
					});

					// When comparisons change, invalidate unified analytics cache
					s.on('comparisonsUpdated', async () => {
						try {
							// Invalidate all time ranges since they're all fetched at once
							queryClient.invalidateQueries({ queryKey: ['all-unified-analytics'], exact: false });
						} catch {
							console.error('Analytics: realtime comparisons update failed');
						}
					});
				}
			} catch {
				console.error('Analytics: socket setup failed');
			}
		})();
		return () => {
			try { if (s) { s.off('courseViewsUpdated', () => { }); s.off('enquiryCreated', () => { }); s.off('comparisonsUpdated', () => { }); s.off('programViewsUpdated', () => { }); } } catch {
				console.error('Analytics: socket cleanup failed');
			}
		};
	}, [institutionId, institutionAdminId, analyticsRangeLower, queryClient]);


	// Navigation function for analytics action button
	const handleAnalyticsAction = () => {
		router.push('/dashboard/listings');
	};

	return (
		<div className="grid grid-cols-1 gap-6 mb-6 p-2 mt-5 rounded-2xl">
			<_Card className="m-5 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl">
				<_CardContent className="p-4 sm:p-6">
					{/* Header with Time Range Toggle to mirror dashboard UI */}
					<div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-2 mb-4 sm:mb-6 m-0">
						<div className="text-lg sm:text-sm md:text-2xl font-semibold">Analytics</div>
						<div className="ml-0 sm:ml-auto flex items-center gap-2 w_full sm:w-auto">
							<TimeRangeToggle value={analyticsRange as TimeRangeValue} onChange={setAnalyticsRange as (value: TimeRangeValue) => void} />
						</div>
					</div>

					{/* KPI cards with same animation/loading as dashboard */}
					<motion.div
						className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4"
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5 }}
					>
						<AnimatePresence mode="wait">
							<StatCard
								title="Total Program Views"
								value={kpiProgramViews}
								trend={{ value: 0, isPositive: true }}
								isLoading={isKpiLoading}
								showFilters={false}
							/>
						</AnimatePresence>
						<AnimatePresence mode="wait">
							<StatCard
								//title="Course Views"
								//value={kpiCourseViews}
								//trend={kpiViewsDelta}
								//isLoading={isKpiLoading}
								//showFilters={false}
								title="Callback Leads"
								value={kpiCallbacks}
								trend={{ value: 0, isPositive: true }}
								isLoading={isKpiLoading}
								showFilters={false}
							/>
						</AnimatePresence>
						<AnimatePresence mode="wait">
							<StatCard
								title="Leads Generated"
								value={kpiLeads}
								trend={kpiLeadsDelta}
								isLoading={isKpiLoading}
								showFilters={false}
							/>
						</AnimatePresence>
					</motion.div>
				</_CardContent>
			</_Card>

			{/* Program performance table with inner loading */}
			<div className="relative">
				{isPerfLoading ? (
					<div className="absolute inset-0 flex items-center justify-center z-10">
						<Loading size="md" text="Loading program performance..." />
					</div>
				) : null}
				<AnalyticsTable
					rows={coursePerformance.slice(0, visibleCount)}
					titleOverride="Program Performance"
					nameHeaderOverride="Program name"
					onAddCourse={handleAnalyticsAction}
					hasMore={visibleCount < coursePerformance.length}
					onLoadMore={handleLoadMore}
				/>
			</div>

			{/* View & Lead Trends with inner loading */}
			<div className="relative">
				{isTrendLoading ? (
					<div className="absolute inset-0 flex items-center justify-center z-10">
						<Loading size="md" text="Loading trends..." />
					</div>
				) : null}
				{viewLeadTrends && (
					<CourseReachChart
						title="View & Lead Trends"
						values={viewLeadTrends.views}
						leadsValues={viewLeadTrends.leads}
						showLegend={true}
						timeRange={analyticsRange}
						xLabels={viewLeadTrends.labels}
						yTicksOverride={viewLeadTrends.yTicks}
					/>
				)}
			</div>

			{leadTypes && (
				<LeadTypeAnalytics data={leadTypes} title="Inquiry Type Analysis" />
			)}
		</div>
	);
}

export default withAuth(AnalyticsPage);