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

// --- HTTP server ---
const BASE = '/home/user/colombanatsea.com';
const mimeTypes = {
  '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.json': 'application/json', '.jpg': 'image/jpeg', '.png': 'image/png',
  '.svg': 'image/svg+xml', '.css': 'text/css',
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  let filePath = path.join(BASE, url.pathname);
  if (!fs.existsSync(filePath)) { res.writeHead(404); res.end('Not found: ' + url.pathname); return; }
  const ext = path.extname(filePath);
  res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream', 'Access-Control-Allow-Origin': '*' });
  res.end(fs.readFileSync(filePath));
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const port = server.address().port;
console.log(`Server on port ${port}`);

// --- Full Globe HTML with ZEE + Cables + Shipping Lanes ---
const html = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><style>*{margin:0;padding:0}body{background:#080b14;overflow:hidden}</style></head>
<body>
<script type="importmap">
{"imports":{
  "three":"http://127.0.0.1:${port}/site/node_modules/three/build/three.module.js",
  "three/addons/":"http://127.0.0.1:${port}/site/node_modules/three/examples/jsm/"
}}
</script>
<script type="module">
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const W = ${WIDTH}, H = ${HEIGHT};

// Load data
const [eezData, cablesData, lanesData] = await Promise.all([
  fetch('http://127.0.0.1:${port}/site/src/data/eez.json').then(r => r.json()),
  fetch('http://127.0.0.1:${port}/site/src/data/cables.json').then(r => r.json()),
  fetch('http://127.0.0.1:${port}/site/src/data/shipping-lanes.json').then(r => r.json()),
]);

// Load earcut
const earcutModule = await import('http://127.0.0.1:${port}/site/node_modules/earcut/src/earcut.js');
const earcut = earcutModule.default;

console.log('Data loaded: ZEE=' + eezData.features.length + ' cables=' + cablesData.features.length + ' lanes=' + lanesData.features.length);

// ── SCENE ──
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, W / H, 0.01, 100);
camera.position.set(0, 0.25, 2.6);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, preserveDrawingBuffer: true });
renderer.setSize(W, H);
renderer.setPixelRatio(1);
renderer.setClearColor(0x080b14, 1);
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

// ── LIGHTING ──
scene.add(new THREE.AmbientLight(0x666666, 1.5));
const dl = new THREE.DirectionalLight(0xffffff, 1.0); dl.position.set(5, 3, 5); scene.add(dl);
const bl = new THREE.DirectionalLight(0x334455, 0.4); bl.position.set(-3, -2, -5); scene.add(bl);

// ── CONSTANTS ──
const GLOBE_RADIUS = 1.0;
const ZEE_HEIGHT = 1.003;
const CABLE_RADIUS = GLOBE_RADIUS + 0.005;
const LANE_RADIUS = GLOBE_RADIUS + 0.003;

// ── GLOBE ──
const tl = new THREE.TextureLoader();
const globeGeo = new THREE.SphereGeometry(GLOBE_RADIUS, 96, 96);
const globeMat = new THREE.MeshPhongMaterial({ color: 0xffffff, shininess: 25, bumpScale: 0.015 });
const globe = new THREE.Mesh(globeGeo, globeMat);
scene.add(globe);

tl.load('http://127.0.0.1:${port}/site/public/assets/textures/earth-blue-marble.jpg', t => { t.colorSpace = THREE.SRGBColorSpace; globeMat.map = t; globeMat.needsUpdate = true; });
tl.load('http://127.0.0.1:${port}/site/public/assets/textures/earth-topology.png', t => { globeMat.bumpMap = t; globeMat.needsUpdate = true; });

// ── ATMOSPHERE ──
const atmoVS = 'varying vec3 vN;void main(){vN=normalize(normalMatrix*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}';
const atmoFS = 'varying vec3 vN;void main(){float i=pow(0.65-dot(vN,vec3(0,0,1)),3.);gl_FragColor=vec4(0.15,0.55,0.7,1)*i*0.7;}';
scene.add(new THREE.Mesh(new THREE.SphereGeometry(GLOBE_RADIUS * 1.12, 64, 64),
  new THREE.ShaderMaterial({ vertexShader: atmoVS, fragmentShader: atmoFS, side: THREE.BackSide, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false })));

// ── UTILITY ──
function latLonToVec3(lat, lon, r) {
  const phi = (90 - lat) * Math.PI / 180;
  const theta = -lon * Math.PI / 180;
  return new THREE.Vector3(r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta));
}

function interpolateGreatCircle(lat1, lon1, lat2, lon2, r, maxGapDeg) {
  const dLat = lat2 - lat1, dLon = lon2 - lon1;
  const gap = Math.sqrt(dLat * dLat + dLon * dLon);
  if (gap <= maxGapDeg) return [latLonToVec3(lat2, lon2, r)];
  const steps = Math.ceil(gap / maxGapDeg);
  const pts = [];
  for (let s = 1; s <= steps; s++) {
    const t = s / steps;
    pts.push(latLonToVec3(lat1 + dLat * t, lon1 + dLon * t, r));
  }
  return pts;
}

// ── ZEE ZONES ──
const zoneGroup = new THREE.Group();
scene.add(zoneGroup);

function normalizeLon(ring) {
  let maxJump = 0;
  for (let i = 1; i < ring.length; i++) maxJump = Math.max(maxJump, Math.abs(ring[i][0] - ring[i - 1][0]));
  if (maxJump <= 180) return ring;
  return ring.map(p => [p[0] < 0 ? p[0] + 360 : p[0], p[1]]);
}

function createZeeMesh(outerPts, holePtsArray) {
  const flat = [];
  for (const pt of outerPts) flat.push(pt[0], pt[1]);
  const holeIndices = [];
  if (holePtsArray) {
    for (const hole of holePtsArray) {
      if (hole.length < 3) continue;
      holeIndices.push(flat.length / 2);
      for (const pt of hole) flat.push(pt[0], pt[1]);
    }
  }
  let triIndices;
  try { triIndices = earcut(flat, holeIndices.length > 0 ? holeIndices : undefined, 2); } catch { return; }
  if (!triIndices || triIndices.length === 0) return;

  const MAX_ARC_DEG = 3;
  const outVerts = [], outIdx = [];
  const vertMap = new Map();
  function addVert(lo, la) {
    const key = lo.toFixed(4) + ',' + la.toFixed(4);
    if (vertMap.has(key)) return vertMap.get(key);
    let lon2 = lo; if (lon2 > 180) lon2 -= 360;
    const v = latLonToVec3(la, lon2, ZEE_HEIGHT);
    const idx = outVerts.length / 3;
    outVerts.push(v.x, v.y, v.z);
    vertMap.set(key, idx);
    return idx;
  }
  function subdivideTri(a, b, c, depth) {
    const dAB = Math.sqrt((a[0]-b[0])**2 + (a[1]-b[1])**2);
    const dBC = Math.sqrt((b[0]-c[0])**2 + (b[1]-c[1])**2);
    const dCA = Math.sqrt((c[0]-a[0])**2 + (c[1]-a[1])**2);
    if (Math.max(dAB, dBC, dCA) <= MAX_ARC_DEG || depth > 5) {
      outIdx.push(addVert(a[0], a[1]), addVert(b[0], b[1]), addVert(c[0], c[1]));
      return;
    }
    const mAB = [(a[0]+b[0])/2, (a[1]+b[1])/2];
    const mBC = [(b[0]+c[0])/2, (b[1]+c[1])/2];
    const mCA = [(c[0]+a[0])/2, (c[1]+a[1])/2];
    subdivideTri(a, mAB, mCA, depth+1);
    subdivideTri(mAB, b, mBC, depth+1);
    subdivideTri(mCA, mBC, c, depth+1);
    subdivideTri(mAB, mBC, mCA, depth+1);
  }
  for (let i = 0; i < triIndices.length; i += 3) {
    const iA = triIndices[i], iB = triIndices[i+1], iC = triIndices[i+2];
    subdivideTri([flat[iA*2], flat[iA*2+1]], [flat[iB*2], flat[iB*2+1]], [flat[iC*2], flat[iC*2+1]], 0);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(outVerts), 3));
  geo.setIndex(outIdx);
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0x00b4b4, transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false }));
  mesh.renderOrder = 1;
  zoneGroup.add(mesh);

  // Border
  const borderPts = [];
  for (const pt of outerPts) { let lon = pt[0]; if (lon > 180) lon -= 360; borderPts.push(latLonToVec3(pt[1], lon, ZEE_HEIGHT * 1.0005)); }
  if (borderPts.length > 2) borderPts.push(borderPts[0].clone());
  if (borderPts.length >= 2) {
    const borderLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints(borderPts), new THREE.LineBasicMaterial({ color: 0x00e0e0, transparent: true, opacity: 0.55 }));
    borderLine.renderOrder = 2;
    zoneGroup.add(borderLine);
  }
}

// Process EEZ
for (const feature of eezData.features) {
  const geom = feature.geometry;
  if (!geom) continue;
  const coordsList = [];
  if (geom.type === 'Polygon') coordsList.push(geom.coordinates);
  else if (geom.type === 'MultiPolygon') { for (const poly of geom.coordinates) coordsList.push(poly); }
  for (const coords of coordsList) {
    const outer = coords[0];
    if (!outer || outer.length < 3) continue;
    const normOuter = normalizeLon(outer);
    const holes = [];
    for (let h = 1; h < coords.length; h++) { if (coords[h] && coords[h].length >= 3) holes.push(normalizeLon(coords[h])); }
    createZeeMesh(normOuter, holes);
  }
}
console.log('ZEE zones loaded');

// ── SUBMARINE CABLES ──
const cableGroup = new THREE.Group();
scene.add(cableGroup);

function splitCableCoords(coords) {
  const segments = [];
  let current = [];
  for (let i = 0; i < coords.length; i++) {
    const lon = coords[i][0], lat = coords[i][1];
    if (isNaN(lat) || isNaN(lon)) continue;
    if (current.length > 0) {
      const prevLon = current[current.length - 1][0];
      if (Math.abs(lon - prevLon) > 90) {
        const lon1 = current[current.length - 1][0], lat1 = current[current.length - 1][1];
        let lon2 = lon;
        if (lon2 - lon1 > 180) lon2 -= 360;
        else if (lon1 - lon2 > 180) lon2 += 360;
        const crossLon = lon1 > 0 ? 180 : -180;
        const t = (lon2 - lon1) !== 0 ? (crossLon - lon1) / (lon2 - lon1) : 0.5;
        const crossLat = lat1 + t * (lat - lat1);
        current.push([crossLon, crossLat]);
        if (current.length >= 2) segments.push(current);
        current = [[-crossLon, crossLat], [lon, lat]];
        continue;
      }
    }
    current.push([lon, lat]);
  }
  if (current.length >= 2) segments.push(current);
  return segments;
}

for (const feature of cablesData.features) {
  const geom = feature.geometry;
  if (!geom) continue;
  let cableColor;
  try { cableColor = new THREE.Color(feature.properties?.c || '#00b4b4'); } catch { cableColor = new THREE.Color(0x00b4b4); }
  const coordSets = [];
  if (geom.type === 'MultiLineString') coordSets.push(...geom.coordinates);
  else if (geom.type === 'LineString') coordSets.push(geom.coordinates);
  for (const coords of coordSets) {
    for (const seg of splitCableCoords(coords)) {
      const pts = [];
      for (let i = 0; i < seg.length; i++) {
        const lon = seg[i][0], lat = seg[i][1];
        if (pts.length === 0) { pts.push(latLonToVec3(lat, lon, CABLE_RADIUS)); }
        else {
          const prevLon = seg[i - 1][0], prevLat = seg[i - 1][1];
          pts.push(...interpolateGreatCircle(prevLat, prevLon, lat, lon, CABLE_RADIUS, 5));
        }
      }
      if (pts.length < 2) continue;
      const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: cableColor, transparent: true, opacity: 0.35, depthWrite: false }));
      line.renderOrder = 3;
      cableGroup.add(line);
    }
  }
}
console.log('Cables loaded');

// ── SHIPPING LANES ──
const trafficGroup = new THREE.Group();
scene.add(trafficGroup);
const LANE_STYLES = { 1: { color: 0xff8c50, opacity: 0.90 }, 2: { color: 0xff7040, opacity: 0.60 }, 3: { color: 0xff6432, opacity: 0.32 } };

for (const feat of lanesData.features) {
  const style = LANE_STYLES[feat.properties.t];
  if (!style) continue;
  const mat = new THREE.LineBasicMaterial({ color: style.color, transparent: true, opacity: style.opacity, depthWrite: false });
  for (const line of feat.geometry.coordinates) {
    const points = [];
    for (let i = 0; i < line.length; i++) {
      const lon = line[i][0], lat = line[i][1];
      if (isNaN(lat) || isNaN(lon)) continue;
      if (points.length === 0) { points.push(latLonToVec3(lat, lon, LANE_RADIUS)); }
      else {
        const prevLon = line[i - 1][0], prevLat = line[i - 1][1];
        points.push(...interpolateGreatCircle(prevLat, prevLon, lat, lon, LANE_RADIUS, 5));
      }
    }
    if (points.length >= 2) trafficGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), mat));
  }
}
console.log('Shipping lanes loaded');

// ── STARFIELD ──
const starPos = new Float32Array(2000 * 3);
for (let i = 0; i < 2000; i++) {
  const r = 15 + Math.random() * 35;
  const t = Math.random() * Math.PI * 2;
  const p = Math.acos(2 * Math.random() - 1);
  starPos[i*3] = r * Math.sin(p) * Math.cos(t);
  starPos[i*3+1] = r * Math.sin(p) * Math.sin(t);
  starPos[i*3+2] = r * Math.cos(p);
}
const starGeo = new THREE.BufferGeometry();
starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3));
scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xaabbdd, size: 0.04, transparent: true, opacity: 0.6, sizeAttenuation: true, depthWrite: false })));

// ── CONTROLS ──
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.enablePan = false;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.4;

window.__globeReady = false;
setTimeout(() => { window.__globeReady = true; console.log('Globe ready'); }, 4000);

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();
</script>
</body>
</html>`;

// --- Launch browser ---
const browser = await chromium.launch({
  headless: true,
  executablePath: '/root/.cache/ms-playwright/chromium-1194/chrome-linux/chrome',
  args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-webgl', '--disable-dev-shm-usage'],
});

const ctx = await browser.newContext({ viewport: { width: WIDTH, height: HEIGHT }, deviceScaleFactor: 1 });
const page = await ctx.newPage();

page.on('console', msg => console.log('  [browser]', msg.text()));
page.on('pageerror', err => console.error('  [browser error]', err.message));

console.log('Loading globe page with all layers...');
await page.setContent(html, { waitUntil: 'commit', timeout: 15000 }).catch(() => {});

// Wait for data + textures to load
console.log('Waiting for data + textures...');
await page.waitForTimeout(10000);

// Test screenshot
await page.screenshot({ path: '/tmp/globe-test.png' });
console.log('Test screenshot: /tmp/globe-test.png');

const canvasInfo = await page.evaluate(() => {
  const c = document.querySelector('canvas');
  return { found: !!c, width: c?.width, height: c?.height };
});
console.log('Canvas:', canvasInfo);

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

const outputPath = '/home/user/colombanatsea.com/globe-portrait.mp4';
execSync(`ffmpeg -y -framerate ${FPS} -i ${FRAME_DIR}/frame-%05d.png -c:v libx264 -pix_fmt yuv420p -crf 18 -preset slow "${outputPath}"`, { stdio: 'inherit', timeout: 300000 });

console.log('\\nVideo: ' + outputPath);
console.log('Size: ' + (fs.statSync(outputPath).size / 1024 / 1024).toFixed(1) + ' MB');
execSync(`rm -rf ${FRAME_DIR}`);
