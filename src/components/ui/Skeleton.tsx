const shimmer = 'animate-pulse bg-gray-200 rounded-lg';

export function SkeletonText({ width = 'w-full', height = 'h-4' }: { width?: string; height?: string }) {
  return <div className={`${shimmer} ${width} ${height}`} />;
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-4 py-3">
      <div className={`${shimmer} h-4 w-1/4`} />
      <div className={`${shimmer} h-4 w-1/6`} />
      <div className={`${shimmer} h-4 w-1/5`} />
      <div className={`${shimmer} h-4 w-1/6`} />
      <div className={`${shimmer} h-4 w-1/6`} />
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className={`${shimmer} h-5 w-1/3`} />
        <div className={`${shimmer} h-5 w-16 rounded-full`} />
      </div>
      <div className="mt-4 space-y-2">
        <div className={`${shimmer} h-4 w-full`} />
        <div className={`${shimmer} h-4 w-2/3`} />
      </div>
      <div className="mt-4 flex gap-2">
        <div className={`${shimmer} h-4 w-16`} />
        <div className={`${shimmer} h-4 w-20`} />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
        <div className="flex gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className={`${shimmer} h-3 w-20`} />
          ))}
        </div>
      </div>
      {[...Array(rows)].map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </div>
  );
}
