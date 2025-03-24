// components/editor/plugins/HtmlPlugin.tsx

"use client";

import { useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $generateHtmlFromNodes, $generateNodesFromDOM } from "@lexical/html";
import { 
  $getRoot, 
  $createParagraphNode, 
  $createTextNode,
  createCommand, 
  LexicalCommand,
  COMMAND_PRIORITY_EDITOR,
  LexicalEditor,
  ElementNode
} from "lexical";
import { HorizontalRuleNode } from "@lexical/react/LexicalHorizontalRuleNode";
import { TableNode, TableCellNode, TableRowNode } from "@lexical/table";
import { LinkNode } from "@lexical/link";
import { ListNode, ListItemNode } from "@lexical/list";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";

// Define custom commands with proper typing
export const IMPORT_HTML_COMMAND: LexicalCommand<string> = createCommand('IMPORT_HTML');
export const EXPORT_HTML_COMMAND: LexicalCommand<void> = createCommand('EXPORT_HTML');

// Custom plugin to import initial HTML
interface HtmlImportPluginProps {
  readonly initialHtml: string;
}

// Update the parseHtmlToNodes function to better handle HTML
function parseHtmlToNodes(html: string, editor: LexicalEditor): void {
  if (!html || typeof html !== 'string') return;

  try {
    // Clean up HTML but preserve formatting
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    editor.update(() => {
      const root = $getRoot();
      root.clear();
      
      try {
        // Try using Lexical's built-in DOM parsing
        const nodes = $generateNodesFromDOM(editor, doc);
        if (nodes.length > 0) {
          root.append(...nodes);
          return;
        }
      } catch (parseError) {
        console.warn("DOM parsing failed, using fallback method:", parseError);
      }
      
      // If DOM parsing fails, use a more direct approach
      root.append($createParagraphNode().append($createTextNode(doc.body.innerHTML || "")));
    });
  } catch (error) {
    console.error("Error in parseHtmlToNodes:", error);
    
    // Ultimate fallback - create an empty editor state
    editor.update(() => {
      const root = $getRoot();
      root.clear();
      root.append($createParagraphNode().append($createTextNode(html || "")));
    });
  }
}

// Manual HTML parsing as a fallback
function manualParseHtml(editor: LexicalEditor, htmlString: string): void {
  if (!htmlString) return;

  editor.update(() => {
    const root = $getRoot();
    root.clear();
    
    // Remove comments, scripts, and styles
    const cleanHtml = htmlString
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
    
    // Create a temporary DOM element to parse the HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = cleanHtml;
    
    // Function to recursively process nodes
    function processNodes(element: Element | Document | DocumentFragment, parentNode: ElementNode) {
      // Process text content first if this is a leaf node
      if (element.childNodes.length === 0 || 
          (element.childNodes.length === 1 && element.firstChild?.nodeType === Node.TEXT_NODE)) {
        const textContent = element.textContent ?? '';
        if (textContent.trim()) {
          const textNode = $createTextNode(textContent);
          parentNode.append(textNode);
        }
        return;
      }
      
      // Process child nodes
      element.childNodes.forEach(childNode => {
        if (childNode.nodeType === Node.TEXT_NODE) {
          // Text node
          const text = childNode.textContent ?? '';
          if (text.trim()) {
            const textNode = $createTextNode(text);
            parentNode.append(textNode);
          }
        } else if (childNode.nodeType === Node.ELEMENT_NODE) {
          // Element node
          const childElement = childNode as Element;
          const tagName = childElement.tagName.toLowerCase();
          
          // Handle different elements
          if (tagName === 'p' || tagName === 'div') {
            const paragraph = $createParagraphNode();
            parentNode.append(paragraph);
            processNodes(childElement, paragraph);
          } else {
            // For other elements, just process their children in the current parent
            processNodes(childElement, parentNode);
          }
        }
      });
    }
    
    // Start processing from the temporary div
    const paragraph = $createParagraphNode();
    root.append(paragraph);
    processNodes(tempDiv, paragraph);
    
    // If the root is empty, add an empty paragraph
    if (root.getChildrenSize() === 0) {
      const emptyParagraph = $createParagraphNode();
      emptyParagraph.append($createTextNode(''));
      root.append(emptyParagraph);
    }
  });
}

export function HtmlImportPlugin({ initialHtml }: HtmlImportPluginProps) {
  const [editor] = useLexicalComposerContext();
  
  useEffect(() => {
    // Skip if there's no HTML or it's just the default
    if (!initialHtml || initialHtml === "<p>Write your email content here...</p>") {
      return;
    }
    
    // Use a short timeout to ensure the editor is fully initialized
    const timeoutId = setTimeout(() => {
      try {
        // Try the improved HTML parser first
        parseHtmlToNodes(initialHtml, editor);
      } catch (error) {
        console.error("Error importing initial HTML with parser:", error);
        
        try {
          // Try manual parsing as fallback
          manualParseHtml(editor, initialHtml);
        } catch (fallbackError) {
          console.error("Fallback parsing also failed:", fallbackError);
          
          // Ultimate fallback - empty paragraph
          editor.update(() => {
            const root = $getRoot();
            root.clear();
            
            const paragraph = $createParagraphNode();
            paragraph.append($createTextNode(""));
            root.append(paragraph);
          });
        }
      }
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }, [editor, initialHtml]);
  
  return null;
}

export function HtmlPlugin() {
  const [editor] = useLexicalComposerContext();
  
  useEffect(() => {
    // Check if the editor has these nodes registered
    if (!editor.hasNodes([
      HorizontalRuleNode,
      TableNode,
      TableCellNode,
      TableRowNode,
      LinkNode,
      ListNode,
      ListItemNode,
      HeadingNode,
      QuoteNode
    ])) {
      console.warn('Some node types may not be properly registered with the editor');
    }
    
    // Add command for importing HTML
    const importHtmlUnregister = editor.registerCommand<string>(
      IMPORT_HTML_COMMAND,
      (htmlString) => {
        if (!htmlString || typeof htmlString !== 'string') {
          return false;
        }
        
        try {
          // Try the improved HTML parser
          parseHtmlToNodes(htmlString, editor);
          return true;
        } catch (error) {
          console.error("Error in HTML import command:", error);
          
          try {
            // Try manual parsing as fallback
            manualParseHtml(editor, htmlString);
            return true;
          } catch (fallbackError) {
            console.error("Fallback parsing also failed:", fallbackError);
            
            // Ultimate fallback - empty paragraph
            editor.update(() => {
              const root = $getRoot();
              root.clear();
              
              const paragraph = $createParagraphNode();
              paragraph.append($createTextNode(""));
              root.append(paragraph);
            });
            
            return false;
          }
        }
      },
      COMMAND_PRIORITY_EDITOR
    );
    
    // Add command for exporting HTML
    const exportHtmlUnregister = editor.registerCommand<void>(
      EXPORT_HTML_COMMAND,
      () => {
        // Just trigger HTML generation
        editor.update(() => {
          try {
            $generateHtmlFromNodes(editor);
          } catch (error) {
            console.error("Error generating HTML:", error);
          }
        });
        
        return true;
      },
      COMMAND_PRIORITY_EDITOR
    );
    
    // Cleanup function
    return () => {
      importHtmlUnregister();
      exportHtmlUnregister();
    };
  }, [editor]);
  
  // This plugin doesn't render anything
  return null;
}

// Helper function to get HTML from editor
export function getEditorHtml(editor: LexicalEditor): string {
  let html = '';
  try {
    editor.update(() => {
      html = $generateHtmlFromNodes(editor);
    });
  } catch (error) {
    console.error("Error generating HTML:", error);
  }
  return html;
}

// Enhanced importHtml function with better error handling
export function importHtml(editor: LexicalEditor, html: string): void {
  if (!editor || !html) return;
  
  try {
    // First set a placeholder
    editor.update(() => {
      const root = $getRoot();
      root.clear();
      
      const paragraph = $createParagraphNode();
      paragraph.append($createTextNode("Loading content..."));
      root.append(paragraph);
    });
    
    // Then use a timeout to allow the editor to stabilize
    setTimeout(() => {
      editor.update(() => {
        try {
          
          const root = $getRoot();
          root.clear();
          
          // Try to preserve the HTML structure exactly as it was input
          const paragraph = $createParagraphNode();
          paragraph.append($createTextNode(html));
          root.append(paragraph);
        } catch (error) {
          console.error("Error importing HTML:", error);
          
          // Ultimate fallback
          const root = $getRoot();
          root.clear();
          const paragraph = $createParagraphNode();
          paragraph.append($createTextNode(html || ""));
          root.append(paragraph);
        }
      });
    }, 50);
  } catch (error) {
    console.error("Error in importHtml:", error);
  }
}