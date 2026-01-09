import { KeyboardEvent, useState } from 'react';
import { useMutation } from '@apollo/client';
import { CREATE_POST, GET_CLASSROOM_POSTS } from '@/lib/graphql/posts';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { PostParentType } from '@/types/post';

interface PostInputProps {
  parentId: string;
  parentType: PostParentType;
  onPostSuccess?: () => void;
}

export function PostInput({ parentId, parentType, onPostSuccess }: PostInputProps) {
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');

  const [createPost, { loading }] = useMutation(CREATE_POST, {
    refetchQueries: [
      {
        query: GET_CLASSROOM_POSTS,
        variables: { parentId, parentType, limit: 10 },
      },
    ],
  });

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!content.trim()) {
      return;
    }

    try {
      await createPost({
        variables: {
          input: {
            title:
              parentType === PostParentType.SUBJECT_CLASSROOM
                ? title.trim()
                : parentType === PostParentType.COMMENT
                  ? 'Reply'
                  : 'Comment',
            content: content.trim().replace(/\n/g, '<br>'),
            parentID: parentId,
            parentType: parentType === PostParentType.COMMENT ? PostParentType.POST : parentType,
            userId: '',
          },
        },
      });
      setContent('');
      setTitle('');
      onPostSuccess?.();
    } catch (error) {
      console.error('Error creating post:', error);
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Allow both comments and replies to use Enter to submit
    if (e.key === 'Enter' && !e.shiftKey && parentType !== PostParentType.SUBJECT_CLASSROOM) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Auto-resize textarea as content grows
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;
    setContent(textarea.value);

    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = 'auto';
    // Set new height based on scrollHeight
    textarea.style.height = `${textarea.scrollHeight}px`;
  };

  return (
    <form onSubmit={handleSubmit}>
      {parentType === PostParentType.SUBJECT_CLASSROOM ? (
        // Regular post input with title and content
        <>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Post title..."
            className="w-full p-2 border rounded"
            required
          />
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write a post..."
            className="min-h-[100px] mt-4"
          />
          <Button
            type="submit"
            disabled={loading || !content.trim() || !title.trim()}
            className="mt-4"
          >
            {loading ? 'Posting...' : 'Add Post'}
          </Button>
        </>
      ) : (
        // Enhanced textarea for comments and replies
        <Textarea
          value={content}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyPress}
          placeholder={
            parentType === PostParentType.COMMENT ? 'Write a reply...' : 'Write a comment...'
          }
          className="w-full resize-none border-0 focus:ring-0 min-h-[40px] text-sm bg-neutral-50 rounded-full px-4 py-2 overflow-hidden"
          rows={1}
          style={{ height: 'auto' }}
        />
      )}
    </form>
  );
}
