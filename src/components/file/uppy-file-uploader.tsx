import { useCallback, useEffect, useRef, useState } from 'react';
import { gql, useApolloClient, useLazyQuery, useMutation, useQuery } from '@apollo/client';
import { toast } from 'sonner';
import Uppy, { UppyFile } from '@uppy/core';
import { Button } from '@/design-system/components/Button';
import { Download, X } from 'lucide-react';
import PDFViewer from '@/app/file/[id]/pdf-viewer';
import ImageViewer from '@/app/file/[id]/image-viewer';
import VideoPlayer from '@/app/file/[id]/video-player';
import {
  AssetType,
  COMPLETE_FILE_UPLOAD,
  type CompleteFileUploadResponse,
} from '@/graphql/file-upload';
import { textStyles } from '@/design-system/foundations/typography';
import { CoreColors, Neutral } from '@/design-system/foundations/colors';
import { FileAttachment, FileType } from '@/design-system/components/FileAttachment';

// Import styles
import '@uppy/core/dist/style.min.css';
import '@uppy/dashboard/dist/style.min.css';
import { GET_FOLDER_CONTENT, GET_ROOT_CONTENT } from '@/graphql/folder';

const GET_FILE_UPLOAD_URL = gql`
  mutation GetFileUploadURL($input: GetFileUploadURLInput!) {
    getFileUploadURL(input: $input) {
      uploadURL
      folderFileId
    }
  }
`;

const GET_PAPER_UPLOAD_URL = gql`
  query GetPaperUploadURL($input: GetPaperUploadURLInput!) {
    getPaperUploadURL(input: $input) {
      uploadUrl
      assetId
    }
  }
`;

interface GetFileUploadURLResponse {
  getFileUploadURL: {
    uploadURL: string;
    folderFileId: string;
  };
}

interface GetPaperUploadURLResponse {
  getPaperUploadURL: {
    uploadUrl: string;
    assetId: string;
  };
}

export type UploadPurpose = 'CLASS_UPLOAD' | 'TASK_FILE_UPLOAD';

export interface UploadedFileInfo {
  id: string;
  name: string;
  type: string; // MIME type
  size: number;
  fileType: 'document' | 'image' | 'video' | 'pdf' | 'audio' | 'other';
  fileFormat: string; // e.g., "PDF", "PNG", "Video • 5MB"
  downloadUrl?: string;
  previewUrl?: string; // Object URL for immediate preview
}

// Helper function to determine file type and format from MIME type and name
function getFileTypeAndFormat(
  mimeType: string,
  fileName: string,
  fileSize: number
): { fileType: UploadedFileInfo['fileType']; fileFormat: string } {
  const extension = fileName.split('.').pop()?.toLowerCase() || '';

  if (mimeType.startsWith('image/')) {
    return {
      fileType: 'image',
      fileFormat: extension.toUpperCase(),
    };
  }

  if (mimeType.startsWith('video/')) {
    const sizeMB = Math.round(fileSize / (1024 * 1024));
    return {
      fileType: 'video',
      fileFormat: `Video • ${sizeMB}MB`,
    };
  }

  if (mimeType.startsWith('audio/')) {
    return {
      fileType: 'audio',
      fileFormat: extension.toUpperCase(),
    };
  }

  if (mimeType === 'application/pdf' || extension === 'pdf') {
    return {
      fileType: 'pdf',
      fileFormat: 'PDF',
    };
  }

  if (
    ['doc', 'docx', 'txt', 'rtf'].includes(extension) ||
    mimeType.includes('document') ||
    mimeType.includes('text')
  ) {
    return {
      fileType: 'document',
      fileFormat: extension.toUpperCase(),
    };
  }

  return {
    fileType: 'other',
    fileFormat: extension.toUpperCase() || 'FILE',
  };
}

const GET_FILE_DOWNLOAD_URL = gql`
  query GetFileDownloadURL($folderFileId: ID!) {
    getFileDownloadURL(folderFileId: $folderFileId) {
      downloadUrl
    }
  }
`;

export interface UppyFileUploaderProps {
  folderId?: string;
  subjectClassroomId?: string;
  isOpen: boolean;
  onClose: () => void;
  uploadPurpose: UploadPurpose;
  submissionId?: string;
  onFilesUploaded?: (files: UploadedFileInfo[]) => void;
}

interface CustomMeta {
  folderFileId?: string;
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
  file: UppyFileWithMeta;
  onClose: () => void;
}

function PreviewDialog({ file, onClose }: PreviewDialogProps) {
  const [objectUrl, setObjectUrl] = useState<string>('');
  const [downloadURL, setDownloadURL] = useState<string | null>(null);

  const { loading } = useQuery(GET_FILE_DOWNLOAD_URL, {
    variables: { folderFileId: file.meta.folderFileId },
    skip: !file.meta.folderFileId,
    onCompleted: (data) => {
      setDownloadURL(data.getFileDownloadURL.downloadUrl);
    },
    onError: (error) => {
      toast.error('Failed to get file download URL');
      console.error('Error getting file download URL:', error);
    },
  });

  useEffect(() => {
    const url = URL.createObjectURL(file.data);
    setObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const renderPreview = () => {
    const fileType = file.type.split('/')[0];

    switch (fileType) {
      case 'image':
        return <ImageViewer src={objectUrl} />;
      case 'video':
        return <VideoPlayer url={objectUrl} />;
      case 'application':
        if (file.type === 'application/pdf') {
          return <PDFViewer file={objectUrl} />;
        }
        return <div className="text-center p-4">Preview not available for this file type</div>;
      default:
        return <div className="text-center p-4">Preview not available for this file type</div>;
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-4xl h-[80vh] bg-white rounded-lg p-4">
        <div className="absolute right-2 top-2 z-[70] flex items-center gap-2">
          {downloadURL && (
            <a
              href={downloadURL}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              <Download className="h-4 w-4" />
            </a>
          )}
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="h-full">
          {loading ? (
            <div className="w-full h-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-800" />
            </div>
          ) : (
            renderPreview()
          )}
        </div>
      </div>
    </div>
  );
}

interface UppyResponseData {
  status: number;
  success: boolean;
  message?: string;
  bytesUploaded?: number;

  [key: string]: unknown;
}

// Add this helper function to generate unique filenames
const generateUniqueFileName = (originalName: string | undefined): string => {
  // Handle undefined case
  if (!originalName) {
    return `unnamed_file_${new Date().getTime()}_${Math.random().toString(36).substring(2, 8)}`;
  }

  // Extract file extension
  const lastDotIndex = originalName.lastIndexOf('.');
  const extension = lastDotIndex !== -1 ? originalName.slice(lastDotIndex) : '';
  const nameWithoutExtension =
    lastDotIndex !== -1 ? originalName.slice(0, lastDotIndex) : originalName;

  // Add timestamp and random string to make filename unique
  const timestamp = new Date().getTime();
  const randomString = Math.random().toString(36).substring(2, 8);

  return `${nameWithoutExtension}_${timestamp}_${randomString}${extension}`;
};

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

export default function UppyFileUploader({
  folderId,
  subjectClassroomId,
  isOpen,
  onClose,
  uploadPurpose,
  submissionId,
  onFilesUploaded,
}: UppyFileUploaderProps) {
  const apolloClient = useApolloClient();
  const [previewFile, setPreviewFile] = useState<UppyFileWithMeta | null>(null);
  const [getUploadUrl] = useMutation<GetFileUploadURLResponse>(GET_FILE_UPLOAD_URL);
  const [getPaperUploadUrl] = useLazyQuery<GetPaperUploadURLResponse>(GET_PAPER_UPLOAD_URL);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [uploadingFiles, setUploadingFiles] = useState<boolean>(false);
  const [selectedFiles, setSelectedFiles] = useState<FileState[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFileIds, setUploadedFileIds] = useState<string[]>([]);
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
      },
      autoProceed: false,
    });

    // Instead of using XHRUpload directly, we'll implement a custom upload strategy
    return uppyInstance;
  }

  // Create a new Uppy instance each time the component mounts
  const [uppy] = useState(() => createUppyInstance());

  // Add a query to monitor the current folder/root content (only for CLASS_UPLOAD)
  const shouldRunContentQuery =
    uploadPurpose === 'CLASS_UPLOAD' && isOpen && (folderId || subjectClassroomId);
  const { refetch: refetchContent } = useQuery(folderId ? GET_FOLDER_CONTENT : GET_ROOT_CONTENT, {
    variables: folderId ? { id: folderId } : { subjectClassroomId },
    skip: !shouldRunContentQuery,
    fetchPolicy: 'network-only',
    onError: (error) => {
      console.error('Error fetching content:', error);
    },
  });

  // Safe refetch function that only works for CLASS_UPLOAD
  const safeRefetchContent = useCallback(async () => {
    if (uploadPurpose === 'CLASS_UPLOAD' && refetchContent) {
      try {
        const result = await refetchContent();
        console.log('Content refetched after upload:', result);
        return result;
      } catch (error) {
        console.error('Failed to refetch content after upload:', error);
        try {
          await apolloClient.resetStore();
          await refetchContent();
        } catch (retryError) {
          console.error('Failed to recover after store reset:', retryError);
          toast.error('Failed to update file list. Please refresh the page.');
        }
      }
    }
  }, [uploadPurpose, refetchContent, apolloClient]);

  const [completeUpload] = useMutation<CompleteFileUploadResponse>(COMPLETE_FILE_UPLOAD, {
    onCompleted: async (data) => {
      console.log('Upload completion mutation completed:', data);
      await safeRefetchContent();
    },
    onError: (error) => {
      console.error('Upload completion mutation failed:', error);
      toast.error('Failed to complete upload. Please try again.');
    },
  });

  // Modify the handleManualUpload function to use a server-side proxy for uploads
  const handleManualUpload = useCallback(async () => {
    console.log('Upload button clicked!');
    const files = uppy.getFiles();
    console.log('Files to upload:', files.length);

    if (files.length === 0) {
      toast.error('Please add files to upload');
      return;
    }

    setUploadingFiles(true);

    // Update all files to loading state
    setSelectedFiles((prev) =>
      prev.map((fileState) => ({
        ...fileState,
        state: 'loading',
      }))
    );

    // Collect uploaded file information during the process
    const newlyUploadedFiles: UploadedFileInfo[] = [];

    // Process files sequentially to avoid overwhelming the server
    for (const file of files) {
      try {
        console.log('Processing file:', file.name);

        let uploadURL: string;
        let fileId: string;
        let assetType: string | undefined;

        // Switch case for different upload purposes
        switch (uploadPurpose) {
          case 'CLASS_UPLOAD': {
            // Determine the asset type based on the file's MIME type
            assetType = getAssetType(file.type);

            // 1. Get upload URL from backend with the correct input structure
            // Only include folderId if it exists, otherwise use subjectClassroomId
            const input = folderId
              ? {
                  fileName: file.name,
                  assetType: assetType,
                  folderId: folderId,
                }
              : {
                  fileName: file.name,
                  assetType: assetType,
                  subjectClassroomId,
                };

            const response = await getUploadUrl({
              variables: { input },
            });

            // Check if response and data exist before accessing properties
            if (!response || !response.data || !response.data.getFileUploadURL) {
              throw new Error('Failed to get upload URL from server');
            }

            uploadURL = response.data.getFileUploadURL.uploadURL;
            fileId = response.data.getFileUploadURL.folderFileId;
            break;
          }

          case 'TASK_FILE_UPLOAD': {
            if (!submissionId) {
              throw new Error('submissionId is required for TASK_FILE_UPLOAD');
            }

            const paperInput = {
              paperType: 'TASK_SUBMISSION',
              mimeType: file.type,
              submissionId,
            };

            const paperResponse = await getPaperUploadUrl({
              variables: { input: paperInput },
            });

            if (!paperResponse || !paperResponse.data || !paperResponse.data.getPaperUploadURL) {
              throw new Error('Failed to get paper upload URL from server');
            }

            uploadURL = paperResponse.data.getPaperUploadURL.uploadUrl;
            fileId = paperResponse.data.getPaperUploadURL.assetId;
            break;
          }

          default:
            throw new Error(`Unsupported upload purpose: ${uploadPurpose}`);
        }

        console.log('Got upload URL:', uploadURL);
        console.log('File ID:', fileId);

        // Update file metadata
        const updatedFile = uppy.getFile(file.id);
        uppy.setFileMeta(file.id, {
          ...updatedFile.meta,
          uploadURL,
          folderFileId: fileId, // Keep the property name for consistency
          assetType,
        });

        // 2. Upload the file directly to GCS signed URL
        const blob = file.data;

        console.log(`Starting direct upload to GCS: ${uploadURL}`);

        const uploadResponse = await fetch(uploadURL, {
          method: 'PUT',
          headers: {
            'Content-Type': file.type,
          },
          body: blob,
        });

        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text();
          throw new Error(
            `Upload failed with status: ${uploadResponse.status}, message: ${errorText}`
          );
        }

        console.log('Upload successful!');

        // 3. Complete the upload (only for CLASS_UPLOAD)
        if (uploadPurpose === 'CLASS_UPLOAD') {
          await completeUpload({
            variables: {
              input: {
                folderFileId: fileId,
                success: true,
              },
            },
          });
        }

        // Create file info object
        const { fileType, fileFormat } = getFileTypeAndFormat(
          file.type || '',
          file.name || 'Unknown file',
          file.size || 0
        );

        // Create preview URL for images and videos
        let previewUrl: string | undefined;
        if (fileType === 'image' || fileType === 'video') {
          try {
            previewUrl = URL.createObjectURL(file.data);
          } catch (error) {
            console.error('Failed to create object URL for preview:', error);
          }
        }

        const fileInfo: UploadedFileInfo = {
          id: fileId || '',
          name: file.name || 'Unknown file',
          type: file.type || '',
          size: file.size || 0,
          fileType,
          fileFormat,
          previewUrl,
        };

        // Store the uploaded file info
        newlyUploadedFiles.push(fileInfo);
        setUploadedFileIds((prev) => [...prev, fileId]);

        console.log('Upload completed and marked as successful');

        // Mark file as uploaded in Uppy
        uppy.setFileMeta(file.id, {
          ...updatedFile.meta,
          uploadCompleted: true,
        });

        // Update file state to preview
        setSelectedFiles((prev) =>
          prev.map((fs) => (fs.file.name === file.name ? { ...fs, state: 'preview' } : fs))
        );

        toast.success(`Successfully uploaded ${file.name}`);
      } catch (error) {
        console.error('Error processing file:', error);

        // Update file state to failed
        setSelectedFiles((prev) =>
          prev.map((fs) =>
            fs.file.name === file.name
              ? {
                  ...fs,
                  state: 'failed',
                  errorMessage: 'Failed to upload file',
                }
              : fs
          )
        );

        toast.error(
          `Error processing ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    // Refresh the file list (only for CLASS_UPLOAD)
    await safeRefetchContent();

    setUploadingFiles(false);

    // Notify parent component about uploaded files
    if (onFilesUploaded && newlyUploadedFiles.length > 0) {
      onFilesUploaded(newlyUploadedFiles);
    }

    // Close dialog
    uppy.cancelAll();
    setSelectedFiles([]);
    setUploadedFileIds([]);
    onClose();
  }, [
    uppy,
    getUploadUrl,
    folderId,
    subjectClassroomId,
    completeUpload,
    refetchContent,
    onClose,
    selectedFiles,
    uploadPurpose,
    getPaperUploadUrl,
    submissionId,
    onFilesUploaded,
    safeRefetchContent,
  ]);

  // Add this function before the file removal effect
  // Cleanup function for handling file removal
  const handleCleanup = useCallback(
    async (file: UppyFileWithMeta) => {
      console.log('Starting cleanup for file:', file.name);
      const { folderFileId } = file.meta || {};

      if (folderFileId && !file.meta?.uploadCompleted) {
        try {
          // Only perform cleanup for CLASS_UPLOAD
          if (uploadPurpose === 'CLASS_UPLOAD') {
            // First try to evict the file from cache
            apolloClient.cache.evict({
              id: `FolderFile:${folderFileId}`,
            });
            apolloClient.cache.gc();

            // Notify backend that upload was cancelled
            console.log('Marking upload as cancelled:', folderFileId);
            await completeUpload({
              variables: {
                input: {
                  folderFileId: folderFileId,
                  success: false,
                  errorMessage: 'Upload cancelled by user',
                },
              },
            });
            console.log('Cleanup completed for file:', file.name);

            // Force a refetch after cleanup
            await safeRefetchContent();
          } else {
            console.log('Cleanup skipped for TASK_FILE_UPLOAD:', file.name);
          }
        } catch (error) {
          console.error('Error cleaning up cancelled upload:', error);
          // More aggressive recovery
          try {
            await apolloClient.clearStore();
            await apolloClient.resetStore();
            await safeRefetchContent();
          } catch (retryError) {
            console.error('Failed to recover after cleanup error:', retryError);
            toast.error('Failed to update file list. Please refresh the page.');
          }
        }
      }
    },
    [completeUpload, apolloClient, safeRefetchContent, uploadPurpose]
  );

  // Handle file removal
  useEffect(() => {
    const onFileRemoved = (file: UppyFileWithMeta) => {
      handleCleanup(file);
    };

    uppy.on('file-removed', onFileRemoved);
    return () => {
      uppy.off('file-removed', onFileRemoved);
    };
  }, [uppy, handleCleanup]);

  // Handle dialog close
  useEffect(() => {
    if (!isOpen) {
      const files = uppy.getFiles();
      Promise.all(
        files.map((file) => {
          if (!file.meta?.uploadCompleted) {
            return handleCleanup(file as UppyFileWithMeta);
          }
          return Promise.resolve();
        })
      ).catch((error) => {
        console.error('Error during cleanup:', error);
      });
      uppy.cancelAll();
      uppy.removeFiles(files.map((file) => file.id));
    }
  }, [isOpen, uppy, handleCleanup]);

  // Remove the unnecessary interval effect that's making periodic calls
  useEffect(() => {
    if (!isOpen) return;

    // Initial content fetch when dialog opens
    const fetchInitialContent = async () => {
      await safeRefetchContent();
    };

    fetchInitialContent();

    // No interval needed - we'll only refetch after uploads complete
  }, [isOpen, safeRefetchContent]);

  // Add this effect to listen for file additions
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

  // Add this function to handle file selection
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

  // Replace the existing drag and drop effect with this improved version
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

  // Update the useEffect that handles the isOpen state
  useEffect(() => {
    // When the uploader is opened, reset the state
    if (isOpen) {
      // Clear any existing files
      uppy.cancelAll();
      setSelectedFiles([]);
      setUploadingFiles(false);
      setUploadedFileIds([]);

      // Force a refetch of content (only for CLASS_UPLOAD)
      safeRefetchContent().catch((error) => {
        console.error('Error fetching content on open:', error);
      });
    } else {
      // When closing, clean up any incomplete uploads
      const files = uppy.getFiles();
      Promise.all(
        files.map((file) => {
          if (!file.meta?.uploadCompleted) {
            return handleCleanup(file as UppyFileWithMeta);
          }
          return Promise.resolve();
        })
      ).catch((error) => {
        console.error('Error during cleanup:', error);
      });
      uppy.cancelAll();
      uppy.removeFiles(files.map((file) => file.id));
    }
  }, [isOpen, uppy, handleCleanup, safeRefetchContent]);

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
                    setSelectedFiles([]);
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
    </>
  );
}

// Helper function to determine asset type
function getAssetType(mimeType: string): AssetType {
  if (mimeType.startsWith('image/')) return AssetType.IMAGE;
  if (mimeType === 'application/pdf') return AssetType.PDF;
  if (mimeType.startsWith('audio/')) return AssetType.AUDIO;
  if (mimeType.startsWith('video/')) return AssetType.VIDEO;
  // Default to PDF if unknown
  return AssetType.PDF;
}
