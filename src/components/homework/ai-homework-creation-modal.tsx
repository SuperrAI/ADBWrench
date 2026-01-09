import React, { useEffect, useRef, useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { textStyles, typography } from '@/design-system/foundations/typography';
import Pill from '@/design-system/components/Pills';
import Button from '@/design-system/components/Button';
import { CoreColors, Neutral, Orange } from '@/design-system/foundations/colors';

// Add this interface to define the Chapter type
interface Chapter {
  id: string;
  title: string;
  // Add other properties as needed
}

interface AIHomeworkCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (prompt: string) => void;
}

// Add this custom sparkle icon component
const CustomSparkleIcon = () => (
  <svg width="16" height="15" viewBox="0 0 16 15" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M4.94902 0.470422C4.09396 2.554 3.0478 3.66101 1.08715 4.58715C0.584941 4.82438 0.580293 5.58615 1.08011 5.82839C2.98709 6.75265 4.07063 7.85858 4.94125 9.93239C5.17099 10.4796 6.02567 10.4786 6.251 9.92953C7.10243 7.85478 8.14335 6.74835 10.088 5.82459C10.5927 5.58485 10.5927 4.8151 10.088 4.57536C8.14335 3.6516 7.10243 2.54517 6.251 0.470422C6.02567 -0.0786417 5.17434 -0.0786422 4.94902 0.470422Z"
      fill="white"
    />
    <path
      d="M12.2995 8.99714C11.9172 9.97603 11.4035 10.5195 10.4912 10.9392C10.1278 11.1064 10.1278 11.6935 10.4912 11.8607C11.4035 12.2804 11.9172 12.8239 12.2995 13.8028C12.4564 14.2044 13.1436 14.2044 13.3005 13.8028C13.6828 12.8239 14.1965 12.2804 15.1088 11.8607C15.4722 11.6935 15.4722 11.1064 15.1088 10.9392C14.1965 10.5195 13.6828 9.97603 13.3005 8.99714C13.1436 8.59553 12.4564 8.59553 12.2995 8.99714Z"
      fill="white"
    />
  </svg>
);

const AIHomeworkCreationModal: React.FC<AIHomeworkCreationModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [prompt, setPrompt] = useState('');
  const modalRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Update these state variables with proper typing
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [isChapterDropdownOpen, setIsChapterDropdownOpen] = useState(false);
  const [chapters, setChapters] = useState<Chapter[]>([]);

  // Focus the textarea when the modal opens
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isOpen]);

  // Handle click outside to close the modal
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      if (prompt.trim()) {
        onSubmit(prompt);
      }
    }
  };

  // Add this function to handle auto-resizing of the textarea
  const autoResizeTextarea = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;

    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = 'auto';

    // Set the height to match the content (scrollHeight)
    // Add a small buffer to prevent scrollbar flashing
    textarea.style.height = `${textarea.scrollHeight + 2}px`;

    // Update the prompt state
    setPrompt(textarea.value);
  };

  // Add this style block at the top of your component
  const customStyles = `
     .modal-glow {
        background: ${Orange.O100}; /* Solid fill color */
        border-radius: 24px;
        padding: 12px;
        border: 1px solid ${Orange.O300};
  }

      .modal-card {
        border: 2px solid ${Orange.O500};
        box-shadow: 0 0 8px 4px ${Orange.O300};
        position: relative;
        overflow: visible;
      }

      /* Hide scrollbar for textarea */
      .modal-card textarea::-webkit-scrollbar {
        display: none;
      }
      
      .modal-card textarea {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }

      .button-separator {
        position: relative;
        margin: 24px -32px;
        height: 0;
        width: calc(100% + 64px);
      }

      .button-separator::before {
        content: '';
        position: absolute;
        top: -10px;
        left: 6px;
        width: 20px;
        height: 20px;
        background: ${Orange.O100};
        border-radius: 50%;
        border: 2px solid ${Orange.O500};
        z-index: 3;
        box-shadow: inset 0 0 8px 4px ${Orange.O300};
        mask-image: linear-gradient(to right, transparent 40%, black 40%);
        -webkit-mask-image: linear-gradient(to right, transparent 40%, black 40%);
        filter: drop-shadow(0 0 4px ${Orange.O300});
      }

      .button-separator::after {
        content: '';
        position: absolute;
        top: -10px;
        right: 6px;
        width: 20px;
        height: 20px;
        background: ${Orange.O100};
        border-radius: 50%;
        border: 2px solid ${Orange.O500};
        z-index: 3;
        box-shadow: inset 0 0 8px 4px ${Orange.O300};
        mask-image: linear-gradient(to left, transparent 40%, black 40%);
        -webkit-mask-image: linear-gradient(to left, transparent 40%, black 40%);
        filter: drop-shadow(0 0 4px ${Orange.O300});
      }

      .button-separator-line {
        border-top: 2px dashed ${Orange.O300};
        margin: 0 16px;
        position: relative;
        z-index: 2;
      }

      /* Add clips for the border */
      .modal-card::before {
        content: '';
        position: absolute;
        left: 6px;
        bottom: 82px;
        width: 24px;
        height: 24px;
        background: white;
        z-index: 2;
        border-radius: 50%;
        box-shadow: 0 0 0 2px white;
      }

      .modal-card::after {
        content: '';
        position: absolute;
        right: 6px;
        bottom: 82px;
        width: 24px;
        height: 24px;
        background: white;
        z-index: 2;
        border-radius: 50%;
        box-shadow: 0 0 0 2px white;
    }
    ...textStyles.body2Reg
  `;

  if (!isOpen) return null;

  return (
    <>
      <style>{customStyles}</style>

      <div className="fixed inset-0 z-[75] bg-white overflow-hidden" />

      <div
        className="fixed z-[80]"
        ref={modalRef}
        style={{
          width: '720px',
          height: '412px',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          maxWidth: '90vw',
          margin: '0 auto',
          position: 'fixed',
        }}
      >
        <div className="modal-glow">
          <div
            className="modal-card bg-white overflow-hidden"
            style={{
              width: '696px',
              height: '388px',
              borderRadius: '20px',
              position: 'relative',
            }}
          >
            <div
              className="p-4"
              style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
            >
              <Textarea
                ref={textareaRef}
                placeholder="Tell us what the homework should cover?"
                value={prompt}
                onChange={autoResizeTextarea}
                onKeyDown={handleKeyDown}
                className="border-none px-0 resize-none focus-visible:ring-0 focus-visible:border-none placeholder:text-neutral-400 text-neutral-600 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                style={{
                  ...textStyles.body1Reg,
                  minHeight: '200px',
                  height: 'auto',
                  width: '100%',
                  padding: '8px',
                  backgroundColor: 'white',
                  borderRadius: '20px',
                  marginBottom: '8px',
                  flex: '1',
                  fontFamily: textStyles.body3Med.fontFamily,
                  fontSize: textStyles.body3Med.fontSize,
                  lineHeight: textStyles.body3Med.lineHeight,
                  fontWeight: textStyles.body3Med.fontWeight,
                  letterSpacing: textStyles.body3Med.letterSpacing,
                }}
              />

              <div className="button-separator">
                <div className="button-separator-line" />
              </div>

              <div className="flex justify-between items-center">
                <Pill
                  variant="default"
                  label={selectedChapter?.title || 'Chapter'}
                  dropdown={true}
                  onDropdownClick={() => setIsChapterDropdownOpen(!isChapterDropdownOpen)}
                  style={{
                    width: '95px',
                    height: '36px',
                    backgroundColor: 'white',
                    border: `1px solid ${Neutral.N200}`,
                    color: CoreColors.Black,
                    fontFamily: typography.fontFamily.sans,
                    fontSize: typography.fontSize.textS,
                    fontWeight: 600,
                    lineHeight: typography.lineHeight.compact,
                    letterSpacing: typography.letterSpacing.none,
                    borderRadius: '20px',
                  }}
                  className="[&_svg]:text-neutral-400 gap-1"
                />

                <Button
                  variant="secondary"
                  size="medium"
                  icon={<CustomSparkleIcon />}
                  onClick={() => prompt.trim() && onSubmit(prompt)}
                  className="[&>span]:font-600 [&>span]:text-[14px] !font-600"
                  style={{
                    width: '147px',
                    height: '40px',
                    fontFamily: typography.fontFamily.sans,
                    fontSize: typography.fontSize.textS,
                    lineHeight: typography.lineHeight.compact,
                    letterSpacing: typography.letterSpacing.none,
                    gap: '6px',
                    backgroundColor: Orange.O500,
                    color: 'white',
                    border: 'none',
                    borderRadius: '20px',
                    fontWeight: 600,
                  }}
                >
                  Create with AI
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AIHomeworkCreationModal;
