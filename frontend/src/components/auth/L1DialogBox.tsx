"use client";

import { useState, ChangeEvent, FormEvent, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { validateField, validateForm } from "@/lib/validations/validateField";
import { addInstitutionToDB, getAllInstitutionsFromDB, updateInstitutionInDB } from "@/lib/localDb";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/levels_dialog";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import InputField from "@/components/ui/InputField";
// import { institutionAPI, clearInstitutionData } from "@/lib/api";
import { L1Schema } from "@/lib/validations/L1Schema";

interface FormData {
  instituteType: string;
  instituteName: string;
  approvedBy: string;
  establishmentDate: string;
  contactInfo: string;
  // contactCountryCode: string;              // 👈 add this
  additionalContactInfo: string;
  // additionalContactCountryCode: string;   // 👈 add this
  headquartersAddress: string;
  state: string;
  pincode: string;
  locationURL: string;
}

interface Errors {
  [key: string]: string | undefined;
}

interface L1DialogBoxProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onInstituteTypeChange?: (type: string) => void;
  onSuccess?: () => void;
  schema?: typeof L1Schema; // 👈 dynamic schema
}

export default function L1DialogBox({
  trigger,
  open,
  onOpenChange,
  onInstituteTypeChange,
  onSuccess,
}: L1DialogBoxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    instituteType: "",
    instituteName: "",
    approvedBy: "",
    establishmentDate: "",
    contactInfo: "",
    additionalContactInfo: "",
    headquartersAddress: "",
    state: "",
    pincode: "",
    locationURL: "",
  });

  const [errors, setErrors] = useState<Errors>({});
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Handle controlled open state
  const dialogOpen = open !== undefined ? open : isOpen;
  const setDialogOpen = onOpenChange || setIsOpen;
  const activeSchema = L1Schema;

  // Prefill from IndexedDB if data exists; otherwise keep blanks
  useEffect(() => {
    if (!dialogOpen) return;

    let isMounted = true;
    (async () => {
      try {
        const institutions = await getAllInstitutionsFromDB();
        if (!isMounted) return;

        if (institutions && institutions.length > 0) {
          const latest = institutions.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))[0];
          setFormData({
            instituteType: latest.instituteType || "",
            instituteName: latest.instituteName || "",
            approvedBy: latest.approvedBy || "",
            establishmentDate: latest.establishmentDate || "",
            contactInfo: latest.contactInfo || "",
            additionalContactInfo: latest.additionalContactInfo || "",
            headquartersAddress: latest.headquartersAddress || "",
            state: latest.state || "",
            pincode: latest.pincode || "",
            locationURL: latest.locationURL || "",
          });
        } else {
          // ensure blank state
          setFormData({
            instituteType: "",
            instituteName: "",
            approvedBy: "",
            establishmentDate: "",
            contactInfo: "",
            additionalContactInfo: "",
            headquartersAddress: "",
            state: "",
            pincode: "",
            locationURL: "",
          });
        }
      } catch (err) {
        console.error("Failed to load institutions from IndexedDB", err);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [dialogOpen]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    // update formData
    setFormData((prev) => ({ ...prev, [name]: value }));

    // validate this single field while typing
    const fieldError = validateField(L1Schema, name, value);
    setErrors((prev) => ({
      ...prev,
      [name]: fieldError,
    }));
  };

  interface CountryOption {
    code: string;
    dialCode: string;
    flag: string;
  }

  const countries: CountryOption[] = [
    { code: "IN", dialCode: "+91", flag: "https://flagcdn.com/w20/in.png" },
    { code: "US", dialCode: "+1", flag: "https://flagcdn.com/w20/us.png" },
    { code: "GB", dialCode: "+44", flag: "https://flagcdn.com/w20/gb.png" },
    { code: "AU", dialCode: "+61", flag: "https://flagcdn.com/w20/au.png" },
    { code: "CA", dialCode: "+1", flag: "https://flagcdn.com/w20/ca.png" },
    { code: "AE", dialCode: "+971", flag: "https://flagcdn.com/w20/ae.png" },
    { code: "SG", dialCode: "+65", flag: "https://flagcdn.com/w20/sg.png" },
  ];

  const [selectedCountryContact, setSelectedCountryContact] =
    useState<CountryOption>(countries[0]);
  const [selectedCountryAdditional, setSelectedCountryAdditional] =
    useState<CountryOption>(countries[0]);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleCountrySelect = (
    field: "contact" | "additional",
    country: CountryOption
  ) => {
    if (field === "contact") {
      setSelectedCountryContact(country);
      setFormData((prev) => ({
        ...prev,
        contactCountryCode: country.dialCode,
      }));
    } else {
      setSelectedCountryAdditional(country);
      setFormData((prev) => ({
        ...prev,
        additionalContactCountryCode: country.dialCode,
      }));
    }
  };

  // Reset approvedBy & establishmentDate if instituteType = "Study Halls"
  useEffect(() => {
    if (formData.instituteType === "Study Halls") {
      setFormData((prev) => ({
        ...prev,
        approvedBy: "",
        establishmentDate: "",
      }));
    }
  }, [formData.instituteType]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);

    // ✅ Validate with Joi
    const { error } = activeSchema.validate(formData, { abortEarly: false });

    if (error) {
      const validationErrors: Errors = {};
      error.details.forEach((err) => {
        const fieldName = err.path[0] as string;
        validationErrors[fieldName] = err.message.replace('"value"', fieldName);
      });
      setErrors(validationErrors);
      return;
    }

    // ✅ No errors → proceed
    setErrors({});
    setIsLoading(true);

    try {
      // 1) Load existing institutions
      const institutions = await getAllInstitutionsFromDB();

      // Normalize for comparison (same keys as formData)
      const normalize = (x: any) => ({
        instituteType: x.instituteType || "",
        instituteName: x.instituteName || "",
        approvedBy: x.approvedBy || "",
        establishmentDate: x.establishmentDate || "",
        contactInfo: x.contactInfo || "",
        additionalContactInfo: x.additionalContactInfo || "",
        headquartersAddress: x.headquartersAddress || "",
        state: x.state || "",
        pincode: x.pincode || "",
        locationURL: x.locationURL || "",
      });

      const latest = institutions && institutions.length > 0
        ? institutions.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))[0]
        : null;

      const current = normalize(formData);
      let effectiveId: number | null = null;

      if (latest) {
        const latestNormalized = normalize(latest);
        const isSame = JSON.stringify(latestNormalized) === JSON.stringify(current);

        if (isSame) {
          // Data unchanged → skip saving
          effectiveId = latest.id || null;
        } else {
          // Different → update existing record
          await updateInstitutionInDB({ ...(latest as any), ...current, id: latest.id });
          effectiveId = latest.id || null;
        }
      } else {
        // No record → create new
        const id = await addInstitutionToDB(current);
        effectiveId = id;
        console.log("Institution saved locally with id:", id);
      }

      // 2) Continue normally (set localStorage, close, callbacks)
      if (typeof window !== "undefined") {
        localStorage.setItem("institutionType", current.instituteType);
        if (effectiveId !== null) localStorage.setItem("institutionId", String(effectiveId));
      }

      setDialogOpen(false);

      setSubmitted(false);
      setErrors({});
      onSuccess?.();
    } catch (error) {
      console.error("Error saving/updating institution in IndexedDB:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const [isDropdownOpenAdditional, setIsDropdownOpenAdditional] =
    useState(false);

  const isFormComplete = !activeSchema.validate(formData, { abortEarly: false })
    .error;

  const countryFlags = {
    "+91": "/India-flag.png",
    "+1": "/US-flag.png",
    "+44": "/UK-flag.png",
    "+61": "/Australia-flag.png",
    // add more as needed
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}

      <DialogContent
        className="w-[95vw] sm:w-[90vw] md:w-[800px] lg:w-[900px] xl:max-w-4xl scrollbar-hide"
        showCloseButton={false}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="flex flex-col items-center gap-2">
          <DialogTitle className="font-montserrat font-bold text-xl sm:text-[28px] leading-tight text-center">
            Institution Details
          </DialogTitle>
          <DialogDescription className="font-montserrat font-normal text-sm sm:text-[16px] leading-relaxed text-center text-gray-600">
            Provide key information about your institution to get started
          </DialogDescription>
        </DialogHeader>

        <Card className="w-full sm:p-6 rounded-[24px] bg-white border-0 shadow-none">
          <form onSubmit={handleSubmit}>
            <CardContent className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 gap-4 md:gap-[30px]">
              <div>
                <InputField
                  label="Institute Type"
                  name="instituteType"
                  value={formData.instituteType}
                  onChange={(e) => {
                    handleChange(e);
                    if (onInstituteTypeChange) {
                      onInstituteTypeChange(e.target.value);
                    }
                  }}
                  isSelect
                  options={[
                    "Kindergarten/childcare center",
                    "School's",
                    "Intermediate college(K12)",
                    "Under Graduation/Post Graduation",
                    "Coaching centers",
                    "Study Halls",
                    "Tution Center's",
                    "Study Abroad",
                  ]}
                  required
                  error={
                    submitted || errors.instituteType
                      ? errors.instituteType
                      : ""
                  }
                />
              </div>

              <div>
                <InputField
                  label="Institute Name"
                  name="instituteName"
                  value={formData.instituteName}
                  onChange={handleChange}
                  placeholder="Enter your Institute name"
                  required
                  error={
                    submitted || errors.instituteName
                      ? errors.instituteName
                      : ""
                  }
                  // className="w-[400px] h-[22px] text-[#060B13] font-montserrat font-medium text-[18px] leading-[22px] placeholder-gray-400 focus:outline-none"
                />
              </div>

              {formData.instituteType !== "Study Halls" && (
                <>
                  <div>
                    <InputField
                      label="Recognition by"
                      name="approvedBy"
                      value={formData.approvedBy}
                      onChange={handleChange}
                      placeholder="State Recognised"
                      required
                      error={
                        submitted || errors.approvedBy ? errors.approvedBy : ""
                      }
                    />
                  </div>

                  <div>
                    <InputField
                      label="Establishment Date"
                      name="establishmentDate"
                      type="date"
                      value={formData.establishmentDate}
                      onChange={handleChange}
                      required
                      error={
                        submitted || errors.establishmentDate
                          ? errors.establishmentDate
                          : ""
                      }
                    />
                  </div>
                </>
              )}

              <div className="flex flex-col gap-3 w-full relative">
                {/* Label */}
                <label
                  htmlFor="contactInfo"
                  className="text-[#060B13] font-montserrat font-medium text-[16px] sm:text-[18px] leading-[22px]"
                >
                  Contact Info<span className="text-red-500 ml-1">*</span>
                </label>

                {/* Input Row */}
                {/* <div className="flex flex-row items-center gap-3 px-4 h-[48px] w-full bg-white border border-[#DADADD] rounded-[12px]"> */}
                <div className="flex flex-row items-center gap-3 px-4 h-[48px] w-full bg-[#F5F6F9] border border-[#DADADD] rounded-[12px]">
                  {/* Left placeholder / icon */}
                  <img
                    src="call log icon.png"
                    alt="phone icon"
                    className="w-[20px] h-[20px] object-cover"
                  />

                  {/* Flag + Dropdown */}
                  <div
                    className="flex items-center gap-2 cursor-pointer relative"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  >
                    <img
                      src={selectedCountryContact.flag}
                      alt={selectedCountryContact.code}
                      className="w-[20px] h-[14px] object-cover rounded-sm"
                    />
                    <span className="text-[#060B13]">
                      {selectedCountryContact.dialCode}
                    </span>

                    <svg
                      className={`w-4 h-4 text-[#060B13] transition-transform ${
                        isDropdownOpen ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>

                    {isDropdownOpen && (
                      <ul className="absolute top-full left-0 mt-1 w-[80px] max-h-40 overflow-y-auto bg-white border border-[#DADADD] rounded-md z-50">
                        {countries.map((country) => (
                          <li
                            key={country.code}
                            className="cursor-pointer px-2 py-1 hover:bg-gray-100 text-center"
                            onClick={() => {
                              handleCountrySelect("contact", country);
                              setIsDropdownOpen(false);
                            }}
                          >
                            {country.dialCode}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Phone Input */}
                  <input
                    id="contactInfo"
                    name="contactInfo"
                    type="tel"
                    maxLength={10}
                    pattern="[0-9]*"
                    inputMode="numeric"
                    placeholder="00000 00000"
                    value={formData.contactInfo}
                    onChange={handleChange}
                    className="flex-1 text-[#060B13] font-montserrat text-[16px] sm:text-[16px] leading-[20px] focus:outline-none"
                    // className="flex-1 text-[#060B13] font-montserrat text-[16px] sm:text-[16px] leading-[20px] focus:outline-none"
                    required
                  />
                </div>

                {errors.contactInfo && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.contactInfo}
                  </p>
                )}
              </div>

              {/* Repeat same for additionalContactInfo */}
              <div className="flex flex-col gap-3 w-full relative">
                <label
                  htmlFor="additionalContactInfo"
                  className="w-[400px] h-[22px] text-[#060B13] font-montserrat font-medium text-[18px] leading-[22px] placeholder-gray-400 focus:outline-none"
                  // className="text-[#060B13] font-montserrat font-medium text-[16px] sm:text-[18px] leading-[22px]"
                >
                  Additional Contact<span className="text-red-500 ml-1">*</span>
                </label>
                <div className="flex flex-row items-center gap-3 px-4 h-[48px] w-full bg-[#F5F6F9] border border-[#DADADD] rounded-[12px]">
                  {/* <div className="flex flex-row items-center gap-3 px-4 h-[48px] w-full bg-white border border-[#DADADD] rounded-[12px]"> */}
                  <img
                    src="call log icon.png"
                    alt="phone icon"
                    className="w-[20px] h-[20px] object-cover"
                  />

                  <div
                    className="flex items-center gap-2 cursor-pointer relative"
                    onClick={() =>
                      setIsDropdownOpenAdditional(!isDropdownOpenAdditional)
                    }
                  >
                    <img
                      src={selectedCountryAdditional.flag}
                      alt={selectedCountryAdditional.code}
                      className="w-[20px] h-[14px] object-cover rounded-sm"
                    />
                    <span className="text-[#060B13]">
                      {selectedCountryAdditional.dialCode}
                    </span>

                    <svg
                      className={`w-4 h-4 text-[#060B13] transition-transform ${
                        isDropdownOpenAdditional ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>

                    {isDropdownOpenAdditional && (
                      <ul className="absolute top-full left-0 mt-1 w-[80px] max-h-40 overflow-y-auto bg-white border border-[#DADADD] rounded-md z-50">
                        {countries.map((country) => (
                          <li
                            key={country.code}
                            className="cursor-pointer px-2 py-1 hover:bg-gray-100 text-center"
                            onClick={() => {
                              handleCountrySelect("additional", country);
                              setIsDropdownOpenAdditional(false);
                            }}
                          >
                            {country.dialCode}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <input
                    id="additionalContactInfo"
                    name="additionalContactInfo"
                    type="tel"
                    maxLength={10}
                    pattern="[0-9]*"
                    inputMode="numeric"
                    placeholder="00000 00000"
                    value={formData.additionalContactInfo}
                    onChange={handleChange}
                    required
                    className="flex-1 text-[#060B13] font-montserrat text-[16px] leading-[20px]
             bg-[#F5F6F9] focus:bg-[#F5F6F9] active:bg-[#F5F6F9] 
             focus:outline-none"
                  />
                </div>

                {errors.additionalContactInfo && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.additionalContactInfo}
                  </p>
                )}
              </div>

              <div>
                <InputField
                  label="Main Campus Address"
                  name="headquartersAddress"
                  value={formData.headquartersAddress}
                  onChange={handleChange}
                  placeholder="Enter address"
                  required
                  error={
                    submitted || errors.headquartersAddress
                      ? errors.headquartersAddress
                      : ""
                  }
                />
              </div>

              <div>
                <InputField
                  label="State"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="Enter state"
                  required
                  error={submitted || errors.state ? errors.state : ""}
                />
              </div>

              <div>
                <InputField
                  label="Pincode"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleChange}
                  placeholder="6-digit pincode"
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  numericOnly
                  required
                  error={submitted || errors.pincode ? errors.pincode : ""}
                />
              </div>

              <div>
                <InputField
                  label="Google Maps Link"
                  name="locationURL"
                  value={formData.locationURL}
                  onChange={handleChange}
                  placeholder="Paste the URL"
                  required
                  error={
                    submitted || errors.locationURL ? errors.locationURL : ""
                  }
                />
              </div>
            </CardContent>

            <CardFooter>
              <Button
                type="submit"
                disabled={isLoading}
                className={`w-full max-w-[500px] h-[48px] mt-5 mx-auto rounded-[12px] font-semibold transition-colors ${
                  isFormComplete && !isLoading
                    ? "bg-[#0222D7] text-white"
                    : "bg-[#697282] text-white"
                } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {isLoading ? "Saving..." : "Save & Next"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
