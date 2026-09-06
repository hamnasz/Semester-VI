/**
 * Ad-hoc verification for the scrapbook redesign additions — not part of
 * the shipped test suite, just checks the new hooks (subject icons, the
 * subject banner, per-type card classes, image thumbnails, decorative
 * accents) actually show up in the live DOM. Mirrors smoke.js's own
 * JSDOM + fetch-stub setup, reusing the same offline fixture.
 */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const staticServer = require('./static-server');

const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const { repoMeta, rawTree } = JSON.parse(fs.readFileSync(path.join(__dirname, '.fixture-cache.json'), 'utf8'));

function wait(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function main() {
  const server = await staticServer.start();
  const port = server.address().port;

  const dom = new JSDOM(html, {
    url: `http://127.0.0.1:${port}/`,
    runScripts: 'dangerously',
    resources: 'usable',
    pretendToBeVisual: true,
    beforeParse(window) {
      window.URL.createObjectURL = () => 'blob:mock';
      window.URL.revokeObjectURL = () => {};
      window.scrollTo = () => {};
      window.fetch = async (url) => {
        if (url.includes('/git/trees/')) return { ok: true, status: 200, headers: { get: () => null }, json: async () => rawTree };
        if (url.match(/api\.github\.com\/repos\/[^/]+\/[^/]+$/)) return { ok: true, status: 200, headers: { get: () => null }, json: async () => repoMeta };
        if (url.startsWith('https://raw.githubusercontent.com')) {
          return { ok: true, status: 200, headers: { get: () => 'text/plain' }, text: async () => 'mock raw content', blob: async () => ({ size: 123, type: 'text/plain' }) };
        }
        return { ok: false, status: 404, headers: { get: () => null } };
      };
      window.onerror = () => {};
    },
  });

  const { window } = dom;
  const doc = window.document;
  const q = (s) => doc.querySelector(s);
  const qa = (s) => Array.from(doc.querySelectorAll(s));
  const results = {};
  const check = (name, cond) => { results[name] = !!cond; };

  await wait(900);

  check('cover shows subject doodles in TOC (>=6)', qa('#toc-list .toc-item .toc-doodle svg').length >= 6);
  check('cover taped cards (3) + spine holes present', qa('.taped-card').length === 3 && qa('.cover-spine').length === 1);
  check('cover star sticker + pencil underline present', qa('.sticker-star').length === 1 && qa('.pencil-underline').length === 1);

  window.location.hash = '#/browse';
  await wait(150);
  check('chapter tabs carry doodle icons (>=6)', qa('.chapter-tab .tab-doodle svg').length >= 6);

  let sawBannerEverywhere = true;
  let sawKindClass = false;
  let sawImageThumb = false;
  let sawPinOrClip = false;
  const subjectPaths = qa('.chapter-tab').map((b) => decodeURIComponent(b.dataset.path));

  for (const p of subjectPaths) {
    window.location.hash = `#/browse/${encodeURIComponent(p)}`;
    await wait(60);
    const banner = q('#subject-banner');
    if (!banner || banner.hidden || !banner.querySelector('.subject-banner-doodle svg')) sawBannerEverywhere = false;
    if (qa('.file-card').some((c) => /file-card--[a-z]+/.test(c.className))) sawKindClass = true;
    if (q('.file-photo img')) sawImageThumb = true;
    if (qa('.item-card').some((c) => c.classList.contains('has-pin') || c.classList.contains('has-clip'))) sawPinOrClip = true;

    const folderBtn = q('[data-folder]');
    if (folderBtn) {
      const subPath = decodeURIComponent(folderBtn.dataset.folder);
      window.location.hash = `#/browse/${encodeURIComponent(subPath)}`;
      await wait(60);
      const banner2 = q('#subject-banner');
      if (!banner2 || banner2.hidden) sawBannerEverywhere = false;
      if (qa('.file-card').some((c) => /file-card--[a-z]+/.test(c.className))) sawKindClass = true;
      if (q('.file-photo img')) sawImageThumb = true;
      if (qa('.item-card').some((c) => c.classList.contains('has-pin') || c.classList.contains('has-clip'))) sawPinOrClip = true;
    }
  }
  check('subject banner (with doodle) shown for every real subject + nested folders', sawBannerEverywhere);
  check('at least one file-card--<kind> class rendered somewhere', sawKindClass);
  check('selective pin/clip accents render on some cards', sawPinOrClip);

  // Images can sit several folders deep, deeper than the one level the
  // loop above descends — jump straight to a folder known (from the
  // fixture) to contain one, rather than clicking through the UI.
  const imageEntry = rawTree.tree.find((e) => e.type === 'blob' && /\.(png|jpe?g)$/i.test(e.path));
  if (imageEntry) {
    const parent = imageEntry.path.split('/').slice(0, -1).join('/');
    window.location.hash = `#/browse/${encodeURIComponent(parent)}`;
    await wait(150);
  }
  check('at least one image renders as a polaroid thumbnail', !!q('.file-photo img'));

  window.location.hash = '#/browse';
  await wait(60);
  const searchInput = q('#search-input');
  searchInput.value = 'a';
  searchInput.dispatchEvent(new window.Event('input'));
  await wait(250);
  check('subject banner hides during search', q('#subject-banner').hidden === true);

  console.log('\n=== REDESIGN VERIFICATION ===');
  let fail = 0;
  for (const [k, v] of Object.entries(results)) {
    console.log(v ? 'PASS ' : 'FAIL ', k);
    if (!v) fail++;
  }
  console.log(fail === 0 ? '\nAll redesign checks passed.' : `\n${fail} check(s) failed.`);
  server.close();
  process.exitCode = fail === 0 ? 0 : 1;
}

main().catch((e) => { console.error('Verification setup failed:', e); process.exitCode = 1; });
