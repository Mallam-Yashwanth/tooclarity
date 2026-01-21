"use client";

import InputField from "@/components/ui/InputField";
import SearchableSelect from "@/components/ui/SearchableSelect";
import SlidingIndicator from "@/components/ui/SlidingIndicator";
import { Course } from "../../L2DialogBox";
import { useEffect, useMemo } from "react";
import { STATE_DISTRICT_MAP, STATE_OPTIONS } from "@/constants/stateDistricts";
import { getMyInstitution } from "@/lib/api";
import { Clock, FileText, IndianRupee, Plus, Upload, Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";

// Cascading dropdown data structure
const CATEGORY_DOMAIN_MAPPING = {
  "Exam Preparation": {
    domains: [
      "Civil Services & Administrative",
      "Banking Exams",
      "Insurance Exams",
      "Railways Exams",
      "SSC Exams (Staff Selection Commission)",
      "Defence Exams",
      "Police & Law Enforcement",
      "Teaching Exams",
      "Legal & Judicial Services",
      "State Government Exams",
      "Central Government Recruitment",
      "Research & Scientific",
      "Other Government Exams",
      "ENGINEERING ENTRANCE EXAMS - INDIA",
      "Architecture Entrance",
      "MEDICAL ENTRANCE EXAMS - INDIA",
      "Physiotherapy Entrance Exams",
      "MANAGEMENT ENTRANCE EXAMS - INDIA",
      "LAW ENTRANCE EXAMS - INDIA",
      "DESIGN & CREATIVE ENTRANCE EXAMS - INDIA",
      "HOTEL MANAGEMENT & HOSPITALITY EXAMS - INDIA",
      "MASS COMMUNICATION & JOURNALISM - INDIA",
      "OTHER PROFESSIONAL ENTRANCE EXAMS - INDIA",
      "SCHOOL/FOUNDATION LEVEL EXAMS - INDIA",
      "INTERNATIONAL EXAMS"
    ],
    subDomains: {
      "Civil Services & Administrative": [
        "UPSC Civil Services Examination (IAS/IPS/IFS)",
        "UPSC Prelims",
        "UPSC Mains",
        "UPSC Interview/Personality Test",
        "State Public Service Commission (State PSC)",
        "BPSC (Bihar)",
        "MPPSC (Madhya Pradesh)",
        "UPPSC (Uttar Pradesh)",
        "RPSC (Rajasthan)",
        "GPSC (Gujarat)",
        "KPSC (Karnataka)",
        "TNPSC (Tamil Nadu)",
        "WBPSC (West Bengal)",
        "APPSC (Andhra Pradesh)",
        "TSPSC (Telangana)",
        "CGPSC (Chhattisgarh)",
        "UKPSC (Uttarakhand)",
        "HPPSC (Himachal Pradesh)",
        "PPSC (Punjab)",
        "JKPSC (Jammu & Kashmir)",
        "APSC (Assam)",
        "MPSC (Maharashtra)",
        "KPSC (Kerala)"
      ],
      "Banking Exams": [
        "IBPS PO (Probationary Officer)",
        "IBPS Clerk",
        "IBPS SO (Specialist Officer)",
        "IBPS RRB (Regional Rural Banks)",
        "SBI PO",
        "SBI Clerk",
        "SBI SO",
        "RBI Grade B",
        "RBI Assistant",
        "NABARD Grade A & B",
        "SIDBI",
        "SEBI Grade A",
        "IPPB (India Post Payment Bank)",
        "Cooperative Bank Exams"
      ],
      "Insurance Exams": [
        "LIC AAO (Assistant Administrative Officer)",
        "LIC ADO (Apprentice Development Officer)",
        "LIC HFL (Housing Finance Limited)",
        "NIACL (New India Assurance)",
        "OICL (Oriental Insurance)",
        "UIIC (United India Insurance)",
        "GIC (General Insurance Corporation)"
      ],
      "Railways Exams": [
        "RRB NTPC (Non-Technical Popular Categories)",
        "RRB Group D",
        "RRB JE (Junior Engineer)",
        "RRB ALP (Assistant Loco Pilot)",
        "RRB RPF (Railway Protection Force)",
        "RRB Technician",
        "DFCCIL (Dedicated Freight Corridor Corporation)",
        "RITES (Rail India Technical & Economic Service)",
        "IRCTC",
        "CONCOR"
      ],
      "SSC Exams (Staff Selection Commission)": [
        "SSC CGL (Combined Graduate Level)",
        "SSC CHSL (Combined Higher Secondary Level)",
        "SSC CPO (Central Police Organisation)",
        "SSC GD (General Duty)",
        "SSC JE (Junior Engineer)",
        "SSC MTS (Multi-Tasking Staff)",
        "SSC Stenographer",
        "SSC Selection Post",
        "SSC Scientific Assistant"
      ],
      "Defence Exams": [
        "NDA (National Defence Academy)",
        "CDS (Combined Defence Services)",
        "AFCAT (Air Force Common Admission Test)",
        "Indian Army TGC/TES",
        "Indian Navy Entrance",
        "Indian Air Force",
        "INET (Indian Navy Entrance Test)",
        "Territorial Army",
        "Coast Guard",
        "Military Nursing Service",
        "Para Military Forces"
      ],
      "Police & Law Enforcement": [
        "CAPF (Central Armed Police Forces)",
        "CRPF (Central Reserve Police Force)",
        "BSF (Border Security Force)",
        "CISF (Central Industrial Security Force)",
        "ITBP (Indo-Tibetan Border Police)",
        "SSB (Sashastra Seema Bal)",
        "Assam Rifles",
        "NSG (National Security Guard)",
        "State Police Constable",
        "State Police SI (Sub-Inspector)",
        "Delhi Police",
        "Mumbai Police"
      ],
      "Teaching Exams": [
        "CTET (Central Teacher Eligibility Test)",
        "State TET (All States)",
        "UGC NET (National Eligibility Test)",
        "CSIR NET",
        "SLET/SET (State Level Eligibility Test)",
        "KVS (Kendriya Vidyalaya Sangathan)",
        "NVS (Navodaya Vidyalaya Samiti)",
        "DSSSB (Delhi Subordinate Services Selection Board)",
        "Army Public School Teachers",
        "AWES (Army Welfare Education Society)"
      ],
      "Legal & Judicial Services": [
        "CLAT PG (Common Law Admission Test)",
        "Judicial Services (All States)",
        "AIBE (All India Bar Examination)",
        "District Judge Exam",
        "Civil Judge Exam",
        "Judicial Magistrate",
        "Law Officer Exams"
      ],
      "State Government Exams": [
        "Group A, B, C, D Posts (All States)",
        "Patwari Exam",
        "Revenue Inspector",
        "Village Accountant",
        "Gram Sevak",
        "Panchayat Secretary",
        "Block Development Officer",
        "Tehsildar",
        "Lekhpal"
      ],
      "Central Government Recruitment": [
        "UPPCL (Uttar Pradesh Power Corporation)",
        "State Electricity Boards",
        "FCI (Food Corporation of India)",
        "ESIC (Employees' State Insurance Corporation)",
        "EPFO (Employees' Provident Fund Organisation)",
        "NHM (National Health Mission)",
        "NRHM (National Rural Health Mission)",
        "India Post GDS/Postman/Mail Guard",
        "DRDO (Defence Research & Development Organisation)",
        "ISRO (Indian Space Research Organisation)",
        "BARC (Bhabha Atomic Research Centre)",
        "BHEL (Bharat Heavy Electricals Limited)",
        "ONGC (Oil & Natural Gas Corporation)",
        "IOCL (Indian Oil Corporation)",
        "BPCL (Bharat Petroleum Corporation)",
        "HPCL (Hindustan Petroleum Corporation)",
        "GAIL (Gas Authority of India Limited)",
        "Coal India Limited",
        "NTPC (National Thermal Power Corporation)",
        "Power Grid Corporation",
        "HAL (Hindustan Aeronautics Limited)",
        "BEL (Bharat Electronics Limited)",
        "SAIL (Steel Authority of India Limited)",
        "AAI (Airports Authority of India)"
      ],
      "Research & Scientific": [
        "CSIR NET",
        "GATE (Graduate Aptitude Test in Engineering)",
        "JEST (Joint Entrance Screening Test)",
        "JGEEBILS (Joint GATE Entrance Examination for Biology & Life Sciences)",
        "TIFR (Tata Institute of Fundamental Research)",
        "IISc Admission Test",
        "IISER Aptitude Test"
      ],
      "Other Government Exams": [
        "Lok Sabha Secretariat",
        "Rajya Sabha Secretariat",
        "Election Commission of India",
        "CAG (Comptroller & Auditor General)",
        "Supreme Court of India",
        "High Court Recruitment",
        "Intelligence Bureau (IB)",
        "Research & Analysis Wing (RAW)",
        "CBI (Central Bureau of Investigation)",
        "NIA (National Investigation Agency)",
        "ED (Enforcement Directorate)"
      ],
      "ENGINEERING ENTRANCE EXAMS - INDIA": [
        "JEE Main",
        "JEE Advanced",
        "BITSAT (Birla Institute of Technology & Science)",
        "VITEEE (VIT Engineering Entrance Exam)",
        "SRMJEEE (SRM Joint Engineering Entrance Exam)",
        "COMEDK UGET",
        "MET (Manipal Entrance Test)",
        "AEEE (Amrita Engineering Entrance Exam)",
        "KIITEE (Kalinga Institute of Industrial Technology)",
        "WBJEE (West Bengal Joint Entrance Exam)",
        "UPSEE/UPTU (Uttar Pradesh State Entrance Exam)",
        "KCET (Karnataka Common Entrance Test)",
        "TNEA (Tamil Nadu Engineering Admissions)",
        "AP EAMCET (Andhra Pradesh Engineering Common Entrance Test)",
        "TS EAMCET (Telangana State Engineering Common Entrance Test)",
        "MHT CET (Maharashtra Common Entrance Test)",
        "GUJCET (Gujarat Common Entrance Test)",
        "KEAM (Kerala Engineering Architecture Medical)",
        "OJEE (Odisha Joint Entrance Exam)",
        "BCECE (Bihar Combined Entrance Competitive Exam)",
        "JCECE (Jharkhand Combined Entrance Competitive Exam)",
        "CGPET (Chhattisgarh Pre-Engineering Test)",
        "RPET (Rajasthan Pre-Engineering Test)",
        "MP JEE (Madhya Pradesh Joint Entrance Exam)"
      ],
      "Architecture Entrance": [
        "NATA (National Aptitude Test in Architecture)",
        "JEE Main Paper 2 (B.Arch)",
        "AAT (Architecture Aptitude Test - After JEE Advanced)"
      ],
      "MEDICAL ENTRANCE EXAMS - INDIA": [
        "NEET UG (Undergraduate)",
        "NEET PG (Postgraduate)",
        "NEET SS (Super Specialty)",
        "NEET MDS (Master of Dental Surgery)",
        "AIIMS Nursing",
        "INI CET (Institute of National Importance Combined Entrance Test)",
        "Allied Medical & Paramedical",
        "JIPMER Nursing",
        "BHU Nursing",
        "PGIMER Nursing",
        "AIIMS B.Sc Nursing",
        "State Paramedical Entrance Exams",
        "Pharmacy Entrance Exams"
      ],
      "Physiotherapy Entrance Exams": [],
      "MANAGEMENT ENTRANCE EXAMS - INDIA": [
        "National Level MBA/PGDM",
        "CAT (Common Admission Test) - IIMS",
        "XAT (Xavier Aptitude Test)",
        "CMAT (Common Management Admission Test)",
        "MAT (Management Aptitude Test)",
        "ATMA (AIMS Test for Management Admissions)",
        "NMAT by GMAC (Narsee Monjee)",
        "SNAP (Symbiosis National Aptitude Test)",
        "IIFT (Indian Institute of Foreign Trade)",
        "TISSNET (Tata Institute of Social Sciences)",
        "MICAT (MICA Admission Test)",
        "IBSAT (ICFAI Business School Aptitude Test)",
        "Integrated & UG Management",
        "IPMAT (IIM Indore & Rohtak)",
        "NPAT (NMIMS Programs After Twelfth)",
        "SET (Symbiosis Entrance Test)",
        "Christ University Entrance",
        "DU JAT (Delhi University Joint Admission Test)"
      ],
      "LAW ENTRANCE EXAMS - INDIA": [
        "CLAT (Common Law Admission Test) - UG & PG",
        "AILET (All India Law Entrance Test) - NLU Delhi",
        "LSAT India (Law School Admission Test)",
        "SLAT (Symbiosis Law Admission Test)",
        "Christ University Law Entrance",
        "IPU CET (Guru Gobind Singh Indraprastha University)",
        "Jindal Global Law School Entrance",
        "BLAT (Bennett Law Aptitude Test)",
        "DU LLB Entrance",
        "BHU UET (Law)",
        "AMU Law Entrance",
        "Jamia Millia Islamia Law Entrance"
      ],
      "DESIGN & CREATIVE ENTRANCE EXAMS - INDIA": [
        "UCEED (Undergraduate Common Entrance Exam for Design) - IIT",
        "CEED (Common Entrance Exam for Design) - IIT Postgraduate",
        "NID DAT (National Institute of Design - Design Aptitude Test)",
        "NIFT Entrance Exam",
        "PEARL (Pearl Academy Entrance Exam)",
        "SEED (Srishti Entrance Exam for Design)",
        "MIT Institute of Design Entrance",
        "Symbiosis Institute of Design Entrance",
        "FDDI (Footwear Design & Development Institute)",
        "AIFD (Army Institute of Fashion & Design)",
        "NIFT",
        "NID",
        "IIAD (Indian Institute of Art & Design)",
        "Arch Academy Entrance",
        "JJ School of Applied Art Entrance"
      ],
      "HOTEL MANAGEMENT & HOSPITALITY EXAMS - INDIA": [
        "NCHMCT JEE (National Council for Hotel Management Joint Entrance Exam)",
        "IHM Entrance Exams (State-wise)",
        "AIMA UGAT (Hotel Management)",
        "WIHM Entrance",
        "BHM Entrance (Various Universities)"
      ],
      "MASS COMMUNICATION & JOURNALISM - INDIA": [
        "IIMC Entrance (Indian Institute of Mass Communication)",
        "JMI Mass Communication Entrance",
        "DUET (Delhi University) - Journalism",
        "Symbiosis Entrance (Mass Communication)",
        "Xavier Institute of Communication Entrance",
        "Asian College of Journalism (ACJ)",
        "IP University CET (Mass Communication)"
      ],
      "OTHER PROFESSIONAL ENTRANCE EXAMS - INDIA": [
        "NIMCET (NIT MCA Common Entrance Test)",
        "BIT MCA Entrance",
        "VIT MCA Entrance",
        "IPU CET (MCA)",
        "State University MCA Entrances",
        "IGRUA (Indira Gandhi Rashtriya Uran Akademi)",
        "NDA (for Indian Air Force)",
        "Pilot Training Entrance Exams",
        "Cabin Crew Entrance",
        "ICAR AIEEA (UG & PG)",
        "State Agriculture University Entrances",
        "Veterinary Entrance Exams",
        "GPAT (Graduate Pharmacy Aptitude Test)",
        "State Pharmacy Entrance Exams",
        "TISS NET (Tata Institute of Social Sciences)",
        "DU Entrance (Social Work)",
        "IGNOU MSW Entrance",
        "UGC NET (Library & Information Science)"
      ],
      "SCHOOL/FOUNDATION LEVEL EXAMS - INDIA": [
        "National Science Olympiad (NSO)",
        "National Cyber Olympiad (NCO)",
        "International Mathematics Olympiad (IMO)",
        "International English Olympiad (IEO)",
        "Science Olympiad Foundation (SOF) Exams",
        "NTSE (National Talent Search Examination)",
        "KVPY (Kishore Vaigyanik Protsahan Yojana)",
        "NMMS (National Means cum Merit Scholarship)",
        "JSTSE (Junior Science Talent Search Examination)",
        "NTSE",
        "NMMS",
        "INSPIRE",
        "Pre-RMO (Regional Mathematical Olympiad)",
        "RMO",
        "INMO (Indian National Mathematical Olympiad)",
        "Sainik School Entrance (AISSEE)",
        "Jawahar Navodaya Vidyalaya Selection Test (JNVST)",
        "Army Public School Entrance",
        "Delhi Public School Entrance",
        "Various Private School Entrances"
      ],
      "INTERNATIONAL EXAMS": [
        "IELTS (International English Language Testing System)",
        "TOEFL (Test of English as a Foreign Language)",
        "PTE (Pearson Test of English)",
        "Duolingo English Test",
        "Cambridge English Exams (FCE, CAE, CPE)",
        "GRE (Graduate Record Examination)",
        "GMAT (Graduate Management Admission Test)",
        "SAT (Scholastic Assessment Test)",
        "ACT (American College Testing)",
        "MCAT (Medical College Admission Test)",
        "LSAT (Law School Admission Test - US)",
        "PCAT (Pharmacy College Admission Test)",
        "DAT (Dental Admission Test)",
        "OAT (Optometry Admission Test)",
        "AP (Advanced Placement) Exams",
        "IB (International Baccalaureate) Preparation",
        "CFA (Chartered Financial Analyst)",
        "FRM (Financial Risk Manager)",
        "ACCA (Association of Chartered Certified Accountants)",
        "CPA (Certified Public Accountant - US)",
        "CMA (Certified Management Accountant - US)",
        "CIA (Certified Internal Auditor)",
        "CISA (Certified Information Systems Auditor)",
        "PMP (Project Management Professional)",
        "PRINCE2",
        "ITIL",
        "CEH (Certified Ethical Hacker)",
        "CISSP (Certified Information Systems Security Professional)"
      ]
    }
  },
  "Upskilling": {
    domains: [
      "Programming Languages",
      "Web Development",
      "Mobile App Development",
      "Database & Backend",
      "DevOps & Cloud",
      "Data Science & Analytics",
      "Artificial Intelligence & Machine Learning",
      "Cyber Security",
      "Blockchain & Emerging Tech",
      "Software Testing & QA",
      "UI/UX & Design Tech",
      "IT Management & Architecture",
      "Game Development",
      "Specialized IT Areas",
      "Graphic Design & Visual Arts",
      "Video & Motion Graphics",
      "Photography",
      "Music & Audio",
      "Beauty & Wellness",
      "Fashion & Styling",
      "Marketing & Sales",
      "Business Management",
      "Finance & Accounting",
      "Human Resources",
      "Supply Chain & Logistics",
      "Language Learning",
      "Communication & Soft Skills",
      "Health & Fitness",
      "Culinary Arts & Food",
      "Performing Arts",
      "Craft & DIY",
      "Interior Design & Home Decor",
      "Event Management & Hospitality",
      "Automobile & Mechanics",
      "Other Vocational Skills",
      "Real Estate",
      "Agriculture & Farming",
      "Pet Care"
    ],
    subDomains: {
      "Programming Languages": [
        "Python Programming",
        "Java Programming",
        "C Programming",
        "C++ Programming",
        "C# Programming",
        "JavaScript",
        "TypeScript",
        "Ruby",
        "PHP",
        "Go (Golang)",
        "Rust",
        "Kotlin",
        "Swift",
        "Objective-C",
        "Scala",
        "Perl",
        "R Programming",
        "MATLAB",
        "Julia"
      ],
      "Web Development": [
        "HTML5 & CSS3",
        "Frontend Development",
        "Backend Development",
        "Full Stack Development",
        "React.js",
        "Angular",
        "Vue.js",
        "Node.js",
        "Express.js",
        "Django",
        "Flask",
        "Ruby on Rails",
        "ASP.NET",
        "Laravel",
        "WordPress Development",
        "Shopify Development",
        "Responsive Web Design",
        "Progressive Web Apps (PWA)",
        "Web Performance Optimization"
      ],
      "Mobile App Development": [
        "Android Development",
        "iOS Development",
        "React Native",
        "Flutter",
        "Ionic",
        "Xamarin",
        "Cross-Platform Development",
        "Mobile UI/UX Design",
        "App Store Optimization"
      ],
      "Database & Backend": [
        "SQL & Database Management",
        "MySQL",
        "PostgreSQL",
        "MongoDB",
        "Oracle Database",
        "Microsoft SQL Server",
        "Redis",
        "Cassandra",
        "DynamoDB",
        "Firebase",
        "Database Design & Architecture",
        "Database Administration (DBA)"
      ],
      "DevOps & Cloud": [
        "DevOps Fundamentals",
        "Docker & Containerization",
        "Kubernetes",
        "Jenkins",
        "Git & GitHub",
        "GitLab CI/CD",
        "AWS (Amazon Web Services)",
        "Microsoft Azure",
        "Google Cloud Platform (GCP)",
        "Cloud Architecture",
        "Infrastructure as Code (Terraform, Ansible)",
        "Linux Administration",
        "Server Management",
        "Microservices Architecture"
      ],
      "Data Science & Analytics": [
        "Data Science Fundamentals",
        "Data Analysis",
        "Data Visualization",
        "Business Intelligence (BI)",
        "Tableau",
        "Power BI",
        "Excel Advanced & Data Analytics",
        "Google Data Analytics",
        "Statistical Analysis",
        "Predictive Analytics",
        "Big Data Analytics",
        "Apache Hadoop",
        "Apache Spark",
        "Data Engineering",
        "ETL (Extract, Transform, Load)",
        "SQL for Data Analysis"
      ],
      "Artificial Intelligence & Machine Learning": [
        "Machine Learning Fundamentals",
        "Deep Learning",
        "Neural Networks",
        "Computer Vision",
        "Natural Language Processing (NLP)",
        "AI & ML with Python",
        "TensorFlow",
        "PyTorch",
        "Scikit-learn",
        "Keras",
        "Reinforcement Learning",
        "GANs (Generative Adversarial Networks)",
        "MLOps",
        "AI Ethics"
      ],
      "Cyber Security": [
        "Ethical Hacking",
        "Penetration Testing",
        "Network Security",
        "Information Security",
        "Cyber Security Fundamentals",
        "CEH (Certified Ethical Hacker) Prep",
        "CISSP Prep",
        "Security+",
        "Web Application Security",
        "Cloud Security",
        "Malware Analysis",
        "Digital Forensics",
        "Incident Response",
        "Security Operations Center (SOC)",
        "Cryptography"
      ],
      "Blockchain & Emerging Tech": [
        "Blockchain Fundamentals",
        "Cryptocurrency & Bitcoin",
        "Ethereum & Smart Contracts",
        "Solidity Programming",
        "Web3 Development",
        "NFT Development",
        "DeFi (Decentralized Finance)",
        "Blockchain for Business"
      ],
      "Software Testing & QA": [
        "Manual Testing",
        "Automation Testing",
        "Selenium",
        "Appium",
        "TestNG",
        "JUnit",
        "API Testing",
        "Performance Testing (JMeter, LoadRunner)",
        "Quality Assurance (QA)",
        "Test-Driven Development (TDD)"
      ],
      "UI/UX & Design Tech": [
        "UI/UX Design",
        "Figma",
        "Adobe XD",
        "Sketch",
        "InVision",
        "Wireframing & Prototyping",
        "User Research",
        "Usability Testing",
        "Design Thinking",
        "Product Design"
      ],
      "IT Management & Architecture": [
        "IT Project Management",
        "Agile & Scrum",
        "Software Architecture",
        "System Design",
        "Enterprise Architecture",
        "ITIL",
        "SAP",
        "Salesforce",
        "ServiceNow"
      ],
      "Game Development": [
        "Unity Game Development",
        "Unreal Engine",
        "Game Design",
        "3D Game Development",
        "Mobile Game Development",
        "VR/AR Game Development"
      ],
      "Specialized IT Areas": [
        "Internet of Things (IoT)",
        "Augmented Reality (AR)",
        "Virtual Reality (VR)",
        "Quantum Computing",
        "Edge Computing",
        "5G Technology",
        "Robotics Programming",
        "Embedded Systems"
      ],
      "Graphic Design & Visual Arts": [
        "Graphic Design Fundamentals",
        "Adobe Photoshop",
        "Adobe Illustrator",
        "CorelDRAW",
        "Adobe InDesign",
        "Canva for Professionals",
        "Logo Design",
        "Brand Identity Design",
        "Print Design",
        "Packaging Design",
        "Typography",
        "Color Theory",
        "Digital Illustration",
        "Vector Art",
        "Photo Editing & Retouching"
      ],
      "Video & Motion Graphics": [
        "Video Editing",
        "Adobe Premiere Pro",
        "Final Cut Pro",
        "DaVinci Resolve",
        "After Effects",
        "Motion Graphics",
        "Animation",
        "2D Animation",
        "3D Animation (Blender, Maya, 3ds Max)",
        "VFX (Visual Effects)",
        "Cinematography",
        "Video Production",
        "YouTube Video Creation",
        "Short Film Making"
      ],
      "Photography": [
        "Photography Fundamentals",
        "Digital Photography",
        "Portrait Photography",
        "Wedding Photography",
        "Product Photography",
        "Fashion Photography",
        "Wildlife Photography",
        "Landscape Photography",
        "Street Photography",
        "Food Photography",
        "Real Estate Photography",
        "Drone Photography",
        "Photo Editing (Lightroom)",
        "Studio Lighting",
        "Commercial Photography"
      ],
      "Music & Audio": [
        "Music Production",
        "Audio Engineering",
        "Sound Design",
        "Music Composition",
        "Digital Audio Workstation (Logic Pro, Ableton, FL Studio)",
        "Mixing & Mastering",
        "Voice Over Training",
        "Podcast Production",
        "Singing/Vocal Training",
        "Guitar/Piano/Drums (Various Instruments)",
        "Music Theory",
        "DJ Training"
      ],
      "Beauty & Wellness": [
        "Professional Makeup Artistry",
        "Bridal Makeup",
        "HD Makeup",
        "Special Effects Makeup",
        "Hair Styling",
        "Hair Cutting & Coloring",
        "Nail Art & Manicure",
        "Cosmetology",
        "Beauty Therapy",
        "Spa Therapy",
        "Massage Therapy",
        "Aromatherapy",
        "Skincare Specialist",
        "Permanent Makeup (Microblading)",
        "Eyelash Extensions"
      ],
      "Fashion & Styling": [
        "Fashion Design",
        "Fashion Illustration",
        "Pattern Making",
        "Garment Construction",
        "Fashion Styling",
        "Personal Styling",
        "Image Consulting",
        "Wardrobe Consulting",
        "Fashion Merchandising",
        "Textile Design"
      ],
      "Marketing & Sales": [
        "Digital Marketing",
        "Social Media Marketing",
        "Content Marketing",
        "Email Marketing",
        "SEO (Search Engine Optimization)",
        "SEM (Search Engine Marketing)",
        "Google Ads",
        "Facebook Ads",
        "Instagram Marketing",
        "LinkedIn Marketing",
        "Influencer Marketing",
        "Affiliate Marketing",
        "Growth Hacking",
        "Marketing Analytics",
        "Brand Management",
        "Public Relations (PR)",
        "Sales Techniques",
        "B2B Sales",
        "Negotiation Skills",
        "Customer Relationship Management (CRM)"
      ],
      "Business Management": [
        "Business Strategy",
        "Business Development",
        "Operations Management",
        "Project Management (PMP, PRINCE2)",
        "Entrepreneurship",
        "Startup Management",
        "Business Planning",
        "Lean Management",
        "Six Sigma",
        "Change Management",
        "Risk Management",
        "Strategic Planning"
      ],
      "Finance & Accounting": [
        "Financial Analysis",
        "Financial Modeling",
        "Investment Banking",
        "Equity Research",
        "Portfolio Management",
        "Personal Finance",
        "Wealth Management",
        "Tax Planning",
        "Bookkeeping",
        "QuickBooks",
        "Tally",
        "GST (Goods & Services Tax)",
        "Accounting Fundamentals",
        "Corporate Finance"
      ],
      "Human Resources": [
        "HR Management",
        "Talent Acquisition & Recruitment",
        "Employee Relations",
        "Performance Management",
        "Compensation & Benefits",
        "HR Analytics",
        "Organizational Development",
        "Training & Development",
        "Labour Laws",
        "Payroll Management"
      ],
      "Supply Chain & Logistics": [
        "Supply Chain Management",
        "Logistics Management",
        "Inventory Management",
        "Warehouse Management",
        "Procurement",
        "Import Export Management",
        "Custom Clearance"
      ],
      "Language Learning": [
        "English Speaking & Communication",
        "IELTS Preparation",
        "TOEFL Preparation",
        "PTE Preparation",
        "Business English",
        "French Language",
        "German Language",
        "Spanish Language",
        "Mandarin Chinese",
        "Japanese Language",
        "Korean Language",
        "Arabic Language",
        "Italian Language",
        "Portuguese Language",
        "Russian Language",
        "Dutch Language",
        "Hindi for Foreigners",
        "Sanskrit Language"
      ],
      "Communication & Soft Skills": [
        "Public Speaking",
        "Presentation Skills",
        "Business Communication",
        "Email Writing",
        "Report Writing",
        "Technical Writing",
        "Creative Writing",
        "Copywriting",
        "Content Writing",
        "Blogging",
        "Storytelling",
        "Interpersonal Skills",
        "Leadership Skills",
        "Team Management",
        "Time Management",
        "Emotional Intelligence",
        "Conflict Resolution",
        "Critical Thinking",
        "Problem Solving",
        "Decision Making"
      ],
      "Health & Fitness": [
        "Personal Training",
        "Yoga Teacher Training (200hr, 500hr)",
        "Pilates Instructor",
        "Zumba Instructor",
        "Aerobics Instructor",
        "CrossFit Training",
        "Nutrition & Diet Planning",
        "Sports Nutrition",
        "Weight Loss Coaching",
        "Fitness Coaching",
        "Strength & Conditioning",
        "Meditation & Mindfulness",
        "Pranayama",
        "Reiki Healing",
        "Alternative Therapy"
      ],
      "Culinary Arts & Food": [
        "Cooking Classes (Various Cuisines)",
        "Baking & Pastry",
        "Cake Decorating",
        "Chocolate Making",
        "Indian Cuisine",
        "Chinese Cuisine",
        "Italian Cuisine",
        "Continental Cuisine",
        "Bakery Management",
        "Food Styling & Photography",
        "Barista Training",
        "Bartending",
        "Wine Sommelier",
        "Food Safety & Hygiene"
      ],
      "Performing Arts": [
        "Acting",
        "Theatre Arts",
        "Dance (Classical/Contemporary)",
        "Bharatanatyam",
        "Kathak",
        "Hip Hop Dance",
        "Salsa",
        "Ballet",
        "Stage Performance",
        "Stand-up Comedy",
        "Improv Comedy",
        "Mimicry & Voice Modulation"
      ],
      "Craft & DIY": [
        "Handmade Jewelry Making",
        "Pottery & Ceramics",
        "Candle Making",
        "Soap Making",
        "Paper Crafts",
        "Origami",
        "Crochet & Knitting",
        "Embroidery",
        "Painting (Oil, Acrylic, Watercolor)",
        "Sketching & Drawing",
        "Calligraphy",
        "Rangoli & Mandala Art",
        "Resin Art",
        "Macrame"
      ],
      "Interior Design & Home Decor": [
        "Interior Design",
        "Interior Decoration",
        "Vastu Shastra",
        "Feng Shui",
        "Furniture Design",
        "3D Visualization (SketchUp, 3ds Max)",
        "AutoCAD for Interiors",
        "Home Staging"
      ],
      "Event Management & Hospitality": [
        "Event Planning & Management",
        "Wedding Planning",
        "Corporate Event Management",
        "Hotel Management",
        "Front Office Operations",
        "Housekeeping Management",
        "Food & Beverage Service",
        "Hospitality Management"
      ],
      "Automobile & Mechanics": [
        "Car Driving",
        "Bike Riding",
        "Automobile Repair & Maintenance",
        "Two-Wheeler Mechanics",
        "Four-Wheeler Mechanics",
        "Electrical Vehicle Training",
        "Diesel Mechanics"
      ],
      "Other Vocational Skills": [
        "Tailoring & Stitching",
        "Garment Making",
        "Screen Printing",
        "Mobile Repairing",
        "Computer Hardware",
        "AC & Refrigeration Repair",
        "Electrical Work",
        "Plumbing",
        "Carpentry",
        "Welding",
        "Painting (Walls)",
        "Tile Fitting",
        "Security Guard Training",
        "Housekeeping",
        "Patient Care Attendant",
        "First Aid & CPR"
      ],
      "Real Estate": [
        "Real Estate Sales",
        "Property Management",
        "Real Estate Investment",
        "Real Estate Marketing",
        "RERA Compliance"
      ],
      "Agriculture & Farming": [
        "Organic Farming",
        "Hydroponics",
        "Terrace Gardening",
        "Mushroom Cultivation",
        "Vermicomposting",
        "Beekeeping",
        "Poultry Farming",
        "Dairy Farming"
      ],
      "Pet Care": [
        "Dog Training",
        "Pet Grooming",
        "Pet Care & Management",
        "Veterinary Assistant"
      ]
    }
  }
};

interface CoachingCourseFormProps {
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
  uniqueRemoteBranches?: Array<{ _id: string; branchName: string; branchAddress?: string; state?: string; district?: string; town?: string; locationUrl?: string }>;
  selectedBranchId?: string;
  isSubscriptionProgram?: boolean;
}

  const IconInput = ({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) => (
    <div className="relative flex items-center">
      <span className="absolute left-3 text-gray-400">{icon}</span>
      {children}
    </div>
  );


export default function CoachingCourseForm({
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
  isSubscriptionProgram = true  
}: CoachingCourseFormProps) {
  const yesNoOptions = ["Yes", "No"];


  // Get available domains based on selected category (pure in-memory)
  const availableDomains = useMemo(() => {
    if (!currentCourse.categoriesType) return [];
    const cat = currentCourse.categoriesType as keyof typeof CATEGORY_DOMAIN_MAPPING;
    return CATEGORY_DOMAIN_MAPPING[cat]?.domains || [];
  }, [currentCourse.categoriesType]);

  // Get available sub-domains based on selected category and domain
  const availableSubDomains = useMemo(() => {
    if (!currentCourse.categoriesType || !currentCourse.domainType) return [];
    const cat = currentCourse.categoriesType as keyof typeof CATEGORY_DOMAIN_MAPPING;
    const categoryData = CATEGORY_DOMAIN_MAPPING[cat];
    return categoryData?.subDomains[currentCourse.domainType as keyof typeof categoryData.subDomains] || [];
  }, [currentCourse.categoriesType, currentCourse.domainType]);

  // Handle category change and reset dependent fields
  const handleCategoryChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const newCategory = e.target.value;
    setCourses(courses.map(course =>
      course.id === selectedCourseId
        ? {
          ...course,
          categoriesType: newCategory,
          domainType: '',
          subDomainType: ''
        }
        : course
    ));
  };

  // Handle domain change and reset sub-domain
  const handleDomainChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const newDomain = e.target.value;
    setCourses(courses.map(course =>
      course.id === selectedCourseId
        ? {
          ...course,
          domainType: newDomain,
          subDomainType: ''
        }
        : course
    ));
  };

  useEffect(() => {
    if (isSubscriptionProgram && selectedBranchId && currentCourse.createdBranch === "Main") {
      const branch = uniqueRemoteBranches.find(b => b._id === selectedBranchId);
      if (branch) {
        setCourses(prev => prev.map(c => 
          c.id === selectedCourseId ? {
            ...c,
            // Only sync these two specific fields
            aboutBranch: branch.branchAddress || "",
            locationURL: branch.locationUrl || "",
          } : c
        ));
      }
    }
  }, [selectedBranchId, uniqueRemoteBranches, selectedCourseId, currentCourse.createdBranch, setCourses, isSubscriptionProgram]);
   
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
                    // Only pull address and map link
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
          // When switching to "No", only clear the synced fields
          if (name === "createdBranch" && value === "") {
            return {
              ...c,
              createdBranch: "",
              aboutBranch: "",
              locationURL: "",
            };
          }
          return { ...c, [name]: value };
        }
        return c;
      })
    );
  };





  const districtOptions = useMemo(() => {
    if (!currentCourse.state) return [];
    return STATE_DISTRICT_MAP[currentCourse.state] || [];
  }, [currentCourse.state]);

  return (
    <div className="space-y-8">
      {/* Existing Course/Program Details Section */}
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

      <div className="grid md:grid-cols-2 gap-6">
        <InputField
          label="Categories type"
          name="categoriesType"
          value={currentCourse.categoriesType}
          onChange={handleCategoryChange}
          isSelect
          options={["Exam Preparation", "Upskilling"]}
          placeholder="Select Categories type"
          required
          error={courseErrors.categoriesType}
        />

        <SearchableSelect
          label="Domain type"
          name="domainType"
          value={currentCourse.domainType}
          onChange={handleDomainChange}
          options={availableDomains}
          placeholder="Select domain type"
          required
          disabled={!currentCourse.categoriesType}
          error={courseErrors.domainType}
        />

        <SearchableSelect
          label="Sub-Domain type"
          name="subDomainType"
          value={currentCourse.subDomainType}
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
          value={currentCourse.courseName}
          onChange={handleCourseChange}
          placeholder={labelVariant === 'program' ? 'Enter program name' : 'Enter course name'}
          required
          error={courseErrors.courseName}
        />

        <div className="flex flex-col gap-2">
          <label className="font-medium text-[16px]">Mode<span className="text-red-500">*</span></label>
          <SlidingIndicator
            options={["Offline", "Online", "Hybrid"] as const}
            activeOption={currentCourse.mode}
            onOptionChange={(mode) =>
              setCourses(
                courses.map((course) =>
                  course.id === selectedCourseId ? { ...course, mode } : course
                )
              )
            }
            size="md"
          />
          {courseErrors.mode && <p className="text-sm text-red-500">{courseErrors.mode}</p>}
        </div>

        <InputField
          label={labelVariant === 'program' ? 'Program Duration' : 'Course Duration'}
          name="courseDuration"
          value={currentCourse.courseDuration}
          onChange={handleCourseChange}
          placeholder="e.g, 3 months"
          required
          error={courseErrors.courseDuration}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-x-10 gap-y-6">
        <InputField
          label="Starting Date"
          name="startDate"
          value={currentCourse.startDate}
          onChange={handleCourseChange}
          type="date"
          error={courseErrors.startDate}
          required
        />
        {currentCourse.categoriesType === "Upskilling" ? (
          <div className="flex flex-col gap-2">
            <label className="font-medium text-[16px] dark:text-slate-200">Class timings <span className="text-red-500">*</span></label>
            <IconInput icon={<Clock size={18} />}>
              <input
                name="classTiming"
                value={currentCourse.classTiming || ""}
                onChange={handleCourseChange}
                required
                placeholder="9:00 AM - 4:00 PM"
                className={`w-full pl-10 pr-3 py-2 border rounded-lg bg-white dark:bg-slate-800 text-sm outline-none ${courseErrors.classTiming ? 'border-red-500' : 'border-gray-300 dark:border-slate-700'
                  }`}
              />
            </IconInput>
            {courseErrors.classTiming && (
              <p className="text-xs text-red-500">{courseErrors.classTiming}</p>
            )}
          </div>
        ) : (
          <InputField
            label="Language of Class"
            name="classlanguage"
            value={currentCourse.classlanguage || ""}
            onChange={handleCourseChange}
            placeholder="E.g. English"
            required
            error={courseErrors.classlanguage}
          />
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-x-10 gap-y-6">
        {currentCourse.categoriesType === "Upskilling" ? (
          <>
            {/* Upskilling Row 5  */}
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
          </>
        ) : (
          <>
            {/* Exam Preparation Row 5  */}
            <div className="flex flex-col gap-2">
              <label className="font-medium text-[16px] dark:text-slate-200">Class size <span className="text-red-500">*</span></label>
              <IconInput icon={<Users size={18} />}>
                <input
                  name="classSize"
                  value={currentCourse.classSize || ""}
                  onChange={handleCourseChange}
                  required
                  placeholder="Enter no of students per class"
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg bg-white dark:bg-slate-800 text-sm outline-none ${courseErrors.classSize ? 'border-red-500' : 'border-gray-300'}`}
                />
              </IconInput>
              {courseErrors.classSize && <p className="text-xs text-red-500">{courseErrors.classSize}</p>}
            </div>
            <div className="flex flex-col gap-3">
              <label className="font-medium text-[16px] dark:text-slate-200">Mock Tests? <span className="text-red-500">*</span></label>
              <div className="flex gap-6">
                {yesNoOptions.map((option) => (
                  <label key={option} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="mockTests" value={option} checked={currentCourse.mockTests === option} onChange={handleCourseChange} className="w-4 h-4 text-blue-600 border-gray-300" required />
                    <span className="text-sm text-gray-700 dark:text-slate-300">{option}</span>
                  </label>
                ))}
              </div>
              {courseErrors.mockTests && <p className="text-xs text-red-500">{courseErrors.mockTests}</p>}
            </div>
          </>
        )}
      </div>
      {/* LOCATION BOX SECTION [cite: 14-25] */}
      <div className="bg-[#DCDCFF] p-6 rounded-[6px] space-y-6 border border-blue-100 shadow-[0px_4px_20px_rgba(0,0,0,0.1)]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-4">

          {/* RADIO BUTTON SECTION */}
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
                    // If "Yes" is selected, currentCourse.createdBranch should be "Main"
                    checked={currentCourse.createdBranch === (opt === "Yes" ? "Main" : "")}
                    onChange={(e) =>
                      handleRadioChange("createdBranch", e.target.value === "Yes" ? "Main" : "")
                    }
                    className="accent-[#0222D7] w-4 h-4 cursor-pointer"
                  />
                  {opt}
                </label>
              ))}
            </div>
            {/* Show a warning if they click Yes but haven't picked a branch at the top yet */}
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
            placeholder="https://maps.app.goo.gl/4mPv8SX6cD52i9B"
            error={courseErrors.locationUrl}
            required
          />

          <InputField
            label="headquarters address"
            name="aboutBranch"
            value={currentCourse.aboutBranch || ""}
            onChange={handleCourseChange}
            placeholder="2-3, Uppal Hills Colony, Peerzadiguda"
            error={courseErrors.aboutBranch}
            required
          />

          <SearchableSelect
            label="State"
            name="state"
            value={currentCourse.state}
            onChange={handleCourseChange}
            options={STATE_OPTIONS}
            placeholder="Select state"
            required
            error={courseErrors.state}
          />

          <SearchableSelect
            label="District"
            name="district"
            value={currentCourse.district}
            onChange={handleCourseChange}
            options={districtOptions}
            placeholder={
              currentCourse.state ? "Select district" : "Select state first"
            }
            required
            disabled={!currentCourse.state}
            error={courseErrors.district}
          />

          <InputField
            label="Town"
            name="town"
            value={currentCourse.town}
            onChange={handleCourseChange}
            placeholder="Medchal"
            error={courseErrors.town}
            required
          />
        </div>
      </div>

      <div className="space-y-10 ">
        {/* ROW 1: Price/Images (Exam Prep) OR Placement/Total (Upskilling) [cite: 39-40, 107-110] */}
        <div className="grid md:grid-cols-2 gap-x-10 gap-y-6">
          {currentCourse.categoriesType === "Exam Preparation" ? (
            <>
              <div className="flex flex-col gap-2">
                <label className="font-medium text-[16px] dark:text-slate-200">Price of Course<span className="text-red-500">*</span></label>
                <IconInput icon={<IndianRupee size={18} />}>
                  <input
                    type="number"
                    name="priceOfCourse"
                    value={currentCourse.priceOfCourse || ""}
                    onChange={handleCourseChange}
                    placeholder="Enter Course price"
                    required
                    className={`w-full pl-10 pr-3 py-2 border rounded-lg bg-white dark:bg-slate-800 text-sm outline-none ${courseErrors.priceOfCourse ? 'border-red-500' : 'border-[#DADADD]'}`}
                  />
                </IconInput>
                {courseErrors.priceOfCourse && <p className="text-xs text-red-500">{courseErrors.priceOfCourse}</p>}
              </div>
              <div className="space-y-2">
                <label className="font-medium text-[16px] text-gray-900">Center Images</label>
                <div className="relative group">
                  <input
                    type="file"
                    id="center-image-input"
                    accept="image/*"
                    // ✅ Change "image" to "centerImage"
                    onChange={(e) => handleFileChange(e, "centerImage")}
                    className="hidden"
                  />
                  <label
                    htmlFor="center-image-input"
                    className="flex items-center justify-between w-full h-[42px] px-4 bg-[#F5F6F9] border border-[#DADADD] rounded-lg cursor-pointer hover:bg-gray-100 transition-all overflow-hidden"
                  >
                    {/* ✅ Update check to use centerImagePreviewUrl */}
                    {currentCourse.centerImagePreviewUrl ? (
                      <div className="flex items-center gap-2 w-full">
                        <img
                          src={currentCourse.centerImagePreviewUrl}
                          alt="Preview"
                          className="h-8 w-8 object-cover rounded"
                        />
                      </div>
                    ) : (
                      <>
                        <span className="text-sm text-gray-400 font-normal">Upload center images</span>
                        <Upload className="text-gray-400 w-4 h-4" />
                      </>
                    )}
                  </label>
                </div>
              </div>
            </>
          ) : (
            <>
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
                label="Total number requires"
                name="totalNumberRequires"
                value={currentCourse.totalNumberRequires || ""}
                onChange={handleCourseChange}
                placeholder="690" type="number"
                required
                error={courseErrors.totalNumberRequires}
              />
            </>
          )}
        </div>

        {/* ROW 2: Packages (Upskilling) OR Library/Material (Exam Prep) [cite: 41-43, 111-117] */}
        <div className="grid md:grid-cols-2 gap-x-10 gap-y-6">
          {currentCourse.categoriesType === "Upskilling" ? (
            <>
              <InputField label="Highest Package *" name="highestPackage" value={currentCourse.highestPackage || ""} onChange={handleCourseChange} placeholder="15 LPA" error={courseErrors.highestPackage} required />
              <InputField label="Average Package" name="averagePackage" value={currentCourse.averagePackage || ""} onChange={handleCourseChange} placeholder="10 LPA" error={courseErrors.averagePackage} required />
            </>
          ) : (
            <>
              <div className="flex flex-col gap-3">
                <label className="font-medium text-[16px] dark:text-slate-200">Library Facility<span className="text-red-500">*</span></label>
                <div className="flex gap-6 mt-1">
                  {yesNoOptions.map((option) => (
                    <label key={option} className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="library" value={option} checked={currentCourse.library === option} onChange={handleCourseChange} className="w-4 h-4 text-blue-600 border-gray-300" required />
                      <span className="text-sm text-gray-700">{option}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <label className="font-medium text-[16px] dark:text-slate-200">Study Material<span className="text-red-500">*</span></label>
                <div className="flex gap-6 mt-1">
                  {yesNoOptions.map((option) => (
                    <label key={option} className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="studyMaterial" value={option} checked={currentCourse.studyMaterial === option} onChange={handleCourseChange} className="w-4 h-4 text-blue-600 border-gray-300" required />
                      <span className="text-sm text-gray-700">{option}</span>
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* UPSKILLING SPECIFIC ROWS [cite: 42, 45, 48, 54] */}
        {currentCourse.categoriesType === "Upskilling" && (
          <>
            <div className="grid md:grid-cols-2 gap-x-10 gap-y-6">
              <InputField label="Total no. of students placed" name="totalStudentsPlaced" value={currentCourse.totalStudentsPlaced || ""} onChange={handleCourseChange} placeholder="400" type="number" error={courseErrors.totalStudentsPlaced} required />
              <div className="flex flex-col gap-3">
                <label className="font-medium text-[16px] dark:text-slate-200">Mock interviews? *</label>
                <div className="flex gap-6 mt-1">
                  {yesNoOptions.map((option) => (
                    <label key={option} className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="mockInterviews" value={option} checked={currentCourse.mockInterviews === option} onChange={handleCourseChange} className="w-4 h-4 text-blue-600 border-gray-300" />
                      <span className="text-sm text-gray-700">{option}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-x-10 gap-y-6">
              <div className="flex flex-col gap-3">
                <label className="font-medium text-[16px] dark:text-slate-200">Resume building?<span className="text-red-500">*</span></label>
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
                <label className="font-medium text-[16px] dark:text-slate-200">Linked In Optimization?<span className="text-red-500">*</span></label>
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

            <div className="grid md:grid-cols-2 gap-x-10 gap-y-6">
              <div className="flex flex-col gap-2">
                <label className="font-medium text-[16px] dark:text-slate-200">Price of Course<span className="text-red-500">*</span></label>
                <IconInput icon={<IndianRupee size={18} />}>
                  <input type="number" name="priceOfCourse" value={currentCourse.priceOfCourse || ""} onChange={handleCourseChange} placeholder="1,05,00/-" className={`w-full pl-10 pr-3 py-2 border rounded-lg bg-white dark:bg-slate-800 text-sm outline-none ${courseErrors.priceOfCourse ? 'border-red-500' : 'border-[#DADADD]'}`} required />
                </IconInput>
              </div>
              <div className="space-y-3">
  <label className="font-medium text-[16px] text-gray-900">
    Center Images <span className="text-red-500">*</span>
  </label>
  <div className="relative group">
    <input
      type="file"
      id="college-center-photos"
      accept="image/*"
      multiple
      onChange={(e) => handleFileChange(e, "centerImage")} // ✅ Keep shared centerImage key
      className="hidden"
    />
    <label
      htmlFor="college-center-photos"
      className="flex items-center justify-between w-full h-[48px] px-4 bg-white border border-[#DADADD] rounded-xl cursor-pointer hover:bg-gray-50 transition-all overflow-hidden shadow-sm"
    >
      {/* Logic: Check for the shared centerImage preview key */}
      {(currentCourse.centerImage || currentCourse.centerImagePreviewUrl) ? (
        <div className="flex items-center gap-3 w-full">
          <div className="h-8 w-8 shrink-0 bg-blue-50 border border-blue-200 rounded overflow-hidden">
             <img
               src={currentCourse.centerImagePreviewUrl}
               alt="Center Preview"
               className="h-full w-full object-cover"
             />
          </div>
          <span className="text-sm text-blue-600 font-bold truncate">Center Photos Selected</span>
        </div>
      ) : (
        <>
          <span className="text-sm text-gray-400 font-normal">Upload center images</span>
          <Upload className="text-gray-400 w-5 h-5" />
        </>
      )}
    </label>
  </div>
  {/* Match the error key to centerImageUrl in your Schema */}
  {courseErrors.centerImageUrl && (
    <p className="text-red-500 text-xs mt-1">{courseErrors.centerImageUrl}</p>
  )}
</div>
            </div>
          </>
        )}

        {/* SHARED FINAL ROWS [cite: 52-63, 118-126] */}
        <div className="grid md:grid-cols-2 gap-x-10 gap-y-6 dark:border-slate-800">
          <div className="flex flex-col gap-3">
            <label className="font-medium text-[16px] dark:text-slate-200">Installments<span className="text-red-500">*</span></label>
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
            <label className="font-medium text-[16px] dark:text-slate-200">EMI Options<span className="text-red-500">*</span></label>
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

        {/* UPLOAD SECTION [cite: 60-63, 123-126] */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
          <div className="space-y-3">
            <label className="font-medium text-[16px] text-gray-900">Add Image <span className="text-red-500">*</span></label>
            <div className="relative group">
              <input type="file" id="course-image-input" accept="image/*" onChange={(e) => handleFileChange(e, "image")} className="hidden" />
              <label htmlFor="course-image-input" className="flex flex-col items-center justify-center w-full h-[110px] bg-white border border-[#DADADD] rounded-[12px] cursor-pointer hover:bg-gray-50 transition-all overflow-hidden">
                {/* Logic: Check for the File object OR the Preview URL */}
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

                {/* Updated Logic: Check for file object OR preview URL */}
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
            {/* Display validation error if it exists */}
            {courseErrors.brochureUrl && <p className="text-xs text-red-500 mt-1">{courseErrors.brochureUrl}</p>}
          </div>
        </div>
      </div>
    </div>

  );
}