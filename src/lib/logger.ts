export type LogLevel = "debug" | "info" | "warn" | "error";

type LogEntry = {
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  timestamp: string;
};

function write(entry: LogEntry) {
  const serialized = JSON.stringify(entry);
  if (entry.level === "error") {
    console.error(serialized);
    return;
  }
  if (entry.level === "warn") {
    console.warn(serialized);
    return;
  }
  console.log(serialized);
}

export const logger = {
  debug(message: string, context?: Record<string, unknown>) {
    write({ level: "debug", message, context, timestamp: new Date().toISOString() });
  },
  info(message: string, context?: Record<string, unknown>) {
    write({ level: "info", message, context, timestamp: new Date().toISOString() });
  },
  warn(message: string, context?: Record<string, unknown>) {
    write({ level: "warn", message, context, timestamp: new Date().toISOString() });
  },
  error(message: string, context?: Record<string, unknown>) {
    write({ level: "error", message, context, timestamp: new Date().toISOString() });
  },
};

