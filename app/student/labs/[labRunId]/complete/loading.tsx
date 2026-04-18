import { Skeleton } from '@/components/ui/skeleton'

export default function LabCompleteLoading() {
  return (
    <div className="max-w-md mx-auto py-16 px-4 flex flex-col items-center text-center space-y-6">
      <Skeleton className="h-16 w-16 rounded-full" />
      <div className="space-y-2 w-full">
        <Skeleton className="h-8 w-48 mx-auto" />
        <Skeleton className="h-4 w-64 mx-auto" />
      </div>
      <div className="w-full rounded-lg border p-4 space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex justify-between">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
      <Skeleton className="h-10 w-32" />
    </div>
  )
}
