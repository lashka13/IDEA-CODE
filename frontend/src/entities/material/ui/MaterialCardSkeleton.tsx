import { Skeleton } from '../../../shared/ui';

export function MaterialCardSkeleton() {
  return (
    <div className="glass overflow-hidden">
      <Skeleton className="h-40 w-full rounded-none" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-4 w-3/4" variant="text" />
        <Skeleton className="h-3 w-1/2" variant="text" />
        <div className="flex gap-1">
          <Skeleton className="h-5 w-12" />
          <Skeleton className="h-5 w-12" />
        </div>
        <div className="flex justify-between pt-2">
          <Skeleton className="h-3 w-16" variant="text" />
          <Skeleton className="h-3 w-12" variant="text" />
        </div>
      </div>
    </div>
  );
}
