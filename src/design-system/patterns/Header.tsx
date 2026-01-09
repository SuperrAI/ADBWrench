import React, { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { textStyles } from '@/design-system/foundations/typography';
import { CoreColors, Neutral } from '@/design-system/foundations/colors';
import { Pill } from '@/design-system/components/Pills';
import { useLayout } from '@/context/layout-context';
import { FilterCategory } from '@/components/filter-modal/FilterModal';
import { usePathname } from 'next/navigation';

interface HeaderProps {
  className?: string;
  title?: string;
  showDropdown?: boolean;
  onDropdownClick?: () => void;
  backgroundColor?: string;
  width?: string | number;
  height?: string | number;
  position?: 'relative' | 'absolute' | 'fixed' | 'sticky';
  /**
   * Custom content to display in the center instead of the default title/dropdown
   */
  centerContent?: React.ReactNode;
  filterCategories?: FilterCategory[];
  initialActiveCategory?: string;
  onFilterApply?: (categories: FilterCategory[]) => void;
}

export function Header({
  className,
  title = 'People',
  showDropdown = true,
  onDropdownClick,
  backgroundColor = 'transparent',
  width = '1052px',
  height = '40px',
  position = 'relative',
  centerContent,
  // New props for filter functionality (they'll be ignored if not needed)
  filterCategories,
  initialActiveCategory,
  onFilterApply,
}: HeaderProps) {
  // Access layout context for filter modal functionality
  const { toggleFilterModal, filterButtonRef, setShowHeader } = useLayout();
  const pathname = usePathname();

  // Store the initial pathname when the component mounts
  const initialPathRef = React.useRef(pathname);

  // Monitor for path changes and hide header if path changes
  useEffect(() => {
    // If the path changes from the initial path, hide the header
    if (pathname !== initialPathRef.current) {
      setShowHeader(false);
    }
  }, [pathname, setShowHeader]);

  // Create a custom text style with a stronger font weight
  const customTextStyle = {
    fontFamily: textStyles.body1Med.fontFamily,
    fontSize: textStyles.body1Med.fontSize,
    lineHeight: textStyles.body1Med.lineHeight,
    letterSpacing: textStyles.body1Med.letterSpacing,
  };

  // Handle dropdown click - use context's toggle if no explicit handler is provided
  const handleDropdownClick = () => {
    if (onDropdownClick) {
      onDropdownClick();
    } else if (filterCategories) {
      toggleFilterModal();
    }
  };

  // Create a custom Pill component with the modified ChevronDownIcon
  const CustomPill = () => {
    // Create a ref to access the dropdown icon element after render
    const pillRef = React.useRef<HTMLDivElement>(null);

    // Use effect to modify the SVG color after component mounts
    React.useEffect(() => {
      if (pillRef.current) {
        const svgElement = pillRef.current.querySelector('svg');
        if (svgElement) {
          // Set the stroke color of the SVG paths
          const paths = svgElement.querySelectorAll('path');
          paths.forEach((path) => {
            path.setAttribute('stroke', Neutral.N400);
          });

          // Add margin to the SVG to create space between text and icon
          svgElement.style.marginLeft = '2px';
        }
      }
    }, []);

    return (
      <div ref={pillRef}>
        <Pill
          variant="default"
          label={title}
          dropdown={true}
          onDropdownClick={handleDropdownClick}
          style={{
            backgroundColor: 'transparent',
            ...customTextStyle,
          }}
          className="font-medium"
          // Attach the filterButtonRef if we're using it for filter modal positioning
          ref={filterCategories ? (filterButtonRef as React.RefObject<HTMLDivElement>) : undefined}
        />
      </div>
    );
  };

  return (
    <header
      className={cn('flex items-center justify-center mt-4 mb-4', className)}
      style={{
        width,
        height,
        position,
        paddingRight: '8px',
        paddingLeft: '8px',
        backgroundColor,
      }}
    >
      {centerContent ||
        (showDropdown ? (
          <CustomPill />
        ) : (
          <span
            className="font-medium"
            style={{
              ...customTextStyle,
              color: CoreColors.Black,
            }}
          >
            {title}
          </span>
        ))}
    </header>
  );
}

export default Header;
