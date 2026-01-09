import React, { ComponentProps, forwardRef, ReactNode, useEffect, useState, useId } from 'react';
import {
  File,
  FileAudio,
  FileImage,
  FileText,
  FileVideo,
  Search as SearchIcon,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { textStyles } from '@/design-system/foundations/typography';

export interface SearchFileType {
  extension: string;
  label: string;
  icon?: ReactNode;
}

/**
 * Defines the layout style of the search component
 */
export type SearchLayoutType = 'card' | 'list' | 'borderBottom' | 'default';

export interface SearchProps extends Omit<ComponentProps<'div'>, 'onChange'> {
  /**
   * Current search value
   */
  value: string;

  /**
   * Function called when search value changes
   */
  onChange: (value: string) => void;

  /**
   * Function called when search is cleared
   */
  onClear?: () => void;

  /**
   * Placeholder text for the search input
   */
  placeholder?: string;

  /**
   * Custom icon to show in search field
   */
  searchIcon?: ReactNode;

  /**
   * Custom icon to show for clearing search
   */
  clearIcon?: ReactNode;

  /**
   * Variant of the search component
   * - 'default': Standard search with border
   * - 'minimal': No border, transparent background
   * - 'borderBottom': Only border at bottom
   * - 'contained': Search with background
   */
  variant?: 'default' | 'minimal' | 'borderBottom' | 'contained';

  /**
   * Layout style that matches specific page layouts
   * - 'card': For card/grid layouts like in files page
   * - 'list': For list layouts like in homework page
   * - 'borderBottom': Simple border bottom style
   * - 'default': Standard layout
   */
  layoutType?: SearchLayoutType;

  /**
   * Whether to show the clear button
   */
  showClearButton?: boolean;

  /**
   * Additional class name for the input
   */
  inputClassName?: string;

  /**
   * Input size
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * Additional styles for the search container
   */
  containerStyle?: React.CSSProperties;

  /**
   * Whether to auto-focus the search input
   */
  autoFocus?: boolean;

  /**
   * Content to display below the search (typically search results)
   */
  children?: ReactNode;

  /**
   * Debounce duration in milliseconds for search input
   */
  debounce?: number;

  /**
   * HTML ID attribute for the component (useful for testing, accessibility and targeting)
   */
  id?: string;

  /**
   * Type of content being searched (e.g., 'files', 'assignments', 'classes')
   * Used for aria-label and can affect the rendering
   */
  contentType?: string;

  /**
   * Optional searchable file types for files search
   * Enabling this adds file type filter options
   */
  fileTypes?: SearchFileType[];

  /**
   * Active file type filter
   */
  activeFileType?: string | null;

  /**
   * Handler for when file type filter changes
   */
  onFileTypeChange?: (fileType: string | null) => void;

  /**
   * Optional classifier for the component
   * Adds a data-component attribute with the provided value
   */
  componentClass?: string;

  /**
   * Whether this search is inside a list container
   * Affects styling for sticky positioning
   */
  insideListContainer?: boolean;
}

/**
 * Default file types that can be used with the search component
 */
export const defaultFileTypes: SearchFileType[] = [
  { extension: 'pdf', label: 'PDF', icon: <FileText className="h-4 w-4 text-red-500" /> },
  { extension: 'doc', label: 'Word', icon: <FileText className="h-4 w-4 text-blue-500" /> },
  { extension: 'xls', label: 'Excel', icon: <FileText className="h-4 w-4 text-green-500" /> },
  { extension: 'ppt', label: 'PowerPoint', icon: <FileText className="h-4 w-4 text-orange-500" /> },
  { extension: 'img', label: 'Images', icon: <FileImage className="h-4 w-4 text-purple-500" /> },
  { extension: 'vid', label: 'Videos', icon: <FileVideo className="h-4 w-4 text-blue-400" /> },
  { extension: 'aud', label: 'Audio', icon: <FileAudio className="h-4 w-4 text-yellow-500" /> },
  { extension: 'other', label: 'Other', icon: <File className="h-4 w-4 text-neutral-500" /> },
];

/**
 * Search component for the SuperrLMS design system.
 * A versatile search component that can be used in various layouts and contexts.
 */
const Search = forwardRef<HTMLDivElement, SearchProps>(
  (
    {
      value,
      onChange,
      onClear,
      placeholder = 'Search...',
      searchIcon,
      clearIcon,
      variant = 'default',
      layoutType = 'default',
      showClearButton = true,
      inputClassName,
      size = 'md',
      containerStyle,
      autoFocus = false,
      children,
      className,
      debounce = 0,
      id,
      contentType,
      fileTypes,
      activeFileType,
      onFileTypeChange,
      componentClass,
      insideListContainer = false,
      ...props
    },
    ref
  ) => {
    const [inputValue, setInputValue] = useState(value);
    const [showFileTypeFilters, setShowFileTypeFilters] = useState(false);
    const generatedId = useId();
    const componentId = id || `search-${generatedId}`;

    // Handle debounced search
    useEffect(() => {
      if (debounce <= 0) {
        onChange(inputValue);
        return;
      }

      const handler = setTimeout(() => {
        onChange(inputValue);
      }, debounce);

      return () => {
        clearTimeout(handler);
      };
    }, [inputValue, onChange, debounce]);

    // Update local state when value prop changes externally
    useEffect(() => {
      setInputValue(value);
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setInputValue(e.target.value);
    };

    const handleClear = () => {
      setInputValue('');
      if (onClear) {
        onClear();
      } else {
        onChange('');
      }
    };

    const handleFileTypeClick = (fileType: string) => {
      if (onFileTypeChange) {
        if (activeFileType === fileType) {
          onFileTypeChange(null);
        } else {
          onFileTypeChange(fileType);
        }
      }
      setShowFileTypeFilters(false);
    };

    // Determine size-specific styles
    const getSizeStyles = () => {
      switch (size) {
        case 'sm':
          return {
            inputHeight: 'h-8',
            iconSize: 'h-4 w-4',
            padding: 'py-1 px-2',
          };
        case 'lg':
          return {
            inputHeight: 'h-12',
            iconSize: 'h-6 w-6',
            padding: 'py-3 px-4',
          };
        case 'md':
        default:
          return {
            inputHeight: 'h-9',
            iconSize: 'h-5 w-5',
            padding: 'py-2 px-3',
          };
      }
    };

    // Determine variant-specific styles
    const getVariantStyles = () => {
      switch (variant) {
        case 'minimal':
          return 'border-none shadow-none bg-transparent';
        case 'borderBottom':
          return 'border-t-0 border-l-0 border-r-0 border-b border-neutral-200 rounded-none shadow-none bg-transparent';
        case 'contained':
          return 'border border-neutral-200 bg-neutral-50 shadow-none';
        case 'default':
        default:
          return 'border border-neutral-200';
      }
    };

    // Get layout-specific styles
    const getLayoutStyles = () => {
      switch (layoutType) {
        case 'card':
          return {
            containerClass: 'border-b border-neutral-200 mb-0 p-3 sm:p-4 rounded-t-[24px]',
            inputContainerClass: 'relative flex items-center gap-3 h-[30px]',
            inputClass:
              'flex-1 pl-6 sm:pl-8 pr-4 bg-transparent placeholder:text-neutral-400 focus:outline-none text-sm sm:text-base',
            iconLeftClass: 'absolute left-0 h-4 w-4 sm:h-5 sm:w-5 text-neutral-400',
            iconRightClass:
              'text-neutral-400 hover:text-neutral-600 transition-colors',
          };
        case 'list':
          return {
            containerClass: cn(
              'sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b border-neutral-200 flex-shrink-0 bg-white rounded-t-[24px]',
              insideListContainer ? 'bg-white' : ''
            ),
            inputContainerClass: 'flex items-center flex-grow',
            inputClass:
              'flex w-full border-none shadow-none focus-visible:ring-0 focus-visible:border-none bg-transparent rounded-[24px] p-0 pl-1 h-9 placeholder:text-neutral-400 text-[16px] leading-[24px]',
            iconLeftClass:
              'h-6 w-6 text-neutral-400 ml-1 mr-2 transition-colors duration-200 ease-in-out transform',
            iconRightClass:
              'items-center justify-center whitespace-nowrap transition-colors focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 px-3 h-9 bg-transparent w-fit flex gap-1.5 font-medium text-sm text-neutral-500 focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus:ring-0 focus-visible:ring-offset-0 focus:ring-offset-0 focus:shadow-none focus-visible:shadow-none select-none border-0 rounded-full hover:bg-neutral-100 hover:text-neutral-500',
          };
        case 'borderBottom':
          return {
            containerClass: 'border-b border-neutral-200 rounded-t-lg',
            inputContainerClass: 'relative flex items-center',
            inputClass: 'w-full bg-transparent focus:outline-none rounded-[24px]',
            iconLeftClass: 'absolute left-3',
            iconRightClass:
              'absolute right-3 text-neutral-400 hover:text-neutral-600 transition-colors',
          };
        case 'default':
        default:
          return {
            containerClass: 'rounded-lg',
            inputContainerClass: 'relative flex items-center w-full',
            inputClass:
              'flex w-full border-none bg-transparent placeholder:text-neutral-500 focus-visible:ring-0 focus-visible:border-none focus-visible:outline-none rounded-[24px]',
            iconLeftClass: 'absolute left-3',
            iconRightClass:
              'text-neutral-400 hover:text-neutral-600 transition-colors focus:outline-none',
          };
      }
    };

    const { inputHeight, iconSize, padding } = getSizeStyles();
    const variantStyles = getVariantStyles();
    const layoutStyles = getLayoutStyles();

    // Generate aria-label based on content type
    const getAriaLabel = () => {
      if (contentType) {
        return `Search ${contentType}`;
      }
      return 'Search';
    };

    // Get file type filter
    const selectedFileType = fileTypes?.find((ft) => ft.extension === activeFileType);

    // For Cards/Files layout
    if (layoutType === 'card') {
      return (
        <div
          ref={ref}
          id={componentId}
          className={cn(layoutStyles.containerClass, className)}
          style={containerStyle}
          data-component={componentClass || 'search'}
          {...props}
        >
          <div className={layoutStyles.inputContainerClass}>
            {searchIcon || (
              <SearchIcon
                className={cn(layoutStyles.iconLeftClass, iconSize, 'text-neutral-500')}
              />
            )}
            <input
              type="text"
              id={`${componentId}-input`}
              value={inputValue}
              onChange={handleChange}
              placeholder={placeholder}
              className={cn(layoutStyles.inputClass, inputClassName)}
              style={textStyles.body1Reg}
              autoFocus={autoFocus}
              aria-label={getAriaLabel()}
            />
            {inputValue && showClearButton && (
              <button
                type="button"
                onClick={handleClear}
                className={layoutStyles.iconRightClass}
                aria-label="Clear search"
              >
                {clearIcon || <X className="h-5 w-4" />}
              </button>
            )}
          </div>

          {/* Children for search results */}
          {children && <div className="mt-1 w-full">{children}</div>}
        </div>
      );
    }

    // For List/Homework layout
    if (layoutType === 'list') {
      return (
        <div
          ref={ref}
          id={componentId}
          className={cn(layoutStyles.containerClass, className)}
          style={containerStyle}
          data-component={componentClass || 'search'}
          {...props}
        >
          <div className={layoutStyles.inputContainerClass}>
            {searchIcon || <SearchIcon className={layoutStyles.iconLeftClass} />}
            <Input
              type="text"
              id={`${componentId}-input`}
              value={inputValue}
              onChange={handleChange}
              placeholder={placeholder}
              className={cn(layoutStyles.inputClass, inputClassName)}
              style={textStyles.body1Reg}
              autoFocus={autoFocus}
              aria-label={getAriaLabel()}
            />
          </div>
          {inputValue && showClearButton && (
            <button
              type="button"
              onClick={handleClear}
              className={layoutStyles.iconRightClass}
              aria-label="Clear search"
            >
              {clearIcon || <X className="h-4 w-4" />}
            </button>
          )}

          {/* Children for search results */}
          {children && <div className="w-full">{children}</div>}
        </div>
      );
    }

    // Default layout
    return (
      <div
        ref={ref}
        id={componentId}
        className={cn('w-full flex flex-col', className)}
        style={containerStyle}
        data-component={componentClass || 'search'}
        {...props}
      >
        <div
          className={cn(layoutStyles.inputContainerClass, variantStyles, {
            'rounded-lg': variant !== 'borderBottom',
            'rounded-t-lg': variant === 'borderBottom',
          })}
        >
          <div className="absolute left-3 flex items-center justify-center">
            {searchIcon || <SearchIcon className={cn(iconSize, 'text-neutral-400')} />}
          </div>

          <Input
            type="text"
            id={`${componentId}-input`}
            value={inputValue}
            onChange={handleChange}
            placeholder={placeholder}
            className={cn(
              inputHeight,
              'flex w-full border-none bg-transparent pl-10 pr-10 placeholder:text-neutral-500',
              'focus-visible:ring-0 focus-visible:border-none focus-visible:outline-none',
              {
                'text-sm': size === 'sm',
                'text-base': size === 'md',
                'text-lg': size === 'lg',
              },
              inputClassName
            )}
            style={textStyles.body1Reg}
            autoFocus={autoFocus}
            aria-label={getAriaLabel()}
          />

          {/* Right side actions */}
          <div className="absolute right-3 flex items-center gap-2">
            {/* File type filter button */}
            {fileTypes && fileTypes.length > 0 && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowFileTypeFilters(!showFileTypeFilters)}
                  className={cn(
                    'text-neutral-400 hover:text-neutral-600 transition-colors focus:outline-none',
                    selectedFileType && 'text-neutral-700'
                  )}
                  aria-label={
                    selectedFileType ? `Filter by ${selectedFileType.label}` : 'Filter by file type'
                  }
                >
                  {selectedFileType?.icon || <File className={iconSize} />}
                </button>

                {/* File type dropdown */}
                {showFileTypeFilters && (
                  <div className="absolute right-0 top-full mt-1 bg-white border border-neutral-200 rounded-md shadow-md z-10 w-40">
                    <div className="p-1">
                      {fileTypes.map((fileType) => (
                        <button
                          key={fileType.extension}
                          type="button"
                          className={cn(
                            'flex items-center gap-2 w-full px-2 py-1.5 text-left text-sm rounded-sm',
                            activeFileType === fileType.extension
                              ? 'bg-neutral-100 text-neutral-900'
                              : 'hover:bg-neutral-50 text-neutral-700'
                          )}
                          onClick={() => handleFileTypeClick(fileType.extension)}
                        >
                          {fileType.icon}
                          <span>{fileType.label}</span>
                        </button>
                      ))}
                      {activeFileType && (
                        <button
                          type="button"
                          className="flex items-center gap-2 w-full px-2 py-1.5 text-left text-sm rounded-sm hover:bg-neutral-50 text-neutral-700 border-t border-neutral-100 mt-1 pt-2"
                          onClick={() => handleFileTypeClick(activeFileType)}
                        >
                          <X className="h-4 w-4" />
                          <span>Clear filter</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Clear button */}
            {inputValue && showClearButton && (
              <button
                type="button"
                onClick={handleClear}
                className="text-neutral-400 hover:text-neutral-600 transition-colors focus:outline-none"
                aria-label="Clear search"
              >
                {clearIcon || <X className={iconSize} />}
              </button>
            )}
          </div>
        </div>

        {/* Active filters display */}
        {activeFileType && (
          <div className="flex items-center gap-2 mt-2">
            <div className="inline-flex items-center gap-1.5 bg-neutral-100 text-neutral-700 px-2 py-1 rounded-full text-xs">
              {selectedFileType?.icon}
              <span>{selectedFileType?.label}</span>
              <button
                type="button"
                onClick={() => onFileTypeChange?.(null)}
                className="text-neutral-500 hover:text-neutral-700"
                aria-label={`Remove ${selectedFileType?.label} filter`}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>
        )}

        {/* Children for search results or additional content */}
        {children && <div className="mt-1 w-full">{children}</div>}
      </div>
    );
  }
);

Search.displayName = 'Search';

export default Search;
