'use client';

import React, { useMemo, useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { textStyles, typography } from '@/design-system/foundations/typography';
import { AppIcons, ICONS_PATH } from '@/design-system/foundations/icons';

export interface FilterOption {
  id: string;
  label: string;
  checked: boolean;
}

// Define a type for valid category IDs
type CategoryId = 'tags' | 'persona' | 'students' | 'subjects' | 'posted-on';

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
  onApply?: () => void;
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
  // Define your SVG icon mapping using the design system
  const categoryIcons: Record<CategoryId, React.ReactNode> = {
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
  };

  // Default categories if none provided
  const defaultCategories: FilterCategory[] = [
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
  ];

  // Process initialCategories to use our SVG icons
  const processedCategories = useMemo(() => {
    if (!initialCategories) return defaultCategories;

    return initialCategories.map((category) => ({
      ...category,
      // Override the icon with our SVG icon based on the category ID
      icon: categoryIcons[category.id] || category.icon,
    }));
  }, [initialCategories]);

  const [categories, setCategories] = useState<FilterCategory[]>(processedCategories);
  const [activeCategory, setActiveCategory] = useState<string>(initialActiveCategory);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const handleCategoryClick = (categoryId: string) => {
    setActiveCategory(categoryId);
  };

  const handleCheckboxChange = (categoryId: string, optionId: string) => {
    setCategories((prevCategories) =>
      prevCategories.map((category) => {
        if (category.id === categoryId) {
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
        return category;
      })
    );
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  return (
    <div className={`w-[512px] bg-white rounded-[12px] shadow-lg overflow-hidden ${className}`}>
      {/* Header with search */}
      <div className="border-b">
        <div className="relative h-[52px] flex items-center">
          <div className="absolute left-4 flex items-center pointer-events-none">
            <Image
              src={`${ICONS_PATH}/${AppIcons.NAV_SEARCH}.svg`}
              alt="Search"
              width={20}
              height={20}
            />
          </div>
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full h-full pl-[50px] pr-10 focus:outline-none"
            style={{
              fontFamily: textStyles.body2Reg.fontFamily,
              fontSize: textStyles.body2Reg.fontSize,
              lineHeight: textStyles.body2Reg.lineHeight,
              fontWeight: textStyles.body2Reg.fontWeight,
              letterSpacing: textStyles.body2Reg.letterSpacing,
            }}
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-3 text-gray-400 h-6 w-6 flex items-center justify-center rounded-[6px] hover:bg-gray-100"
            >
              <span className="text-sm">✕</span>
            </button>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex">
        {/* Left sidebar - 1/3 width */}
        <div className="w-1/3 p-1 flex flex-col gap-1 border-r">
          {categories.map((category) => (
            <button
              key={category.id}
              className={cn(
                'flex items-center h-[40px] px-2 rounded-lg',
                'transition-colors duration-200',
                'text-left',
                activeCategory === category.id ? 'bg-gray-100' : 'hover:bg-gray-100'
              )}
              onClick={() => handleCategoryClick(category.id)}
            >
              <div className="flex items-center pl-[8px] pr-[12px] py-[5px] w-full">
                <span className="mr-3">{category.icon}</span>
                <span
                  style={{
                    fontFamily: textStyles.body2Med.fontFamily,
                    fontSize: textStyles.body2Med.fontSize,
                    lineHeight: textStyles.body2Med.lineHeight,
                    fontWeight: textStyles.body2Med.fontWeight,
                    letterSpacing: textStyles.body2Med.letterSpacing,
                  }}
                >
                  {category.label}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Right content - 2/3 width */}
        <div className="w-2/3 p-1 flex flex-col gap-1">
          {categories
            .find((category) => category.id === activeCategory)
            ?.options.map((option) => (
              <div
                key={option.id}
                className="flex items-center justify-between h-[40px] px-4 py-[5px] rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => handleCheckboxChange(activeCategory, option.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleCheckboxChange(activeCategory, option.id);
                  }
                }}
              >
                <span
                  style={{
                    fontFamily: typography.fontFamily.sans,
                    fontSize: typography.fontSize.textS,
                    lineHeight: typography.lineHeight.tight,
                    fontWeight: '400',
                    letterSpacing: typography.letterSpacing.none,
                  }}
                >
                  {option.label}
                </span>
                <Checkbox
                  id={option.id}
                  checked={option.checked}
                  onCheckedChange={() => handleCheckboxChange(activeCategory, option.id)}
                  className="h-[18px] w-[18px] rounded-[6px] border-gray-300 data-[state=checked]:bg-black data-[state=checked]:border-black"
                />
              </div>
            ))}
        </div>
      </div>

      {/* Footer with buttons */}
      <div className="py-[10px] px-[10px] flex justify-end gap-3 border-t h-[52px]">
        <button
          onClick={onCancel}
          className="px-6 h-[32px] rounded-[10px] border border-gray-300 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onApply}
          className="px-6 h-[32px] rounded-[10px] bg-black text-white hover:bg-gray-800 transition-colors"
        >
          Apply
        </button>
      </div>
    </div>
  );
}
