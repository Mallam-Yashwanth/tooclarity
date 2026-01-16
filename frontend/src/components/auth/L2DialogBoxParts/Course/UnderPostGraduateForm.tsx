"use client";

import InputField from "@/components/ui/InputField";
import SearchableSelect from "@/components/ui/SearchableSelect";
import SlidingIndicator from "@/components/ui/SlidingIndicator";
import type { Course } from "../../L2DialogBox";
import { useEffect, useMemo } from "react";
import { getMyInstitution } from "@/lib/api";
import { STATE_DISTRICT_MAP, STATE_OPTIONS } from "@/constants/stateDistricts";
import { FileText, Plus, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";

// Cascading dropdown data structure for UG/PG
const GRADUATION_STREAM_MAPPING = {
  "Under Graduation": {
    streams: [
      "ENGINEERING & TECHNOLOGY (B.E./B.Tech)",
      "Bachelor of Science(B.sc)",
      "Bachelor Bachelor of Adminstration",
      "Bachelor of Commerce",
      "Business Studies",
      "Economics",
      "bachelor of Arts",
      "MEDICAL & HEALTH SCIENCES",
      "LAW & LEGAL STUDIES",
      "ARCHITECTURE & PLANNING",
      "EDUCATION & TEACHER TRAINING",
      "HOTEL MANAGEMENT & HOSPITALITY",
      "TRAVEL & TOURISM",
      "MASS COMMUNICATION & JOURNALISM",
      "DESIGN & CREATIVE ARTS",
      "FASHION DESIGN & TECHNOLOGY",
      "AVIATION & AEROSPACE",
      "MARITIME STUDIES",
      "SPORTS SCIENCES & PHYSICAL EDUCATION",
      "PARAMEDICAL & ALLIED HEALTH SCIENCES",
      "PHARMACY",
      "NURSING & MIDWIFERY",
      "PHYSIOTHERAPY",
      "OCCUPATIONAL THERAPY",
      "OPTOMETRY",
      "ALTERNATIVE MEDICINE SYSTEMS",
      "LIBRARY & INFORMATION SCIENCE",
      "SOCIAL WORK",
      "HOME SCIENCE & FAMILY SCIENCES",
      "FOOD SCIENCE & NUTRITION",
      "EVENT MANAGEMENT",
      "RETAIL MANAGEMENT",
      "MUSIC & PERFORMING ARTS",
      "ANIMATION & MULTIMEDIA",
      "GAMING & GAME DESIGN",
      "BEAUTY & WELLNESS",
      "CULINARY ARTS & FOOD PRODUCTION",
      "JEWELLERY DESIGN",
      "TEXTILE DESIGN",
      "LEATHER TECHNOLOGY",
      "PRINTING TECHNOLOGY",
      "PACKAGING TECHNOLOGY",
      "FIRE & SAFETY ENGINEERING",
      "FORENSICS"
    ],
    branches: {
      "ENGINEERING & TECHNOLOGY (B.E./B.Tech)": [
        "Agricultural Engineering",
        "Food Technology",
        "Dairy Technology",
        "Textile Technology",
        "Marine Engineering",
        "Textile Engineering",
        "Textile Processing",
        "Leather Technology",
        "Footwear Technology",
        "Printing Technology",
        "Graphic Arts & Printing Technology",
        "Packaging Technology",
        "Fire & Safety Engineering",
        "Environmental Engineering",
        "Geoinformatics",
        "Audio Engineering",
        "Artificial Intelligence",
        "Machine Learning",
        "Robotics & AI",
        "Quantum Computing",
        "Blockchain Technology",
        "Internet of Things (IoT)",
        "Augmented Reality/Virtual Reality",
        "5G Technology",
        "Edge Computing",
        "Renewable Energy",
        "Solar Energy",
        "Wind Energy",
        "Electric Vehicle Technology",
        "Green Building Technology",
        "Sustainable Engineering",
        "Space Technology",
        "Satellite Technology",
        "Biomedical Engineering",
        "Health Informatics",
        "Medical Devices & Diagnostics",
        "Smart City Technology",
        "Automation & Robotics",
        "Civil Engineering",
        "Civil & Environmental Engineering",
        "Civil & Structural Engineering",
        "Civil & Infrastructure Engineering",
        "Mechanical Engineering",
        "Mechanical & Automation Engineering",
        "Mechanical & Production Engineering",
        "Mechanical & Manufacturing Engineering",
        "Automobile Engineering",
        "Automotive Engineering",
        "Aeronautical Engineering",
        "Aerospace Engineering",
        "Electrical Engineering",
        "Electrical & Electronics Engineering (EEE)",
        "Electrical Power Engineering",
        "Electronics & Communication Engineering (ECE)",
        "Electronics & Telecommunication Engineering",
        "Electronics Engineering",
        "Communication Engineering",
        "Computer Science & Engineering (CSE)",
        "Computer Science & Information Technology",
        "Computer Science & Business Systems",
        "Computer Science & Design",
        "Computer Science (Artificial Intelligence & Machine Learning)",
        "Computer Science (Data Science)",
        "Computer Science (Cyber Security)",
        "Computer Science (Cloud Computing)",
        "Computer Science (IoT)",
        "Computer Science (Blockchain Technology)",
        "Information Technology (IT)",
        "Information Science & Engineering",
        "Chemical Engineering",
        "Chemical & Biochemical Engineering",
        "Petrochemical Engineering",
        "Polymer Engineering",
        "Biotechnology Engineering",
        "Bioinformatics",
        "Genetic Engineering",
        "Biological Engineering",
        "Petroleum Engineering",
        "Petroleum Refining & Petrochemicals",
        "Mining Engineering",
        "Mining & Mineral Engineering",
        "Metallurgical Engineering",
        "Metallurgy & Materials Engineering",
        "Materials Science & Engineering",
        "Fashion Technology Engineering",
        "Naval Architecture & Ocean Engineering",
        "Naval Architecture & Ship Building",
        "Agricultural & Food Engineering",
        "Agricultural & Irrigation Engineering",
        "Industrial Engineering",
        "Industrial Engineering & Management",
        "Industrial & Production Engineering",
        "Production Engineering",
        "Manufacturing Engineering",
        "Instrumentation & Control Engineering",
        "Instrumentation Engineering",
        "Electronics & Instrumentation Engineering",
        "Environmental Science & Engineering",
        "Robotics & Automation",
        "Robotics Engineering",
        "Mechatronics Engineering",
        "Energy Engineering",
        "Power Engineering",
        "Renewable Energy Engineering",
        "Food Science & Technology",
        "Food Process Engineering",
        "Ceramic Technology",
        "Ceramic Engineering",
        "Plastic Technology",
        "Polymer Science & Engineering",
        "Nuclear Engineering",
        "Geo-informatics Engineering",
        "Construction Technology & Management",
        "Building Technology & Construction Management",
        "Infrastructure Engineering",
        "Tool & Die Making",
        "Printing Technology & Engineering",
        "Rubber Technology",
        "Sugar Technology",
        "Glass Technology",
        "Paint Technology",
        "Pulp & Paper Technology",
        "Automotive Design Engineering",
        "Avionics Engineering",
        "Artificial Intelligence & Data Science",
        "Artificial Intelligence & Machine Learning",
        "Cyber Security & Digital Forensics",
        "Information Security"],
      "Bachelor of Science(B.sc)": [
        "B.Sc. Economics",
        "B.Sc. Physics",
        "B.Sc. Physics (Honors)",
        "B.Sc. Applied Physics",
        "B.Sc. Electronics",
        "B.Sc. Medical Physics",
        "B.Sc. Chemistry",
        "B.Sc. Chemistry (Honors)",
        "B.Sc. Applied Chemistry",
        "B.Sc. Industrial Chemistry",
        "B.Sc. Analytical Chemistry",
        "B.Sc. Pharmaceutical Chemistry",
        "B.Sc. Mathematics",
        "B.Sc. Mathematics (Honors)",
        "B.Sc. Applied Mathematics",
        "B.Sc. Statistics",
        "B.Sc. Actuarial Science",
        "B.Sc. Biology",
        "B.Sc. Zoology",
        "B.Sc. Botany",
        "B.Sc. Life Sciences",
        "B.Sc. Biological Sciences",
        "B.Sc. Microbiology",
        "B.Sc. Biotechnology",
        "B.Sc. Biochemistry",
        "B.Sc. Genetics",
        "B.Sc. Molecular Biology",
        "B.Sc. Bioinformatics",
        "B.Sc. Biomedical Science",
        "B.Sc. Neuroscience",
        "B.Sc. Biophysics",
        "B.Sc. Environmental Science",
        "B.Sc. Environmental Studies",
        "B.Sc. Ecology & Environmental Biology",
        "B.Sc. Environmental Management",
        "B.Sc. Geology",
        "B.Sc. Geophysics",
        "B.Sc. Geography",
        "B.Sc. Oceanography",
        "B.Sc. Meteorology",
        "B.Sc. Atmospheric Science",
        "B.Sc. Physical Sciences",
        "B.Sc. Chemical Sciences",
        "B.Sc. Material Science",
        "B.Sc. Nanotechnology",
        "B.Sc. Forensic Science",
        "B.Sc. Forensic Science & Criminology",
        "B.Sc. Food Science & Technology",
        "B.Sc. Dairy Technology",
        "B.Sc. Food Technology",
        "B.Sc. Food & Nutrition",
        "B.Sc. Clinical Nutrition & Dietetics",
        "B.Sc. Nutrition & Dietetics",
        "B.Sc. Agriculture",
        "B.Sc. Horticulture",
        "B.Sc. Forestry",
        "B.Sc. Fisheries",
        "B.Sc. Sericulture",
        "B.Sc. Industrial Microbiology",
        "B.Sc. Industrial Chemistry",
        "B.Sc. Computer Science",
        "B.Sc. Information Technology",
        "B.Sc. Software Engineering",
        "B.Sc. Data Science",
        "B.Sc. Artificial Intelligence",
        "B.Sc. Cyber Security",
        "B.Sc. Animation & Multimedia",
        "B.Sc. (Research) - 4 year program",
        "B.Sc. Geography",
        "B.Sc. (Hons.) Agriculture",
        "B.Sc. Horticulture",
        "B.Sc. (Hons.) Horticulture",
        "B.Sc. Forestry",
        "B.Sc. (Hons.) Forestry",
        "B.Sc. Sericulture",
        "B.Sc. Community Science (Home Science)",
        "B.Sc. (Hons.) Fisheries",
        "B.Sc. Animal Husbandry",
        "B.Sc. Dairy Science",
        "B.Sc. Poultry Science",
        "B.Sc. Architecture (3 years before professional degree)",
        "B.Sc. Information Technology",
        "B.Sc. Computer Science & IT",
        "B.Sc. Hospitality & Hotel Administration",
        "B.Sc. Hotel Management",
        "B.Sc. Culinary Arts",
        "B.Sc. Tourism & Travel Management",
        "B.Sc. Tourism & Hospitality Management",
        "B.Sc. Travel & Tourism",
        "B.Sc. Mass Communication",
        "B.Sc. Animation & Multimedia",
        "B.Sc. Fashion Design",
        "B.Sc. Fashion & Apparel Design",
        "B.Sc. Interior Design",
        "B.Sc. Textile Design",
        "B.Sc. Jewellery Design & Technology",
        "B.Sc. Fashion Technology",
        "B.Sc. Fashion & Lifestyle Management",
        "B.Sc. Fashion Communication",
        "B.Sc. Fashion Merchandising",
        "B.Sc. Costume Design & Fashion",
        "B.Sc. Apparel Production & Management",
        "B.Sc. Textile Science",
        "B.Sc. Aviation",
        "B.Sc. Aeronautical Science",
        "B.Sc. Airline & Airport Management",
        "B.Sc. Maritime Science",
        "B.Sc. Maritime Hospitality & Interior Design",
        "B.Sc. Sports Science",
        "B.Sc. Physical Education & Sports",
        "B.Sc. Exercise Science",
        "B.Sc. Fitness & Health Management",
        "B.Sc. Medical Laboratory Technology (MLT)",
        "B.Sc. Radiology & Imaging Technology",
        "B.Sc. Radiography",
        "B.Sc. Medical Imaging Technology",
        "B.Sc. Dialysis Technology",
        "B.Sc. Cardiac Care Technology",
        "B.Sc. Operation Theatre & Anesthesia Technology",
        "B.Sc. Emergency & Trauma Care Technology",
        "B.Sc. Critical Care Technology",
        "B.Sc. Perfusion Technology",
        "B.Sc. Respiratory Care Technology",
        "B.Sc. Nuclear Medicine Technology",
        "B.Sc. Radiation Therapy Technology",
        "B.Sc. Medical Technology",
        "B.Sc. Clinical Technology",
        "B.Sc. Medical Biotechnology",
        "B.Sc. Microbiology",
        "B.Sc. Medical Microbiology",
        "B.Sc. Clinical Biochemistry",
        "B.Sc. Pathology",
        "B.Sc. Blood Transfusion & Banking Technology",
        "B.Sc. Renal Dialysis Technology",
        "B.Sc. Optometry",
        "B.Sc. Audiology & Speech Language Pathology",
        "B.Sc. Speech & Hearing",
        "B.Sc. Medical Imaging & Radiology",
        "B.Sc. Echo & Cardiac Technology",
        "B.Sc. Neuroscience Technology",
        "B.Sc. Neurophysiology Technology",
        "B.Sc. Neuro Electrophysiology Technology",
        "B.Sc. Dental Hygiene",
        "B.Sc. Optometry",
        "B.Sc. Ayurveda",
        "B.Sc. Acupuncture",
        "B.Sc. (Hons.) Home Science",
        "B.Sc. Community Science",
        "B.Sc. Family & Community Science",
        "B.Sc. Home Science (Food & Nutrition)",
        "B.Sc. Home Science (Human Development & Family Studies)",
        "B.Sc. Home Science (Textile & Clothing)",
        "B.Sc. Home Science (Resource Management)",
        "B.Sc. Home Science (Extension Education & Communication)",
        "B.Sc. Child Development",
        "B.Sc. Early Childhood Care & Education (ECCE)",
        "B.Sc. Food Science & Technology",
        "B.Sc. Food Technology",
        "B.Sc. Food & Nutrition",
        "B.Sc. Nutrition & Dietetics",
        "B.Sc. Clinical Nutrition & Dietetics",
        "B.Sc. Food Production",
        "B.Sc. Food Service Management",
        "B.Sc. Food Quality Management",
        "B.Sc. Event Management",
        "B.Sc. Retail Management",
        "B.Sc. Animation & VFX",
        "B.Sc. Audio Engineering",
        "B.Sc. Animation",
        "B.Sc. Animation & Multimedia",
        "B.Sc. Animation & VFX",
        "B.Sc. Multimedia",
        "B.Sc. 3D Animation",
        "B.Sc. Game Design & Development",
        "B.Sc. Gaming Technology",
        "B.Sc. Game Programming",
        "B.Sc. Beauty & Wellness",
        "B.Sc. Cosmetology",
        "B.Sc. Trichology (Hair Sciences)",
        "B.Sc. Beauty & Spa Management",
        "B.Sc. Culinary Arts",
        "B.Sc. Food Production",
        "B.Sc. Culinary & Food Science",
        "B.Sc. Interior Design",
        "B.Sc. Interior Decoration",
        "B.Sc. Jewellery Design & Technology",
        "B.Sc. Gemology & Jewellery Design",
        "B.Sc. Textile Design",
        "B.Sc. Textile Science",
        "B.Sc. Textile Chemistry",
        "B.Sc. Apparel & Textile Design",
        "B.Sc. Fashion & Textile Technology",
        "B.Sc. Leather Technology",
        "B.Sc. Printing Technology",
        "B.Sc. Packaging Technology",
        "B.Sc. Fire & Safety",
        "B.Sc. Occupational Health & Safety",
        "B.Sc. Forensic Science",
        "B.Sc. (Hons.) Forensic Science",
        "B.Sc. Criminology & Forensic Science",
        "B.Sc. Cyber Forensics",
        "B.Sc. Digital Forensics",
        "B.Sc. Forensic Biology",
        "B.Sc. Forensic Chemistry",
        "B.Sc. Forensic Psychology",
        "B.Sc. Forensic Toxicology",
        "B.Sc. Forensic Ballistics",
        "B.Sc. Crime Scene Investigation",
        "B.Sc. Electronic Media",
        "B.Sc. Photography & Videography",
        "B.Sc. Digital Media",
        "B.Sc. Environmental Science",
        "B.Sc. Environmental Management",
        "B.Sc. Ecology & Environment",
        "B.Sc. Disaster Management",
        "B.Sc. Geography",
        "B.Sc. Geoinformatics",
        "B.Sc. GIS & Remote Sensing",
        "B.Sc. Maritime Studies",
        "B.Sc. Logistics & Supply Chain",
        "B.Sc. Data Science",
        "B.Sc. Business Intelligence",
        "B.Sc. Sustainable Development",
        "B.Sc. Public Health",
        "B.Sc. Community Health",
        "B.Sc. Healthcare Management",
        "B.Sc. Clinical Research",
        "B.Sc. Rehabilitation Technology",
        "B.Sc. Prosthetics & Orthotics",
        "B.Sc. Cardiac Technology",
        "B.Sc. Cardio Vascular Technology",
        "B.Sc. Cardiac Care Technology",
        "B.Sc. Anaesthesia Technology",
        "B.Sc. Anaesthesia & Operation Theatre Technology",
        "B.Sc. Dialysis Technology",
        "B.Sc. Renal Dialysis Technology",
        "B.Sc. Emergency Medical Technology",
        "B.Sc. Paramedic Science",
        "B.Sc. Medical Record Science",
        "B.Sc. Yoga Science",
        "B.Sc. Yoga Therapy",
        "B.Sc. Acupressure",
        "B.Sc. Audio Production",
        "B.Sc. Music Production & Engineering",
        "B.Sc. Fashion Journalism",
        "B.Sc. Animation & Game Design",
        "B.Sc. Web Development",
        "B.Sc. UI/UX Design",
        "B.Sc. Space Science"],
      "Bachelor Bachelor of Adminstration": [
        "BBA (General)",
        "BBA (Finance)",
        "BBA (Marketing)",
        "BBA (Human Resource Management)",
        "BBA (International Business)",
        "BBA (Operations Management)",
        "BBA (Business Analytics)",
        "BBA (Entrepreneurship)",
        "BBA (Banking & Insurance)",
        "BBA (Retail Management)",
        "BBA (Logistics & Supply Chain)",
        "BBA (Event Management)",
        "BBA (Aviation Management)",
        "BBA (Hospitality Management)",
        "BBA (Tourism Management)",
        "BBA (E-Business)",
        "BBA (Healthcare Management)",
        "BBA (Sports Management)",
        "BBA (Media Management)",
        "BBA (Fashion & Retail Management)",
        "BBA (Digital Marketing)",
        "BBA (Information Technology)",
        "BBA (Real Estate)",
        "BBA (Agriculture)",
        "BBA Tourism & Aviation Management",
        "BBA Aviation Operations",
        "BBA Airport Management",
        "BBA Sports Management",
        "BBA Event Management",
        "BBA Retail Management",
        "BBA Logistics & Supply Chain Management",
        "BBA Business Analytics",
        "BBA Rural Management",
        "BBA Hospital Management"],
      "Bachelor of Commerce": [
        "B.Com (Honors)",
        "B.Com (General)",
        "B.Com (Accounting & Finance)",
        "B.Com (Banking & Insurance)",
        "B.Com (Corporate Secretaryship)",
        "B.Com (Tax Management)",
        "B.Com (E-Commerce)",
        "B.Com (Computer Applications)",
        "B.Com (Financial Markets)",
        "B.Com (International Business)",
        "B.Com (Marketing)",
        "B.Com (Business Administration)",
        "B.Com (Foreign Trade)",
        "B.Com (Capital Markets)",
        "B.Com (Professional Accounting)",
        "B.Com (Travel & Tourism)",
        "B.Com (Aviation Management)",
        "B.Com LL.B. (Hons.) - 5 years integrated",
        "B.Com + LL.B. (Hons.)",
        "B.Com + B.Ed."],
      "Business Studies": [
        "Bachelor of Business Studies (BBS)",
        "Economics",
        "Bachelor of Economics (B.Econ)"],
      "bachelor of Arts": [
        "B.A. Economics",
        "B.A. Psychology",
        "B.A. Psychology (Honors)",
        "B.A. Applied Psychology",
        "B.A. Counseling Psychology",
        "B.A. Sociology",
        "B.A. Sociology (Honors)",
        "B.A. Social Work",
        "B.A. Rural Development",
        "B.A. Political Science",
        "B.A. Political Science (Honors)",
        "B.A. Public Administration",
        "B.A. History",
        "B.A. History (Honors)",
        "B.A. Ancient History",
        "B.A. Medieval History",
        "B.A. Modern History",
        "B.A. Geography",
        "B.A. Geography (Honors)",
        "B.A. Philosophy",
        "B.A. Philosophy (Honors)",
        "B.A. Anthropology",
        "B.A. Archaeology",
        "B.A. Economics",
        "B.A. Economics (Honors)",
        "B.A. English",
        "B.A. English (Honors)",
        "B.A. English Literature",
        "B.A. Hindi",
        "B.A. Sanskrit",
        "B.A. Urdu",
        "B.A. Tamil",
        "B.A. Telugu",
        "B.A. Malayalam",
        "B.A. Kannada",
        "B.A. Marathi",
        "B.A. Bengali",
        "B.A. Gujarati",
        "B.A. Punjabi",
        "B.A. Odia",
        "B.A. Assamese",
        "B.A. French",
        "B.A. German",
        "B.A. Spanish",
        "B.A. Arabic",
        "B.A. Persian",
        "B.A. Chinese",
        "B.A. Japanese",
        "B.A. Russian",
        "B.A. Comparative Literature",
        "B.A. Linguistics",
        "B.A. Translation Studies",
        "B.A. Journalism",
        "B.A. Mass Communication",
        "B.A. Journalism & Mass Communication",
        "B.A. (General)",
        "B.A. (Pass Course)",
        "B.A. Liberal Arts",
        "B.A. Religious Studies",
        "B.A. Islamic Studies",
        "B.A. Buddhist Studies",
        "B.A. Sanskrit & Vedic Studies",
        "B.A. International Relations",
        "B.A. Diplomacy & Foreign Affairs",
        "B.A. LL.B. (Hons.) - 5 years integrated",
        "B.A. (Legal Studies)",
        "Integrated B.A. B.Ed. - 4 years",
        "B.A. Tourism Management",
        "B.A. Journalism & Mass Communication",
        "B.A. Mass Communication",
        "B.A. Fashion Design",
        "B.A. Interior Design",
        "B.A. Fashion Communication",
        "B.A. Physical Education",
        "B.A. Yoga",
        "B.A. Library Science",
        "B.A. Social Work & Community Development",
        "B.A. Event Management",
        "B.A. Film Studies",
        "B.A. Film & Media Studies",
        "B.A. Music (Vocal/Instrumental)",
        "B.A. Hindustani Music",
        "B.A. Carnatic Music",
        "B.A. Dance",
        "B.A. Drama & Theatre Arts",
        "B.A. Interior Design",
        "B.Arch Interior Design",
        "B.A. + LL.B. (Hons.)",
        "B.A. + M.A. (Integrated)",
        "B.A. + B.Ed.",
        "B.A. Media Studies",
        "B.A. Visual Communication",
        "B.A. Digital Communication",
        "B.A. Geography",
        "B.A. Heritage Management",
        "B.A. Museum Studies",
        "B.A. Rural Studies",
        "B.A. Community Development",
        "B.A. Gender Studies",
        "B.A. Gender & Development",
        "B.A. Peace Studies",
        "B.A. Conflict Resolution",
        "B.A. Development Studies",
        "B.A. Yoga",
        "B.A. Fashion Media & Communication",
        "B.A. Graphic Design"
      ],
      "MEDICAL & HEALTH SCIENCES": [
        "Bachelor of Medicine & Bachelor of Surgery (MBBS)",
        "Bachelor of Medicine (BM)",
        "Bachelor of Surgery (BS)",
        "Bachelor of Dental Surgery (BDS)",
        "Bachelor of Ayurvedic Medicine & Surgery (BAMS)",
        "Bachelor of Homeopathic Medicine & Surgery (BHMS)",
        "Bachelor of Unani Medicine & Surgery (BUMS)",
        "Bachelor of Siddha Medicine & Surgery (BSMS)",
        "Bachelor of Naturopathy & Yogic Sciences (BNYS)",
        "Bachelor of Veterinary Science (B.V.Sc.)",
        "Bachelor of Veterinary Science & Animal Husbandry (B.V.Sc. & AH)",
        "Bachelor of Fine Arts (BFA)",
        "BFA Painting",
        "BFA Sculpture",
        "BFA Applied Arts",
        "BFA Graphics",
        "BFA Photography",
        "BFA Printmaking",
        "BFA Art History",
        "BFA Visual Communication",
        "BFA Animation",
        "Bachelor of Performing Arts (BPA)",
        "BPA Music (Vocal/Instrumental)",
        "BPA Dance",
        "BPA Theatre Arts",
        "BPA Acting",
        "Bachelor of Music (B.Mus)",
        "Bachelor of Dance",
        "Bachelor of Visual Arts (BVA)",
        "Bachelor of Arts (Visual Arts)"
      ],
      "LAW & LEGAL STUDIES": [
        "Bachelor of Laws (LL.B.) - 3 years",
        "Bachelor of Legislative Law (LL.B.)",
        "B.A. LL.B. (Hons.) - 5 years integrated",
        "B.Com LL.B. (Hons.) - 5 years integrated",
        "B.Sc. LL.B. (Hons.) - 5 years integrated",
        "BBA LL.B. (Hons.) - 5 years integrated",
        "B.A. (Legal Studies)",
        "Bachelor of Legal Science (B.L.S.)",
        "Bachelor of Criminal Justice",
        "Agriculture Programs & Veterinary Sciences",
        "Bachelor of Science in Agriculture (B.Sc. Agriculture)",
        "B.Sc. (Hons.) Agriculture",
        "B.Sc. Horticulture",
        "B.Sc. (Hons.) Horticulture",
        "B.Sc. Forestry",
        "B.Sc. (Hons.) Forestry",
        "B.Sc. Sericulture",
        "B.Tech. Agricultural Engineering",
        "B.Tech. Food Technology",
        "B.Tech. Dairy Technology",
        "B.Sc. Community Science (Home Science)",
        "Bachelor of Fisheries Science (B.F.Sc.)",
        "B.Sc. (Hons.) Fisheries",
        "Bachelor of Veterinary Science (B.V.Sc.)",
        "Bachelor of Veterinary Science & Animal Husbandry (B.V.Sc. & AH)",
        "B.Sc. Animal Husbandry",
        "B.Sc. Dairy Science",
        "B.Sc. Poultry Science"
      ],
      "ARCHITECTURE & PLANNING": [
        "Bachelor of Architecture (B.Arch) - 5 years",
        "B.Sc. Architecture (3 years before professional degree)",
        "Bachelor of Planning (B.Plan) - 4 years",
        "Bachelor of Urban Planning",
        "Bachelor of Regional Planning"
      ],
      "EDUCATION & TEACHER TRAINING": [
        "Bachelor of Education (B.Ed.) - 2 years",
        "Integrated B.A. B.Ed. - 4 years",
        "Integrated B.Sc. B.Ed. - 4 years",
        "B.El.Ed. (Bachelor of Elementary Education) - 4 years",
        "D.El.Ed. (Diploma in Elementary Education) - 2 years",
        "B.P.Ed. (Bachelor of Physical Education) - 3 years",
        "Bachelor of Physical Education & Sports (BPES)",
        "B.Ed. Special Education (Intellectual Disability)",
        "B.Ed. Special Education (Hearing Impairment)",
        "B.Ed. Special Education (Visual Impairment)",
        "B.Ed. Special Education (Learning Disability)",
        "Bachelor of Computer Applications (BCA)",
        "BCA (General)",
        "BCA (Cloud Computing & Cyber Security)",
        "BCA (Data Science)",
        "BCA (Artificial Intelligence)",
        "BCA (Machine Learning)",
        "BCA (Internet of Things)",
        "BCA (Blockchain Technology)",
        "BCA (Gaming)",
        "BCA (Animation & VFX)",
        "BCA (Web Designing)",
        "BCA (Mobile Application Development)"
      ],
      "HOTEL MANAGEMENT & HOSPITALITY": [
        "Bachelor of Hotel Management (BHM)",
        "Bachelor of Hotel Management & Catering Technology (BHMCT)",
        "B.Sc. Hospitality & Hotel Administration",
        "B.Sc. Hotel Management",
        "Bachelor of Hospitality Management",
        "Bachelor of Hospitality Administration",
        "BHM (Food & Beverage Service)",
        "BHM (Front Office Operations)",
        "BHM (Housekeeping)",
        "BHM (Food Production & Patisserie)",
        "BHM (Kitchen Management)",
        "Bachelor of Culinary Arts",
        "B.Sc. Culinary Arts",
        "Bachelor of Hospitality & Tourism Management"
      ],
      "TRAVEL & TOURISM": [
        "Bachelor of Tourism Administration (BTA)",
        "Bachelor of Tourism Management (BTM)",
        "Bachelor of Tourism Studies (BTS)",
        "B.Sc. Tourism & Travel Management",
        "B.Sc. Tourism & Hospitality Management",
        "B.A. Tourism Management",
        "Bachelor of Travel & Tourism Management (BTTM)",
        "Bachelor of Travel Management",
        "B.Sc. Travel & Tourism",
        "BBA Tourism & Aviation Management"
      ],
      "MASS COMMUNICATION & JOURNALISM": [
        "Bachelor of Journalism (B.J.)",
        "Bachelor of Journalism & Mass Communication (BJMC)",
        "B.A. Journalism & Mass Communication",
        "Bachelor of Mass Media (BMM)",
        "Bachelor of Mass Communication (BMC)",
        "B.A. Mass Communication",
        "B.Sc. Mass Communication",
        "BJMC (Print Journalism)",
        "BJMC (Broadcast Journalism)",
        "BJMC (Digital Journalism)",
        "BJMC (Advertising & Public Relations)",
        "Bachelor of Arts in Electronic Media",
        "Bachelor of Multimedia",
        "B.Sc. Animation & Multimedia"
      ],
      "DESIGN & CREATIVE ARTS": [
        "Bachelor of Design (B.Des)",
        "B.Des Industrial Design",
        "B.Des Product Design",
        "B.Des Communication Design",
        "B.Des Graphic Design",
        "B.Des UI/UX Design",
        "B.Des Interaction Design",
        "B.Des Exhibition Design",
        "B.Des Transportation & Automobile Design",
        "B.Des Ceramic & Glass Design",
        "B.Des Toy & Game Design",
        "Bachelor of Fashion Design (B.F.D.)",
        "B.Des Fashion Design",
        "B.Sc. Fashion Design",
        "B.A. Fashion Design",
        "Bachelor of Fashion Technology (B.F.Tech)",
        "B.Sc. Fashion & Apparel Design",
        "Bachelor of Interior Design (B.I.D.)",
        "B.Des Interior Design",
        "B.Sc. Interior Design",
        "B.A. Interior Design",
        "Bachelor of Interior Architecture",
        "Bachelor of Textile Design",
        "B.Des Textile Design",
        "B.Sc. Textile Design",
        "B.Tech Textile Technology",
        "Bachelor of Jewellery Design",
        "B.Des Jewellery Design",
        "B.Sc. Jewellery Design & Technology",
        "B.Des Accessory Design",
        "B.Des Leather Design",
        "Bachelor of Furniture Design",
        "Bachelor of Knitwear Design",
        "Bachelor of Lifestyle & Accessory Design",
        "B.Des Bamboo & Rattan Design",
        "B.Des Design for Retail Experience"
      ],
      "FASHION DESIGN & TECHNOLOGY": [
        "Bachelor of Fashion Technology (B.F.Tech)",
        "B.Sc. Fashion Technology",
        "B.Sc. Fashion & Lifestyle Management",
        "B.Sc. Fashion Communication",
        "B.Sc. Fashion Merchandising",
        "B.Sc. Costume Design & Fashion",
        "Bachelor of Fashion Management",
        "Bachelor of Fashion Styling",
        "B.A. Fashion Communication",
        "B.Sc. Apparel Production & Management",
        "B.Sc. Textile Science"
      ],
      "AVIATION & AEROSPACE": [
        "Bachelor of Business Administration (Aviation)",
        "BBA Aviation Operations",
        "BBA Airport Management",
        "B.Sc. Aviation",
        "B.Sc. Aeronautical Science",
        "B.Sc. Airline & Airport Management",
        "Bachelor of Aviation Management",
        "Bachelor of Aerospace Engineering",
        "Bachelor of Aircraft Maintenance Engineering (AME)",
        "Commercial Pilot License (CPL) Training",
        "Private Pilot License (PPL) Training",
        "Diploma in Aviation Hospitality",
        "Diploma in Cabin Crew Training",
        "Diploma in Ground Staff Training",
        "Diploma in Airport Management"
      ],
      "MARITIME STUDIES": [
        "Merchant Navy & Marine Programs",
        "Bachelor of Marine Engineering (B.E. Marine)",
        "B.Tech Marine Engineering",
        "Bachelor of Nautical Science (B.N.Sc.)",
        "Bachelor of Science in Nautical Science",
        "B.Sc. Maritime Science",
        "Bachelor of Shipping Management",
        "B.Sc. Maritime Hospitality & Interior Design",
        "Diploma in Nautical Science (DNS)",
        "Graduate Marine Engineering (GME)"
      ],
      "SPORTS SCIENCES & PHYSICAL EDUCATION": [
        "Bachelor of Physical Education (B.P.Ed.)",
        "B.P.Ed. (Sports Coaching)",
        "Bachelor of Physical Education & Sports (BPES)",
        "B.Sc. Sports Science",
        "B.Sc. Physical Education & Sports",
        "B.A. Physical Education",
        "Bachelor of Sports Management",
        "BBA Sports Management",
        "B.Sc. Exercise Science",
        "B.Sc. Fitness & Health Management",
        "Bachelor of Kinesiology",
        "Bachelor of Sports Coaching",
        "Bachelor of Yoga",
        "Bachelor of Yoga Science (B.Sc. Yoga)",
        "B.A. Yoga",
        "Bachelor of Naturopathy & Yogic Sciences (BNYS)"
      ],
      "PARAMEDICAL & ALLIED HEALTH SCIENCES": [
        "Bachelor of Medical Laboratory Technology (BMLT)",
        "B.Sc. Medical Laboratory Technology (MLT)",
        "B.Sc. Radiology & Imaging Technology",
        "B.Sc. Radiography",
        "B.Sc. Medical Imaging Technology",
        "B.Sc. Dialysis Technology",
        "B.Sc. Cardiac Care Technology",
        "B.Sc. Operation Theatre & Anesthesia Technology",
        "B.Sc. Emergency & Trauma Care Technology",
        "B.Sc. Critical Care Technology",
        "B.Sc. Perfusion Technology",
        "B.Sc. Respiratory Care Technology",
        "B.Sc. Nuclear Medicine Technology",
        "B.Sc. Radiation Therapy Technology",
        "Bachelor of Medical Radiology Technology (BMRT)",
        "Bachelor of Radiotherapy Technology (BRTT)",
        "B.Sc. Medical Technology",
        "B.Sc. Clinical Technology",
        "B.Sc. Medical Biotechnology",
        "B.Sc. Microbiology",
        "B.Sc. Medical Microbiology",
        "B.Sc. Clinical Biochemistry",
        "B.Sc. Pathology",
        "B.Sc. Blood Transfusion & Banking Technology",
        "B.Sc. Renal Dialysis Technology",
        "Bachelor of Optometry (B.Optom) - 4 years",
        "B.Sc. Optometry",
        "Bachelor of Audiology & Speech Language Pathology (BASLP)",
        "B.Sc. Audiology & Speech Language Pathology",
        "B.Sc. Speech & Hearing",
        "B.Sc. Medical Imaging & Radiology",
        "Bachelor of Medical Ultrasound Technology",
        "B.Sc. Echo & Cardiac Technology",
        "B.Sc. Neuroscience Technology",
        "B.Sc. Neurophysiology Technology",
        "B.Sc. Neuro Electrophysiology Technology",
        "Bachelor of Dental Technology",
        "B.Sc. Dental Hygiene"
      ],
      "PHARMACY": [
        "Bachelor of Pharmacy (B.Pharm) - 4 years",
        "Diploma in Pharmacy (D.Pharm) - 2 years",
        "Pharm.D (Doctor of Pharmacy) - 6 years",
        "Pharm.D (Post Baccalaureate) - 3 years after B.Pharm"
      ],
      "NURSING & MIDWIFERY": [
        "Bachelor of Science in Nursing (B.Sc. Nursing) - 4 years",
        "Post Basic B.Sc. Nursing - 2 years",
        "Bachelor of Science (Post-Basic Nursing)",
        "General Nursing & Midwifery (GNM) - Diploma 3 years",
        "Auxiliary Nurse Midwife (ANM) - Diploma 2 years"
      ],
      "PHYSIOTHERAPY": [
        "Bachelor of Physiotherapy (BPT) - 4.5 years",
        "Bachelor of Science in Physiotherapy (B.Sc. PT)"
      ],
      "OCCUPATIONAL THERAPY": [
        "Bachelor of Occupational Therapy (BOT) - 4.5 years",
        "Bachelor of Science in Occupational Therapy (B.Sc. OT)"
      ],
      "OPTOMETRY": [
        "Bachelor of Optometry (B.Optom) - 4 years",
        "B.Sc. Optometry",
        "Diploma in Optometry - 2 years"
      ],
      "ALTERNATIVE MEDICINE SYSTEMS": [
        "Bachelor of Ayurvedic Medicine & Surgery (BAMS) - 5.5 years",
        "B.Sc. Ayurveda",
        "Bachelor of Homeopathic Medicine & Surgery (BHMS) - 5.5 years",
        "Bachelor of Unani Medicine & Surgery (BUMS) - 5.5 years",
        "Bachelor of Siddha Medicine & Surgery (BSMS) - 5.5 years",
        "Bachelor of Naturopathy & Yogic Sciences (BNYS) - 5.5 years",
        "Bachelor of Acupuncture & Traditional Chinese Medicine",
        "B.Sc. Acupuncture"
      ],
      "LIBRARY & INFORMATION SCIENCE": [
        "Bachelor of Library & Information Science (B.Lib.I.Sc.)",
        "Bachelor of Library Science (B.Lib.Sc.)",
        "B.A. Library Science"
      ],
      "SOCIAL WORK": [
        "Bachelor of Social Work (BSW)",
        "Bachelor of Arts in Social Work (BASW)",
        "B.A. Social Work & Community Development"
      ],
      "HOME SCIENCE & FAMILY SCIENCES": [
        "Bachelor of Science in Home Science (B.Sc. Home Science)",
        "B.Sc. (Hons.) Home Science",
        "B.Sc. Community Science",
        "B.Sc. Family & Community Science",
        "B.Sc. Home Science (Food & Nutrition)",
        "B.Sc. Home Science (Human Development & Family Studies)",
        "B.Sc. Home Science (Textile & Clothing)",
        "B.Sc. Home Science (Resource Management)",
        "B.Sc. Home Science (Extension Education & Communication)",
        "B.Sc. Child Development",
        "B.Sc. Early Childhood Care & Education (ECCE)"
      ],
      "FOOD SCIENCE & NUTRITION": [
        "B.Sc. Food Science & Technology",
        "B.Sc. Food Technology",
        "B.Sc. Food & Nutrition",
        "B.Sc. Nutrition & Dietetics",
        "B.Sc. Clinical Nutrition & Dietetics",
        "B.Sc. Food Production",
        "B.Sc. Food Service Management",
        "B.Sc. Food Quality Management",
        "Bachelor of Food Technology (B.Tech Food Technology)"
      ],
      "EVENT MANAGEMENT": [
        "Bachelor of Event Management",
        "BBA Event Management",
        "B.Sc. Event Management",
        "B.A. Event Management",
        "Diploma in Event Management"
      ],
      "RETAIL MANAGEMENT": [
        "Bachelor of Retail Management",
        "BBA Retail Management",
        "B.Sc. Retail Management",
        "Diploma in Retail Management",
        "FILM, TELEVISION & DIGITAL PRODUCTION",
        "Bachelor of Film & Television Production",
        "B.A. Film Studies",
        "Bachelor of Cinematography",
        "Bachelor of Editing",
        "Bachelor of Direction",
        "Bachelor of Screenplay Writing",
        "Bachelor of Sound Engineering",
        "Bachelor of Visual Effects (VFX)",
        "B.Sc. Animation & VFX",
        "Bachelor of Film Making",
        "B.A. Film & Media Studies",
        "Bachelor of Television Production",
        "Bachelor of Digital Filmmaking"
      ],
      "MUSIC & PERFORMING ARTS": [
        "Bachelor of Music (B.Mus)",
        "Bachelor of Performing Arts (Music)",
        "B.A. Music (Vocal/Instrumental)",
        "B.A. Hindustani Music",
        "B.A. Carnatic Music",
        "Bachelor of Music Production",
        "Bachelor of Audio Engineering",
        "Bachelor of Sound Engineering",
        "B.Sc. Audio Engineering",
        "Bachelor of Performing Arts (Dance)",
        "B.A. Dance",
        "Diploma in Dance (Bharatanatyam, Kathak, Odissi, etc.)",
        "Bachelor of Performing Arts (Theatre)",
        "Bachelor of Theatre Arts",
        "B.A. Drama & Theatre Arts",
        "Bachelor of Acting"
      ],
      "ANIMATION & MULTIMEDIA": [
        "Bachelor of Animation",
        "B.Sc. Animation",
        "B.Sc. Animation & Multimedia",
        "B.Sc. Animation & VFX",
        "Bachelor of Visual Effects (VFX)",
        "Bachelor of Graphics & Animation",
        "Bachelor of Multimedia",
        "B.Sc. Multimedia",
        "Bachelor of Multimedia & Animation",
        "B.Sc. 3D Animation",
        "Bachelor of Digital Arts"
      ],
      "GAMING & GAME DESIGN": [
        "Bachelor of Game Design",
        "B.Sc. Game Design & Development",
        "B.Sc. Gaming Technology",
        "Bachelor of Game Development",
        "Bachelor of Game Art & Design",
        "B.Des Game Design",
        "B.Sc. Game Programming",
        "Bachelor of Mobile Gaming"
      ],
      "BEAUTY & WELLNESS": [
        "Bachelor of Beauty & Wellness",
        "B.Sc. Beauty & Wellness",
        "B.Sc. Cosmetology",
        "Bachelor of Cosmetology & Health",
        "Bachelor of Beauty Therapy",
        "B.Sc. Trichology (Hair Sciences)",
        "Diploma in Beauty Therapy & Cosmetology",
        "Diploma in Beauty Culture",
        "Diploma in Salon Management",
        "B.Sc. Beauty & Spa Management",
        "Bachelor of Makeup Artistry",
        "Diploma in Hair Styling & Design",
        "Diploma in Nail Technology",
        "Diploma in Skin Care & Aesthetics"
      ],
      "CULINARY ARTS & FOOD PRODUCTION": [
        "Bachelor of Culinary Arts",
        "B.Sc. Culinary Arts",
        "Bachelor of Culinary Management",
        "B.Sc. Food Production",
        "Bachelor of Pastry & Confectionery Arts",
        "Bachelor of Bakery Science & Technology",
        "Diploma in Culinary Arts",
        "Diploma in Bakery & Confectionery",
        "Diploma in Food Production",
        "Diploma in Food & Beverage Service",
        "Advanced Diploma in Culinary Arts",
        "Certificate in Professional Cookery",
        "B.Sc. Culinary & Food Science",
        "INTERIOR DESIGN",
        "Bachelor of Interior Design (B.I.D.)",
        "B.Des Interior Design",
        "B.Sc. Interior Design",
        "B.A. Interior Design",
        "Bachelor of Interior Architecture",
        "B.Arch Interior Design",
        "B.Des Interior & Furniture Design",
        "B.Sc. Interior Decoration",
        "Diploma in Interior Design",
        "Advanced Diploma in Interior Design"
      ],
      "JEWELLERY DESIGN": [
        "Jewellery Design Programs",
        "Bachelor of Jewellery Design",
        "B.Des Jewellery Design",
        "B.Sc. Jewellery Design & Technology",
        "B.Sc. Gemology & Jewellery Design",
        "Diploma in Jewellery Design",
        "Diploma in Gemology",
        "Bachelor of Jewellery Manufacturing",
        "Certificate in Diamond Grading",
        "Diploma in Watch Making"
      ],
      "TEXTILE DESIGN": [
        "Bachelor of Textile Design",
        "B.Des Textile Design",
        "B.Sc. Textile Design",
        "B.Tech Textile Technology",
        "B.Sc. Textile Science",
        "B.Tech Textile Engineering",
        "B.Sc. Textile Chemistry",
        "B.Sc. Apparel & Textile Design",
        "B.Tech Textile Processing",
        "Diploma in Textile Design",
        "B.Sc. Fashion & Textile Technology",
        "Bachelor of Knitwear Design"
      ],
      "LEATHER TECHNOLOGY": [
        "B.Tech Leather Technology",
        "B.Sc. Leather Technology",
        "Bachelor of Leather Goods & Accessories Design",
        "Diploma in Leather Technology",
        "B.Tech Footwear Technology",
        "B.Des Leather Design"
      ],
      "PRINTING TECHNOLOGY": [
        "B.Tech Printing Technology",
        "B.Sc. Printing Technology",
        "Diploma in Printing Technology",
        "B.Tech Graphic Arts & Printing Technology",
        "Bachelor of Print Media Technology"
      ],
      "PACKAGING TECHNOLOGY": [
        "B.Tech Packaging Technology",
        "B.Sc. Packaging Technology",
        "Diploma in Packaging Technology",
        "Bachelor of Packaging Design"
      ],
      "FIRE & SAFETY ENGINEERING": [
        "B.Tech Fire & Safety Engineering",
        "B.Sc. Fire & Safety",
        "Bachelor of Fire & Industrial Safety Engineering",
        "Diploma in Fire & Safety Engineering",
        "B.Sc. Occupational Health & Safety",
        "Bachelor of Industrial Safety Management"
      ],
      "FORENSICS": ["B.Sc. Forensic Science",
        "B.Sc. (Hons.) Forensic Science",
        "Bachelor of Forensic Science & Criminology",
        "B.Sc. Criminology & Forensic Science",
        "B.Sc. Cyber Forensics",
        "B.Sc. Digital Forensics",
        "B.Sc. Forensic Biology",
        "B.Sc. Forensic Chemistry",
        "B.Sc. Forensic Psychology",
        "B.Sc. Forensic Toxicology",
        "B.Sc. Forensic Ballistics",
        "B.Sc. Crime Scene Investigation"]
    }
  },
  "Post Graduation": {
    streams: [
      "ENGINEERING & TECHNOLOGY (M.Tech)",
      "BUSINESS & MANAGEMENT (MBA/PGDM)",
      "Economics (M.A)",
      "Master of Commerce (M.Com)",
      "M.Sc",
      "M.A",
      "LAW & LEGAL STUDIES (LL.M.)",
      "Medicine (MD/MS/DNB)",
      "Super Specialties (DM)",
      "Dentistry (MDS)",
      "Nursing (M.Sc. Nursing)",
      "Pharmacy (M.Pharm)",
      "Physiotherapy (MPT)",
      "Occupational Therapy (MOT)",
      "Allied Health Sciences (Master's)",
      "Public Health (MPH)",
      "Nutrition & Dietetics",
      "Clinical Research & Allied",
      "Hospital Administration",
      "Veterinary Sciences (MVSc/PhD)"
    ],
    branches: {
      "ENGINEERING & TECHNOLOGY (M.Tech)": [
        "Civil Engineering",
        "Structural Engineering",
        "Geotechnical Engineering",
        "Transportation Engineering",
        "Environmental Engineering",
        "Water Resources Engineering",
        "Construction Management",
        "Construction Technology",
        "Earthquake Engineering",
        "Coastal Engineering",
        "Highway Engineering",
        "Urban Engineering",
        "Bridge Engineering",
        "Tunnel Engineering",
        "Foundation Engineering",
        "Construction Economics",
        "Building Information Modeling (BIM)",
        "Infrastructure Engineering",
        "Pavement Engineering",
        "Hydraulics Engineering",
        "Surveying & Geomatics",
        "Mechanical Engineering",
        "Thermal Engineering",
        "Design Engineering",
        "Manufacturing Engineering",
        "Industrial Engineering",
        "Automobile Engineering",
        "Aerospace Engineering",
        "Robotics & Automation",
        "Mechatronics",
        "Production Engineering",
        "CAD/CAM/CAE",
        "Energy Engineering",
        "Refrigeration & Air Conditioning",
        "Tool Engineering",
        "Machine Design",
        "Fluid Mechanics",
        "Heat Transfer",
        "Internal Combustion Engines",
        "Turbomachinery",
        "Advanced Manufacturing",
        "Additive Manufacturing (3D Printing)",
        "Maintenance Engineering",
        "Renewable Energy Systems",
        "Electrical Engineering",
        "Power Systems Engineering",
        "Power Electronics & Drives",
        "Control Systems",
        "Electrical Machines",
        "High Voltage Engineering",
        "Renewable Energy Systems",
        "Electric Vehicles",
        "Smart Grid Technology",
        "Energy Management",
        "Power Quality",
        "Electrical Design",
        "Illumination Engineering",
        "Electronics & Communication Engineering",
        "VLSI Design & Technology",
        "Embedded Systems",
        "Signal Processing",
        "Digital Signal Processing",
        "Image Processing",
        "Communication Systems",
        "Microwave Engineering",
        "Optical Communication",
        "Wireless Communication",
        "Satellite Communication",
        "Telecommunication Engineering",
        "RF & Microwave Engineering",
        "Antenna Design",
        "Network Engineering",
        "Mobile Communication",
        "IoT & Sensor Networks",
        "Radar & Navigation Systems",
        "Computer Science & Engineering",
        "Software Engineering",
        "Computer Networks",
        "Network Security",
        "Information Security",
        "Data Science & Analytics",
        "Artificial Intelligence",
        "Machine Learning",
        "Deep Learning",
        "Cloud Computing",
        "Mobile Computing",
        "Web Technologies",
        "Distributed Computing",
        "Grid Computing",
        "Pervasive Computing",
        "Information Technology",
        "Information Security & Cyber Security",
        "Network Management",
        "Database Management",
        "Enterprise Systems",
        "IT Infrastructure",
        "IT Service Management",
        "Business Intelligence",
        "Data Warehousing",
        "Systems Administration",
        "DevOps Engineering",
        "Chemical Engineering",
        "Process Engineering",
        "Petrochemical Engineering",
        "Polymer Engineering",
        "Biochemical Engineering",
        "Environmental Engineering",
        "Nanotechnology",
        "Materials Engineering",
        "Food Technology",
        "Pharmaceutical Engineering",
        "Refinery Engineering",
        "Chemical Process Technology",
        "Safety Engineering",
        "Corrosion Engineering",
        "Biotechnology Engineering",
        "Genetic Engineering",
        "Bioprocess Engineering",
        "Bioinformatics",
        "Molecular Biology",
        "Tissue Engineering",
        "Biomedical Engineering",
        "Industrial Biotechnology",
        "Agricultural Biotechnology",
        "Environmental Biotechnology",
        "Pharmaceutical Biotechnology",
        "Nanobiotechnology",
        "Aerospace Engineering",
        "Aerodynamics",
        "Aircraft Structures",
        "Propulsion Engineering",
        "Avionics",
        "Space Technology",
        "Flight Mechanics",
        "Aircraft Design",
        "Spacecraft Design",
        "Rocket Propulsion",
        "Satellite Technology",
        "Petroleum Engineering",
        "Reservoir Engineering",
        "Drilling Engineering",
        "Production Engineering",
        "Petroleum Geology",
        "Enhanced Oil Recovery",
        "Petroleum Refining",
        "Mining Engineering",
        "Mine Planning & Design",
        "Mineral Processing",
        "Mine Safety",
        "Rock Mechanics",
        "Mining Geomechanics",
        "Mineral Exploration",
        "Coal Mining",
        "Surface Mining",
        "Underground Mining",
        "Textile Engineering",
        "Textile Technology",
        "Textile Chemistry",
        "Apparel Technology",
        "Fashion Technology",
        "Technical Textiles",
        "Textile Processing",
        "Fiber Science",
        "Metallurgical & Materials Engineering",
        "Physical Metallurgy",
        "Extractive Metallurgy",
        "Materials Science",
        "Corrosion Engineering",
        "Welding Technology",
        "Foundry Technology",
        "Heat Treatment",
        "Powder Metallurgy",
        "Nanomaterials",
        "Ceramics & Composites",
        "Biomaterials",
        "Marine Engineering",
        "Naval Architecture",
        "Ocean Engineering",
        "Marine Technology",
        "Ship Design",
        "Offshore Engineering",
        "Port & Harbour Engineering",
        "Marine Structures",
        "Subsea Engineering",
        "Industrial Engineering",
        "Operations Research",
        "Quality Management",
        "Supply Chain Management",
        "Logistics Management",
        "Manufacturing Systems",
        "Production Planning",
        "Ergonomics & Human Factors",
        "Systems Engineering",
        "Value Engineering",
        "Lean Manufacturing",
        "Operations Management",
        "Instrumentation & Control Engineering",
        "Process Instrumentation",
        "Control & Automation",
        "Biomedical Instrumentation",
        "Industrial Automation",
        "Instrumentation Systems",
        "Measurement & Metrology",
        "Process Control",
        "Agricultural Engineering",
        "Farm Machinery & Power",
        "Soil & Water Conservation Engineering",
        "Food Process Engineering",
        "Post Harvest Technology",
        "Irrigation & Drainage Engineering",
        "Renewable Energy in Agriculture",
        "Nuclear Engineering",
        "Nuclear Reactor Technology",
        "Nuclear Safety",
        "Radiation Technology",
        "Nuclear Fuel Cycle",
        "Plasma Physics & Fusion",
        "Plastic & Polymer Engineering",
        "Polymer Processing",
        "Polymer Technology",
        "Plastic Product Design",
        "Composite Materials",
        "Ceramic Engineering",
        "Ceramic Materials",
        "Glass Technology",
        "Refractories",
        "Advanced Ceramics",
        "Cryogenic Engineering",
        "Low Temperature Physics",
        "Cryogenic Systems",
        "Liquefaction Technology",
        "Fire & Safety Engineering",
        "Industrial Safety",
        "Fire Protection Engineering",
        "Occupational Health & Safety",
        "Process Safety Management",
        "Automation & Robotics",
        "Industrial Robotics",
        "Intelligent Systems",
        "Autonomous Systems",
        "Robot Vision",
        "Human-Robot Interaction",
        "Systems Engineering",
        "Systems Design",
        "Systems Integration",
        "Complex Systems",
        "Reliability Engineering"
      ],
      "BUSINESS & MANAGEMENT (MBA/PGDM)": [
        "MBA - General Management",
        "Executive MBA",
        "Global MBA",
        "International MBA",
        "Distance MBA",
        "Online MBA",
        "Finance & Accounting",
        "Corporate Finance",
        "Financial Management",
        "Financial Markets",
        "Investment Banking",
        "Investment Management",
        "Portfolio Management",
        "Risk Management",
        "Insurance & Risk Management",
        "Banking & Financial Services",
        "Banking Management",
        "Wealth Management",
        "Financial Analysis",
        "Financial Planning",
        "Treasury Management",
        "International Finance",
        "Mergers & Acquisitions",
        "Private Equity & Venture Capital",
        "Commodity Markets",
        "Derivatives & Risk Management",
        "Financial Engineering",
        "FinTech & Financial Technology",
        "Islamic Finance",
        "Marketing Management",
        "Sales & Marketing",
        "Brand Management",
        "Digital Marketing",
        "Social Media Marketing",
        "Content Marketing",
        "Marketing Analytics",
        "Consumer Behavior",
        "Retail Marketing",
        "Services Marketing",
        "Industrial Marketing",
        "International Marketing",
        "Product Management",
        "Advertising & Brand Management",
        "Marketing Communications",
        "Market Research",
        "E-Commerce & Digital Business",
        "Marketing Strategy",
        "Rural Marketing",
        "Human Resource Management",
        "Human Resource Development",
        "Talent Management",
        "Organizational Development",
        "Organizational Behavior",
        "Industrial Relations & Labour Welfare",
        "Training & Development",
        "Performance Management",
        "Compensation & Benefits",
        "HR Analytics",
        "Strategic HRM",
        "International HRM",
        "Operations Management",
        "Production & Operations Management",
        "Supply Chain Management",
        "Logistics & Supply Chain Management",
        "Materials Management",
        "Procurement & Supply Management",
        "Operations Research",
        "Quality Management",
        "Total Quality Management",
        "Project Management",
        "Manufacturing Management",
        "Service Operations Management",
        "Information Technology Management",
        "Information Systems Management",
        "Business Analytics",
        "Data Analytics & Business Intelligence",
        "Enterprise Resource Planning (ERP)",
        "Systems Management",
        "IT Strategy & Management",
        "E-Business",
        "Digital Business",
        "Technology Management",
        "Cyber Security Management",
        "International Business Management",
        "Global Business",
        "Export Import Management",
        "International Trade",
        "Cross-Cultural Management",
        "International Marketing",
        "Healthcare Management",
        "Hospital Administration",
        "Hospital & Health Systems Management",
        "Medical & Health Services Management",
        "Pharmaceutical Management",
        "Healthcare Quality Management",
        "Clinical Research Management",
        "Agribusiness Management",
        "Rural Management",
        "Real Estate Management",
        "Infrastructure Management",
        "Construction Management",
        "Energy & Environment Management",
        "Oil & Gas Management",
        "Mining Management",
        "Telecom Management",
        "Media Management",
        "Entertainment Management",
        "Sports Management",
        "Event Management",
        "Travel & Tourism Management",
        "Hospitality Management",
        "Aviation Management",
        "Shipping & Logistics Management",
        "Port Management",
        "Fashion Management",
        "Luxury Brand Management",
        "Retail Management",
        "E-Commerce Management",
        "Family Business Management",
        "Non-Profit Management",
        "NGO Management",
        "Public Administration",
        "Government Management",
        "Entrepreneurship",
        "Innovation & Entrepreneurship",
        "Start-up Management",
        "Small Business Management",
        "Venture Management",
        "Social Entrepreneurship",
        "Strategic Management",
        "Business Strategy",
        "Corporate Strategy",
        "Leadership & Change Management",
        "Executive Leadership",
        "General Management",
        "Business Economics",
        "Business Law",
        "Corporate Governance",
        "Corporate Social Responsibility (CSR)",
        "Sustainability Management",
        "Environmental Management",
        "Risk & Insurance Management",
        "Actuarial Science",
        "Behavioral Science & Management",
        "Design Thinking & Innovation",
        "Business Communication",
        "Negotiation & Conflict Management"
      ],
      "Economics (M.A)": [
        "Applied Economics",
        "Econometrics",
        "Development Economics",
        "International Economics",
        "Financial Economics",
        "Industrial Economics",
        "Agricultural Economics",
        "Environmental Economics",
        "Health Economics",
        "Labour Economics",
        "Public Economics",
        "Monetary Economics",
        "Economic Policy",
        "Quantitative Economics",
        "Business Economics",
        "Mathematical Economics",
        "Computational Economics"
      ],
      "Master of Commerce (M.Com)": [
        "Forensic Accounting & Fraud Detection",
        "Taxation & Tax Management",
        "Corporate Accounting",
        "International Accounting",
        "Management Accounting",
        "Accounting",
        "Finance",
        "Taxation",
        "Banking"
      ],
      "M.Sc": [
        "Condensed Matter Physics",
        "Nuclear Physics",
        "High Energy Physics",
        "Particle Physics",
        "Astrophysics & Cosmology",
        "Astronomy",
        "Plasma Physics",
        "Quantum Physics",
        "Quantum Mechanics",
        "Quantum Computing",
        "Optical Physics",
        "Photonics",
        "Solid State Physics",
        "Atomic & Molecular Physics",
        "Theoretical Physics",
        "Applied Physics",
        "Medical Physics",
        "Radiation Physics",
        "Biophysics",
        "Geophysics",
        "Atmospheric Physics",
        "Space Physics",
        "Computational Physics",
        "Electronics",
        "Instrumentation",
        "Material Science (Physics)",
        "Nanoscience & Nanotechnology",
        "Laser Physics & Photonics",
        "Organic Chemistry",
        "Inorganic Chemistry",
        "Physical Chemistry",
        "Analytical Chemistry",
        "Biochemistry",
        "Medicinal Chemistry",
        "Pharmaceutical Chemistry",
        "Polymer Chemistry",
        "Environmental Chemistry",
        "Industrial Chemistry",
        "Green Chemistry",
        "Computational Chemistry",
        "Theoretical Chemistry",
        "Electrochemistry",
        "Photochemistry",
        "Solid State Chemistry",
        "Quantum Chemistry",
        "Catalysis",
        "Spectroscopy",
        "Chromatography",
        "Molecular Chemistry",
        "Supramolecular Chemistry",
        "Materials Chemistry",
        "Food Chemistry",
        "Agricultural Chemistry",
        "Petrochemical Chemistry",
        "Nuclear Chemistry",
        "Radiochemistry",
        "Forensic Chemistry",
        "Clinical Chemistry",
        "Pure Mathematics",
        "Applied Mathematics",
        "Computational Mathematics",
        "Mathematical Statistics",
        "Operations Research",
        "Actuarial Science & Mathematics",
        "Mathematical Modeling",
        "Numerical Analysis",
        "Cryptography & Network Security",
        "Number Theory",
        "Algebra",
        "Abstract Algebra",
        "Linear Algebra",
        "Geometry",
        "Differential Geometry",
        "Topology",
        "Real Analysis",
        "Complex Analysis",
        "Functional Analysis",
        "Discrete Mathematics",
        "Graph Theory",
        "Combinatorics",
        "Optimization Theory",
        "Game Theory",
        "Fuzzy Mathematics",
        "Computational Mathematics",
        "Financial Mathematics",
        "Mathematical Physics",
        "Mathematical Biology",
        "Mathematical Statistics",
        "Applied Statistics",
        "Statistical Inference",
        "Probability & Statistics",
        "Biostatistics",
        "Business Statistics",
        "Econometrics",
        "Statistical Computing",
        "Data Science & Statistics",
        "Operational Statistics",
        "Quality & Reliability",
        "Demography & Vital Statistics",
        "Sampling Theory",
        "Statistical Quality Control",
        "Molecular Biology",
        "Cell Biology & Cytology",
        "Genetics",
        "Human Genetics",
        "Medical Genetics",
        "Microbiology",
        "Medical Microbiology",
        "Industrial Microbiology",
        "Environmental Microbiology",
        "Immunology",
        "Virology",
        "Biotechnology",
        "Biophysics",
        "Bioinformatics",
        "Computational Biology",
        "Systems Biology",
        "Structural Biology",
        "Neurobiology",
        "Neuroscience",
        "Developmental Biology",
        "Evolutionary Biology",
        "Marine Biology",
        "Ecology",
        "Environmental Biology",
        "Conservation Biology",
        "Wildlife Biology",
        "Zoology",
        "Entomology",
        "Parasitology",
        "Animal Physiology",
        "Animal Behavior (Ethology)",
        "Ornithology",
        "Ichthyology",
        "Herpetology",
        "Mammalogy",
        "Botany",
        "Plant Sciences",
        "Plant Physiology",
        "Plant Pathology",
        "Plant Biotechnology",
        "Plant Breeding & Genetics",
        "Plant Taxonomy",
        "Plant Ecology",
        "Mycology",
        "Phycology (Algae)",
        "Bryology",
        "Biochemistry",
        "Molecular Biochemistry",
        "Clinical Biochemistry",
        "Physiology",
        "Human Physiology",
        "Animal Physiology",
        "Plant Physiology",
        "Pharmacology",
        "Toxicology",
        "Endocrinology",
        "Histology",
        "Embryology",
        "Anatomy",
        "Nutrition Science",
        "Food Science & Technology",
        "Food Biotechnology",
        "Food Microbiology",
        "Food Processing",
        "Dairy Technology",
        "Fermentation Technology",
        "Biosciences",
        "Biological Chemistry",
        "Biological Physics",
        "Biosystematics",
        "Chronobiology",
        "Cryobiology",
        "Limnology",
        "Biogeography",
        "Cognitive Science",
        "Environmental Science",
        "Forensic Science",
        "Forensic Biology",
        "Forensic Chemistry",
        "Materials Science",
        "Nanoscience",
        "Agronomy",
        "Crop Production",
        "Crop Physiology",
        "Horticulture",
        "Vegetable Science",
        "Fruit Science",
        "Floriculture & Landscaping",
        "Plantation Crops",
        "Medicinal & Aromatic Plants",
        "Spices & Plantation Crops",
        "Plant Pathology",
        "Plant Virology",
        "Plant Nematology",
        "Agricultural Entomology",
        "Applied Entomology",
        "Soil Science",
        "Soil Chemistry & Fertility",
        "Soil Physics",
        "Soil Microbiology",
        "Agricultural Economics",
        "Agricultural Extension & Communication",
        "Agricultural Extension Education",
        "Plant Breeding & Genetics",
        "Seed Science & Technology",
        "Agricultural Biotechnology",
        "Molecular Biology & Biotechnology",
        "Agricultural Microbiology",
        "Food Science & Technology",
        "Food Technology",
        "Food Engineering",
        "Food Microbiology",
        "Food Processing & Technology",
        "Dairy Technology",
        "Dairy Engineering",
        "Dairy Microbiology",
        "Dairy Chemistry",
        "Agricultural Engineering",
        "Farm Machinery & Power Engineering",
        "Soil & Water Conservation Engineering",
        "Post Harvest Technology & Engineering",
        "Irrigation & Drainage Engineering",
        "Agricultural Process Engineering",
        "Agricultural Statistics",
        "Bioinformatics",
        "Sericulture",
        "Apiculture (Beekeeping)",
        "Forestry",
        "Agroforestry",
        "Forest Management",
        "Forest Economics",
        "Wildlife Sciences",
        "Wildlife Management",
        "Range Management",
        "Silviculture",
        "Wood Science & Technology",
        "Forest Products & Utilization",
        "Fisheries Science",
        "Aquaculture"
      ],
      "M.A": [
        "Clinical Psychology",
        "Counseling Psychology",
        "Organizational Psychology",
        "Industrial & Organizational Psychology",
        "Educational Psychology",
        "School Psychology",
        "Social Psychology",
        "Developmental Psychology",
        "Child Psychology",
        "Adolescent Psychology",
        "Adult Development & Aging",
        "Cognitive Psychology",
        "Behavioral Psychology",
        "Forensic Psychology",
        "Criminal Psychology",
        "Health Psychology",
        "Sports Psychology",
        "Neuropsychology",
        "Psychotherapy",
        "Psychoanalysis",
        "Applied Psychology",
        "Community Psychology",
        "Environmental Psychology",
        "Consumer Psychology",
        "Positive Psychology",
        "Cross-Cultural Psychology",
        "Military Psychology",
        "Rehabilitation Psychology",
        "Geropsychology",
        "Clinical Neuropsychology",
        "General Sociology",
        "Rural Sociology",
        "Urban Sociology",
        "Industrial Sociology",
        "Medical Sociology",
        "Sociology of Education",
        "Sociology of Religion",
        "Sociology of Law",
        "Economic Sociology",
        "Political Sociology",
        "Sociology of Development",
        "Criminology & Criminal Justice",
        "Penology",
        "Victimology",
        "Demography & Population Studies",
        "Social Anthropology",
        "Gender Studies & Women's Studies",
        "Family Studies",
        "Youth Studies",
        "Diaspora Studies",
        "Migration Studies",
        "Social Stratification",
        "Social Work & Social Welfare",
        "Community Development",
        "Visual Sociology",
        "Clinical Social Work",
        "Medical & Psychiatric Social Work",
        "Community Organization & Development",
        "Social Work in Criminal Justice",
        "Child & Family Welfare",
        "Women & Child Development",
        "Youth & Adolescent Welfare",
        "School Social Work",
        "Social Work Administration",
        "Rural & Urban Community Development",
        "Human Resource Management & Development",
        "Social Entrepreneurship",
        "Disability Studies & Action",
        "Gerontological Social Work",
        "Disaster Management",
        "International Relations",
        "International Politics",
        "Public Administration",
        "Public Policy & Governance",
        "Political Theory",
        "Political Philosophy",
        "Comparative Politics",
        "Indian Politics",
        "Foreign Policy & Diplomacy",
        "Strategic Studies & Security Studies",
        "Defense & Strategic Studies",
        "Peace & Conflict Studies",
        "Area Studies (South Asian, European, American, African, etc.)",
        "Political Economy",
        "Political Sociology",
        "Electoral Studies",
        "Human Rights",
        "Constitutional Law & Politics",
        "Social Anthropology",
        "Cultural Anthropology",
        "Physical Anthropology",
        "Biological Anthropology",
        "Archaeological Anthropology",
        "Archaeology",
        "Prehistory & Protohistory",
        "Linguistic Anthropology",
        "Medical Anthropology",
        "Applied Anthropology",
        "Visual Anthropology",
        "Urban Anthropology",
        "Ecological Anthropology",
        "Development Anthropology",
        "Forensic Anthropology",
        "Tribal Studies",
        "Physical Geography",
        "Geomorphology",
        "Climatology",
        "Hydrology",
        "Biogeography",
        "Human Geography",
        "Economic Geography",
        "Urban Geography",
        "Rural Geography",
        "Agricultural Geography",
        "Industrial Geography",
        "Population Geography",
        "Settlement Geography",
        "Political Geography",
        "Social Geography",
        "Cultural Geography",
        "Historical Geography",
        "Environmental Geography",
        "Resource Geography",
        "Tourism Geography",
        "Regional Geography",
        "Cartography",
        "Remote Sensing & GIS",
        "Geo-informatics",
        "Spatial Planning",
        "Disaster Management & Geography",
        "Ancient History",
        "Medieval History",
        "Modern History",
        "Contemporary History",
        "Indian History",
        "World History",
        "European History",
        "Asian History",
        "American History",
        "African History",
        "Art History",
        "Economic History",
        "Social History",
        "Cultural History",
        "Intellectual History",
        "Political History",
        "Military History",
        "Women's History",
        "Environmental History",
        "Urban History",
        "Public History",
        "Oral History",
        "Historiography",
        "Archaeology & Museology",
        "Metaphysics",
        "Epistemology",
        "Ethics",
        "Moral Philosophy",
        "Logic",
        "Philosophy of Science",
        "Philosophy of Mind",
        "Philosophy of Language",
        "Political Philosophy",
        "Social Philosophy",
        "Philosophy of Religion",
        "Indian Philosophy",
        "Western Philosophy",
        "Buddhist Philosophy",
        "Comparative Philosophy",
        "Applied Philosophy",
        "Aesthetics",
        "Phenomenology",
        "Existentialism",
        "General Linguistics",
        "Applied Linguistics",
        "Theoretical Linguistics",
        "Descriptive Linguistics",
        "Historical Linguistics",
        "Comparative Linguistics",
        "Sociolinguistics",
        "Psycholinguistics",
        "Neurolinguistics",
        "Computational Linguistics",
        "Corpus Linguistics",
        "Phonetics & Phonology",
        "Morphology",
        "Syntax",
        "Semantics",
        "Pragmatics",
        "Discourse Analysis",
        "Translation Studies",
        "Lexicography",
        "Language Documentation",
        "Language Teaching (TESOL/TEFL)",
        "Cultural Studies",
        "Film Studies",
        "Media & Cultural Studies",
        "Popular Culture Studies",
        "Visual Culture Studies",
        "Heritage Studies",
        "Museum Studies",
        "Folklore & Folk Culture",
        "Comparative Religion",
        "Religious Studies",
        "Islamic Studies",
        "Buddhist Studies",
        "Jainism & Jain Studies",
        "Christian Theology",
        "Hindu Studies",
        "Sikh Studies",
        "Theatre Arts",
        "Drama & Theatre Studies",
        "Acting",
        "Direction",
        "Stage Craft",
        "Theatre Production",
        "Applied Theatre",
        "Theatre Education",
        "Puppetry",
        "Bharatanatyam",
        "Kathak",
        "Kathakali",
        "Kuchipudi",
        "Odissi",
        "Manipuri",
        "Mohiniyattam",
        "Sattriya",
        "Folk Dance",
        "Contemporary Dance",
        "Choreography",
        "Dance Therapy",
        "Dance Education",
        "Vocal Music (Hindustani)",
        "Vocal Music (Carnatic)",
        "Instrumental Music (Hindustani)",
        "Instrumental Music (Carnatic)",
        "Western Music",
        "Music Composition",
        "Musicology",
        "Ethnomusicology",
        "Music Therapy",
        "Music Education",
        "Music Production",
        "Music Technology",
        "Light Music",
        "Devotional Music",
        "Painting",
        "Drawing & Painting",
        "Sculpture",
        "Applied Arts",
        "Printmaking",
        "Murals",
        "Art History",
        "Art Criticism",
        "Art Conservation & Restoration",
        "Visual Arts",
        "Contemporary Art Practice",
        "Traditional Art Forms",
        "TESOL (Teaching English to Speakers of Other Languages)",
        "TEFL (Teaching English as Foreign Language)",
        "English Language Teaching (ELT)",
        "Applied Linguistics for Language Teaching",
        "Second Language Acquisition",
        "Bilingual Education",
        "Foreign Language Teaching Methodology",
        "Hindi Literature",
        "Urdu Literature",
        "Bengali Literature",
        "Tamil Literature",
        "Telugu Literature",
        "Marathi Literature",
        "Gujarati Literature",
        "Kannada Literature",
        "Malayalam Literature",
        "Punjabi Literature",
        "Odia Literature",
        "Assamese Literature",
        "Sindhi Literature",
        "Kashmiri Literature",
        "Manipuri Literature",
        "Konkani Literature",
        "Nepali Literature",
        "Bodo Literature",
        "Dogri Literature",
        "Maithili Literature",
        "Santhali Literature",
        "Sanskrit Language & Literature",
        "Vedic Studies",
        "Latin Language & Literature",
        "Greek Language & Literature",
        "Persian Language & Literature",
        "French Language & Literature",
        "German Language & Literature",
        "Spanish Language & Literature",
        "Italian Language & Literature",
        "Russian Language & Literature",
        "Portuguese Language & Literature",
        "Japanese Language & Literature",
        "Chinese Language & Literature",
        "Korean Language & Literature",
        "Arabic Language & Literature",
        "English Literature",
        "American Literature",
        "British Literature",
        "Commonwealth Literature",
        "Comparative Literature",
        "World Literature",
        "Classical Literature",
        "Modern Literature",
        "Postcolonial Literature",
        "Literary Theory & Criticism",
        "Creative Writing",
        "Fiction Writing",
        "Poetry Writing",
        "Screenwriting",
        "Playwriting",
        "Translation Studies",
        "Literary Translation",
        "Interpretation Studies"
      ],
      "LAW & LEGAL STUDIES (LL.M.)": [
        "Constitutional Law",
        "Administrative Law",
        "Criminal Law",
        "Civil Law",
        "Corporate Law",
        "Company Law",
        "Commercial Law",
        "Business Law",
        "Banking & Finance Law",
        "Securities Law",
        "Capital Markets Law",
        "International Law",
        "International Trade Law",
        "International Commercial Law",
        "International Humanitarian Law",
        "Intellectual Property Law",
        "Patent Law",
        "Copyright Law",
        "Trademark Law",
        "Cyber Law & Information Technology Law",
        "Data Protection & Privacy Law",
        "Environmental Law",
        "Energy Law",
        "Tax Law",
        "Direct Tax Law",
        "Indirect Tax & GST Law",
        "Labour & Industrial Law",
        "Employment Law",
        "Human Rights Law",
        "International Human Rights Law",
        "Family Law",
        "Consumer Protection Law",
        "Competition Law & Antitrust Law",
        "Real Estate Law",
        "Property Law",
        "Maritime Law & Admiralty Law",
        "Aviation Law",
        "Space Law",
        "Alternative Dispute Resolution (ADR)",
        "Arbitration & Conciliation",
        "Mediation",
        "Criminal Justice & Criminology",
        "Penology",
        "Forensic Science & Law",
        "Medical Law & Ethics",
        "Health Law",
        "Pharmaceutical & Drug Law",
        "Media & Entertainment Law",
        "Sports Law",
        "Insurance Law",
        "Constitutional & Administrative Governance",
        "Public International Law",
        "Private International Law",
        "Conflict of Laws",
        "Comparative Law",
        "Jurisprudence & Legal Theory",
        "Law & Economics",
        "Law & Technology",
        "Law & Social Transformation",
        "Environmental & Natural Resources Law",
        "Climate Change Law",
        "Women & Law",
        "Child Rights Law",
        "Corporate Legal Practice",
        "Legal Management",
        "Legal Process Outsourcing",
        "Paralegal Studies",
        "Court Management",
        "Legal Documentation"
      ],
      "Medicine (MD/MS/DNB)": [
        "Anatomy",
        "Physiology",
        "Biochemistry",
        "Pharmacology",
        "Pathology",
        "Microbiology",
        "Forensic Medicine & Toxicology",
        "Community Medicine / Preventive & Social Medicine",
        "General Medicine",
        "General Surgery",
        "Pediatrics",
        "Obstetrics & Gynecology",
        "Orthopedics",
        "Ophthalmology",
        "ENT (Otorhinolaryngology)",
        "Dermatology, Venereology & Leprosy",
        "Psychiatry",
        "Anesthesiology",
        "Radiology (Radio-Diagnosis)",
        "Radiation Oncology",
        "Emergency Medicine",
        "Physical Medicine & Rehabilitation",
        "Respiratory Medicine / Pulmonology",
        "Geriatric Medicine",
        "Palliative Medicine",
        "Transfusion Medicine",
        "Immunohematology & Blood Transfusion",
        "Nuclear Medicine",
        "Sports Medicine",
        "Aerospace Medicine",
        "Marine Medicine",
        "Tropical Medicine"
      ],
      "Super Specialties (DM)": [
        "Medical Cardiology",
        "Neurology",
        "Nephrology",
        "Gastroenterology",
        "Medical Oncology",
        "Endocrinology",
        "Rheumatology",
        "Pulmonology & Critical Care",
        "Clinical Immunology & Allergy",
        "Infectious Diseases",
        "Clinical Hematology",
        "Medical Genetics",
        "Neonatology",
        "Pediatric Cardiology",
        "Pediatric Gastroenterology",
        "Pediatric Nephrology",
        "Pediatric Neurology",
        "Pediatric Hematology & Oncology",
        "Hepatology",
        "Clinical Pharmacology",
        "Interventional Cardiology",
        "Electrophysiology",
        "Cardiothoracic & Vascular Surgery (CTVS)",
        "Neurosurgery",
        "Plastic & Reconstructive Surgery",
        "Pediatric Surgery",
        "Surgical Oncology",
        "Urology",
        "Surgical Gastroenterology",
        "Head & Neck Surgery",
        "Traumatology",
        "Hand Surgery",
        "Burns & Plastic Surgery",
        "Reproductive Medicine & Surgery",
        "Pediatric Orthopedics",
        "Spine Surgery",
        "Joint Replacement & Arthroscopy",
        "Minimal Access Surgery",
        "Hepato-Pancreato-Biliary Surgery"
      ],
      "Dentistry (MDS)": [
        "Orthodontics & Dentofacial Orthopedics",
        "Prosthodontics & Crown & Bridge",
        "Conservative Dentistry & Endodontics",
        "Oral & Maxillofacial Surgery",
        "Periodontics",
        "Pediatric & Preventive Dentistry",
        "Oral Medicine & Radiology",
        "Oral Pathology & Microbiology",
        "Public Health Dentistry",
        "Dental Materials",
        "Implantology",
        "Aesthetic Dentistry"
      ],
      "Nursing (M.Sc. Nursing)": [
        "Medical-Surgical Nursing",
        "Pediatric Nursing",
        "Psychiatric / Mental Health Nursing",
        "Obstetric & Gynecological Nursing",
        "Community Health Nursing",
        "Nursing Administration",
        "Nursing Education",
        "Critical Care Nursing",
        "Oncology Nursing",
        "Cardiovascular & Thoracic Nursing",
        "Nephrology Nursing",
        "Neuroscience Nursing",
        "Orthopedic Nursing",
        "Emergency & Disaster Nursing",
        "Geriatric Nursing",
        "Midwifery"
      ],
      "Pharmacy (M.Pharm)": [
        "Pharmaceutics",
        "Pharmaceutical Chemistry",
        "Pharmacology",
        "Pharmacognosy",
        "Pharmaceutical Analysis",
        "Quality Assurance",
        "Regulatory Affairs",
        "Clinical Pharmacy",
        "Hospital Pharmacy",
        "Pharmacy Practice",
        "Industrial Pharmacy",
        "Pharmaceutical Biotechnology",
        "Pharmaceutical Management",
        "Pharmaceutical Marketing",
        "Pharmacovigilance",
        "Phytopharmacy & Phytochemistry",
        "Drug Regulatory Affairs",
        "Pharmaceutical Quality Assurance",
        "Medicinal Chemistry",
        "Pharmacoinformatics"
      ],
      "Physiotherapy (MPT)": [
        "Orthopedic Physiotherapy",
        "Neurological Physiotherapy",
        "Cardiorespiratory Physiotherapy",
        "Sports Physiotherapy",
        "Pediatric Physiotherapy",
        "Community Based Rehabilitation",
        "Geriatric Physiotherapy",
        "Women's Health Physiotherapy",
        "Musculoskeletal Physiotherapy",
        "Electrotherapy & Electrodiagnosis",
        "Exercise Therapy"
      ],
      "Occupational Therapy (MOT)": [
        "Physical Dysfunction",
        "Psychosocial Dysfunction",
        "Pediatric Occupational Therapy",
        "Community Based Rehabilitation"
      ],
      "Allied Health Sciences (Master's)": [
        "Medical Laboratory Technology",
        "Medical Radiology & Imaging Technology",
        "Medical Microbiology",
        "Clinical Biochemistry",
        "Medical Biotechnology",
        "Transfusion Medicine & Technology",
        "Respiratory Care Technology",
        "Dialysis Technology",
        "Cardiac Care Technology",
        "Operation Theatre & Anesthesia Technology",
        "Emergency & Trauma Care Technology",
        "Critical Care Technology",
        "Nuclear Medicine Technology",
        "Radiation Therapy Technology",
        "Optometry",
        "Audiology & Speech-Language Pathology",
        "Prosthetics & Orthotics",
        "Rehabilitation Sciences"
      ],
      "Public Health (MPH)": [
        "Master of Public Health (MPH)",
        "Epidemiology",
        "Biostatistics",
        "Health Policy & Management",
        "Environmental Health Sciences",
        "Global Health",
        "Maternal & Child Health",
        "Occupational Health",
        "Health Education & Promotion",
        "Health Economics",
        "Hospital & Health Management",
        "Health Informatics",
        "Community Health",
        "International Health"
      ],
      "Nutrition & Dietetics": [
        "Clinical Nutrition",
        "Community Nutrition",
        "Food Science & Nutrition",
        "Sports Nutrition",
        "Pediatric Nutrition",
        "Therapeutic Nutrition"
      ],
      "Clinical Research & Allied": [
        "Clinical Research & Pharmacovigilance",
        "Clinical Trials Management",
        "Clinical Data Management",
        "Medical Writing",
        "Biostatistics"
      ],
      "Hospital Administration": [
        "Hospital Management",
        "Healthcare Management",
        "Health Services Management",
        "Medical Records Management"
      ],
      "Veterinary Sciences (MVSc/PhD)": [
        "Veterinary Medicine",
        "Veterinary Surgery & Radiology",
        "Veterinary Pathology",
        "Veterinary Microbiology",
        "Veterinary Parasitology",
        "Veterinary Pharmacology & Toxicology",
        "Veterinary Physiology",
        "Veterinary Biochemistry",
        "Veterinary Anatomy",
        "Veterinary Public Health & Epidemiology",
        "Veterinary Gynecology & Obstetrics",
        "Veterinary Clinical Medicine, Ethics & Jurisprudence",
        "Animal Nutrition",
        "Animal Genetics & Breeding",
        "Veterinary & Animal Husbandry Extension",
        "Livestock Production & Management",
        "Poultry Science",
        "Dairy Science",
        "Aquatic Animal Health Management",
        "Wildlife Health Management",
        "Laboratory Animal Medicine",
        "Veterinary Biotechnology"
      ]
    }
  }
};

interface UnderPostGraduateFormProps {
  currentCourse: Course;
  handleCourseChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => void;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>, type: "image" | "brochure" | "collegeImage") => void;
  setCourses: React.Dispatch<React.SetStateAction<Course[]>>;
  courses: Course[];
  selectedCourseId: number;
  setSelectedCourseId: (id: number) => void;
  courseErrors: Record<string, string>;
  addNewCourse: () => void;
  deleteCourse: (id: number) => void;
  labelVariant?: 'course' | 'program';
  uniqueRemoteBranches: Array<{ _id: string; branchName: string; branchAddress?: string; state?: string; district?: string; town?: string; locationUrl?: string }>;
  selectedBranchId: string;
  isSubscriptionProgram?: boolean;
}


export default function UnderPostGraduateForm({
  currentCourse,
  handleCourseChange,
  handleFileChange,
  setCourses,
  courses,
  selectedCourseId,
  setSelectedCourseId,
  addNewCourse,
  deleteCourse,
  courseErrors,
  labelVariant = 'course',
  uniqueRemoteBranches,
  selectedBranchId,
  isSubscriptionProgram = true,
}: UnderPostGraduateFormProps) {

  if (!currentCourse) return null;
  const isProgram = labelVariant === 'program';

  // Get available streams based on selected graduation type (pure in-memory)
  const availableStreams = useMemo(() => {
    if (!currentCourse.graduationType) return [];
    const grad = currentCourse.graduationType as keyof typeof GRADUATION_STREAM_MAPPING;
    return GRADUATION_STREAM_MAPPING[grad]?.streams || [];
  }, [currentCourse.graduationType]);

  // Get available branches based on selected graduation type and stream type
  const availableBranches = useMemo(() => {
    if (!currentCourse.graduationType || !currentCourse.streamType) return [];
    const grad = currentCourse.graduationType as keyof typeof GRADUATION_STREAM_MAPPING;
    const gradData = GRADUATION_STREAM_MAPPING[grad];
    return gradData?.branches[currentCourse.streamType as keyof typeof gradData.branches] || [];
  }, [currentCourse.graduationType, currentCourse.streamType]);

  // Handle graduation type change and reset dependent fields
  const handleGraduationTypeChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const newGraduationType = e.target.value;

    // Update the course with new graduation type and reset dependent fields
    setCourses(courses.map(course =>
      course.id === selectedCourseId
        ? {
          ...course,
          graduationType: newGraduationType,
          streamType: '', // Reset stream when graduation type changes
          selectBranch: '' // Reset branch when graduation type changes
        }
        : course
    ));
  };

  // Handle stream type change and reset branch
  const handleStreamTypeChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const newStreamType = e.target.value;

    // Update the course with new stream type and reset branch
    setCourses(courses.map(course =>
      course.id === selectedCourseId
        ? {
          ...course,
          streamType: newStreamType,
          selectBranch: '' // Reset branch when stream type changes
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
        {/* Row 1 */}
        <InputField
          label="Graduation type"
          name="graduationType"
          value={currentCourse.graduationType}
          onChange={handleGraduationTypeChange}
          isSelect
          options={["Under Graduation", "Post Graduation"]}
          placeholder="Select graduation type"
          required
          error={courseErrors.graduationType}
        />

        <SearchableSelect
          label="Stream type"
          name="streamType"
          value={currentCourse.streamType}
          onChange={handleStreamTypeChange}
          options={availableStreams}
          placeholder="Select Stream type"
          required
          disabled={!currentCourse.graduationType}
          error={courseErrors.streamType}
        />

        {/* Row 2 */}
        <SearchableSelect
          label="Select branch"
          name="selectBranch"
          value={currentCourse.selectBranch}
          onChange={handleCourseChange}
          options={availableBranches}
          placeholder="Select branch type"
          required
          disabled={!currentCourse.streamType}
          error={courseErrors.selectBranch}
        />

        <InputField
          label="About branch"
          name="branchDescription"
          value={currentCourse.branchDescription || ""}
          onChange={handleCourseChange}
          placeholder="Enter the course info"
          required
          error={courseErrors.branchDescription}
        />

      </div>

      {/* LOCATION BOX SECTION [cite: 14-25] */}
      <div className="bg-[#DCDCFF] p-6 rounded-[6px] space-y-6 border border-blue-100 shadow-[0px_4px_20px_rgba(0,0,0,0.1)]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-4">
          <div className="flex flex-col gap-4">
            <span className="font-[Montserrat] font-medium text-[16px] md:text-[18px] text-black dark:text-slate-200">
              This is same as Campus Address
            </span>
            <div className="flex gap-8">
              {["Yes", "No"].map((opt) => (
                <label key={opt} className="flex items-center gap-2 cursor-pointer text-sm font-medium dark:text-slate-200">
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
            {currentCourse.createdBranch === "Main" && !selectedBranchId && !currentCourse._id && (
              <p className="text-red-600 text-[10px] font-bold italic">
                * Select a branch at the top first
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




      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6 transition-colors duration-300">
        {/* Row 3 */}
        <div className="flex flex-col gap-2">
          <label className="font-medium text-[16px]">Education type</label>
          <SlidingIndicator
            options={["Full time", "part time", "Distance"] as const}
            activeOption={currentCourse.educationType}
            onOptionChange={(educationType) =>
              setCourses(
                courses.map((course) =>
                  course.id === selectedCourseId ? { ...course, educationType } : course
                )
              )
            }
            size="md"
          />
          {courseErrors.educationType && <p className="text-red-500 text-xs mt-1">{courseErrors.educationType}</p>}
        </div>



        <div className="flex flex-col gap-2">
          <label className="font-medium text-[16px]">Mode</label>
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
          {courseErrors.mode && <p className="text-red-500 text-xs mt-1">{courseErrors.mode}</p>}
        </div>

        {/* Row 1: Class Size & Eligibility [cite: 111-112, 116] */}
        <InputField
          label="Class size"
          name="classSize"
          value={currentCourse.classSize}
          onChange={handleCourseChange}
          placeholder="60"
          type="number"
          required
          error={courseErrors.classSize}
        />

        <InputField
          label="Eligibility Criteria"
          name="eligibilityCriteria"
          value={currentCourse.eligibilityCriteria}
          onChange={handleCourseChange}
          placeholder="Must have completed 12th Grade"
          required
          error={courseErrors.eligibilityCriteria}

        />

        {/* Row 2: Ownership & College Category  */}
        <InputField
          label="Ownership type"
          name="ownershipType"
          value={currentCourse.ownershipType}
          onChange={handleCourseChange}
          isSelect
          options={["Government", "Private", "Semi-Government", "Aided", "Unaided"]}
          placeholder="Select ownership type"
          required
          error={courseErrors.ownershipType}

        />

        <InputField
          label="College category"
          name="collegeCategory"
          value={currentCourse.collegeCategory}
          onChange={handleCourseChange}
          isSelect
          options={["Engineering", "Medical", "Arts & Science", "Commerce", "Management", "Law", "Other"]}
          placeholder="Select Category"
          required
          error={courseErrors.collegeCategory}

        />

        {/* Row 3: Affiliation & Course Duration [cite: 114-115, 118-119] */}
        <InputField
          label="Affiliation type"
          name="affiliationType"
          value={currentCourse.affiliationType}
          onChange={handleCourseChange}
          isSelect
          options={["University", "Autonomous", "Affiliated", "Deemed University", "Other"]}
          placeholder="Select Affiliation type"
          required
          error={courseErrors.affiliationType}

        />

        <InputField
          label="Course Duration"
          name="courseDuration"
          value={currentCourse.courseDuration}
          onChange={handleCourseChange}
          placeholder="4years"
          required
          error={courseErrors.courseDuration}

        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8 items-start transition-colors duration-300">
        {/* Row 1: Library & Hostel [cite: 120, 122] */}
        <div className="flex flex-col gap-3">
          <label className="font-medium text-[16px] text-gray-900 dark:text-slate-200">Library? <span className="text-red-500">*</span></label>
          <div className="flex gap-8">
            {["Yes", "No"].map((opt) => (
              <label key={opt} className="flex items-center gap-2 cursor-pointer text-sm font-medium dark:text-slate-300">
                <input type="radio" name="library" value={opt} checked={currentCourse.library === opt} onChange={handleCourseChange} className="accent-[#0222D7] w-4 h-4 cursor-pointer" required />
                {opt}
              </label>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <label className="font-medium text-[16px] text-gray-900 dark:text-slate-200">Hostel facility? <span className="text-red-500">*</span></label>
          <div className="flex gap-8">
            {["Yes", "No"].map((opt) => (
              <label key={opt} className="flex items-center gap-2 cursor-pointer text-sm font-medium dark:text-slate-300">
                <input type="radio" name="hostelFacility" value={opt} checked={currentCourse.hostelFacility === opt} onChange={handleCourseChange} className="accent-[#0222D7] w-4 h-4 cursor-pointer" required />
                {opt}
              </label>
            ))}
          </div>
        </div>

        {/* Row 2: Entrance Exam & Management Quota [cite: 125, 129] */}
        <div className="flex flex-col gap-3">
          <label className="font-medium text-[16px] text-gray-900 dark:text-slate-200">Entrance exam? <span className="text-red-500">*</span></label>
          <div className="flex gap-8">
            {["Yes", "No"].map((opt) => (
              <label key={opt} className="flex items-center gap-2 cursor-pointer text-sm font-medium dark:text-slate-300">
                <input type="radio" name="entranceExam" value={opt} checked={currentCourse.entranceExam === opt} onChange={handleCourseChange} className="accent-[#0222D7] w-4 h-4 cursor-pointer" required />
                {opt}
              </label>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <label className="font-medium text-[16px] text-gray-900 dark:text-slate-200">Management Quota? <span className="text-red-500">*</span></label>
          <div className="flex gap-8">
            {["Yes", "No"].map((opt) => (
              <label key={opt} className="flex items-center gap-2 cursor-pointer text-sm font-medium dark:text-slate-300">
                <input type="radio" name="managementQuota" value={opt} checked={currentCourse.managementQuota === opt} onChange={handleCourseChange} className="accent-[#0222D7] w-4 h-4 cursor-pointer" required />
                {opt}
              </label>
            ))}
          </div>
        </div>

        {/* Row 3: Playground & Bus Service [cite: 127, 131] */}
        <div className="flex flex-col gap-3">
          <label className="font-medium text-[16px] text-gray-900 dark:text-slate-200">Playground? <span className="text-red-500">*</span></label>
          <div className="flex gap-8">
            {["Yes", "No"].map((opt) => (
              <label key={opt} className="flex items-center gap-2 cursor-pointer text-sm font-medium dark:text-slate-300">
                <input type="radio" name="playground" value={opt} checked={currentCourse.playground === opt} onChange={handleCourseChange} className="accent-[#0222D7] w-4 h-4 cursor-pointer" required />
                {opt}
              </label>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <label className="font-medium text-[16px] text-gray-900 dark:text-slate-200">Bus service? <span className="text-red-500">*</span></label>
          <div className="flex gap-8">
            {["Yes", "No"].map((opt) => (
              <label key={opt} className="flex items-center gap-2 cursor-pointer text-sm font-medium dark:text-slate-300">
                <input type="radio" name="busService" value={opt} checked={currentCourse.busService === opt} onChange={handleCourseChange} className="accent-[#0222D7] w-4 h-4 cursor-pointer" required />
                {opt}
              </label>
            ))}
          </div>
        </div>

        {/* Row 4: Placement Drive & Total Number Requires [cite: 133, 136-137] */}
        <div className="flex flex-col gap-3">
          <label className="font-medium text-[16px] text-gray-900 dark:text-slate-200">Placement drives? <span className="text-red-500">*</span></label>
          <div className="flex gap-8">
            {["Yes", "No"].map((opt) => (
              <label key={opt} className="flex items-center gap-2 cursor-pointer text-sm font-medium dark:text-slate-300">
                <input type="radio" name="placementDrives" value={opt} checked={currentCourse.placementDrives === opt} onChange={handleCourseChange} className="accent-[#0222D7] w-4 h-4 cursor-pointer" required />
                {opt}
              </label>
            ))}
          </div>
        </div>

        <InputField
          label="Total number requires"
          name="totalNumberRequires"
          value={currentCourse.totalNumberRequires || ""}
          onChange={handleCourseChange}
          placeholder="690"
          type="number"
          required

        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8 items-start transition-colors duration-300">
        {/* Row 1: Highest Package & Average Package [cite: 138, 148] */}
        <InputField
          label="Highest Package"
          name="highestPackage"
          value={currentCourse.highestPackage || ""}
          onChange={handleCourseChange}
          placeholder="15 LPA"

        />

        <InputField
          label="Average Package"
          name="averagePackage"
          value={currentCourse.averagePackage || ""}
          onChange={handleCourseChange}
          placeholder="10 LPA"

        />

        {/* Row 2: Total No. of Students Placed & Mock Interviews [cite: 140, 150] */}
        <InputField
          label="Total no. of students placed"
          name="totalStudentsPlaced"
          value={currentCourse.totalStudentsPlaced || ""}
          onChange={handleCourseChange}
          placeholder="400"
          type="number"

        />

        <div className="flex flex-col gap-3">
          <label className="font-medium text-[16px] text-gray-900 dark:text-slate-200">
            Mock interviews? <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-8">
            {["Yes", "No"].map((opt) => (
              <label key={opt} className="flex items-center gap-2 cursor-pointer text-sm font-medium dark:text-slate-300">
                <input
                  type="radio"
                  name="mockInterviews"
                  value={opt}
                  checked={currentCourse.mockInterviews === opt}
                  onChange={handleCourseChange}
                  className="accent-[#0222D7] w-4 h-4 cursor-pointer"
                  required
                />
                {opt}
              </label>
            ))}
          </div>
        </div>

        {/* Row 3: Resume Building & LinkedIn Optimization [cite: 142, 152] */}
        <div className="flex flex-col gap-3">
          <label className="font-medium text-[16px] text-gray-900 dark:text-slate-200">
            Resume building? <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-8">
            {["Yes", "No"].map((opt) => (
              <label key={opt} className="flex items-center gap-2 cursor-pointer text-sm font-medium dark:text-slate-300">
                <input
                  type="radio"
                  name="resumeBuilding"
                  value={opt}
                  checked={currentCourse.resumeBuilding === opt}
                  onChange={handleCourseChange}
                  className="accent-[#0222D7] w-4 h-4 cursor-pointer"
                  required
                />
                {opt}
              </label>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <label className="font-medium text-[16px] text-gray-900 dark:text-slate-200">
            Linked In Optimization? <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-8">
            {["Yes", "No"].map((opt) => (
              <label key={opt} className="flex items-center gap-2 cursor-pointer text-sm font-medium dark:text-slate-300">
                <input
                  type="radio"
                  name="linkedinOptimization"
                  value={opt}
                  checked={currentCourse.linkedinOptimization === opt}
                  onChange={handleCourseChange}
                  className="accent-[#0222D7] w-4 h-4 cursor-pointer"
                  required
                />
                {opt}
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8 items-start transition-colors duration-300">
        {/* Row 1: Price & Center Images */}
        <InputField
          label="Price of Course"
          name="priceOfCourse"
          value={currentCourse.priceOfCourse}
          onChange={handleCourseChange}
          placeholder="1,05,000/-"
          type="number"
          required

        />

        <div className="space-y-3">
          <label className="font-medium text-[16px] text-gray-900">
            College/Center Images <span className="text-red-500">*</span>
          </label>
          <div
            onClick={() => document.getElementById('college-images-input')?.click()}
            className="relative flex items-center justify-center w-full h-[60px] bg-white border border-[#DADADD] rounded-[12px] cursor-pointer hover:bg-gray-50 transition-all overflow-hidden"
          >
            {(currentCourse.collegeImage || currentCourse.collegeImagePreviewUrl) ? (
              <div className="absolute inset-0 w-full h-full">
                <img
                  src={currentCourse.collegeImagePreviewUrl}
                  className="w-full h-full object-cover" // object-cover ensures it fills the box without distortion
                  alt="college preview"
                />
                {/* Optional: Add a semi-transparent overlay on hover to show it's still clickable */}
                <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center">
                  <span className="text-white text-xs font-bold opacity-0 hover:opacity-100 bg-black/40 px-2 py-1 rounded">Change Photo</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-slate-500">
                <Upload size={18} />
                <span className="text-[13px]">Upload College Photos</span>
              </div>
            )}
            <input
              id="college-images-input"
              type="file"
              className="hidden"
              accept="image/*"
              onChange={(e) => handleFileChange(e, "collegeImage")}
            />
          </div>
          {courseErrors.collegeImageUrl && (
            <p className="text-red-500 text-xs">{courseErrors.collegeImageUrl}</p>
          )}
        </div>

        {/* Row 2: Installments & EMI Options */}
        <div className="flex flex-col gap-3">
          <label className="font-medium text-[16px] text-gray-900 dark:text-slate-200">
            Installments <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-8">
            {["Yes", "No"].map((opt) => (
              <label key={opt} className="flex items-center gap-2 cursor-pointer text-sm font-medium dark:text-slate-300">
                <input
                  type="radio"
                  name="installments"
                  value={opt}
                  checked={currentCourse.installments === opt}
                  onChange={handleCourseChange}
                  className="accent-[#0222D7] w-4 h-4 cursor-pointer"
                  required
                />
                {opt}
              </label>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <label className="font-medium text-[16px] text-gray-900 dark:text-slate-200">
            EMI Options <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-8">
            {["Yes", "No"].map((opt) => (
              <label key={opt} className="flex items-center gap-2 cursor-pointer text-sm font-medium dark:text-slate-300">
                <input
                  type="radio"
                  name="emioptions"
                  value={opt}
                  checked={currentCourse.emioptions === opt}
                  onChange={handleCourseChange}
                  className="accent-[#0222D7] w-4 h-4 cursor-pointer"
                  required
                />
                {opt}
              </label>
            ))}
          </div>
        </div>

        {/* Row 3: Add Image & Add Brochure (Standard Course Uploads) */}
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
  );
}