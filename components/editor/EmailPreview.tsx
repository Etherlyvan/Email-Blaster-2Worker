// components/editor/EmailPreview.tsx
"use client";

import { useEffect, useRef, useState } from "react";

interface EmailPreviewProps {
  readonly html: string;
  readonly parameters?: Record<string, string>;
}

export function EmailPreview({ html, parameters = {} }: EmailPreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState<number>(500); // Default height
  
// components/editor/EmailPreview.tsx (partial update)
useEffect(() => {
  const iframe = iframeRef.current;
  if (!iframe) return;
  
  // Wait for iframe to load
  const handleLoad = () => {
    try {
      // Set the content
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!doc) return;
      
      // Add base styles
      doc.head.innerHTML = `
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
          }
          img { max-width: 100%; height: auto; }
          a { color: #0070f3; }
          .template-variable {
            background-color: #ffe066;
            padding: 0 2px;
            border-radius: 2px;
          }
        </style>
      `;
      
      // Process the HTML content with template variables
      let processedContent = html || ""; // Ensure html is never undefined
      
      // Replace known parameters
      if (parameters) {
        Object.entries(parameters).forEach(([key, value]) => {
          const regex = new RegExp(`{{${key}}}`, 'g');
          processedContent = processedContent.replace(regex, value || '');
        });
      }
      
      // Highlight any remaining template variables
      processedContent = processedContent.replace(
        /{{([^}]+)}}/g, 
        '<span class="template-variable">{{$1}}</span>'
      );
      
      // Set HTML content directly without parsing
      doc.body.innerHTML = processedContent;
      
      // Adjust iframe height to content
      setHeight(doc.body.scrollHeight + 40); // Add some padding
    } catch (error) {
      console.error("Error setting iframe content:", error);
    }
  };
  
  iframe.addEventListener("load", handleLoad);
  
  // Trigger load event manually if already loaded
  if (iframe.contentDocument?.readyState === "complete") {
    handleLoad();
  }
  
  return () => {
    iframe.removeEventListener("load", handleLoad);
  };
}, [html, parameters]);
  
  return (
    <div className="email-preview-container">
      <div className="p-2 bg-gray-50 border-b border-gray-300 flex justify-between items-center">
        <span className="text-xs text-gray-500">Email Preview</span>
        <div className="flex space-x-2">
          <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
            Desktop View
          </span>
        </div>
      </div>
      <iframe
        ref={iframeRef}
        title="Email Preview"
        width="100%"
        height={height}
        style={{ border: "none", overflow: "hidden" }}
        sandbox="allow-same-origin"
      />
    </div>
  );
}