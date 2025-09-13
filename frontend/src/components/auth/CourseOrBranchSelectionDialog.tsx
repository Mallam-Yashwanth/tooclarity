import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Plus } from "lucide-react";

interface CourseOrBranchSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelection: (selection: "course" | "branch") => void;
}

export default function CourseOrBranchSelectionDialog({
  open,
  onOpenChange,
  onSelection,
}: CourseOrBranchSelectionDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={() => {}} // prevent backdrop close
    >
      <DialogContent
        className="
          w-[95vw] sm:w-[90vw] md:max-w-[700px] 
          rounded-[16px] bg-white border border-gray-200 shadow-lg 
          p-6 sm:p-8 text-center
        "
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        showCloseButton={false}
        overlayClassName="bg-black/70"
      >
        {/* Title */}
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">
          Which One Should You Pick !
        </h2>

        {/* Description */}
        <div className="text-gray-700 text-sm sm:text-base space-y-3 mb-8">
          <p>
            <span className="font-semibold">Course</span> – For institutes
            without branches. Add all courses directly under the main institute.
          </p>
          <p>
            <span className="font-semibold">Branch</span> – For institutes with
            multiple branches. Add a branch first, then list the courses for
            that branch.
          </p>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-6">
          <Button
            onClick={() => {
              onSelection("course");
              localStorage.setItem('selected', 'course')
              onOpenChange(false);
            }}
            variant="course"
            className="w-full sm:w-[250px]"
          >
            <Plus size={18} />
            Add Course
          </Button>

          <Button
            onClick={() => {
              onSelection("branch");
              localStorage.setItem('selected', 'branch')
              onOpenChange(false);
            }}
            variant="branch"
            className="w-full sm:w-[250px]"
          >
            <Plus size={18} />
            Add Branch
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
