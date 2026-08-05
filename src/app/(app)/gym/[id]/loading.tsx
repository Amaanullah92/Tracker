import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="mx-auto max-w-lg space-y-3 px-margin-x pb-24" aria-label="Loading session">
      <div className="flex items-center justify-between pt-1">
        <div className="space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-7 w-40" />
        </div>
        <Skeleton className="h-10 w-24 rounded-lg" />
      </div>

      <Skeleton className="h-28 w-full" />
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-44 w-full" />
      <Skeleton className="h-44 w-full" />

      <Skeleton className="h-12 w-full" />
    </div>
  )
}
