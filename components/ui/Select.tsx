// components/ui/Select.tsx
"use client";

import { SelectHTMLAttributes, forwardRef, useEffect, useState } from "react";
import { ChevronDownIcon } from '@heroicons/react/24/outline';

// Define our custom props
interface CustomSelectProps {
  error?: string;
  label?: string;
  helperText?: string;
  icon?: React.ReactNode;
  customSize?: "sm" | "md" | "lg";
  fullWidth?: boolean;
}

// Combine with native props
type SelectProps = CustomSelectProps & Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'>;

// Create a very basic server-side placeholder
function ServerPlaceholder() {
  return <div className="h-10 w-full bg-gray-100 rounded-md animate-pulse"></div>;
}

// Make ClientOnlySelect a forwarded ref component
const ClientOnlySelect = forwardRef<HTMLSelectElement, SelectProps>(({
  className = "",
  error,
  children,
  label,
  helperText,
  icon,
  customSize = "md",
  fullWidth = true,
  disabled = false,
  ...props
}, ref) => {
  const sizeClasses = {
    sm: "py-1 text-xs",
    md: "py-2 text-sm",
    lg: "py-3 text-base"
  };
  
  return (
    <div className={fullWidth ? "w-full" : "w-auto"}>
      {label && (
        <label 
          htmlFor={props.id} 
          className="mb-1 block text-sm font-medium text-gray-700"
        >
          {label}
        </label>
      )}
      
      <div className="relative">
        {icon && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <span className="text-gray-500 sm:text-sm">{icon}</span>
          </div>
        )}
        
        <select
          ref={ref}
          className={`
            ${icon ? "pl-10" : "pl-3"}
            ${sizeClasses[customSize]}
            ${fullWidth ? "w-full" : "w-auto"}
            ${disabled ? "opacity-60 cursor-not-allowed bg-gray-50" : ""}
            appearance-none
            rounded-md border pr-10 shadow-sm
            focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500
            ${error 
              ? "border-red-300 text-red-900" 
              : "border-gray-300 text-gray-900"
            } ${className}
          `}
          disabled={disabled}
          {...props}
        >
          {children}
        </select>
        
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
          <ChevronDownIcon className={`h-5 w-5 ${error ? "text-red-500" : "text-gray-400"}`} aria-hidden="true" />
        </div>
      </div>
      
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      {helperText && !error && <p className="mt-1 text-sm text-gray-500">{helperText}</p>}
    </div>
  );
});

ClientOnlySelect.displayName = "ClientOnlySelect";

// Main component that uses useState to ensure client-only rendering
const Select = forwardRef<HTMLSelectElement, SelectProps>((props, ref) => {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) {
    return <ServerPlaceholder />;
  }
  
  return <ClientOnlySelect ref={ref} {...props} />;
});

Select.displayName = "Select";

export { Select };
export default Select;