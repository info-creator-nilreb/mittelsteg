#!/usr/bin/env node
/**
 * Synchronisiert Datumswerte aus site-config.js nach index.html und sitemap.xml.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const configPath = join(root, 'site-config.js');
const indexPath = join(root, 'index.html');
const sitemapPath = join(root, 'sitemap.xml');

const configSource = readFileSync(configPath, 'utf8');
const extract = (key) => {
  const match = configSource.match(new RegExp(`${key}:\\s*'([^']+)'`));
  if (!match) {
    throw new Error(`Konfigurationsschlüssel fehlt: ${key}`);
  }
  return match[1];
};

const listingLastUpdated = extract('listingLastUpdated');
const listingLastUpdatedLabel = extract('listingLastUpdatedLabel');
const datePosted = extract('datePosted');
const dateModified = extract('dateModified');

let indexHtml = readFileSync(indexPath, 'utf8');

indexHtml = indexHtml.replace(
  /<time datetime="[^"]+" data-config="listing-updated">[^<]+<\/time>/,
  `<time datetime="${listingLastUpdated}" data-config="listing-updated">${listingLastUpdatedLabel}</time>`
);
indexHtml = indexHtml.replace(/"datePosted":\s*"[^"]+"/, `"datePosted": "${datePosted}"`);
indexHtml = indexHtml.replace(/"dateModified":\s*"[^"]+"/g, `"dateModified": "${dateModified}"`);

writeFileSync(indexPath, indexHtml);

let sitemap = readFileSync(sitemapPath, 'utf8');
sitemap = sitemap.replace(/<lastmod>[^<]+<\/lastmod>/g, `<lastmod>${listingLastUpdated}</lastmod>`);
writeFileSync(sitemapPath, sitemap);

console.log(`Konfiguration synchronisiert (${listingLastUpdated}).`);
