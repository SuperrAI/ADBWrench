import React from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { Separator } from '@/components/ui/separator';
import { textStyles } from '@/design-system/foundations/typography';
import { Neutral } from '@/design-system/foundations/colors';

export type FileType =
  | 'document'
  | 'image'
  | 'video'
  | 'pdf'
  | 'spreadsheet'
  | 'presentation'
  | 'code'
  | 'audio'
  | 'archive'
  | 'other';

export type ImageVariant = 'default' | 'noThumbnail';

export interface FileProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Type of file to display
   */
  fileType: FileType;
  /**
   * Name of the file to display
   */
  filename: string;
  /**
   * File format label (e.g., "PDF", "PNG", "Video • 5m")
   */
  fileFormat: string;
  /**
   * Optional content preview for document types
   */
  content?: string;
  /**
   * Optional image URL for image and video types
   */
  previewUrl?: string;
  /**
   * Optional callback when file is clicked
   */
  onClick?: () => void;
  /**
   * Optional width of the file card
   * @default 176px
   */
  width?: number;
  /**
   * Optional height of the file card
   * @default 216px
   */
  height?: number;
  /**
   * Display mode - grid or list
   * @default 'grid'
   */
  viewMode?: 'grid' | 'list';
  /**
   * Whether to show the filename at the bottom of the card
   * @default true
   */
  showBottomFilename?: boolean;
  /**
   * Variant for image file type
   * @default 'default'
   */
  imageVariant?: ImageVariant;
}

export const File = React.forwardRef<HTMLDivElement, FileProps>(
  (
    {
      fileType,
      filename,
      fileFormat,
      content,
      previewUrl,
      onClick,
      width = 176,
      height = 216,
      viewMode = 'grid',
      showBottomFilename = true,
      imageVariant = 'default',
      className,
      ...props
    },
    ref
  ) => {
    // Enhanced hover animation with increased lift and wide shadow spread
    const hoverAnimation =
      'transition-all duration-300 ease-[cubic-bezier(0.2,0,0,1)] transform hover:-translate-y-1.5 hover:shadow-md hover:shadow-neutral-500/20 hover:shadow-neutral-400/40 hover:[box-shadow:-2px_0px_12px_2px_rgba(0,0,0,0.1),2px_0px_12px_2px_rgba(0,0,0,0.1),0px_8px_12px_8px_rgba(0,0,0,0.1)]';

    if (viewMode === 'list') {
      return (
        <div className="group flex items-center justify-between p-2 hover:bg-neutral-50 rounded-lg">
          <div className="flex-1 flex items-center gap-4 cursor-pointer" onClick={onClick}>
            <div className="h-12 w-12 rounded-lg overflow-hidden border border-neutral-200">
              {fileType === 'document' || fileType === 'pdf' ? (
                <div className="w-full h-full bg-neutral-50 flex items-center justify-center">
                  <span className="text-neutral-400 text-sm font-normal">PDF</span>
                </div>
              ) : (fileType === 'image' || fileType === 'video') && previewUrl ? (
                <div className="relative w-full h-full">
                  <Image
                    src={previewUrl}
                    alt={filename}
                    unoptimized={true}
                    fill
                    sizes="48px"
                    style={{ objectFit: 'cover' }}
                  />
                  {fileType === 'video' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <div
                        className="bg-white w-6 h-6 rounded-full flex items-center justify-center border border-neutral-200 shadow-sm"
                        style={{ paddingLeft: '2.5px' }}
                      >
                        <svg
                          width="7"
                          height="8"
                          viewBox="0 0 13 15"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M0 11.5489V3.45106C0 1.0867 2.6077 -0.348456 4.60515 0.916598L10.9982 4.96554C12.858 6.14341 12.858 8.85659 10.9982 10.0345L4.60516 14.0834C2.6077 15.3485 0 13.9133 0 11.5489Z"
                            fill="black"
                          />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
            <div>
              <h3 className="text-neutral-950 truncate" style={textStyles.body2Med}>
                {filename}
              </h3>
              <p className="text-neutral-500" style={textStyles.labelSansReg}>
                {fileFormat}
              </p>
            </div>
          </div>
        </div>
      );
    }

    // Grid view with fixed hover animation
    return (
      <div className="space-y-2">
        <Card
          ref={ref}
          className={cn(
            'overflow-hidden cursor-pointer border-neutral-200 shadow-sm',
            hoverAnimation,
            className
          )}
          style={{ width: `${width}px`, height: `${height}px` }}
          onClick={onClick}
          {...props}
        >
          <div className="flex flex-col h-full">
            {fileType === 'document' || fileType === 'pdf' ? (
              <div className="flex flex-col h-full">
                <div className="px-4">
                  <div className="pt-3">
                    <p className="text-neutral-400" style={textStyles.labelSansMed}>
                      {fileFormat}
                    </p>
                    <p className="text-black truncate" style={textStyles.body2Med}>
                      {filename}
                    </p>
                  </div>

                  <div className="py-3">
                    <Separator className="bg-neutral-200" />
                  </div>

                  <div
                    className="text-neutral-500 overflow-hidden line-clamp-6 pb-3"
                    style={textStyles.labelSansReg}
                  >
                    {content}
                  </div>
                </div>
              </div>
            ) : fileType === 'image' ? (
              <div className="flex flex-col h-full">
                <div className="px-2 mt-2">
                  <div
                    className="rounded-md overflow-hidden border border-neutral-200"
                    style={{ height: '144px' }}
                  >
                    {previewUrl ? (
                      <div className="relative w-full h-full">
                        <Image
                          src={previewUrl}
                          alt={filename}
                          unoptimized={true}
                          fill
                          sizes="176px"
                          style={{
                            objectFit: 'cover',
                            objectPosition: 'center',
                          }}
                          className="rounded-md"
                        />
                      </div>
                    ) : imageVariant === 'noThumbnail' ? (
                      <div
                        className="w-full h-full flex items-center justify-center"
                        style={{ backgroundColor: Neutral.N100 }}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="32"
                          height="32"
                          viewBox="0 0 32 32"
                          fill="none"
                          style={{ width: '32px', height: '32px', aspectRatio: '1/1' }}
                        >
                          <path
                            d="M6.3335 21.334L9.99508 16.6762C11.0334 15.3554 13.0195 15.3122 14.1143 16.5866L17.3335 20.334M14.5535 17.098C15.9364 15.3389 17.8632 12.8467 17.9887 12.6846C17.9931 12.6788 17.9974 12.6733 18.0019 12.6675C19.0422 11.3553 21.0219 11.3151 22.1143 12.5866L25.3335 16.334M9.00016 25.6673H23.0002C24.473 25.6673 25.6668 24.4734 25.6668 23.0006V9.00065C25.6668 7.52789 24.473 6.33398 23.0002 6.33398H9.00016C7.5274 6.33398 6.3335 7.52789 6.3335 9.00065V23.0006C6.3335 24.4734 7.5274 25.6673 9.00016 25.6673Z"
                            stroke="#A3A3A3"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-full h-full bg-neutral-100 flex items-center justify-center">
                        <div className="bg-white w-12 h-12 rounded-full flex items-center justify-center border border-neutral-200 shadow-sm">
                          <svg
                            width="13"
                            height="15"
                            viewBox="0 0 13 15"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className="ml-[5px]"
                          >
                            <path
                              d="M0 11.5489V3.45106C0 1.0867 2.6077 -0.348456 4.60515 0.916598L10.9982 4.96554C12.858 6.14341 12.858 8.85659 10.9982 10.0345L4.60516 14.0834C2.6077 15.3485 0 13.9133 0 11.5489Z"
                              fill="black"
                            />
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="px-4 mt-3 mb-4">
                  <p className="text-neutral-400" style={textStyles.labelSansMed}>
                    {fileFormat}
                  </p>
                  <p className="text-black truncate" style={textStyles.body2Med}>
                    {filename}
                  </p>
                </div>
              </div>
            ) : fileType === 'video' ? (
              <div className="flex flex-col h-full">
                <div className="px-2 mt-2">
                  <div
                    className="rounded-md overflow-hidden border border-neutral-200"
                    style={{ height: '144px' }}
                  >
                    {previewUrl ? (
                      <div className="relative w-full h-full group">
                        <Image
                          src={previewUrl}
                          alt={filename}
                          unoptimized={true}
                          fill
                          sizes="176px"
                          style={{
                            objectFit: 'cover',
                            objectPosition: 'center',
                          }}
                          className="rounded-md"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="bg-white w-12 h-12 rounded-full flex items-center justify-center border border-neutral-200 shadow-sm duration-200 pl-[2.5px]">
                            <svg
                              width="13"
                              height="15"
                              viewBox="0 0 13 15"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M0 11.5489V3.45106C0 1.0867 2.6077 -0.348456 4.60515 0.916598L10.9982 4.96554C12.858 6.14341 12.858 8.85659 10.9982 10.0345L4.60516 14.0834C2.6077 15.3485 0 13.9133 0 11.5489Z"
                                fill="black"
                              />
                            </svg>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-full bg-neutral-100 flex items-center justify-center">
                        <div className="bg-white w-12 h-12 rounded-full flex items-center justify-center border border-neutral-200 shadow-sm pl-[5px]">
                          <svg
                            width="13"
                            height="15"
                            viewBox="0 0 13 15"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M0 11.5489V3.45106C0 1.0867 2.6077 -0.348456 4.60515 0.916598L10.9982 4.96554C12.858 6.14341 12.858 8.85659 10.9982 10.0345L4.60516 14.0834C2.6077 15.3485 0 13.9133 0 11.5489Z"
                              fill="black"
                            />
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="px-4 mt-3 mb-4">
                  <p className="text-neutral-400" style={textStyles.labelSansMed}>
                    {fileFormat}
                  </p>
                  <p className="text-black truncate" style={textStyles.body2Med}>
                    {filename}
                  </p>
                </div>
              </div>
            ) : (
              <div className="px-4 pt-2 flex flex-col h-full">
                <div className="mb-3">
                  <p className="text-neutral-400" style={textStyles.body2Reg}>
                    {fileFormat}
                  </p>
                  <p className="text-black truncate" style={textStyles.body1Med}>
                    {filename}
                  </p>
                </div>
              </div>
            )}
          </div>
        </Card>
        {showBottomFilename && (
          <div className="px-1 flex items-center group/name mt-4">
            <h3 className="text-neutral-950 truncate flex-1" style={textStyles.body2Med}>
              {filename}
            </h3>
          </div>
        )}
      </div>
    );
  }
);

File.displayName = 'File';
export default File;
