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
      btn.classList.add('loading');
      btnText.innerText = 'Menganalisis Loker & CV...';

      // 2. Ekstrak seluruh field form + Job Description di halaman
      const extracted = window.AIFormExtractor.extractFormFields();

      if (!extracted.fields || extracted.fields.length === 0) {
        showToast('Tidak ada kolom form aktif yang terdeteksi di halaman ini.', 'error');
        resetButton(btn, btnText);
        return;
      }

      btnText.innerText = `Menyusun Jawaban (${extracted.fields.length} Kolom)...`;

      // 3. Kirim ke Background Service Worker untuk diproses AI Deep Reasoning
      chrome.runtime.sendMessage(
        {
          action: 'AUTOFILL_FORM',
          fields: extracted.fields,
          pageTitle: extracted.pageTitle,
          jobContext: extracted.jobContext
        },
        response => {
          resetButton(btn, btnText);

          if (chrome.runtime.lastError) {
            showToast(`Gagal: ${chrome.runtime.lastError.message}`, 'error');
            return;
          }

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
   * Menginjeksikan nilai ke elemen DOM dengan event dispatch lengkap (kompatibel React/Vue)
   */
  function applyValuesToForm(fieldMapping) {
    if (!fieldMapping || typeof fieldMapping !== 'object') return 0;

    let filledCount = 0;

    for (const [fieldId, value] of Object.entries(fieldMapping)) {
      if (value === undefined || value === null || value === '') continue;

      const el = document.querySelector(`[data-ai-field-id="${fieldId}"]`);
      if (!el) continue;

      const tag = el.tagName.toLowerCase();
      const type = (el.getAttribute('type') || '').toLowerCase();

      try {
        if (tag === 'select') {
          setSelectValue(el, value);
        } else if (type === 'radio') {
          setRadioValue(el, value);
        } else if (type === 'checkbox') {
          setCheckboxValue(el, value);
        } else if (el.isContentEditable) {
          el.innerText = value;
          dispatchInputEvents(el);
        } else {
          setInputValue(el, value);
        }

        // Tambahkan efek visual highlight hijau
        el.classList.add('ai-field-filled-highlight');
        setTimeout(() => {
          el.classList.remove('ai-field-filled-highlight');
        }, 3500);

        filledCount++;
      } catch (err) {
        console.warn(`Gagal mengisi field ${fieldId}:`, err);
      }
    }

    return filledCount;
  }

  function setInputValue(el, value) {
    const isTextarea = el.tagName.toLowerCase() === 'textarea';
    const proto = isTextarea ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
    const valueSetter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;

    if (valueSetter) {
      valueSetter.call(el, value);
    } else {
      el.value = value;
    }

    dispatchInputEvents(el);
  }

  function setSelectValue(el, targetValue) {
    const targetStr = String(targetValue).toLowerCase().trim();
    let matched = false;

    for (let i = 0; i < el.options.length; i++) {
      const opt = el.options[i];
      const optVal = opt.value.toLowerCase().trim();
      const optText = opt.text.toLowerCase().trim();

      if (optVal === targetStr || optText === targetStr || optText.includes(targetStr) || targetStr.includes(optText)) {
        el.selectedIndex = i;
        matched = true;
        break;
      }
    }

    if (!matched && el.options.length > 0) {
      el.value = targetValue;
    }

    dispatchInputEvents(el);
  }

  function setRadioValue(el, targetValue) {
    const targetStr = String(targetValue).toLowerCase().trim();
    const radioName = el.getAttribute('name');

    if (radioName) {
      const radioGroup = document.querySelectorAll(`input[type="radio"][name="${CSS.escape(radioName)}"]`);
      for (const radio of radioGroup) {
        const val = radio.value.toLowerCase().trim();
        const label = window.AIFormExtractor?.computeLabel(radio)?.toLowerCase() || '';

        if (val === targetStr || label.includes(targetStr) || targetStr.includes(label)) {
          radio.checked = true;
          dispatchInputEvents(radio);
          break;
        }
      }
    } else {
      el.checked = true;
      dispatchInputEvents(el);
    }
  }

  function setCheckboxValue(el, targetValue) {
    const val = String(targetValue).toLowerCase().trim();
    el.checked = val === 'true' || val === 'yes' || val === '1' || val === 'ya';
    dispatchInputEvents(el);
  }

  function dispatchInputEvents(el) {
    el.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
    el.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
    el.dispatchEvent(new Event('blur', { bubbles: true, cancelable: true }));
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
