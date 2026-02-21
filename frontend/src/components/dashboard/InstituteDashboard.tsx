"use client";

import React from "react";
// import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/auth-context";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import DashboardStats from "@/components/dashboard/DashboardStats";
import AdCard from "@/components/dashboard/AdCard";
import StudentList, { StudentItem } from "@/components/dashboard/StudentList";
import CourseReachChart from "@/components/dashboard/CourseReachChart";
// import AdminDashboard from "@/components/dashboard/AdminDashboard";
// import { getMyInstitution, getInstitutionBranches, getInstitutionCourses } from "@/lib/api";
// import { authAPI, metricsAPI, enquiriesAPI } from "@/lib/api";
// import { getSocket } from "@/lib/socket";
import { useRecentStudents, useInstitution } from "@/lib/hooks/dashboard-hooks";
import { useAnalyticsContext } from "@/components/providers/AnalyticsProvider";
import { useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/hooks/dashboard-hooks";
import { socketManager } from "@/lib/socket";

interface DashboardStatsData {
    courseViews: number;
    courseComparisons: number;
    contactRequests: number;
    courseViewsTrend: { value: number; isPositive: boolean };
    courseComparisonsTrend: { value: number; isPositive: boolean };
    contactRequestsTrend: { value: number; isPositive: boolean };
}

interface FilterState {
    course: string;
    timeRange: 'weekly' | 'monthly' | 'yearly';
}

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1, duration: 0.3 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

export default function InstituteDashboard() {
    const { user } = useAuth();

    const [stats, setStats] = useState<DashboardStatsData>({
        courseViews: 0,
        courseComparisons: 0,
        contactRequests: 0,
        courseViewsTrend: { value: 0, isPositive: true },
        courseComparisonsTrend: { value: 0, isPositive: true },
        contactRequestsTrend: { value: 0, isPositive: true }
    });
    const [filters, setFilters] = useState<FilterState>({ course: "All Courses", timeRange: 'weekly' });
    const [students, setStudents] = useState<StudentItem[]>([]);
    const [isStatsLoading, setIsStatsLoading] = useState(true);
    const [isListLoading, setIsListLoading] = useState(true);
    const [institutionId, setInstitutionId] = useState<string | null>(null);
    const [chartValues, setChartValues] = useState<number[] | null>(null);
    const [leadsChartValues, setLeadsChartValues] = useState<number[] | null>(null);
    const [xLabels, setXLabels] = useState<string[]>([]);

    // ------- TanStack Query hooks (source of truth) -------
    const { data: inst } = useInstitution();
    // Use shared analytics context (fetched once at layout level)
    const { weekly, monthly, yearly, isLoading: analyticsLoading } = useAnalyticsContext();
    const allAnalytics = filters.timeRange === 'weekly' ? weekly : filters.timeRange === 'monthly' ? monthly : yearly;
    const yearlyAnalytics = yearly;
    const { data: recentStudents, isLoading: studentsLoading } = useRecentStudents();
    const queryClient = useQueryClient();

    // Sync hook data into existing local state so UI remains unchanged
    useEffect(() => {
        if (inst?._id) setInstitutionId(inst._id);
    }, [inst?._id]);

    useEffect(() => {
        setIsStatsLoading(analyticsLoading);

        if (allAnalytics) {
            // Calculate trends (compare current period with previous period)
            // For now, set default trends - can be enhanced later
            const courseViewsTrend = { value: 0, isPositive: true };
            const courseComparisonsTrend = { value: 0, isPositive: true };
            const contactRequestsTrend = { value: 0, isPositive: true };

            setStats({
                // 1) Program Views card → unified views total (context)
                courseViews: allAnalytics.views.totalCount,
                // 2) Comparison Appearances card (now Callback Leads)
                courseComparisons: allAnalytics.callbackRequest?.totalCount || 0,
                // 3) Leads Generated card → unified leads total
                contactRequests: allAnalytics.leads.totalCount,
                courseViewsTrend,
                courseComparisonsTrend,
                contactRequestsTrend,
            });
        }
    }, [analyticsLoading, allAnalytics]);

    useEffect(() => {
        setIsListLoading(!!studentsLoading);
        if (Array.isArray(recentStudents)) {
            const mapped: StudentItem[] = recentStudents.map((c: unknown, idx: number) => {
                const student = c as Record<string, unknown>;
                return {
                    date: String(student.date || ''),
                    name: String(student.name || ''),
                    id: String(student.studentId ?? student.id ?? idx),
                    status: String(student.status || ''),
                    programInterests: Array.isArray(student.programInterests) ? student.programInterests as string[] : [],
                };
            });
            setStudents(mapped.slice(0, 4));
        }
    }, [studentsLoading, recentStudents]);

    // Build "Program Reach Over Time" chart series from unified analytics
    useEffect(() => {
        if (!allAnalytics || !allAnalytics.views?.analytics) return;

        try {
            let viewsArr: number[] = [];
            let leadsArr: number[] = [];

            // Check current filter time range (default to weekly if undefined)
            const range = filters.timeRange || 'weekly';

            if (range === 'weekly') {
                // LAST 7 DAYS
                viewsArr = new Array(7).fill(0);
                leadsArr = new Array(7).fill(0);

                // Let's create buckets for the last 7 days
                const today = new Date();
                const labels: string[] = [];
                const buckets: string[] = [];
                for (let i = 6; i >= 0; i--) {
                    const d = new Date();
                    d.setDate(today.getDate() - i);
                    // Label: "Mon", "Tue" or "Jan 01"
                    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
                    labels.push(dayName);
                    // Match format YYYY-MM-DD for comparison if needed, or just rely on day index
                    const yyyymmdd = d.toISOString().split('T')[0];
                    buckets.push(yyyymmdd);
                }

                // Fill buckets
                const fillBuckets = (source: { label: string; count: number }[], target: number[]) => {
                    source.forEach((item) => {
                        let idx = buckets.indexOf(item.label);
                        // Try +1 day shift correction for timezone
                        if (idx === -1) {
                            try {
                                const d = new Date(item.label);
                                d.setDate(d.getDate() + 1);
                                const nextDay = d.toISOString().split('T')[0];
                                idx = buckets.indexOf(nextDay);
                            } catch { /* ignore */ }
                        }

                        if (idx >= 0) {
                            target[idx] = (target[idx] || 0) + item.count;
                        } else {
                            // Fallback: match day name
                            const bucketIdxWithoutYear = labels.findIndex(l => item.label.includes(l));
                            if (bucketIdxWithoutYear >= 0) target[bucketIdxWithoutYear] = (target[bucketIdxWithoutYear] || 0) + item.count;
                        }
                    });
                };

                fillBuckets(allAnalytics.views.analytics, viewsArr);
                if (allAnalytics.leads?.analytics) fillBuckets(allAnalytics.leads.analytics, leadsArr);

                setChartValues(viewsArr);
                setLeadsChartValues(leadsArr);
                setXLabels(labels);

            } else if (range === 'monthly') {
                // LAST 30 DAYS (or 4 weeks) - let's do ~30 days or simplified 4 weeks
                // Let's go with 4 weeks chunks or 10-day intervals? 
                // Standard might be last 30 days.
                const days = 30;
                viewsArr = new Array(days).fill(0);
                leadsArr = new Array(days).fill(0);
                const labels: string[] = [];
                const buckets: string[] = [];
                const today = new Date();

                for (let i = days - 1; i >= 0; i--) {
                    const d = new Date();
                    d.setDate(today.getDate() - i);
                    labels.push(d.getDate().toString()); // Just the date number
                    buckets.push(d.toISOString().split('T')[0]);
                }

                const fillBuckets = (source: { label: string; count: number }[], target: number[]) => {
                    source.forEach((item) => {
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

                fillBuckets(allAnalytics.views.analytics, viewsArr);
                if (allAnalytics.leads?.analytics) fillBuckets(allAnalytics.leads.analytics, leadsArr);

                setChartValues(viewsArr);
                setLeadsChartValues(leadsArr);
                setXLabels(labels);

            } else {
                // YEARLY
                viewsArr = new Array(12).fill(0);
                leadsArr = new Array(12).fill(0);
                const labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

                const fillYearly = (source: { label: string; count: number }[], target: number[]) => {
                    source.forEach((item) => {
                        const monthMatch =
                            item.label.match(/(\d{4})-(\d{2})/) ||
                            item.label.match(/Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/i);

                        if (!monthMatch) return;

                        let monthIndex = -1;
                        if (monthMatch[2]) {
                            monthIndex = parseInt(monthMatch[2], 10) - 1;
                        } else if (monthMatch[0]) {
                            const monthNames = [
                                "jan", "feb", "mar", "apr", "may", "jun",
                                "jul", "aug", "sep", "oct", "nov", "dec"
                            ];
                            monthIndex = monthNames.findIndex(m =>
                                monthMatch[0].toLowerCase().startsWith(m)
                            );
                        }

                        if (monthIndex >= 0 && monthIndex < 12) {
                            target[monthIndex] = (target[monthIndex] || 0) + item.count;
                        }
                    });
                };

                fillYearly(allAnalytics.views.analytics, viewsArr);
                if (allAnalytics.leads?.analytics) fillYearly(allAnalytics.leads.analytics, leadsArr);

                setChartValues(viewsArr);
                setLeadsChartValues(leadsArr);
                setXLabels(labels);
            }
        } catch (err) {
            console.error("Dashboard: building views/leads series failed", err);
        }
    }, [allAnalytics, filters.timeRange]);

    // Setup socket for live updates (invalidate related queries so TanStack picks updated cache/API)
    useEffect(() => {
        if (!institutionId) return;
        const instRoom = `institution:${institutionId}`;
        socketManager.retain();
        socketManager.subscribeRoom(instRoom);

        const onCourseViewsUpdated = () => {
            // Invalidate all time ranges since they're all fetched at once
            queryClient.invalidateQueries({ queryKey: ['all-unified-analytics'], exact: false });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CHART_DATA('views', new Date().getFullYear(), institutionId || undefined), exact: false });
        };
        const onProgramViewsUpdated = () => {
            queryClient.invalidateQueries({ queryKey: ['program-views', institutionId, filters.timeRange] });
        };
        const onComparisonsUpdated = () => {
            // Invalidate all time ranges since they're all fetched at once
            queryClient.invalidateQueries({ queryKey: ['all-unified-analytics'], exact: false });
        };
        const onEnquiryCreated = () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.STUDENTS(institutionId || undefined), exact: false });
            // Invalidate all time ranges since they're all fetched at once
            queryClient.invalidateQueries({ queryKey: ['all-unified-analytics'], exact: false });
        };
        const onInstitutionAdminTotalLeads = () => {
            // Invalidate all time ranges since they're all fetched at once
            queryClient.invalidateQueries({ queryKey: ['all-unified-analytics'], exact: false });
        };

        socketManager.addListener('courseViewsUpdated', onCourseViewsUpdated);
        socketManager.addListener('programViewsUpdated', onProgramViewsUpdated);
        socketManager.addListener('comparisonsUpdated', onComparisonsUpdated);
        socketManager.addListener('enquiryCreated', onEnquiryCreated);
        socketManager.addListener('institutionAdminTotalLeads', onInstitutionAdminTotalLeads);

        return () => {
            socketManager.removeListener('courseViewsUpdated', onCourseViewsUpdated);
            socketManager.removeListener('programViewsUpdated', onProgramViewsUpdated);
            socketManager.removeListener('comparisonsUpdated', onComparisonsUpdated);
            socketManager.removeListener('enquiryCreated', onEnquiryCreated);
            socketManager.removeListener('institutionAdminTotalLeads', onInstitutionAdminTotalLeads);
            socketManager.unsubscribeRoom(instRoom);
            socketManager.release();
        };
    }, [institutionId, filters.timeRange, queryClient]);

    const handleFilterChange = async (newFilters: FilterState) => {
        const normalized: FilterState = { ...newFilters, timeRange: (newFilters.timeRange || 'weekly') };
        setFilters(normalized);
        // Loading flags are handled by hooks; keep UI state mirrors consistent
        setIsStatsLoading(true);
        setIsStatsLoading(false);
    };

    return (
        <motion.div
            className="w-full"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <motion.div
                className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-6 mb-4 sm:mb-6 mt-2 sm:mt-5 rounded-2xl"
                variants={itemVariants}
            >
                <div className="lg:col-span-2 bg-gray-50 dark:bg-gray-900 rounded-2xl mt-0">
                    <DashboardStats
                        stats={stats}
                        filters={filters}
                        isLoading={isStatsLoading}
                        onFilterChange={handleFilterChange}
                    />
                </div>
                <div className="lg:col-span-1">
                    <AdCard _onShare={() => { }} />
                </div>
            </motion.div>

            <motion.div
                className="grid grid-cols-1 mb-4 sm:mb-6"
                variants={itemVariants}
            >
                <div className="xl:col-span-2">
                    <StudentList
                        items={students}
                        isLoading={isListLoading}
                        title="Recent enquiries"
                        statusLabel="Inquiry type"
                        useDashboardColumns
                        onStudentClick={() => { }}
                    />
                </div>
            </motion.div>

            <motion.div
                variants={itemVariants}
                className="-mx-2 sm:-mx-4 lg:-mx-6"
            >
                <CourseReachChart
                    timeRange={filters.timeRange}
                    _course={filters.course}
                    values={chartValues ?? new Array(12).fill(0)}
                    leadsValues={leadsChartValues ?? new Array(12).fill(0)}
                    xLabels={xLabels}
                    showLegend={true}
                    onDataPointClick={() => { }}
                />
            </motion.div>
        </motion.div>
    );
}
