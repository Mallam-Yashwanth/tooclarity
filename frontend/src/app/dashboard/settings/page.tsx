"use client";

import React, { useState, useEffect } from "react";
import { Edit3, Eye, EyeOff, KeyRound, CheckCircle } from "lucide-react";
import { authAPI } from "@/lib/api";
import { dashboardAPI } from "@/lib/dashboard_api";
import { toast } from 'react-toastify';
import axios from 'axios';
import { cacheGet, cacheSet } from "@/lib/localDb";
import L2DialogBox from "@/components/auth/L2DialogBox";
import AppSelect from "@/components/ui/AppSelect";
import { useSearchParams } from "next/navigation";

// --- INTERFACES ---

interface AdminFormData {
    currentEmail: string;
    newPassword: string;
    confirmPassword: string;
}

interface PasswordFieldProps {
    label: string;
    value: string;
    show: boolean;
    placeholder: string;
    onChange: (value: string) => void;
    onToggle: () => void;
    disabled?: boolean;
}

// --- REUSABLE COMPONENTS ---
const PasswordField: React.FC<PasswordFieldProps> = ({ label, value, show, placeholder, onChange, onToggle, disabled = false }) => (
    <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <div className="relative">
            <input
                type={show ? "text" : "password"}
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
            <button type="button" onClick={onToggle} disabled={disabled} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed">
                {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
        </div>
    </div>
);

// --- MAIN PAGE COMPONENT ---
const SettingsPage: React.FC = () => {
    const searchParams = useSearchParams();
    const [activeTab, setActiveTab] = useState<"admin" | "course">("admin");
    const [showPasswords, setShowPasswords] = useState({ new: false, confirm: false });
    
    const [pageLoading, setPageLoading] = useState(true);
    const [verificationLoading, setVerificationLoading] = useState(false);
    const [passwordSaveLoading, setPasswordSaveLoading] = useState(false);
    
    const [userName, setUserName] = useState("User");
    const [isVerificationSent, setIsVerificationSent] = useState(false);
    const [isEmailVerified, setIsEmailVerified] = useState(false);
    const [otp, setOtp] = useState("");
    const [otpError, setOtpError] = useState("");
    const [formData, setFormData] = useState<AdminFormData>({ currentEmail: "", newPassword: "", confirmPassword: "" });
    
    // Course editing state
    const [allCourses, setAllCourses] = useState<any[]>([]);
    const [selectedCourse, setSelectedCourse] = useState<any>(null);
    const [institutionData, setInstitutionData] = useState<any | null>(null);
    const [courseError, setCourseError] = useState("");

    // Handle editProgram query parameter
    useEffect(() => {
        const editProgramId = searchParams.get('editProgram');
        if (editProgramId && allCourses.length > 0) {
            const courseToEdit = allCourses.find(course => course._id === editProgramId);
            if (courseToEdit) {
                setSelectedCourse(courseToEdit);
                setActiveTab("course");
            }
        }
    }, [searchParams, allCourses]);

    // --- DATA FETCHING EFFECTS ---
    useEffect(() => {
        const fetchInitialData = async () => {
            setPageLoading(true);
            try {
                const profileRes = await authAPI.getProfile();
                if (profileRes.success && profileRes.data) {
                    setFormData((prev) => ({ ...prev, currentEmail: profileRes.data.email || "" }));
                    setUserName(profileRes.data.name || "User");
                }
            } catch (error) {
                console.error("Failed to fetch admin profile:", error);
            } finally {
                setPageLoading(false);
            }
        };
        fetchInitialData();
    }, []);

    useEffect(() => {
        if (activeTab !== "course") return;

        const fetchFullData = async () => {
            setPageLoading(true);
            setCourseError("");
            try {
                const cachedData = await cacheGet("fullDashboardData");
                if (cachedData && typeof cachedData === 'object' && 'branchesWithCourses' in cachedData) {
                    const courses = (cachedData as any).branchesWithCourses.flatMap((b: any) => b.courses);
                    setAllCourses(courses);
                    setInstitutionData((cachedData as any).institution);
                    return;
                }

                const fileOrBlob: any = await dashboardAPI.getFullDashboardDetails();
                if (fileOrBlob instanceof Blob || fileOrBlob instanceof File) {
                    const textData = await fileOrBlob.text();
                    const data = JSON.parse(textData);

                    await cacheSet("fullDashboardData", data, 5 * 60 * 1000); // 5 minutes cache

                    const courses = data.branchesWithCourses.flatMap((b: any) => b.courses);
                    setAllCourses(courses);
                    setInstitutionData(data.institution);
                } else {
                    setCourseError("Unexpected response type from backend.");
                }
            } catch (error) {
                setCourseError(error instanceof Error ? error.message : "An unknown error occurred.");
            } finally {
                setPageLoading(false);
            }
        };

        fetchFullData();
    }, [activeTab]);

    // --- FORM HANDLERS ---
    const handleInputChange = (field: keyof AdminFormData, value: string) =>
        setFormData((prev) => ({ ...prev, [field]: value }));

    const handleCourseSelect = (courseId: string) => {
        const course = allCourses.find(c => c._id === courseId);
        setSelectedCourse(course || null);
    };

    const handleEditSuccess = () => {
        toast.success("Program updated successfully!");
        setSelectedCourse(null);
        // Refresh the data
        const refreshData = async () => {
            try {
                const fileOrBlob: any = await dashboardAPI.getFullDashboardDetails();
                if (fileOrBlob instanceof Blob || fileOrBlob instanceof File) {
                    const textData = await fileOrBlob.text();
                    const data = JSON.parse(textData);
                    await cacheSet("fullDashboardData", data, 5 * 60 * 1000);
                    const courses = data.branchesWithCourses.flatMap((b: any) => b.courses);
                    setAllCourses(courses);
                    setInstitutionData(data.institution);
                }
            } catch (error) {
                console.error("Failed to refresh data:", error);
            }
        };
        refreshData();
    };
    
    // --- ACTION HANDLERS (SAVE, OTP, etc.) ---

    const handleSendVerification = async () => {
        setVerificationLoading(true);
        setOtpError("");
        try {
            const response = await dashboardAPI.sendVerificationOTP();
            if (response.success) {
                setIsVerificationSent(true);
                toast.success("A verification code has been sent to your primary email.");
            } else {
                setOtpError(response.message || "Failed to send verification code.");
            }
        } catch (error) {
            setOtpError("An unexpected error occurred. Please try again.");
        } finally {
            setVerificationLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (otp.length !== 6) {
            setOtpError("OTP must be 6 digits.");
            return;
        }
        setVerificationLoading(true);
        setOtpError("");
        try {
            const response = await dashboardAPI.verifyActionOTP(otp);
            if (response.success) {
                setIsEmailVerified(true);
                setIsVerificationSent(false);
            } else {
                setOtpError(response.message || "Invalid OTP. Please try again.");
            }
        } catch (error) {
            setOtpError("An unexpected error occurred during verification.");
        } finally {
            setVerificationLoading(false);
        }
    };

    const handleSavePassword = async () => {
        if (!formData.newPassword || !formData.confirmPassword) {
            toast.warn("Please fill in all password fields");
            return;
        }
        if (formData.newPassword !== formData.confirmPassword) {
            toast.warn("Passwords do not match");
            return;
        }
        const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!regex.test(formData.newPassword)) {
            toast.warn("Password must be 8+ characters and include uppercase, lowercase, number, and special character.");
            return;
        }

        setPasswordSaveLoading(true);
        try {
            const response = await dashboardAPI.updatePassword(formData.newPassword);
            if (response.success) {
                toast.success("Password updated successfully!");
                setFormData(prev => ({ ...prev, newPassword: "", confirmPassword: "" }));
                setIsEmailVerified(false);
                setOtp("");
            } else {
                toast.error(response.message || "Failed to update password.");
            }
        } catch (error) {
            let errorMessage = "An unexpected error occurred.";
            if (axios.isAxiosError(error)) {
                errorMessage = error.response?.data?.message || "An error occurred with the request.";
            } else if (error instanceof Error) {
                errorMessage = error.message;
            }
            toast.error(errorMessage);
        } finally {
            setPasswordSaveLoading(false);
        }
    };

    if (pageLoading && activeTab === 'course' && !allCourses.length) {
        return <div className="min-h-screen flex items-center justify-center">Loading settings...</div>;
    }

    // --- RENDER ---
    return (
        <div className="min-h-screen bg-gray-50 flex">
            <div className="flex-1 p-4 lg:p-8">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-3xl font-bold text-gray-800 mb-6">Settings</h1>
                    <div className="border-b border-gray-200 mb-6">
                        <nav className="flex space-x-8">
                            <button onClick={() => setActiveTab("admin")} className={`py-2 px-1 border-b-2 font-medium text-base transition-colors duration-200 ${activeTab === "admin" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>Admin Details</button>
                            <button onClick={() => setActiveTab("course")} className={`py-2 px-1 border-b-2 font-medium text-base transition-colors duration-200 ${activeTab === "course" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>Edit Program</button>
                        </nav>
                    </div>

                    {activeTab === "admin" && (
                        <div className="space-y-8">
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex items-center space-x-4">
                                <div className="w-14 h-14 bg-yellow-400 rounded-full flex items-center justify-center text-white font-semibold text-xl">
                                    {userName.charAt(0).toUpperCase()}{(userName.split(" ")[1]?.charAt(0).toUpperCase() || "")}
                                </div>
                                <div className="flex-1">
                                    <h2 className="text-xl font-semibold text-gray-800">{userName}</h2>
                                    <p className="text-gray-500">Admin</p>
                                </div>
                                <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors">
                                    <Edit3 className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">Email Settings</h3>
                                <label className="block text-base font-medium text-gray-700 mb-1">Your Primary Email</label>
                                <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600 text-base">
                                    {formData.currentEmail || "Loading..."}
                                </div>
                            </div>

                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">Change Password</h3>
                                <div className="space-y-4">
                                    {!isEmailVerified ? (
                                        <div className="p-4 border border-blue-200 bg-blue-50 rounded-lg">
                                            <div className="flex items-center space-x-3">
                                                <KeyRound className="h-6 w-6 text-blue-500 flex-shrink-0" />
                                                <div className="flex-1">
                                                    <h4 className="font-semibold text-blue-800">Secure Your Account</h4>
                                                    <p className="text-sm text-blue-700">Verify your email to enable password changes.</p>
                                                </div>
                                                {!isVerificationSent && (
                                                    <button onClick={handleSendVerification} disabled={verificationLoading} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300 transition-colors text-sm font-medium">
                                                        {verificationLoading ? "Sending..." : "Verify Email"}
                                                    </button>
                                                )}
                                            </div>
                                            {isVerificationSent && (
                                                <div className="mt-4">
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Enter 6-digit code</label>
                                                    <div className="flex items-end space-x-2">
                                                        <div className="flex-1">
                                                            <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)} maxLength={6} className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 text-base ${otpError ? "border-red-500 ring-red-500" : "border-gray-300 focus:ring-blue-500"}`} placeholder="123456" />
                                                        </div>
                                                        <button onClick={handleVerifyOtp} disabled={verificationLoading || otp.length !== 6} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-green-300 transition-colors text-sm font-medium">
                                                            {verificationLoading ? "Verifying..." : "Verify OTP"}
                                                        </button>
                                                    </div>
                                                    <p className="text-sm text-red-600 mt-1 min-h-[1.25rem]">{otpError || "\u00A0"}</p>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                         <div className="p-4 border border-green-200 bg-green-50 rounded-lg flex items-center space-x-3">
                                            <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0" />
                                            <div>
                                                <h4 className="font-semibold text-green-800">Email Verified</h4>
                                                <p className="text-sm text-green-700">You can now set your new password below.</p>
                                            </div>
                                        </div>
                                    )}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <PasswordField label="New Password" value={formData.newPassword} show={showPasswords.new} placeholder="Enter new password" onChange={(val) => handleInputChange("newPassword", val)} onToggle={() => setShowPasswords(p => ({ ...p, new: !p.new }))} disabled={!isEmailVerified} />
                                        <PasswordField label="Confirm Password" value={formData.confirmPassword} show={showPasswords.confirm} placeholder="Confirm new password" onChange={(val) => handleInputChange("confirmPassword", val)} onToggle={() => setShowPasswords(p => ({ ...p, confirm: !p.confirm }))} disabled={!isEmailVerified} />
                                    </div>
                                    <div className="flex justify-end">
                                        <button onClick={handleSavePassword} disabled={!isEmailVerified || passwordSaveLoading || !formData.newPassword || !formData.confirmPassword} className="px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors text-base font-medium">
                                            {passwordSaveLoading ? "Saving..." : "Save New Password"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {activeTab === "course" && (
                        <div className="space-y-6">
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">Edit Program Details</h3>

                            {courseError && <p className="text-red-600 text-sm mb-4">{courseError}</p>}

                                {allCourses.length === 0 ? (
                                    <div className="text-center py-8">
                                        <p className="text-gray-500 mb-4">No programs found to edit.</p>
                                        <p className="text-sm text-gray-400">Create programs from the Subscription page first.</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="mb-4">
                                            <AppSelect
                                                value={selectedCourse?._id || ""}
                                                onChange={handleCourseSelect}
                                                options={allCourses.map(course => ({
                                                    value: course._id,
                                                    label: course.courseName || course.hallName || course.subject || "Unnamed Program"
                                                }))}
                                                placeholder="Choose a Program to Edit"
                                                variant="white"
                                                size="md"
                                                rounded="lg"
                                                className="w-full max-w-md"
                                            />
                                        </div>

                                        {selectedCourse && (
                                            <div className="mt-6">
                                                <L2DialogBox
                                                    renderMode="inline"
                                                    mode="settingsEdit"
                                                    institutionId={institutionData?._id}
                                                    editMode={true}
                                                    existingCourseData={selectedCourse}
                                                    onEditSuccess={handleEditSuccess}
                                                />
                                            </div>
                                        )}
                                    </>
                                    )}
                                </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;