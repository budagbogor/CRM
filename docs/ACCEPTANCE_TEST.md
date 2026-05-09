# Mobeng CRM Acceptance Test Checklist

Tanggal: 2026-05-10  
Environment: Staging / Pre-Production  
Tester: __________________

## A. Login and RBAC

- [ ] Login berhasil untuk role Admin.
- [ ] Login berhasil untuk role Owner.
- [ ] Login berhasil untuk role Manager.
- [ ] Login berhasil untuk role Service Advisor.
- [ ] Login berhasil untuk role Customer Service.
- [ ] Login berhasil untuk role Technician.
- [ ] Login berhasil untuk role Marketing CRM.
- [ ] Role badge tampil benar di top bar.
- [ ] Menu sidebar tersembunyi sesuai role.
- [ ] Route tanpa akses me-redirect ke `/unauthorized`.
- [ ] Logout membersihkan session dan route private tidak bisa diakses lagi.

## B. Dashboard

- [ ] KPI utama tampil tanpa error.
- [ ] Data dashboard sesuai branch scope user.
- [ ] Panel AI insight tampil tanpa crash.
- [ ] Empty state/loading state tampil benar saat data kosong/lambat.

## C. Customers

- [ ] List pelanggan tampil.
- [ ] Create customer berhasil.
- [ ] Edit customer berhasil.
- [ ] Delete customer berhasil (untuk data tanpa constraint).
- [ ] Detail customer menampilkan profil, kendaraan, riwayat, reminder, complaint, booking, health score, journey.

## D. Vehicles

- [ ] List kendaraan tampil.
- [ ] Create vehicle berhasil.
- [ ] Edit vehicle berhasil.
- [ ] Delete vehicle berhasil (jika tidak terikat data lain).

## E. Transaction Import Upload (CSV/XLSX)

- [ ] Halaman `/integrations/transactions` terbuka.
- [ ] Upload CSV berhasil dipreview.
- [ ] Upload XLSX berhasil dipreview.
- [ ] Validasi row invalid menampilkan error jelas.
- [ ] Duplicate mode `SKIP` berfungsi.
- [ ] Duplicate mode `UPDATE` berfungsi.
- [ ] Confirm import menghasilkan ringkasan sukses/gagal/skip.

## F. Transaction Import API

- [ ] `POST /api/integrations/transactions/import` reject tanpa API key.
- [ ] Endpoint menerima payload valid dengan API key benar.
- [ ] Response berisi `logId`, total/success/failed/skipped.
- [ ] Payload invalid mengembalikan format error standar.

## G. Retention Flow

- [ ] Transaksi completed memicu retention flow.
- [ ] Journey event dibuat.
- [ ] Thank-you notification log dibuat.
- [ ] Reminder follow-up dibuat.
- [ ] Automation job H+3 terjadwal.
- [ ] Health score customer terupdate.

## H. H+3 Follow-up

- [ ] Survey follow-up bisa dikirim/dibuka.
- [ ] Response survey tersimpan.
- [ ] Survey status berubah sesuai hasil.

## I. Complaint Recovery

- [ ] Survey rating buruk memicu complaint ticket otomatis.
- [ ] Recovery action dibuat.
- [ ] Recovery task dibuat.
- [ ] SLA recovery terhitung dan tampil.

## J. Reminders

- [ ] List reminder tampil sesuai scope.
- [ ] Mark sent berhasil.
- [ ] Mark responded/completed berhasil.
- [ ] Reschedule/snooze berjalan.

## K. Booking Conversion

- [ ] Reminder bisa dikonversi jadi booking.
- [ ] Status booking berubah sesuai aksi.
- [ ] Booking tampil di board/list booking.

## L. Customer Journey

- [ ] Timeline tampil kronologis.
- [ ] Event retention/import/complaint muncul di timeline.
- [ ] Filter event berjalan.

## M. Reports

- [ ] Halaman report terbuka.
- [ ] Chart trend revenue/repeat/complaint/reminder/health tampil.
- [ ] Tidak ada crash di data nol.

## N. Branch Dashboard

- [ ] Owner/Admin melihat all branches.
- [ ] Manager/SA/CS hanya melihat branch sesuai aturan.
- [ ] Branch detail page `/branches/[id]` menampilkan KPI, team, transactions, bookings, complaints, reminders.

## O. Mobile Responsiveness

- [ ] Tampilan layak di 375px.
- [ ] Tampilan layak di 768px.
- [ ] Tampilan layak di 1440px.
- [ ] Drawer sidebar mobile berfungsi.
- [ ] Tabel beralih ke card view di mobile.

## Sign-off

- QA Lead: __________________  
- Product Owner: __________________  
- Engineering Lead: __________________

