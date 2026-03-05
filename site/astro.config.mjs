import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://colombanatsea.com',
  build: {
    assets: '_assets',
  },
  vite: {
    css: {
      preprocessorOptions: {},
    },
  },
});
