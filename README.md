# Mobeng CRM

Mobeng CRM adalah CRM bengkel mobil full-stack untuk `Ganti Oli & Servis Mobil`, dibangun dengan Next.js, TypeScript, Tailwind CSS, Prisma, PostgreSQL, dan Docker.

Brand:

- App name: `Mobeng CRM`
- Subtitle: `Ganti Oli & Servis Mobil`
- Positioning: `Satu Tempat untuk Kebutuhan Mobil Anda`
- Tagline: `Rasa Mesin Baru`
- Company: `PT. Surga Mobil Indonesia`
- Support: `halo@mobeng.co.id`
- WhatsApp CS: `0812-9069-9681`

Core product rules and workflow detail live in [docs/PRD.md](./docs/PRD.md).
Structured presentation script for owner/management demo is available at [docs/mobeng-demo-script.md](./docs/mobeng-demo-script.md).
Go-live readiness checklist tersedia di [docs/GO_LIVE_CHECKLIST.md](./docs/GO_LIVE_CHECKLIST.md).

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS v4
- Prisma
- PostgreSQL
- Docker Compose

## Prerequisites

- Node.js 22 or newer
- npm
- Docker Desktop

## Run Locally

1. Install dependencies.

   ```bash
   npm install
   ```

2. Create the local environment file.

   ```bash
   cp .env.example .env
   ```

   PowerShell:

   ```powershell
   Copy-Item .env.example .env
   ```

3. Start PostgreSQL.

   ```bash
   docker compose up -d postgres
   ```

4. Generate the Prisma client.

   ```bash
   npm run prisma:generate
   ```

5. Run migrations.

   ```bash
   npm run prisma:migrate -- --name mobeng_crm_setup
   ```

6. Load the demo dataset.

   ```bash
   npm run db:seed
   ```

7. Start the app.

   ```bash
   npm run dev
   ```

8. Open the CRM.

   ```text
   http://localhost:3000
   ```

## Reset Demo Data

To rebuild the full demo dataset from scratch:

```bash
npm run db:seed
```

The seed resets the database and recreates:

- 25 customers
- 35 vehicles
- 40 service transactions
- 10 follow-up surveys
- 8 complaint tickets
- 20 reminders
- 12 bookings
- customer journey events for each customer
- service blueprint stages

## Useful Commands

```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:studio
npm run db:seed
npm run lint
npm run build
npx prisma validate
```

Production migration command:

```bash
npx prisma migrate deploy
```

## Demo User Roles

The demo uses seeded users to represent the operating team:

- `Admin`: Nadia Putri
- `Branch Manager`: Rafi Pratama
- `Service Advisor`: Ayu Lestari
- `Service Advisor`: Bima Santoso
- `Service Advisor`: Citra Permata
- `Technician`: Dimas Wijaya
- `Technician`: Fajar Hidayat
- `Owner`: Surya Mahendra
- `Customer Service`: Intan Rahma
- `Marketing CRM`: Salsa Nirmala

Demo login credentials:

- Password semua akun demo: `Mobeng123!`

Seluruh data demo tersebar ke 26 outlet Mobeng, termasuk:

- Mobeng A.Yani Malang
- Mobeng BSD
- Mobeng Cilengsi
- Mobeng Cinere
- Mobeng Cipondoh
- Mobeng Citraland
- Mobeng Duren Sawit
- Mobeng Gading Serpong
- Mobeng Galuh Mas
- Mobeng Hankam
- Mobeng Harapan Indah
- Mobeng Jababeka
- Mobeng Jati Asih
- Mobeng Jatibening
- Mobeng Jemursari
- Mobeng Karawaci
- Mobeng Katamso
- Mobeng Kopo Bandung
- Mobeng Kupang
- Mobeng Lenteng Agung
- Mobeng Merr
- Mobeng Mulyosari
- Mobeng Mustika Jaya
- Mobeng Pondok Betung
- Mobeng Sunter
- Mobeng Tole Iskandar

Middleware sudah menegakkan proteksi route privat, autentikasi session, RBAC berbasis role, dan guard API (`401/403/429`) untuk akses tidak sah.

## Mobeng CRM Demo Flow

Gunakan urutan ini saat demo ke owner bengkel:

1. Open `/dashboard`.
   Tunjukkan pelanggan aktif, funnel retention, alert servis overdue, alert SLA komplain, dan pelanggan churn-risk tertinggi.

2. Open `/customers`.
   Buka salah satu profil pelanggan untuk melihat kendaraan, riwayat servis, reminder, komplain, booking, health score, dan journey timeline dalam satu layar.

3. Open `/follow-ups`.
   Jelaskan bagaimana survey pasca servis menggerakkan retention dan bagaimana skor kualitas rendah otomatis memicu recovery.

4. Open `/reminders`.
   Tunjukkan action center reminder dan ubah reminder menjadi booking.

5. Open `/complaints`.
   Tunjukkan owner recovery, SLA, dan eskalasi kasus yang belum selesai.

6. Open `/bookings`.
   Tunjukkan board booking dari requested sampai no-show.

7. Open `/settings`.
   Jelaskan service blueprint Mobeng, brand settings, dan bagaimana proses outlet dipetakan ke trigger CRM.

## Docker

Start PostgreSQL only:

```bash
docker compose up -d postgres
```

Stop the local stack:

```bash
docker compose down
```

Run the app container profile:

```bash
docker compose --profile app up --build
```

## Production Integration Architecture

Fondasi integrasi production yang sudah disiapkan:

1. `src/lib/env.ts` + `.env.example` untuk validasi env wajib dan mode `dev/demo/production`.
2. `src/services/notifications` berisi abstraction provider WhatsApp/Email/SMS dengan mock provider:
   - `sendMessage()`
   - `sendTemplate()`
   - delivery status logging ke `NotificationLog`
   - error handling + structured logging
3. `src/services/jobs` berisi fondasi background jobs untuk:
   - scheduled follow-up
   - service reminder
   - overdue reminder
   - complaint SLA check
   Mendukung mode `memory` atau `database` via `JOB_RUNNER_MODE`.
4. `FileUpload` table + `src/services/uploads` untuk metadata upload komplain dan storage provider interface (mock-local).
5. `src/lib/logger.ts`, `src/lib/api-error.ts`, dan `src/lib/rate-limit.ts` untuk baseline readiness (structured logs, API error handler, rate-limit placeholder).

## Daily Transaction Import (POS Integration)

Mobeng CRM menerima data transaksi harian dari sistem operasional/POS eksternal melalui dua jalur:

1. UI upload: `/integrations/transactions` (CSV/XLSX, preview, validasi, confirm import)
2. API batch: `POST /api/integrations/transactions/import`

Header API wajib:

- `x-api-key: <INTEGRATION_API_KEY>`

Endpoint log:

- `/integrations/imports` untuk melihat riwayat import, statistik sukses/gagal, dan detail error row.

Duplicate handling:

- `SKIP`: invoice lama dilewati
- `UPDATE`: invoice lama diperbarui

Retention trigger setelah import transaksi sukses (status completed):

- create journey event
- create thank-you notification log
- schedule H+3 follow-up flow
- calculate next-service reminder flow (via retention service)
- update customer health score

## Production Deployment (Vercel)

Konfigurasi deployment production sudah disiapkan:

- `vercel.json` untuk Next.js runtime dan API function duration
- `postinstall` script (`prisma generate`) agar client Prisma selalu tersedia di build environment
- `/api/health` untuk health check app + database

Langkah deploy ringkas:

1. Push repo ke Git provider yang terhubung ke Vercel.
2. Set environment variables production di Vercel Project Settings.
3. Jalankan migration ke production DB:
   ```bash
   npx prisma migrate deploy
   ```
4. Deploy.
5. Verifikasi endpoint:
   - `/api/health`
   - `/login`

Catatan cloud PostgreSQL:

- `DATABASE_URL` gunakan connection string pooler (recommended untuk serverless/runtime).
- `DIRECT_URL` gunakan direct connection (recommended untuk migration/admin tasks).

## Required Environment Variables

Variabel minimum production:

- `NODE_ENV` (`production`)
- `APP_ENV` (`production`)
- `APP_NAME`
- `APP_VERSION`
- `AUTH_SECRET`
- `INTEGRATION_API_KEY`
- `DATABASE_URL`
- `DIRECT_URL`
- `NOTIFICATION_PROVIDER_WHATSAPP`
- `NOTIFICATION_PROVIDER_EMAIL`
- `NOTIFICATION_PROVIDER_SMS`
- `DEFAULT_NOTIFICATION_FROM_EMAIL`
- `DEFAULT_NOTIFICATION_FROM_NAME`
- `JOB_RUNNER_MODE`
- `JOB_RUNNER_POLL_INTERVAL_MS`
- `FILE_STORAGE_PROVIDER`
- `UPLOAD_MAX_MB`
- `RATE_LIMIT_MAX_REQUESTS`
- `RATE_LIMIT_WINDOW_MS`
- `ALLOW_DEMO_SEED` (`false` in production)

## Migration & Seed Notes

- Development:
  - `npm run prisma:migrate -- --name <migration_name>`
- Production:
  - `npx prisma migrate deploy`
- Demo seed/reset:
  - `npm run db:seed`
  - Seed otomatis diblokir saat `APP_ENV=production` atau `NODE_ENV=production` kecuali `ALLOW_DEMO_SEED=true`.
  - Jangan aktifkan `ALLOW_DEMO_SEED` pada deployment production normal.

## Production Security Checklist

Sebelum deploy production, pastikan:

1. `AUTH_SECRET` kuat (panjang, acak, rotasi berkala).
2. Cookie session `httpOnly`, `sameSite=lax`, `secure` aktif di production HTTPS.
3. Semua route privat dan API sensitif berada di belakang middleware auth + RBAC.
4. Rate limiting aktif untuk login dan API publik.
5. Validasi input API/server action menggunakan Zod.
6. Audit log aktif untuk login/logout dan aksi create/update/delete penting.
7. Cross-branch data guard aktif (non Admin/Owner terbatas sesuai branch).
8. Masking data kontak pelanggan untuk role yang tidak berhak.
9. Error response tidak membocorkan stack trace/internal detail di production.
10. Backup database, monitoring, dan alerting sudah aktif.

## Deployment Security Notes

- Gunakan HTTPS di reverse proxy/load balancer.
- Simpan secret di secret manager (bukan commit ke repo).
- Batasi akses network database hanya dari service app/worker.
- Jalankan migrasi dengan akun DB terbatas.
- Aktifkan observability untuk auth failure, burst API, dan error rate.

## Backup & Maintenance Notes

Rekomendasi backup database:

1. Aktifkan automated daily backup di provider PostgreSQL.
2. Simpan minimal 7-30 hari retention backup.
3. Lakukan backup tambahan sebelum migration production besar.

Restore notes:

1. Restore ke environment staging terlebih dahulu.
2. Validasi data kritikal (customer, transaction, reminder, complaint).
3. Setelah valid, restore ke production sesuai prosedur change window.

Migration notes:

1. Selalu review SQL migration sebelum `migrate deploy`.
2. Jalankan migration saat traffic rendah.
3. Pantau error app + DB metrics segera setelah migration.

Rollback notes:

1. Prisma tidak menyediakan "down migration" otomatis by default.
2. Strategi rollback utama:
   - restore dari backup terakhir
   - atau hotfix migration forward untuk memperbaiki state.
3. Siapkan runbook internal untuk incident DB rollback.

## Production Integrations Needed

Integrasi berikut masih diperlukan sebelum go-live produksi:

1. WhatsApp Business API provider untuk pengiriman dan status delivery real-time.
2. Email provider (contoh: SendGrid / SES) untuk notifikasi non-WhatsApp.
3. SMS provider fallback untuk pelanggan tanpa WhatsApp aktif.
4. Authentication provider (OIDC / NextAuth) dengan session management produksi.
5. RBAC policy engine berbasis role + permission matrix lintas modul.
6. Audit log sink ke centralized logging/SIEM.
7. Monitoring dan alerting (APM + error tracking) untuk API, job, dan frontend runtime.
8. Queue/worker runtime (Redis/BullMQ atau setara) untuk automation job yang reliabel.
9. File/object storage untuk attachment bukti servis, komplain, dan dokumen pelanggan.
10. Backup + restore terjadwal PostgreSQL dengan uji disaster recovery.
11. BI/export integration untuk laporan manajemen lintas cabang.
