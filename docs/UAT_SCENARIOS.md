# Mobeng CRM UAT Scenarios

Tanggal UAT: 2026-05-10  
Environment: __________________

## Scenario 1: Import Daily Transaction File

1. Login sebagai Admin/Manager.
2. Buka `/integrations/transactions`.
3. Upload file `mobeng-transaction-import-template.csv` atau `.xlsx`.
4. Pastikan preview row muncul.
5. Pilih duplicate mode (`SKIP` atau `UPDATE`).
6. Klik `Confirm Import`.
7. Verifikasi hasil menampilkan jumlah sukses/gagal/skip.
8. Buka `/integrations/imports` dan verifikasi log baru tercatat.

Expected:
- Import log tercatat.
- Tidak ada crash UI.

## Scenario 2: Auto-create Customer and Vehicle

1. Gunakan file import dengan customer/plate baru.
2. Jalankan import.
3. Buka `/customers`, cari customer by phone/nama.
4. Buka `/vehicles`, cari plate kendaraan.

Expected:
- Customer baru dibuat otomatis.
- Vehicle baru dibuat otomatis dan terhubung ke customer + branch.

## Scenario 3: Trigger Thank You Notification

1. Pastikan row import memiliki `payment_status` yang dianggap completed/paid.
2. Jalankan import.
3. Cek data di dashboard/journey customer terkait.

Expected:
- Notification log thank-you dibuat.
- Event journey `SERVICE_COMPLETED`/retention muncul.

## Scenario 4: Create Follow-up Survey

1. Setelah transaksi completed, buka `/follow-ups`.
2. Temukan survey terkait customer import.
3. Buka detail survey.

Expected:
- Survey follow-up tersedia sesuai flow H+3.

## Scenario 5: Create Complaint from Bad Quality Rating

1. Di survey detail, isi response kualitas buruk (<=2).
2. Submit survey.
3. Buka `/complaints`.

Expected:
- Complaint ticket otomatis dibuat.
- Task recovery otomatis dibuat.

## Scenario 6: Recover Complaint

1. Buka complaint yang baru terbentuk.
2. Jalankan aksi recovery sesuai flow.
3. Update status complaint sampai resolved.

Expected:
- Recovery action tercatat.
- SLA/task terlihat.
- Journey event recovery terupdate.

## Scenario 7: Send Reminder

1. Buka `/reminders`.
2. Pilih reminder pending.
3. Jalankan aksi `mark sent`.

Expected:
- Status reminder berubah.
- Audit/log terkait reminder tercatat.

## Scenario 8: Convert Reminder to Booking

1. Dari reminder action center, pilih reminder eligible.
2. Jalankan `convert to booking`.
3. Buka `/bookings`.

Expected:
- Booking baru terbentuk dari reminder.
- Status booking sesuai default workflow.

## UAT Result Matrix

- Scenario 1: Pass / Fail
- Scenario 2: Pass / Fail
- Scenario 3: Pass / Fail
- Scenario 4: Pass / Fail
- Scenario 5: Pass / Fail
- Scenario 6: Pass / Fail
- Scenario 7: Pass / Fail
- Scenario 8: Pass / Fail

