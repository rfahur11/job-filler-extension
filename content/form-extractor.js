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
          'input:not([type="hidden"]):not([type="password"]):not([type="submit"]):not([type="reset"]):not([type="button"]):not([type="image"]), textarea, select, [contenteditable="true"], [role="textbox"]'
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
        const type = (el.getAttribute('type') || (tag === 'textarea' ? 'textarea' : tag === 'select' ? 'select' : 'text')).toLowerCase();
        const label = this.computeLabel(el);
        const name = el.getAttribute('name') || '';
        const placeholder = el.getAttribute('placeholder') || '';

        // Tentukan apakah field ini adalah pertanyaan esai screening
        const isEssayField = tag === 'textarea' || 
          type === 'textarea' || 
          label.toLowerCase().includes('why') || 
          label.toLowerCase().includes('mengapa') || 
          label.toLowerCase().includes('ceritakan') || 
          label.toLowerCase().includes('pengalaman') || 
          label.toLowerCase().includes('project') || 
          label.toLowerCase().includes('cover letter') || 
          label.toLowerCase().includes('motivation');

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
          fieldData.radioGroup = el.getAttribute('name');
          fieldData.radioValue = el.value;
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
      // 1. Ambil Judul Lowongan
      const h1Text = document.querySelector('h1')?.innerText?.trim() || '';
      const h2Text = document.querySelector('h2')?.innerText?.trim() || '';
      const jobTitle = h1Text || h2Text || document.title || 'Lowongan Pekerjaan';

      // 2. Cari Kontainer Deskripsi Pekerjaan (Glints, Jobstreet, LinkedIn, Greenhouse, Lever, dll)
      const jdSelectors = [
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
        if (el && el.innerText.trim().length > 100) {
          fullDescription = el.innerText.trim();
          break;
        }
      }

      // Jika selector spesifik tidak ada, ambil seluruh paragraf dan bullet points di halaman
      if (!fullDescription || fullDescription.length < 100) {
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
     * Menemukan label paling deskriptif untuk suatu elemen form
     */
    computeLabel(el) {
      if (el.id) {
        const explicitLabel = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
        if (explicitLabel && explicitLabel.innerText.trim()) {
          return this.cleanText(explicitLabel.innerText);
        }
      }

      const parentLabel = el.closest('label');
      if (parentLabel && parentLabel.innerText.trim()) {
        return this.cleanText(parentLabel.innerText);
      }

      const ariaLabel = el.getAttribute('aria-label');
      if (ariaLabel && ariaLabel.trim()) return ariaLabel.trim();

      const ariaLabelledBy = el.getAttribute('aria-labelledby');
      if (ariaLabelledBy) {
        const labelledByEl = document.getElementById(ariaLabelledBy);
        if (labelledByEl && labelledByEl.innerText.trim()) {
          return this.cleanText(labelledByEl.innerText);
        }
      }

      const placeholder = el.getAttribute('placeholder');
      if (placeholder && placeholder.trim()) return placeholder.trim();

      const container = el.closest('.form-group, .form-control-wrapper, .field-wrapper, .input-container, fieldset, tr, div');
      if (container) {
        const heading = container.querySelector('label, .label, .title, legend, strong, span.field-label, h3, h4, h5, p');
        if (heading && heading !== el && !heading.contains(el) && heading.innerText.trim()) {
          return this.cleanText(heading.innerText);
        }
      }

      let prev = el.previousElementSibling;
      while (prev) {
        if (['LABEL', 'SPAN', 'P', 'DIV', 'H4', 'STRONG'].includes(prev.tagName) && prev.innerText.trim()) {
          return this.cleanText(prev.innerText);
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
