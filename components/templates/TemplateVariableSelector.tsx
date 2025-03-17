// components/templates/TemplateVariableSelector.tsx
"use client";

import { useState, useRef, useEffect } from "react";

interface TemplateVariableSelectorProps {
  readonly variables: string[];
  readonly onInsert: (variable: string) => void;
}

export function TemplateVariableSelector({ variables, onInsert }: TemplateVariableSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const filteredVariables = variables.filter(variable => 
    variable.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        Insert Variable
        <svg className="ml-2 -mr-0.5 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
      
      {isOpen && (
        <div className="absolute z-10 mt-1 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
          <div className="p-2">
            <input
              type="text"
              placeholder="Search variables..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="max-h-60 overflow-y-auto py-1">
            {filteredVariables.length > 0 ? (
              filteredVariables.map((variable) => (
                <button
                  key={variable}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  onClick={() => {
                    onInsert(variable);
                    setIsOpen(false);
                  }}
                >
                  {`{{${variable}}}`}
                </button>
              ))
            ) : (
              <div className="text-center py-2 text-sm text-gray-500">
                {searchTerm ? "No matching variables" : "No variables available"}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}