import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="mx-auto max-w-lg space-y-3 px-margin-x pb-24" aria-label="Loading Today">
      <div className="flex items-end justify-between pt-1">
        <div className="space-y-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-8 w-36" />
        </div>
        <Skeleton className="h-10 w-10 rounded-lg" />
      </div>

      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-28 w-full" />
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-20 w-full" />

      <div className="flex gap-2 pt-2">
        <Skeleton className="h-11 flex-1" />
        <Skeleton className="h-11 w-24" />
      </div>
    </div>
  )
}
