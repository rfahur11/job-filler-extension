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
      const candidates = Array.from(
        document.querySelectorAll(
          'input:not([type="hidden"]):not([type="password"]):not([type="submit"]):not([type="reset"]):not([type="button"]):not([type="image"]):not([type="file"]), textarea, select, [contenteditable="true"], [role="textbox"], [role="radio"], [role="checkbox"]'
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

        const tag = el.tagName ? el.tagName.toLowerCase() : 'input';
        const role = (el.getAttribute && el.getAttribute('role') || '').toLowerCase();
        const type = (el.getAttribute && el.getAttribute('type') || (tag === 'textarea' ? 'textarea' : tag === 'select' ? 'select' : role === 'radio' ? 'radio' : role === 'checkbox' ? 'checkbox' : 'text')).toLowerCase();
        const label = this.computeLabel(el);
        const name = el.getAttribute ? (el.getAttribute('name') || '') : '';
        const placeholder = el.getAttribute ? (el.getAttribute('placeholder') || '') : '';

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

        const fieldData = {
          id: aiFieldId,
          tag: tag,
          type: type,
          name: name,
          placeholder: placeholder,
          label: label,
          isEssay: isEssayField,
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
    isGenericLabel(text) {
      if (!text) return true;
      const clean = text.trim().toLowerCase().replace(/[*:]+$/, '').trim();
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
        'option'
      ];
      return genericPatterns.includes(clean) || clean.length <= 1;
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
      if (el.id && typeof CSS !== 'undefined' && CSS.escape) {
        try {
          const explicitLabel = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
          if (explicitLabel && explicitLabel.innerText.trim()) {
            const text = this.cleanText(explicitLabel.innerText);
            if (!this.isGenericLabel(text)) return text;
          }
        } catch (e) {}
      }

      // 3. Parent label
      try {
        const parentLabel = el.closest('label');
        if (parentLabel && parentLabel.innerText.trim()) {
          const text = this.cleanText(parentLabel.innerText);
          if (!this.isGenericLabel(text)) return text;
        }
      } catch (e) {}

      // 4. aria-labelledby (mendukung multiple space-separated IDs seperti di Google Form "i1 i4")
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

      // 7. Kontainer umum (.form-group, .field-wrapper, fieldset, dll)
      const container = el.closest('.form-group, .form-control-wrapper, .field-wrapper, .input-container, fieldset, tr, [role="listitem"], .Qr7Oae, div');
      if (container) {
        const heading = container.querySelector('label, .label, .title, legend, strong, span.field-label, [role="heading"], h3, h4, h5, p');
        if (heading && heading !== el && !heading.contains(el) && heading.innerText.trim()) {
          const text = this.cleanText(heading.innerText);
          if (!this.isGenericLabel(text)) return text;
        }
      }

      // 8. Elemen sibling sebelumnya
      let prev = el.previousElementSibling;
      while (prev) {
        if (['LABEL', 'SPAN', 'P', 'DIV', 'H4', 'H3', 'STRONG'].includes(prev.tagName) && prev.innerText.trim()) {
          const text = this.cleanText(prev.innerText);
          if (!this.isGenericLabel(text)) return text;
        }
        prev = prev.previousElementSibling;
      }

      return el.getAttribute('name') || el.id || 'Unlabeled Input';
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
    }
  };
})();
