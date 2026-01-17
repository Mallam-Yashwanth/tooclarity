"use client";

import React, { useState, useRef, useEffect, useMemo, useDeferredValue } from "react";
import { ChevronDown, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchableSelectProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: string[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  className?: string;
}

function SearchableSelect({
  label,
  name,
  value,
  onChange,
  options,
  placeholder = "Select an option",
  required = false,
  disabled = false,
  error,
  className,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const deferredSearch = useDeferredValue(searchTerm);
  const [scrollTop, setScrollTop] = useState(0);
  const itemHeight = 40; // px per option row (approx.)
  const viewportHeight = 240; // matches max-h-60
  const buffer = 6;
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Filter options based on search term (deferred to reduce re-render thrash)
  const filteredOptions = useMemo(() => {
    const q = deferredSearch.trim().toLowerCase();
    if (!q) return options;
    return options.filter(o => o.toLowerCase().includes(q));
  }, [options, deferredSearch]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Virtualization math
  const totalCount = filteredOptions.length;
  const totalHeight = totalCount * itemHeight;
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - buffer);
  const visibleCount = Math.ceil(viewportHeight / itemHeight) + 2 * buffer;
  const endIndex = Math.min(totalCount, startIndex + visibleCount);
  const topSpacer = startIndex * itemHeight;
  const bottomSpacer = Math.max(0, totalHeight - topSpacer - (endIndex - startIndex) * itemHeight);

  const handleOptionClick = (option: string) => {
    // Create a synthetic event to match the expected onChange signature
    const syntheticEvent = {
      target: {
        name,
        value: option,
      },
    } as React.ChangeEvent<HTMLSelectElement>;

    onChange(syntheticEvent);
    setIsOpen(false);
    setSearchTerm("");
  };

  const clearSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    const syntheticEvent = {
      target: {
        name,
        value: "",
      },
    } as React.ChangeEvent<HTMLSelectElement>;
    onChange(syntheticEvent);
  };

  const selectedOption = options.find(option => option === value);

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label className="font-[Montserrat] font-medium text-[16px] md:text-[18px] text-black">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div className="relative" ref={dropdownRef}>
        <div
          className={cn(
            "w-full h-[48px] rounded-[12px] p-[12px] bg-[#F5F6F9] dark:bg-gray-800 flex items-center justify-between cursor-pointer border border-[#DADADD] dark:border-gray-700",
            error
              ? "border-red-400 bg-white"
              : "border-gray-200 bg-[#F5F6F9] hover:border-gray-300 focus-within:border-[#3B82F6]",
            disabled && "opacity-50 cursor-not-allowed bg-gray-50"
          )}
          onClick={() => !disabled && setIsOpen(!isOpen)}
        >
          <span className={cn(
            "flex-1 text-left",
            selectedOption ? "text-gray-900" : "text-gray-500"
          )}>
            {selectedOption || placeholder}
          </span>
          
          <div className="flex items-center gap-2">
            {selectedOption && !disabled && (
              <button
                type="button"
                onClick={clearSelection}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={16} className="text-gray-400" />
              </button>
            )}
            <ChevronDown
              size={20}
              className={cn(
                "text-gray-400 transition-transform",
                isOpen && "rotate-180"
              )}
            />
          </div>
        </div>

        {/* Dropdown */}
        {isOpen && !disabled && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-[12px] shadow-lg z-50 max-h-80 overflow-hidden">
            {/* Search Input */}
            <div className="p-3 border-b border-gray-100">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search options..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#3B82F6] text-sm"
                />
              </div>
            </div>

            {/* Options List */}
            <div
              ref={listRef}
              className="max-h-60 overflow-y-auto"
              onScroll={(e) => setScrollTop((e.target as HTMLDivElement).scrollTop)}
            >
              {filteredOptions.length > 0 ? (
                <div style={{ height: totalHeight }}>
                  <div style={{ height: topSpacer }} />
                  {filteredOptions.slice(startIndex, endIndex).map((option, index) => (
                    <div
                      key={`${startIndex + index}-${option}`}
                      className={cn(
                        "px-4 h-10 flex items-center cursor-pointer transition-colors text-sm hover:bg-gray-50",
                        option === value && "bg-blue-50 text-blue-600 font-medium"
                      )}
                      onClick={() => handleOptionClick(option)}
                    >
                      {option}
                    </div>
                  ))}
                  <div style={{ height: bottomSpacer }} />
                </div>
              ) : (
                <div className="px-4 py-3 text-gray-500 text-sm text-center">
                  No options found
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-red-500 text-sm mt-1">{error}</p>
      )}
    </div>
  );
}

export default React.memo(SearchableSelect);
