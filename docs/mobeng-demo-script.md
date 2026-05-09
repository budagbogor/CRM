# Mobeng CRM Demo Script

## Tujuan Demo

Menunjukkan bahwa `Mobeng CRM` siap dipakai sebagai command center operasional outlet:

- menjaga repeat service,
- mempercepat follow-up H+3,
- merespons komplain lebih cepat,
- mengonversi reminder menjadi booking.

## Agenda 20 Menit (Owner / Management)

1. Pembuka bisnis (2 menit)
2. Dashboard operasional (4 menit)
3. Customer 360 dan journey (4 menit)
4. Retention flow: transaksi selesai -> H+3 -> survey -> komplain/recovery (5 menit)
5. Reminder action center -> booking conversion (3 menit)
6. Service blueprint + governance (2 menit)

## Alur Presentasi

1. Buka `/dashboard`.
   Jelaskan KPI utama: pelanggan aktif, pelanggan repeat, komplain aktif, booking hari ini, reminder berjalan, CSAT, churn risk.
2. Tunjukkan funnel retention.
   Tekankan alur dari transaksi selesai ke survey dan recovery.
3. Buka kartu `Pelanggan churn risk tertinggi`.
   Masuk ke detail pelanggan untuk memperlihatkan profil, kendaraan, histori servis, reminder, komplain, booking, health score, timeline.
4. Buka `/transactions`.
   Pilih transaksi `COMPLETED` dan jelaskan trigger otomatis workflow retention.
5. Buka `/follow-ups`.
   Tunjukkan contoh survey yang masuk dan jelaskan rule kualitas rendah (`<= 2`) yang otomatis membuat tiket komplain.
6. Buka `/complaints`.
   Tunjukkan ownership, SLA, dan status recovery.
7. Buka `/reminders`.
   Tunjukkan aksi `Sent`, `Responded`, `Booking`, `No response`, dan `Recalc`.
8. Buka `/bookings`.
   Jelaskan board status `requested -> confirmed -> arrived -> in_service -> completed/cancelled/no_show`.
9. Buka `/settings`.
   Tunjukkan `Mobeng Brand Settings` dan `Service Blueprint` end-to-end.

## Talking Points Untuk Management

- "Satu layar untuk melihat risiko churn, workload outlet, dan kualitas layanan."
- "Workflow retention tidak bergantung ingatan manual advisor."
- "Komplain dari survey buruk otomatis tercatat dan bisa diaudit."
- "Reminder bisa langsung dikonversi jadi booking untuk dorong repeat service."
- "Blueprint operasional frontstage dan backstage sudah terdokumentasi."

## Skenario Q&A Cepat

- Jika ditanya "Apa yang terjadi setelah transaksi selesai?":
  Jawab: otomatis buat journey event, notifikasi terima kasih, schedule H+3, dan reminder follow-up.
- Jika ditanya "Bagaimana cegah komplain kelewat?":
  Jawab: SLA alert muncul di dashboard + ownership ticket + task recovery.
- Jika ditanya "Apa bukti data bisa ditindaklanjuti?":
  Jawab: buka timeline pelanggan dan tunjukkan linked entities dari transaksi -> survey -> komplain -> reminder -> booking.

## Persiapan Sebelum Demo

1. Jalankan `npm run db:seed` agar data demo konsisten.
2. Pastikan `npm run build` berhasil.
3. Buka URL:
   - `http://localhost:3000/dashboard`
   - `http://localhost:3000/settings`
