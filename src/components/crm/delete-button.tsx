"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

type DeleteButtonProps = {
  id: string;
  label?: string;
  entityName?: string;
  action: (id: string) => Promise<void>;
};

export function DeleteButton({
  id,
  label = "Delete",
  entityName = "record",
  action,
}: DeleteButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        disabled={isPending}
        onClick={() => setOpen(true)}
        className="h-8 rounded-md border border-rose-200 px-3 text-xs font-medium text-rose-700 hover:bg-rose-50 disabled:opacity-60 dark:border-rose-900 dark:text-rose-300 dark:hover:bg-rose-950"
      >
        {isPending ? "Deleting..." : label}
      </button>
      <ConfirmDialog
        open={open}
        title={`Delete ${entityName}?`}
        description={`This will remove the ${entityName} from the demo workspace. Linked history may block deletion.`}
        confirmLabel="Delete"
        intent="danger"
        pending={isPending}
        onCancel={() => setOpen(false)}
        onConfirm={() => {
          startTransition(async () => {
            try {
              await action(id);
              setOpen(false);
              toast.success(`${entityName[0].toUpperCase()}${entityName.slice(1)} deleted.`);
            } catch (error) {
              toast.error(
                error instanceof Error ? error.message : `Failed to delete ${entityName}.`
              );
            }
          });
        }}
      />
    </>
  );
}
