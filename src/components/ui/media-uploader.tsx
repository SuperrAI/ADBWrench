import * as React from 'react';
import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

interface MediaUploaderProps {
  onUpload: (files: File[]) => void;
  children: React.ReactNode;
}

export function MediaUploader({ onUpload, children }: MediaUploaderProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      onUpload(acceptedFiles);
    },
    [onUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
      'video/*': ['.mp4', '.webm'],
      'application/pdf': ['.pdf'],
    },
    multiple: true,
  });

  return (
    <div {...getRootProps()}>
      <input {...getInputProps()} />
      {children}
    </div>
  );
}
