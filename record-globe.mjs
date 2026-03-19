import { chromium } from 'playwright';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import http from 'http';

const WIDTH = 1080;
const HEIGHT = 1920;
const FPS = 30;
const DURATION_SEC = 12;
const TOTAL_FRAMES = FPS * DURATION_SEC;
const FRAME_DIR = '/tmp/globe-frames';

if (fs.existsSync(FRAME_DIR)) execSync(`rm -rf ${FRAME_DIR}`);
fs.mkdirSync(FRAME_DIR, { recursive: true });

console.log(`Recording ${DURATION_SEC}s @ ${FPS}fps = ${TOTAL_FRAMES} frames (${WIDTH}x${HEIGHT})`);

// --- Inline HTTP server serving from project root ---
const BASE = '/home/user/colombanatsea.com';
const mimeTypes = {
  '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.json': 'application/json', '.jpg': 'image/jpeg', '.png': 'image/png',
  '.svg': 'image/svg+xml', '.css': 'text/css',
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  let filePath = path.join(BASE, url.pathname);
  if (!fs.existsSync(filePath)) {
    res.writeHead(404);
    res.end('Not found: ' + url.pathname);
    return;
  }
  const ext = path.extname(filePath);
  res.writeHead(200, {
    'Content-Type': mimeTypes[ext] || 'application/octet-stream',
    'Access-Control-Allow-Origin': '*',
  });
  res.end(fs.readFileSync(filePath));
});

await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const port = server.address().port;
console.log(`Server on port ${port}`);

// --- Self-contained HTML that uses local Three.js ---
const html = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><style>*{margin:0;padding:0}body{background:#080b14;overflow:hidden}</style></head>
<body>
<script type="importmap">
{"imports":{"three":"http://127.0.0.1:${port}/site/node_modules/three/build/three.module.js","three/addons/":"http://127.0.0.1:${port}/site/node_modules/three/examples/jsm/"}}
</script>
<script type="module">
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const W = ${WIDTH}, H = ${HEIGHT};
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, W/H, 0.01, 100);
camera.position.set(0, 0.25, 2.6);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, preserveDrawingBuffer: true });
renderer.setSize(W, H);
renderer.setPixelRatio(1);
renderer.setClearColor(0x080b14, 1);
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

scene.add(new THREE.AmbientLight(0x666666, 1.5));
const dl = new THREE.DirectionalLight(0xffffff, 1.0); dl.position.set(5, 3, 5); scene.add(dl);
const bl = new THREE.DirectionalLight(0x334455, 0.4); bl.position.set(-3, -2, -5); scene.add(bl);

const geo = new THREE.SphereGeometry(1.0, 96, 96);
const mat = new THREE.MeshPhongMaterial({ color: 0xffffff, shininess: 25, bumpScale: 0.015 });
const globe = new THREE.Mesh(geo, mat);
scene.add(globe);

const tl = new THREE.TextureLoader();
tl.load('http://127.0.0.1:${port}/site/public/assets/textures/earth-blue-marble.jpg', t => { t.colorSpace = THREE.SRGBColorSpace; mat.map = t; mat.needsUpdate = true; });
tl.load('http://127.0.0.1:${port}/site/public/assets/textures/earth-topology.png', t => { mat.bumpMap = t; mat.needsUpdate = true; });

const atmoVS = 'varying vec3 vN;void main(){vN=normalize(normalMatrix*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}';
const atmoFS = 'varying vec3 vN;void main(){float i=pow(0.65-dot(vN,vec3(0,0,1)),3.);gl_FragColor=vec4(0.15,0.55,0.7,1)*i*0.7;}';
const atmoMat = new THREE.ShaderMaterial({ vertexShader: atmoVS, fragmentShader: atmoFS, side: THREE.BackSide, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false });
scene.add(new THREE.Mesh(new THREE.SphereGeometry(1.12, 64, 64), atmoMat));

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.enablePan = false;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.4;

window.__globeReady = false;
setTimeout(() => { window.__globeReady = true; }, 3000);

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();
</script>
</body>
</html>`;

fs.writeFileSync('/tmp/globe-capture.html', html);

// --- Launch browser ---
const browser = await chromium.launch({
  headless: true,
  executablePath: '/root/.cache/ms-playwright/chromium-1194/chrome-linux/chrome',
  args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-webgl', '--disable-dev-shm-usage'],
});

const ctx = await browser.newContext({ viewport: { width: WIDTH, height: HEIGHT }, deviceScaleFactor: 1 });
const page = await ctx.newPage();

console.log('Loading globe page...');
await page.goto(`http://127.0.0.1:${port}/capture-globe-local.html`, { waitUntil: 'commit', timeout: 10000 }).catch(() => {});

// Serve the generated HTML directly
await page.goto(`http://127.0.0.1:${port}/tmp-globe`, { waitUntil: 'commit', timeout: 5000 }).catch(() => {});

// Use setContent instead
await page.setContent(html, { waitUntil: 'commit', timeout: 10000 }).catch(() => {});

// Wait for globe + textures to load
console.log('Waiting for textures...');
await page.waitForTimeout(8000);

// Test screenshot
await page.screenshot({ path: '/tmp/globe-test.png' });
console.log('Test screenshot: /tmp/globe-test.png');

// Check if WebGL works
const hasWebGL = await page.evaluate(() => {
  const c = document.querySelector('canvas');
  return !!c;
});
console.log('Canvas found:', hasWebGL);

// Capture frames
console.log('Capturing frames...');
for (let i = 0; i < TOTAL_FRAMES; i++) {
  const framePath = path.join(FRAME_DIR, `frame-${String(i).padStart(5, '0')}.png`);
  await page.screenshot({ path: framePath, type: 'png' });
  if (i % 30 === 0) console.log(`  Frame ${i}/${TOTAL_FRAMES} (${Math.round(i / TOTAL_FRAMES * 100)}%)`);
  await page.waitForTimeout(33);
}

console.log('All frames captured. Encoding video...');
await browser.close();
server.close();

try { execSync('which ffmpeg'); } catch {
  console.log('Installing ffmpeg...');
  execSync('apt-get install -y ffmpeg 2>&1', { timeout: 120000 });
}

const outputPath = '/home/user/colombanatsea.com/globe-portrait.mp4';
execSync(`ffmpeg -y -framerate ${FPS} -i ${FRAME_DIR}/frame-%05d.png -c:v libx264 -pix_fmt yuv420p -crf 18 -preset slow "${outputPath}"`, { stdio: 'inherit', timeout: 300000 });

console.log(`\nVideo: ${outputPath}`);
console.log(`Size: ${(fs.statSync(outputPath).size / 1024 / 1024).toFixed(1)} MB`);
execSync(`rm -rf ${FRAME_DIR}`);
