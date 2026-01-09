import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/design-system/components/Button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, X } from 'lucide-react';
import { textStyles } from '@/design-system/foundations/typography';
import { colors } from '@/design-system/foundations/colors';

interface AddFolderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string) => void;
  isLoading: boolean;
}

export function AddFolderDialog({ isOpen, onClose, onSubmit, isLoading }: AddFolderDialogProps) {
  const [folderName, setFolderName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (folderName.trim()) {
      onSubmit(folderName.trim());
      setFolderName('');
    }
  };

  const handleClose = () => {
    setFolderName('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent
        className="sm:max-w-[500px] !p-0 gap-0 [&>button]:hidden"
        style={{ borderRadius: '24px', padding: '0px' }}
      >
        {/* Custom Header with title and close button aligned */}
        <div className="flex items-center justify-between pl-5 pr-4 pt-3 pb-3">
          <div style={{ ...textStyles.h4, color: colors.core.Black }}>Create new folder</div>
          <button
            onClick={handleClose}
            className="rounded-full pt-2 pb-2 pl-2 transition-colors"
            type="button"
          >
            <svg
              width="36"
              height="36"
              viewBox="0 0 36 36"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M23.25 12.75L12.75 23.25"
                stroke="#A3A3A3"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M12.75 12.75L23.25 23.25"
                stroke="#A3A3A3"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 pb-5">
          <div className="space-y-6">
            <div className="space-y-2">
              <Label
                htmlFor="name"
                style={{ ...textStyles.body1Reg, color: colors.neutral.N700, paddingLeft: 1 }}
              >
                Folder name
              </Label>
              <Input
                id="name"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                placeholder="Type a folder name"
                autoFocus
                className="h-12 text-base rounded-xl border-2 border-gray-200 !focus-visible:border-gray-300 !focus-visible:ring-0 focus:ring-0 focus:outline-none [&:focus-visible]:border-gray-300 [&:focus-visible]:ring-0"
                style={{ '--placeholder-color': colors.neutral.N400 } as React.CSSProperties}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-8">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="px-6 py-3 rounded-xl border-2 hover:bg-gray-50"
              size="medium"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={!folderName.trim() || isLoading}
              className="px-6 py-3 rounded-xl  hover:bg-gray-800"
              size="medium"
            >
              {isLoading ? 'Creating...' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
