// app/templates/create/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { TemplateEditor } from "../../../components/templates/TemplateEditor";

export default function CreateTemplatePage() {
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  
  const handleSave = async (data: {
    name: string;
    description: string;
    content: string;
    htmlContent: string;
  }) => {
    try {
      setError(null);
      await axios.post("/api/templates", data);
      router.push("/templates");
    } catch (error) {
      console.error("Error creating template:", error);
      setError("Failed to create template. Please try again.");
      throw error;
    }
  };
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-800 rounded-md p-4">
          {error}
        </div>
      )}
      
      <TemplateEditor 
        onSaveAction={handleSave} 
      />
    </div>
  );
}