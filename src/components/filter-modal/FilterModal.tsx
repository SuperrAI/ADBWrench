'use client';

import React, { useMemo, useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { textStyles, typography } from '@/design-system/foundations/typography';
import { AppIcons, ICONS_PATH } from '@/design-system/foundations/icons';

import { Checkbox } from '@/design-system/components/Checkbox';
import { colors } from '@/design-system/foundations/colors';
import Button from '@/design-system/components/Button';

export interface FilterOption {
  id: string;
  label: string;
  checked: boolean;
}

// Define a type for valid category IDs
type CategoryId =
  | 'tags'
  | 'persona'
  | 'students'
  | 'subjects'
  | 'posted-on'
  | 'filetypes'
  | 'relevance'
  | 'assignmentType'
  | 'status'
  | 'type'
  | 'class';

export interface FilterCategory {
  id: CategoryId; // Update to use the specific type instead of string
  label: string;
  icon: React.ReactNode;
  options: FilterOption[];
}

interface FilterModalProps {
  initialCategories?: FilterCategory[];
  initialActiveCategory?: string;
  onCancel?: () => void;
  onApply?: (categories: FilterCategory[]) => void;
  className?: string;
  searchPlaceholder?: string;
}

export function FilterModal({
  initialCategories,
  initialActiveCategory = 'persona',
  onCancel = () => {},
  onApply = () => {},
  className = '',
  searchPlaceholder = 'Search for a filter...',
}: FilterModalProps) {
  // Define your SVG icon mapping using the design system - wrapped in useMemo to prevent recreation
  const categoryIcons = useMemo<Record<CategoryId, React.ReactNode>>(() => ({
    tags: (
      <Image src={`${ICONS_PATH}/${AppIcons.FILTER_TAGS}.svg`} alt="Tags" width={20} height={20} />
    ),
    persona: (
      <Image
        src={`${ICONS_PATH}/${AppIcons.FILTER_PERSONA}.svg`}
        alt="Persona"
        width={20}
        height={20}
      />
    ),
    students: (
      <Image
        src={`${ICONS_PATH}/${AppIcons.FILTER_STUDENTS}.svg`}
        alt="Students"
        width={20}
        height={20}
      />
    ),
    subjects: (
      <Image
        src={`${ICONS_PATH}/${AppIcons.FILTER_SUBJECTS}.svg`}
        alt="Subjects"
        width={20}
        height={20}
      />
    ),
    'posted-on': (
      <Image
        src={`${ICONS_PATH}/${AppIcons.FILTER_POSTED_ON}.svg`}
        alt="Posted on"
        width={20}
        height={20}
      />
    ),
    filetypes: (
      <Image
        src={`${ICONS_PATH}/${AppIcons.FILTER_FILETYPE}.svg`}
        alt="Filetypes"
        width={20}
        height={20}
      />
    ),
    relevance: (
      <Image
        src={`${ICONS_PATH}/${AppIcons.FILTER_POSTED_ON}.svg`}
        alt="Relevance"
        width={20}
        height={20}
      />
    ),
    assignmentType: (
      <Image
        src={`${ICONS_PATH}/${AppIcons.FILTER_FILETYPE}.svg`}
        alt="Assignment Type"
        width={20}
        height={20}
      />
    ),
    status: (
      <Image
        src={`${ICONS_PATH}/${AppIcons.FILTER_POSTED_ON}.svg`}
        alt="Status"
        width={20}
        height={20}
      />
    ),
    type: (
      <Image
        src={`${ICONS_PATH}/${AppIcons.FILTER_FILETYPE}.svg`}
        alt="Type"
        width={20}
        height={20}
      />
    ),
    class: (
      <Image
        src={`${ICONS_PATH}/${AppIcons.FILTER_SUBJECTS}.svg`}
        alt="Class"
        width={20}
        height={20}
      />
    ),
  }), []);

  // Default categories if none provided - wrapped in useMemo to prevent recreation
  const defaultCategories = useMemo<FilterCategory[]>(() => [
    {
      id: 'tags',
      label: 'Tags',
      icon: (
        <Image
          src={`${ICONS_PATH}/${AppIcons.FILTER_TAGS}.svg`}
          alt="Tags"
          width={20}
          height={20}
        />
      ),
      options: [
        { id: 'tags-1', label: 'Tags', checked: false },
        { id: 'tags-2', label: 'Important', checked: false },
        { id: 'tags-3', label: 'Work', checked: false },
      ],
    },
    {
      id: 'persona',
      label: 'Persona',
      icon: (
        <Image
          src={`${ICONS_PATH}/${AppIcons.FILTER_PERSONA}.svg`}
          alt="Persona"
          width={20}
          height={20}
        />
      ),
      options: [
        { id: 'persona-1', label: 'Persona', checked: true },
        { id: 'persona-2', label: 'Student', checked: false },
        { id: 'persona-3', label: 'Teacher', checked: false },
      ],
    },
    {
      id: 'students',
      label: 'Students',
      icon: (
        <Image
          src={`${ICONS_PATH}/${AppIcons.FILTER_STUDENTS}.svg`}
          alt="Students"
          width={20}
          height={20}
        />
      ),
      options: [
        { id: 'students-1', label: 'Students', checked: false },
        { id: 'students-2', label: 'Undergraduate', checked: false },
        { id: 'students-3', label: 'Graduate', checked: false },
      ],
    },
    {
      id: 'subjects',
      label: 'Subjects',
      icon: (
        <Image
          src={`${ICONS_PATH}/${AppIcons.FILTER_SUBJECTS}.svg`}
          alt="Subjects"
          width={20}
          height={20}
        />
      ),
      options: [
        { id: 'subjects-1', label: 'Subjects', checked: false },
        { id: 'subjects-2', label: 'Math', checked: false },
        { id: 'subjects-3', label: 'Science', checked: false },
      ],
    },
    {
      id: 'posted-on',
      label: 'Posted on',
      icon: (
        <Image
          src={`${ICONS_PATH}/${AppIcons.FILTER_POSTED_ON}.svg`}
          alt="Posted on"
          width={20}
          height={20}
        />
      ),
      options: [
        { id: 'posted-on-1', label: 'Posted on', checked: false },
        { id: 'posted-on-2', label: 'Last week', checked: false },
        { id: 'posted-on-3', label: 'Last month', checked: false },
      ],
    },
  ], []);

  // Process initialCategories to use our SVG icons
  const processedCategories = useMemo(() => {
    if (!initialCategories) return defaultCategories;

    return initialCategories.map((category) => ({
      ...category,
      // Override the icon with our SVG icon based on the category ID
      icon: categoryIcons[category.id] || category.icon,
    }));
  }, [initialCategories, categoryIcons, defaultCategories]);

  const [categories, setCategories] = useState<FilterCategory[]>(processedCategories);
  const [activeCategory, setActiveCategory] = useState<string>(initialActiveCategory);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const handleCategoryClick = (categoryId: string) => {
    setActiveCategory(categoryId);
  };

  const handleCheckboxChange = (categoryId: string, optionId: string) => {
    setCategories((prevCategories) => {
      return prevCategories.map((category) => {
        if (category.id === categoryId) {
          // Special handling for status, type, class, subjects, and filetypes categories (exclusive selection with "All")
          if (
            categoryId === 'status' ||
            categoryId === 'type' ||
            categoryId === 'class' ||
            categoryId === 'subjects' ||
            categoryId === 'filetypes'
          ) {
            return {
              ...category,
              options: category.options.map((option) => {
                if (option.id === optionId) {
                  // If clicking "All", deselect everything else
                  if (optionId.includes('-all')) {
                    return { ...option, checked: !option.checked };
                  }
                  // If clicking specific option (Active/Completed/Worksheet/Task/etc), deselect "All"
                  else {
                    return { ...option, checked: !option.checked };
                  }
                } else {
                  // If clicking "All", deselect all other options
                  if (optionId.includes('-all')) {
                    return { ...option, checked: false };
                  }
                  // If clicking specific option, deselect "All"
                  else if (option.id.includes('-all')) {
                    return { ...option, checked: false };
                  }
                  // Keep other non-all options as they are
                  return option;
                }
              }),
            };
          }
          // Default behavior for other categories
          else {
            return {
              ...category,
              options: category.options.map((option) => {
                if (option.id === optionId) {
                  return { ...option, checked: !option.checked };
                }
                return option;
              }),
            };
          }
        }
        return category;
      });
    });
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  // Pass the updated categories back when applying filters
  const handleApply = () => {
    onApply(categories);
  };

  return (
    <div
      className={`w-[90vw] sm:w-[512px] max-w-[512px] bg-white rounded-[12px] shadow-lg overflow-hidden border border-solid ${className}`}
      style={{ borderColor: colors.neutral.N200 }}
    >
      {/* Header with search */}
      <div className="border-b-[1px] border-solid" style={{ borderColor: colors.neutral.N200 }}>
        <div className="relative h-[52px] flex items-center">
          <div className="absolute left-4 flex items-center pointer-events-none">
            <Image
              src={`${ICONS_PATH}/${AppIcons.NAV_SEARCH}.svg`}
              alt="Search"
              width={24}
              height={24}
            />
          </div>
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full h-full pl-[54px] pr-16 focus:outline-none text-sm md:text-base"
            style={{
              ...textStyles.body1Reg,
            }}
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-4 text-gray-400 h-7 w-7 flex items-center justify-center rounded-[6px] hover:bg-gray-100"
            >
              <span className="text-base">✕</span>
            </button>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col sm:flex-row">
        {/* Left sidebar */}
        <div
          className="w-full sm:w-1/3 p-1 flex flex-col gap-0.5 border-b sm:border-b-0 sm:border-r border-solid"
          style={{ borderColor: colors.neutral.N200 }}
        >
          {categories.map((category) => (
            <button
              key={category.id}
              className={cn(
                'flex items-center h-[46px] px-2 rounded-lg',
                'transition-colors duration-200',
                'text-left'
              )}
              style={{
                backgroundColor:
                  activeCategory === category.id ? colors.neutral.N100 : 'transparent',
              }}
              onClick={() => handleCategoryClick(category.id)}
              onMouseEnter={(e) => {
                if (activeCategory !== category.id) {
                  e.currentTarget.style.backgroundColor = colors.neutral.N100;
                }
              }}
              onMouseLeave={(e) => {
                if (activeCategory !== category.id) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <div className="flex items-center pl-[8px] pr-[12px] py-[8px] w-full">
                <span className="mr-3">{category.icon}</span>
                <span
                  className="text-sm md:text-base"
                  style={{
                    ...textStyles.body1Med,
                  }}
                >
                  {category.label}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Right content */}
        <div className="w-full sm:w-2/3 p-1 flex flex-col gap-0.5 overflow-y-auto max-h-[248px] sm:h-[248px]">
          {categories
            .find((category) => category.id === activeCategory)
            ?.options.map((option) => (
              <div
                key={option.id}
                className="flex items-center justify-between h-[46px] px-3 sm:px-4 py-[8px] rounded-lg transition-colors cursor-pointer flex-shrink-0"
                onClick={() => handleCheckboxChange(activeCategory, option.id)}
                role="button"
                tabIndex={0}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = colors.neutral.N100;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleCheckboxChange(activeCategory, option.id);
                  }
                }}
              >
                <span
                  className="text-xs sm:text-sm truncate mr-2"
                  style={{
                    fontFamily: typography.fontFamily.sans,
                    fontSize: typography.fontSize.textM,
                    lineHeight: typography.lineHeight.normal,
                    fontWeight: '400',
                    letterSpacing: typography.letterSpacing.none,
                  }}
                >
                  {option.label}
                </span>
                <Checkbox
                  id={option.id}
                  checked={option.checked}
                  className="h-[20px] w-[20px] flex-shrink-0 rounded-[6px] border-gray-300 bg-white hover:bg-white data-[state=checked]:bg-black data-[state=checked]:border-black"
                />
              </div>
            ))}
        </div>
      </div>

      {/* Footer with buttons */}
      <div
        className="h-[52px] flex items-center justify-end gap-2 px-[12px] border-t border-solid"
        style={{ borderColor: colors.neutral.N200 }}
      >
        <Button
          variant="squircle"
          squircleBaseStyle="outline"
          size="small"
          onClick={onCancel}
          className="!font-[400] text-xs sm:text-sm"
        >
          Cancel
        </Button>
        <Button
          variant="squircle"
          squircleBaseStyle="primary"
          size="small"
          onClick={handleApply}
          className="!font-[400] text-xs sm:text-sm"
        >
          Apply
        </Button>
      </div>
    </div>
  );
}
