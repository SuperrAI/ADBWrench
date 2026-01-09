'use client';

import { Avatar } from '@/components/ui/dicebear-avatar';
import { Card, CardContent } from '@/components/ui/card';
import { AnimatePresence, motion } from 'framer-motion';
import { ApolloError } from '@apollo/client';
import { ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { formatDistanceToNowStrict } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Check, ChevronDown, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export interface ListItem {
  id: string;
  title?: string;
  content?: string;
  createdAt?: string | Date;
  user?: {
    id?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    avatar?: string;
  };

  [key: string]: any; // Allow for additional properties
}

export interface ListFilter {
  id: string;
  label: string;
  value: string;
}

interface ListProps<T extends ListItem> {
  // Core data
  items: T[];
  hasNextPage?: boolean;
  isLoading?: boolean;
  error?: ApolloError | Error;

  // Event handlers
  onLoadMore?: () => void;
  onItemUpdated?: () => void;
  onFilterChange?: (filter: string) => void;
  onSearchChange?: (searchTerm: string) => void;
  onItemClick?: (item: T, e: React.MouseEvent) => void;

  // Customization
  renderItem?: (item: T) => ReactNode;
  renderHeader?: () => ReactNode;
  renderEmpty?: () => ReactNode;
  renderLoading?: () => ReactNode;
  renderOptionsMenu?: (item: T, onEdit: () => void, onDelete: () => void) => ReactNode;

  // Configuration
  filters?: ListFilter[];
  defaultFilter?: string;
  showSearch?: boolean;
  showFilters?: boolean;
  searchPlaceholder?: string;
  isCompact?: boolean;
  emptyStateMessage?: string;
  loadingMessage?: string;
  avatarColors?: string[];
  className?: string;
  itemClassName?: string;
  headerClassName?: string;
  contentClassName?: string;

  // Layout options
  autoHeight?: boolean;
  minHeight?: number;
  maxHeight?: number;
}

export function List<T extends ListItem>({
  // Core data
  items,
  hasNextPage = false,
  isLoading = false,
  error,

  // Event handlers
  onLoadMore,
  onItemUpdated,
  onFilterChange,
  onSearchChange,
  onItemClick,

  // Customization
  renderItem,
  renderHeader,
  renderEmpty,
  renderLoading,
  renderOptionsMenu,

  // Configuration
  filters = [
    { id: 'all', label: 'All Items', value: 'all' },
    { id: 'my-items', label: 'My Items', value: 'my-items' },
    { id: 'bookmarked', label: 'Bookmarked', value: 'bookmarked' },
  ],
  defaultFilter = 'all',
  showSearch = true,
  showFilters = true,
  searchPlaceholder = 'Search items...',
  isCompact = false,
  emptyStateMessage = 'No items to display',
  loadingMessage = 'Loading items...',
  avatarColors = ['#FF6F1E', '#EBEBEB'],
  className = '',
  itemClassName = '',
  headerClassName = '',
  contentClassName = '',

  // Layout options
  autoHeight = true,
  minHeight = 300,
  maxHeight,
}: ListProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState<number | null>(null);
  const [currentFilter, setCurrentFilter] = useState(defaultFilter);

  // Update container height on mount and window resize
  useEffect(() => {
    if (!autoHeight) return;

    const updateHeight = () => {
      if (!containerRef.current) return;

      // Calculate height to extend to bottom of viewport
      const topOffset = containerRef.current.getBoundingClientRect().top || 80;
      const maxAvailableHeight = window.innerHeight - topOffset;

      // Apply min/max constraints
      let newHeight = Math.max(minHeight, maxAvailableHeight);
      if (maxHeight) {
        newHeight = Math.min(newHeight, maxHeight);
      }

      setContainerHeight(newHeight);
    };

    // Initialize height
    updateHeight();

    // Update height on resize
    window.addEventListener('resize', updateHeight);

    return () => {
      window.removeEventListener('resize', updateHeight);
    };
  }, [autoHeight, minHeight, maxHeight]);

  const handleItemEdit = useCallback(() => {
    onItemUpdated?.();
  }, [onItemUpdated]);

  const handleItemDelete = useCallback(() => {
    onItemUpdated?.();
  }, [onItemUpdated]);

  const handleItemClick = (e: React.MouseEvent, item: T) => {
    if (onItemClick) {
      e.preventDefault();
      e.stopPropagation();
      onItemClick(item, e);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    onSearchChange?.(value);
  };

  // Format timestamp to show simplified format like "3h"
  const formatTimestamp = (date: Date | string | undefined): string => {
    if (!date) return '';

    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const distanceString = formatDistanceToNowStrict(dateObj, { addSuffix: false });

    // Extract the number and unit from strings like "3 hours", "1 day", etc.
    const match = distanceString.match(/^(\d+)\s+(\w+)/);
    if (!match) return distanceString;

    const [_, value, unit] = match;

    // Get the first letter of the unit (h for hour, d for day, etc.)
    let shortUnit = unit.charAt(0);

    // Special case for months (use 'mo' instead of 'm' to avoid confusion with minutes)
    if (unit.startsWith('month')) {
      shortUnit = 'mo';
    }

    // Special case for minutes (use 'm' instead of 'i')
    if (unit.startsWith('minute')) {
      shortUnit = 'm';
    }

    return `${value}${shortUnit}`;
  };

  const handleFilterChange = (value: string) => {
    setCurrentFilter(value);
    onFilterChange?.(value);
  };

  const getFilterLabel = (value: string): string => {
    const filter = filters.find((f) => f.value === value);
    return filter ? filter.label : 'All Items';
  };

  // Default rendering of a list item
  const defaultRenderItem = (item: T) => (
    <Card
      className={`border-none bg-transparent shadow-none cursor-pointer group rounded-none hover:bg-neutral-50 ${isCompact ? 'mb-2' : 'border-b border-neutral-100'} m-0 ${itemClassName}`}
      onClick={(e) => !isCompact && handleItemClick(e, item)}
      id={`item-${item.id}`}
    >
      <CardContent className={`flex items-center py-4 px-4`}>
        <div className="flex items-center gap-4 w-full">
          <div className="relative w-12 h-12 flex-shrink-0">
            <div className="relative">
              <Avatar
                size={48}
                name={`${item.user?.firstName ?? ''} ${item.user?.lastName ?? ''}`}
                variant="beam"
                colors={avatarColors}
                className="rounded-full border border-neutral-200 transition-colors"
              />
            </div>
          </div>
          <div className="min-w-0 flex-1 overflow-hidden">
            <div className="flex items-center">
              <span className="font-medium text-black text-base truncate">
                {item.title || 'Untitled Item'}
              </span>
              {item.createdAt && (
                <span className="text-sm text-neutral-500 ml-2 whitespace-nowrap">
                  {formatTimestamp(item.createdAt)}
                </span>
              )}
            </div>

            {item.content && (
              <div className="text-base text-neutral-500 truncate mt-1 pr-2">
                {item.user && (
                  <span className="mr-1">
                    {item.user.firstName} {item.user.lastName}:
                  </span>
                )}
                <span
                  dangerouslySetInnerHTML={{
                    __html: item.content.replace(/<[^>]*>/g, ' '),
                  }}
                />
              </div>
            )}
          </div>
          {renderOptionsMenu && (
            <div
              className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
              id={`menu-container-${item.id}`}
            >
              {renderOptionsMenu(item, handleItemEdit, handleItemDelete)}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  // Default header rendering
  const defaultRenderHeader = () => (
    <div
      className={`sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b border-neutral-200 flex-shrink-0 bg-white ${headerClassName}`}
    >
      {showSearch && (
        <div className="flex items-center flex-grow">
          <Search
            className={`h-6 w-6 ${searchTerm ? 'text-black' : 'text-neutral-400'} ml-1 mr-2 transition-colors duration-200 ease-in-out transform`}
          />
          <Input
            type="text"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={handleSearchChange}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            className="border-none shadow-none focus-visible:ring-0 focus-visible:border-none bg-transparent rounded-none p-0 pl-1 h-9 placeholder:text-neutral-400 text-[16px]"
          />
        </div>
      )}

      {showFilters && filters.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="px-3 h-9 bg-transparent w-fit flex gap-1.5 font-medium text-sm text-neutral-500 focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus:ring-0 focus-visible:ring-offset-0 focus:ring-offset-0 focus:shadow-none focus-visible:shadow-none select-none border-0 rounded-full hover:bg-neutral-100 hover:text-neutral-500 data-[state=open]:bg-neutral-100 data-[state=open]:rounded-full data-[state=open]:text-neutral-500"
            >
              {getFilterLabel(currentFilter)}
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[220px] p-2 shadow-md rounded-2xl">
            {filters.map((filter) => (
              <DropdownMenuItem
                key={filter.id}
                onClick={() => handleFilterChange(filter.value)}
                className="gap-2 font-medium rounded-xl hover:bg-neutral-100 text-base py-3 px-3"
              >
                {filter.label}
                {currentFilter === filter.value && (
                  <span className="ml-auto">
                    <Check className="h-5 w-5" />
                  </span>
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );

  // Default empty state rendering
  const defaultRenderEmpty = () => (
    <div className="flex-grow min-h-[200px] flex items-center justify-center text-neutral-500 m-0 p-0">
      <div className="flex flex-col items-center">
        <p className="text-lg mb-1">{emptyStateMessage}</p>
        <p className="text-sm text-neutral-400">Be the first to add content</p>
      </div>
    </div>
  );

  // Default loading state rendering
  const defaultRenderLoading = () => (
    <div className="flex-grow min-h-[calc(100vh-350px)] flex items-center justify-center text-neutral-500 m-0 p-0">
      <div className="flex flex-col items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mb-2"></div>
        <p>{loadingMessage}</p>
      </div>
    </div>
  );

  return (
    <div
      ref={containerRef}
      style={{
        height: containerHeight ? `${containerHeight}px` : 'auto',
        marginBottom: '0',
      }}
      className={`${!isCompact ? 'mt-4 bg-white rounded-t-3xl rounded-b-none border border-neutral-200 shadow-sm' : ''} flex flex-col overflow-hidden m-0 p-0 ${className}`}
    >
      {!isCompact && (renderHeader ? renderHeader() : defaultRenderHeader())}

      <div
        className={`flex-grow overflow-y-auto scroll-smooth scrollbar-thin scrollbar-thumb-neutral-300 scrollbar-track-transparent p-0 m-0 ${contentClassName}`}
      >
        {isLoading ? (
          renderLoading ? (
            renderLoading()
          ) : (
            defaultRenderLoading()
          )
        ) : items.length === 0 ? (
          renderEmpty ? (
            renderEmpty()
          ) : (
            defaultRenderEmpty()
          )
        ) : (
          <>
            <motion.div layout className={`${isCompact ? '' : 'space-y-1'} p-0 m-0`}>
              <AnimatePresence mode="popLayout">
                {items.map((item) => (
                  <motion.div
                    layout
                    key={item.id}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className="m-0 p-0"
                  >
                    {renderItem ? renderItem(item) : defaultRenderItem(item)}
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>

            {hasNextPage && onLoadMore && (
              <div className="flex justify-center py-2 m-0">
                <button
                  onClick={onLoadMore}
                  className="text-base text-orange-500 font-medium hover:text-orange-600 transition-colors"
                >
                  Load more
                </button>
              </div>
            )}

            {/* Add padding at the bottom of the list for better UX */}
            <div className="h-8"></div>
          </>
        )}
      </div>
    </div>
  );
}
