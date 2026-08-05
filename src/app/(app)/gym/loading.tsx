import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="mx-auto max-w-lg space-y-3 px-margin-x pb-24" aria-label="Loading Gym">
      <div className="flex items-end justify-between pt-1">
        <div className="space-y-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-8 w-28" />
        </div>
        <Skeleton className="h-10 w-24 rounded-lg" />
      </div>

      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-16 w-full" />
    </div>
  )
}
