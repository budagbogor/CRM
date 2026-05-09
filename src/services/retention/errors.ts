export class RetentionError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly cause?: unknown
  ) {
    super(message);
    this.name = "RetentionError";
  }
}

export function assertFound<T>(
  value: T | null | undefined,
  message: string
): T {
  if (!value) {
    throw new RetentionError(message, "NOT_FOUND");
  }

  return value;
}

export function assertValid(condition: boolean, message: string) {
  if (!condition) {
    throw new RetentionError(message, "VALIDATION_ERROR");
  }
}
