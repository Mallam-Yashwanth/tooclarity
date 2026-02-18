"use client";

import React, { useMemo } from "react";
import InputField from "@/components/ui/InputField";
import SearchableSelect from "@/components/ui/SearchableSelect";
import SlidingIndicator from "@/components/ui/SlidingIndicator";
import { Course } from "../../L2DialogBox";
import { STATE_DISTRICT_MAP, STATE_OPTIONS } from "@/constants/stateDistricts";
import { Button } from "@/components/ui/button";
import { Plus, X, Upload, FileText, BookOpen, Calendar, Clock, IndianRupee, Link, Send } from "lucide-react";

// Upskilling Domain Data
const UPSKILLING_DATA = {
    domains: [
        "Programming Languages", "Web Development", "Mobile App Development", "Database & Backend", "DevOps & Cloud", "Data Science & Analytics", "Artificial Intelligence & Machine Learning", "Cyber Security", "Blockchain & Emerging Tech", "Software Testing & QA", "UI/UX & Design Tech", "IT Management & Architecture", "Game Development", "Specialized IT Areas", "Graphic Design & Visual Arts", "Video & Motion Graphics", "Photography", "Music & Audio", "Beauty & Wellness", "Fashion & Styling", "Marketing & Sales", "Business Management", "Finance & Accounting", "Human Resources", "Supply Chain & Logistics", "Language Learning", "Communication & Soft Skills", "Health & Fitness", "Culinary Arts & Food", "Performing Arts", "Craft & DIY", "Interior Design & Home Decor", "Event Management & Hospitality", "Automobile & Mechanics", "Other Vocational Skills", "Real Estate", "Agriculture & Farming", "Pet Care"
    ],
    subDomains: {
        "Programming Languages": ["Python Programming", "Java Programming", "C Programming", "C++ Programming", "C# Programming", "JavaScript", "TypeScript", "Ruby", "PHP", "Go (Golang)", "Rust", "Kotlin", "Swift", "Objective-C", "Scala", "Perl", "R Programming", "MATLAB", "Julia"],
        "Web Development": ["HTML5 & CSS3", "Frontend Development", "Backend Development", "Full Stack Development", "React.js", "Angular", "Vue.js", "Node.js", "Express.js", "Django", "Flask", "Ruby on Rails", "ASP.NET", "Laravel", "WordPress Development", "Shopify Development", "Responsive Web Design", "Progressive Web Apps (PWA)", "Web Performance Optimization"],
        "Mobile App Development": ["Android Development", "iOS Development", "React Native", "Flutter", "Ionic", "Xamarin", "Cross-Platform Development", "Mobile UI/UX Design", "App Store Optimization"],
        "Database & Backend": ["SQL & Database Management", "MySQL", "PostgreSQL", "MongoDB", "Oracle Database", "Microsoft SQL Server", "Redis", "Cassandra", "DynamoDB", "Firebase", "Database Design & Architecture", "Database Administration (DBA)"],
        "DevOps & Cloud": ["DevOps Fundamentals", "Docker & Containerization", "Kubernetes", "Jenkins", "Git & GitHub", "GitLab CI/CD", "AWS (Amazon Web Services)", "Microsoft Azure", "Google Cloud Platform (GCP)", "Cloud Architecture", "Infrastructure as Code (Terraform, Ansible)", "Linux Administration", "Server Management", "Microservices Architecture"],
        "Data Science & Analytics": ["Data Science Fundamentals", "Data Analysis", "Data Visualization", "Business Intelligence (BI)", "Tableau", "Power BI", "Excel Advanced & Data Analytics", "Google Data Analytics", "Statistical Analysis", "Predictive Analytics", "Big Data Analytics", "Apache Hadoop", "Apache Spark", "Data Engineering", "ETL (Extract, Transform, Load)", "SQL for Data Analysis"],
        "Artificial Intelligence & Machine Learning": ["Machine Learning Fundamentals", "Deep Learning", "Neural Networks", "Computer Vision", "Natural Language Processing (NLP)", "AI & ML with Python", "TensorFlow", "PyTorch", "Scikit-learn", "Keras", "Reinforcement Learning", "GANs (Generative Adversarial Networks)", "MLOps", "AI Ethics"],
        "Cyber Security": ["Ethical Hacking", "Penetration Testing", "Network Security", "Information Security", "Cyber Security Fundamentals", "CEH (Certified Ethical Hacker) Prep", "CISSP Prep", "Security+", "Web Application Security", "Cloud Security", "Malware Analysis", "Digital Forensics", "Incident Response", "Security Operations Center (SOC)", "Cryptography"],
        "Blockchain & Emerging Tech": ["Blockchain Fundamentals", "Cryptocurrency & Bitcoin", "Ethereum & Smart Contracts", "Solidity Programming", "Web3 Development", "NFT Development", "DeFi (Decentralized Finance)", "Blockchain for Business"],
        "Software Testing & QA": ["Manual Testing", "Automation Testing", "Selenium", "Appium", "TestNG", "JUnit", "API Testing", "Performance Testing (JMeter, LoadRunner)", "Quality Assurance (QA)", "Test-Driven Development (TDD)"],
        "UI/UX & Design Tech": ["UI/UX Design", "Figma", "Adobe XD", "Sketch", "InVision", "Wireframing & Prototyping", "User Research", "Usability Testing", "Design Thinking", "Product Design"],
        "IT Management & Architecture": ["IT Project Management", "Agile & Scrum", "Software Architecture", "System Design", "Enterprise Architecture", "ITIL", "SAP", "Salesforce", "ServiceNow"],
        "Game Development": ["Unity Game Development", "Unreal Engine", "Game Design", "3D Game Development", "Mobile Game Development", "VR/AR Game Development"],
        "Specialized IT Areas": ["Internet of Things (IoT)", "Augmented Reality (AR)", "Virtual Reality (VR)", "Quantum Computing", "Edge Computing", "5G Technology", "Robotics Programming", "Embedded Systems"],
        "Graphic Design & Visual Arts": ["Graphic Design Fundamentals", "Adobe Photoshop", "Adobe Illustrator", "CorelDRAW", "Adobe InDesign", "Canva for Professionals", "Logo Design", "Brand Identity Design", "Print Design", "Packaging Design", "Typography", "Color Theory", "Digital Illustration", "Vector Art", "Photo Editing & Retouching"],
        "Video & Motion Graphics": ["Video Editing", "Adobe Premiere Pro", "Final Cut Pro", "DaVinci Resolve", "After Effects", "Motion Graphics", "Animation", "2D Animation", "3D Animation (Blender, Maya, 3ds Max)", "VFX (Visual Effects)", "Cinematography", "Video Production", "YouTube Video Creation", "Short Film Making"],
        "Photography": ["Photography Fundamentals", "Digital Photography", "Portrait Photography", "Wedding Photography", "Product Photography", "Fashion Photography", "Wildlife Photography", "Landscape Photography", "Street Photography", "Food Photography", "Real Estate Photography", "Drone Photography", "Photo Editing (Lightroom)", "Studio Lighting", "Commercial Photography"],
        "Music & Audio": ["Music Production", "Audio Engineering", "Sound Design", "Music Composition", "Digital Audio Workstation (Logic Pro, Ableton, FL Studio)", "Mixing & Mastering", "Voice Over Training", "Podcast Production", "Singing/Vocal Training", "Guitar/Piano/Drums (Various Instruments)", "Music Theory", "DJ Training"],
        "Beauty & Wellness": ["Professional Makeup Artistry", "Bridal Makeup", "HD Makeup", "Special Effects Makeup", "Hair Styling", "Hair Cutting & Coloring", "Nail Art & Manicure", "Cosmetology", "Beauty Therapy", "Spa Therapy", "Massage Therapy", "Aromatherapy", "Skincare Specialist", "Permanent Makeup (Microblading)", "Eyelash Extensions"],
        "Fashion & Styling": ["Fashion Design", "Fashion Illustration", "Pattern Making", "Garment Construction", "Fashion Styling", "Personal Styling", "Image Consulting", "Wardrobe Consulting", "Fashion Merchandising", "Textile Design"],
        "Marketing & Sales": ["Digital Marketing", "Social Media Marketing", "Content Marketing", "Email Marketing", "SEO (Search Engine Optimization)", "SEM (Search Engine Marketing)", "Google Ads", "Facebook Ads", "Instagram Marketing", "LinkedIn Marketing", "Influencer Marketing", "Affiliate Marketing", "Growth Hacking", "Marketing Analytics", "Brand Management", "Public Relations (PR)", "Sales Techniques", "B2B Sales", "Negotiation Skills", "Customer Relationship Management (CRM)"],
        "Business Management": ["Business Strategy", "Business Development", "Operations Management", "Project Management (PMP, PRINCE2)", "Entrepreneurship", "Startup Management", "Business Planning", "Lean Management", "Six Sigma", "Change Management", "Risk Management", "Strategic Planning"],
        "Finance & Accounting": ["Financial Analysis", "Financial Modeling", "Investment Banking", "Equity Research", "Portfolio Management", "Personal Finance", "Wealth Management", "Tax Planning", "Bookkeeping", "QuickBooks", "Tally", "GST (Goods & Services Tax)", "Accounting Fundamentals", "Corporate Finance"],
        "Human Resources": ["HR Management", "Talent Acquisition & Recruitment", "Employee Relations", "Performance Management", "Compensation & Benefits", "HR Analytics", "Organizational Development", "Training & Development", "Labour Laws", "Payroll Management"],
        "Supply Chain & Logistics": ["Supply Chain Management", "Logistics Management", "Inventory Management", "Warehouse Management", "Procurement", "Import Export Management", "Custom Clearance"],
        "Language Learning": ["English Speaking & Communication", "IELTS Preparation", "TOEFL Preparation", "PTE Preparation", "Business English", "French Language", "German Language", "Spanish Language", "Mandarin Chinese", "Japanese Language", "Korean Language", "Arabic Language", "Italian Language", "Portuguese Language", "Russian Language", "Dutch Language", "Hindi for Foreigners", "Sanskrit Language"],
        "Communication & Soft Skills": ["Public Speaking", "Presentation Skills", "Business Communication", "Email Writing", "Report Writing", "Technical Writing", "Creative Writing", "Copywriting", "Content Writing", "Blogging", "Storytelling", "Interpersonal Skills", "Leadership Skills", "Team Management", "Time Management", "Emotional Intelligence", "Conflict Resolution", "Critical Thinking", "Problem Solving", "Decision Making"],
        "Health & Fitness": ["Personal Training", "Yoga Teacher Training (200hr, 500hr)", "Pilates Instructor", "Zumba Instructor", "Aerobics Instructor", "CrossFit Training", "Nutrition & Diet Planning", "Sports Nutrition", "Weight Loss Coaching", "Fitness Coaching", "Strength & Conditioning", "Meditation & Mindfulness", "Pranayama", "Reiki Healing", "Alternative Therapy"],
        "Culinary Arts & Food": ["Cooking Classes (Various Cuisines)", "Baking & Pastry", "Cake Decorating", "Chocolate Making", "Indian Cuisine", "Chinese Cuisine", "Italian Cuisine", "Continental Cuisine", "Bakery Management", "Food Styling & Photography", "Barista Training", "Bartending", "Wine Sommelier", "Food Safety & Hygiene"],
        "Performing Arts": ["Acting", "Theatre Arts", "Dance (Classical/Contemporary)", "Bharatanatyam", "Kathak", "Hip Hop Dance", "Salsa", "Ballet", "Stage Performance", "Stand-up Comedy", "Improv Comedy", "Mimicry & Voice Modulation"],
        "Craft & DIY": ["Handmade Jewelry Making", "Pottery & Ceramics", "Candle Making", "Soap Making", "Paper Crafts", "Origami", "Crochet & Knitting", "Embroidery", "Painting (Oil, Acrylic, Watercolor)", "Sketching & Drawing", "Calligraphy", "Rangoli & Mandala Art", "Resin Art", "Macrame"],
        "Interior Design & Home Decor": ["Interior Design", "Interior Decoration", "Vastu Shastra", "Feng Shui", "Furniture Design", "3D Visualization (SketchUp, 3ds Max)", "AutoCAD for Interiors", "Home Staging"],
        "Event Management & Hospitality": ["Event Planning & Management", "Wedding Planning", "Corporate Event Management", "Hotel Management", "Front Office Operations", "Housekeeping Management", "Food & Beverage Service", "Hospitality Management"],
        "Automobile & Mechanics": ["Car Driving", "Bike Riding", "Automobile Repair & Maintenance", "Two-Wheeler Mechanics", "Four-Wheeler Mechanics", "Electrical Vehicle Training", "Diesel Mechanics"],
        "Other Vocational Skills": ["Tailoring & Stitching", "Garment Making", "Screen Printing", "Mobile Repairing", "Computer Hardware", "AC & Refrigeration Repair", "Electrical Work", "Plumbing", "Carpentry", "Welding", "Painting (Walls)", "Tile Fitting", "Security Guard Training", "Housekeeping", "Patient Care Attendant", "First Aid & CPR"],
        "Real Estate": ["Real Estate Sales", "Property Management", "Real Estate Investment", "Real Estate Marketing", "RERA Compliance"],
        "Agriculture & Farming": ["Organic Farming", "Hydroponics", "Terrace Gardening", "Mushroom Cultivation", "Vermicomposting", "Beekeeping", "Poultry Farming", "Dairy Farming"],
        "Pet Care": ["Dog Training", "Pet Grooming", "Pet Care & Management", "Veterinary Assistant"]
    }
};

interface UpskillingCourseFormProps {
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

export default function UpskillingCourseForm({
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
}: UpskillingCourseFormProps) {
    const yesNoOptions = ["Yes", "No"];

    // Auto-set category on mount
    React.useEffect(() => {
        if (currentCourse.categoriesType !== "Upskilling") {
            setCourses((prevCourses) =>
                prevCourses.map((c) =>
                    c.id === selectedCourseId ? { ...c, categoriesType: "Upskilling" } : c
                )
            );
        }
    }, [currentCourse.categoriesType, selectedCourseId, setCourses]);

    // Derived Domains & Sub-Domains
    const availableDomains = UPSKILLING_DATA.domains;

    const availableSubDomains = useMemo(() => {
        return UPSKILLING_DATA.subDomains[currentCourse.domainType as keyof typeof UPSKILLING_DATA.subDomains] || [];
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
                {/* 1. Basic Info & Course Details */}
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
                        placeholder={labelVariant === 'program' ? 'Enter program name' : 'Enter course name'}
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
                        label="Class Timings"
                        name="classTiming"
                        value={currentCourse.classTiming || ""}
                        onChange={handleCourseChange}
                        placeholder="9:00 AM - 4:00 PM"
                        icon={<Clock size={18} className="text-gray-500" />}
                        required
                        error={courseErrors.classTiming}
                    />

                    <InputField
                        label="Language of Course"
                        name="courselanguage"
                        value={currentCourse.courselanguage || ""}
                        onChange={handleCourseChange}
                        isSelect
                        required
                        options={["English", "Hindi", "Telugu"]}
                        placeholder="Select Language"
                        error={courseErrors.courselanguage}
                    />

                    <div className="flex flex-col gap-3">
                        <label className="font-medium text-[16px] dark:text-slate-200">Certification? <span className="text-red-500">*</span></label>
                        <div className="flex gap-6">
                            {yesNoOptions.map((option) => (
                                <label key={option} className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" name="certification" value={option} checked={currentCourse.certification === option} onChange={handleCourseChange} className="w-4 h-4 text-blue-600 border-gray-300" required />
                                    <span className="text-sm text-gray-700 dark:text-slate-300">{option}</span>
                                </label>
                            ))}
                        </div>
                        {courseErrors.certification && <p className="text-xs text-red-500">{courseErrors.certification}</p>}
                    </div>
                </div>

                {/* 2. Location Box */}
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
                            placeholder="Select state"
                            required
                            error={courseErrors.state}
                        />

                        <SearchableSelect
                            label="District"
                            name="district"
                            value={currentCourse.district || ""}
                            onChange={handleCourseChange}
                            options={districtOptions}
                            placeholder={currentCourse.state ? "Select district" : "Select state first"}
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

                {/* 3. Placement & Stats Details */}
                <div className="grid md:grid-cols-2 gap-x-10 gap-y-6">
                    <div className="flex flex-col gap-3">
                        <label className="font-medium text-[16px] dark:text-slate-200">Placement drives? <span className="text-red-500">*</span></label>
                        <div className="flex gap-6 mt-1">
                            {yesNoOptions.map((option) => (
                                <label key={option} className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" name="placementDrives" value={option} checked={currentCourse.placementDrives === option} onChange={handleCourseChange} className="w-4 h-4 text-blue-600 border-gray-300" required />
                                    <span className="text-sm text-gray-700">{option}</span>
                                </label>
                            ))}
                        </div>
                        {courseErrors.placementDrives && <p className="text-xs text-red-500">{courseErrors.placementDrives}</p>}
                    </div>

                    <InputField
                        label="Total Requirements"
                        name="totalNumberRequires"
                        value={currentCourse.totalNumberRequires || ""}
                        onChange={handleCourseChange}
                        placeholder="690" type="number"
                        required
                        error={courseErrors.totalNumberRequires}
                    />

                    <InputField
                        label="Highest Package"
                        name="highestPackage"
                        value={currentCourse.highestPackage || ""}
                        onChange={handleCourseChange}
                        placeholder="15 LPA"
                        icon={<IndianRupee size={18} className="text-gray-500" />}
                        error={courseErrors.highestPackage}
                        required
                    />

                    <InputField
                        label="Average Package"
                        name="averagePackage"
                        value={currentCourse.averagePackage || ""}
                        onChange={handleCourseChange}
                        placeholder="10 LPA"
                        icon={<IndianRupee size={18} className="text-gray-500" />}
                        error={courseErrors.averagePackage}
                        required
                    />

                    <InputField
                        label="Total Students Placed"
                        name="totalStudentsPlaced"
                        value={currentCourse.totalStudentsPlaced || ""}
                        onChange={handleCourseChange}
                        placeholder="400"
                        type="number"
                        error={courseErrors.totalStudentsPlaced}
                        required
                    />

                    <div className="flex flex-col gap-3">
                        <label className="font-medium text-[16px] dark:text-slate-200">Mock Interviews? <span className="text-red-500">*</span></label>
                        <div className="flex gap-6 mt-1">
                            {yesNoOptions.map((option) => (
                                <label key={option} className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" name="mockInterviews" value={option} checked={currentCourse.mockInterviews === option} onChange={handleCourseChange} className="w-4 h-4 text-blue-600 border-gray-300" required />
                                    <span className="text-sm text-gray-700">{option}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <label className="font-medium text-[16px] dark:text-slate-200">Resume Building?<span className="text-red-500">*</span></label>
                        <div className="flex gap-6 mt-1">
                            {yesNoOptions.map((option) => (
                                <label key={option} className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" name="resumeBuilding" value={option} checked={currentCourse.resumeBuilding === option} onChange={handleCourseChange} className="w-4 h-4 text-blue-600 border-gray-300" required />
                                    <span className="text-sm text-gray-700">{option}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <label className="font-medium text-[16px] dark:text-slate-200">LinkedIn Optimization?<span className="text-red-500">*</span></label>
                        <div className="flex gap-6 mt-1">
                            {yesNoOptions.map((option) => (
                                <label key={option} className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" name="linkedinOptimization" value={option} checked={currentCourse.linkedinOptimization === option} onChange={handleCourseChange} className="w-4 h-4 text-blue-600 border-gray-300" required />
                                    <span className="text-sm text-gray-700">{option}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 4. Price & Financials & Images */}
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
