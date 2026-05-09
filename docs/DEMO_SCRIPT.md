# Mobeng CRM Demo Script (Management)

## 1) Opening Story (2-3 menit)

Mobeng hari ini sudah kuat di operasional bengkel, tetapi tantangan utamanya ada di retensi pelanggan setelah servis selesai. Banyak pelanggan selesai transaksi lalu hilang dari radar, reminder tidak konsisten, komplain lambat pulih, dan owner sulit melihat sinyal churn lebih awal.

## 2) Main Problem

- Data transaksi harian datang dari sistem operasional/POS, tapi tidak otomatis berubah jadi aksi retensi.
- Follow-up pasca servis tidak terstandar antar cabang.
- Komplain tidak selalu cepat terdeteksi dari survey.
- Sulit ukur cabang mana yang paling sehat dari sisi retensi.

## 3) How Mobeng CRM Solves Retention

- Import transaksi harian dari semua cabang (CSV/XLSX/API).
- Otomatis buat/update customer dan vehicle dari data transaksi.
- Trigger retention flow setelah transaksi sukses:
  - thank-you message log
  - H+3 follow-up
  - reminder servis berikutnya
  - update customer health score
- Recovery flow komplain berbasis SLA.
- Dashboard lintas cabang dengan KPI retensi.

## 4) Live Demo Flow

1. Login sebagai `Admin` atau `Owner`.
2. Buka `/dashboard`:
   - jelaskan KPI retensi, complaint alert, churn risk.
3. Buka `/integrations/transactions`:
   - upload template transaksi harian.
   - tampilkan preview + validasi.
   - jalankan confirm import.
4. Buka `/integrations/imports`:
   - tunjukkan log import (success/failed/skipped).
5. Buka `/customers` lalu buka 1 customer:
   - tunjukkan customer profile + journey timeline.
6. Buka `/follow-ups`:
   - tunjukkan survey status.
7. Simulasikan survey buruk:
   - jelaskan complaint otomatis terbentuk.
8. Buka `/complaints`:
   - tunjukkan recovery flow dan task.
9. Buka `/reminders`:
   - tunjukkan reminder action center.
10. Konversi reminder jadi booking, lalu buka `/bookings`.
11. Buka `/branches` dan `/branches/[id]`:
    - bandingkan performa antar outlet.
12. Buka `/reports`:
    - trend revenue, repeat rate, complaint trend, reminder conversion.

## 5) Key Metrics to Show

- Total pelanggan aktif.
- Repeat customer rate.
- Open complaints + SLA risk.
- Reminder conversion rate.
- Churn risk customer count.
- Booking today.
- Branch ranking/comparison.

## 6) Closing Value Proposition

Mobeng CRM tidak mengganti sistem operasional bengkel, tetapi melengkapi dengan mesin retensi yang konsisten di semua outlet. Hasil yang ditargetkan: pelanggan lebih sering kembali, komplain lebih cepat pulih, dan owner punya visibilitas lintas cabang untuk keputusan berbasis data.

