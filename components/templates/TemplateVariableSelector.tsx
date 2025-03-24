// components/templates/TemplateVariableSelector.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { 
  VariableIcon, 
  DocumentMagnifyingGlassIcon, 
  PlusIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface TemplateVariableSelectorProps {
  readonly variables: string[];
  readonly onInsert: (variable: string) => void;
}

export function TemplateVariableSelector({ variables, onInsert }: TemplateVariableSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
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
  
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);
  
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
      >
        <VariableIcon className="h-4 w-4 mr-2 text-gray-500" />
        Insert Variable
        <svg className="ml-2 -mr-0.5 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
      
      {isOpen && (
        <div className="absolute z-10 mt-2 w-72 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 overflow-hidden">
          <div className="p-3 border-b border-gray-100">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <DocumentMagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
              </div>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search variables..."
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button 
                    onClick={() => setSearchTerm("")}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
          
          <div className="max-h-72 overflow-y-auto">
            {filteredVariables.length > 0 ? (
              <div className="py-1">
                {filteredVariables.map((variable) => (
                  <button
                    key={variable}
                    className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                    onClick={() => {
                      onInsert(variable);
                      setIsOpen(false);
                      setSearchTerm("");
                    }}
                  >
                    <div className="flex-1">
                      <span className="font-medium">{variable}</span>
                      <div className="text-xs text-gray-500 mt-0.5 font-mono">
                        {`{{${variable}}}`}
                      </div>
                    </div>
                    <PlusIcon className="h-4 w-4 text-gray-400" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="px-4 py-6 text-center">
                <div className="mx-auto h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
                  <VariableIcon className="h-6 w-6 text-gray-400" />
                </div>
                <p className="mt-2 text-sm font-medium text-gray-900">
                  {searchTerm ? "No matching variables" : "No variables available"}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {searchTerm 
                    ? `Try searching with a different term`
                    : `Please add variables to your template first`
                  }
                </p>
              </div>
            )}
          </div>
          
          <div className="border-t border-gray-100 p-2 bg-gray-50">
            <div className="text-xs text-gray-500 px-2">
              Variables are placeholders that will be replaced with actual data when your email is sent.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}