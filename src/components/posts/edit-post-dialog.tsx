import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useMutation } from '@apollo/client';
import { GET_CLASSROOM_POSTS, GET_POST_REPLIES, UPDATE_POST } from '@/lib/graphql/posts';
import RichTextEditor from '@/components/ui/rich-text-editor';
import { usePathname } from 'next/navigation';

interface EditPostDialogProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
  parentId?: string;
  isReply?: boolean;
  initialTitle?: string;
  initialContent: string;
  onEditComplete?: () => void;
}

export function EditPostDialog({
  isOpen,
  onClose,
  postId,
  parentId,
  isReply = false,
  initialTitle,
  initialContent,
  onEditComplete,
}: EditPostDialogProps) {
  const [title, setTitle] = useState(initialTitle || '');
  const [content, setContent] = useState(initialContent);
  const pathname = usePathname();

  // Check if we"re on the comments page
  const isCommentsPage = pathname?.includes('/comments');

  // Determine if this is a main post (has title and no parent, and not on comments page)
  const isMainPost = !parentId && !isReply && !isCommentsPage;

  const [updatePost, { loading }] = useMutation(UPDATE_POST, {
    onCompleted: () => {
      onEditComplete?.();
    },
    refetchQueries: [
      ...(isReply && parentId
        ? [
            {
              query: GET_POST_REPLIES,
              variables: {
                postId: parentId,
              },
            },
          ]
        : []),
      {
        query: GET_CLASSROOM_POSTS,
        variables: {
          parentId: parentId || '',
          pagination: { pageSize: 10, pageToken: '' },
        },
      },
    ],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    try {
      await updatePost({
        variables: {
          input: {
            id: postId,
            content: content,
            title: initialTitle !== undefined ? title.trim() : undefined,
          },
        },
      });
      onClose();
    } catch (error) {
      console.error('Error updating post:', error);
    }
  };

  // Get the appropriate dialog title
  const getDialogTitle = () => {
    if (isMainPost) return 'Edit Post';
    if (isReply) return 'Edit Reply';
    return 'Edit Comment';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md dialog-content">
        <DialogHeader>
          <DialogTitle>{getDialogTitle()}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {initialTitle !== undefined && (
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Post title..."
              className="w-full p-2 border rounded"
            />
          )}

          {isMainPost ? (
            // Use Rich Text Editor only for main posts
            <div className="min-h-[150px] border rounded">
              <RichTextEditor
                value={content}
                onChange={setContent}
                placeholder="Write your post..."
              />
            </div>
          ) : (
            // Use regular textarea for comments and replies
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={isReply ? 'Write your reply...' : 'Write your comment...'}
              className="min-h-[100px] resize-none"
            />
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !content.trim()}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
