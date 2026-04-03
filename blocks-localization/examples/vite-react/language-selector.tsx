/**
 * Language Selector Component (Vite + React)
 *
 * A dropdown menu that allows users to switch between available languages.
 * Uses the LanguageContext for state management.
 *
 * Dependencies: lucide-react (for icons). Replace with your own icons if not using lucide.
 */

import { useState } from 'react';
import { useLanguageContext } from './language-context';

export const LanguageSelector = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { currentLanguage, setLanguage, availableLanguages, isLoading } = useLanguageContext();

  const currentLangName =
    availableLanguages?.find((lang) => lang.languageCode === currentLanguage)?.languageName ||
    currentLanguage;

  const changeLanguage = async (newLanguageCode: string) => {
    setIsOpen(false);
    if (newLanguageCode === currentLanguage) return;
    await setLanguage(newLanguageCode);
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        aria-label={`Language: ${currentLangName}`}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 0.75rem',
          border: '1px solid #ddd',
          borderRadius: '0.375rem',
          background: 'transparent',
          cursor: isLoading ? 'wait' : 'pointer',
          fontSize: '0.875rem',
        }}
      >
        🌐 {currentLangName} {isOpen ? '▲' : '▼'}
      </button>

      {isOpen && (
        <div
          role="listbox"
          style={{
            position: 'absolute',
            right: 0,
            marginTop: '0.5rem',
            width: '10rem',
            background: '#fff',
            border: '1px solid #ddd',
            borderRadius: '0.5rem',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            zIndex: 50,
            overflow: 'hidden',
          }}
        >
          {isLoading && (
            <div style={{ padding: '0.5rem 1rem', color: '#999', fontSize: '0.875rem' }}>
              Loading…
            </div>
          )}
          {!isLoading &&
            availableLanguages.map((lang) => (
              <button
                key={lang.languageCode || lang.itemId}
                onClick={() => changeLanguage(lang.languageCode)}
                role="option"
                aria-selected={lang.languageCode === currentLanguage}
                style={{
                  width: '100%',
                  padding: '0.5rem 1rem',
                  border: 'none',
                  background: lang.languageCode === currentLanguage ? '#f0f0f0' : 'transparent',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: lang.languageCode === currentLanguage ? 600 : 400,
                }}
              >
                {lang.languageName}
                {lang.isDefault && ' (Default)'}
                {lang.languageCode === currentLanguage && ' ✓'}
              </button>
            ))}
          {!isLoading && availableLanguages.length === 0 && (
            <div style={{ padding: '0.5rem 1rem', color: '#999', fontSize: '0.875rem' }}>
              No languages available
            </div>
          )}
        </div>
      )}
    </div>
  );
};
