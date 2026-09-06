/* =========================================================================
   app.js — boots the journal, fetches the live tree once, then handles
   all navigation, search, filtering, and the file-viewer overlay purely
   client-side against that in-memory data.
   ========================================================================= */

(() => {
  /**
   * Only these top-level folders from the source repo are shown in the
   * journal — everything else (other subjects, stray root files, etc.)
   * is filtered out of the tree right after it's fetched, so every other
   * part of the app (cover TOC, chapter rail, browse grid, search, file
   * counts) automatically only ever sees these subjects. Matching is
   * case-insensitive and trims whitespace so small naming quirks in the
   * repo don't silently drop a subject.
   */
  const ALLOWED_SUBJECTS = [
    'Computer Networks',
    'Computer Vision',
    'Data Mining',
    'Deep Learning',
    'Multivariable Calculus',
    'Theory of Automata',
  ];
  const ALLOWED_SUBJECTS_SET = new Set(ALLOWED_SUBJECTS.map((s) => s.trim().toLowerCase()));

  function isInAllowedSubject(path) {
    const top = path.split('/')[0].trim().toLowerCase();
    return ALLOWED_SUBJECTS_SET.has(top);
  }
  function filterToAllowedSubjects(tree) {
    return tree.filter((item) => isInAllowedSubject(item.path));
  }

  /**
   * One tiny hand-drawn doodle + accent colour per known subject, used on
   * the chapter rail, the cover table of contents, and the subject banner.
   * Anything not in this list (there isn't anything today, but a repo's
   * folders can change) falls back to a generic notebook-page doodle so
   * the journal never breaks if a new subject shows up.
   */
  const SUBJECT_ICONS = {
    'computer networks': {
      color: 'var(--dusty-blue)', tint: 'var(--tint-blue)',
      svg: '<svg viewBox="0 0 32 32" class="subject-doodle" aria-hidden="true"><circle cx="16" cy="7" r="3"/><circle cx="6" cy="25" r="3"/><circle cx="26" cy="25" r="3"/><path d="M16 10v6M13.3 18.6L7.7 22.6M18.7 18.6L24.3 22.6"/></svg>',
    },
    'computer vision': {
      color: 'var(--brick)', tint: 'var(--tint-terracotta)',
      svg: '<svg viewBox="0 0 32 32" class="subject-doodle" aria-hidden="true"><rect x="4" y="10" width="24" height="16" rx="3"/><path d="M11 10l2.3-4h5.4l2.3 4"/><circle cx="16" cy="18" r="5.5"/><circle cx="16" cy="18" r="2"/><circle cx="23" cy="14" r="1.1" fill="currentColor" stroke="none"/></svg>',
    },
    'data mining': {
      color: 'var(--moss)', tint: 'var(--tint-green)',
      svg: '<svg viewBox="0 0 32 32" class="subject-doodle" aria-hidden="true"><path d="M5 27V6M5 27h23"/><path d="M8 22l6-8 5 4 8-11"/><circle cx="8" cy="22" r="1.3" fill="currentColor" stroke="none"/><circle cx="14" cy="14" r="1.3" fill="currentColor" stroke="none"/><circle cx="19" cy="18" r="1.3" fill="currentColor" stroke="none"/><circle cx="27" cy="7" r="1.3" fill="currentColor" stroke="none"/></svg>',
    },
    'deep learning': {
      color: 'var(--lavender)', tint: 'var(--tint-lavender)',
      svg: '<svg viewBox="0 0 32 32" class="subject-doodle" aria-hidden="true"><circle cx="6" cy="7" r="2.1"/><circle cx="6" cy="16" r="2.1"/><circle cx="6" cy="25" r="2.1"/><circle cx="18" cy="10" r="2.1"/><circle cx="18" cy="22" r="2.1"/><circle cx="28" cy="16" r="2.1"/><path d="M8 7l8 3M8 7l8 15M8 16l8-6M8 16l8 6M8 25l8-3M8 25l8-3M20 10l6 6M20 22l6-6"/></svg>',
    },
    'multivariable calculus': {
      color: 'var(--dusty-pink)', tint: 'var(--tint-pink)',
      svg: '<svg viewBox="0 0 32 32" class="subject-doodle" aria-hidden="true"><path d="M4 16h23M19 12.5l4.5 3.5-4.5 3.5"/><path d="M16 28V5M12 9l4-4.5 4 4.5"/><path d="M6 22c4-9 8-13 10-13s5 15 10 5"/></svg>',
    },
    'theory of automata': {
      color: 'var(--brass)', tint: 'var(--tint-yellow)',
      svg: '<svg viewBox="0 0 32 32" class="subject-doodle" aria-hidden="true"><circle cx="8" cy="16" r="5"/><circle cx="24" cy="16" r="5"/><circle cx="24" cy="16" r="7.3"/><path d="M13 13.5c3-2.6 6-2.6 8 0M13 18.5c3 2.6 6 2.6 8 0"/></svg>',
    },
  };
  const DEFAULT_SUBJECT_ICON = {
    color: 'var(--ink-soft)', tint: 'var(--card-bg-alt)',
    svg: '<svg viewBox="0 0 32 32" class="subject-doodle" aria-hidden="true"><path d="M8 4h12l6 6v18H8z"/><path d="M20 4v6h6"/><path d="M11.5 16h9M11.5 20.5h9M11.5 25h5.5"/></svg>',
  };
  function subjectIcon(name) {
    return SUBJECT_ICONS[String(name).trim().toLowerCase()] || DEFAULT_SUBJECT_ICON;
  }

  /** A few close paper shades so neighbouring cards read as separate
   * sheets instead of one uniform slab — picked deterministically from
   * the file's own path, same trick as the existing tilt/tape values. */
  const FILE_SHADES = ['var(--shade-file-0)', 'var(--shade-file-1)', 'var(--shade-file-2)', 'var(--shade-file-3)'];
  const FOLDER_SHADES = ['var(--shade-folder-0)', 'var(--shade-folder-1)', 'var(--shade-folder-2)', 'var(--shade-folder-3)'];

  const state = {
    tree: null,        // flat [{path, type, size}] straight from the GitHub API
    meta: null,        // repo metadata (description, pushed_at, ...)
    loadError: null,
    currentPath: '',    // '' = archive root
    searchQuery: '',
    activeFilter: null, // one of Viewers filter-group labels, or null for "all"
  };

  const el = (id) => document.getElementById(id);
  const qs = (sel, root = document) => root.querySelector(sel);
  const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  /* ---------------------------------------------------------------- helpers on the tree */

  function parentOf(path) {
    const i = path.lastIndexOf('/');
    return i === -1 ? '' : path.slice(0, i);
  }
  function baseName(path) {
    return path.slice(path.lastIndexOf('/') + 1);
  }
  function getChildren(folderPath) {
    if (!state.tree) return { folders: [], files: [] };
    const folders = [];
    const files = [];
    for (const item of state.tree) {
      if (item.path === folderPath) continue;
      if (parentOf(item.path) !== folderPath) continue;
      if (item.type === 'tree') folders.push(item);
      else files.push(item);
    }
    folders.sort((a, b) => baseName(a.path).localeCompare(baseName(b.path)));
    files.sort((a, b) => baseName(a.path).localeCompare(baseName(b.path)));
    return { folders, files };
  }
  function topLevelSubjects() {
    if (!state.tree) return [];
    return state.tree
      .filter((i) => i.type === 'tree' && parentOf(i.path) === '')
      .sort((a, b) => a.path.localeCompare(b.path));
  }
  function descendantFileCount(folderPath) {
    return state.tree.filter((i) => i.type === 'blob' && (i.path === folderPath || i.path.startsWith(folderPath + '/'))).length;
  }
  function fileByPath(path) {
    return state.tree.find((i) => i.type === 'blob' && i.path === path) || null;
  }

  function humanizeDate(iso) {
    if (!iso) return null;
    const then = new Date(iso);
    const diffMs = Date.now() - then.getTime();
    const days = Math.floor(diffMs / 86400000);
    if (days <= 0) return 'today';
    if (days === 1) return 'yesterday';
    if (days < 30) return `${days} days ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months} month${months > 1 ? 's' : ''} ago`;
    const years = Math.floor(months / 12);
    return `${years} year${years > 1 ? 's' : ''} ago`;
  }

  /* ---------------------------------------------------------------- routing */

  function currentRoute() {
    const hash = location.hash.replace(/^#/, '') || '/';
    if (hash === '/' || hash === '') return { view: 'cover' };
    const fileMatch = hash.match(/^\/file\/(.+)$/);
    if (fileMatch) return { view: 'file', path: decodeURIComponent(fileMatch[1]) };
    const browseMatch = hash.match(/^\/browse\/?(.*)$/);
    if (browseMatch) return { view: 'browse', path: decodeURIComponent(browseMatch[1] || '') };
    return { view: 'cover' };
  }

  function goTo(hash) {
    location.hash = hash;
  }
  function navigateFolder(path) {
    goTo(`/browse/${path.split('/').map(encodeURIComponent).join('/')}`);
  }
  function navigateFile(path) {
    goTo(`/file/${path.split('/').map(encodeURIComponent).join('/')}`);
  }

  function handleRoute() {
    const route = currentRoute();
    if (route.view === 'cover') {
      showView('cover');
      return;
    }
    showView('archive');
    closeViewer();
    if (route.view === 'file') {
      const file = state.tree && fileByPath(route.path);
      state.currentPath = parentOf(route.path);
      renderArchiveChrome();
      if (file) openViewer(file);
      else if (state.tree) navigateFolder(state.currentPath); // stale link, just fall back to the folder
      return;
    }
    // browse
    state.currentPath = route.path;
    state.searchQuery = '';
    el('search-input').value = '';
    el('search-clear').hidden = true;
    renderArchiveChrome();
  }

  function showView(name) {
    el('view-cover').hidden = name !== 'cover';
    el('view-archive').hidden = name !== 'archive';
  }

  /* ---------------------------------------------------------------- boot */

  async function boot() {
    window.addEventListener('hashchange', handleRoute);
    wireStaticUI();
    handleRoute(); // show correct shell immediately, data fills in as it arrives

    const [meta, treeResult] = await Promise.allSettled([
      GitHubAPI.fetchRepoMeta(),
      GitHubAPI.fetchTree(),
    ]);

    if (meta.status === 'fulfilled') state.meta = meta.value;

    if (treeResult.status === 'fulfilled') {
      state.tree = filterToAllowedSubjects(treeResult.value);
      state.loadError = null;
    } else {
      state.loadError = treeResult.reason;
    }

    renderCover();
    handleRoute(); // re-run now that data has arrived, so a deep-linked file/folder route resolves correctly
  }

  function retryLoad() {
    state.loadError = null;
    renderLoadingState();
    boot();
  }

  /* ---------------------------------------------------------------- cover */

  function renderCover() {
    const metaEl = el('cover-meta');
    const tocEl = el('toc-list');

    if (state.loadError && !state.tree) {
      metaEl.innerHTML = `<div class="meta-chip">the archive is warming up — open the journal to retry</div>`;
      tocEl.innerHTML = `<li class="toc-skel" style="color:var(--ink-faint); font-size:14px; padding:13px 6px;">Table of contents will appear once the archive loads.</li>`;
      return;
    }
    if (!state.tree) return; // still loading, keep skeletons

    const fileCount = state.tree.filter((i) => i.type === 'blob').length;
    const subjects = topLevelSubjects();
    const chipTilts = [-1.1, 0.9, -0.6];
    const chips = [
      `<div class="meta-chip" style="--tilt:${chipTilts[0]}deg"><b>${fileCount}</b> files archived</div>`,
      `<div class="meta-chip" style="--tilt:${chipTilts[1]}deg"><b>${subjects.length}</b> subjects</div>`,
    ];
    if (state.meta && state.meta.pushed_at) {
      chips.push(`<div class="meta-chip" style="--tilt:${chipTilts[2]}deg">last entry <b>${humanizeDate(state.meta.pushed_at)}</b></div>`);
    }
    metaEl.innerHTML = chips.join('');

    tocEl.innerHTML = subjects.map((s, idx) => {
      const count = descendantFileCount(s.path);
      const num = String(idx + 1).padStart(2, '0');
      const icon = subjectIcon(baseName(s.path));
      return `<li><button class="toc-item" data-subject="${encodeURIComponent(s.path)}" style="--tab-accent:${icon.color}">
        <span class="toc-num">${num}</span>
        <span class="toc-doodle">${icon.svg}</span>
        <span class="toc-name">${escapeHtml(baseName(s.path))}</span>
        <span class="toc-count">${count} file${count === 1 ? '' : 's'}</span>
      </button></li>`;
    }).join('') || `<li style="color:var(--ink-faint); padding:13px 6px;">No subjects found at the repository root.</li>`;

    qsa('.toc-item', tocEl).forEach((btn) => {
      btn.addEventListener('click', () => navigateFolder(decodeURIComponent(btn.dataset.subject)));
    });
  }

  /* ---------------------------------------------------------------- archive chrome (rail + breadcrumb + grid) */

  function renderArchiveChrome() {
    if (state.loadError && !state.tree) { showState('error'); renderErrorDetails(); return; }
    if (!state.tree) { showState('loading'); return; }

    renderChapterRail();
    renderBreadcrumb();
    renderSubjectHeader();
    renderGrid();
  }

  function renderChapterRail() {
    const rail = el('chapter-rail-inner');
    const subjects = topLevelSubjects();
    rail.innerHTML = subjects.map((s) => {
      const isActive = state.currentPath === s.path || state.currentPath.startsWith(s.path + '/');
      const icon = subjectIcon(baseName(s.path));
      return `<button class="chapter-tab ${isActive ? 'active' : ''}" data-path="${encodeURIComponent(s.path)}" style="--tab-accent:${icon.color}; --tab-tint:${icon.tint}">
        <span class="tab-doodle">${icon.svg}</span>${escapeHtml(baseName(s.path))}
      </button>`;
    }).join('');
    qsa('.chapter-tab', rail).forEach((btn) => {
      btn.addEventListener('click', () => navigateFolder(decodeURIComponent(btn.dataset.path)));
    });
  }

  /** Small themed strip shown only while browsing inside one subject —
   * ties the chapter-rail colour/doodle back to the grid beneath it. */
  function renderSubjectHeader() {
    const banner = el('subject-banner');
    if (!banner) return;
    if (state.searchQuery || !state.currentPath) { banner.hidden = true; return; }
    const topSegment = state.currentPath.split('/')[0];
    const icon = subjectIcon(topSegment);
    const count = descendantFileCount(topSegment);
    banner.hidden = false;
    banner.style.setProperty('--tab-accent', icon.color);
    banner.style.setProperty('--tab-tint', icon.tint);
    banner.innerHTML = `<span class="subject-banner-doodle">${icon.svg}</span>
      <span class="subject-banner-text">
        <span class="subject-banner-name">${escapeHtml(topSegment)}</span>
        <span class="subject-banner-note">${count} file${count === 1 ? '' : 's'} filed away in this chapter</span>
      </span>`;
  }

  function renderBreadcrumb() {
    const strip = el('breadcrumb-strip');
    if (state.searchQuery) {
      strip.innerHTML = `<button class="crumb" data-path="">Home</button><span class="crumb-sep">›</span><span class="crumb current">Search: “${escapeHtml(state.searchQuery)}”</span>`;
    } else {
      const segments = state.currentPath ? state.currentPath.split('/') : [];
      let acc = '';
      let html = `<button class="crumb ${segments.length === 0 ? 'current' : ''}" data-path="">Home</button>`;
      segments.forEach((seg, idx) => {
        acc = acc ? `${acc}/${seg}` : seg;
        const isLast = idx === segments.length - 1;
        html += `<span class="crumb-sep">›</span>`;
        html += isLast
          ? `<span class="crumb current">${escapeHtml(seg)}</span>`
          : `<button class="crumb" data-path="${encodeURIComponent(acc)}">${escapeHtml(seg)}</button>`;
      });
      strip.innerHTML = html;
    }
    qsa('.crumb[data-path]', strip).forEach((btn) => {
      btn.addEventListener('click', () => navigateFolder(decodeURIComponent(btn.dataset.path)));
    });
  }

  function renderGrid() {
    const grid = el('card-grid');

    if (state.searchQuery) {
      const q = state.searchQuery.toLowerCase();
      let matches = state.tree.filter((i) => i.type === 'blob' && baseName(i.path).toLowerCase().includes(q));
      if (state.activeFilter) matches = matches.filter((i) => Viewers.filterGroup(i.path) === state.activeFilter);
      matches.sort((a, b) => a.path.localeCompare(b.path));

      if (!matches.length) {
        showState('no-results');
        el('no-results-desc').textContent = `Nothing named “${state.searchQuery}” turned up${state.activeFilter ? ` in ${state.activeFilter}` : ''}.`;
        return;
      }
      showState('grid');
      grid.innerHTML = matches.map((f) => fileCardHtml(f, true)).join('');
      wireGridCards(grid);
      return;
    }

    const { folders, files } = getChildren(state.currentPath);
    const filteredFiles = state.activeFilter ? files.filter((f) => Viewers.filterGroup(f.path) === state.activeFilter) : files;

    if (!folders.length && !filteredFiles.length) {
      showState('empty');
      return;
    }
    showState('grid');
    grid.innerHTML =
      folders.map((f) => folderCardHtml(f)).join('') +
      filteredFiles.map((f) => fileCardHtml(f, false)).join('');
    wireGridCards(grid);
  }

  function folderCardHtml(item) {
    const count = descendantFileCount(item.path);
    const h = hashInt(item.path);
    const tilt = ((h % 5) - 2) * 0.4;
    const shade = FOLDER_SHADES[h % FOLDER_SHADES.length];
    const pinClass = h % 5 === 0 ? ' has-pin' : '';
    const pin = h % 5 === 0 ? `<span class="push-pin" style="--pin-tone:${Viewers.hashColor(item.path)}"></span>` : '';
    return `<button class="item-card folder-card${pinClass}" style="--tilt:${tilt}deg; --card-tint:${shade}" data-folder="${encodeURIComponent(item.path)}">
      ${pin}
      <span class="folder-icon">🗂️</span>
      <span class="folder-name">${escapeHtml(baseName(item.path))}</span>
      <span class="folder-count">${count} file${count === 1 ? '' : 's'}</span>
    </button>`;
  }

  function fileCardHtml(item, showPath) {
    const ext = Viewers.extOf(item.path) || '—';
    const kind = Viewers.classify(item.path);
    const h = hashInt(item.path);
    const tilt = ((h % 5) - 2) * 0.4;
    const tapeRot = ((hashInt(item.path + 't') % 7) - 3);
    const shade = FILE_SHADES[h % FILE_SHADES.length];
    const pinClass = h % 6 === 0 ? ' has-pin' : (h % 7 === 3 ? ' has-clip' : '');
    const pin = h % 6 === 0 ? `<span class="push-pin" style="--pin-tone:${Viewers.badgeColor(item.path)}"></span>` : '';
    const clip = h % 7 === 3 ? `<span class="paper-clip"></span>` : '';
    const thumb = kind === 'image'
      ? `<div class="file-photo"><img src="${GitHubAPI.rawUrl(item.path)}" alt="" loading="lazy" onerror="this.closest('.file-photo').classList.add('broken')"></div>`
      : '';
    return `<div class="item-card file-card file-card--${kind}${pinClass}" style="--tilt:${tilt}deg; --card-tint:${shade}" data-file="${encodeURIComponent(item.path)}">
      ${pin}${clip}
      <span class="file-tape" style="--tape-color:${Viewers.badgeColor(item.path)}; --tape-rot:${tapeRot}deg"></span>
      ${thumb}
      <div class="file-top">
        <span class="file-ext-badge" style="--badge-color:${Viewers.badgeColor(item.path)}">${escapeHtml(ext)}</span>
        <span class="file-name">${escapeHtml(baseName(item.path))}</span>
      </div>
      ${showPath ? `<span class="file-meta-row" style="margin-top:-2px;">${escapeHtml(parentOf(item.path) || '/')}</span>` : ''}
      <div class="file-meta-row">
        <span>${Viewers.formatBytes(item.size)}</span>
      </div>
      <div class="file-card-actions">
        <button class="btn btn-ghost" data-view-file="${encodeURIComponent(item.path)}">View</button>
        <button class="btn btn-primary" data-download-file="${encodeURIComponent(item.path)}">Download</button>
      </div>
    </div>`;
  }

  function hashInt(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
    return h;
  }

  function wireGridCards(grid) {
    qsa('[data-folder]', grid).forEach((c) => c.addEventListener('click', () => navigateFolder(decodeURIComponent(c.dataset.folder))));
    qsa('[data-view-file]', grid).forEach((b) => b.addEventListener('click', (e) => { e.stopPropagation(); navigateFile(decodeURIComponent(b.dataset.viewFile)); }));
    qsa('[data-download-file]', grid).forEach((b) => b.addEventListener('click', (e) => { e.stopPropagation(); downloadFile(decodeURIComponent(b.dataset.downloadFile)); }));
    // clicking anywhere else on a file card also opens the viewer
    qsa('.file-card', grid).forEach((c) => c.addEventListener('click', () => navigateFile(decodeURIComponent(c.dataset.file))));
  }

  /* ---------------------------------------------------------------- states */

  function showState(name) {
    el('state-loading').hidden = name !== 'loading';
    el('state-error').hidden = name !== 'error';
    el('state-empty').hidden = name !== 'empty';
    el('state-no-results').hidden = name !== 'no-results';
    el('card-grid').hidden = name !== 'grid';
  }
  function renderLoadingState() { showState('loading'); }

  function renderErrorDetails() {
    const err = state.loadError;
    const glyph = el('error-glyph'), title = el('error-title'), desc = el('error-desc');
    if (err && err.name === 'RateLimitError') {
      glyph.textContent = '⏳';
      title.textContent = "GitHub's asking us to slow down";
      desc.textContent = err.resetAt
        ? `The public API rate limit kicked in — it resets around ${err.resetAt.toLocaleTimeString()}.`
        : "The public API rate limit kicked in. It resets on a rolling basis, so try again shortly.";
    } else if (err && err.name === 'NotFoundError') {
      glyph.textContent = '🔍';
      title.textContent = 'Repository not found';
      desc.textContent = 'Double-check the owner, repo name, and branch in js/github-api.js.';
    } else if (err && err.name === 'NetworkError') {
      glyph.textContent = '🔌';
      title.textContent = 'No connection to GitHub';
      desc.textContent = 'Check your internet connection and try again.';
    } else {
      glyph.textContent = '✂️';
      title.textContent = 'Something tore the page';
      desc.textContent = 'The archive couldn\u2019t be reached right now.';
    }
  }

  /* ---------------------------------------------------------------- viewer overlay */

  function openViewer(file) {
    el('viewer-overlay').hidden = false;
    document.body.style.overflow = 'hidden';
    el('viewer-badge').textContent = (Viewers.extOf(file.path) || 'file').toUpperCase();
    el('viewer-filename').textContent = baseName(file.path);
    el('viewer-path').textContent = file.path;
    el('viewer-github-link').href = GitHubAPI.githubBlobUrl(file.path);
    const dl = el('viewer-download-link');
    dl.href = GitHubAPI.rawUrl(file.path);
    dl.onclick = (e) => { e.preventDefault(); downloadFile(file.path); };
    Viewers.render(el('viewer-body'), file);
  }

  function closeViewer() {
    const overlay = el('viewer-overlay');
    if (!overlay.hidden) {
      overlay.hidden = true;
      document.body.style.overflow = '';
      el('viewer-body').innerHTML = '';
    }
  }

  /* ---------------------------------------------------------------- download */

  async function downloadFile(path) {
    const url = GitHubAPI.rawUrl(path);
    const kind = Viewers.classify(path);
    const name = baseName(path);
    if (kind !== 'pdf' && kind !== 'image') {
      // server sends these as application/octet-stream, so a direct link downloads reliably
      window.open(url, '_blank');
      return;
    }
    showToast('Preparing download…');
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    } catch (e) {
      showToast('Download failed — opening it in a new tab instead.');
      window.open(url, '_blank');
    }
  }

  /* ---------------------------------------------------------------- toast */

  let toastTimer = null;
  function showToast(msg) {
    const t = el('toast');
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.hidden = true; }, 3200);
  }

  /* ---------------------------------------------------------------- static UI wiring (search, filters, buttons) */

  function wireStaticUI() {
    el('btn-open-journal').addEventListener('click', () => navigateFolder(''));
    el('btn-home').addEventListener('click', () => goTo('/'));
    el('btn-close-viewer').addEventListener('click', () => navigateFolder(state.currentPath));
    el('viewer-overlay').addEventListener('click', (e) => { if (e.target.id === 'viewer-overlay') navigateFolder(state.currentPath); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !el('viewer-overlay').hidden) navigateFolder(state.currentPath); });
    el('btn-retry').addEventListener('click', retryLoad);

    const searchInput = el('search-input');
    let searchDebounce = null;
    searchInput.addEventListener('input', () => {
      clearTimeout(searchDebounce);
      searchDebounce = setTimeout(() => {
        state.searchQuery = searchInput.value.trim();
        el('search-clear').hidden = !state.searchQuery;
        if (state.tree) { renderBreadcrumb(); renderSubjectHeader(); renderGrid(); }
      }, 150);
    });
    el('search-clear').addEventListener('click', () => {
      searchInput.value = '';
      state.searchQuery = '';
      el('search-clear').hidden = true;
      if (state.tree) { renderBreadcrumb(); renderSubjectHeader(); renderGrid(); }
      searchInput.focus();
    });

    const filterBtn = el('btn-toggle-filters');
    filterBtn.addEventListener('click', () => {
      const bar = el('filter-bar');
      const expanded = filterBtn.getAttribute('aria-expanded') === 'true';
      bar.hidden = expanded;
      filterBtn.setAttribute('aria-expanded', String(!expanded));
    });

    const groups = ['PDF', 'Images', 'Presentations', 'Documents', 'Spreadsheets', 'Code & Notes', 'Other'];
    const chipRow = el('type-filters');
    chipRow.innerHTML = `<button class="chip active" data-group="">All</button>` +
      groups.map((g) => `<button class="chip" data-group="${g}">${g}</button>`).join('');
    qsa('.chip', chipRow).forEach((chip) => {
      chip.addEventListener('click', () => {
        qsa('.chip', chipRow).forEach((c) => c.classList.remove('active'));
        chip.classList.add('active');
        state.activeFilter = chip.dataset.group || null;
        if (state.tree) renderGrid();
      });
    });
  }

  function escapeHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  document.addEventListener('DOMContentLoaded', boot);
})();
