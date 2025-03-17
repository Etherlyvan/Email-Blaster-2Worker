// components/campaigns/TemplateVariablesHelp.tsx
"use client";

import { useState } from "react";
import { Button } from "../ui/Button";

interface TemplateVariablesHelpProps {
  readonly variables: string[];
}

export function TemplateVariablesHelp({ variables }: TemplateVariablesHelpProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (variables.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => setIsOpen(!isOpen)}
        className="text-xs"
      >
        Template Variables
      </Button>
      
      {isOpen && (
        <div className="absolute z-10 mt-2 w-64 bg-white shadow-lg rounded-md border border-gray-200 p-4 right-0">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium">Available Variables</h3>
            <button
              type="button"
              className="text-gray-400 hover:text-gray-500"
              onClick={() => setIsOpen(false)}
            >
              &times;
            </button>
          </div>
          
          <p className="text-xs text-gray-500 mb-2">
            Use these variables in your email template to personalize content:
          </p>
          
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {variables.map(variable => (
              <div 
                key={variable}
                className="text-xs bg-gray-100 p-1 rounded flex justify-between items-center"
              >
                <code>{`{{${variable}}}`}</code>
                <button
                  type="button"
                  className="text-xs text-blue-600 hover:text-blue-800"
                  onClick={() => {
                    navigator.clipboard.writeText(`{{${variable}}}`);
                    alert(`Copied ${variable} to clipboard!`);
                  }}
                >
                  Copy
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