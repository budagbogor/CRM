import { Building2, Settings2, Workflow } from "lucide-react";
import { TestNotificationForm } from "@/components/crm/test-notification-form";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { blueprintPlaybook } from "@/lib/service-blueprint";
import { formatDateTime, labelFromEnum } from "@/lib/utils";
import { getSettingsData } from "@/services/crm-queries";

const categoryOrder = [
  "PRE_SERVICE",
  "SERVICE",
  "POST_SERVICE",
  "RETENTION",
  "RECOVERY",
] as const;

export default async function SettingsPage() {
  const { branch, stages, automationJobs, activeBranches, brand, notification } = await getSettingsData();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Pengaturan"
        title="Service blueprint Mobeng"
        description="Tampilan operasional untuk menjelaskan alur outlet Mobeng, sentuhan ke pelanggan, trigger CRM, dan kontrol recovery yang berjalan di belakang layar."
      />

      <section className="grid gap-4 lg:grid-cols-3">
        <DashboardCard
          title="Outlet utama"
          value={branch?.code ?? "Not configured"}
          detail={branch?.name ?? "Jalankan seed untuk membuat outlet Mobeng"}
          icon={Building2}
          tone="sky"
        />
        <DashboardCard
          title="Tahap blueprint"
          value={stages.length}
          detail="Tahap perjalanan servis yang aktif di demo Mobeng."
          icon={Workflow}
          tone="emerald"
        />
        <DashboardCard
          title="Workflow aktif"
          value={automationJobs.length}
          detail="Automation job yang terhubung ke blueprint layanan."
          icon={Settings2}
          tone="violet"
        />
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-zinc-950 dark:text-white">
              Mobeng Brand Settings
            </h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Identitas utama yang dipakai di UI, notifikasi, survey, dan materi demo outlet.
            </p>
          </div>
          <StatusBadge tone="info">{activeBranches} outlet aktif</StatusBadge>
        </div>
        <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2 xl:grid-cols-3">
          <SummaryItem label="Brand name" value={brand.appName} />
          <SummaryItem label="Subtitle" value={brand.subtitle} />
          <SummaryItem label="Tagline" value={brand.tagline} />
          <SummaryItem label="Positioning" value={brand.positioning} />
          <SummaryItem label="Company name" value={brand.companyName} />
          <SummaryItem label="Support email" value={brand.supportEmail} />
          <SummaryItem label="WhatsApp" value={brand.whatsappNumber} />
          <SummaryItem label="Active branches" value={`${activeBranches} outlet`} />
        </dl>
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-zinc-950 dark:text-white">
              Notification Provider Settings
            </h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Status konfigurasi provider notifikasi production. Nilai credential ditampilkan dalam mode masked.
            </p>
          </div>
          <StatusBadge tone="info">{notification.selectedProvider}</StatusBadge>
        </div>
        <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2 xl:grid-cols-3">
          <SummaryItem label="WhatsApp configured" value={notification.whatsapp.configured ? "Yes" : "No"} />
          <SummaryItem label="WhatsApp API version" value={notification.whatsapp.apiVersion} />
          <SummaryItem label="WA token" value={notification.whatsapp.accessTokenMasked} />
          <SummaryItem label="WA phone number id" value={notification.whatsapp.phoneNumberIdMasked} />
          <SummaryItem label="WA business account id" value={notification.whatsapp.businessAccountIdMasked} />
          <SummaryItem label="Email provider" value={notification.emailProvider} />
          <SummaryItem label="Email configured" value={notification.email.configuredMock || notification.email.configuredSmtp || notification.email.configuredResend ? "Yes" : "No"} />
          <SummaryItem label="Email from" value={notification.email.from} />
          <SummaryItem label="SMTP host" value={notification.email.smtpHostMasked} />
          <SummaryItem label="SMTP user" value={notification.email.smtpUserMasked} />
          <SummaryItem label="Resend key" value={notification.email.resendKeyMasked} />
        </dl>
        <div className="mt-5">
          <TestNotificationForm />
        </div>
      </section>

      {branch ? (
        <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="text-base font-semibold text-zinc-950 dark:text-white">
            Profil outlet
          </h2>
          <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <SummaryItem label="Manager" value={branch.manager?.name ?? "Belum ditugaskan"} />
            <SummaryItem label="Phone" value={branch.phone ?? "-"} />
            <SummaryItem label="Email" value={branch.email ?? "-"} />
            <SummaryItem label="Address" value={`${branch.address}, ${branch.city}`} />
          </dl>
        </div>
      ) : null}

      <section className="space-y-3">
        <div>
          <h2 className="text-base font-semibold text-zinc-950 dark:text-white">
            Papan blueprint layanan
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Setiap kartu menjelaskan aktivitas yang terlihat oleh owner, pekerjaan CRM di belakangnya, titik gagal proses, dan cara tim Mobeng memulihkannya.
          </p>
        </div>
        <div className="grid gap-4 overflow-x-auto xl:grid-cols-5">
          {categoryOrder.map((category) => {
            const categoryStages = stages.filter((stage) => stage.category === category);

            return (
              <div
                key={category}
                className="min-w-72 rounded-lg border border-zinc-200 bg-zinc-100/70 p-3 dark:border-zinc-800 dark:bg-zinc-900/70"
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-zinc-950 dark:text-white">
                    {labelFromEnum(category)}
                  </h3>
                  <StatusBadge tone="info">{categoryStages.length} stages</StatusBadge>
                </div>
                <div className="space-y-3">
                  {categoryStages.map((stage) => {
                    const playbook = blueprintPlaybook[stage.code];

                    return (
                      <article
                        key={stage.id}
                        className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium text-zinc-950 dark:text-white">
                              {stage.name}
                            </p>
                            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                              {stage.code}
                            </p>
                          </div>
                          <StatusBadge tone={stage.isActive ? "success" : "neutral"}>
                            {stage.isActive ? "Aktif" : "Nonaktif"}
                          </StatusBadge>
                        </div>
                        <dl className="mt-4 grid gap-3 text-sm leading-6">
                          <BlueprintItem
                            label="Frontstage activity"
                            value={playbook?.frontstage ?? stage.description ?? "-"}
                          />
                          <BlueprintItem
                            label="Backstage activity"
                            value={playbook?.backstage ?? "Koordinasi CRM belum didefinisikan."}
                          />
                          <BlueprintItem
                            label="CRM trigger"
                            value={playbook?.crmTrigger ?? "Trigger workflow manual."}
                          />
                          <BlueprintItem
                            label="Failure point"
                            value={playbook?.failurePoint ?? "Belum ada failure point yang dicatat."}
                          />
                          <BlueprintItem
                            label="Recovery action"
                            value={playbook?.recoveryAction ?? "Belum ada action recovery yang dicatat."}
                          />
                          <BlueprintItem
                            label="Responsible role"
                            value={`${stage.ownerRole ?? "Belum ditentukan"}${stage.defaultSlaHours ? ` - SLA ${stage.defaultSlaHours} jam` : ""}`}
                          />
                        </dl>
                      </article>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-zinc-950 dark:text-white">
              Antrian automation aktif
            </h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Job demo yang menunjukkan bagaimana blueprint Mobeng berubah menjadi workflow CRM yang bisa ditindaklanjuti.
            </p>
          </div>
        </div>
        <div className="mt-5 space-y-3">
          {automationJobs.length === 0 ? (
            <EmptyState
              icon={Settings2}
              title="Belum ada automation job"
              description="Jalankan seed untuk menampilkan automation survey, reminder, dan recovery."
            />
          ) : (
            automationJobs.map((job) => (
              <div
                key={job.id}
                className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="font-medium text-zinc-950 dark:text-white">{job.name}</p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    {job.blueprintStage?.name ?? "Tanpa blueprint stage"} - {job.jobType}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
                  <StatusBadge tone={job.status === "ACTIVE" ? "success" : "warning"}>
                    {labelFromEnum(job.status)}
                  </StatusBadge>
                  <span>Owner: {job.owner?.name ?? "System"}</span>
                  <span>
                    Next run: {job.nextRunAt ? formatDateTime(job.nextRunAt) : "Belum dijadwalkan"}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function SummaryItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <dt className="text-zinc-500 dark:text-zinc-400">{label}</dt>
      <dd className="mt-1 font-medium text-zinc-950 dark:text-white">{value}</dd>
    </div>
  );
}

function BlueprintItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {label}
      </dt>
      <dd className="mt-1 text-zinc-700 dark:text-zinc-200">{value}</dd>
    </div>
  );
}
