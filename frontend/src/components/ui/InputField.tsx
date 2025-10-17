"use client";

import React, { useEffect, useRef, useState, ChangeEvent, ReactNode } from "react";
import { cn } from "@/lib/utils";

// Date formatting and validation functions
function parseDDMMYYYYToISO(value: string): string | null {
	const m = value.match(/^([0-3]?\d)\/([0-1]?\d)\/(\d{4})$/);
	if (!m) return null;
	const day = Number(m[1]);
	const month = Number(m[2]);
	const year = Number(m[3]);
	const d = new Date(year, month - 1, day);
	if (
		d.getFullYear() !== year ||
		d.getMonth() !== month - 1 ||
		d.getDate() !== day
	)
		return null;
	return d.toISOString();
}

function formatBirthdayTyping(raw: string): string {
	const digits = raw.replace(/[^0-9]/g, "").slice(0, 8);
	let out = digits;
	if (digits.length > 4) out = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
	else if (digits.length > 2) out = `${digits.slice(0, 2)}/${digits.slice(2)}`;
	return out;
}

function validateDateInstant(value: string, isBirthday = false): string | undefined {
	if (!value.trim()) return undefined; // Allow empty dates
	
	// Advanced validation: check day/month/year ranges before parsing
	const m = value.trim().match(/^([0-3]?\d)\/([0-1]?\d)\/(\d{4})$/);
	if (!m) return "Enter valid date as DD/MM/YYYY";
	
	const day = Number(m[1]);
	const month = Number(m[2]);
	const year = Number(m[3]);
	
	// Validate ranges
	if (day < 1 || day > 31) return "Day must be between 01 and 31";
	if (month < 1 || month > 12) return "Month must be between 01 and 12";
	
	const maxYear = new Date().getFullYear();
	if (year < 1900 || year > maxYear) return `Year must be between 1900 and ${maxYear}`;
	
	// Check if the date is actually valid (handles Feb 30, etc.)
	const iso = parseDDMMYYYYToISO(value.trim());
	if (!iso) return "Invalid date (e.g., Feb 30 doesn't exist)";
	
	if (isBirthday) {
		// Additional birthday validations: not today, not future, at least 4 years
		const d = new Date(iso);
		if (isNaN(d.getTime())) return "Invalid date";
		const now = new Date();
		d.setHours(0,0,0,0);
		now.setHours(0,0,0,0);
		if (d.getTime() === now.getTime()) return "Birthday cannot be today";
		if (d.getTime() > now.getTime()) return "Birthday cannot be in the future";
		const min = new Date(now);
		min.setFullYear(min.getFullYear() - 4);
		if (d.getTime() > min.getTime()) return "Minimum age is 4 years";
	}
	
	return undefined;
}

// Styling constants for StudentOnboarding consistency
const labelCls = "text-[16px] font-semibold";
const inputBase = "w-full h-[52px] rounded-[12px] px-4 outline-none border transition-colors";
const inputIdle = "border-gray-200 bg-white focus:border-[#3B82F6]";
const inputError = "border-red-400 bg-white";

// ORIGINAL InputField Component (for backward compatibility)
interface OriginalInputFieldProps {
	label: string;
	name: string;
	value: string | number;
	onChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
	
	placeholder?: string;
	type?: string;
	isSelect?: boolean;
	isRadio?: boolean;
	isTextarea?: boolean;
	as?: 'textarea';
	options?: string[];
  layout?: "vertical" | "horizontal";
	icon?: ReactNode;
	inputMode?: "text" | "numeric" | "decimal" | "tel" | "email" | "search" | "url";
	pattern?: string;
	maxLength?: number;
	numericOnly?: boolean;
	required?: boolean;
	disabled?: boolean;
	error?: string;
	className?: string;
	rows?: number;
}

function InputField({
	label,
	name,
	value,
	onChange,
	placeholder,
	type = "text",
	isSelect = false,
	isRadio = false,
	isTextarea = false,
	options = [],
  layout = "vertical",
	icon,
	inputMode,
	pattern,
	maxLength,
	numericOnly = false,
	required = false,
	disabled = false,
	error,
	className,
	rows = 3,
}: OriginalInputFieldProps) {
	const [open, setOpen] = useState(false);

	return (
		<div className={cn("flex flex-col gap-2 w-full", className)}>
			<label className="font-[Montserrat] font-medium text-[16px] md:text-[18px] text-black">
				{label} {required && <span className="text-red-500">*</span>}
			</label>

			{isSelect ? (
				<div className="relative">
					<div
						onClick={() => setOpen(!open)}
                    className={cn(
                            `w-full h-[48px] rounded-[12px] p-[12px] bg-[#F5F6F9] dark:bg-gray-800 flex items-center justify-between cursor-pointer border border-[#DADADD] dark:border-gray-700`,
                            value ? "text-black dark:text-gray-100" : "text-[#697282] dark:text-gray-300",
                            disabled && "opacity-50 cursor-not-allowed"
                        )}
					>
						{value || `Select ${label}`}
						<span className="text-[#697282]">
							{open ? "↑" : "↓"}
						</span>
					</div>

					{open && !disabled && (
                        <div className="mt-2 bg-white dark:bg-gray-800 shadow-md rounded-[12px] border border-[#DADADD] dark:border-gray-700 flex flex-col">
							{options.map((opt) => (
								<div
									key={opt}
									onClick={() => {
										const event = {
											target: { name, value: opt },
										} as unknown as ChangeEvent<HTMLSelectElement>;
										onChange(event);
										setOpen(false);
									}}
									className="px-4 py-2 hover:bg-[#F5F6F9] cursor-pointer"
								>
									{opt}
								</div>
							))}
						</div>
					)}
				</div>
            ) : isRadio ? (
                <div className={layout === "horizontal" ? "flex items-center gap-6" : "flex flex-col gap-3"}>
					{options.map((option) => (
						<button
							key={option}
							type="button"
							disabled={disabled}
							onClick={() => {
								const event = {
									target: { name, value: option },
								} as unknown as ChangeEvent<HTMLInputElement>;
								onChange(event);
							}}
                            className="group flex items-center gap-3 text-left"
						>
                            <span className={`relative grid place-items-center w-[18px] h-[18px] rounded-full border ${value === option ? "border-[#0A46E4] ring-4 ring-[#0A46E4]/20" : "border-gray-300"}`}>
                                {value === option && <span className="w-[8px] h-[8px] rounded-full bg-[#0A46E4]" />}
							</span>
                            <span className="text-[16px] font-semibold text-[#111827]">
								{option}
							</span>
						</button>
					))}
				</div>
			) : isTextarea ? (
                <textarea
					name={name}
					value={value}
					disabled={disabled}
					onChange={onChange}
					placeholder={placeholder}
					maxLength={maxLength}
					rows={rows}
					className={cn(
                        `w-full px-4 py-3 border border-[#DADADD] dark:border-gray-700 rounded-[12px] bg-[#F5F6F9] dark:bg-gray-800 text-black dark:text-gray-100
                        placeholder:font-[Montserrat] placeholder:text-[16px] placeholder:text-[#697282] dark:placeholder:text-gray-400
                        resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`,
						disabled && "opacity-50 cursor-not-allowed"
					)}
				/>
			) : (
				<div className="relative w-full">
					{icon && (
						<div className="absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center">
							{icon}
						</div>
					)}
                    <input
						type={type}
						name={name}
						value={value}
						disabled={disabled}
						onChange={(e) => {
							if (numericOnly) {
								const numericValue = e.target.value.replace(/\D/g, "");
								const event = {
									...e,
									target: { ...e.target, value: numericValue, name: e.target.name },
								};
								onChange(event as ChangeEvent<HTMLInputElement>);
							} else {
								onChange(e);
							}
						}}
						placeholder={placeholder}
						inputMode={inputMode}
						pattern={pattern}
						maxLength={maxLength}
                        className={cn(
                            `w-full h-[48px] rounded-[12px] border border-[#DADADD] dark:border-gray-700 bg-[#F5F6F9] dark:bg-gray-800 text-black dark:text-gray-100
                            placeholder:font-[Montserrat] placeholder:text-[16px] placeholder:text-[#697282] dark:placeholder:text-gray-400
                            ${icon ? "pl-12" : "p-5"}`,
							disabled && "opacity-50 cursor-not-allowed"
						)}
					/>
				</div>
			)}

			{error && <p className="text-red-500 text-sm">{error}</p>}
		</div>
	);
}

// NEW COMPONENTS for StudentOnboarding (named exports)

// DateInput Component
interface DateInputProps {
	label: string;
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	error?: string;
	isBirthday?: boolean;
	className?: string;
	maxLength?: number;
	floating?: boolean;
}

export const DateInput: React.FC<DateInputProps> = ({
	label,
	value,
	onChange,
	placeholder = "DD/MM/YYYY",
	error,
	isBirthday = false,
	className = "",
	maxLength = 10,
	floating = false
}) => {
	const [focused, setFocused] = useState(false);
	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const formattedValue = formatBirthdayTyping(e.target.value);
		onChange(formattedValue);
	};

	if (floating) {
		const isFloated = focused || (value ?? "").trim() !== "";
		const showPlaceholder = focused && (value ?? "").trim() === "";
		return (
			<div className={`transition relative ${className}`}>
				<input
					className={[inputBase, error ? inputError : inputIdle, showPlaceholder ? "placeholder-gray-400" : "placeholder-transparent"].join(" ")}
					placeholder={placeholder}
					value={value}
					onChange={handleChange}
					onFocus={() => setFocused(true)}
					onBlur={() => setFocused(false)}
					maxLength={maxLength}
				/>
				<label
					className={
						"absolute left-4 px-1 bg-white transition-all " +
						(isFloated
							? "-top-2 text-[14px] text-[#0A46E4]"
							: "top-1/2 -translate-y-1/2 text-[16px] text-gray-400")
					}
				>
					{label}
				</label>
				{error && (
					<span className="text-[12px] text-red-500">{error}</span>
				)}
			</div>
		);
	}

	return (
		<div className={`transition ${className}`}>
			<span className={labelCls}>{label}</span>
			<input
				className={[inputBase, error ? inputError : inputIdle].join(" ")}
				placeholder={placeholder}
				value={value}
				onChange={handleChange}
				maxLength={maxLength}
			/>
			{error && (
				<span className="text-[12px] text-red-500">{error}</span>
			)}
		</div>
	);
};

// FormField Component
interface FormFieldProps {
	label: string;
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	error?: string;
	className?: string;
	maxLength?: number;
	type?: string;
	autoComplete?: string;
	onValidate?: (value: string) => string | undefined;
	floating?: boolean;
}

export const FormField: React.FC<FormFieldProps> = ({
	label,
	value,
	onChange,
	placeholder = "",
	error,
	className = "",
	maxLength,
	type = "text",
	autoComplete,
	onValidate,
	floating = false
}) => {
	const [focused, setFocused] = useState(false);
	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newValue = e.target.value;
		onChange(newValue);
	};

	if (floating) {
		const isFloated = focused || (value ?? "").trim() !== "";
		return (
			<div className={`transition relative ${className}`}>
				<input
					className={[inputBase, error ? inputError : inputIdle, "placeholder-transparent"].join(" ")}
					placeholder={placeholder || label}
					value={value}
					onChange={handleChange}
					onFocus={() => setFocused(true)}
					onBlur={() => setFocused(false)}
					maxLength={maxLength}
					type={type}
					autoComplete={autoComplete}
				/>
				<label
					className={
						"absolute left-4 px-1 bg-white transition-all " +
						(isFloated
							? "-top-2 text-[14px] text-[#0A46E4]"
							: "top-1/2 -translate-y-1/2 text-[16px] text-gray-400")
					}
				>
					{label}
				</label>
				{error && (
					<span className="text-[12px] text-red-500">{error}</span>
				)}
			</div>
		);
	}

	return (
		<div className={`transition ${className}`}>
			<span className={labelCls}>{label}</span>
			<input
				className={[inputBase, error ? inputError : inputIdle].join(" ")}
				placeholder={placeholder}
				value={value}
				onChange={handleChange}
				maxLength={maxLength}
				type={type}
				autoComplete={autoComplete}
			/>
			{error && (
				<span className="text-[12px] text-red-500">{error}</span>
			)}
		</div>
	);
};

// RadioGroup Component
interface RadioGroupProps {
	label: string;
	name: string;
	value: string;
	onChange: (value: string) => void;
	options: string[];
	error?: string;
	className?: string;
	layout?: "vertical" | "horizontal";
}

export const RadioGroup: React.FC<RadioGroupProps> = ({
	label,
	name,
	value,
	onChange,
	options,
	error,
	className = "",
	layout = "vertical"
}) => {
	const containerClass = layout === "horizontal" 
		? "flex items-center gap-6 mt-2" 
		: "flex flex-col gap-2 mt-2";

	return (
		<div className={`transition ${className}`}>
			<span className={labelCls}>{label}</span>
			<div className={containerClass}>
				{options.map((option) => (
					<label key={option} className="flex items-center gap-3">
						<input
							type="radio"
							name={name}
							value={option}
							checked={value === option}
							onChange={(e) => onChange(e.target.value)}
							className="w-4 h-4 text-[#0A46E4]"
						/>
						<span className="text-[14px] font-semibold">{option}</span>
					</label>
				))}
			</div>
			{error && (
				<span className="text-[12px] text-red-500">{error}</span>
			)}
		</div>
	);
};

// Custom Dropdown Component (existing from StudentOnboarding)
interface DropdownProps {
	label: string;
	value: string;
	onChange: (v: string) => void;
	options: string[];
	error?: string;
}

export const Dropdown: React.FC<DropdownProps> = ({ label, value, onChange, options, error }) => {
	const [open, setOpen] = useState(false);
	const ref = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		function onDoc(e: MouseEvent) {
			if (!ref.current) return;
			if (!ref.current.contains(e.target as Node)) setOpen(false);
		}
		document.addEventListener("mousedown", onDoc);
		return () => document.removeEventListener("mousedown", onDoc);
	}, []);

	return (
		<div ref={ref} className="relative">
			<button
				type="button"
				onClick={() => setOpen((p) => !p)}
				className={[inputBase, error ? inputError : inputIdle, "flex items-center justify-between text-left"].join(" ")}
			>
				<span className={value ? "text-[#111827]" : "text-gray-400"}>{value || label}</span>
				<svg className={`w-4 h-4 ml-2 transition-transform ${open ? "rotate-180" : "rotate-0"}`} viewBox="0 0 20 20" fill="none" stroke="#111827" strokeWidth="2">
					<path d="M6 8l4 4 4-4" />
				</svg>
			</button>
			{open && (
				<div className="absolute z-20 mt-2 w-full bg-[#F7F9FC] border border-gray-200 rounded-[12px] shadow-lg p-3">
					<div className="text-[13px] font-semibold mb-2">{label}</div>
					<div className="max-h-56 overflow-auto pr-1">
						{options.map((opt) => (
							<button
								key={opt}
								onClick={() => {
									onChange(opt);
									setOpen(false);
								}}
								className="w-full flex items-center gap-3 py-3 px-2 rounded-[10px] hover:bg-white text-[14px] text-[#111827]"
								type="button"
							>
								<span className={`relative inline-flex items-center justify-center w-[18px] h-[18px] rounded-full border ${value === opt ? "border-[#0A46E4] ring-4 ring-[#0A46E4]/20" : "border-gray-300"}`}>
									{value === opt && <span className="w-[8px] h-[8px] rounded-full bg-[#0A46E4]" />}
								</span>
								<span className="flex-1 text-left">{opt}</span>
							</button>
						))}
					</div>
				</div>
			)}
			{error && <span className="text-[12px] text-red-500 mt-1 inline-block">{error}</span>}
		</div>
	);
};

// Export validation functions for use in StudentOnboarding
export { validateDateInstant, formatBirthdayTyping, parseDDMMYYYYToISO };

// Default export for backward compatibility (original InputField)
export default InputField;
