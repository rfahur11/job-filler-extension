# 🧭 System State & Living Context: Universal AI Job Form Filler Extension

> **Terakhir Diperbarui**: 2026-09-13 08:35 WIB  
> **Status Build**: ✅ Production Ready (Manifest V3 Verified)  
> **Repository**: [rfahur11/job-filler-extension](https://github.com/rfahur11/job-filler-extension) (Branch `main`)  
> **Target Platform**: Google Chrome, Microsoft Edge, Brave Browser  

---

## 1. 🏗️ Ringkasan Arsitektur & Tech Stack

- **Platform**: Chrome Extension **Manifest V3** (Kompatibel dengan semua Chromium-based browser)
- **AI Core & Vision**:
  - **Google Gemini 2.0 / 1.5 Flash Multimodal** (Free Tier via Google AI Studio)
  - Fallback: Local LLM via **Ollama** (`http://localhost:11434`)
- **DOM Extraction & Optimization**:
  - **Lightweight DOM Pruning**: Mengekstrak semantic context dari form input (< 350 token per halaman form), menghemat kuota dan mempercepat respon AI.
  - **Natural Event Dispatcher**: Memicu event JavaScript lengkap (`input`, `change`, `blur`) untuk kompatibilitas form modern berbasis React, Next.js, Vue, dan Angular.
- **Storage & Security**:
  - `chrome.storage.local` untuk menyimpan data profil CV dan API Key secara lokal di browser (tanpa server perantara).
  - *Human-in-the-Loop*: Ekstensi hanya mengisi form; tombol submit selalu ditekan manual oleh pengguna.

---

## 2. 📂 Struktur Komponen & File Ekstensi

```
job-filler-extension/
├── manifest.json              # Konfigurasi izin Manifest V3 (storage, activeTab, scripting)
├── icons/                     # Asset icon ukuran 16, 48, 128 px
├── popup/
│   ├── popup.html             # UI antarmuka utama (Profile, Upload PDF, AI Settings)
│   ├── popup.css              # Dark-mode glassmorphism styling
│   └── popup.js               # Handler upload file, parsing CV, dan penyimpanan
├── content/
│   ├── content.js             # Floating action button [⚡ Auto-Fill AI] & DOM injector
│   ├── content.css            # Styling widget melayang & animasi green glow effect
│   └── form-extractor.js      # Parser form cerdas & label semantic extractor
├── background/
│   └── service-worker.js      # Background worker gateway komunikasi ke Google Gemini API
├── lib/
│   ├── ai-engine.js           # Multimodal PDF Parser & Prompt Matching Engine
│   └── default-cv.json        # Template fallback skema profil CV
├── demo/
│   └── test-form.html         # Test sandbox pengujian beragam input form lowongan kerja
├── fahrur-rozi-cv-database.json # Database profil karir offline
└── SYSTEM_STATE.md            # Living technical context dokumen ini
```

---

## 3. 🌟 Fitur Utama yang Selesai (Completed)

1. **📄 1-Click Upload & Parse CV (PDF / TXT)**:
   - Pengguna cukup drag & drop berkas CV PDF ke popup. Gemini Multimodal mengekstrak nama, kontak, ringkasan, keahlian, pengalaman, pendidikan, dan ekspektasi gaji dalam 2–3 detik.
2. **🌐 Universal Semantic Matching**:
   - Mampu mengenali kolom input di berbagai situs lowongan kerja (*Jobstreet, Glints, LinkedIn, Kalibrr, Greenhouse, Lever, Google Forms*) tanpa memerlukan CSS selector khusus per situs.
3. **✍️ Auto-Essay Screening Answer Generator**:
   - Menghasilkan draf jawaban esai profesional secara otomatis (alasan melamar, pengalaman relevan, notice period) yang disesuaikan dengan posisi lowongan kerja yang sedang dibuka.
4. **🧪 Sandbox Test Bench (`demo/test-form.html`)**:
   - Halaman demo lokal siap pakai untuk menguji autofill pada berbagai variasi input (teks, dropdown, radio, textarea, checkbox).

---

## 4. ⚙️ Konfigurasi & Secret Management

- **API Key**: Disimpan aman di `chrome.storage.local` melalui tab **🤖 Setting AI** pada popup ekstensi.
- **Gratis**: Memanfaatkan free tier Google Gemini API (hingga 15 RPM / 1 juta token gratis harian).
- Tidak memerlukan file `.env` karena berjalan 100% *client-side* di peramban pengguna.

---

## 5. 🚀 Panduan Memasang di Device Baru

1. Clone repository:
   ```bash
   git clone https://github.com/rfahur11/job-filler-extension.git
   ```
2. Buka browser dan buka alamat `chrome://extensions`.
3. Aktifkan **Developer mode** di pojok kanan atas.
4. Klik tombol **Load unpacked** dan pilih folder `job-filler-extension`.
5. Buka popup ekstensi ➔ Tab **Setting AI** ➔ Masukkan Gemini API Key. Ekstensi langsung aktif!
