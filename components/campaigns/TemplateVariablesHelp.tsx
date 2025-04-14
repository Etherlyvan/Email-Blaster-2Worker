// components/campaigns/TemplateVariablesHelp.tsx
"use client";

import { useState } from "react";
import { Button } from "../ui/Button";
import { XMarkIcon, ClipboardDocumentIcon, InformationCircleIcon, CheckIcon } from '@heroicons/react/24/outline';

interface TemplateVariablesHelpProps {
  readonly variables: string[];
}

export function TemplateVariablesHelp({ variables }: TemplateVariablesHelpProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedVariable, setCopiedVariable] = useState<string | null>(null);

  if (variables.length === 0) {
    return null;
  }

  const handleCopy = (variable: string) => {
    navigator.clipboard.writeText(`{{${variable}}}`);
    setCopiedVariable(variable);
    
    // Reset copied state after 2 seconds
    setTimeout(() => {
      setCopiedVariable(null);
    }, 2000);
  };

  return (
    <div className="relative">
      <Button 
        variant="outline-secondary"
        size="sm" 
        onClick={() => setIsOpen(!isOpen)}
        className="text-xs"
        icon={<InformationCircleIcon className="h-4 w-4 mr-1" />}
      >
        Template Variables
      </Button>
      
      {isOpen && (
        <div className="absolute z-10 mt-2 w-80 rounded-md border border-gray-200 bg-white p-4 shadow-lg right-0">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium text-gray-900">Available Variables</h3>
            <button
              type="button"
              className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
              onClick={() => setIsOpen(false)}
              aria-label="Close"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
          
          <p className="text-xs text-gray-500 mb-3">
            Use these variables in your email template to personalize content:
          </p>
          
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {variables.map(variable => (
              <div 
                key={variable}
                className="flex justify-between items-center rounded-md bg-gray-50 p-2 text-xs border border-gray-100"
              >
                <code className="font-mono text-blue-600 flex-1">{`{{${variable}}}`}</code>
                <button
                  type="button"
                  className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium transition-colors duration-200 ${
                    copiedVariable === variable 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  onClick={() => handleCopy(variable)}
                >
                  {copiedVariable === variable ? (
                    <>
                      <CheckIcon className="h-3 w-3 mr-1" />
                      Copied
                    </>
                  ) : (
                    <>
                      <ClipboardDocumentIcon className="h-3 w-3 mr-1" />
                      Copy
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
          
          <div className="mt-3 pt-2 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Example: &quot;Hello &#123;&#123;name&#125;&#125;, thank you for your interest in &#123;&#123;company&#125;&#125;.&quot;
            </p>
          </div>
        </div>
      )}
    </div>
  );
}