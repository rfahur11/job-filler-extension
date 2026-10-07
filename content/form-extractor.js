/**
 * Universal AI Form Filler - Smart DOM Pruning & Form Extractor
 * Mengidentifikasi seluruh elemen input pada formulir loker dan mengekstrak label serta Job Description lengkap di halaman.
 */

(() => {
  window.AIFormExtractor = {
    /**
     * Memindai DOM dan mengekstrak seluruh input form yang valid beserta konteks deskripsi pekerjaan
     * @returns {Object} { fields: Array, pageTitle: String, jobContext: Object }
     */
    extractFormFields() {
      // 1. Cek apakah ada modal dialog yang aktif di layar (misal Glints modal, Jobstreet pop-up)
      const modalSelectors = [
        '[role="dialog"]:not([aria-hidden="true"])',
        '[aria-modal="true"]:not([aria-hidden="true"])',
        '.modal.show',
        '.modal.in',
        '[class*="modal"][style*="display: block"]',
        '[class*="Modal"]:not([style*="display: none"])',
        '[class*="dialog"]:not([style*="display: none"])',
        '[class*="Dialog"]:not([style*="display: none"])'
      ];

      let root = document;
      for (const sel of modalSelectors) {
        const modal = document.querySelector(sel);
        if (modal && this.isVisible(modal) && modal.querySelector('input, textarea, select')) {
          root = modal;
          break;
        }
      }

      const candidates = Array.from(
        root.querySelectorAll(
          'input:not([type="hidden"]):not([type="password"]):not([type="submit"]):not([type="reset"]):not([type="button"]):not([type="image"]), textarea, select, [contenteditable="true"], [role="textbox"], [role="radio"], [role="checkbox"]'
        )
      );

      const fields = [];
      let fieldCounter = 0;

      for (const el of candidates) {
        if (!this.isVisible(el)) continue;
        if (this.isSearchOrNavInput(el)) continue;

        fieldCounter++;
        const aiFieldId = `ai-field-${fieldCounter}`;
        el.setAttribute('data-ai-field-id', aiFieldId);

        const tag = el.tagName.toLowerCase();
        const role = (el.getAttribute('role') || '').toLowerCase();
        const type = (el.getAttribute('type') || (tag === 'textarea' ? 'textarea' : tag === 'select' ? 'select' : role === 'radio' ? 'radio' : role === 'checkbox' ? 'checkbox' : 'text')).toLowerCase();
        const label = this.computeLabel(el);
        const name = el.getAttribute('name') || '';
        const placeholder = el.getAttribute('placeholder') || '';

        // Tentukan apakah field ini adalah pertanyaan esai screening (Bilingual: ID & EN)
        const lLabel = label.toLowerCase();
        const isEssayField = tag === 'textarea' || 
          type === 'textarea' || 
          lLabel.includes('why') || 
          lLabel.includes('describe') || 
          lLabel.includes('explain') || 
          lLabel.includes('detail') || 
          lLabel.includes('share') || 
          lLabel.includes('tell us') || 
          lLabel.includes('what is your') || 
          lLabel.includes('how do you') || 
          lLabel.includes('mengapa') || 
          lLabel.includes('kenapa') || 
          lLabel.includes('ceritakan') || 
          lLabel.includes('jelaskan') || 
          lLabel.includes('pengalaman') || 
          lLabel.includes('experience with') || 
          lLabel.includes('project') || 
          lLabel.includes('proyek') || 
          lLabel.includes('cover letter') || 
          lLabel.includes('fasilitas') || 
          lLabel.includes('system you have') || 
          lLabel.includes('motivation');

        const maxLength = this.computeMaxLength(el, label);

        const fieldData = {
          id: aiFieldId,
          tag: tag,
          type: type,
          name: name,
          placeholder: placeholder,
          label: label,
          isEssay: isEssayField,
          maxLength: maxLength,
          currentValue: el.value || el.innerText || ''
        };

        if (tag === 'select') {
          fieldData.options = Array.from(el.options)
            .filter(opt => opt.value !== '' || opt.text.trim() !== '')
            .map(opt => ({
              value: opt.value,
              text: opt.text.trim()
            }));
        }

        if (type === 'radio') {
          fieldData.radioGroup = el.getAttribute('name') || el.closest('[role="radiogroup"]')?.getAttribute('aria-labelledby') || el.closest('[role="listitem"]')?.id || 'radio-group';
          fieldData.radioValue = el.value || el.getAttribute('data-value') || el.getAttribute('aria-label') || label;
        }

        fields.push(fieldData);
      }

      // Ekstraksi Deep Job Context dari halaman
      const jobContext = this.extractDeepJobContext();

      return {
        fields: fields,
        pageTitle: document.title || '',
        jobContext: jobContext
      };
    },

    /**
     * Mengekstrak seluruh konteks lowongan kerja (Judul, Perusahaan, Kualifikasi, Tech Stack, Deskripsi)
     */
    extractDeepJobContext() {
      // 1. Ambil Judul Lowongan / Formulir (Mendukung Google Forms header & ATS)
      const gFormTitle = document.querySelector('[role="heading"][aria-level="1"], .F9N2ud, .freebirdFormviewerViewHeaderHeader')?.innerText?.trim() || '';
      const h1Text = document.querySelector('h1')?.innerText?.trim() || '';
      const h2Text = document.querySelector('h2')?.innerText?.trim() || '';
      const jobTitle = gFormTitle || h1Text || h2Text || document.title || 'Lowongan Pekerjaan';

      // 2. Cari Kontainer Deskripsi Pekerjaan (Google Forms header desc, Glints, Jobstreet, LinkedIn, Greenhouse, Lever, dll)
      const jdSelectors = [
        '.freebirdFormviewerViewHeaderDescription',
        '.cB2q2e',
        '[data-automation="jobDescription"]',
        '[class*="job-description"]',
        '[class*="jobDescription"]',
        '[class*="JobDescription"]',
        '[class*="description"]',
        '[class*="job-details"]',
        '[class*="jobDetails"]',
        '#job-description',
        '#job-details',
        '.section-description',
        'article',
        'main'
      ];

      let fullDescription = '';
      for (const selector of jdSelectors) {
        const el = document.querySelector(selector);
        if (el && el.innerText.trim().length > 30) {
          fullDescription = el.innerText.trim();
          break;
        }
      }

      // Jika selector spesifik tidak ada, ambil seluruh paragraf dan bullet points di halaman
      if (!fullDescription || fullDescription.length < 50) {
        const paragraphs = Array.from(document.querySelectorAll('p, ul, ol, li'))
          .filter(el => !el.closest('header, nav, footer, #ai-job-filler-widget'))
          .map(el => el.innerText.trim())
          .filter(t => t.length > 20);
        fullDescription = paragraphs.slice(0, 15).join('\n');
      }

      // Potong deskripsi maksimal 1800 karakter agar tetap hemat token tapi sangat informatif
      const prunedDescription = fullDescription.slice(0, 1800).replace(/\s+/g, ' ');

      return {
        jobTitle: jobTitle,
        pageTitle: document.title,
        descriptionSnippet: prunedDescription
      };
    },

    /**
     * Memeriksa apakah teks label hanya berupa placeholder generik (misal "Jawaban Anda" di Google Forms)
     */
    /**
     * Memeriksa apakah teks label hanya berupa placeholder generik, counter, tombol, atau stepper
     */
    isGenericLabel(text) {
      if (!text) return true;
      const clean = text.trim().toLowerCase().replace(/[*:]+$/, '').trim();
      
      // 1. Saring karakter counter (misal "491 / 500", "459 / 500", "0/500")
      if (/^\d+\s*[\/\-]\s*\d+$/.test(clean) || /^\d+\s*\/\s*\d+\s*(karakter|characters)?$/i.test(clean)) {
        return true;
      }

      // 2. Saring stepper progress (misal "3/4", "5/6", "step 3 of 4", "langkah 3 dari 4")
      if (/^(\d+\s*\/\s*\d+|step\s*\d+|langkah\s*\d+|page\s*\d+|halaman\s*\d+)$/i.test(clean)) {
        return true;
      }

      // 3. Saring tombol navigasi & aksi
      if (/^(kembali|selanjutnya|kirim|submit|simpan|batal|lanjut|next|back|save|cancel|tutup|close|apply|lamar|unggah|upload|yes|no)$/i.test(clean)) {
        return true;
      }

      // 4. Saring judul form / modal umum (misal "Lamar posisi Programmer", "Lamar posisi AI Engineer")
      if (/^lamar posisi\s+.+$/i.test(clean) || /^apply for\s+.+$/i.test(clean)) {
        return true;
      }

      const genericPatterns = [
        'jawaban anda',
        'your answer',
        'jawaban teks singkat',
        'short answer text',
        'teks jawaban panjang',
        'long answer text',
        'masukkan jawaban',
        'enter answer',
        'enter your answer',
        'tulis jawaban',
        'ketik di sini',
        'type here',
        'unlabeled input',
        'untitled question',
        'pertanyaan tanpa judul',
        'opsi',
        'option',
        'answer',
        'content',
        'response',
        'textarea',
        'input'
      ];
      return genericPatterns.includes(clean) || clean.length <= 1;
    },

    /**
     * Mencari teks pertanyaan di dalam sebuah node atau anak-anaknya
     */
    findQuestionInNode(node) {
      if (!node || node.nodeType !== Node.ELEMENT_NODE) return '';

      // Abaikan tag script, style, atau widget ekstensi
      if (['SCRIPT', 'STYLE', 'NOSCRIPT', 'SVG'].includes(node.tagName) || node.id === 'ai-job-filler-widget') {
        return '';
      }

      // 1. Prioritaskan elemen yang secara eksplisit merupakan heading atau paragraf pertanyaan
      const questionEls = node.querySelectorAll(
        'label, h1, h2, h3, h4, h5, h6, [role="heading"], p, strong, [class*="question"], [class*="prompt"], [class*="label"], [class*="title"]'
      );
      for (const qEl of questionEls) {
        const text = this.cleanText(qEl.innerText);
        if (text && !this.isGenericLabel(text)) {
          if (text.includes('?') || /^\d+[\.\)]/.test(text) || text.length > 12) {
            return text;
          }
        }
      }

      // 2. Jika node itu sendiri memiliki teks langsung yang bermakna
      const directText = this.cleanText(node.innerText);
      if (directText && !this.isGenericLabel(directText)) {
        if (directText.includes('?') || /^\d+[\.\)]/.test(directText) || directText.length > 12) {
          return directText;
        }
      }

      return '';
    },

    /**
     * Mencari pertanyaan yang posisinya paling dekat sebelum elemen input di dalam container
     * Menggunakan verifikasi visual (jarak koordinat vertikal getBoundingClientRect)
     * agar tidak pernah salah mengambil elemen dari step lain yang disembunyikan.
     */
    findNearestPrecedingQuestion(el, container) {
      const root = container || el.closest('form, [role="dialog"], [aria-modal="true"], [class*="modal"], [class*="Modal"], [class*="dialog"], main') || document.body;
      const elRect = el.getBoundingClientRect();

      const allNodes = Array.from(root.querySelectorAll('*'));
      const candidates = [];

      for (const node of allNodes) {
        if (node === el || node.contains(el)) continue;
        if (node.childElementCount > 3) continue; // Hanya leaf atau near-leaf element

        // Pastikan node benar-benar terlihat di layar (bukan step sebelumnya yang di-hide)
        if (!this.isVisible(node)) continue;

        const nodeRect = node.getBoundingClientRect();
        if (nodeRect.width === 0 || nodeRect.height === 0) continue;

        // Node harus berada di ATAS elemen input secara visual di layar
        if (nodeRect.bottom <= elRect.top + 15) {
          const text = this.cleanText(node.innerText);
          if (text && !this.isGenericLabel(text)) {
            const verticalDistance = elRect.top - nodeRect.bottom;
            candidates.push({
              text: text,
              distance: verticalDistance,
              node: node
            });
          }
        }
      }

      // Urutkan berdasarkan jarak vertikal terdekat ke input (ascending distance)
      candidates.sort((a, b) => a.distance - b.distance);

      // Cari kandidat terdekat yang merupakan pertanyaan atau label
      for (const item of candidates) {
        const t = item.text;
        if (
          t.includes('?') ||
          /^\d+[\.\)]/.test(t) ||
          /(link|github|kaggle|hugging|portofolio|portfolio|apa|bagaimana|sebutkan|jelaskan|ceritakan|mengapa|kenapa|berapa|model|skill|device|tools|wpm|commit|pengalaman|experience|describe|why|what|how|proyek|project)/i.test(t) ||
          t.length > 8
        ) {
          return t;
        }
      }

      if (candidates.length > 0) {
        return candidates[0].text;
      }

      return '';
    },

    /**
     * Menemukan label paling deskriptif untuk suatu elemen form
     */
    computeLabel(el) {
      // 1. Khusus Google Forms: Cari elemen heading/pertanyaan di kartu soal terdekat
      const gFormCard = el.closest('[role="listitem"], .geFormCard, .freebirdFormviewerComponentsQuestionBaseRoot, .Qr7Oae, [jsmodel]');
      if (gFormCard) {
        const heading = gFormCard.querySelector('[role="heading"], .M7eF9b, .HoA7ed, .F9N2ud, div[dir="auto"]');
        if (heading && heading !== el && !heading.contains(el)) {
          const headingText = this.cleanText(heading.innerText);
          if (!this.isGenericLabel(headingText)) {
            return headingText;
          }
        }
      }

      // 2. Explicit label for="..."
      if (el.id) {
        const explicitLabel = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
        if (explicitLabel && explicitLabel.innerText.trim()) {
          const text = this.cleanText(explicitLabel.innerText);
          if (!this.isGenericLabel(text)) return text;
        }
      }

      // 3. Parent label
      const parentLabel = el.closest('label');
      if (parentLabel && parentLabel.innerText.trim()) {
        const text = this.cleanText(parentLabel.innerText);
        if (!this.isGenericLabel(text)) return text;
      }

      // 4. aria-labelledby
      const ariaLabelledBy = el.getAttribute('aria-labelledby');
      if (ariaLabelledBy) {
        const ids = ariaLabelledBy.split(/\s+/).filter(Boolean);
        const labelParts = [];
        for (const id of ids) {
          const targetEl = document.getElementById(id);
          if (targetEl && targetEl.innerText.trim()) {
            const t = this.cleanText(targetEl.innerText);
            if (!this.isGenericLabel(t)) {
              labelParts.push(t);
            }
          }
        }
        if (labelParts.length > 0) {
          return labelParts.join(' ');
        }
      }

      // 5. aria-label (hanya jika bukan placeholder generik)
      const ariaLabel = el.getAttribute('aria-label');
      if (ariaLabel && ariaLabel.trim() && !this.isGenericLabel(ariaLabel)) {
        return ariaLabel.trim();
      }

      // 6. Placeholder (hanya jika bukan placeholder generik)
      const placeholder = el.getAttribute('placeholder');
      if (placeholder && placeholder.trim() && !this.isGenericLabel(placeholder)) {
        return placeholder.trim();
      }

      // 7. Cari teks pertanyaan terdekat sebelum input di container (Glints, Jobstreet modal, dialog wizard)
      const modalOrDialog = el.closest('[role="dialog"], [aria-modal="true"], .modal, [class*="modal"], [class*="Modal"], [class*="dialog"], [class*="Dialog"], form, fieldset');
      const nearestQuestion = this.findNearestPrecedingQuestion(el, modalOrDialog);
      if (nearestQuestion) {
        return nearestQuestion;
      }

      // 8. Ascending Traversal ke atas (fallback)
      let current = el;
      let depth = 0;
      while (current && current !== document.body && depth < 8) {
        let prev = current.previousElementSibling;
        while (prev) {
          const qText = this.findQuestionInNode(prev);
          if (qText && !this.isGenericLabel(qText)) {
            return qText;
          }
          prev = prev.previousElementSibling;
        }
        current = current.parentElement;
        depth++;
      }

      const fallbackName = el.getAttribute('name') || el.id || '';
      if (fallbackName && !this.isGenericLabel(fallbackName)) {
        return fallbackName;
      }

      return 'Unlabeled Question';
    },

    isVisible(el) {
      if (!el.offsetParent && el.offsetWidth === 0 && el.offsetHeight === 0) return false;
      const style = window.getComputedStyle(el);
      return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
    },

    isSearchOrNavInput(el) {
      const type = (el.getAttribute('type') || '').toLowerCase();
      if (type === 'search') return true;

      const nameOrId = `${el.name || ''} ${el.id || ''} ${el.className || ''} ${el.placeholder || ''}`.toLowerCase();
      if (nameOrId.includes('search-bar') || nameOrId.includes('search-input') || nameOrId.includes('search_query') || nameOrId.includes('nav-search')) {
        return true;
      }

      if (el.closest('header, nav, #header, #navbar, .navbar, .global-search')) {
        return true;
      }

      return false;
    },

    cleanText(text) {
      return text
        .replace(/[\n\r\t]+/g, ' ')
        .replace(/\s{2,}/g, ' ')
        .replace(/[*:]+$/, '')
        .trim();
    },

    computeMaxLength(el, label) {
      // 1. Cek atribut HTML maxlength
      const attrVal = el.getAttribute('maxlength');
      if (attrVal !== null && attrVal !== undefined && attrVal !== '') {
        const parsed = parseInt(attrVal, 10);
        if (!isNaN(parsed) && parsed > 0 && parsed < 50000) {
          return parsed;
        }
      }

      // Cek DOM property el.maxLength (abaikan default -1 atau value > 50000)
      if (typeof el.maxLength === 'number' && el.maxLength > 0 && el.maxLength < 50000) {
        return el.maxLength;
      }

      // 2. Cek petunjuk dari label, placeholder, aria-describedby, atau helper text di sekitarnya
      const textToScan = [
        label || '',
        el.getAttribute('placeholder') || '',
        el.getAttribute('aria-describedby') ? (document.getElementById(el.getAttribute('aria-describedby'))?.innerText || '') : '',
        el.closest('.form-group, .field-wrapper, div')?.querySelector('.help-block, .field-hint, .character-count, small, span.hint, .description')?.innerText || ''
      ].join(' ');

      if (textToScan) {
        // Regex mencocokkan: "max 150 char", "maksimal 200 karakter", "max 50 words", "limit 100", "maks. 250"
        const charMatch = textToScan.match(/(?:max(?:imum)?|maks(?:imal)?|limit)\s*:?\s*(\d+)\s*(?:char|karakter|huruf)?/i);
        if (charMatch && charMatch[1]) {
          const val = parseInt(charMatch[1], 10);
          if (!isNaN(val) && val > 0 && val < 50000) {
            return val;
          }
        }

        const wordMatch = textToScan.match(/(?:max(?:imum)?|maks(?:imal)?|limit)\s*:?\s*(\d+)\s*(?:kata|words)/i);
        if (wordMatch && wordMatch[1]) {
          const words = parseInt(wordMatch[1], 10);
          if (!isNaN(words) && words > 0) {
            return Math.floor(words * 6.5);
          }
        }
      }

      return null;
    }
  };
})();
