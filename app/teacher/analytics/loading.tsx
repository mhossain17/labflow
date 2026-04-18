import { Skeleton } from '@/components/ui/skeleton'

export default function AnalyticsLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-56" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar chart skeleton */}
        <div className="rounded-lg border p-4 space-y-3">
          <Skeleton className="h-5 w-40" />
          <div className="flex items-end gap-2 h-40 pt-4">
            {[60, 80, 45, 90, 70, 55].map((h, i) => (
              <Skeleton key={i} className="flex-1 rounded-t" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>

        {/* Second bar chart skeleton */}
        <div className="rounded-lg border p-4 space-y-3">
          <Skeleton className="h-5 w-36" />
          <div className="flex items-end gap-2 h-40 pt-4">
            {[40, 75, 60, 85, 50, 65].map((h, i) => (
              <Skeleton key={i} className="flex-1 rounded-t" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>

        {/* Pie chart skeleton */}
        <div className="rounded-lg border p-4 space-y-3">
          <Skeleton className="h-5 w-44" />
          <div className="flex items-center gap-6">
            <Skeleton className="h-32 w-32 rounded-full" />
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-2">
                  <Skeleton className="h-3 w-3 rounded-sm" />
                  <Skeleton className="h-3 w-24" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
