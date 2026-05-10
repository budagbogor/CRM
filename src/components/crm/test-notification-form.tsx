"use client";

import { useActionState } from "react";
import { sendTestNotificationAction } from "@/app/actions/notifications";

export function TestNotificationForm() {
  const [state, formAction, pending] = useActionState(sendTestNotificationAction, null);

  return (
    <form action={formAction} className="space-y-2">
      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-10 items-center rounded-lg border border-zinc-300 px-3 text-sm font-medium hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
      >
        {pending ? "Sending..." : "Test Send Notification"}
      </button>
      {state?.message ? (
        <p className={`text-xs ${state.ok ? "text-emerald-600" : "text-rose-600"}`}>{state.message}</p>
      ) : null}
    </form>
  );
}

