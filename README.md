# ⚡ Universal AI Job Form Filler (Chrome Extension)

AI Agent otomatis untuk mengisi formulir lamaran kerja di berbagai situs loker (*Jobstreet, Glints, LinkedIn, Kalibrr, Greenhouse, Lever, Workday, Google Forms, hingga website karir perusahaan*) secara instan **hanya dengan meng-upload file CV (PDF / TXT)** Anda.

Ditenagai oleh **Google Gemini 2.0 / 1.5 Flash Multimodal (Free Tier)** dengan teknik **DOM Pruning** super hemat token.

---

## 🌟 Fitur Unggulan

1. **📄 1-Click Upload & Parse CV (PDF / TXT)**:
   - Cukup upload file CV PDF Anda langsung ke ekstensi. AI Multimodal akan mengekstrak seluruh nama, kontak, ringkasan profesional, keahlian, pengalaman, pendidikan, preferensi gaji, dan jawaban screening otomatis!
2. **🌐 Universal Semantic Form Matching**:
   - Tidak memerlukan selector statis per website. AI Agent membaca label form, konteks lowongan, dan mencocokkannya langsung dengan data CV Anda.
3. **💰 Hemat Biaya & Token (Rp 0 Free Tier)**:
   - Menggunakan kuota gratis Google Gemini AI Studio (hingga 15 RPM / 1 Juta Token gratis per hari) atau Ollama offline.
   - Hanya mengirim ringkasan field form (< 350 token per halaman), bukan seluruh kode HTML.
4. **⚙️ Simulasi Input Alami & Kompatibilitas Framework**:
   - Mendukung form berbasis React, Next.js, Vue, Angular, dan formulir HTML standar dengan trigger event JavaScript lengkap (`input`, `change`, `blur`).
5. **✍️ Auto-Essay Screening Answer Generator**:
   - Otomatis menyusun jawaban profesional untuk pertanyaan esai (misal: *"Why do you want to join?"*, *"Tell us about your experience"*, notice period, ekspektasi gaji) yang disesuaikan dengan posisi loker.
6. **🔒 Aman & Terkendali (Human-in-the-Loop)**:
   - Data CV dan API Key tersimpan aman di browser lokal Anda (`chrome.storage.local`).
   - Ekstensi hanya mengisi form, Anda tetap yang menekan tombol *Submit* setelah memeriksa.

---

## 🚀 Panduan Instalasi di Perangkat Baru (Chrome / Brave / Edge)

### 1. Clone atau Download Repository Ini
```bash
git clone https://github.com/rfahur11/job-filler-extension.git
```
*(Atau download file ZIP dari GitHub dan ekstrak ke folder pilihan Anda)*

### 2. Pasang ke Browser Chrome / Brave / Edge
1. Buka browser dan ketik `chrome://extensions` di address bar (atau `edge://extensions` / `brave://extensions`).
2. Aktifkan switch toggle **"Developer mode"** di pojok kanan atas.
3. Klik tombol **"Load unpacked"** di pojok kiri atas.
4. Pilih folder hasil clone/ekstrak: **`job-filler-extension`**.
5. Selesai! Ikon **Universal AI Job Form Filler** ⚡ akan muncul di toolbar browser Anda.

---

## ⚙️ Cara Menggunakan (Hanya 2 Langkah Cepat!)

### Langkah 1: Masukkan API Key Gemini (Gratis)
1. Dapatkan API Key gratis di [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Klik ikon ekstensi di toolbar browser -> Buka tab **🤖 Setting AI**.
3. Masukkan API Key Anda, lalu klik **🧪 Test Koneksi AI** -> Klik **Simpan Perubahan**.

### Langkah 2: Upload File CV Anda (PDF)
1. Buka tab **👤 Profil CV** pada popup ekstensi.
2. Tarik & letakkan file **CV PDF** Anda ke kotak upload (*dropzone*), atau klik tombol **"Pilih File CV (PDF)"**.
3. Dalam 2–3 detik, AI akan membaca dokumen CV Anda dan otomatis mengisi seluruh kolom profil, pengalaman kerja, keahlian, dan jawaban screening!
4. Selesai! Data Anda tersimpan dan siap digunakan untuk melamar kerja di website manapun.

---

## 🧪 Cara Menguji Coba Form

1. Buka popup ekstensi -> tab **🛠️ Tools & Demo**.
2. Klik tombol **🚀 Buka Test Form Demo Page** (atau buka file `demo/test-form.html` di browser).
3. Di pojok kanan bawah halaman formulir, Anda akan melihat tombol melayang **`[⚡ Auto-Fill AI]`**.
4. Klik tombol tersebut:
   - AI akan memindai seluruh kolom form.
   - Kolom yang berhasil diisi akan menyala hijau (*green glow effect*).
   - Seluruh data diri hingga pertanyaan esai terisi secara instan!

---

## 📋 Struktur File Ekstensi

```
job-filler-extension/
├── manifest.json              # Konfigurasi Manifest V3
├── icons/                     # Ikon ekstensi (16x16, 48x48, 128x128)
├── popup/
│   ├── popup.html             # Interface profil CV & dropzone upload PDF
│   ├── popup.css              # Dark-mode glassmorphic styling
│   └── popup.js               # Logic upload file, AI parsing, persistent storage
├── content/
│   ├── content.js             # Floating action button & value injector
│   ├── content.css            # Styling widget & animasi highlight form
│   └── form-extractor.js      # DOM pruning & smart label extractor
├── background/
│   └── service-worker.js      # Background gateway untuk API Gemini / Ollama
├── lib/
│   ├── ai-engine.js           # Engine prompt matching & Multimodal PDF CV Parser
│   └── default-cv.json        # Template struktur data CV default
├── demo/
│   └── test-form.html         # Halaman demo form loker lengkap
└── README.md                  # Dokumentasi & panduan pemakaian
```
