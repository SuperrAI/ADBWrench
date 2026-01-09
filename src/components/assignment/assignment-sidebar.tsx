import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

type AssignmentSidebarProps = {
  courseCode: string;
  title: string;
  maxMarks: number;
  assignmentTiming: string;
  dueDate: string;
  className?: string;
};

export function AssignmentSidebar({
  courseCode,
  title,
  maxMarks,
  assignmentTiming,
  dueDate,
  className,
}: AssignmentSidebarProps) {
  return (
    <div
      className={cn(
        'flex flex-col p-5 rounded-3xl border border-gray-200 bg-white w-full max-w-md',
        className
      )}
    >
      {/* Course code */}
      <div className="text-[#FF6F1E] font-medium mb-2">{courseCode}</div>

      {/* Title */}
      <h1 className="text-4xl font-bold mb-4">{title}</h1>

      {/* Instructions */}
      <div className="text-gray-400 mb-6">Add instructions...</div>

      {/* Attachment button */}
      <button className="flex items-center gap-2 text-gray-400 mb-10">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M21.4407 11.0208L12.0582 20.4033C10.9357 21.5258 9.40554 22.1395 7.83321 22.1395C6.26089 22.1395 4.73071 21.5258 3.60821 20.4033C2.48571 19.2808 1.87207 17.7506 1.87207 16.1783C1.87207 14.606 2.48571 13.0758 3.60821 11.9533L13.9407 1.62085C14.6982 0.863306 15.747 0.443359 16.8357 0.443359C17.9245 0.443359 18.9732 0.863306 19.7307 1.62085C20.4883 2.3784 20.9082 3.42719 20.9082 4.51585C20.9082 5.6045 20.4883 6.65329 19.7307 7.41085L10.2582 16.8833C9.87942 17.2621 9.35503 17.4721 8.81071 17.4721C8.26639 17.4721 7.74199 17.2621 7.36321 16.8833C6.98442 16.5045 6.77441 15.9801 6.77441 15.4358C6.77441 14.8915 6.98442 14.3671 7.36321 13.9883L15.9407 5.42085"
            stroke="#999999"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Attach
      </button>

      {/* Assignment details */}
      <div className="space-y-7">
        {/* Max marks */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-400">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="12" cy="12" r="10" stroke="#999999" strokeWidth="1.5" />
              <path
                d="M12 7.5V12L9 15"
                stroke="#999999"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Max. marks
          </div>
          <div className="text-black text-2xl font-bold">{maxMarks}</div>
        </div>

        {/* Assign */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-400">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="12" cy="12" r="10" stroke="#999999" strokeWidth="1.5" />
              <path
                d="M8 12H16"
                stroke="#999999"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M12 16V8"
                stroke="#999999"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Assign
          </div>
          <div className="text-black text-xl">{assignmentTiming}</div>
        </div>

        {/* Due date */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-400">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect x="3" y="6" width="18" height="15" rx="2" stroke="#999999" strokeWidth="1.5" />
              <path d="M3 10H21" stroke="#999999" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M8 3V7" stroke="#999999" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M16 3V7" stroke="#999999" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            Due on
          </div>
          <div className="text-black text-xl">{dueDate}</div>
        </div>
      </div>

      {/* Assign button */}
      <Button className="mt-12 w-full h-14 rounded-xl bg-black hover:bg-gray-800 text-white text-lg">
        Assign to 6A
      </Button>
    </div>
  );
}
