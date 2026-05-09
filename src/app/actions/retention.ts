"use server";

import { revalidatePath } from "next/cache";
import { SurveyQuestionType } from "@/generated/prisma/enums";
import { assertPermission } from "@/lib/auth";
import { brandIdentity } from "@/lib/brand";
import {
  calculateCustomerHealthScore,
  calculateNextService,
  createComplaintRecoveryFlow,
  createPostTransactionRetentionFlow,
  handleSurveyResponse,
} from "@/services/retention";

export async function runPostTransactionRetentionFlowAction(
  transactionId: string
) {
  await assertPermission("transactions", "write");
  await createPostTransactionRetentionFlow(transactionId);
  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  revalidatePath("/reminders");
}

export async function submitGoodSurveyAction(
  surveyId: string
) {
  await assertPermission("follow-ups", "write");
  await handleSurveyResponse(surveyId, {
    npsScore: 9,
    comments: "Pelanggan merasa pengalaman servis di Mobeng memuaskan.",
    responses: [
      {
        questionKey: "overall_satisfaction",
        questionText: "Bagaimana kualitas servis kendaraan Anda di Mobeng?",
        questionType: SurveyQuestionType.RATING,
        ratingValue: 5,
      },
      {
        questionKey: "recommendation",
        questionText: "Seberapa besar kemungkinan Anda merekomendasikan Mobeng ke orang lain?",
        questionType: SurveyQuestionType.NPS,
        ratingValue: 9,
      },
    ],
  });
  revalidatePath("/dashboard");
  revalidatePath("/follow-ups");
  revalidatePath("/reminders");
}

export async function submitBadSurveyAction(
  surveyId: string
) {
  await assertPermission("follow-ups", "write");
  await handleSurveyResponse(surveyId, {
    npsScore: 2,
    comments: "Pelanggan melaporkan kualitas servis belum tuntas dan perlu tindak lanjut.",
    responses: [
      {
        questionKey: "overall_satisfaction",
        questionText: "Bagaimana kualitas servis kendaraan Anda di Mobeng?",
        questionType: SurveyQuestionType.RATING,
        ratingValue: 2,
      },
      {
        questionKey: "quality_comment",
        questionText: "Apa yang masih belum sesuai setelah servis?",
        questionType: SurveyQuestionType.TEXT,
        textValue: `Keluhan masih terasa setelah servis dan perlu follow-up dari ${brandIdentity.appName}.`,
      },
    ],
  });
  revalidatePath("/dashboard");
  revalidatePath("/follow-ups");
  revalidatePath("/complaints");
}

export async function runComplaintRecoveryFlowAction(
  ticketId: string
) {
  await assertPermission("complaints", "write");
  await createComplaintRecoveryFlow(ticketId);
  revalidatePath("/dashboard");
  revalidatePath("/complaints");
}

export async function calculateNextServiceAction(
  vehicleId: string
) {
  await assertPermission("vehicles", "write");
  await calculateNextService(vehicleId);
  revalidatePath("/reminders");
  revalidatePath("/vehicles");
}

export async function calculateCustomerHealthScoreAction(
  customerId: string
) {
  await assertPermission("customers", "write");
  await calculateCustomerHealthScore(customerId);
  revalidatePath("/dashboard");
  revalidatePath("/customers");
}

export async function submitSurveyResponseFormAction(formData: FormData) {
  await assertPermission("follow-ups", "write");
  const surveyId = String(formData.get("surveyId") ?? "");
  const serviceQuality = Number(formData.get("serviceQuality") ?? 0);
  const staffService = Number(formData.get("staffService") ?? 0);
  const facilityRating = Number(formData.get("facilityRating") ?? 0);
  const notes = String(formData.get("notes") ?? "");

  await handleSurveyResponse(surveyId, {
    npsScore: serviceQuality >= 4 ? 9 : serviceQuality,
    comments: notes,
    responses: [
      {
        questionKey: "overall_satisfaction",
        questionText: "Kualitas servis",
        questionType: SurveyQuestionType.RATING,
        ratingValue: serviceQuality,
      },
      {
        questionKey: "staff_service",
        questionText: "Pelayanan service advisor",
        questionType: SurveyQuestionType.RATING,
        ratingValue: staffService,
      },
      {
        questionKey: "facility_rating",
        questionText: "Kenyamanan fasilitas outlet",
        questionType: SurveyQuestionType.RATING,
        ratingValue: facilityRating,
      },
      {
        questionKey: "notes",
        questionText: "Catatan pelanggan",
        questionType: SurveyQuestionType.TEXT,
        textValue: notes,
      },
    ],
  });

  revalidatePath("/dashboard");
  revalidatePath("/follow-ups");
  revalidatePath(`/follow-ups/${surveyId}`);
  revalidatePath("/complaints");
}
