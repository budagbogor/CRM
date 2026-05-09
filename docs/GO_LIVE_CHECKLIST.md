# Mobeng CRM Go-Live Checklist

Tanggal dokumen: 2026-05-10  
Owner dokumen: Project Lead Mobeng CRM

## 1) Pre-launch Checklist

### A. Production Environment & Security

- [ ] Semua environment variable production sudah diisi di platform deploy.
- [ ] `NODE_ENV=production` dan `APP_ENV=production`.
- [ ] `AUTH_SECRET` kuat dan disimpan di secret manager.
- [ ] `INTEGRATION_API_KEY` sudah dibuat, disimpan aman, dan dibagikan ke tim integrasi POS secara terbatas.
- [ ] `ALLOW_DEMO_SEED=false`.

### B. Production Database Readiness

- [ ] Database PostgreSQL production aktif dan akses network dibatasi.
- [ ] Migration production sudah dijalankan (`npx prisma migrate deploy`).
- [ ] Koneksi aplikasi ke database production tervalidasi.
- [ ] Backup otomatis harian aktif.

### C. Master Data & User Setup

- [ ] Admin users production sudah dibuat.
- [ ] Branch users sudah dibuat (Owner/Manager/SA/CS/Marketing CRM sesuai kebutuhan outlet).
- [ ] Mapping user-role-branch sudah diverifikasi.
- [ ] Data outlet/cabang Mobeng sudah diverifikasi (nama, area, alamat, status aktif).

### D. Import & Integration

- [ ] Template import CSV/XLSX sudah diuji dengan sample data valid.
- [ ] Endpoint API import diuji dengan API key yang benar.
- [ ] Duplicate mode (`SKIP`/`UPDATE`) sudah dipahami user operasional.
- [ ] Halaman import logs (`/integrations/imports`) terbukti menampilkan error details.

### E. Operational Readiness

- [ ] Health check `/api/health` return status `ok`.
- [ ] SOP penanganan error import disetujui.
- [ ] SOP reminder failure disetujui.
- [ ] SOP complaint escalation disetujui.
- [ ] Data correction owner ditetapkan.

---

## 2) Pilot Outlet Plan (1-2 outlet dulu)

### Rekomendasi Pilot

- Outlet pilot: `Mobeng BSD` + `Mobeng Gading Serpong` (contoh, bisa disesuaikan manajemen).
- Durasi pilot: **14 hari kalender**.

### Tim Terlibat

- 1 Admin pusat
- 1 Owner/Manager area
- 2 Service Advisor per outlet
- 1 Customer Service per outlet
- 1 PIC Marketing CRM

### Proses Harian Pilot

1. **Daily transaction import (pagi dan sore):**
   - Upload CSV/XLSX dari sistem operasional/POS.
   - Verifikasi import log (success/failed/skipped).
2. **Follow-up process:**
   - Monitor transaksi completed yang memicu H+3 flow.
   - Cek survey response masuk.
3. **Complaint recovery process:**
   - Review complaint baru (termasuk hasil survey buruk).
   - Pastikan owner + SLA + task recovery aktif.
4. **Reminder process:**
   - Jalankan reminder harian.
   - Konversi reminder qualified ke booking.

### Success Metrics Pilot

- Import success rate >= 98%
- Follow-up completion rate >= 70%
- Complaint SLA on-time >= 90%
- Reminder to booking conversion >= 15%

---

## 3) Role-based Training Plan

### Admin (2-3 jam)

- User & role setup
- Branch mapping
- Import monitoring & troubleshooting
- Audit log dan security baseline

### Owner/Manager (1.5-2 jam)

- Dashboard KPI dan branch comparison
- Complaint SLA review
- Decision cadence harian/mingguan

### Customer Service (2 jam)

- Follow-up survey workflow
- Reminder action center
- Konversi reminder ke booking

### Service Advisor (2 jam)

- Verifikasi data customer/vehicle hasil import
- Retention flow awareness
- Complaint handoff ke recovery flow

### Marketing CRM (1.5 jam)

- Segmentasi dasar dari data CRM
- Monitoring repeat service dan churn risk
- Campaign recommendation review

---

## 4) Success Metrics Definition

1. **Daily Import Success Rate**
   - Rumus: `success_rows / total_rows * 100%`
   - Target awal: >= 98%

2. **Follow-up Completion Rate**
   - Rumus: `follow-up completed / follow-up created * 100%`
   - Target awal: >= 70%

3. **Complaint Recovery SLA**
   - Rumus: `complaint resolved within SLA / total complaint * 100%`
   - Target awal: >= 90%

4. **Reminder Conversion to Booking**
   - Rumus: `booking from reminder / reminder sent * 100%`
   - Target awal: >= 15%

5. **Repeat Service Rate**
   - Rumus: `customer dengan >=2 transaksi / total customer aktif * 100%`
   - Target awal: naik bertahap per bulan.

6. **Churn Risk Reduction**
   - Rumus: penurunan jumlah customer band `AT_RISK`/`LOST` vs baseline bulan awal.
   - Target awal: penurunan >= 10% dalam 1-2 kuartal.

---

## 5) Rollout Plan

### Week 1: Pilot Outlet

- Jalankan pilot di 1-2 outlet.
- Daily check-in operasional + issue log.

### Week 2: Stabilization & Fix

- Perbaiki isu data/proses dari pilot.
- Finalisasi SOP dan materi training revisi.

### Week 3: Rollout Jabodetabek Outlets

- Onboarding bertahap outlet Jabodetabek.
- Monitor KPI harian dengan review central.

### Week 4: Full Mobeng Rollout

- Aktivasi semua outlet Mobeng.
- Masuk mode operational governance rutin.

---

## 6) Production Support SOP (Ownership)

### A. Who handles import errors?

- **Primary:** Admin CRM pusat  
- **Backup:** PIC IT integrasi POS  
- SLA respon awal: <= 30 menit di jam operasional

### B. Who handles failed reminders?

- **Primary:** Customer Service outlet  
- **Escalation:** Manager outlet (jika backlog > 1 hari)

### C. Who handles complaint escalation?

- **Primary:** Service Advisor + Customer Service  
- **Escalation owner:** Manager outlet  
- **Critical case:** Owner regional/central

### D. Who reviews dashboard daily?

- **Primary daily:** Manager outlet  
- **Weekly review:** Owner/management regional

### E. Who owns data correction?

- **Operational correction:** Admin CRM pusat  
- **Source-of-truth confirmation:** Tim operasional/POS outlet

---

## Sign-off

- Project Lead: __________________
- Operations Lead: __________________
- IT Integration Lead: __________________
- Management Sponsor: __________________

