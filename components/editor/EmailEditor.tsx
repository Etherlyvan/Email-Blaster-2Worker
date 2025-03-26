// components/editor/EmailEditor.tsx
"use client";

import { useState, useCallback, useEffect, useRef, JSX } from "react";
import { Button } from "../ui/Button";
import { 
  CodeBracketIcon, 
  EyeIcon, 
  ArrowsPointingOutIcon,
  CubeIcon,
  DocumentTextIcon,
  AdjustmentsHorizontalIcon,
} from '@heroicons/react/24/outline';

interface EmailEditorProps {
  readonly initialHtml?: string;
  readonly onChangeAction: (html: string) => void;
  readonly availableVariables?: readonly string[];
}

// Define email components that users can insert
const EMAIL_COMPONENTS = [
  {
    id: 'header',
    name: 'Header',
    icon: 'header',
    html: `<table width="100%" border="0" cellspacing="0" cellpadding="0" style="min-width:100%;" class="email-section" data-type="header">
      <tr>
        <td align="center" bgcolor="#f8f9fa" style="padding: 20px 15px;">
          <img src="https://via.placeholder.com/200x50" alt="Logo" style="display: block; max-width: 100%;">
        </td>
      </tr>
    </table>`
  },
  {
    id: 'text-block',
    name: 'Text Block',
    icon: 'text',
    html: `<table width="100%" border="0" cellspacing="0" cellpadding="0" style="min-width:100%;" class="email-section" data-type="text">
      <tr>
        <td style="padding: 20px 15px; font-family: Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #333333;">
          <p>This is a text block. Replace this with your own content.</p>
        </td>
      </tr>
    </table>`
  },
  {
    id: 'image',
    name: 'Image',
    icon: 'image',
    html: `<table width="100%" border="0" cellspacing="0" cellpadding="0" style="min-width:100%;" class="email-section" data-type="image">
      <tr>
        <td align="center" style="padding: 20px 15px;">
          <img src="https://via.placeholder.com/600x300" alt="Image Description" style="display: block; max-width: 100%; height: auto;">
        </td>
      </tr>
    </table>`
  },
  {
    id: 'button',
    name: 'Button',
    icon: 'button',
    html: `<table width="100%" border="0" cellspacing="0" cellpadding="0" style="min-width:100%;" class="email-section" data-type="button">
      <tr>
        <td align="center" style="padding: 20px 15px;">
          <table border="0" cellspacing="0" cellpadding="0">
            <tr>
              <td align="center" bgcolor="#007bff" style="border-radius: 4px;">
                <a href="https://example.com" target="_blank" style="display: inline-block; padding: 12px 24px; font-family: Arial, sans-serif; font-size: 16px; color: #ffffff; text-decoration: none;">Click Here</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>`
  },
  {
    id: 'divider',
    name: 'Divider',
    icon: 'divider',
    html: `<table width="100%" border="0" cellspacing="0" cellpadding="0" style="min-width:100%;" class="email-section" data-type="divider">
      <tr>
        <td style="padding: 15px;">
          <table width="100%" border="0" cellspacing="0" cellpadding="0">
            <tr>
              <td style="border-bottom: 1px solid #e0e0e0; font-size: 1px; line-height: 1px;">&nbsp;</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>`
  },
  {
    id: 'spacer',
    name: 'Spacer',
    icon: 'spacer',
    html: `<table width="100%" border="0" cellspacing="0" cellpadding="0" style="min-width:100%;" class="email-section" data-type="spacer">
      <tr>
        <td style="font-size: 1px; line-height: 1px; height: 30px;">&nbsp;</td>
      </tr>
    </table>`
  },
  {
    id: 'two-columns',
    name: 'Two Columns',
    icon: 'columns',
    html: `<table width="100%" border="0" cellspacing="0" cellpadding="0" style="min-width:100%;" class="email-section" data-type="columns">
      <tr>
        <td style="padding: 15px;">
          <table width="100%" border="0" cellspacing="0" cellpadding="0">
            <tr>
              <td valign="top" width="50%" style="padding-right: 10px;">
                <p style="font-family: Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #333333;">Left column content.</p>
              </td>
              <td valign="top" width="50%" style="padding-left: 10px;">
                <p style="font-family: Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #333333;">Right column content.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>`
  },
  {
    id: 'social',
    name: 'Social Links',
    icon: 'social',
    html: `<table width="100%" border="0" cellspacing="0" cellpadding="0" style="min-width:100%;" class="email-section" data-type="social">
      <tr>
        <td align="center" style="padding: 20px 15px;">
          <table border="0" cellspacing="0" cellpadding="0">
            <tr>
              <td style="padding: 0 10px;">
                <a href="https://facebook.com" target="_blank"><img src="https://via.placeholder.com/32x32" alt="Facebook" style="display: block;"></a>
              </td>
              <td style="padding: 0 10px;">
                <a href="https://twitter.com" target="_blank"><img src="https://via.placeholder.com/32x32" alt="Twitter" style="display: block;"></a>
              </td>
              <td style="padding: 0 10px;">
                <a href="https://instagram.com" target="_blank"><img src="https://via.placeholder.com/32x32" alt="Instagram" style="display: block;"></a>
              </td>
              <td style="padding: 0 10px;">
                <a href="https://linkedin.com" target="_blank"><img src="https://via.placeholder.com/32x32" alt="LinkedIn" style="display: block;"></a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>`
  },
  {
    id: 'footer',
    name: 'Footer',
    icon: 'footer',
    html: `<table width="100%" border="0" cellspacing="0" cellpadding="0" style="min-width:100%;" class="email-section" data-type="footer">
      <tr>
        <td align="center" bgcolor="#f8f9fa" style="padding: 20px 15px; font-family: Arial, sans-serif; font-size: 14px; line-height: 1.5; color: #6c757d;">
          <p>Company Name Inc.</p>
          <p>123 Street Address, City, State ZIP</p>
          <p><a href="mailto:info@example.com" style="color: #6c757d;">info@example.com</a> | <a href="tel:+11234567890" style="color: #6c757d;">+1 (123) 456-7890</a></p>
          <p><a href="{{unsubscribe}}" style="color: #6c757d;">Unsubscribe</a> | <a href="{{view_in_browser}}" style="color: #6c757d;">View in browser</a></p>
        </td>
      </tr>
    </table>`
  }
];

// Component icons - Fixed to return JSX
const ComponentIcon = ({ iconType }: { iconType: string }): JSX.Element => {
  switch (iconType) {
    case 'header':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
        </svg>
      );
    case 'text':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
        </svg>
      );
    case 'image':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    case 'button':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
        </svg>
      );
    case 'divider':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
        </svg>
      );
    case 'spacer':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11v8a1 1 0 01-1 1H5a1 1 0 01-1-1v-8m12 0v8a1 1 0 01-1 1h-1a1 1 0 01-1-1v-8m5-3V5a2 2 0 00-2-2H6a2 2 0 00-2 2v3" />
        </svg>
      );
    case 'columns':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
      );
    case 'social':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
        </svg>
      );
    case 'footer':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
        </svg>
      );
    default:
      return <DocumentTextIcon className="h-6 w-6" />;
  }
};

// Helper function to highlight template variables in HTML content
function highlightTemplateVariables(content: string): string {
  return content.replace(/{{([^}]+)}}/g, '<span class="template-variable">{{$1}}</span>');
}

// Helper function to create HTML template for preview
function createPreviewHtml(content: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
          }
          img { max-width: 100%; height: auto; }
          a { color: #0070f3; text-decoration: none; }
          .template-variable {
            background-color: #ffe066;
            padding: 0 2px;
            border-radius: 2px;
          }
        </style>
      </head>
      <body>
        ${highlightTemplateVariables(content)}
      </body>
    </html>
  `;
}

export function EmailEditor({ 
  initialHtml, 
  onChangeAction, 
  availableVariables = [] 
}: EmailEditorProps) {
  // State for the active tab
  const [mode, setMode] = useState<"split" | "code" | "preview">("split");
  const [htmlContent, setHtmlContent] = useState<string>(initialHtml ?? "<div style='font-family: Arial, sans-serif;'>Write your email content here...</div>");
  const [showComponentLibrary, setShowComponentLibrary] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showVariableDropdown, setShowVariableDropdown] = useState(false);
  // Tambahkan effect untuk menutup dropdown saat klik di luar
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        showVariableDropdown && 
        event.target instanceof Node
      ) {
        // Check if event.target is an Element before using closest()
        const targetElement = event.target as Element;
        if (!(targetElement instanceof Element) || !targetElement.closest('.variable-dropdown-container')) {
          setShowVariableDropdown(false);
        }
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showVariableDropdown]);
  // Use refs to prevent infinite update loops
  const initializedRef = useRef(false);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLIFrameElement>(null);
  
  // Initialize content only once
  useEffect(() => {
    if (initializedRef.current) return;
    
    const safeInitialHtml = typeof initialHtml === 'string' && initialHtml.trim() 
      ? initialHtml 
      : "<div style='font-family: Arial, sans-serif;'>Write your email content here...</div>";
    
    setHtmlContent(safeInitialHtml);
    initializedRef.current = true;
  }, [initialHtml]);
  
  // Handle HTML source changes
  const handleHtmlChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newHtml = e.target.value;
    setHtmlContent(newHtml);
    onChangeAction(newHtml);
  }, [onChangeAction]);
  
  // Format the HTML code
  const formatHtmlCode = useCallback(() => {
    try {
      const formatted = prettyFormatHtml(htmlContent);
      setHtmlContent(formatted);
      onChangeAction(formatted);
    } catch (error) {
      console.error("Error formatting HTML:", error);
    }
  }, [htmlContent, onChangeAction]);

  // Insert variable at cursor position
  const insertVariable = useCallback((variable: string) => {
    const textarea = editorRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const variableText = `{{${variable}}}`;
    
    const newText = text.substring(0, start) + variableText + text.substring(end);
    setHtmlContent(newText);
    onChangeAction(newText);
    
    // Set cursor position after inserted variable
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + variableText.length, start + variableText.length);
    }, 0);
  }, [onChangeAction]);

  // Insert component
  const insertComponent = useCallback((componentHtml: string) => {
    // In code mode, insert at cursor position
    const textarea = editorRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    
    const newText = text.substring(0, start) + componentHtml + text.substring(end);
    setHtmlContent(newText);
    onChangeAction(newText);
    
    // Set cursor position after inserted component
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + componentHtml.length, start + componentHtml.length);
    }, 0);
    
    setShowComponentLibrary(false);
  }, [onChangeAction]);

  // Handle image drop directly in the preview
  const handleImageDrop = useCallback(async (e: React.DragEvent<HTMLIFrameElement>) => {
    e.preventDefault();
    
    if (!e.dataTransfer.items) return;
    
    // Check if any of the items are files
    const imageFiles = Array.from(e.dataTransfer.items)
      .filter(item => item.kind === 'file' && item.type.startsWith('image/'))
      .map(item => item.getAsFile());
    
    if (imageFiles.length === 0 || !imageFiles[0]) return;
    
    // Read the first image file as data URL
    const reader = new FileReader();
    reader.onload = (event) => {
      if (!event.target?.result) return;
      
      const imageDataUrl = event.target.result as string;
      
      // Create an image component with the data URL
      const imageHtml = `<table width="100%" border="0" cellspacing="0" cellpadding="0" style="min-width:100%;" class="email-section" data-type="image">
        <tr>
          <td align="center" style="padding: 20px 15px;">
            <img src="${imageDataUrl}" alt="Dropped Image" style="display: block; max-width: 100%; height: auto;">
          </td>
        </tr>
      </table>`;
      
      insertComponent(imageHtml);
    };
    
    reader.readAsDataURL(imageFiles[0]);
  }, [insertComponent]);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  // Function to handle file input change for image uploads
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    const reader = new FileReader();
    
    reader.onload = (event) => {
      if (!event.target?.result) return;
      
      const imageDataUrl = event.target.result as string;
      
      // Create an image component with the data URL
      const imageHtml = `<table width="100%" border="0" cellspacing="0" cellpadding="0" style="min-width:100%;" class="email-section" data-type="image">
        <tr>
          <td align="center" style="padding: 20px 15px;">
            <img src="${imageDataUrl}" alt="Uploaded Image" style="display: block; max-width: 100%; height: auto;">
          </td>
        </tr>
      </table>`;
      
      insertComponent(imageHtml);
    };
    
    reader.readAsDataURL(file);
  };


  // Update button handler
  const handleUpdate = useCallback(() => {
    onChangeAction(htmlContent);
  }, [htmlContent, onChangeAction]);

  // Render component library items with proper keys
  const renderComponentLibraryItems = () => {
    return EMAIL_COMPONENTS.map((component) => (
      <button 
        key={`component-${component.id}`}
        className="border border-gray-200 rounded-md hover:border-blue-500 hover:shadow-md cursor-pointer p-4 flex flex-col items-center justify-center text-center transition-all"
        onClick={() => insertComponent(component.html)}
        aria-label={`Insert ${component.name} component`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            insertComponent(component.html);
            e.preventDefault();
          }
        }}
        type="button"
      >
        <div className="text-blue-600 mb-2">
          <ComponentIcon iconType={component.icon} />
        </div>
        <span className="text-sm">{component.name}</span>
        <div className="text-xs text-gray-500 mt-1">Click to insert</div>
      </button>
    ));
  };

  return (
    <div className={`space-y-4 transition-all ${isFullscreen ? 'fixed inset-0 z-50 bg-white p-6' : ''}`}>
      {/* Editor Toolbar */}
      <div className="flex justify-between items-center bg-white border-b border-gray-200 pb-2">
        <div className="flex space-x-2">
          <Button 
            variant={mode === "code" ? "primary" : "outline-primary"}
            size="sm"
            onClick={() => setMode("code")}
            icon={<CodeBracketIcon className="h-4 w-4 mr-1" />}
          >
            HTML
          </Button>
          <Button 
            variant={mode === "split" ? "primary" : "outline-primary"}
            size="sm"
            onClick={() => setMode("split")}
            icon={<AdjustmentsHorizontalIcon className="h-4 w-4 mr-1" />}
          >
            Split View
          </Button>
          <Button 
            variant={mode === "preview" ? "primary" : "outline-primary"}
            size="sm"
            onClick={() => setMode("preview")}
            icon={<EyeIcon className="h-4 w-4 mr-1" />}
          >
            Preview
          </Button>
        </div>
        
        <div className="flex space-x-2">
          <Button 
            variant="outline-primary"
            size="sm"
            onClick={() => setShowComponentLibrary(!showComponentLibrary)}
            icon={<CubeIcon className="h-4 w-4 mr-1" />}
          >
            Components
          </Button>
          
          <Button 
            variant="outline-primary"
            size="sm"
            onClick={toggleFullscreen}
            icon={<ArrowsPointingOutIcon className="h-4 w-4 mr-1" />}
          >
            {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          </Button>
          
          <Button 
            variant="primary"
            size="sm"
            onClick={handleUpdate}
          >
            Update
          </Button>
        </div>
      </div>
      
      {/* Component Library Drawer */}
      {showComponentLibrary && (
        <div className="bg-white border border-gray-200 rounded-md shadow-lg p-4 mb-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Component Library</h3>
            <div className="flex space-x-2 items-center">
              <div>
                <label htmlFor="image-upload" className="cursor-pointer text-blue-600 hover:text-blue-800 text-sm flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Upload Image
                </label>
                <input 
                  id="image-upload" 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleImageUpload}
                />
              </div>
              <button 
                onClick={() => setShowComponentLibrary(false)}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Close component library"
                type="button"
              >
                &times;
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {renderComponentLibraryItems()}
          </div>
        </div>
      )}
      
      {/* Editor Main Content */}
      <div className={`grid gap-4 ${mode === 'split' ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {/* HTML Editor */}
        {(mode === 'code' || mode === 'split') && (
          <div className="border border-gray-300 rounded-md overflow-hidden">
            <div className="bg-white">
              <div className="p-2 bg-gray-50 border-b border-gray-300 flex justify-between items-center">
                <span className="text-xs text-gray-500">HTML Code</span>
                <div className="flex space-x-2">
                  <Button 
                    type="button"
                    variant="outline-primary"
                    size="sm"
                    onClick={formatHtmlCode}
                  >
                    Format HTML
                  </Button>
                  
                  {/* Insert Variable Dropdown with improved UI */}
                  {availableVariables && availableVariables.length > 0 && (
                    <div className="relative inline-block text-left">
                      <button
                        type="button"
                        className="inline-flex items-center px-3 py-1.5 border border-blue-300 shadow-sm text-xs font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        onClick={() => setShowVariableDropdown(!showVariableDropdown)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                        </svg>
                        Insert Variable
                        <svg className="ml-1.5 -mr-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                      
                      {showVariableDropdown && (
                        <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 divide-y divide-gray-100 focus:outline-none z-10">
                          <div className="py-1 px-3">
                            <p className="text-xs font-medium text-gray-700">Template Variables</p>
                          </div>
                          <div className="py-1 max-h-60 overflow-y-auto">
                            {availableVariables.map(variable => (
                              <button
                                key={variable}
                                type="button"
                                className="group flex items-center px-3 py-2 text-sm w-full hover:bg-blue-50 text-left"
                                onClick={() => {
                                  insertVariable(variable);
                                  setShowVariableDropdown(false);
                                }}
                              >
                                <span className="flex-shrink-0 mr-2 h-5 w-5 text-blue-500 group-hover:text-blue-600">
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 2a1 1 0 00-1 1v1.323l-3.954 1.582A1 1 0 004 6.868V16a1 1 0 001.5.868l4.5-1.8 4.5 1.8a1 1 0 001.5-.868V6.868a1 1 0 00-1.046-.963L11 4.323V3a1 1 0 00-1-1zM5.5 7.457l4.5-1.8V15.43l-4.5 1.8V7.457zm9 0v9.772l-4.5-1.8V5.657l4.5 1.8z" clipRule="evenodd" />
                                  </svg>
                                </span>
                                <div>
                                  <span className="font-medium text-gray-900 group-hover:text-blue-700">{`{{${variable}}}`}</span>
                                  <p className="text-xs text-gray-500 group-hover:text-blue-600">Click to insert at cursor position</p>
                                </div>
                              </button>
                            ))}
                          </div>
                          <div className="py-1 px-3">
                            <p className="text-xs text-gray-500">Variables will be replaced with actual values when email is sent.</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <textarea
                ref={editorRef}
                value={htmlContent}
                onChange={handleHtmlChange}
                className="w-full h-[600px] p-4 font-mono text-sm resize-none focus:outline-none"
                placeholder="<div>Your HTML code here...</div>"
                spellCheck="false"
              />
            </div>
          </div>
        )}
        
        {/* Preview */}
        {(mode === 'preview' || mode === 'split') && (
          <div className="border border-gray-300 rounded-md overflow-hidden h-full">
            <div className="p-2 bg-gray-50 border-b border-gray-300">
              <span className="text-xs text-gray-500">Email Preview (Desktop)</span>
            </div>
            <div className="bg-white h-[calc(100%-36px)]"> {/* 36px adalah perkiraan tinggi header */}
              <iframe
                ref={previewRef}
                title="Email Preview"
                width="100%"
                height="100%"
                style={{ 
                  border: "none", 
                  overflow: "auto", 
                  minWidth: "600px",
                  minHeight: "600px"
                }}
                sandbox="allow-same-origin"
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'copy';
                }}
                onDrop={handleImageDrop}
                srcDoc={createPreviewHtml(htmlContent)}
              />
            </div>
          </div>
        )}
      </div>
      
            {/* Fullscreen Exit Button */}
            {isFullscreen && (
        <div className="fixed bottom-4 right-4">
          <Button 
            variant="primary" 
            onClick={toggleFullscreen}
          >
            Exit Fullscreen
          </Button>
        </div>
      )}
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