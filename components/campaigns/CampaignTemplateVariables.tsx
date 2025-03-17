// components/campaigns/CampaignTemplateVariables.tsx 
"use client";

import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { Button } from "../ui/Button";

interface Variable {
  name: string;
  description: string;
  example: string;
}

const DEFAULT_VARIABLES: Variable[] = [
  { name: "email", description: "Recipient's email address", example: "john@example.com" },
  { name: "name", description: "Recipient's name", example: "John Doe" },
  { name: "company", description: "Recipient's company", example: "ACME Inc." },
];

interface CampaignTemplateVariablesProps {
  readonly groupId?: string;
}

// Extract the table rows component to reduce nesting
const VariableTableRows = ({ 
  variables, 
  onCopy 
}: { 
  readonly variables: Variable[]; 
  readonly onCopy: (variable: string) => void;
}) => {
  return (
    <>
      {variables.map(variable => (
        <tr key={variable.name} className="border-t border-gray-100">
          <td className="p-1">
            <code>{`{{${variable.name}}}`}</code>
          </td>
          <td className="p-1 text-gray-500">
            {variable.description}
          </td>
          <td className="p-1">
            <button
              type="button"
              className="text-blue-600 hover:text-blue-800"
              onClick={() => onCopy(variable.name)}
            >
              Copy
            </button>
          </td>
        </tr>
      ))}
    </>
  );
};

// Extract the mapping function to reduce nesting
const mapVariablesFromResponse = (
  responseVariables: string[],
  sampleData: Record<string, string>
): Variable[] => {
  return responseVariables.map((v: string) => {
    const defaultVar = DEFAULT_VARIABLES.find(dv => dv.name === v);
    return {
      name: v,
      description: defaultVar?.description ?? "Contact data field",
      example: sampleData?.[v] ?? defaultVar?.example ?? "Value",
    };
  });
};

// Separate function to fetch variables
const fetchGroupVariables = async (
  groupId: string,
  onSuccess: (variables: Variable[]) => void,
  onError: () => void,
  onFinally: () => void
): Promise<void> => {
  try {
    const response = await axios.get(`/api/groups/${groupId}/variables`);
    const data = response.data;
    
    if (data.variables && data.variables.length > 0) {
      const mappedVariables = mapVariablesFromResponse(data.variables, data.sampleData ?? {});
      onSuccess(mappedVariables);
    }
  } catch (error) {
    console.error("Failed to fetch variables:", error);
    onError();
  } finally {
    onFinally();
  }
};

export function CampaignTemplateVariables({ groupId }: CampaignTemplateVariablesProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [variables, setVariables] = useState<Variable[]>(DEFAULT_VARIABLES);
  const [isLoading, setIsLoading] = useState(false);
  
  const copyToClipboard = useCallback((variable: string) => {
    navigator.clipboard.writeText(`{{${variable}}}`);
  }, []);
  
  const handleVariablesLoaded = useCallback((newVariables: Variable[]) => {
    setVariables(newVariables);
  }, []);
  
  const handleError = useCallback(() => {
    // Could set an error state here if needed
  }, []);
  
  const handleLoadingComplete = useCallback(() => {
    setIsLoading(false);
  }, []);
  
  useEffect(() => {
    if (groupId) {
      setIsLoading(true);
      fetchGroupVariables(
        groupId,
        handleVariablesLoaded,
        handleError,
        handleLoadingComplete
      );
    }
  }, [groupId, handleVariablesLoaded, handleError, handleLoadingComplete]);
  
  const toggleOpen = useCallback(() => {
    setIsOpen(!isOpen);
  }, [isOpen]);
  
  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);
  
  return (
    <div className="relative">
      <Button 
        variant="outline" 
        size="sm"
        onClick={toggleOpen}
        disabled={isLoading}
      >
        {isLoading ? "Loading..." : "Template Variables"}
      </Button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-md shadow-lg z-10 border border-gray-200">
          <div className="p-3 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-sm font-medium">Available Template Variables</h3>
            <button
              type="button"
              className="text-gray-400 hover:text-gray-500"
              onClick={handleClose}
            >
              &times;
            </button>
          </div>
          
          <div className="p-3 max-h-60 overflow-y-auto">
            {variables.length > 0 ? (
              <table className="w-full text-xs">
                <thead>
                  <tr>
                    <th className="text-left p-1">Variable</th>
                    <th className="text-left p-1">Description</th>
                    <th className="text-left p-1">Action</th>
                  </tr>
                </thead>
                <tbody>
                  <VariableTableRows 
                    variables={variables} 
                    onCopy={copyToClipboard} 
                  />
                </tbody>
              </table>
            ) : (
              <p className="text-gray-500">No variables available.</p>
            )}
          </div>
          
          <div className="p-3 border-t border-gray-200 bg-gray-50 text-xs text-gray-500">
            <p>Use variables in your template to personalize emails.</p>
            <p className="mt-1">Example: &quot;Hello &#123;&#123;name&#125;&#125;, thank you for your interest!&quot;</p>
          </div>
        </div>
      )}
    </div>
  );
}