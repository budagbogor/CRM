# Mobeng CRM PRD

Last updated: 2026-05-08

Source alignment:
- Synced with source PRD document and Mobeng rebrand requirements on 2026-05-08.

## 1. Product Summary

Mobeng CRM adalah aplikasi CRM untuk bengkel otomotif yang fokus pada customer retention setelah transaksi servis. Core aplikasi bukan hanya mencatat customer, kendaraan, dan transaksi, tetapi memastikan setiap transaksi servis menghasilkan follow-up, reminder, survey, complaint recovery, dan customer health score yang bisa ditindaklanjuti oleh service advisor dan branch manager.

Produk ini harus terasa seperti SaaS operasional profesional, terinspirasi dari Bitrix24 dan HubSpot: navigasi jelas, data padat, workflow mudah dipantau, dan action penting dapat dilakukan langsung dari halaman modul.

Visi produk:
Mobeng CRM adalah web aplikasi CRM khusus bengkel mobil modern dengan identitas "Ganti Oli & Servis Mobil", positioning "Satu Tempat untuk Kebutuhan Mobil Anda", dan campaign tagline "Rasa Mesin Baru".

## 2. Product Goals

- Meningkatkan repeat service melalui reminder dan follow-up yang konsisten.
- Mengurangi churn customer dengan health score dan early warning.
- Menutup loop kualitas layanan dari survey ke complaint recovery.
- Memberikan dashboard operasional untuk branch manager.
- Menjadi foundation full-stack yang siap dikembangkan menjadi CRM bengkel produksi.
- Mengotomasi reminder servis.
- Meningkatkan customer satisfaction.

## 3. Non-Goals Saat Ini

- Tidak membangun accounting, inventory, POS, atau payment reconciliation penuh.
- Tidak membangun real WhatsApp/SMS/email provider integration dulu.
- Tidak membangun role-based access control penuh dulu.
- Tidak membangun AI automation dulu.
- Tidak membangun multi-tenant billing SaaS dulu.

## 4. Primary Users

### Service Advisor

Tanggung jawab:
- Mengelola customer dan kendaraan.
- Menjalankan follow-up H+3 setelah transaksi.
- Menangani reminder servis.
- Menghubungi customer yang punya health score rendah.

Kebutuhan utama:
- Melihat transaksi selesai yang perlu retention flow.
- Melihat follow-up survey pending.
- Melihat reminder yang jatuh tempo.
- Melihat customer context sebelum menghubungi customer.

### Branch Manager

Tanggung jawab:
- Memantau dashboard cabang.
- Menangani complaint escalation dan recovery SLA.
- Menilai kepuasan customer dan churn risk.

Kebutuhan utama:
- Open complaints.
- Today bookings.
- Upcoming reminders.
- Customer satisfaction.
- Churn risk count.
- Revenue/service volume overview.

### Owner Bengkel

Tanggung jawab:
- Melihat dashboard performa cabang.
- Memantau repeat order, revenue retention, dan complaint rate.
- Mengevaluasi performa service advisor, CS, dan marketing retention.

Kebutuhan utama:
- Dashboard dan reports yang ringkas.
- KPI retention yang mudah dibaca.
- Data complaint dan follow-up yang bisa diaudit.

### Customer Service

Tanggung jawab:
- Menjalankan follow-up customer.
- Mengelola reminders dan callback.
- Membantu eskalasi survey buruk ke complaint flow.

Kebutuhan utama:
- Daftar follow-up pending.
- Reminder jatuh tempo dan overdue.
- Status survey dan complaint recovery.

### Teknisi

Tanggung jawab:
- Memberikan update pekerjaan servis.
- Menyediakan konteks teknis untuk complaint atau recovery.

Kebutuhan utama:
- Akses informasi service transaction dan vehicle context.
- Status pekerjaan servis yang relevan dengan customer follow-up.

### Marketing/CRM Officer

Tanggung jawab:
- Mengelola campaign dan retention program.
- Menganalisis reminder conversion dan churn risk.
- Menyiapkan loyalty atau membership program di fase berikutnya.

Kebutuhan utama:
- Segmentasi customer berbasis health score.
- KPI repeat customer dan revenue retention.
- Customer journey events untuk campaign targeting.

### Admin

Tanggung jawab:
- Mengatur branch, user, role, service blueprint stage, dan automation jobs.
- Melihat laporan performa retention.

Kebutuhan utama:
- Modul settings yang jelas.
- Data model yang konsisten.
- Workflow yang dapat diaudit lewat journey events dan notification logs.

## 4.1 Roles & Permissions

Baseline role permission:

- Admin: full access.
- Owner: dashboard dan reports.
- Service Advisor: transactions, complaints, customer follow-up, reminders.
- Customer Service: reminders dan follow-ups.
- Technician: service updates dan vehicle/service context.
- Marketing/CRM Officer: campaigns, retention segments, dan analytics.

Catatan implementasi:
- Role-based access control penuh belum menjadi scope saat ini, tetapi data model `Role` dan `User` harus tetap mendukung permission expansion.

## 5. Core Domain Concepts

### Customer

Customer adalah pusat CRM. Customer bisa punya beberapa vehicle, service transactions, bookings, reminders, surveys, complaints, tasks, journey events, notification logs, dan satu customer health score.

Status utama:
- ACTIVE
- INACTIVE
- AT_RISK
- LOST

AT_RISK digunakan ketika customer punya complaint aktif, survey buruk, atau health score rendah.

### Vehicle

Vehicle dimiliki customer dan dipakai untuk menghitung next service date.

Data penting:
- odometer
- lastServiceDate
- nextServiceDueDate
- nextServiceOdometer
- serviceTransactions

### ServiceTransaction

ServiceTransaction adalah repair order/transaksi bengkel. Setelah status COMPLETED, sistem harus bisa menjalankan post-transaction retention flow.

Data penting:
- customerId
- vehicleId
- branchId
- advisorId
- openedAt
- closedAt
- odometerIn
- status
- totalAmount

### FollowUpSurvey

Survey dipakai untuk menangkap kepuasan customer setelah servis. Survey response buruk harus otomatis membuka complaint ticket dan recovery task.

### ComplaintTicket

Complaint ticket adalah kasus recovery. Ticket punya priority, status, assignee, recovery actions, tasks, dan journey event.

### Reminder

Reminder adalah pekerjaan retention yang harus dikerjakan advisor.

Contoh:
- SERVICE_DUE
- FOLLOW_UP
- PAYMENT
- DOCUMENT_RENEWAL
- CALLBACK

### CustomerHealthScore

Customer health score adalah skor retention 0 sampai 100. Skor disimpan di database agar dashboard dan customer list bisa membaca status terkini.

Band:
- EXCELLENT: 85-100
- HEALTHY: 70-84
- WATCH: 55-69
- AT_RISK: 35-54
- LOST: 0-34

## 5.1 Core Features

Fitur inti Mobeng CRM:

- Customer & Vehicle Management.
- Service Transactions.
- Retention Automation.
- Complaint Recovery.
- Next Service Reminder.
- Booking Service.
- Customer Journey.
- Service Blueprint.
- Reporting & Analytics.

## 6. Required Application Pages

### /dashboard

Dashboard harus menggunakan live Prisma queries, bukan dummy data.

Metrics wajib:
- total customers
- repeat customers
- open complaints
- today bookings
- upcoming reminders
- customer satisfaction
- churn risk count
- service revenue
- repeat customer rate
- complaint rate
- reminder conversion rate
- churn risk percentage
- revenue retention

Dashboard juga menampilkan:
- recent service transactions
- priority work dari complaints dan reminders

### /customers

Menampilkan customer live dari Prisma.

Kolom penting:
- customer identity
- phone/email
- type
- assigned advisor
- vehicle count
- health band
- lifetime value

Action:
- recalculate health score

### /vehicles

Menampilkan kendaraan live dari Prisma.

Kolom penting:
- vehicle identity
- customer
- odometer
- next service date
- status

### /transactions

Menampilkan service transactions live dari Prisma.

Action:
- Start flow untuk transaksi COMPLETED, memanggil `createPostTransactionRetentionFlow(transactionId)`.

### /follow-ups

Menampilkan FollowUpSurvey live dari Prisma.

Action:
- Good survey: simpan response baik dan complete follow-up.
- Bad survey: simpan response buruk, buat complaint, buat recovery task, update customer status.

### /complaints

Menampilkan complaint tickets live dari Prisma.

Action:
- Create SLA, memanggil `createComplaintRecoveryFlow(ticketId)`.

### /reminders

Menampilkan reminders live dari Prisma.

Action:
- Recalculate next service untuk reminder yang terkait vehicle.

### /bookings

Menampilkan bookings live dari Prisma.

### /reports

Menampilkan report ringkas retention dan revenue. Saat ini boleh read-only, tetapi harus memakai data yang konsisten dengan domain.

### /settings

Menampilkan branch profile dan service blueprint stages.

## 7. Core Business Logic

### 7.0 Retention Workflow

Workflow retention utama:

1. Service completed.
2. Thank you message sent.
3. H+3 follow-up survey.
4. Complaint recovery jika ada quality issue.
5. Calculate next service.
6. Send reminders.
7. Create booking.
8. Repeat service cycle.

Core implementation harus menjaga workflow ini sebagai alur utama aplikasi.

### 7.1 calculateNextService(vehicleId)

Tujuan:
Menghitung estimasi tanggal servis berikutnya untuk kendaraan.

Rules:
- Ambil vehicle dan service transaction history.
- Hitung km per day dari riwayat odometer antar transaksi.
- Jika history kurang, coba estimasi dari lastServiceDate.
- Jika data tidak cukup atau km per day tidak valid, fallback ke maksimal 6 bulan.
- Target odometer:
  - pakai `nextServiceOdometer` jika lebih besar dari current odometer
  - jika tidak ada, gunakan current odometer + 5000
- Estimasi date tidak boleh melewati fallback max 6 bulan.
- Update `vehicle.nextServiceDueDate` dan `vehicle.nextServiceOdometer`.

Edge cases:
- vehicle tidak ditemukan: throw RetentionError NOT_FOUND.
- vehicleId kosong: throw RetentionError VALIDATION_ERROR.
- odometer negatif harus disanitasi ke 0 dalam pure rule.
- km per day 0, NaN, atau Infinity harus fallback.

### 7.2 createPostTransactionRetentionFlow(transactionId)

Trigger:
Dipanggil setelah service transaction COMPLETED.

Rules:
- Validasi transactionId.
- Transaction harus ada.
- Transaction status harus COMPLETED.
- Buat CustomerJourneyEvent dengan eventType SERVICE_COMPLETED.
- Buat thank you NotificationLog.
- Buat AutomationJob untuk H+3 follow-up.
- Buat Reminder FOLLOW_UP dengan dueAt H+3.
- Buat CustomerJourneyEvent REMINDER_CREATED untuk audit trail.

Catatan:
- Semua write harus transactional.
- Jangan kirim WhatsApp/email asli dulu. Simpan ke NotificationLog sebagai QUEUED.

### 7.3 handleSurveyResponse(surveyId, responseData)

Input:
- surveyId
- responses
- comments optional
- npsScore optional

Validation:
- surveyId wajib.
- minimal 1 response.
- questionKey dan questionText wajib.
- ratingValue harus 0 sampai 10.

Bad survey rule:
- quality rating buruk jika `overall_satisfaction`, `quality`, atau `service_quality` <= 2.

Jika bad survey:
- Simpan SurveyResponse.
- Mark FollowUpSurvey COMPLETED.
- Buat ComplaintTicket priority HIGH.
- Update Customer status AT_RISK.
- Buat Task recovery.
- Buat CustomerJourneyEvent COMPLAINT_OPENED.
- Stop survey flow. Tidak perlu menandai reminder sebagai completed.

Jika good survey:
- Simpan SurveyResponse.
- Mark FollowUpSurvey COMPLETED.
- Update pending FOLLOW_UP reminders customer menjadi COMPLETED.
- Buat CustomerJourneyEvent SURVEY_COMPLETED.

### 7.4 createComplaintRecoveryFlow(ticketId)

Tujuan:
Membuat SLA dan task recovery untuk complaint ticket.

Rules:
- Assign recovery owner:
  1. existing assignedToId
  2. branch manager
  3. customer assignedAdvisorId
  4. null jika tidak ada
- SLA hours:
  - CRITICAL: 4 jam
  - HIGH: 8 jam
  - MEDIUM: 24 jam
  - LOW: 48 jam
- Update ticket status OPEN menjadi INVESTIGATING.
- Buat RecoveryAction dengan promisedAt = now + SLA.
- Buat Task follow-up.
- Update customer status AT_RISK.
- Buat CustomerJourneyEvent untuk audit.

### 7.5 calculateCustomerHealthScore(customerId)

Tujuan:
Menghasilkan customer health score 0 sampai 100 dan menyimpan ke CustomerHealthScore.

Current scoring rules:
- Base score: 50.
- Tambah sampai 25 poin dari total completed visits.
- Tambah sampai 15 poin dari lifetime value.
- Recency:
  - last service <= 90 hari: +12
  - <= 180 hari: +4
  - > 180 hari: -12
  - tidak ada service: -8
- Survey:
  - `(averageSurveyScore - 3) * 6`
- Penalti:
  - open complaint: -18 per complaint
  - missed booking/no show: -10 per booking
- Recovery:
  - completed recovery action: +4 per action
- Upcoming reminder:
  - ada reminder pending future: +3
  - tidak ada: -3
- Final score clamp 0..100.

Band:
- >= 85: EXCELLENT
- >= 70: HEALTHY
- >= 55: WATCH
- >= 35: AT_RISK
- else: LOST

Next best action:
- Jika ada open complaint: resolve complaint.
- Jika AT_RISK/LOST: schedule callback dan recovery plan.
- Jika WATCH: send service reminder dan confirm booking.
- Jika HEALTHY/EXCELLENT: maintain cadence dan loyalty communication.

### 7.6 Reminder Cadence

Reminder servis harus mengikuti cadence berikut:

- H-30 sebelum estimasi next service.
- H-14 sebelum estimasi next service.
- H-7 sebelum estimasi next service.
- H-1 sebelum estimasi next service.
- Overdue H+7 setelah estimasi next service jika belum ada booking atau transaksi baru.

Catatan implementasi:
- Saat ini UI baru menyediakan reminder list dan recalculation action.
- Automation untuk membuat seluruh cadence di atas harus memakai `AutomationJob`, `Reminder`, dan `CustomerJourneyEvent`.
- Reminder conversion rate dihitung dari reminder yang menghasilkan booking atau repeat service transaction.

### 7.7 Acceptance Criteria Product

Kriteria penerimaan produk dari PRD:

- Customer dan kendaraan dapat dibuat.
- Transaksi servis tersimpan.
- Follow-up otomatis berjalan setelah transaksi completed.
- Complaint recovery berjalan saat survey buruk atau complaint dibuat.
- Reminder otomatis muncul berdasarkan next service cadence.
- Booking service berhasil dibuat.
- Dashboard realtime menggunakan Prisma.
- Reports berjalan dengan baik.

## 8. Data Model Source of Truth

Prisma schema adalah source of truth teknis:

`prisma/schema.prisma`

Core models:
- User
- Role
- Branch
- Customer
- Vehicle
- ServiceTransaction
- ServiceItem
- FollowUpSurvey
- SurveyResponse
- ComplaintTicket
- RecoveryAction
- Reminder
- Booking
- CustomerJourneyEvent
- ServiceBlueprintStage
- AutomationJob
- NotificationLog
- Task
- CustomerHealthScore

Seed data:

`prisma/seed.ts`

Seed harus tetap berisi minimal:
- 5 customers
- 7 vehicles
- 8 service transactions
- 2 complaints
- 5 reminders
- 3 bookings
- default service blueprint stages

## 9. Technical Architecture Rules

### Framework

- Next.js App Router
- TypeScript strict mode
- Tailwind CSS v4
- Prisma 7 generated client in `src/generated/prisma`
- PostgreSQL via Docker Compose

### Layering

Business logic tidak boleh ditulis langsung di page component.

Gunakan struktur:
- `src/services/retention/rules.ts` untuk pure business rules.
- `src/services/retention/service.ts` untuk Prisma-integrated workflows.
- `src/services/crm-queries.ts` untuk read queries page/dashboard.
- `src/app/actions/retention.ts` untuk server actions dari UI.
- `src/components/*` untuk UI reusable.

### Error Handling

Gunakan `RetentionError` untuk error domain:
- NOT_FOUND
- VALIDATION_ERROR

Jangan silent fail untuk workflow penting.

### Transactions

Workflow yang membuat lebih dari satu record harus memakai Prisma transaction:
- post transaction retention flow
- survey handling
- complaint recovery flow

### UI Rules

- Layout harus profesional, padat, dan cocok untuk operasional bengkel.
- Hindari landing-page marketing UI.
- Gunakan table untuk list operasional.
- Gunakan status badge untuk status/priority/band.
- Sidebar dan topbar harus tetap konsisten di semua halaman CRM.

## 10. Testing Requirements

Minimal unit tests wajib untuk:
- next service calculation
- fallback edge cases
- bad/good survey classification
- health score band calculation

Current test command:

```bash
npm run test
```

Validation sebelum menyelesaikan perubahan:

```bash
npm run lint
npx tsc --noEmit
npm run test
npm run build
```

Di Windows sandbox, `npm run test` dan `npm run build` mungkin perlu permission untuk spawn worker process.

## 10.1 KPI Metrics

KPI utama yang harus dipertahankan dalam product direction:

- Repeat customer rate.
- Complaint rate.
- Reminder conversion rate.
- Customer satisfaction score.
- Churn risk percentage.
- Revenue retention.

Dashboard/reports harus mengarah ke KPI ini walaupun sebagian metrik masih bertahap implementasinya.

## 10.2 Future Roadmap

Roadmap setelah core CRM stabil:

- WhatsApp API integration.
- AI service recommendations.
- Predictive churn engine.
- Loyalty & membership program.
- Mobile app.

## 11. Local Development Commands

Start database:

```bash
docker compose up -d postgres
```

Run migration:

```bash
npm run prisma:migrate -- --name mobeng_crm_setup
```

Seed:

```bash
npm run db:seed
```

Dev server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000/dashboard
```

## 12. Definition of Done

Untuk perubahan core aplikasi, pekerjaan dianggap selesai jika:
- TypeScript pass.
- ESLint pass.
- Unit tests relevant pass.
- Next build pass, kecuali ada blocker environment yang dijelaskan.
- Business logic berada di service layer, bukan di page component.
- Live data page memakai Prisma query layer, bukan dummy data baru.
- PRD ini tetap konsisten dengan perubahan schema dan service.

## 13. Important Guidance for Future Codex Agents

Sebelum mengubah core aplikasi:

1. Baca file ini.
2. Baca `prisma/schema.prisma`.
3. Baca service terkait di `src/services/retention`.
4. Jangan membuat duplicate business rule di page component.
5. Jika mengubah scoring, workflow, atau model, update PRD ini di perubahan yang sama.
