import { labelFromEnum } from "@/lib/utils";

export function enumOptions<T extends Record<string, string>>(input: T) {
  return Object.values(input).map((value) => ({
    value,
    label: labelFromEnum(value),
  }));
}

export function entityOptions<T extends { id: string }>(
  items: T[],
  getLabel: (item: T) => string
) {
  return items.map((item) => ({ value: item.id, label: getLabel(item) }));
}

export function toDateTimeInput(value?: Date | string | null) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
}
