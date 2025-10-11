"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import AnalyticsTable, { CoursePerformanceRow } from "@/components/dashboard/AnalyticsTable";
import CourseReachChart from "@/components/dashboard/CourseReachChart";
import LeadTypeAnalytics, { LeadTypeData } from "@/components/dashboard/LeadTypeAnalytics";
import { analyticsAPI, metricsAPI, enquiriesAPI, authAPI, programsAPI } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import { withAuth } from "@/lib/auth-context";
import Loading from "@/components/ui/loading";
import { motion, AnimatePresence } from "framer-motion";
import StatCard from "@/components/dashboard/StatCard";
import TimeRangeToggle, { TimeRangeValue } from "@/components/ui/TimeRangeToggle";
import { useInstitution, useProgramViews, useProgramsList, useRecentEnquiriesAll } from "@/lib/hooks/dashboard-hooks";
import { useQueryClient } from "@tanstack/react-query";
import { getProgramStatus } from "@/lib/utility";
import { useRouter } from "next/navigation";

function AnalyticsPage() {
	const [analyticsRange, setAnalyticsRange] = useState<"Weekly"|"Monthly"|"Yearly">("Weekly");
	const [coursePerformance, setCoursePerformance] = useState<CoursePerformanceRow[]>([]);
	const [kpiCourseViews, setKpiCourseViews] = useState<number>(0);
	const [kpiLeads, setKpiLeads] = useState<number>(0);
	const [kpiViewsDelta, setKpiViewsDelta] = useState<{value:number; isPositive:boolean}>({ value: 0, isPositive: true });
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

	// Program views KPI via backend summary (range-based)
	const programViewsRange = analyticsRange.toLowerCase() as 'weekly'|'monthly'|'yearly';
	const { data: programViewsData } = useProgramViews(programViewsRange);
	const kpiProgramViews = Array.isArray(programViewsData) ? programViewsData.reduce((sum, p:any) => sum + (Number(p.inRangeViews)||0), 0) : 0;

	// Data for Program Performance Table
	const { data: programsList } = useProgramsList();
	const { data: recentEnquiries } = useRecentEnquiriesAll();
	const { data: institution } = useInstitution();

	// Effect 1: KPIs depend on time range only
	useEffect(() => {
		let mounted = true;
		(async () => {
			try {
				setIsKpiLoading(true);
				const range = analyticsRange.toLowerCase() as 'weekly'|'monthly'|'yearly';
				const [viewsRange, leadsRange] = await Promise.all([
					metricsAPI.getInstitutionAdminByRange('views', range) as any,
					metricsAPI.getInstitutionAdminByRange('leads', range) as any,
				]);
				if (!mounted) return;
				if (viewsRange?.success) {
					setKpiCourseViews(viewsRange.data?.totalViews || 0);
					if (viewsRange.data?.trend) setKpiViewsDelta(viewsRange.data.trend);
				}
				if (leadsRange?.success) {
					setKpiLeads(leadsRange.data?.totalLeads || 0);
					if (leadsRange.data?.trend) setKpiLeadsDelta(leadsRange.data.trend);
				}
			} catch (err) { console.error('Analytics: KPI fetch failed', err); } finally {
				setIsKpiLoading(false);
			}
		})();
		return () => { mounted = false; };
	}, [analyticsRange]);

    // Effect 2: Trends load independently but require institution id
    useEffect(() => {
        if (!institution?._id) return;
        let mounted = true;
        (async () => {
            try {
                setIsTrendLoading(true);
                const year = new Date().getFullYear();
                const [viewsSeries, leadsSeries] = await Promise.all([
                    programsAPI.viewsSeries(String(institution._id), year) as any,
                    metricsAPI.getInstitutionAdminSeries('leads', year) as any,
                ]);
                if (!mounted) return;
				const viewsArr = new Array(12).fill(0);
				const leadsArr = new Array(12).fill(0);
				if (viewsSeries?.success && Array.isArray(viewsSeries.data?.series)) {
					viewsSeries.data.series.forEach((n: number, i: number) => { if (i>=0 && i<12) viewsArr[i] = n || 0; });
				}
				// Fallback to course views if program series is empty
				if (viewsArr.every(n => !n)) {
					const courseSeries = await metricsAPI.getInstitutionAdminSeries('views', year) as any;
					if (courseSeries?.success && Array.isArray(courseSeries.data?.series)) {
						courseSeries.data.series.forEach((n: number, i: number) => { if (i>=0 && i<12) viewsArr[i] = n || 0; });
					}
				}
				if (leadsSeries?.success && Array.isArray(leadsSeries.data?.series)) {
					leadsSeries.data.series.forEach((n: number, i: number) => { if (i>=0 && i<12) leadsArr[i] = n || 0; });
				}
				setViewLeadTrends({ views: viewsArr, leads: leadsArr });
			} catch (err) { console.error('Analytics: trends fetch failed', err); } finally {
				setIsTrendLoading(false);
			}
		})();
		return () => { mounted = false; };
    }, [institution]);

	// Effect 2.5: Fetch identifiers for socket rooms
	useEffect(() => {
		let mounted = true;
		(async () => {
			try {
				const [prof] = await Promise.all([
					authAPI.getProfile() as any,
				]);
				if (!mounted) return;
				const iid = institution?._id || null;
				const oid = prof?.data?.id || prof?.data?._id || null;
				setInstitutionId(iid);
				setInstitutionAdminId(oid);
			} catch (err) { console.error('Analytics: identifiers fetch failed', err); }
		})();
		return () => { mounted = false; };
	}, [institution]);


	// Build Program Performance Table from programs list + program views summary + recent enquiries
	useEffect(() => {
		try {
			setIsPerfLoading(true);
			const programs = Array.isArray(programsList) ? programsList : [];
			const viewsMap = new Map<string, number>();
			(Array.isArray(programViewsData) ? programViewsData : []).forEach((p: any) => {
				viewsMap.set(String(p.programName), Number(p.inRangeViews || 0));
			});
			const leadCounts = new Map<string, { leads: number; lastTs: number | null }>();
			(Array.isArray(recentEnquiries) ? recentEnquiries : []).forEach((e: any) => {
				const p = e.programInterest || 'Unknown Program';
				const ts = e.createdAt ? new Date(e.createdAt).getTime() : Date.now();
				const prev = leadCounts.get(p) || { leads: 0, lastTs: null };
				prev.leads += 1;
				prev.lastTs = Math.max(prev.lastTs || 0, ts);
				leadCounts.set(p, prev);
			});
			const NOW = Date.now();
			const WINDOW_MS = 30 * 24 * 60 * 60 * 1000;
			const rows: CoursePerformanceRow[] = programs.map((pg, idx) => {
				const name = pg.programName;
				const views = viewsMap.get(name) || 0;
				const lead = leadCounts.get(name) || { leads: 0, lastTs: null };
				
				// Use new program status logic based on startDate and endDate
				const programStatus = getProgramStatus(pg.startDate || '', pg.endDate || '');
				let status: 'Live'|'Paused'|'Draft'|'Expired' = 'Draft';
				
				if (programStatus.status === 'active') {
					status = 'Live';
				} else if (programStatus.status === 'upcoming') {
					status = 'Paused';
				} else if (programStatus.status === 'expired') {
					status = 'Expired';
				} else {
					// Fallback to old logic for programs without dates
					if (lead.leads > 0) status = (lead.lastTs || 0) >= (NOW - WINDOW_MS) ? 'Live' : 'Paused';
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
	}, [programsList, programViewsData, recentEnquiries]);

	// Effect 4: Lead type totals once; independent of KPI time range
	useEffect(() => {
		let mounted = true;
		(async () => {
            try {
				const [callbacksDemos, comparisons] = await Promise.all([
                    enquiriesAPI.getTypeSummaryRollups('yearly') as any,
                    // Prefer program comparisons sum; fallback to existing
                    programsAPI.summaryComparisons(String(institution?._id || ''), 'yearly').catch(()=>null) as any
				]);
				if (!mounted) return;
                let comparisonsTotal = 0;
                if (comparisons && (comparisons as any).success) {
                    const arr = (comparisons as any).data?.programs || [];
                    comparisonsTotal = Array.isArray(arr) ? arr.reduce((s:number,p:any)=> s + (Number(p.inRangeComparisons)||0), 0) : 0;
                }
                setLeadTypes({
                    callBackRequests: Number(callbacksDemos?.data?.callbacks || 0),
                    demoRequests: Number(callbacksDemos?.data?.demos || 0),
                    courseComparisons: comparisonsTotal
                });
			} catch (err) { console.error('Analytics: lead types fetch failed', err); }
		})();
		return () => { mounted = false; };
	}, []);

	// Effect 5: Realtime updates via Socket.IO
	useEffect(() => {
		if (!institutionId && !institutionAdminId) return;
		let s: any;
		let mounted = true;
		(async () => {
			try {
				const apiBase = process.env.NEXT_PUBLIC_API_URL || "";
				let origin = apiBase.replace('/api','');
				if (!origin) origin = typeof window !== 'undefined' ? window.location.origin : '';
				s = await getSocket(origin);
				s.on('connect', async () => {
					if (institutionId) s.emit('joinInstitution', institutionId);
					if (institutionAdminId) s.emit('joinInstitutionAdmin', institutionAdminId);
				});

				// When views change, refresh views KPI and views series
				s.on('courseViewsUpdated', async () => {
					try {
						const range = (analyticsRange.toLowerCase() as 'weekly'|'monthly'|'yearly');
						const [viewsRange, viewsSeries] = await Promise.all([
							metricsAPI.getInstitutionAdminByRange('views', range) as any,
							metricsAPI.getInstitutionAdminSeries('views', new Date().getFullYear()) as any,
						]);
						if (viewsRange?.success) {
							setKpiCourseViews(viewsRange.data?.totalViews || 0);
							if (viewsRange.data?.trend) setKpiViewsDelta(viewsRange.data.trend);
						}
						if (viewsSeries?.success && Array.isArray(viewsSeries.data?.series)) {
							const arr = new Array(12).fill(0);
							viewsSeries.data.series.forEach((n: number, i: number) => { if (i>=0 && i<12) arr[i] = n || 0; });
							setViewLeadTrends(prev => ({ views: arr, leads: prev?.leads || new Array(12).fill(0) }));
						}
					} catch (err) { console.error('Analytics: realtime courseViews update failed', err); }
				});

				// When an enquiry is created, invalidate caches: leads KPI, series, and recent enquiries used for program table
				s.on('enquiryCreated', async () => {
					try {
						const range = (analyticsRange.toLowerCase() as 'weekly'|'monthly'|'yearly');
						queryClient.invalidateQueries({ queryKey: ['metrics', 'leads', range, institutionId] });
						queryClient.invalidateQueries({ queryKey: ['chart-data', 'leads', new Date().getFullYear(), institutionId] });
						queryClient.invalidateQueries({ queryKey: ['recent-enquiries-all', institutionId] });
						queryClient.invalidateQueries({ queryKey: ['recent-enquiries', institutionId] });
					} catch (err) { console.error('Analytics: realtime enquiryCreated invalidation failed', err); }
				});

				// When program views change, invalidate program-views query to refetch lazily
				s.on('programViewsUpdated', async () => {
					try {
						queryClient.invalidateQueries({ queryKey: ['program-views', institutionId, programViewsRange] });
						queryClient.invalidateQueries({ queryKey: ['programs-list', institutionId] });
					} catch (err) { console.error('Analytics: programViews invalidate failed', err); }
				});

				// When comparisons change, refresh comparisons total inside lead type analysis only
				s.on('comparisonsUpdated', async () => {
					try {
						const cmp = await metricsAPI.getInstitutionAdminSummary('comparisons') as any;
						if (cmp?.success) {
							setLeadTypes(prev => prev ? { ...prev, courseComparisons: Number(cmp.data?.totalComparisons || 0) } : prev);
						}
					} catch (err) { console.error('Analytics: realtime comparisons update failed', err); }
				});
			} catch (err) { console.error('Analytics: socket setup failed', err); }
		})();
		return () => { try { mounted = false; s?.off('courseViewsUpdated'); s?.off('enquiryCreated'); s?.off('comparisonsUpdated'); s?.off('programViewsUpdated'); } catch (err) { console.error('Analytics: socket cleanup failed', err); } };
	}, [institutionId, institutionAdminId, analyticsRange, queryClient, programViewsRange]);

	const rangeText = analyticsRange.toLowerCase();

	// Navigation function for analytics action button
	const handleAnalyticsAction = () => {
		router.push('/dashboard/subscription');
	};

	return (
		<div className="grid grid-cols-1 gap-6 mb-6 p-2 mt-5 rounded-2xl">
			<Card className="m-5 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl">
				<CardContent className="p-4 sm:p-6">
					{/* Header with Time Range Toggle to mirror dashboard UI */}
					<div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-2 mb-4 sm:mb-6 m-0">
						<div className="text-lg sm:text-sm md:text-2xl font-semibold">Analytics</div>
						<div className="ml-0 sm:ml-auto flex items-center gap-2 w_full sm:w-auto">
							<TimeRangeToggle value={analyticsRange as TimeRangeValue} onChange={setAnalyticsRange as any} />
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
								title="Course Views"
								value={kpiCourseViews}
								trend={kpiViewsDelta}
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
				</CardContent>
			</Card>

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
