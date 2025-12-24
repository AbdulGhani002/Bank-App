const fs = require('fs');
const path = require('path');

const BASE_DIR = path.resolve(__dirname, '..');
const ROUTES_DIR = path.join(BASE_DIR, 'routes');
const VIEWS_DIR = path.join(BASE_DIR, 'views');
const PUBLIC_DIR = path.join(BASE_DIR, 'public');

const baseUrl = process.env.SITEMAP_BASE_URL || process.argv[2] || 'http://localhost:3000';

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function readFilesRecursive(dir, extFilter) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const it of items) {
    const full = path.join(dir, it.name);
    if (it.isDirectory()) results.push(...readFilesRecursive(full, extFilter));
    else if (!extFilter || full.endsWith(extFilter)) results.push(full);
  }
  return results;
}

function scanRoutes() {
  const paths = new Set();
  if (!fs.existsSync(ROUTES_DIR)) return paths;
  const files = fs.readdirSync(ROUTES_DIR).filter(f => f.endsWith('.js'));
  for (const file of files) {
    const content = fs.readFileSync(path.join(ROUTES_DIR, file), 'utf8');
    const routeRegex = /(?:router|app)\.(?:get|post|put|delete|all)\s*\(\s*['"`]([^'"`\)]+)['"`]/g;
    let m;
    while ((m = routeRegex.exec(content)) !== null) {
      const p = m[1].trim();
      if (p && p.startsWith('/')) {
        // ignore paramized routes
        if (p.includes(':')) continue;
        paths.add(p.replace(/\/+$/, ''));
      }
    }
  }
  return paths;
}

function scanViews() {
  const paths = new Set();
  if (!fs.existsSync(VIEWS_DIR)) return paths;
  const files = readFilesRecursive(VIEWS_DIR, '.ejs');
  for (const f of files) {
    const rel = path.relative(VIEWS_DIR, f).replace(/\\/g, '/');
    // skip includes and shared templates
    if (rel.includes('includes') || rel.startsWith('shared/')) continue;
    let url = '/' + rel.replace(/\.ejs$/i, '');
    url = url.replace(/\/index$/i, '');
    if (url === '/') {
      paths.add('/');
    } else {
      // normalize repeated slashes
      url = url.replace(/\/+/g, '/');
      paths.add(url);
    }
  }
  return paths;
}

function buildSitemap(urls, overrideBase) {
  const useBase = (overrideBase || baseUrl).replace(/\/$/, '');
  const now = new Date().toISOString();
  const entries = [...urls].map(u => {
    const loc = `${useBase}${u}`;
    return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${now}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>`;
}

function writeRobots() {
  const content = `User-agent: *\nAllow: /\nSitemap: ${baseUrl.replace(/\/$/, '')}/sitemap.xml\n`;
  fs.writeFileSync(path.join(PUBLIC_DIR, 'robots.txt'), content, 'utf8');
}

function main() {
  ensureDir(PUBLIC_DIR);
  const routePaths = scanRoutes();
  const viewPaths = scanViews();
  const urls = new Set();

  for (const p of routePaths) urls.add(p);
  for (const p of viewPaths) urls.add(p);

  // ensure root present
  if (![...urls].some(u => u === '/')) urls.add('/');

  const sitemapXml = buildSitemap(urls);
  fs.writeFileSync(path.join(PUBLIC_DIR, 'sitemap.xml'), sitemapXml, 'utf8');
  writeRobots();
  console.log(`Wrote ${path.join(PUBLIC_DIR, 'sitemap.xml')} and robots.txt (base: ${baseUrl})`);
}

if (require.main === module) main();

module.exports = { scanRoutes, scanViews, buildSitemap };
