import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { 
  authAPI, 
  metricsAPI, 
  enquiriesAPI, 
  getMyInstitution,
  ApiResponse 
} from '../api';
import { programsAPI } from '../api';
import {
  DashboardStatsCache as DashboardStats,
  DashboardStudentCache as StudentItem,
  DashboardChartCache as ChartData,
  DashboardInstitutionCache as Institution,
  saveDashboardStatsCache as saveDashboardStats,
  getDashboardStatsCache as getDashboardStats,
  saveDashboardStudentsCache as saveStudents,
  getDashboardStudentsCache as getStudents,
  saveDashboardChartCache as saveChartData,
  getDashboardChartCache as getChartData,
  saveDashboardInstitutionCache as saveInstitution,
  getDashboardInstitutionCache as getInstitution,
  getDashboardStudentsPage,
  prependDashboardStudents,
  CACHE_DURATION,
  replaceDashboardStudentsWithLatestTen,
  prependAndTrimDashboardStudents
} from '../localDb';

// Query keys
export const QUERY_KEYS = {
  INSTITUTION: (id?: string) => ['institution', id],
  DASHBOARD_STATS: (timeRange: string, institutionId?: string) => 
    ['dashboard-stats', timeRange, institutionId],
  STUDENTS: (institutionId?: string) => ['students', institutionId],
  CHART_DATA: (type: string, year: number, institutionId?: string) => 
    ['chart-data', type, year, institutionId],
  RECENT_ENQUIRIES: (institutionId?: string) => ['recent-enquiries', institutionId],
  METRICS: (metric: string, range: string, institutionId?: string) => 
    ['metrics', metric, range, institutionId],
} as const;

// Institution hook
export function useInstitution() {
  return useQuery({
    queryKey: QUERY_KEYS.INSTITUTION(),
    queryFn: async (): Promise<Institution> => {
      // Try cache first
      const cached = await getInstitution('current');
      if (cached && Date.now() - cached.lastUpdated < CACHE_DURATION.INSTITUTION) {
        return cached;
      }

      // Fetch from API
      const response = await getMyInstitution();
      if (!response || !response._id) {
        throw new Error('No institution found');
      }

      const institution: Institution = {
        _id: response._id,
        instituteName: response.instituteName || '',
        institutionAdmin: response.institutionAdmin ? String(response.institutionAdmin) : undefined,
        lastUpdated: Date.now()
      } as Institution;

      // Save to cache
      await saveInstitution(institution);
      
      return institution;
    },
    staleTime: CACHE_DURATION.INSTITUTION,
    retry: 2,
    refetchOnWindowFocus: false, // Prevent refetch on window focus
    refetchOnMount: false, // Prevent refetch on component mount if data exists
  });
}

// Dashboard stats hook
export function useDashboardStats(timeRange: 'weekly' | 'monthly' | 'yearly' = 'monthly') {
  const { data: institution } = useInstitution();
  
  return useQuery({
    queryKey: QUERY_KEYS.DASHBOARD_STATS(timeRange, institution?._id),
    queryFn: async (): Promise<DashboardStats> => {
      if (!institution?._id) {
        throw new Error('Institution not available');
      }

      // Try cache first
      const cached = await getDashboardStats(timeRange, institution._id);
      if (cached && Date.now() - cached.lastUpdated < CACHE_DURATION.STATS) {
        return cached;
      }

      // Fetch from API
      const [viewsData, comparisonsData, leadsData, programCmp, programViews] = await Promise.all([
        metricsAPI.getInstitutionAdminByRange('views', timeRange),
        metricsAPI.getInstitutionAdminByRange('comparisons', timeRange),
        metricsAPI.getInstitutionAdminByRange('leads', timeRange),
        programsAPI.summaryComparisons(String(institution._id), timeRange) as any,
        programsAPI.summaryViews(String(institution._id), timeRange) as any
      ]);

      const programCmpSum = Array.isArray(programCmp?.data?.programs) ? programCmp.data.programs.reduce((s:number, p:any)=> s + (Number(p.inRangeComparisons)||0), 0) : 0;
      const programViewsSum = Array.isArray(programViews?.data?.programs) ? programViews.data.programs.reduce((s:number, p:any)=> s + (Number(p.inRangeViews)||0), 0) : 0;
      const stats: DashboardStats = {
        courseViews: programViewsSum,
        courseComparisons: programCmpSum,
        contactRequests: (leadsData as any)?.data?.totalLeads || 0,
        courseViewsTrend: (viewsData as any)?.data?.trend || { value: 0, isPositive: true },
        courseComparisonsTrend: (comparisonsData as any)?.data?.trend || { value: 0, isPositive: true },
        contactRequestsTrend: (leadsData as any)?.data?.trend || { value: 0, isPositive: true },
        timeRange,
        institutionId: institution._id,
        lastUpdated: Date.now()
      } as DashboardStats;

      // Save to cache
      await saveDashboardStats(stats);
      
      return stats;
    },
    enabled: !!institution?._id,
    staleTime: CACHE_DURATION.STATS,
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes when active
    refetchOnWindowFocus: false, // Prevent refetch on window focus
    refetchOnMount: false, // Prevent refetch on component mount if data exists
  });
}

// Program analytics hook with caching and realtime refresh triggers
export function useProgramViews(range: 'weekly'|'monthly'|'yearly' = 'weekly') {
  const { data: institution } = useInstitution();
  return useQuery({
    queryKey: ['program-views', institution?._id, range],
    enabled: !!institution?._id,
    queryFn: async () => {
      const res = await programsAPI.summaryViews(String(institution?._id), range) as any;
      return (res?.data?.programs || []) as Array<{ programName: string; programViewsTotal: number; inRangeViews: number }>;
    },
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

// Programs list for current institution
export function useProgramsList() {
  const { data: institution } = useInstitution();
  return useQuery({
    queryKey: ['programs-list', institution?._id],
    enabled: !!institution?._id,
    queryFn: async () => {
      const res = await programsAPI.list(String(institution?._id)) as any;
      return (res?.data?.programs || []) as Array<{ 
        _id: string; 
        programName: string; 
        startDate?: string; 
        endDate?: string;
        courseName?: string;
        branch?: any;
        branchName?: string;
      }>;
    },
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

// Recent enquiries (full list used for program lead counts)
export function useRecentEnquiriesAll() {
  const { data: institution } = useInstitution();
  return useQuery({
    queryKey: ['recent-enquiries-all', institution?._id],
    enabled: !!institution?._id,
    queryFn: async () => {
      const res = await enquiriesAPI.getRecentEnquiries() as any;
      return (res?.data?.enquiries || []) as Array<any>;
    },
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

// Recent students/enquiries hook
export function useRecentStudents() {
  const { data: institution } = useInstitution();
  
  return useQuery({
    queryKey: QUERY_KEYS.STUDENTS(institution?._id),
    queryFn: async (): Promise<StudentItem[]> => {
      if (!institution?._id) {
        throw new Error('Institution not available');
      }

      // Try cache first
      const cached = await getStudents(institution._id);
      if (cached.length > 0 && cached[0] && Date.now() - cached[0].lastUpdated < CACHE_DURATION.STUDENTS) {
        return cached.slice(0, 4); // Return only recent 4
      }

      // Fetch from API
      const response = await enquiriesAPI.getRecentEnquiries();
      
      if (!(response as any)?.success || !Array.isArray((response as any).data?.enquiries)) {
        return [];
      }

      const enquiries = (response as any).data.enquiries;
      const students: StudentItem[] = enquiries.map((enquiry: any, idx: number) => ({
        date: new Date(enquiry.createdAt || Date.now() - idx * 86400000).toLocaleDateString('en-GB'),
        name: enquiry.student?.name || `student ${idx + 1}`,
        studentId: String(enquiry._id || idx),
        status: enquiry.enquiryType || "Requested for callback",
        programInterests: [enquiry.programInterest || "General Interest"],
        email: enquiry.student?.email,
        phone: enquiry.student?.contactNumber,
        timestampMs: new Date(enquiry.createdAt || Date.now()).getTime(),
        institutionId: institution._id,
        lastUpdated: Date.now()
      }));

      // Save to cache
      await saveStudents(students);
      
      return students.slice(0, 4);
    },
    enabled: !!institution?._id,
    staleTime: CACHE_DURATION.STUDENTS,
    refetchInterval: 10 * 60 * 1000, // Refetch every 10 minutes when active
    refetchOnWindowFocus: false, // Prevent refetch on window focus
    refetchOnMount: false, // Prevent refetch on component mount if data exists
  });
}

// Chart data hook
export function useChartData(
  type: 'views' | 'comparisons' | 'leads' = 'views',
  year?: number,
  options?: { fallbackToCourseIfEmpty?: boolean }
) {
  const { data: institution } = useInstitution();
  const currentYear = year || new Date().getFullYear();
  
  return useQuery({
    queryKey: [...QUERY_KEYS.CHART_DATA(type, currentYear, institution?._id), options?.fallbackToCourseIfEmpty ? 'fallback' : 'nofallback'],
    queryFn: async (): Promise<number[]> => {
      if (!institution?._id) {
        throw new Error('Institution not available');
      }

      // Try cache first
      const cached = await getChartData(type, currentYear, institution._id);
      if (cached && Date.now() - cached.lastUpdated < CACHE_DURATION.CHART) {
        return cached.series;
      }

      // Fetch from API
      const response = type === 'views'
        ? await programsAPI.viewsSeries(String(institution._id), currentYear)
        : await metricsAPI.getInstitutionAdminSeries(type, currentYear, institution._id);
      
      if (!(response as any)?.success || !Array.isArray((response as any).data?.series)) {
        return new Array(12).fill(0);
      }

      let series = (response as any).data.series as number[];
      if (type === 'views' && options?.fallbackToCourseIfEmpty) {
        const allZero = !series || series.every((n) => !n);
        if (allZero) {
          const courseResp = await metricsAPI.getInstitutionAdminSeries('views', currentYear, institution._id);
          if ((courseResp as any)?.success && Array.isArray((courseResp as any).data?.series)) {
            series = (courseResp as any).data.series as number[];
          }
        }
      }
      const chartSeries = new Array(12).fill(0);
      series.forEach((count, monthIdx) => {
        if (monthIdx >= 0 && monthIdx < 12) {
          chartSeries[monthIdx] = count || 0;
        }
      });

      // Save to cache
      await saveChartData({
        type,
        year: currentYear,
        series: chartSeries,
        institutionId: institution._id,
        lastUpdated: Date.now()
      });
      
      return chartSeries;
    },
    enabled: !!institution?._id,
    staleTime: CACHE_DURATION.CHART,
    refetchInterval: 30 * 60 * 1000, // Refetch every 30 minutes when active
    refetchOnWindowFocus: false, // Prevent refetch on window focus
    refetchOnMount: false, // Prevent refetch on component mount if data exists
  });
}

// Infinite leads hook
export function useInfiniteLeads(pageSize: number = 10) {
  const { data: institution } = useInstitution();
  return useInfiniteQuery({
    queryKey: ['leads-infinite', institution?._id, pageSize],
    enabled: !!institution?._id,
    initialPageParam: 0,
    getNextPageParam: (lastPage: any[], allPages, lastPageParam: number) => {
      if (!lastPage || lastPage.length < pageSize) return undefined;
      return lastPageParam + 1;
    },
    queryFn: async ({ pageParam }) => {
      const pageIndex = pageParam as number;
      const offset = pageIndex * pageSize;
      
      // Fetch enquiries list for the institution admin's institutions (use /recent for all pages including index 1)
      const response = await enquiriesAPI.getRecentEnquiriesWithOffset(offset, pageSize) as any;
      const list = (response?.data?.enquiries || []) as any[];
      console.log(`[DEBUG] useInfiniteLeads (enquiries) - page ${pageIndex}, offset ${offset}, limit ${pageSize}, got ${list.length} enquiries`);
      
      // Debug: Log first enquiry to see student data
      if (list.length > 0) {
        console.log(`[DEBUG] Frontend first enquiry student data:`, {
          studentId: list[0].student?._id,
          studentName: list[0].student?.name,
          studentEmail: list[0].student?.email,
          studentPhone: list[0].student?.contactNumber
        });
      }

      const mapped = list.map((enquiry: any, idx: number) => ({
        date: new Date(enquiry.createdAt || Date.now() - idx * 86400000).toLocaleDateString('en-GB'),
        name: enquiry.student?.name || `student ${idx + 1}`,
        studentId: String(enquiry._id || `${enquiry.createdAt || ''}-${enquiry.student?.email || ''}-${enquiry.student?.name || ''}`),
        // Use enquiry status first, then enquiryType; fallback kept minimal
        status: enquiry.status || enquiry.enquiryType || 'Requested for callback',
        programInterests: enquiry.programInterest ? [enquiry.programInterest] : [],
        email: enquiry.student?.email,
        phone: enquiry.student?.contactNumber,
        timestampMs: new Date(enquiry.createdAt || Date.now()).getTime(),
        institutionId: institution?._id,
        lastUpdated: Date.now()
      }));
      
      // Only cache the first page to avoid stale data issues
      if (pageIndex === 0) {
        try {
          await replaceDashboardStudentsWithLatestTen(mapped as any);
        } catch (error) {
          console.warn('Failed to cache leads data:', error);
        }
      }
      
      return mapped as any[];
    }
  });
}

export async function appendNewLeadToCache(newLead: StudentItem) {
  await prependAndTrimDashboardStudents([newLead as any]);
}

// Mutation for refreshing all data
export function useRefreshDashboard() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      // Invalidate all queries to force refresh
      await queryClient.invalidateQueries();
      return true;
    },
    onSuccess: () => {
      console.log('Dashboard data refreshed');
    },
    onError: (error) => {
      console.error('Failed to refresh dashboard:', error);
    }
  });
}

// Hook for offline status
export function useOnlineStatus() {
  return useQuery({
    queryKey: ['online-status'],
    queryFn: () => navigator.onLine,
    staleTime: 0,
    refetchInterval: 5000, // Check every 5 seconds
    refetchIntervalInBackground: true,
  });
} 