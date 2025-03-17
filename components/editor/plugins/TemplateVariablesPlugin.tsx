// components/editor/plugins/TemplateVariablesPlugin.tsx
"use client";

import { useEffect, useState } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { 
  $getSelection, 
  $isRangeSelection, 
  COMMAND_PRIORITY_EDITOR,
  createCommand,
  LexicalCommand,
  $createTextNode
} from "lexical";

// Define the command type with proper payload
interface TemplateVariablesPayload {
  position: { top: number; left: number };
}

// Create a command for showing template variables dropdown
export const SHOW_TEMPLATE_VARIABLES: LexicalCommand<TemplateVariablesPayload> = 
  createCommand('SHOW_TEMPLATE_VARIABLES');

interface TemplateVariablesPluginProps {
  readonly variables?: readonly string[];
}

export function TemplateVariablesPlugin({ variables = [] }: TemplateVariablesPluginProps) {
  const [editor] = useLexicalComposerContext();
  const [showVariables, setShowVariables] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  // Register command for showing variable dropdown
  useEffect(() => {
    return editor.registerCommand<TemplateVariablesPayload>(
      SHOW_TEMPLATE_VARIABLES,
      (payload) => {
        setShowVariables(!showVariables);
        if (payload?.position) {
          setPosition(payload.position);
        }
        return true;
      },
      COMMAND_PRIORITY_EDITOR
    );
  }, [editor, showVariables]);

  // Handle inserting a variable
  const insertVariable = (variable: string) => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        // Insert the variable tag
        const varNode = $createTextNode(`{{${variable}}}`);
        selection.insertNodes([varNode]);
      }
    });
    setShowVariables(false);
  };

  if (!showVariables || variables.length === 0) {
    return null;
  }

  return (
    <div 
      className="template-variables-dropdown"
      style={{
        position: 'absolute',
        top: position.top + 'px',
        left: position.left + 'px',
        zIndex: 10,
        backgroundColor: 'white',
        border: '1px solid #ccc',
        borderRadius: '4px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        padding: '8px 0',
        maxHeight: '200px',
        overflowY: 'auto',
        width: '180px',
      }}
    >
      <div className="template-variables-list">
        {variables.map((variable) => (
          <button
            key={variable}
            className="template-variable-item"
            onClick={() => insertVariable(variable)}
            style={{
              display: 'block',
              width: '100%',
              textAlign: 'left',
              padding: '8px 16px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f0f0f0';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            {variable}
          </button>
        ))}
      </div>
    </div>
  );
}