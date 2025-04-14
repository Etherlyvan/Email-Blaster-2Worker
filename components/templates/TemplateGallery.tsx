// components/templates/TemplateGallery.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { 
  PencilIcon, 
  DocumentDuplicateIcon, 
  EyeIcon, 
  EyeSlashIcon,
  PlusIcon,
  ClockIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';

interface Template {
  id: string;
  name: string;
  description: string;
  htmlContent: string;
  updatedAt: string;
}

interface TemplateGalleryProps {
  readonly templates: Template[];
  readonly onSelect?: (templateId: string, htmlContent: string) => void;
}

export function TemplateGallery({ templates, onSelect }: TemplateGalleryProps) {
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  const filteredTemplates = templates.filter(template => 
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.description.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  if (templates.length === 0) {
    return (
      <Card className="overflow-hidden">
        <div className="p-8 text-center">
          <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-blue-50">
            <DocumentTextIcon className="h-8 w-8 text-blue-500" aria-hidden="true" />
          </div>
          <h2 className="mt-4 text-lg font-medium text-gray-900">No templates available</h2>
          <p className="mt-2 text-sm text-gray-500">
            Create your first email template to get started with your campaigns.
          </p>
          <div className="mt-6">
            <Link href="/templates/create">
              <Button 
                variant="primary"
                icon={<PlusIcon className="h-5 w-5 mr-2" />}
              >
                Create Template
              </Button>
            </Link>
          </div>
        </div>
      </Card>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="relative w-full sm:w-96">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search templates..."
              className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                type="button"
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                onClick={() => setSearchTerm("")}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
      
      {filteredTemplates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <Card 
              key={template.id} 
              className="overflow-hidden flex flex-col hover:shadow-md transition-shadow duration-200"
            >
              <div 
                className="h-52 border-b border-gray-200 overflow-hidden relative group"
                onClick={() => setPreviewId(previewId === template.id ? null : template.id)}
              >
                {previewId === template.id ? (
                  <div className="h-full overflow-auto p-4 bg-white">
                    <div 
                      className="prose prose-sm max-w-none" 
                      dangerouslySetInnerHTML={{ __html: template.htmlContent }} 
                    />
                    <button
                      className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md hover:bg-gray-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewId(null);
                      }}
                    >
                      <EyeSlashIcon className="h-5 w-5 text-gray-600" />
                    </button>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center bg-gray-50 cursor-pointer hover:bg-gray-100 relative">
                    <div className="text-center p-6">
                      <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-50 mb-4">
                        <DocumentTextIcon className="h-6 w-6 text-blue-500" aria-hidden="true" />
                      </div>
                      <div className="text-sm font-medium text-gray-900 mb-1">Preview Template</div>
                      <div className="text-xs text-gray-500">Click to view the full template</div>
                    </div>
                    <div 
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-t from-white via-transparent to-transparent flex items-end justify-center"
                    >
                      <button
                        className="mb-4 bg-white rounded-full p-2 shadow-md hover:bg-gray-100 flex items-center space-x-2 text-sm font-medium text-gray-700"
                      >
                        <EyeIcon className="h-4 w-4" />
                        <span>Preview</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">{template.name}</h3>
                
                <p className="mt-2 text-sm text-gray-500 line-clamp-2 flex-1">
                  {template.description || "No description provided"}
                </p>
                
                <div className="flex items-center mt-4 text-xs text-gray-500">
                  <ClockIcon className="h-4 w-4 mr-1.5 text-gray-400" />
                  <span>Updated {formatDistanceToNow(new Date(template.updatedAt))} ago</span>
                </div>
                
                <div className="h-px bg-gray-200 my-4"></div>
                
                <div className="flex justify-between items-center">
                  <Link href={`/templates/${template.id}`}>
                    <Button 
                      variant="outline-primary" 
                      size="sm"
                      icon={<PencilIcon className="h-4 w-4 mr-1" />}
                    >
                      Edit
                    </Button>
                  </Link>
                  
                  {onSelect ? (
                    <Button 
                      variant="primary"
                      size="sm" 
                      onClick={() => onSelect(template.id, template.htmlContent)}
                      icon={<DocumentDuplicateIcon className="h-4 w-4 mr-1" />}
                    >
                      Use Template
                    </Button>
                  ) : (
                    <Link href={`/campaigns/create?templateId=${template.id}`}>
                      <Button 
                        variant="primary"
                        size="sm"
                        icon={<DocumentDuplicateIcon className="h-4 w-4 mr-1" />}
                      >
                        Use in Campaign
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="overflow-hidden">
          <div className="p-8 text-center">
            <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-blue-50">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h2 className="mt-4 text-lg font-medium text-gray-900">No templates found</h2>
            <p className="mt-2 text-sm text-gray-500">
              We couldn&apos;t find any templates matching &quot;{searchTerm}&quot;
            </p>
            <div className="mt-6">
              <Button 
                variant="outline-primary"
                onClick={() => setSearchTerm("")}
              >
                Clear Search
              </Button>
            </div>
          </div>
        </Card>
      )}
      
      {filteredTemplates.length > 0 && searchTerm && (
        <div className="text-center text-sm text-gray-500 mt-4">
          Showing {filteredTemplates.length} of {templates.length} templates matching &quot;{searchTerm}&quot;
        </div>
      )}
    </div>
  );
}