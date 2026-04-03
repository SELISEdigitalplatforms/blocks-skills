/**
 * i18n.js — Language detection + translation manager
 * Uses SELISE Blocks UILM API for translations.
 * Auto-detects browser language on first visit.
 *
 * USAGE:
 *   1. Set runtime env via window.__APP_ENV__ (see env.template.js)
 *   2. Mark HTML elements with data-i18n="TRANSLATION_KEY"
 *   3. Include this script after env.template.js
 *   4. Optionally add a #lang-switcher element (see SKILL.md §3A.4)
 */

const runtimeEnv = window.__APP_ENV__ || {};

function normalizeBaseUrl(url) {
  if (!url) return '';
  return url.replace(/\/+$/, '');
}

function resolveUilmConfig() {
  const projectKey = runtimeEnv.VITE_X_BLOCKS_KEY || '';
  const blocksApiBase =
    runtimeEnv.VITE_BLOCKS_API_URL ||
    runtimeEnv.VITE_API_BASE_URL ||
    '';

  return {
    projectKey,
    baseUrl: blocksApiBase.includes('/uilm/v1')
      ? normalizeBaseUrl(blocksApiBase)
      : `${normalizeBaseUrl(blocksApiBase)}/uilm/v1`
  };
}

const resolvedConfig = resolveUilmConfig();

// ─── CONFIGURATION ──────────────────────────────────────────────────────────
// Edit these values to match your project.
const UILM_CONFIG = {
  projectKey: resolvedConfig.projectKey,
  baseUrl: resolvedConfig.baseUrl,
  defaultCulture: 'en-US',
  modules: ['common'],                           // Add your module names here
  supportedCultures: {
    'en-US': { label: 'EN', name: 'English' },
    // Add more cultures as needed, e.g.:
    // 'de-DE': { label: 'DE', name: 'Deutsch' },
    // 'bn-BD': { label: 'বাং', name: 'বাংলা' },
  }
};
// ────────────────────────────────────────────────────────────────────────────

function hasUilmConfig() {
  return Boolean(UILM_CONFIG.projectKey && UILM_CONFIG.baseUrl);
}

/**
 * Detect if the user's browser language matches a supported culture.
 * Falls back to the default culture.
 */
function detectLanguage() {
  const langs = navigator.languages
    ? navigator.languages.map(l => l.toLowerCase())
    : [navigator.language.toLowerCase()];

  for (const [code] of Object.entries(UILM_CONFIG.supportedCultures)) {
    const prefix = code.split('-')[0].toLowerCase();
    if (langs.some(l => l.startsWith(prefix))) {
      return code;
    }
  }
  return UILM_CONFIG.defaultCulture;
}

class Translator {
  constructor() {
    const stored = localStorage.getItem('selectedLanguage');
    if (stored && UILM_CONFIG.supportedCultures[stored]) {
      this.currentCulture = stored;
    } else {
      this.currentCulture = detectLanguage();
      localStorage.setItem('selectedLanguage', this.currentCulture);
    }
    this.translations = {};
    this.originalContent = {};
  }

  async init() {
    this.snapshotOriginals();
    this.renderSwitcher();
    await this.loadTranslations(this.currentCulture);
    this.applyTranslations();
  }

  /** Save the original innerHTML of every [data-i18n] element */
  snapshotOriginals() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (!this.originalContent[key]) {
        this.originalContent[key] = el.innerHTML;
      }
    });
  }

  async loadTranslations(culture) {
    this.currentCulture = culture;
    localStorage.setItem('selectedLanguage', culture);
    this.translations = {};

    if (!hasUilmConfig()) {
      console.warn(
        'UILM configuration missing. Define VITE_X_BLOCKS_KEY and VITE_BLOCKS_API_URL in runtime env.'
      );
      return;
    }

    try {
      const fetches = UILM_CONFIG.modules.map(async (mod) => {
        const url = `${UILM_CONFIG.baseUrl}/Key/GetUilmFile?ProjectKey=${UILM_CONFIG.projectKey}&Language=${culture}&ModuleName=${mod}`;
        const res = await fetch(url, {
          headers: { 'x-blocks-key': UILM_CONFIG.projectKey }
        });
        if (res.ok) {
          const text = await res.text();
          if (text && text.trim()) {
            const data = JSON.parse(text);
            Object.assign(this.translations, data);
          }
        }
      });
      await Promise.all(fetches);
    } catch (err) {
      console.warn('Translation load failed, keeping current content:', err);
    }
  }

  applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const translated = this.translations[key];
      if (translated) {
        el.innerHTML = translated;
      } else if (this.originalContent[key]) {
        el.innerHTML = this.originalContent[key];
      }
    });

    // Update <html lang> and dir attributes
    const langCode = this.currentCulture.split('-')[0];
    document.documentElement.lang = langCode;
    document.documentElement.dir = 'ltr'; // Change to 'rtl' for Arabic/Hebrew if needed

    this.updateSwitcherState();
  }

  async setLanguage(culture) {
    if (culture === this.currentCulture) return;
    const switcher = document.getElementById('lang-switcher');
    if (switcher) switcher.classList.add('loading');

    await this.loadTranslations(culture);
    this.applyTranslations();

    // Re-create Lucide icons in case translations replaced icon markup
    if (typeof lucide !== 'undefined') lucide.createIcons();

    if (switcher) switcher.classList.remove('loading');
  }

  renderSwitcher() {
    const switcher = document.getElementById('lang-switcher');
    if (!switcher) return;

    switcher.querySelectorAll('.lang-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.setLanguage(btn.dataset.lang);
      });
    });

    this.updateSwitcherState();
  }

  updateSwitcherState() {
    const btns = document.querySelectorAll('#lang-switcher .lang-btn');
    btns.forEach(btn => {
      const isActive = btn.dataset.lang === this.currentCulture;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-checked', isActive);
    });
  }
}

// Boot
const translator = new Translator();
document.addEventListener('DOMContentLoaded', () => translator.init());
