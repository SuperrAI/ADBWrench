import CardLayout from '@/design-system/patterns/CardLayout/CardLayout';

export function PostSkeleton() {
  return (
    <div className="container max-w-[1072px] mx-auto py-6">
      <div className="flex gap-6">
        {/* Left container skeleton using CardLayout */}
        <CardLayout
          layoutType="twoMerged"
          cardStyle="transparent"
          containerClassName="!w-[696px] !p-0 !min-h-[832px] !h-auto !max-h-[calc(100vh+24px)] !-mt-4"
          cardClassName={['!p-0 !shadow-none !bg-transparent !h-full']}
        >
          <div className="w-full h-full bg-white rounded-3xl border border-neutral-200 shadow-[0_1px_3px_0_rgba(0,0,0,0.1),0_1px_2px_-1px_rgba(0,0,0,0.1)] overflow-hidden flex flex-col">
            <div className="px-7 pt-8 pb-4 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-neutral-200 animate-pulse" />
                  <div className="flex items-center gap-1.5">
                    <div className="h-6 bg-neutral-200 rounded animate-pulse w-32" />
                    <span className="text-neutral-500 text-[8px]">•</span>
                    <div className="h-6 bg-neutral-200 rounded animate-pulse w-16" />
                  </div>
                </div>

                <div className="w-8 h-8 flex items-center justify-center ml-7">
                  <div className="flex gap-1">
                    <div className="w-[3px] h-[3px] bg-neutral-200 rounded-full animate-pulse"></div>
                    <div className="w-[3px] h-[3px] bg-neutral-200 rounded-full animate-pulse"></div>
                    <div className="w-[3px] h-[3px] bg-neutral-200 rounded-full animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="px-7 pt-0 pb-16 flex-grow overflow-y-auto scrollbar-hide">
              <div className="mt-4 space-y-4">
                <div className="h-10 bg-neutral-200 rounded animate-pulse w-3/4" />
                <div className="flex gap-2">
                  <div className="h-6 w-20 bg-neutral-200 rounded-full animate-pulse" />
                  <div className="h-6 w-24 bg-neutral-200 rounded-full animate-pulse" />
                </div>
                <div className="space-y-3">
                  <div className="h-5 bg-neutral-200 rounded animate-pulse w-full" />
                  <div className="h-5 bg-neutral-200 rounded animate-pulse w-5/6" />
                  <div className="h-5 bg-neutral-200 rounded animate-pulse w-full" />
                  <div className="h-5 bg-neutral-200 rounded animate-pulse w-4/6" />
                  <div className="h-5 bg-neutral-200 rounded animate-pulse w-3/4" />
                  <div className="h-5 bg-neutral-200 rounded animate-pulse w-5/6" />
                  <div className="h-5 bg-neutral-200 rounded animate-pulse w-5/6" />
                  <div className="h-5 bg-neutral-200 rounded animate-pulse w-full" />
                  <div className="h-5 bg-neutral-200 rounded animate-pulse w-4/6" />
                  <div className="h-5 bg-neutral-200 rounded animate-pulse w-3/4" />
                  <div className="h-5 bg-neutral-200 rounded animate-pulse w-5/6" />
                </div>
              </div>
              {/* Attachments Skeleton */}
              <div className="mt-8 pt-8 border-t border-neutral-100">
                <div className="flex flex-wrap gap-6">
                  <div className="w-44 h-32 bg-neutral-200 rounded-lg animate-pulse" />
                  <div className="w-44 h-32 bg-neutral-200 rounded-lg animate-pulse" />
                  <div className="w-44 h-32 bg-neutral-200 rounded-lg animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        </CardLayout>

        {/* Right container skeleton */}
        <div className="w-[340px] -ml-6">
          <div className="bg-white rounded-3xl border border-neutral-200 h-full flex flex-col">
            <div className="px-6 pt-6 pb-4 flex-shrink-0 border-b border-neutral-200">
              <div className="h-5 bg-neutral-200 rounded animate-pulse" />
            </div>
            <div className="p-6 flex-grow overflow-y-auto scrollbar-hide">
              <div className="space-y-6">
                {[...Array(3)].map(
                  (
                    _,
                    i // Reduced number of skeleton comments
                  ) => (
                    <div key={i} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-neutral-200 animate-pulse" />
                          <div className="h-4 bg-neutral-200 rounded animate-pulse w-24" />
                        </div>
                        <div className="h-4 bg-neutral-200 rounded animate-pulse w-12" />
                      </div>
                      <div className="pl-11 space-y-2">
                        <div className="h-4 bg-neutral-200 rounded animate-pulse w-full" />
                        <div className="h-4 bg-neutral-200 rounded animate-pulse w-5/6" />
                      </div>
                      {/* Actions Skeleton */}
                      <div className="pl-11 flex gap-4">
                        <div className="h-4 w-10 bg-neutral-200 rounded animate-pulse" />
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
