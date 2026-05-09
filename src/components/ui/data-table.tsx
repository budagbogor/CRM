import { cn } from "@/lib/utils";

export type DataTableColumn<T> = {
  key: string;
  header: string;
  cell: (row: T) => React.ReactNode;
  className?: string;
  mobileLabel?: string;
};

type DataTableProps<T> = {
  columns: DataTableColumn<T>[];
  data: T[];
  getRowKey: (row: T) => string;
  emptyMessage?: string;
  mobileCardTitle?: (row: T) => React.ReactNode;
};

export function DataTable<T>({
  columns,
  data,
  getRowKey,
  emptyMessage = "No records found.",
  mobileCardTitle,
}: DataTableProps<T>) {
  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="block md:hidden">
        {data.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
            {emptyMessage}
          </div>
        ) : (
          <div className="space-y-3 p-3">
            {data.map((row) => (
              <article
                key={getRowKey(row)}
                className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950"
              >
                <h3 className="text-sm font-semibold text-zinc-950 dark:text-white">
                  {mobileCardTitle ? mobileCardTitle(row) : columns[0]?.cell(row)}
                </h3>
                <dl className="mt-3 space-y-2">
                  {columns.slice(1).map((column) => (
                    <div key={column.key} className="flex items-start justify-between gap-3">
                      <dt className="text-xs text-zinc-500 dark:text-zinc-400">
                        {column.mobileLabel ?? column.header}
                      </dt>
                      <dd className="text-right text-xs text-zinc-800 dark:text-zinc-200">
                        {column.cell(row)}
                      </dd>
                    </div>
                  ))}
                </dl>
              </article>
            ))}
          </div>
        )}
      </div>
      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full divide-y divide-zinc-200 text-sm dark:divide-zinc-800">
          <thead className="bg-zinc-50 text-left text-xs font-semibold uppercase text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={cn("whitespace-nowrap px-4 py-3", column.className)}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {data.length === 0 ? (
              <tr>
                <td
                  className="px-4 py-8 text-center text-zinc-500 dark:text-zinc-400"
                  colSpan={columns.length}
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr
                  key={getRowKey(row)}
                  className="bg-white transition-colors hover:bg-zinc-50 dark:bg-zinc-950 dark:hover:bg-zinc-900"
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={cn(
                        "whitespace-nowrap px-4 py-3 text-zinc-700 dark:text-zinc-200",
                        column.className
                      )}
                    >
                      {column.cell(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
