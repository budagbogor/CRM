"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import type { ActionResult } from "@/lib/form-data";
import { FormDrawer } from "@/components/ui/form-drawer";
import { cn } from "@/lib/utils";

export type SelectOption = {
  value: string;
  label: string;
};

export type FormField = {
  name: string;
  label: string;
  type?: "text" | "email" | "number" | "datetime-local" | "select" | "textarea" | "checkbox";
  options?: SelectOption[];
  placeholder?: string;
  required?: boolean;
  className?: string;
};

type EntityFormDrawerProps<TSchema extends z.ZodTypeAny> = {
  title: string;
  description?: string;
  triggerLabel: string;
  schema: TSchema;
  fields: FormField[];
  defaultValues: Record<string, string | number | boolean | undefined>;
  action: (_prev: unknown, formData: FormData) => Promise<ActionResult>;
  variant?: "primary" | "secondary" | "danger";
};

export function EntityFormDrawer<TSchema extends z.ZodTypeAny>({
  title,
  description,
  triggerLabel,
  schema,
  fields,
  defaultValues,
  action,
  variant,
}: EntityFormDrawerProps<TSchema>) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const form = useForm<Record<string, unknown>>({
    resolver: zodResolver(schema as never),
    defaultValues,
  });

  return (
    <FormDrawer
      title={title}
      description={description}
      triggerLabel={triggerLabel}
      variant={variant}
    >
      {(close) => (
        <form
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={form.handleSubmit((values) => {
            const formData = new FormData();
            Object.entries(values as Record<string, unknown>).forEach(([key, value]) => {
              if (value !== undefined && value !== null) {
                formData.set(key, String(value));
              }
            });

            startTransition(async () => {
              const result = await action(null, formData);
              if (result.ok) {
                toast.success(result.message);
                close();
                router.refresh();
              } else {
                toast.error(result.message);
              }
            });
          })}
        >
          {fields.map((field) => {
            const error = form.formState.errors[field.name]?.message?.toString();

            return (
              <label
                key={field.name}
                className={cn(
                  "grid gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-200",
                  field.type === "textarea" && "sm:col-span-2",
                  field.className
                )}
              >
                <span>
                  {field.label}
                  {field.required ? <span className="text-rose-500"> *</span> : null}
                </span>
                {field.type === "select" ? (
                  <select
                    {...form.register(field.name)}
                    className="h-10 rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-sky-400 dark:border-zinc-800 dark:bg-zinc-950"
                  >
                    <option value="">Select</option>
                    {field.options?.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : field.type === "textarea" ? (
                  <textarea
                    {...form.register(field.name)}
                    placeholder={field.placeholder}
                    rows={4}
                    className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-400 dark:border-zinc-800 dark:bg-zinc-950"
                  />
                ) : field.type === "checkbox" ? (
                  <input
                    type="checkbox"
                    {...form.register(field.name)}
                    className="h-5 w-5 rounded border-zinc-300"
                  />
                ) : (
                  <input
                    {...form.register(field.name)}
                    type={field.type ?? "text"}
                    placeholder={field.placeholder}
                    className="h-10 rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-sky-400 dark:border-zinc-800 dark:bg-zinc-950"
                  />
                )}
                {error ? <span className="text-xs text-rose-600">{error}</span> : null}
              </label>
            );
          })}

          <div className="flex justify-end gap-2 border-t border-zinc-200 pt-4 dark:border-zinc-800 sm:col-span-2">
            <button
              type="submit"
              disabled={isPending}
              className="h-9 rounded-md bg-zinc-950 px-4 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-white dark:text-zinc-950"
            >
              {isPending ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      )}
    </FormDrawer>
  );
}
