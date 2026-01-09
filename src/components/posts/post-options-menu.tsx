import { useState } from 'react';
import { MoreHorizontal, Pencil, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EditPostDialog } from './edit-post-dialog';
import { useMutation } from '@apollo/client';
import { DELETE_POST } from '@/lib/graphql/posts';

interface PostOptionsMenuProps {
  className?: string;
  postId: string;
  parentId?: string;
  isReply?: boolean;
  title?: string;
  content: string;
  onEdit?: () => void;
  onDelete?: () => void;
  setMenuOpenState?: (open: boolean) => void;
}

export function PostOptionsMenu({
  className,
  postId,
  parentId,
  isReply = false,
  title,
  content,
  onEdit,
  onDelete,
  setMenuOpenState,
}: PostOptionsMenuProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const [deletePost, { loading: deleteLoading }] = useMutation(DELETE_POST, {
    onCompleted: () => {
      onDelete?.();
    },
  });

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await deletePost({
          variables: {
            id: postId,
          },
        });
      } catch (error) {
        console.error('Error deleting post:', error);
      }
    }
  };

  const handleEditComplete = () => {
    setIsEditDialogOpen(false);
    onEdit?.();
  };

  return (
    <>
      <DropdownMenu
        onOpenChange={(open) => {
          setMenuOpenState?.(open);

          // Remove focus when menu closes to prevent focus rings
          if (!open) {
            // Use setTimeout to ensure this happens after the close animation
            setTimeout(() => {
              // Find active element and blur it
              const activeElement = document.activeElement as HTMLElement;
              if (activeElement && activeElement.blur) {
                activeElement.blur();
              }
            }, 100);
          }
        }}
      >
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={`rounded-full hover:bg-neutral-100 hover:text-neutral-500 data-[state=open]:bg-neutral-100 data-[state=open]:rounded-full data-[state=open]:text-neutral-500 data-[state=open]:opacity-100 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none focus:outline-none ${className}`}
          >
            <MoreHorizontal className="h-5 w-5" />
            <span className="sr-only">More options</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[200px] p-2 rounded-2xl">
          <DropdownMenuItem
            onClick={() => setIsEditDialogOpen(true)}
            className="gap-2 font-medium rounded-xl hover:bg-neutral-100 text-base py-3 px-3"
          >
            <div className="flex items-center w-full justify-between">
              <span>Edit</span>
              <Pencil className="h-5 w-5" />
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleDelete}
            disabled={deleteLoading}
            className="gap-2 font-medium rounded-xl hover:bg-neutral-100 text-base py-3 px-3 text-red-500 hover:text-red-600"
          >
            <div className="flex items-center w-full justify-between">
              <span>Delete</span>
              <Trash className="h-5 w-5" />
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditPostDialog
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        postId={postId}
        parentId={parentId}
        isReply={isReply}
        initialTitle={title}
        initialContent={content}
        onEditComplete={handleEditComplete}
      />
    </>
  );
}
