"use client";

import React, { useState } from "react";
import { CoursePage as GenericCoursePage } from "./CoursePage";
import { Kindergarten } from "../coursePage/Kindergarten";
import { School } from "../coursePage/School";
import { Intermediate } from "../coursePage/Intermediate";
import { UG_PG } from "../coursePage/UG_PG";
import { CoachingCenter } from "../coursePage/CoachingCenter";
import { StudyHall } from "../coursePage/StudyHall";
import { ExamPreparation } from "../coursePage/ExamPreparation";
import { StudyAbroad } from "../coursePage/StudyAbroad";
import { TuitionCentre } from "../coursePage/TuitionCentre";
import ScheduleCallbackDialog, {
  CallbackFormData,
} from "./ScheduleCallbackDialog";
import BookDemoDialog, { BookDemoFormData } from "./BookDemoDialog";
import OtpDialogBox from "../../auth/OtpDialogBox";
import { studentDashboardAPI } from "../../../lib/students-api";
import { useUserStore } from "@/lib/user-store";
import { authAPI } from "@/lib/api";
import { toast } from 'react-toastify'

interface BaseCourse {
  id: string;
  institutionId: string;
  title: string;
  institution: string;
  location?: string;
  description?: string;
  aboutCourse?: string;
  eligibility?: string;
  price: string;
  duration?: string;
  mode?: string;
  timings?: string;
  brandLogo?: string;
  startDate?: string;
  image?: string;
  operationalDays?: string[];
  instructor?: string;
  subject?: string;
  hallName?: string;
  totalSeats?: string;
  isWishlisted?: boolean;
  listingType?: string;
  features?: {
    recognized?: boolean;
    activities?: boolean;
    transport?: boolean;
    extraCare?: boolean;
    mealsProvided?: boolean;
    playground?: boolean;
    resumeBuilding?: boolean;
    linkedinOptimization?: boolean;
    mockInterviews?: boolean;
    exclusiveJobPortal?: boolean;
    placementDrives?: boolean;
    library?: boolean;
    entranceExam?: boolean;
    managementQuota?: boolean;
    classSize?: string;
    classSizeRatio?: string;
    schoolCategory?: string;
    curriculumType?: string;
    hostelFacility?: boolean;
    certification?: boolean;
    hasWifi?: boolean;
    hasChargingPoints?: boolean;
    hasAC?: boolean;
    hasPersonalLocker?: boolean;
    collegeCategory?: string;
  };
}

export interface InstituteCoursePageProps {
  course: BaseCourse;
  instituteType?: string;
  onBack?: () => void;
  onRequestCall?: () => void;
  onBookDemo?: () => void;
}

function normalizeType(raw?: string): string {
  if (!raw) return "";
  const cleaned = raw.trim().toLowerCase();
  if (cleaned === "school's" || cleaned === "school" || cleaned === "schools")
    return "School";
  if (cleaned === "under graduation/post graduation") return "UG_PG";
  if (cleaned === "coaching centers") return "CoachingCenter";
  if (cleaned === "study halls") return "StudyHall";
  if (
    cleaned === "exam" ||
    cleaned === "exam preparation" ||
    cleaned === "exampreparation"
  )
    return "ExamPreparation";
  if (
    cleaned === "study abroad" ||
    cleaned === "studyabroad" ||
    cleaned === "abroad"
  )
    return "StudyAbroad";
  if (cleaned === "tution center's") return "TuitionCentre";
  if (cleaned === "intermediate college(k12)") return "Intermediate";
  if (cleaned === "kindergarten/childcare center") return "Kindergarten";
  return "";
}

interface CourseComponentProps {
  course: BaseCourse;
  onRequestCall: () => void;
  onBookDemo: () => void;
  onBack?: () => void;
}

const componentMap: Record<string, React.FC<CourseComponentProps>> = {
  Kindergarten,
  School,
  Intermediate,
  UG_PG,
  CoachingCenter,
  StudyHall,
  ExamPreparation,
  StudyAbroad,
  TuitionCentre,
};

export const InstituteCoursePage: React.FC<InstituteCoursePageProps> = ({
  course,
  instituteType,
  onBack,
  onRequestCall,
  onBookDemo,
}) => {
  const [isCallbackDialogOpen, setIsCallbackDialogOpen] = useState(false);
  const [isBookDemoDialogOpen, setIsBookDemoDialogOpen] = useState(false);
  const [isOtpDialogOpen, setIsOtpDialogOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<
    "requestCall" | "bookDemo" | null
  >(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const { user } = useUserStore();
  console.log("Console Message Ashok User Name ",user?.name);

  const handleRequestCall = async () => {
    if (user?.isPhoneVerified) {
      try {
        await studentDashboardAPI.submitEnquiry({
          institutionId: course.institutionId,
          type: "callRequest",
          courseId: course.id,
          listingType: course.listingType,
        });

        // if (user?.callRequestCount !== undefined) {
        //   updateUser({ callRequestCount: user.callRequestCount + 1 });
        // }

        if (onRequestCall) {
          onRequestCall();
        }
      } catch (error) {
        console.error("Error submitting call request:", error);
        // toast.error('Failed to request call');
      }
    } else {
      setPendingAction("requestCall");
      setIsCallbackDialogOpen(true);
    }
  };

  const handleBookDemo = () => {
    if (user?.isPhoneVerified) {
      setIsBookDemoDialogOpen(true);
    } else {
      setPendingAction("bookDemo");
      setIsCallbackDialogOpen(true);
    }
  };

  const handleCallbackSubmit = async (data: CallbackFormData) => {
    try {
      console.log("Console Message Ashok ",user?.name);
      const { phoneNumber: phoneInput, email, userName } = data;
      const trimmedPhone = (phoneInput || "").trim();
      const trimmedEmail = (email || "").trim();
      const trimmedUserName = (userName || "").trim();

      if (!trimmedPhone && !trimmedEmail) {
        toast.error("Please provide a phone number or email to verify.");
        return;
      }

      setPhoneNumber(trimmedPhone);
      setEmailAddress(trimmedEmail);

      const response = await authAPI.verifyContactNumberAndEmail({
        contactNumber: trimmedPhone || undefined,
        email: trimmedEmail || undefined,
        userName: trimmedUserName || user?.name || undefined,
      });

      if (response?.success) {
        setIsCallbackDialogOpen(false);
        setIsOtpDialogOpen(true);
        const targetLabel = trimmedPhone ? "phone number" : "email";
        toast.success(`OTP sent to ${targetLabel} successfully!`);
      } else {
        toast.error(response?.message || "Failed to send OTP");
      }
    } catch (error) {
      toast.error("Something went wrong while sending OTP");
      console.error(error);
    }
  };

  const handleDemoSubmit = async (data: BookDemoFormData) => {
    try {
      await studentDashboardAPI.submitEnquiry({
        institutionId: course.institutionId,
        type: "demoRequest",
        date: data.date,
        timeSlot: data.timeSlot,
        courseId: course.id,
        listingType: course.listingType,
      });

      // if (user?.requestDemoCount !== undefined) {
      //   updateUser({ requestDemoCount: user.requestDemoCount + 1 });
      // }

      if (onBookDemo) {
        onBookDemo();
      }
      setIsBookDemoDialogOpen(false);
      toast.success('Demo booked successfully!');
    } catch (error) {
      toast.error('Failed to book demo');
      console.error("Error booking demo:", error);
    }
  };

  const handleOtpVerificationSuccess = () => {
    if (pendingAction === "requestCall") {
      if (onRequestCall) {
        onRequestCall();
      }
    } else if (pendingAction === "bookDemo") {
      setIsBookDemoDialogOpen(true);
    }
    setPendingAction(null);
  };

  const key = normalizeType(instituteType) || "StudyHall";
  const Component = componentMap[key] || GenericCoursePage;

  return (
    <>
      <Component
        course={course}
        onBack={onBack}
        onRequestCall={handleRequestCall}
        onBookDemo={handleBookDemo}
      />
      <ScheduleCallbackDialog
        open={isCallbackDialogOpen}
        onOpenChange={setIsCallbackDialogOpen}
        onSubmit={handleCallbackSubmit}
        collectEmailAndPhone
      />
      <BookDemoDialog
        open={isBookDemoDialogOpen}
        onOpenChange={setIsBookDemoDialogOpen}
        onSubmit={handleDemoSubmit}
      />
      <OtpDialogBox
        open={isOtpDialogOpen}
        setOpen={setIsOtpDialogOpen}
        phoneNumber={phoneNumber || undefined}
        email={emailAddress || undefined}
        onVerificationSuccess={handleOtpVerificationSuccess}
        fromStudent={true}
      />
    </>
  );
};

export default InstituteCoursePage;
