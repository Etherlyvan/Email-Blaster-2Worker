// components/editor/plugins/ToolbarPlugin.tsx 
"use client";

import { useState, useCallback, useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  FORMAT_ELEMENT_COMMAND,
  UNDO_COMMAND,
  REDO_COMMAND,
  CAN_UNDO_COMMAND,
  CAN_REDO_COMMAND,
  COMMAND_PRIORITY_CRITICAL,
  ElementFormatType,
  TextFormatType,
  TextNode,
  $isTextNode,
  createCommand,
  LexicalCommand,
  $createParagraphNode,
  LexicalNode,
  RangeSelection
} from "lexical";
import { $createHeadingNode, $isHeadingNode } from "@lexical/rich-text";
import { $isLinkNode, TOGGLE_LINK_COMMAND } from "@lexical/link";
import {
  $isListNode,
  ListNode,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  REMOVE_LIST_COMMAND,
} from "@lexical/list";
import { $getNearestNodeOfType, mergeRegister } from "@lexical/utils";
import {
  INSERT_HORIZONTAL_RULE_COMMAND
} from "@lexical/react/LexicalHorizontalRuleNode";
import { INSERT_TABLE_COMMAND } from "@lexical/table";
import type { LexicalEditor } from "lexical";

// Create icons for toolbar
const BoldIcon = () => <span>B</span>;
const ItalicIcon = () => <span>I</span>;
const UnderlineIcon = () => <span>U</span>;
const StrikethroughIcon = () => <span>S</span>;
const Heading1Icon = () => <span>H1</span>;
const Heading2Icon = () => <span>H2</span>;
const Heading3Icon = () => <span>H3</span>;
const ParagraphIcon = () => <span>P</span>;
const ListOrderedIcon = () => <span>OL</span>;
const ListBulletIcon = () => <span>UL</span>;
const LinkIcon = () => <span>🔗</span>;
const AlignLeftIcon = () => <span>⬅️</span>;
const AlignCenterIcon = () => <span>⬆️</span>;
const AlignRightIcon = () => <span>➡️</span>;
const AlignJustifyIcon = () => <span>⬇️</span>;
const UndoIcon = () => <span>↩️</span>;
const RedoIcon = () => <span>↪️</span>;
const HorizontalRuleIcon = () => <span>—</span>;
const TableIcon = () => <span>🏓</span>;
const QuoteIcon = () => <span>❝</span>;
const ClearFormattingIcon = () => <span>🧹</span>;
const TemplateVariableIcon = () => <span>{"{{Var}}"}</span>;

// Define a command to clear formatting
export const CLEAR_FORMATTING_COMMAND: LexicalCommand<void> = createCommand('CLEAR_FORMATTING_COMMAND');

// Define a command to show template variables dropdown
export const SHOW_TEMPLATE_VARIABLES: LexicalCommand<{ position: { top: number, left: number } }> = createCommand('SHOW_TEMPLATE_VARIABLES');

interface ToolbarIconProps {
  readonly active?: boolean;
  readonly disabled?: boolean;
  readonly onClick: () => void;
  readonly children: React.ReactNode;
  readonly title?: string;
  readonly className?: string;
}

function ToolbarIcon({ 
  active = false, 
  disabled = false, 
  onClick, 
  children,
  title,
  className = ""
}: ToolbarIconProps) {
  return (
    <button
      className={`toolbar-item ${active ? 'active' : ''} ${disabled ? 'disabled' : ''} ${className}`}
      onClick={onClick}
      disabled={disabled}
      title={title}
      type="button"
      aria-label={title}
    >
      {children}
    </button>
  );
}

interface TableOptionsProps {
  readonly onClose: () => void;
  readonly onInsert: (rows: string, columns: string) => void;
}

function TableOptions({ onClose, onInsert }: TableOptionsProps) {
  const [rows, setRows] = useState('3');
  const [columns, setColumns] = useState('3');

  return (
    <div className="table-options-popup">
      <div className="table-options-header">
        <h3>Insert Table</h3>
        <button className="close-button" onClick={onClose}>×</button>
      </div>
      <div className="table-options-content">
        <div className="table-option">
          <label htmlFor="table-rows">Rows:</label>
          <input 
            id="table-rows" 
            type="number" 
            min="1" 
            max="20" 
            value={rows} 
            onChange={(e) => setRows(e.target.value)} 
          />
        </div>
        <div className="table-option">
          <label htmlFor="table-columns">Columns:</label>
          <input 
            id="table-columns" 
            type="number" 
            min="1" 
            max="10" 
            value={columns} 
            onChange={(e) => setColumns(e.target.value)} 
          />
        </div>
        <div className="table-options-footer">
          <button 
            className="cancel-button" 
            onClick={onClose}
          >
            Cancel
          </button>
          <button 
            className="insert-button" 
            onClick={() => {
              onInsert(rows, columns);
              onClose();
            }}
          >
            Insert
          </button>
        </div>
      </div>
    </div>
  );
}

// Extract some functions to reduce nesting and cognitive complexity
const clearTextNodeFormatting = (editor: LexicalEditor, textNode: TextNode) => {
  const formats: TextFormatType[] = ["bold", "italic", "underline", "strikethrough"];
  
  formats.forEach(format => {
    if (textNode.hasFormat(format)) {
      editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
    }
  });
};

const handleClearFormatting = (editor: LexicalEditor) => {
  const selection = $getSelection();
  if ($isRangeSelection(selection)) {
    // Clear text formatting
    selection.getNodes().forEach((node) => {
      // Check if it's a text node before trying to manipulate formats
      if ($isTextNode(node)) {
        clearTextNodeFormatting(editor, node);
      }
      
      // Convert non-paragraph blocks to paragraphs
      const parent = node.getParent();
      if (parent && parent.getType() !== 'root' && parent.getType() !== 'paragraph') {
        const paragraph = $createParagraphNode();
        parent.replace(paragraph);
        paragraph.append(node);
      }
    });
    return true;
  }
  return false;
};

// Helper function for creating elements with proper typing
const createHeadingNodeWithTag = (tag: 'h1' | 'h2' | 'h3') => {
  return $createHeadingNode(tag);
};

// Extract alignment handling to reduce nesting and complexity
const handleAlignment = (editor: LexicalEditor, alignment: ElementFormatType) => {
  editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, alignment);
};

// Extract horizontal rule insertion to reduce nesting
const insertHorizontalRule = (editor: LexicalEditor) => {
  editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined);
};

// Extract formatting logic to reduce complexity
const formatNode = (editor: LexicalEditor, selection: RangeSelection) => {
  selection.getNodes().forEach((node: LexicalNode) => {
    if ($isTextNode(node)) {
      // Clear all formatting
      ["bold", "italic", "underline", "strikethrough"].forEach(format => {
        if (node.hasFormat(format as TextFormatType)) {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, format as TextFormatType);
        }
      });
    }
  });
};

// Function to handle formatting as heading
const applyHeadingFormat = (editor: LexicalEditor, headingTag: 'h1' | 'h2' | 'h3') => {
  editor.update(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      // Get selected nodes
      const nodes = selection.getNodes();
      if (nodes.length === 0) return;

      // Create new heading node
      const headingNode = createHeadingNodeWithTag(headingTag);
      
      // Get parent of first node
      const firstNode = nodes[0];
      const parent = firstNode.getParent();
      
      if (parent) {
        // Insert heading before parent
        parent.insertBefore(headingNode);
        
        // Move all nodes to heading
        nodes.forEach(node => {
          headingNode.append(node);
        });
        
        // If parent is now empty, remove it
        if (parent.getChildrenSize() === 0) {
          parent.remove();
        }
      }
    }
  });
};

// Function to handle formatting as paragraph
const applyParagraphFormat = (editor: LexicalEditor) => {
  editor.update(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      // Get selected nodes
      const nodes = selection.getNodes();
      if (nodes.length === 0) return;

      // Create new paragraph node
      const paragraphNode = $createParagraphNode();
      
      // Get parent of first node
      const firstNode = nodes[0];
      const parent = firstNode.getParent();
      
      if (parent) {
        // Insert paragraph before parent
        parent.insertBefore(paragraphNode);
        
        // Move all nodes to paragraph
        nodes.forEach(node => {
          paragraphNode.append(node);
        });
        
        // If parent is now empty, remove it
        if (parent.getChildrenSize() === 0) {
          parent.remove();
        }
      }
    }
  });
};

// Extract block type checking to reduce complexity in updateToolbar
const determineBlockType = (element: LexicalNode, anchorNode: LexicalNode): string => {
  if ($isHeadingNode(element)) {
    return element.getTag();
  } 
  
  if ($isListNode(element)) {
    const parentList = $getNearestNodeOfType(anchorNode, ListNode);
    const listType = parentList ? parentList.getListType() : null;
    return listType === "bullet" ? "ul" : "ol";
  }
  
  return "paragraph";
};

// Define a proper interface for ToolbarButtonGroups props
interface ToolbarButtonGroupsProps {
  readonly editor: LexicalEditor;
  readonly canUndo: boolean;
  readonly canRedo: boolean;
  readonly isBold: boolean;
  readonly isItalic: boolean;
  readonly isUnderline: boolean;
  readonly isStrikethrough: boolean;
  readonly blockType: string;
  readonly isLink: boolean;
  readonly showLinkInput: boolean;
  readonly linkUrl: string;
  readonly showTableOptions: boolean;
  readonly formatHeading: (headingSize: "h1" | "h2" | "h3") => void;
  readonly formatParagraph: () => void;
  readonly clearFormatting: () => void;
  readonly handleQuoteClick: () => void;
  readonly handleToggleUnorderedList: () => void;
  readonly handleToggleOrderedList: () => void;
  readonly handleToggleLink: () => void;
  readonly handleToggleTableOptions: () => void;
  readonly showTemplateVariables: () => void;
  readonly insertLink: () => void;
  readonly handleKeyDown: (e: React.KeyboardEvent) => void;
  readonly insertTable: (rows: string, columns: string) => void;
}

// Split the toolbar component into smaller parts
function ToolbarButtonGroups({
  editor,
  canUndo,
  canRedo,
  isBold,
  isItalic,
  isUnderline,
  isStrikethrough,
  blockType,
  isLink,
  showLinkInput,
  linkUrl,
  showTableOptions,
  formatHeading,
  formatParagraph,
  clearFormatting,
  handleQuoteClick,
  handleToggleUnorderedList,
  handleToggleOrderedList,
  handleToggleLink,
  handleToggleTableOptions,
  showTemplateVariables,
  insertLink,
  handleKeyDown,
  insertTable
}: ToolbarButtonGroupsProps) {
  // Prepare table options outside of the JSX
  const tableOptionsElement = showTableOptions ? (
    <TableOptions 
      onClose={() => handleToggleTableOptions()}
      onInsert={insertTable}
    />
  ) : null;

  // Prepare link input outside of the JSX
  const linkInputElement = showLinkInput ? (
    <div className="link-input-container">
      <input
        type="text"
        value={linkUrl}
        onChange={(e) => {
          const target = e.target as HTMLInputElement;
          setLinkUrl(target.value);
        }}
        placeholder="Enter URL"
        className="link-input"
        onKeyDown={handleKeyDown}
      />
      <button 
        className="link-input-button" 
        onClick={insertLink}
        type="button"
      >
        Add
      </button>
    </div>
  ) : null;

  return (
    <>
      <div className="toolbar-group">
        <ToolbarIcon 
          onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)} 
          disabled={!canUndo}
          title="Undo"
        >
          <UndoIcon />
        </ToolbarIcon>
        <ToolbarIcon 
          onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)} 
          disabled={!canRedo}
          title="Redo"
        >
          <RedoIcon />
        </ToolbarIcon>
      </div>
      
      <div className="toolbar-divider" />
      
      <div className="toolbar-group">
        <ToolbarIcon 
          onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold")}
          active={isBold}
          title="Bold"
        >
          <BoldIcon />
        </ToolbarIcon>
        <ToolbarIcon 
          onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic")}
          active={isItalic}
          title="Italic"
        >
          <ItalicIcon />
        </ToolbarIcon>
        <ToolbarIcon 
          onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline")}
          active={isUnderline}
          title="Underline"
        >
          <UnderlineIcon />
        </ToolbarIcon>
        <ToolbarIcon 
          onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough")}
          active={isStrikethrough}
          title="Strikethrough"
        >
          <StrikethroughIcon />
        </ToolbarIcon>
        <ToolbarIcon 
          onClick={clearFormatting}
          title="Clear Formatting"
        >
          <ClearFormattingIcon />
        </ToolbarIcon>
      </div>
      
      <div className="toolbar-divider" />
      
      <div className="toolbar-group">
        <ToolbarIcon 
          onClick={formatParagraph}
          active={blockType === "paragraph"}
          title="Paragraph"
        >
          <ParagraphIcon />
        </ToolbarIcon>
        <ToolbarIcon 
          onClick={() => formatHeading("h1")}
          active={blockType === "h1"}
          title="Heading 1"
        >
          <Heading1Icon />
        </ToolbarIcon>
        <ToolbarIcon 
          onClick={() => formatHeading("h2")}
          active={blockType === "h2"}
          title="Heading 2"
        >
          <Heading2Icon />
        </ToolbarIcon>
        <ToolbarIcon 
          onClick={() => formatHeading("h3")}
          active={blockType === "h3"}
          title="Heading 3"
        >
          <Heading3Icon />
        </ToolbarIcon>
        <ToolbarIcon 
          onClick={handleQuoteClick}
          title="Quote"
        >
          <QuoteIcon />
        </ToolbarIcon>
      </div>
      
      <div className="toolbar-divider" />
      
      <div className="toolbar-group">
        <ToolbarIcon 
          onClick={handleToggleUnorderedList}
          active={blockType === "ul"}
          title="Bullet List"
        >
          <ListBulletIcon />
        </ToolbarIcon>
        <ToolbarIcon 
          onClick={handleToggleOrderedList}
          active={blockType === "ol"}
          title="Numbered List"
        >
          <ListOrderedIcon />
        </ToolbarIcon>
      </div>
      
      <div className="toolbar-divider" />
      
      <div className="toolbar-group">
        <ToolbarIcon 
          onClick={handleToggleLink}
          active={isLink || showLinkInput}
          title="Link"
        >
          <LinkIcon />
        </ToolbarIcon>
        
        {linkInputElement}
      </div>
      
      <div className="toolbar-divider" />
      
      <div className="toolbar-group">
        <ToolbarIcon 
          onClick={() => handleAlignment(editor, "left")}
          title="Align Left"
        >
          <AlignLeftIcon />
        </ToolbarIcon>
        <ToolbarIcon 
          onClick={() => handleAlignment(editor, "center")}
          title="Align Center"
        >
          <AlignCenterIcon />
        </ToolbarIcon>
        <ToolbarIcon 
          onClick={() => handleAlignment(editor, "right")}
          title="Align Right"
        >
          <AlignRightIcon />
        </ToolbarIcon>
        <ToolbarIcon 
          onClick={() => handleAlignment(editor, "justify")}
          title="Justify"
        >
          <AlignJustifyIcon />
        </ToolbarIcon>
      </div>
      
      <div className="toolbar-divider" />
      
      <div className="toolbar-group">
        <ToolbarIcon 
          onClick={() => insertHorizontalRule(editor)}
          title="Horizontal Rule"
        >
          <HorizontalRuleIcon />
        </ToolbarIcon>
        <ToolbarIcon 
          onClick={handleToggleTableOptions}
          active={showTableOptions}
          title="Insert Table"
        >
          <TableIcon />
        </ToolbarIcon>
        <ToolbarIcon 
          onClick={showTemplateVariables}
          title="Insert Template Variable"
          className="template-variables-button"
        >
          <TemplateVariableIcon />
        </ToolbarIcon>
        
        {tableOptionsElement}
      </div>
    </>
  );
}

// For setting link URL (this is needed because we extracted the component)
let setLinkUrl: (url: string) => void;

export function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const [isLink, setIsLink] = useState(false);
  const [blockType, setBlockType] = useState<string>("paragraph");
  const [linkUrlState, setLinkUrlState] = useState<string>("");
  const [showLinkInput, setShowLinkInput] = useState<boolean>(false);
  const [showTableOptions, setShowTableOptions] = useState<boolean>(false);

  // Set the external setter for linkUrl
  setLinkUrl = setLinkUrlState;

  // Register the clear formatting command
  useEffect(() => {
    return editor.registerCommand(
      CLEAR_FORMATTING_COMMAND,
      () => handleClearFormatting(editor),
      COMMAND_PRIORITY_CRITICAL
    );
  }, [editor]);

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      // Update text format
      setIsBold(selection.hasFormat("bold"));
      setIsItalic(selection.hasFormat("italic"));
      setIsUnderline(selection.hasFormat("underline"));
      setIsStrikethrough(selection.hasFormat("strikethrough"));

      // Update links
      const node = selection.getNodes()[0];
      const parent = node.getParent();
      setIsLink($isLinkNode(parent) || $isLinkNode(node));

      // Update block type
      const anchorNode = selection.anchor.getNode();
      const element = anchorNode.getKey() === "root"
        ? anchorNode
        : anchorNode.getTopLevelElementOrThrow();

      // Use the extracted function to determine block type
      setBlockType(determineBlockType(element, anchorNode));
    }
  }, []);

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          updateToolbar();
        });
      }),
      editor.registerCommand(
        CAN_UNDO_COMMAND,
        (payload) => {
          setCanUndo(payload);
          return false;
        },
        0 // Priority as number
      ),
      editor.registerCommand(
        CAN_REDO_COMMAND,
        (payload) => {
          setCanRedo(payload);
          return false;
        },
        0 // Priority as number
      )
    );
  }, [editor, updateToolbar]);

  const insertLink = useCallback(() => {
    if (!linkUrlState) return;
    editor.dispatchCommand(TOGGLE_LINK_COMMAND, linkUrlState);
    setShowLinkInput(false);
    setLinkUrlState("");
  }, [editor, linkUrlState]);

  const formatHeading = useCallback(
    (headingSize: "h1" | "h2" | "h3") => {
      if (blockType !== headingSize) {
        applyHeadingFormat(editor, headingSize);
      } else {
        applyParagraphFormat(editor);
      }
    },
    [blockType, editor]
  );

  const formatParagraph = useCallback(() => {
    if (blockType !== "paragraph") {
      applyParagraphFormat(editor);
    }
  }, [blockType, editor]);

  const insertTable = useCallback((rows: string, columns: string) => {
    editor.dispatchCommand(INSERT_TABLE_COMMAND, { rows, columns });
  }, [editor]);
  
  const clearFormatting = useCallback(() => {
    editor.dispatchCommand(CLEAR_FORMATTING_COMMAND, undefined);
  }, [editor]);

  const showTemplateVariables = useCallback(() => {
    const button = document.querySelector('.template-variables-button');
    if (button) {
      const rect = button.getBoundingClientRect();
      editor.dispatchCommand(SHOW_TEMPLATE_VARIABLES, {
        position: {
          top: rect.bottom + window.scrollY,
          left: rect.left + window.scrollX,
        },
      });
    }
  }, [editor]);

  // Extract handlers to reduce nesting and cognitive complexity
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      insertLink();
      e.preventDefault();
    } else if (e.key === "Escape") {
      setShowLinkInput(false);
      setLinkUrlState("");
      e.preventDefault();
    }
  }, [insertLink]);

  const handleQuoteClick = useCallback(() => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        applyParagraphFormat(editor);
        // Remove formatting
        if (selection) {
          formatNode(editor, selection);
        }
      }
    });
  }, [editor]);

  const handleToggleUnorderedList = useCallback(() => {
    if (blockType !== "ul") {
      editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
    } else {
      editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
    }
  }, [blockType, editor]);

  const handleToggleOrderedList = useCallback(() => {
    if (blockType !== "ol") {
      editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
    } else {
      editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
    }
  }, [blockType, editor]);

  const handleToggleLink = useCallback(() => {
    if (isLink) {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
    } else {
      setShowLinkInput(!showLinkInput);
    }
  }, [isLink, showLinkInput, editor]);

  const handleToggleTableOptions = useCallback(() => {
    setShowTableOptions(!showTableOptions);
  }, [showTableOptions]);

  return (
    <div className="toolbar">
      <ToolbarButtonGroups
        editor={editor}
        canUndo={canUndo}
        canRedo={canRedo}
        isBold={isBold}
        isItalic={isItalic}
        isUnderline={isUnderline}
        isStrikethrough={isStrikethrough}
        blockType={blockType}
        isLink={isLink}
        showLinkInput={showLinkInput}
        linkUrl={linkUrlState}
        showTableOptions={showTableOptions}
        formatHeading={formatHeading}
        formatParagraph={formatParagraph}
        clearFormatting={clearFormatting}
        handleQuoteClick={handleQuoteClick}
        handleToggleUnorderedList={handleToggleUnorderedList}
        handleToggleOrderedList={handleToggleOrderedList}
        handleToggleLink={handleToggleLink}
        handleToggleTableOptions={handleToggleTableOptions}
        showTemplateVariables={showTemplateVariables}
        insertLink={insertLink}
        handleKeyDown={handleKeyDown}
        insertTable={insertTable}
      />
    </div>
  );
}