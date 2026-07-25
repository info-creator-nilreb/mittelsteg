#!/usr/bin/env node
import sharp from 'sharp';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const CENTER = { lat: 52.5776396, lon: 13.3740750 };
const ZOOM = 17;
const OUT_W = 1400;
const OUT_H = 980;
const TILE = 256;
const TILE_URL = (x, y, z) =>
  `https://cartodb-basemaps-a.global.ssl.fastly.net/light_nolabels/${z}/${x}/${y}.png`;

function latLonToWorld(lat, lon, zoom) {
  const scale = TILE * 2 ** zoom;
  const x = ((lon + 180) / 360) * scale;
  const sin = Math.sin((lat * Math.PI) / 180);
  const y = (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * scale;
  return { x, y };
}

function centerTile(lat, lon, zoom) {
  const world = latLonToWorld(lat, lon, zoom);
  return {
    x: Math.floor(world.x / TILE),
    y: Math.floor(world.y / TILE),
    pixelX: world.x,
    pixelY: world.y
  };
}

async function fetchTile(x, y, z) {
  const res = await fetch(TILE_URL(x, y, z));
  if (!res.ok) throw new Error(`Tile ${x}/${y}/${z} failed: ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

async function stylizeMap(buffer) {
  return sharp(buffer)
    .modulate({ saturation: 0.22, brightness: 1.08 })
    .blur(0.7)
    .sharpen({ sigma: 0.9, m1: 0.4, m2: 0.8 })
    .tint({ r: 248, g: 246, b: 241 })
    .png()
    .toBuffer();
}

async function main() {
  const center = centerTile(CENTER.lat, CENTER.lon, ZOOM);
  const tilesX = Math.ceil(OUT_W / TILE) + 1;
  const tilesY = Math.ceil(OUT_H / TILE) + 1;
  const startX = center.x - Math.floor(tilesX / 2);
  const startY = center.y - Math.floor(tilesY / 2);

  const canvasW = tilesX * TILE;
  const canvasH = tilesY * TILE;
  const composites = [];

  for (let dy = 0; dy < tilesY; dy += 1) {
    for (let dx = 0; dx < tilesX; dx += 1) {
      const tileX = startX + dx;
      const tileY = startY + dy;
      const buf = await fetchTile(tileX, tileY, ZOOM);
      composites.push({
        input: buf,
        left: dx * TILE,
        top: dy * TILE
      });
    }
  }

  const originX = center.pixelX - startX * TILE;
  const originY = center.pixelY - startY * TILE;
  const cropLeft = Math.max(0, Math.round(originX - OUT_W / 2));
  const cropTop = Math.max(0, Math.round(originY - OUT_H / 2));

  const raw = await sharp({
    create: {
      width: canvasW,
      height: canvasH,
      channels: 3,
      background: '#f5f2eb'
    }
  })
    .composite(composites)
    .extract({
      left: cropLeft,
      top: cropTop,
      width: Math.min(OUT_W, canvasW - cropLeft),
      height: Math.min(OUT_H, canvasH - cropTop)
    })
    .png()
    .toBuffer();

  const base = await stylizeMap(raw);
  const markerBuf = Buffer.from(buildMarkersSvg(OUT_W, OUT_H));

  const pngPath = join(root, 'assets/images/lage-karte.png');
  await sharp(base)
    .composite([{ input: markerBuf, top: 0, left: 0 }])
    .png({ quality: 92 })
    .toFile(pngPath);

  const svgPath = join(root, 'assets/images/lage-karte.svg');
  writeFileSync(svgPath, buildFallbackSvg());

  console.log(`Karte erzeugt: ${pngPath}`);
}

function buildMarkersSvg(w, h) {
  const pinX = Math.round(w * 0.5);
  const pinY = Math.round(h * 0.54);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#1f2a23" flood-opacity="0.18"/>
    </filter>
  </defs>
  <g filter="url(#shadow)">
    <path d="M ${pinX} ${pinY - 34} C ${pinX - 16} ${pinY - 34}, ${pinX - 16} ${pinY - 12}, ${pinX} ${pinY + 8} C ${pinX + 16} ${pinY - 12}, ${pinX + 16} ${pinY - 34}, ${pinX} ${pinY - 34} Z" fill="#1f2a23"/>
    <circle cx="${pinX}" cy="${pinY - 20}" r="6" fill="#fff"/>
  </g>
  <text x="${pinX}" y="${pinY + 28}" text-anchor="middle" font-family="Arial,sans-serif" font-size="14" font-weight="700" fill="#1f2a23">Mittelsteg 46B</text>
  <g transform="translate(${w - 58}, 28)">
    <circle cx="0" cy="0" r="18" fill="#fff" stroke="#d8d3c8" stroke-width="1"/>
    <path d="M0 -10 L0 10 M-4 6 L0 10 L4 6" stroke="#1f2a23" stroke-width="1.5" fill="none"/>
    <text x="0" y="-14" text-anchor="middle" font-family="Arial,sans-serif" font-size="10" font-weight="700" fill="#1f2a23">N</text>
  </g>
  <text x="${w - 16}" y="${h - 14}" text-anchor="end" font-family="Arial,sans-serif" font-size="11" fill="#8a8f8b">Kartendaten &#169; OpenStreetMap</text>
</svg>`;
}

function buildFallbackSvg() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1400 980" aria-hidden="true">
  <rect width="1400" height="980" fill="#f5f2eb"/>
  <text x="700" y="490" text-anchor="middle" font-family="Arial,sans-serif" font-size="18" fill="#6c726d">Karte: Mittelsteg 46B, Berlin-Pankow</text>
</svg>`;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
