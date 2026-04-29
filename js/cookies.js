/**
 * RSA Cookie Consent Logic
 * Integrado com Google Consent Mode v2
 */

// ── Elementos ──
const banner      = document.getElementById('cookie-banner');
const overlay     = document.getElementById('cookie-modal-overlay');

const btnAccept   = document.getElementById('btn-accept');
const btnReject   = document.getElementById('btn-reject');
const btnManage   = document.getElementById('btn-manage');

const btnAcceptAll = document.getElementById('btn-accept-all');
const btnRejectAll = document.getElementById('btn-reject-all');
const btnSave      = document.getElementById('btn-save');

const prefFunctional = document.getElementById('pref-functional');
const prefAnalytics  = document.getElementById('pref-analytics');
const prefMarketing  = document.getElementById('pref-marketing');

// ── Funções principais ──

function hideBanner() {
    if (banner) banner.classList.add('hidden');
}

function closeModal() {
    if (overlay) overlay.classList.add('hidden');
}

function openModal() {
    if (overlay) overlay.classList.remove('hidden');
}

/**
 * Salva o consentimento no localStorage e aplica as configurações
 * @param {Object} preferences { functional: bool, analytics: bool, marketing: bool }
 */
function saveConsent(preferences) {
    localStorage.setItem('cookieConsent', JSON.stringify({
        ...preferences,
        timestamp: new Date().getTime()
    }));
    hideBanner();
    closeModal();
    applyConsent(preferences);
}

/**
 * Atualiza o Consent Mode do Google e outros scripts
 */
function applyConsent(preferences) {
    const consentObj = {
        'analytics_storage': preferences.analytics ? 'granted' : 'denied',
        'ad_storage': preferences.marketing ? 'granted' : 'denied',
        'ad_user_data': preferences.marketing ? 'granted' : 'denied',
        'ad_personalization': preferences.marketing ? 'granted' : 'denied',
        'functionality_storage': preferences.functional ? 'granted' : 'denied',
        'personalization_storage': preferences.functional ? 'granted' : 'denied',
        'security_storage': 'granted' // Essenciais sempre ativos
    };

    // Atualiza o Google Tag Manager / Analytics
    if (typeof gtag === 'function') {
        gtag('consent', 'update', consentObj);
        console.log('📊 RSA Consent Mode atualizado:', consentObj);
    }

    // Gatilhos para outros scripts (exemplo)
    if (preferences.analytics) {
        // Ativar scripts extras de analytics se houver
    }
}

function loadSavedPreferences() {
    const saved = localStorage.getItem('cookieConsent');
    if (!saved) return null;
    try {
        return JSON.parse(saved);
    } catch (e) {
        return null;
    }
}

// ── Inicialização ──

document.addEventListener('DOMContentLoaded', () => {
    const saved = loadSavedPreferences();

    if (saved) {
        // Usuário já escolheu antes: aplica e esconde o banner
        hideBanner();
        applyConsent(saved);

        // Preenche os toggles no modal
        if (prefFunctional) prefFunctional.checked = saved.functional || false;
        if (prefAnalytics)  prefAnalytics.checked  = saved.analytics  || false;
        if (prefMarketing)  prefMarketing.checked  = saved.marketing  || false;
    } else {
        // Mostra o banner se não houver consentimento salvo
        if (banner) banner.classList.remove('hidden');
    }
});

// ── Eventos do banner ──

if (btnAccept) {
    btnAccept.addEventListener('click', () => {
        saveConsent({ functional: true, analytics: true, marketing: true });
    });
}

if (btnReject) {
    btnReject.addEventListener('click', () => {
        saveConsent({ functional: false, analytics: false, marketing: false });
    });
}

if (btnManage) {
    btnManage.addEventListener('click', openModal);
}

// ── Eventos do modal ──

if (btnAcceptAll) {
    btnAcceptAll.addEventListener('click', () => {
        prefFunctional.checked = true;
        prefAnalytics.checked  = true;
        prefMarketing.checked  = true;
        saveConsent({ functional: true, analytics: true, marketing: true });
    });
}

if (btnRejectAll) {
    btnRejectAll.addEventListener('click', () => {
        prefFunctional.checked = false;
        prefAnalytics.checked  = false;
        prefMarketing.checked  = false;
        saveConsent({ functional: false, analytics: false, marketing: false });
    });
}

if (btnSave) {
    btnSave.addEventListener('click', () => {
        saveConsent({
            functional: prefFunctional.checked,
            analytics:  prefAnalytics.checked,
            marketing:  prefMarketing.checked,
        });
    });
}

// Fecha o modal ao clicar fora dele
if (overlay) {
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal();
    });
}