// app/templates/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";

interface EmailTemplate {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTemplates() {
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
    
    fetchTemplates();
  }, []);
  
  if (isLoading) {
    return <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">Loading templates...</div>;
  }
  
  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4">
          {error}
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Email Templates</h1>
          <Link href="/templates/create">
            <Button>Create Template</Button>
          </Link>
        </div>
        
        {templates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => (
              <Card key={template.id}>
                <div className="p-6">
                  <h2 className="text-lg font-medium text-gray-900">{template.name}</h2>
                  <p className="mt-2 text-sm text-gray-500 line-clamp-2">{template.description}</p>
                  <p className="mt-2 text-xs text-gray-400">Updated {new Date(template.updatedAt).toLocaleDateString()}</p>
                  <div className="mt-4 flex justify-between">
                    <Link href={`/templates/${template.id}`}>
                      <Button variant="outline" size="sm">Edit</Button>
                    </Link>
                    <Link href={`/campaigns/create?templateId=${template.id}`}>
                      <Button size="sm">Use in Campaign</Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <div className="p-6 text-center">
              <h2 className="text-lg font-medium text-gray-900">No templates yet</h2>
              <p className="mt-2 text-sm text-gray-500">
                Create your first email template to get started.
              </p>
              <div className="mt-4">
                <Link href="/templates/create">
                  <Button>Create Template</Button>
                </Link>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}