// components/templates/TemplateEditorWrapper.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios, { AxiosError } from "axios";
import { TemplateEditor } from "./TemplateEditor";
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';

interface EmailTemplate {
  id: string;
  name: string;
  description: string;
  content: string;
  htmlContent: string;
  createdAt: string;
  updatedAt: string;
}

interface ApiErrorResponse {
  error?: string;
  message?: string;
}

interface TemplateEditorWrapperProps {
  readonly initialData: EmailTemplate;
}

export function TemplateEditorWrapper({ initialData }: TemplateEditorWrapperProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (data: {
    name: string;
    description: string;
    content: string;
    htmlContent: string;
  }) => {
    setError(null);

    try {
      await axios.put(`/api/templates/${initialData.id}`, data);
      router.push("/templates");
    } catch (err) {
      console.error("Error updating template:", err);
      
      if (axios.isAxiosError(err)) {
        const axiosError = err as AxiosError<ApiErrorResponse>;
        setError(
          axiosError.response?.data?.error || 
          axiosError.response?.data?.message || 
          "Failed to update template"
        );
      } else {
        setError("An unexpected error occurred");
      }
      
      throw err;
    }
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-6 flex items-start">
        <ExclamationCircleIcon className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-red-800">Error updating template</h3>
          <div className="mt-1 text-sm text-red-700">{error}</div>
          <div className="mt-3">
            <button
              type="button"
              onClick={() => setError(null)}
              className="text-sm font-medium text-red-700 hover:text-red-600 underline"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <TemplateEditor
      initialData={initialData}
      onSaveAction={handleSave}
    />
  );
}