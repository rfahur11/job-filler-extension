/**
 * Universal AI Form Filler - Content Script
 * Menangani floating action widget, analisis job context, komunikasi background, dan injeksi nilai ke elemen form.
 */

(() => {
  let widgetInjected = false;

  // Inisialisasi widget setelah DOM siap
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWidget);
  } else {
    initWidget();
  }

  // Pantau jika ada form yang baru muncul secara dinamis (misal modal pop-up)
  const observer = new MutationObserver(() => {
    if (!widgetInjected) {
      initWidget();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  function initWidget() {
    if (widgetInjected || document.getElementById('ai-job-filler-widget')) return;

    const hasFormElements = document.querySelector('input, textarea, select');
    if (!hasFormElements) return;

    widgetInjected = true;

    // Buat Floating Action Widget
    const widget = document.createElement('div');
    widget.id = 'ai-job-filler-widget';
    widget.innerHTML = `
      <button class="ai-filler-btn" id="ai-filler-trigger-btn" title="Klik untuk mengisi formulir dengan AI Deep Reasoning">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
        </svg>
        <span id="ai-filler-btn-text">Auto-Fill AI</span>
      </button>
    `;

    // Buat Toast Notification Container
    const toast = document.createElement('div');
    toast.id = 'ai-filler-toast';
    toast.innerHTML = `<span id="ai-filler-toast-msg"></span>`;

    document.body.appendChild(widget);
    document.body.appendChild(toast);

    // Event Listener Klik Tombol Auto-Fill
    document.getElementById('ai-filler-trigger-btn').addEventListener('click', handleAutoFill);
  }

  /**
   * Menjalankan proses ekstraksi dan pengisian formulir berbasis Deep Reasoning
   */
  async function handleAutoFill() {
    const btn = document.getElementById('ai-filler-trigger-btn');
    const btnText = document.getElementById('ai-filler-btn-text');

    if (!window.AIFormExtractor) {
      showToast('Error: Form extractor module tidak ditemukan.', 'error');
      return;
    }

    try {
      // 1. Ubah state tombol menjadi loading
      if (btn) btn.classList.add('loading');
      if (btnText) btnText.innerText = 'Menganalisis Loker & CV...';

      // 2. Ekstrak seluruh field form + Job Description di halaman
      const extracted = window.AIFormExtractor.extractFormFields();

      if (!extracted.fields || extracted.fields.length === 0) {
        showToast('Tidak ada kolom form aktif yang terdeteksi. Jika form ada di dalam tombol "Apply/Lamar", silakan buka form terlebih dahulu.', 'error');
        resetButton(btn, btnText);
        return;
      }

      if (btnText) btnText.innerText = `Menyusun Jawaban (${extracted.fields.length} Kolom)...`;

      // 3. Kirim ke Background Service Worker untuk diproses AI Deep Reasoning
      chrome.runtime.sendMessage(
        {
          action: 'AUTOFILL_FORM',
          fields: extracted.fields,
          pageTitle: extracted.pageTitle,
          jobContext: extracted.jobContext
        },
        response => {
          if (chrome.runtime.lastError) {
            resetButton(btn, btnText);
            showToast(`Gagal: ${chrome.runtime.lastError.message}`, 'error');
            return;
          }

          resetButton(btn, btnText);

          if (!response || !response.success) {
            showToast(response?.error || 'Gagal memproses form dengan AI.', 'error');
            return;
          }

          // 4. Injeksi nilai yang dikembalikan oleh AI ke elemen DOM
          const mapping = response.data;
          const filledCount = applyValuesToForm(mapping);

          showToast(`✨ Sukses! ${filledCount} kolom terisi dengan jawaban terpersonalisasi. Silakan tinjau sebelum submit.`, 'success');
        }
      );
    } catch (err) {
      console.error('AutoFill Error:', err);
      showToast(`Error: ${err.message}`, 'error');
      resetButton(btn, btnText);
    }
  }

  /**
   * Menginjeksikan nilai ke elemen DOM dengan event dispatch lengkap (kompatibel React/Vue/Angular/WordPress)
   */
  function applyValuesToForm(fieldMapping) {
    if (!fieldMapping) return 0;

    let mapping = fieldMapping;
    if (mapping.fields && typeof mapping.fields === 'object' && !Array.isArray(mapping.fields)) {
      mapping = mapping.fields;
    }
    if (typeof mapping !== 'object') return 0;

    let filledCount = 0;

    for (const [fieldId, value] of Object.entries(mapping)) {
      if (value === undefined || value === null || value === '') continue;

      let el = null;
      try {
        el = document.querySelector(`[data-ai-field-id="${CSS.escape(fieldId)}"]`) ||
             document.querySelector(`[data-ai-field-id="${fieldId}"]`);
      } catch (e) {
        el = document.querySelector(`[data-ai-field-id="${fieldId}"]`);
      }
      if (!el) continue;

      const tag = el.tagName ? el.tagName.toLowerCase() : 'input';
      const role = (el.getAttribute && el.getAttribute('role') || '').toLowerCase();
      const type = (el.getAttribute && el.getAttribute('type') || (tag === 'textarea' ? 'textarea' : tag === 'select' ? 'select' : 'text')).toLowerCase();

      // Abaikan input tipe file karena pembatasan keamanan browser
      if (type === 'file' || (el.type && el.type.toLowerCase() === 'file')) {
        continue;
      }

      try {
        if (tag === 'select') {
          setSelectValue(el, value);
        } else if (type === 'radio' || role === 'radio') {
          setRadioValue(el, value);
        } else if (type === 'checkbox' || role === 'checkbox') {
          setCheckboxValue(el, value);
        } else if (el.isContentEditable) {
          el.innerText = String(value);
          dispatchInputEvents(el);
        } else {
          setInputValue(el, value);
        }

        // Tambahkan efek visual highlight hijau
        if (el.classList) {
          el.classList.add('ai-field-filled-highlight');
          setTimeout(() => {
            try {
              el.classList.remove('ai-field-filled-highlight');
            } catch (e) {}
          }, 3500);
        }

        filledCount++;
      } catch (err) {
        console.warn(`Gagal mengisi field ${fieldId}:`, err);
      }
    }

    return filledCount;
  }

  function setInputValue(el, value) {
    if (!el) return;
    const type = (el.getAttribute && el.getAttribute('type') || (el.type || '')).toLowerCase();
    if (type === 'file') return;

    try {
      const valStr = String(value);
      const isTextarea = el.tagName && el.tagName.toLowerCase() === 'textarea';
      const proto = isTextarea ? window.HTMLTextAreaElement?.prototype : window.HTMLInputElement?.prototype;
      const valueSetter = proto ? Object.getOwnPropertyDescriptor(proto, 'value')?.set : null;

      if (valueSetter) {
        valueSetter.call(el, valStr);
      } else {
        el.value = valStr;
      }

      // Kompatibilitas Google Forms & Modern SPA
      if (el.setAttribute) {
        try {
          el.setAttribute('data-initial-value', valStr);
          el.setAttribute('badinput', 'false');
        } catch (e) {}
      }

      dispatchInputEvents(el);
    } catch (err) {
      console.warn('setInputValue fallback:', err);
      try {
        el.value = String(value);
        dispatchInputEvents(el);
      } catch (e) {}
    }
  }

  function setSelectValue(el, targetValue) {
    if (!el) return;
    if (!el.options || el.options.length === 0) {
      try {
        el.value = String(targetValue);
        dispatchInputEvents(el);
      } catch (e) {}
      return;
    }

    const targetStr = String(targetValue).toLowerCase().trim();
    let matched = false;

    for (let i = 0; i < el.options.length; i++) {
      const opt = el.options[i];
      if (!opt) continue;
      const optVal = (opt.value || '').toLowerCase().trim();
      const optText = (opt.text || '').toLowerCase().trim();

      if (optVal === targetStr || optText === targetStr || optText.includes(targetStr) || targetStr.includes(optText)) {
        el.selectedIndex = i;
        matched = true;
        break;
      }
    }

    if (!matched && el.options.length > 0) {
      el.value = String(targetValue);
    }

    dispatchInputEvents(el);
  }

  function setRadioValue(el, targetValue) {
    if (!el) return;
    const targetStr = String(targetValue).toLowerCase().trim();
    const radioName = el.getAttribute ? el.getAttribute('name') : null;

    if (radioName && radioName.trim()) {
      try {
        const selector = `input[type="radio"][name="${CSS.escape(radioName)}"], [role="radio"][name="${CSS.escape(radioName)}"]`;
        const radioGroup = document.querySelectorAll(selector);
        for (const radio of radioGroup) {
          const val = (radio.value || radio.getAttribute('data-value') || '').toLowerCase().trim();
          const label = (window.AIFormExtractor?.computeLabel(radio) || radio.getAttribute('aria-label') || '').toLowerCase();

          if (val === targetStr || label.includes(targetStr) || targetStr.includes(label)) {
            if (radio.tagName && radio.tagName.toLowerCase() === 'input') {
              radio.checked = true;
            }
            try { radio.click(); } catch (e) {}
            dispatchInputEvents(radio);
            return;
          }
        }
      } catch (e) {}
    }

    if (el.tagName && el.tagName.toLowerCase() === 'input') {
      el.checked = true;
    }
    try { el.click(); } catch (e) {}
    dispatchInputEvents(el);
  }

  function setCheckboxValue(el, targetValue) {
    if (!el) return;
    const val = String(targetValue).toLowerCase().trim();
    const label = (window.AIFormExtractor?.computeLabel(el) || (el.getAttribute && el.getAttribute('aria-label')) || '').toLowerCase().trim();
    const shouldCheck = val === 'true' || val === 'yes' || val === '1' || val === 'ya' || val === 'bersedia' || val === 'agree' || val === 'i agree' || (label && (val.includes(label) || label.includes(val)));

    if (el.tagName && el.tagName.toLowerCase() === 'input') {
      el.checked = shouldCheck;
    }
    if (shouldCheck) {
      try { el.click(); } catch (e) {}
    }
    dispatchInputEvents(el);
  }

  function dispatchInputEvents(el) {
    if (!el || !el.dispatchEvent) return;
    try {
      el.dispatchEvent(new Event('focus', { bubbles: true }));
      el.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
      el.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
      el.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: ' ' }));
      el.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, cancelable: true, key: ' ' }));
      el.dispatchEvent(new Event('blur', { bubbles: true, cancelable: true }));
    } catch (err) {
      console.warn('dispatchInputEvents warning:', err);
    }
  }

  function resetButton(btn, btnText) {
    btn.classList.remove('loading');
    btnText.innerText = 'Auto-Fill AI';
  }

  function showToast(message, type = 'info') {
    const toast = document.getElementById('ai-filler-toast');
    const toastMsg = document.getElementById('ai-filler-toast-msg');
    if (!toast || !toastMsg) return;

    toast.className = `show ${type}`;
    toastMsg.innerText = message;

    setTimeout(() => {
      toast.classList.remove('show');
    }, 4500);
  }

  // Listener untuk pesan dari Popup
  chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
    if (req.action === 'TRIGGER_PAGE_AUTOFILL') {
      handleAutoFill();
      sendResponse({ status: 'started' });
    }
  });
})();
