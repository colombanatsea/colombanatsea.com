export const languages = {
  fr: 'Francais',
  en: 'English',
} as const;

export type Lang = keyof typeof languages;

export const defaultLang: Lang = 'fr';

// Navigation & UI translations
export const ui = {
  fr: {
    // Nav
    'nav.vision': 'Vision',
    'nav.about': 'A propos',
    'nav.engagements': 'Engagements',
    'nav.speaking': 'Prises de parole',
    'nav.media': 'Medias',
    'nav.contact': 'Contact',

    // Footer
    'footer.navigation': 'Navigation',
    'footer.follow': 'Suivre',
    'footer.links': 'Liens',
    'footer.legal': 'Mentions legales',
    'footer.privacy': 'Politique de confidentialite',
    'footer.sources': 'Sources & donnees',
    'footer.tagline': 'Une nation libre regarde la mer.',

    // Common
    'common.readMore': 'En savoir plus',
    'common.download': 'Telecharger',
    'common.contact': 'Contact',
  },
  en: {
    // Nav
    'nav.vision': 'Vision',
    'nav.about': 'About',
    'nav.engagements': 'Engagements',
    'nav.speaking': 'Speaking',
    'nav.media': 'Media',
    'nav.contact': 'Contact',

    // Footer
    'footer.navigation': 'Navigation',
    'footer.follow': 'Follow',
    'footer.links': 'Links',
    'footer.legal': 'Legal Notice',
    'footer.privacy': 'Privacy Policy',
    'footer.sources': 'Sources & Data',
    'footer.tagline': 'A free nation looks to the sea.',

    // Common
    'common.readMore': 'Read more',
    'common.download': 'Download',
    'common.contact': 'Contact',
  },
} as const;

// Route mapping: FR slug → EN slug
export const routes = {
  fr: {
    '': '',
    'a-propos': 'a-propos',
    'engagements': 'engagements',
    'prises-de-parole': 'prises-de-parole',
    'medias': 'medias',
    'contact': 'contact',
    'mentions-legales': 'mentions-legales',
    'politique-confidentialite': 'politique-confidentialite',
    'sources': 'sources',
  },
  en: {
    '': '',
    'a-propos': 'about',
    'engagements': 'engagements',
    'prises-de-parole': 'speaking',
    'medias': 'media',
    'contact': 'contact',
    'mentions-legales': 'legal-notice',
    'politique-confidentialite': 'privacy-policy',
    'sources': 'sources',
  },
} as const;
