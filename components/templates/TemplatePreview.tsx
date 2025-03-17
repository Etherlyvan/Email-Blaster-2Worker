// components/templates/TemplatePreview.tsx
"use client";

import { useState } from "react";
import { Button } from "../ui/Button";

interface TemplatePreviewProps {
  readonly html: string;
  readonly sampleData?: Record<string, string>;
}

export function TemplatePreview({ html, sampleData = {} }: TemplatePreviewProps) {
  const [showVariables, setShowVariables] = useState(false);
  const [customData, setCustomData] = useState<Record<string, string>>(sampleData);
  const [currentData, setCurrentData] = useState<Record<string, string>>(sampleData);
  
  // Process template with variables
  const processTemplate = (template: string, data: Record<string, string>) => {
    let processed = template;
    
    // Replace variables with values
    Object.entries(data).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      processed = processed.replace(regex, value);
    });
    
    // Highlight remaining variables if showVariables is true
    if (showVariables) {
      processed = processed.replace(
        /{{([^}]+)}}/g, 
        '<span style="background-color: #FEFCE8; color: #854D0E; padding: 0 2px; border-radius: 2px;">{{$1}}</span>'
      );
    }
    
    return processed;
  };
  
  const processedHtml = processTemplate(html, currentData);
  
  // Extract all variables from the template
  const extractVariables = (template: string) => {
    const regex = /{{([^}]+)}}/g;
    const matches = [...template.matchAll(regex)];
    return [...new Set(matches.map(match => match[1]))];
  };
  
  const variables = extractVariables(html);
  
  const handleDataChange = (key: string, value: string) => {
    const newData = { ...customData, [key]: value };
    setCustomData(newData);
    setCurrentData(newData);
  };
  
  const resetData = () => {
    setCustomData(sampleData);
    setCurrentData(sampleData);
  };
  
  return (
    <div className="space-y-4">
      {variables.length > 0 && (
        <div className="bg-gray-50 p-4 rounded-md">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-medium">Template Variables</h3>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowVariables(!showVariables)}
              >
                {showVariables ? "Hide Variable Markers" : "Show Variable Markers"}
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={resetData}
              >
                Reset Data
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {variables.map(variable => (
              <div key={variable}>
                <label 
                  htmlFor={`var-${variable}`} 
                  className="block text-xs font-medium text-gray-700 mb-1"
                >
                  {variable}
                </label>
                <input
                  id={`var-${variable}`}
                  type="text"
                  className="w-full px-3 py-1 text-sm border border-gray-300 rounded-md"
                  value={customData[variable] || ''}
                  onChange={(e) => handleDataChange(variable, e.target.value)}
                  placeholder={`Value for ${variable}`}
                />
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="border border-gray-300 rounded-md bg-white">
        <div className="p-4">
          <iframe
            srcDoc={`
              <!DOCTYPE html>
              <html>
                <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <style>
                    body {
                      font-family: Arial, sans-serif;
                      margin: 0;
                      padding: 0;
                      line-height: 1.6;
                    }
                    img { max-width: 100%; height: auto; }
                  </style>
                </head>
                <body>${processedHtml}</body>
              </html>
            `}
            className="w-full min-h-[500px] border-0"
            title="Email Preview"
          />
        </div>
      </div>
    </div>
  );
}