"use client";

import { useState, ChangeEvent, FormEvent, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  addInstitutionToDB,
  clearDependentData,
  getAllInstitutionsFromDB,
  updateInstitutionAndTrimExtraFields,
  updateInstitutionInDB,
} from "@/lib/localDb";

import {
  _Dialog,
  _DialogContent,
  _DialogHeader,
  _DialogTitle,
  _DialogDescription,
  _DialogTrigger,
} from "@/components/ui/dialog";
import { _Card, _CardContent, _CardFooter } from "@/components/ui/card";
import InputField from "@/components/ui/InputField";
import { L1Schema } from "@/lib/validations/L1Schema";
import { institutionAPI } from "@/lib/api";
import { toast } from "react-toastify";
import { Upload } from "lucide-react";
import { uploadToS3 } from "@/lib/awsUpload";
import { useAuth } from "@/lib/auth-context";


interface FormData {
  instituteType: string;
  instituteName: string;
  approvedBy: string;
  establishmentDate: string;
  contactInfo: string;
  contactCountryCode?: string;
  additionalContactInfo: string;
  additionalContactCountryCode?: string;
  headquartersAddress: string;
  state: string;
  pincode: string;
  locationURL: string;
  logo?: File | null;
  logoUrl?: string;
  logoPreviewUrl?: string;
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
}

export default function L1DialogBox({
  trigger,
  open,
  onOpenChange,
  onInstituteTypeChange,
  onSuccess,
}: L1DialogBoxProps) {
  const router = useRouter();
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
    logo: null,
    logoUrl: "",
    logoPreviewUrl: "",
  });
  const { updateUser, setProfileCompleted } = useAuth();
  const [errors, setErrors] = useState<Errors>({});
  const [isLoading, setIsLoading] = useState(false);

  const MAX_LOG_FILE_SIZE = 1 * 1024 * 1024; // 1 MB

  const DialogOpen = open !== undefined ? open : isOpen;
  const setDialogOpen = onOpenChange || setIsOpen;
  const activeSchema = L1Schema;

 useEffect(() => {
    // Only run if the dialog is actually open
    if (!DialogOpen) return;

    let isMounted = true;
    
    const fetchInstitutionData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        console.log("🔍 Fetching institution details from backend...");
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/institutions/me`, {
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        });

        const result = await response.json();

        if (!isMounted) return;

        // If backend finds an institution (success: true)
        if (response.ok && result.success && result.data) {
          const latest = result.data;

          // Sync localStorage ID just in case it's missing
          localStorage.setItem("institutionId", latest._id);

          setFormData({
            instituteType: latest.instituteType || "",
            instituteName: latest.instituteName || "",
            approvedBy: latest.approvedBy || "",
            // Format date string for the HTML date input (YYYY-MM-DD)
            establishmentDate: latest.establishmentDate ? latest.establishmentDate.split('T')[0] : "",
            contactInfo: latest.contactInfo || "",
            additionalContactInfo: latest.additionalContactInfo || "",
            headquartersAddress: latest.headquartersAddress || "",
            state: latest.state || "",
            pincode: latest.pincode || "",
            locationURL: latest.locationURL || "",
            logoUrl: latest.logoUrl || "",
            logoPreviewUrl: latest.logoUrl || "",
          });
        }
      } catch (err) {
        console.error("❌ Failed to load institution from backend", err);
      }
    };

    fetchInstitutionData();

    return () => {
      isMounted = false;
    };
  }, [DialogOpen]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Instant field validation
    const { error } = L1Schema.validate(
      { ...formData, [name]: value },
      { abortEarly: false }
    );
    const fieldError = error?.details.find((detail) => detail.path[0] === name);

    setErrors((prev) => ({
      ...prev,
      [name]: fieldError ? fieldError.message : undefined,
    }));

    if (name === "instituteType" && onInstituteTypeChange) {
      onInstituteTypeChange(value);
    }
  };

  const countries = [
    { code: "IN", dialCode: "+91", flag: "https://flagcdn.com/w20/in.png" },
    { code: "US", dialCode: "+1", flag: "https://flagcdn.com/w20/us.png" },
    { code: "GB", dialCode: "+44", flag: "https://flagcdn.com/w20/gb.png" },
    { code: "AU", dialCode: "+61", flag: "https://flagcdn.com/w20/au.png" },
    { code: "CA", dialCode: "+1", flag: "https://flagcdn.com/w20/ca.png" },
    { code: "AE", dialCode: "+971", flag: "https://flagcdn.com/w20/ae.png" },
    { code: "SG", dialCode: "+65", flag: "https://flagcdn.com/w20/sg.png" },
  ];

  const [selectedCountryContact, setSelectedCountryContact] = useState(
    countries[0]
  );
  const [selectedCountryAdditional, setSelectedCountryAdditional] = useState(
    countries[0]
  );
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isDropdownOpenAdditional, setIsDropdownOpenAdditional] =
    useState(false);

  const handleCountrySelect = (
    field: "contact" | "additional",
    country: (typeof countries)[0]
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

  // Clear fields that are not required for Study Halls / Study Abroad
  useEffect(() => {
    if (
      formData.instituteType === "Study Halls" ||
      formData.instituteType === "Study Abroad"
    ) {
      setFormData((prev) => ({
        ...prev,
        approvedBy: "",
        establishmentDate: "",
        logo: null,
        logoUrl: "",
        logoPreviewUrl: "",
      }));
      setErrors((prev) => ({
        ...prev,
        approvedBy: undefined,
        establishmentDate: undefined,
        logo: undefined,
      }));
    }
  }, [formData.instituteType]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) {
      if (formData.logoPreviewUrl) {
        URL.revokeObjectURL(formData.logoPreviewUrl);
      }
      setFormData((prev) => ({
        ...prev,
        logo: null,
        logoPreviewUrl: "",
      }));
      setErrors((prev) => ({ ...prev, logo: undefined }));
      return;
    }

    const validTypes = ["image/jpeg", "image/jpg", "image/png"];
    if (!validTypes.includes(selectedFile.type)) {
      setErrors((prev) => ({
        ...prev,
        logo: "Logo must be a valid image file (.jpg, .jpeg, .png).",
      }));
      return;
    }

    if (selectedFile.size > MAX_LOG_FILE_SIZE) {
      setErrors((prev) => ({
        ...prev,
        logo: "File size must be 1 MB or less.",
      }));
      return;
    }

    if (formData.logoPreviewUrl) {
      URL.revokeObjectURL(formData.logoPreviewUrl);
    }

    setFormData((prev) => ({
      ...prev,
      logo: selectedFile,
      logoPreviewUrl: URL.createObjectURL(selectedFile),
    }));

    setErrors((prev) => ({ ...prev, logo: undefined }));
  };


 const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  setIsLoading(true);

  try {
    let logoUrl = formData.logoUrl || "";

    // Check if the logo has changed compared to what we last uploaded
    const isLogoChanged =
      formData.logo &&
      formData.logo instanceof File &&
      formData.logoPreviewUrl !== (localStorage.getItem("lastPreviewUrl") || "");

    if (isLogoChanged && formData.logo instanceof File) {
      try {
        console.log("⬆️ Uploading new logo to AWS S3...");

        const uploadResult = await uploadToS3(formData.logo);

        if (Array.isArray(uploadResult)) {
          const first = uploadResult[0];
          if (!first?.success)
            throw new Error(first?.error || "Upload failed");
          logoUrl = first.fileUrl || logoUrl;
        } else {
          // Use type assertion to handle the property error if necessary
          const result = uploadResult as any;
          if (!result.success)
            throw new Error(result.error || "Upload failed");
          logoUrl = result.fileUrl || logoUrl;
        }

        console.log("✅ Logo uploaded successfully:", logoUrl);
        // Save preview URL to prevent re-uploading the same file
        localStorage.setItem("lastPreviewUrl", formData.logoPreviewUrl || "");
      } catch (uploadError: any) {
        console.error("❌ AWS upload failed:", uploadError);
        setErrors((prev) => ({
          ...prev,
          logo: uploadError.message || "Failed to upload logo. Try again.",
        }));
        setIsLoading(false);
        return;
      }
    }

    // --- CALL THE CENTRALIZED BACKEND API ---
    const response = await institutionAPI.saveL1Details(formData, logoUrl);

    if (!response.success) {
      throw new Error(response.message || "Failed to save details");
    }

    // --- UI SYNC & REDIRECT ---
    if (updateUser) {
      updateUser({ isProfileCompleted: true, isPaymentDone: true });
    }
    
    toast.success("Details saved successfully!");
    setDialogOpen(false);
    
    setTimeout(() => {
      onSuccess?.();
      router.push("/dashboard");
    }, 150);

  } catch (error: any) {
    console.error("Error:", error);
    toast.error(error.message || "Something went wrong.");
  } finally {
    setIsLoading(false);
  }
};

  // === THIS IS THE KEY FIX FOR BUTTON ENABLE ===
  const dataForValidation = {
    ...formData,
    // If a logo file is selected → pretend logoUrl exists for validation
    logoUrl: formData.logo
      ? "https://via.placeholder.com/150.png"
      : formData.logoUrl || "",
  };

  const isFormComplete = !activeSchema.validate(dataForValidation, {
    abortEarly: false,
  }).error;

  return (
    <_Dialog open={DialogOpen} onOpenChange={setDialogOpen}>
      {trigger && <_DialogTrigger asChild>{trigger}</_DialogTrigger>}
      <_DialogContent
        className="w-[95vw] sm:w-[90vw] md:w-[800px] lg:w-[900px] xl:max-w-4xl scrollbar-hide top-[50%]"
        showCloseButton={false}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <_DialogHeader className="flex flex-col items-center gap-2">
          <_DialogTitle className="font-montserrat font-bold text-xl sm:text-[28px] leading-tight text-center">
            Institution Details
          </_DialogTitle>
          <_DialogDescription className="font-montserrat font-normal text-sm sm:text-[16px] leading-relaxed text-center text-gray-600">
            Provide key information about your institution to get started
          </_DialogDescription>
        </_DialogHeader>

        <_Card className="w-full sm:p-6 rounded-[24px] bg-white border-0 shadow-none">
          <form onSubmit={handleSubmit}>
            <_CardContent className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 gap-4 md:gap-[30px]">
              {/* All your InputFields remain exactly the same */}
              <InputField
                label="Institute Type"
                name="instituteType"
                value={formData.instituteType}
                onChange={handleChange}
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
                error={errors.instituteType}
              />

              <InputField
                label="Institute Name"
                name="instituteName"
                value={formData.instituteName}
                onChange={handleChange}
                placeholder="Enter your Institute name"
                required
                error={errors.instituteName}
              />

              {formData.instituteType !== "Study Halls" &&
                formData.instituteType !== "Study Abroad" && (
                  <>
                    <InputField
                      label="Recognition by"
                      name="approvedBy"
                      value={formData.approvedBy}
                      onChange={handleChange}
                      placeholder="State Recognised"
                      required
                      error={errors.approvedBy}
                    />
                    <InputField
                      label="Establishment Date"
                      name="establishmentDate"
                      type="date"
                      value={formData.establishmentDate}
                      onChange={handleChange}
                      required
                      error={errors.establishmentDate}
                    />
                  </>
                )}

              {/* Contact fields (unchanged) */}
              <div className="flex flex-col gap-3 w-full relative">
                <label
                  htmlFor="contactInfo"
                  className="font-montserrat font-normal text-base text-black"
                >
                  Contact Info<span className="text-red-500 ml-1">*</span>
                </label>
                <div className="flex flex-row items-center gap-3 px-4 h-[48px] w-full bg-[#F5F6F9] border border-[#DADADD] rounded-[12px]">
                  <Image
                    src="/call log icon.png"
                    alt="phone icon"
                    width={20}
                    height={20}
                  />
                  <div
                    className="flex items-center gap-2 cursor-pointer relative"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  >
                    <Image
                      src={selectedCountryContact.flag}
                      alt={selectedCountryContact.code}
                      width={20}
                      height={14}
                    />
                    <span>{selectedCountryContact.dialCode}</span>
                    {isDropdownOpen && (
                      <ul className="absolute top-full left-0 mt-1 w-[80px] max-h-40 overflow-y-auto bg-white border rounded-md z-50">
                        {countries.map((country) => (
                          <li
                            key={country.code}
                            className="cursor-pointer px-2 py-1 hover:bg-gray-100"
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
                  <input
                    id="contactInfo"
                    name="contactInfo"
                    type="tel"
                    maxLength={10}
                    placeholder="00000 00000"
                    value={formData.contactInfo}
                    onChange={handleChange}
                    className="flex-1 bg-transparent focus:outline-none"
                  />
                </div>
                {errors.contactInfo && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.contactInfo}
                  </p>
                )}
              </div>

              {/* Additional contact (unchanged) */}
              <div className="flex flex-col gap-3 w-full relative">
                <label
                  htmlFor="additionalContactInfo"
                  className="font-montserrat font-normal text-base text-black"
                >
                  Additional Contact
                </label>
                <div className="flex flex-row items-center gap-3 px-4 h-[48px] w-full bg-[#F5F6F9] border border-[#DADADD] rounded-[12px]">
                  <Image
                    src="/call log icon.png"
                    alt="phone icon"
                    width={20}
                    height={20}
                  />
                  <div
                    className="flex items-center gap-2 cursor-pointer relative"
                    onClick={() =>
                      setIsDropdownOpenAdditional(!isDropdownOpenAdditional)
                    }
                  >
                    <Image
                      src={selectedCountryAdditional.flag}
                      alt={selectedCountryAdditional.code}
                      width={20}
                      height={14}
                    />
                    <span>{selectedCountryAdditional.dialCode}</span>
                    {isDropdownOpenAdditional && (
                      <ul className="absolute top-full left-0 mt-1 w-[80px] max-h-40 overflow-y-auto bg-white border rounded-md z-50">
                        {countries.map((country) => (
                          <li
                            key={country.code}
                            className="cursor-pointer px-2 py-1 hover:bg-gray-100"
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
                    placeholder="00000 00000"
                    value={formData.additionalContactInfo}
                    onChange={handleChange}
                    className="flex-1 bg-transparent focus:outline-none"
                  />
                </div>
              </div>

              <InputField
                label="Main Campus Address"
                name="headquartersAddress"
                value={formData.headquartersAddress}
                onChange={handleChange}
                placeholder="Enter address"
                required
                error={errors.headquartersAddress}
              />

              <InputField
                label="State"
                name="state"
                value={formData.state}
                onChange={handleChange}
                placeholder="Enter state"
                required
                error={errors.state}
              />

              <InputField
                label="Pincode"
                name="pincode"
                value={formData.pincode}
                onChange={handleChange}
                placeholder="6-digit pincode"
                type="tel"
                maxLength={6}
                required
                error={errors.pincode}
              />

              <InputField
                label="Google Maps Link"
                name="locationURL"
                value={formData.locationURL}
                onChange={handleChange}
                placeholder="Paste the URL"
                required
                error={errors.locationURL}
              />

              {/* Logo upload — only shown when required */}
              {formData.instituteType !== "Study Abroad" &&
                formData.instituteType !== "Study Halls" && (
                  <div>
                    <label className="font-montserrat font-normal text-base text-black">
                      Logo <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-2 w-full h-[120px] rounded-[12px] border-2 border-dashed border-[#DADADD] bg-[#F8F9FA] flex flex-col items-center justify-center cursor-pointer hover:bg-[#F0F1F2] relative">
                      <input
                        id="logo"
                        name="logo"
                        type="file"
                        accept=".jpg,.jpeg,.png"
                        onChange={handleFileChange}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                      {!formData.logoPreviewUrl ? (
                        <>
                          <Upload size={24} className="text-gray-400 mb-2" />
                          <span className="text-sm text-gray-500">
                            Upload Logo (jpg / jpeg / png)
                          </span>
                        </>
                      ) : (
                        <Image
                          src={formData.logoPreviewUrl}
                          alt="Logo preview"
                          width={100}
                          height={100}
                          className="w-[100px] h-[100px] object-cover rounded-md"
                        />
                      )}
                    </div>
                    {errors.logo && (
                      <p className="text-red-500 text-sm mt-1">{errors.logo}</p>
                    )}
                  </div>
                )}
            </_CardContent>

            <_CardFooter>
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
            </_CardFooter>
          </form>
        </_Card>
      </_DialogContent>
    </_Dialog>
  );
}
