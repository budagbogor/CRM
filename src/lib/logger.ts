import { env } from "@/lib/env";
import { getErrorTrackingProvider } from "@/services/error-tracking";

export type LogLevel = "debug" | "info" | "warn" | "error";

type LogEntry = {
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  timestamp: string;
};

const levelOrder: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function write(entry: LogEntry) {
  if (levelOrder[entry.level] < levelOrder[env.LOG_LEVEL]) return;

  const serialized = JSON.stringify(entry);
  if (entry.level === "error") {
    console.error(serialized);
    getErrorTrackingProvider().capture({
      message: entry.message,
      level: "error",
      context: entry.context,
    });
    return;
  }
  if (entry.level === "warn") {
    console.warn(serialized);
    getErrorTrackingProvider().capture({
      message: entry.message,
      level: "warn",
      context: entry.context,
    });
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

