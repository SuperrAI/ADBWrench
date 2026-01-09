import { Post, PostParentType } from '@/types/post';
import { ApolloError } from '@apollo/client';
import React, { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PostOptionsMenu } from './post-options-menu';
import { List, ListFilter } from '@/components/ui/list';

interface PostListProps {
  posts: Post[];
  hasNextPage: boolean;
  isLoading: boolean;
  error?: ApolloError;
  onLoadMore: () => void;
  onPostUpdated?: () => void;
  onFilterChange?: (filter: string) => void;
  onDateFilterChange?: (dateRange: string) => void;
  isCommentList?: boolean;
  parentType?: PostParentType;
  showSearch?: boolean;
}

export function PostList({
  posts,
  hasNextPage,
  isLoading,
  error,
  onLoadMore,
  onPostUpdated,
  onFilterChange,
  onDateFilterChange,
  isCommentList = false,
  parentType = PostParentType.SUBJECT_CLASSROOM,
  showSearch = true,
}: PostListProps) {
  const router = useRouter();
  const [currentFilter, setCurrentFilter] = useState('all');

  const handlePostEdit = useCallback(() => {
    onPostUpdated?.();
  }, [onPostUpdated]);

  const handlePostDelete = useCallback(() => {
    onPostUpdated?.();
  }, [onPostUpdated]);

  const handleCommentClick = (post: Post, e: React.MouseEvent) => {
    // Check if the click originated from the options menu container
    const target = e.target as HTMLElement;
    const menuContainer = document.getElementById(`menu-container-${post.id}`);

    // If the click is inside the menu container or its children, don't navigate
    if (menuContainer && (menuContainer === target || menuContainer.contains(target))) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();
    router.push(`/post/${post.id}`);
  };

  const renderPostOptionsMenu = (post: Post, onEdit: () => void, onDelete: () => void) => (
    <PostOptionsMenu
      className="h-8 w-8 rounded-full text-neutral-600 hover:bg-neutral-100"
      postId={post.id}
      title={post.title}
      content={post.content}
      onEdit={onEdit}
      onDelete={onDelete}
      setMenuOpenState={(open: boolean) => {
        const menuContainer = document.getElementById(`menu-container-${post.id}`);
        if (menuContainer) {
          if (open) {
            menuContainer.style.opacity = '1';
          } else {
            menuContainer.style.opacity = '';
          }
        }
      }}
    />
  );

  // Define filters based on the post list requirements
  const postFilters: ListFilter[] = [
    { id: 'all', label: 'All Posts', value: 'all' },
    { id: 'my-posts', label: 'Announcements', value: 'my-posts' },
    { id: 'bookmarked', label: 'Bookmarked', value: 'bookmarked' },
  ];

  return (
    <div className="post-list-container">
      {showSearch && <div className="search-container">{/* Search bar implementation */}</div>}

      <List
        items={posts}
        hasNextPage={hasNextPage}
        isLoading={isLoading}
        error={error}
        onLoadMore={onLoadMore}
        onItemUpdated={onPostUpdated}
        onFilterChange={onFilterChange}
        onItemClick={handleCommentClick}
        renderOptionsMenu={renderPostOptionsMenu}
        filters={postFilters}
        defaultFilter="all"
        showSearch={showSearch}
        showFilters={!isCommentList}
        searchPlaceholder="Search posts..."
        isCompact={isCommentList}
        emptyStateMessage="No posts to display"
        loadingMessage="Loading posts..."
        avatarColors={['#FF6F1E', '#EBEBEB']}
        className=""
        autoHeight={true}
      />
    </div>
  );
}
