// components/editor/HtmlEditor.tsx
"use client";

import { useState, useEffect } from "react";

interface HtmlEditorProps {
  readonly value: string;
  readonly onChange: (html: string) => void;
}

export function HtmlEditor({ value, onChange }: HtmlEditorProps) {
  const [internalValue, setInternalValue] = useState(value || "");

  // Update internal value when prop value changes
  useEffect(() => {
    // Only update if the value has actually changed to avoid cursor jumping
    if (value !== internalValue) {
      setInternalValue(value || "");
    }
  }, [value, internalValue]);

  // Handle text changes
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setInternalValue(newValue);
    onChange(newValue);
  };

  // Format HTML for better readability
  const formatHtml = () => {
    try {
      const formatted = prettyFormatHtml(internalValue);
      setInternalValue(formatted);
      onChange(formatted);
    } catch (error) {
      console.error("Error formatting HTML:", error);
    }
  };

  return (
    <div className="html-editor">
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
        value={internalValue}
        onChange={handleChange}
        className="w-full h-96 p-4 font-mono text-sm resize-none focus:outline-none"
        placeholder="<p>Your HTML code here...</p>"
        spellCheck="false"
      />
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
    formatted += '\n' + '  '.repeat(Math.max(0, indent)) + '<' + tag + '>';
    
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
      indent++;
    }
  }
  
  return formatted.trim();
}