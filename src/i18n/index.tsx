import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react';
import { useAppStore } from '@/store/appStore';
import { en, type TranslationKey } from './en';
import { hi } from './hi';
import type { Lang } from './types';

export type { Lang } from './types';
export type { TranslationKey } from './en';

export type Dictionary = Partial<Record<TranslationKey, string>>;
export type Vars = Record<string, string | number>;

function interpolate(template: string, vars?: Vars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in vars ? String(vars[key]) : match,
  );
}

/**
 * Builds a translator for a dictionary. Missing Hindi keys fall back to
 * English and log a warning in development only.
 */
export function createTranslator(dictionary: Dictionary, lang: Lang) {
  return (key: TranslationKey, vars?: Vars): string => {
    const found = dictionary[key];

    if (found === undefined) {
      if (import.meta.env.DEV) {
        console.warn(`[i18n] Missing ${lang} key: ${key}`);
      }
      return interpolate(en[key] ?? key, vars);
    }

    return interpolate(found, vars);
  };
}

interface I18nValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: TranslationKey, vars?: Vars) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const lang = useAppStore((state) => state.settings.lang);
  const setLang = useAppStore((state) => state.setLang);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const t = useMemo(
    () => createTranslator(lang === 'hi' ? hi : en, lang),
    [lang],
  );

  const value = useMemo<I18nValue>(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const value = useContext(I18nContext);
  if (!value) throw new Error('useI18n must be used inside I18nProvider');
  return value;
}
