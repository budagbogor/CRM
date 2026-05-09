import { Filter } from "lucide-react";

type BranchOption = {
  id: string;
  name: string;
};

export function BranchGlobalFilter({
  branches,
  selectedBranchId,
  from,
  to,
}: {
  branches: BranchOption[];
  selectedBranchId?: string;
  from?: string;
  to?: string;
}) {
  return (
    <form className="flex flex-wrap items-end gap-3 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="min-w-56">
        <label htmlFor="branchId" className="mb-1 block text-xs font-medium text-zinc-500">
          Branch
        </label>
        <select
          id="branchId"
          name="branchId"
          defaultValue={selectedBranchId ?? "all"}
          className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-800 dark:bg-zinc-900"
        >
          <option value="all">All Branches</option>
          {branches.map((branch) => (
            <option key={branch.id} value={branch.id}>
              {branch.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="from" className="mb-1 block text-xs font-medium text-zinc-500">
          From
        </label>
        <input
          id="from"
          name="from"
          type="date"
          defaultValue={from}
          className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-800 dark:bg-zinc-900"
        />
      </div>
      <div>
        <label htmlFor="to" className="mb-1 block text-xs font-medium text-zinc-500">
          To
        </label>
        <input
          id="to"
          name="to"
          type="date"
          defaultValue={to}
          className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-800 dark:bg-zinc-900"
        />
      </div>
      <button
        type="submit"
        className="inline-flex h-10 items-center gap-2 rounded-lg bg-zinc-950 px-4 text-sm font-medium text-white dark:bg-white dark:text-zinc-950"
      >
        <Filter className="h-4 w-4" />
        Apply
      </button>
    </form>
  );
}

