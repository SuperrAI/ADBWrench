import { useCallback, useEffect, useRef, useState } from 'react';
import { gql, useApolloClient, useMutation } from '@apollo/client';
import { toast } from 'sonner';
import Uppy, { UppyFile } from '@uppy/core';
import { Button } from '@/design-system/components/Button';
import { X } from 'lucide-react';
import { AssetType } from '@/graphql/file-upload';
import { textStyles } from '@/design-system/foundations/typography';
import { CoreColors, Neutral } from '@/design-system/foundations/colors';
import { FileAttachment, FileType } from '@/design-system/components/FileAttachment';

// Import styles
import '@uppy/core/dist/style.min.css';
import '@uppy/dashboard/dist/style.min.css';

const GET_POST_ATTACHMENT_UPLOAD_URL = gql`
  mutation GetPostAttachmentUploadURL($input: GetPostAttachmentUploadURLInput!) {
    getPostAttachmentUploadURL(input: $input) {
      uploadURL
      attachmentId
    }
  }
`;

interface GetPostAttachmentUploadURLResponse {
  getPostAttachmentUploadURL: {
    uploadURL: string;
    attachmentId: string;
  };
}

const COMPLETE_POST_ATTACHMENT_UPLOAD = gql`
  mutation CompletePostAttachmentUpload($input: CompletePostAttachmentUploadInput!) {
    completePostAttachmentUpload(input: $input)
  }
`;

const GET_POST_ATTACHMENT_DOWNLOAD_URL = gql`
  query GetPostAttachmentDownloadURL($attachmentId: ID!) {
    getPostAttachmentDownloadURL(attachmentId: $attachmentId) {
      downloadURL
    }
  }
`;

export interface UppyAttachmentUploaderProps {
  draftPostId: string;
  isOpen: boolean;
  onClose: () => void;
  onAttachmentsAdded?: (attachments: Array<{ id: string; name: string }>) => void;
}

interface CustomMeta {
  attachmentId?: string;
  assetId?: string;

  [key: string]: any;
}

type UppyFileWithMeta = UppyFile<CustomMeta, Record<string, never>>;
type UppyResponse = {
  body?: Record<string, never>;
  status: number;
  bytesUploaded?: number;
  uploadURL?: string;
};
type UppyError = { name: string; message: string; details?: string };

interface PreviewDialogProps {
  file: File;
  onClose: () => void;
}

function PreviewDialog({ file, onClose }: PreviewDialogProps) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70">
      <div className="relative bg-white rounded-lg shadow-xl max-w-4xl max-h-[90vh] w-[90vw] overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="font-medium">{file.name}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 flex items-center justify-center bg-gray-100 h-[70vh] overflow-auto">
          {file.type.startsWith('image/') ? (
            <img
              src={URL.createObjectURL(file)}
              alt={file.name}
              className="max-w-full max-h-full object-contain"
            />
          ) : file.type === 'application/pdf' ? (
            <iframe src={URL.createObjectURL(file)} className="w-full h-full" title={file.name} />
          ) : (
            <div className="text-center p-8">
              <svg
                width="64"
                height="64"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="mx-auto mb-4"
              >
                <path
                  d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z"
                  stroke="#9CA3AF"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M14 2V8H20"
                  stroke="#9CA3AF"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <p className="text-gray-500">Preview not available for this file type</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper function to determine asset type from file MIME type
function getAssetType(mimeType: string): AssetType {
  if (mimeType.startsWith('image/')) {
    return AssetType.IMAGE;
  } else if (mimeType === 'application/pdf') {
    return AssetType.PDF;
  } else if (mimeType.startsWith('audio/')) {
    return AssetType.AUDIO;
  } else if (mimeType.startsWith('video/')) {
    return AssetType.VIDEO;
  } else if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimeType === 'application/msword'
  ) {
    return AssetType.PDF; // Use PDF as fallback for documents
  } else if (
    mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    mimeType === 'application/vnd.ms-excel'
  ) {
    return AssetType.PDF; // Use PDF as fallback for spreadsheets
  } else if (
    mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
    mimeType === 'application/vnd.ms-powerpoint'
  ) {
    return AssetType.PDF; // Use PDF as fallback for presentations
  } else {
    return AssetType.PDF; // Default to PDF if unknown
  }
}

// Helper function to determine file type from MIME type
const getFileType = (mimeType: string): FileType => {
  if (mimeType.startsWith('image/')) {
    return 'image';
  } else if (mimeType === 'application/pdf') {
    return 'pdf';
  } else if (mimeType.startsWith('video/')) {
    return 'video';
  } else if (mimeType.startsWith('audio/')) {
    return 'audio';
  } else if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimeType === 'application/msword'
  ) {
    return 'document';
  } else if (
    mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    mimeType === 'application/vnd.ms-excel'
  ) {
    return 'spreadsheet';
  } else if (
    mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
    mimeType === 'application/vnd.ms-powerpoint'
  ) {
    return 'presentation';
  } else {
    return 'other';
  }
};

interface FileState {
  file: File;
  state: 'default' | 'loading' | 'preview' | 'failed';
  errorMessage?: string;
  previewImageUrl?: string;
}

export default function UppyAttachmentUploader({
  draftPostId,
  isOpen,
  onClose,
  onAttachmentsAdded,
}: UppyAttachmentUploaderProps) {
  const apolloClient = useApolloClient();
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [getUploadUrl] = useMutation<GetPostAttachmentUploadURLResponse>(
    GET_POST_ATTACHMENT_UPLOAD_URL
  );
  const [completeUpload] = useMutation(COMPLETE_POST_ATTACHMENT_UPLOAD);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [uploadingFiles, setUploadingFiles] = useState<boolean>(false);
  const [selectedFiles, setSelectedFiles] = useState<FileState[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const dropAreaRef = useRef<HTMLDivElement>(null);
  const addMoreFilesRef = useRef<HTMLLabelElement>(null);

  // Function to create a new Uppy instance with all necessary configuration
  function createUppyInstance() {
    const uppyInstance = new Uppy({
      restrictions: {
        allowedFileTypes: [
          'image/*',
          '.pdf',
          '.doc',
          '.docx',
          '.xls',
          '.xlsx',
          '.ppt',
          '.pptx',
          'video/*',
        ],
        maxNumberOfFiles: 5,
      },
      autoProceed: false,
    });

    return uppyInstance;
  }

  // Create a new Uppy instance each time the component mounts
  const [uppy] = useState(() => createUppyInstance());

  // Update handleFileSelect to include state
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const fileArray = Array.from(event.target.files);
      const newFiles: FileState[] = fileArray.map((file) => ({
        file,
        state: 'default',
        previewImageUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
      }));
      setSelectedFiles((prev) => [...prev, ...newFiles]);

      // Add files to Uppy
      fileArray.forEach((file) => {
        try {
          uppy.addFile({
            name: file.name,
            type: file.type,
            data: file,
            source: 'file input',
            isRemote: false,
          });
        } catch (err) {
          console.error('Error adding file to Uppy:', err);
        }
      });
    }
  };

  // Update handleDrop to include state
  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer?.files) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      const newFiles: FileState[] = droppedFiles.map((file) => ({
        file,
        state: 'default',
        previewImageUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
      }));
      setSelectedFiles((prev) => [...prev, ...newFiles]);

      // Add files to Uppy
      droppedFiles.forEach((file) => {
        try {
          uppy.addFile({
            name: file.name,
            type: file.type,
            data: file,
            source: 'drag-drop',
            isRemote: false,
          });
        } catch (err) {
          console.error('Error adding file to Uppy:', err);
        }
      });
    }
  };

  // Update handleManualUpload to handle states
  const handleManualUpload = useCallback(async () => {
    if (selectedFiles.length === 0) return;

    setUploadingFiles(true);
    console.log('Upload button clicked!');
    console.log('Files to upload:', selectedFiles.length);

    try {
      // Create an array to collect successful attachments
      const successfulAttachments: Array<{ id: string; name: string }> = [];

      // Update all files to loading state
      setSelectedFiles((prev) =>
        prev.map((fileState) => ({
          ...fileState,
          state: 'loading',
        }))
      );

      for (const fileState of selectedFiles) {
        console.log('Processing file:', fileState.file.name);

        try {
          // 1. Get upload URL from backend
          const response = await getUploadUrl({
            variables: {
              input: {
                draftPostId,
                filename: fileState.file.name,
                assetType: getAssetType(fileState.file.type),
              },
            },
          });

          if (!response || !response.data || !response.data.getPostAttachmentUploadURL) {
            throw new Error('Failed to get upload URL from server');
          }

          const { uploadURL, attachmentId } = response.data.getPostAttachmentUploadURL;
          console.log('Got upload URL:', uploadURL);
          console.log('Attachment ID:', attachmentId);

          // 2. Create a FormData object for the file upload
          const formData = new FormData();
          formData.append('file', fileState.file);
          formData.append('url', uploadURL);

          // 3. Use a server-side endpoint to handle the upload
          const uploadResponse = await fetch('/api/upload-file-to-gcs', {
            method: 'POST',
            body: formData,
          });

          if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text();
            console.error(`Upload failed for ${fileState.file.name}:`, errorText);
            throw new Error(`Upload failed with status: ${uploadResponse.status}`);
          }

          console.log(`Upload successful for ${fileState.file.name}`);

          // 4. Notify backend of successful upload
          await completeUpload({
            variables: {
              input: {
                attachmentId,
                success: true,
              },
            },
          });

          // Add to successful attachments
          successfulAttachments.push({
            id: attachmentId,
            name: fileState.file.name,
          });

          // Update file state to preview
          setSelectedFiles((prev) =>
            prev.map((fs) => (fs.file === fileState.file ? { ...fs, state: 'preview' } : fs))
          );

          console.log('Upload completed successfully for:', fileState.file.name);
        } catch (error) {
          console.error('Error processing file:', error);
          toast.error(`Failed to upload ${fileState.file.name}`);

          // Update file state to failed
          setSelectedFiles((prev) =>
            prev.map((fs) =>
              fs.file === fileState.file
                ? {
                    ...fs,
                    state: 'failed',
                    errorMessage: 'Failed to upload file',
                  }
                : fs
            )
          );
        }
      }

      // Clear the uppy queue and selected files
      uppy.cancelAll();
      setSelectedFiles([]);

      // Close the uploader
      onClose();

      // Notify parent component about added attachments
      if (onAttachmentsAdded && successfulAttachments.length > 0) {
        onAttachmentsAdded(successfulAttachments);
      }
    } catch (error) {
      console.error('Error in upload process:', error);
      toast.error('Failed to upload files. Please try again.');
    } finally {
      setUploadingFiles(false);
    }
  }, [uppy, draftPostId, getUploadUrl, completeUpload, onClose, selectedFiles, onAttachmentsAdded]);

  // Keep the existing file handling effects
  useEffect(() => {
    const handleFileAdded = (file: UppyFile<any, any>) => {
      console.log('File added to Uppy:', file.name);
    };

    const handleFilesAdded = (files: UppyFile<any, any>[]) => {
      console.log('Files added to Uppy, count:', files.length);
    };

    uppy.on('file-added', handleFileAdded);
    uppy.on('files-added', handleFilesAdded);

    return () => {
      uppy.off('file-added', handleFileAdded);
      uppy.off('files-added', handleFilesAdded);
    };
  }, [uppy]);

  // Keep the existing drag and drop effect
  useEffect(() => {
    const dropArea = dropAreaRef.current;
    if (!dropArea) return;

    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
      setIsDragging(true);
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      // Only set isDragging to false if we're leaving the drop area
      // and not entering a child element
      const rect = dropArea.getBoundingClientRect();
      const x = e.clientX;
      const y = e.clientY;

      if (x <= rect.left || x >= rect.right || y <= rect.top || y >= rect.bottom) {
        setIsDragging(false);
      }
    };

    dropArea.addEventListener('dragenter', handleDragEnter);
    dropArea.addEventListener('dragover', handleDragOver);
    dropArea.addEventListener('dragleave', handleDragLeave);
    dropArea.addEventListener('drop', handleDrop);

    return () => {
      dropArea.removeEventListener('dragenter', handleDragEnter);
      dropArea.removeEventListener('dragover', handleDragOver);
      dropArea.removeEventListener('dragleave', handleDragLeave);
      dropArea.removeEventListener('drop', handleDrop);
    };
  }, [uppy]);

  // Clean up Uppy instance on unmount
  useEffect(() => {
    return () => {
      uppy.cancelAll();
    };
  }, [uppy]);

  if (!isOpen) return null;

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50"
          data-uploader-modal
        >
          <div
            className="relative w-[480px] bg-white rounded-[24px] flex flex-col"
            style={{
              padding: '32px 20px 20px 20px',
            }}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-[22px] right-[22px] text-neutral-400 hover:text-neutral-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Title and Subtitle */}
            <div className="text-center mb-7">
              <p style={{ ...textStyles.h4, color: CoreColors.Black }}>Add a File</p>
              <p style={{ ...textStyles.body2Reg, color: Neutral.N500, marginTop: '4px' }}>
                You can add a pdf, doc, image, or video
              </p>
            </div>

            {/* File preview area */}
            <div className="flex flex-col">
              <div
                ref={dropAreaRef}
                className={`w-[440px] h-[220px] mx-auto border-2 ${
                  isDragging ? 'border-[#F97316] bg-orange-50' : 'border-dashed border-neutral-300'
                } rounded-[16px] transition-colors duration-200 relative`}
              >
                {isDragging && (
                  <div className="absolute inset-[6px] mx-auto bg-white border-2 border-dashed border-neutral-300 rounded-[12px] flex flex-col items-center justify-center">
                    <div className="mb-5">
                      <img
                        src="/assets/icons/upload.svg"
                        alt="Upload"
                        className="w-[68px] h-[72px]"
                        style={{
                          filter:
                            'invert(60%) sepia(75%) saturate(1505%) hue-rotate(346deg) brightness(101%) contrast(96%)',
                        }}
                      />
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <p style={{ ...textStyles.body2Reg, color: CoreColors.Black }}>
                        Drag & drop here or
                      </p>
                      <label className="cursor-pointer">
                        <p style={{ ...textStyles.body2Reg, color: '#F97316' }}>
                          browse your files
                        </p>
                        <input
                          type="file"
                          multiple
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                )}
                {!isDragging && (
                  <div className="flex flex-col items-center justify-center h-full">
                    {/* Drop area when no files are selected */}
                    <div className="mb-5">
                      <img
                        src="/assets/icons/upload.svg"
                        alt="Upload"
                        className="w-[68px] h-[72px]"
                      />
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <p style={{ ...textStyles.body2Reg, color: CoreColors.Black }}>
                        Drag & drop here or
                      </p>
                      <label className="cursor-pointer">
                        <p style={{ ...textStyles.body2Reg, color: '#F97316' }}>
                          browse your files
                        </p>
                        <input
                          type="file"
                          multiple
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* Selected Files Display */}
              {selectedFiles.length > 0 && (
                <div className="mt-4 space-y-2">
                  {selectedFiles.map((fileState, index) => (
                    <FileAttachment
                      key={index}
                      filename={fileState.file.name}
                      fileSize={`${(fileState.file.size / 1024).toFixed(1)} KB`}
                      fileType={getFileType(fileState.file.type)}
                      state={fileState.state}
                      errorMessage={fileState.errorMessage}
                      previewImageUrl={fileState.previewImageUrl}
                      onDelete={() => {
                        setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
                        const fileToRemove = uppy
                          .getFiles()
                          .find((f) => f.name === fileState.file.name);
                        if (fileToRemove) uppy.removeFile(fileToRemove.id);
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Upload button */}
              <div className="flex justify-end gap-2 mt-7">
                <Button
                  variant="outline"
                  size="medium"
                  onClick={() => {
                    uppy.cancelAll();
                    onClose();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="medium"
                  onClick={handleManualUpload}
                  disabled={uploadingFiles || selectedFiles.length === 0}
                >
                  {uploadingFiles ? (
                    <>
                      <span className="inline-block mr-2">
                        <svg
                          className="animate-spin h-5 w-5 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                      </span>
                      Uploading...
                    </>
                  ) : (
                    'Upload'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {previewFile && <PreviewDialog file={previewFile} onClose={() => setPreviewFile(null)} />}

      {/* {isDragging && (
        <div className="fixed inset-0 z-[90] pointer-events-none">
          <div className="absolute inset-0 bg-blue-500 bg-opacity-10 border-4 border-blue-500 border-dashed rounded-lg m-8 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg shadow-lg text-center">
              <svg className="w-16 h-16 text-blue-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <h3 className="text-xl font-bold text-gray-900">Drop files to upload</h3>
              <p className="text-gray-600 mt-1">Release to add files</p>
            </div>
          </div>
        </div>
      )} */}
    </>
  );
}
