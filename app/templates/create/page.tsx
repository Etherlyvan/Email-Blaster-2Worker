// app/templates/create/page.tsx
"use client";

import { useState } from "react";
import axios from "axios";
import { TemplateEditor } from "../../../components/templates/TemplateEditor";

export default function CreateTemplatePage() {
  const [error, setError] = useState<string | null>(null);
  
  const handleSave = async (data: {
    name: string;
    description: string;
    content: string;
    htmlContent: string;
  }) => {
    try {
      await axios.post("/api/templates", data);
    } catch (error) {
      console.error("Error creating template:", error);
      setError("Failed to create template");
      throw error;
    }
  };
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold mb-6">Create Email Template</h1>
      
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