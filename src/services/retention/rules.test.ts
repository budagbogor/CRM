import { describe, expect, it } from "vitest";
import { HealthScoreBand, SurveyQuestionType } from "@/generated/prisma/enums";
import {
  calculateHealthScoreFromRules,
  calculateNextServiceProjection,
  isBadSurveyResponse,
} from "./rules";

describe("calculateNextServiceProjection", () => {
  it("calculates km per day and estimated next service date from service history", () => {
    const now = new Date("2026-05-07T00:00:00.000Z");
    const result = calculateNextServiceProjection({
      currentOdometer: 10_000,
      nextServiceOdometer: 12_000,
      serviceHistory: [
        { openedAt: new Date("2026-03-08T00:00:00.000Z"), odometerIn: 7_000 },
        { openedAt: new Date("2026-05-07T00:00:00.000Z"), odometerIn: 10_000 },
      ],
      now,
    });

    expect(result.kmPerDay).toBe(50);
    expect(result.daysUntilNextService).toBe(40);
    expect(result.estimatedNextServiceDate.toISOString()).toBe(
      "2026-06-16T00:00:00.000Z"
    );
    expect(result.usedFallback).toBe(false);
  });

  it("falls back to six months when mileage history is missing", () => {
    const now = new Date("2026-05-07T00:00:00.000Z");
    const result = calculateNextServiceProjection({
      currentOdometer: 0,
      serviceHistory: [],
      now,
    });

    expect(result.kmPerDay).toBe(0);
    expect(result.usedFallback).toBe(true);
    expect(result.estimatedNextServiceDate.toISOString()).toBe(
      "2026-11-07T00:00:00.000Z"
    );
  });

  it("caps long estimates at the six-month fallback window", () => {
    const now = new Date("2026-05-07T00:00:00.000Z");
    const result = calculateNextServiceProjection({
      currentOdometer: 10_000,
      nextServiceOdometer: 30_000,
      serviceHistory: [
        { openedAt: new Date("2026-04-07T00:00:00.000Z"), odometerIn: 9_900 },
        { openedAt: new Date("2026-05-07T00:00:00.000Z"), odometerIn: 10_000 },
      ],
      now,
    });

    expect(result.usedFallback).toBe(true);
    expect(result.estimatedNextServiceDate.toISOString()).toBe(
      "2026-11-07T00:00:00.000Z"
    );
  });
});

describe("survey response rules", () => {
  it("flags poor quality ratings for complaint creation", () => {
    expect(
      isBadSurveyResponse([
        {
          questionKey: "overall_satisfaction",
          questionText: "Overall satisfaction",
          questionType: SurveyQuestionType.RATING,
          ratingValue: 2,
        },
      ])
    ).toBe(true);
  });

  it("does not flag good quality ratings", () => {
    expect(
      isBadSurveyResponse([
        {
          questionKey: "overall_satisfaction",
          questionText: "Overall satisfaction",
          questionType: SurveyQuestionType.RATING,
          ratingValue: 5,
        },
      ])
    ).toBe(false);
  });

  it("treats neutral quality ratings as non-complaint feedback", () => {
    expect(
      isBadSurveyResponse([
        {
          questionKey: "overall_satisfaction",
          questionText: "Overall satisfaction",
          questionType: SurveyQuestionType.RATING,
          ratingValue: 3,
        },
      ])
    ).toBe(false);
  });
});

describe("calculateHealthScoreFromRules", () => {
  it("scores loyal low-risk customers as healthy or better", () => {
    const result = calculateHealthScoreFromRules({
      totalVisits: 4,
      lifetimeValue: 4_000_000,
      daysSinceLastService: 30,
      averageSurveyScore: 4.8,
      openComplaints: 0,
      missedBookings: 0,
      completedRecoveryActions: 0,
      hasUpcomingReminder: true,
    });

    expect(result.score).toBeGreaterThanOrEqual(85);
    expect(result.band).toBe(HealthScoreBand.EXCELLENT);
  });

  it("penalizes unresolved complaints and missed bookings", () => {
    const result = calculateHealthScoreFromRules({
      totalVisits: 1,
      lifetimeValue: 500_000,
      daysSinceLastService: 220,
      averageSurveyScore: 2,
      openComplaints: 2,
      missedBookings: 1,
      completedRecoveryActions: 0,
      hasUpcomingReminder: false,
    });

    expect(result.score).toBeLessThan(35);
    expect(result.band).toBe(HealthScoreBand.LOST);
    expect(result.nextBestAction).toContain("Resolve open complaint");
  });
});
