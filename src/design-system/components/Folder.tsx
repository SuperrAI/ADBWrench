import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { textStyles } from '@/design-system/foundations/typography';
import { CheckCircleFilled } from '@/components/icons';

export interface FolderProps {
  name: string;
  onClick?: (e?: React.MouseEvent) => void;
  files?: string[];
  fileCount?: number;
  isLoading?: boolean;
  hideItemCount?: boolean;
  isSelected?: boolean;
  onContextMenu?: (e: React.MouseEvent) => void;
  hasActiveContextMenu?: boolean;
}

const getFileColor = (fileName: string) => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'pdf':
      return '#EF4444'; // red
    case 'docx':
    case 'doc':
      return '#3B82F6'; // blue
    case 'xlsx':
    case 'xls':
      return '#10B981'; // green
    case 'pptx':
    case 'ppt':
      return '#F97316'; // orange
    case 'txt':
      return '#6B7280'; // gray
    case 'png':
    case 'jpg':
    case 'jpeg':
      return '#8B5CF6'; // purple
    case 'mp4':
    case 'mov':
      return '#EC4899'; // pink
    case 'zip':
    case 'rar':
      return '#F59E0B'; // yellow
    default:
      return '#6B7280'; // gray
  }
};

export const Folder = React.forwardRef<HTMLDivElement, FolderProps>(
  ({ name, onClick, files = [], fileCount, isLoading = false, hideItemCount = false, isSelected = false, onContextMenu, hasActiveContextMenu = false }, ref) => {
    const [isHovered, setIsHovered] = useState(false);

    // Enhanced paper positions with spring animation values - increased upward movement (disabled when context menu is active)
    const paper1Y = onClick && isHovered && !hasActiveContextMenu ? -10 : 0; // Significantly increased movement
    const paper2Y = onClick && isHovered && !hasActiveContextMenu ? -8 : 0; // Significantly increased movement

    // More pronounced spring animation with stronger bounce
    const bouncySpring = 'cubic-bezier(0.05, 0.9, 0.1, 1.8)'; // Extremely springy bounce effect

    // Update the transition styles for both papers (disabled when context menu is active)
    const hoverAnimation = hasActiveContextMenu ? '' : `transition-all duration-400 ease-[${bouncySpring}] transform hover:-translate-y-1 will-change-transform`;

    return (
      <div ref={ref} className="relative">
        <div
          className={cn(
            'relative overflow-visible rounded-xl',
            onClick && 'cursor-pointer',
            onClick && hoverAnimation,
            isSelected && 'ring-2 ring-black'
          )}
          onMouseEnter={() => onClick && !hasActiveContextMenu && setIsHovered(true)}
          onMouseLeave={() => onClick && setIsHovered(false)}
          onClick={onClick}
          onContextMenu={onContextMenu}
          style={{
            aspectRatio: '176/148',
            width: '100%',
            display: 'flex',
            overflow: 'visible',
            alignItems: 'flex-end', // Align folder to bottom
          }}
        >
          <div className="relative w-full text-white">
            <svg
              className="w-full h-full"
              viewBox="0 52 176 148"
              preserveAspectRatio="xMidYMid meet"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <filter id="grain">
                  <feTurbulence
                    type="fractalNoise"
                    baseFrequency="4"
                    numOctaves="8"
                    seed="2"
                    stitchTiles="stitch"
                    result="noise"
                  />
                  <feColorMatrix
                    type="matrix"
                    values="1 0 0 0 0
                            0 1 0 0 0
                            0 0 1 0 0
                            0 0 0 0.7 0"
                    in="noise"
                    result="coloredNoise"
                  />
                  <feComposite
                    operator="in"
                    in="coloredNoise"
                    in2="SourceGraphic"
                    result="monoNoise"
                  />
                  <feBlend mode="overlay" in="monoNoise" in2="SourceGraphic" />
                </filter>

                <filter id="secondaryGrain">
                  <feTurbulence
                    type="turbulence"
                    baseFrequency="5"
                    numOctaves="6"
                    seed="3"
                    stitchTiles="stitch"
                    result="noise2"
                  />
                  <feColorMatrix
                    type="matrix"
                    values="1 0 0 0 0
                            0 1 0 0 0
                            0 0 1 0 0
                            0 0 0 0.6 0"
                    in="noise2"
                    result="coloredNoise2"
                  />
                  <feComposite operator="in" in="coloredNoise2" in2="SourceGraphic" />
                  <feBlend mode="overlay" in2="SourceGraphic" />
                </filter>

                <filter id="fineGrain">
                  <feTurbulence
                    type="fractalNoise"
                    baseFrequency="6"
                    numOctaves="4"
                    seed="5"
                    stitchTiles="stitch"
                    result="noise3"
                  />
                  <feColorMatrix
                    type="matrix"
                    values="1 0 0 0 0
                            0 1 0 0 0
                            0 0 1 0 0
                            0 0 0 0.4 0"
                    in="noise3"
                    result="coloredNoise3"
                  />
                  <feComposite operator="in" in="coloredNoise3" in2="SourceGraphic" />
                  <feBlend mode="soft-light" in2="SourceGraphic" />
                </filter>
              </defs>

              {/* back part of folder - aligned to bottom */}
              <path
                d="M176 136V21C176 14.3726 170.627 9 164 9H83.4733C81.204 9 79.0415 8.03626 77.5243 6.34878L74.1998 2.65122C72.6826 0.963736 70.5201 0 68.2508 0H34.9216C32.6523 0 30.4898 0.963737 28.9726 2.65122L25.6481 6.34878C24.1309 8.03626 21.9684 9 19.6991 9H12C5.37258 9 0 14.3726 0 21V136C0 142.627 5.37258 148 12 148H164C170.627 148 176 142.627 176 136Z"
                fill="#906B4C"
                filter="url(#grain) url(#secondaryGrain) url(#fineGrain)"
                transform="translate(0 52)"
              />

              {/* Only show papers if there are files */}
              {files.length > 0 && (
                <>
                  {/* First paper with file name */}
                  <g
                    transform={`rotate(-6 18 58) translate(0 ${paper1Y})`}
                    style={
                      onClick
                        ? {
                          transition: `transform 0.3s ${bouncySpring}`,
                        }
                        : undefined
                    }
                  >
                    <rect
                      x="10"
                      y="67"
                      width="125"
                      height="88"
                      rx="8"
                      fill="white"
                      stroke="#E5E5E5"
                      strokeWidth="1"
                      filter="drop-shadow(0 2px 2px rgba(0, 0, 0, 0.1))"
                    />
                    <text x="19" y="89" fill="#6B7280" fontSize="12px">
                      {/* File type on first line - lighter */}
                      <tspan className="text-[6px] uppercase font-medium" fill="#9CA3AF">
                        {files[0]?.split('.').pop() || 'PDF'}
                      </tspan>
                      {/* File name on second line - darker and bolder */}
                      <tspan
                        x="19"
                        dy="20"
                        fontSize="14px"
                        className="text-[6px] font-medium"
                        fill="#4B5563"
                      >
                        {files[0]?.split('.')[0] || 'Document'}
                      </tspan>
                    </text>
                  </g>

                  {/* Second paper with file name */}
                  <g
                    transform={`translate(0 ${paper2Y})`}
                    style={
                      onClick
                        ? {
                          transition: `transform 0.3s ${bouncySpring}`,
                        }
                        : undefined
                    }
                  >
                    <rect
                      x="45"
                      y="68"
                      width="125"
                      height="88"
                      rx="8"
                      fill="white"
                      stroke="#E5E5E5"
                      strokeWidth="1"
                      filter="drop-shadow(0 2px 3px rgba(0, 0, 0, 0.15))"
                    />
                    <text x="55" y="87" fill="#6B7280" fontSize="12px">
                      {/* File type on first line - lighter */}
                      <tspan className="text-[6px] uppercase font-medium" fill="#9CA3AF">
                        {files[1]?.split('.').pop() || 'DOCX'}
                      </tspan>
                      {/* File name on second line - darker and bolder */}
                      <tspan
                        x="55"
                        dy="20"
                        fontSize="14px"
                        className="text-[6px] font-medium"
                        fill="#4B5563"
                      >
                        {files[1]?.split('.')[0] || 'Notes'}
                      </tspan>
                    </text>
                  </g>
                </>
              )}

              {/* front part of folder - lighter color, aligned to bottom */}
              <path
                d="M0 8C0 3.58172 3.58172 0 8 0H19.2563C21.7789 0 24.1537 1.18982 25.664 3.21035L28.9567 7.61534C30.467 9.63587 32.8418 10.8257 35.3644 10.8257H67.808C70.3306 10.8257 72.7055 9.63587 74.2158 7.61534L77.5084 3.21035C79.0187 1.18982 81.3935 0 83.9161 0H168C172.418 0 176 3.58172 176 8V106C176 112.627 170.627 118 164 118H12C5.37258 118 0 112.627 0 106V8Z"
                fill="#B48E63"
                filter="url(#grain) url(#secondaryGrain) url(#fineGrain)"
                transform="translate(0 82)"
              />
            </svg>

            {/* Overlay HTML elements for better text handling */}
            <div className="absolute bottom-0 left-0 w-full p-4 pb-4">
              {/* Item count - updated with typography */}
              {!hideItemCount && (
                <div
                  style={{
                    ...textStyles.labelSansSemi,
                    color: '#D6AD84',
                    marginBottom: '4px',
                  }}
                >
                  {isLoading ? (
                    <span className="animate-pulse">...</span>
                  ) : (
                    `${(fileCount ?? files.length) || 0} ${(fileCount ?? files.length) === 1 ? 'item' : 'items'}`
                  )}
                </div>
              )}

              {/* Folder name with proper truncation - updated with typography */}
              <div
                style={{
                  ...textStyles.body2Med,
                  color: '#FFFFFF',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  width: 'calc(100% - 32px)', // Full width minus padding
                }}
              >
                {name}
              </div>
            </div>
          </div>
        </div>
        {isSelected && (
          <div className="absolute bottom-2 right-2 z-10">
            <CheckCircleFilled width={24} height={24} />
          </div>
        )}
      </div>
    );
  }
);

Folder.displayName = 'Folder';

export default Folder;
