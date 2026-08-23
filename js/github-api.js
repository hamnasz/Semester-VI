/* =========================================================================
   github-api.js
   Every byte of file-tree data in this app comes from the GitHub REST API,
   fetched live in the visitor's browser. Nothing here is a cached or
   hand-written manifest — change this CONFIG and the whole app repoints
   itself at a different repository with zero other edits.
   ========================================================================= */

const CONFIG = {
  owner: 'hamnasz',
  repo: 'Semester-VI',
  branch: 'main',
};

const GitHubAPI = (() => {
  const API_ROOT = 'https://api.github.com';
  const RAW_ROOT = 'https://raw.githubusercontent.com';

  class RateLimitError extends Error {
    constructor(resetAt) {
      super('GitHub API rate limit reached');
      this.name = 'RateLimitError';
      this.resetAt = resetAt;
    }
  }
  class NotFoundError extends Error {
    constructor(msg) { super(msg); this.name = 'NotFoundError'; }
  }

  async function request(url) {
    let res;
    try {
      res = await fetch(url, { headers: { Accept: 'application/vnd.github+json' } });
    } catch (networkErr) {
      const e = new Error('Network request failed');
      e.name = 'NetworkError';
      throw e;
    }

    if (res.status === 403 || res.status === 429) {
      const remaining = res.headers.get('x-ratelimit-remaining');
      if (remaining === '0') {
        const resetHeader = res.headers.get('x-ratelimit-reset');
        const resetAt = resetHeader ? new Date(parseInt(resetHeader, 10) * 1000) : null;
        throw new RateLimitError(resetAt);
      }
    }
    if (res.status === 404) {
      throw new NotFoundError(`${url} — 404`);
    }
    if (!res.ok) {
      const e = new Error(`GitHub API responded ${res.status}`);
      e.name = 'ApiError';
      e.status = res.status;
      throw e;
    }
    return res.json();
  }

  /** Repo metadata: description, star count, last push, size on disk. */
  async function fetchRepoMeta() {
    return request(`${API_ROOT}/repos/${CONFIG.owner}/${CONFIG.repo}`);
  }

  /**
   * The full file tree in one call. GitHub caps the recursive tree
   * endpoint's response — if a repo is large enough to get truncated,
   * we fall back to walking the (non-recursive) contents API per folder.
   */
  async function fetchTree() {
    const data = await request(
      `${API_ROOT}/repos/${CONFIG.owner}/${CONFIG.repo}/git/trees/${CONFIG.branch}?recursive=1`
    );
    if (data.truncated) {
      return fetchTreeByWalking();
    }
    return data.tree
      .filter((n) => n.type === 'blob' || n.type === 'tree')
      .map((n) => ({ path: n.path, type: n.type, size: n.size || 0 }));
  }

  /** Fallback for repos too large for one recursive call. */
  async function fetchTreeByWalking(dir = '') {
    const url = `${API_ROOT}/repos/${CONFIG.owner}/${CONFIG.repo}/contents/${encodeURIComponent(dir).replace(/%2F/g, '/')}?ref=${CONFIG.branch}`;
    const entries = await request(url);
    let results = [];
    for (const entry of entries) {
      if (entry.type === 'dir') {
        results.push({ path: entry.path, type: 'tree', size: 0 });
        const nested = await fetchTreeByWalking(entry.path);
        results = results.concat(nested);
      } else {
        results.push({ path: entry.path, type: 'blob', size: entry.size || 0 });
      }
    }
    return results;
  }

  function encodedPath(path) {
    return path.split('/').map(encodeURIComponent).join('/');
  }

  function rawUrl(path) {
    return `${RAW_ROOT}/${CONFIG.owner}/${CONFIG.repo}/${CONFIG.branch}/${encodedPath(path)}`;
  }

  function githubBlobUrl(path) {
    return `https://github.com/${CONFIG.owner}/${CONFIG.repo}/blob/${CONFIG.branch}/${encodedPath(path)}`;
  }

  return { fetchRepoMeta, fetchTree, rawUrl, githubBlobUrl, RateLimitError, NotFoundError };
})();
