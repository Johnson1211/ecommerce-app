import { cn } from '../../lib/helpers'

export const Skeleton = ({ className }) => (
  <div className={cn('animate-pulse bg-gray-200 rounded', className)} />
)

export const ProductSkeleton = () => (
  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
    <Skeleton className="w-full h-48" />
    <div className="p-4 space-y-3">
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <div className="flex justify-between items-center pt-2">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-9 w-24" />
      </div>
    </div>
  </div>
)

export const TableSkeleton = ({ rows = 5 }) => (
  <div className="space-y-3">
    <div className="flex gap-4">
      {[...Array(4)].map((_, i) => (
        <Skeleton key={i} className="h-8 flex-1" />
      ))}
    </div>
    {[...Array(rows)].map((_, i) => (
      <div key={i} className="flex gap-4">
        {[...Array(4)].map((_, j) => (
          <Skeleton key={j} className="h-12 flex-1" />
        ))}
      </div>
    ))}
  </div>
)
