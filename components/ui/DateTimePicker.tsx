// components/ui/DateTimePicker.tsx
"use client";

import { forwardRef, useState } from "react";
import { CalendarIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface DateTimePickerProps {
  id?: string;
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  error?: string;
  minDate?: Date;
  className?: string;
}

export const DateTimePicker = forwardRef<HTMLInputElement, DateTimePickerProps>(
  ({ id, value, onChange, error, minDate, className = "" }, ref) => {
    const [dateValue, setDateValue] = useState<string>(
      value ? formatDateForInput(value) : ""
    );
    
    function formatDateForInput(date: Date): string {
      if (!date) return "";
      
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    }
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setDateValue(val);
      
      if (onChange) {
        if (val) {
          onChange(new Date(val));
        } else {
          onChange(undefined);
        }
      }
    };
    
    const clearDate = () => {
      setDateValue("");
      // Fix the unused expression by using an if statement
      if (onChange) {
        onChange(undefined);
      }
    };
    
    return (
      <div className="w-full">
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <CalendarIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </div>
          <input
            ref={ref}
            type="datetime-local"
            id={id}
            className={`block w-full rounded-md border-gray-300 pl-10 pr-10 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
              error ? "border-red-300" : ""
            } ${className}`}
            value={dateValue}
            onChange={handleChange}
            min={minDate ? formatDateForInput(minDate) : undefined}
          />
          {dateValue && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <button
                type="button"
                onClick={clearDate}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
              >
                <XMarkIcon className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          )}
        </div>
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    );
  }
);

DateTimePicker.displayName = "DateTimePicker";