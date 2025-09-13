export type CourseRecord = {
  id?: number;
  courseName: string;
  aboutCourse?: string;
  courseDuration?: string;
  mode?: string;
  priceOfCourse?: string;
  location?: string;
  image?: File | null;
  brochure?: File | null;
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
};

const DB_NAME = "tooclarity";
const DB_VERSION = 4; // bump version when adding new stores
const BRANCH_STORE = "branches";
const INSTITUTION_STORE = "institutions";
const COURSES_STORE = "courses"; // new store to link courses to branches

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
