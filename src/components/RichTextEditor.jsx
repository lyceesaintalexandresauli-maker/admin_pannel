import { useEffect, useRef } from "react";
import { richTextToPlainText, sanitizeRichText } from "../utils/richText";

const TOOL_GROUPS = [
  [
    { label: "Bold", icon: <strong>B</strong>, command: "bold" },
    { label: "Italic", icon: <em>I</em>, command: "italic" },
    { label: "Underline", icon: <span className="adm-rich-underline">U</span>, command: "underline" },
  ],
  [
    { label: "Paragraph", icon: "P", command: "formatBlock", value: "P" },
    { label: "Heading 2", icon: "H2", command: "formatBlock", value: "H2" },
    { label: "Heading 3", icon: "H3", command: "formatBlock", value: "H3" },
    { label: "Quote", icon: "Q", command: "formatBlock", value: "BLOCKQUOTE" },
  ],
  [
    { label: "Bulleted list", icon: <i className="bi bi-list-ul" aria-hidden="true" />, command: "insertUnorderedList" },
    { label: "Numbered list", icon: <i className="bi bi-list-ol" aria-hidden="true" />, command: "insertOrderedList" },
  ],
];

export default function RichTextEditor({ value, onChange, placeholder, required = false }) {
  const editorRef = useRef(null);
  const savedRangeRef = useRef(null);
  const lastEmittedRef = useRef(null);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || lastEmittedRef.current === value) return;
    const safeHtml = sanitizeRichText(value);
    if (editor.innerHTML !== safeHtml) editor.innerHTML = safeHtml;
    lastEmittedRef.current = value;
  }, [value]);

  const saveSelection = () => {
    const editor = editorRef.current;
    const selection = window.getSelection();
    if (!editor || !selection?.rangeCount) return;
    const range = selection.getRangeAt(0);
    if (editor.contains(range.commonAncestorContainer)) savedRangeRef.current = range.cloneRange();
  };

  const restoreSelection = () => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
    const selection = window.getSelection();
    if (selection && savedRangeRef.current) {
      selection.removeAllRanges();
      selection.addRange(savedRangeRef.current);
    }
  };

  const emitContent = () => {
    const editor = editorRef.current;
    if (!editor) return;
    const safeHtml = sanitizeRichText(editor.innerHTML);
    lastEmittedRef.current = safeHtml;
    onChange(safeHtml);
    saveSelection();
  };

  const runCommand = (command, valueToApply) => {
    restoreSelection();
    if (command === "createLink") {
      const href = window.prompt("Enter a web address or email link:", "https://");
      if (!href) return;
      const trimmedHref = href.trim();
      if (!/^(https?:\/\/|mailto:|tel:|\/|#|\.\/|\.\.\/)/i.test(trimmedHref)) {
        window.alert("Use a web address, email link, phone link, or page anchor.");
        return;
      }
      document.execCommand(command, false, trimmedHref);
    } else {
      document.execCommand(command, false, valueToApply);
    }
    emitContent();
  };

  const insertPlainText = (text) => {
    restoreSelection();
    document.execCommand("insertText", false, text);
    emitContent();
  };

  const handlePaste = (event) => {
    event.preventDefault();
    insertPlainText(event.clipboardData?.getData("text/plain") || "");
  };

  const handleDrop = (event) => {
    event.preventDefault();
    insertPlainText(event.dataTransfer?.getData("text/plain") || "");
  };

  return (
    <div className="adm-rich-editor">
      <div className="adm-rich-toolbar" role="toolbar" aria-label="Text formatting">
        {TOOL_GROUPS.map((group, groupIndex) => (
          <div className="adm-rich-toolbar-group" key={groupIndex}>
            {group.map((tool) => (
              <button
                className="adm-rich-tool"
                type="button"
                key={tool.label}
                title={tool.label}
                aria-label={tool.label}
                onMouseDown={(event) => {
                  event.preventDefault();
                  saveSelection();
                }}
                onClick={() => runCommand(tool.command, tool.value)}
              >
                {tool.icon}
              </button>
            ))}
          </div>
        ))}
        <div className="adm-rich-toolbar-group">
          <button
            className="adm-rich-tool"
            type="button"
            title="Add link"
            aria-label="Add link"
            onMouseDown={(event) => { event.preventDefault(); saveSelection(); }}
            onClick={() => runCommand("createLink")}
          >
            <i className="bi bi-link-45deg" aria-hidden="true" />
          </button>
          <button
            className="adm-rich-tool"
            type="button"
            title="Remove link"
            aria-label="Remove link"
            onMouseDown={(event) => { event.preventDefault(); saveSelection(); }}
            onClick={() => runCommand("unlink")}
          >
            <i className="bi bi-link-45deg" aria-hidden="true" />
            <span className="adm-rich-tool-remove">x</span>
          </button>
        </div>
        <div className="adm-rich-toolbar-group adm-rich-history-tools">
          <button
            className="adm-rich-tool"
            type="button"
            title="Undo"
            aria-label="Undo"
            onMouseDown={(event) => { event.preventDefault(); saveSelection(); }}
            onClick={() => runCommand("undo")}
          ><i className="bi bi-arrow-counterclockwise" aria-hidden="true" /></button>
          <button
            className="adm-rich-tool"
            type="button"
            title="Redo"
            aria-label="Redo"
            onMouseDown={(event) => { event.preventDefault(); saveSelection(); }}
            onClick={() => runCommand("redo")}
          ><i className="bi bi-arrow-clockwise" aria-hidden="true" /></button>
        </div>
      </div>
      <div
        ref={editorRef}
        className="adm-rich-textarea"
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-label="Website section text"
        aria-multiline="true"
        aria-required={required || undefined}
        data-placeholder={placeholder || "Write the copy to display in this page section"}
        onInput={emitContent}
        onKeyUp={saveSelection}
        onMouseUp={saveSelection}
        onBlur={saveSelection}
        onPaste={handlePaste}
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
      />
      <textarea
        className="adm-rich-validation"
        value={richTextToPlainText(value)}
        required={required}
        tabIndex={-1}
        aria-hidden="true"
        onChange={() => {}}
        onInvalid={(event) => {
          event.preventDefault();
          editorRef.current?.focus();
        }}
      />
      <small className="adm-rich-help">Select text and use the toolbar to format it. Pasted text is added without outside styling.</small>
    </div>
  );
}
