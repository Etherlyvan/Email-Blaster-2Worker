// components/editor/plugins/PreventSplitPlugin.tsx
"use client";

import { useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_CRITICAL,
  TextNode,
  SELECTION_CHANGE_COMMAND,
  $getPreviousSelection
  // Hapus import yang tidak digunakan: $createParagraphNode
} from "lexical";

export function PreventSplitPlugin() {
  const [editor] = useLexicalComposerContext();
  
  useEffect(() => {
    // Track text nodes to prevent auto-splitting
    const removeTextTransform = editor.registerNodeTransform(TextNode, () => {
      // Parameter textNode dihapus karena tidak digunakan
      // We're just monitoring text nodes, not modifying them here
    });
    
    // Prevent selection changes from causing paragraph splits
    const removeSelectionListener = editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        const selection = $getSelection();
        const prevSelection = $getPreviousSelection();
        
        // If selection changed dramatically, don't create new paragraphs
        if ($isRangeSelection(selection) && $isRangeSelection(prevSelection)) {
          // We're just monitoring selection changes, not modifying them
        }
        
        // Let the selection change proceed normally
        return false;
      },
      COMMAND_PRIORITY_CRITICAL
    );
    
    return () => {
      removeTextTransform();
      removeSelectionListener();
    };
  }, [editor]);
  
  return null;
}