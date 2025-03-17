// components/editor/EmailEditor.tsx
"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { RichTextEditor } from "./RichTextEditor";
import { EmailPreview } from "./EmailPreview";
import { LexicalEditor } from "lexical";
import { importHtml } from "./plugins/HtmlPlugin";

import "./EmailEditor.css";

interface EmailEditorProps {
  readonly initialHtml?: string;
  readonly onChangeAction: (html: string) => void;
  readonly availableVariables?: readonly string[];
}

export function EmailEditor({ 
  initialHtml, 
  onChangeAction, 
  availableVariables = [] 
}: EmailEditorProps) {
  // State for the active tab
  const [activeTab, setActiveTab] = useState<"visual" | "html" | "preview">("visual");
  
  // Single source of truth for HTML content
  const [htmlContent, setHtmlContent] = useState<string>("");
  
  // Editor instance for programmatic control
  const [editorInstance, setEditorInstance] = useState<LexicalEditor | null>(null);
  
  // Use refs to prevent infinite update loops
  const isUpdatingRef = useRef(false);
  const htmlContentRef = useRef(htmlContent);
  const onChangeActionRef = useRef(onChangeAction);
  const initializedRef = useRef(false);
  
  const normalizeHtml = (html: string): string => {
    if (!html) return '<p></p>';
    
    // Normalize paragraph structure
    let result = html
      // Remove unnecessary attributes
      .replace(/class="editor-paragraph"/g, '')
      .replace(/dir="ltr"/g, '')
      
      // Remove spans with only whitespace preservation
      .replace(/<span style="white-space: pre-wrap;">([^<]*)<\/span>/g, '$1')
      
      // Clean up empty paragraphs
      .replace(/<p><br><\/p>/g, '<p></p>')
      
      // Remove excessive whitespace between tags
      .replace(/>\s+</g, '><')
      .trim();
    
    // Ensure we have at least one paragraph
    if (!result || result === '<p></p>') {
      result = '<p></p>';
    }
    
    return result;
  };
  // Update ref when htmlContent changes
  useEffect(() => {
    htmlContentRef.current = htmlContent;
  }, [htmlContent]);

  // Update ref when onChangeAction changes
  useEffect(() => {
    onChangeActionRef.current = onChangeAction;
  }, [onChangeAction]);
  
  // Initialize content only once
  useEffect(() => {
    if (initializedRef.current) return;
    
    const safeInitialHtml = typeof initialHtml === 'string' && initialHtml.trim() 
      ? initialHtml 
      : "<p>Write your email content here...</p>";
    
    setHtmlContent(safeInitialHtml);
    htmlContentRef.current = safeInitialHtml;
    initializedRef.current = true;
  }, [initialHtml]);
  
  // Handle visual editor changes - use a stable callback with refs
  
const handleVisualEditorChange = useCallback((html: string) => {
  if (isUpdatingRef.current) return;
  
  try {
    isUpdatingRef.current = true;
    
    // Normalize HTML to prevent paragraph splitting
    const normalizedHtml = normalizeHtml(html);
    
    // Only update if content actually changed
    if (normalizedHtml !== htmlContentRef.current) {
      setHtmlContent(normalizedHtml);
      htmlContentRef.current = normalizedHtml;
      
      // Use the ref to access the latest onChangeAction
      if (onChangeActionRef.current) {
        onChangeActionRef.current(normalizedHtml);
      }
    }
  } finally {
    // Use setTimeout to ensure state updates complete before resetting flag
    setTimeout(() => {
      isUpdatingRef.current = false;
    }, 0);
  }
}, []);
  
  
  // Handle HTML source changes
  const handleHtmlSourceChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (isUpdatingRef.current) return;
    
    try {
      isUpdatingRef.current = true;
      
      const newHtml = e.target.value;
      
      // Only update if content actually changed
      if (newHtml !== htmlContentRef.current) {
        setHtmlContent(newHtml);
        
        // Use the ref to access the latest onChangeAction
        if (onChangeActionRef.current) {
          onChangeActionRef.current(newHtml);
        }
      }
    } finally {
      // Use setTimeout to ensure state updates complete before resetting flag
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 0);
    }
  }, []);
  
  // Handle tab changes with proper content synchronization
  const handleTabChange = useCallback((tab: "visual" | "html" | "preview") => {
    // Don't do anything if we're already on this tab
    if (tab === activeTab) return;
    
    // If switching to visual editor from HTML editor
    if (tab === "visual" && activeTab === "html" && editorInstance) {
      // Schedule the import after the tab change
      setTimeout(() => {
        if (isUpdatingRef.current) return;
        
        try {
          isUpdatingRef.current = true;
          importHtml(editorInstance, htmlContentRef.current);
        } finally {
          setTimeout(() => {
            isUpdatingRef.current = false;
          }, 100);
        }
      }, 50);
    }
    
    // Update the active tab
    setActiveTab(tab);
  }, [activeTab, editorInstance]);
  
  // Store editor instance when available
  const handleEditorReady = useCallback((editor: LexicalEditor) => {
    setEditorInstance(editor);
  }, []);
  
  // Format the HTML code
  const formatHtmlCode = useCallback(() => {
    if (isUpdatingRef.current) return;
    
    try {
      isUpdatingRef.current = true;
      
      const formatted = prettyFormatHtml(htmlContentRef.current);
      setHtmlContent(formatted);
      
      // Use the ref to access the latest onChangeAction
      if (onChangeActionRef.current) {
        onChangeActionRef.current(formatted);
      }
    } catch (error) {
      console.error("Error formatting HTML:", error);
    } finally {
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 0);
    }
  }, []);

  return (
    <div className="space-y-4">
      {/* Editor Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          type="button"
          className={`py-2 px-4 text-sm font-medium ${
            activeTab === "visual" 
              ? "text-blue-600 border-b-2 border-blue-600" 
              : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}
          onClick={() => handleTabChange("visual")}
        >
          Visual Editor
        </button>
        <button
          type="button"
          className={`py-2 px-4 text-sm font-medium ${
            activeTab === "html" 
              ? "text-blue-600 border-b-2 border-blue-600" 
              : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}
          onClick={() => handleTabChange("html")}
        >
          HTML Code
        </button>
        <button
          type="button"
          className={`py-2 px-4 text-sm font-medium ${
            activeTab === "preview" 
              ? "text-blue-600 border-b-2 border-blue-600" 
              : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}
          onClick={() => handleTabChange("preview")}
        >
          Preview
        </button>
      </div>
      
      {/* Editor Content Area */}
      <div className="border border-gray-300 rounded-md overflow-hidden">
        {/* Visual Editor */}
        <div className={activeTab === "visual" ? "block" : "hidden"}>
          <RichTextEditor
            initialHtml={activeTab === "visual" ? htmlContent : ""}
            onChangeAction={handleVisualEditorChange}
            availableVariables={availableVariables}
            onEditorReady={handleEditorReady}
          />
        </div>
        
        {/* HTML Source Editor */}
        <div className={activeTab === "html" ? "block" : "hidden"}>
          <div className="bg-white">
            <div className="p-2 bg-gray-50 border-b border-gray-300 flex justify-between items-center">
              <span className="text-xs text-gray-500">Edit HTML directly</span>
              <button 
                type="button"
                className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100"
                onClick={formatHtmlCode}
              >
                Format HTML
              </button>
            </div>
            <textarea
              value={htmlContent}
              onChange={handleHtmlSourceChange}
              className="w-full min-h-[300px] p-4 font-mono text-sm resize-none focus:outline-none"
              placeholder="<p>Your HTML code here...</p>"
              spellCheck="false"
            />
          </div>
        </div>
        
        {/* Preview */}
        <div className={activeTab === "preview" ? "block" : "hidden"}>
          <EmailPreview html={htmlContent} parameters={{}} />
        </div>
      </div>
    </div>
  );
}

// Helper function to format HTML
function prettyFormatHtml(html: string): string {
  if (!html) return '';
  
  // Simple indentation-based formatter
  let formatted = '';
  let indent = 0;
  
  // Split by < to get tag starts
  const parts = html.split('<');
  
  // Using for-of loop for simple iteration
  for (const part of parts) {
    if (!part) continue;
    
    const tagParts = part.split('>');
    if (tagParts.length < 2) continue;
    
    const tag = tagParts[0];
    const content = tagParts[1];
    
    // Check if it's a closing tag
    if (tag.startsWith('/')) {
      indent--;
    }
    
    // Add the tag with proper indentation
    formatted += '<' + tag + '>';
    
    // Add content if not empty and not just whitespace
    if (content.trim()) {
      formatted += content;
    }
    
    // Check if it's a self-closing tag or a tag that shouldn't increase indent
    if (!tag.endsWith('/') && 
        !tag.startsWith('/') && 
        !tag.startsWith('!') && 
        !tag.startsWith('?') && 
        !tag.startsWith('img') && 
        !tag.startsWith('br') && 
        !tag.startsWith('hr') && 
        !tag.startsWith('input')) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      indent++;
    }
  }
  
  return formatted;
}