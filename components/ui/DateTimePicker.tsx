// components/ui/DateTimePicker.tsx
"use client";

import { forwardRef, useState } from "react";

interface DateTimePickerProps {
  id?: string;
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  error?: string;
  minDate?: Date;
}

export const DateTimePicker = forwardRef<HTMLInputElement, DateTimePickerProps>(
  ({ id, value, onChange, error, minDate }, ref) => {
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
    
    return (
      <div className="w-full">
        <input
          ref={ref}
          type="datetime-local"
          id={id}
          className={`mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
            error ? "border-red-500" : ""
          }`}
          value={dateValue}
          onChange={handleChange}
          min={minDate ? formatDateForInput(minDate) : undefined}
        />
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    );
  }
);

DateTimePicker.displayName = "DateTimePicker";