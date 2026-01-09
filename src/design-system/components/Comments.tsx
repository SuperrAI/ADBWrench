'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { MoreVertical } from 'lucide-react';
import { Avatar } from '@/components/ui/dicebear-avatar';
import { Button } from '@/design-system/components/Button';
import { Textarea } from '@/components/ui/textarea';
import { Comment } from '@/types/comment';
import { colors } from '@/design-system/foundations/colors';
import { spacing } from '@/design-system/foundations/spacing';
import { textStyles, typography } from '@/design-system/foundations/typography';
import { EmojiPicker } from '@/design-system/components/emoji-picker';
import { OptionsMenu } from '@/design-system/components/OptionsMenu';

export interface CommentsProps {
  comments: Comment[];
  onCommentAdded?: (content: string) => void;
  onCommentEdited?: (commentId: string, newContent: string) => void;
  onCommentDeleted?: (commentId: string) => void;
  onCommentPinned?: (commentId: string) => void;
  onReactionAdded?: (commentId: string, emoji: string) => void;
  isSubmitting?: boolean;
}

function formatTimestamp(date: Date): string {
  if (!date || isNaN(date.getTime())) {
    console.error('Invalid date:', date);
    return 'Date';
  }

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';

  const minutes = Math.floor(diffInSeconds / 60);
  if (minutes < 60) return `${minutes}m`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;

  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d`;

  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo`;

  const years = Math.floor(days / 365);
  return `${years}y`;
}

const Comments: React.FC<CommentsProps> = ({
  comments: initialComments,
  onCommentAdded,
  onCommentEdited,
  onCommentDeleted,
  onCommentPinned,
  onReactionAdded,
  isSubmitting = false,
}) => {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [newComment, setNewComment] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedCommentId, setSelectedCommentId] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedMenuCommentId, setSelectedMenuCommentId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const emojiPickerRef = React.useRef<HTMLDivElement>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);

  // Update local comments when initialComments changes
  useEffect(() => {
    setComments(initialComments);
  }, [initialComments]);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
        setSelectedCommentId(null);
      }
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
        setSelectedMenuCommentId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    return () => {
      setIsMenuOpen(false);
      setSelectedMenuCommentId(null);
    };
  }, []);

  const pinnedComments = comments.filter((comment) => comment.isPinned);
  const regularComments = comments.filter((comment) => !comment.isPinned);

  const handleEditComment = (commentId: string, currentContent: string) => {
    setEditingCommentId(commentId);
    setNewComment(currentContent);
    setIsEditing(true);
    setIsFocused(true);
    setIsMenuOpen(false);
  };

  const handleAddComment = () => {
    const trimmedContent = newComment.trim();
    if (!trimmedContent || isSubmitting) return;

    if (isEditing && editingCommentId) {
      // Handle edit
      if (onCommentEdited) {
        onCommentEdited(editingCommentId, trimmedContent);
      }
      // Update local state
      setComments(
        comments.map((comment) =>
          comment.id === editingCommentId
            ? {
                ...comment,
                content: trimmedContent,
                isEdited: true,
                lastEditedAt: Date.now().toString(),
              }
            : comment
        )
      );
      setIsEditing(false);
      setEditingCommentId(null);
    } else {
      // Handle new comment
      if (onCommentAdded) {
        onCommentAdded(trimmedContent);
      }
    }
    setNewComment('');
  };

  const handleClearInput = () => {
    setNewComment('');
    setIsEditing(false);
    setEditingCommentId(null);
    // Reset textarea height to default
    const textarea = document.querySelector('textarea');
    if (textarea) {
      textarea.style.height = '44px';
      textarea.focus();
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    if (selectedCommentId) {
      // Add reaction to existing comment
      if (onReactionAdded) {
        onReactionAdded(selectedCommentId, emoji);
      }
    } else {
      // Add emoji to new comment or edit
      setNewComment((prev) => prev + emoji);
    }
    // Close emoji picker immediately
    setShowEmojiPicker(false);
    setSelectedCommentId(null);
  };

  const handlePinComment = (commentId: string) => {
    if (onCommentPinned) {
      onCommentPinned(commentId);
      // Update local state immediately
      setComments(
        comments.map((comment) =>
          comment.id === commentId ? { ...comment, isPinned: !comment.isPinned } : comment
        )
      );
    }
    setIsMenuOpen(false);
  };

  const handleDeleteComment = (commentId: string) => {
    if (onCommentDeleted) {
      onCommentDeleted(commentId);
      // Update local state immediately
      setComments(comments.filter((comment) => comment.id !== commentId));
    }
    setIsMenuOpen(false);
  };

  const renderComment = (comment: Comment) => {
    const isEdited = comment.isEdited && comment.lastEditedAt;
    // Convert ISO timestamp to Date object
    const createdAt = new Date(comment.createdAt);
    const lastEditedAt = comment.lastEditedAt ? new Date(comment.lastEditedAt) : null;
    const formattedDate = formatTimestamp(createdAt);
    const editedDate = isEdited ? formatTimestamp(lastEditedAt!) : null;

    const userName = comment.user
      ? `${comment.user.firstName} ${comment.user.lastName}`
      : 'Anonymous User';

    return (
      <div>
        <div className="flex items-start gap-3 group">
          <Avatar
            size={40}
            name={userName}
            variant="beam"
            colors={[colors.orange.O500, colors.neutral.N100]}
            className="rounded-full border border-neutral-200"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <div className="flex items-center min-w-0 flex-1">
                <span
                  style={{
                    ...textStyles.body1Med,
                    color: colors.core.Black,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {userName}
                </span>
                <span style={{ color: colors.neutral.N500, margin: '0 4px' }}>•</span>
                <span
                  style={{
                    ...textStyles.body1Reg,
                    color: colors.neutral.N500,
                    flexShrink: 0,
                  }}
                >
                  {formattedDate}
                </span>
              </div>
              <div className="flex items-center ml-auto">
                <div
                  className={`${selectedCommentId === comment.id || (isMenuOpen && selectedMenuCommentId === comment.id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                >
                  <button
                    className="p-0.5 rounded transition-colors relative"
                    style={{
                      ...textStyles.labelSansReg,
                      width: '28px',
                      height: '28px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      borderRadius: spacing[2],
                      transition: 'background-color 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = comment.isPinned
                        ? colors.orange.O200
                        : colors.neutral.N200;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                    onClick={() => {
                      setSelectedCommentId(comment.id);
                      setShowEmojiPicker(!showEmojiPicker);
                    }}
                  >
                    <svg
                      width="28"
                      height="28"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M19.25 12C19.25 16.0041 16.0041 19.25 12 19.25C7.99594 19.25 4.75 16.0041 4.75 12C4.75 7.99594 7.99594 4.75 12 4.75C16.0041 4.75 19.25 7.99594 19.25 12Z"
                        stroke={colors.neutral.N500}
                        stroke-width="1.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                      <path
                        d="M9.75 13.75C9.75 13.75 10 15.25 12 15.25C14 15.25 14.25 13.75 14.25 13.75"
                        stroke={colors.neutral.N500}
                        stroke-width="1.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                      <path
                        d="M10.5 10C10.5 10.2761 10.2761 10.5 10 10.5C9.72386 10.5 9.5 10.2761 9.5 10C9.5 9.72386 9.72386 9.5 10 9.5C10.2761 9.5 10.5 9.72386 10.5 10Z"
                        stroke={colors.neutral.N500}
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                      <path
                        d="M14.5 10C14.5 10.2761 14.2761 10.5 14 10.5C13.7239 10.5 13.5 10.2761 13.5 10C13.5 9.72386 13.7239 9.5 14 9.5C14.2761 9.5 14.5 9.72386 14.5 10Z"
                        stroke={colors.neutral.N500}
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                    {showEmojiPicker && selectedCommentId === comment.id && (
                      <div
                        ref={emojiPickerRef}
                        style={{
                          position: 'absolute',
                          top: '30%',
                          left: '0%',
                          transform: 'translate(-90%, 15%)',
                          zIndex: 50,
                        }}
                      >
                        <EmojiPicker
                          onSelect={(emoji) => {
                            handleEmojiSelect(emoji);
                            setShowEmojiPicker(false);
                            setSelectedCommentId(null);
                          }}
                        />
                      </div>
                    )}
                  </button>
                </div>
                <div
                  className={`relative ${selectedCommentId === comment.id || (isMenuOpen && selectedMenuCommentId === comment.id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                >
                  <OptionsMenu
                    items={[
                      {
                        id: 'edit',
                        label: 'Edit',
                        icon: (
                          <span style={{ color: '#262626' }}>
                            <svg
                              width="20"
                              height="20"
                              viewBox="0 0 20 20"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M3.9585 16.0415L7.50016 15.2082L15.7911 6.91725C16.1166 6.59182 16.1166 6.06418 15.7911 5.73874L14.2613 4.20892C13.9359 3.88348 13.4082 3.88348 13.0828 4.20892L4.79183 12.4999L3.9585 16.0415Z"
                                stroke="#262626"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <path
                                d="M11.686 5.86572L14.186 8.36572"
                                stroke="#262626"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </span>
                        ),
                        onClick: () => handleEditComment(comment.id, comment.content),
                      },
                      {
                        id: 'pin',
                        label: comment.isPinned ? 'Unpin' : 'Pin',
                        icon: (
                          <span style={{ color: '#262626' }}>
                            <svg
                              width="20"
                              height="20"
                              viewBox="0 0 20 20"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M7.2915 6.4585L6.45817 3.9585H13.5415L12.7082 6.4585V8.3335C15.2082 9.16683 15.2082 11.8752 15.2082 11.8752H4.7915C4.7915 11.8752 4.7915 9.16683 7.2915 8.3335V6.4585Z"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <path
                                d="M10 12.0835V16.0418"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </span>
                        ),
                        onClick: () => handlePinComment(comment.id),
                      },
                      {
                        id: 'delete',
                        label: 'Delete',
                        isDelete: true,
                        icon: (
                          <span style={{ color: '#EF4444' }}>
                            <svg
                              width="20"
                              height="20"
                              viewBox="0 0 20 20"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M16.0413 5.41585C16.0413 6.22127 13.3364 6.87419 9.99967 6.87419C6.66295 6.87419 3.95801 6.22127 3.95801 5.41585C3.95801 4.61044 6.66295 3.95752 9.99967 3.95752C13.3364 3.95752 16.0413 4.61044 16.0413 5.41585Z"
                                stroke="#EF4444"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <path
                                d="M3.95801 5.625L5.1756 13.235C5.43434 14.8521 6.82942 16.0417 8.46707 16.0417H11.5323C13.1699 16.0417 14.565 14.8521 14.8237 13.235L16.0413 5.625"
                                stroke="#EF4444"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <path
                                d="M8.33105 10L8.54894 12.4954"
                                stroke="#EF4444"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <path
                                d="M12.1128 10.0024L11.8515 12.4936"
                                stroke="#EF4444"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </span>
                        ),
                        onClick: () => handleDeleteComment(comment.id),
                      },
                    ]}
                    open={isMenuOpen && selectedMenuCommentId === comment.id}
                    onOpenChange={(open) => {
                      setIsMenuOpen(open);
                      if (!open) {
                        setSelectedMenuCommentId(null);
                      } else {
                        setSelectedMenuCommentId(comment.id);
                      }
                    }}
                    trigger={
                      <button
                        className="p-0.5 rounded transition-colors"
                        style={{
                          ...textStyles.labelSansReg,
                          width: '28px',
                          height: '28px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          borderRadius: spacing[2],
                          marginLeft: '4px',
                          transition: 'background-color 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = comment.isPinned
                            ? colors.orange.O200
                            : colors.neutral.N200;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <MoreVertical size={16} color={colors.neutral.N500} strokeWidth={1.5} />
                      </button>
                    }
                  />
                </div>
              </div>
            </div>
            <p
              className="mt-1"
              style={{
                ...textStyles.body1SemiLong,
                color: colors.neutral.N900,
              }}
            >
              {comment.content}
            </p>
            {isEdited && (
              <p
                style={{
                  ...textStyles.body2Reg,
                  color: colors.neutral.N500,
                  fontStyle: 'italic',
                  marginTop: spacing[1],
                }}
              >
                Edited
              </p>
            )}
            {comment.reactions && comment.reactions.length > 0 && (
              <div
                className="flex items-center gap-2 mt-2"
                style={{
                  flexWrap: 'wrap',
                }}
              >
                {comment.reactions.map((reaction, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-1 px-1.5 py-0.5 rounded-full"
                    style={{
                      ...textStyles.labelSansReg,
                      backgroundColor: colors.orange.O100,
                      border: `1px solid ${colors.orange.O200}`,
                    }}
                  >
                    <span style={{ fontSize: typography.fontSize.textXS }}>{reaction.emoji}</span>
                    <span
                      style={{
                        ...textStyles.labelSansReg,
                        color: colors.neutral.N700,
                      }}
                    >
                      {reaction.count}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const handleCommentAction = useCallback((action: string, commentId: string) => {
    // ... handler logic
  }, []);

  return (
    <div
      className="flex flex-col"
      style={{
        width: '360px',
        height: '800px',
        overflow: 'hidden',
        backgroundColor: colors.core.White,
        border: `1px solid ${colors.neutral.N200}`,
        borderRadius: '24px',
      }}
    >
      {/* Header */}
      <div
        style={{
          width: '360px',
          height: 'auto',
          gap: spacing[3],
          paddingTop: spacing[5],
          paddingRight: spacing[5],
          paddingBottom: spacing[5],
          paddingLeft: spacing[5],
          borderBottom: `1px solid ${colors.neutral.N200}`,
        }}
      >
        <span
          style={{
            ...textStyles.body1Med,
            color: colors.neutral.N900,
          }}
        >
          Comments
        </span>
      </div>

      {/* Main Content */}
      <div
        className="flex-1 overflow-y-auto scrollbar-hide"
        style={{
          msOverflowStyle: 'none',
          scrollbarWidth: 'none',
          paddingBottom: 0,
          paddingTop: 0,
        }}
      >
        {pinnedComments.length > 0 && (
          <div
            style={{
              backgroundColor: colors.orange.O50,
              paddingLeft: spacing[5],
              paddingRight: spacing[5],
              paddingBottom: spacing[4],
              paddingTop: spacing[3],
              borderRadius: 0,
            }}
          >
            <div className="flex items-center gap-2 mb-4">
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{
                  color: colors.orange.O500,
                  marginTop: 0,
                  marginLeft: 0,
                }}
              >
                <path
                  d="M7.2915 6.4585L6.45817 3.9585H13.5415L12.7082 6.4585V8.3335C15.2082 9.16683 15.2082 11.8752 15.2082 11.8752H4.7915C4.7915 11.8752 4.7915 9.16683 7.2915 8.3335V6.4585Z"
                  fill="#FF6F1E"
                  stroke="#FF6F1E"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M10 12.0835V16.0418"
                  stroke="#FF6F1E"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span
                style={{
                  ...textStyles.body2Med,
                  color: colors.orange.O500,
                }}
              >
                {`Pinned (${pinnedComments.length})`}
              </span>
            </div>
            {pinnedComments.map((comment, index) => (
              <div
                key={comment.id}
                className="border-b border-orange-100"
                style={{
                  marginBottom: index < pinnedComments.length - 1 ? spacing[3] : 0,
                  paddingBottom: index < pinnedComments.length - 1 ? spacing[4] : spacing[2],
                  borderBottom: 'none',
                }}
              >
                {renderComment(comment)}
              </div>
            ))}
          </div>
        )}

        <div style={{ paddingTop: '28px', paddingLeft: spacing[5], paddingRight: spacing[5] }}>
          {regularComments.map((comment, index) => (
            <div
              key={comment.id}
              className="border-b border-neutral-100"
              style={{
                marginBottom: spacing[5],
                paddingBottom: spacing[5],
                borderBottom: 'none',
              }}
            >
              {renderComment(comment)}
            </div>
          ))}
        </div>
      </div>

      {/* Write Comment Section Background Container */}
      <div
        style={{
          width: '360px',
          minHeight: '68px',
          height: 'auto',
          backgroundColor: colors.core.White,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          padding: '12px 10px',
          position: 'relative',
          bottom: 0,
        }}
      >
        {/* Write Comment Input Container */}
        <div
          style={{
            width: '340px',
            minHeight: '44px',
            height: 'auto',
            margin: '0 auto',
            gap: spacing[2],
            border: `1px solid ${isFocused ? colors.core.Black : colors.neutral.N200}`,
            borderRadius: '12px',
            backgroundColor: colors.core.White,
            position: 'relative',
          }}
        >
          <Textarea
            value={newComment}
            onChange={(e) => {
              const textarea = e.target;
              setNewComment(textarea.value);
            }}
            onFocus={(e) => {
              setIsFocused(true);
              const textarea = e.target;
              textarea.style.height = '76px';
            }}
            onBlur={(e) => {
              if (!e.relatedTarget?.closest('button')) {
                setIsFocused(false);
                const textarea = e.target;
                if (!textarea.value) {
                  textarea.style.height = '44px';
                }
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleAddComment();
              }
            }}
            placeholder={isEditing ? 'Edit your comment...' : 'Write a comment...'}
            className="resize-none rounded-lg focus:ring-0 focus:outline-none scrollbar-hide bg-transparent"
            style={{
              ...textStyles.body1Reg,
              backgroundColor: 'transparent !important',
              border: 'none',
              color: newComment ? colors.core.Black : colors.neutral.N400,
              paddingTop: '10px',
              paddingBottom: '10px',
              paddingLeft: '10px',
              paddingRight: spacing[2],
              width: '100%',
              minHeight: '44px',
              height: '44px',
              maxHeight: '200px',
              overflowY: 'auto',
              msOverflowStyle: 'none',
              scrollbarWidth: 'none',
              lineHeight: '24px',
              display: 'block',
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              outline: 'none',
              boxShadow: 'none',
              WebkitAppearance: 'none',
              MozAppearance: 'none',
            }}
            disabled={isSubmitting}
          />
          {(isFocused || newComment) && (
            <div
              className="flex justify-end mt-2 space-x-1"
              style={{
                marginBottom: spacing[2],
                marginRight: spacing[2],
              }}
            >
              <Button
                type="button"
                style={{
                  backgroundColor: colors.neutral.N200,
                  color: colors.core.White,
                  borderRadius: '10px',
                  width: spacing[8],
                  height: spacing[8],
                  cursor: 'pointer',
                  opacity: newComment ? 1 : 0.5,
                  pointerEvents: newComment ? 'auto' : 'none',
                }}
                onClick={handleClearInput}
                disabled={isSubmitting || !newComment}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke={colors.neutral.N500}
                  style={{ width: spacing[4], height: spacing[4] }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </Button>
              <Button
                type="submit"
                style={{
                  backgroundColor: colors.orange.O500,
                  color: colors.core.White,
                  borderRadius: '10px',
                  width: spacing[8],
                  height: spacing[8],
                  opacity: newComment.trim() ? 1 : 0.5,
                  pointerEvents: newComment.trim() ? 'auto' : 'none',
                }}
                onClick={(e) => {
                  e.preventDefault();
                  handleAddComment();
                }}
                disabled={isSubmitting || !newComment.trim()}
              >
                {isSubmitting ? (
                  <div className="animate-spin">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      style={{ width: spacing[4], height: spacing[4] }}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                  </div>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    style={{ width: spacing[4], height: spacing[4] }}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 10l7-7m0 0l7 7m-7-7v18"
                    />
                  </svg>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Comments;
