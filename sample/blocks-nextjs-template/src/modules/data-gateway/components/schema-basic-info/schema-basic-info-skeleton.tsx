import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export const SchemaBasicInfoSkeleton = () => {
  return (
    <Card className="mb-4 shadow-none xl:h-[148px] xl:overflow-hidden">
      <CardContent className="flex flex-col items-start justify-between gap-5">
        {/* Header Section */}
        <div className="flex w-full flex-row items-center justify-between">
          <Skeleton className="h-7 w-40" />
          <div className="flex flex-row items-center gap-4">
            <Skeleton className="hidden h-10 w-32 lg:flex" />
            <Skeleton className="h-10 w-10" />
          </div>
        </div>

        {/* Schema Details Section */}
        <div className="grid w-full grid-cols-1 gap-4 text-muted-foreground xl:grid-cols-3">
          <div className="flex flex-col gap-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-32" />
          </div>
          <div className="flex flex-col gap-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-20" />
          </div>
          <div className="flex flex-col gap-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-28" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
