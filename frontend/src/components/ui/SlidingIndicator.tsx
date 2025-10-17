"use client";

import { cn } from "@/lib/utils";

interface SlidingIndicatorProps<T extends string> {
  options: readonly T[];
  activeOption: T;
  onOptionChange: (option: T) => void;
  className?: string;
  containerClassName?: string;
  indicatorClassName?: string;
  optionClassName?: string;
  activeOptionClassName?: string;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
}

export default function  SlidingIndicator<T extends string>({
  options,
  activeOption,
  onOptionChange,
  className,
  containerClassName,
  indicatorClassName,
  optionClassName,
  activeOptionClassName,
  disabled = false,
  size = "md",
}: SlidingIndicatorProps<T>) {
  const activeIndex = options.indexOf(activeOption);
  const optionCount = options.length;

  // Size configurations
  const sizeConfig = {
    sm: {
      container: "h-[36px] p-[2px]",
      indicator: "h-[32px]",
      option: "h-[32px] text-[14px]",
      borderRadius: "rounded-[18px]",
      optionBorderRadius: "rounded-[16px]",
    },
    md: {
      container: "h-[48px] p-[4px]",
      indicator: "h-[40px]",
      option: "h-[40px] text-[16px]",
      borderRadius: "rounded-[24px]",
      optionBorderRadius: "rounded-[21px]",
    },
    lg: {
      container: "h-[56px] p-[4px]",
      indicator: "h-[48px]",
      option: "h-[48px] text-[18px]",
      borderRadius: "rounded-[28px]",
      optionBorderRadius: "rounded-[24px]",
    },
  };

  const config = sizeConfig[size];

  // Calculate indicator position
  const getIndicatorPosition = () => {
    if (optionCount === 2) {
      return activeIndex === 0 ? "4px" : "50%";
    } else if (optionCount === 3) {
      if (activeIndex === 0) return "4px";
      if (activeIndex === 1) return "calc(33.333% + 2px)";
      return "calc(66.666% + 2px)";
    } else {
      // For more than 3 options, calculate dynamically
      const percentage = (activeIndex / optionCount) * 100;
      return `calc(${percentage}% + ${activeIndex * 2}px)`;
    }
  };

  return (
    <div
      className={cn(
        "relative flex w-full bg-gray-100 border border-gray-300 dark:bg-gray-800 dark:border-gray-700",
        config.container,
        config.borderRadius,
        containerClassName,
        className
      )}
    >
      {/* Sliding Indicator */}
      <div
        className={cn(
          "absolute top-[4px] bg-[#0D4CFF] transition-all duration-300",
          config.indicator,
          config.optionBorderRadius,
          indicatorClassName
        )}
        style={{
          left: getIndicatorPosition(),
          width: `calc(${100 / optionCount}% - ${8 / optionCount}px)`,
        }}
      />

      {/* Options */}
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => !disabled && onOptionChange(option)}
          disabled={disabled}
          className={cn(
            "relative z-10 flex-1 flex items-center justify-center font-medium transition-all",
            config.option,
            config.optionBorderRadius,
            activeOption === option
              ? cn("text-white", activeOptionClassName)
              : cn("text-gray-600", optionClassName),
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          {option.charAt(0).toUpperCase() + option.slice(1)}
        </button>
      ))}
    </div>
  );
}