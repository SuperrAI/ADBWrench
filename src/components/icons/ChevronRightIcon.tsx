import React from 'react'

interface ChevronRightIconProps {
    width?: number
    height?: number
    className?: string
    color?: string
}

export const ChevronRightIcon: React.FC<ChevronRightIconProps> = ({ 
    width = 16, 
    height = 16, 
    className = '',
    color = 'currentColor'
}) => {
    return (
        <svg 
            width={width} 
            height={height} 
            viewBox="0 0 16 16" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <path 
                d="M6 12L10 8L6 4" 
                stroke={color} 
                strokeWidth="1.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
            />
        </svg>
    )
}

export default ChevronRightIcon

