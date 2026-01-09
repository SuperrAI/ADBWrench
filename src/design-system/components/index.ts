/**
 * Design System Components
 *
 * This file exports all components of the design system.
 */

export { default as Button, type ButtonProps } from './Button';
export { 
  default as Dropdown, 
  Dropdown as DropdownComponent, 
  SimpleDropdown, 
  type DropdownProps, 
  type DropdownItem, 
  type DropdownItemAction, 
  type DropdownItemSeparator, 
  type DropdownItemHeader, 
  type SimpleDropdownProps 
} from './Dropdown';
export { default as Tooltip, type DesignTooltipProps } from './Tooltip';
export { default as Loader, type LoaderProps } from './Loader';
export {
  default as FileAttachment,
  type FileAttachmentProps,
  type FileType,
  type AttachmentFileType,
  type FileState,
  type FileSize,
  type FileAction,
} from './FileAttachment';
export { default as Spinner, type SpinnerProps } from './Spinner';
export { default as OptionsMenu, type OptionsMenuProps, type OptionsMenuItem } from './OptionsMenu';
export { default as Pill, type PillProps, BookmarkIcon } from './Pills';
export { default as ProfileCard, type ProfileCardProps } from './ProfileCard';
export { default as Comments, type CommentsProps } from './Comments';
export { default as DropdownSearchBar } from './DropdownSearchBar';
export { Checkbox } from './Checkbox';
export { DatePicker } from './DatePicker';
export { 
  default as Filter, 
  type FilterProps, 
  type FilterOption, 
  type FilterCategory, 
  type FilterDimensions, 
  type FilterStyling, 
  type FilterButtonConfig, 
  type FilterTexts 
} from './Filter';


// Re-export shadcn UI components that are part of our design system
export {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export { Badge, badgeVariants } from '@/components/ui/badge';

export {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export { Input } from '@/components/ui/input';

export { Label } from '@/components/ui/label';

export { Progress } from '@/components/ui/progress';

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export { Separator } from '@/components/ui/separator';

export {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

export { Skeleton } from '@/components/ui/skeleton';

export {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export { Textarea } from '@/components/ui/textarea';

export { Toggle, toggleVariants } from '@/components/ui/toggle';

// Export all components from the design system
export { default as Folder, type FolderProps } from './Folder';
export * from './Folder';
export { default as File, type FileProps } from './File';

import DarkMenu from './DarkMenu';
export { DarkMenu };

import Error from './Error';
export { Error };
export { Breadcrumbs } from './Breadcrumbs';

export { EmojiPicker } from './emoji-picker';

export * from './skeletons/PostSkeleton';