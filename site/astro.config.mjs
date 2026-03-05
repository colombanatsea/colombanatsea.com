import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://colombanatsea.github.io',
  base: '/colombanatsea.com',
  i18n: {
    defaultLocale: 'fr',
    locales: ['fr', 'en'],
    routing: {
      prefixDefaultLocale: true,
      redirectToDefaultLocale: false,
    },
  },
  build: {
    assets: '_assets',
  },
  vite: {
    css: {
      preprocessorOptions: {},
    },
  },
});
