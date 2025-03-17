// components/editor/plugins/NoBreakPlugin.tsx
"use client";

import { useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { 
  TextNode,
  COMMAND_PRIORITY_NORMAL,
  COMMAND_PRIORITY_HIGH,
  KEY_ENTER_COMMAND,
  INSERT_PARAGRAPH_COMMAND,
  LexicalCommand
} from "lexical";

// Define a type for our payload
interface ParagraphCommandPayload {
  source?: string;
}

export function NoBreakPlugin() {
  const [editor] = useLexicalComposerContext();
  
  useEffect(() => {
    // Prevent automatic line breaks in text nodes
    const removeTransform = editor.registerNodeTransform(TextNode, (textNode) => {
      const text = textNode.getTextContent();
      
      if (text.includes('\n')) {
        // Replace automatic line breaks with spaces, but don't touch intentional ones
        const cleanText = text.replace(/\n/g, ' ');
        if (cleanText !== text) {
          textNode.setTextContent(cleanText);
        }
      }
    });
    
    // Only allow paragraph creation on explicit Enter press
    const removeEnterListener = editor.registerCommand(
      KEY_ENTER_COMMAND,
      () => {
        // Allow default Enter behavior
        return false;
      },
      COMMAND_PRIORITY_NORMAL
    );
    
    // Prevent automatic paragraph insertion
    const removeAutoParagraphListener = editor.registerCommand<ParagraphCommandPayload | null>(
      INSERT_PARAGRAPH_COMMAND as LexicalCommand<ParagraphCommandPayload | null>,
      (payload) => {
        // Check if payload exists and has the expected source property
        if (payload && typeof payload === 'object' && 'source' in payload) {
          if (payload.source === 'user-enter') {
            return false; // Let the command proceed
          }
        }
        
        // Block automatic paragraph insertion
        return true; // Prevent the command
      },
      COMMAND_PRIORITY_HIGH
    );
    
    return () => {
      removeTransform();
      removeEnterListener();
      removeAutoParagraphListener();
    };
  }, [editor]);
  
  return null;
}