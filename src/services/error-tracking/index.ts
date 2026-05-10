import { env } from "@/lib/env";

export type TrackingLevel = "warn" | "error";

export type ErrorTrackingEvent = {
  message: string;
  level: TrackingLevel;
  context?: Record<string, unknown>;
};

export interface ErrorTrackingProvider {
  capture(event: ErrorTrackingEvent): void;
}

class ConsoleTrackingProvider implements ErrorTrackingProvider {
  capture(event: ErrorTrackingEvent) {
    const payload = { type: "error_tracking", ...event, timestamp: new Date().toISOString() };
    if (event.level === "error") {
      console.error(JSON.stringify(payload));
      return;
    }
    console.warn(JSON.stringify(payload));
  }
}

class SentryTrackingProvider implements ErrorTrackingProvider {
  capture(event: ErrorTrackingEvent) {
    void env.SENTRY_DSN;
    const payload = { provider: "sentry_placeholder", ...event, timestamp: new Date().toISOString() };
    if (event.level === "error") console.error(JSON.stringify(payload));
    else console.warn(JSON.stringify(payload));
  }
}

class LogtailTrackingProvider implements ErrorTrackingProvider {
  capture(event: ErrorTrackingEvent) {
    const payload = { provider: "logtail_placeholder", ...event, timestamp: new Date().toISOString() };
    if (event.level === "error") console.error(JSON.stringify(payload));
    else console.warn(JSON.stringify(payload));
  }
}

class DatadogTrackingProvider implements ErrorTrackingProvider {
  capture(event: ErrorTrackingEvent) {
    const payload = { provider: "datadog_placeholder", ...event, timestamp: new Date().toISOString() };
    if (event.level === "error") console.error(JSON.stringify(payload));
    else console.warn(JSON.stringify(payload));
  }
}

export function getErrorTrackingProvider(): ErrorTrackingProvider {
  if (env.ERROR_TRACKING_PROVIDER === "sentry") return new SentryTrackingProvider();
  if (env.ERROR_TRACKING_PROVIDER === "logtail") return new LogtailTrackingProvider();
  if (env.ERROR_TRACKING_PROVIDER === "datadog") return new DatadogTrackingProvider();
  return new ConsoleTrackingProvider();
}

