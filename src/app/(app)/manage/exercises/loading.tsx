import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="mx-auto max-w-lg space-y-3 px-margin-x pb-24" aria-label="Loading exercises">
      <div className="space-y-2 pt-1">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-8 w-36" />
      </div>
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-14 w-full" />
      <Skeleton className="h-14 w-full" />
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-14 w-full" />
      <Skeleton className="h-14 w-full" />
    </div>
  )
}
