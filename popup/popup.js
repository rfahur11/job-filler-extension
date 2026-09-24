/**
 * Universal AI Form Filler - Popup Logic (Comprehensive Database Edition)
 * Mengelola seluruh identitas diri, NIK, Agama, riwayat karir, pendidikan, keahlian, preferensi, dan bank Q&A.
 */

document.addEventListener('DOMContentLoaded', async () => {
  setupTabs();
  await loadStoredData();
  setupEventListeners();
  setupCVDropzone();
});

function setupTabs() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));

      btn.classList.add('active');
      const target = btn.getAttribute('data-tab');
      const targetEl = document.getElementById(target);
      if (targetEl) targetEl.classList.add('active');
    });
  });
}

async function loadStoredData() {
  const { cvData, aiConfig } = await chrome.storage.local.get(['cvData', 'aiConfig']);

  if (cvData) {
    populateFormWithCV(cvData);
  }

  if (aiConfig) {
    let activeModel = aiConfig.model || 'gemini-3.1-flash-lite';
    if (activeModel.includes('2.0') || activeModel.includes('1.5') || activeModel.includes('3.6') || activeModel === 'gemini-2.5-flash') {
      activeModel = 'gemini-3.1-flash-lite';
      aiConfig.model = activeModel;
      await chrome.storage.local.set({ aiConfig });
    }

    setValue('ai-provider', aiConfig.provider || 'gemini');
    setValue('ai-apiKey', aiConfig.apiKey || '');
    setValue('ai-groqKey', aiConfig.groqApiKey || '');
    setValue('ai-model', activeModel);
    setValue('ai-endpoint', aiConfig.customEndpoint || 'http://localhost:11434');
    updateProviderVisibility(aiConfig.provider || 'gemini');
  } else {
    setValue('ai-model', 'gemini-3.1-flash-lite');
  }
}

function populateFormWithCV(cvData) {
  if (!cvData) return;

  // 1. Data Pribadi & Kontak
  setValue('p-fullName', cvData.personal?.fullName);
  setValue('p-nickname', cvData.personal?.nickname || cvData.personal?.fullName?.split(' ')[0]);
  setValue('p-idCardNumber', cvData.personal?.idCardNumber || '3301203010020001');
  setValue('p-religion', cvData.personal?.religion || 'Islam');
  setValue('p-email', cvData.personal?.email);
  setValue('p-phone', cvData.personal?.phone);
  setValue('p-birthDate', cvData.personal?.birthDate);
  setValue('p-gender', cvData.personal?.gender);
  setValue('p-nationality', cvData.personal?.nationality || 'Indonesia');
  setValue('p-maritalStatus', cvData.personal?.maritalStatus);
  setValue('p-address', cvData.personal?.address);
  setValue('p-city', cvData.personal?.city);
  setValue('p-province', cvData.personal?.province);
  setValue('p-postalCode', cvData.personal?.postalCode);

  // Tautan
  const links = cvData.links || cvData.personal || {};
  setValue('p-linkedin', links.linkedin);
  setValue('p-github', links.github);
  setValue('p-portfolio', links.portfolio);
  setValue('p-website', links.website);

  // 2. Karir & Riwayat
  setValue('p-summary', cvData.summary);

  // Pengalaman Utama (Experience[0])
  const firstExp = cvData.experience?.[0] || {};
  setValue('exp-role', firstExp.role);
  setValue('exp-company', firstExp.company);
  setValue('exp-period', `${firstExp.startDate || ''} - ${firstExp.endDate || ''}`);
  setValue('exp-location', firstExp.location || firstExp.employmentType);
  setValue('exp-desc', firstExp.description || firstExp.achievements);

  // Pendidikan Utama (Education[0])
  const firstEdu = cvData.education?.[0] || {};
  setValue('edu-degree', firstEdu.degree || firstEdu.major);
  setValue('edu-institution', firstEdu.institution);
  setValue('edu-gpa', firstEdu.gpa);
  setValue('edu-year', firstEdu.graduationYear);

  // Sertifikasi & Proyek
  if (cvData.certifications) {
    const certText = Array.isArray(cvData.certifications) 
      ? cvData.certifications.map(c => `${c.name || ''} (${c.issuer || ''})`).filter(Boolean).join(', ')
      : cvData.certifications;
    setValue('p-certifications', certText);
  }

  if (cvData.projects) {
    const projText = Array.isArray(cvData.projects)
      ? cvData.projects.map(p => `${p.name || ''} - ${p.description || ''}`).filter(Boolean).join('; ')
      : cvData.projects;
    setValue('p-projects', projText);
  }

  // 3. Skills & Gaji
  const techSkills = Array.isArray(cvData.skills?.technical) ? cvData.skills.technical.join(', ') : cvData.skills?.technical;
  const softSkills = Array.isArray(cvData.skills?.soft) ? cvData.skills.soft.join(', ') : cvData.skills?.soft;
  let langSkills = cvData.skills?.languages;
  if (Array.isArray(langSkills)) {
    langSkills = langSkills.map(l => typeof l === 'object' ? `${l.language} (${l.proficiency})` : l).join(', ');
  }

  setValue('p-skillsTech', techSkills);
  setValue('p-skillsSoft', softSkills);
  setValue('p-skillsLanguages', langSkills);

  setValue('p-expectedSalary', cvData.preferences?.expectedSalary);
  setValue('p-currentSalary', cvData.preferences?.currentSalary);
  setValue('p-yearsExp', cvData.preferences?.yearsOfExperience);
  setValue('p-noticePeriod', cvData.preferences?.noticePeriod);
  setValue('p-remotePref', cvData.preferences?.remotePreference);
  setValue('p-relocate', cvData.preferences?.willingToRelocate);
  setValue('p-workAuth', cvData.preferences?.workAuthorization || 'Warga Negara Indonesia');

  // 4. Bank Jawaban Screening (Q&A)
  setValue('qa-whyJoin', cvData.customAnswers?.whyJoinUs);
  setValue('qa-strengths', cvData.customAnswers?.strengths);
  setValue('qa-weaknesses', cvData.customAnswers?.weaknesses);
  setValue('qa-project', cvData.customAnswers?.challengingProject);
  setValue('qa-whyLeave', cvData.customAnswers?.whyLeaveLastJob);
  setValue('qa-leadership', cvData.customAnswers?.leadershipExperience);
}

function getCVDataFromForm(existingCv = {}) {
  const expList = existingCv.experience || [];
  if (expList.length === 0) {
    expList.push({});
  }
  expList[0] = {
    ...expList[0],
    role: getValue('exp-role'),
    company: getValue('exp-company'),
    location: getValue('exp-location'),
    description: getValue('exp-desc'),
    isCurrent: true
  };

  const eduList = existingCv.education || [];
  if (eduList.length === 0) {
    eduList.push({});
  }
  eduList[0] = {
    ...eduList[0],
    degree: getValue('edu-degree'),
    institution: getValue('edu-institution'),
    gpa: getValue('edu-gpa'),
    graduationYear: getValue('edu-year')
  };

  return {
    ...existingCv,
    personal: {
      fullName: getValue('p-fullName'),
      nickname: getValue('p-nickname'),
      idCardNumber: getValue('p-idCardNumber'),
      religion: getValue('p-religion'),
      email: getValue('p-email'),
      phone: getValue('p-phone'),
      whatsapp: getValue('p-phone'),
      birthDate: getValue('p-birthDate'),
      gender: getValue('p-gender'),
      nationality: getValue('p-nationality'),
      maritalStatus: getValue('p-maritalStatus'),
      address: getValue('p-address'),
      city: getValue('p-city'),
      province: getValue('p-province'),
      postalCode: getValue('p-postalCode'),
      country: 'Indonesia'
    },
    links: {
      linkedin: getValue('p-linkedin'),
      github: getValue('p-github'),
      portfolio: getValue('p-portfolio'),
      website: getValue('p-website')
    },
    summary: getValue('p-summary'),
    experience: expList,
    education: eduList,
    certifications: getValue('p-certifications') ? [{ name: getValue('p-certifications') }] : existingCv.certifications || [],
    projects: getValue('p-projects') ? [{ name: getValue('p-projects') }] : existingCv.projects || [],
    skills: {
      technical: getValue('p-skillsTech'),
      soft: getValue('p-skillsSoft'),
      languages: getValue('p-skillsLanguages')
    },
    preferences: {
      expectedSalary: getValue('p-expectedSalary'),
      currentSalary: getValue('p-currentSalary'),
      currency: 'IDR',
      yearsOfExperience: getValue('p-yearsExp'),
      noticePeriod: getValue('p-noticePeriod'),
      remotePreference: getValue('p-remotePref'),
      willingToRelocate: getValue('p-relocate'),
      workAuthorization: getValue('p-workAuth'),
      employmentType: 'Full-time'
    },
    customAnswers: {
      whyJoinUs: getValue('qa-whyJoin'),
      strengths: getValue('qa-strengths'),
      weaknesses: getValue('qa-weaknesses'),
      challengingProject: getValue('qa-project'),
      whyLeaveLastJob: getValue('qa-whyLeave'),
      leadershipExperience: getValue('qa-leadership'),
      careerGoals: existingCv.customAnswers?.careerGoals || ''
    }
  };
}

function setupCVDropzone() {
  const dropzone = document.getElementById('cv-dropzone');
  const fileInput = document.getElementById('input-cv-file');
  const loadingBanner = document.getElementById('cv-upload-loading');
  const loadingText = document.getElementById('cv-loading-text');

  if (!dropzone || !fileInput) return;

  ['dragenter', 'dragover'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.add('dragover');
    });
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.remove('dragover');
    });
  });

  dropzone.addEventListener('drop', (e) => {
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) processCVFile(files[0]);
  });

  fileInput.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (file) processCVFile(file);
  });

  async function processCVFile(file) {
    const { aiConfig } = await chrome.storage.local.get('aiConfig');
    if (!aiConfig || (!aiConfig.apiKey && aiConfig.provider === 'gemini')) {
      alert('⚠️ Masukkan Gemini API Key di tab "Setting AI & Backup" terlebih dahulu.');
      document.querySelector('[data-tab="tab-ai-tools"]').click();
      return;
    }

    loadingBanner.classList.remove('hidden');
    loadingText.innerText = `🤖 AI sedang mengekstrak database dari "${file.name}"...`;

    try {
      const mimeType = file.type || (file.name.endsWith('.pdf') ? 'application/pdf' : 'text/plain');
      const base64Data = await fileToBase64(file);

      chrome.runtime.sendMessage(
        {
          action: 'PARSE_CV_DOCUMENT',
          fileBase64: base64Data,
          mimeType: mimeType,
          fileName: file.name
        },
        async (response) => {
          loadingBanner.classList.add('hidden');

          if (chrome.runtime.lastError) {
            alert(`Error: ${chrome.runtime.lastError.message}`);
            return;
          }

          if (!response || !response.success) {
            alert(`Gagal mengekstrak CV: ${response?.error || 'Unknown error'}`);
            return;
          }

          const parsedCv = response.data;
          populateFormWithCV(parsedCv);
          showSaveStatus('✨ Seluruh Database CV Berhasil Terisi Otomatis!');
        }
      );
    } catch (err) {
      loadingBanner.classList.add('hidden');
      alert(`Gagal memproses file: ${err.message}`);
    }
  }
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      const base64Clean = result.includes(',') ? result.split(',')[1] : result;
      resolve(base64Clean);
    };
    reader.onerror = error => reject(error);
    reader.readAsDataURL(file);
  });
}

function setupEventListeners() {
  const providerSelect = document.getElementById('ai-provider');
  providerSelect.addEventListener('change', (e) => {
    updateProviderVisibility(e.target.value);
  });

  const btnToggleKey = document.getElementById('btn-toggle-key');
  const apiKeyInput = document.getElementById('ai-apiKey');
  btnToggleKey.addEventListener('click', () => {
    if (apiKeyInput.type === 'password') {
      apiKeyInput.type = 'text';
      btnToggleKey.innerText = '🔒';
    } else {
      apiKeyInput.type = 'password';
      btnToggleKey.innerText = '👁️';
    }
  });

  const btnToggleGroqKey = document.getElementById('btn-toggle-groq-key');
  const groqKeyInput = document.getElementById('ai-groqKey');
  if (btnToggleGroqKey && groqKeyInput) {
    btnToggleGroqKey.addEventListener('click', () => {
      if (groqKeyInput.type === 'password') {
        groqKeyInput.type = 'text';
        btnToggleGroqKey.innerText = '🔒';
      } else {
        groqKeyInput.type = 'password';
        btnToggleGroqKey.innerText = '👁️';
      }
    });
  }

  const btnSave = document.getElementById('btn-save-all');
  btnSave.addEventListener('click', async () => {
    await saveAllData();
    showSaveStatus('✅ Semua perubahan database & API Key tersimpan!');
  });

  const btnQuickFill = document.getElementById('btn-quick-fill-tab');
  btnQuickFill.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      chrome.tabs.sendMessage(tab.id, { action: 'TRIGGER_PAGE_AUTOFILL' });
      window.close();
    }
  });

  const btnTestAi = document.getElementById('btn-test-ai');
  const testStatus = document.getElementById('ai-test-status');
  btnTestAi.addEventListener('click', async () => {
    testStatus.className = 'status-indicator';
    testStatus.innerText = '⏳ Menguji koneksi...';

    const config = getAIConfigFromForm();
    chrome.runtime.sendMessage({ action: 'TEST_API_CONNECTION', config }, (response) => {
      if (response && response.success) {
        testStatus.className = 'status-indicator success';
        testStatus.innerText = '✅ Terhubung Berhasil (< 1 detik)!';
      } else {
        testStatus.className = 'status-indicator error';
        testStatus.innerText = `❌ Gagal: ${response?.error || 'Koneksi error'}`;
      }
    });
  });

  const btnExport = document.getElementById('btn-export-cv');
  btnExport.addEventListener('click', async () => {
    const { cvData } = await chrome.storage.local.get('cvData');
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(cvData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `database-cv-lengkap-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  });

  const inputImport = document.getElementById('input-import-cv');
  inputImport.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const importedCv = JSON.parse(event.target.result);
        await chrome.storage.local.set({ cvData: importedCv });
        await loadStoredData();
        showSaveStatus('✅ Database profil berhasil di-import!');
      } catch (err) {
        alert('File JSON tidak valid: ' + err.message);
      }
    };
    reader.readAsText(file);
  });

  const btnReset = document.getElementById('btn-reset-cv');
  btnReset.addEventListener('click', () => {
    if (confirm('Reset seluruh database profil ke template default lengkap?')) {
      chrome.runtime.sendMessage({ action: 'RESET_DEFAULT_CV' }, async () => {
        await loadStoredData();
        showSaveStatus('✅ Reset ke template awal sukses!');
      });
    }
  });

  const btnOpenDemo = document.getElementById('btn-open-demo');
  btnOpenDemo.addEventListener('click', () => {
    const demoUrl = chrome.runtime.getURL('demo/test-form.html');
    chrome.tabs.create({ url: demoUrl });
  });
}

function updateProviderVisibility(provider) {
  const groupKey = document.getElementById('group-apiKey');
  const groupGroqKey = document.getElementById('group-groqKey');
  const groupEndpoint = document.getElementById('group-endpoint');
  const modelInput = document.getElementById('ai-model');

  if (provider === 'gemini') {
    groupKey.classList.remove('hidden');
    if (groupGroqKey) groupGroqKey.classList.remove('hidden');
    groupEndpoint.classList.add('hidden');
    if (!modelInput.value || modelInput.value.includes('qwen') || modelInput.value.includes('llama') || modelInput.value.includes('2.0') || modelInput.value.includes('3.6')) {
      modelInput.value = 'gemini-3.1-flash-lite';
    }
  } else if (provider === 'groq') {
    groupKey.classList.add('hidden');
    if (groupGroqKey) groupGroqKey.classList.remove('hidden');
    groupEndpoint.classList.add('hidden');
    modelInput.value = 'llama-3.3-70b-versatile';
  } else if (provider === 'ollama') {
    groupKey.classList.add('hidden');
    if (groupGroqKey) groupGroqKey.classList.add('hidden');
    groupEndpoint.classList.remove('hidden');
    modelInput.value = 'qwen2.5:7b';
  } else if (provider === 'openai_compatible') {
    groupKey.classList.remove('hidden');
    if (groupGroqKey) groupGroqKey.classList.add('hidden');
    groupEndpoint.classList.remove('hidden');
    modelInput.value = 'google/gemini-flash-1.5';
  }
}

function getAIConfigFromForm() {
  return {
    provider: getValue('ai-provider') || 'gemini',
    apiKey: getValue('ai-apiKey'),
    groqApiKey: getValue('ai-groqKey') || '',
    groqModel: 'openai/gpt-oss-120b',
    model: getValue('ai-model') || 'gemini-3.1-flash-lite',
    customEndpoint: getValue('ai-endpoint') || 'http://localhost:11434'
  };
}

async function saveAllData() {
  const { cvData: existingCv } = await chrome.storage.local.get('cvData');
  const cvData = getCVDataFromForm(existingCv || {});
  const aiConfig = getAIConfigFromForm();

  await chrome.storage.local.set({ cvData, aiConfig });
}

function getValue(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : '';
}

function setValue(id, val) {
  const el = document.getElementById(id);
  if (el && val !== undefined && val !== null) {
    el.value = val;
  }
}

function showSaveStatus(msg) {
  const el = document.getElementById('save-status');
  if (!el) return;
  el.innerText = msg;
  setTimeout(() => {
    el.innerText = '💾 Tersimpan';
  }, 3500);
}
