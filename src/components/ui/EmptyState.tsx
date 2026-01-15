import { textStyles } from '@/design-system'
import { Neutral } from '@/design-system/foundations/colors'
import React from 'react'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({ 
  icon, 
  title, 
  description, 
  action, 
  className = '' 
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center flex-1 self-stretch justify-center py-16 px-6 ${className}`}>
      {/* Icon */}
      {icon && (
        <div className="mb-4 text-neutral-400">
          {icon}
        </div>
      )}
      
      {/* Title */}
      <p className="mb-2" style={{...textStyles.body2Reg, color: Neutral.N400}}>
        {title}
      </p>
      
      {/* Description */}
      {description && (
        <p className="text-sm text-neutral-500 text-center max-w-sm mb-6">
          {description}
        </p>
      )}
      
      {/* Action */}
      {action && (
        <div className="mt-4">
          {action}
        </div>
      )}
    </div>
  )
}

// Students icon component
export function StudentsIcon() {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- local SVG asset
    <img
      src="/assets/icons/nav_people.svg"
      alt="Students icon"
      width="32"
      height="32"
      className="text-neutral-300"
    />
  )
}

// Default empty state for students
export function StudentsEmptyState({ className = '' }: { className?: string }) {
  return (
    <EmptyState
      icon={<StudentsIcon />}
      title="No students found"
      className={className}
    />
  )
}
