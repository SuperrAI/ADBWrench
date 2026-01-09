'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { CalendarIcon as LucideCalendarIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CoreColors, Neutral, Orange } from '@/design-system/foundations/colors';

// Custom component to render the dot under today's date
const CustomDayButton = (props: any) => {
  const { day, ...buttonProps } = props;
  const today = new Date();

  const isToday =
    day.date.getDate() === today.getDate() &&
    day.date.getMonth() === today.getMonth() &&
    day.date.getFullYear() === today.getFullYear();

  const todayColor = Orange.O500;

  return (
    <div className="relative">
      <button
        {...buttonProps}
        style={{
          fontWeight: isToday ? 700 : 'inherit',
          color: isToday ? todayColor : 'inherit',
          ...buttonProps.style,
        }}
        className={cn(buttonProps.className, isToday ? 'today-marker' : '')}
      >
        {day.date.getDate()}
      </button>
      {isToday && (
        <div
          className="absolute left-1/2 -translate-x-1/2 bottom-0.5 pointer-events-none"
          style={{
            width: '3px',
            height: '3px',
            backgroundColor: todayColor,
            borderRadius: '50%',
          }}
        />
      )}
    </div>
  );
};

interface DatePickerProps {
  date?: Date;
  setDate?: (date: Date | undefined) => void;
  label?: string;
  placeholder?: string;
  icon?: React.ReactNode;
  formatString?: string;
  align?: 'center' | 'start' | 'end';
  className?: string;
  contentClassName?: string;
  dateDisplayClassName?: string;
  buttonClassName?: string;
  dateDisplayPosition?: 'left' | 'right';
  labelStyle?: React.CSSProperties;
  dateDisplayStyle?: React.CSSProperties;
  noBorder?: boolean;
  hoverClassName?: string;
  buttonStyle?: React.CSSProperties;
  activeBorderClassName?: string;
  activeBackgroundClassName?: string;
  defaultOpen?: boolean;
}

export function DatePicker({
  date,
  setDate,
  label,
  placeholder = 'Pick a date',
  icon,
  formatString = 'PPP',
  align = 'start',
  className,
  contentClassName = 'w-auto p-0 rounded-xl border border-gray-100',
  dateDisplayClassName,
  buttonClassName,
  dateDisplayPosition = 'left',
  labelStyle,
  dateDisplayStyle,
  noBorder = false,
  hoverClassName,
  buttonStyle,
  activeBorderClassName,
  activeBackgroundClassName = 'bg-neutral-50',
  defaultOpen = false,
}: DatePickerProps) {
  const [internalDate, setInternalDate] = React.useState<Date | undefined>(date);
  const [open, setOpen] = React.useState(defaultOpen);
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const [popoverWidth, setPopoverWidth] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (open && buttonRef.current) {
      setPopoverWidth(buttonRef.current.offsetWidth);
    }
  }, [open]);

  const handleDateChange = React.useCallback(
    (newDate: Date | undefined) => {
      if (setDate) {
        setDate(newDate);
      } else {
        setInternalDate(newDate);
      }
    },
    [setDate]
  );

  const selectedDate = date !== undefined ? date : internalDate;

  const placeholderColor = Neutral.N400;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          ref={buttonRef}
          variant="ghost"
          className={cn(
            'w-[240px] justify-start text-left font-normal box-border border-0',
            !selectedDate && 'text-muted-foreground',
            noBorder && 'shadow-none hover:bg-neutral-50',
            open && activeBorderClassName,
            open && activeBackgroundClassName,
            hoverClassName,
            buttonClassName
          )}
          style={buttonStyle}
        >
          <div className="flex justify-between items-center w-full">
            <div
              className={cn('flex items-center gap-2', dateDisplayPosition === 'right' && 'flex-1')}
            >
              {icon || <LucideCalendarIcon className="h-4 w-4" />}
              {label && <span style={labelStyle}>{label}</span>}
              {dateDisplayPosition === 'left' && (
                <span className={dateDisplayClassName}>
                  {selectedDate ? (
                    <span style={dateDisplayStyle}>{format(selectedDate, formatString)}</span>
                  ) : (
                    <span style={{ ...dateDisplayStyle, color: placeholderColor }}>
                      {placeholder}
                    </span>
                  )}
                </span>
              )}
            </div>
            {dateDisplayPosition === 'right' && (
              <span className={dateDisplayClassName}>
                {selectedDate ? (
                  <span style={dateDisplayStyle}>{format(selectedDate, formatString)}</span>
                ) : (
                  <span style={{ ...dateDisplayStyle, color: placeholderColor }}>
                    {placeholder}
                  </span>
                )}
              </span>
            )}
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={contentClassName}
        align={align}
        sideOffset={5}
        style={popoverWidth ? { width: `${popoverWidth}px` } : undefined}
      >
        <style jsx global>{`
          .rdp-nav_button {
            size: 4px !important;
          }

          .rdp-nav_button svg {
            width: 12px !important;
            height: 12px !important;
            stroke: ${Neutral.N400} !important;
            fill: ${Neutral.N400} !important;
          }

          .rdp-nav_icon {
            width: 12px !important;
            height: 12px !important;
            stroke: ${Neutral.N400} !important;
            fill: ${Neutral.N400} !important;
          }

          .rdp-nav_button:hover svg,
          .rdp-nav_icon:hover,
          .rdp-nav_button:hover .rdp-nav_icon,
          .rdp-nav_button svg:hover {
            stroke: ${Neutral.N400} !important;
            fill: ${Neutral.N400} !important;
          }

          /* Make sure the icons are consistently grey */
          .rdp-nav_button svg *,
          .rdp-nav_icon * {
            stroke: ${Neutral.N400} !important;
            fill: ${Neutral.N400} !important;
          }

          /* Handle today's date when selected */
          button.rdp-day[aria-selected='true'] .today-marker,
          button.rdp-day_selected .today-marker,
          .rdp-day_today[aria-selected='true'] .today-marker,
          .rdp-day_today.rdp-day_selected .today-marker {
            color: ${CoreColors.White} !important;
          }

          /* Force white text for today's date when selected */
          .rdp-day_today[aria-selected='true'] div,
          .rdp-day_today.rdp-day_selected div,
          .rdp-day_today[aria-selected='true'] div *,
          .rdp-day_today.rdp-day_selected div * {
            color: ${CoreColors.White} !important;
          }

          /* Highest specificity override */
          [aria-selected='true'].rdp-day_today .today-marker,
          .rdp-day_selected.rdp-day_today .today-marker {
            color: ${CoreColors.White} !important;
          }
        `}</style>
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleDateChange}
          initialFocus
          components={{
            DayButton: CustomDayButton,
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
