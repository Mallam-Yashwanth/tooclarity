"use client";

import React, { useMemo } from "react";
import InputField from "@/components/ui/InputField";
import SearchableSelect from "@/components/ui/SearchableSelect";
import SlidingIndicator from "@/components/ui/SlidingIndicator";
import { Course } from "../../L2DialogBox";
import { STATE_DISTRICT_MAP, STATE_OPTIONS } from "@/constants/stateDistricts";
import { Button } from "@/components/ui/button";
import { Plus, X, Upload, FileText, BookOpen, Calendar, IndianRupee, Languages, Link, Send, Users } from "lucide-react";

// Exam Preparation Domain Data
const EXAM_PREP_DATA = {
    domains: [
        "Civil Services & Administrative", "Banking Exams", "Insurance Exams", "Railways Exams", "SSC Exams (Staff Selection Commission)", "Defence Exams", "Police & Law Enforcement", "Teaching Exams", "Legal & Judicial Services", "State Government Exams", "Central Government Recruitment", "Research & Scientific", "Other Government Exams", "ENGINEERING ENTRANCE EXAMS - INDIA", "Architecture Entrance", "MEDICAL ENTRANCE EXAMS - INDIA", "Physiotherapy Entrance Exams", "MANAGEMENT ENTRANCE EXAMS - INDIA", "LAW ENTRANCE EXAMS - INDIA", "DESIGN & CREATIVE ENTRANCE EXAMS - INDIA", "HOTEL MANAGEMENT & HOSPITALITY EXAMS - INDIA", "MASS COMMUNICATION & JOURNALISM - INDIA", "OTHER PROFESSIONAL ENTRANCE EXAMS - INDIA", "SCHOOL/FOUNDATION LEVEL EXAMS - INDIA", "INTERNATIONAL EXAMS"
    ],
    subDomains: {
        "Civil Services & Administrative": ["UPSC Civil Services Examination (IAS/IPS/IFS)", "UPSC Prelims", "UPSC Mains", "UPSC Interview/Personality Test", "State Public Service Commission (State PSC)", "BPSC (Bihar)", "MPPSC (Madhya Pradesh)", "UPPSC (Uttar Pradesh)", "RPSC (Rajasthan)", "GPSC (Gujarat)", "KPSC (Karnataka)", "TNPSC (Tamil Nadu)", "WBPSC (West Bengal)", "APPSC (Andhra Pradesh)", "TSPSC (Telangana)", "CGPSC (Chhattisgarh)", "UKPSC (Uttarakhand)", "HPPSC (Himachal Pradesh)", "PPSC (Punjab)", "JKPSC (Jammu & Kashmir)", "APSC (Assam)", "MPSC (Maharashtra)", "KPSC (Kerala)"],
        "Banking Exams": ["IBPS PO (Probationary Officer)", "IBPS Clerk", "IBPS SO (Specialist Officer)", "IBPS RRB (Regional Rural Banks)", "SBI PO", "SBI Clerk", "SBI SO", "RBI Grade B", "RBI Assistant", "NABARD Grade A & B", "SIDBI", "SEBI Grade A", "IPPB (India Post Payment Bank)", "Cooperative Bank Exams"],
        "Insurance Exams": ["LIC AAO (Assistant Administrative Officer)", "LIC ADO (Apprentice Development Officer)", "LIC HFL (Housing Finance Limited)", "NIACL (New India Assurance)", "OICL (Oriental Insurance)", "UIIC (United India Insurance)", "GIC (General Insurance Corporation)"],
        "Railways Exams": ["RRB NTPC (Non-Technical Popular Categories)", "RRB Group D", "RRB JE (Junior Engineer)", "RRB ALP (Assistant Loco Pilot)", "RRB RPF (Railway Protection Force)", "RRB Technician", "DFCCIL (Dedicated Freight Corridor Corporation)", "RITES (Rail India Technical & Economic Service)", "IRCTC", "CONCOR"],
        "SSC Exams (Staff Selection Commission)": ["SSC CGL (Combined Graduate Level)", "SSC CHSL (Combined Higher Secondary Level)", "SSC CPO (Central Police Organisation)", "SSC GD (General Duty)", "SSC JE (Junior Engineer)", "SSC MTS (Multi-Tasking Staff)", "SSC Stenographer", "SSC Selection Post", "SSC Scientific Assistant"],
        "Defence Exams": ["NDA (National Defence Academy)", "CDS (Combined Defence Services)", "AFCAT (Air Force Common Admission Test)", "Indian Army TGC/TES", "Indian Navy Entrance", "Indian Air Force", "INET (Indian Navy Entrance Test)", "Territorial Army", "Coast Guard", "Military Nursing Service", "Para Military Forces"],
        "Police & Law Enforcement": ["CAPF (Central Armed Police Forces)", "CRPF (Central Reserve Police Force)", "BSF (Border Security Force)", "CISF (Central Industrial Security Force)", "ITBP (Indo-Tibetan Border Police)", "SSB (Sashastra Seema Bal)", "Assam Rifles", "NSG (National Security Guard)", "State Police Constable", "State Police SI (Sub-Inspector)", "Delhi Police", "Mumbai Police"],
        "Teaching Exams": ["CTET (Central Teacher Eligibility Test)", "State TET (All States)", "UGC NET (National Eligibility Test)", "CSIR NET", "SLET/SET (State Level Eligibility Test)", "KVS (Kendriya Vidyalaya Sangathan)", "NVS (Navodaya Vidyalaya Samiti)", "DSSSB (Delhi Subordinate Services Selection Board)", "Army Public School Teachers", "AWES (Army Welfare Education Society)"],
        "Legal & Judicial Services": ["CLAT PG (Common Law Admission Test)", "Judicial Services (All States)", "AIBE (All India Bar Examination)", "District Judge Exam", "Civil Judge Exam", "Judicial Magistrate", "Law Officer Exams"],
        "State Government Exams": ["Group A, B, C, D Posts (All States)", "Patwari Exam", "Revenue Inspector", "Village Accountant", "Gram Sevak", "Panchayat Secretary", "Block Development Officer", "Tehsildar", "Lekhpal"],
        "Central Government Recruitment": ["UPPCL (Uttar Pradesh Power Corporation)", "State Electricity Boards", "FCI (Food Corporation of India)", "ESIC (Employees' State Insurance Corporation)", "EPFO (Employees' Provident Fund Organisation)", "NHM (National Health Mission)", "NRHM (National Rural Health Mission)", "India Post GDS/Postman/Mail Guard", "DRDO (Defence Research & Development Organisation)", "ISRO (Indian Space Research Organisation)", "BARC (Bhabha Atomic Research Centre)", "BHEL (Bharat Heavy Electricals Limited)", "ONGC (Oil & Natural Gas Corporation)", "IOCL (Indian Oil Corporation)", "BPCL (Bharat Petroleum Corporation)", "HPCL (Hindustan Petroleum Corporation)", "GAIL (Gas Authority of India Limited)", "Coal India Limited", "NTPC (National Thermal Power Corporation)", "Power Grid Corporation", "HAL (Hindustan Aeronautics Limited)", "BEL (Bharat Electronics Limited)", "SAIL (Steel Authority of India Limited)", "AAI (Airports Authority of India)"],
        "Research & Scientific": ["CSIR NET", "GATE (Graduate Aptitude Test in Engineering)", "JEST (Joint Entrance Screening Test)", "JGEEBILS (Joint GATE Entrance Examination for Biology & Life Sciences)", "TIFR (Tata Institute of Fundamental Research)", "IISc Admission Test", "IISER Aptitude Test"],
        "Other Government Exams": ["Lok Sabha Secretariat", "Rajya Sabha Secretariat", "Election Commission of India", "CAG (Comptroller & Auditor General)", "Supreme Court of India", "High Court Recruitment", "Intelligence Bureau (IB)", "Research & Analysis Wing (RAW)", "CBI (Central Bureau of Investigation)", "NIA (National Investigation Agency)", "ED (Enforcement Directorate)"],
        "ENGINEERING ENTRANCE EXAMS - INDIA": ["JEE Main", "JEE Advanced", "BITSAT (Birla Institute of Technology & Science)", "VITEEE (VIT Engineering Entrance Exam)", "SRMJEEE (SRM Joint Engineering Entrance Exam)", "COMEDK UGET", "MET (Manipal Entrance Test)", "AEEE (Amrita Engineering Entrance Exam)", "KIITEE (Kalinga Institute of Industrial Technology)", "WBJEE (West Bengal Joint Entrance Exam)", "UPSEE/UPTU (Uttar Pradesh State Entrance Exam)", "KCET (Karnataka Common Entrance Test)", "TNEA (Tamil Nadu Engineering Admissions)", "AP EAMCET (Andhra Pradesh Engineering Common Entrance Test)", "TS EAMCET (Telangana State Engineering Common Entrance Test)", "MHT CET (Maharashtra Common Entrance Test)", "GUJCET (Gujarat Common Entrance Test)", "KEAM (Kerala Engineering Architecture Medical)", "OJEE (Odisha Joint Entrance Exam)", "BCECE (Bihar Combined Entrance Competitive Exam)", "JCECE (Jharkhand Combined Entrance Competitive Exam)", "CGPET (Chhattisgarh Pre-Engineering Test)", "RPET (Rajasthan Pre-Engineering Test)", "MP JEE (Madhya Pradesh Joint Entrance Exam)"],
        "Architecture Entrance": ["NATA (National Aptitude Test in Architecture)", "JEE Main Paper 2 (B.Arch)", "AAT (Architecture Aptitude Test - After JEE Advanced)"],
        "MEDICAL ENTRANCE EXAMS - INDIA": ["NEET UG (Undergraduate)", "NEET PG (Postgraduate)", "NEET SS (Super Specialty)", "NEET MDS (Master of Dental Surgery)", "AIIMS Nursing", "INI CET (Institute of National Importance Combined Entrance Test)", "Allied Medical & Paramedical", "JIPMER Nursing", "BHU Nursing", "PGIMER Nursing", "AIIMS B.Sc Nursing", "State Paramedical Entrance Exams", "Pharmacy Entrance Exams"],
        "Physiotherapy Entrance Exams": [],
        "MANAGEMENT ENTRANCE EXAMS - INDIA": ["National Level MBA/PGDM", "CAT (Common Admission Test) - IIMS", "XAT (Xavier Aptitude Test)", "CMAT (Common Management Admission Test)", "MAT (Management Aptitude Test)", "ATMA (AIMS Test for Management Admissions)", "NMAT by GMAC (Narsee Monjee)", "SNAP (Symbiosis National Aptitude Test)", "IIFT (Indian Institute of Foreign Trade)", "TISSNET (Tata Institute of Social Sciences)", "MICAT (MICA Admission Test)", "IBSAT (ICFAI Business School Aptitude Test)", "Integrated & UG Management", "IPMAT (IIM Indore & Rohtak)", "NPAT (NMIMS Programs After Twelfth)", "SET (Symbiosis Entrance Test)", "Christ University Entrance", "DU JAT (Delhi University Joint Admission Test)"],
        "LAW ENTRANCE EXAMS - INDIA": ["CLAT (Common Law Admission Test) - UG & PG", "AILET (All India Law Entrance Test) - NLU Delhi", "LSAT India (Law School Admission Test)", "SLAT (Symbiosis Law Admission Test)", "Christ University Law Entrance", "IPU CET (Guru Gobind Singh Indraprastha University)", "Jindal Global Law School Entrance", "BLAT (Bennett Law Aptitude Test)", "DU LLB Entrance", "BHU UET (Law)", "AMU Law Entrance", "Jamia Millia Islamia Law Entrance"],
        "DESIGN & CREATIVE ENTRANCE EXAMS - INDIA": ["UCEED (Undergraduate Common Entrance Exam for Design) - IIT", "CEED (Common Entrance Exam for Design) - IIT Postgraduate", "NID DAT (National Institute of Design - Design Aptitude Test)", "NIFT Entrance Exam", "PEARL (Pearl Academy Entrance Exam)", "SEED (Srishti Entrance Exam for Design)", "MIT Institute of Design Entrance", "Symbiosis Institute of Design Entrance", "FDDI (Footwear Design & Development Institute)", "AIFD (Army Institute of Fashion & Design)", "NIFT", "NID", "IIAD (Indian Institute of Art & Design)", "Arch Academy Entrance", "JJ School of Applied Art Entrance"],
        "HOTEL MANAGEMENT & HOSPITALITY EXAMS - INDIA": ["NCHMCT JEE (National Council for Hotel Management Joint Entrance Exam)", "IHM Entrance Exams (State-wise)", "AIMA UGAT (Hotel Management)", "WIHM Entrance", "BHM Entrance (Various Universities)"],
        "MASS COMMUNICATION & JOURNALISM - INDIA": ["IIMC Entrance (Indian Institute of Mass Communication)", "JMI Mass Communication Entrance", "DUET (Delhi University) - Journalism", "Symbiosis Entrance (Mass Communication)", "Xavier Institute of Communication Entrance", "Asian College of Journalism (ACJ)", "IP University CET (Mass Communication)"],
        "OTHER PROFESSIONAL ENTRANCE EXAMS - INDIA": ["NIMCET (NIT MCA Common Entrance Test)", "BIT MCA Entrance", "VIT MCA Entrance", "IPU CET (MCA)", "State University MCA Entrances", "IGRUA (Indira Gandhi Rashtriya Uran Akademi)", "NDA (for Indian Air Force)", "Pilot Training Entrance Exams", "Cabin Crew Entrance", "ICAR AIEEA (UG & PG)", "State Agriculture University Entrances", "Veterinary Entrance Exams", "GPAT (Graduate Pharmacy Aptitude Test)", "State Pharmacy Entrance Exams", "TISS NET (Tata Institute of Social Sciences)", "DU Entrance (Social Work)", "IGNOU MSW Entrance", "UGC NET (Library & Information Science)"],
        "SCHOOL/FOUNDATION LEVEL EXAMS - INDIA": ["National Science Olympiad (NSO)", "National Cyber Olympiad (NCO)", "International Mathematics Olympiad (IMO)", "International English Olympiad (IEO)", "Science Olympiad Foundation (SOF) Exams", "NTSE (National Talent Search Examination)", "KVPY (Kishore Vaigyanik Protsahan Yojana)", "NMMS (National Means cum Merit Scholarship)", "JSTSE (Junior Science Talent Search Examination)", "NTSE", "NMMS", "INSPIRE", "Pre-RMO (Regional Mathematical Olympiad)", "RMO", "INMO (Indian National Mathematical Olympiad)", "Sainik School Entrance (AISSEE)", "Jawahar Navodaya Vidyalaya Selection Test (JNVST)", "Army Public School Entrance", "Delhi Public School Entrance", "Various Private School Entrances"],
        "INTERNATIONAL EXAMS": ["IELTS (International English Language Testing System)", "TOEFL (Test of English as a Foreign Language)", "PTE (Pearson Test of English)", "Duolingo English Test", "Cambridge English Exams (FCE, CAE, CPE)", "GRE (Graduate Record Examination)", "GMAT (Graduate Management Admission Test)", "SAT (Scholastic Assessment Test)", "ACT (American College Testing)", "MCAT (Medical College Admission Test)", "LSAT (Law School Admission Test - US)", "PCAT (Pharmacy College Admission Test)", "DAT (Dental Admission Test)", "OAT (Optometry Admission Test)", "AP (Advanced Placement) Exams", "IB (International Baccalaureate) Preparation", "CFA (Chartered Financial Analyst)", "FRM (Financial Risk Manager)", "ACCA (Association of Chartered Certified Accountants)", "CPA (Certified Public Accountant - US)", "CMA (Certified Management Accountant - US)", "CIA (Certified Internal Auditor)", "CISA (Certified Information Systems Auditor)", "PMP (Project Management Professional)", "PRINCE2", "ITIL", "CEH (Certified Ethical Hacker)", "CISSP (Certified Information Systems Security Professional)"]
    }
};

interface ExamPrepCourseFormProps {
    currentCourse: Course;
    handleCourseChange: (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => void;
    handleFileChange: (e: React.ChangeEvent<HTMLInputElement>, type: "image" | "brochure" | "centerImage") => void;
    setCourses: React.Dispatch<React.SetStateAction<Course[]>>;
    courses: Course[];
    selectedCourseId: number;
    setSelectedCourseId: (id: number) => void;
    addNewCourse: () => void;
    deleteCourse: (id: number) => void;
    courseErrors?: Record<string, string>;
    labelVariant?: 'course' | 'program';
    uniqueRemoteBranches?: Array<{ _id: string; branchName: string; branchAddress?: string; locationUrl?: string }>;
    selectedBranchId?: string;
    isSubscriptionProgram?: boolean;
}

export default function ExamPrepCourseForm({
    currentCourse,
    handleCourseChange,
    setCourses,
    courses,
    selectedCourseId,
    setSelectedCourseId,
    addNewCourse,
    deleteCourse,
    courseErrors = {},
    labelVariant = 'course',
    handleFileChange,
    uniqueRemoteBranches = [],
    selectedBranchId,
    isSubscriptionProgram = true,
}: ExamPrepCourseFormProps) {
    const yesNoOptions = ["Yes", "No"];

    // Auto-set category on mount
    React.useEffect(() => {
        if (currentCourse.categoriesType !== "Exam Preparation") {
            setCourses((prevCourses) =>
                prevCourses.map((c) =>
                    c.id === selectedCourseId ? { ...c, categoriesType: "Exam Preparation" } : c
                )
            );
        }
    }, [currentCourse.categoriesType, selectedCourseId, setCourses]);

    // Derived Domains & Sub-Domains
    const availableDomains = EXAM_PREP_DATA.domains;

    const availableSubDomains = useMemo(() => {
        return EXAM_PREP_DATA.subDomains[currentCourse.domainType as keyof typeof EXAM_PREP_DATA.subDomains] || [];
    }, [currentCourse.domainType]);

    const districtOptions = useMemo(() => {
        if (!currentCourse.state) return [];
        return STATE_DISTRICT_MAP[currentCourse.state] || [];
    }, [currentCourse.state]);

    const handleDomainChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const newDomain = e.target.value;
        setCourses(courses.map(course =>
            course.id === selectedCourseId
                ? { ...course, domainType: newDomain, subDomainType: '' }
                : course
        ));
    };

    const handleRadioChange = (name: keyof Course, value: string) => {
        if (name === "createdBranch" && value === "Main") {
            if (selectedBranchId) {
                const branch = uniqueRemoteBranches.find((b) => b._id === selectedBranchId);
                if (branch) {
                    setCourses((prev) =>
                        prev.map((c) =>
                            c.id === selectedCourseId
                                ? {
                                    ...c,
                                    createdBranch: "Main",
                                    headquatersAddress: branch.branchAddress || "",
                                    aboutBranch: branch.branchAddress || "",
                                    locationURL: branch.locationUrl || "",
                                }
                                : c
                        )
                    );
                    return;
                }
            }
        }

        setCourses((prev) =>
            prev.map((c) => {
                if (c.id === selectedCourseId) {
                    if (name === "createdBranch" && value === "") {
                        return { ...c, createdBranch: "", headquatersAddress: "", aboutBranch: "", locationURL: "" };
                    }
                    return { ...c, [name]: value };
                }
                return c;
            })
        );
    };

    return (
        <div className="space-y-8">
            {/* Course List & Add Button */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-wrap">
                    {courses.map((course) => (
                        <Button
                            key={course.id}
                            type="button"
                            variant="ghost"
                            onClick={() => setSelectedCourseId(course.id)}
                            className={`px-3 py-2 rounded-lg text-sm border transition-colors flex items-center gap-2 ${selectedCourseId === course.id
                                ? "bg-blue-50 border-blue-200 text-blue-700 font-medium"
                                : "bg-gray-50 border-gray-200 dark:bg-gray-800 text-gray-600 hover:bg-gray-100"
                                }`}
                        >
                            {course.courseName || `Course ${course.id}`}
                            {courses.length > 1 && (
                                <span
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        deleteCourse(course.id);
                                    }}
                                    className="ml-1 hover:text-red-500 transition-colors cursor-pointer"
                                >
                                    <X size={14} />
                                </span>
                            )}
                        </Button>
                    ))}
                </div>
                <Button
                    type="button"
                    onClick={addNewCourse}
                    className="bg-[#0222D7] text-white flex items-center gap-2 px-5 py-2 rounded-lg font-semibold shadow-sm transition-transform active:scale-95"
                >
                    <div className="bg-white rounded-full p-0.5 flex items-center justify-center">
                        <Plus size={12} className="text-[#0222D7]" strokeWidth={3} />
                    </div>
                    Add Course
                </Button>
            </div>

            {/* ===== FORM FIELDS ===== */}
            <div className="space-y-6">
                {/* Basic Info */}
                <div className="grid md:grid-cols-2 gap-6">
                    <SearchableSelect
                        label="Domain type"
                        name="domainType"
                        value={currentCourse.domainType || ""}
                        onChange={handleDomainChange}
                        options={availableDomains}
                        placeholder="Select domain type"
                        required
                        error={courseErrors.domainType}
                    />

                    <SearchableSelect
                        label="Sub-Domain type"
                        name="subDomainType"
                        value={currentCourse.subDomainType || ""}
                        onChange={handleCourseChange}
                        options={availableSubDomains}
                        placeholder="Select sub-domain type"
                        required
                        disabled={!currentCourse.domainType}
                        error={courseErrors.subDomainType}
                    />

                    <InputField
                        label="Course Name"
                        name="courseName"
                        value={currentCourse.courseName || ""}
                        onChange={handleCourseChange}
                        placeholder="Enter Course name"
                        icon={<BookOpen size={18} className="text-gray-500" />}
                        required
                        error={courseErrors.courseName}
                    />

                    <div className="flex flex-col gap-2">
                        <label className="font-medium text-[16px]">Mode<span className="text-red-500">*</span></label>
                        <SlidingIndicator
                            options={["Offline", "Online", "Hybrid"] as const}
                            activeOption={currentCourse.mode || "Offline"}
                            onOptionChange={(mode) =>
                                setCourses(
                                    courses.map((course) =>
                                        course.id === selectedCourseId ? { ...course, mode } : course
                                    )
                                )
                            }
                            size="md"
                        />
                    </div>

                    <InputField
                        label={labelVariant === 'program' ? 'Program Duration' : 'Course Duration'}
                        name="courseDuration"
                        value={currentCourse.courseDuration || ""}
                        onChange={handleCourseChange}
                        placeholder="e.g, 3 months"
                        icon={<Calendar size={18} className="text-gray-500" />}
                        required
                        error={courseErrors.courseDuration}
                    />

                    <InputField
                        label="Starting Date"
                        name="startDate"
                        value={currentCourse.startDate || ""}
                        onChange={handleCourseChange}
                        type="date"
                        icon={<Calendar size={18} className="text-gray-500" />}
                        error={courseErrors.startDate}
                        required
                    />

                    <InputField
                        label="Language of Class"
                        name="classlanguage"
                        value={currentCourse.classlanguage || ""}
                        onChange={handleCourseChange}
                        placeholder="E.g.,English"
                        required
                        error={courseErrors.classlanguage}
                    />

                    <InputField
                        label="Class size"
                        name="classSize"
                        value={currentCourse.classSize || ""}
                        onChange={handleCourseChange}
                        required
                        placeholder="Enter no of students per class"
                        icon={<Users size={18} className="text-gray-500" />}
                        error={courseErrors.classSize}
                    />

                    <div className="flex flex-col gap-3">
                        <label className="font-medium text-[16px] dark:text-slate-200">Mock Tests? <span className="text-red-500">*</span></label>
                        <div className="flex gap-6 mt-1">
                            {yesNoOptions.map((option) => (
                                <label key={option} className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" name="mockTests" value={option} checked={currentCourse.mockTests === option} onChange={handleCourseChange} className="w-4 h-4 text-blue-600 border-gray-300" required />
                                    <span className="text-sm text-gray-700 dark:text-slate-300">{option}</span>
                                </label>
                            ))}
                        </div>
                        {courseErrors.mockTests && <p className="text-xs text-red-500">{courseErrors.mockTests}</p>}
                    </div>
                </div>

                {/* Location Box */}
                <div className="bg-[#EBEBFF] p-6 rounded-[6px] space-y-6 border border-blue-100 shadow-[0px_4px_20px_rgba(0,0,0,0.05)]">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-4">
                        <div className="flex flex-col gap-4">
                            <span className="font-[Montserrat] font-medium text-[16px] md:text-[18px] text-black">
                                This is same as Campus Address
                            </span>
                            <div className="flex gap-8">
                                {["Yes", "No"].map((opt) => (
                                    <label key={opt} className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                                        <input
                                            type="radio"
                                            name="sameAsCampus"
                                            value={opt}
                                            checked={currentCourse.createdBranch === (opt === "Yes" ? "Main" : "")}
                                            onChange={(e) => handleRadioChange("createdBranch", e.target.value === "Yes" ? "Main" : "")}
                                            className="accent-[#0222D7] w-4 h-4 cursor-pointer"
                                        />
                                        {opt}
                                    </label>
                                ))}
                            </div>
                            {currentCourse.createdBranch === "Main" && !selectedBranchId && (
                                <p className="text-red-500 text-[10px] font-bold uppercase mt-1">
                                    * Please select a branch at the top first
                                </p>
                            )}
                        </div>

                        <InputField
                            label="Location URL"
                            name="locationURL"
                            value={currentCourse.locationURL || ""}
                            onChange={handleCourseChange}
                            placeholder="Paste the URL"
                            icon={<Link size={18} className="text-gray-500" />}
                            error={courseErrors.locationUrl}
                            required
                        />

                        <InputField
                            label="Headquarters Address"
                            name="headquatersAddress"
                            value={currentCourse.headquatersAddress || ""}
                            onChange={handleCourseChange}
                            placeholder="Enter address"
                            icon={<Send size={18} className="text-gray-500 rotate-45" />}
                            error={courseErrors.headquatersAddress}
                            required
                        />

                        <SearchableSelect
                            label="State"
                            name="state"
                            value={currentCourse.state || ""}
                            onChange={handleCourseChange}
                            options={STATE_OPTIONS}
                            placeholder="Enter State"
                            required
                            error={courseErrors.state}
                        />

                        <SearchableSelect
                            label="District"
                            name="district"
                            value={currentCourse.district || ""}
                            onChange={handleCourseChange}
                            options={districtOptions}
                            placeholder={currentCourse.state ? "Enter District" : "Enter State first"}
                            required
                            disabled={!currentCourse.state}
                            error={courseErrors.district}
                        />

                        <InputField
                            label="Town"
                            name="town"
                            value={currentCourse.town || ""}
                            onChange={handleCourseChange}
                            placeholder="Enter Town"
                            error={courseErrors.town}
                            required
                        />
                    </div>
                </div>

                {/* Price & Facilities */}
                <div className="grid md:grid-cols-2 gap-x-10 gap-y-6">
                    <InputField
                        label="Price of Course"
                        name="priceOfCourse"
                        type="number"
                        value={currentCourse.priceOfCourse || ""}
                        onChange={handleCourseChange}
                        placeholder="Enter Course price"
                        icon={<IndianRupee size={18} className="text-gray-500" />}
                        required
                        error={courseErrors.priceOfCourse}
                    />

                    <div className="space-y-2">
                        <label className="font-medium text-[16px] text-gray-900">Center Images</label>
                        <div className="relative group">
                            <input
                                type="file"
                                id="center-image-input"
                                accept="image/*"
                                onChange={(e) => handleFileChange(e, "centerImage")}
                                className="hidden"
                            />
                            <label
                                htmlFor="center-image-input"
                                className="flex items-center justify-between w-full h-[52px] px-4 bg-white border border-[#DADADD] rounded-[12px] cursor-pointer hover:bg-gray-50 transition-all overflow-hidden"
                            >
                                {currentCourse.centerImagePreviewUrl ? (
                                    <div className="flex items-center gap-2 w-full">
                                        <img
                                            src={currentCourse.centerImagePreviewUrl}
                                            alt="Preview"
                                            className="h-8 w-8 object-cover rounded"
                                        />
                                        <span className="text-sm truncate">Image Selected</span>
                                    </div>
                                ) : (
                                    <>
                                        <span className="text-[16px] text-[#697282] dark:placeholder:text-gray-400 font-normal font-[Montserrat]">Upload center images</span>
                                        <Upload className="text-gray-400 w-5 h-5" />
                                    </>
                                )}
                            </label>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <label className="font-medium text-[16px] dark:text-slate-200">Library Facility <span className="text-red-500">*</span></label>
                        <div className="flex gap-6 mt-1">
                            {yesNoOptions.map((option) => (
                                <label key={option} className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" name="libraryFacility" value={option} checked={currentCourse.libraryFacility === option} onChange={handleCourseChange} className="w-4 h-4 text-blue-600 border-gray-300" required />
                                    <span className="text-sm text-gray-700">{option}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <label className="font-medium text-[16px] dark:text-slate-200">Study Material <span className="text-red-500">*</span></label>
                        <div className="flex gap-6 mt-1">
                            {yesNoOptions.map((option) => (
                                <label key={option} className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" name="studyMaterial" value={option} checked={currentCourse.studyMaterial === option} onChange={handleCourseChange} className="w-4 h-4 text-blue-600 border-gray-300" required />
                                    <span className="text-sm text-gray-700">{option}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Financials */}
                <div className="grid md:grid-cols-2 gap-x-10 gap-y-6 dark:border-slate-800">
                    <div className="flex flex-col gap-3">
                        <label className="font-medium text-[16px] dark:text-slate-200">Installments <span className="text-red-500">*</span></label>
                        <div className="flex gap-6 mt-1">
                            {yesNoOptions.map((option) => (
                                <label key={option} className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" name="installments" value={option} checked={currentCourse.installments === option} onChange={handleCourseChange} className="w-4 h-4 text-blue-600 border-gray-300" required />
                                    <span className="text-sm text-gray-700">{option}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    <div className="flex flex-col gap-3">
                        <label className="font-medium text-[16px] dark:text-slate-200">EMI Options <span className="text-red-500">*</span></label>
                        <div className="flex gap-6 mt-1">
                            {yesNoOptions.map((option) => (
                                <label key={option} className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" name="emioptions" value={option} checked={currentCourse.emioptions === option} onChange={handleCourseChange} className="w-4 h-4 text-blue-600 border-gray-300" required />
                                    <span className="text-sm text-gray-700">{option}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Image & Brochure Upload Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
                <div className="space-y-3">
                    <label className="font-medium text-[16px] text-gray-900">Add Image <span className="text-red-500">*</span></label>
                    <div className="relative group">
                        <input type="file" id="course-image-input" accept="image/*" onChange={(e) => handleFileChange(e, "image")} className="hidden" />
                        <label htmlFor="course-image-input" className="flex flex-col items-center justify-center w-full h-[110px] bg-white border border-[#DADADD] rounded-[12px] cursor-pointer hover:bg-gray-50 transition-all overflow-hidden">
                            {(currentCourse.image || currentCourse.imagePreviewUrl) ? (
                                <div className="relative w-full h-full flex items-center justify-center bg-gray-50">
                                    <img
                                        src={currentCourse.imagePreviewUrl}
                                        alt="Preview"
                                        className="h-full w-full object-contain p-2"
                                    />
                                    <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <span className="text-xs font-bold text-white bg-black/40 px-2 py-1 rounded">Change Image</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-2">
                                    <div className="border border-slate-400 rounded-full p-1">
                                        <Upload className="text-slate-500 w-4 h-4" />
                                    </div>
                                    <span className="text-[13px] text-slate-500">Upload Course Image (jpg / jpeg)</span>
                                </div>
                            )}
                        </label>
                    </div>
                    {courseErrors.imageUrl && <p className="text-xs text-red-500 mt-1">{courseErrors.imageUrl}</p>}
                </div>

                <div className="space-y-3">
                    <label className="font-medium text-[16px] text-gray-900">Add Brochure <span className="text-red-500">*</span></label>
                    <div className="relative group">
                        <input type="file" id="brochure-input" accept="application/pdf" onChange={(e) => handleFileChange(e, "brochure")} className="hidden" />
                        <label htmlFor="brochure-input" className="flex flex-col items-center justify-center w-full h-[110px] bg-white border border-[#DADADD] rounded-[12px] cursor-pointer hover:bg-gray-50 transition-all overflow-hidden">
                            {(currentCourse.brochure || currentCourse.brochurePreviewUrl) ? (
                                <div className="flex flex-col items-center gap-1">
                                    <FileText className="text-red-500 w-8 h-8" />
                                    <span className="text-sm text-slate-700 font-bold">Brochure Attached</span>
                                    <span className="text-[10px] text-gray-500 truncate max-w-[200px]">
                                        {currentCourse.brochure?.name || "View PDF"}
                                    </span>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-2">
                                    <div className="border border-slate-400 rounded-full p-1">
                                        <Upload className="text-slate-500 w-4 h-4" />
                                    </div>
                                    <span className="text-[13px] text-slate-500">Upload Brochure Course (pdf)</span>
                                </div>
                            )}
                        </label>
                    </div>
                    {courseErrors.brochureUrl && <p className="text-xs text-red-500 mt-1">{courseErrors.brochureUrl}</p>}
                </div>
            </div>
        </div>
    );
}
