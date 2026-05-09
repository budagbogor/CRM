export const blueprintPlaybook: Record<
  string,
  {
    frontstage: string;
    backstage: string;
    crmTrigger: string;
    failurePoint: string;
    recoveryAction: string;
  }
> = {
  LEAD_CAPTURE: {
    frontstage: "Advisor Mobeng menangkap kebutuhan servis, keluhan kendaraan, dan slot kunjungan yang diinginkan.",
    backstage: "CRM membuat profil pelanggan awal, sumber akuisisi, dan tugas kontak pertama.",
    crmTrigger: "Lead baru masuk dari walk-in, WhatsApp, telepon, atau website.",
    failurePoint: "Data lead tidak lengkap atau pelanggan terlambat dihubungi.",
    recoveryAction: "Lead yang melewati SLA langsung naik ke branch manager untuk callback.",
  },
  BOOKING_CONFIRMATION: {
    frontstage: "Pelanggan menerima konfirmasi booking dengan kebutuhan servis dan estimasi kedatangan.",
    backstage: "CRM menahan kapasitas stall, advisor, dan jenis layanan yang diminta.",
    crmTrigger: "Status booking berubah menjadi requested atau confirmed.",
    failurePoint: "Slot tidak cocok, layanan belum jelas, atau reminder pra-kedatangan tidak terkirim.",
    recoveryAction: "Advisor menghubungi ulang pelanggan dan menata ulang rencana kedatangan.",
  },
  CHECK_IN: {
    frontstage: "Advisor mengonfirmasi keluhan, odometer, estimasi biaya, dan approval saat kendaraan datang.",
    backstage: "CRM membuka transaksi servis, job card, dan timer workflow retention.",
    crmTrigger: "Booking tiba atau transaksi servis dibuat manual di outlet Mobeng.",
    failurePoint: "Catatan keluhan kurang lengkap atau approval tidak sinkron.",
    recoveryAction: "Branch manager review cepat sebelum kendaraan masuk stall.",
  },
  SERVICE_EXECUTION: {
    frontstage: "Teknisi menyelesaikan inspeksi, pengerjaan, dan update progres ke advisor.",
    backstage: "CRM mencatat parts, labor, temuan teknis, dan nilai invoice dalam Rupiah.",
    crmTrigger: "Transaksi masuk ke status in-service atau completed.",
    failurePoint: "Pengerjaan molor, defect berulang, atau update progres tidak jelas.",
    recoveryAction: "Buat task keterlambatan dan kirim notifikasi proaktif ke pelanggan.",
  },
  POST_SERVICE_SURVEY: {
    frontstage: "Pelanggan menerima ucapan terima kasih dan survey kepuasan setelah servis.",
    backstage: "CRM menjadwalkan follow-up H+3, menangkap skor survey, dan membuka recovery bila perlu.",
    crmTrigger: "Transaksi servis berubah menjadi completed.",
    failurePoint: "Survey tidak terkirim tepat waktu atau skor rendah tidak ditindaklanjuti.",
    recoveryAction: "Buka komplain dan task recovery otomatis untuk skor kualitas 1-2.",
  },
  RETENTION_REMINDER: {
    frontstage: "Pelanggan menerima reminder servis, callback, atau pengingat dokumen kendaraan.",
    backstage: "CRM menghitung next service dan menyiapkan antrian reminder untuk advisor.",
    crmTrigger: "Jatuh tempo servis mendekat atau rule follow-up terpenuhi.",
    failurePoint: "Reminder terlambat dikirim atau tidak disertai ajakan booking.",
    recoveryAction: "Jadwalkan ulang reminder dan arahkan pelanggan bernilai tinggi ke panggilan advisor.",
  },
  COMPLAINT_RECOVERY: {
    frontstage: "Owner recovery menghubungi pelanggan, menyepakati solusi, lalu mengonfirmasi penutupan kasus.",
    backstage: "CRM membuat SLA, owner, task recovery, dan audit trail penanganan komplain.",
    crmTrigger: "Tiket komplain dibuat dari survey buruk atau eskalasi manual outlet.",
    failurePoint: "Owner belum ditugaskan cepat atau janji tindak lanjut terlewat.",
    recoveryAction: "Naikkan ke branch manager dan munculkan alert SLA komplain di dashboard.",
  },
};
