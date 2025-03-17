// components/templates/TemplateGallery.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";

interface Template {
  id: string;
  name: string;
  description: string;
  htmlContent: string;
  updatedAt: string;
}

interface TemplateGalleryProps {
  readonly templates: Template[];
  readonly onSelect?: (templateId: string) => void;
}

export function TemplateGallery({ templates, onSelect }: TemplateGalleryProps) {
  const [previewId, setPreviewId] = useState<string | null>(null);
  
  if (templates.length === 0) {
    return (
      <Card>
        <div className="p-6 text-center">
          <h2 className="text-lg font-medium text-gray-900">No templates available</h2>
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
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => (
          <Card key={template.id} className="overflow-hidden flex flex-col">
            <div 
              className="h-40 border-b border-gray-200 overflow-hidden"
              onClick={() => setPreviewId(previewId === template.id ? null : template.id)}
            >
              {previewId === template.id ? (
                <div className="h-full overflow-auto p-4 bg-white">
                  <div dangerouslySetInnerHTML={{ __html: template.htmlContent }} />
                </div>
              ) : (
                <div className="h-full flex items-center justify-center bg-gray-50 cursor-pointer hover:bg-gray-100">
                  <div className="text-center">
                    <div className="text-sm text-gray-500">Click to preview</div>
                    <div 
                      className="h-20 overflow-hidden opacity-50 text-xs px-4" 
                      dangerouslySetInnerHTML={{ 
                        __html: template.htmlContent.substring(0, 150) + '...' 
                      }} 
                    />
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-4 flex-1 flex flex-col">
              <h3 className="text-lg font-medium text-gray-900">{template.name}</h3>
              <p className="mt-1 text-sm text-gray-500 line-clamp-2 flex-1">{template.description}</p>
              <p className="mt-2 text-xs text-gray-400">Updated {new Date(template.updatedAt).toLocaleDateString()}</p>
              
              <div className="mt-4 flex justify-between">
                <Link href={`/templates/${template.id}`}>
                  <Button variant="outline" size="sm">Edit</Button>
                </Link>
                
                {onSelect ? (
                  <Button 
                    size="sm" 
                    onClick={() => onSelect(template.id)}
                  >
                    Use Template
                  </Button>
                ) : (
                  <Link href={`/campaigns/create?templateId=${template.id}`}>
                    <Button size="sm">Use in Campaign</Button>
                  </Link>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}