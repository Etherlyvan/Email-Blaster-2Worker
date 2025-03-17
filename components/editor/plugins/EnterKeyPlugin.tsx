// components/editor/plugins/EnterKeyPlugin.tsx
"use client";

import { useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { 
  $getSelection, 
  $isRangeSelection,
  // Hapus import yang tidak digunakan
  COMMAND_PRIORITY_CRITICAL,
  KEY_ENTER_COMMAND
} from "lexical";

export function EnterKeyPlugin() {
  const [editor] = useLexicalComposerContext();
  
  useEffect(() => {
    // Intercept Enter key to create proper paragraphs
    return editor.registerCommand(
      KEY_ENTER_COMMAND,
      // Hapus parameter event yang tidak digunakan
      () => {
        // Let's create a new paragraph only on Enter
        editor.update(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            // Insert a new paragraph
            selection.insertParagraph();
          }
        });
        
        // We handled the enter key
        return true;
      },
      COMMAND_PRIORITY_CRITICAL
    );
  }, [editor]);
  
  return null;
}