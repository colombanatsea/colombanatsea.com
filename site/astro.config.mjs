import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://colombanatsea.github.io',
  base: '/colombanatsea.com',
  build: {
    assets: '_assets',
  },
  vite: {
    css: {
      preprocessorOptions: {},
    },
  },
});
