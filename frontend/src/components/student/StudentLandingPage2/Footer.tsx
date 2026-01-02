"use client";
import React, { useState, useCallback, memo } from "react";
import Link from "next/link";
import Image from "next/image";
import { MapPin, ChevronDown,Phone, Mail, Instagram, Linkedin, Twitter } from "lucide-react";

// Constants for routes - centralized for easy maintenance/SEO
const FOOTER_ROUTES = {
  explore: [
    { label: "Kindergarten", href: "/student/blogs/kindergarten", prefetch: true },
    { label: "Schools", href: "/student/blogs/schools", prefetch: true },
    {
      label: "Tuition Centres",
      href: "/student/blogs/tuition",
      prefetch: true,
    },
    { label: "Intermediate", href: "/student/blogs/intermediate", prefetch: true },
    {
      label: "Graduation (UG/PG/Universities)",
      href: "/student/blogs/undergraduate",
      prefetch: true,
    },
    { label: "Upskilling", href: "/student/blogs/training", prefetch: true },
    {
      label: "Exam Preparation",
      href: "/student/blogs/study-halls",
      prefetch: true,
    },
    { label: "Study Abroad", href: "/student/blogs/study-abroad", prefetch: true },
  ],
  company: [
    { label: "About Us", href: "/student/AboutUs", prefetch: true },
    { label: "Careers", href: "student/Careers", prefetch: false }, // Less critical, no prefetch
    { label: "Privacy Policy", href: "/PrivacyPolicy", prefetch: false },
    { label: "Terms of Service", href: "/TermsConditions", prefetch: false },
    { label: "Institution", href: "/institute", prefetch: true },
  ],
  resources: [
    { label: "Blog", href: "/student/blogs", prefetch: true },
    { label: "Webinars", href: "student/webinars", prefetch: false },
    { label: "Student Stories", href: "student/student-stories", prefetch: true },
    {
      label: "Become A Campus Leader",
      href: "student/campus-leader",
      prefetch: false,
    },
    { label: "Scholarships", href: "student/scholarships", prefetch: true },
  ],
} as const;

const CONTACT_INFO = [
  {
    icon: <Mail className="w-4 h-4 text-white flex-shrink-0" />,
    label: "tooclarity@gmail.com",
  },
  {
    icon: <Phone className="w-4 h-4 text-white flex-shrink-0" />,
    label: "+91 88519 60009",
  },
  {
    icon: <MapPin className="w-4 h-4 text-white mt-1 flex-shrink-0" />,
    label: "Tarnaka, Secunderbad, Hyderabad 500007",
  },
];

type RouteItem = (typeof FOOTER_ROUTES)[keyof typeof FOOTER_ROUTES][number];
type ContactItem = (typeof CONTACT_INFO)[number];

interface SectionProps {
  sectionKey: string; // Renamed to avoid conflict with React's 'key' prop
  title: string;
  items: readonly RouteItem[] | readonly ContactItem[];
  isOpen: boolean;
  onToggle: () => void;
  isContact?: boolean;
}

const Section = memo<SectionProps>( // Changed 'key' to 'sectionKey' in destructuring
  ({ sectionKey, title, items, isOpen, onToggle, isContact }) => (
    <div className="w-full md:w-auto">
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full md:pointer-events-none mb-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
        aria-expanded={isOpen}
        aria-controls={`${sectionKey}-list`}
        role="button"
      >
        <h3 className="font-bold text-lg text-white">{title}</h3>
        {!isContact && (
          <ChevronDown
            className={`h-4 w-4 transition-transform md:hidden ${
              isOpen ? "rotate-180" : ""
            }`}
            aria-hidden="true"
          />
        )}
      </button>
      <ul
        id={`${sectionKey}-list`}
        className={`space-y-2 text-white text-sm sm:text-base transition-all duration-300 overflow-hidden ${
          isOpen
            ? "max-h-[500px] opacity-100"
            : "max-h-0 opacity-0 md:max-h-none md:opacity-100"
        }`}
        role={isOpen ? "region" : undefined}
      >
        {items.map((item, index) => (
          <li key={index}>
            {"href" in item ? (
              <Link
                href={item.href}
                prefetch={item.prefetch}
                className="hover:text-white transition-colors block py-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-white rounded"
                tabIndex={!isOpen ? -1 : undefined} // Accessibility: only focusable when open
              >
                {item.label}
              </Link>
            ) : (
              <div className="flex items-center gap-2 py-1" role="listitem">
                {item.icon}
                <span className="text-white">{item.label}</span>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
);

Section.displayName = "FooterSection";

export default function Footer() {
  const [openSections, setOpenSections] = useState({
    explore: false,
    company: false,
    resources: false,
    contact: false,
  });
   const [showTopHeader, setShowTopHeader] = useState(true);

  const toggleSection = useCallback((key: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const sections = [
    {
      key: "explore" as const,
      title: "Explore",
      items: FOOTER_ROUTES.explore,
      isContact: false,
    },
    {
      key: "company" as const,
      title: "Company",
      items: FOOTER_ROUTES.company,
      isContact: false,
    },
    {
      key: "resources" as const,
      title: "Resources",
      items: FOOTER_ROUTES.resources,
      isContact: false,
    },
    {
      key: "contact" as const,
      title: "Contact Us",
      items: CONTACT_INFO,
      isContact: true,
    },
  ] as const;


  return (
    <>
      <footer
        className="bg-[#011481] overflow-y-hidden border-t py-8 sm:py-12 px-4 sm:px-6 lg:px-20"
        role="contentinfo"
      >
        <div className="max-w-7xl mx-auto flex flex-col items-center md:items-start">
          {/* Logo Section - Placeholder for logos with alt text for accessibility */}
          <div className="mb-8 sm:mb-10 flex flex-col items-center md:items-start w-full md:w-auto">
            {/* Desktop Logo */}
            <div className="hidden md:block">
              
              <Image
  src="/Images/TooclarityTextLogo.svg"
  alt="TooclarityTextLogo-image"
  width={0}
  height={0}
  sizes="100vw"
  style={{ width: "auto", height: "auto" }}
/>
            </div>
            {/* Mobile Logo */}
            <div className="md:hidden">
              <Image
  src="/Images/TooclarityTextLogo.svg"
  alt="TooclarityTextLogo-image"
  width={0}
  height={0}
  sizes="100vw"
  style={{ width: "auto", height: "auto" }}
/>
            </div>
          </div>

          {/* Links Section */}
          <div className="grid grid-cols-1 text-white md:grid-cols-4 gap-6 sm:gap-8 w-full">
            {sections.map((section) => (
              <Section
                key={section.key}
                title={section.title}
                items={section.items}
                isOpen={openSections[section.key]}
                onToggle={() => toggleSection(section.key)}
                isContact={section.isContact}
                sectionKey={""}
              />
            ))}
          </div>
        </div>

        {/* ===== Top Blue Header (Info Bar) ===== */}
      {/* ===== Top Blue Header (Info Bar) ===== */}
<header
  className="w-full bg-[#0222D7] text-white text-sm py-2 mt-10"
>
  <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between px-4 sm:px-6">
    {/* Left Section - Logo + Contact Info */}
    <div className="flex items-center gap-6 sm:gap-12 flex-wrap">
      {/* Phone */}
      <div className="flex items-center gap-3">
        <Phone className="md:w-4 w-2 h-4 text-white" />
        <a
          href="tel:+911234567890"
          className="md:text-[16px] text-[8px] hover:underline whitespace-nowrap"
        >
          +91 93911 60205
        </a>
      </div>

      {/* Email */}
      <div className="flex items-center gap-2">
        <Mail className="md:w-4 w-2 h-4 text-white" />
        <a
          href="mailto:info@tooclarity.com"
          className="md:text-[16px] text-[8px] hover:underline whitespace-nowrap"
        >
          tooclarity0@gmail.com
        </a>
      </div>
    </div>

    {/* Right Section - Social Links */}
    <div className="flex items-center gap-4 mt-2 sm:mt-0">
      <a
        href="https://instagram.com/"
        target="_blank"
        rel="noopener noreferrer"
        className="hover:text-gray-200"
      >
        <Instagram className="w-5 h-5" />
      </a>
      <a
        href="https://twitter.com/"
        target="_blank"
        rel="noopener noreferrer"
        className="hover:text-gray-200"
      >
        <Twitter className="w-5 h-5" />
      </a>
      <a
        href="https://linkedin.com/"
        target="_blank"
        rel="noopener noreferrer"
        className="hover:text-gray-200"
      >
        <Linkedin className="w-5 h-5" />
      </a>
    </div>
  </div>
</header>

      </footer>
        {/* Footer Bottom - Full-width, accessible copyright */}
      <div className="bg-black flex flex-col sm:flex-row items-center justify-center text-center text-white text-sm py-4 border-t border-gray-700 w-full">
        <p className="flex items-center justify-center">
          &copy; Too Clarity 2025. All rights reserved.
        </p>
      </div>
    </>
  );
}
