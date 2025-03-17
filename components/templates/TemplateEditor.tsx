"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { EmailEditor } from "../editor/EmailEditor";
import { EmailPreview } from "../editor/EmailPreview";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Tab } from "@headlessui/react";

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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [htmlContent, setHtmlContent] = useState(initialData?.htmlContent ?? "");
  const [rawHtml, setRawHtml] = useState(initialData?.htmlContent ?? "");
  const [activeTab, setActiveTab] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [previewData, setPreviewData] = useState<Record<string, string>>({
    name: "John Doe",
    email: "john@example.com",
    company: "ACME Inc.",
    date: new Date().toLocaleDateString(),
  });
  
  // Use a ref to track if we're currently syncing content to avoid circular updates
  const isSyncingRef = useRef(false);
  
  // Track which editor was most recently used
  const lastUpdatedSourceRef = useRef<'visual' | 'html'>('visual');

  // Update HTML content when switching tabs
  useEffect(() => {
    if (isSyncingRef.current) return;
    
    isSyncingRef.current = true;
    
    try {
      if (activeTab === 1) { // Switching to HTML tab
        // If last updated from visual editor, update raw HTML
        if (lastUpdatedSourceRef.current === 'visual') {
          setRawHtml(content);
        }
      } else if (activeTab === 0) { // Switching to Visual tab
        // If last updated from HTML editor, update visual content
        if (lastUpdatedSourceRef.current === 'html') {
          setContent(rawHtml);
          setHtmlContent(rawHtml);
        }
      }
    } finally {
      // Use a longer timeout to ensure all state updates have completed
      setTimeout(() => {
        isSyncingRef.current = false;
      }, 200);
    }
  }, [activeTab, content, rawHtml]);

  // Handle visual editor change
  const handleEditorChange = useCallback((html: string) => {
    // Normalize HTML by removing unnecessary line breaks
    const normalizedHtml = html.replace(/\r\n/g, '').replace(/\r/g, '').replace(/\n/g, '');
    
    // Only update state if the content actually changed
    if (content !== normalizedHtml) {
      setContent(normalizedHtml);
      setHtmlContent(normalizedHtml);
      
      // Only update rawHtml if we're in the visual editor tab
      if (activeTab === 0) {
        setRawHtml(normalizedHtml);
      }
    }
  }, [activeTab, content]);
  
  // Perbarui juga fungsi handleHtmlChange
  const handleHtmlChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newHtml = e.target.value;
    setRawHtml(newHtml);
    lastUpdatedSourceRef.current = 'html';
    
    // Update content and htmlContent when in HTML tab
    if (activeTab === 1) {
      setContent(newHtml);
      setHtmlContent(newHtml);
    }
  }, [activeTab]);

  // Handle saving the template
  const handleSave = async () => {
    if (!name) {
      alert("Please enter a template name");
      return;
    }

    setIsSaving(true);
    try {
      // Use the most recently updated content
      const finalHtml = lastUpdatedSourceRef.current === 'html' ? rawHtml : content;
      
      await onSaveAction({
        name,
        description,
        content: finalHtml,
        htmlContent: finalHtml,
      });
      
      router.push("/templates");
    } catch (error) {
      console.error("Error saving template:", error);
      alert("Failed to save template. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // Format HTML for better readability
  const formatHtml = useCallback(() => {
    if (!rawHtml) return;
    
    try {
      // Create a temporary DOM element
      const parser = new DOMParser();
      const doc = parser.parseFromString(rawHtml, 'text/html');
      
      // Serialize with proper formatting - gunakan string HTML, bukan Document
      const serialized = new XMLSerializer().serializeToString(doc);
      const formatted = formatHtmlWithIndentation(serialized);
      
      // Update the raw HTML
      setRawHtml(formatted);
      lastUpdatedSourceRef.current = 'html';
      
      // If in HTML tab, also update content and htmlContent
      if (activeTab === 1) {
        setContent(formatted);
        setHtmlContent(formatted);
      }
    } catch (error) {
      console.error("Error formatting HTML:", error);
    }
  }, [rawHtml, activeTab]);

  // Function to format HTML with indentation
  function formatHtmlWithIndentation(html: string): string {
    if (!html) return '';
    
    // Clean up HTML first - remove excessive whitespace between tags
    const cleanHtml = html.replace(/>\s+</g, '><').trim();
    
    // Simple indentation-based formatter
    let formatted = '';
    
    // Split by < to get tag starts
    const parts = cleanHtml.split('<');
    
    // Using for-of loop for simple iteration
    for (const part of parts) {
      if (!part) continue;
      
      const tagParts = part.split('>');
      if (tagParts.length < 2) continue;
      
      const tag = tagParts[0];
      const content = tagParts[1];
      
      // Add the tag
      formatted += '<' + tag + '>';
      
      // Add content if not empty and not just whitespace
      if (content.trim()) {
        formatted += content;
      }
    }
    
    return formatted;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Template Name
          </label>
          <Input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Welcome Email"
            required
          />
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
          />
        </div>
      </div>
      
      <Tab.Group selectedIndex={activeTab} onChange={setActiveTab}>
        <Tab.List className="flex space-x-1 rounded-xl bg-blue-50 p-1">
          <Tab
            className={({ selected }) =>
              `w-full rounded-lg py-2.5 text-sm font-medium leading-5 
              ${selected 
                ? 'bg-white shadow text-blue-700' 
                : 'text-blue-500 hover:bg-white/[0.12] hover:text-blue-700'}`
            }
          >
            Visual Editor
          </Tab>
          <Tab
            className={({ selected }) =>
              `w-full rounded-lg py-2.5 text-sm font-medium leading-5 
              ${selected 
                ? 'bg-white shadow text-blue-700' 
                : 'text-blue-500 hover:bg-white/[0.12] hover:text-blue-700'}`
            }
          >
            HTML Code
          </Tab>
          <Tab
            className={({ selected }) =>
              `w-full rounded-lg py-2.5 text-sm font-medium leading-5 
              ${selected 
                ? 'bg-white shadow text-blue-700' 
                : 'text-blue-500 hover:bg-white/[0.12] hover:text-blue-700'}`
            }
          >
            Preview
          </Tab>
        </Tab.List>
        <Tab.Panels className="mt-2">
          <Tab.Panel>
            <div className="border border-gray-300 rounded-md overflow-hidden">
              <EmailEditor
                initialHtml={content}
                onChangeAction={handleEditorChange} 
                availableVariables={["name", "email", "company", "date"]}
              />
            </div>
            <div className="mt-2 text-sm text-gray-500">
              Available variables: &#123;&#123;name&#125;&#125;, &#123;&#123;email&#125;&#125;, &#123;&#123;company&#125;&#125;, &#123;&#123;date&#125;&#125;
            </div>
          </Tab.Panel>
          
          <Tab.Panel>
            <div className="border border-gray-300 rounded-md overflow-hidden">
              <div className="p-2 bg-gray-50 border-b border-gray-300 flex justify-between items-center">
                <span className="text-xs text-gray-500">Edit HTML directly</span>
                <button 
                  type="button"
                  className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100"
                  onClick={formatHtml}
                >
                  Format HTML
                </button>
              </div>
              <textarea
                value={rawHtml}
                onChange={handleHtmlChange}
                className="w-full h-96 p-4 font-mono text-sm"
                placeholder="<p>Your HTML code here...</p>"
                spellCheck="false"
              />
            </div>
            <div className="mt-2 text-sm text-gray-500">
              Edit the raw HTML directly. Use &#123;&#123;variable&#125;&#125; syntax for dynamic content.
            </div>
          </Tab.Panel>
          
          <Tab.Panel>
            <div className="border border-gray-300 rounded-md overflow-hidden bg-white">
              <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
                <h3 className="text-sm font-medium">Preview with sample data</h3>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
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
                    variant="outline" 
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
                html={activeTab === 1 ? rawHtml : content}
                parameters={previewData}
              />
            </div>
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
      
      <div className="flex justify-end space-x-4">
        <Button 
          variant="outline" 
          onClick={() => router.push("/templates")}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSave}
          loading={isSaving}
        >
          Save Template
        </Button>
      </div>
    </div>
  );
}