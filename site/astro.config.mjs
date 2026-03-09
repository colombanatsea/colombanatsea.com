import { defineConfig } from 'astro/config';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Astro integration: inject <link rel="modulepreload"> for Three.js chunks.
 * Breaks the critical chain preload-helper → OrbitControls → three.module
 * by telling the browser to fetch them in parallel.
 * Desktop only (skipped on mobile via inline width check).
 */
function threeModulePreload() {
  return {
    name: 'three-modulepreload',
    hooks: {
      'astro:build:done': async ({ dir }) => {
        const distPath = fileURLToPath(dir);
        const assetsDir = join(distPath, '_assets');

        let files;
        try {
          files = await readdir(assetsDir);
        } catch {
          return; // no _assets dir, skip
        }

        // Find Three.js-related chunks by filename pattern
        const chunks = [];
        for (const f of files) {
          if (!f.endsWith('.js')) continue;
          if (f.startsWith('three.module.') || f.startsWith('OrbitControls.')) {
            chunks.push('/_assets/' + f);
          }
        }

        if (chunks.length === 0) return;

        // Build a small inline script that adds modulepreload links on desktop only.
        // Using JSON.stringify for safe escaping (no user input, all build-generated filenames).
        const paths = JSON.stringify(chunks);
        const snippet = `<script>if(window.innerWidth>768){${paths}.forEach(function(h){var l=document.createElement("link");l.rel="modulepreload";l.href=h;document.head.appendChild(l)})}</script>`;

        // Only inject into pages that actually use Three.js components
        const targetPages = [
          'fr/index.html',
          'en/index.html',
          'fr/engagements/index.html',
          'en/engagements/index.html',
        ];

        for (const page of targetPages) {
          const htmlPath = join(distPath, page);
          try {
            let html = await readFile(htmlPath, 'utf-8');
            // Inject right before </head> so it runs early
            html = html.replace('</head>', snippet + '</head>');
            await writeFile(htmlPath, html, 'utf-8');
          } catch {
            // Page doesn't exist, skip
          }
        }

        console.log(`[three-modulepreload] Injected preload hints for ${chunks.length} chunks into ${targetPages.length} pages`);
      },
    },
  };
}

export default defineConfig({
  site: 'https://colombanatsea.com',
  base: '/',
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
  integrations: [threeModulePreload()],
  vite: {
    css: {
      preprocessorOptions: {},
    },
  },
});
