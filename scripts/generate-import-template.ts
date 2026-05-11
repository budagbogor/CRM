/**
 * Script: generate-import-template.ts
 * Membuat file template Excel (.xlsx) yang rapi untuk import transaksi Mobeng CRM.
 * Jalankan: npx tsx scripts/generate-import-template.ts
 */

import * as XLSX from "xlsx";
import path from "path";
import fs from "fs";

// ─── Definisi kolom ────────────────────────────────────────────────────────
const columns: Array<{
  key: string;
  label: string;
  width: number;
  required: boolean;
  example: string;
  notes: string;
}> = [
  { key: "invoice_number",      label: "No. Invoice",         width: 22, required: true,  example: "INV-2026-001",          notes: "Nomor invoice unik dari sistem bengkel" },
  { key: "transaction_date",    label: "Tgl. Transaksi",      width: 20, required: true,  example: "2026-05-10",            notes: "Format: YYYY-MM-DD" },
  { key: "branch_name",         label: "Nama Cabang",         width: 24, required: true,  example: "Mobeng Ciledug",        notes: "Harus sama persis dengan nama cabang di CRM" },
  { key: "customer_name",       label: "Nama Pelanggan",      width: 26, required: true,  example: "Budi Santoso",          notes: "Nama lengkap pelanggan" },
  { key: "customer_phone",      label: "No. HP Pelanggan",    width: 22, required: true,  example: "08121234567",           notes: "Format tanpa tanda hubung atau spasi" },
  { key: "customer_email",      label: "Email Pelanggan",     width: 28, required: false, example: "budi@email.com",        notes: "Opsional" },
  { key: "vehicle_plate",       label: "Plat Nomor",          width: 18, required: true,  example: "B 1234 XYZ",           notes: "Plat nomor kendaraan" },
  { key: "vehicle_brand",       label: "Merek Kendaraan",     width: 20, required: true,  example: "Toyota",               notes: "Merek kendaraan" },
  { key: "vehicle_model",       label: "Model Kendaraan",     width: 22, required: true,  example: "Avanza",               notes: "Model/tipe kendaraan" },
  { key: "vehicle_year",        label: "Tahun Kendaraan",     width: 18, required: true,  example: "2021",                 notes: "Tahun produksi (4 digit)" },
  { key: "mileage",             label: "Odometer (km)",       width: 18, required: true,  example: "45000",                notes: "Odometer saat masuk servis (angka)" },
  { key: "service_category",    label: "Kategori Servis",     width: 24, required: true,  example: "Servis Berkala",        notes: "Contoh: Servis Berkala, Ganti Oli, Tune Up" },
  { key: "service_description", label: "Deskripsi Servis",    width: 38, required: true,  example: "Ganti oli + filter oli", notes: "Detail pekerjaan yang dilakukan" },
  { key: "parts_replaced",      label: "Sparepart Diganti",   width: 34, required: false, example: "Oli Shell Helix 5W-30", notes: "Nama sparepart yang diganti, opsional" },
  { key: "total_amount",        label: "Total Tagihan (Rp)",  width: 22, required: true,  example: "350000",               notes: "Nominal tagihan tanpa titik/koma (angka)" },
  { key: "service_advisor",     label: "Service Advisor",     width: 24, required: true,  example: "Andi Prasetyo",         notes: "Nama service advisor yang menangani" },
  { key: "technician_name",     label: "Nama Teknisi",        width: 24, required: false, example: "Riko Wijaya",           notes: "Nama teknisi, opsional" },
  { key: "payment_status",      label: "Status Pembayaran",   width: 22, required: true,  example: "PAID",                 notes: "PAID atau UNPAID" },
];

// ─── Data contoh (3 baris) ─────────────────────────────────────────────────
const sampleRows = [
  {
    invoice_number: "INV-2026-001",
    transaction_date: "2026-05-10",
    branch_name: "Mobeng Ciledug",
    customer_name: "Budi Santoso",
    customer_phone: "08121234567",
    customer_email: "budi@email.com",
    vehicle_plate: "B 1234 XYZ",
    vehicle_brand: "Toyota",
    vehicle_model: "Avanza",
    vehicle_year: "2021",
    mileage: "45000",
    service_category: "Servis Berkala",
    service_description: "Ganti oli + filter oli",
    parts_replaced: "Oli Shell Helix 5W-30",
    total_amount: "350000",
    service_advisor: "Andi Prasetyo",
    technician_name: "Riko Wijaya",
    payment_status: "PAID",
  },
  {
    invoice_number: "INV-2026-002",
    transaction_date: "2026-05-11",
    branch_name: "Mobeng Ciledug",
    customer_name: "Siti Rahayu",
    customer_phone: "08567891234",
    customer_email: "",
    vehicle_plate: "B 9876 ABC",
    vehicle_brand: "Honda",
    vehicle_model: "Jazz",
    vehicle_year: "2019",
    mileage: "62000",
    service_category: "Tune Up",
    service_description: "Tune up + ganti busi",
    parts_replaced: "Busi NGK x4",
    total_amount: "480000",
    service_advisor: "Dewi Lestari",
    technician_name: "Agus Supriyanto",
    payment_status: "PAID",
  },
  {
    invoice_number: "INV-2026-003",
    transaction_date: "2026-05-12",
    branch_name: "Mobeng Tangerang",
    customer_name: "Hendra Gunawan",
    customer_phone: "08211112222",
    customer_email: "hendra@gmail.com",
    vehicle_plate: "B 5555 DEF",
    vehicle_brand: "Daihatsu",
    vehicle_model: "Xenia",
    vehicle_year: "2020",
    mileage: "38000",
    service_category: "Ganti Oli",
    service_description: "Ganti oli mesin saja",
    parts_replaced: "Oli Pertamina Fastron 10W-40",
    total_amount: "220000",
    service_advisor: "Budi Hartono",
    technician_name: "",
    payment_status: "UNPAID",
  },
];

// ─── Build workbook ────────────────────────────────────────────────────────
const wb = XLSX.utils.book_new();

// Sheet 1: Template Data
// Row 1 = Header (nama kolom key untuk sistem)
// Row 2 = Label Indonesia (keterangan)
// Row 3 = Keterangan / contoh
// Row 4+ = Data contoh

const headerKeys   = columns.map((c) => c.key);
const headerLabels = columns.map((c) => c.label);
const headerReq    = columns.map((c) => c.required ? "WAJIB" : "Opsional");
const headerNotes  = columns.map((c) => c.notes);
const headerEx     = columns.map((c) => c.example);

// Susun data sheet
const sheetData: unknown[][] = [
  headerLabels,    // baris 1: label Indonesia (ini yang kelihatan user)
  headerKeys,      // baris 2: key teknis (dibaca parser)
  headerReq,       // baris 3: wajib / opsional
  headerNotes,     // baris 4: keterangan
  headerEx,        // baris 5: contoh nilai
  [],              // baris 6: pemisah kosong
  ...sampleRows.map((row) => columns.map((c) => (row as Record<string, string>)[c.key] ?? "")),
];

const ws = XLSX.utils.aoa_to_sheet(sheetData);

// Set lebar kolom
ws["!cols"] = columns.map((c) => ({ wch: c.width }));

// Freeze baris 1 (header label)
ws["!freeze"] = { xSplit: 0, ySplit: 1 };

XLSX.utils.book_append_sheet(wb, ws, "Data Import");

// Sheet 2: Panduan
const guideData: unknown[][] = [
  ["PANDUAN IMPORT TRANSAKSI - MOBENG CRM"],
  [""],
  ["CARA PENGGUNAAN:"],
  ["1. Isi data pada sheet 'Data Import' mulai dari baris ke-7 (baris data contoh bisa dihapus)."],
  ["2. Baris 1 (label), baris 2 (key), baris 3 (wajib/opsional), baris 4 (keterangan), baris 5 (contoh) JANGAN dihapus."],
  ["3. Simpan file dalam format .xlsx atau .csv sebelum diupload."],
  ["4. Maksimal 1000 baris data per upload."],
  [""],
  ["KETENTUAN KOLOM WAJIB:"],
  ...columns
    .filter((c) => c.required)
    .map((c) => [`  • ${c.label} (${c.key}): ${c.notes}`]),
  [""],
  ["KETENTUAN KOLOM OPSIONAL:"],
  ...columns
    .filter((c) => !c.required)
    .map((c) => [`  • ${c.label} (${c.key}): ${c.notes}`]),
  [""],
  ["FORMAT NILAI:"],
  ["  • transaction_date: YYYY-MM-DD (contoh: 2026-05-10)"],
  ["  • total_amount: angka bulat tanpa titik/koma (contoh: 350000)"],
  ["  • mileage: angka bulat dalam km (contoh: 45000)"],
  ["  • vehicle_year: 4 digit tahun (contoh: 2021)"],
  ["  • payment_status: PAID atau UNPAID (huruf kapital)"],
  [""],
  ["CATATAN:"],
  ["  • Nama cabang (branch_name) harus sama persis dengan data cabang yang sudah terdaftar di CRM."],
  ["  • Nomor invoice harus unik. Duplikat akan di-skip atau di-update tergantung pilihan mode import."],
];

const wsGuide = XLSX.utils.aoa_to_sheet(guideData);
wsGuide["!cols"] = [{ wch: 90 }];
XLSX.utils.book_append_sheet(wb, wsGuide, "Panduan");

// ─── Tulis file ────────────────────────────────────────────────────────────
const outPath = path.resolve(
  process.cwd(),
  "public/templates/mobeng-transaction-import-template.xlsx"
);

// Pastikan folder ada
fs.mkdirSync(path.dirname(outPath), { recursive: true });

XLSX.writeFile(wb, outPath);

console.log(`✅ Template Excel berhasil dibuat: ${outPath}`);
console.log(`   Sheet: Data Import, Panduan`);
console.log(`   Kolom: ${columns.length} kolom (${columns.filter((c) => c.required).length} wajib, ${columns.filter((c) => !c.required).length} opsional)`);
console.log(`   Contoh data: ${sampleRows.length} baris`);
