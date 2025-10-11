"use client";


import React from "react";
import { useRouter } from "next/navigation";
import { withAuth, useAuth } from "../../lib/auth-context";
import { motion } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import DashboardStats from "@/components/dashboard/DashboardStats";
import AdCard from "@/components/dashboard/AdCard";
import StudentList, { StudentItem } from "@/components/dashboard/StudentList";
import CourseReachChart from "@/components/dashboard/CourseReachChart";
import AdminDashboard from "@/components/dashboard/AdminDashboard";
import { getMyInstitution, getInstitutionBranches, getInstitutionCourses } from "@/lib/api";
import { authAPI, metricsAPI, enquiriesAPI } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import { useDashboardStats, useRecentStudents, useChartData, useInstitution, useProgramViews } from "@/lib/hooks/dashboard-hooks";
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

function DashboardPage() {
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
	const [institutionAdminId, setInstitutionAdminId] = useState<string | null>(null);
	const [chartValues, setChartValues] = useState<number[] | null>(null);
	const [baselineCourseViews, setBaselineCourseViews] = useState<number>(0);
	const [rangeBaseline, setRangeBaseline] = useState<number>(0);

	const generateStudents = useCallback(() => {
		const names = [
			"Raghavendar Reddy", "Sarah Johnson", "Michael Chen", "Emily Davis",
			"David Wilson", "Lisa Anderson", "James Brown", "Maria Garcia",
			"Robert Taylor", "Jennifer Martinez", "William Jones", "Ashley White"
		];
		const statuses = [
			"Requested for callback", "Requested for demo",
		];
		const programs = [
			"BTech Computer Science", "MBA Marketing", "BSc Data Science", "BCom Finance",
			"BTech Mechanical", "MSc AI", "BA Economics"
		];
		const newStudents: StudentItem[] = Array.from({ length: 4 }, (_, i) => ({
			date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB'),
			name: names[Math.floor(Math.random() * names.length)],
			id: (181200 + i).toString(),
			status: statuses[Math.floor(Math.random() * statuses.length)],
			programInterests: [programs[Math.floor(Math.random() * programs.length)]]
		}));
		setStudents(newStudents);
	}, []);

	// ------- TanStack Query hooks (source of truth) -------
	const { data: inst } = useInstitution();
    const { data: statsData, isLoading: statsLoading } = useDashboardStats(filters.timeRange);
    const programViewsRange = filters.timeRange;
    const { data: programViewsData } = useProgramViews(programViewsRange);
	const { data: recentStudents, isLoading: studentsLoading } = useRecentStudents();
	const { data: seriesValues } = useChartData('views');
	const queryClient = useQueryClient();

	// Sync hook data into existing local state so UI remains unchanged
	useEffect(() => {
		if (inst?._id) setInstitutionId(inst._id);
	}, [inst?._id]);

	useEffect(() => {
		setIsStatsLoading(!!statsLoading);
    if (statsData) {
            const programViewsSum = Array.isArray(programViewsData) ? (programViewsData as any[]).reduce((sum, p:any) => sum + (Number(p.inRangeViews)||0), 0) : 0;
            setStats({
                courseViews: programViewsSum,
				courseComparisons: statsData.courseComparisons,
				contactRequests: statsData.contactRequests,
				courseViewsTrend: statsData.courseViewsTrend,
				courseComparisonsTrend: statsData.courseComparisonsTrend,
				contactRequestsTrend: statsData.contactRequestsTrend,
			});
			}
    }, [statsLoading, statsData, programViewsData]);

	useEffect(() => {
		setIsListLoading(!!studentsLoading);
		if (Array.isArray(recentStudents)) {
			const mapped: StudentItem[] = recentStudents.map((c: any, idx: number) => ({
				date: c.date,
				name: c.name,
				id: String(c.studentId ?? c.id ?? idx),
				status: c.status,
				programInterests: c.programInterests,
				}));
				setStudents(mapped.slice(0, 4));
			}
	}, [studentsLoading, recentStudents]);

	useEffect(() => {
		if (Array.isArray(seriesValues)) {
			setChartValues(seriesValues);
			}
	}, [seriesValues]);

	// Setup socket for live updates (invalidate related queries so TanStack picks updated cache/API)
	useEffect(() => {
		if (!institutionId) return;
		const instRoom = `institution:${institutionId}`;
		socketManager.retain();
		socketManager.subscribeRoom(instRoom);

        const onCourseViewsUpdated = () => {
			queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD_STATS(filters.timeRange, institutionId || undefined), exact: false });
			queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CHART_DATA('views', new Date().getFullYear(), institutionId || undefined), exact: false });
		};
        const onProgramViewsUpdated = () => {
            queryClient.invalidateQueries({ queryKey: ['program-views', institutionId, filters.timeRange] });
        };
		const onComparisonsUpdated = () => {
			queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD_STATS(filters.timeRange, institutionId || undefined), exact: false });
		};
		const onEnquiryCreated = () => {
			queryClient.invalidateQueries({ queryKey: QUERY_KEYS.STUDENTS(institutionId || undefined), exact: false });
		};
		const onInstitutionAdminTotalLeads = () => {
			queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD_STATS(filters.timeRange, institutionId || undefined), exact: false });
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
					<AdCard onShare={() => {}} />
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
						onStudentClick={() => {}}
					/>
				</div>
			</motion.div>

			<motion.div 
				variants={itemVariants}
				className="-mx-2 sm:-mx-4 lg:-mx-6"
			>
				<CourseReachChart 
					timeRange={filters.timeRange}
					course={filters.course}
					values={chartValues ?? new Array(12).fill(0)}
					onDataPointClick={() => {}}
					yTicksOverride={[0,50000,100000,150000,200000,250000]}
				/>
			</motion.div>
		</motion.div>
	);
}

export default withAuth(DashboardPage); 