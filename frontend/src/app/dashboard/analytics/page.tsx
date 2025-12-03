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
	const [analyticsRange, setAnalyticsRange] = useState<"Weekly"|"Monthly"|"Yearly">("Weekly");
	const [coursePerformance, setCoursePerformance] = useState<CoursePerformanceRow[]>([]);
	const [, setKpiCourseViews] = useState<number>(0);
	const [kpiLeads, setKpiLeads] = useState<number>(0);
	const [, setKpiViewsDelta] = useState<{value:number; isPositive:boolean}>({ value: 0, isPositive: true });
	const [kpiCallbacks, setKpiCallbacks] = useState<number>(0);
	const [kpiLeadsDelta, setKpiLeadsDelta] = useState<{value:number; isPositive:boolean}>({ value: 0, isPositive: true });
	const [isKpiLoading, setIsKpiLoading] = useState<boolean>(false);
	const [viewLeadTrends, setViewLeadTrends] = useState<{ views: number[]; leads: number[] } | null>(null);
	const [leadTypes, setLeadTypes] = useState<LeadTypeData | null>(null);
	const [isPerfLoading, setIsPerfLoading] = useState<boolean>(false);
	const [isTrendLoading, setIsTrendLoading] = useState<boolean>(false);
	const [institutionId, setInstitutionId] = useState<string | null>(null);
	const [institutionAdminId, setInstitutionAdminId] = useState<string | null>(null);
	const queryClient = useQueryClient();
	const router = useRouter();
	const { user } = useAuth();

	// Use shared analytics context (fetched once at layout level)
	const { weekly, monthly, yearly, isLoading: analyticsLoading } = useAnalyticsContext();
	const analyticsRangeLower = analyticsRange.toLowerCase() as 'weekly'|'monthly'|'yearly';
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

    // Effect 2: Trends derived purely from unified analytics yearly data (context)
    useEffect(() => {
        if (!yearlyAnalytics) {
            setIsTrendLoading(true);
            return;
        }
        
        try {
            setIsTrendLoading(true);
            const viewsArr = new Array(12).fill(0);
            const leadsArr = new Array(12).fill(0);
            
            // Extract monthly Views from yearly analytics context
            if (yearlyAnalytics?.views?.analytics) {
                yearlyAnalytics.views.analytics.forEach((item: { label: string; count: number }) => {
                    const monthMatch =
                        item.label.match(/(\d{4})-(\d{2})/) ||
                        item.label.match(/Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/i);
                    if (!monthMatch) return;

                    let monthIndex = -1;
                    if (monthMatch[2]) {
                        monthIndex = parseInt(monthMatch[2], 10) - 1; // 0-11
                    } else if (monthMatch[0]) {
                        const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
                        monthIndex = monthNames.findIndex(m => monthMatch[0].toLowerCase().startsWith(m));
                    }
                    if (monthIndex >= 0 && monthIndex < 12) {
                        viewsArr[monthIndex] = item.count || 0;
                    }
                });
            }
            
            // Extract monthly Leads from yearly analytics context
            if (yearlyAnalytics?.leads?.analytics) {
                yearlyAnalytics.leads.analytics.forEach((item: { label: string; count: number }) => {
                    const monthMatch =
                        item.label.match(/(\d{4})-(\d{2})/) ||
                        item.label.match(/Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/i);
                    if (!monthMatch) return;

                    let monthIndex = -1;
                    if (monthMatch[2]) {
                        monthIndex = parseInt(monthMatch[2], 10) - 1;
                    } else if (monthMatch[0]) {
                        const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
                        monthIndex = monthNames.findIndex(m => monthMatch[0].toLowerCase().startsWith(m));
                    }
                    if (monthIndex >= 0 && monthIndex < 12) {
                        leadsArr[monthIndex] = item.count || 0;
                    }
                });
            }

            // Use context-only data for the trends component
            setViewLeadTrends({ views: viewsArr, leads: leadsArr });
        } catch {
            console.error('Analytics: trends processing failed');
        } finally {
            setIsTrendLoading(false);
        }
    }, [yearlyAnalytics]);

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
				const name = pg.programName;
				const views = viewsMap.get(name) || 0;
				const lead = leadCounts.get(name) || { leads: 0, lastTs: null };
				
				// Normalize to simple "Active"/"Inactive" status like subscription page
				const programStatus = getProgramStatus(pg.startDate || '', pg.endDate || '');
				let status: 'Active' | 'Inactive' = 'Inactive';

				if (programStatus.status === 'active') {
					status = 'Active';
				} else if (programStatus.status === 'upcoming') {
					// Upcoming programs are treated as Inactive until they start
					status = 'Inactive';
				} else if (programStatus.status === 'expired') {
					status = 'Inactive';
				} else {
					// Fallback for programs without dates: recent leads -> Active
					if (lead.leads > 0 && (lead.lastTs || 0) >= (NOW - WINDOW_MS)) {
						status = 'Active';
					}
				}
				
				return {
					sno: (idx + 1).toString().padStart(2, '0'),
					name,
					status,
					views,
					leads: lead.leads,
					engagementRate: '0%'
				};
			});
			const totalLeads = rows.reduce((sum, r) => sum + r.leads, 0) || 1;
			rows.forEach(r => { r.engagementRate = `${((r.leads / totalLeads) * 100).toFixed(1)}%`; });
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
				let origin = apiBase.replace('/api','');
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
		return () => { try { if (s) { s.off('courseViewsUpdated', () => {}); s.off('enquiryCreated', () => {}); s.off('comparisonsUpdated', () => {}); s.off('programViewsUpdated', () => {}); } } catch {
			console.error('Analytics: socket cleanup failed');
		} };
	}, [institutionId, institutionAdminId, analyticsRangeLower, queryClient]);


	// Navigation function for analytics action button
	const handleAnalyticsAction = () => {
		router.push('/dashboard/subscription');
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
								trend={{value: 0, isPositive: true}}
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
				<AnalyticsTable rows={coursePerformance} titleOverride="Program Performance" nameHeaderOverride="Program name" onAddCourse={handleAnalyticsAction} />
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
						yTicksOverride={[0,1000,5000,10000,15000,20000]}
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