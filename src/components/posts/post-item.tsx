import React from 'react';
import { Avatar } from '@/components/ui/dicebear-avatar';
import { Card } from '@/components/ui/card';
import { format } from 'date-fns';
import { Heart, MessageCircle } from 'lucide-react';
import { Post } from '@/types/post';
import { PostOptionsMenu } from './post-options-menu';

interface PostItemProps {
  post: Post;
  onEdit?: () => void;
  onDelete?: () => void;
  onClick?: (post: Post) => void;
}

export function PostItem({ post, onEdit, onDelete, onClick }: PostItemProps) {
  if (!post) return null;

  const handleClick = () => {
    if (onClick) {
      onClick(post);
    }
  };

  // Safely format the date
  const formattedDate = post.createdAt ? format(new Date(post.createdAt), 'd MMM') : '';

  return (
    <Card className="hover:bg-neutral-50 transition-colors border-none bg-transparent shadow-none cursor-pointer group rounded-none">
      <div className="flex items-start gap-4 p-4" onClick={handleClick}>
        <div className="relative w-12 h-12 flex-shrink-0">
          <Avatar
            size={48}
            name={`${post.user?.firstName || ''} ${post.user?.lastName || ''}`}
            variant="beam"
            colors={['#FF6F1E', '#EBEBEB']}
            className="rounded-full border border-neutral-200"
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-medium">
                {post.user?.firstName} {post.user?.lastName}
              </span>
              <span className="text-neutral-500">{formattedDate}</span>
            </div>
            {post.id && (
              <div className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <PostOptionsMenu
                  className="h-8 w-8 rounded-full text-neutral-500 hover:bg-neutral-200"
                  postId={post.id}
                  title={post.title}
                  content={post.content}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              </div>
            )}
          </div>
          <div className="mt-1">
            {post.title && <div className="font-medium">{post.title}</div>}
            <div
              className="text-neutral-800 mt-1 post-content"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </div>
          <div className="flex items-center gap-1 mt-4">
            <button className="flex items-center justify-center h-8 w-8 rounded-full hover:bg-neutral-200 text-neutral-400 hover:text-neutral-700">
              <MessageCircle className="h-5 w-5" />
              {post.replyCount !== undefined && post.replyCount > 0 && (
                <span className="ml-1 text-sm">{post.replyCount}</span>
              )}
            </button>
            <button className="flex items-center justify-center h-8 w-8 rounded-full hover:bg-neutral-200 text-neutral-400 hover:text-neutral-700">
              <Heart className="h-5 w-5" />
              {post.reactionCount !== undefined && post.reactionCount > 0 && (
                <span className="ml-1 text-sm">{post.reactionCount}</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
}
