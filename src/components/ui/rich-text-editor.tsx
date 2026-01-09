'use client';

import { BubbleMenu, EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { memo } from 'react';
import { Button } from './button';
import { Bold, Italic, List } from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onKeyDown?: (event: KeyboardEvent) => void;
}

const FloatingMenu = ({ editor }: { editor: any }) => {
  if (!editor) {
    return null;
  }

  return (
    <BubbleMenu
      editor={editor}
      tippyOptions={{
        duration: 100,
        animation: 'fade',
        placement: 'bottom-start',
        offset: [0, 10],
        getReferenceClientRect: () => {
          const selection = window.getSelection();
          if (!selection || selection.rangeCount === 0) {
            return new DOMRect(0, 0, 0, 0);
          }
          const range = selection.getRangeAt(0);
          return range.getBoundingClientRect();
        },
      }}
      className="flex items-center h-[40px] gap-1 p-1 rounded-xl border border-neutral-800 bg-neutral-900"
    >
      <div className="flex items-center gap-1 h-full">
        <Button
          variant="ghost"
          size="sm"
          className={`h-8 w-8 p-0 text-white ${
            editor.isActive('bold')
              ? 'bg-[#FF6F1E] hover:bg-[#FF6F1E] hover:text-white'
              : 'hover:bg-neutral-800 hover:text-white'
          }`}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={`h-8 w-8 p-0 text-white ${
            editor.isActive('italic')
              ? 'bg-[#FF6F1E] hover:bg-[#FF6F1E] hover:text-white'
              : 'hover:bg-neutral-800 hover:text-white'
          }`}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={`h-8 w-8 p-0 text-white ${
            editor.isActive('link')
              ? 'bg-[#FF6F1E] hover:bg-[#FF6F1E] hover:text-white'
              : 'hover:bg-neutral-800 hover:text-white'
          }`}
          onClick={() => {
            const url = window.prompt('URL');
            if (url) {
              editor.chain().focus().setLink({ href: url }).run();
            }
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M3.95825 10.2083H16.0416"
              stroke="white"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M15.2084 6.87508V6.66675C15.2084 5.28604 14.0891 4.16675 12.7084 4.16675H7.29175C5.91104 4.16675 4.79175 5.28604 4.79175 6.66675V7.70841C4.79175 9.08913 5.91104 10.2084 7.29175 10.2084H12.5001"
              stroke="white"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M4.79175 13.1251V13.5417C4.79175 14.9225 5.91104 16.0417 7.29175 16.0417H12.7084C14.0891 16.0417 15.2084 14.9225 15.2084 13.5417V12.2917"
              stroke="white"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </Button>
      </div>
      <div className="h-full flex items-center py-1">
        <svg
          width="1"
          height="38"
          viewBox="0 0 1 38"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="1" height="38" fill="#525252" />
        </svg>
      </div>
      <div className="flex items-center gap-1 h-full">
        <Button
          variant="ghost"
          size="sm"
          className={`h-8 w-8 p-0 text-white ${
            editor.isActive('bulletList')
              ? 'bg-[#FF6F1E] hover:bg-[#FF6F1E] hover:text-white'
              : 'hover:bg-neutral-800 hover:text-white'
          }`}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={`h-8 w-8 p-0 text-white ${
            editor.isActive('orderedList')
              ? 'bg-[#FF6F1E] hover:bg-[#FF6F1E] hover:text-white'
              : 'hover:bg-neutral-800 hover:text-white'
          }`}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M6.0415 7.70841V4.79175L4.7915 5.20841M6.0415 7.70841H4.7915M6.0415 7.70841H6.87484M9.7915 6.45841H15.2082M9.7915 13.5417H15.2082M6.87484 15.2084H4.7915L6.64717 13.5098C6.79223 13.377 6.87484 13.1894 6.87484 12.9927C6.87484 12.6056 6.561 12.2917 6.17387 12.2917H5.20817C4.97805 12.2917 4.7915 12.4783 4.7915 12.7084"
              stroke="white"
              stroke-width="1.2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </Button>
      </div>
    </BubbleMenu>
  );
};

const RichTextEditor = memo(
  ({ value, onChange, placeholder = 'Write something...', onKeyDown }: RichTextEditorProps) => {
    const editor = useEditor({
      extensions: [
        StarterKit.configure({
          heading: {
            levels: [1, 2, 3],
          },
        }),
        Link.configure({
          openOnClick: false,
          HTMLAttributes: {
            class: 'text-blue-500 underline',
          },
        }),
        Placeholder.configure({
          placeholder,
          emptyEditorClass:
            'is-editor-empty before:content-[attr(data-placeholder)] before:text-neutral-400 before:float-left before:pointer-events-none before:h-0',
        }),
      ],
      content: value,
      editorProps: {
        attributes: {
          class: 'prose max-w-none focus:outline-none min-h-[150px] px-1 [&_p]:text-[16px]',
        },
        handleKeyDown: (view, event) => {
          if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
            event.preventDefault();
            if (onKeyDown) {
              onKeyDown(event);
            }
            return true;
          }
          return false;
        },
      },
      onUpdate: ({ editor }) => {
        onChange(editor.getHTML());
      },
    });

    return (
      <div className="rounded-lg bg-white overflow-hidden [&_*::selection]:bg-[#FF6F1E40] [&_*::selection]:text-inherit">
        <FloatingMenu editor={editor} />
        <EditorContent editor={editor} />
        <style jsx global>{`
          .ProseMirror strong {
            font-weight: 600; /* Reduced from default 700 */
          }
        `}</style>
      </div>
    );
  }
);

RichTextEditor.displayName = 'RichTextEditor';

export default RichTextEditor;
