'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { CoreColors, Neutral, Orange } from '@/design-system/foundations/colors';
import { textStyles } from '@/design-system/foundations/typography';

interface ChapterItem {
  title: string;
  subtitle: string;
}

interface DropdownSearchBarProps {
  placeholder?: string;
  onSearch?: (value: string) => void;
  recentChapters?: ChapterItem[];
  onSelectChapter?: (chapter: ChapterItem) => void;
  className?: string;
  /**
   * Whether to display with a trigger button that opens the dropdown
   * @default false
   */
  withTriggerButton?: boolean;
  /**
   * The text to display on the trigger button
   * @default "Select a chapter"
   */
  triggerButtonText?: string;
  /**
   * Whether the dropdown is initially open (only used when withTriggerButton is true)
   * @default false
   */
  initiallyOpen?: boolean;
}

export function DropdownSearchBar({
  placeholder = 'Search chapters...',
  onSearch,
  recentChapters = [],
  onSelectChapter,
  className,
  withTriggerButton = false,
  triggerButtonText = 'Select a chapter',
  initiallyOpen = false,
}: DropdownSearchBarProps) {
  // State for dropdown visibility
  const [isOpen, setIsOpen] = React.useState(withTriggerButton ? initiallyOpen : true);
  const [searchValue, setSearchValue] = React.useState('');
  const [hoverIndex, setHoverIndex] = React.useState<number | null>(null);
  const [selectedChapter, setSelectedChapter] = React.useState<ChapterItem | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Function to find matching text in both title and subtitle
  const findMatch = (text: string, search: string): { start: number; end: number } | null => {
    const textLower = text.toLowerCase();
    const searchLower = search.toLowerCase();

    // Check for word starts
    const words = text.split(' ');
    let currentIndex = 0;

    for (const word of words) {
      if (word.toLowerCase().startsWith(searchLower)) {
        return {
          start: currentIndex,
          end: currentIndex + searchLower.length,
        };
      }
      currentIndex += word.length + 1;
    }

    // Check for direct inclusion
    const directIndex = textLower.indexOf(searchLower);
    if (directIndex !== -1) {
      return {
        start: directIndex,
        end: directIndex + searchLower.length,
      };
    }

    return null;
  };

  const highlightMatchingText = (text: string, isSubtitle = false) => {
    if (!searchValue.trim()) {
      return <span style={{ color: isSubtitle ? Neutral.N400 : CoreColors.Black }}>{text}</span>;
    }

    // Check if this is a number search (for chapter numbers)
    const searchIsNumber = /^\d+$/.test(searchValue.toLowerCase());

    // For number searches in subtitles, try to highlight just the number part
    if (isSubtitle && searchIsNumber) {
      const numberMatch = text.match(/(\d+)/);
      if (numberMatch && numberMatch[1] === searchValue) {
        const index = text.indexOf(numberMatch[1]);
        const before = text.substring(0, index);
        const match = numberMatch[1];
        const after = text.substring(index + match.length);

        return (
          <span style={{ color: Neutral.N400 }}>
            {before}
            <span style={{ color: Orange.O500 }}>{match}</span>
            {after}
          </span>
        );
      }
    }

    // Find the match in the text
    const match = findMatch(text, searchValue);

    if (!match) {
      return <span style={{ color: isSubtitle ? Neutral.N400 : CoreColors.Black }}>{text}</span>;
    }

    const beforeMatch = text.substring(0, match.start);
    const matchPortion = text.substring(match.start, match.end);
    const afterMatch = text.substring(match.end);

    return (
      <span style={{ color: isSubtitle ? Neutral.N400 : CoreColors.Black }}>
        {beforeMatch}
        <span style={{ color: Orange.O500 }}>{matchPortion}</span>
        {afterMatch}
      </span>
    );
  };

  const filteredChapters = React.useMemo(() => {
    if (!searchValue.trim()) {
      return recentChapters;
    }

    return recentChapters.filter((chapter) => {
      // Check if title matches
      const titleMatch = findMatch(chapter.title, searchValue);
      if (titleMatch) return true;

      // Check if subtitle matches
      const subtitleMatch = findMatch(chapter.subtitle, searchValue);
      if (subtitleMatch) return true;

      // Special case for number searches (chapter numbers)
      const searchIsNumber = /^\d+$/.test(searchValue.toLowerCase());
      if (searchIsNumber) {
        const numberMatch = chapter.subtitle.match(/(\d+)/);
        if (numberMatch && numberMatch[1] === searchValue) {
          return true;
        }
      }

      return false;
    });
  }, [recentChapters, searchValue]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    if (onSearch) {
      onSearch(value);
    }
  };

  const handleClear = () => {
    setSearchValue('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
    if (onSearch) {
      onSearch('');
    }
  };

  const handleFocus = () => {
    setIsOpen(true);
  };

  const handleChapterSelect = (chapter: ChapterItem) => {
    if (onSelectChapter) {
      onSelectChapter(chapter);
    }

    if (withTriggerButton) {
      setSelectedChapter(chapter);
      setIsOpen(false);
    } else {
      setSearchValue(chapter.title);
      if (onSearch) {
        onSearch(chapter.title);
      }
    }
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  // Handle click outside to close dropdown
  React.useEffect(() => {
    if (withTriggerButton) {
      function handleClickOutside(event: MouseEvent) {
        if (
          dropdownRef.current &&
          triggerRef.current &&
          !dropdownRef.current.contains(event.target as Node) &&
          !triggerRef.current.contains(event.target as Node)
        ) {
          setIsOpen(false);
        }
      }

      // Add event listener
      document.addEventListener('mousedown', handleClickOutside);

      // Remove event listener on cleanup
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [withTriggerButton]);

  // Custom chevron icon that rotates based on dropdown state
  const ChevronIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      style={{
        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
        transition: 'transform 0.2s ease',
        width: '20px',
        height: '20px',
        aspectRatio: '1/1',
      }}
    >
      <path
        d="M7.29427 11.041L10.0026 8.12435L12.7109 11.041"
        stroke="#A3A3A3"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  const renderDropdownContent = () => (
    <div
      ref={dropdownRef}
      className={cn('flex flex-col items-start self-stretch dropdown-search-content', className)}
      style={{
        borderRadius: '12px',
        border: `1px solid ${Neutral.N200}`,
        background: CoreColors.White,
        boxShadow: '0px 4px 8px 0px rgba(0, 0, 0, 0.06)',
      }}
    >
      {/* Search Input Container */}
      <div
        className="flex justify-between items-center self-stretch"
        style={{
          padding: '12px 8px 12px 10px',
          borderRadius: isOpen ? '12px 12px 0px 0px' : '12px',
          borderBottom: isOpen ? `1px solid ${Neutral.N200}` : 'none',
          background: CoreColors.White,
          alignSelf: 'stretch',
        }}
      >
        {/* Search Icon */}
        <div className="flex items-center gap-2 flex-1 self-stretch">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            style={{
              width: '20px',
              height: '20px',
              aspectRatio: '1/1',
            }}
          >
            <path
              d="M16.0443 16.0423L12.9193 12.9173M3.96094 9.16732C3.96094 6.29083 6.29279 3.95898 9.16927 3.95898C12.0458 3.95898 14.3776 6.29083 14.3776 9.16732C14.3776 12.0438 12.0458 14.3757 9.16927 14.3757C6.29279 14.3757 3.96094 12.0438 3.96094 9.16732Z"
              stroke={Neutral.N300}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          {/* Search Input */}
          <input
            ref={inputRef}
            type="text"
            value={searchValue}
            onChange={handleInputChange}
            onFocus={handleFocus}
            placeholder={placeholder}
            className="flex-1 outline-none border-none bg-transparent"
            style={{
              ...textStyles.body2Reg,
              color: CoreColors.Black,
            }}
          />
        </div>

        {/* Show either the clear button when there's text or the cancel button */}
        {searchValue ? (
          <button
            onClick={handleClear}
            className="flex items-center justify-center self-stretch"
            style={{
              display: 'flex',
              padding: '4px',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              style={{
                width: '16px',
                height: '16px',
                aspectRatio: '1/1',
              }}
            >
              <path
                d="M11.5 4.5L4.5 11.5"
                stroke={Neutral.N400}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M4.5 4.5L11.5 11.5"
                stroke={Neutral.N400}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        ) : isOpen ? (
          <button
            onClick={() => {
              if (withTriggerButton) {
                setIsOpen(false);
              } else {
                setSearchValue('');
              }
            }}
            className="flex items-center justify-center self-stretch"
            style={{
              display: 'flex',
              padding: '4px',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              style={{
                width: '16px',
                height: '16px',
                aspectRatio: '1/1',
              }}
            >
              <path
                d="M11.5 4.5L4.5 11.5"
                stroke={Neutral.N400}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M4.5 4.5L11.5 11.5"
                stroke={Neutral.N400}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        ) : null}
      </div>

      {/* Chapters Container - always shown when dropdown is open */}
      {isOpen && (
        <div
          className="flex flex-col items-start self-stretch"
          style={{
            padding: '4px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: '4px',
            alignSelf: 'stretch',
          }}
        >
          {filteredChapters.length > 0 ? (
            <>
              {filteredChapters.map((chapter, index) => (
                <button
                  key={index}
                  className="w-full self-stretch"
                  onClick={() => handleChapterSelect(chapter)}
                  onMouseEnter={() => setHoverIndex(index)}
                  onMouseLeave={() => setHoverIndex(null)}
                  style={{
                    display: 'flex',
                    padding: '8px',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'flex-start',
                    gap: '4px',
                    alignSelf: 'stretch',
                    borderRadius: '10px',
                    background: hoverIndex === index ? Neutral.N100 : CoreColors.White,
                    transition: 'background-color 0.2s ease',
                  }}
                >
                  <div style={{ ...textStyles.body2Reg }}>
                    {highlightMatchingText(chapter.title)}
                  </div>
                  <div style={{ ...textStyles.body2Reg, color: Neutral.N400 }}>
                    {highlightMatchingText(chapter.subtitle, true)}
                  </div>
                </button>
              ))}
            </>
          ) : (
            <div
              className="w-full text-center py-4 self-stretch"
              style={{
                ...textStyles.body2Reg,
                color: Neutral.N400,
                alignSelf: 'stretch',
              }}
            >
              No matching chapters
            </div>
          )}
        </div>
      )}
    </div>
  );

  // Render with trigger button
  if (withTriggerButton) {
    return (
      <div
        style={{
          display: 'flex',
          width: '100%',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: '8px',
        }}
      >
        {/* Custom Button Trigger with specified styling */}
        <button
          ref={triggerRef}
          onClick={toggleDropdown}
          style={{
            display: 'flex',
            padding: '6px 6px 6px 12px',
            alignItems: 'center',
            gap: '2px',
            borderRadius: '100px',
            border: `1px solid ${Neutral.N200}`,
            background: CoreColors.White,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            width: 'fit-content', // Horizontal hugging
            color: '#000',
            fontFamily: 'Geist, sans-serif',
            fontSize: '14px',
            fontStyle: 'normal',
            fontWeight: 126,
            lineHeight: '24px',
          }}
        >
          <span>{selectedChapter ? selectedChapter.title : triggerButtonText}</span>
          <ChevronIcon />
        </button>

        {/* Dropdown Content */}
        {isOpen && renderDropdownContent()}
      </div>
    );
  }

  // Standard render without trigger
  return renderDropdownContent();
}

export default DropdownSearchBar;
