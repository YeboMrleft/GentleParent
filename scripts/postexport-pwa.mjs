// Post-export PWA setup for the Gentle Parent web app.
// Run after `expo export -p web` to make dist/ installable (iPhone Add-to-Home,
// desktop install). Idempotent — safe to run on every export.
import { readFileSync, writeFileSync, copyFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const dist = resolve('dist');
const indexPath = resolve(dist, 'index.html');
if (!existsSync(indexPath)) {
  console.error('dist/index.html not found — run `expo export -p web` first.');
  process.exit(1);
}

copyFileSync(resolve('assets/images/icon.png'), resolve(dist, 'app-icon.png'));

const manifest = {
  name: 'Gentle Parent',
  short_name: 'Gentle Parent',
  description: 'Calm, practical AI parenting support — built for South African families.',
  start_url: '/',
  display: 'standalone',
  orientation: 'portrait',
  background_color: '#FAF7F4',
  theme_color: '#C9397A',
  icons: [
    { src: '/app-icon.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
    { src: '/app-icon.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
  ],
};
writeFileSync(resolve(dist, 'manifest.json'), JSON.stringify(manifest, null, 2));

const inject = `
    <link rel="manifest" href="/manifest.json" />
    <link rel="apple-touch-icon" href="/app-icon.png" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <meta name="apple-mobile-web-app-title" content="Gentle Parent" />
    <meta name="mobile-web-app-capable" content="yes" />`;

// Inject into every exported HTML route so installability works from any entry.
for (const file of ['index.html', 'onboarding.html', '+not-found.html']) {
  const p = resolve(dist, file);
  if (!existsSync(p)) continue;
  let html = readFileSync(p, 'utf8');
  if (!html.includes('rel="manifest"')) {
    html = html.replace('</head>', `${inject}\n  </head>`);
    writeFileSync(p, html);
  }
}
console.log('PWA assets written to dist/ (manifest.json, app-icon.png, head tags).');
