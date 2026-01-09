'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DayPicker } from 'react-day-picker';

import { cn } from '@/lib/utils';
import { textStyles } from '@/design-system/foundations/typography';
import { CoreColors, Neutral, Orange } from '@/design-system/foundations/colors';

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  // Combine base utility classes with provided classNames
  const combinedClassNames = React.useMemo(
    () => ({
      months: cn('flex flex-col sm:flex-row gap-2', classNames?.months),
      month: cn('flex flex-col gap-4', classNames?.month),
      caption: cn(
        'flex items-center justify-between px-2 w-full h-9 relative',
        classNames?.caption
      ),
      caption_label: cn(
        'font-medium font-geist absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none',
        classNames?.caption_label
      ),
      nav: cn('flex items-center justify-between w-full', classNames?.nav),
      nav_button: cn(
        'size-5 bg-transparent p-0 border rounded-md shadow-none flex items-center justify-center',
        classNames?.nav_button
      ),
      nav_button_previous: cn('', classNames?.nav_button_previous),
      nav_button_next: cn('', classNames?.nav_button_next),
      table: cn('w-full border-collapse', classNames?.table),
      head_row: cn('flex gap-1.5 body-2-reg', classNames?.head_row),
      head_cell: cn('body-2-reg rounded-md w-8 font-normal text-[0.8rem]', classNames?.head_cell),
      row: cn('flex w-full mt-2 gap-1.5', classNames?.row),
      cell: cn(
        'relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent',
        props.mode === 'range'
          ? '[&:has(>.day-range-end)]:rounded-r-md [&:has(>.day-range-start)]:rounded-l-md first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md'
          : '[&:has([aria-selected])]:rounded-md',
        classNames?.cell
      ),
      day: cn(
        'size-8 p-0 font-normal aria-selected:opacity-100 rounded-xl inline-flex items-center justify-center',
        classNames?.day
      ),
      day_range_start: cn('day-range-start', classNames?.day_range_start),
      day_range_end: cn('day-range-end', classNames?.day_range_end),
      day_selected: cn('focus:!bg-black focus:!text-white', classNames?.day_selected), // Keeping focus override for now
      day_today: cn('', classNames?.day_today), // Removed bg-accent text-accent-foreground, handled by scoped styles
      day_outside: cn('day-outside opacity-40', classNames?.day_outside),
      day_disabled: cn('opacity-50', classNames?.day_disabled),
      day_range_middle: cn(
        'aria-selected:bg-accent aria-selected:text-accent-foreground',
        classNames?.day_range_middle
      ),
      day_hidden: cn('invisible', classNames?.day_hidden),
    }),
    [classNames, props.mode]
  );

  return (
    <>
      {/* Use scoped styles instead of global */}
      <style jsx>{`
        /* Scoped styles for Calendar component */
        .calendarContainer :global(.rdp-day[aria-selected="true"]),
        .calendarContainer :global(button.rdp-day[aria-selected="true"]),
        .calendarContainer :global(.rdp-day_selected),
        .calendarContainer :global(button.rdp-day_selected) {
          background-color: ${CoreColors.Black} !important;
          color: ${CoreColors.White} !important;
          box-shadow: none !important;
        }

        .calendarContainer :global(.rdp-day_today[aria-selected="true"]),
        .calendarContainer :global(.rdp-day_today.rdp-day_selected) {
          color: ${CoreColors.White} !important;
          background-color: ${CoreColors.Black} !important;
        }

        .calendarContainer :global(.rdp-day_today[aria-selected="true"] *),
        .calendarContainer :global(.rdp-day_today.rdp-day_selected *) {
          color: ${CoreColors.White} !important;
        }

        .calendarContainer :global(.rdp-day[aria-selected="true"]:hover),
        .calendarContainer :global(button.rdp-day[aria-selected="true"]:hover),
        .calendarContainer :global(.rdp-day_selected:hover),
        .calendarContainer :global(button.rdp-day_selected:hover),
        .calendarContainer :global(.rdp-day_selected:focus),
        .calendarContainer :global(button.rdp-day_selected:focus) {
          background-color: ${CoreColors.Black} !important;
          color: ${CoreColors.White} !important;
          box-shadow: none !important;
        }

        .calendarContainer :global(.rdp-day:focus-visible),
        .calendarContainer :global(button.rdp-day:focus-visible),
        .calendarContainer :global(.rdp-day_selected:focus-visible),
        .calendarContainer :global(button.rdp-day_selected:focus-visible) {
          background-color: ${CoreColors.Black} !important;
          color: ${CoreColors.White} !important;
          outline: none !important;
          box-shadow: none !important;
        }

        .calendarContainer :global(button.rdp-day[aria-selected="true"]:hover),
        .calendarContainer :global(button.rdp-day[aria-selected="true"]:focus),
        .calendar-container :global(button.rdp-day_selected:hover),
        .calendarContainer :global(.rdp-day_selected:hover),
        .calendarContainer :global(button.rdp-day_selected:focus) {
          background-color: ${CoreColors.Black} !important;
          color: ${CoreColors.White} !important;
          box-shadow: none !important;
        }

        .calendarContainer :global(button.rdp-day:hover),
        .calendarContainer :global(button.rdp-day:hover:not([aria-selected="true"])),
        .calendarContainer :global(.rdp-day_today:hover),
        .calendarContainer :global(button.rdp-day:focus),
        .calendarContainer :global(.rdp-button:hover:not(:disabled):not([aria-selected="true"])) {
          background-color: ${Neutral.N100};
          color: inherit;
        }

        .captionLabel {
          ...${textStyles.body1Med}
        ;
          color: ${CoreColors.Black};
        }

        .headCell {
          ...${textStyles.body2Reg}
        ;
          color: ${Neutral.N400};
        }

        .day {
          ...${textStyles.body1Reg}
        ;
          color: ${CoreColors.Black};
        }

        .calendarContainer :global(.rdp-nav_button),
        .calendarContainer :global(.rdp-button),
        .calendarContainer :global(.rdp-day_range_start),
        .calendarContainer :global(.rdp-day_range_end) {
          font-family: ${textStyles.body1Reg.fontFamily || 'inherit'};
        }

        .dayToday {
          font-weight: ${textStyles.body1Med.fontWeight};
          color: ${Orange.O500} !important; /* Kept important for override */
        }

        /* Styles for .rdp-day_today when selected are handled by the global selectors above */

        .navButton {
          border-width: 1px;
          border-color: ${Neutral.N50};
          box-shadow: none;
          width: 16px;
          height: 16px;
        }

        .navButton:hover,
        .navButton:focus,
        .navButton:active {
          background-color: transparent;
          border-color: ${Neutral.N50};
        }

        .chevronIcon {
          stroke: ${Neutral.N400};
          stroke-width: 1.5px;
          color: ${Neutral.N400};
        }

        .navButton:hover .chevronIcon,
        .navButton:focus .chevronIcon,
        .navButton:active .chevronIcon,
        .chevronIcon:hover {
          stroke: ${Neutral.N400};
          color: ${Neutral.N400};
        }

        .dayOutside {
          color: ${Neutral.N400};
          opacity: 0.4;
        }

        .dayDisabled {
          color: ${Neutral.N400};
          opacity: 0.5;
        }

        /* Styles for selected day text color are handled by global selectors above */

      `}</style>
      <div className={cn('calendarContainer', className)}>
        {' '}
        {/* Added wrapper div */}
        <DayPicker
          showOutsideDays={showOutsideDays}
          fixedWeeks={true}
          // Remove className from DayPicker itself
          classNames={{
            ...combinedClassNames, // Spread the combined base classes
            // Map internal classes to scoped styles
            caption_label: cn(combinedClassNames.caption_label, 'captionLabel'),
            head_cell: cn(combinedClassNames.head_cell, 'headCell'),
            day: cn(combinedClassNames.day, 'day'),
            day_today: cn(combinedClassNames.day_today, 'dayToday'),
            day_outside: cn(combinedClassNames.day_outside, 'dayOutside'),
            day_disabled: cn(combinedClassNames.day_disabled, 'dayDisabled'),
            nav_button: cn(combinedClassNames.nav_button, 'navButton'),
          }}
          components={{
            Chevron: ({ className: iconClassName, orientation, ...iconProps }) => {
              const Icon = orientation === 'left' ? ChevronLeft : ChevronRight;
              return <Icon className={cn('size-3 chevronIcon', iconClassName)} {...iconProps} />;
            },
          }}
          {...props}
        />
      </div>
    </>
  );
}

export { Calendar };
