'use client';

import { Pill } from '@/design-system/components';
import { textStyles } from '@/design-system/foundations';
import Button from '@/design-system/components/Button';
import { useRouter } from 'next/navigation';

interface Assignment {
  type: string;
  label?: string;
  title: string;
  taskType?: string;
  points?: number;
  gradeType?: string;
  status?: string;
  assignedOn?: string;
}

interface StudentStatus {
  text: string;
  color: string;
}

interface DueDateInfo {
  daysUntil: string;
  month: string;
  day: string;
  isOverdue: boolean;
}

interface AssignmentHeaderProps {
  assignment: Assignment;
  isStudent: boolean;
  studentStatus: StudentStatus;
  dueDateInfo: DueDateInfo | null;
  viewMode: 'submissions' | 'instructions';
  setViewMode: (mode: 'submissions' | 'instructions') => void;
  getQuestionCount: () => number;
  assignmentId: string;
}

// Helper function to apply design system typography styles
const applyTypographyStyle = (style: any) => {
  return {
    fontFamily: style.fontFamily,
    fontSize: style.fontSize,
    lineHeight: style.lineHeight,
    fontWeight: style.fontWeight,
    letterSpacing: style.letterSpacing,
  };
};

export default function AssignmentHeader({
  assignment,
  isStudent,
  studentStatus,
  dueDateInfo,
  viewMode,
  setViewMode,
  getQuestionCount,
  assignmentId,
}: AssignmentHeaderProps) {
  const router = useRouter();

  const handleViewInstructions = () => {
    router.push(`/homework/${assignmentId}/instructions`);
  };
  return (
    <div className="bg-white rounded-[24px] rounded-b-none border-t border-l border-r border-neutral-200 p-8">
      <div className="flex justify-between items-start ">
        <div className="flex-1 pr-8">
          <p style={applyTypographyStyle(textStyles.body1Reg)} className="text-black">
            {assignment.type.charAt(0).toUpperCase() +
              assignment.type.slice(1).toLowerCase().replace('_', ' ')}{' '}
            to {assignment.label || ''}
          </p>
          <div
            style={{
              fontFamily: 'Ivy Presto Headline, serif',
              fontSize: '28px',
              fontWeight: 600,
              lineHeight: '36px',
              fontStyle: 'normal',
              textTransform: 'none',
              letterSpacing: 'normal',
              marginTop: '8px',
              marginBottom: '16px',
            }}
            className="text-black text-4xl font-semibold"
          >
            {assignment.title}
          </div>
          <div
            className={`flex items-center gap-0 ${viewMode === 'submissions' && assignment.type !== 'LIVE_QUIZ' ? 'mb-6' : 'mb-0'}`}
          >
            <div style={applyTypographyStyle(textStyles.body1Reg)} className="text-neutral-500">
              {(assignment.type === 'WORKSHEET' || assignment.type === 'LIVE_QUIZ') && (
                <>
                  {getQuestionCount()} {getQuestionCount() === 1 ? 'question' : 'questions'}
                  {/* Show bullet and marks - hide only for reviewed non-LIVE_QUIZ */}
                  {!(
                    isStudent &&
                    studentStatus.text === 'Reviewed' &&
                    assignment.type !== 'LIVE_QUIZ'
                  ) && (
                    <>
                      <span className="mx-2">•</span>
                      {assignment.points || 0} marks
                    </>
                  )}
                </>
              )}
              {assignment.type === 'TASK' && (
                <>
                  {assignment.taskType == 'WRITEUP' ? 'Write Up' : ''}
                  {assignment.taskType == 'FILE' ? 'File Submission' : ''}
                  {assignment.taskType == 'URL' ? 'URL Submission' : ''}
                  {/* Only show bullet and marks if assignment is not reviewed */}
                  {!(isStudent && studentStatus.text === 'Reviewed') && (
                    <>
                      <span className="mx-2">•</span>
                      {assignment.points || 0} marks
                    </>
                  )}
                </>
              )}
            </div>
            {/*Use the pill from design-system to show the submission status */}
            {isStudent && studentStatus.text !== 'To Do' && assignment?.type !== 'LIVE_QUIZ' && (
              <Pill label={studentStatus.text} variant="category" />
            )}
          </div>
          {/* Show status for students, view toggle for teachers */}
          {isStudent || !isStudent ? (
            <></>
          ) : (
            assignment.type !== 'LIVE_QUIZ' &&
            viewMode === 'submissions' && (
              <Button onClick={handleViewInstructions} variant="outline" size="medium">
                {assignment.type === 'TASK' ? 'View Task' : 'View Worksheet'}
              </Button>
            )
          )}
        </div>

        {dueDateInfo &&
          ((!isStudent && (
            <div
              className="flex items-center gap-4 min-w-[200px] justify-end"
              style={{ gap: '16px' }}
            >
              <div
                className={`px-3 pt-2 pb-2 rounded-xl text-center min-w-[60px] border-2 ${dueDateInfo.isOverdue ? 'border-red-500' : 'border-neutral-300'}`}
              >
                <div
                  style={applyTypographyStyle(textStyles.body2Semi)}
                  className="text-orange-500 mb-0.5"
                >
                  {dueDateInfo.month}
                </div>
                <div style={applyTypographyStyle(textStyles.body1Med)} className="text-black">
                  {dueDateInfo.day}
                </div>
              </div>
            </div>
          )) ||
            (isStudent &&
              (studentStatus.text === 'To Do' ||
                studentStatus.text === 'Reviewed' ||
                assignment.type === 'LIVE_QUIZ') &&
              (assignment?.status !== 'COMPLETED' || assignment.type === 'LIVE_QUIZ') && (
                <div
                  className="flex justify-end items-center gap-4 min-w-[200px]"
                  style={{ gap: '16px' }}
                >
                  <div className="text-right">
                    {assignment.type !== 'LIVE_QUIZ' && (
                      <>
                        <p
                          style={applyTypographyStyle(textStyles.body2Reg)}
                          className="text-neutral-500 mb-0.5 text-right"
                        >
                          {studentStatus.text === 'Reviewed'
                            ? ''
                            : dueDateInfo.isOverdue
                              ? `Overdue by `
                              : 'Due In'}
                        </p>
                        {studentStatus.text !== 'Reviewed' && (
                          <span
                            style={applyTypographyStyle(textStyles.body1Med)}
                            className={dueDateInfo.isOverdue ? 'text-black' : 'text-black'}
                          >
                            {dueDateInfo.daysUntil}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                  <div
                    className={`px-3 pt-2 pb-2 rounded-xl text-center min-w-[60px] border-2 ${
                      studentStatus.text === 'Reviewed'
                        ? 'border-neutral-300'
                        : dueDateInfo.isOverdue
                          ? 'border-red-500'
                          : 'border-neutral-300'
                    }`}
                  >
                    <div
                      style={applyTypographyStyle(textStyles.body2Semi)}
                      className="text-orange-500 mb-0.5"
                    >
                      {dueDateInfo.month}
                    </div>
                    <div style={applyTypographyStyle(textStyles.body1Med)} className="text-black">
                      {dueDateInfo.day}
                    </div>
                  </div>
                </div>
              )))}
      </div>
    </div>
  );
}
