// components/templates/TemplateEditorWrapper.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { TemplateEditor } from "./TemplateEditor";

// Define the EmailTemplate interface
interface EmailTemplate {
  id: string;
  name: string;
  description: string;
  content: string;
  htmlContent: string;
  createdAt: string;
  updatedAt: string;
}

interface TemplateEditorWrapperProps {
  readonly initialData: EmailTemplate;
}

export function TemplateEditorWrapper({ initialData }: TemplateEditorWrapperProps) {
  const router = useRouter();
  // Removed unused isLoading state
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (data: {
    name: string;
    description: string;
    content: string;
    htmlContent: string;
  }) => {
    // We'll still set and handle errors, but we don't need a loading state here
    // since the TemplateEditor component has its own loading state
    setError(null);

    try {
      await axios.put(`/api/templates/${initialData.id}`, data);
      router.push("/templates");
    } catch (err) {
      console.error("Error updating template:", err);
      setError("Failed to update template");
      throw err; // Re-throw to allow TemplateEditor to handle the error UI
    }
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4">
        {error}
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