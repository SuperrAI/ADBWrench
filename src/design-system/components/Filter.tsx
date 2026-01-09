import React, { useState } from 'react';
import { ListFilter } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import Button from './Button';
import { Checkbox } from './Checkbox';
import Pill from './Pills';
import { cn } from '@/lib/utils';
import { CheckIcon } from '@/components/icons';

export interface FilterOption {
  label: string;
  value: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface FilterCategory {
  category: string;
  icon?: React.ReactNode;
  options: FilterOption[];
  disabled?: boolean;
  singleSelect?: boolean; // New property for single-select categories
  allLabel?: string; // Custom label for "All" option (e.g., "All Students", "View All", etc.)
}

export interface FilterDimensions {
  width?: string | number;
  height?: string | number;
  leftPanelWidth?: string | number;
  rightPanelWidth?: string | number;
}

export interface FilterStyling {
  className?: string;
  style?: React.CSSProperties;
  
  // Trigger button styling
  triggerClassName?: string;
  triggerStyle?: React.CSSProperties;
  
  // Popover content styling
  contentClassName?: string;
  contentStyle?: React.CSSProperties;
  
  // Category panel styling
  categoryPanelClassName?: string;
  categoryPanelStyle?: React.CSSProperties;
  
  // Options panel styling
  optionsPanelClassName?: string;
  optionsPanelStyle?: React.CSSProperties;
  
  // Category item styling
  categoryItemClassName?: string;
  categoryItemActiveClassName?: string;
  categoryItemStyle?: React.CSSProperties;
  
  // Option item styling
  optionItemClassName?: string;
  optionItemStyle?: React.CSSProperties;
  
  // Footer styling
  footerClassName?: string;
  footerStyle?: React.CSSProperties;
  
  // Button styling
  cancelButtonClassName?: string;
  applyButtonClassName?: string;
  cancelButtonStyle?: React.CSSProperties;
  applyButtonStyle?: React.CSSProperties;
}

export interface FilterButtonConfig {
  text?: string;
  showIcon?: boolean;
  icon?: React.ReactNode;
  showPill?: boolean;
  variant?: 'outline' | 'primary' | 'secondary' | 'ghost' | 'squircle' | 'success' | 'warning' | 'info' | 'elevated' | 'loading' | 'squircleIcon';
  squircleBaseStyle?: 'outline' | 'primary' | 'secondary' | 'ghost' | 'success' | 'warning' | 'info' | 'elevated';
  size?: 'small' | 'medium' | 'large';
  shape?: 'default' | 'rounded';
}

export interface FilterTexts {
  buttonText?: string;
  cancelText?: string;
  applyText?: string;
  allPrefix?: string; // "All" in "All Categories"
}

export interface FilterProps {
  // Core functionality
  value: Record<string, string[]>;
  onChange: (value: Record<string, string[]>) => void;
  options: FilterCategory[];
  
  // Layout mode
  mode?: 'single' | 'double';
  singleModeOptions?: FilterOption[];
  singleModeCategory?: string;
  singleModeSingleSelect?: boolean; // Control if single mode should be single-select or multi-select
  singleModeAllLabel?: string; // Custom label for "All" option in single mode
  
  // Dimensions
  dimensions?: FilterDimensions;
  
  // Styling
  styling?: FilterStyling;
  
  // Button configuration
  buttonConfig?: FilterButtonConfig;
  
  // Text customization
  texts?: FilterTexts;
  
  // Behavior
  fallbackIcon?: React.ReactNode;
  closeOnApply?: boolean;
  showSelectAll?: boolean;

  align?: 'start' | 'center' | 'end';
  side?: 'top' | 'right' | 'bottom' | 'left';
  
  // Custom render functions
  renderTrigger?: (props: {
    isOpen: boolean;
    selectedCount: number;
    defaultTrigger: React.ReactNode;
  }) => React.ReactNode;
  
  renderCategoryItem?: (props: {
    category: FilterCategory;
    isSelected: boolean;
    onClick: () => void;
    defaultItem: React.ReactNode;
  }) => React.ReactNode;
  
  renderOptionItem?: (props: {
    option: FilterOption;
    isSelected: boolean;
    onToggle: () => void;
    defaultItem: React.ReactNode;
  }) => React.ReactNode;
  
  // Event handlers
  onOpen?: () => void;
  onClose?: () => void;
  onApply?: (filters: Record<string, string[]>) => void;
  onCancel?: () => void;
}

const defaultDimensions: Required<FilterDimensions> = {
  width: 559,
  height: 281,
  leftPanelWidth: 229,
  rightPanelWidth: 330,
};

const defaultButtonConfig: Required<FilterButtonConfig> = {
  text: 'Filters',
  showIcon: true,
  icon: undefined as any, // Will use ListFilter
  showPill: true,
  variant: 'squircle',
  squircleBaseStyle: 'outline',
  size: 'medium',
  shape: 'default',
};

const defaultTexts: Required<FilterTexts> = {
  buttonText: 'Filters',
  cancelText: 'Cancel',
  applyText: 'Apply',
  allPrefix: 'All',
};

const Filter: React.FC<FilterProps> = ({
  value,
  onChange,
  options,
  mode = 'double',
  singleModeOptions = [],
  singleModeCategory = 'filters',
  singleModeSingleSelect = false, // Default to multi-select for single mode
  singleModeAllLabel,
  dimensions: customDimensions,
  styling = {},
  buttonConfig: customButtonConfig,
  texts: customTexts,
  fallbackIcon = <CheckIcon className="w-5 h-5" />,
  closeOnApply = true,
  showSelectAll = true,
  align = 'end',
  side = 'bottom',
  renderTrigger,
  renderCategoryItem,
  renderOptionItem,
  onOpen,
  onClose,
  onApply,
  onCancel,
}) => {
  const [open, setOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>(() => {
    // Find first non-disabled category
    const firstEnabledCategory = options.find(cat => !cat.disabled);
    return firstEnabledCategory?.category || '';
  });
  const [localValue, setLocalValue] = useState<Record<string, string[]>>(value);

  // Merge with defaults
  const dims = { ...defaultDimensions, ...customDimensions };
  const buttonConf = { ...defaultButtonConfig, ...customButtonConfig };
  const texts = { ...defaultTexts, ...customTexts };

  React.useEffect(() => {
    if (open) {
      setLocalValue(value);
      onOpen?.();
    } else {
      onClose?.();
      setLocalValue({})
    }
  }, [open, value, onOpen, onClose]);

  // Update selected category when options change (when data loads)
  React.useEffect(() => {
    if (options.length > 0 && !selectedCategory) {
      const firstEnabledCategory = options.find(cat => !cat.disabled);
      if (firstEnabledCategory) {
        setSelectedCategory(firstEnabledCategory.category);
      }
    }
  }, [options, selectedCategory]);

  // Calculate total selected filters
  const getTotalSelectedFilters = () => {
    return Object.values(value).reduce((total, selectedValues) => {
      return total + selectedValues.length;
    }, 0);
  };

  const handleToggle = (category: string, optionValue: string) => {
    // Check if the option is disabled (for double panel mode)
    if (mode === 'double') {
      const currentCat = options.find(cat => cat.category === category);
      const option = currentCat?.options.find(opt => opt.value === optionValue);
      if (option?.disabled) return;
    } else {
      // Check if option is disabled in single mode
      const option = singleModeOptions.find(opt => opt.value === optionValue);
      if (option?.disabled) return;
    }
    
    const current = localValue[category] || [];
    let updated: string[];
    let newLocalValue = { ...localValue };
    
    if (optionValue === 'all') {
      updated = [];
    } else {
      // Check if this category is single-select
      const currentCat = options.find(cat => cat.category === category);
      const isSingleSelect = mode === 'double' ? currentCat?.singleSelect : singleModeSingleSelect;
      
      if (isSingleSelect) {
        // For single-select, replace the entire array with just this option
        const exists = current.includes(optionValue);
        updated = exists ? [] : [optionValue];
        
        // If we're selecting a new option (not deselecting), clear only OTHER single-select categories
        // This preserves multi-select categories while ensuring single-select behavior
        if (!exists && updated.length > 0) {
          // Only clear other single-select categories, preserve multi-select ones
          Object.keys(newLocalValue).forEach(key => {
            if (key !== category) {
              const otherCat = options.find(cat => cat.category === key);
              const isOtherSingleSelect = mode === 'double' ? otherCat?.singleSelect : singleModeSingleSelect;
              
              // Only clear if the other category is also single-select
              if (isOtherSingleSelect) {
                newLocalValue[key] = [];
              }
            }
          });
        }
      } else {
        // For multi-select, toggle the option
        const exists = current.includes(optionValue);
        updated = exists ? current.filter(v => v !== optionValue) : [...current, optionValue];
      }
    }
    
    newLocalValue[category] = updated;
    setLocalValue(newLocalValue);
  };

  const handleAll = (category: string) => {
    setLocalValue({ ...localValue, [category]: [] });
  };

  const handleApply = () => {
    onChange(localValue);
    onApply?.(localValue);
    if (closeOnApply) {
      setOpen(false);
    }
  };

  const handleCancel = () => {
    setLocalValue(value);
    onCancel?.();
    setOpen(false);
  };

  const currentCategory = options.find(cat => cat.category === selectedCategory);

  // Single panel filter content
  const renderSinglePanelContent = () => (
    <div 
      className={cn("flex flex-col h-full", styling.contentClassName)}
      style={styling.contentStyle}
    >
      <div className={cn("flex-1 p-1 overflow-y-auto hide-scrollbar", styling.optionsPanelClassName)} style={styling.optionsPanelStyle}>
        <div className="flex flex-col gap-1">
          {showSelectAll && (() => {
            const allId = `single-all-${singleModeCategory}`;
            const allLabel = singleModeAllLabel || `${texts.allPrefix} ${singleModeCategory}`;
            
            return (
              <label 
                key="single-all-option"
                htmlFor={singleModeSingleSelect ? undefined : allId}
                className={cn(
                  "h-10 flex w-full justify-between items-center gap-2 text-sm rounded-lg px-2 py-2 mb-1 cursor-pointer hover:bg-gray-100",
                  styling.optionItemClassName
                )} 
                style={styling.optionItemStyle}
                onClick={singleModeSingleSelect ? () => handleAll(singleModeCategory) : undefined}
              >
                <div className="flex items-center gap-2">
                  {fallbackIcon}
                  <span>{allLabel}</span>
                </div>
                {singleModeSingleSelect ? (
                  <div 
                    className="flex-shrink-0 rounded-full border-2 border-gray-300 flex items-center justify-center cursor-pointer transition-colors"
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      border: '2px solid #D1D5DB',
                      background: '#FFFFFF',
                    }}
                    onClick={() => handleAll(singleModeCategory)}
                  >
                    {(localValue[singleModeCategory] || []).length === 0 && (
                      <div 
                        className="rounded-full bg-black"
                        style={{
                          width: '10px',
                          height: '10px',
                        }}
                      ></div>
                    )}
                  </div>
                ) : (
                  <Checkbox
                    id={allId}
                    checked={(localValue[singleModeCategory] || []).length === 0}
                    onCheckedChange={() => handleAll(singleModeCategory)}
                  />
                )}
              </label>
            );
          })()}
          
          {singleModeOptions.map(opt => {
            const checked = (localValue[singleModeCategory] || []).includes(opt.value);
            const isDisabled = opt.disabled || false;
            
            const checkboxId = `single-${singleModeCategory}-${opt.value}`;
            
            const defaultItem = (
              <label
                htmlFor={singleModeSingleSelect ? undefined : checkboxId}
                className={cn(
                  "h-10 flex w-full justify-between items-center gap-2 text-sm rounded-lg px-2 py-2",
                  isDisabled 
                    ? "cursor-not-allowed opacity-50" 
                    : "cursor-pointer hover:bg-gray-100",
                  styling.optionItemClassName
                )}
                style={styling.optionItemStyle}
                onClick={singleModeSingleSelect ? () => !isDisabled && handleToggle(singleModeCategory, opt.value) : undefined}
              >
                <div className="flex items-center gap-2">
                  {opt.icon || fallbackIcon}
                  <span>{opt.label}</span>
                </div>
                {singleModeSingleSelect ? (
                  <div 
                    className="flex-shrink-0 rounded-full border-2 border-gray-300 flex items-center justify-center cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-black disabled:cursor-not-allowed disabled:opacity-50"
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      border: '2px solid #D1D5DB',
                      background: '#FFFFFF',
                    }}
                    onClick={() => !isDisabled && handleToggle(singleModeCategory, opt.value)}
                  >
                    {checked && (
                      <div 
                        className="rounded-full bg-black"
                        style={{
                          width: '10px',
                          height: '10px',
                        }}
                      ></div>
                    )}
                  </div>
                ) : (
                  <Checkbox
                    id={checkboxId}
                    checked={checked}
                    disabled={isDisabled}
                    onCheckedChange={() => !isDisabled && handleToggle(singleModeCategory, opt.value)}
                  />
                )}
              </label>
            );

            return (
              <div key={opt.value}>
                {renderOptionItem ? renderOptionItem({
                  option: opt,
                  isSelected: checked,
                  onToggle: () => handleToggle(singleModeCategory, opt.value),
                  defaultItem
                }) : defaultItem}
              </div>
            );
          })}
        </div>
      </div>
      {renderFooter()}
    </div>
  );

  // Two-panel filter content
  const renderTwoPanelContent = () => (
    <div 
      className={cn('flex flex-col h-full', styling.contentClassName)}
      style={styling.contentStyle}
    >
      <div className="flex flex-1 min-h-0">
        {/* Left: Categories */}
        <div 
          className={cn("border-r border-gray-100 flex flex-col p-1", styling.categoryPanelClassName)}
          style={{ 
            width: dims.leftPanelWidth,
            ...styling.categoryPanelStyle 
          }}
        >
          {options.map(cat => {
            const isSelected = selectedCategory === cat.category;
            const isCategoryDisabled = cat.disabled || false;
            
            const defaultItem = (
              <button
                className={cn(
                  "flex font-medium text-sm items-center gap-2 px-2 py-2 text-left rounded-lg transition-colors mb-1",
                  isCategoryDisabled 
                    ? "cursor-not-allowed opacity-50"
                    : isSelected 
                      ? cn('bg-neutral-100 text-primary w-full', styling.categoryItemActiveClassName)
                      : 'hover:bg-gray-100 w-full',
                  styling.categoryItemClassName
                )}
                style={styling.categoryItemStyle}
                onClick={() => !isCategoryDisabled && setSelectedCategory(cat.category)}
                disabled={isCategoryDisabled}
                type="button"
              >
                <span>{cat.category}</span>
              </button>
            );

                         return (
              <div key={cat.category}>
                {renderCategoryItem ? renderCategoryItem({
                  category: cat,
                  isSelected,
                  onClick: () => setSelectedCategory(cat.category),
                  defaultItem
                }) : defaultItem}
              </div>
            );
          })}
        </div>
        
        {/* Right: Options */}
        <div 
          className={cn("p-1 flex flex-col overflow-y-auto hide-scrollbar", styling.optionsPanelClassName)}
          style={{
            width: dims.rightPanelWidth,
            ...styling.optionsPanelStyle
          }}
        >
          {selectedCategory && currentCategory && (
            <div className="flex flex-col mb-4">
              {showSelectAll && (() => {
                const allId = `all-${selectedCategory}`;
                return (
                  <label 
                    htmlFor={currentCategory?.singleSelect ? undefined : allId}
                    className={cn(
                      "flex justify-between items-center gap-2 cursor-pointer hover:bg-gray-100 rounded-lg px-2 py-2 text-sm mb-1",
                      styling.optionItemClassName
                    )} 
                    style={{...styling.optionItemStyle, height: '38px'}}
                    onClick={currentCategory?.singleSelect ? () => handleAll(selectedCategory) : undefined}
                  >
                    <span>{currentCategory?.allLabel || `${texts.allPrefix} ${selectedCategory}`}</span>
                    {currentCategory?.singleSelect ? (
                      <div 
                        className="flex-shrink-0 rounded-full border-2 border-gray-300 flex items-center justify-center cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-black disabled:cursor-not-allowed disabled:opacity-50"
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          border: '2px solid #D1D5DB',
                          background: '#FFFFFF',
                        }}
                        onClick={() => handleAll(selectedCategory)}
                      >
                        {(localValue[selectedCategory] || []).length === 0 && (
                          <div 
                            className="rounded-full bg-black"
                            style={{
                              width: '10px',
                              height: '10px',
                            }}
                          ></div>
                        )}
                      </div>
                    ) : (
                      <Checkbox
                        id={allId}
                        checked={(localValue[selectedCategory] || []).length === 0}
                        onCheckedChange={() => handleAll(selectedCategory)}
                      />
                    )}
                  </label>
                );
              })()}
              
              {currentCategory?.options.map(opt => {
                const checked = (localValue[selectedCategory] || []).includes(opt.value);
                const isOptionDisabled = opt.disabled || false;
                const isSingleSelect = currentCategory.singleSelect;
                
                const optionId = `double-${selectedCategory}-${opt.value}`;
                
                const defaultItem = (
                  <label
                    htmlFor={isSingleSelect ? undefined : optionId}
                    className={cn(
                      "flex w-full justify-between items-center gap-2 text-sm rounded-lg px-2 py-2 mb-1",
                      isOptionDisabled 
                        ? "cursor-not-allowed opacity-50"
                        : "cursor-pointer hover:bg-gray-100",
                      styling.optionItemClassName
                    )}
                    style={{...styling.optionItemStyle, height: '38px'}}
                    onClick={isSingleSelect ? () => !isOptionDisabled && handleToggle(selectedCategory, opt.value) : undefined}
                  >
                    <span>{opt.label}</span>
                    {isSingleSelect ? (
                      <div 
                        className="flex-shrink-0 rounded-full border-2 border-gray-300 flex items-center justify-center cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-black disabled:cursor-not-allowed disabled:opacity-50"
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          border: '2px solid #D1D5DB',
                          background: '#FFFFFF',
                        }}
                        onClick={() => !isOptionDisabled && handleToggle(selectedCategory, opt.value)}
                      >
                        {checked && (
                          <div 
                            className="rounded-full bg-black"
                            style={{
                              width: '10px',
                              height: '10px',
                            }}
                          ></div>
                        )}
                      </div>
                    ) : (
                      <Checkbox
                        id={optionId}
                        checked={checked}
                        disabled={isOptionDisabled}
                        onCheckedChange={() => !isOptionDisabled && handleToggle(selectedCategory, opt.value)}
                      />
                    )}
                  </label>
                );

                return (
                  <div key={opt.value}>
                    {renderOptionItem ? renderOptionItem({
                      option: opt,
                      isSelected: checked,
                      onToggle: () => handleToggle(selectedCategory, opt.value),
                      defaultItem
                    }) : defaultItem}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      {renderFooter()}
    </div>
  );

  const renderFooter = () => (
    <div 
      className={cn("flex justify-end gap-2 p-3 border-t border-gray-100", styling.footerClassName)}
      style={styling.footerStyle}
    >
      <Button 
        variant="squircle" 
        squircleBaseStyle="outline" 
        onClick={handleCancel} 
        type="button" 
        size="small" 
        className={cn('min-w-[80px]', styling.cancelButtonClassName)}
        style={styling.cancelButtonStyle}
        shape="default"
      >
        {texts.cancelText}
      </Button>
      <Button 
        variant="squircle" 
        squircleBaseStyle="primary" 
        onClick={handleApply} 
        type="button" 
        size="small" 
        className={cn('min-w-[80px]', styling.applyButtonClassName)}
        style={styling.applyButtonStyle}
        shape="default"
      >
        {texts.applyText}
      </Button>
    </div>
  );

  const selectedCount = getTotalSelectedFilters();

  const defaultTrigger = mode === 'single' ? (
    <ListFilter className="w-4 h-4 cursor-pointer" />
  ) : (
    <button
      type="button"
      className={cn(
        `relative !h-[40px] text-sm transition-colors hover:bg-neutral-50 border border-gray-200 rounded-xl bg-white text-gray-800 focus:outline-none focus:ring-0`,
        selectedCount > 0 ? '!w-[120px]' : '!w-[94px]',
        styling.triggerClassName
      )}
      style={styling.triggerStyle}
    >
      <div className="flex items-center gap-2" style={{ paddingTop: "10px", paddingBottom: "10px", paddingLeft: "10px", paddingRight: "14px" }}>
        {buttonConf.showIcon && (buttonConf.icon || <ListFilter className="w-4 h-4 cursor-pointer" />)}
        {buttonConf.text}
        {buttonConf.showPill && selectedCount > 0 && (
          <Pill 
            number={selectedCount} 
            variant="default" 
            className='w-5 h-5 flex items-center justify-center text-xs'
          />
        )}
      </div>
    </button>
  );

  return (
    <div className={cn(styling.className)} style={styling.style}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          {renderTrigger ? renderTrigger({
            isOpen: open,
            selectedCount,
            defaultTrigger
          }) : defaultTrigger}
        </PopoverTrigger>
        <PopoverContent
          sideOffset={8}
          className={cn(
            "z-50 p-0 rounded-xl border border-neutral-200",
            styling.contentClassName
          )}
          style={{
            width: mode === 'single' ? 331 : dims.width,
            height: mode === 'single' ? 310 : dims.height,
            ...styling.contentStyle
          }}
          align={align}
          side={side}
        >
          {mode === 'single' ? renderSinglePanelContent() : renderTwoPanelContent()}
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default Filter; 