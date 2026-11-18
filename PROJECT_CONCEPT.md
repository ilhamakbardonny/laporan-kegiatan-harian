# PROJECT CONCEPT — Laporan Kegiatan Harian

## 1. Tujuan
Aplikasi web sederhana untuk mencatat, mengelola, dan mencetak laporan kegiatan harian. Dapat diakses online melalui GitHub Pages, bersifat open source, dan dikembangkan dengan stack ringan (frontend-only).

## 2. Target Pengguna
Pengguna individu yang ingin mencatat kegiatan harian secara pribadi. Data disimpan di browser masing-masing (localStorage), bukan server pusat.

## 3. Stack Teknologi
| Komponen | Teknologi | Keterangan |
|----------|-----------|------------|
| HTML | HTML5 | Semantik, responsif |
| CSS | Bootstrap 5.3.3 + Custom CSS | Layout, komponen, tema gelap/terang |
| JS | Vanilla JavaScript + Alpine.js | Logika aplikasi, interaktivitas, tema |
| Animasi | Animate.css | Efek masuk, keluar, dan interaksi |
| PWA | Web App Manifest + Service Worker | Installable, offline cache |
| Hosting | GitHub Pages | Gratis, publik |
| Version Control | Git + GitHub | Repo publik |

## 4. Fitur Utama
- **Tambah laporan**: tanggal, kegiatan, deskripsi, status (Selesai/Proses/Tertunda)
- **Edit laporan**: ubah data laporan yang sudah ada
- **Hapus laporan**: hapus satu entri dengan konfirmasi
- **Daftar laporan**: ditampilkan dalam tabel, diurutkan terbaru dulu
- **Statistik ringkasan**: total, selesai, proses, tertunda
- **Pencarian**: filter berdasarkan teks kegiatan dan deskripsi
- **Filter status**: tampilkan sesuai status
- **Filter tanggal**: tampilkan sesuai tanggal tertentu
- **Export/Import**: cadangkan dan pulihkan data dalam format JSON
- **Dark mode**: toggle tema terang/gelap, disimpan preferensi
- **PWA**: bisa diinstal di layar utama, bekerja offline
- **Responsif**: nyaman diakses dari HP dan desktop

## 5. Arsitektur Data
Data disimpan sebagai array objek di `localStorage` dengan kunci `laporan_kegiatan_harian`.

Setiap laporan memiliki struktur:
```json
{
  "id": "string (UUID atau timestamp)",
  "date": "YYYY-MM-DD",
  "activity": "string",
  "description": "string",
  "status": "Selesai | Proses | Tertunda",
  "createdAt": "ISO string",
  "updatedAt": "ISO string (opsional)"
}
```

## 6. Alur Aplikasi
1. Saat dimuat: baca data dari localStorage, render tabel, hitung statistik.
2. Tambah: isi form → klik Simpan → data ditambahkan ke array → simpan ke localStorage → render ulang tabel.
3. Edit: klik tombol Edit → form terisi data lama → ubah → klik Perbarui → simpan.
4. Hapus: klik Hapus → konfirmasi → data dihapus dari array → simpan → render ulang.
5. Export: unduh file JSON berisi semua data.
6. Import: pilih file JSON → data digabungkan ke data yang sudah ada → simpan.

## 7. Desain Visual (Tahun 2026)
- **Glassmorphism**: header dengan efek kaca buram (backdrop-filter)
- **Dark mode**: tema gelap/terang yang bisa diubah pengguna
- **Typography**: font Inter, hierarki judul yang jelas
- **Warna**: indigo sebagai utama, hijau (selesai), kuning (proses), merah (tertunda)
- **Animasi**: fade-in, slide-out, pop-in, pulse (notifikasi tersimpan)
- **Responsif**: card, tabel, dan form menyesuaikan layar kecil

## 8. File dalam Repo
| File | Fungsi |
|------|--------|
| `index.html` | Halaman utama, struktur UI | ✅ Diperbaiki: field duplikat (activity/photo/photoPreview) dihapus, field Deskripsi ditambahkan, col-md disesuaikan agar total 12 |
| `style.css` | Gaya custom, overrides Bootstrap, tema gelap | — |
| `script.js` | Logika aplikasi (CRUD, filter, export/import, PWA register) | — |
| `manifest.json` | Konfigurasi PWA (nama, ikon, warna tema) | — |
| `sw.js` | Service worker untuk cache offline | — |
| `README.md` | Dokumentasi penggunaan dan deploy | — |
| `.gitignore` | File yang diabaikan Git | — |

## 9. Batasan
- Data hanya tersimpan di browser lokal (tidak ada sinkronisasi antar perangkat)
- Tidak ada autentikasi/login (frontend-only)
- Untuk data bersama atau multi-user, diperlukan backend dan database

## 10. Cara Deploy

1. Push ke repo GitHub publik
2. Aktifkan GitHub Pages di Settings > Pages (branch `main`, folder root)
3. Situs online di `https://USERNAME.github.io/repo-name/`

## 11. Catatan Perubahan

- v0.1.0 (2026-11-18): Perbaikan bug `index.html` — hapus field duplikat (activity, photo, photoPreview), tambah field Deskripsi (`textarea#description`) yang sebelumnya hilang dari form, susun ulang col-md agar total 12.
- v0.2.0 (2026-11-18): 
  - Form input: tanggal diisi otomatis hari ini (readonly), ganti field Deskripsi dengan upload Dokumentasi (foto, pratinjau gambar).
  - Statistik: tambah filter Bulan, statistik ringkasan dan chart difilter per bulan terpilih.
  - Tabel: kolom Deskripsi diganti Dokumentasi (menampilkan pratinjau foto).
- v0.3.0 (2026-11-18): Perbaikan bug & fitur:
  - Dark mode: ganti Alpine `themeCtrl` (tidak terdefinisi) dengan vanilla JS — toggle tema sekarang berfungsi.
  - Kolom Dokumentasi: perbaiki rendering thumbnail foto (sebelumnya `<img>` di-escape jadi teks).
  - Chart donut kini difilter per bulan (sama seperti statistik) dan langsung terisi saat load.
  - Filter bulan sekarang ikut memperbarui statistik & chart (sebelumnya hanya tabel).
  - Empty state tidak lagi tampil ganda.
  - Tombol Cetak di toolbar + CSS `@media print` (sembunyikan form, toolbar, footer, tombol aksi).
  - Preview foto disembunyikan saat kosong (tidak lagi broken-image).
  - Service worker v2: precache aset CDN (Bootstrap, Alpine, Chart.js, dll) agar offline benar-benar jalan; instalasi cache toleran gagal per-aset.
  - `manifest.json`: ikon lokal `icon.svg`, theme_color disamakan dengan meta (#6366f1).
  - Hapus file sampah `nul`; hapus referensi `description` yang sudah tidak dipakai.
