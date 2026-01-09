import { useMutation } from '@apollo/client';
import { useState } from 'react';
import { toast } from 'sonner';
import {
  COMPLETE_FILE_UPLOAD,
  type CompleteFileUploadResponse,
  type FileUploadURLResponse,
  GET_FILE_UPLOAD_URL,
} from '@/graphql/file-upload';

interface FileUploaderProps {
  folderId?: string;
  subjectClassroomId?: string;
  onUploadComplete?: () => void;
}

export function FileUploader({
  folderId,
  subjectClassroomId,
  onUploadComplete,
}: FileUploaderProps) {
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});

  const [getUploadUrl] = useMutation<FileUploadURLResponse>(GET_FILE_UPLOAD_URL);
  const [completeUpload] = useMutation<CompleteFileUploadResponse>(COMPLETE_FILE_UPLOAD);

  const uploadFile = async (file: File) => {
    let uploadData: FileUploadURLResponse | undefined;

    try {
      // Get upload URL
      const { data } = await getUploadUrl({
        variables: {
          input: {
            ...(folderId ? { folderId } : { subjectClassroomId }),
            fileName: file.name,
            mimeType: file.type,
          },
        },
      });

      if (!data) throw new Error('Failed to get upload URL');
      uploadData = data;

      const { uploadURL: uploadUrl, folderFileId } = data.getFileUploadURL;

      // Create XMLHttpRequest to track upload progress
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', uploadUrl);
      xhr.setRequestHeader('Content-Type', file.type);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = (event.loaded / event.total) * 100;
          setUploadProgress((prev) => ({
            ...prev,
            [file.name]: progress,
          }));
        }
      };

      // Upload file
      await new Promise<void>((resolve, reject) => {
        xhr.onload = async () => {
          if (xhr.status === 200) {
            try {
              // Complete the upload
              await completeUpload({
                variables: {
                  input: {
                    folderFileID: folderFileId,
                    success: true,
                  },
                },
                refetchQueries: [folderId ? 'GetFolderContent' : 'GetRootContent'],
              });
              resolve();
            } catch (error) {
              reject(error);
            }
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        };
        xhr.onerror = () => reject(new Error('Upload failed'));
        xhr.send(file);
      });

      toast.success(`Successfully uploaded ${file.name}`);
      onUploadComplete?.();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(`Failed to upload ${file.name}`);

      if (error instanceof Error && uploadData) {
        // Notify backend about the failure
        try {
          await completeUpload({
            variables: {
              input: {
                folderFileID: uploadData.getFileUploadURL.folderFileId,
                success: false,
                errorMessage: error.message,
              },
            },
          });
        } catch (completeError) {
          console.error('Failed to notify upload failure:', completeError);
        }
      }
    } finally {
      // Clear progress
      setUploadProgress((prev) => {
        const newProgress = { ...prev };
        delete newProgress[file.name];
        return newProgress;
      });
    }
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files) return;

    const fileArray = Array.from(files);
    for (const file of fileArray) {
      await uploadFile(file);
    }
  };

  return {
    uploadFile,
    handleFileSelect,
    uploadProgress,
  };
}
