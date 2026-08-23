const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const staticServer = require('./static-server');

const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const errors = [];
let attempt = 0;

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

      // first attempt: simulate an exhausted rate limit. second attempt (after retry): succeed with an empty tree.
      window.fetch = async (url) => {
        if (url.includes('/git/trees/')) {
          attempt++;
          if (attempt === 1) {
            return {
              ok: false, status: 403,
              headers: { get: (h) => (h === 'x-ratelimit-remaining' ? '0' : h === 'x-ratelimit-reset' ? String(Math.floor(Date.now() / 1000) + 1800) : null) },
              json: async () => ({}),
            };
          }
          return { ok: true, status: 200, headers: { get: () => null }, json: async () => ({ truncated: false, tree: [] }) };
        }
        if (url.match(/api\.github\.com\/repos\/[^/]+\/[^/]+$/)) {
          return { ok: true, status: 200, headers: { get: () => null }, json: async () => ({}) };
        }
        return { ok: false, status: 404, headers: { get: () => null } };
      };

      window.onerror = (msg, src, line, col, err) => errors.push(`${msg} (${src}:${line}:${col})`);
      window.addEventListener('unhandledrejection', (e) => errors.push('unhandledrejection: ' + (e.reason && e.reason.stack || e.reason)));
    },
  });

  const { window } = dom;
  const results = {};

  await wait(300);

  window.location.hash = '#/browse';
  await wait(150);

  results['error state shown on rate limit'] = !window.document.getElementById('state-error').hidden;
  results['error message mentions rate limit'] = window.document.getElementById('error-title').textContent.toLowerCase().includes('slow down');

  window.document.getElementById('btn-retry').click();
  await wait(300);

  results['retry succeeds and clears error state'] = window.document.getElementById('state-error').hidden;
  results['empty tree shows empty-folder state'] = !window.document.getElementById('state-empty').hidden;

  console.log('\n=== RESULTS (error/retry/empty) ===');
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
