import { Skeleton } from '@/components/ui/skeleton';

export function HomeSkeleton() {
  return (
    <div className="flex flex-col justify-start overflow-hidden scrollbar-hide">
      {/* Posts List Skeleton */}
      <div className="w-full">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white border border-neutral-200 rounded-lg p-4 shadow-sm">
            {/* User Info Skeleton */}
            <div className="flex items-center gap-3 mb-1">
              <Skeleton className="h-10 w-10 rounded-full" />
              {/* Add flex-grow to this container */}
              <div className="flex items-center gap-2 flex-grow">
                <Skeleton className="h-4 w-20 rounded" /> {/* Increased width */}
                <Skeleton className="h-3 w-12 rounded" /> {/* Increased width */}
              </div>
            </div>
            {/* Content Skeleton */}
            <div className="space-y-2 mb-1">
              <Skeleton className="h-4 w-full rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
