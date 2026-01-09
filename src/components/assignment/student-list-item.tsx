import { Avatar } from '@/components/ui/dicebear-avatar';

interface StudentListItemProps {
  name: string;
  onClick?: () => void;
  isSelected?: boolean;
}

export function StudentListItem({ name, onClick, isSelected }: StudentListItemProps) {
  return (
    <div
      className={`px-4 py-2 rounded-lg cursor-pointer flex items-center gap-3 transition-colors ${
        isSelected ? 'bg-neutral-100' : 'hover:bg-neutral-50'
      }`}
      onClick={onClick}
    >
      <Avatar
        size={36}
        name={name}
        variant="beam"
        colors={['#FF6F1E', '#EBEBEB']}
        className="rounded-full border border-neutral-200"
      />
      <span className={isSelected ? 'text-md font-medium' : ''}>{name}</span>
    </div>
  );
}
