import { notFound } from "next/navigation";
import { SurveyResponseForm } from "@/components/crm/survey-response-form";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { SurveyStatus } from "@/generated/prisma/enums";
import { toneForStatus } from "@/lib/status";
import { formatDateTime, labelFromEnum } from "@/lib/utils";
import { getFollowUpSurveyDetail } from "@/services/crm-queries";
import { CheckCircle2 } from "lucide-react";

export default async function FollowUpDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const survey = await getFollowUpSurveyDetail(id);
  if (!survey) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Detail survey"
        title={`${survey.customer.firstName} ${survey.customer.lastName}`}
        description={`Survey pasca servis untuk ${survey.serviceTransaction?.serviceNumber ?? "follow-up pelanggan"}.`}
      />
      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="text-base font-semibold text-zinc-950 dark:text-white">
            Konteks follow-up
          </h2>
          <dl className="mt-4 grid gap-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-500">Status</dt>
              <dd>
                <StatusBadge tone={toneForStatus(survey.status)}>
                  {labelFromEnum(survey.status)}
                </StatusBadge>
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-500">Channel</dt>
              <dd>{labelFromEnum(survey.channel)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-500">Dikirim</dt>
              <dd>{survey.sentAt ? formatDateTime(survey.sentAt) : "Belum dikirim"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-500">Vehicle</dt>
              <dd>
                {survey.serviceTransaction?.vehicle
                  ? `${survey.serviceTransaction.vehicle.make} ${survey.serviceTransaction.vehicle.model}`
                  : "Tanpa kendaraan"}
              </dd>
            </div>
          </dl>
        </section>
        {survey.status === SurveyStatus.COMPLETED ? (
          <EmptyState
            icon={CheckCircle2}
            title="Survey sudah selesai"
            description="Respon pelanggan sudah terekam dan workflow retention Mobeng sudah memproses follow-up ini."
          />
        ) : (
          <SurveyResponseForm surveyId={survey.id} />
        )}
      </div>
    </div>
  );
}
