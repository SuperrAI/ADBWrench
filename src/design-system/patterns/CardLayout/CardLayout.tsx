import React, { ReactElement, ReactNode, useEffect, useState } from 'react';
import styles from './CardLayout.module.css';
import { textStyles } from '@/design-system/foundations/typography';
import { useLayout } from '@/context/layout-context';
import Search from '@/design-system/components/Search';

// Define content item interface
export interface ContentItem {
  id: string | number;
  content: ReactNode;

  [key: string]: any; // Allow for additional item properties
}

// Define content configuration
export interface ContentConfig {
  type: 'list' | 'grid' | 'custom';
  items?: ContentItem[];
  gridColumns?: number; // For grid view
  gridItemStyle?: React.CSSProperties; // Add this new property
  gridContainerStyle?: React.CSSProperties; // Add style for grid container
  renderItem?: (item: ContentItem, index: number) => ReactElement; // Custom item renderer
  customRenderer?: (items: ContentItem[]) => ReactElement; // Fully custom renderer
  emptyState?: ReactNode; // Content to show when there are no items
}

// Update the CardLayoutProps interface to accept either a string or an array of strings
interface CardLayoutProps {
  layoutType:
    | 'threeSeparate'
    | 'twoMergedOneSeparate'
    | 'threeMerged'
    | 'fourSeparate'
    | 'twoSeparateTwoMerged'
    | 'twoMerged';
  sidebarPosition?: 'left' | 'right';
  children?: ReactNode;

  // Content configuration - can be an array for per-card config or a single object for all cards
  contentConfig?: ContentConfig | ContentConfig[];

  // New properties for searchbar
  searchbar?: boolean | number[]; // true for all cards, array of indices for specific cards
  searchbarPosition?: 'top' | 'bottom'; // Position of searchbar
  searchProps?: {
    placeholder?: string;
    onChange?: (value: string, cardIndex?: number) => void;
    value?: string | string[]; // string for single searchbar, array for multiple
    onClear?: (cardIndex?: number) => void;
    layoutType?: 'card' | 'list' | 'borderBottom' | 'default';
    contentType?: string;
  };

  // New properties for custom content areas
  toolbarContent?: ReactNode | ReactNode[]; // Custom toolbar content (like action buttons)
  breadcrumbContent?: ReactNode | ReactNode[]; // Custom breadcrumb content
  toolbarPosition?: 'above-search' | 'below-search' | 'top' | 'bottom'; // Position of toolbar relative to search
  breadcrumbPosition?: 'above-search' | 'below-search' | 'top' | 'bottom'; // Position of breadcrumbs

  // New properties for card styling
  cardStyle?:
    | 'transparent'
    | 'default'
    | 'edge-to-edge'
    | ('transparent' | 'default' | 'edge-to-edge')[];
  scrollBehavior?: 'all' | 'left-only' | 'right-only' | 'none'; // Control which cards can scroll

  // Custom class names for different parts
  containerClassName?: string;
  cardClassName?: string | string[]; // Single string or array for per-card classes
  contentClassName?: string | string[]; // Single string or array for per-card content classes

  // Responsive behavior
  responsive?: boolean;
  breakpoints?: {
    sm?: Partial<Omit<CardLayoutProps, 'breakpoints' | 'responsive'>>;
    md?: Partial<Omit<CardLayoutProps, 'breakpoints' | 'responsive'>>;
    lg?: Partial<Omit<CardLayoutProps, 'breakpoints' | 'responsive'>>;
  };
}

// Content rendering functions
const renderListContent = (
  items: ContentItem[],
  renderItem?: (item: ContentItem, index: number) => ReactElement
) => {
  return (
    <div className={styles.listContainer}>
      {items.map((item, index) => (
        <div key={item.id} className={styles.listItem}>
          {renderItem ? renderItem(item, index) : item.content}
        </div>
      ))}
    </div>
  );
};

const renderGridContent = (
  items: ContentItem[],
  columns: number = 2,
  renderItem?: (item: ContentItem, index: number) => ReactElement,
  gridItemStyle?: React.CSSProperties,
  gridContainerStyle?: React.CSSProperties
) => {
  return (
    <div
      className={styles.gridContainer}
      style={{ '--grid-columns': columns, ...gridContainerStyle } as React.CSSProperties}
    >
      {items.map((item, index) => (
        <div key={item.id} className={styles.gridItem} style={gridItemStyle}>
          {renderItem ? renderItem(item, index) : item.content}
        </div>
      ))}
    </div>
  );
};

const renderContent = (cardIndex: number, config?: ContentConfig | ContentConfig[]) => {
  if (!config) return null;

  // Determine which config to use
  const cardConfig: ContentConfig = Array.isArray(config)
    ? config[cardIndex] || { type: 'list', items: [] }
    : config;

  const {
    type,
    items = [],
    gridColumns,
    gridItemStyle,
    gridContainerStyle,
    renderItem,
    customRenderer,
    emptyState,
  } = cardConfig;

  // Show empty state if no items
  if (items.length === 0) {
    return (
      emptyState || (
        <div className={styles.emptyState} style={textStyles.body2Reg}>
          No items to display
        </div>
      )
    );
  }

  // Render based on content type
  switch (type) {
    case 'list':
      return renderListContent(items, renderItem);
    case 'grid':
      return renderGridContent(items, gridColumns, renderItem, gridItemStyle, gridContainerStyle);
    case 'custom':
      return customRenderer ? customRenderer(items) : null;
    default:
      return null;
  }
};

const CardLayout: React.FC<CardLayoutProps> = ({
  layoutType,
  sidebarPosition = 'left',
  children,
  searchbar = false,
  searchbarPosition = 'top',
  searchProps = {},
  contentConfig,
  toolbarContent,
  breadcrumbContent,
  toolbarPosition = 'below-search',
  breadcrumbPosition = 'above-search',
  cardStyle: propCardStyle,
  scrollBehavior: propScrollBehavior,
  containerClassName = '',
  cardClassName = '',
  contentClassName = '',
  responsive = true,
  breakpoints = {},
}) => {
  // Get the cardStyle from the layout context
  const { cardStyle: contextCardStyle, cardScrollBehavior: contextScrollBehavior } = useLayout();

  // Add state for current breakpoint
  const [currentBreakpoint, setCurrentBreakpoint] = useState<'sm' | 'md' | 'lg' | null>(null);

  // Effect to handle responsive behavior
  useEffect(() => {
    if (!responsive) return;

    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 640) setCurrentBreakpoint('sm');
      else if (width < 1024) setCurrentBreakpoint('md');
      else setCurrentBreakpoint('lg');
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [responsive]);

  // Get props for current breakpoint
  const breakpointProps = currentBreakpoint ? breakpoints[currentBreakpoint] || {} : {};

  // Merge base props with breakpoint props
  const effectiveLayoutType = breakpointProps.layoutType || layoutType;
  const effectiveSidebarPosition = breakpointProps.sidebarPosition || sidebarPosition;
  const effectiveSearchbar = breakpointProps.searchbar || searchbar;
  const effectiveSearchbarPosition = breakpointProps.searchbarPosition || searchbarPosition;
  const effectiveSearchProps = breakpointProps.searchProps || searchProps;
  const effectiveToolbarContent = breakpointProps.toolbarContent || toolbarContent;
  const effectiveBreadcrumbContent = breakpointProps.breadcrumbContent || breadcrumbContent;
  const effectiveToolbarPosition = breakpointProps.toolbarPosition || toolbarPosition;
  const effectiveBreadcrumbPosition = breakpointProps.breadcrumbPosition || breadcrumbPosition;
  const effectiveCardStyle = breakpointProps.cardStyle || propCardStyle || contextCardStyle;
  const effectiveScrollBehavior =
    breakpointProps.scrollBehavior || propScrollBehavior || contextScrollBehavior;
  const effectiveContainerClassName = breakpointProps.containerClassName || containerClassName;
  const effectiveCardClassName = breakpointProps.cardClassName || cardClassName;
  const effectiveContentClassName = breakpointProps.contentClassName || contentClassName;

  // Use these effective props throughout the component
  const isEdgeToEdge = Array.isArray(effectiveCardStyle)
    ? effectiveCardStyle.includes('edge-to-edge')
    : effectiveCardStyle === 'edge-to-edge';
  const isTransparent = Array.isArray(effectiveCardStyle)
    ? effectiveCardStyle.includes('transparent')
    : effectiveCardStyle === 'transparent';

  // Initialize search state based on layout type and searchbar config
  const [searchValues, setSearchValues] = useState<string[]>(() => {
    const cardCount =
      effectiveLayoutType === 'threeSeparate'
        ? 3
        : effectiveLayoutType === 'twoMergedOneSeparate'
          ? 2
          : effectiveLayoutType === 'fourSeparate'
            ? 4
            : effectiveLayoutType === 'twoSeparateTwoMerged'
              ? 3
              : effectiveLayoutType === 'twoMerged'
                ? 1
                : 1;
    return Array(cardCount).fill('');
  });

  // Default handlers if not provided
  const handleSearchChange = (value: string, cardIndex: number = 0) => {
    if (effectiveSearchProps.onChange) {
      effectiveSearchProps.onChange(value, cardIndex);
    } else {
      // Default behavior: update internal state
      setSearchValues((prev) => {
        const newValues = [...prev];
        newValues[cardIndex] = value;
        return newValues;
      });
    }
  };

  const handleSearchClear = (cardIndex: number = 0) => {
    if (effectiveSearchProps.onClear) {
      effectiveSearchProps.onClear(cardIndex);
    } else {
      // Default behavior: clear the search
      handleSearchChange('', cardIndex);
    }
  };

  // Helper to determine if a card should have a searchbar
  const shouldHaveSearchbar = (index: number): boolean => {
    if (typeof effectiveSearchbar === 'boolean') {
      return effectiveSearchbar;
    }
    return Array.isArray(effectiveSearchbar) && effectiveSearchbar.includes(index);
  };

  // Helper to get search value for a card
  const getSearchValue = (index: number): string => {
    if (effectiveSearchProps.value !== undefined) {
      if (Array.isArray(effectiveSearchProps.value)) {
        return effectiveSearchProps.value[index] || '';
      }
      return index === 0 ? effectiveSearchProps.value : '';
    }
    return searchValues[index] || '';
  };

  // Helper to get toolbar content for a card
  const getToolbarContent = (index: number): ReactNode => {
    if (Array.isArray(effectiveToolbarContent)) {
      return effectiveToolbarContent[index] || null;
    }
    return index === 0 ? effectiveToolbarContent : null;
  };

  // Helper to get breadcrumb content for a card
  const getBreadcrumbContent = (index: number): ReactNode => {
    if (Array.isArray(effectiveBreadcrumbContent)) {
      return effectiveBreadcrumbContent[index] || null;
    }
    return index === 0 ? effectiveBreadcrumbContent : null;
  };

  // Helper to determine if a card should be scrollable
  const isCardScrollable = (index: number): boolean => {
    if (effectiveScrollBehavior === 'all') return true;
    if (effectiveScrollBehavior === 'none') return false;
    if (
      effectiveScrollBehavior === 'left-only' &&
      ((effectiveSidebarPosition === 'left' && index === 0) ||
        (effectiveSidebarPosition === 'right' && index !== 0))
    )
      return true;
    if (
      effectiveScrollBehavior === 'right-only' &&
      ((effectiveSidebarPosition === 'right' && index === 0) ||
        (effectiveSidebarPosition === 'left' && index !== 0))
    )
      return true;
    return false;
  };

  // Render a card with optional searchbar and content
  const renderCard = (index: number, className: string = '') => {
    const hasSearchbar = shouldHaveSearchbar(index);
    const isScrollable = isCardScrollable(index);
    const toolbarContent = getToolbarContent(index);
    const breadcrumbContent = getBreadcrumbContent(index);

    // Get card-specific class name if provided as array
    const specificCardClassName = Array.isArray(effectiveCardClassName)
      ? effectiveCardClassName[index] || ''
      : effectiveCardClassName;
    const specificContentClassName = Array.isArray(effectiveContentClassName)
      ? effectiveContentClassName[index] || ''
      : effectiveContentClassName;

    // Add the edge-to-edge class conditionally
    const cardClassNames = [
      styles.card,
      className,
      specificCardClassName,
      isEdgeToEdge ? styles.edgeToEdgeCard : '',
      isTransparent ? styles.transparentCard : '',
      isScrollable ? styles.scrollableCard : styles.nonScrollableCard,
    ]
      .filter(Boolean)
      .join(' ');

    const contentClassNames = [
      styles.cardContent,
      specificContentClassName,
      isEdgeToEdge ? styles.edgeToEdgeContent : '',
      isTransparent ? styles.transparentContent : '',
      isScrollable ? styles.scrollableContent : '',
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div className={cardClassNames}>
        {/* Render content based on position */}
        {toolbarContent && effectiveToolbarPosition === 'top' && (
          <div className={styles.toolbarContainer}>{toolbarContent}</div>
        )}
        {breadcrumbContent && effectiveBreadcrumbPosition === 'top' && (
          <div className={styles.breadcrumbContainer}>{breadcrumbContent}</div>
        )}

        {breadcrumbContent && effectiveBreadcrumbPosition === 'above-search' && (
          <div className={styles.breadcrumbContainer}>{breadcrumbContent}</div>
        )}
        {toolbarContent && effectiveToolbarPosition === 'above-search' && (
          <div className={styles.toolbarContainer}>{toolbarContent}</div>
        )}

        {hasSearchbar && effectiveSearchbarPosition === 'top' && (
          <Search
            value={getSearchValue(index)}
            onChange={(value) => handleSearchChange(value, index)}
            onClear={() => handleSearchClear(index)}
            placeholder={effectiveSearchProps.placeholder || 'Search...'}
            layoutType={effectiveSearchProps.layoutType || 'card'}
            contentType={effectiveSearchProps.contentType}
            className={styles.searchBar}
          />
        )}

        {breadcrumbContent && effectiveBreadcrumbPosition === 'below-search' && (
          <div className={styles.breadcrumbContainer}>{breadcrumbContent}</div>
        )}
        {toolbarContent && effectiveToolbarPosition === 'below-search' && (
          <div className={styles.toolbarContainer}>{toolbarContent}</div>
        )}

        <div className={contentClassNames}>
          {renderContent(index, contentConfig)}
          {React.Children.toArray(children)[index] || null}
        </div>

        {toolbarContent && effectiveToolbarPosition === 'bottom' && (
          <div className={styles.toolbarContainer}>{toolbarContent}</div>
        )}
        {breadcrumbContent && effectiveBreadcrumbPosition === 'bottom' && (
          <div className={styles.breadcrumbContainer}>{breadcrumbContent}</div>
        )}

        {hasSearchbar && effectiveSearchbarPosition === 'bottom' && (
          <Search
            value={getSearchValue(index)}
            onChange={(value) => handleSearchChange(value, index)}
            onClear={() => handleSearchClear(index)}
            placeholder={effectiveSearchProps.placeholder || 'Search...'}
            layoutType={effectiveSearchProps.layoutType || 'card'}
            contentType={effectiveSearchProps.contentType}
            className={styles.searchBarBottom}
          />
        )}
      </div>
    );
  };

  const renderLayout = () => {
    // Add edge-to-edge class to container conditionally
    const containerClassName = (baseClassName: string) =>
      `${baseClassName} ${isEdgeToEdge ? styles.edgeToEdge : ''}`;

    switch (effectiveLayoutType) {
      case 'threeSeparate':
        return (
          <div className={containerClassName(styles.threeSeparateContainer)}>
            {renderCard(0)}
            {renderCard(1)}
            {renderCard(2)}
          </div>
        );

      case 'twoMergedOneSeparate':
        return (
          <div className={containerClassName(styles.twoMergedOneSeparateContainer)}>
            {effectiveSidebarPosition === 'left' ? (
              <>
                {renderCard(0)}
                {renderCard(1, styles.mergedTwo)}
              </>
            ) : (
              <>
                {renderCard(0, styles.mergedTwo)}
                {renderCard(1)}
              </>
            )}
          </div>
        );

      case 'threeMerged':
        return (
          <div className={containerClassName(styles.threeMergedContainer)}>
            {renderCard(0, styles.mergedThree)}
          </div>
        );

      case 'fourSeparate':
        return (
          <div className={containerClassName(styles.fourSeparateContainer)}>
            {renderCard(0)}
            {renderCard(1)}
            {renderCard(2)}
            {renderCard(3)}
          </div>
        );

      case 'twoSeparateTwoMerged':
        return (
          <div className={containerClassName(styles.twoSeparateTwoMergedContainer)}>
            {renderCard(0)}
            {renderCard(1, styles.mergedTwo)}
            {renderCard(2)}
          </div>
        );

      case 'twoMerged':
        return (
          <div className={containerClassName(styles.twoMergedContainer)}>
            {renderCard(0, styles.mergedTwo)}
          </div>
        );

      default:
        return null;
    }
  };

  // Apply custom container class if provided
  const containerClassNames = [
    isEdgeToEdge ? `${styles.container} ${styles.edgeToEdgeContainer}` : styles.container,
    effectiveContainerClassName,
  ]
    .filter(Boolean)
    .join(' ');

  return <div className={containerClassNames}>{renderLayout()}</div>;
};

export default CardLayout;
