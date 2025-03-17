// components/templates/TemplateSelectionModal.tsx
"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Dialog } from "@headlessui/react";
import { TemplateGallery } from "./TemplateGallery";
import { Button } from "../ui/Button";

interface Template {
  id: string;
  name: string;
  description: string;
  htmlContent: string;
  updatedAt: string;
}

interface TemplateSelectionModalProps {
  readonly isOpen: boolean;
  readonly onCloseAction: () => void; // Renamed to end with Action
  readonly onSelectAction: (templateId: string, htmlContent: string) => void; // Renamed to end with Action
}

export function TemplateSelectionModal({ 
  isOpen, 
  onCloseAction, 
  onSelectAction 
}: TemplateSelectionModalProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
    }
  }, [isOpen]);
  
  async function fetchTemplates() {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.get('/api/templates');
      setTemplates(response.data);
    } catch (err) {
      console.error("Error fetching templates:", err);
      setError("Failed to load templates");
    } finally {
      setIsLoading(false);
    }
  }
  
  const handleSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      onSelectAction(templateId, template.htmlContent);
      onCloseAction();
    }
  };

  // Extract content rendering to separate function to avoid nested ternary
  const renderModalContent = () => {
    if (isLoading) {
      return <div className="text-center py-8">Loading templates...</div>;
    }
    
    if (error) {
      return (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4">
          {error}
        </div>
      );
    }
    
    return <TemplateGallery templates={templates} onSelect={handleSelect} />;
  };
  
  return (
    <Dialog
      open={isOpen}
      onClose={onCloseAction}
      className="fixed inset-0 z-50 overflow-y-auto"
    >
      <div className="min-h-screen px-4 text-center">
        {/* Use a div with the right styling instead of Dialog.Overlay */}
        <div className="fixed inset-0 bg-black opacity-30" aria-hidden="true" />
        
        {/* This element is to trick the browser into centering the modal contents. */}
        <span
          className="inline-block h-screen align-middle"
          aria-hidden="true"
        >
          &#8203;
        </span>
        
        <div className="inline-block w-full max-w-5xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
          {/* Use h3 element instead of Dialog.Title to avoid deprecation */}
          <h3 className="text-lg font-medium leading-6 text-gray-900">
            Select a Template
          </h3>
          
          <div className="mt-2">
            <p className="text-sm text-gray-500">
              Choose a template to use as a starting point for your campaign.
            </p>
          </div>
          
          <div className="mt-4 max-h-[70vh] overflow-y-auto">
            {renderModalContent()}
          </div>
          
          <div className="mt-4 flex justify-end">
            <Button variant="outline" onClick={onCloseAction}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}