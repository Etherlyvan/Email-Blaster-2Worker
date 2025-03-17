// components/editor/RichTextEditor.tsx
"use client";

import { useCallback, useEffect, useRef } from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { TableCellNode, TableNode, TableRowNode } from "@lexical/table";
import { ListItemNode, ListNode } from "@lexical/list";
import { CodeHighlightNode, CodeNode } from "@lexical/code";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $generateHtmlFromNodes } from "@lexical/html";
import { 
  EditorState, 
  LexicalEditor,
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  TextNode,
  KEY_ENTER_COMMAND,
  COMMAND_PRIORITY_CRITICAL,
  INSERT_PARAGRAPH_COMMAND,
  LexicalCommand
} from "lexical";
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';

import { ToolbarPlugin } from "./plugins/ToolbarPlugin";
import { HtmlPlugin, HtmlImportPlugin } from "./plugins/HtmlPlugin";
import { TemplateVariablesPlugin } from "./plugins/TemplateVariablesPlugin";

import "./EmailEditor.css";

// Editor Props Definition
interface RichTextEditorProps {
  readonly initialHtml?: string;
  readonly onChangeAction: (html: string) => void;
  readonly availableVariables?: readonly string[];
  readonly onEditorReady?: (editor: LexicalEditor) => void;
}

// Placeholder Component
function Placeholder() {
  return <div className="editor-placeholder">Write your email content here...</div>;
}

// Plugin to prevent automatic paragraph creation
function SingleLinePlugin() {
  const [editor] = useLexicalComposerContext();
  const enterPressedRef = useRef(false);
  
  useEffect(() => {
    // Track Enter key presses
    const enterKeyListener = editor.registerCommand(
      KEY_ENTER_COMMAND,
      () => {
        enterPressedRef.current = true;
        setTimeout(() => {
          enterPressedRef.current = false;
        }, 100);
        return false; // Let default Enter behavior happen
      },
      COMMAND_PRIORITY_CRITICAL
    );
    
    // Block paragraph insertion unless Enter was pressed
    const blockAutoInsertListener = editor.registerCommand(
      INSERT_PARAGRAPH_COMMAND as LexicalCommand<unknown>,
      () => {
        if (enterPressedRef.current) {
          return false; // Allow paragraph creation from Enter
        }
        return true; // Block automatic paragraph creation
      },
      COMMAND_PRIORITY_CRITICAL
    );
    
    // Prevent newlines in text nodes
    const textTransformListener = editor.registerNodeTransform(TextNode, (node) => {
      const text = node.getTextContent();
      if (text.includes('\n')) {
        node.setTextContent(text.replace(/\n/g, ' '));
      }
    });
    
    // Cleanup listeners
    return () => {
      enterKeyListener();
      blockAutoInsertListener();
      textTransformListener();
    };
  }, [editor]);
  
  return null;
}

// HTML Change Handler Plugin
function HtmlChangePlugin({ onChangeAction }: { readonly onChangeAction: (html: string) => void }) {
  const [editor] = useLexicalComposerContext();
  const previousHtmlRef = useRef<string>("");
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Clean up HTML helper
  const cleanHtml = (html: string): string => {
    return html
      .replace(/class="editor-paragraph"/g, '')
      .replace(/dir="ltr"/g, '')
      .replace(/<span style="white-space: pre-wrap;">([^<]*)<\/span>/g, '$1')
      .replace(/<p><br><\/p>/g, '<p></p>')
      .replace(/>\s+</g, '><')
      .trim() || '<p></p>';
  };
  
  // Handle editor changes with debounce
  const handleChange = useCallback(
    (editorState: EditorState) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      
      debounceTimerRef.current = setTimeout(() => {
        editorState.read(() => {
          try {
            const html = cleanHtml($generateHtmlFromNodes(editor));
            
            if (html !== previousHtmlRef.current) {
              previousHtmlRef.current = html;
              onChangeAction(html);
            }
          } catch (error) {
            console.error("Error generating HTML:", error);
          }
        });
      }, 200);
    },
    [editor, onChangeAction]
  );
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);
  
  return <OnChangePlugin onChange={handleChange} />;
}

// Editor Reference Plugin
function EditorRefPlugin({ onEditorReady }: { readonly onEditorReady?: (editor: LexicalEditor) => void }) {
  const [editor] = useLexicalComposerContext();
  
  useEffect(() => {
    if (onEditorReady) {
      onEditorReady(editor);
    }
  }, [editor, onEditorReady]);
  
  return null;
}

// Main Rich Text Editor Component
export function RichTextEditor({ 
    initialHtml, 
    onChangeAction, 
    availableVariables = [],
    onEditorReady
  }: RichTextEditorProps) {
  
  // Sanitize initial HTML
  const safeInitialHtml = typeof initialHtml === 'string' && initialHtml.trim() 
    ? initialHtml 
    : "<p>Write your email content here...</p>";
  
  // Editor configuration
  const initialConfig = {
    namespace: "email-editor",
    theme: {
      root: "email-editor-container",
      text: {
        bold: "editor-text-bold",
        italic: "editor-text-italic",
        underline: "editor-text-underline",
        strikethrough: "editor-text-strikethrough",
      },
      link: "editor-link",
      paragraph: "editor-paragraph",
      heading: {
        h1: "editor-heading-h1",
        h2: "editor-heading-h2",
        h3: "editor-heading-h3",
      },
      list: {
        ul: "editor-list-ul",
        ol: "editor-list-ol",
        listitem: "editor-listitem",
      },
      quote: "editor-quote",
      table: "editor-table",
      tableCell: "editor-tableCell",
      tableRow: "editor-tableRow",
    },
    onError: (error: Error) => {
      console.error("Lexical error:", error);
    },
    nodes: [
      HeadingNode,
      QuoteNode,
      ListNode,
      ListItemNode,
      LinkNode,
      AutoLinkNode,
      TableNode,
      TableCellNode,
      TableRowNode,
      CodeNode,
      CodeHighlightNode,
    ],
    // Initialize with a single paragraph
    editorState: () => {
      const paragraph = $createParagraphNode();
      paragraph.append($createTextNode(''));
      $getRoot().append(paragraph);
    }
  };

  // Render the editor
  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className="editor-container">
        <ToolbarPlugin />
        <div className="editor-inner">
          <RichTextPlugin
            contentEditable={<ContentEditable className="editor-input" />}
            placeholder={<Placeholder />}
            ErrorBoundary={LexicalErrorBoundary}
          />
          <HistoryPlugin />
          <AutoFocusPlugin />
          <ListPlugin />
          <LinkPlugin />
          <HtmlPlugin />
          <SingleLinePlugin />
          <TemplateVariablesPlugin variables={availableVariables} />
          <HtmlChangePlugin onChangeAction={onChangeAction} />
          <HtmlImportPlugin initialHtml={safeInitialHtml} />
          {onEditorReady && <EditorRefPlugin onEditorReady={onEditorReady} />}
        </div>
      </div>
    </LexicalComposer>
  );
}