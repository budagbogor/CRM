import { Metadata } from "next";
import {
  CheckCircle2,
  MessageSquare,
  ClipboardList,
  AlertTriangle,
  CalendarClock,
  BarChart3,
  RefreshCw,
  ArrowRight,
  Bell,
  ThumbsUp,
  ThumbsDown,
  Heart,
  Wrench,
  Users,
  Car,
  ShieldAlert,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Workflow | Mobeng CRM",
  description:
    "Panduan alur kerja customer retention Mobeng — dari transaksi servis hingga repeat order.",
};

// ----------------------------------------------------------------
// Types
// ----------------------------------------------------------------
type Step = {
  id: string;
  title: string;
  desc: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
  border: string;
  badge?: string;
  badgeColor?: string;
};

type WorkflowSection = {
  id: string;
  title: string;
  subtitle: string;
  headerColor: string;
  steps: Step[];
};

// ----------------------------------------------------------------
// Data
// ----------------------------------------------------------------
const workflows: WorkflowSection[] = [
  {
    id: "retention",
    title: "Alur Retention Utama",
    subtitle:
      "Workflow inti pasca transaksi servis — dari selesai servis sampai repeat order.",
    headerColor: "from-blue-600 to-blue-800",
    steps: [
      {
        id: "r1",
        title: "Servis Selesai",
        desc: "Transaksi berubah status COMPLETED. Sistem otomatis memulai retention flow.",
        icon: <Wrench className="h-5 w-5" />,
        color: "text-blue-600",
        bg: "bg-blue-50",
        border: "border-blue-200",
        badge: "Auto-trigger",
        badgeColor: "bg-blue-100 text-blue-700",
      },
      {
        id: "r2",
        title: "Pesan Terima Kasih",
        desc: "NotificationLog dibuat (QUEUED). Thank you message dikirim ke customer via saluran preferredChannel.",
        icon: <MessageSquare className="h-5 w-5" />,
        color: "text-sky-600",
        bg: "bg-sky-50",
        border: "border-sky-200",
        badge: "H+0",
        badgeColor: "bg-sky-100 text-sky-700",
      },
      {
        id: "r3",
        title: "Follow-Up Survey H+3",
        desc: "AutomationJob SEND_FOLLOW_UP_H3 dijadwalkan. Reminder FOLLOW_UP dibuat dengan dueAt H+3.",
        icon: <ClipboardList className="h-5 w-5" />,
        color: "text-violet-600",
        bg: "bg-violet-50",
        border: "border-violet-200",
        badge: "H+3",
        badgeColor: "bg-violet-100 text-violet-700",
      },
      {
        id: "r4",
        title: "Hitung Next Service",
        desc: "calculateNextService() menghitung estimasi tanggal servis berikutnya berdasarkan km per day. Fallback 6 bulan jika data tidak cukup.",
        icon: <CalendarClock className="h-5 w-5" />,
        color: "text-amber-600",
        bg: "bg-amber-50",
        border: "border-amber-200",
      },
      {
        id: "r5",
        title: "Cadence Reminder",
        desc: "AutomationJob dijadwalkan: H-30, H-14, H-7, H-1, H-0 (due date), dan H+7 overdue jika belum ada transaksi baru.",
        icon: <Bell className="h-5 w-5" />,
        color: "text-orange-600",
        bg: "bg-orange-50",
        border: "border-orange-200",
        badge: "H-30 s/d H+7",
        badgeColor: "bg-orange-100 text-orange-700",
      },
      {
        id: "r6",
        title: "Booking Service",
        desc: "Customer merespons reminder dengan membuat booking. Booking dapat dibuat dari halaman /bookings.",
        icon: <CalendarClock className="h-5 w-5" />,
        color: "text-teal-600",
        bg: "bg-teal-50",
        border: "border-teal-200",
      },
      {
        id: "r7",
        title: "Repeat Service",
        desc: "Customer datang dan melakukan servis ulang. Siklus retention dimulai kembali dari awal.",
        icon: <RefreshCw className="h-5 w-5" />,
        color: "text-green-600",
        bg: "bg-green-50",
        border: "border-green-200",
        badge: "Loop",
        badgeColor: "bg-green-100 text-green-700",
      },
    ],
  },
  {
    id: "survey",
    title: "Alur Survey & Complaint Recovery",
    subtitle:
      "Jalur bercabang berdasarkan hasil survey H+3 — baik atau buruk.",
    headerColor: "from-violet-600 to-violet-800",
    steps: [
      {
        id: "s1",
        title: "Survey Diterima",
        desc: "Customer mengisi FollowUpSurvey. Validasi: minimal 1 response, ratingValue 0-10.",
        icon: <ClipboardList className="h-5 w-5" />,
        color: "text-violet-600",
        bg: "bg-violet-50",
        border: "border-violet-200",
      },
      {
        id: "s2",
        title: "Klasifikasi Respons",
        desc: "Sistem mengevaluasi rating. Bad survey: overall_satisfaction, quality, atau service_quality ≤ 2.",
        icon: <BarChart3 className="h-5 w-5" />,
        color: "text-indigo-600",
        bg: "bg-indigo-50",
        border: "border-indigo-200",
      },
      {
        id: "s3_good",
        title: "Survey Baik → Selesai",
        desc: "SurveyResponse disimpan. Reminder FOLLOW_UP ditandai COMPLETED. Journey event SURVEY_COMPLETED dicatat.",
        icon: <ThumbsUp className="h-5 w-5" />,
        color: "text-green-600",
        bg: "bg-green-50",
        border: "border-green-200",
        badge: "Baik",
        badgeColor: "bg-green-100 text-green-700",
      },
      {
        id: "s3_bad",
        title: "Survey Buruk → Complaint",
        desc: "ComplaintTicket dibuat (priority HIGH). Customer status AT_RISK. Task recovery dibuat. Journey event COMPLAINT_OPENED.",
        icon: <ThumbsDown className="h-5 w-5" />,
        color: "text-rose-600",
        bg: "bg-rose-50",
        border: "border-rose-200",
        badge: "Buruk",
        badgeColor: "bg-rose-100 text-rose-700",
      },
      {
        id: "s4",
        title: "Complaint Recovery Flow",
        desc: "createComplaintRecoveryFlow() berjalan: assign recovery owner, set SLA (CRITICAL 4j, HIGH 8j, MEDIUM 24j, LOW 48j), update status INVESTIGATING.",
        icon: <ShieldAlert className="h-5 w-5" />,
        color: "text-red-600",
        bg: "bg-red-50",
        border: "border-red-200",
        badge: "SLA",
        badgeColor: "bg-red-100 text-red-700",
      },
      {
        id: "s5",
        title: "Recovery Selesai",
        desc: "RecoveryAction ditandai COMPLETED. Customer health score dihitung ulang. Jika membaik, status kembali ke ACTIVE.",
        icon: <CheckCircle2 className="h-5 w-5" />,
        color: "text-green-600",
        bg: "bg-green-50",
        border: "border-green-200",
      },
    ],
  },
  {
    id: "health",
    title: "Alur Health Score",
    subtitle:
      "Kalkulasi Customer Health Score dan next best action yang dihasilkan.",
    headerColor: "from-emerald-600 to-emerald-800",
    steps: [
      {
        id: "h1",
        title: "Trigger Kalkulasi",
        desc: "calculateCustomerHealthScore() dipanggil otomatis via AutomationJob atau manual dari halaman /customers.",
        icon: <Heart className="h-5 w-5" />,
        color: "text-emerald-600",
        bg: "bg-emerald-50",
        border: "border-emerald-200",
      },
      {
        id: "h2",
        title: "Kumpulkan Data",
        desc: "Ambil: completed visits, lifetime value, last service date, average survey score, open complaints, missed bookings, completed recovery actions, upcoming reminders.",
        icon: <Users className="h-5 w-5" />,
        color: "text-teal-600",
        bg: "bg-teal-50",
        border: "border-teal-200",
      },
      {
        id: "h3",
        title: "Hitung Skor (0-100)",
        desc: "Base 50 + visits (maks +25) + lifetime value (maks +15) + recency ±12 + survey delta + penalti complaint (-18) + penalti no-show (-10) + recovery (+4) + reminder (±3).",
        icon: <BarChart3 className="h-5 w-5" />,
        color: "text-cyan-600",
        bg: "bg-cyan-50",
        border: "border-cyan-200",
      },
      {
        id: "h4",
        title: "Tentukan Band",
        desc: "EXCELLENT ≥85 | HEALTHY ≥70 | WATCH ≥55 | AT_RISK ≥35 | LOST <35. Band disimpan ke CustomerHealthScore.",
        icon: <CheckCircle2 className="h-5 w-5" />,
        color: "text-blue-600",
        bg: "bg-blue-50",
        border: "border-blue-200",
      },
      {
        id: "h5",
        title: "Next Best Action",
        desc: "EXCELLENT/HEALTHY: maintain cadence. WATCH: kirim reminder & confirm booking. AT_RISK/LOST: schedule callback & recovery plan. Open complaint: resolve complaint first.",
        icon: <ArrowRight className="h-5 w-5" />,
        color: "text-purple-600",
        bg: "bg-purple-50",
        border: "border-purple-200",
      },
    ],
  },
];

// ----------------------------------------------------------------
// Role matrix data
// ----------------------------------------------------------------
const roleMatrix = [
  {
    role: "Admin",
    color: "bg-slate-700 text-white",
    access: [
      "Dashboard",
      "Pelanggan",
      "Kendaraan",
      "Transaksi",
      "Komplain",
      "Follow-Up",
      "Reminder",
      "Bookings",
      "Laporan",
      "Pengaturan",
      "Monitoring",
    ],
  },
  {
    role: "Owner",
    color: "bg-amber-600 text-white",
    access: ["Dashboard", "Laporan", "Pelanggan", "Kendaraan", "Transaksi"],
  },
  {
    role: "Manager",
    color: "bg-blue-700 text-white",
    access: [
      "Dashboard",
      "Pelanggan",
      "Kendaraan",
      "Transaksi",
      "Komplain",
      "Reminder",
      "Bookings",
      "Laporan",
    ],
  },
  {
    role: "Service Advisor",
    color: "bg-violet-700 text-white",
    access: [
      "Dashboard",
      "Pelanggan",
      "Kendaraan",
      "Transaksi",
      "Komplain",
      "Integrasi",
    ],
  },
  {
    role: "Customer Service",
    color: "bg-teal-600 text-white",
    access: ["Dashboard", "Follow-Up", "Reminder", "Bookings", "Integrasi"],
  },
  {
    role: "Technician",
    color: "bg-zinc-600 text-white",
    access: ["Dashboard", "Transaksi"],
  },
  {
    role: "Marketing CRM",
    color: "bg-pink-700 text-white",
    access: ["Dashboard", "Pelanggan", "Laporan"],
  },
];

// ----------------------------------------------------------------
// Reminder Cadence Data
// ----------------------------------------------------------------
const cadence = [
  { label: "H-30", desc: "Persiapan servis 1 bulan lagi", color: "bg-blue-500" },
  { label: "H-14", desc: "Pengingat 2 minggu sebelumnya", color: "bg-indigo-500" },
  { label: "H-7", desc: "Pengingat 1 minggu sebelumnya", color: "bg-violet-500" },
  { label: "H-1", desc: "Pengingat besok jadwal servis", color: "bg-orange-500" },
  { label: "H-0", desc: "Hari jadwal servis tiba", color: "bg-red-500" },
  { label: "H+7", desc: "Overdue — belum ada booking baru", color: "bg-rose-700" },
];

// ----------------------------------------------------------------
// Component
// ----------------------------------------------------------------
export default function WorkflowPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-10 pb-16">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-800 px-8 py-10 text-white shadow-xl">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10">
            <RefreshCw className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Workflow Mobeng CRM</h1>
            <p className="mt-0.5 text-sm text-zinc-400">
              Peta lengkap alur kerja retention, survey, complaint recovery, dan health scoring.
            </p>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Retention Flow", value: "7 tahap" },
            { label: "Cadence Reminder", value: "H-30 → H+7" },
            { label: "Complaint SLA", value: "4–48 jam" },
            { label: "Health Score Band", value: "5 level" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl bg-white/5 px-4 py-3">
              <p className="text-lg font-bold text-white">{stat.value}</p>
              <p className="text-xs text-zinc-400">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Workflow Sections */}
      {workflows.map((section) => (
        <section key={section.id} className="space-y-4">
          <div
            className={`rounded-xl bg-gradient-to-r ${section.headerColor} px-6 py-4 text-white shadow`}
          >
            <h2 className="text-lg font-semibold">{section.title}</h2>
            <p className="text-sm text-white/70">{section.subtitle}</p>
          </div>

          <div className="relative">
            {/* Connector line */}
            <div className="absolute left-6 top-6 bottom-6 hidden w-px bg-zinc-200 sm:block" />

            <div className="space-y-3">
              {section.steps.map((step, idx) => (
                <div key={step.id} className="relative flex gap-4">
                  {/* Step number bubble */}
                  <div
                    className={`relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 ${step.border} ${step.bg} ${step.color} shadow-sm`}
                  >
                    {step.icon}
                    <span
                      className={`absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-zinc-800 text-[10px] font-bold text-white`}
                    >
                      {idx + 1}
                    </span>
                  </div>

                  {/* Content */}
                  <div
                    className={`flex-1 rounded-xl border ${step.border} ${step.bg} px-5 py-4 shadow-sm`}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className={`font-semibold ${step.color}`}>{step.title}</h3>
                      {step.badge && (
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${step.badgeColor}`}
                        >
                          {step.badge}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-zinc-600">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      ))}

      {/* Reminder Cadence Timeline */}
      <section className="space-y-4">
        <div className="rounded-xl bg-gradient-to-r from-orange-600 to-red-700 px-6 py-4 text-white shadow">
          <h2 className="text-lg font-semibold">Cadence Reminder Service</h2>
          <p className="text-sm text-white/70">
            Urutan pengiriman reminder berdasarkan estimasi nextServiceDueDate kendaraan.
          </p>
        </div>
        <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
          <div className="flex min-w-[600px] items-stretch divide-x divide-zinc-200">
            {cadence.map((c) => (
              <div key={c.label} className="flex flex-1 flex-col items-center gap-2 px-4 py-5">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-full ${c.color} text-sm font-bold text-white shadow`}
                >
                  {c.label}
                </div>
                <p className="text-center text-xs text-zinc-500">{c.desc}</p>
              </div>
            ))}
          </div>
          <div className="flex min-w-[600px] items-center px-8 pb-4">
            <div className="h-1 flex-1 rounded-full bg-gradient-to-r from-blue-400 via-violet-400 via-orange-400 to-rose-700" />
          </div>
          <p className="px-6 pb-4 text-center text-xs text-zinc-400">
            Setiap AutomationJob dibuat saat createPostTransactionRetentionFlow() dipanggil.
          </p>
        </div>
      </section>

      {/* Role Access Matrix */}
      <section className="space-y-4">
        <div className="rounded-xl bg-gradient-to-r from-zinc-700 to-zinc-900 px-6 py-4 text-white shadow">
          <h2 className="text-lg font-semibold">Akses Modul per Peran</h2>
          <p className="text-sm text-white/70">
            Ringkasan modul yang dapat diakses tiap role berdasarkan RBAC yang diterapkan.
          </p>
        </div>
        <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50">
                <th className="px-4 py-3 text-left font-semibold text-zinc-700">Peran</th>
                <th className="px-4 py-3 text-left font-semibold text-zinc-700">Modul yang Dapat Diakses</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {roleMatrix.map((row) => (
                <tr key={row.role} className="hover:bg-zinc-50">
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${row.color}`}>
                      {row.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      {row.access.map((mod) => (
                        <span
                          key={mod}
                          className="rounded-md border border-zinc-200 bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600"
                        >
                          {mod}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Domain Model Summary */}
      <section className="space-y-4">
        <div className="rounded-xl bg-gradient-to-r from-cyan-600 to-blue-700 px-6 py-4 text-white shadow">
          <h2 className="text-lg font-semibold">Model Domain Utama</h2>
          <p className="text-sm text-white/70">
            Entity inti yang menggerakkan seluruh workflow CRM Mobeng.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: <Users className="h-5 w-5" />,
              name: "Customer",
              desc: "Pusat CRM. Status: ACTIVE, INACTIVE, AT_RISK, LOST.",
              color: "text-blue-600 bg-blue-50 border-blue-200",
            },
            {
              icon: <Car className="h-5 w-5" />,
              name: "Vehicle",
              desc: "Kendaraan customer. Menyimpan odometer, lastServiceDate, nextServiceDueDate.",
              color: "text-sky-600 bg-sky-50 border-sky-200",
            },
            {
              icon: <Wrench className="h-5 w-5" />,
              name: "ServiceTransaction",
              desc: "Repair order bengkel. Status COMPLETED memicu retention flow.",
              color: "text-violet-600 bg-violet-50 border-violet-200",
            },
            {
              icon: <ClipboardList className="h-5 w-5" />,
              name: "FollowUpSurvey",
              desc: "Survey kepuasan H+3. Skor rendah memicu ComplaintTicket.",
              color: "text-indigo-600 bg-indigo-50 border-indigo-200",
            },
            {
              icon: <ShieldAlert className="h-5 w-5" />,
              name: "ComplaintTicket",
              desc: "Kasus recovery. Punya SLA, RecoveryAction, dan Task tindak lanjut.",
              color: "text-rose-600 bg-rose-50 border-rose-200",
            },
            {
              icon: <Bell className="h-5 w-5" />,
              name: "Reminder",
              desc: "Tugas retention advisor. Tipe: SERVICE_DUE, FOLLOW_UP, CALLBACK, dll.",
              color: "text-orange-600 bg-orange-50 border-orange-200",
            },
            {
              icon: <CalendarClock className="h-5 w-5" />,
              name: "Booking",
              desc: "Booking servis customer. Status: REQUESTED → CONFIRMED → IN_SERVICE → COMPLETED.",
              color: "text-teal-600 bg-teal-50 border-teal-200",
            },
            {
              icon: <Heart className="h-5 w-5" />,
              name: "CustomerHealthScore",
              desc: "Skor 0–100. Band: EXCELLENT, HEALTHY, WATCH, AT_RISK, LOST.",
              color: "text-pink-600 bg-pink-50 border-pink-200",
            },
            {
              icon: <BarChart3 className="h-5 w-5" />,
              name: "AutomationJob",
              desc: "Job terjadwal untuk reminder, follow-up, dan health score recalculation.",
              color: "text-amber-600 bg-amber-50 border-amber-200",
            },
          ].map((model) => (
            <div
              key={model.name}
              className={`rounded-xl border px-4 py-4 shadow-sm ${model.color}`}
            >
              <div className="flex items-center gap-2">
                {model.icon}
                <span className="font-semibold text-sm">{model.name}</span>
              </div>
              <p className="mt-1.5 text-xs text-zinc-600">{model.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* KPI */}
      <section className="space-y-4">
        <div className="rounded-xl bg-gradient-to-r from-pink-600 to-rose-700 px-6 py-4 text-white shadow">
          <h2 className="text-lg font-semibold">KPI Retention</h2>
          <p className="text-sm text-white/70">
            Indikator kinerja utama yang diukur sistem CRM Mobeng.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { kpi: "Repeat Customer Rate", desc: "Persentase pelanggan yang kembali servis dalam periode tertentu." },
            { kpi: "Complaint Rate", desc: "Rasio transaksi yang menghasilkan komplain terhadap total transaksi." },
            { kpi: "Reminder Conversion Rate", desc: "Reminder yang menghasilkan booking atau transaksi baru." },
            { kpi: "Customer Satisfaction Score", desc: "Rata-rata skor survey seluruh pelanggan aktif." },
            { kpi: "Churn Risk Percentage", desc: "Persentase pelanggan dengan health band AT_RISK atau LOST." },
            { kpi: "Revenue Retention", desc: "Revenue dari repeat customer dibanding total revenue periode." },
          ].map((item) => (
            <div
              key={item.kpi}
              className="rounded-xl border border-zinc-200 bg-white px-5 py-4 shadow-sm"
            >
              <p className="font-semibold text-sm text-zinc-800">{item.kpi}</p>
              <p className="mt-1 text-xs text-zinc-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
