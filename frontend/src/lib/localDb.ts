export type CourseRecord = {
  id?: number;
  courseName: string;
  aboutCourse?: string;
  courseDuration?: string;
  startDate?: string;
  endDate?: string;
  mode?: string;
  priceOfCourse?: string;
  location?: string;
  image?: File | null;
  imageUrl?: string,
  imagePreviewUrl?: string,
  brochureUrl?: string,
  brochure?: File | null;
  brochurePreviewUrl?: string,
  graduationType?: string;
  streamType?: string;
  selectBranch?: string;
  aboutBranch?: string;
  educationType?: string;
  classSize?: string;
  categoriesType?: string;
  domainType?: string;
  seatingOption?: string;
  openingTime?: string;
  closingTime?: string;
  operationalDays?: string[];
  totalSeats?: string;
  availableSeats?: string;
  pricePerSeat?: string;
  hasWifi?: boolean;
  hasChargingPoints?: boolean;
  hasAC?: boolean;
  hasPersonalLocker?: boolean;
  tuitionType?: string;
  instructorProfile?: string;
  subject?: string;
  createdBranch?: string; // optional UI field
};

export type BranchCoursesRecord = {
  id?: number;
  branchName?: string; // undefined/null => unassigned
  branchAddress?: string;
  contactInfo?: string;
  locationUrl?: string;
  courses: CourseRecord[];
  createdAt?: number;
};

export type BranchRecord = {
  id?: number;
  branchName: string;
  branchAddress: string;
  contactInfo: string;
  locationUrl: string;
  courses?: CourseRecord[];
  createdAt?: number;
};


export type InstitutionRecord = {
  id?: number;
  instituteType?: string;
  instituteName?: string;
  approvedBy?: string;
  establishmentDate?: string;
  contactInfo?: string;
  additionalContactInfo?: string;
  headquartersAddress?: string;
  state?: string;
  pincode?: string;
  locationURL?: string;
  createdAt?: number;
  ownershipType?: string;
  collegeCategory?: string;
  affiliationType?: string;
  placementDrives?: boolean;
  mockInterviews?: boolean;
  resumeBuilding?: boolean;
  linkedinOptimization?: boolean;
  exclusiveJobPortal?: boolean;
  library?: boolean;
  hostelFacility?: boolean;
  entranceExam?: boolean;
  managementQuota?: boolean;
  playground?: boolean;
  busService?: boolean;
  collegeType?: string;
  curriculumType?: string;
  operationalDays?: string[];
  otherActivities?: string;
  certification?: boolean;
  schoolType?: string;
  schoolCategory?: string;
  openingTime?: string;
  closingTime?: string;
  extendedCare?: string;
  mealsProvided?: string;
  outdoorPlayArea?: string;
  logoUrl?: string,
  logoPreviewUrl?: string,
};

// ------- Dashboard data types (for caching) -------
export interface DashboardStatsCache {
  id?: number;
  courseViews: number;
  courseComparisons: number;
  contactRequests: number;
  courseViewsTrend: { value: number; isPositive: boolean };
  courseComparisonsTrend: { value: number; isPositive: boolean };
  contactRequestsTrend: { value: number; isPositive: boolean };
  timeRange: 'weekly' | 'monthly' | 'yearly';
  institutionId?: string;
  lastUpdated: number;
}

export interface DashboardStudentCache {
  id?: number;
  date: string;
  name: string;
  studentId: string;
  status: string;
  programInterests?: string[];
  email?: string;
  phone?: string;
  timestampMs?: number;
  institutionId?: string;
  lastUpdated: number;
}

export interface DashboardChartCache {
  id?: number;
  type: 'views' | 'comparisons' | 'leads';
  year: number;
  series: number[];
  institutionId?: string;
  lastUpdated: number;
}

export interface CachedApiResponseRecord {
  id?: number;
  key: string;
  data: any;
  timestamp: number;
  expiresAt: number;
}

export const CACHE_DURATION = {
  STATS: 5 * 60 * 1000,
  STUDENTS: 10 * 60 * 1000,
  CHART: 30 * 60 * 1000,
  INSTITUTION: 60 * 60 * 1000,
};

const DB_NAME = "tooclarity";
const DB_VERSION = 5; // bump version when adding new stores
const BRANCH_STORE = "branches";
const INSTITUTION_STORE = "institutions";
const COURSES_STORE = "courses"; // new store to link courses to branches
// New dashboard-related stores
const DASHBOARD_STATS_STORE = "dashboard_stats";
const DASHBOARD_STUDENTS_STORE = "dashboard_students";
const DASHBOARD_CHART_STORE = "dashboard_chart";
const DASHBOARD_CACHED_STORE = "dashboard_cached";
const DASHBOARD_INSTITUTIONS_STORE = "dashboard_institutions";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      return reject(new Error("IndexedDB not available on server"));
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      // Branches
      if (!db.objectStoreNames.contains(BRANCH_STORE)) {
        const store = db.createObjectStore(BRANCH_STORE, {
          keyPath: "id",
          autoIncrement: true,
        });
        store.createIndex("branchName", "branchName", { unique: false });
      }

      // Institutions
      if (!db.objectStoreNames.contains(INSTITUTION_STORE)) {
        db.createObjectStore(INSTITUTION_STORE, {
          keyPath: "id",
          autoIncrement: true,
        });
      }

      // Courses (branch-linked or unassigned)
      if (!db.objectStoreNames.contains(COURSES_STORE)) {
        const store = db.createObjectStore(COURSES_STORE, {
          keyPath: "id",
          autoIncrement: true,
        });
        // Index to quickly find courses for a branch; null/undefined for unassigned
        store.createIndex("branchName", "branchName", { unique: false });
      }

      // ------- Dashboard stores -------
      if (!db.objectStoreNames.contains(DASHBOARD_STATS_STORE)) {
        const store = db.createObjectStore(DASHBOARD_STATS_STORE, {
          keyPath: "id",
          autoIncrement: true,
        });
        store.createIndex("timeRange", "timeRange", { unique: false });
        store.createIndex("institutionId", "institutionId", { unique: false });
        store.createIndex("lastUpdated", "lastUpdated", { unique: false });
      }

      if (!db.objectStoreNames.contains(DASHBOARD_STUDENTS_STORE)) {
        const store = db.createObjectStore(DASHBOARD_STUDENTS_STORE, {
          keyPath: "id",
          autoIncrement: true,
        });
        store.createIndex("institutionId", "institutionId", { unique: false });
        store.createIndex("lastUpdated", "lastUpdated", { unique: false });
      }

      if (!db.objectStoreNames.contains(DASHBOARD_CHART_STORE)) {
        const store = db.createObjectStore(DASHBOARD_CHART_STORE, {
          keyPath: "id",
          autoIncrement: true,
        });
        store.createIndex("type", "type", { unique: false });
        store.createIndex("year", "year", { unique: false });
        store.createIndex("institutionId", "institutionId", { unique: false });
        store.createIndex("lastUpdated", "lastUpdated", { unique: false });
      }

      if (!db.objectStoreNames.contains(DASHBOARD_CACHED_STORE)) {
        const store = db.createObjectStore(DASHBOARD_CACHED_STORE, {
          keyPath: "id",
          autoIncrement: true,
        });
        store.createIndex("key", "key", { unique: true });
        store.createIndex("expiresAt", "expiresAt", { unique: false });
      }

      if (!db.objectStoreNames.contains(DASHBOARD_INSTITUTIONS_STORE)) {
        const store = db.createObjectStore(DASHBOARD_INSTITUTIONS_STORE, {
          keyPath: "id",
          autoIncrement: true,
        });
        store.createIndex("_id", "_id", { unique: true });
        store.createIndex("lastUpdated", "lastUpdated", { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error || new Error("Failed to open DB"));
  });
}

/* ---------------- Branches ---------------- */

export async function addBranchesToDB(
  branches: BranchRecord[]
): Promise<number[]> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(BRANCH_STORE, "readwrite");
    const store = tx.objectStore(BRANCH_STORE);

    const ids: number[] = [];

    branches.forEach((b) => {
      const { id: _ignored, ...rest } = b;
      const record = { ...rest, createdAt: Date.now() };

      const req = store.add(record);
      req.onsuccess = () => ids.push(req.result as number);
      req.onerror = () => {
        tx.abort();
        reject(req.error || new Error("Failed to add branch"));
      };
    });

    tx.oncomplete = () => resolve(ids);
    tx.onerror = () => reject(tx.error || new Error("Transaction failed"));
    tx.onabort = () => reject(tx.error || new Error("Transaction aborted"));
  });
}

export async function addCoursesGroupToDB(
  group: BranchCoursesRecord
): Promise<number> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(COURSES_STORE, "readwrite");
    const store = tx.objectStore(COURSES_STORE);

    const { id: _ignored, ...rest } = group;
    const record = { ...rest, createdAt: Date.now() };

    const req = store.add(record);
    req.onsuccess = () => resolve(req.result as number);
    req.onerror = () => reject(req.error || new Error("Failed to add courses group"));
  });
}

export async function updateCoursesGroupInDB(
  group: BranchCoursesRecord
): Promise<void> {
  if (!group.id) throw new Error("Courses group id required for update");
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(COURSES_STORE, "readwrite");
    const store = tx.objectStore(COURSES_STORE);
    const req = store.put(group);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error || new Error("Failed to update courses group"));
  });
}

export async function getCoursesGroupsByBranchName(
  branchName?: string
): Promise<BranchCoursesRecord[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(COURSES_STORE, "readonly");
    const store = tx.objectStore(COURSES_STORE);

    if (branchName === undefined) {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result as BranchCoursesRecord[]);
      req.onerror = () => reject(req.error || new Error("Failed to read courses groups"));
      return;
    }

    const index = store.index("branchName");
    const req = index.getAll(branchName);
    req.onsuccess = () => resolve(req.result as BranchCoursesRecord[]);
    req.onerror = () => reject(req.error || new Error("Failed to read courses groups by branch name"));
  });
}

export async function getAllBranchesFromDB(): Promise<BranchRecord[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(BRANCH_STORE, "readonly");
    const store = tx.objectStore(BRANCH_STORE);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result as BranchRecord[]);
    req.onerror = () =>
      reject(req.error || new Error("Failed to read branches"));
  });
}

export async function updateBranchInDB(
  branch: BranchRecord
): Promise<void> {
  if (!branch.id) throw new Error("Branch id required for update");
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(BRANCH_STORE, "readwrite");
    const store = tx.objectStore(BRANCH_STORE);
    const req = store.put(branch);
    req.onsuccess = () => resolve();
    req.onerror = () =>
      reject(req.error || new Error("Failed to update branch"));
  });
}

export async function deleteBranchFromDB(id: number): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(BRANCH_STORE, "readwrite");
    const store = tx.objectStore(BRANCH_STORE);
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () =>
      reject(req.error || new Error("Failed to delete branch"));
  });
}

/* ---------------- Institutions ---------------- */

export async function addInstitutionToDB(
  institution: InstitutionRecord
): Promise<number> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(INSTITUTION_STORE, "readwrite");
    const store = tx.objectStore(INSTITUTION_STORE);

    const { id: _ignored, ...rest } = institution;
    const record = { ...rest, createdAt: Date.now() };

    const req = store.add(record);
    req.onsuccess = () => resolve(req.result as number);
    req.onerror = () =>
      reject(req.error || new Error("Failed to add institution"));
  });
}

export async function getAllInstitutionsFromDB(): Promise<
  InstitutionRecord[]
> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(INSTITUTION_STORE, "readonly");
    const store = tx.objectStore(INSTITUTION_STORE);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result as InstitutionRecord[]);
    req.onerror = () =>
      reject(req.error || new Error("Failed to read institutions"));
  });
}

export async function updateInstitutionInDB(
  institution: InstitutionRecord
): Promise<void> {
  if (!institution.id) throw new Error("Institution id required for update");
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(INSTITUTION_STORE, "readwrite");
    const store = tx.objectStore(INSTITUTION_STORE);
    const req = store.put(institution);
    req.onsuccess = () => resolve();
    req.onerror = () =>
      reject(req.error || new Error("Failed to update institution"));
  });
}

export async function deleteInstitutionFromDB(id: number): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(INSTITUTION_STORE, "readwrite");
    const store = tx.objectStore(INSTITUTION_STORE);
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () =>
      reject(req.error || new Error("Failed to delete institution"));
  });
}


export async function saveBranchWithCoursesToDB(
  branch: BranchRecord
): Promise<void> {
  if (!branch.branchName) throw new Error("Branch name required");

  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(BRANCH_STORE, "readwrite");
    const store = tx.objectStore(BRANCH_STORE);

    const record = {
      ...branch,
      createdAt: branch.createdAt || Date.now(),
    };

    const req = store.put(record); // ✅ upsert (insert/update)
    req.onsuccess = () => resolve();
    req.onerror = () =>
      reject(req.error || new Error("Failed to save branch with courses"));
  });
}

/* ---------------- Dashboard caching helpers ---------------- */

export async function cacheSet(key: string, data: any, duration: number): Promise<void> {
  const db = await openDB();
  const now = Date.now();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DASHBOARD_CACHED_STORE, "readwrite");
    const store = tx.objectStore(DASHBOARD_CACHED_STORE);
    const idx = store.index("key");
    const getReq = idx.get(key);
    getReq.onsuccess = () => {
      const existing = getReq.result as CachedApiResponseRecord | undefined;
      const record: CachedApiResponseRecord = {
        ...(existing?.id ? { id: existing.id } : {}),
        key,
        data,
        timestamp: now,
        expiresAt: now + duration
      } as any;
      const putReq = store.put(record);
      putReq.onsuccess = () => resolve();
      putReq.onerror = () => reject(putReq.error || new Error("Failed to cache value"));
    };
    getReq.onerror = () => reject(getReq.error || new Error("Failed to read cache (pre-upsert)"));
  });
}

export async function cacheDelete(key: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DASHBOARD_CACHED_STORE, "readwrite");
    const store = tx.objectStore(DASHBOARD_CACHED_STORE);
    const idx = store.index("key");
    const getReq = idx.get(key);
    getReq.onsuccess = () => {
      const row = getReq.result as CachedApiResponseRecord | undefined;
      if (!row?.id) return resolve();
      const delReq = store.delete(row.id as number);
      delReq.onsuccess = () => resolve();
      delReq.onerror = () => reject(delReq.error || new Error("Failed to delete cached value"));
    };
    getReq.onerror = () => reject(getReq.error || new Error("Failed to locate cached value"));
  });
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DASHBOARD_CACHED_STORE, "readonly");
    const store = tx.objectStore(DASHBOARD_CACHED_STORE);
    const index = store.index("key");
    const req = index.get(key);
    req.onsuccess = () => {
      const row = req.result as CachedApiResponseRecord | undefined;
      if (!row) return resolve(null);
      if (Date.now() > row.expiresAt) {
        // expire lazily
        const delTx = db.transaction(DASHBOARD_CACHED_STORE, "readwrite");
        delTx.objectStore(DASHBOARD_CACHED_STORE).delete(row.id as number);
        return resolve(null);
      }
      resolve((row.data as T) || null);
    };
    req.onerror = () => reject(req.error || new Error("Failed to read cache"));
  });
}

export async function cacheClearExpired(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DASHBOARD_CACHED_STORE, "readwrite");
    const store = tx.objectStore(DASHBOARD_CACHED_STORE);
    const index = store.index("expiresAt");
    const range = IDBKeyRange.upperBound(Date.now());
    const req = index.openCursor(range);
    req.onsuccess = () => {
      const cursor = req.result as IDBCursorWithValue | null;
      if (cursor) {
        store.delete(cursor.primaryKey as IDBValidKey);
        cursor.continue();
      } else {
        resolve();
      }
    };
    req.onerror = () => reject(req.error || new Error("Failed to clear expired cache"));
  });
}

export async function saveDashboardStatsCache(stats: Omit<DashboardStatsCache, 'id'>): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DASHBOARD_STATS_STORE, "readwrite");
    const store = tx.objectStore(DASHBOARD_STATS_STORE);
    const req = store.put({ ...stats, lastUpdated: Date.now() });
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error || new Error("Failed to save dashboard stats"));
  });
}

export async function getDashboardStatsCache(
  timeRange: 'weekly' | 'monthly' | 'yearly',
  institutionId?: string
): Promise<DashboardStatsCache | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DASHBOARD_STATS_STORE, "readonly");
    const store = tx.objectStore(DASHBOARD_STATS_STORE);
    const idx = store.index("timeRange");
    const req = idx.getAll(timeRange);
    req.onsuccess = () => {
      const rows = (req.result as DashboardStatsCache[]) || [];
      const row = institutionId ? rows.find(r => r.institutionId === institutionId) : rows[0];
      resolve(row || null);
    };
    req.onerror = () => reject(req.error || new Error("Failed to read dashboard stats"));
  });
}

export async function saveDashboardStudentsCache(students: Omit<DashboardStudentCache, 'id'>[]): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DASHBOARD_STUDENTS_STORE, "readwrite");
    const store = tx.objectStore(DASHBOARD_STUDENTS_STORE);
    students.forEach(c => store.put({ ...c, lastUpdated: Date.now() }));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error("Failed to save dashboard students"));
  });
}

export async function getDashboardStudentsCache(institutionId?: string): Promise<DashboardStudentCache[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DASHBOARD_STUDENTS_STORE, "readonly");
    const store = tx.objectStore(DASHBOARD_STUDENTS_STORE);
    const idx = store.index("lastUpdated");
    const req = idx.getAll();
    req.onsuccess = () => {
      let rows = (req.result as DashboardStudentCache[]) || [];
      rows = rows.sort((a, b) => (b.lastUpdated || 0) - (a.lastUpdated || 0));
      if (institutionId) rows = rows.filter(r => r.institutionId === institutionId);
      resolve(rows);
    };
    req.onerror = () => reject(req.error || new Error("Failed to read dashboard students"));
  });
}

export async function getDashboardStudentsPage(institutionId: string | undefined, offset: number, limit: number): Promise<DashboardStudentCache[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DASHBOARD_STUDENTS_STORE, "readonly");
    const store = tx.objectStore(DASHBOARD_STUDENTS_STORE);
    const idx = store.index("lastUpdated");
    const req = idx.getAll();
    req.onsuccess = () => {
      let rows = (req.result as DashboardStudentCache[]) || [];
      rows = rows.sort((a, b) => (b.lastUpdated || 0) - (a.lastUpdated || 0));
      if (institutionId) rows = rows.filter(r => r.institutionId === institutionId);
      resolve(rows.slice(offset, offset + limit));
    };
    req.onerror = () => reject(req.error || new Error("Failed to read students page"));
  });
}

export async function prependDashboardStudents(students: Omit<DashboardStudentCache, 'id'>[]): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DASHBOARD_STUDENTS_STORE, "readwrite");
    const store = tx.objectStore(DASHBOARD_STUDENTS_STORE);
    const now = Date.now();
    students.forEach(c => store.put({ ...c, lastUpdated: c.lastUpdated || now }));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error("Failed to prepend students"));
  });
}

export async function replaceDashboardStudentsWithLatestTen(students: Omit<DashboardStudentCache, 'id'>[]): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DASHBOARD_STUDENTS_STORE, "readwrite");
    const store = tx.objectStore(DASHBOARD_STUDENTS_STORE);
    // Clear existing
    const clearReq = store.clear();
    clearReq.onsuccess = () => {
      const now = Date.now();
      const top10 = students
        .sort((a, b) => (b.lastUpdated || now) - (a.lastUpdated || now))
        .slice(0, 10);
      top10.forEach(c => store.put({ ...c, lastUpdated: c.lastUpdated || now }));
    };
    clearReq.onerror = () => reject(clearReq.error || new Error("Failed to clear students"));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error("Failed to write students"));
  });
}

export async function prependAndTrimDashboardStudents(newStudents: Omit<DashboardStudentCache, 'id'>[]): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DASHBOARD_STUDENTS_STORE, "readwrite");
    const store = tx.objectStore(DASHBOARD_STUDENTS_STORE);
    const idx = store.index("lastUpdated");
    const getReq = idx.getAll();
    getReq.onsuccess = () => {
      const now = Date.now();
      let rows = (getReq.result as DashboardStudentCache[]) || [];
      rows = [...newStudents.map(c => ({ ...c, lastUpdated: c.lastUpdated || now } as any)), ...rows]
        .sort((a, b) => (b.lastUpdated || now) - (a.lastUpdated || now))
        .slice(0, 10);
      const clearReq = store.clear();
      clearReq.onsuccess = () => {
        rows.forEach(r => store.put(r as any));
      };
      clearReq.onerror = () => reject(clearReq.error || new Error("Failed to trim students"));
    };
    getReq.onerror = () => reject(getReq.error || new Error("Failed to read students for trim"));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error("Failed to save trimmed students"));
  });
}

export async function saveDashboardChartCache(chart: Omit<DashboardChartCache, 'id'>): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DASHBOARD_CHART_STORE, "readwrite");
    const store = tx.objectStore(DASHBOARD_CHART_STORE);
    const req = store.put({ ...chart, lastUpdated: Date.now() });
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error || new Error("Failed to save dashboard chart"));
  });
}

export async function getDashboardChartCache(
  type: 'views' | 'comparisons' | 'leads',
  year: number,
  institutionId?: string
): Promise<DashboardChartCache | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DASHBOARD_CHART_STORE, "readonly");
    const store = tx.objectStore(DASHBOARD_CHART_STORE);
    const typeIdx = store.index("type");
    const req = typeIdx.getAll(type);
    req.onsuccess = () => {
      const rows = (req.result as DashboardChartCache[]) || [];
      const row = rows.find(r => r.year === year && (!institutionId || r.institutionId === institutionId)) || null;
      resolve(row);
    };
    req.onerror = () => reject(req.error || new Error("Failed to read dashboard chart"));
  });
}

export interface DashboardInstitutionCache {
  id?: number;
  _id: string;
  instituteName: string;
  institutionAdmin?: string;
  lastUpdated: number;
}

export async function saveDashboardInstitutionCache(inst: Omit<DashboardInstitutionCache, 'id'>): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DASHBOARD_INSTITUTIONS_STORE, "readwrite");
    const store = tx.objectStore(DASHBOARD_INSTITUTIONS_STORE);
    const idx = store.index("_id");
    const getReq = idx.get(inst._id);
    getReq.onsuccess = () => {
      const existing = getReq.result as DashboardInstitutionCache | undefined;
      const record: DashboardInstitutionCache = {
        ...(existing?.id ? { id: existing.id } : {}),
        _id: inst._id,
        instituteName: inst.instituteName,
        institutionAdmin: inst.institutionAdmin,
        lastUpdated: Date.now()
      } as DashboardInstitutionCache;
      const putReq = store.put(record);
      putReq.onsuccess = () => resolve();
      putReq.onerror = () => reject(putReq.error || new Error("Failed to save dashboard institution"));
    };
    getReq.onerror = () => reject(getReq.error || new Error("Failed to lookup dashboard institution by _id"));
  });
}

export async function getDashboardInstitutionCache(backendId: string): Promise<DashboardInstitutionCache | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DASHBOARD_INSTITUTIONS_STORE, "readonly");
    const store = tx.objectStore(DASHBOARD_INSTITUTIONS_STORE);
    const idx = store.index("_id");
    const req = idx.get(backendId);
    req.onsuccess = () => resolve((req.result as DashboardInstitutionCache) || null);
    req.onerror = () => reject(req.error || new Error("Failed to read dashboard institution"));
  });
}
