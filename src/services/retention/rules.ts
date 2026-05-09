import { HealthScoreBand } from "@/generated/prisma/enums";
import type {
  HealthScoreInput,
  HealthScoreResult,
  NextServiceProjection,
  NextServiceProjectionInput,
  SurveyResponseInput,
} from "./types";

const dayMs = 24 * 60 * 60 * 1000;

export function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function addMonths(date: Date, months: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

export function daysBetween(from: Date, to: Date) {
  return Math.max(0, Math.ceil((to.getTime() - from.getTime()) / dayMs));
}

export function calculateNextServiceProjection({
  currentOdometer,
  nextServiceOdometer,
  lastServiceDate,
  serviceHistory,
  now = new Date(),
  maxFallbackMonths = 6,
}: NextServiceProjectionInput): NextServiceProjection {
  const sanitizedOdometer = Math.max(0, currentOdometer);
  const targetOdometer =
    nextServiceOdometer && nextServiceOdometer > sanitizedOdometer
      ? nextServiceOdometer
      : sanitizedOdometer + 5000;

  const sortedHistory = [...serviceHistory]
    .filter((item) => item.odometerIn >= 0 && item.openedAt <= now)
    .sort((a, b) => a.openedAt.getTime() - b.openedAt.getTime());

  let kmPerDay = 0;
  let reason = "fallback_max_6_months";

  if (sortedHistory.length >= 2) {
    const first = sortedHistory[0];
    const last = sortedHistory[sortedHistory.length - 1];
    const days = Math.max(1, daysBetween(first.openedAt, last.openedAt));
    const distance = Math.max(0, last.odometerIn - first.odometerIn);
    kmPerDay = distance / days;
    reason = "service_history_average";
  } else if (lastServiceDate && lastServiceDate < now) {
    const days = Math.max(1, daysBetween(lastServiceDate, now));
    kmPerDay = Math.max(0, sanitizedOdometer / days);
    reason = "last_service_date_estimate";
  }

  if (!Number.isFinite(kmPerDay) || kmPerDay <= 0) {
    const fallbackDate = addMonths(now, maxFallbackMonths);

    return {
      kmPerDay: 0,
      estimatedNextServiceDate: fallbackDate,
      nextServiceOdometer: targetOdometer,
      daysUntilNextService: daysBetween(now, fallbackDate),
      usedFallback: true,
      reason: "insufficient_mileage_history",
    };
  }

  const remainingKm = Math.max(0, targetOdometer - sanitizedOdometer);
  const estimatedDays = Math.ceil(remainingKm / kmPerDay);
  const estimatedDate = addDays(now, Math.max(0, estimatedDays));
  const fallbackDate = addMonths(now, maxFallbackMonths);
  const cappedDate =
    estimatedDate.getTime() > fallbackDate.getTime() ? fallbackDate : estimatedDate;

  return {
    kmPerDay: Number(kmPerDay.toFixed(2)),
    estimatedNextServiceDate: cappedDate,
    nextServiceOdometer: targetOdometer,
    daysUntilNextService: daysBetween(now, cappedDate),
    usedFallback: cappedDate.getTime() === fallbackDate.getTime(),
    reason,
  };
}

export function getQualityRating(responses: SurveyResponseInput[]) {
  const qualityResponse = responses.find((response) =>
    ["quality", "overall_satisfaction", "service_quality"].includes(
      response.questionKey
    )
  );

  return qualityResponse?.ratingValue ?? null;
}

export function isBadSurveyResponse(responses: SurveyResponseInput[]) {
  const rating = getQualityRating(responses);
  return rating !== null && rating <= 2;
}

export function calculateHealthScoreFromRules(
  input: HealthScoreInput
): HealthScoreResult {
  let score = 50;

  score += Math.min(input.totalVisits, 5) * 5;
  score += Math.min(input.lifetimeValue / 1_000_000, 5) * 3;

  if (input.daysSinceLastService === null || input.daysSinceLastService === undefined) {
    score -= 8;
  } else if (input.daysSinceLastService <= 90) {
    score += 12;
  } else if (input.daysSinceLastService <= 180) {
    score += 4;
  } else {
    score -= 12;
  }

  if (input.averageSurveyScore !== null && input.averageSurveyScore !== undefined) {
    score += (input.averageSurveyScore - 3) * 6;
  }

  score -= input.openComplaints * 18;
  score -= input.missedBookings * 10;
  score += input.completedRecoveryActions * 4;
  score += input.hasUpcomingReminder ? 3 : -3;

  const finalScore = Math.max(0, Math.min(100, Math.round(score)));
  const band =
    finalScore >= 85
      ? HealthScoreBand.EXCELLENT
      : finalScore >= 70
        ? HealthScoreBand.HEALTHY
        : finalScore >= 55
          ? HealthScoreBand.WATCH
          : finalScore >= 35
            ? HealthScoreBand.AT_RISK
            : HealthScoreBand.LOST;

  const churnRiskPercent = Math.max(0, Math.min(100, 100 - finalScore));

  const nextBestAction =
    input.openComplaints > 0
      ? "Resolve open complaint and confirm customer satisfaction."
      : band === HealthScoreBand.AT_RISK || band === HealthScoreBand.LOST
        ? "Schedule advisor callback and create retention recovery plan."
        : band === HealthScoreBand.WATCH
          ? "Send service reminder and confirm next booking window."
          : "Maintain regular service cadence and loyalty communication.";

  return {
    score: finalScore,
    band,
    churnRiskPercent,
    nextBestAction,
  };
}
