#!/usr/bin/env node
/**
 * Globe video recorder using Puppeteer + FFmpeg
 * Captures frames from the Three.js globe and encodes to MP4
 *
 * Usage: node record-globe.js [story|post|both]
 */

const puppeteer = require('puppeteer-core');
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const http = require('http');

const CHROMIUM_PATH = '/root/.cache/ms-playwright/chromium-1194/chrome-linux/chrome';
const FPS = 30;
const DURATION_SEC = 12;
const TOTAL_FRAMES = FPS * DURATION_SEC;

const FORMATS = {
  story: { w: 1080, h: 1920, name: 'globe-story' },
  post:  { w: 1080, h: 1080, name: 'globe-post' },
};

const PROJECT_ROOT = path.join(__dirname, '..');
const SITE_ROOT = path.join(PROJECT_ROOT, 'site');

// Route-based static server that maps virtual paths to actual files
function startServer(port) {
  const mimeTypes = {
    '.html': 'text/html', '.js': 'application/javascript', '.mjs': 'application/javascript',
    '.json': 'application/json', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
    '.png': 'image/png', '.svg': 'image/svg+xml', '.css': 'text/css',
  };

  // Map URL paths to filesystem paths
  const routeMap = [
    { prefix: '/three/',     fsBase: path.join(SITE_ROOT, 'node_modules/three/') },
    { prefix: '/earcut.min.js', fsPath: path.join(SITE_ROOT, 'node_modules/earcut/dist/earcut.min.js') },
    { prefix: '/data/',      fsBase: path.join(SITE_ROOT, 'src/data/') },
    { prefix: '/textures/',  fsBase: path.join(SITE_ROOT, 'public/assets/textures/') },
    { prefix: '/tools/',     fsBase: path.join(PROJECT_ROOT, 'tools/') },
  ];

  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const urlPath = decodeURIComponent(req.url.split('?')[0]);

      let filePath = null;

      for (const route of routeMap) {
        if (route.fsPath && urlPath === route.prefix) {
          filePath = route.fsPath;
          break;
        }
        if (route.fsBase && urlPath.startsWith(route.prefix)) {
          filePath = path.join(route.fsBase, urlPath.slice(route.prefix.length));
          break;
        }
      }

      if (!filePath) {
        res.writeHead(404);
        res.end('Not found: ' + urlPath);
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      const mime = mimeTypes[ext] || 'application/octet-stream';

      try {
        const data = fs.readFileSync(filePath);
        res.writeHead(200, {
          'Content-Type': mime,
          'Access-Control-Allow-Origin': '*',
        });
        res.end(data);
      } catch (e) {
        res.writeHead(404);
        res.end('File not found: ' + filePath);
      }
    });
    server.listen(port, () => {
      console.log(`Server running on port ${port}`);
      resolve(server);
    });
  });
}

async function recordFormat(format) {
  const { w, h, name } = format;
  const outputDir = path.join(PROJECT_ROOT, 'output');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const framesDir = path.join(outputDir, `frames-${name}`);
  if (fs.existsSync(framesDir)) execSync(`rm -rf "${framesDir}"`);
  fs.mkdirSync(framesDir, { recursive: true });

  console.log(`\n=== Recording ${name} (${w}x${h}) ===`);

  const port = 8765;
  const server = await startServer(port);

  const browser = await puppeteer.launch({
    executablePath: CHROMIUM_PATH,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--use-gl=angle',
      '--use-angle=swiftshader',
      '--enable-webgl',
      '--ignore-gpu-blocklist',
      '--enable-gpu-rasterization',
      '--disable-gpu-driver-bug-workarounds',
      `--window-size=${w},${h}`,
    ],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 });

    // Collect page errors
    page.on('console', msg => {
      const text = msg.text();
      if (text === 'GLOBE_READY') console.log('Globe scene ready!');
      else if (msg.type() === 'error') console.log('PAGE ERROR:', text);
    });
    page.on('pageerror', err => console.log('PAGE EXCEPTION:', err.message));

    const url = `http://localhost:${port}/tools/globe-recorder.html?w=${w}&h=${h}`;
    console.log(`Loading ${url}...`);

    await page.goto(url, { waitUntil: 'networkidle0', timeout: 120000 });

    // Wait for globe to be ready
    await page.waitForFunction('window.__globeReady === true', { timeout: 60000 });
    console.log('Globe loaded, waiting for textures...');
    await new Promise(r => setTimeout(r, 3000));

    console.log('Starting frame capture...');

    for (let i = 0; i < TOTAL_FRAMES; i++) {
      const angle = (i / TOTAL_FRAMES) * Math.PI * 2;

      await page.evaluate((a) => window.__renderFrame(a), angle);
      await new Promise(r => setTimeout(r, 30));

      const frameNum = String(i).padStart(5, '0');
      await page.screenshot({
        path: path.join(framesDir, `frame_${frameNum}.png`),
        type: 'png',
        clip: { x: 0, y: 0, width: w, height: h },
      });

      if (i % 60 === 0 || i === TOTAL_FRAMES - 1) {
        console.log(`  Frame ${i + 1}/${TOTAL_FRAMES} (${Math.round((i + 1) / TOTAL_FRAMES * 100)}%)`);
      }
    }

    console.log(`All ${TOTAL_FRAMES} frames captured!`);

    const outputFile = path.join(outputDir, `${name}.mp4`);
    console.log(`Encoding ${outputFile}...`);

    execSync([
      'ffmpeg', '-y',
      '-framerate', String(FPS),
      '-i', path.join(framesDir, 'frame_%05d.png'),
      '-c:v', 'libx264',
      '-pix_fmt', 'yuv420p',
      '-preset', 'slow',
      '-crf', '18',
      '-movflags', '+faststart',
      outputFile,
    ].join(' '), { stdio: 'inherit' });

    console.log(`Video saved: ${outputFile}`);
    execSync(`rm -rf "${framesDir}"`);
    return outputFile;
  } finally {
    await browser.close();
    server.close();
  }
}

async function main() {
  const arg = process.argv[2] || 'both';
  const toRecord = arg === 'both' ? ['story', 'post'] : [arg];

  const results = [];
  for (const fmt of toRecord) {
    if (!FORMATS[fmt]) {
      console.error(`Unknown format: ${fmt}. Use: story, post, or both`);
      process.exit(1);
    }
    results.push(await recordFormat(FORMATS[fmt]));
  }

  console.log('\n=== Done! ===');
  results.forEach(f => console.log(`  ${f}`));
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
