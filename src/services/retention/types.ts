import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import type {
  HealthScoreBand,
  SurveyQuestionType,
} from "@/generated/prisma/enums";

export type RetentionDb = PrismaClient | Prisma.TransactionClient;

export type NextServiceProjectionInput = {
  currentOdometer: number;
  nextServiceOdometer?: number | null;
  lastServiceDate?: Date | null;
  serviceHistory: Array<{
    openedAt: Date;
    odometerIn: number;
  }>;
  now?: Date;
  maxFallbackMonths?: number;
};

export type NextServiceProjection = {
  kmPerDay: number;
  estimatedNextServiceDate: Date;
  nextServiceOdometer: number;
  daysUntilNextService: number;
  usedFallback: boolean;
  reason: string;
};

export type SurveyResponseInput = {
  questionKey: string;
  questionText: string;
  questionType: SurveyQuestionType;
  ratingValue?: number;
  textValue?: string;
  booleanValue?: boolean;
};

export type HandleSurveyResponseInput = {
  responses: SurveyResponseInput[];
  comments?: string;
  npsScore?: number;
};

export type HealthScoreInput = {
  totalVisits: number;
  lifetimeValue: number;
  daysSinceLastService?: number | null;
  averageSurveyScore?: number | null;
  openComplaints: number;
  missedBookings: number;
  completedRecoveryActions: number;
  hasUpcomingReminder: boolean;
};

export type HealthScoreResult = {
  score: number;
  band: HealthScoreBand;
  churnRiskPercent: number;
  nextBestAction: string;
};
