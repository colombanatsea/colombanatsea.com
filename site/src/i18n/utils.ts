import { ui, defaultLang, routes, type Lang } from './translations';

export function getLangFromUrl(url: URL): Lang {
  const [, , lang] = url.pathname.split('/');
  if (lang in ui) return lang as Lang;
  return defaultLang;
}

export function useTranslations(lang: Lang) {
  return function t(key: keyof typeof ui[typeof defaultLang]): string {
    return ui[lang][key] || ui[defaultLang][key];
  };
}

export function getLocalizedPath(lang: Lang, frSlug: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const enSlug = routes.en[frSlug as keyof typeof routes.en];
  const slug = lang === 'en' && enSlug !== undefined ? enSlug : frSlug;
  const path = slug ? `/${slug}` : '';
  return `${base}/${lang}${path}`;
}

export function getAlternateLang(lang: Lang): Lang {
  return lang === 'fr' ? 'en' : 'fr';
}

export function getHrefLangUrls(frSlug: string): { fr: string; en: string } {
  const site = 'https://colombanatsea.github.io';
  const base = '/colombanatsea.com';
  const enSlug = routes.en[frSlug as keyof typeof routes.en] ?? frSlug;
  return {
    fr: `${site}${base}/fr/${frSlug}`,
    en: `${site}${base}/en/${enSlug}`,
  };
}
