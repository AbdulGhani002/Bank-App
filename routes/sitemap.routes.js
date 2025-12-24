const express = require('express');
const path = require('path');
const { scanRoutes, scanViews, buildSitemap } = require(path.join(__dirname, '..', 'scripts', 'generate-sitemap'));

const router = express.Router();

const baseUrl = process.env.SITEMAP_BASE_URL || process.env.BASE_URL || 'https://bank.apex-logic.net';

router.get('/sitemap.xml', (req, res) => {
  try {
    const routes = scanRoutes();
    const views = scanViews();
    const urls = new Set();
    for (const p of routes) urls.add(p);
    for (const p of views) urls.add(p);
    if (![...urls].some(u => u === '/')) urls.add('/');
    const xml = buildSitemap(urls, baseUrl);
    res.header('Content-Type', 'application/xml');
    return res.send(xml);
  } catch (err) {
    console.error('Error generating sitemap:', err);
    return res.status(500).send('Error generating sitemap');
  }
});

router.get('/robots.txt', (req, res) => {
  const content = `User-agent: *\nAllow: /\nSitemap: ${baseUrl.replace(/\/$/, '')}/sitemap.xml\n`;
  res.header('Content-Type', 'text/plain');
  res.send(content);
});

module.exports = router;
