/* =========================================================================
   viewers.js
   Turns a { path, size } file entry into the right kind of preview:
   inline for PDFs / images / markdown / text / code, a clean fallback
   card (with an optional on-demand Office preview) for pptx/ppt/docx,
   and a generic download card for anything else.
   ========================================================================= */

const Viewers = (() => {

  const LARGE_FILE_BYTES = 20 * 1024 * 1024; // above this, skip inline fetch, offer a direct-open link instead
  let currentPdfBlobUrl = null; // tracked so we can revoke the previous one before minting a new one

  const EXT_GROUPS = {
    image: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp'],
    pdf: ['pdf'],
    markdown: ['md', 'markdown'],
    text: ['txt', 'log'],
    code: ['js', 'py', 'json', 'css', 'html', 'java', 'c', 'cpp', 'ts', 'sql', 'sh', 'yml', 'yaml', 'xml'],
    notebook: ['ipynb'],
    csv: ['csv'],
    document: ['docx', 'doc'],
    presentation: ['ppt', 'pptx'],
    spreadsheet: ['xlsx', 'xls'],
  };

  function extOf(path) {
    const name = path.split('/').pop();
    const m = name.match(/\.([a-z0-9]+)$/i);
    return m ? m[1].toLowerCase() : '';
  }

  function classify(path) {
    const ext = extOf(path);
    for (const [kind, exts] of Object.entries(EXT_GROUPS)) {
      if (exts.includes(ext)) return kind;
    }
    return 'other';
  }

  /** Coarse buckets used by the filter chips — deliberately generic, not tied to any one repo's folder names. */
  function filterGroup(path) {
    const kind = classify(path);
    if (kind === 'pdf') return 'PDF';
    if (kind === 'image') return 'Images';
    if (kind === 'presentation') return 'Presentations';
    if (kind === 'document') return 'Documents';
    if (kind === 'spreadsheet' || kind === 'csv') return 'Spreadsheets';
    if (kind === 'markdown' || kind === 'text' || kind === 'code' || kind === 'notebook') return 'Code & Notes';
    return 'Other';
  }

  const KIND_ICON = {
    image: '🖼️', pdf: '📕', markdown: '📝', text: '📄', code: '💻',
    notebook: '📓', csv: '📊', document: '📘', presentation: '📙',
    spreadsheet: '📗', other: '📎', folder: '🗂️',
  };

  const BADGE_COLOR = {
    pdf: '#96402f', image: '#63744e', markdown: '#3a5a7a', text: '#5c6672',
    code: '#26313c', notebook: '#3a5a7a', csv: '#4c5c3b', document: '#3a5a7a',
    presentation: '#96402f', spreadsheet: '#4c5c3b', other: '#8b7355',
  };

  function fileIcon(path) { return KIND_ICON[classify(path)] || KIND_ICON.other; }
  function badgeColor(path) { return BADGE_COLOR[classify(path)] || BADGE_COLOR.other; }

  /** Deterministic pastel-ish hue from a string — used for subject tab accents so nothing about a repo's folder names is hardcoded. */
  function hashHue(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
    return h % 360;
  }
  function hashColor(str, sat = 42, light = 38) {
    return `hsl(${hashHue(str)}, ${sat}%, ${light}%)`;
  }

  function formatBytes(bytes) {
    if (!bytes) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    let i = 0; let n = bytes;
    while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; }
    return `${n < 10 && i > 0 ? n.toFixed(1) : Math.round(n)} ${units[i]}`;
  }

  function escapeHtml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* ------------------------------------------------------------------
     A small, dependency-free markdown renderer. Covers headings, bold/
     italic, inline code, fenced code blocks, links, images (resolved
     relative to the file's own folder via the GitHub raw URL), lists,
     blockquotes, horizontal rules and simple pipe tables — everything
     a course README or notes file realistically uses.
     ------------------------------------------------------------------ */
  function renderMarkdown(src, basePath) {
    const lines = src.replace(/\r\n/g, '\n').split('\n');
    let html = '';
    let i = 0;
    let inCode = false, codeBuf = [], codeLang = '';
    let listBuf = [], listType = null;

    function flushList() {
      if (listBuf.length) {
        html += `<${listType}>${listBuf.join('')}</${listType}>`;
        listBuf = []; listType = null;
      }
    }

    function inline(text) {
      let t = escapeHtml(text);
      t = t.replace(/`([^`]+)`/g, '<code>$1</code>');
      t = t.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (m, alt, url) => {
        const resolved = /^https?:\/\//.test(url) ? url : GitHubAPI.rawUrl(joinPath(basePath, url));
        return `<img alt="${alt}" src="${resolved}">`;
      });
      t = t.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (m, label, url) => {
        const href = /^https?:\/\//.test(url) ? url : GitHubAPI.rawUrl(joinPath(basePath, url));
        return `<a href="${href}" target="_blank" rel="noopener">${label}</a>`;
      });
      t = t.replace(/\*\*([^*]+)\*\*|__([^_]+)__/g, (m, a, b) => `<strong>${a || b}</strong>`);
      t = t.replace(/(?<!\*)\*([^*\n]+)\*(?!\*)|(?<!_)_([^_\n]+)_(?!_)/g, (m, a, b) => `<em>${a || b}</em>`);
      return t;
    }

    while (i < lines.length) {
      const line = lines[i];

      const fence = line.match(/^```(\w*)/);
      if (fence) {
        if (!inCode) { inCode = true; codeLang = fence[1] || ''; codeBuf = []; }
        else { html += `<pre><code class="lang-${codeLang}">${escapeHtml(codeBuf.join('\n'))}</code></pre>`; inCode = false; }
        i++; continue;
      }
      if (inCode) { codeBuf.push(line); i++; continue; }

      if (/^\s*$/.test(line)) { flushList(); i++; continue; }

      const h = line.match(/^(#{1,4})\s+(.*)/);
      if (h) { flushList(); html += `<h${h[1].length}>${inline(h[2])}</h${h[1].length}>`; i++; continue; }

      if (/^(-{3,}|\*{3,})\s*$/.test(line)) { flushList(); html += '<hr>'; i++; continue; }

      const bq = line.match(/^>\s?(.*)/);
      if (bq) { flushList(); html += `<blockquote>${inline(bq[1])}</blockquote>`; i++; continue; }

      const ul = line.match(/^\s*[-*]\s+(.*)/);
      if (ul) { if (listType !== 'ul') { flushList(); listType = 'ul'; } listBuf.push(`<li>${inline(ul[1])}</li>`); i++; continue; }

      const ol = line.match(/^\s*\d+\.\s+(.*)/);
      if (ol) { if (listType !== 'ol') { flushList(); listType = 'ol'; } listBuf.push(`<li>${inline(ol[1])}</li>`); i++; continue; }

      if (line.includes('|') && lines[i + 1] && /^[\s|:-]+$/.test(lines[i + 1]) && lines[i + 1].includes('-')) {
        flushList();
        const headCells = line.split('|').map((c) => c.trim()).filter(Boolean);
        let body = `<table><thead><tr>${headCells.map((c) => `<th>${inline(c)}</th>`).join('')}</tr></thead><tbody>`;
        i += 2;
        while (i < lines.length && lines[i].includes('|')) {
          const cells = lines[i].split('|').map((c) => c.trim()).filter((c, idx, arr) => !(c === '' && (idx === 0 || idx === arr.length - 1)));
          body += `<tr>${cells.map((c) => `<td>${inline(c)}</td>`).join('')}</tr>`;
          i++;
        }
        html += body + '</tbody></table>';
        continue;
      }

      flushList();
      html += `<p>${inline(line)}</p>`;
      i++;
    }
    flushList();
    return html;
  }

  function joinPath(base, rel) {
    if (rel.startsWith('/')) return rel.slice(1);
    const baseParts = base.split('/').slice(0, -1);
    const relParts = rel.split('/');
    for (const part of relParts) {
      if (part === '.' || part === '') continue;
      if (part === '..') baseParts.pop();
      else baseParts.push(part);
    }
    return baseParts.join('/');
  }

  /* ------------------------------------------------------------------
     CSV → table (simple RFC4180-ish parser: handles quoted fields
     and escaped quotes, which covers the vast majority of real CSVs).
     ------------------------------------------------------------------ */
  function parseCsv(text) {
    const rows = [];
    let row = [], field = '', inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (inQuotes) {
        if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
        else if (c === '"') inQuotes = false;
        else field += c;
      } else if (c === '"') inQuotes = true;
      else if (c === ',') { row.push(field); field = ''; }
      else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
      else if (c === '\r') { /* skip */ }
      else field += c;
    }
    if (field.length || row.length) { row.push(field); rows.push(row); }
    return rows.filter((r) => r.length > 1 || r[0] !== '');
  }

  function renderCsvTable(text) {
    const rows = parseCsv(text).slice(0, 500);
    if (!rows.length) return '<p>This spreadsheet looks empty.</p>';
    const [head, ...body] = rows;
    let html = '<table class="viewer-csv-table"><thead><tr>';
    head.forEach((c) => { html += `<th>${escapeHtml(c)}</th>`; });
    html += '</tr></thead><tbody>';
    body.forEach((r) => {
      html += '<tr>' + r.map((c) => `<td>${escapeHtml(c)}</td>`).join('') + '</tr>';
    });
    html += '</tbody></table>';
    if (rows.length >= 500) html += '<p class="size-notice" style="margin-top:14px;">Showing the first 500 rows.</p>';
    return html;
  }

  /* ------------------------------------------------------------------
     Jupyter notebook → readable cell-by-cell view.
     ------------------------------------------------------------------ */
  function renderNotebook(jsonText) {
    let nb;
    try { nb = JSON.parse(jsonText); } catch (e) { return null; }
    const cells = nb.cells || [];
    if (!cells.length) return '<p>This notebook has no cells.</p>';
    let html = '';
    cells.forEach((cell) => {
      const src = Array.isArray(cell.source) ? cell.source.join('') : (cell.source || '');
      if (cell.cell_type === 'markdown') {
        html += `<div class="notebook-cell markdown"><div class="notebook-cell-head">markdown</div><div class="notebook-cell-body viewer-markdown">${renderMarkdown(src, '')}</div></div>`;
      } else if (cell.cell_type === 'code') {
        const execCount = cell.execution_count != null ? cell.execution_count : ' ';
        html += `<div class="notebook-cell code"><div class="notebook-cell-head">In [${execCount}]</div><div class="notebook-cell-body">${escapeHtml(src)}</div>`;
        const outputs = (cell.outputs || []).map((o) => {
          if (o.text) return Array.isArray(o.text) ? o.text.join('') : o.text;
          if (o.data && o.data['text/plain']) {
            const t = o.data['text/plain'];
            return Array.isArray(t) ? t.join('') : t;
          }
          return '';
        }).filter(Boolean).join('\n');
        if (outputs) html += `<div class="notebook-output">${escapeHtml(outputs)}</div>`;
        html += '</div>';
      }
    });
    return html;
  }

  /* ------------------------------------------------------------------
     Main entry point — populates the viewer body for a given file.
     ------------------------------------------------------------------ */
  async function render(container, file) {
    const kind = classify(file.path);
    const url = GitHubAPI.rawUrl(file.path);
    const ghUrl = GitHubAPI.githubBlobUrl(file.path);

    container.className = 'viewer-body';
    container.innerHTML = '<div class="viewer-loading"><div class="loader-book"><div class="loader-page"></div><div class="loader-page"></div><div class="loader-page"></div></div><span>Opening the page…</span></div>';

    try {
      if (kind === 'image') {
        container.classList.add('pad');
        container.innerHTML = `<div class="viewer-image-wrap"><img src="${url}" alt="${escapeHtml(file.path)}"></div>`;
        return;
      }

      if (kind === 'pdf') {
        if (file.size > LARGE_FILE_BYTES) {
          container.classList.add('pad');
          container.innerHTML = fallbackHtml(file, ghUrl, url, `This PDF is ${formatBytes(file.size)} — too large to preview inline here, so it opens in your browser's own PDF viewer in a new tab instead.`, 'Open PDF');
          return;
        }
        const res = await fetch(url);
        if (!res.ok) throw new Error('fetch failed');
        // GitHub's raw host serves every file (including PDFs) with
        // `Content-Type: application/octet-stream`, so a plain `res.blob()`
        // inherits that generic type. A blob with an unrecognized MIME type
        // dropped into an iframe makes browsers fall back to downloading it
        // instead of rendering it — which is what produced the "downloads a
        // weird file instead of previewing" symptom. Reading the raw bytes
        // and re-wrapping them in a Blob explicitly typed as `application/pdf`
        // is what lets the browser's built-in PDF viewer take over inline.
        const bytes = await res.arrayBuffer();
        const blob = new Blob([bytes], { type: 'application/pdf' });
        if (currentPdfBlobUrl) URL.revokeObjectURL(currentPdfBlobUrl);
        currentPdfBlobUrl = URL.createObjectURL(blob);
        container.innerHTML = `<iframe class="viewer-frame" src="${currentPdfBlobUrl}" title="${escapeHtml(file.path)}"></iframe>`;
        return;
      }

      if (kind === 'markdown') {
        container.classList.add('pad');
        const res = await fetch(url);
        if (!res.ok) throw new Error('fetch failed');
        const text = await res.text();
        container.innerHTML = `<div class="viewer-markdown">${renderMarkdown(text, file.path)}</div>`;
        return;
      }

      if (kind === 'text' || kind === 'code') {
        container.classList.add('pad');
        const res = await fetch(url);
        if (!res.ok) throw new Error('fetch failed');
        const text = await res.text();
        container.innerHTML = `<pre class="viewer-text">${escapeHtml(text)}</pre>`;
        return;
      }

      if (kind === 'csv') {
        container.classList.add('pad');
        const res = await fetch(url);
        if (!res.ok) throw new Error('fetch failed');
        const text = await res.text();
        container.innerHTML = renderCsvTable(text);
        return;
      }

      if (kind === 'notebook') {
        container.classList.add('pad');
        const res = await fetch(url);
        if (!res.ok) throw new Error('fetch failed');
        const text = await res.text();
        const rendered = renderNotebook(text);
        container.innerHTML = rendered || fallbackHtml(file, ghUrl, url, "This notebook couldn't be parsed for preview.");
        return;
      }

      if (kind === 'document' || kind === 'presentation' || kind === 'spreadsheet') {
        container.classList.add('pad');
        const kindLabel = { document: 'Word document', presentation: 'PowerPoint deck', spreadsheet: 'spreadsheet' }[kind];
        if (file.size > LARGE_FILE_BYTES) {
          container.innerHTML = fallbackHtml(file, ghUrl, url, `This ${kindLabel} is ${formatBytes(file.size)} — too large for the online preview. View it on GitHub or download it instead.`);
          return;
        }
        // Loads straight into the online viewer — no extra click required.
        container.innerHTML = officeAutoHtml(file, ghUrl, url, kindLabel);
        return;
      }

      // anything else → generic download card
      container.classList.add('pad');
      container.innerHTML = fallbackHtml(file, ghUrl, url, `This file can't be rendered inline here — view it on GitHub or download it to open in its native app.`);

    } catch (err) {
      container.classList.add('pad');
      container.innerHTML = `<div class="viewer-error"><span style="font-size:32px;">📄</span><p>This file couldn't be loaded for preview.<br>Try opening it on GitHub instead.</p></div>`;
    }
  }

  function fallbackHtml(file, ghUrl, rawUrl, message, primaryLabel = 'Download') {
    return `
      <div class="fallback-card">
        <span class="fallback-icon">${fileIcon(file.path)}</span>
        <h3>${escapeHtml(file.path.split('/').pop())}</h3>
        <p>${message}</p>
        <div class="fallback-actions">
          <a class="btn btn-ghost btn-sm" href="${ghUrl}" target="_blank" rel="noopener">View on GitHub</a>
          <a class="btn btn-primary btn-sm" href="${rawUrl}" target="_blank" rel="noopener" download>${primaryLabel}</a>
        </div>
      </div>`;
  }

  /**
   * Word/PowerPoint/Excel files load straight into Microsoft's online
   * viewer — no "try an online preview" click required. The viewer fetches
   * the file itself server-side, so GitHub's raw-host X-Frame-Options
   * (which is what forces the PDF path below through a blob: URL) never
   * comes into play here.
   */
  function officeAutoHtml(file, ghUrl, rawUrl, kindLabel) {
    const officeSrc = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(rawUrl)}`;
    return `
      <div class="office-auto">
        <div class="office-auto-head">
          <span class="fallback-icon">${fileIcon(file.path)}</span>
          <div class="office-auto-title">
            <h3>${escapeHtml(file.path.split('/').pop())}</h3>
            <p>${kindLabel} · ${formatBytes(file.size)}</p>
          </div>
          <div class="fallback-actions">
            <a class="btn btn-ghost btn-sm" href="${ghUrl}" target="_blank" rel="noopener">View on GitHub</a>
            <a class="btn btn-primary btn-sm" href="${rawUrl}" target="_blank" rel="noopener" download>Download</a>
          </div>
        </div>
        <div class="office-frame-wrap" data-office-frame>
          <iframe class="viewer-frame" src="${officeSrc}" title="Online preview" data-office-iframe></iframe>
        </div>
        <p class="office-auto-note">Previewed via Microsoft's online viewer. If it doesn't load, view on GitHub or download the file instead.</p>
      </div>`;
  }

  return { classify, filterGroup, fileIcon, badgeColor, hashColor, formatBytes, extOf, render };
})();
