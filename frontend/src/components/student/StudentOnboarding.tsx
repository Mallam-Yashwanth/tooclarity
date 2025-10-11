"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/lib/user-store";
import { studentDashboardAPI, studentOnboardingAPI } from "@/lib/students-api";
import { apiRequest } from "@/lib/api";
import { DateInput, FormField, RadioGroup, Dropdown, validateDateInstant } from "@/components/ui/InputField";

const labelCls = "text-[12px] font-semibold";
const inputBase =
	"w-full h-[52px] rounded-[12px] px-4 outline-none border transition-colors";
const inputIdle = "border-gray-200 bg-white focus:border-[#3B82F6]";
const inputActive = "border-[#0A46E4] ring-1 ring-[#0A46E4]";
const inputDisabled = "bg-gray-50 border-gray-200 text-gray-400";
const inputError = "border-red-400 bg-white";
const buttonCls =
	"w-full h-[48px] rounded-[12px] text-white text-[16px] font-medium bg-[#0A46E4] disabled:bg-gray-200 disabled:text-gray-500";

// Advanced validation helpers
const NAME_REGEX = /^[A-Za-z][A-Za-z ]{0,78}[A-Za-z]$/; // letters and spaces only
const LOCATION_ALLOWED = /^[A-Za-z0-9 ,.'\-/()#]{3,120}$/;

// Field-level validators for instant feedback (advanced)
function validateNameInstant(value: string): string | undefined {
	const normalized = value.replace(/\s+/g, " ").trim();
	if (normalized.length < 2) return "Name must be at least 2 characters";
	if (!NAME_REGEX.test(normalized)) return "Only letters and spaces allowed";
	return undefined;
}

function validateLocationInstant(value: string): string | undefined {
	const normalized = value.replace(/\s+/g, " ").trim();
	if (normalized.length < 3) return "Location must be at least 3 characters";
	if (!LOCATION_ALLOWED.test(normalized)) return "Use letters, numbers, , . - / ( ) #";
	return undefined;
}

function formatISOToDDMMYYYY(iso?: string | null): string {
	if (!iso) return "";
	const d = new Date(iso);
	if (isNaN(d.getTime())) return "";
	const dd = String(d.getDate()).padStart(2, "0");
	const mm = String(d.getMonth() + 1).padStart(2, "0");
	const yyyy = d.getFullYear();
	return `${dd}/${mm}/${yyyy}`;
}

type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8; // 1: empty, 2: focus name, 3: focus dob, 4: focus location, 5: academic interests, 6: academic form, 7: additional form, 8: final

const interests = [
	{ key: "KINDERGARTEN", label: "Kindergarten", color: "linear-gradient(135deg,#3C5BFF,#2A41C7)" },
	{ key: "SCHOOL", label: "School", color: "linear-gradient(135deg,#FF8A3D,#F36B1C)" },
	{ key: "INTERMEDIATE", label: "Intermediate", color: "linear-gradient(135deg,#69C9FF,#46B2F0)" },
	{ key: "GRADUATION", label: "Graduation", color: "linear-gradient(135deg,#A77BFF,#835BEB)" },
	{ key: "COACHING_CENTER", label: "Coaching\nCenter", color: "linear-gradient(135deg,#FF5A4E,#E63B2F)" },
	{ key: "STUDY_HALLS", label: "Study\nHalls", color: "linear-gradient(135deg,#FF8B64,#F26B3A)" },
	{ key: "TUITION_CENTER", label: "Tuition\ncenter", color: "linear-gradient(135deg,#6E6BFF,#4C4AE6)" },
	{ key: "STUDY_ABROAD", label: "Study\nAbroad", color: "linear-gradient(135deg,#2BD76F,#1FB75A)" },
];



const StudentonBoarding: React.FC = () => {
	const router = useRouter();
	const setProfileCompleted = useUserStore((s) => s.setProfileCompleted);
	const user = useUserStore((s) => s.user);

	const [step, setStep] = useState<Step>(1);
	const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
	const fileRef = useRef<HTMLInputElement | null>(null);

	const [fullName, setFullName] = useState("");
	const [birthday, setBirthday] = useState(""); // DD/MM/YYYY
	const [location, setLocation] = useState("");
	const [selectedInterest, setSelectedInterest] = useState<string | null>(null);

	const [errors, setErrors] = useState<Record<string, string>>({});
	const [submitting, setSubmitting] = useState(false);
	const [studentId, setStudentId] = useState<string | null>(null);

	// Academic form fields
	const [academicStatus, setAcademicStatus] = useState("");
	const [preferredStream, setPreferredStream] = useState("");
	const [graduationType, setGraduationType] = useState("");
	const [studyingIn, setStudyingIn] = useState("");
	const [lookingFor, setLookingFor] = useState("");
	const [academicLevel, setAcademicLevel] = useState("");
	const [stream, setStream] = useState("");
	const [passoutYear, setPassoutYear] = useState("");
	const [highestEducation, setHighestEducation] = useState("");
	const [hasBacklogs, setHasBacklogs] = useState("");
	const [englishTestStatus, setEnglishTestStatus] = useState("");
	const [testType, setTestType] = useState("");
	const [overallScore, setOverallScore] = useState("");
	const [examDate, setExamDate] = useState("");
	const [studyGoals, setStudyGoals] = useState("");
	const [budgetPerYear, setBudgetPerYear] = useState("");
	const [preferredCountries, setPreferredCountries] = useState<string[]>([]);
	const [passportStatus, setPassportStatus] = useState("");
	const [additionalInfo, setAdditionalInfo] = useState("");
	// Study Abroad step 2: country picker UI state
	const [showAllCountries, setShowAllCountries] = useState(false);
	const [countrySearch, setCountrySearch] = useState("");
	const topDestinations = ["USA","Australia","UK","Canada","Ireland","Germany"];
	const allCountries = [
		"USA","Australia","UK","Canada","Ireland","Germany",
		"New Zealand","France","Sweden","Netherlands","Italy","Singapore",
		"Austria","Spain","Switzerland","Lithuania","Poland","Malaysia",
		"Japan","UAE","Finland"
	];

	const countryToFlag: Record<string,string> = {
		USA: "🇺🇸",
		Australia: "🇦🇺",
		UK: "🇬🇧",
		Canada: "🇨🇦",
		Ireland: "🇮🇪",
		Germany: "🇩🇪",
		"New Zealand": "🇳🇿",
		France: "🇫🇷",
		Sweden: "🇸🇪",
		Netherlands: "🇳🇱",
		Italy: "🇮🇹",
		Singapore: "🇸🇬",
		Austria: "🇦🇹",
		Spain: "🇪🇸",
		Switzerland: "🇨🇭",
		Lithuania: "🇱🇹",
		Poland: "🇵🇱",
		Malaysia: "🇲🇾",
		Japan: "🇯🇵",
		UAE: "🇦🇪",
		Finland: "🇫🇮",
	};

	// Build public image path for a given country name using lowercase filename
	const getCountryImageSrc = (name: string) => `/${name.toLowerCase()}.png`;

	// Coaching Centers: derive stream options from selected academic level
	const coachingStreamOptions = useMemo(() => {
		switch (academicLevel) {
			case "Completed Class 10":
				return ["State Board", "CBSE", "ICSE", "Other's"];
			case "Completed Class 12":
			case "Studying in Class 11":
			case "Studying in Class 12":
				return ["MPC", "BiPC", "CEC", "HEC", "Other's", "Not Decided"];
			case "Pursuing Under Graduation":
			case "Completed Under Graduation":
				return ["B.Tech", "BBA", "B.Sc", "B.Com", "BCA", "B.A", "Other's", "Not Decided"];
			case "Pursuing Post Graduation":
			case "Completed Post Graduation":
				return ["M.Tech", "MBA", "M.Sc", "M.Com", "MCA", "Other's", "Not Decided"];
			default:
				return ["General", "Other's"];
		}
	}, [academicLevel]);

	// Reset stream when academic level changes (so stale selection doesn't persist)
	useEffect(() => {
		setStream("");
	}, [academicLevel]);

	// Prefill from profile (Google OAuth data may populate name/picture)
	useEffect(() => {
		let mounted = true;
		(async () => {
			try {
				const res = await studentDashboardAPI.getProfile();
				const p = res?.data;
				if (!mounted || !p) return;
				if (p.name && !fullName) {
					setFullName(p.name);
					// Automatically validate the name and show error if invalid
					const nameError = validateNameInstant(p.name);
					if (nameError) {
						setErrors(prev => ({ ...prev, fullName: nameError }));
					}
				}
				if (p.profilePicture) setAvatarUrl(p.profilePicture);
				// If backend returns birthday, format it
				if (p.birthday && !birthday) setBirthday(formatISOToDDMMYYYY(p.birthday));
			} catch (e) {
				// fallback to Zustand
				if (user?.name && !fullName) {
					setFullName(user.name);
					// Automatically validate the name and show error if invalid
					const nameError = validateNameInstant(user.name);
					if (nameError) {
						setErrors(prev => ({ ...prev, fullName: nameError }));
					}
				}
			}
		})();
		return () => {
			mounted = false;
		};
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const progressPct = useMemo(() => {
		// Step 1-4: Personal info (12%)
		if (step < 5) return 12;
		// Step 5: Interest selection (25%)
		if (step === 5) return 25;
		// Step 6: Academic form (50%)
		if (step === 6) return 50;
		// Step 7+: Additional forms for complex interests (75%)
		if (step === 7) return 75;
		// Final step (100%)
		return 100;
	}, [step]);

	const validatePersonal = useCallback(() => {
		const nextErrors: Record<string, string> = {};
		const nameMsg = validateNameInstant(fullName);
		if (nameMsg) nextErrors.fullName = nameMsg;
		const dobMsg = validateDateInstant(birthday, true);
		if (dobMsg) nextErrors.birthday = dobMsg;
		const locMsg = validateLocationInstant(location);
		if (locMsg) nextErrors.location = locMsg;
		setErrors(nextErrors);
		return Object.keys(nextErrors).length === 0;
	}, [fullName, birthday, location]);

	const canContinuePersonal = useMemo(() => {
		return !validateNameInstant(fullName) && !validateDateInstant(birthday, true) && !validateLocationInstant(location);
	}, [fullName, birthday, location]);

	const onPickAvatar = () => fileRef.current?.click();
	const onAvatarChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
		const f = e.target.files?.[0];
		if (!f) return;
		const reader = new FileReader();
		reader.onload = () => setAvatarUrl(String(reader.result));
		reader.readAsDataURL(f);
	};

	const handleContinue = async () => {
		// Single-screen personal form: when valid, directly submit and move to interests
		if (step < 5) {
			if (!validatePersonal()) return;
			setSubmitting(true);
			try {
				console.log("User data:", user);
				
				// First get the current user profile to get the user ID
				const profileRes = await studentDashboardAPI.getProfile();
				const currentUser = profileRes?.data;
				
				if (!currentUser || !currentUser.id) {
					throw new Error("Unable to get user profile. Please try logging in again.");
				}
				
				const payload = {
					name: fullName.trim(),
					email: user?.email || "",
					contactNumber: user?.phone && /^\d{10}$/.test(user.phone) ? user.phone : undefined,
					address: location.trim(),
				};
				console.log("Sending payload to update user:", payload);
				
				// Update the existing user using the correct endpoint
				const res = await apiRequest(`/v1/students/${currentUser.id}`, {
					method: "PUT",
					body: JSON.stringify(payload),
				});
				console.log("API response:", res);
				
				// Use the current user's ID as the student ID
				setStudentId(currentUser.id);
				setStep(5);
			} catch (e) {
				console.error("Error updating student profile:", e);
				setErrors((p) => ({ ...p, submit: e instanceof Error ? e.message : "Failed to save" }));
			} finally {
				setSubmitting(false);
			}
			return;
		}

		// Step 5 -> interest selected, move to academic form
		if (step === 5) {
			if (!selectedInterest) {
				setErrors({ interest: "Please select an interest" });
				return;
			}
			// If Study Halls selected, complete onboarding on Continue
			if (selectedInterest === 'study_halls') {
				try {
					setSubmitting(true);
					if (!studentId) {
						const profileRes = await studentDashboardAPI.getProfile();
						const sid = (profileRes as any)?.data?._id || (profileRes as any)?._id || (profileRes as any)?.data?.id || (profileRes as any)?.id || null;
						setStudentId(sid);
					}
					setProfileCompleted(true);
					router.replace('/dashboard');
				} catch (e) {
					console.error('Study Halls quick-complete on continue failed', e);
					setErrors((p) => ({ ...p, submit: e instanceof Error ? e.message : 'Failed to complete onboarding' }));
				} finally {
					setSubmitting(false);
				}
				return;
			}
			setStep(6);
			return;
			}

		// Step 6 -> academic form completed, handle submission or move to next step
		if (step === 6) {
			if (!studentId) {
				setErrors({ submit: "Student not initialized. Please go back and try again." });
				return;
			}

			// Validate required fields based on selected interest
			const validationError = validateAcademicForm();
			if (validationError) {
				setErrors({ submit: validationError });
				return;
			}

			// For Study Abroad: always go to the next UI (Step 7) after first screen
			if (selectedInterest === "STUDY_ABROAD") {
				setStep(7);
				return;
			}

			// For other interests, submit the academic profile
			await submitAcademicProfile();
			return;
		}

		// Step 7 -> additional form for complex interests
		if (step === 7) {
			// For Study Abroad: validate step 2 fields before submitting
			if (selectedInterest === "STUDY_ABROAD") {
				const err = validateStudyAbroadStep2();
				if (err) {
					setErrors({ submit: err });
					return;
				}
			}
			await submitAcademicProfile();
			return;
		}
	};

	const validateAcademicForm = (): string | null => {
			switch (selectedInterest) {
				case "KINDERGARTEN":
				if (!academicStatus) return "Please select your academic status";
					break;
				case "SCHOOL":
				case "INTERMEDIATE":
				if (!studyingIn) return "Please select what you're studying in";
				if (!preferredStream) return "Please select your preferred stream";
					break;
				case "GRADUATION":
				if (!graduationType) return "Please select graduation type";
				if (!studyingIn) return "Please select what you're studying in";
				if (!preferredStream) return "Please select your preferred stream";
					break;
			case "COACHING_CENTER":
				if (!lookingFor) return "Please select what you're looking for";
				if (!academicLevel) return "Please select your academic level";
				if (!stream) return "Please select your stream";
				if (!passoutYear) return "Please enter your passout year";
					break;
				case "STUDY_ABROAD":
				if (!highestEducation) return "Please select your highest education";
				if (!hasBacklogs) return "Please specify if you have backlogs";
				if (!englishTestStatus) return "Please select your English test status";
				if (englishTestStatus === "Already have my exam score") {
					if (!testType) return "Please select test type";
					if (!overallScore) return "Please enter your overall score";
					if (!examDate) return "Please enter exam date";
				}
					break;
			}
		return null;
	};

	const validateStudyAbroadStep2 = (): string | null => {
		if (!studyGoals) return "Please specify what you want to study";
		if (!budgetPerYear) return "Please select your budget range";
		if (preferredCountries.length === 0) return "Please select at least one preferred country";
		if (preferredCountries.length > 3) return "You can select up to 3 countries";
		if (!passportStatus) return "Please specify your passport status";
		return null;
	};

	const submitAcademicProfile = async () => {
			setSubmitting(true);
			try {
			// Build details object based on selected interest
			let details: any = {};
			let profileTypeToSend = selectedInterest;

			switch (selectedInterest) {
				case "KINDERGARTEN":
					// Map frontend values to backend expected values
					let status = "CURRENTLY_IN";
					if (academicStatus === "Completed Kindergarten") status = "COMPLETED";
					if (academicStatus === "Seeking Admission to Kindergarten") status = "SEEKING_ADMISSION";
					details = { status };
					break;

				case "SCHOOL":
				case "INTERMEDIATE":
					details = { studyingIn, preferredStream };
					break;

				case "GRADUATION":
					// Map frontend values to backend expected values
					let graduationTypeMapped = "UNDER_GRADUATE";
					if (graduationType === "Post Graduation") graduationTypeMapped = "POST_GRADUATE";
					details = { graduationType: graduationTypeMapped, studyingIn, preferredStream };
					break;

				case "COACHING_CENTER":
					profileTypeToSend = "COACHING_CENTER";
					// Map frontend values to backend expected values
					let lookingForMapped = "EXAM_PREPARATION";
					if (lookingFor === "Upskilling / Skill Development") lookingForMapped = "UPSKILLING_SKILL_DEVELOPMENT";
					if (lookingFor === "Vocational Training") lookingForMapped = "VOCATIONAL_TRAINING";
					details = { 
						lookingFor: lookingForMapped, 
						academicLevel, 
						stream, 
						passoutYear 
					};
					break;

				case "STUDY_ABROAD":
					details = {
						highestEducation,
						hasBacklogs,
						englishTestStatus,
						...(englishTestStatus === "Already have my exam score" && {
							testType,
							overallScore,
							examDate
						}),
						studyGoals: studyGoals || "Not specified",
						budgetPerYear: budgetPerYear || "Not specified", 
						preferredCountries: preferredCountries.length > 0 ? preferredCountries : ["Not specified"],
						passportStatus: passportStatus === "Yes" ? "YES" : passportStatus === "No" ? "NO" : "APPLIED"
					};
					break;

				case "TUITION_CENTER":
					details = { studyingIn, preferredStream };
					break;

				case "STUDY_HALLS":
					details = { any: true };
					break;
			}

			console.log("Sending academic profile:", { profileType: profileTypeToSend, details });

			await studentOnboardingAPI.updateAcademicProfile(studentId!, {
				profileType: profileTypeToSend as any,
					details,
				});
				setProfileCompleted(true);
				router.replace("/dashboard");
			} catch (e) {
			console.error("Error submitting academic profile:", e);
				setErrors((p) => ({ ...p, submit: e instanceof Error ? e.message : "Failed to save academic profile" }));
			} finally {
				setSubmitting(false);
		}
	};

	const renderProgress = (
		<div className="w-full h-[4px] bg-[#E9ECF4] rounded-full">
			<div
				className="h-[4px] bg-[#0A46E4] rounded-full transition-all"
				style={{ width: `${progressPct}%` }}
			/>
		</div>
	);

	const avatar = (
		<div className="flex flex-col items-center gap-4 mt-6">
			<div className="relative w-[120px] h-[120px] rounded-full bg-gray-200 overflow-hidden shadow-sm">
				{avatarUrl ? (
					<img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
				) : (
					<div className="w-full h-full flex items-center justify-center text-white" style={{ background: "linear-gradient(135deg,#4F46E5,#2563EB)" }}>
						<span className="text-3xl font-semibold select-none">
							{(fullName || "").trim().split(" ").slice(0,2).map(w => w[0]).filter(Boolean).join("") || ""}
						</span>
					</div>
				)}
				<button
					onClick={onPickAvatar}
					className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-[#0A46E4] text-white grid place-items-center shadow"
				>
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
						<path d="M12 5l7 7-7 7-7-7 7-7z" />
					</svg>
				</button>
				<input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onAvatarChange} />
			</div>
		</div>
	);

	const field = (
		name: "fullName" | "birthday" | "location",
		label: string,
		placeholder: string,
		value: string,
		onChange: (v: string) => void,
		keyboard?: React.HTMLInputAutoCompleteAttribute,
		maxLength?: number
	) => (
		<div className="flex flex-col gap-1">
			<span className={labelCls}>{label}</span>
			<input
				className={[inputBase, errors[name] ? inputError : inputIdle].join(" ")}
				placeholder={placeholder}
				value={value}
				onChange={(e) => onChange(e.target.value)}
				autoComplete={keyboard}
				maxLength={maxLength}
			/>
			{errors[name] && (
				<span className="text-[12px] text-red-500">{errors[name]}</span>
			)}
		</div>
	);

	const personalForm = (
		<div className="flex flex-col gap-4 mt-6">
			<FormField
				label="Full Name"
					value={fullName}
				onChange={(v) => {
						setFullName(v);
						const msg = validateNameInstant(v);
						setErrors((prev) => {
							const n = { ...prev } as Record<string, string>;
							if (msg) n.fullName = msg; else delete n.fullName;
							return n;
						});
					}}
				error={errors.fullName}
					maxLength={80}
				floating
				/>

			<DateInput
				label="Birthday"
					value={birthday}
				onChange={(v) => {
						setBirthday(v);
					const msg = validateDateInstant(v, true);
						setErrors((prev) => {
							const n = { ...prev } as Record<string, string>;
							if (msg) n.birthday = msg; else delete n.birthday;
							return n;
						});
					}}
				error={errors.birthday}
				isBirthday={true}
				floating
			/>

			<FormField
				label="Location"
					value={location}
				onChange={(v) => {
						setLocation(v);
						const msg = validateLocationInstant(v);
						setErrors((prev) => {
							const n = { ...prev } as Record<string, string>;
							if (msg) n.location = msg; else delete n.location;
							return n;
						});
					}}
				error={errors.location}
					maxLength={120}
				floating
				/>
		</div>
	);

	const interestsGrid = (
		<div className="grid grid-cols-2 gap-4 mt-4">
			{interests.map((c) => (
		<button
					key={c.key}
			onClick={() => {
				setSelectedInterest(c.key);
			}}
					className={`h-[96px] rounded-[16px] text-left p-4 shadow-sm border ${
						selectedInterest === c.key ? "ring-2 ring-[#0A46E4]" : "border-transparent"
					}`}
					style={{ background: c.color, color: "#ffffff" }}
				>
					<div className="text-[14px] font-semibold">{c.label}</div>
				</button>
			))}
		</div>
	);

	const renderAcademicForm = () => {
		switch (selectedInterest) {
			case "KINDERGARTEN":
				return (
					<div className="flex flex-col gap-4 mt-6">
						<RadioGroup
							label="Academic Status"
							name="academicStatus"
							value={academicStatus}
							onChange={setAcademicStatus}
							options={["Currently in Kindergarten", "Completed Kindergarten", "Seeking Admission to Kindergarten"]}
							error={errors.academicStatus}
						/>
					</div>
				);

			case "SCHOOL":
				return (
					<div className="flex flex-col gap-4 mt-6">
						<div className="transition">
							<span className={labelCls}>Academic Status</span>
							<Dropdown
								label="Select studying in"
								value={studyingIn}
								onChange={setStudyingIn}
								options={[
									"Completed Class 10th",
									"Class 10th",
									"Class 9th",
									"Class 8th",
									"Class 7th",
									"Class 6th",
									"Class 5th",
									"Class 4th",
									"Class 3rd",
									"Class 2nd",
									"Class 1st",
								]}
								error={errors.studyingIn}
							/>
							{errors.studyingIn && (
								<span className="text-[12px] text-red-500">{errors.studyingIn}</span>
							)}
						</div>

						<div className="transition">
							<span className={labelCls}>Preferred Stream</span>
							<Dropdown
								label="Select Your Preferred Stream"
								value={preferredStream}
								onChange={setPreferredStream}
								options={[
									"MPC (Engineering)",
									"BiPC (Medical)",
									"CEC (Commerce)",
									"HEC (History)",
									"Other's",
									"Not Decided",
								]}
								error={errors.preferredStream}
							/>
							{errors.preferredStream && (
								<span className="text-[12px] text-red-500">{errors.preferredStream}</span>
							)}
						</div>
					</div>
				);

			case "INTERMEDIATE":
				return (
					<div className="flex flex-col gap-4 mt-6">
						<div className="transition">
							<span className={labelCls}>Academic Status</span>
							<Dropdown
								label="Select studying in"
								value={studyingIn}
								onChange={setStudyingIn}
								options={[
									"Class 12th Passed",
									"Class 12th",
									"Class 11th",
									
								]}
								error={errors.studyingIn}
							/>
							{errors.studyingIn && (
								<span className="text-[12px] text-red-500">{errors.studyingIn}</span>
							)}
						</div>

						<div className="transition">
							<span className={labelCls}>Preferred Stream</span>
							<Dropdown
								label="Select Your Preferred Stream"
								value={preferredStream}
								onChange={setPreferredStream}
								options={[
									"Engineering (B.E./B.Tech.)",
									"Medical Sciences",
									"Arts and Humanities (B.A.)",
									"Science (B.Sc.)",
									"Commerce (B.Com.)",
									"Business Administration (BBA)",
									"Computer Applications (BCA)",
									"Fine Arts (BFA)",
									"Law (L.L.B./Integrated Law Courses)",
									"Other's",
								]}
								error={errors.preferredStream}
							/>
							{errors.preferredStream && (
								<span className="text-[12px] text-red-500">{errors.preferredStream}</span>
							)}
						</div>
					</div>
				);

			case "GRADUATION":
				return (
					<div className="flex flex-col gap-4 mt-6">
						<div className="transition">
							<span className={labelCls}>Graduation type</span>
							<select
								className={[inputBase, errors.graduationType ? inputError : inputIdle].join(" ")}
								value={graduationType}
								onChange={(e) => setGraduationType(e.target.value)}
							>
								<option value="">Select graduation type</option>
								<option value="Under Graduation">Under Graduation</option>
								<option value="Post Graduation">Post Graduation</option>
							</select>
							{errors.graduationType && (
								<span className="text-[12px] text-red-500">{errors.graduationType}</span>
							)}
						</div>

						{graduationType === "Under Graduation" && (
							<>
								<div className="transition">
									<span className={labelCls}>Academic Status</span>
									<Dropdown
										label="Select studying in"
										value={studyingIn}
										onChange={setStudyingIn}
										options={[
											"Passed Out",
											"1st Year",
											"2nd Year",
											"3rd Year",
											"4th Year",
										]}
										error={errors.studyingIn}
									/>
									{errors.studyingIn && (
										<span className="text-[12px] text-red-500">{errors.studyingIn}</span>
									)}
								</div>

								<div className="transition">
									<span className={labelCls}>Preferred Stream</span>
									<Dropdown
										label="Select Your Preferred Stream"
										value={preferredStream}
										onChange={setPreferredStream}
										options={[
											"B.Tech",
											"B.Sc",
											"B.A",
											"B.Com",
											"BBA",
											"BCA",
											"BFA",
											"L.L.B",
											"B.Pharmacy",
											"Other's",
											"Not Decided",
										]}
										error={errors.preferredStream}
									/>
									{errors.preferredStream && (
										<span className="text-[12px] text-red-500">{errors.preferredStream}</span>
									)}
								</div>
							</>
						)}

						{graduationType === "Post Graduation" && (
							<div>
								<div className="transition">
									<span className={labelCls}>Academic Status</span>
									<Dropdown
										label="Select studying in"
										value={studyingIn}
										onChange={setStudyingIn}
										options={[
											"PG Passed",
											"1st Year",
											"2nd Year",
										]}
										error={errors.studyingIn}
									/>
									{errors.studyingIn && (
										<span className="text-[12px] text-red-500">{errors.studyingIn}</span>
									)}
								</div>

								<div className="transition">
									<span className={labelCls}>Preferred Stream</span>
									<Dropdown
										label="Select Your Preferred Stream"
										value={preferredStream}
										onChange={setPreferredStream}
										options={[
											"MBA",
											"MCA",
											"M.SC",
											"MS",
											"M.TECH",
											"M.COM",
											"M.PHARMACY",
											"L.L.M",
											"Other's",
										]}
										error={errors.preferredStream}
									/>
									{errors.preferredStream && (
										<span className="text-[12px] text-red-500">{errors.preferredStream}</span>
									)}
								</div>
							</div>
						)}
					</div>
				);

			case "COACHING_CENTER":
				return (
					<div className="flex flex-col gap-4 mt-6">
						<RadioGroup
							label="What are you looking for?"
							name="lookingFor"
							value={lookingFor}
							onChange={setLookingFor}
							options={["Upskilling / Skill Development", "Exam Preparation", "Vocational Training"]}
							error={errors.lookingFor}
						/>

						<div className="transition">
							<span className={labelCls}>What is your academic level?</span>
							<Dropdown
								label="Select your academic status"
								value={academicLevel}
								onChange={setAcademicLevel}
								options={[
									"Completed Class 10",
									"Studying in Class 11",
									"Studying in Class 12",
									"Completed Class 12",
									"Pursuing Under Graduation",
									"Completed Under Graduation",
									"Pursuing Post Graduation",
									"Completed Post Graduation",
								]}
								error={errors.academicLevel}
							/>
							{errors.academicLevel && (
								<span className="text-[12px] text-red-500">{errors.academicLevel}</span>
							)}
						</div>

						<div className="transition">
							<span className={labelCls}>Stream</span>
							<Dropdown
								label="Select your stream"
								value={stream}
								onChange={setStream}
								options={coachingStreamOptions}
								error={errors.stream}
							/>
							{errors.stream && (
								<span className="text-[12px] text-red-500">{errors.stream}</span>
							)}
						</div>

						<FormField
							label="Passout Year"
							placeholder="Enter year"
							value={passoutYear ?? ""}
							onChange={(v) => setPassoutYear(v)}
							error={errors.passoutYear}
							maxLength={4}
						/>
					</div>
				);

			case "STUDY_ABROAD":
				return (
					<div className="flex flex-col gap-4 mt-6">
						<RadioGroup
							label="Highest Level of Education"
							name="highestEducation"
							value={highestEducation}
							onChange={setHighestEducation}
							options={["12th Grade", "Bachelor's", "Master's"]}
							error={errors.highestEducation}
						/>

						<RadioGroup
							label="Do you have any backlogs?"
							name="hasBacklogs"
							value={hasBacklogs}
							onChange={setHasBacklogs}
							options={["Yes", "No"]}
							error={errors.hasBacklogs}
							layout="horizontal"
						/>

						<div className="transition">
							<span className={labelCls}>English Test Status</span>
							<Dropdown
								label="Select Test Status"
								value={englishTestStatus}
								onChange={setEnglishTestStatus}
								options={[
									"Haven't decided yet",
									"Preparing for the exam",
									"Booked my exam",
									"Awaiting results",
									"Already have my exam score",
								]}
								error={errors.englishTestStatus}
							/>
						</div>

						{englishTestStatus === "Already have my exam score" && (
							<>
								<div className="transition">
									<span className={labelCls}>Test Type</span>
									<div className="flex flex-wrap gap-2 mt-2">
										{["IELTS", "PTE", "TOEFL", "Duolingo"].map((opt) => (
											<button
												key={opt}
												type="button"
												onClick={() => setTestType(opt)}
												className={`px-4 h-[40px] rounded-[10px] border text-[14px] ${testType === opt ? "bg-[#0A46E4] text-[#ffffff]" : "border-gray-200 bg-white font-semibold"}`}
											>
												{opt}
											</button>
										))}
									</div>
									{errors.testType && <span className="text-[12px] text-red-500">{errors.testType}</span>}
								</div>

								<FormField
									label="Overall Score"
									placeholder="e.g., 7.5"
									value={overallScore ?? ""}
									onChange={(v) => setOverallScore(v)}
									error={errors.overallScore}
								/>

								<DateInput
									label="Date of Exam"
									value={examDate ?? ""}
									onChange={(v) => {
										setExamDate(v);
										const msg = validateDateInstant(v);
										setErrors((prev) => {
											const n = { ...prev } as Record<string, string>;
											if (msg) n.examDate = msg; else delete n.examDate;
											return n;
										});
									}}
									error={errors.examDate}
								/>
							</>
						)}
					</div>
				);

			case "TUITION_CENTER":
				return (
					<div className="flex flex-col gap-4 mt-6">
						<div className="transition">
							<span className={labelCls}>Academic Status</span>
							<Dropdown
								label="Select studying in"
								value={studyingIn}
								onChange={setStudyingIn}
								options={[
									"6th Grade",
									"7th Grade",
									"8th Grade",
									"9th Grade",
									"10th Grade",
									"11th Grade",
									"12th Grade",
								]}
								error={errors.studyingIn}
							/>
							{errors.studyingIn && (
								<span className="text-[12px] text-red-500">{errors.studyingIn}</span>
							)}
						</div>

						<div className="transition">
							<span className={labelCls}>Preferred Stream</span>
							<Dropdown
								label="Select Your Preferred Stream"
								value={preferredStream}
								onChange={setPreferredStream}
								options={[
									"Math",
									"Science",
									"English",
									"Social Studies",
								]}
								error={errors.preferredStream}
							/>
							{errors.preferredStream && (
								<span className="text-[12px] text-red-500">{errors.preferredStream}</span>
							)}
						</div>
					</div>
				);

			default:
				return (
					<div className="flex flex-col gap-4 mt-6">
						<div className="text-center font-semibold">
							Please select an academic interest to continue.
						</div>
					</div>
				);
		}
	};

	const renderAdditionalForm = () => (
		<div className="flex flex-col gap-4 mt-6">
			<div className="transition">
				<span className={labelCls}>Additional Information</span>
				<textarea
					className={[inputBase, errors.additionalInfo ? inputError : inputIdle].join(" ")}
					placeholder="e.g., Any specific requirements, preferences, etc."
					value={additionalInfo}
					onChange={(e) => {
						setAdditionalInfo(e.target.value);
						setErrors((prev) => {
							const n = { ...prev } as Record<string, string>;
							if (e.target.value === "") delete n.additionalInfo;
							return n;
						});
					}}
					rows={3}
				/>
				{errors.additionalInfo && (
					<span className="text-[12px] text-red-500">{errors.additionalInfo}</span>
				)}
			</div>
		</div>
	);

	const renderStudyAbroadStep2 = () => (
		<div className="flex flex-col gap-4 mt-6">
			<FormField
				label="What do you want to study?"
				placeholder="e.g., Master's in Computer Science"
				value={studyGoals ?? ""}
				onChange={(v) => setStudyGoals(v)}
				error={errors.studyGoals}
			/>

			<div className="transition">
				<span className={labelCls}>What is your budget per year?</span>
				<Dropdown
					label="Select budget range"
					value={budgetPerYear}
					onChange={setBudgetPerYear}
					options={["Below \u20B910 Lakhs", "\u20B910 Lakhs - \u20B920 Lakhs", "\u20B920 Lakhs - \u20B930 Lakhs","\u20B930 Lakhs - \u20B940 Lakhs","\u20B940 Lakhs - \u20B950 Lakhs","Above \u20B950 Lakhs"]}
					error={errors.budgetPerYear}
				/>
			</div>

			<div className="transition">
				<span className={labelCls}>Preferred Countries</span>
				<div className="text-[12px] text-gray-500 mb-2">You can select up to 3 countries</div>
				{!showAllCountries ? (
					<>
						<div className="flex items-center justify-between text-[12px] font-semibold mb-2">
							<span>Top Destinations</span>
							<button type="button" className="text-[#0A46E4] flex items-center gap-1" onClick={() => setShowAllCountries(true)}>
								<span>See all</span>
								<svg className="w-3 h-3" viewBox="0 0 20 20" fill="none" stroke="#0A46E4" strokeWidth="2"><path d="M7 5l6 5-6 5"/></svg>
							</button>
						</div>
						<div className="grid grid-cols-3 gap-2">
							{topDestinations.map((country) => {
								const selected = preferredCountries.includes(country);
								return (
									<button
										key={country}
										type="button"
										onClick={() => {
											setPreferredCountries((prev) => {
												if (prev.includes(country)) return prev.filter((c) => c !== country);
												if (prev.length >= 3) return prev; // limit 3
												return [...prev, country];
											});
										}}
										className={`h-[88px] rounded-[12px] border text-[12px] flex flex-col items-center justify-center bg-white gap-1 ${selected ? "border-[#0A46E4] ring-2 ring-[#0A46E4]/20" : "border-gray-200"}`}
									>
										<img
											src={getCountryImageSrc(country)}
											alt={`${country} flag`}
											className="w-[40px] h-[40px] rounded-full object-cover"
											onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/globe.svg"; }}
										/>
										<div className="font-semibold">{country}</div>
									</button>
								);
							})}
						</div>
					</>
				) : (
					<div className="border border-gray-200 rounded-[12px] p-3">
						<div className="text-[12px] font-semibold mb-2">Select country</div>
						<div className="grid grid-cols-3 gap-2 max-h-80 overflow-auto">
							{allCountries.map((country) => {
								const selected = preferredCountries.includes(country);
							return (
								<button
										key={country}
										type="button"
										onClick={() => {
											setPreferredCountries((prev) => {
												if (prev.includes(country)) return prev.filter((c) => c !== country);
												if (prev.length >= 3) return prev; // limit 3
												return [...prev, country];
											});
										}}
									className={`h-[80px] rounded-[12px] border text-[12px] flex flex-col items-center justify-center bg-white gap-1 ${selected ? "border-[#0A46E4] ring-2 ring-[#0A46E4]/20" : "border-gray-200"}`}
									>
										<img
											src={getCountryImageSrc(country)}
											alt={`${country} flag`}
											className="w-[36px] h-[36px] rounded-full object-cover"
											onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/globe.svg"; }}
										/>
										<span>{country}</span>
									</button>
								);
							})}
						</div>
						<div className="mt-3">
							<button type="button" onClick={() => setShowAllCountries(false)} className="w-full h-[44px] rounded-[12px] bg-[#0A46E4] text-white">Done</button>
						</div>
					</div>
				)}
				{errors.preferredCountries && <span className="text-[12px] text-red-500">{errors.preferredCountries}</span>}
			</div>

			<RadioGroup
				label="Do you have a valid passport?"
				name="passportStatus"
				value={passportStatus}
				onChange={setPassportStatus}
				options={["Yes", "No", "Applied"]}
				error={errors.passportStatus}
				layout="horizontal"
			/>
		</div>
	);

	const renderCountryPickerFull = () => {
		const matches = (q: string, name: string) => name.toLowerCase().includes(q.trim().toLowerCase());
		const top = topDestinations.filter((c) => matches(countrySearch, c));
		const popular = ["New Zealand","France","Sweden","Netherlands","Italy","Singapore"].filter((c) => matches(countrySearch, c));
		const more = ["Austria","Spain","Switzerland","Lithuania","Poland","Malaysia","Japan","UAE","Finland"].filter((c) => matches(countrySearch, c));
		const Card: React.FC<{ name: string }> = ({ name }) => {
			const selected = preferredCountries.includes(name);
			return (
				<button
					key={name}
					type="button"
					onClick={() => {
						setPreferredCountries((prev) => {
							if (prev.includes(name)) return prev.filter((c) => c !== name);
							if (prev.length >= 3) return prev;
							return [...prev, name];
						});
					}}
					className={`h-[90px] rounded-[14px] border bg-white flex flex-col items-center justify-center gap-1 ${selected ? "border-[#0A46E4] ring-2 ring-[#0A46E4]/20" : "border-gray-200"}`}
				>
					<img
						src={getCountryImageSrc(name)}
						alt={`${name} flag`}
						className={`w-[46px] h-[46px] rounded-full object-cover ${selected ? "ring-2 ring-[#0A46E4]" : "ring-0"}`}
						onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/globe.svg"; }}
					/>
					<div className="text-[11px] font-semibold leading-none mt-1">{name}</div>
				</button>
			);
		};

		return (
			<div className="mt-4">
				<div className="mb-3">
					<div className="relative">
						<input
							className={[inputBase, inputIdle, "pl-9"].join(" ")}
							placeholder="Find your country"
							value={countrySearch}
							onChange={(e) => setCountrySearch(e.target.value || "")}
						/>
						<svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
					</div>
				</div>

				<div className="text-[12px] font-semibold mb-2">Top Destinations</div>
				<div className="grid grid-cols-3 gap-3 mb-4">
					{top.map((c) => (<Card key={c} name={c} />))}
				</div>

				<div className="text-[12px] font-semibold mb-2">Other Popular Choices</div>
				<div className="grid grid-cols-3 gap-3 mb-4">
					{popular.map((c) => (<Card key={c} name={c} />))}
				</div>

				<div className="text-[12px] font-semibold mb-2">More Options</div>
				<div className="grid grid-cols-3 gap-3 max-h-64">
					{more.map((c) => (<Card key={c} name={c} />))}
				</div>

				<div className="mt-4 pt-12">
					<button
						type="button"
						disabled={preferredCountries.length === 0}
						onClick={() => setShowAllCountries(false)}
						className={`w-full h-[46px] rounded-[12px] ${preferredCountries.length === 0 ? "bg-gray-200 font-semibold" : "bg-gradient-to-r from-[#1A4BFF] to-[#0A46E4] text-white"}`}
					>
						Done
					</button>
				</div>
			</div>
		);
	};

	return (
		<main className="min-h-screen bg-[#F5F6F9] flex items-start justify-center p-0 sm:p-6 overflow-hidden">
			<section className="w-full max-w-md bg-white rounded-none sm:rounded-[20px] shadow-sm p-5 flex flex-col h-[100vh] sm:h-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
				<button
					className="w-8 h-8 grid place-items-center rounded-full hover:bg-gray-100"
					onClick={() => setStep((s) => (s > 1 ? ((s - 1) as Step) : s))}
					aria-label="Back"
				>
					<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2">
						<path d="M15 18l-6-6 6-6" />
					</svg>
				</button>

				<div className="mt-3">{renderProgress}</div>

				<h2 className="mt-4 text-[18px] font-semibold text-[#111827]">
					{step === 5
						? "Academic Interests"
						: step === 6
						? "Your Academic Profile"
						: step === 7
						? (showAllCountries ? "Select country" : "Your Study Goals")
						: "Tell us about you"}
				</h2>

				{step <= 4 && avatar}

				{/* Personal form */}
				{step <= 4 && personalForm}

				{/* Interests (no scroll; fit viewport) */}
				{step === 5 && (
					<div className="mt-2 flex-1 flex flex-col overflow-hidden">
						<div className="grid grid-cols-2 gap-3 pt-2 pb-3" style={{
							// ensure the grid itself does not create scroll; we keep items compact
						}}>
							{interests.map((c) => (
								<button
									key={c.key}
									onClick={() => setSelectedInterest(c.key)}
									className={`h-[88px] rounded-[16px] text-left px-4 py-3 shadow-sm border ${
										selectedInterest === c.key ? "ring-2 ring-[#0A46E4]" : "border-transparent"
									}`}
									style={{ background: c.color, color: "#ffffff" }}
								>
									<div className="flex h-full w-full items-center justify-between">
										<div className="whitespace-pre-line text-[13px] font-medium leading-tight pr-2">
											{c.label}
										</div>
										<div className="w-[56px] h-[56px] shrink-0 opacity-95">
											{/* simple inline illustration per category */}
											{(() => {
												switch (c.key) {
													case "SCHOOL":
														return (
															<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
															<rect x="6" y="24" width="52" height="30" rx="4" fill="white" opacity="0.9"/>
															<path d="M8 24l24-12 24 12" stroke="#fff" strokeWidth="4" strokeLinecap="round"/>
															<rect x="26" y="36" width="12" height="18" fill="#fff"/>
														</svg>
														);
													case "KINDERGARTEN":
														return (
															<svg viewBox="0 0 64 64" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
															<circle cx="20" cy="44" r="12" fill="#fff"/>
															<rect x="32" y="20" width="12" height="24" fill="#fff"/>
															<rect x="10" y="20" width="12" height="18" fill="#fff"/>
														</svg>
													);
													case "INTERMEDIATE":
														return (
															<svg viewBox="0 0 64 64" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
															<circle cx="24" cy="40" r="16" fill="#fff"/>
															<rect x="36" y="20" width="18" height="10" fill="#fff"/>
														</svg>
													);
													case "GRADUATION":
														return (
															<svg viewBox="0 0 64 64" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
															<path d="M6 26l26-10 26 10-26 10L6 26z" fill="#fff"/>
															<rect x="20" y="32" width="24" height="10" fill="#fff"/>
														</svg>
													);
													case "COACHING_CENTER":
														return (
															<svg viewBox="0 0 64 64" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
															<circle cx="40" cy="32" r="16" stroke="#fff" strokeWidth="6" fill="none"/>
															<circle cx="40" cy="32" r="6" fill="#fff"/>
														</svg>
													);
													case "STUDY_HALLS":
														return (
															<svg viewBox="0 0 64 64" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
															<rect x="10" y="36" width="44" height="10" fill="#fff"/>
															<rect x="14" y="24" width="12" height="10" fill="#fff"/>
															<rect x="38" y="24" width="12" height="10" fill="#fff"/>
														</svg>
													);
													case "TUITION_CENTER":
														return (
															<svg viewBox="0 0 64 64" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
															<rect x="10" y="20" width="44" height="28" rx="4" fill="#fff"/>
															<rect x="16" y="26" width="20" height="6" fill="#CCC"/>
														</svg>
													);
													case "STUDY_ABROAD":
														return (
															<svg viewBox="0 0 64 64" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
															<path d="M8 40l48-16-10 12 8 8-10 2-8-8-28 2z" fill="#fff"/>
														</svg>
													);
													default:
														return null;
												}
											})()}
										</div>
									</div>
								</button>
							))}
						</div>
					</div>
				)}

				{/* Academic Forms */}
				{step === 6 && renderAcademicForm()}

				{/* Additional Forms for complex interests */}
				{step === 7 && (
					<div className="flex-1 overflow-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
						{/* Heading removed to avoid duplication; main header above handles titles */}
						{showAllCountries ? renderCountryPickerFull() : renderStudyAbroadStep2()}
					</div>
				)}

				{errors.submit && (
					<div className="mt-3 text-[12px] text-red-600">{errors.submit}</div>
				)}

				{!showAllCountries && (
				<div className="mt-auto pt-2">
					<button
						className={buttonCls}
						onClick={handleContinue}
						disabled={submitting || (step < 5 && !canContinuePersonal)}
					>
						{step < 5 ? (submitting ? "Saving..." : "Continue") : (submitting ? "Saving..." : "Continue")}
					</button>
				</div>
				)}
			</section>
		</main>
	);
};

export default StudentonBoarding;
