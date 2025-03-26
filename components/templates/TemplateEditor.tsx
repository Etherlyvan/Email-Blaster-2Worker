// components/templates/TemplateEditor.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { EmailEditor } from "../editor/EmailEditor";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { 
  ArrowDownTrayIcon, 
  XMarkIcon, 
  ArrowLeftIcon 
} from '@heroicons/react/24/outline';

interface TemplateEditorProps {
  readonly initialData?: {
    id?: string;
    name: string;
    description: string;
    content: string;
    htmlContent: string;
  };
  readonly onSaveAction: (data: {
    name: string;
    description: string;
    content: string;
    htmlContent: string;
  }) => Promise<void>;
}

export function TemplateEditor({ initialData, onSaveAction }: TemplateEditorProps) {
  const router = useRouter();
  const [name, setName] = useState(initialData?.name ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [htmlContent, setHtmlContent] = useState(initialData?.htmlContent ?? "<div style='font-family: Arial, sans-serif;'>Write your email content here...</div>");
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Track unsaved changes
  useEffect(() => {
    if (initialData) {
      const hasChanges = 
        name !== initialData.name ||
        description !== initialData.description ||
        htmlContent !== initialData.htmlContent;
      
      setHasUnsavedChanges(hasChanges);
    } else {
      // For new templates, check if any data has been entered
      setHasUnsavedChanges(
        name.trim() !== "" || 
        description.trim() !== "" || 
        htmlContent !== "<div style='font-family: Arial, sans-serif;'>Write your email content here...</div>"
      );
    }
  }, [name, description, htmlContent, initialData]);

  // Handle editor change
  const handleEditorChange = useCallback((html: string) => {
    setHtmlContent(html);
  }, []);

  // Handle form submission
  const handleSave = async () => {
    if (!name) {
      alert("Please enter a template name");
      return;
    }

    setIsSaving(true);
    try {
      await onSaveAction({
        name,
        description,
        content: htmlContent,
        htmlContent: htmlContent,
      });
      
      // components/templates/TemplateEditor.tsx (continued)
      router.push("/templates");
    } catch (error) {
      console.error("Error saving template:", error);
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 bg-white p-6 rounded-lg shadow-sm">
      <div className="border-b pb-4 mb-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">
            {initialData?.id ? "Edit Template" : "Create New Template"}
          </h1>
          {hasUnsavedChanges && (
            <span className="text-sm text-amber-600 bg-amber-50 px-2 py-1 rounded-md flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Unsaved changes
            </span>
          )}
        </div>
        <p className="text-gray-500 mt-1">
          Design your email template and use variables to personalize content.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Template Name*
          </label>
          <Input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Welcome Email"
            required
            className="mt-1"
          />
          <p className="mt-1 text-xs text-gray-500">Give your template a descriptive name</p>
        </div>
        
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <Input
            id="description"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Template for welcoming new subscribers"
            className="mt-1"
          />
          <p className="mt-1 text-xs text-gray-500">Optional description to help identify the template&apos;s purpose</p>
        </div>
      </div>
      
      <div className="mt-8">
        <EmailEditor
          initialHtml={htmlContent}
          onChangeAction={handleEditorChange}
          availableVariables={["name", "email", "company", "date", "unsubscribe", "view_in_browser"]}
        />
      </div>
      
      <div className="flex justify-between space-x-4 pt-6 mt-8 border-t border-gray-200">
        <Button 
          variant="outline-secondary" 
          onClick={() => router.push("/templates")}
          icon={<ArrowLeftIcon className="h-4 w-4 mr-1.5" />}
        >
          Back to Templates
        </Button>
        
        <div className="flex space-x-3">
          <Button 
            variant="outline-primary" 
            onClick={() => router.push("/templates")}
            icon={<XMarkIcon className="h-4 w-4 mr-1.5" />}
          >
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSave}
            loading={isSaving}
            disabled={!hasUnsavedChanges}
            icon={<ArrowDownTrayIcon className="h-4 w-4 mr-1.5" />}
          >
            {initialData?.id ? "Update Template" : "Save Template"}
          </Button>
        </div>
      </div>
    </div>
  );
}