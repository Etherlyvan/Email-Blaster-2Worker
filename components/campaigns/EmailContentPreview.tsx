// components/campaigns/EmailContentPreview.tsx
"use client";

import { useEffect, useRef, useState } from "react";

interface EmailContentPreviewProps {
  readonly htmlContent: string;
  readonly parameters?: Record<string, string>;
}

export function EmailContentPreview({ htmlContent, parameters = {} }: EmailContentPreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState<number>(500); // Default height
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    
    // Show loading state
    setIsLoading(true);
    
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
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              margin: 0;
              padding: 16px;
            }
            img { max-width: 100%; height: auto; }
            a { color: #3b82f6; text-decoration: none; }
            a:hover { text-decoration: underline; }
            .template-variable {
              background-color: #ffe066;
              padding: 0 2px;
              border-radius: 2px;
              font-family: monospace;
            }
            table { border-collapse: collapse; width: 100%; }
            td, th { padding: 8px; }
            
            /* Email container for better preview */
            .email-container {
              max-width: 600px;
              margin: 0 auto;
            }
            
            /* Additional styles for better email rendering */
            h1, h2, h3, h4, h5, h6 {
              margin-top: 0;
              margin-bottom: 16px;
            }
            p {
              margin-top: 0;
              margin-bottom: 16px;
            }
            .button {
              display: inline-block;
              padding: 8px 16px;
              background-color: #3b82f6;
              color: white !important;
              border-radius: 4px;
              text-decoration: none;
            }
          </style>
        `;
        
        // Process the HTML content with template variables
        let processedContent = htmlContent || "<p>No content to display</p>"; // Default content
        
        // Replace known parameters
        if (parameters && Object.keys(parameters).length > 0) {
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
        
        // Wrap content in email container
        processedContent = `<div class="email-container">${processedContent}</div>`;
        
        // Set HTML content
        doc.body.innerHTML = processedContent;
        
        // Adjust iframe height to content
        const newHeight = Math.max(doc.body.scrollHeight + 40, 200); // Minimum 200px height
        setHeight(newHeight);
        setIsLoading(false);
      } catch (error) {
        console.error("Error setting iframe content:", error);
        setIsLoading(false);
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
  }, [htmlContent, parameters]);
  
  return (
    <div className="relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 bg-opacity-75 z-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      )}
      <iframe
        ref={iframeRef}
        title="Email Preview"
        width="100%"
        height={height}
        style={{ 
          border: "none", 
          overflow: "hidden",
          transition: "height 0.3s ease"
        }}
        sandbox="allow-same-origin"
      />
    </div>
  );
}