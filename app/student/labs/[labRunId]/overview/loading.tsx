import { Skeleton } from '@/components/ui/skeleton'

export default function LabOverviewLoading() {
  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48" />
      </div>

      <div className="rounded-lg border p-5 space-y-4">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-16 w-full" />
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 rounded-lg" />
        ))}
      </div>

      <Skeleton className="h-10 w-32" />
    </div>
  )
}
