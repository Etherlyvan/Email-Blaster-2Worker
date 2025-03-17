// components/editor/plugins/OnBlurPlugin.tsx
"use client";

import { useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";

export function OnBlurPlugin() {
  const [editor] = useLexicalComposerContext();
  
  useEffect(() => {
    // Prevent auto-paragraph when editor loses focus
    const onBlurListener = editor.registerUpdateListener(({ 
      dirtyElements, 
      dirtyLeaves 
    }) => {
      // Only run this check when the editor is not focused and there are dirty elements
      if (!editor.isEditable() && (dirtyElements.size > 0 || dirtyLeaves.size > 0)) {
        // Prevent automatic paragraph creation by limiting changes when unfocused
        editor.setEditable(true);
      }
    });
    
    // Handle focus events
    const rootElement = editor.getRootElement();
    if (rootElement) {
      const onBlur = () => {
        // Temporarily make editor non-editable to prevent auto-formatting
        editor.setEditable(false);
        
        // Re-enable editable after a short delay
        setTimeout(() => {
          editor.setEditable(true);
        }, 100);
      };
      
      rootElement.addEventListener('blur', onBlur);
      
      return () => {
        rootElement.removeEventListener('blur', onBlur);
        onBlurListener();
      };
    }
    
    return onBlurListener;
  }, [editor]);
  
  return null;
}