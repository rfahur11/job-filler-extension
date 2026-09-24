# 🧭 System State & Living Context: Universal AI Job Form Filler Extension

> **Terakhir Diperbarui**: 2026-09-24 15:05 WIB  
> **Status Build**: ✅ Production Ready (Manifest V3 Verified)  
> **Repository**: [rfahur11/job-filler-extension](https://github.com/rfahur11/job-filler-extension) (Branch `main`)  
> **Target Platform**: Google Chrome, Microsoft Edge, Brave Browser  

---

## 1. 🏗️ Ringkasan Arsitektur & Tech Stack

- **Platform**: Chrome Extension **Manifest V3** (Kompatibel dengan semua Chromium-based browser)
- **AI Core & Vision**:
  - **Google Gemini 3.1 Flash Lite / 3.6 Flash Multimodal** (Free Tier via Google AI Studio)
  - Auto-fallback cascade model untuk performa danlatensi ultra-cepat
  - Fallback: Local LLM via **Ollama** (`http://localhost:11434`)
- **DOM Extraction & Optimization**:
  - **Lightweight DOM Pruning & Character Limit Parser**: Mengekstrak semantic context dan batasan `maxlength` dari form input, menghemat token dan mencegah teks terpotong mid-sentence.
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
│   ├── content.js             # Floating action button [⚡ Auto-Fill AI], DOM injector & safety truncator
│   ├── content.css            # Styling widget melayang & animasi green glow effect
│   └── form-extractor.js      # Parser form cerdas, label semantic & maxlength constraint extractor
├── background/
│   └── service-worker.js      # Background worker gateway komunikasi ke Google Gemini API
├── lib/
│   ├── ai-engine.js           # Multimodal PDF Parser, MaxLength Constraint Prompt & Matching Engine
│   └── default-cv.json        # Template fallback skema profil CV (updated dengan RAG & VisionOps)
├── demo/
│   └── test-form.html         # Test sandbox pengujian beragam input form & maxlength constraints
├── fahrur-rozi-cv-database.json # Database profil karir offline (updated dengan proyek RAG & MLOps terbaru)
└── SYSTEM_STATE.md            # Living technical context dokumen ini
```

---

## 3. 🌟 Fitur Utama yang Selesai (Completed)

1. **📄 1-Click Upload & Parse CV (PDF / TXT)**:
   - Pengguna cukup drag & drop berkas CV PDF ke popup. Gemini Multimodal mengekstrak nama, kontak, ringkasan, keahlian, pengalaman, pendidikan, dan ekspektasi gaji dalam 2–3 detik.
2. **📏 Smart MaxLength Constraint & Sentence Safety Truncation**:
   - Mengekstraksi atribut `maxlength` dan regex petunjuk batasan karakter (*"max 150 chars"*, *"maksimal 200 karakter"*) dari elemen HTML dan helper text.
   - Menginstruksikan LLM menyusun jawaban ringkas, padat, berbobot, dan selesai secara utuh di bawah limit karakter.
   - Dilengkapi fungsi *safety truncation* pada DOM injector untuk mencegah kalimat terpotong menggantung di tengah kata.
3. **🚀 Flagship Project Context Integration**:
   - Terintegrasi dengan database proyek terbaru: **Marketplace Intelligence System (Hybrid RAG)** (DuckDB Text-to-SQL + ChromaDB) dan **VisionOps Guard** (YOLO26 & ONNX FP16 real-time PPE MLOps platform).
4. **🌐 Universal Semantic Matching & Google Forms Compatibility**:
   - Mampu mengenali kolom input di berbagai situs lowongan kerja (*Jobstreet, Glints, LinkedIn, Kalibrr, Greenhouse, Lever, Google Forms*).
   - Dilengkapi *Anti-Generic Filter*, parsing multi-ID `aria-labelledby`, dan penelusuran kartu pertanyaan (`[role="listitem"]`, `[role="heading"]`).
5. **✍️ Bilingual (ID & EN) Auto-Essay & Operational Screening Generator**:
   - Deteksi bahasa adaptif per-kolom: Pertanyaan berbahasa Inggris dijawab 100% dalam Bahasa Inggris profesional berstandar ATS (STAR Method), sedangkan pertanyaan berbahasa Indonesia dijawab dalam Bahasa Indonesia formal.
   - Presisi tinggi pada pertanyaan ketersediaan: Mencegah kekeliruan pemetaan antara *"When is the earliest date you can start?"* dengan total tahun pengalaman (*yearsOfExperience*).
6. **🧪 Sandbox Test Bench (`demo/test-form.html`)**:
   - Halaman demo lokal siap pakai untuk menguji autofill pada berbagai variasi input (teks, dropdown, radio, textarea, checkbox, dan maxlength inputs).

---

## 4. ⚙️ Konfigurasi & Secret Management

- **API Key**: Disimpan aman di `chrome.storage.local` melalui tab **🤖 Setting AI** pada popup ekstensi.
- **Gratis**: Memanfaatkan free tier Google Gemini API (hingga 15 RPM / 1 juta token gratis harian).
- Tidak memerlukan file `.env` karena berjalan 100% *client-side* di peramban pengguna.
