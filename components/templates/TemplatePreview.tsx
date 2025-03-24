// components/templates/TemplatePreview.tsx
"use client";

import { useState } from "react";
import { Button } from "../ui/Button";
import { 
  EyeIcon, 
  EyeSlashIcon, 
  ArrowPathIcon,
  AdjustmentsHorizontalIcon,
  ArrowsPointingOutIcon
} from '@heroicons/react/24/outline';

interface TemplatePreviewProps {
  readonly html: string;
  readonly sampleData?: Record<string, string>;
}

export function TemplatePreview({ html, sampleData = {} }: TemplatePreviewProps) {
  const [showVariables, setShowVariables] = useState(false);
  const [customData, setCustomData] = useState<Record<string, string>>(sampleData);
  const [currentData, setCurrentData] = useState<Record<string, string>>(sampleData);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isControlsVisible, setIsControlsVisible] = useState(true);
  
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
        '<span style="background-color: #FEFCE8; color: #854D0E; padding: 0 2px; border-radius: 2px; font-family: monospace;">{{$1}}</span>'
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
  
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };
  
  return (
    <div className={`space-y-4 ${isFullscreen ? 'fixed inset-0 z-50 bg-white p-6' : ''}`}>
      {isControlsVisible && variables.length > 0 && (
        <div className="bg-gray-50 rounded-lg shadow-sm p-4">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center">
              <AdjustmentsHorizontalIcon className="h-5 w-5 text-gray-500 mr-2" />
              <h3 className="text-sm font-medium text-gray-900">Personalization Variables</h3>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline-primary" 
                size="sm" 
                onClick={() => setShowVariables(!showVariables)}
                icon={showVariables ? <EyeSlashIcon className="h-4 w-4 mr-1" /> : <EyeIcon className="h-4 w-4 mr-1" />}
              >
                {showVariables ? "Hide Variable Markers" : "Show Variable Markers"}
              </Button>
              <Button 
                variant="outline-primary" 
                size="sm" 
                onClick={resetData}
                icon={<ArrowPathIcon className="h-4 w-4 mr-1" />}
              >
                Reset Data
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {variables.map(variable => (
              <div key={variable} className="bg-white p-3 rounded-md shadow-sm border border-gray-100">
                <label 
                  htmlFor={`var-${variable}`} 
                  className="block text-xs font-medium text-gray-700 mb-1"
                >
                  {variable}
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-xs">
                    {`{{${variable}}}`}
                  </span>
                  <input
                    id={`var-${variable}`}
                    type="text"
                    className="flex-1 min-w-0 w-full px-3 py-1.5 text-sm border border-gray-300 rounded-r-md focus:ring-blue-500 focus:border-blue-500"
                    value={customData[variable] || ''}
                    onChange={(e) => handleDataChange(variable, e.target.value)}
                    placeholder={`Value for ${variable}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="relative border border-gray-300 rounded-lg bg-white overflow-hidden shadow-sm">
        <div className="flex justify-between items-center px-4 py-2 bg-gray-50 border-b border-gray-200">
          <h3 className="text-sm font-medium text-gray-700">Email Preview</h3>
          <div className="flex gap-2">
            {variables.length > 0 && (
              <Button 
                variant="outline-secondary" 
                size="sm" 
                onClick={() => setIsControlsVisible(!isControlsVisible)}
                icon={isControlsVisible ? <EyeSlashIcon className="h-4 w-4 mr-1" /> : <EyeIcon className="h-4 w-4 mr-1" />}
              >
                {isControlsVisible ? "Hide Controls" : "Show Controls"}
              </Button>
            )}
            <Button 
              variant="outline-secondary" 
              size="sm" 
              onClick={toggleFullscreen}
              icon={<ArrowsPointingOutIcon className="h-4 w-4 mr-1" />}
            >
              {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            </Button>
          </div>
        </div>
        <iframe
          srcDoc={`
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                  body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                    margin: 0;
                    padding: 16px;
                    line-height: 1.6;
                    color: #333;
                  }
                  img { max-width: 100%; height: auto; }
                  a { color: #3b82f6; text-decoration: none; }
                  a:hover { text-decoration: underline; }
                  .email-container {
                    max-width: 600px;
                    margin: 0 auto;
                  }
                </style>
              </head>
              <body>
                <div class="email-container">${processedHtml}</div>
              </body>
            </html>
          `}
          className={`w-full border-0 ${isFullscreen ? 'h-[calc(100vh-120px)]' : 'h-[500px]'}`}
          title="Email Preview"
        />
        
        {isFullscreen && (
          <div className="absolute bottom-4 right-4">
            <Button 
              variant="primary" 
              size="sm" 
              onClick={toggleFullscreen}
              className="shadow-lg"
            >
              Exit Fullscreen
            </Button>
          </div>
        )}
      </div>
      
      {variables.length > 0 && (
        <div className="text-xs text-gray-500 text-center mt-2">
          <p>
            This preview shows how your email will look with the provided variable values.
            {showVariables && " Highlighted text indicates variables without values."}
          </p>
        </div>
      )}
    </div>
  );
}