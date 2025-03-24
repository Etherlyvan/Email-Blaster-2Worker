// components/templates/TemplateEditor.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { EmailEditor } from "../editor/EmailEditor";
import { EmailPreview } from "../editor/EmailPreview";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { 
  PencilIcon, 
  CodeBracketIcon, 
  EyeIcon, 
  ArrowDownTrayIcon, 
  XMarkIcon, 
  ArrowLeftIcon 
} from '@heroicons/react/24/outline';

// Menggunakan string literals untuk tipe tab yang lebih jelas
type EditorTabType = 'visual' | 'html' | 'preview';

// Menggunakan div dan implementasi custom untuk menghindari komponen Tab yang deprecated
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
  const [content, setContent] = useState(initialData?.content ?? "<p>Write your email content here...</p>");
  const [htmlContent, setHtmlContent] = useState(initialData?.htmlContent ?? "");
  const [rawHtml, setRawHtml] = useState(initialData?.htmlContent ?? "");
  const [activeTab, setActiveTab] = useState<EditorTabType>('visual');
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [previewData, setPreviewData] = useState<Record<string, string>>({
    name: "John Doe",
    email: "john@example.com",
    company: "ACME Inc.",
    date: new Date().toLocaleDateString(),
  });

  // Update HTML content when switching to HTML tab
  useEffect(() => {
    if (activeTab === 'html') {
      setRawHtml(htmlContent);
    }
  }, [activeTab, htmlContent]);

  // Update editor content when switching from HTML tab
  useEffect(() => {
    if (activeTab === 'visual' && rawHtml !== htmlContent) {
      // Only update when switching to visual editor
      setHtmlContent(rawHtml);
      setContent(rawHtml);
    }
  }, [activeTab, rawHtml, htmlContent]);

  // Track unsaved changes
  useEffect(() => {
    if (initialData) {
      const hasChanges = 
        name !== initialData.name ||
        description !== initialData.description ||
        (activeTab === 'html' ? rawHtml !== initialData.htmlContent : htmlContent !== initialData.htmlContent);
      
      setHasUnsavedChanges(hasChanges);
    }
  }, [name, description, htmlContent, rawHtml, activeTab, initialData]);

  // Handle editor change, preserving HTML exactly as it comes from the editor
  const handleEditorChange = useCallback((html: string) => {
    if (activeTab === 'visual') {
      setContent(html);
      setHtmlContent(html);
    }
  }, [activeTab]);

  // Handle HTML source code changes
  const handleHtmlChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newHtml = e.target.value;
    setRawHtml(newHtml);
    // We don't update other state variables here to avoid conflicts between tabs
  }, []);

  // Handle form submission
  const handleSave = async () => {
    if (!name) {
      alert("Please enter a template name");
      return;
    }

    setIsSaving(true);
    try {
      // Use the appropriate HTML based on which tab is active
      const finalHtml = activeTab === 'html' ? rawHtml : htmlContent;
      
      await onSaveAction({
        name,
        description,
        content: finalHtml,
        htmlContent: finalHtml,
      });
      
      router.push("/templates");
    } catch (error) {
      console.error("Error saving template:", error);
      // We don't need to show an alert here as the error will be handled by the wrapper component
    } finally {
      setIsSaving(false);
    }
  };

  // Function to get the HTML content for preview
  const getPreviewHtml = () => {
    // If we're in the HTML tab, use the raw HTML, otherwise use the content from the visual editor
    return activeTab === 'html' ? rawHtml : htmlContent;
  };

  // Custom tab rendering to avoid deprecated components
  const renderTabContent = () => {
    switch (activeTab) {
      case 'visual':
        return (
          <div className="border border-gray-300 rounded-md overflow-hidden">
            <EmailEditor
              initialHtml={content}
              onChangeAction={handleEditorChange} 
              availableVariables={["name", "email", "company", "date"]}
            />
            <div className="mt-2 text-sm text-gray-500 p-2">
              Available variables: &#123;&#123;name&#125;&#125;, &#123;&#123;email&#125;&#125;, &#123;&#123;company&#125;&#125;, &#123;&#123;date&#125;&#125;
            </div>
          </div>
        );
      case 'html':
        return (
          <div className="border border-gray-300 rounded-md overflow-hidden">
            <textarea
              value={rawHtml}
              onChange={handleHtmlChange}
              className="w-full h-96 p-4 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
              placeholder="<p>Your HTML code here...</p>"
              spellCheck="false"
            />
            <div className="mt-2 text-sm text-gray-500 p-2 bg-gray-50 border-t border-gray-300">
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span>
                  Edit the raw HTML directly. Use <code className="px-1 py-0.5 bg-gray-100 rounded text-blue-600">&#123;&#123;variable&#125;&#125;</code> syntax for dynamic content.
                </span>
              </div>
            </div>
          </div>
        );
      case 'preview':
        return (
          <div className="border border-gray-300 rounded-md overflow-hidden bg-white">
            <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
              <h3 className="text-sm font-medium">Preview with sample data</h3>
              <div className="flex gap-2">
                <Button 
                  variant="outline-primary" 
                  size="sm"
                  onClick={() => setPreviewData({
                    name: "Jane Smith",
                    email: "jane@example.com",
                    company: "Globex Corp",
                    date: new Date().toLocaleDateString(),
                  })}
                >
                  Alternative Data
                </Button>
                <Button 
                  variant="outline-primary" 
                  size="sm"
                  onClick={() => setPreviewData({
                    name: "John Doe",
                    email: "john@example.com",
                    company: "ACME Inc.",
                    date: new Date().toLocaleDateString(),
                  })}
                >
                  Reset Data
                </Button>
              </div>
            </div>
            <EmailPreview
              html={getPreviewHtml()}
              parameters={previewData}
            />
          </div>
        );
      default:
        return null;
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
      
      {/* Custom Tab Navigation */}
      <div className="mt-8">
        <div className="flex space-x-1 rounded-xl bg-blue-50 p-1">
          {[
            { name: 'Visual Editor', tab: 'visual' as const, icon: <PencilIcon className="h-4 w-4 mr-1.5" /> },
            { name: 'HTML Code', tab: 'html' as const, icon: <CodeBracketIcon className="h-4 w-4 mr-1.5" /> },
            { name: 'Preview', tab: 'preview' as const, icon: <EyeIcon className="h-4 w-4 mr-1.5" /> }
          ].map(({ name, tab, icon }) => (
            <button
              key={name}
              onClick={() => setActiveTab(tab)}
              className={`w-full rounded-lg py-2.5 text-sm font-medium leading-5 flex items-center justify-center transition-colors duration-150 ${
                activeTab === tab 
                  ? 'bg-white shadow text-blue-700' 
                  : 'text-blue-500 hover:bg-white/[0.12] hover:text-blue-700'
              }`}
            >
              {icon}
              {name}
            </button>
          ))}
        </div>
        
        <div className="mt-4">
          {renderTabContent()}
        </div>
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