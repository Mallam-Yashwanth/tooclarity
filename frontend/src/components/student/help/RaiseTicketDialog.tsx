"use client";

import React, { useState } from "react";
import {
  _Dialog,
  _DialogContent,
  _DialogHeader,
  _DialogTitle,
} from "@/components/ui/dialog";
import InputField from "@/components/ui/InputField";

interface RaiseTicketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit?: (data: TicketFormData) => void;
}

export interface TicketFormData {
  subject: string;
  category: string;
  description: string;
  priority: "Low" | "Medium" | "High" | "";
  attachment?: File | null;
}

interface TicketFormErrors {
  subject?: string;
  category?: string;
  description?: string;
  priority?: string;
}

const categories = [
  "Technical Issue",
  "Billing & Payment",
  "Course Information",
  "Account & Profile",
  "Counselling",
  "General Inquiry",
  "Other",
];

const priorities = ["Low", "Medium", "High"];

export const RaiseTicketDialog: React.FC<RaiseTicketDialogProps> = ({
  open,
  onOpenChange,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<TicketFormData>({
    subject: "",
    category: "",
    description: "",
    priority: "",
    attachment: null,
  });

  const [errors, setErrors] = useState<TicketFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: TicketFormErrors = {};

    if (!formData.subject.trim()) {
      newErrors.subject = "Subject is required";
    }

    if (!formData.category) {
      newErrors.category = "Please select a category";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    } else if (formData.description.trim().length < 10) {
      newErrors.description = "Description must be at least 10 characters";
    }

    if (!formData.priority) {
      newErrors.priority = "Please select a priority level";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof TicketFormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // if (onSubmit) {
      //   await onSubmit(formData);
      // }/
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
        },
        body: JSON.stringify({
            access_key: process.env.NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY,
            subject: formData.subject,
            category: formData.category,
            description: formData.description,
            priority: formData.priority,
            // attachment: formData.attachment,
        }),
    });
    const result = await response.json();
    console.log(result);

      // Reset form and close dialog on success
      setFormData({
        subject: "",
        category: "",
        description: "",
        priority: "",
        attachment: null,
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Error submitting ticket:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      subject: "",
      category: "",
      description: "",
      priority: "",
      attachment: null,
    });
    setErrors({});
    onOpenChange(false);
  };

  return (
    <_Dialog open={open} onOpenChange={handleClose}>
      <_DialogContent className="max-w-[500px] w-[95vw] max-h-[90vh] overflow-y-auto px-5 py-6 sm:px-6 sm:py-6 md:px-7 md:py-7 lg:px-7 lg:py-7 rounded-[24px] bg-white shadow-[0_10px_40px_rgba(0,0,0,0.1)] sm:max-w-[540px] lg:max-w-[540px] [@media(max-width:360px)]:w-[98vw] [@media(max-width:360px)]:px-4 [@media(max-width:360px)]:py-4 [@media(max-width:360px)]:max-h-[85vh] [@media(min-width:361px)_and_(max-width:480px)]:px-5 [@media(min-width:361px)_and_(max-width:480px)]:py-5 [@media(max-height:600px)_and_(orientation:landscape)]:max-h-[95vh] [@media(max-height:600px)_and_(orientation:landscape)]:px-4 [@media(max-height:600px)_and_(orientation:landscape)]:py-4" showCloseButton={true}>
        <_DialogHeader className="mb-5 sm:mb-6 md:mb-6 lg:mb-6 [@media(max-width:360px)]:mb-4 [@media(max-height:600px)_and_(orientation:landscape)]:mb-3">
          <_DialogTitle className="text-xl sm:text-2xl md:text-2xl lg:text-[26px] font-bold text-[#1a1a1a] m-0 mb-2 leading-tight [@media(max-width:360px)]:text-lg">Raise a Ticket</_DialogTitle>
          <p className="text-sm sm:text-sm md:text-sm lg:text-[15px] text-[#697282] m-0 leading-relaxed">
            Tell us about your issue and we&apos;ll get back to you soon
          </p>
        </_DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 sm:gap-5 md:gap-5 lg:gap-5 [@media(max-width:360px)]:gap-3.5 [@media(max-height:600px)_and_(orientation:landscape)]:gap-3">
          <div className="flex flex-col gap-2 w-full">
            <InputField
              label="Subject"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              placeholder="Brief description of your issue"
              required
              error={errors.subject}
            />
          </div>

          <div className="flex flex-col gap-2 w-full">
            <label className="text-sm sm:text-sm md:text-sm lg:text-[15px] font-semibold text-[#1a1a1a]">
              Category <span className="text-red-600">*</span>
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className={`w-full h-11 sm:h-12 md:h-12 lg:h-12 px-4 border-[1.5px] border-[#DADADD] rounded-xl text-sm sm:text-sm md:text-sm lg:text-[15px] text-[#1a1a1a] bg-white cursor-pointer transition-all duration-200 appearance-none bg-no-repeat bg-[right_16px_center] pr-10 hover:border-gray-400 focus:outline-none focus:border-[#0222D7] ${errors.category ? "border-red-600" : ""}`}
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L6 6L11 1' stroke='%23697282' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`
              }}
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="text-red-600 text-xs sm:text-xs md:text-xs lg:text-[12px] mt-1 leading-tight">{errors.category}</p>
            )}
          </div>

          <div className="flex flex-col gap-2 w-full">
            <label className="text-sm sm:text-sm md:text-sm lg:text-[15px] font-semibold text-[#1a1a1a]">
              Priority <span className="text-red-600">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-3 lg:gap-3 [@media(max-width:360px)]:gap-1.5 [@media(min-width:361px)_and_(max-width:480px)]:gap-2.5 w-full">
              {priorities.map((priority) => (
                <button
                  key={priority}
                  type="button"
                  className={`h-11 sm:h-12 md:h-12 lg:h-[46px] border-[1.5px] border-[#DADADD] rounded-xl bg-white text-sm sm:text-sm md:text-sm lg:text-[15px] font-semibold cursor-pointer transition-all duration-200 text-[#697282] hover:border-gray-400 hover:bg-gray-50 focus:outline-none active:scale-95 [@media(hover:none)_and_(pointer:coarse)]:active:scale-96 ${
                    formData.priority === priority
                      ? `border-[#0222D7] bg-[#0222D7] text-white ${
                          priority === "Low" ? "!border-green-500 !bg-green-500" :
                          priority === "Medium" ? "!border-yellow-500 !bg-yellow-500" :
                          priority === "High" ? "!border-red-500 !bg-red-500" : ""
                        }`
                      : ""
                  }`}
                  onClick={() => {
                    setFormData((prev) => ({ ...prev, priority: priority as "Low" | "Medium" | "High" }));
                    if (errors.priority) {
                      setErrors((prev) => ({ ...prev, priority: "" }));
                    }
                  }}
                >
                  {priority}
                </button>
              ))}
            </div>
            {errors.priority && (
              <p className="text-red-600 text-xs sm:text-xs md:text-xs lg:text-[12px] mt-1 leading-tight">{errors.priority}</p>
            )}
          </div>

          <div className="flex flex-col gap-2 w-full">
            <label className="text-sm sm:text-sm md:text-sm lg:text-[15px] font-semibold text-[#1a1a1a]">
              Description <span className="text-red-600">*</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Please describe your issue in detail..."
              className={`w-full px-4 py-3 sm:py-3 md:py-3 lg:py-[12px] border-[1.5px] border-[#DADADD] rounded-xl text-sm sm:text-sm md:text-sm lg:text-[15px] text-[#1a1a1a] font-inherit resize-vertical min-h-[100px] sm:min-h-[120px] md:min-h-[120px] lg:min-h-[120px] [@media(max-height:600px)_and_(orientation:landscape)]:min-h-[80px] transition-all duration-200 leading-relaxed focus:outline-none focus:border-[#0222D7] hover:border-gray-400 placeholder:text-gray-400 ${errors.description ? "border-red-600" : ""}`}
              rows={5}
            />
            {errors.description && (
              <p className="text-red-600 text-xs sm:text-xs md:text-xs lg:text-[12px] mt-1 leading-tight">{errors.description}</p>
            )}
          </div>

          {/* Attachment Upload */}
          <div className="flex flex-col gap-2 w-full">
            <label className="text-sm sm:text-sm md:text-sm lg:text-[15px] font-semibold text-[#1a1a1a]">Attachment (optional)</label>
            <input
              type="file"
              name="attachment"
              accept="image/png,image/jpeg,application/pdf"
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                if (file) {
                  // Basic type validation (accept attribute already restricts UI)
                  const validTypes = ["image/png", "image/jpeg", "application/pdf"];
                  if (!validTypes.includes(file.type)) {
                    // Ignore invalid file type
                    return;
                  }
                }
                setFormData((prev) => ({ ...prev, attachment: file }));
              }}
              className="w-full px-3 py-2.5 border-[1.5px] border-[#DADADD] rounded-xl text-sm sm:text-sm md:text-sm lg:text-[15px] bg-white transition-all duration-200 focus:outline-none focus:border-[#0222D7] hover:border-gray-400"
            />
            {formData.attachment && (
              <p className="text-sm sm:text-sm md:text-sm lg:text-[13px] text-gray-600 mt-1.5">
                Attached: {formData.attachment.name} ({Math.round(formData.attachment.size / 1024)} KB)
              </p>
            )}
          </div>

          <div className="mt-1 sm:mt-2 md:mt-2 lg:mt-2">
            <button
              type="submit"
              className="w-full h-11 sm:h-12 md:h-12 lg:h-[50px] bg-[#0222D7] text-white border-none rounded-xl text-base sm:text-base md:text-base lg:text-lg font-semibold cursor-pointer transition-all duration-300 hover:bg-[#0119b8] hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(2,34,215,0.3)] focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:transform-none disabled:hover:shadow-none active:scale-98 [@media(hover:none)_and_(pointer:coarse)]:active:scale-98"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Submit Ticket"}
            </button>
          </div>
        </form>
      </_DialogContent>
    </_Dialog>
  );
};

export default RaiseTicketDialog;
