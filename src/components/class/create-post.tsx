import { Button } from '@/design-system/components/Button';
import { Card, CardContent } from '@/components/ui/card';
import { PlusIcon } from '@heroicons/react/24/outline';
import { Avatar } from '@/components/ui/dicebear-avatar';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { gql, useApolloClient, useMutation } from '@apollo/client';
import { CREATE_POST } from '@/lib/graphql/posts';
import { PostParentType } from '@/types/post';
import RichTextEditor from '@/components/ui/rich-text-editor';
import UppyAttachmentUploader from '@/components/posts/uppy-attachment-uploader';
import { v4 as uuidv4 } from 'uuid';
import type { AttachmentFileType as FileAttachmentType } from '@/design-system/components/FileAttachment';
import { FileAttachment } from '@/design-system/components/FileAttachment';
import VideoPlayer from '@/app/file/[id]/video-player';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { type FileType } from '@/design-system/components/File';
import Image from 'next/image';
import { CoreColors, Neutral, Orange } from '@/design-system/foundations/colors';
import { cn } from '@/lib/utils';
import { EmojiPicker } from '@/design-system/components/emoji-picker';

interface CreatePostProps {
  className?: string;
  isExpanded: boolean;
  onExpand: () => void;
  onCollapse: () => void;
  onPost: () => void;
  parentId: string;
  parentType: PostParentType;
  initialState?: {
    title?: string;
    content?: string;
  };
}

// Define AssetType enum if not already defined elsewhere
enum AssetType {
  IMAGE = 'IMAGE',
  PDF = 'PDF',
  VIDEO = 'VIDEO',
  OTHER = 'OTHER',
}

// Define PostAttachment interface
interface PostAttachment {
  id: string;
  name: string;
  downloadURL?: string;
  type?: AssetType;
  status?: 'PENDING' | 'COMPLETE';
  thumbnailUrl?: string;
  error?: boolean;
  loadingState?: 'loading' | 'loaded' | 'error';
}

const stripHtml = (html: string) => {
  // Return empty string for falsy values
  if (!html) return '';

  // Create a temporary div
  const tmp = document.createElement('div');
  tmp.innerHTML = html;

  // Get text content
  const textContent = tmp.textContent || tmp.innerText || '';

  // Return empty string if only whitespace remains
  return textContent.trim();
};

interface PostData {
  content: string;
  title: string;
}

const hasContent = (title: string, content: string) => {
  return Boolean(title.trim() || stripHtml(content).trim());
};

// Update the formatDisplayText function to return separate title and content parts
const formatDisplayText = (title: string, content: string, maxLength: number = 60) => {
  const titleText = title.trim();
  const contentText = stripHtml(content).trim();

  if (!titleText && !contentText) return { title: '', content: '' };

  if (titleText && !contentText) {
    return titleText.length > maxLength
      ? { title: `${titleText.substring(0, maxLength)}...`, content: '' }
      : { title: titleText, content: '' };
  }

  if (!titleText && contentText) {
    return contentText.length > maxLength
      ? { title: '', content: `${contentText.substring(0, maxLength)}...` }
      : { title: '', content: contentText };
  }

  // Both title and content exist
  const combinedLength = titleText.length + contentText.length + 3; // 3 for " - "

  if (combinedLength <= maxLength) {
    return { title: titleText, content: contentText };
  }

  // If title alone is too long
  if (titleText.length >= maxLength - 3) {
    return { title: `${titleText.substring(0, maxLength - 3)}...`, content: '' };
  }

  // Show title and truncated content
  const availableSpace = maxLength - titleText.length - 3; // 3 for " - "
  return {
    title: titleText,
    content: `${contentText.substring(0, availableSpace)}...`,
  };
};

// Add this query to fetch attachment download URLs
const GET_POST_ATTACHMENT_DOWNLOAD_URL = gql`
  query GetPostAttachmentDownloadURL($attachmentId: ID!) {
    getPostAttachmentDownloadURL(attachmentId: $attachmentId) {
      downloadURL
    }
  }
`;

// Function to determine file type based on filename - Used for data model
const getFileType = (filename: string): AssetType => {
  if (filename.match(/\.(jpg|jpeg|png|gif|webp)$/i)) return AssetType.IMAGE;
  if (filename.match(/\.(pdf)$/i)) return AssetType.PDF;
  if (filename.match(/\.(mp4|webm|ogg|mov|avi)$/i)) return AssetType.VIDEO;
  return AssetType.OTHER;
};

// Function to determine FileAttachment component type - Used for UI
const getFileAttachmentType = (filename: string): FileAttachmentType => {
  if (filename.match(/\.(jpg|jpeg|png|gif|webp)$/i)) return 'image';
  if (filename.match(/\.(pdf)$/i)) return 'pdf';
  if (filename.match(/\.(doc|docx)$/i)) return 'document';
  if (filename.match(/\.(xls|xlsx|csv)$/i)) return 'spreadsheet';
  if (filename.match(/\.(ppt|pptx)$/i)) return 'presentation';
  if (filename.match(/\.(mp4|webm|ogg|mov|avi)$/i)) return 'video';
  if (filename.match(/\.(mp3|wav|ogg)$/i)) return 'audio';
  if (filename.match(/\.(zip|rar|tar|gz)$/i)) return 'archive';
  if (filename.match(/\.(js|jsx|ts|tsx|html|css|php|py|java|rb|c|cpp)$/i)) return 'code';
  return 'other';
};

// Map file type to the FileType used by the File component
const mapToDesignSystemFileType = (filename: string): FileType => {
  if (filename.match(/\.(jpg|jpeg|png|gif|webp)$/i)) return 'image';
  if (filename.match(/\.(pdf)$/i)) return 'pdf';
  if (filename.match(/\.(mp4|webm|ogg|mov|avi)$/i)) return 'video';
  if (filename.match(/\.(doc|docx)$/i)) return 'document';
  if (filename.match(/\.(xls|xlsx|csv)$/i)) return 'spreadsheet';
  if (filename.match(/\.(ppt|pptx)$/i)) return 'presentation';
  if (filename.match(/\.(zip|rar|tar|gz)$/i)) return 'archive';
  if (filename.match(/\.(mp3|wav|ogg)$/i)) return 'audio';
  if (filename.match(/\.(js|jsx|ts|tsx|html|css|php|py|java|rb|c|cpp)$/i)) return 'code';
  return 'other';
};

// Function to get the file extension
const getFileExtension = (filename: string): string => {
  const parts = filename.split('.');
  return parts.length > 1 ? parts.pop()?.toUpperCase() || '' : '';
};

export function CreatePost({
  className = '',
  isExpanded,
  onExpand,
  onCollapse,
  onPost,
  parentId,
  parentType,
  initialState = {},
}: CreatePostProps) {
  // Consolidated state into a single object to reduce re-renders
  const [postData, setPostData] = useState<PostData>({
    content: initialState.content || '',
    title: initialState.title || '',
  });

  const cardRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLTextAreaElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  const [selectedInput, setSelectedInput] = useState<'title' | 'content' | null>(null);
  // Generate a draft post ID when the component mounts
  const [draftPostId] = useState(() => uuidv4());

  // State for attachment uploader
  const [isAttachmentUploaderOpen, setIsAttachmentUploaderOpen] = useState(false);
  const [attachments, setAttachments] = useState<PostAttachment[]>([]);

  // Add state for screen width
  const [screenWidth, setScreenWidth] = useState(0);

  // Add state for the viewer modal
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedAttachment, setSelectedAttachment] = useState<{
    id: string;
    name: string;
    downloadURL?: string;
    type: 'image' | 'pdf' | 'video' | 'other';
  } | null>(null);

  const [createPost, { loading }] = useMutation(CREATE_POST);

  // Add Apollo client for queries
  const apolloClient = useApolloClient();

  // Detect screen width on the client side
  useEffect(() => {
    // Only run in the browser
    if (typeof window !== 'undefined') {
      const handleResize = () => {
        setScreenWidth(window.innerWidth);
      };

      // Set initial width
      handleResize();

      // Add event listener
      window.addEventListener('resize', handleResize);

      // Clean up
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  // Function to fetch download URLs for attachments
  const fetchAttachmentDownloadURLs = useCallback(
    async (newAttachments: Array<{ id: string; name: string }>) => {
      // Set initial loading state
      const attachmentsLoading = newAttachments.map((attachment) => ({
        ...attachment,
        status: 'PENDING' as const,
        type: getFileType(attachment.name),
        loadingState: 'loading' as const,
      }));

      setAttachments((prev) => [...prev, ...attachmentsLoading]);

      const attachmentsWithURLs = await Promise.all(
        newAttachments.map(async (attachment) => {
          try {
            const { data } = await apolloClient.query({
              query: GET_POST_ATTACHMENT_DOWNLOAD_URL,
              variables: { attachmentId: attachment.id },
            });

            return {
              ...attachment,
              downloadURL: data?.getPostAttachmentDownloadURL?.downloadURL || undefined,
              status: 'COMPLETE' as const,
              type: getFileType(attachment.name),
              loadingState: 'loaded' as const,
            };
          } catch (error) {
            console.error(`Error fetching download URL for attachment ${attachment.id}:`, error);
            return {
              ...attachment,
              status: 'COMPLETE' as const,
              type: getFileType(attachment.name),
              error: true,
              loadingState: 'error' as const,
            };
          }
        })
      );

      // Fix: Using same approach as in handleAttachmentsAdded to prevent duplicates
      setAttachments((prev) => {
        // First, filter out the pending attachments we just added
        const newIds = new Set(newAttachments.map((a) => a.id));
        const withoutPending = prev.filter((a) => !newIds.has(a.id));

        // Then add the attachments with URLs
        return [...withoutPending, ...attachmentsWithURLs];
      });

      return attachmentsWithURLs;
    },
    [apolloClient]
  );

  // Handle attachments added from uploader
  const handleAttachmentsAdded = useCallback(
    async (newAttachments: Array<{ id: string; name: string }>) => {
      // First check if adding these attachments would exceed the limit of 5
      if (attachments.length + newAttachments.length > 5) {
        // Only take as many as we can add without exceeding the limit
        const remainingSlots = Math.max(0, 5 - attachments.length);
        newAttachments = newAttachments.slice(0, remainingSlots);

        // If we can't add any, return early
        if (remainingSlots === 0) {
          return;
        }
      }

      // Check for duplicates or files that are already in the attachments list
      const existingIds = new Set(attachments.map((a) => a.id));
      const uniqueNewAttachments = newAttachments.filter(
        (attachment) => !existingIds.has(attachment.id)
      );

      if (uniqueNewAttachments.length === 0) {
        return; // No new unique attachments to add
      }

      // First add them as pending
      const pendingAttachments = uniqueNewAttachments.map((attachment) => ({
        ...attachment,
        status: 'PENDING' as const,
        type: getFileType(attachment.name),
      }));

      // Update the attachments state with the new pending attachments
      setAttachments((prev) => [...prev, ...pendingAttachments]);

      // Then fetch URLs and update
      const attachmentsWithURLs = await fetchAttachmentDownloadURLs(uniqueNewAttachments);

      // Fix: Instead of using map which can result in duplicates if not handled correctly,
      // create a new array by filtering out the pending attachments and adding the completed ones
      setAttachments((prev) => {
        // First, filter out the pending attachments we just added
        const newIds = new Set(uniqueNewAttachments.map((a) => a.id));
        const withoutPending = prev.filter((a) => !newIds.has(a.id));

        // Then add the attachments with URLs
        return [...withoutPending, ...attachmentsWithURLs];
      });
    },
    [fetchAttachmentDownloadURLs, attachments]
  );

  // Function to remove an attachment
  const handleRemoveAttachment = useCallback((attachmentId: string) => {
    // Log the ID we're removing
    console.log('Removing attachment with ID:', attachmentId);

    // Get a snapshot of the current attachments for logging
    setAttachments((prevAttachments) => {
      console.log(
        'Current attachment IDs:',
        prevAttachments.map((a) => a.id)
      );

      // Filter out ONLY the attachment with the matching ID
      const newAttachments = prevAttachments.filter((attachment) => attachment.id !== attachmentId);

      console.log(
        'Remaining attachment IDs:',
        newAttachments.map((a) => a.id)
      );
      console.log('Remaining attachment count:', newAttachments.length);

      return newAttachments;
    });
  }, []);

  // Effect to auto-resize the textarea based on content
  useEffect(() => {
    if (isExpanded && titleInputRef.current) {
      const textarea = titleInputRef.current;

      const adjustHeight = () => {
        // Reset height to auto to get the correct scrollHeight
        textarea.style.height = '0px';

        // Set the height based on content
        const scrollHeight = textarea.scrollHeight;
        textarea.style.height = `${scrollHeight}px`;
      };

      // Initial adjustment
      adjustHeight();

      // Add event listener for input changes
      textarea.addEventListener('input', adjustHeight);

      return () => {
        textarea.removeEventListener('input', adjustHeight);
      };
    }
  }, [isExpanded, postData.title]);

  // Update the handlePost function with proper TypeScript types
  const handlePost = async () => {
    if (!hasContent(postData.title, postData.content)) return;

    try {
      // Define the expected type for userData
      interface UserData {
        me?: {
          id: string;
        };
      }

      const userData =
        apolloClient.cache.readQuery<UserData>({
          query: gql`
            query GetCurrentUser {
              me {
                id
              }
            }
          `,
        }) || {};

      // If we can't get the user ID from cache, try to get it from the token
      let userId;
      if (userData?.me?.id) {
        userId = userData.me.id;
      } else {
        // Fallback to hardcoded user ID for development
        userId = '1'; // Replace with your test user ID
        console.log('Using fallback user ID for development:', userId);
      }

      await createPost({
        variables: {
          input: {
            title: postData.title.trim(),
            content: postData.content.trim(),
            parentID: parentId,
            parentType,
            draftPostId: draftPostId,
            userId: userId,
          },
        },
      });

      // Reset state
      setPostData({ title: '', content: '' });
      setAttachments([]);
      onPost();
      onCollapse();
    } catch (error) {
      console.error('Error creating post:', error);
    }
  };

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handlePost();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onCollapse();
      }
    },
    [handlePost, onCollapse]
  );

  // Create a handler for native KeyboardEvent for the RichTextEditor
  const handleNativeKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handlePost();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onCollapse();
      }
    },
    [handlePost, onCollapse]
  );

  // Update the click outside handler
  useEffect(() => {
    if (!isExpanded) return;

    const handleClickOutside = (event: MouseEvent) => {
      // If the attachment uploader is open, don't close the create post component
      if (isAttachmentUploaderOpen) return;

      const target = event.target as HTMLElement;

      // Check if click is within the card
      const isCardClick = cardRef.current?.contains(target);

      // Only close if click is outside the card
      if (!isCardClick) {
        onCollapse();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isExpanded, onCollapse, isAttachmentUploaderOpen]);

  // Focus effect
  useEffect(() => {
    if (isExpanded && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [isExpanded]);

  const { title, content } = postData;
  const hasContentValue = hasContent(title, content);

  // Function to focus the rich text editor
  const focusEditor = () => {
    if (editorRef.current) {
      const editorElement = editorRef.current.querySelector('[contenteditable="true"]');
      if (editorElement) {
        (editorElement as HTMLElement).focus();
      }
    }
  };

  // Function to handle attachment click
  const handleAttachmentClick = (attachment: PostAttachment) => {
    if (!attachment.downloadURL || attachment.loadingState === 'loading') return;

    const fileType = getFileType(attachment.name);

    // If it's a type we can preview, open the viewer
    if (['image', 'pdf', 'video'].includes(fileType.toString().toLowerCase())) {
      setSelectedAttachment({
        id: attachment.id,
        name: attachment.name,
        downloadURL: attachment.downloadURL,
        type: fileType.toString().toLowerCase() as 'image' | 'pdf' | 'video' | 'other',
      });
      setViewerOpen(true);
    } else {
      // For other file types, just download directly
      window.open(attachment.downloadURL, '_blank');
    }
  };

  // Render attachments using the FileAttachment component
  const renderAttachments = () => {
    if (attachments.length === 0) return null;

    return (
      <div className="mt-4 flex flex-wrap gap-2">
        {attachments.map((attachment) => {
          // Determine the appropriate state and props based on attachment status and type
          const isLoading = attachment.status === 'PENDING';
          const isImage = attachment.type === AssetType.IMAGE && attachment.downloadURL;
          const hasError = attachment.error === true;

          return (
            <div key={attachment.id} className="w-[240px] mb-2">
              <FileAttachment
                filename={attachment.name}
                fileSize=""
                fileType={getFileAttachmentType(attachment.name)}
                state={
                  hasError ? 'failed' : isLoading ? 'loading' : isImage ? 'preview' : 'default'
                }
                previewImageUrl={isImage ? attachment.downloadURL : undefined}
                onDelete={() => handleRemoveAttachment(attachment.id)}
                spinnerPrimaryColor="#FF6F1E"
                spinnerSecondaryColor="#FFF0E6"
                errorMessage={hasError ? 'Failed to load file' : undefined}
              />
            </div>
          );
        })}
      </div>
    );
  };

  // Render the file viewer component
  const renderFileViewer = () => {
    if (!selectedAttachment || !viewerOpen) return null;

    // Since we've already checked that selectedAttachment is not null above,
    // TypeScript should know it's safe to use properties from it
    const { name, downloadURL, type } = selectedAttachment;

    return (
      <Dialog open={viewerOpen} onOpenChange={setViewerOpen}>
        <DialogContent className="max-w-4xl w-[90vw] h-[80vh] p-0 overflow-hidden">
          <div
            style={{
              color: CoreColors.White,
            }}
            className="relative w-full h-full  flex flex-col"
          >
            {/* Header with filename and download button */}
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-medium">{name}</h2>
              <div className="flex items-center gap-2">
                {downloadURL && (
                  <a
                    style={{
                      backgroundColor: CoreColors.White,
                      borderColor: Neutral.N200,
                    }}
                    href={downloadURL}
                    download={name}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg borderrounded-md text-sm font-medium hover:bg-neutral-50"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      />
                    </svg>
                    Download
                  </a>
                )}
              </div>
            </div>

            {/* Content area */}
            <div
              style={{
                backgroundColor: Neutral.N100,
              }}
              className="flex-1 overflow-auto"
            >
              {type === 'image' && downloadURL && (
                <div className="w-full h-full">
                  <div className="flex justify-center items-center h-full">
                    <Image
                      src={downloadURL}
                      alt={name}
                      width={1000}
                      height={1000}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                </div>
              )}

              {type === 'pdf' && downloadURL && (
                <div className="w-full h-full">
                  <iframe src={`${downloadURL}#toolbar=0`} className="w-full h-full" title={name} />
                </div>
              )}

              {type === 'video' && downloadURL && (
                <div className="w-full h-full relative">
                  <VideoPlayer url={downloadURL} controls />
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  // Add click outside handler for emoji picker
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
        setSelectedInput(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle emoji selection
  const handleEmojiSelect = (emoji: string) => {
    if (selectedInput === 'title') {
      const textarea = titleInputRef.current;
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;

        const updatedTitle = text.slice(0, start) + emoji + text.slice(end);
        setPostData((prev) => ({
          ...prev,
          title: updatedTitle,
        }));

        // Update cursor position after inserting the emoji
        setTimeout(() => {
          textarea.setSelectionRange(start + emoji.length, start + emoji.length);
          textarea.focus();
        }, 0);
      }
    } else if (selectedInput === 'content') {
      const editor = editorRef.current?.querySelector('[contenteditable="true"]');
      if (editor) {
        const selection = window.getSelection();
        const range = selection?.getRangeAt(0);

        if (range) {
          // Insert the emoji at the cursor position
          range.insertNode(document.createTextNode(emoji));
          // Move cursor after the inserted emoji
          range.setStartAfter(range.endContainer);
          range.collapse(true);
          selection?.removeAllRanges();
          selection?.addRange(range);
        } else {
          // If no selection, append to the end
          setPostData((prev) => ({
            ...prev,
            content: prev.content + emoji,
          }));
        }
      }
    }
    setShowEmojiPicker(false);
    setSelectedInput(null);
  };

  // Function to toggle emoji picker for specific input
  const toggleEmojiPicker = (inputType: 'title' | 'content') => {
    setSelectedInput(inputType);
    setShowEmojiPicker(!showEmojiPicker);
  };

  return (
    <div className="relative h-[76px]">
      {/* Add overlay when expanded */}
      {isExpanded && (
        <div
          className="fixed inset-0 bg-black/50 z-[65]"
          onClick={(e) => {
            e.stopPropagation();
            // Only collapse if the uploader is not open
            if (!isAttachmentUploaderOpen) {
              onCollapse();
            }
          }}
        />
      )}

      <Card
        ref={cardRef}
        className={`overflow-hidden ${className} ${
          isExpanded
            ? 'absolute top-0 left-0 right-0 z-[70] shadow-xl w-[694px] mx-auto rounded-[20px] transition-all duration-300'
            : 'h-full cursor-pointer rounded-[20px] shadow-sm hover:shadow-md transition-shadow duration-300 w-[694px]'
        }`}
        style={{
          minHeight: isExpanded ? '200px' : '76px',
          maxHeight: isExpanded ? '620px' : '76px',
          height: isExpanded ? 'auto' : '76px',
          borderColor: Neutral.N200,
          backgroundColor: CoreColors.White,
        }}
        onClick={() => !isExpanded && onExpand()}
      >
        <CardContent
          className={`flex flex-col ${isExpanded ? 'p-4' : 'pl-4 pr-5 pb-4 pt-3'}`}
          onClick={(e) => {
            if (isExpanded) {
              e.stopPropagation();
            }
          }}
        >
          {/* Close button - Only shown in expanded state */}
          {isExpanded && (
            <div className="absolute top-6 right-6 z-20">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  onCollapse();
                }}
              >
                <path
                  d="M17.25 6.75L6.75 17.25"
                  stroke="#737373"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  d="M6.75 6.75L17.25 17.25"
                  stroke="#737373"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </div>
          )}

          {/* Avatar and Header Section */}
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="h-12 w-12 rounded-full overflow-hidden">
                  <Avatar size={48} name="User" variant="beam" />
                </div>
                <div className="w-6 h-6 absolute -bottom-1 -right-1 rounded-full flex items-center justify-center">
                  <div
                    style={{
                      backgroundColor: CoreColors.Black,
                      borderColor: CoreColors.White,
                    }}
                    className="w-full h-full  rounded-full border-[3px] flex items-center justify-center"
                  >
                    <PlusIcon style={{ color: CoreColors.White }} className="h-3 w-3 " />
                  </div>
                </div>
              </div>

              {/* Collapsed View Title */}
              {!isExpanded && (
                <span
                  style={{
                    color: Neutral.N900,
                  }}
                  className="block max-w-[800px]"
                >
                  {hasContentValue ? (
                    <>
                      {!loading && (
                        <span style={{ color: Orange.O500 }} className=" mr-1">
                          Draft:
                        </span>
                      )}
                      {(() => {
                        const { title: formattedTitle, content: formattedContent } =
                          formatDisplayText(title, content);
                        return (
                          <>
                            {formattedTitle && (
                              <span className="font-medium">{formattedTitle}</span>
                            )}
                            {formattedTitle && formattedContent && <span className="mx-1">-</span>}
                            {formattedContent && (
                              <span className="font-normal">{formattedContent}</span>
                            )}
                          </>
                        );
                      })()}
                    </>
                  ) : (
                    <span style={{ color: Neutral.N400 }}>What do you want to post?</span>
                  )}
                </span>
              )}
            </div>

            {/* Post Button Container - Fixed position for both states */}
            <div className="w-[100px] flex justify-end">
              {/* Collapsed state button */}
              {!isExpanded ? (
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    onExpand();
                  }}
                  variant={hasContentValue ? 'primary' : 'outline'}
                  size="small"
                  className={`transition-all duration-300 ease-out w-[70px]`}
                  disabled={!hasContentValue}
                >
                  Post
                </Button>
              ) : null}
            </div>
          </div>

          {/* Expanded View Content */}
          {isExpanded && (
            <div
              className="flex-1 mt-4 overflow-y-auto"
              style={{ maxHeight: 'calc(620px - 76px - 36px - 40px)' }}
            >
              <div className="pr-6">
                <Textarea
                  style={{ color: Neutral.N400 }}
                  ref={titleInputRef}
                  placeholder="Give your post a title"
                  maxLength={100}
                  className={cn(
                    `border-none px-1 py-1 font-medium text-xl focus-visible:ring-0 shadow-none w-full [&_*::selection]:bg-[#FF6F1E] [&::selection]:bg-[#FF6F1E] resize-none overflow-hidden min-h-[2.5rem] placeholder:text-[#A3A3A3]`
                  )}
                  value={title}
                  onChange={(e) =>
                    setPostData((prev) => ({ ...prev, title: e.target.value.slice(0, 100) }))
                  }
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.metaKey && !e.ctrlKey) {
                      e.preventDefault();
                      focusEditor();
                      return;
                    }
                    handleKeyDown(e);
                  }}
                  rows={1}
                  onFocus={() => setSelectedInput('title')}
                />

                <div
                  ref={editorRef}
                  style={{ color: Neutral.N900 }}
                  className="rich-editor-custom"
                  onFocus={() => setSelectedInput('content')}
                >
                  <style jsx global>{`
                    .rich-editor-custom .is-editor-empty::before {
                      color: var(--tw-text-opacity-neutral-400, #a3a3a3) !important;
                      content: 'Write your message here...' !important;
                    }

                    .rich-editor-custom ul {
                      list-style-type: disc;
                      margin-left: 0.2em;
                      margin-bottom: 0.5em;
                    }

                    .rich-editor-custom ol {
                      list-style-type: decimal;
                      margin-left: 0.2em;
                      margin-bottom: 0.5em;
                    }

                    .rich-editor-custom li {
                      margin-bottom: 4px;
                      line-height: 1.5;
                    }

                    .rich-editor-custom li:last-child {
                      margin-bottom: 0;
                    }

                    .rich-editor-custom li > p {
                      margin: 0;
                      line-height: 1.5;
                    }
                  `}</style>
                  <RichTextEditor
                    value={content}
                    onChange={(newContent) =>
                      setPostData((prev) => ({ ...prev, content: newContent }))
                    }
                    placeholder="Write your message here..."
                    onKeyDown={handleNativeKeyDown}
                  />
                </div>
              </div>

              {/* Attachments Preview - Moved above the footer */}
              {renderAttachments()}

              {/* Footer Actions */}
              <div
                style={{
                  height: '36px',
                  marginBottom: '6px',
                  marginTop: '56px',
                }}
                className="flex items-center justify-between gap-2 stat p-2"
              >
                <div className="flex item-center justify-start align-left">
                  <div className="flex items-center mr-[6px]">
                    {/* Attachment Button */}
                    <Button
                      onClick={() => setIsAttachmentUploaderOpen(true)}
                      variant="outline"
                      size="medium"
                      iconOnly
                      icon={
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 20 20"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M16.0413 9.95931L10.9446 14.8835C9.34633 16.4276 6.755 16.4276 5.15672 14.8835C3.55257 13.3336 3.55932 10.8189 5.17177 9.27709L9.87531 4.75066C10.9689 3.69412 12.7419 3.69411 13.8354 4.75064C14.933 5.81105 14.9284 7.53168 13.8251 8.58656L9.06872 13.1548C8.47834 13.7252 7.52117 13.7252 6.9308 13.1548C6.34043 12.5844 6.34043 11.6597 6.93082 11.0893L10.8696 7.28392"
                            stroke="currentColor"
                            stroke-width="1.5"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          />
                        </svg>
                      }
                      className="!w-9 !h-9 "
                      disabled={
                        attachments.length >= 5 || attachments.some((a) => a.status === 'PENDING')
                      }
                    />
                  </div>

                  <div className="flex items-center mr-[6px]">
                    <div className="relative">
                      <Button
                        iconOnly
                        variant="outline"
                        size="medium"
                        icon={
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 20 20"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M16.0416 9.99992C16.0416 13.3366 13.3366 16.0416 9.99992 16.0416C6.6632 16.0416 3.95825 13.3366 3.95825 9.99992C3.95825 6.6632 6.6632 3.95825 9.99992 3.95825C13.3366 3.95825 16.0416 6.6632 16.0416 9.99992Z"
                              stroke="currentColor"
                              stroke-width="1.5"
                              stroke-linecap="round"
                              stroke-linejoin="round"
                            />
                            <path
                              d="M8.125 11.4583C8.125 11.4583 8.33333 12.7083 10 12.7083C11.6667 12.7083 11.875 11.4583 11.875 11.4583"
                              stroke="currentColor"
                              stroke-width="1.5"
                              stroke-linecap="round"
                              stroke-linejoin="round"
                            />
                            <path
                              d="M8.75008 8.33341C8.75008 8.56353 8.56353 8.75008 8.33341 8.75008C8.1033 8.75008 7.91675 8.56353 7.91675 8.33341C7.91675 8.1033 8.1033 7.91675 8.33341 7.91675C8.56353 7.91675 8.75008 8.1033 8.75008 8.33341Z"
                              stroke="currentColor"
                              stroke-linecap="round"
                              stroke-linejoin="round"
                            />
                            <path
                              d="M12.0833 8.33341C12.0833 8.56353 11.8968 8.75008 11.6667 8.75008C11.4365 8.75008 11.25 8.56353 11.25 8.33341C11.25 8.1033 11.4365 7.91675 11.6667 7.91675C11.8968 7.91675 12.0833 8.1033 12.0833 8.33341Z"
                              stroke="currentColor"
                              stroke-linecap="round"
                              stroke-linejoin="round"
                            />
                          </svg>
                        }
                        className="!w-9 !h-9"
                        onClick={() => toggleEmojiPicker(selectedInput || 'content')}
                      />
                      {showEmojiPicker && (
                        <div ref={emojiPickerRef} className="absolute bottom-12 left-0 z-[100]">
                          <EmojiPicker onSelect={handleEmojiSelect} />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center mr-[6px] ">
                    <Button
                      iconOnly
                      variant="outline"
                      size="medium"
                      icon={
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 20 20"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M12.7084 10.0001C12.7084 11.4959 11.4959 12.7084 10.0001 12.7084C8.50431 12.7084 7.29175 11.4959 7.29175 10.0001C7.29175 8.50431 8.50431 7.29175 10.0001 7.29175C11.4959 7.29175 12.7084 8.50431 12.7084 10.0001Z"
                            stroke="currentColor"
                            stroke-width="1.5"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          />
                          <path
                            d="M9.99992 16.0416C6.6632 16.0416 3.95825 13.3366 3.95825 9.99992C3.95825 6.6632 6.6632 3.95825 9.99992 3.95825C15.677 3.95825 16.0416 7.60409 16.0416 9.99992V11.0416C16.0416 11.9621 15.2954 12.7083 14.3749 12.7083C13.4544 12.7083 12.7083 11.9621 12.7083 11.0416V7.29159"
                            stroke="currentColor"
                            stroke-width="1.5"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          />
                        </svg>
                      }
                      className=" !w-9 !h-9 "
                    />
                  </div>
                </div>
                {/* Post Button Container */}
                <div className="w-[100px] flex items-center justify-end relative">
                  {/* Shortcut hint */}
                  {isExpanded && hasContentValue && (
                    <span
                      style={{ color: Neutral.N400 }}
                      className="right-[80px] mx-3 text-sm whitespace-nowrap"
                    >
                      ⌘+Enter
                    </span>
                  )}

                  {/* Expanded state button */}
                  {isExpanded ? (
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePost();
                      }}
                      variant={hasContentValue ? 'primary' : 'outline'}
                      size="small"
                      className={`transition-all duration-300 ease-out w-[70px]`}
                      disabled={!hasContentValue || loading}
                      isLoading={loading}
                      loadingText="Posting"
                    >
                      Post
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Render the attachment uploader */}
      {isAttachmentUploaderOpen && (
        <UppyAttachmentUploader
          draftPostId={draftPostId}
          isOpen={isAttachmentUploaderOpen}
          onClose={() => setIsAttachmentUploaderOpen(false)}
          onAttachmentsAdded={handleAttachmentsAdded}
        />
      )}

      {/* Render the file viewer component */}
      {renderFileViewer()}
    </div>
  );
}
