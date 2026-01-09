'use client';

import Link from 'next/link';
import { StudentAssignmentDetailView } from '@/lib/graphql/assignments';
import { textStyles } from '@/design-system/foundations/typography';
import { parseISO } from 'date-fns';
import { Kalam, Shantell_Sans } from 'next/font/google';

const shantell_Sans = Shantell_Sans({
  subsets: ['latin'],
  weight: ['400', '700'],
});

const kalam = Kalam({
  subsets: ['latin'],
  weight: ['400', '700'],
});

interface StudentAssignmentTableProps {
  assignments: StudentAssignmentDetailView[];
  variant: 'active' | 'past';
  loading?: boolean;
  activeLength: number; // Length of active assignments
  pastLength: number; // Length of past assignments
}

const isSubmissionLate = (assignment: StudentAssignmentDetailView): boolean => {
  const dueDate = assignment.assignment.dueDate;
  const submittedAt = assignment.submissionDetails?.submittedAt;

  if (!dueDate || !submittedAt) return false;

  try {
    const dueDateObj = parseISO(dueDate);
    const submittedAtObj = parseISO(submittedAt);
    return submittedAtObj > dueDateObj;
  } catch {
    return false;
  }
};

const getStatusDisplay = (assignment: StudentAssignmentDetailView) => {
  const submissionStatus = assignment.submissionDetails?.status;
  const score = assignment.submissionDetails?.score;
  const totalPoints = assignment.assignment.points;
  const isLate = isSubmissionLate(assignment);

  if (!submissionStatus || submissionStatus === 'TODO') {
    return { text: 'To Do', color: 'text-black', bgColor: '', isPill: false, isLate: false };
  }

  // Handle RETURNED submissions first (regardless of assignment status)
  if (submissionStatus === 'RETURNED') {
    // Check if assignment is graded or ungraded
    const isUngraded = assignment.assignment.gradeType === 'UNGRADED';

    if (isUngraded) {
      return {
        text: 'Completed',
        color: 'text-black font-semibold',
        bgColor: 'bg-green-50',
        isPill: false,
        isLate,
      };
    }

    // For graded assignments, show score or default to 0
    if (score !== null && score !== undefined && totalPoints) {
      return {
        text: `${score}/${totalPoints}`,
        color: 'text-black',
        bgColor: 'bg-green-50',
        isPill: false,
        isLate,
      };
    }

    // Default to 0 for graded assignments with no score
    return {
      text: `0/${totalPoints || 0}`,
      color: 'text-black',
      bgColor: 'bg-green-50',
      isPill: false,
      isLate,
    };
  }

  // Handle MISSED submissions for completed assignments
  if (submissionStatus === 'MISSED') {
    if (assignment.assignment.status === 'COMPLETED') {
      return {
        text: 'Missed',
        color: 'text-neutral-400',
        bgColor: 'bg-gray-50',
        isPill: false,
        isLate: false,
      };
    } else {
      return {
        text: 'Missed',
        color: 'text-neutral-400',
        bgColor: 'bg-red-50',
        isPill: false,
        isLate: false,
      };
    }
  }

  if (submissionStatus === 'UNDER_AI_EVALUATION') {
    return {
      text: 'In Review',
      color: 'text-neutral-400',
      bgColor: 'bg-orange-50',
      isPill: false,
      isLate: false,
    };
  }

  if (submissionStatus === 'IN_REVIEW') {
    return {
      text: 'In Review',
      color: 'text-neutral-400',
      bgColor: 'bg-orange-50',
      isPill: false,
      isLate: false,
    };
  }

  // Default fallback
  return { text: 'To Do', color: 'text-black', bgColor: '', isPill: false, isLate: false };
};

const formatDueDate = (dueDateStr?: string): string => {
  if (!dueDateStr) return '';

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueDate = new Date(dueDateStr);
  dueDate.setHours(0, 0, 0, 0);

  if (dueDate.getTime() === today.getTime()) return 'Today';

  const diffTime = dueDate.getTime() - today.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays <= 7 && diffDays > 0) {
    return dueDate.toLocaleDateString('en-US', { weekday: 'long' });
  }

  if (diffDays < 0) {
    const daysPast = Math.abs(diffDays);
    return `${daysPast} day${daysPast === 1 ? '' : 's'}`;
  }

  return dueDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
};

const getTypeLabel = (type: string) => {
  switch (type) {
    case 'WORKSHEET':
      return 'Worksheet';
    case 'TASK':
      return 'Task';
    case 'LIVE_QUIZ':
      return 'Live Quiz';
    default:
      return type;
  }
};

export function StudentAssignmentTable({
  assignments,
  variant,
  loading,
  activeLength,
  pastLength,
}: StudentAssignmentTableProps) {
  // Determine border radius and border classes based on variant and lengths
  const getBorderRadius = () => {
    if (variant === 'active') {
      // Active: top rounded always, bottom rounded only if no past assignments
      return pastLength === 0 ? 'rounded-[24px]' : 'rounded-t-[24px]';
    } else {
      // Past: bottom rounded always, top rounded only if no active assignments
      return activeLength === 0 ? 'rounded-[24px]' : 'rounded-b-[24px]';
    }
  };

  const getBorderClasses = () => {
    if (variant === 'active') {
      // Active: always has border, but no bottom border if past assignments exist
      return pastLength === 0 ? 'border border-gray-200' : 'border border-gray-200 border-b-0';
    } else {
      // Past: always has border, but no top border if active assignments exist
      return activeLength === 0 ? 'border border-gray-200' : 'border border-gray-200 border-t-0';
    }
  };

  if (loading) {
    return (
      <div
        className={`bg-white overflow-hidden max-w-3xl mx-auto ${getBorderClasses()} ${getBorderRadius()}`}
      >
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex space-x-4">
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                  <div className="h-4 bg-gray-200 rounded flex-1"></div>
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (assignments.length === 0) {
    return null;
  }

  const sectionTitle = variant === 'active' ? 'Active Assignments' : 'Past Assignments';

  // Sort assignments by due date (closest first for active, most recent first for past)
  const sortedAssignments = [...assignments].sort((a, b) => {
    const aDate = a.assignment.dueDate ? parseISO(a.assignment.dueDate) : new Date(0);
    const bDate = b.assignment.dueDate ? parseISO(b.assignment.dueDate) : new Date(0);

    if (variant === 'active') {
      // For active assignments, show closest due date first
      return aDate.getTime() - bDate.getTime();
    } else {
      // For past assignments, show most recent due date first
      return bDate.getTime() - aDate.getTime();
    }
  });

  const isAssignmentClickable = (assignment: StudentAssignmentDetailView) => {
    const submissionStatus = assignment.submissionDetails?.status;
    return !(
      submissionStatus === 'IN_REVIEW' ||
      submissionStatus === 'UNDER_AI_EVALUATION' ||
      submissionStatus === 'MISSED'
    );
  };

  return (
    <div className={`bg-white overflow-hidden ${getBorderClasses()} ${getBorderRadius()}`}>
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead
            className={`border-b border-gray-200 pt-6 ${
              variant === 'past' && activeLength > 0 ? 'border-t' : ''
            }`}
          >
            <tr>
              <th
                className="text-left py-3 pt-6 pl-8 w-36 text-neutral-400"
                style={textStyles.labelMono}
              >
                Due on
              </th>
              <th
                className="text-left py-3 pl-4 pt-6 text-neutral-400"
                style={textStyles.labelMono}
              >
                {sectionTitle}
              </th>
              <th
                className="text-start py-3 pt-6 pr-8 w-36 text-neutral-400"
                style={textStyles.labelMono}
              >
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sortedAssignments.map((assignment) => {
              const status = getStatusDisplay(assignment);
              const dueDate = formatDueDate(assignment.assignment.dueDate);
              const typeLabel = getTypeLabel(assignment.assignment.type);
              const isClickable = isAssignmentClickable(assignment);

              if (isClickable) {
                return (
                  <tr key={assignment.assignment.id} className="transition-colors hover:bg-gray-50">
                    {/* Due Date */}
                    <td className="py-4 pl-8">
                      <Link href={`/homework/${assignment.assignment.id}`}>
                        <span
                          className={`font-medium ${
                            dueDate === 'Today' ? 'text-orange-500' : 'text-black'
                          }`}
                          style={dueDate === 'Today' ? textStyles.body1Med : textStyles.body1Reg}
                        >
                          {dueDate}
                        </span>
                      </Link>
                    </td>

                    {/* Assignment Details */}
                    <td className="py-4 pl-4">
                      <Link href={`/homework/${assignment.assignment.id}`}>
                        <div>
                          <div className="text-gray-900 line-clamp-1" style={textStyles.body1Med}>
                            {assignment.assignment.title}
                          </div>
                          <div
                            className="text-neutral-500 flex items-center gap-2"
                            style={textStyles.body1Reg}
                          >
                            <span>{typeLabel}</span>
                            <span>•</span>
                            <span>{assignment.assignment.label || 'No subject'}</span>
                          </div>
                        </div>
                      </Link>
                    </td>

                    {/* Status */}
                    <td className="py-4 pr-8 text-start">
                      <Link href={`/homework/${assignment.assignment.id}`}>
                        {status.isPill ? (
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-semibold ${status.color} ${status.bgColor}`}
                            style={textStyles.body1Semi}
                          >
                            {status.isLate && (
                              <span
                                className={`mr-1 text-red-500 ${shantell_Sans.className}`}
                                style={textStyles.body1Reg}
                              >
                                {' '}
                                Late
                              </span>
                            )}
                            {status.text}
                          </span>
                        ) : (
                          <span className="inline-flex items-center">
                            {status.isLate && (
                              <span
                                className={`mr-1 text-red-500 ${shantell_Sans.className}`}
                                style={textStyles.body1Reg}
                              >
                                Late
                              </span>
                            )}
                            <span
                              className={`font-semibold ${status.color}`}
                              style={textStyles.body1Semi}
                            >
                              {status.text}
                            </span>
                          </span>
                        )}
                      </Link>
                    </td>
                  </tr>
                );
              }

              return (
                <tr key={assignment.assignment.id} className="cursor-default opacity-100">
                  {/* Due Date */}
                  <td className="py-4 pl-8">
                    <span
                      className={`font-medium ${
                        dueDate === 'Today' ? 'text-orange-500' : 'text-black'
                      }`}
                      style={dueDate === 'Today' ? textStyles.body1Med : textStyles.body1Reg}
                    >
                      {dueDate}
                    </span>
                  </td>

                  {/* Assignment Details */}
                  <td className="py-4 pl-4">
                    <div>
                      <div className="text-gray-900 line-clamp-1" style={textStyles.body1Med}>
                        {assignment.assignment.title}
                      </div>
                      <div
                        className="text-neutral-500 flex items-center gap-2"
                        style={textStyles.body1Reg}
                      >
                        <span>{typeLabel}</span>
                        <span>•</span>
                        <span>{assignment.assignment.label || 'No subject'}</span>
                      </div>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="py-4 pr-8 text-start">
                    {status.isPill ? (
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-semibold ${status.color} ${status.bgColor}`}
                        style={textStyles.body1Semi}
                      >
                        {status.isLate && (
                          <span
                            className={`mr-1 text-red-500 ${shantell_Sans.className}`}
                            style={textStyles.body1Reg}
                          >
                            {' '}
                            Late
                          </span>
                        )}
                        {status.text}
                      </span>
                    ) : (
                      <span className="inline-flex items-center">
                        {status.isLate && (
                          <span
                            className={`mr-1 text-red-500 ${shantell_Sans.className}`}
                            style={textStyles.body1Reg}
                          >
                            Late
                          </span>
                        )}
                        <span
                          className={`font-semibold ${status.color}`}
                          style={textStyles.body1Semi}
                        >
                          {status.text}
                        </span>
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
