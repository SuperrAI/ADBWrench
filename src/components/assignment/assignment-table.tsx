'use client';
import { format, parseISO, isToday } from 'date-fns';
import Link from 'next/link';
import { textStyles } from '@/design-system/foundations/typography';

interface AssignmentTableData {
  id: string;
  title: string;
  type: string;
  subject?: string;
  label?: string;
  points?: number;
  subjectClassroomId: string;
  dueDate?: string;
  assignedCount: number;
  completedCount: number;
  toReviewCount: number;
  awaitingCount: number;
  averageScore?: number;
  lateSubmissions?: number;
  missedCount?: number;
}

interface AssignmentTableProps {
  assignments: AssignmentTableData[];
  variant: 'active' | 'past';
  loading?: boolean;
  isStandalone?: boolean; // For when past assignments are shown without active assignments
  activeLength: number; // Length of active assignments
  pastLength: number; // Length of past assignments
}

const formatDueDate = (dateString?: string) => {
  if (!dateString) return '';

  try {
    const date = parseISO(dateString);
    if (isToday(date)) {
      return 'Today';
    }
    return format(date, 'd MMM');
  } catch {
    return '';
  }
};

const StatCell: React.FC<{
  value: number;
  icon: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error';
}> = ({ value, icon, variant = 'default' }) => {
  const colorClasses = {
    default: 'text-gray-600',
    success: 'text-green-600',
    warning: 'text-orange-600',
    error: 'text-red-600',
  };

  return (
    <div className={`flex items-center gap-2 ${colorClasses[variant]}`}>
      {icon}
      <span style={{ ...textStyles.body1Med, color: '#000000' }}>{value}</span>
    </div>
  );
};

export const AssignmentTable: React.FC<AssignmentTableProps> = ({
  assignments,
  variant,
  loading,
  isStandalone = false,
  activeLength,
  pastLength,
}) => {
  // Determine border radius and border classes based on variant and lengths
  const getBorderRadius = () => {
    if (isStandalone) return 'rounded-[24px]';

    if (variant === 'active') {
      // Active: top rounded always, bottom rounded only if no past assignments
      return pastLength === 0 ? 'rounded-[24px]' : 'rounded-t-[24px]';
    } else {
      // Past: bottom rounded always, top rounded only if no active assignments
      return activeLength === 0 ? 'rounded-[24px]' : 'rounded-b-[24px]';
    }
  };

  const getBorderClasses = () => {
    if (isStandalone) return 'border border-gray-200';

    if (variant === 'active') {
      // Active: always has border, but no bottom border if past assignments exist
      return pastLength === 0 ? 'border border-gray-200' : 'border border-gray-200 border-b-0';
    } else {
      // Past: always has border, but no top border if active assignments exist
      return activeLength === 0 ? 'border border-gray-200' : 'border border-gray-200 border-t-0';
    }
  };

  const containerClasses = `bg-white w-full ${getBorderClasses()} ${getBorderRadius()} ${isStandalone ? 'shadow-sm' : ''
    }`;

  const MobileStat = ({ label, value, icon }: { label: string; value: number | string; icon?: React.ReactNode }) => (
    <div className="rounded-xl border border-neutral-100 bg-neutral-50 px-4 py-3 flex flex-col gap-1">
      <span className="text-xs text-neutral-500">{label}</span>
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm font-semibold text-neutral-900">{value}</span>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className={containerClasses}>
        <div className="animate-pulse divide-y divide-gray-100">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="px-4 py-4 md:px-8">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                  <div className="h-3 bg-gray-200 rounded w-24"></div>
                </div>
                <div className="grid grid-cols-2 gap-4 md:flex md:gap-8">
                  {[...Array(4)].map((__, idx) => (
                    <div key={idx} className="h-4 bg-gray-200 rounded w-16"></div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (assignments.length === 0) {
    return (
      <div className={`${containerClasses} p-6 text-center`}>
        <p className="text-gray-500">
          {variant === 'active' ? 'No active assignments' : 'No past assignments'}
        </p>
      </div>
    );
  }

  return (
    <div className={containerClasses}>
      {/* Desktop header */}
      <div
        className="hidden border-b border-neutral-200 pl-8 pr-6 md:block"
        style={{ height: '72px' }}
      >
        <div
          className="grid gap-8"
          style={{
            gridTemplateColumns: '100px 1fr 120px 120px 120px 120px',
            ...textStyles.labelMono,
            color: '#A3A3A3',
            paddingTop: '32px',
            paddingBottom: '16px',
          }}
        >
          <div>Due on</div>
          <div className="truncate">
            {variant === 'active' ? 'Active Assignments' : 'Past Assignments'}
          </div>
          <div className="flex justify-start">
            {variant === 'active' ? 'Assigned' : 'Avg.score'}
          </div>
          <div className="flex justify-start">Completed</div>
          <div className="flex justify-start">{variant === 'active' ? 'To Review' : 'Lat.sub'}</div>
          <div className="flex justify-start">{variant === 'active' ? 'Awaiting' : 'Missed'}</div>
        </div>
      </div>

      {/* Mobile header */}
      <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3 md:hidden">
        <span className="text-sm font-semibold text-neutral-900">
          {variant === 'active' ? 'Active assignments' : 'Past assignments'}
        </span>
        <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">
          {variant === 'active' ? 'Overview' : 'Summary'}
        </span>
      </div>

      {/* Body */}
      <div>
        {assignments.map((assignment, index) => {
          const isLastRow = index === assignments.length - 1;
          const dueLabel = formatDueDate(assignment.dueDate);
          const averageScoreText =
            assignment.averageScore !== undefined && assignment.averageScore !== null
              ? assignment.points
                ? `${assignment.averageScore}/${assignment.points}`
                : `${assignment.averageScore}`
              : '-';
          const dueDateValue = assignment.dueDate ? parseISO(assignment.dueDate) : null;
          const isDueToday = dueDateValue ? isToday(dueDateValue) : false;
          const readableType = assignment.type
            ? assignment.type
              .replace('_', ' ')
              .toLowerCase()
              .replace(/^\w/, (c) => c.toUpperCase())
            : 'Task';
          const classroomLabel = assignment.label || '—';

          return (
            <Link
              key={assignment.id}
              href={`/homework/${assignment.id}`}
              className={`block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/10 ${!isLastRow ? 'border-b border-neutral-200' : ''
                }`}
            >
              <div className="px-4 py-4 transition-colors hover:bg-gray-50 md:px-8 md:py-5">
                {/* Desktop row */}
                <div
                  className="hidden items-center gap-8 md:grid"
                  style={{ gridTemplateColumns: '100px 1fr 120px 120px 120px 120px' }}
                >
                  <div>
                    <span
                      style={{
                        ...(isDueToday ? textStyles.body1Med : textStyles.body1Reg),
                        color: isDueToday ? '#F97316' : '#000000',
                      }}
                    >
                      {dueLabel}
                    </span>
                  </div>
                  <div className="min-w-0 space-y-0.5">
                    <div className="truncate" style={{ ...textStyles.body1Med, color: '#000000' }}>
                      {assignment.title}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="truncate" style={{ ...textStyles.body2Reg, color: '#737373' }}>
                        {readableType} • {classroomLabel}
                      </span>
                    </div>
                  </div>
                  {variant === 'active' ? (
                    <>
                      <div className="flex justify-start">
                        <StatCell
                          value={assignment.assignedCount}
                          icon={
                            <svg
                              width="22"
                              height="22"
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M13.4003 4.5H8.23366C7.09227 4.5 6.16699 5.40058 6.16699 6.51149V17.0718C6.16699 18.1828 7.09227 19.0833 8.23366 19.0833H17.017C18.1584 19.0833 19.0837 18.1828 19.0837 17.0718V10.0316M13.4003 4.5V8.02011C13.4003 9.13103 14.3256 10.0316 15.467 10.0316H19.0837M13.4003 4.5L19.0837 10.0316"
                                stroke="#000000"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          }
                        />
                      </div>
                      <div className="flex justify-start">
                        <StatCell
                          value={assignment.completedCount}
                          icon={
                            <svg
                              width="22"
                              height="22"
                              viewBox="0 0 20 20"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M4.5 11.3549C4.52864 11.6126 4.83102 11.978 4.94314 12.2343C5.13133 12.6644 5.43782 13.0505 5.64941 13.4737C5.83187 13.8386 6.00727 14.2 6.12025 14.5954C6.2923 15.1976 6.85725 14.1047 7.02039 13.9168C9.19406 11.4138 11.6754 8.96769 13.446 6.14794C13.7219 5.70846 14.0278 5.29597 14.3392 4.88083C14.4086 4.78832 14.6996 4.5 14.5954 4.5"
                                stroke="#059669"
                                strokeWidth="2"
                                strokeLinecap="round"
                              />
                            </svg>
                          }
                          variant="success"
                        />
                      </div>
                      <div className="flex justify-start">
                        <StatCell
                          value={assignment.toReviewCount}
                          icon={
                            <svg
                              width="20"
                              height="20"
                              viewBox="0 0 20 20"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M3.35514 15.6247C3.34336 15.824 3.50824 15.9889 3.70755 15.9772L6.83162 15.7926C7.23895 15.7685 7.62329 15.5958 7.91182 15.3073L16.5882 6.63092C16.9137 6.30548 16.9137 5.77785 16.5882 5.45241L13.8799 2.74408C13.5544 2.41864 13.0268 2.41864 12.7014 2.74408L4.02498 11.4205C3.73645 11.709 3.56379 12.0933 3.53972 12.5007L3.35514 15.6247Z"
                                stroke="#000000"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <path
                                d="M10.3291 5.71484C10.7292 6.05402 11.0498 6.49371 11.4108 6.87318C11.8956 7.38275 12.393 7.8791 12.9093 8.35633C13.1179 8.54915 13.3402 8.73161 13.5436 8.92937C13.5588 8.94412 13.6386 9.02973 13.6386 8.99678"
                                stroke="#000000"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          }
                          variant="warning"
                        />
                      </div>
                      <div className="flex justify-start">
                        <StatCell
                          value={assignment.awaitingCount}
                          icon={
                            <svg
                              width="20"
                              height="20"
                              viewBox="0 0 20 20"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M10.0677 2.51758L10.0337 4.10214"
                                stroke="#9CA3AF"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                              />
                              <path
                                d="M2.4834 9.97461H4.16138"
                                stroke="#9CA3AF"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                              />
                              <path
                                d="M15.9067 9.97461H17.5847"
                                stroke="#9CA3AF"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                              />
                              <path
                                d="M10.0337 15.8477C10.045 16.4381 10.0564 17.0286 10.0677 17.6191"
                                stroke="#9CA3AF"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                              />
                              <path
                                d="M5.03381 14.2637C4.91583 14.2804 4.72085 14.511 4.62818 14.5964C4.46905 14.743 4.3329 14.9265 4.19482 15.1027"
                                stroke="#9CA3AF"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                              />
                              <path
                                d="M14.2627 14.2637C14.6485 14.2637 15.1237 14.5914 15.3962 14.7594C15.5373 14.8464 15.9543 15.1075 15.9403 15.1026"
                                stroke="#9CA3AF"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                              />
                              <path
                                d="M14.229 5.77954C14.3244 5.75826 14.4329 5.4851 14.5022 5.36404C14.6325 5.13626 14.7244 4.82194 14.8616 4.60762C14.9101 4.53187 14.9182 4.46332 14.957 4.36791C14.9767 4.31975 15.0892 4.10156 15.0645 4.10156"
                                stroke="#9CA3AF"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                              />
                              <path
                                d="M4.19482 4.19531C4.58683 4.58732 5.36027 5.2423 5.36027 5.2423L5.8388 5.77988"
                                stroke="#9CA3AF"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                              />
                            </svg>
                          }
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-start">
                        <span style={{ ...textStyles.body1Med, color: '#000000' }}>
                          {averageScoreText}
                        </span>
                      </div>
                      <div className="flex justify-start">
                        <StatCell
                          value={assignment.completedCount}
                          icon={
                            <svg
                              width="22"
                              height="22"
                              viewBox="0 0 20 20"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M4.5 11.3549C4.52864 11.6126 4.83102 11.978 4.94314 12.2343C5.13133 12.6644 5.43782 13.0505 5.64941 13.4737C5.83187 13.8386 6.00727 14.2 6.12025 14.5954C6.2923 15.1976 6.85725 14.1047 7.02039 13.9168C9.19406 11.4138 11.6754 8.96769 13.446 6.14794C13.7219 5.70846 14.0278 5.29597 14.3392 4.88083C14.4086 4.78832 14.6996 4.5 14.5954 4.5"
                                stroke="#059669"
                                strokeWidth="2"
                                strokeLinecap="round"
                              />
                            </svg>
                          }
                          variant="success"
                        />
                      </div>
                      <div className="flex justify-start">
                        <StatCell
                          value={assignment.lateSubmissions || 0}
                          icon={
                            <svg
                              width="20"
                              height="20"
                              viewBox="0 0 20 20"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <circle
                                cx="10"
                                cy="10"
                                r="7.5"
                                stroke="#EF4444"
                                strokeWidth="2"
                                strokeLinecap="round"
                              />
                              <path
                                d="M8.55833 7.5C8.55833 8.23788 8.51145 8.96207 8.43765 9.6958C8.39726 10.0973 8.39497 10.5016 8.35384 10.9027C8.34914 10.9484 8.31051 11.1912 8.35384 11.2345C8.39025 11.2709 8.68684 11.2883 8.74606 11.3016C9.22989 11.4104 9.70579 11.5457 10.1876 11.6636C10.6554 11.7781 11.1516 11.8743 11.6056 12.0257"
                                stroke="#EF4444"
                                strokeWidth="2"
                                strokeLinecap="round"
                              />
                            </svg>
                          }
                          variant="error"
                        />
                      </div>
                      <div className="flex justify-start">
                        <StatCell
                          value={assignment.missedCount || 0}
                          icon={
                            <svg
                              width="20"
                              height="20"
                              viewBox="0 0 20 20"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M10.0677 2.51758L10.0337 4.10214"
                                stroke="#9CA3AF"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                              />
                              <path
                                d="M2.4834 9.97461H4.16138"
                                stroke="#9CA3AF"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                              />
                              <path
                                d="M15.9067 9.97461H17.5847"
                                stroke="#9CA3AF"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                              />
                              <path
                                d="M10.0337 15.8477C10.045 16.4381 10.0564 17.0286 10.0677 17.6191"
                                stroke="#9CA3AF"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                              />
                              <path
                                d="M5.03381 14.2637C4.91583 14.2804 4.72085 14.511 4.62818 14.5964C4.46905 14.743 4.3329 14.9265 4.19482 15.1027"
                                stroke="#9CA3AF"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                              />
                              <path
                                d="M14.2627 14.2637C14.6485 14.2637 15.1237 14.5914 15.3962 14.7594C15.5373 14.8464 15.9543 15.1075 15.9403 15.1026"
                                stroke="#9CA3AF"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                              />
                              <path
                                d="M14.229 5.77954C14.3244 5.75826 14.4329 5.4851 14.5022 5.36404C14.6325 5.13626 14.7244 4.82194 14.8616 4.60762C14.9101 4.53187 14.9182 4.46332 14.957 4.36791C14.9767 4.31975 15.0892 4.10156 15.0645 4.10156"
                                stroke="#9CA3AF"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                              />
                              <path
                                d="M4.19482 4.19531C4.58683 4.58732 5.36027 5.2423 5.36027 5.2423L5.8388 5.77988"
                                stroke="#9CA3AF"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                              />
                            </svg>
                          }
                        />
                      </div>
                    </>
                  )}
                </div>

                {/* Mobile row */}
                <div className="flex flex-col gap-4 md:hidden">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="text-base font-medium text-neutral-900">{assignment.title}</div>
                        <div className="text-sm text-neutral-500">
                          {readableType} • {classroomLabel}
                        </div>
                      </div>
                      {dueLabel && (
                        <span
                          className={`text-sm font-semibold ${isDueToday ? 'text-orange-500' : 'text-neutral-900'
                            }`}
                        >
                          {dueLabel}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {variant === 'active' ? (
                      <>
                        <MobileStat
                          label="Assigned"
                          value={assignment.assignedCount}
                          icon={
                            <svg
                              width="18"
                              height="18"
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M13.4003 4.5H8.23366C7.09227 4.5 6.16699 5.40058 6.16699 6.51149V17.0718C6.16699 18.1828 7.09227 19.0833 8.23366 19.0833H17.017C18.1584 19.0833 19.0837 18.1828 19.0837 17.0718V10.0316M13.4003 4.5V8.02011C13.4003 9.13103 14.3256 10.0316 15.467 10.0316H19.0837M13.4003 4.5L19.0837 10.0316"
                                stroke="#000000"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          }
                        />
                        <MobileStat
                          label="Completed"
                          value={assignment.completedCount}
                          icon={
                            <svg
                              width="18"
                              height="18"
                              viewBox="0 0 20 20"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M4.5 11.3549C4.52864 11.6126 4.83102 11.978 4.94314 12.2343C5.13133 12.6644 5.43782 13.0505 5.64941 13.4737C5.83187 13.8386 6.00727 14.2 6.12025 14.5954C6.2923 15.1976 6.85725 14.1047 7.02039 13.9168C9.19406 11.4138 11.6754 8.96769 13.446 6.14794C13.7219 5.70846 14.0278 5.29597 14.3392 4.88083C14.4086 4.78832 14.6996 4.5 14.5954 4.5"
                                stroke="#059669"
                                strokeWidth="2"
                                strokeLinecap="round"
                              />
                            </svg>
                          }
                        />
                        <MobileStat
                          label="To review"
                          value={assignment.toReviewCount}
                          icon={
                            <svg
                              width="18"
                              height="18"
                              viewBox="0 0 20 20"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M3.35514 15.6247C3.34336 15.824 3.50824 15.9889 3.70755 15.9772L6.83162 15.7926C7.23895 15.7685 7.62329 15.5958 7.91182 15.3073L16.5882 6.63092C16.9137 6.30548 16.9137 5.77785 16.5882 5.45241L13.8799 2.74408C13.5544 2.41864 13.0268 2.41864 12.7014 2.74408L4.02498 11.4205C3.73645 11.709 3.56379 12.0933 3.53972 12.5007L3.35514 15.6247Z"
                                stroke="#000000"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <path
                                d="M10.3291 5.71484C10.7292 6.05402 11.0498 6.49371 11.4108 6.87318C11.8956 7.38275 12.393 7.8791 12.9093 8.35633C13.1179 8.54915 13.3402 8.73161 13.5436 8.92937C13.5588 8.94412 13.6386 9.02973 13.6386 8.99678"
                                stroke="#000000"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          }
                        />
                        <MobileStat
                          label="Awaiting"
                          value={assignment.awaitingCount}
                          icon={
                            <svg
                              width="18"
                              height="18"
                              viewBox="0 0 20 20"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M10.0677 2.51758L10.0337 4.10214"
                                stroke="#9CA3AF"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                              />
                              <path
                                d="M2.4834 9.97461H4.16138"
                                stroke="#9CA3AF"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                              />
                              <path
                                d="M15.9067 9.97461H17.5847"
                                stroke="#9CA3AF"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                              />
                              <path
                                d="M10.0337 15.8477C10.045 16.4381 10.0564 17.0286 10.0677 17.6191"
                                stroke="#9CA3AF"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                              />
                              <path
                                d="M5.03381 14.2637C4.91583 14.2804 4.72085 14.511 4.62818 14.5964C4.46905 14.743 4.3329 14.9265 4.19482 15.1027"
                                stroke="#9CA3AF"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                              />
                              <path
                                d="M14.2627 14.2637C14.6485 14.2637 15.1237 14.5914 15.3962 14.7594C15.5373 14.8464 15.9543 15.1075 15.9403 15.1026"
                                stroke="#9CA3AF"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                              />
                              <path
                                d="M14.229 5.77954C14.3244 5.75826 14.4329 5.4851 14.5022 5.36404C14.6325 5.13626 14.7244 4.82194 14.8616 4.60762C14.9101 4.53187 14.9182 4.46332 14.957 4.36791C14.9767 4.31975 15.0892 4.10156 15.0645 4.10156"
                                stroke="#9CA3AF"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                              />
                              <path
                                d="M4.19482 4.19531C4.58683 4.58732 5.36027 5.2423 5.36027 5.2423L5.8388 5.77988"
                                stroke="#9CA3AF"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                              />
                            </svg>
                          }
                        />
                      </>
                    ) : (
                      <>
                        <MobileStat label="Avg. score" value={averageScoreText} />
                        <MobileStat
                          label="Completed"
                          value={assignment.completedCount}
                          icon={
                            <svg
                              width="18"
                              height="18"
                              viewBox="0 0 20 20"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M4.5 11.3549C4.52864 11.6126 4.83102 11.978 4.94314 12.2343C5.13133 12.6644 5.43782 13.0505 5.64941 13.4737C5.83187 13.8386 6.00727 14.2 6.12025 14.5954C6.2923 15.1976 6.85725 14.1047 7.02039 13.9168C9.19406 11.4138 11.6754 8.96769 13.446 6.14794C13.7219 5.70846 14.0278 5.29597 14.3392 4.88083C14.4086 4.78832 14.6996 4.5 14.5954 4.5"
                                stroke="#059669"
                                strokeWidth="2"
                                strokeLinecap="round"
                              />
                            </svg>
                          }
                        />
                        <MobileStat
                          label="Late sub."
                          value={assignment.lateSubmissions || 0}
                          icon={
                            <svg
                              width="18"
                              height="18"
                              viewBox="0 0 20 20"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <circle
                                cx="10"
                                cy="10"
                                r="7.5"
                                stroke="#EF4444"
                                strokeWidth="2"
                                strokeLinecap="round"
                              />
                              <path
                                d="M8.55833 7.5C8.55833 8.23788 8.51145 8.96207 8.43765 9.6958C8.39726 10.0973 8.39497 10.5016 8.35384 10.9027C8.34914 10.9484 8.31051 11.1912 8.35384 11.2345C8.39025 11.2709 8.68684 11.2883 8.74606 11.3016C9.22989 11.4104 9.70579 11.5457 10.1876 11.6636C10.6554 11.7781 11.1516 11.8743 11.6056 12.0257"
                                stroke="#EF4444"
                                strokeWidth="2"
                                strokeLinecap="round"
                              />
                            </svg>
                          }
                        />
                        <MobileStat
                          label="Missed"
                          value={assignment.missedCount || 0}
                          icon={
                            <svg
                              width="18"
                              height="18"
                              viewBox="0 0 20 20"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M10.0677 2.51758L10.0337 4.10214"
                                stroke="#9CA3AF"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                              />
                              <path
                                d="M2.4834 9.97461H4.16138"
                                stroke="#9CA3AF"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                              />
                              <path
                                d="M15.9067 9.97461H17.5847"
                                stroke="#9CA3AF"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                              />
                              <path
                                d="M10.0337 15.8477C10.045 16.4381 10.0564 17.0286 10.0677 17.6191"
                                stroke="#9CA3AF"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                              />
                              <path
                                d="M5.03381 14.2637C4.91583 14.2804 4.72085 14.511 4.62818 14.5964C4.46905 14.743 4.3329 14.9265 4.19482 15.1027"
                                stroke="#9CA3AF"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                              />
                              <path
                                d="M14.2627 14.2637C14.6485 14.2637 15.1237 14.5914 15.3962 14.7594C15.5373 14.8464 15.9543 15.1075 15.9403 15.1026"
                                stroke="#9CA3AF"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                              />
                              <path
                                d="M14.229 5.77954C14.3244 5.75826 14.4329 5.4851 14.5022 5.36404C14.6325 5.13626 14.7244 4.82194 14.8616 4.60762C14.9101 4.53187 14.9182 4.46332 14.957 4.36791C14.9767 4.31975 15.0892 4.10156 15.0645 4.10156"
                                stroke="#9CA3AF"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                              />
                              <path
                                d="M4.19482 4.19531C4.58683 4.58732 5.36027 5.2423 5.36027 5.2423L5.8388 5.77988"
                                stroke="#9CA3AF"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                              />
                            </svg>
                          }
                        />
                      </>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
