import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export const SchemaStructureTableSkeleton = () => {
  return (
    <Card className="shadow-none">
      {/* Header Section */}
      <div className="flex items-center justify-between p-6 pb-4">
        <Skeleton className="h-7 w-40" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-10" />
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden xl:block">
        <ScrollArea className="h-[calc(100vh-479px)] [scrollbar-gutter:stable]">
          <Table className="table-fixed">
            <colgroup>
              <col style={{ width: "5%" }} />
              <col style={{ width: "17%" }} />
              <col style={{ width: "14%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "18%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "6%" }} />
            </colgroup>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Skeleton className="h-4 w-4" />
                </TableHead>
                <TableHead>
                  <Skeleton className="h-4 w-28" />
                </TableHead>
                <TableHead>
                  <Skeleton className="h-4 w-24" />
                </TableHead>
                <TableHead>
                  <Skeleton className="h-4 w-16" />
                </TableHead>
                <TableHead>
                  <Skeleton className="h-4 w-12" />
                </TableHead>
                <TableHead>
                  <Skeleton className="h-4 w-16" />
                </TableHead>
                <TableHead>
                  <Skeleton className="h-4 w-24" />
                </TableHead>
                <TableHead>
                  <Skeleton className="h-4 w-20" />
                </TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <TableRow key={i}>
                  <td className="p-4"><Skeleton className="h-10 w-4" /></td>
                  <td className="p-4"><Skeleton className="h-10 w-full" /></td>
                  <td className="p-4"><Skeleton className="h-10 w-full" /></td>
                  <td className="p-4"><Skeleton className="h-10 w-full" /></td>
                  <td className="p-4"><Skeleton className="h-10 w-full" /></td>
                  <td className="p-4"><Skeleton className="h-10 w-full" /></td>
                  <td className="p-4"><Skeleton className="h-10 w-full" /></td>
                  <td className="p-4"><Skeleton className="h-10 w-full" /></td>
                  <td className="p-4"><Skeleton className="h-10 w-8" /></td>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>

      {/* Mobile Card View */}
      <div className="block space-y-3 p-6 pt-0 xl:hidden">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-3 rounded-lg border bg-card p-4 shadow-sm">
            {/* Property Name */}
            <div className="space-y-1">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-9 w-full" />
            </div>
            {/* Property Type */}
            <div className="space-y-1">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-9 w-full" />
            </div>
            {/* IsArray */}
            <div className="space-y-1">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-9 w-full" />
            </div>
            {/* Access (optional) */}
            <div className="space-y-1">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-9 w-full" />
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
