"use client";

import { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import InputField from "@/components/ui/InputField";
import { Plus } from "lucide-react";

interface Branch {
  id: number;
  branchName: string;
  branchAddress: string;
  contactInfo: string;
  locationUrl: string;
}

interface BranchFormProps {
  branches: Branch[];
  setBranches: React.Dispatch<React.SetStateAction<Branch[]>>;
  selectedBranchId: number;
  setSelectedBranchId: React.Dispatch<React.SetStateAction<number>>;
  handleBranchChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => void;
  handleBranchSubmit: (e: FormEvent<HTMLFormElement>) => void;
  handlePreviousClick?: () => void;
  deleteBranch: (branchId: number) => void;
  addNewBranch: () => void;
  isLoading: boolean;
  onPrevious?: () => void;
}

export default function BranchForm({
  branches,
  selectedBranchId,
  handleBranchChange,
  handleBranchSubmit,
  handlePreviousClick,
  deleteBranch,
  addNewBranch,
  isLoading,
}: BranchFormProps) {
  const currentBranch =
    branches.find((b) => b.id === selectedBranchId) || branches[0];

  return (
    <form onSubmit={handleBranchSubmit} className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <InputField
          label="Branch Name"
          name="branchName"
          value={currentBranch.branchName}
          onChange={handleBranchChange}
          placeholder="Enter Course name"
          required
        />
        <InputField
          label="Contact info"
          name="contactInfo"
          value={currentBranch.contactInfo}
          onChange={handleBranchChange}
          placeholder="+91 00000 0000"
          type="tel"
          numericOnly
          pattern="[0-9]*"
          maxLength={10}
          required
        />
        <InputField
          label="Branch address"
          name="branchAddress"
          value={currentBranch.branchAddress}
          onChange={handleBranchChange}
          placeholder="Enter address"
          required
        />
        <InputField
          label="Location URL"
          name="locationUrl"
          value={currentBranch.locationUrl}
          onChange={handleBranchChange}
          placeholder="Paste the URL"
          required
        />
      </div>
      <div className="flex flex-col sm:flex-row justify-center pt-4 gap-4 w-full">
        <button
          type="button"
          onClick={() => handlePreviousClick?.()}
          className="w-full sm:w-[314px] h-[48px] border border-[#697282] text-[#697282] rounded-[12px] font-semibold text-[16px] sm:text-[18px] leading-[22px] flex items-center justify-center shadow-inner"
        >
          Previous
        </button>
        <Button
          type="submit"
          disabled={isLoading}
          className={`w-full sm:max-w-[350px] h-[48px] rounded-[12px] font-semibold transition-colors
      ${
        isLoading
          ? "opacity-50 cursor-not-allowed bg-blue"
          : "bg-[#6B7280] hover:bg-[#6B7280]/90"
      } text-white text-[16px] sm:text-[18px]`}
        >
          <Plus size={16} />
          {isLoading ? "Saving..." : "Add Course"}
        </Button>
      </div>
    </form>
  );
}
