/**
 * Universal AI Form Filler - Dual-Brain Deep Reasoning AI Engine
 * Menggunakan Gemini Ultra-Fast Flash Lite dengan database profil CV komprehensif & STAR Method.
 */

export class AIEngine {
  /**
   * Mengekstrak seluruh data profil komprehensif dari dokumen CV (PDF / Text) menggunakan AI Multimodal
   */
  static async parseCVFromDocument(fileBase64, mimeType, config) {
    const provider = config?.provider || "gemini";
    const apiKey = config?.apiKey?.trim();

    if (provider === "gemini") {
      if (!apiKey) {
        throw new Error("API Key Gemini belum diisi. Silakan buka tab 'Setting AI' terlebih dahulu.");
      }

      const model = this.sanitizeGeminiModel(config.model);
      const promptText = `Ekstrak dan analisis seluruh informasi kandidat dari dokumen CV ini ke dalam struktur JSON database lengkap berikut:
{
  "personal": {
    "fullName": "Nama lengkap kandidat",
    "nickname": "Nama panggilan jika ada",
    "email": "Email kandidat",
    "phone": "Nomor telepon / WhatsApp",
    "whatsapp": "Nomor WhatsApp",
    "birthDate": "YYYY-MM-DD jika ada",
    "gender": "Jenis kelamin (Laki-laki / Perempuan / Male / Female)",
    "maritalStatus": "Status pernikahan",
    "nationality": "Kewarganegaraan (misal: Indonesia)",
    "idCardNumber": "",
    "address": "Alamat domisili lengkap",
    "city": "Kota domisili",
    "province": "Provinsi",
    "postalCode": "Kode pos",
    "country": "Indonesia"
  },
  "links": {
    "linkedin": "URL LinkedIn",
    "github": "URL GitHub",
    "portfolio": "URL Portofolio",
    "website": "URL Website",
    "blog": "URL Blog jika ada",
    "twitter": "URL X / Twitter jika ada"
  },
  "summary": "Ringkasan profesional / bio profil kandidat (2-3 kalimat padat)",
  "experience": [
    {
      "role": "Posisi / Jabatan",
      "company": "Nama Perusahaan",
      "employmentType": "Full-time / Contract / Freelance / Internship",
      "location": "Kota / Negara / Remote",
      "startDate": "YYYY-MM",
      "endDate": "YYYY-MM atau Present",
      "isCurrent": true,
      "description": "Deskripsi tanggung jawab dan tugas",
      "technologies": "Teknologi yang digunakan",
      "achievements": "Pencapaian atau metrik hasil kerja"
    }
  ],
  "education": [
    {
      "degree": "Jenjang & Gelar (misal: S1 Teknik Informatika / Bachelor)",
      "major": "Jurusan / Bidang Studi",
      "institution": "Nama Universitas / Sekolah",
      "location": "Kota / Lokasi",
      "startYear": "Tahun mulai",
      "graduationYear": "Tahun lulus",
      "gpa": "IPK / Nilai akhir jika ada",
      "honors": "Penghargaan atau prestasi jika ada"
    }
  ],
  "certifications": [
    {
      "name": "Nama Sertifikasi / Lisensi",
      "issuer": "Lembaga Penerbit",
      "issueDate": "YYYY-MM",
      "expirationDate": "YYYY-MM atau Lifetime",
      "credentialId": "ID Kredensial",
      "credentialUrl": "URL Verifikasi"
    }
  ],
  "projects": [
    {
      "name": "Nama Proyek",
      "role": "Peran dalam proyek",
      "url": "URL Demo / Live",
      "github": "URL Repository",
      "technologies": "Tech stack yang dipakai",
      "description": "Deskripsi singkat proyek dan solusinya"
    }
  ],
  "skills": {
    "technical": "Daftar skill teknis dipisahkan koma (misal: JavaScript, Next.js, Python, PostgreSQL, Docker)",
    "soft": "Problem Solving, Analytical Thinking, Team Leadership, Adaptability, Communication",
    "languages": [
      { "language": "Bahasa Indonesia", "proficiency": "Native" },
      { "language": "English", "proficiency": "Professional Working" }
    ]
  },
  "preferences": {
    "expectedSalary": "15000000",
    "expectedSalaryMax": "20000000",
    "currentSalary": "",
    "currency": "IDR",
    "salaryNegotiable": "Yes",
    "noticePeriod": "1 Month / Segera",
    "earliestStartDate": "Segera",
    "employmentType": "Full-time",
    "remotePreference": "Remote atau Hybrid",
    "willingToRelocate": "Yes",
    "yearsOfExperience": "Total perkiraan tahun pengalaman dalam angka murni (misal: 4)",
    "workAuthorization": "Warga Negara Indonesia",
    "hasDrivingLicense": "SIM A / SIM C"
  },
  "customAnswers": {
    "whyJoinUs": "Motivasi profesional kandidat berdasarkan latar belakang CV",
    "strengths": "Kelebihan utama kandidat",
    "weaknesses": "Kelemahan dan cara adaptasinya",
    "challengingProject": "Ringkasan proyek paling berkesan dari riwayat kerja kandidat",
    "whyLeaveLastJob": "Alasan ingin mencari peluang dan tantangan karir baru",
    "leadershipExperience": "Pengalaman memimpin tim atau mengelola proyek",
    "careerGoals": "Tujuan dan target karir jangka menengah"
  }
}
Respon WAJIB dalam JSON valid saja.`;

      const payload = {
        contents: [
          {
            role: "user",
            parts: [
              {
                inlineData: {
                  mimeType: mimeType || "application/pdf",
                  data: fileBase64
                }
              },
              { text: promptText }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 3500,
          responseMimeType: "application/json"
        }
      };

      const result = await this.executeGeminiRequest(model, apiKey, payload);
      return this.normalizeCVData(result);
    } else {
      throw new Error(`Fitur upload dokumen CV saat ini dioptimalkan untuk Provider Google Gemini AI Studio.`);
    }
  }

  /**
   * Mengirim form fields dan context CV ke AI untuk dicocokkan dengan penalaran mendalam
   */
  static async matchFormFields(formFields, cvData, jobContext, config) {
    if (!formFields || formFields.length === 0) {
      throw new Error("Tidak ada field formulir yang terdeteksi di halaman ini.");
    }

    const provider = config?.provider || "gemini";
    const prompt = this.buildDeepReasoningPrompt(formFields, cvData, jobContext);

    if (provider === "gemini") {
      return await this.callGeminiAPI(prompt, config);
    } else if (provider === "ollama") {
      return await this.callOllamaAPI(prompt, config);
    } else if (provider === "openai_compatible") {
      return await this.callOpenAICompatibleAPI(prompt, config);
    } else {
      throw new Error(`Provider AI '${provider}' tidak didukung.`);
    }
  }

  /**
   * Membangun prompt Deep Reasoning dengan Framework STAR & Context-Matching Komprehensif
   */
  static buildDeepReasoningPrompt(formFields, cvData, jobContext) {
    const compactFields = formFields.map(f => {
      const item = {
        id: f.id,
        tag: f.tag,
        type: f.type,
        label: f.label || f.placeholder || f.name || "Unknown Field",
        isEssay: f.isEssay || false
      };
      if (f.options && f.options.length > 0) {
        item.options = f.options.slice(0, 15);
      }
      return item;
    });

    const jobTitle = jobContext?.jobTitle || 'Lowongan Pekerjaan';
    const jobDescription = (jobContext?.descriptionSnippet || '').trim();

    return `Kamu adalah Senior Career Strategist & AI Job Application Specialist berstandar ATS internasional. Tugasmu adalah memetakan dan mengisi seluruh formulir lamaran kerja berdasarkan Database CV Lengkap Kandidat dengan tingkat akurasi dan kualitas profesional tertinggi.

KONTEKS LOWONGAN PEKERJAAN:
- Posisi: "${jobTitle}"
- Detail Kualifikasi & Deskripsi Pekerjaan:
"""
${jobDescription || 'Tidak ada deskripsi detail tambahan.'}
"""

DATABASE LENGKAP KANDIDAT:
${JSON.stringify(cvData, null, 2)}

DAFTAR KOLOM FORMULIR YANG HARUS DIISI:
${JSON.stringify(compactFields, null, 2)}

======================================================================
ATURAN MUTLAK BAHASA & INTERNASIONALISASI (PER-FIELD LANGUAGE ADAPTATION):
======================================================================
Formulir lamaran kerja modern seringkali bersifat BILINGUAL (mencampur pertanyaan Bahasa Indonesia dan Bahasa Inggris) atau murni Bahasa Inggris.
Kamu WAJIB mendeteksi bahasa dari SETIAP pertanyaan/kolom secara individual:

1. [PERTANYAAN / LABEL DALAM BAHASA INGGRIS]:
   - Jika pertanyaan/label ditulis dalam Bahasa Inggris (contoh: "Describe 1 high traffic, latency sensitive backend system...", "When is the earliest date you can start?", "Why do you want to join us?", "What is your experience with Go?", "Please explain..."):
     -> JAWABAN WAJIB 100% DALAM BAHASA INGGRIS PROFESIONAL, FASIH, DAN NATURAL (ATS-Standard English)!
     -> DILARANG KERAS menjawab dalam Bahasa Indonesia untuk pertanyaan berbahasa Inggris.
     -> Terjemahkan dan kembangkan seluruh riwayat, pencapaian teknis, dan proyek dari database kandidat (meskipun tersimpan dalam Bahasa Indonesia) menjadi Bahasa Inggris profesional berstandar internasional.

2. [PERTANYAAN / LABEL DALAM BAHASA INDONESIA]:
   - Jika pertanyaan/label ditulis dalam Bahasa Indonesia (contoh: "Berapa tawaran gaji terendah...", "Ceritakan sistem...", "Kapan Anda bisa mulai bekerja?", "Bersediakah bekerja shift?"):
     -> JAWABAN WAJIB DALAM BAHASA INDONESIA PROFESIONAL & FORMAL.

3. [FORMULIR CAMPURAN / BILINGUAL]:
   - Jangan menyamaratakan bahasa seluruh form hanya karena ada satu pertanyaan atau judul halaman dalam bahasa tertentu. Setiap kolom WAJIB dijawab sesuai bahasa dari pertanyaan masing-masing!

======================================================================
PANDUAN PEMETAAN KOLOM (LENGKAP, SPESIFIK & PRESISI):
======================================================================
1. [DATA PRIBADI, KONTAK & LEGALITAS]:
   - Nama Depan/Belakang: Pisahkan 'fullName' jika ada field 'First Name' / 'Last Name'.
   - Email, No HP/WhatsApp, Alamat, Kota, Provinsi, Kode Pos, Negara, Tanggal Lahir, Gender, Status Pernikahan, Kewarganegaraan: Cocokkan persis dari database.
   - Izin Kerja / Work Authorization: Jawab sesuai 'workAuthorization' ("Authorized to work / WNI" atau "Yes").

2. [PENGALAMAN KERJA & TOTAL TAHUN PENGALAMAN]:
   - Pengalaman Terkini: Ambil posisi & perusahaan dari 'experience[0]'.
   - Jumlah Tahun Pengalaman (misal: "Total years of experience", "How many years of professional experience in Go?", "Berapa tahun pengalaman kerja?"):
     -> Isi dengan angka dari 'preferences.yearsOfExperience' (contoh: "2.5" atau "2").
     -> HANYA isi angka tahun untuk pertanyaan yang EKSPLISIT menanyakan jumlah tahun/durasi pengalaman kerja!

3. [KETERSEDIAAN, TANGGAL MULAI KERJA & NOTICE PERIOD (SANGAT KRUSIAL!)]:
   - Pertanyaan seperti:
     * "When is the earliest date you can start?"
     * "Earliest start date"
     * "How soon can you start?"
     * "Notice period"
     * "Kapan tanggal paling awal Anda dapat mulai bekerja?"
     -> INI ADALAH PERTANYAAN KETERSEDIAAN WAKTU / TANGGAL MULAI KERJA, BUKAN JUMLAH TAHUN PENGALAMAN!
     -> DILARANG KERAS MENGISI DENGAN ANGKA PENGALAMAN KERJA (seperti "2.5" atau "2")!
     -> Jika pertanyaan berbahasa Inggris: jawab "Immediately" atau "As soon as possible" atau "Immediately / Within 1 month notice" (atau tanggal spesifik jika diminta format tanggal).
     -> Jika pertanyaan berbahasa Indonesia: jawab "Segera" atau "1 Bulan / Secepatnya".

4. [GAJI & KOMPENSASI]:
   - Pertanyaan seperti: "Berapa tawaran gaji terendah yang akan Anda pertimbangkan?", "Minimum salary requirement", "Expected salary":
     -> Ambil nilai realistis dari rentang gaji kandidat ('preferences.expectedSalary' atau 'preferences.currentSalary').
     -> Jika ada prefix "Rp" atau kolom angka murni: isi nominal angka (contoh: "6000000" atau "8000000").
   - Gaji Negotiable: "Yes / Terbuka untuk negosiasi".

5. [CHECKBOX / RADIO KUALIFIKASI & PERSETUJUAN (AGREEMENT)]:
   - Untuk pertanyaan konfirmasi kualifikasi kerja atau persetujuan on-site, seperti:
     * "I have at least 2 years of full-time professional experience using Go (Golang)..."
     * "I understand that this is a work-from-office position, and I am willing to work on-site at Yogyakarta..."
     * "Bersediakah Anda bekerja sistem shift / on-site?"
     -> Pilih opsi persetujuan positif yang tersedia di options (contoh: "Yes I have...", "Yes", "Ya", "Bersedia", atau "true").

6. [DROPDOWN / SELECT / RADIO]:
   - Pilih salah satu opsi yang PALING RELEVAN dari daftar 'options' yang tersedia.

7. [PERTANYAAN ESAI TEKNIS & SCREENING (METODE STAR)]:
   - Contoh pertanyaan: "Describe 1 high traffic, latency sensitive backend system you have worked on", "Tell me about a challenging project", "Why do you want to join us?", "Ceritakan pengalaman...":
     * WAJIB tulis dalam bahasa yang sesuai dengan bahasa pertanyaan (Bahasa Inggris jika pertanyaan Bahasa Inggris).
     * Terapkan metode STAR (Situation, Task, Action, Result) dengan detail arsitektur teknis nyata dari CV:
       - Context: High-throughput Go/Fiber backend microservices, Shopee Open API rate-limiting challenges, asynchronous order-ingestion pipeline.
       - Architecture: Retry backoff algorithm, dead-letter queue, idempotent message processing, low-latency database queries.
       - Impact: Restored 100% synchronization reliability under peak load without transaction loss.
     * Tulis 1-2 paragraf padat, percaya diri, tanpa basa-basi klise.

8. [PERTANYAAN KHUSUS & KESIAPAN OPERASIONAL KERJA]:
   - Shift / Lembur: Jawab siap dan fleksibel ("Bersedia" atau "Yes, I am flexible and ready to work on shifts").
   - Fasilitas selain gaji: Jawab wajar ("BPJS Kesehatan & Ketenagakerjaan, health benefits, and continuous learning opportunities").
   - Relasi karyawan yang dikenal: Jawab jujur ("Tidak ada" / "None").

Format Output WAJIB dalam JSON valid murni:
{
  "fields": {
    "ai-field-id-1": "Nilai yang tepat",
    "ai-field-id-2": "Jawaban profesional sesuai bahasa pertanyaan"
  }
}`;
  }

  /**
   * Menstandarisasi nama model Gemini ke varian Flash-Lite berkecepatan tinggi
   */
  static sanitizeGeminiModel(modelName) {
    if (!modelName || modelName.includes('2.0') || modelName.includes('1.5') || modelName.includes('3.6') || modelName === 'gemini-2.5-flash') {
      return 'gemini-3.1-flash-lite';
    }
    return modelName.trim();
  }

  /**
   * Eksekusi request ke Gemini API dengan auto-fallback jika model 404
   */
  static async executeGeminiRequest(initialModel, apiKey, payload) {
    const candidateModels = [
      initialModel,
      'gemini-3.1-flash-lite',
      'gemini-3.5-flash-lite',
      'gemini-flash-lite-latest',
      'gemini-3.6-flash'
    ];

    const modelsToTry = Array.from(new Set(candidateModels));
    let lastError = null;

    for (const model of modelsToTry) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          const data = await res.json();
          const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (!rawText) {
            throw new Error("Respon kosong dari Gemini AI.");
          }
          return this.parseJSONResponse(rawText);
        }

        const errText = await res.text();
        let errMsg = `Gemini API Error (${res.status})`;
        try {
          const errJson = JSON.parse(errText);
          errMsg += `: ${errJson.error?.message || errText}`;
        } catch {
          errMsg += `: ${errText}`;
        }

        lastError = new Error(errMsg);
        if (res.status !== 404) {
          throw lastError;
        }
      } catch (e) {
        lastError = e;
        if (!e.message.includes('404')) {
          throw e;
        }
      }
    }

    throw lastError || new Error("Gagal terhubung ke Gemini API.");
  }

  /**
   * Panggilan ke Google Gemini API
   */
  static async callGeminiAPI(prompt, config) {
    const apiKey = config.apiKey?.trim();
    if (!apiKey) {
      throw new Error("API Key Gemini belum diisi. Silakan buka Pengaturan Ekstensi.");
    }

    const model = this.sanitizeGeminiModel(config.model);
    const payload = {
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        temperature: 0.15,
        maxOutputTokens: 2500,
        responseMimeType: "application/json"
      }
    };

    return await this.executeGeminiRequest(model, apiKey, payload);
  }

  /**
   * Panggilan ke Ollama Local API
   */
  static async callOllamaAPI(prompt, config) {
    const endpoint = (config.customEndpoint || "http://localhost:11434").replace(/\/$/, "");
    const model = config.model || "qwen2.5:7b";
    const url = `${endpoint}/api/generate`;

    const payload = {
      model: model,
      prompt: prompt,
      stream: false,
      format: "json",
      options: { temperature: 0.2 }
    };

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      throw new Error(`Ollama Error (${res.status}): Pastikan Ollama aktif di ${endpoint}`);
    }

    const data = await res.json();
    return this.parseJSONResponse(data.response);
  }

  /**
   * Panggilan ke OpenAI-Compatible API
   */
  static async callOpenAICompatibleAPI(prompt, config) {
    const endpoint = (config.customEndpoint || "https://openrouter.ai/api/v1/chat/completions").trim();
    const apiKey = config.apiKey?.trim();
    const model = config.model || "google/gemini-flash-1.5";

    const headers = { "Content-Type": "application/json" };
    if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;

    const payload = {
      model: model,
      messages: [
        { role: "system", content: "You are a professional AI Job Application Form Filler. Respond strictly with JSON format." },
        { role: "user", content: prompt }
      ],
      temperature: 0.2
    };

    const res = await fetch(endpoint, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`API Error (${res.status}): ${errText}`);
    }

    const data = await res.json();
    return this.parseJSONResponse(data.choices?.[0]?.message?.content);
  }

  /**
   * Parsing JSON string dari LLM dengan sanitasi markdown code blocks
   */
  static parseJSONResponse(rawText) {
    let clean = rawText.trim();
    if (clean.startsWith("```json")) {
      clean = clean.replace(/^```json\s*/, "").replace(/\s*```$/, "");
    } else if (clean.startsWith("```")) {
      clean = clean.replace(/^```\s*/, "").replace(/\s*```$/, "");
    }

    try {
      const parsed = JSON.parse(clean);
      return parsed.fields || parsed;
    } catch (e) {
      console.error("Gagal parse JSON dari LLM:", clean);
      throw new Error("Gagal memproses respon format JSON dari AI. Silakan coba lagi.");
    }
  }

  /**
   * Normalisasi data CV hasil ekstraksi agar selalu seragam
   */
  static normalizeCVData(data) {
    if (!data || typeof data !== 'object') return data;

    if (data.skills) {
      if (Array.isArray(data.skills.technical)) {
        data.skills.technical = data.skills.technical.join(', ');
      }
      if (Array.isArray(data.skills.soft)) {
        data.skills.soft = data.skills.soft.join(', ');
      }
      if (Array.isArray(data.skills.languages)) {
        data.skills.languages = data.skills.languages.map(l => typeof l === 'object' ? `${l.language} (${l.proficiency})` : l).join(', ');
      }
    }

    // Pastikan struktur links ada
    if (!data.links && data.personal) {
      data.links = {
        linkedin: data.personal.linkedin || '',
        github: data.personal.github || '',
        portfolio: data.personal.portfolio || '',
        website: data.personal.website || ''
      };
    }

    return data;
  }

  /**
   * Test koneksi ke API secara instan (Micro-Ping < 800ms)
   */
  static async testConnection(config) {
    const provider = config?.provider || "gemini";
    const apiKey = config?.apiKey?.trim();

    if (provider === "gemini") {
      if (!apiKey) throw new Error("API Key belum diisi.");

      const model = this.sanitizeGeminiModel(config.model);
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: "Kembalikan JSON: {\"status\": \"ok\"}" }] }],
          generationConfig: { responseMimeType: "application/json" }
        })
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errText}`);
      }

      return true;
    }

    return true;
  }
}
