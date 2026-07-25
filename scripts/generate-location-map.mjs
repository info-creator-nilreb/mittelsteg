#!/usr/bin/env node
/**
 * Schematische monochrome Straßenkarte aus OSM-Wegen (Overpass).
 * Stil: helles Papier, schwarze Linien – vergleichbar mit Toner/Schematic.
 */
import sharp from 'sharp';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const CENTER = { lat: 52.5776396, lon: 13.3740750 };
const RADIUS_M = 550;
const OUT_W = 1400;
const OUT_H = 980;
const PAD = 0.08;

const ROAD_WIDTH = {
  motorway: 7.5,
  motorway_link: 5,
  trunk: 6.5,
  trunk_link: 4.5,
  primary: 5.5,
  primary_link: 4,
  secondary: 4.5,
  secondary_link: 3.5,
  tertiary: 3.6,
  tertiary_link: 3,
  residential: 2.4,
  unclassified: 2.2,
  living_street: 2.2,
  service: 1.4,
  pedestrian: 1.6,
  footway: 1.0,
  path: 0.9,
  cycleway: 1.2,
  track: 1.3
};

function project(lat, lon, bounds, w, h) {
  const x = ((lon - bounds.west) / (bounds.east - bounds.west)) * w;
  const y = ((bounds.north - lat) / (bounds.north - bounds.south)) * h;
  return [x, y];
}

function boundsFromCenter(lat, lon, radiusM) {
  const dLat = radiusM / 111320;
  const dLon = radiusM / (111320 * Math.cos((lat * Math.PI) / 180));
  return {
    south: lat - dLat,
    north: lat + dLat,
    west: lon - dLon,
    east: lon + dLon
  };
}

async function fetchWays(bounds) {
  const query = `
    [out:json][timeout:25];
    (
      way["highway"~"^(motorway|trunk|primary|secondary|tertiary|residential|unclassified|living_street|service|pedestrian|footway|path|cycleway|track|motorway_link|trunk_link|primary_link|secondary_link|tertiary_link)$"](${bounds.south},${bounds.west},${bounds.north},${bounds.east});
      way["waterway"~"^(river|canal|stream)$"](${bounds.south},${bounds.west},${bounds.north},${bounds.east});
      way["natural"="water"](${bounds.south},${bounds.west},${bounds.north},${bounds.east});
      relation["natural"="water"](${bounds.south},${bounds.west},${bounds.north},${bounds.east});
    );
    out body geom;
  `;

  const endpoints = [
    'https://overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter'
  ];

  let lastErr;
  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'mittelsteg46b-map-generator/1.0'
        },
        body: `data=${encodeURIComponent(query)}`
      });
      if (!res.ok) throw new Error(`${endpoint} → ${res.status}`);
      return res.json();
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr;
}

function roadStroke(highway) {
  return ROAD_WIDTH[highway] || 1.8;
}

function buildSvg(data, bounds) {
  const drawW = OUT_W;
  const drawH = OUT_H;
  const innerPadX = drawW * PAD;
  const innerPadY = drawH * PAD;

  const toXY = (lat, lon) => {
    const [x, y] = project(lat, lon, bounds, drawW - innerPadX * 2, drawH - innerPadY * 2);
    return [x + innerPadX, y + innerPadY];
  };

  const roads = [];
  const water = [];

  for (const el of data.elements || []) {
    if (!el.geometry || el.geometry.length < 2) continue;
    const pts = el.geometry.map((g) => toXY(g.lat, g.lon));
    const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
    const tags = el.tags || {};

    if (tags.waterway || tags.natural === 'water') {
      water.push(d);
      continue;
    }

    if (tags.highway) {
      roads.push({
        d,
        w: roadStroke(tags.highway),
        major: /^(motorway|trunk|primary|secondary)/.test(tags.highway)
      });
    }
  }

  roads.sort((a, b) => a.w - b.w);

  const pin = toXY(CENTER.lat, CENTER.lon);
  const pinX = pin[0];
  const pinY = pin[1];

  const waterPaths = water
    .map((d) => `<path d="${d}" fill="none" stroke="#d8d4cc" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>`)
    .join('\n');

  const roadPaths = roads
    .map((r) => {
      const color = r.major ? '#111' : '#222';
      return `<path d="${r.d}" fill="none" stroke="${color}" stroke-width="${r.w}" stroke-linecap="round" stroke-linejoin="round"/>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${drawW}" height="${drawH}" viewBox="0 0 ${drawW} ${drawH}">
  <rect width="100%" height="100%" fill="#f7f5f0"/>
  ${waterPaths}
  ${roadPaths}
  <g>
    <path d="M ${pinX} ${pinY - 36} C ${pinX - 17} ${pinY - 36}, ${pinX - 17} ${pinY - 12}, ${pinX} ${pinY + 10} C ${pinX + 17} ${pinY - 12}, ${pinX + 17} ${pinY - 36}, ${pinX} ${pinY - 36} Z" fill="#111"/>
    <circle cx="${pinX}" cy="${pinY - 22}" r="6.5" fill="#fff"/>
  </g>
  <rect x="${pinX - 70}" y="${pinY + 14}" width="140" height="26" rx="2" fill="#f7f5f0" fill-opacity="0.94"/>
  <text x="${pinX}" y="${pinY + 32}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="13" font-weight="700" fill="#111" letter-spacing="0.05em">MITTELSTEG 46B</text>
</svg>`;
}

async function main() {
  const bounds = boundsFromCenter(CENTER.lat, CENTER.lon, RADIUS_M);
  console.log('Lade OSM-Straßennetz …');
  const data = await fetchWays(bounds);
  const ways = (data.elements || []).filter((e) => e.geometry && e.tags?.highway);
  if (ways.length < 5) {
    throw new Error(`Zu wenige Straßenwege (${ways.length}) – Overpass-Antwort unvollständig`);
  }

  const svg = buildSvg(data, bounds);
  const svgPath = join(root, 'assets/images/lage-karte.svg');
  writeFileSync(svgPath, svg);

  const pngPath = join(root, 'assets/images/lage-karte.png');
  await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(pngPath);

  const stats = await sharp(pngPath).stats();
  const mean = stats.channels[0].mean;
  const stdev = stats.channels[0].stdev;
  if (mean > 248 || stdev < 10) {
    throw new Error(`Karte ohne Kontrast (mean=${mean.toFixed(1)}, stdev=${stdev.toFixed(1)})`);
  }

  console.log(
    `Karte erzeugt: ${pngPath} (${ways.length} Wege, mean=${mean.toFixed(1)}, stdev=${stdev.toFixed(1)})`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
