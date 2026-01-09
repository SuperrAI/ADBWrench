import React, { useEffect, useRef, useState } from 'react';
import { CoreColors, Neutral, Orange } from '@/design-system/foundations/colors';
import { textStyles } from '@/design-system/foundations/typography';
import { cn } from '@/lib/utils';

interface ScrollPillProps {
  currentPage: number;
  totalPages: number;
}

const ScrollPill: React.FC<ScrollPillProps> = ({ currentPage, totalPages }) => {
  const progress = (currentPage / totalPages) * 100;
  const circumference = 2 * Math.PI * 9; // radius is 9 to match original orange circle
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div
      className="absolute flex items-center gap-3"
      style={{
        left: '12px',
        bottom: '12px',
        height: '40px',
        borderRadius: '100px',
        backgroundColor: CoreColors.Black,
        border: `1px solid ${Neutral.N900}`,
        padding: '4px 16px 4px 12px',
        zIndex: 10,
        ...textStyles.body2Med,
        color: CoreColors.White,
      }}
    >
      <span>
        Page {currentPage} of {totalPages}
      </span>
      <div className="relative flex items-center justify-center">
        <svg width="28" height="28" className="transform rotate-0">
          {/* Background circle */}
          <circle cx="14" cy="14" r="9" stroke={Neutral.N700} strokeWidth="3" fill="none" />
          {/* Progress circle */}
          <circle
            cx="14"
            cy="14"
            r="9"
            stroke={Orange.O800}
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{
              transition: 'stroke-dashoffset 0.3s ease-in-out',
            }}
          />
        </svg>
      </div>
    </div>
  );
};

interface VideoTimestampProps {
  currentTime: number;
  duration: number;
  isPlaying?: boolean;
  onPlayPause?: () => void;
}

const VideoTimestamp: React.FC<VideoTimestampProps> = ({
  currentTime,
  duration,
  isPlaying = false,
  onPlayPause,
}) => {
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className="absolute flex items-center"
      style={{ left: '12px', bottom: '12px', gap: '8px' }}
    >
      <div
        className="flex items-center justify-center"
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '12px',
          border: `1px solid ${Neutral.N300}`,
          backgroundColor: CoreColors.White,
          zIndex: 10,
          cursor: 'pointer',
        }}
        onClick={onPlayPause}
      >
        {isPlaying ? (
          <svg
            width="28"
            height="28"
            viewBox="0 0 28 28"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M17.791 7.875V20.125"
              stroke="black"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M10.209 7.875V20.125"
              stroke="black"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          <svg
            width="26"
            height="28"
            viewBox="0 0 26 28"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M17.848 15.3416C18.9535 14.7889 18.9535 13.2111 17.848 12.6584L8.63957 8.05416C7.64222 7.55548 6.46875 8.28073 6.46875 9.3958V18.6042C6.46875 19.7193 7.64222 20.4445 8.63957 19.9458L17.848 15.3416Z"
              stroke="black"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>

      <div
        className="flex items-center justify-center"
        style={{
          width: '105px',
          height: '40px',
          borderRadius: '12px',
          border: `1px solid ${Neutral.N300}`,
          backgroundColor: CoreColors.White,
          zIndex: 10,
          ...textStyles.body2Med,
          color: CoreColors.Black,
          padding: '0 8px',
        }}
      >
        <span>
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>
    </div>
  );
};

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  children: React.ReactNode;
  className?: string;
  hasMultipleAttachments?: boolean;
  zoomLevel?: number;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onZoomChange?: (zoomLevel: number) => void;
  onDownload?: () => void;
  fileType?: 'image' | 'file' | 'pdf' | 'video';
  fileName?: string;
  pdfUrl?: string;
  imageUrl?: string;
  videoUrl?: string;
  currentPage?: number;
  totalPages?: number;
  volume?: number;
  onVolumeChange?: (volume: number) => void;
  currentTime?: number;
  duration?: number;
  isPlaying?: boolean;
  onPlayPause?: () => void;
  onTimeUpdate?: (time: number) => void;
  onPdfScroll?: (e: React.UIEvent<HTMLDivElement>) => void;
  showHeader?: boolean;
}

const PlayPauseOverlay: React.FC<{ isPlaying: boolean; show: boolean }> = ({ isPlaying, show }) => {
  return (
    <div
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
      style={{
        opacity: show ? 1 : 0,
        transition: 'opacity 0.2s ease-in-out',
        zIndex: 5,
      }}
    >
      {isPlaying ? (
        <svg
          width="46"
          height="46"
          viewBox="0 0 46 46"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect x="0.5" y="0.5" width="45" height="45" rx="22.5" fill="white" />
          <rect x="0.5" y="0.5" width="45" height="45" rx="22.5" stroke="#E5E5E5" />
          <path
            d="M27.0625 16.4375V29.5625"
            stroke="black"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M18.9375 16.4375V29.5625"
            stroke="black"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <div style={{ transform: 'translateX(1px)' }}>
          <svg
            width="46"
            height="46"
            viewBox="0 0 46 46"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect x="0.5" y="0.5" width="45" height="45" rx="22.5" fill="white" />
            <rect x="0.5" y="0.5" width="45" height="45" rx="22.5" stroke="#E5E5E5" />
            <g transform="translate(10, 8)">
              <svg
                width="30"
                height="30"
                viewBox="0 0 30 30"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect width="30" height="30" fill="white" />
                <path
                  d="M19.3606 16.725C20.7821 16.0142 20.7821 13.9858 19.3606 13.275L9.9766 8.58303C8.69429 7.94187 7.18555 8.87433 7.18555 10.308V19.692C7.18555 21.1257 8.69429 22.0581 9.9766 21.417L19.3606 16.725Z"
                  fill="black"
                />
              </svg>
            </g>
          </svg>
        </div>
      )}
    </div>
  );
};

export const PreviewModal = React.forwardRef<HTMLDivElement, PreviewModalProps>(
  (
    {
      isOpen,
      onClose,
      onNext,
      onPrevious,
      children,
      className,
      hasMultipleAttachments = false,
      zoomLevel = 100,
      onZoomIn,
      onZoomOut,
      onZoomChange,
      onDownload,
      fileType = 'image',
      fileName,
      pdfUrl,
      imageUrl,
      videoUrl,
      currentPage = 1,
      totalPages = 1,
      volume = 1,
      onVolumeChange,
      currentTime,
      duration,
      isPlaying = false,
      onPlayPause,
      onTimeUpdate,
      onPdfScroll,
      showHeader = false,
    },
    ref
  ) => {
    if (!isOpen) return null;

    const handleDownload = async () => {
      if (onDownload) {
        onDownload();
        return;
      }

      try {
        let url = '';
        if (fileType === 'pdf' && pdfUrl) {
          url = pdfUrl;
        } else if (fileType === 'image' && imageUrl) {
          url = imageUrl;
        } else if (fileType === 'video' && videoUrl) {
          url = videoUrl;
        }

        if (!url) return;

        const response = await fetch(url);
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download =
          fileName ||
          `download.${fileType === 'pdf' ? 'pdf' : fileType === 'video' ? 'mp4' : 'jpg'}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
      } catch (error) {
        console.error('Error downloading file:', error);
      }
    };

    // Calculate slider position based on zoom level
    // Zoom range: 100% to 200%
    const minZoom = 100;
    const maxZoom = 200;
    const sliderRange = 69; // Width of the slider track
    const sliderPosition = ((zoomLevel - minZoom) / (maxZoom - minZoom)) * sliderRange;

    // Calculate slider position based on volume (0 to 1)
    const volumeSliderRange = 69; // Width of the slider track
    const volumeSliderPosition = volume * volumeSliderRange;

    const [showOverlay, setShowOverlay] = useState(false);
    const overlayTimeoutRef = useRef<NodeJS.Timeout>();

    // State to track if zoom slider is being dragged (for sync fix)
    const [isSliderDragging, setIsSliderDragging] = useState(false);

    // Pan state for drag-to-pan when zoomed
    const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const panStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

    // Reset pan position when zoom returns to 100%
    useEffect(() => {
      if (zoomLevel <= 100) {
        setPanPosition({ x: 0, y: 0 });
      }
    }, [zoomLevel]);

    // Reset pan position when modal opens/closes or file changes
    useEffect(() => {
      setPanPosition({ x: 0, y: 0 });
    }, [isOpen, imageUrl]);

    // Ref for image container
    const imageContainerRef = useRef<HTMLDivElement>(null);

    const handleVideoClick = () => {
      if (onPlayPause) {
        onPlayPause();
      }

      // Show the overlay immediately
      setShowOverlay(true);

      // Clear any existing timeout
      if (overlayTimeoutRef.current) {
        clearTimeout(overlayTimeoutRef.current);
      }

      // Set new timeout to hide overlay
      overlayTimeoutRef.current = setTimeout(() => {
        setShowOverlay(false);
      }, 1000);
    };

    useEffect(() => {
      return () => {
        if (overlayTimeoutRef.current) {
          clearTimeout(overlayTimeoutRef.current);
        }
      };
    }, []);

    // Handle scroll-based zoom for images, and Escape key to close
    useEffect(() => {
      const handleWheel = (e: WheelEvent) => {
        // Only enable scroll zoom for images (not PDFs, videos, or other files)
        if (fileType !== 'image') return;

        // Prevent default scroll behavior
        e.preventDefault();

        // Determine zoom direction based on scroll
        if (e.deltaY < 0) {
          // Scroll up - zoom in
          if (onZoomIn && zoomLevel < 200) {
            onZoomIn();
          }
        } else if (e.deltaY > 0) {
          // Scroll down - zoom out
          if (onZoomOut && zoomLevel > 100) {
            onZoomOut();
          }
        }
      };

      const handleKeyDown = (e: KeyboardEvent) => {
        // Close modal on Escape key
        if (e.key === 'Escape') {
          onClose();
        }
      };

      if (isOpen) {
        // Add event listeners to the document when modal is open
        document.addEventListener('wheel', handleWheel, { passive: false });
        document.addEventListener('keydown', handleKeyDown);
      }

      return () => {
        // Clean up event listeners when modal closes or component unmounts
        document.removeEventListener('wheel', handleWheel);
        document.removeEventListener('keydown', handleKeyDown);
      };
    }, [isOpen, fileType, zoomLevel, onZoomIn, onZoomOut, onClose]);

    const renderContent = () => {
      if (fileType === 'pdf' && pdfUrl) {
        return (
          <div
            className="flex items-center justify-center bg-white"
            style={{
              minWidth: '1260px',
              height: 'calc(100vh - 200px)',
              borderRadius: '16px',
              margin: '68px 0',
              overflow: 'hidden',
              backgroundColor: 'white',
            }}
          >
            <div
              className="w-full h-full rounded-2xl border border-neutral-400 bg-white"
              style={{
                maxWidth: '1260px',
                maxHeight: 'calc(100vh - 200px)',
                backgroundColor: 'white',
              }}
            >
              <iframe
                src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0&statusbar=0&messages=0&view=FitH&pagemode=none`}
                className="w-full h-full rounded-2xl bg-white"
                style={{
                  border: 'none',
                  background: 'white',
                }}
                sandbox="allow-same-origin allow-scripts"
              />
            </div>
          </div>
        );
      }
      return children;
    };

    return (
      <div
        ref={ref}
        className={cn(
          'fixed inset-0 z-50 flex bg-white',
          showHeader ? 'flex-col' : 'items-center justify-center',
          className
        )}
        style={{
          backgroundColor: 'white',
        }}
      >
        {/* Header with File Name - Only shown when showHeader is true */}
        {showHeader && (
          <div
            className="flex items-center justify-center border-b border-neutral-200 bg-white"
            style={{
              height: '64px',
              minHeight: '64px',
              position: 'relative',
              zIndex: 11,
            }}
          >
            <h2
              className="text-neutral-950 font-medium truncate px-20"
              style={{
                ...textStyles.body1Med,
                maxWidth: '80%',
              }}
            >
              {fileName || 'Preview'}
            </h2>
          </div>
        )}

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute w-[42px] h-[42px] flex items-center justify-center z-20"
          aria-label="Close preview"
          style={{
            top: '11px',
            right: '12px',
          }}
        >
          <svg
            width="42"
            height="42"
            viewBox="0 0 42 42"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g filter="url(#filter0_d_2187_1504)">
              <rect x="1" width="40" height="40" rx="12" fill="white" />
              <rect x="1.5" y="0.5" width="39" height="39" rx="11.5" stroke="#D4D4D4" />
              <path
                d="M25.375 15.625L16.625 24.375"
                stroke="black"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M16.625 15.625L25.375 24.375"
                stroke="black"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
            <defs>
              <filter
                id="filter0_d_2187_1504"
                x="0.5"
                y="0"
                width="41"
                height="41.5"
                filterUnits="userSpaceOnUse"
                colorInterpolationFilters="sRGB"
              >
                <feFlood floodOpacity="0" result="BackgroundImageFix" />
                <feColorMatrix
                  in="SourceAlpha"
                  type="matrix"
                  values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                  result="hardAlpha"
                />
                <feMorphology
                  radius="0.5"
                  operator="erode"
                  in="SourceAlpha"
                  result="effect1_dropShadow_2187_1504"
                />
                <feOffset dy="1" />
                <feGaussianBlur stdDeviation="0.5" />
                <feComposite in2="hardAlpha" operator="out" />
                <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.08 0" />
                <feBlend
                  mode="normal"
                  in2="BackgroundImageFix"
                  result="effect1_dropShadow_2187_1504"
                />
                <feBlend
                  mode="normal"
                  in="SourceGraphic"
                  in2="effect1_dropShadow_2187_1504"
                  result="shape"
                />
              </filter>
            </defs>
          </svg>
        </button>

        {/* Navigation Buttons - Only show when there are multiple attachments */}
        {hasMultipleAttachments && (
          <>
            {/* Left Chevron - Only show if onPrevious is available */}
            {onPrevious && (
              <button
                onClick={onPrevious}
                className="absolute w-[42px] h-[42px] flex items-center justify-center z-10"
                aria-label="Previous"
                style={{
                  left: '20px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                }}
              >
                <svg
                  width="42"
                  height="42"
                  viewBox="0 0 42 42"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <g filter="url(#filter0_d_2187_1551)">
                    <rect x="1" width="40" height="40" rx="12" fill="white" />
                    <rect x="1.5" y="0.5" width="39" height="39" rx="11.5" stroke="#D4D4D4" />
                    <path
                      d="M22 16L18 20L22 24"
                      stroke="black"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </g>
                  <defs>
                    <filter
                      id="filter0_d_2187_1551"
                      x="0.5"
                      y="0"
                      width="41"
                      height="41.5"
                      filterUnits="userSpaceOnUse"
                      colorInterpolationFilters="sRGB"
                    >
                      <feFlood floodOpacity="0" result="BackgroundImageFix" />
                      <feColorMatrix
                        in="SourceAlpha"
                        type="matrix"
                        values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                        result="hardAlpha"
                      />
                      <feMorphology
                        radius="0.5"
                        operator="erode"
                        in="SourceAlpha"
                        result="effect1_dropShadow_2187_1551"
                      />
                      <feOffset dy="1" />
                      <feGaussianBlur stdDeviation="0.5" />
                      <feComposite in2="hardAlpha" operator="out" />
                      <feColorMatrix
                        type="matrix"
                        values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.08 0"
                      />
                      <feBlend
                        mode="normal"
                        in2="BackgroundImageFix"
                        result="effect1_dropShadow_2187_1551"
                      />
                      <feBlend
                        mode="normal"
                        in="SourceGraphic"
                        in2="effect1_dropShadow_2187_1551"
                        result="shape"
                      />
                    </filter>
                  </defs>
                </svg>
              </button>
            )}

            {/* Right Chevron - Only show if onNext is available */}
            {onNext && (
              <button
                onClick={onNext}
                className="absolute w-[42px] h-[42px] flex items-center justify-center z-10"
                aria-label="Next"
                style={{
                  right: '20px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                }}
              >
                <svg
                  width="42"
                  height="42"
                  viewBox="0 0 42 42"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <g filter="url(#filter0_d_2187_1546)">
                    <rect x="1" width="40" height="40" rx="12" fill="white" />
                    <rect x="1.5" y="0.5" width="39" height="39" rx="11.5" stroke="#D4D4D4" />
                    <path
                      d="M20 16L24 20L20 24"
                      stroke="black"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </g>
                  <defs>
                    <filter
                      id="filter0_d_2187_1546"
                      x="0.5"
                      y="0"
                      width="41"
                      height="41.5"
                      filterUnits="userSpaceOnUse"
                      colorInterpolationFilters="sRGB"
                    >
                      <feFlood floodOpacity="0" result="BackgroundImageFix" />
                      <feColorMatrix
                        in="SourceAlpha"
                        type="matrix"
                        values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                        result="hardAlpha"
                      />
                      <feMorphology
                        radius="0.5"
                        operator="erode"
                        in="SourceAlpha"
                        result="effect1_dropShadow_2187_1546"
                      />
                      <feOffset dy="1" />
                      <feGaussianBlur stdDeviation="0.5" />
                      <feComposite in2="hardAlpha" operator="out" />
                      <feColorMatrix
                        type="matrix"
                        values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.08 0"
                      />
                      <feBlend
                        mode="normal"
                        in2="BackgroundImageFix"
                        result="effect1_dropShadow_2187_1546"
                      />
                      <feBlend
                        mode="normal"
                        in="SourceGraphic"
                        in2="effect1_dropShadow_2187_1546"
                        result="shape"
                      />
                    </filter>
                  </defs>
                </svg>
              </button>
            )}
          </>
        )}

        {/* Modal Container */}
        <div
          className={`relative ${showHeader ? 'flex-1' : 'w-full h-full'} ${fileType === 'pdf' ? 'w-full overflow-y-auto' : 'flex items-center justify-center'} bg-white`}
          style={{
            width: '100%',
            ...(showHeader ? {} : { height: '100%' }),
            backgroundColor: 'white',
          }}
          onScroll={fileType === 'pdf' ? onPdfScroll : undefined}
        >
          {fileType === 'image' ? (
            /* Image container with transform-based zoom and drag-to-pan */
            <div
              ref={imageContainerRef}
              style={{
                width: '100%',
                height: '100%',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: zoomLevel > 100 ? (isPanning ? 'grabbing' : 'grab') : 'default',
                backgroundColor: 'white',
                userSelect: 'none',
              }}
              onMouseDown={(e) => {
                if (zoomLevel <= 100) return;
                e.preventDefault();
                setIsPanning(true);
                panStartRef.current = {
                  x: e.clientX,
                  y: e.clientY,
                  panX: panPosition.x,
                  panY: panPosition.y,
                };

                const container = imageContainerRef.current;
                if (!container) return;

                // Get container dimensions
                const containerRect = container.getBoundingClientRect();
                const containerWidth = containerRect.width;
                const containerHeight = containerRect.height;

                // Calculate max pan based on zoom level
                // The scaled content extends beyond container by (scale - 1) * dimension / 2
                const scale = zoomLevel / 100;
                const maxPanX = (containerWidth * (scale - 1)) / (2 * scale);
                const maxPanY = (containerHeight * (scale - 1)) / (2 * scale);

                const handleMouseMove = (moveEvent: MouseEvent) => {
                  const deltaX = moveEvent.clientX - panStartRef.current.x;
                  const deltaY = moveEvent.clientY - panStartRef.current.y;

                  // Calculate new position with constraints
                  let newX = panStartRef.current.panX + deltaX;
                  let newY = panStartRef.current.panY + deltaY;

                  // Clamp to boundaries
                  newX = Math.max(-maxPanX, Math.min(maxPanX, newX));
                  newY = Math.max(-maxPanY, Math.min(maxPanY, newY));

                  setPanPosition({ x: newX, y: newY });
                };

                const handleMouseUp = () => {
                  setIsPanning(false);
                  document.removeEventListener('mousemove', handleMouseMove);
                  document.removeEventListener('mouseup', handleMouseUp);
                };

                document.addEventListener('mousemove', handleMouseMove);
                document.addEventListener('mouseup', handleMouseUp);
              }}
            >
              <div
                style={{
                  transform: `scale(${zoomLevel / 100}) translate(${panPosition.x}px, ${panPosition.y}px)`,
                  transformOrigin: 'center',
                  transition: isPanning ? 'none' : 'transform 0.2s ease-in-out',
                }}
              >
                {renderContent()}
              </div>
            </div>
          ) : fileType === 'video' ? (
            <div
              style={{
                transform: `scale(${zoomLevel / 100})`,
                transformOrigin: 'center',
                transition: 'transform 0.2s ease-in-out',
                backgroundColor: 'white',
              }}
            >
              <div
                className="relative flex items-center justify-center"
                onClick={handleVideoClick}
                style={{ cursor: 'pointer' }}
              >
                <div className="relative group">
                  {children}
                  <PlayPauseOverlay isPlaying={isPlaying} show={showOverlay} />
                </div>
              </div>
            </div>
          ) : (
            <div
              style={{
                transform: fileType === 'pdf' ? 'none' : `scale(${zoomLevel / 100})`,
                transformOrigin: 'center',
                transition: fileType === 'pdf' ? 'none' : 'transform 0.2s ease-in-out',
                backgroundColor: 'white',
              }}
            >
              {renderContent()}
            </div>
          )}
        </div>

        {/* Scroll Pill - Show for file and PDF previews */}
        {(fileType === 'file' || fileType === 'pdf') && (
          <ScrollPill currentPage={currentPage} totalPages={totalPages} />
        )}

        {/* Video Timestamp - Only show for video previews */}
        {fileType === 'video' && (
          <VideoTimestamp
            currentTime={currentTime || 0}
            duration={duration || 0}
            isPlaying={isPlaying}
            onPlayPause={onPlayPause}
          />
        )}

        {/* Controls Container */}
        <div
          className="absolute flex items-center"
          style={{ right: '12px', bottom: '12px', zIndex: 10 }}
        >
          {fileType === 'video' ? (
            <div
              className="flex items-center justify-between bg-white rounded-xl border border-neutral-300"
              style={{
                width: '125px',
                height: '40px',
                padding: '0 40px 0 8px',
              }}
            >
              {/* Volume Icon */}
              <button
                className="w-5 h-5 flex items-center justify-center"
                aria-label="Volume"
                onClick={() => onVolumeChange?.(volume > 0 ? 0 : 1)}
              >
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 32 32"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M21 14.332C21 14.332 21.6667 14.9776 21.6667 15.9986C21.6667 17.0195 21 17.6654 21 17.6654"
                    stroke="black"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M23.666 10.332C23.666 10.332 25.666 11.9987 25.666 15.997C25.666 19.9954 23.666 21.6654 23.666 21.6654"
                    stroke="black"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M17.6673 6.33203L11.334 11.6654H7.66732C6.93094 11.6654 6.33398 12.2623 6.33398 12.9987V18.9987C6.33398 19.7351 6.93094 20.332 7.66732 20.332H11.334L17.6673 25.6654V6.33203Z"
                    stroke="black"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {volume === 0 && (
                    <path
                      d="M4 4L28 28"
                      stroke="black"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}
                </svg>
              </button>

              {/* Spacing between icon and slider */}
              <div style={{ width: '16px' }} />

              {/* Volume Slider */}
              <div className="flex items-center" style={{ width: '69px', position: 'relative' }}>
                {/* Background Track */}
                <div
                  className="bg-neutral-300"
                  style={{
                    width: '69px',
                    height: '3px',
                    backgroundColor: '#D4D4D4',
                    position: 'absolute',
                    left: '0',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    borderRadius: '1px',
                  }}
                />

                {/* Orange Track */}
                <div
                  style={{
                    width: `${volume * 69}px`,
                    height: '3px',
                    backgroundColor: '#F97316',
                    position: 'absolute',
                    left: '0',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    borderRadius: '1px',
                  }}
                />

                {/* Range Input */}
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={(e) => onVolumeChange?.(parseFloat(e.target.value))}
                  style={{
                    position: 'absolute',
                    width: '100%',
                    height: '20px',
                    opacity: 0,
                    cursor: 'pointer',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    margin: 0,
                    padding: 0,
                  }}
                />

                {/* Circle Indicator */}
                <div
                  className="rounded-full"
                  style={{
                    width: '16px',
                    height: '16px',
                    position: 'absolute',
                    left: `${volume * 69}px`,
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    backgroundColor: '#F97316',
                    border: '2px solid white',
                    pointerEvents: 'none',
                  }}
                />
              </div>
            </div>
          ) : (
            <div
              className="flex items-center justify-between bg-white rounded-xl border border-neutral-300"
              style={{
                width: '141px',
                height: '40px',
                padding: '0 8px',
              }}
            >
              {/* Original zoom controls - unchanged */}
              <button
                onClick={onZoomOut}
                className="w-5 h-5 flex items-center justify-center"
                style={{
                  cursor: zoomLevel <= 100 ? 'not-allowed' : 'pointer',
                  opacity: zoomLevel <= 100 ? 0.5 : 1,
                }}
                aria-label="Zoom out"
                disabled={zoomLevel <= 100}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  style={{ width: '20px', height: '20px' }}
                >
                  <path
                    d="M15.2077 10.207L4.79102 10.207"
                    stroke="black"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              <div className="flex items-center" style={{ width: '69px', position: 'relative' }}>
                {/* Background Track */}
                <div
                  className="bg-neutral-300"
                  style={{
                    width: '69px',
                    height: '3px',
                    backgroundColor: '#D4D4D4',
                    position: 'absolute',
                    left: '0',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    borderRadius: '1px',
                  }}
                />

                {/* Orange Track */}
                <div
                  style={{
                    width: `${sliderPosition}px`,
                    height: '3px',
                    backgroundColor: '#F97316',
                    position: 'absolute',
                    left: '0',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    borderRadius: '1px',
                  }}
                />

                {/* Range Input for dragging */}
                <input
                  type="range"
                  min="100"
                  max="200"
                  step="1"
                  value={zoomLevel}
                  onChange={(e) => onZoomChange?.(parseInt(e.target.value))}
                  onMouseDown={() => setIsSliderDragging(true)}
                  onMouseUp={() => setIsSliderDragging(false)}
                  onMouseLeave={() => setIsSliderDragging(false)}
                  style={{
                    position: 'absolute',
                    width: '100%',
                    height: '20px',
                    opacity: 0,
                    cursor: 'pointer',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    margin: 0,
                    padding: 0,
                  }}
                />

                {/* Circle Indicator */}
                <div
                  className="rounded-full bg-orange-500"
                  style={{
                    width: '16px',
                    height: '16px',
                    position: 'absolute',
                    left: `${sliderPosition}px`,
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    transition: isSliderDragging ? 'none' : 'left 0.2s ease-in-out',
                    border: '2px solid white',
                    backgroundColor: '#F97316',
                    pointerEvents: 'none',
                  }}
                />
              </div>

              <button
                onClick={onZoomIn}
                className="w-5 h-5 flex items-center justify-center"
                style={{
                  cursor: zoomLevel >= 200 ? 'not-allowed' : 'pointer',
                  opacity: zoomLevel >= 200 ? 0.5 : 1,
                }}
                aria-label="Zoom in"
                disabled={zoomLevel >= 200}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  style={{ width: '20px', height: '20px' }}
                >
                  <path
                    d="M10 4.79297V15.2096"
                    stroke="black"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M15.2077 10H4.79102"
                    stroke="black"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          )}

          {/* Spacing */}
          <div style={{ width: '8px' }} />

          {/* Download Button */}
          <button
            onClick={handleDownload}
            className="w-[42px] h-[42px] flex items-center justify-center"
            aria-label={
              fileType === 'image'
                ? 'Download image'
                : fileType === 'video'
                  ? 'Download video'
                  : 'Download file'
            }
          >
            <svg
              width="42"
              height="42"
              viewBox="0 0 42 42"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g filter="url(#filter0_d_2187_1497)">
                <rect x="1" width="40" height="40" rx="12" fill="white" />
                <rect x="1.5" y="0.5" width="39" height="39" rx="11.5" stroke="#D4D4D4" />
                <path
                  d="M14.959 22.293V23.543C14.959 24.9237 16.0783 26.043 17.459 26.043H24.5423C25.923 26.043 27.0423 24.9237 27.0423 23.543V22.293"
                  stroke="black"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M21 21.8737L21 13.957"
                  stroke="black"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M18.291 18.957L20.9993 21.8737L23.7077 18.957"
                  stroke="black"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
              <defs>
                <filter
                  id="filter0_d_2187_1497"
                  x="0.5"
                  y="0"
                  width="41"
                  height="41.5"
                  filterUnits="userSpaceOnUse"
                  colorInterpolationFilters="sRGB"
                >
                  <feFlood floodOpacity="0" result="BackgroundImageFix" />
                  <feColorMatrix
                    in="SourceAlpha"
                    type="matrix"
                    values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                    result="hardAlpha"
                  />
                  <feMorphology
                    radius="0.5"
                    operator="erode"
                    in="SourceAlpha"
                    result="effect1_dropShadow_2187_1497"
                  />
                  <feOffset dy="1" />
                  <feGaussianBlur stdDeviation="0.5" />
                  <feComposite in2="hardAlpha" operator="out" />
                  <feColorMatrix
                    type="matrix"
                    values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.08 0"
                  />
                  <feBlend
                    mode="normal"
                    in2="BackgroundImageFix"
                    result="effect1_dropShadow_2187_1497"
                  />
                  <feBlend
                    mode="normal"
                    in="SourceGraphic"
                    in2="effect1_dropShadow_2187_1497"
                    result="shape"
                  />
                </filter>
              </defs>
            </svg>
          </button>
        </div>
      </div>
    );
  }
);

PreviewModal.displayName = 'PreviewModal';
