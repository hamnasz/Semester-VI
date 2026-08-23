/**
 * Headless smoke test for the Field Journal frontend.
 * Fetches the real repository tree from the GitHub API (needs internet
 * access + Node 18+ for global fetch), then loads index.html into jsdom
 * with window.fetch stubbed to serve that already-fetched data — so the
 * app's own fetch calls are deterministic and don't re-hit the network
 * or GitHub's rate limit on every test run.
 *
 * Run from the repo root:  node test/smoke.js
 * (requires: npm install   — installs the jsdom dev dependency)
 */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const staticServer = require('./static-server');

const OWNER = 'hamnasz';
const REPO = 'Semester-VI';
const BRANCH = 'main';

const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const errors = [];

function wait(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function main() {
  const server = await staticServer.start();
  const port = server.address().port;

  const cachePath = path.join(__dirname, '.fixture-cache.json');
  let repoMeta, rawTree;
  try {
    repoMeta = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}`).then((r) => r.json());
    rawTree = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/git/trees/${BRANCH}?recursive=1`).then((r) => r.json());
    if (!rawTree || !rawTree.tree) throw new Error(rawTree && rawTree.message || 'unexpected API response');
    fs.writeFileSync(cachePath, JSON.stringify({ repoMeta, rawTree }));
  } catch (e) {
    if (fs.existsSync(cachePath)) {
      console.warn(`Live fetch failed (${e.message}) — reusing the last successful response cached at ${cachePath}.`);
      ({ repoMeta, rawTree } = JSON.parse(fs.readFileSync(cachePath, 'utf8')));
    } else {
      throw new Error(`Could not reach the GitHub API and no cached fixture exists yet: ${e.message}`);
    }
  }

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
        if (url.includes('/git/trees/')) {
          return { ok: true, status: 200, headers: { get: () => null }, json: async () => rawTree };
        }
        if (url.match(/api\.github\.com\/repos\/[^/]+\/[^/]+$/)) {
          return { ok: true, status: 200, headers: { get: () => null }, json: async () => repoMeta };
        }
        if (url.startsWith('https://raw.githubusercontent.com')) {
          const isNotebook = url.endsWith('.ipynb');
          const mockNotebook = JSON.stringify({
            cells: [
              { cell_type: 'markdown', source: ['# Mock notebook\n', 'a heading cell'] },
              { cell_type: 'code', execution_count: 1, source: ['print("hi")'], outputs: [{ text: ['hi\n'] }] },
            ],
          });
          return {
            ok: true, status: 200,
            headers: { get: () => 'text/plain' },
            text: async () => (isNotebook ? mockNotebook : '# Mock file\n\nThis is **mock** raw content for `' + url + '`.\n\n- one\n- two\n'),
            blob: async () => ({ size: 123, type: 'text/plain' }),
          };
        }
        return { ok: false, status: 404, headers: { get: () => null } };
      };

      window.onerror = (msg, src, line, col, err) => errors.push(`${msg} (${src}:${line}:${col})`);
      window.addEventListener('unhandledrejection', (e) => errors.push('unhandledrejection: ' + (e.reason && e.reason.stack || e.reason)));
    },
  });

  const { window } = dom;
  const results = {};

  await wait(400);

  results['cover visible initially'] = !window.document.getElementById('view-cover').hidden;
  results['toc rendered with subjects'] = window.document.querySelectorAll('#toc-list .toc-item').length > 0;
  results['meta chips rendered'] = window.document.getElementById('cover-meta').textContent.includes('files archived');

  window.location.hash = '#/browse';
  await wait(150);
  results['archive visible after navigating'] = !window.document.getElementById('view-archive').hidden;
  results['chapter rail has tabs'] = window.document.querySelectorAll('.chapter-tab').length > 0;
  results['grid shows top-level folders'] = window.document.querySelectorAll('.folder-card').length > 0;

  const firstSubjectPath = rawTree.tree.find((n) => n.type === 'tree' && !n.path.includes('/')).path;
  window.location.hash = '#/browse/' + encodeURIComponent(firstSubjectPath);
  await wait(150);
  results['breadcrumb shows subject'] = window.document.getElementById('breadcrumb-strip').textContent.includes(firstSubjectPath);

  // The app only shows a fixed allow-list of top-level subjects (see app.js).
  // Read that back from what's actually rendered, so test fixtures picked
  // from the raw (unfiltered) tree — like a root-level README.md — never
  // get used to probe a viewer path the app itself would hide.
  const visibleSubjects = new Set(
    Array.from(window.document.querySelectorAll('.chapter-tab')).map((t) => t.textContent.trim())
  );
  const isVisible = (p) => visibleSubjects.has(p.split('/')[0]);
  const findFirst = (pred) => rawTree.tree.find((n) => n.type === 'blob' && isVisible(n.path) && pred(n.path));
  const toHash = (p) => '#/file/' + p.split('/').map(encodeURIComponent).join('/');

  const mdFile = findFirst((p) => p.endsWith('.md'));
  if (mdFile) {
    window.location.hash = toHash(mdFile.path);
    await wait(200);
    results['viewer overlay opens for a file'] = !window.document.getElementById('viewer-overlay').hidden;
    results['viewer shows filename'] = window.document.getElementById('viewer-filename').textContent.length > 0;
    results['markdown rendered inline'] = window.document.getElementById('viewer-body').innerHTML.includes('viewer-markdown');
  }

  window.document.getElementById('btn-close-viewer').click();
  await wait(120);
  results['viewer overlay closes'] = window.document.getElementById('viewer-overlay').hidden;

  window.location.hash = '#/browse';
  await wait(120);
  const search = window.document.getElementById('search-input');
  search.value = 'lecture';
  search.dispatchEvent(new window.Event('input'));
  await wait(300);
  results['search produces results or no-results state'] =
    !window.document.getElementById('card-grid').hidden || !window.document.getElementById('state-no-results').hidden;

  const pdfChip = Array.from(window.document.querySelectorAll('.chip')).find((c) => c.textContent === 'PDF');
  if (pdfChip) { pdfChip.click(); await wait(150); }
  results['filter chip applies without throwing'] = true;

  const csvFile = findFirst((p) => p.endsWith('.csv'));
  if (csvFile) {
    window.location.hash = toHash(csvFile.path);
    await wait(200);
    results['csv renders as table'] = window.document.querySelector('.viewer-csv-table') !== null;
  }

  const nbFile = findFirst((p) => p.endsWith('.ipynb'));
  if (nbFile) {
    window.location.hash = toHash(nbFile.path);
    await wait(200);
    results['notebook renders cells'] = window.document.querySelector('.notebook-cell') !== null;
  }

  const pptxFile = findFirst((p) => p.endsWith('.pptx'));
  if (pptxFile) {
    window.location.hash = toHash(pptxFile.path);
    await wait(200);
    results['pptx online preview loads automatically'] = window.document.querySelector('[data-office-iframe]') !== null;
  }

  const docxFile = findFirst((p) => p.endsWith('.docx'));
  if (docxFile) {
    window.location.hash = toHash(docxFile.path);
    await wait(200);
    results['docx online preview loads automatically'] = window.document.querySelector('[data-office-iframe]') !== null;
  }

  const bigPdf = rawTree.tree
    .filter((n) => n.type === 'blob' && isVisible(n.path) && n.path.endsWith('.pdf'))
    .sort((a, b) => (b.size || 0) - (a.size || 0))[0];
  if (bigPdf && bigPdf.size > 20 * 1024 * 1024) {
    window.location.hash = toHash(bigPdf.path);
    await wait(200);
    results['oversized pdf shows size-aware fallback'] =
      window.document.querySelector('.fallback-card') !== null &&
      window.document.getElementById('viewer-body').textContent.includes('too large to preview inline');
  }

  window.document.getElementById('btn-home').click();
  await wait(120);
  results['home button returns to cover'] = !window.document.getElementById('view-cover').hidden;

  console.log('\n=== RESULTS ===');
  let failCount = 0;
  for (const [k, v] of Object.entries(results)) {
    console.log(`${v ? 'PASS' : 'FAIL'}  ${k}`);
    if (!v) failCount++;
  }

  console.log('\n=== JS ERRORS CAUGHT ===');
  if (errors.length === 0) console.log('(none)');
  else errors.forEach((e) => console.log('ERROR:', e));

  server.close();
  process.exit(failCount > 0 || errors.length > 0 ? 1 : 0);
}

main().catch((e) => { console.error('Test setup failed:', e); process.exit(1); });
