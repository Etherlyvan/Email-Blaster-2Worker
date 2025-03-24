// components/templates/TemplateSelectionModal.tsx
"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Dialog } from "@headlessui/react";
import { TemplateGallery } from "./TemplateGallery";
import { Button } from "../ui/Button";
import { 
  XMarkIcon, 
  DocumentMagnifyingGlassIcon 
} from '@heroicons/react/24/outline';

interface Template {
  id: string;
  name: string;
  description: string;
  htmlContent: string;
  updatedAt: string;
}

interface TemplateSelectionModalProps {
  readonly isOpen: boolean;
  readonly onCloseAction: () => void;
  readonly onSelectAction: (templateId: string, htmlContent: string) => void;
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
      return (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading templates...</p>
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-red-600" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <div>
            <p className="font-medium">Error loading templates</p>
            <p className="text-sm">{error}</p>
          </div>
          <button 
            onClick={fetchTemplates} 
            className="ml-auto bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded-md text-sm"
          >
            Retry
          </button>
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
        {/* Use a div with appropriate classNames instead of Dialog.Overlay */}
        <div className="fixed inset-0 bg-black opacity-30" aria-hidden="true" />
        
        {/* This element is to trick the browser into centering the modal contents. */}
        <span
          className="inline-block h-screen align-middle"
          aria-hidden="true"
        >
          &#8203;
        </span>
        
        <div className="inline-block w-full max-w-5xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
          <div className="flex justify-between items-center pb-4 border-b border-gray-200">
            <div className="flex items-center">
              <DocumentMagnifyingGlassIcon className="h-6 w-6 text-blue-500 mr-2" />
              {/* Use h2 element instead of Dialog.Title to avoid deprecation */}
              <h2 className="text-lg font-medium leading-6 text-gray-900">
                Select an Email Template
              </h2>
            </div>
            
            <button
              onClick={onCloseAction}
              className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
            >
              <span className="sr-only">Close</span>
              <XMarkIcon className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
          
          <div className="mt-4">
            <p className="text-sm text-gray-500">
              Choose a template to use as a starting point for your email campaign. You can customize the content later.
            </p>
          </div>
          
          <div className="mt-6 max-h-[70vh] overflow-y-auto px-1">
            {renderModalContent()}
          </div>
          
          <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end">
            <Button variant="outline-primary" onClick={onCloseAction}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}