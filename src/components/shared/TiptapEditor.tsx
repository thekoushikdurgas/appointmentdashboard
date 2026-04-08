"use client";

import { cn } from "@/lib/utils";
import { useCSSVars } from "@/hooks/useCSSVars";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Link2,
  Image as ImageIcon,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
} from "lucide-react";

interface TiptapEditorProps {
  content?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
}

interface ToolbarButtonProps {
  onClick: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
  disabled?: boolean;
}

function ToolbarButton({
  onClick,
  active,
  title,
  children,
  disabled,
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={cn(
        "c360-tiptap-toolbar-btn",
        active && "c360-tiptap-toolbar-btn--active",
      )}
    >
      {children}
    </button>
  );
}

export function TiptapEditor({
  content = "",
  onChange,
  placeholder = "Write your content here...",
  minHeight = 280,
}: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit, Link.configure({ openOnClick: false }), Image],
    content,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "c360-tiptap__prose",
      },
    },
  });

  const editorWrapRef = useCSSVars<HTMLDivElement>({
    "--c360-tiptap-min-h": `${minHeight}px`,
  });

  if (!editor) return null;

  const setLink = () => {
    const url = prompt("Enter URL:");
    if (url) editor.chain().focus().setLink({ href: url }).run();
  };

  const addImage = () => {
    const url = prompt("Enter image URL:");
    if (url) editor.chain().focus().setImage({ src: url }).run();
  };

  const TOOLBAR_GROUPS = [
    [
      {
        icon: <Bold size={13} />,
        title: "Bold",
        action: () => editor.chain().focus().toggleBold().run(),
        active: editor.isActive("bold"),
      },
      {
        icon: <Italic size={13} />,
        title: "Italic",
        action: () => editor.chain().focus().toggleItalic().run(),
        active: editor.isActive("italic"),
      },
      {
        icon: <Strikethrough size={13} />,
        title: "Strike",
        action: () => editor.chain().focus().toggleStrike().run(),
        active: editor.isActive("strike"),
      },
      {
        icon: <Code size={13} />,
        title: "Code",
        action: () => editor.chain().focus().toggleCode().run(),
        active: editor.isActive("code"),
      },
    ],
    [
      {
        icon: <List size={13} />,
        title: "Bullet list",
        action: () => editor.chain().focus().toggleBulletList().run(),
        active: editor.isActive("bulletList"),
      },
      {
        icon: <ListOrdered size={13} />,
        title: "Ordered list",
        action: () => editor.chain().focus().toggleOrderedList().run(),
        active: editor.isActive("orderedList"),
      },
      {
        icon: <Quote size={13} />,
        title: "Blockquote",
        action: () => editor.chain().focus().toggleBlockquote().run(),
        active: editor.isActive("blockquote"),
      },
    ],
    [
      {
        icon: <Link2 size={13} />,
        title: "Link",
        action: setLink,
        active: editor.isActive("link"),
      },
      {
        icon: <ImageIcon size={13} />,
        title: "Image",
        action: addImage,
        active: false,
      },
    ],
    [
      {
        icon: <Undo size={13} />,
        title: "Undo",
        action: () => editor.chain().focus().undo().run(),
        active: false,
        disabled: !editor.can().undo(),
      },
      {
        icon: <Redo size={13} />,
        title: "Redo",
        action: () => editor.chain().focus().redo().run(),
        active: false,
        disabled: !editor.can().redo(),
      },
    ],
  ];

  return (
    <div className="c360-tiptap">
      {/* Toolbar */}
      <div className="c360-tiptap__toolbar">
        {TOOLBAR_GROUPS.map((group, gi) => (
          <div
            key={gi}
            className={cn(
              "c360-tiptap__toolbar-group",
              gi < TOOLBAR_GROUPS.length - 1 &&
                "c360-tiptap__toolbar-group--sep",
            )}
          >
            {group.map((btn) => (
              <ToolbarButton
                key={btn.title}
                onClick={btn.action}
                active={btn.active}
                title={btn.title}
                disabled={"disabled" in btn ? btn.disabled : false}
              >
                {btn.icon}
              </ToolbarButton>
            ))}
          </div>
        ))}
        {/* Heading select */}
        <select
          className="c360-tiptap__heading-select"
          onChange={(e) => {
            const v = Number(e.target.value);
            if (v === 0) editor.chain().focus().setParagraph().run();
            else
              editor
                .chain()
                .focus()
                .toggleHeading({ level: v as 1 | 2 | 3 })
                .run();
          }}
        >
          <option value={0}>Paragraph</option>
          <option value={1}>Heading 1</option>
          <option value={2}>Heading 2</option>
          <option value={3}>Heading 3</option>
        </select>
      </div>

      {/* Editor area */}
      <div
        ref={editorWrapRef}
        className="c360-tiptap__editor-wrap"
        onClick={() => editor.commands.focus()}
      >
        {editor.isEmpty && (
          <div className="c360-tiptap__placeholder">{placeholder}</div>
        )}
        <EditorContent editor={editor} />
      </div>

      {/* Word count */}
      <div className="c360-tiptap__footer">
        {editor.storage.characterCount?.characters?.() ??
          editor.getText().length}{" "}
        chars
      </div>
    </div>
  );
}
