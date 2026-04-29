# Key-Mode Debugging Reference

Key mode shows **translation keys** instead of translated values, toggled via the UILM browser extension. This enables quick auditing of which translation keys are being used in the UI.

```
Normal:  t('HERO_TITLE')  →  "Stop wiring. Start building."
Key:     t('HERO_TITLE')  →  "HERO_TITLE"
```

## How It Works

The browser extension communicates with the app via `window.postMessage`. The app listens for messages and toggles a global flag. The `t()` function is wrapped to check this flag and return the key instead of the translated value.

## `loadTranslations` Function

The `loadTranslations` function fetches translations from the API and registers them in i18next. It adds translations to **both** the `'translation'` (default) namespace and the module-specific namespace.

> [!IMPORTANT]
> Adding to the `'translation'` namespace is what makes `useTranslation()` work with no arguments. The `'translation'` namespace is the default namespace — when you call `useTranslation()` with no argument, i18next resolves keys from `'translation'`. If translations are only added to a module-specific namespace (e.g., `'home'`), `useTranslation()` will not find them.

```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getUilmFile } from '@/lib/language.service';

declare module 'i18next' {
  interface CustomTypeOptions {
    returnNull: false;
  }
}

i18n.use(initReactI18next).init({
  lng: 'en-US',
  fallbackLng: 'en-US',
  interpolation: { escapeValue: false },
  returnNull: false,
  resources: {},
});

export const loadTranslations = async (
  language: string,
  moduleName: string
): Promise<void> => {
  try {
    const translations = await getUilmFile({ language, moduleName });
    if (!translations) return;

    i18n.addResourceBundle(language, 'translation', translations, true, true);
    i18n.addResourceBundle(language, moduleName, translations, true, true);
  } catch (error) {
    console.error(`Failed to load translations for module ${moduleName}:`, error);
  }
};
```

## Key-Mode Toggle

### 1. Global Flag Declaration

Add to the top-level `i18n.ts` or a shared types file:

```typescript
declare global {
  interface Window {
    __i18nKeyMode?: boolean;
  }
}

if (typeof window !== 'undefined') {
  window.__i18nKeyMode = false;
}
```

### 2. Wrap the `t()` Function

Override `i18n.t` after initialization:

```typescript
const originalT = i18n.t.bind(i18n);

(i18n as any).t = (key: string | string[], options?: Record<string, unknown>) => {
  if (typeof window !== 'undefined' && window.__i18nKeyMode) {
    if (Array.isArray(key)) return key[0];
    return key;
  }
  return originalT(key, options);
};
```

### 3. Listen for Browser Extension Messages

```typescript
if (typeof window !== 'undefined') {
  window.addEventListener('message', (event) => {
    if (event.source !== window) return;
    if (event.origin !== window.location.origin) return;
    const { data } = event;
    if (!data || typeof data !== 'object') return;

    const { action, keymode } = data as { action?: string; keymode?: boolean };
    if (action === 'keymode' && typeof keymode === 'boolean') {
      const previous = window.__i18nKeyMode;
      window.__i18nKeyMode = keymode;

      if (previous !== keymode) {
        (i18n as any).emit('languageChanged', i18n.language);
      }
    }
  });
}
```

## Browser Extension Message Format

The UILM browser extension sends:

```json
{ "action": "keymode", "keymode": true }
{ "action": "keymode", "keymode": false }
```

## Security Notes

- `event.source !== window` — prevents messages from iframes or other sources
- `event.origin !== window.location.origin` — prevents cross-origin message injection
- `!data || typeof data !== 'object'` — prevents errors when `event.data` is null or a non-object
- `typeof window !== 'undefined'` — ensures all window checks only run on the client side
- `typeof keymode === 'boolean'` — ensures the value is actually a boolean before using it

## Integration with React

The wrapped `t()` function works with all `useTranslation()` hooks automatically — no changes needed in components. When `languageChanged` is emitted, React will re-render all subscribed components with the key-mode flag active.

## Quick Test

Open browser DevTools and run:

```javascript
window.__i18nKeyMode = true;
window.postMessage({ action: 'keymode', keymode: true }, '*');
```

All translated text should now show key names instead of values.
