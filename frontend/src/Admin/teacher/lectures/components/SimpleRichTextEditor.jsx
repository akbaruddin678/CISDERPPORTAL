import React, { useRef, useEffect } from "react";
import {
  Bold, Italic, Underline, List, ListOrdered,
  Image as ImageIcon, AlignLeft, AlignCenter, AlignRight,
} from "lucide-react";

const SimpleRichTextEditor = ({ value, onChange }) => {
  const editorRef = useRef(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || "";
    }
    // Only sync from external value changes (e.g. loading an existing
    // lecture) — not on every keystroke, which would fight the cursor.
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  };

  const executeCommand = (command, val = null) => {
    document.execCommand(command, false, val);
    editorRef.current.focus();
    handleInput();
  };

  const handleAddImage = () => {
    const url = prompt("Enter Image URL (e.g., https://example.com/image.jpg):");
    if (url) {
      const imgHtml = `<img src="${url}" alt="Lecture Image" style="max-width: 100%; height: auto; border-radius: 8px; margin: 10px 0;" />`;
      document.execCommand("insertHTML", false, imgHtml);
      handleInput();
    }
  };

  return (
    <div className="border border-slate-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-shadow bg-white">
      <div className="bg-slate-50 border-b border-slate-300 p-2 flex flex-wrap gap-1 items-center">
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => executeCommand("bold")}                  className="p-1.5 text-slate-700 hover:bg-slate-200 rounded-lg" title="Bold"><Bold size={16} /></button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => executeCommand("italic")}                className="p-1.5 text-slate-700 hover:bg-slate-200 rounded-lg" title="Italic"><Italic size={16} /></button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => executeCommand("underline")}             className="p-1.5 text-slate-700 hover:bg-slate-200 rounded-lg" title="Underline"><Underline size={16} /></button>
        <div className="w-px h-6 bg-slate-300 mx-1" />
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => executeCommand("insertUnorderedList")}   className="p-1.5 text-slate-700 hover:bg-slate-200 rounded-lg" title="Bullet List"><List size={16} /></button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => executeCommand("insertOrderedList")}     className="p-1.5 text-slate-700 hover:bg-slate-200 rounded-lg" title="Number List"><ListOrdered size={16} /></button>
        <div className="w-px h-6 bg-slate-300 mx-1" />
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => executeCommand("justifyLeft")}           className="p-1.5 text-slate-700 hover:bg-slate-200 rounded-lg" title="Align Left"><AlignLeft size={16} /></button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => executeCommand("justifyCenter")}         className="p-1.5 text-slate-700 hover:bg-slate-200 rounded-lg" title="Align Center"><AlignCenter size={16} /></button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => executeCommand("justifyRight")}          className="p-1.5 text-slate-700 hover:bg-slate-200 rounded-lg" title="Align Right"><AlignRight size={16} /></button>
        <div className="w-px h-6 bg-slate-300 mx-1" />
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={handleAddImage}
          className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg flex items-center gap-1 text-sm font-semibold" title="Insert Image">
          <ImageIcon size={16} /> Add Image
        </button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        className="w-full p-4 min-h-[200px] outline-none text-slate-700 [&_ul]:list-disc [&_ul]:ml-6 [&_ol]:list-decimal [&_ol]:ml-6 [&_li]:my-1"
        style={{ whiteSpace: "pre-wrap" }}
      />
    </div>
  );
};

export default SimpleRichTextEditor;
