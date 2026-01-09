import React from 'react'
import { RefreshIcon } from '../icons'
import { Button, textStyles } from '@/design-system'
import { Red } from '@/design-system/foundations/colors'

interface ErrorStateProps {
  title?: string
  description?: string
  onRetry?: () => void
  retryText?: string
  className?: string
}

export function ErrorState({ 
  title = "Failed to load data",
  description,
  onRetry,
  retryText = "Retry",
  className = ''
}: ErrorStateProps) {
  return (
    <div className={`flex flex-col items-center flex-1 self-stretch justify-center py-16 px-6 ${className}`}>
      {/* Title */}
      <p className="mb-2" style={{...textStyles.body2Reg, color: Red.R600}}>
        {title}
      </p>
      
      {/* Description */}
      {description && (
        <p className="text-center max-w-sm mb-6" >
          {description}
        </p>
      )}
      
      {/* Retry Button */}
      {onRetry && (
        <Button
          onClick={onRetry}
          icon={<RefreshIcon width={18} height={18} />}
          variant="warning"
          size="small"
          shape="rounded"
          className="text-red-600 !p-2 !px-4 border border-red-600 bg-red-50"
        >
          {retryText}
        </Button>
      )}
    </div>
  )
}
