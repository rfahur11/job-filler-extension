/**
 * Universal AI Form Filler - Background Service Worker (Manifest V3)
 * Menjembatani panggilan AI API dari content script & popup serta mengelola persistent storage.
 */

import { AIEngine } from '../lib/ai-engine.js';

// Inisialisasi default state saat ekstensi pertama kali dipasang
chrome.runtime.onInstalled.addListener(async () => {
  console.log('⚡ AI Job Form Filler Extension installed.');

  // Cek apakah CV sudah tersimpan
  const { cvData } = await chrome.storage.local.get('cvData');
  if (!cvData) {
    try {
      const response = await fetch(chrome.runtime.getURL('lib/default-cv.json'));
      const defaultCv = await response.json();
      await chrome.storage.local.set({ cvData: defaultCv });
      console.log('✅ Default CV data loaded into storage.');
    } catch (e) {
      console.error('Gagal memuat default-cv.json:', e);
    }
  }

  // Cek konfigurasi AI & auto-upgrade model ke varian Flash-Lite ultra cepat + Groq Fallback
  const { aiConfig } = await chrome.storage.local.get('aiConfig');

  if (!aiConfig) {
    await chrome.storage.local.set({
      aiConfig: {
        provider: 'gemini',
        apiKey: '',
        model: 'gemini-3.1-flash-lite',
        groqApiKey: '',
        groqModel: 'openai/gpt-oss-120b',
        customEndpoint: 'http://localhost:11434'
      }
    });
    console.log('✅ Default AI config initialized.');
  } else {
    let updated = false;
    if (!aiConfig.model || aiConfig.model.includes('2.0') || aiConfig.model.includes('1.5') || aiConfig.model.includes('3.6') || aiConfig.model === 'gemini-2.5-flash') {
      aiConfig.model = 'gemini-3.1-flash-lite';
      updated = true;
    }
    if (aiConfig.groqApiKey === undefined) {
      aiConfig.groqApiKey = '';
      aiConfig.groqModel = 'openai/gpt-oss-120b';
      updated = true;
    }
    if (updated) {
      await chrome.storage.local.set({ aiConfig });
      console.log('✅ Auto-updated AI config.');
    }
  }
});

// Listener untuk pesan dari Content Script dan Popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'AUTOFILL_FORM') {
    handleAutofillRequest(request)
      .then(res => sendResponse({ success: true, data: res }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true; // Asynchronous sendResponse
  }

  if (request.action === 'PARSE_CV_DOCUMENT') {
    handleParseCvDocument(request)
      .then(res => sendResponse({ success: true, data: res }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }

  if (request.action === 'TEST_API_CONNECTION') {
    AIEngine.testConnection(request.config)
      .then(() => sendResponse({ success: true }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }

  if (request.action === 'RESET_DEFAULT_CV') {
    fetch(chrome.runtime.getURL('lib/default-cv.json'))
      .then(res => res.json())
      .then(async defaultCv => {
        await chrome.storage.local.set({ cvData: defaultCv });
        sendResponse({ success: true, data: defaultCv });
      })
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }
});

/**
 * Mengekstrak data profil dari file CV yang diupload (PDF / Text)
 */
async function handleParseCvDocument(request) {
  const { fileBase64, mimeType } = request;
  const { aiConfig } = await chrome.storage.local.get('aiConfig');

  if (!aiConfig || (!aiConfig.apiKey && aiConfig.provider === 'gemini')) {
    throw new Error('API Key Gemini belum diisi. Silakan masukkan API Key di tab "Setting AI" terlebih dahulu.');
  }

  const parsedCv = await AIEngine.parseCVFromDocument(fileBase64, mimeType, aiConfig);

  // Simpan hasil ekstraksi otomatis ke storage
  await chrome.storage.local.set({ cvData: parsedCv });

  return parsedCv;
}

/**
 * Memproses permintaan autofill dari content script dengan Deep Reasoning
 */
async function handleAutofillRequest(request) {
  const { fields, jobContext } = request;

  const storage = await chrome.storage.local.get(['cvData', 'aiConfig']);
  const cvData = storage.cvData;
  const aiConfig = storage.aiConfig;

  if (!cvData) {
    throw new Error('Data CV belum tersedia. Silakan upload CV Anda di popup ekstensi.');
  }

  if (!aiConfig || (!aiConfig.apiKey && aiConfig.provider === 'gemini')) {
    throw new Error('API Key Gemini belum diisi. Silakan buka Pengaturan di Popup ekstensi.');
  }

  // Panggil AI Engine dengan Deep Job Context
  const result = await AIEngine.matchFormFields(
    fields,
    cvData,
    jobContext,
    aiConfig
  );

  return result;
}
