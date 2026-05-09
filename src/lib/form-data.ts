function sanitizeValue(value: FormDataEntryValue) {
  if (typeof value !== "string") return value;
  return value
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .trim();
}

export function formDataToObject(formData: FormData) {
  return Object.fromEntries(
    Array.from(formData.entries()).map(([key, value]) => [key, sanitizeValue(value)])
  );
}

export type ActionResult = {
  ok: boolean;
  message: string;
  errors?: Record<string, string[]>;
};

export const actionOk = (message: string): ActionResult => ({ ok: true, message });

export const actionError = (
  message: string,
  errors?: Record<string, string[]>
): ActionResult => ({ ok: false, message, errors });
