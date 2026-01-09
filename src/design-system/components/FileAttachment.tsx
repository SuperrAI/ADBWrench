import React from 'react';
import { cn } from '@/lib/utils';
import {
  FileArchiveIcon,
  FileAudioIcon,
  FileCodeIcon,
  FileSpreadsheetIcon,
  FileTextIcon,
  FileVideoIcon,
  PresentationIcon,
} from 'lucide-react';
import { Spinner } from './Spinner';
import { textStyles } from '@/design-system/foundations/typography';
import { CoreColors, Neutral, Red } from '@/design-system/foundations/colors';
import CheckCircleIcon from '@/components/icons/CheckCircleIcon';

export type AttachmentFileType =
  | 'image'
  | 'document'
  | 'spreadsheet'
  | 'presentation'
  | 'pdf'
  | 'video'
  | 'audio'
  | 'archive'
  | 'code'
  | 'other';

export type FileAction = 'download' | 'preview' | 'delete' | 'open';
export type FileSize = 'sm' | 'md' | 'lg';
export type FileState = 'default' | 'loading' | 'failed' | 'preview' | 'completed';

export type FileType = AttachmentFileType;

export interface FileAttachmentProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Filename of the attachment
   */
  filename: string;
  /**
   * Size of the file (displayed as text)
   */
  fileSize: string;
  /**
   * Type of the file, determines the icon shown
   */
  fileType: AttachmentFileType;
  /**
   * Size of the component
   * @default 'md'
   */
  size?: FileSize;
  /**
   * State of the file attachment
   * @default 'default'
   */
  state?: FileState;
  /**
   * Progress percentage for loading state (0-100)
   */
  loadingProgress?: number;
  /**
   * Error message shown when state is 'failed'
   */
  errorMessage?: string;
  /**
   * Callback when delete action is clicked
   */
  onDelete?: () => void;
  /**
   * Callback when retry action is clicked
   */
  onRetry?: () => void;
  /**
   * Image URL for preview state
   */
  previewImageUrl?: string;
  /**
   * List of actions that can be performed on the file
   */
  actions?: FileAction[];
  /**
   * Primary color for the spinner in loading state
   */
  spinnerPrimaryColor?: string;
  /**
   * Secondary color for the spinner in loading state
   */
  spinnerSecondaryColor?: string;
}

/**
 * File attachment component that displays file information and actions.
 * Supports four states: default, loading, failed, and preview.
 */
export const FileAttachment = React.forwardRef<HTMLDivElement, FileAttachmentProps>(
  (
    {
      className,
      filename,
      fileSize,
      fileType = 'other',
      size = 'md',
      state = 'default',
      loadingProgress = 0,
      errorMessage,
      onDelete,
      onRetry,
      previewImageUrl,
      actions,
      spinnerPrimaryColor,
      spinnerSecondaryColor,
      ...props
    },
    ref
  ) => {
    // Helper function to get file extension based on fileType
    const getFileExtension = () => {
      switch (fileType) {
        case 'image':
          return '.jpg';
        case 'document':
          return '.doc';
        case 'spreadsheet':
          return '.xlsx';
        case 'presentation':
          return '.pptx';
        case 'pdf':
          return '.pdf';
        case 'video':
          return '.mp4';
        case 'audio':
          return '.mp3';
        case 'archive':
          return '.zip';
        case 'code':
          return '.js';
        default:
          return '';
      }
    };

    // Delete button component
    const DeleteButton = () => (
      <button
        className="flex-shrink-0"
        onClick={onDelete}
        aria-label="Remove file"
        style={{
          display: 'flex',
          width: '28px',
          height: '28px',
          padding: '4px',
          justifyContent: 'center',
          alignItems: 'center',
          borderRadius: '24px',
          background: CoreColors.White,
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          style={{
            width: '20px',
            height: '20px',
            flexShrink: 0,
            aspectRatio: '1/1',
          }}
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M11.1785 10.0002L14.756 6.42271C15.0819 6.09687 15.0819 5.57021 14.756 5.24437C14.4302 4.91854 13.9035 4.91854 13.5777 5.24437L10.0002 8.82187L6.42271 5.24437C6.09687 4.91854 5.57021 4.91854 5.24437 5.24437C4.91854 5.57021 4.91854 6.09687 5.24437 6.42271L8.82187 10.0002L5.24437 13.5777C4.91854 13.9035 4.91854 14.4302 5.24437 14.756C5.40687 14.9185 5.62021 15.0002 5.83354 15.0002C6.04687 15.0002 6.26021 14.9185 6.42271 14.756L10.0002 11.1785L13.5777 14.756C13.7402 14.9185 13.9535 15.0002 14.1669 15.0002C14.3802 15.0002 14.5935 14.9185 14.756 14.756C15.0819 14.4302 15.0819 13.9035 14.756 13.5777L11.1785 10.0002Z"
            fill={Neutral.N400}
          />
        </svg>
      </button>
    );

    // Retry button component
    const RetryButton = () => (
      <button
        className="flex-shrink-0"
        onClick={onRetry}
        aria-label="Retry file"
        style={{
          display: 'flex',
          width: '28px',
          height: '28px',
          padding: '4px',
          justifyContent: 'center',
          alignItems: 'center',
          borderRadius: '24px',
          background: CoreColors.White,
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          style={{
            width: '16px',
            height: '16px',
            flexShrink: 0,
            aspectRatio: '1/1',
          }}
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M2.46467 8.95067C2.81533 8.83933 3.19 9.03333 3.302 9.384C3.92667 11.348 5.76533 12.6667 7.87733 12.6667C10.5187 12.6667 12.6667 10.5733 12.6667 8C12.6667 5.42733 10.5187 3.33333 7.87733 3.33333C6.72533 3.33333 5.63867 3.73467 4.78067 4.44667L6.22467 4.20867C6.59133 4.142 6.93133 4.39467 6.99133 4.75733C7.05133 5.12067 6.80533 5.464 6.442 5.52333L3.61133 5.99133C3.57467 5.99733 3.53733 6 3.502 6C3.42267 6 3.34533 5.986 3.27333 5.95933C3.24867 5.95 3.22867 5.93267 3.20467 5.92C3.16067 5.89733 3.11467 5.87733 3.07667 5.84533C3.05267 5.826 3.03733 5.798 3.01667 5.77533C2.98533 5.74267 2.952 5.71133 2.92867 5.67133C2.912 5.64267 2.90533 5.60867 2.89267 5.57667C2.87667 5.53733 2.85533 5.50067 2.84733 5.45733L2.34467 2.79067C2.27667 2.42867 2.51467 2.07933 2.87667 2.012C3.23733 1.94667 3.58733 2.182 3.65533 2.54333L3.83667 3.504C4.946 2.54333 6.368 2 7.87733 2C11.2533 2 14 4.69133 14 8C14 11.3087 11.2533 14 7.87733 14C5.18267 14 2.83333 12.3073 2.03133 9.788C1.92 9.43733 2.114 9.06267 2.46467 8.95067Z"
            fill={Neutral.N400}
          />
        </svg>
      </button>
    );

    const getIcon = () => {
      let IconComponent;

      if (state === 'completed') {
        // For document-type files, show document icon inside image container with green background
        if (['document', 'pdf', 'spreadsheet', 'presentation', 'code'].includes(fileType)) {
          return (
            <div
              style={{
                display: 'flex',
                width: '40px',
                height: '40px',
                padding: '8px',
                justifyContent: 'center',
                alignItems: 'center',
                aspectRatio: '1/1',
                borderRadius: '9px',
                background: '#F0FDF4',
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                style={{
                  width: '24px',
                  height: '24px',
                  flexShrink: 0,
                }}
              >
                <path
                  d="M17.25 4.75H6.75C5.64543 4.75 4.75 5.64543 4.75 6.75V17.25C4.75 18.3546 5.64543 19.25 6.75 19.25H17.25C18.3546 19.25 19.25 18.3546 19.25 17.25V6.75C19.25 5.64543 18.3546 4.75 17.25 4.75Z"
                  stroke="#16A34A"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M8 10H16"
                  stroke="#16A34A"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M8 14H16"
                  stroke="#16A34A"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M8 18H12"
                  stroke="#16A34A"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          );
        }

        // For other files, show the default image icon with green background
        return (
          <div
            style={{
              display: 'flex',
              width: '40px',
              height: '40px',
              padding: '8px',
              justifyContent: 'center',
              alignItems: 'center',
              aspectRatio: '1/1',
              borderRadius: '9px',
              background: '#F0FDF4',
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              style={{
                width: '24px',
                height: '24px',
                flexShrink: 0,
              }}
            >
              <path
                d="M17.25 4.75H6.75C5.64543 4.75 4.75 5.64543 4.75 6.75V17.25C4.75 18.3546 5.64543 19.25 6.75 19.25H17.25C18.3546 19.25 19.25 18.3546 19.25 17.25V6.75C19.25 5.64543 18.3546 4.75 17.25 4.75Z"
                stroke="#16A34A"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M4.75 15.9995L7.49619 12.5061C8.2749 11.5156 9.76453 11.4832 10.5856 12.4389L13 15.2495"
                stroke="#16A34A"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M10.9141 12.8224C11.9512 11.5031 13.3964 9.63401 13.4904 9.5124L13.5004 9.49963C14.2805 8.51544 15.7653 8.48527 16.5846 9.43893L18.999 12.2495"
                stroke="#16A34A"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        );
      }

      if (state === 'preview') {
        return (
          <div
            style={{
              width: '40px',
              height: '40px',
              aspectRatio: '1/1',
              borderRadius: '9px',
              border: '1px solid var(--Neutral-300, #D4D4D4)',
              background: `linear-gradient(0deg, rgba(0, 0, 0, 0.10) 0%, rgba(0, 0, 0, 0.10) 100%), url(${previewImageUrl || 'https://avatarfiles.alphacoders.com/375/375542.png'}) lightgray 50% / cover no-repeat`,
            }}
          />
        );
      }

      if (state === 'loading') {
        return (
          <div
            style={{
              display: 'flex',
              width: '40px',
              height: '40px',
              padding: '8px',
              justifyContent: 'center',
              alignItems: 'center',
              aspectRatio: '1/1',
              borderRadius: '9px',
              background: '#F5F5F5',
            }}
          >
            {/* Show document icon for document-type files */}
            {['document', 'pdf', 'spreadsheet', 'presentation', 'code'].includes(fileType) ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                style={{
                  width: '24px',
                  height: '24px',
                  flexShrink: 0,
                }}
              >
                <path
                  d="M17.25 4.75H6.75C5.64543 4.75 4.75 5.64543 4.75 6.75V17.25C4.75 18.3546 5.64543 19.25 6.75 19.25H17.25C18.3546 19.25 19.25 18.3546 19.25 17.25V6.75C19.25 5.64543 18.3546 4.75 17.25 4.75Z"
                  stroke="#A3A3A3"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M8 10H16"
                  stroke="#A3A3A3"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M8 14H16"
                  stroke="#A3A3A3"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M8 18H12"
                  stroke="#A3A3A3"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                style={{
                  width: '24px',
                  height: '24px',
                  flexShrink: 0,
                }}
              >
                <path
                  d="M17.25 4.75H6.75C5.64543 4.75 4.75 5.64543 4.75 6.75V17.25C4.75 18.3546 5.64543 19.25 6.75 19.25H17.25C18.3546 19.25 19.25 18.3546 19.25 17.25V6.75C19.25 5.64543 18.3546 4.75 17.25 4.75Z"
                  stroke="#A3A3A3"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M4.75 15.9995L7.49619 12.5061C8.2749 11.5156 9.76453 11.4832 10.5856 12.4389L13 15.2495"
                  stroke="#A3A3A3"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M10.9141 12.8224C11.9512 11.5031 13.3964 9.63401 13.4904 9.5124L13.5004 9.49963C14.2805 8.51544 15.7653 8.48527 16.5846 9.43893L18.999 12.2495"
                  stroke="#A3A3A3"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </div>
        );
      }

      if (state === 'failed') {
        return (
          <div
            style={{
              display: 'flex',
              width: '40px',
              height: '40px',
              padding: '8px',
              justifyContent: 'center',
              alignItems: 'center',
              aspectRatio: '1/1',
              borderRadius: '9px',
              background: '#F5F5F5',
            }}
          >
            {/* Show document icon for document-type files */}
            {['document', 'pdf', 'spreadsheet', 'presentation', 'code'].includes(fileType) ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                style={{
                  width: '24px',
                  height: '24px',
                  flexShrink: 0,
                }}
              >
                <path
                  d="M17.25 4.75H6.75C5.64543 4.75 4.75 5.64543 4.75 6.75V17.25C4.75 18.3546 5.64543 19.25 6.75 19.25H17.25C18.3546 19.25 19.25 18.3546 19.25 17.25V6.75C19.25 5.64543 18.3546 4.75 17.25 4.75Z"
                  stroke="#A3A3A3"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M8 10H16"
                  stroke="#A3A3A3"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M8 14H16"
                  stroke="#A3A3A3"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M8 18H12"
                  stroke="#A3A3A3"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                style={{
                  width: '24px',
                  height: '24px',
                  flexShrink: 0,
                }}
              >
                <path
                  d="M17.25 4.75H6.75C5.64543 4.75 4.75 5.64543 4.75 6.75V17.25C4.75 18.3546 5.64543 19.25 6.75 19.25H17.25C18.3546 19.25 19.25 18.3546 19.25 17.25V6.75C19.25 5.64543 18.3546 4.75 17.25 4.75Z"
                  stroke="#A3A3A3"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M4.75 15.9995L7.49619 12.5061C8.2749 11.5156 9.76453 11.4832 10.5856 12.4389L13 15.2495"
                  stroke="#A3A3A3"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M10.9141 12.8224C11.9512 11.5031 13.3964 9.63401 13.4904 9.5124L13.5004 9.49963C14.2805 8.51544 15.7653 8.48527 16.5846 9.43893L18.999 12.2495"
                  stroke="#A3A3A3"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </div>
        );
      }

      // In default state, always use custom image SVG
      if (state === 'default') {
        // For document-type files, show document icon inside image container
        if (['document', 'pdf', 'spreadsheet', 'presentation', 'code'].includes(fileType)) {
          return (
            <div
              style={{
                display: 'flex',
                width: '40px',
                height: '40px',
                padding: '8px',
                justifyContent: 'center',
                alignItems: 'center',
                aspectRatio: '1/1',
                borderRadius: '9px',
                background: '#F5F5F5',
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                style={{
                  width: '24px',
                  height: '24px',
                  flexShrink: 0,
                }}
              >
                <path
                  d="M17.25 4.75H6.75C5.64543 4.75 4.75 5.64543 4.75 6.75V17.25C4.75 18.3546 5.64543 19.25 6.75 19.25H17.25C18.3546 19.25 19.25 18.3546 19.25 17.25V6.75C19.25 5.64543 18.3546 4.75 17.25 4.75Z"
                  stroke="#A3A3A3"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Document icon inside */}
                <path
                  d="M8 10H16"
                  stroke="#A3A3A3"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M8 14H16"
                  stroke="#A3A3A3"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M8 18H12"
                  stroke="#A3A3A3"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          );
        }

        // For other files, show the default image icon
        return (
          <div
            style={{
              display: 'flex',
              width: '40px',
              height: '40px',
              padding: '8px',
              justifyContent: 'center',
              alignItems: 'center',
              aspectRatio: '1/1',
              borderRadius: '9px',
              background: '#F5F5F5',
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              style={{
                width: '24px',
                height: '24px',
                flexShrink: 0,
              }}
            >
              <path
                d="M17.25 4.75H6.75C5.64543 4.75 4.75 5.64543 4.75 6.75V17.25C4.75 18.3546 5.64543 19.25 6.75 19.25H17.25C18.3546 19.25 19.25 18.3546 19.25 17.25V6.75C19.25 5.64543 18.3546 4.75 17.25 4.75Z"
                stroke="#A3A3A3"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M4.75 15.9995L7.49619 12.5061C8.2749 11.5156 9.76453 11.4832 10.5856 12.4389L13 15.2495"
                stroke="#A3A3A3"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M10.9141 12.8224C11.9512 11.5031 13.3964 9.63401 13.4904 9.5124L13.5004 9.49963C14.2805 8.51544 15.7653 8.48527 16.5846 9.43893L18.999 12.2495"
                stroke="#A3A3A3"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        );
      }

      // This will only be used for non-default states that somehow don't match the conditions above
      switch (fileType) {
        case 'image':
          IconComponent = ({ className }: { className?: string }) => (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              className={className}
              style={{
                width: '24px',
                height: '24px',
                flexShrink: 0,
              }}
            >
              <path
                d="M17.25 4.75H6.75C5.64543 4.75 4.75 5.64543 4.75 6.75V17.25C4.75 18.3546 5.64543 19.25 6.75 19.25H17.25C18.3546 19.25 19.25 18.3546 19.25 17.25V6.75C19.25 5.64543 18.3546 4.75 17.25 4.75Z"
                stroke="#A3A3A3"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M4.75 15.9995L7.49619 12.5061C8.2749 11.5156 9.76453 11.4832 10.5856 12.4389L13 15.2495"
                stroke="#A3A3A3"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M10.9141 12.8224C11.9512 11.5031 13.3964 9.63401 13.4904 9.5124L13.5004 9.49963C14.2805 8.51544 15.7653 8.48527 16.5846 9.43893L18.999 12.2495"
                stroke="#A3A3A3"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          );
          break;
        case 'document':
          IconComponent = FileTextIcon;
          break;
        case 'spreadsheet':
          IconComponent = FileSpreadsheetIcon;
          break;
        case 'presentation':
          IconComponent = PresentationIcon;
          break;
        case 'pdf':
          IconComponent = FileTextIcon;
          break;
        case 'video':
          IconComponent = FileVideoIcon;
          break;
        case 'audio':
          IconComponent = FileAudioIcon;
          break;
        case 'archive':
          IconComponent = FileArchiveIcon;
          break;
        case 'code':
          IconComponent = FileCodeIcon;
          break;
        default:
          IconComponent = ({ className }: { className?: string }) => (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              className={className}
              style={{
                width: '24px',
                height: '24px',
                flexShrink: 0,
              }}
            >
              <path
                d="M17.25 4.75H6.75C5.64543 4.75 4.75 5.64543 4.75 6.75V17.25C4.75 18.3546 5.64543 19.25 6.75 19.25H17.25C18.3546 19.25 19.25 18.3546 19.25 17.25V6.75C19.25 5.64543 18.3546 4.75 17.25 4.75Z"
                stroke="#A3A3A3"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M4.75 15.9995L7.49619 12.5061C8.2749 11.5156 9.76453 11.4832 10.5856 12.4389L13 15.2495"
                stroke="#A3A3A3"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M10.9141 12.8224C11.9512 11.5031 13.3964 9.63401 13.4904 9.5124L13.5004 9.49963C14.2805 8.51544 15.7653 8.48527 16.5846 9.43893L18.999 12.2495"
                stroke="#A3A3A3"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          );
      }

      return (
        <div
          style={{
            display: 'flex',
            width: '40px',
            height: '40px',
            padding: '8px',
            justifyContent: 'center',
            alignItems: 'center',
            aspectRatio: '1/1',
            borderRadius: '9px',
            background: '#F5F5F5',
          }}
        >
          <IconComponent className="w-6 h-6" width={24} height={24} />
        </div>
      );
    };

    return (
      <div
        ref={ref}
        style={{
          borderRadius: '16px',
          border: state === 'failed' ? `1px solid ${Red.R600}` : `1px solid ${Neutral.N200}`,
          background: CoreColors.White,
          padding: '8px',
        }}
        className={cn('flex items-center justify-between gap-4', className)}
        {...props}
      >
        <div className="flex items-center flex-1 min-w-0 gap-3">
          <div>{getIcon()}</div>

          <div className="flex-1 min-w-0 text-wrapper">
            <div className="truncate" style={{ ...textStyles.body2Reg, color: CoreColors.Black }}>
              {(() => {
                // Get filename without extension
                const nameWithoutExt = filename.includes('.')
                  ? filename.substring(0, filename.lastIndexOf('.'))
                  : filename;

                // Truncate if necessary
                return nameWithoutExt.length > 14
                  ? nameWithoutExt.substring(0, 14) + '...'
                  : nameWithoutExt;
              })()}
            </div>
            {state === 'failed' ? (
              <div className="truncate" style={{ ...textStyles.body2Reg, color: Red.R600 }}>
                {errorMessage || 'Failed'}
              </div>
            ) : (
              <div style={{ ...textStyles.body2Reg, color: Neutral.N400 }}>
                {getFileExtension()}
              </div>
            )}
          </div>
        </div>
        {state === 'default' && onDelete && <DeleteButton />}
        {state === 'preview' && onDelete && <DeleteButton />}
        {state === 'loading' && (
          <div className="flex-shrink-0 flex items-center justify-center">
            <div style={{ ...textStyles.body2Med, color: Neutral.N400 }}>
              {Math.round(loadingProgress)}%
            </div>
          </div>
        )}
        {state === 'failed' && onRetry && <RetryButton />}
        {state === 'completed' && (
          <div className="flex-shrink-0">
            <CheckCircleIcon width={24} height={24} />
          </div>
        )}
      </div>
    );
  }
);

FileAttachment.displayName = 'FileAttachment';
export default FileAttachment;
